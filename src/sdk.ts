/**
 * LLM-Interface-Core SDK
 *
 * Programmatic API for developers to integrate LLM capabilities.
 * This is GLUE LOGIC ONLY - all methods delegate to underlying adapters.
 */

import { ConfigManagerAdapter } from './adapters/config-manager.adapter.js';
import { ConnectorHubAdapter } from './adapters/connector-hub.adapter.js';
import { ForgeAdapter } from './adapters/forge.adapter.js';
import { InferenceGatewayAdapter } from './adapters/inference-gateway.adapter.js';
import { CoPilotAgentAdapter } from './adapters/copilot-agent.adapter.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for InterfaceCore initialization
 */
export interface InterfaceCoreConfig {
  /**
   * Configuration manager settings
   */
  config?: {
    /** Path to configuration file */
    configPath?: string;
    /** Environment prefix for config overrides */
    envPrefix?: string;
    /** Default configuration values */
    defaults?: Record<string, any>;
  };

  /**
   * Provider connection settings
   */
  providers?: {
    /** Auto-connect to providers on initialization */
    autoConnect?: boolean;
    /** Provider-specific configurations */
    providerConfigs?: Record<string, any>;
  };

  /**
   * Forge settings for code generation
   */
  forge?: {
    /** Template directory path */
    templatePath?: string;
    /** Output directory for generated code */
    outputPath?: string;
  };

  /**
   * Assist settings for AI assistance
   */
  assist?: {
    /** Default model to use for assistance */
    model?: string;
    /** System prompt for assistance */
    systemPrompt?: string;
  };

  /**
   * Inference gateway settings
   */
  inference?: {
    /** Default provider */
    defaultProvider?: string;
    /** Default model */
    defaultModel?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
  };
}

/**
 * Request for LLM inference
 */
export interface InferenceRequest {
  /** The prompt or messages to send to the LLM */
  prompt: string | Message[];
  /** Model identifier (provider-specific) */
  model?: string;
  /** Provider to use (if not specified, uses default) */
  provider?: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for sampling (0.0 to 1.0) */
  temperature?: number;
  /** Top-p sampling parameter */
  topP?: number;
  /** Stop sequences */
  stop?: string[];
  /** Whether to stream the response */
  stream?: boolean;
  /** Additional provider-specific parameters */
  params?: Record<string, any>;
}

/**
 * Message in a conversation
 */
export interface Message {
  /** Role of the message sender */
  role: 'system' | 'user' | 'assistant' | 'function';
  /** Content of the message */
  content: string;
  /** Name of the function (for function role) */
  name?: string;
  /** Function call data */
  functionCall?: {
    name: string;
    arguments: string;
  };
}

/**
 * Response from LLM inference
 */
export interface InferenceResponse {
  /** Generated text content */
  content: string;
  /** Model used for generation */
  model: string;
  /** Provider that handled the request */
  provider: string;
  /** Usage statistics */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Finish reason */
  finishReason?: 'stop' | 'length' | 'function_call' | 'content_filter';
  /** Function call (if applicable) */
  functionCall?: {
    name: string;
    arguments: string;
  };
  /** Raw provider response */
  raw?: any;
  /** Response metadata */
  metadata?: Record<string, any>;
}

/**
 * Response from AI assistance
 */
export interface AssistResponse {
  /** Generated assistance response */
  response: string;
  /** Confidence score (0.0 to 1.0) */
  confidence?: number;
  /** Suggested actions */
  suggestions?: string[];
  /** Related context or references */
  context?: Record<string, any>;
}

/**
 * Provider information
 */
export interface Provider {
  /** Provider name */
  name: string;
  /** Provider display name */
  displayName: string;
  /** Provider description */
  description?: string;
  /** Available models */
  models?: string[];
  /** Provider capabilities */
  capabilities?: {
    streaming?: boolean;
    functionCalling?: boolean;
    vision?: boolean;
    embeddings?: boolean;
  };
  /** Connection status */
  status?: 'connected' | 'disconnected' | 'error';
  /** Provider metadata */
  metadata?: Record<string, any>;
}

/**
 * Active provider connection
 */
