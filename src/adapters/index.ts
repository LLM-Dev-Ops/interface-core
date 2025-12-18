/**
 * Adapters Index
 *
 * Exports all adapters to downstream Layer-2 systems.
 * These adapters provide thin glue logic for connecting to:
 * - LLM-Forge: SDK and interface generation
 * - LLM-Config-Manager: Configuration and secrets
 * - LLM-Connector-Hub: Provider access
 * - LLM-CoPilot-Agent: Developer assistance
 * - LLM-Inference-Gateway: Model serving
 */

export { ForgeAdapter } from './forge.adapter.js';
export { ConfigManagerAdapter } from './config-manager.adapter.js';
export { ConnectorHubAdapter } from './connector-hub.adapter.js';
export { CoPilotAgentAdapter } from './copilot-agent.adapter.js';
export { InferenceGatewayAdapter } from './inference-gateway.adapter.js';
