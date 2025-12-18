/**
 * Configuration Request Handler
 *
 * Handles configuration requests and routes them to LLM-Config-Manager.
 * This is GLUE LOGIC ONLY - no implementation of config logic here.
 */

import { ConfigManagerAdapter } from '../adapters/config-manager.adapter.js';

export class ConfigHandler {
  private adapter: ConfigManagerAdapter;

  constructor(adapter?: ConfigManagerAdapter) {
    this.adapter = adapter ?? new ConfigManagerAdapter();
  }

  async get(key: string): Promise<any> {
    const result = await this.adapter.getConfig(key);
    return result.value;
  }

  async set(key: string, value: any): Promise<void> {
    await this.adapter.setConfig(key, value);
  }
}