export interface Connection {
  /** Provider name */
  provider: string;
  /** Connection status */
  status: 'connected' | 'disconnected' | 'error';
  /** Connection timestamp */
  connectedAt?: Date;
  /** Connection configuration */
  config?: Record<string, any> | undefined;
  /** Error information (if status is error) */
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Generated interface from Forge
 */
export interface GeneratedInterface {
  /** Generated code */
  code: string;
  /** Generated type definitions */
  types?: string;
  /** Generated documentation */
  documentation?: string;
  /** File path where code was written (if saved) */
  filePath?: string | undefined;
  /** Template used for generation */
  template: string;
  /** Generation metadata */
  metadata?: Record<string, any> | undefined;
}

// ============================================================================
// ConfigClient Class
// ============================================================================

/**
 * Configuration management client
 * Wraps LLM-Config-Manager for configuration operations
 */
export class ConfigClient {
  private adapter: ConfigManagerAdapter;

  /**
   * @internal
   * @param adapter - The underlying config manager adapter
   */
  constructor(adapter: ConfigManagerAdapter) {
    this.adapter = adapter;
  }

  /**
   * Get a configuration value by key
   * @param key - Configuration key (supports dot notation)
   * @returns Promise resolving to the configuration value
   */
  async get(key: string): Promise<any> {
    // Delegate to config manager adapter
    const result = await this.adapter.getConfig(key);
    return result.value;
  }

  /**
   * Set a configuration value
   * @param key - Configuration key (supports dot notation)
   * @param value - Value to set
   */
  async set(key: string, value: any): Promise<void> {
    // Delegate to config manager adapter
    await this.adapter.setConfig(key, value);
  }

  /**
   * Resolve a template string with configuration values
   * @param template - Template string with placeholders (e.g., "${key.path}")
   * @returns Promise resolving to the resolved string
   */
  async resolve(template: string): Promise<string> {
    // Delegate to config manager adapter
    // For now, this is a simple implementation
    // The actual adapter will handle template resolution
    return template;
  }

  /**
   * Get all configuration values
   * @returns Promise resolving to all configuration
   */
  async getAll(): Promise<Record<string, any>> {
    // Delegate to config manager adapter
    // This will be implemented when the adapter supports it
    return {};
  }

  /**
   * Check if a configuration key exists
   * @param key - Configuration key to check
   * @returns Promise resolving to true if key exists
   */
  async has(key: string): Promise<boolean> {
    // Delegate to config manager adapter
    try {
      const result = await this.adapter.getConfig(key);
      return result.value !== undefined && result.value !== null;
    } catch {
      return false;
    }
  }

  /**
   * Delete a configuration key
   * @param key - Configuration key to delete
   */
  async delete(key: string): Promise<void> {
    // Delegate to config manager adapter
    // This will be implemented when the adapter supports it
    await this.adapter.setConfig(key, null);
  }

  /**
   * Save configuration to disk
   */
  async save(): Promise<void> {
    // Delegate to config manager adapter
    // This will be implemented when the adapter supports it
  }

  /**
   * Reload configuration from disk
   */
  async reload(): Promise<void> {
    // Delegate to config manager adapter
    // This will be implemented when the adapter supports it
  }
}

// ============================================================================
// ProviderClient Class
// ============================================================================

/**
 * Provider management client
 * Wraps LLM-Connector-Hub for provider operations
 */
export class ProviderClient {
  private adapter: ConnectorHubAdapter;

  /**
   * @internal
   * @param adapter - The underlying connector hub adapter
   */
  constructor(adapter: ConnectorHubAdapter) {
    this.adapter = adapter;
  }

  /**
   * List all available providers
   * @returns Promise resolving to array of provider information
   */
  async list(): Promise<Provider[]> {
    // Delegate to connector hub adapter
    const providers = await this.adapter.listProviders();

    // Convert to Provider objects
    return providers.map(p => ({
      name: p.id,
      displayName: p.name,
      models: p.models,
      status: p.status === 'active' ? 'connected' as const : 'disconnected' as const
    }));
  }

  /**
   * Connect to a specific provider
   * @param name - Provider name
   * @param config - Optional provider-specific configuration
   * @returns Promise resolving to connection information
   */
  async connect(name: string, config?: Record<string, any>): Promise<Connection> {
    // Delegate to connector hub adapter
    await this.adapter.connectProvider(name, config || {});

    return {
      provider: name,
      status: 'connected',
      connectedAt: new Date(),
      config
    };
  }

  /**
   * Disconnect from a provider
   * @param name - Provider name
   */
  async disconnect(name: string): Promise<void> {
    // Delegate to connector hub adapter
    // This will be implemented when the adapter supports it
  }

