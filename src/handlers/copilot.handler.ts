/**
 * CoPilot Request Handler
 *
 * Handles copilot requests and routes them to LLM-CoPilot-Agent.
 * This is GLUE LOGIC ONLY - no implementation of assistance logic here.
 */

import { CoPilotAgentAdapter } from '../adapters/copilot-agent.adapter.js';

export class CoPilotHandler {
  private adapter: CoPilotAgentAdapter;

  constructor(adapter?: CoPilotAgentAdapter) {
    this.adapter = adapter ?? new CoPilotAgentAdapter();
  }

  async handle(query: string): Promise<string> {
    const result = await this.adapter.assist({ query });
    return result.response;
  }
}
