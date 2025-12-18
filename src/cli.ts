#!/usr/bin/env node

/**
 * LLM-Interface-Core - CLI Entry Point
 *
 * A thin wrapper that routes commands to downstream Layer-2 systems:
 * - LLM-Inference-Gateway: For inference requests
 * - LLM-Config-Manager: For configuration management
 * - LLM-Connector-Hub: For provider management
 * - LLM-CoPilot-Agent: For assistant functionality
 * - LLM-Forge: For code generation
 *
 * This CLI implements ONLY routing logic - no business logic is implemented here.
 */

import {
  InferenceGatewayAdapter,
  ConfigManagerAdapter,
  ConnectorHubAdapter,
  CoPilotAgentAdapter,
  ForgeAdapter,
} from './adapters/index.js';

/**
 * CLI Command Router
 * Routes commands to appropriate downstream systems
 */
class LLMCoreCLI {
  private inferenceGateway: InferenceGatewayAdapter;
  private configManager: ConfigManagerAdapter;
  private connectorHub: ConnectorHubAdapter;
  private copilotAgent: CoPilotAgentAdapter;
  private forge: ForgeAdapter;

  constructor() {
    // Initialize adapters (mock stubs for now)
    this.inferenceGateway = new InferenceGatewayAdapter();
    this.configManager = new ConfigManagerAdapter();
    this.connectorHub = new ConnectorHubAdapter();
    this.copilotAgent = new CoPilotAgentAdapter();
    this.forge = new ForgeAdapter();
  }