  /**
   * Get information about a specific provider
   * @param name - Provider name
   * @returns Promise resolving to provider information
   */
  async get(name: string): Promise<Provider> {
    // Delegate to connector hub adapter
    const providers = await this.list();
    const provider = providers.find(p => p.name === name);

    if (!provider) {
      throw new Error(`Provider not found: ${name}`);
    }

    return provider;
  }

  /**
   * Check if a provider is connected
   * @param name - Provider name
   * @returns Promise resolving to connection status
   */
  async isConnected(name: string): Promise<boolean> {
    // Delegate to connector hub adapter
    // This will be implemented when the adapter supports it
    return false;
  }

  /**
   * Get connection status for a provider
   * @param name - Provider name
   * @returns Promise resolving to connection information
   */
  async getConnection(name: string): Promise<Connection> {
    // Delegate to connector hub adapter
    return {
      provider: name,
      status: 'disconnected'
    };
  }

  /**
   * List all active connections
   * @returns Promise resolving to array of active connections
   */
  async listConnections(): Promise<Connection[]> {
    // Delegate to connector hub adapter
    // This will be implemented when the adapter supports it
    return [];
  }
}

// ============================================================================
// ForgeClient Class
// ============================================================================

/**
 * Code generation client
 * Wraps LLM-Forge for interface generation
 */
export class ForgeClient {
  private adapter: ForgeAdapter;

  /**
   * @internal
   * @param adapter - The underlying forge adapter
   */
  constructor(adapter: ForgeAdapter) {
    this.adapter = adapter;
  }

  /**
   * Generate code from a template
   * @param template - Template name or template string
   * @param options - Generation options
   * @returns Promise resolving to generated interface
   */
  async generate(template: string, options?: {
    /** Variables to pass to template */
    variables?: Record<string, any>;
    /** Output file path (if saving to disk) */
    outputPath?: string;
    /** Whether to save to disk */
    save?: boolean;
    /** Additional generation options */
    options?: Record<string, any>;
  }): Promise<GeneratedInterface> {
    // Delegate to forge adapter
    const spec: { name: string; type: string; template?: string; parameters?: Record<string, any> } = {
      name: template,
      type: 'interface'
    };
    if (options?.variables) {
      spec.parameters = options.variables;
    }
    const result = await this.adapter.generateInterface(spec);

    return {
      code: result.interface,
      template,
      filePath: options?.save ? options.outputPath : undefined,
      metadata: options?.options
    };
  }

  /**
   * List available templates
   * @returns Promise resolving to array of template names
   */
  async listTemplates(): Promise<string[]> {
    // Delegate to forge adapter
    // This will be implemented when the adapter supports it
    return [];
  }

  /**
   * Get template information
   * @param name - Template name
   * @returns Promise resolving to template metadata
   */
  async getTemplate(name: string): Promise<{
    name: string;
    description?: string;
    variables?: string[];
    metadata?: Record<string, any>;
  }> {
    // Delegate to forge adapter
    // This will be implemented when the adapter supports it
    return { name };
  }

  /**
   * Register a custom template
   * @param name - Template name
   * @param template - Template content
   * @param metadata - Template metadata
   */
  async registerTemplate(
    name: string,
    template: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Delegate to forge adapter
    // This will be implemented when the adapter supports it
  }
}

// ============================================================================
// InterfaceCore Class
// ============================================================================

/**
 * Main entry point for LLM-Interface-Core SDK
 *
 * @example
 * ```typescript
 * // Initialize the SDK
 * const core = new InterfaceCore({
 *   config: {
 *     configPath: './config.json'
 *   }
 * });
 *
 * // Perform inference
 * const response = await core.infer({
 *   prompt: 'Hello, world!',
 *   model: 'gpt-4',
 *   provider: 'openai'
 * });
 *
 * // Manage configuration
 * const config = core.configure();
 * await config.set('api.key', 'your-api-key');
 *
 * // Work with providers
 * const providers = core.providers();
 * const connection = await providers.connect('openai');
 *
 * // Generate code
 * const forge = core.forge();
 * const generated = await forge.generate('rest-api');
 * ```
 */
export class InterfaceCore {
  private config: InterfaceCoreConfig;
  private configAdapter: ConfigManagerAdapter;
  private connectorAdapter: ConnectorHubAdapter;
  private forgeAdapter: ForgeAdapter;
  private inferenceAdapter: InferenceGatewayAdapter;
  private assistAdapter: CoPilotAgentAdapter;

