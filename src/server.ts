/**
 * LLM-Interface-Core HTTP Server
 *
 * Minimal HTTP server for Cloud Run deployment.
 * Exposes health check and SDK endpoints.
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { InterfaceCore } from './sdk.js';

const PORT = parseInt(process.env['PORT'] || '8080', 10);

const core = new InterfaceCore();

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url || '/';
  const method = req.method || 'GET';

  // Health check
  if (url === '/' || url === '/health') {
    sendJson(res, 200, { status: 'healthy', service: 'interface-core' });
    return;
  }

  // Inference endpoint
  if (url === '/infer' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const request = JSON.parse(body);
      const response = await core.infer(request);
      sendJson(res, 200, response);
    } catch (err) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : 'Unknown error' });
    }
    return;
  }

  // Assist endpoint
  if (url === '/assist' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const { query, ...options } = JSON.parse(body);
      const response = await core.assist(query, options);
      sendJson(res, 200, response);
    } catch (err) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : 'Unknown error' });
    }
    return;
  }

  // Not found
  sendJson(res, 404, { error: 'Not found' });
}

const server = createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('Request error:', err);
    sendJson(res, 500, { error: 'Internal server error' });
  });
});

server.listen(PORT, () => {
  console.log(`interface-core listening on port ${PORT}`);
});