  /**
   * Parse and execute CLI commands
   */
  async execute(args: string[]): Promise<void> {
    const command = args[0];
    const subcommand = args[1];
    const params = args.slice(2);

    try {
      switch (command) {
        case 'infer':
          // For infer, the prompt starts at args[1] (subcommand position)
          await this.handleInfer(args.slice(1));
          break;

        case 'config':
          await this.handleConfig(subcommand, params);
          break;

        case 'provider':
          await this.handleProvider(subcommand, params);
          break;

        case 'assist':
          // For assist, the query starts at args[1] (subcommand position)
          await this.handleAssist(args.slice(1));
          break;

        case 'generate':
          // For generate, the template is at args[1] (subcommand position)
          await this.handleGenerate(args.slice(1));
          break;

        case 'help':
        case '--help':
        case '-h':
        case undefined:
          this.showHelp();
          break;

        default:
          console.error(`Unknown command: ${command}`);
          console.error('Run "llm-core help" for usage information.');
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  /**
   * Handle inference requests
   * Routes to LLM-Inference-Gateway
   */
  private async handleInfer(params: string[]): Promise<void> {
    if (params.length === 0) {
      console.error('Error: Prompt is required');
      console.error('Usage: llm-core infer <prompt>');
      process.exit(1);
    }

    const prompt = params.join(' ');
    console.log('Routing inference request to LLM-Inference-Gateway...');

    const result = await this.inferenceGateway.infer({
      model: 'default',
      prompt: prompt
    });
    console.log('\nResponse:');
    console.log(result.response);
  }

  /**
   * Handle configuration commands
   * Routes to LLM-Config-Manager
   */
  private async handleConfig(subcommand: string | undefined, params: string[]): Promise<void> {
    switch (subcommand) {
      case 'get': {
        const key = params[0];
        if (!key) {
          console.error('Error: Key is required');
          console.error('Usage: llm-core config get <key>');
          process.exit(1);
        }
        console.log('Routing config get request to LLM-Config-Manager...');
        const result = await this.configManager.getConfig(key);
        console.log(`${key} = ${result.value}`);
        break;
      }

      case 'set': {
        const setKey = params[0];
        const setValue = params.slice(1).join(' ');
        if (!setKey || !setValue) {
          console.error('Error: Key and value are required');
          console.error('Usage: llm-core config set <key> <value>');
          process.exit(1);
        }
        console.log('Routing config set request to LLM-Config-Manager...');
        await this.configManager.setConfig(setKey, setValue);
        console.log(`Configuration updated: ${setKey} = ${setValue}`);
        break;
      }

      default:
        console.error(`Unknown config subcommand: ${subcommand}`);
        console.error('Available subcommands: get, set');
        process.exit(1);
    }
  }

  /**
   * Handle provider commands
   * Routes to LLM-Connector-Hub
   */
  private async handleProvider(subcommand: string | undefined, params: string[]): Promise<void> {
    switch (subcommand) {
      case 'list':
        console.log('Routing provider list request to LLM-Connector-Hub...');
        const providers = await this.connectorHub.listProviders();
        console.log('\nAvailable Providers:');
        providers.forEach((provider, index) => {
          console.log(`  ${index + 1}. ${provider.name} (${provider.status})`);
        });
        break;

      case 'connect': {
        const providerName = params[0];
        if (!providerName) {
          console.error('Error: Provider name is required');
          console.error('Usage: llm-core provider connect <name>');
          process.exit(1);
        }
        console.log('Routing provider connect request to LLM-Connector-Hub...');
        await this.connectorHub.connectProvider(providerName, {});
        console.log(`Successfully connected to provider: ${providerName}`);
        break;
      }

      default:
        console.error(`Unknown provider subcommand: ${subcommand}`);
        console.error('Available subcommands: list, connect');
        process.exit(1);
    }
  }

  /**
   * Handle assist requests
   * Routes to LLM-CoPilot-Agent
   */
  private async handleAssist(params: string[]): Promise<void> {
    if (params.length === 0) {
      console.error('Error: Query is required');
      console.error('Usage: llm-core assist <query>');
      process.exit(1);
    }

    const query = params.join(' ');
    console.log('Routing assist request to LLM-CoPilot-Agent...');

    const result = await this.copilotAgent.assist({ query });
    console.log('\nAssistant Response:');
    console.log(result.response);
  }

  /**
   * Handle code generation requests
   * Routes to LLM-Forge
   */
  private async handleGenerate(params: string[]): Promise<void> {
    const template = params[0];
    if (!template) {
      console.error('Error: Template is required');
      console.error('Usage: llm-core generate <template>');
      process.exit(1);
    }

    console.log('Routing generate request to LLM-Forge...');

    const result = await this.forge.generateInterface({ name: template, type: 'interface' });
    console.log('\nGenerated Code:');
    console.log(result.interface);
  }

  /**
   * Display help information
   */
  private showHelp(): void {
    console.log(`
LLM-Interface-Core CLI

A unified command-line interface for LLM operations.

USAGE:
  llm-core <command> [options]

COMMANDS:
  infer <prompt>              Send an inference request to LLM-Inference-Gateway
                              Example: llm-core infer "Explain quantum computing"

  config get <key>            Get a configuration value from LLM-Config-Manager
                              Example: llm-core config get model.temperature

  config set <key> <value>    Set a configuration value in LLM-Config-Manager
                              Example: llm-core config set model.temperature 0.7

  provider list               List available providers from LLM-Connector-Hub
                              Example: llm-core provider list

  provider connect <name>     Connect to a specific provider via LLM-Connector-Hub
                              Example: llm-core provider connect openai

  assist <query>              Get assistance from LLM-CoPilot-Agent
                              Example: llm-core assist "How do I optimize this code?"

  generate <template>         Generate code using LLM-Forge templates
                              Example: llm-core generate api-endpoint

  help                        Show this help message

OPTIONS:
  -h, --help                  Show help information

EXAMPLES:
  # Run an inference
  llm-core infer "What is the capital of France?"

  # Configure the system
  llm-core config set api.key "your-api-key"
  llm-core config get api.key

  # Manage providers
  llm-core provider list
  llm-core provider connect anthropic

  # Get coding assistance
  llm-core assist "Debug my authentication logic"

  # Generate code from templates
  llm-core generate rest-api

For more information, visit: https://github.com/your-org/llm-interface-core
`);
  }
}

/**
 * Main entry point
 */
export async function main() {
  const args = process.argv.slice(2);
  const cli = new LLMCoreCLI();
  await cli.execute(args);
}

// Run CLI if executed directly (ESM compatible)
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { LLMCoreCLI };