  /**
   * Create a new InterfaceCore instance
   * @param config - Optional configuration
   */
  constructor(config?: InterfaceCoreConfig) {
    this.config = config || {};

    // Initialize adapters
    this.configAdapter = new ConfigManagerAdapter();
    this.connectorAdapter = new ConnectorHubAdapter();
    this.forgeAdapter = new ForgeAdapter();
    this.inferenceAdapter = new InferenceGatewayAdapter();
    this.assistAdapter = new CoPilotAgentAdapter();
  }

  /**
   * Perform LLM inference
   * @param request - Inference request parameters
   * @returns Promise resolving to inference response
   */
  async infer(request: InferenceRequest): Promise<InferenceResponse> {
    // Delegate to inference gateway adapter
    const provider = request.provider || this.config.inference?.defaultProvider || 'default';
    const model = request.model || this.config.inference?.defaultModel || 'default';

    // Normalize prompt to string format for the adapter
    const prompt = typeof request.prompt === 'string'
      ? request.prompt
      : request.prompt.map(m => `${m.role}: ${m.content}`).join('\n');

    // Build request with only defined parameters
    const inferRequest: {
      model: string;
      prompt: string;
      parameters?: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        topK?: number;
        stopSequences?: string[];
        presencePenalty?: number;
        frequencyPenalty?: number;
      };
      options?: {
        stream?: boolean;
        cache?: boolean;
        priority?: 'low' | 'normal' | 'high';
      };
    } = { model, prompt };

    // Only add parameters if they are defined
    const params: typeof inferRequest.parameters = {};
    if (request.temperature !== undefined) params.temperature = request.temperature;
    if (request.maxTokens !== undefined) params.maxTokens = request.maxTokens;
    if (request.topP !== undefined) params.topP = request.topP;
    if (request.stop !== undefined) params.stopSequences = request.stop;
    if (Object.keys(params).length > 0) inferRequest.parameters = params;

    // Only add options if they are defined
    if (request.stream !== undefined) {
      inferRequest.options = { stream: request.stream };
    }

    // Call the underlying inference adapter
    const result = await this.inferenceAdapter.infer(inferRequest);

    return {
      content: result.response,
      model: result.model,
      provider,
      usage: result.usage,
      finishReason: result.metadata.finishReason,
      metadata: {
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        stream: request.stream,
        latency: result.metadata.latency,
        cached: result.metadata.cached
      }
    };
  }

  /**
   * Get configuration client
   * @returns ConfigClient instance for managing configuration
   */
  configure(): ConfigClient {
    return new ConfigClient(this.configAdapter);
  }

  /**
   * Get provider client
   * @returns ProviderClient instance for managing providers
   */
  providers(): ProviderClient {
    return new ProviderClient(this.connectorAdapter);
  }

  /**
   * Request AI assistance
   * @param query - Question or request for assistance
   * @param options - Optional parameters for assistance
   * @returns Promise resolving to assistance response
   */
  async assist(query: string, options?: {
    /** Context to provide for assistance */
    context?: Record<string, any>;
    /** Model to use for assistance */
    model?: string;
    /** Additional options */
    options?: Record<string, any>;
  }): Promise<AssistResponse> {
    // Delegate to copilot agent adapter
    const result = await this.assistAdapter.assist({
      query,
      context: options?.context as any,
      options: options?.options as any
    });

    return {
      response: result.response,
      confidence: result.confidence,
      suggestions: result.suggestions.map(s => s.description),
      context: result.metadata
    };
  }

  /**
   * Get forge client
   * @returns ForgeClient instance for code generation
   */
  forge(): ForgeClient {
    return new ForgeClient(this.forgeAdapter);
  }

  /**
   * Get current configuration
   * @returns Current configuration object
   */
  getConfig(): Readonly<InterfaceCoreConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Update configuration
   * @param config - Configuration updates to apply
   */
  updateConfig(config: Partial<InterfaceCoreConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Initialize the SDK (lazy initialization of adapters)
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // This method allows for async initialization if needed
    // Currently a no-op but can be extended for actual adapter loading
    await Promise.all([
      // Initialize adapters as needed
    ]);
  }

  /**
   * Cleanup and disconnect all resources
   */
  async dispose(): Promise<void> {
    // Cleanup all adapters and connections
    // This will be implemented when the adapters support it
  }
}

// ============================================================================
// Exports
// ============================================================================

// Export main class as default
export default InterfaceCore;

// Re-export types and classes
export * from './types/index.js';
export * from './adapters/index.js';
