import type { IncomingMessage, RequestListener, ServerResponse } from 'node:http';
import type { InterfaceCore } from './sdk.js';

export const MAX_REQUEST_BODY_BYTES = 64 * 1024;

type CoreLike = Pick<InterfaceCore, 'infer' | 'assist' | 'broadcastEvent'>;
type Logger = Pick<Console, 'info' | 'error'>;

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}

function isJsonRequest(req: IncomingMessage): boolean {
  const contentType = req.headers['content-type'];
  return typeof contentType === 'string' && /^application\/json(?:\s*;|$)/i.test(contentType);
}

function readBody(req: IncomingMessage): Promise<string> {
  const contentLength = Number(req.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
    req.resume();
    return Promise.reject(new HttpError(413, 'Request body too large'));
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;

    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BODY_BYTES) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) {
        reject(new HttpError(413, 'Request body too large'));
        return;
      }
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('aborted', () => reject(new HttpError(400, 'Request body was interrupted')));
    req.on('error', () => reject(new HttpError(400, 'Unable to read request body')));
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function parseJsonObject(req: IncomingMessage): Promise<Record<string, unknown>> {
  if (!isJsonRequest(req)) {
    throw new HttpError(415, 'Content-Type must be application/json');
  }
  const body = await readBody(req);
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    throw new HttpError(400, 'Invalid JSON request body');
  }
  if (!isObject(value)) {
    throw new HttpError(400, 'JSON request body must be an object');
  }
  return value;
}

function validIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && !/[\u0000-\u001f\u007f]/.test(value);
}

function validateInterfaceEvent(event: Record<string, unknown>): void {
  for (const field of ['source', 'event_type', 'execution_id'] as const) {
    if (!validIdentifier(event[field])) {
      throw new HttpError(400, `${field} must be a non-empty string of at most 128 characters`);
    }
  }
  if (event['timestamp'] !== undefined &&
      (typeof event['timestamp'] !== 'string' || Number.isNaN(Date.parse(event['timestamp'])))) {
    throw new HttpError(400, 'timestamp must be a valid date-time string');
  }
  if (event['payload'] !== undefined && !isObject(event['payload'])) {
    throw new HttpError(400, 'payload must be an object');
  }
}

async function withClientErrors(
  req: IncomingMessage,
  res: ServerResponse,
  operation: (body: Record<string, unknown>) => Promise<void>,
): Promise<void> {
  try {
    const body = await parseJsonObject(req);
    await operation(body);
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, { error: error.message });
      return;
    }
    throw error;
  }
}

export function createHttpHandler(core: CoreLike, logger: Logger = console): RequestListener {
  return (req, res) => {
    void (async () => {
      const path = new URL(req.url ?? '/', 'http://localhost').pathname;
      const method = req.method ?? 'GET';

      if (path === '/health' && method === 'GET') {
        sendJson(res, 200, {
          status: 'healthy',
          service: 'interface-core',
          version: process.env['npm_package_version'] || 'unknown',
        });
        return;
      }

      if (path === '/infer' && method === 'POST') {
        await withClientErrors(req, res, async (body) => {
          if (typeof body['prompt'] !== 'string' || body['prompt'].length === 0) {
            throw new HttpError(400, 'prompt must be a non-empty string');
          }
          try {
            const response = await core.infer(body as unknown as Parameters<CoreLike['infer']>[0]);
            sendJson(res, 200, response);
          } catch {
            logger.error('Inference request failed');
            sendJson(res, 502, { error: 'Upstream service request failed' });
          }
        });
        return;
      }

      if (path === '/assist' && method === 'POST') {
        await withClientErrors(req, res, async (body) => {
          const { query, ...options } = body;
          if (typeof query !== 'string' || query.length === 0 || query.length > 16_384) {
            throw new HttpError(400, 'query must be a non-empty string of at most 16384 characters');
          }
          try {
            const response = await core.assist(query, options as Parameters<CoreLike['assist']>[1]);
            sendJson(res, 200, response);
          } catch {
            logger.error('Assist request failed');
            sendJson(res, 502, { error: 'Upstream service request failed' });
          }
        });
        return;
      }

      if (path === '/v1/events' && method === 'POST') {
        await withClientErrors(req, res, async (event) => {
          core.broadcastEvent(event);
          sendJson(res, 202, { accepted: true });
        });
        return;
      }

      if (path === '/v1/interface/event' && method === 'POST') {
        await withClientErrors(req, res, async (event) => {
          validateInterfaceEvent(event);
          const executionId = event['execution_id'] as string;
          logger.info('[interface-event] accepted');
          sendJson(res, 202, { status: 'accepted', execution_id: executionId });
        });
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    })().catch(() => {
      logger.error('Unhandled request failure');
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'Internal server error' });
      } else {
        res.end();
      }
    });
  };
}
