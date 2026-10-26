import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import { createHttpHandler, MAX_REQUEST_BODY_BYTES } from '../dist/http.js';

const errors = [];
const events = [];
const core = {
  async infer(request) {
    if (request.fail) {
      const error = new Error('secret downstream detail');
      error._execution = { internal: true };
      throw error;
    }
    return { ok: true, request };
  },
  async assist(query, options) {
    if (query === 'fail') throw new Error('secret assist detail');
    return { query, options };
  },
  broadcastEvent(event) {
    events.push(event);
  },
};
const logger = { info() {}, error(message) { errors.push(message); } };
const server = createServer(createHttpHandler(core, logger));
let baseUrl;

before(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  return { response, body: await response.json() };
}

test('GET /health is healthy and sends defensive headers', async () => {
  const { response, body } = await request('/health');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(body.status, 'healthy');
});

test('health only accepts GET', async () => {
  const { response } = await request('/health', { method: 'POST' });
  assert.equal(response.status, 404);
});

test('POST JSON endpoints require application/json', async () => {
  const { response, body } = await request('/infer', { method: 'POST', body: '{}' });
  assert.equal(response.status, 415);
  assert.equal(body.error, 'Content-Type must be application/json');
});

test('malformed JSON returns a stable 400 response', async () => {
  const { response, body } = await request('/infer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{broken',
  });
  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: 'Invalid JSON request body' });
});

test('request bodies over 64 KiB are rejected', async () => {
  const body = JSON.stringify({ payload: 'x'.repeat(MAX_REQUEST_BODY_BYTES) });
  const result = await request('/infer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  assert.equal(result.response.status, 413);
  assert.deepEqual(result.body, { error: 'Request body too large' });
});

test('valid inference retains successful behavior', async () => {
  const { response, body } = await request('/infer', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ prompt: 'hello' }),
  });
  assert.equal(response.status, 200);
  assert.equal(body.request.prompt, 'hello');
});

test('downstream inference failures do not leak details or execution graphs', async () => {
  const { response, body } = await request('/infer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: 'hello', fail: true }),
  });
  assert.equal(response.status, 502);
  assert.deepEqual(body, { error: 'Upstream service request failed' });
  assert.equal(JSON.stringify(body).includes('secret'), false);
  assert.equal('_execution' in body, false);
});

test('assist validates query before dispatch', async () => {
  const { response } = await request('/assist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '' }),
  });
  assert.equal(response.status, 400);
});

test('event fan-out remains non-blocking', async () => {
  const { response, body } = await request('/v1/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kind: 'updated' }),
  });
  assert.equal(response.status, 202);
  assert.deepEqual(body, { accepted: true });
  assert.equal(events.at(-1).kind, 'updated');
});

test('interface events validate identifiers without logging their values', async () => {
  const invalid = await request('/v1/interface/event', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source: 'ok', event_type: 'bad\nvalue', execution_id: 'id' }),
  });
  assert.equal(invalid.response.status, 400);
  const valid = await request('/v1/interface/event', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source: 'svc', event_type: 'updated', execution_id: 'id-1', payload: {} }),
  });
  assert.equal(valid.response.status, 202);
  assert.equal(valid.body.execution_id, 'id-1');
});
