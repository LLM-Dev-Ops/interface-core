/**
 * LLM-Interface-Core HTTP Server
 *
 * Minimal HTTP server for Cloud Run deployment.
 * Exposes health check and SDK endpoints.
 * Instrumented with execution spans for agentics-execution-engine.
 */

import { createServer } from 'node:http';
import { InterfaceCore } from './sdk.js';
import { createHttpHandler } from './http.js';

const PORT = parseInt(process.env['PORT'] || '8080', 10);

const core = new InterfaceCore();
const server = createServer(createHttpHandler(core));

server.listen(PORT, () => {
  console.log(`interface-core listening on port ${PORT}`);
});
