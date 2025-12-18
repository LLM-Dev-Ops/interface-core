/**
 * Provider Handler - Routes provider requests to LLM-Connector-Hub
 *
 * This is GLUE LOGIC ONLY - no provider management implementation here.
 * All actual provider logic lives in LLM-Connector-Hub.
 */

import { ConnectorHubAdapter } from '../adapters/connector-hub.adapter.js';

export class ProviderHandler {
  private adapter: ConnectorHubAdapter;

  constructor(adapter?: ConnectorHubAdapter) {
    this.adapter = adapter ?? new ConnectorHubAdapter();
  }

  async listProviders(): Promise<string[]> {
    const providers = await this.adapter.listProviders();
    return providers.map(p => p.name);
  }

  async connect(name: string): Promise<void> {
    await this.adapter.connectProvider(name, {});
  }
}
