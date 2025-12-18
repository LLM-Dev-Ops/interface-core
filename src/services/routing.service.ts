/**
 * Routing Service
 *
 * Thin glue service for routing requests to appropriate adapters.
 * This is GLUE LOGIC ONLY - all actual routing logic lives in downstream systems.
 */

import { InferenceHandler } from '../handlers/inference.handler.js';
import { ConfigHandler } from '../handlers/config.handler.js';
import { CoPilotHandler } from '../handlers/copilot.handler.js';
import { ProviderHandler } from '../handlers/provider.handler.js';

export type RequestType = 'inference' | 'config' | 'copilot' | 'provider';

export class RoutingService {
  private inferenceHandler: InferenceHandler;
  private configHandler: ConfigHandler;
  private copilotHandler: CoPilotHandler;
  private providerHandler: ProviderHandler;

  constructor() {
    this.inferenceHandler = new InferenceHandler();
    this.configHandler = new ConfigHandler();
    this.copilotHandler = new CoPilotHandler();
    this.providerHandler = new ProviderHandler();
  }

  getHandler(type: RequestType) {
    switch (type) {
      case 'inference': return this.inferenceHandler;
      case 'config': return this.configHandler;
      case 'copilot': return this.copilotHandler;
      case 'provider': return this.providerHandler;
    }
  }
}
