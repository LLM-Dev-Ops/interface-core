/**
 * Inference Request Handler
 *
 * Handles inference requests and routes them to LLM-Inference-Gateway.
 * This is GLUE LOGIC ONLY - no implementation of inference logic here.
 */

import { InferenceGatewayAdapter } from '../adapters/inference-gateway.adapter.js';

export class InferenceHandler {
  private adapter: InferenceGatewayAdapter;

  constructor(adapter?: InferenceGatewayAdapter) {
    this.adapter = adapter ?? new InferenceGatewayAdapter();
  }

  async handle(prompt: string): Promise<string> {
    const result = await this.adapter.infer({ model: 'default', prompt });
    return result.response;
  }
}
