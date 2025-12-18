/**
 * Integration Service
 *
 * Thin glue service for integrating multiple downstream systems.
 * Manages initialization and health checks for all adapters.
 */

import { ForgeAdapter } from '../adapters/forge.adapter.js';
import { ConfigManagerAdapter } from '../adapters/config-manager.adapter.js';
import { ConnectorHubAdapter } from '../adapters/connector-hub.adapter.js';
import { CoPilotAgentAdapter } from '../adapters/copilot-agent.adapter.js';
import { InferenceGatewayAdapter } from '../adapters/inference-gateway.adapter.js';

export class IntegrationService {
  private forge: ForgeAdapter;
  private configManager: ConfigManagerAdapter;
  private connectorHub: ConnectorHubAdapter;
  private copilotAgent: CoPilotAgentAdapter;
  private inferenceGateway: InferenceGatewayAdapter;

  constructor() {
    this.forge = new ForgeAdapter();
    this.configManager = new ConfigManagerAdapter();
    this.connectorHub = new ConnectorHubAdapter();
    this.copilotAgent = new CoPilotAgentAdapter();
    this.inferenceGateway = new InferenceGatewayAdapter();
  }

  getForge() { return this.forge; }
  getConfigManager() { return this.configManager; }
  getConnectorHub() { return this.connectorHub; }
  getCopilotAgent() { return this.copilotAgent; }
  getInferenceGateway() { return this.inferenceGateway; }
}
