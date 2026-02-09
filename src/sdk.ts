/**
 * LLM-Interface-Core SDK
 *
 * Programmatic API for developers to integrate LLM capabilities.
 * This is GLUE LOGIC ONLY - all methods delegate to underlying adapters.
 *
 * Instrumented with hierarchical execution spans for agentics-execution-engine.
 * Every call produces: Core → Repo → Agent span hierarchy.
 */

import { ConfigManagerAdapter } from './adapters/config-manager.adapter.js';
import { ConnectorHubAdapter } from './adapters/connector-hub.adapter.js';
import { ForgeAdapter } from './adapters/forge.adapter.js';
import { InferenceGatewayAdapter } from './adapters/inference-gateway.adapter.js';
import { CoPilotAgentAdapter } from './adapters/copilot-agent.adapter.js';
import type { ExecutionAwareAdapter } from './types/adapter.interface.js';
import type { CoreExecutionResult } from './execution/types.js';
import {
  generateExecutionId,
  createCoreSpan,
  createRepoSpan,
  finalizeSpan,
  buildExecutionContext,
} from './execution/span-manager.js';
import { buildExecutionResult } from './execution/validator.js';

// ============================================================================
// Constants
// ============================================================================

const CORE_NAME = 'interface-core';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for InterfaceCore initialization
 */
export interface InterfaceCoreConfig {
  config?: {
    configPath?: string;
    envPrefix?: string;
    defaults?: Record<string, any>;
  };
  providers?: {
    autoConnect?: boolean;
    providerConfigs?: Record<string, any>;
  };
  forge?: {
    templatePath?: string;
    outputPath?: string;
  };
  assist?: {
    model?: string;
    systemPrompt?: string;
  };
  inference?: {
    defaultProvider?: string;
    defaultModel?: string;
    timeout?: number;
  };
}

export interface InferenceRequest {
  prompt: string | Message[];
  model?: string;
  provider?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stop?: string[];
  stream?: boolean;
  params?: Record<string, any>;
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface InferenceResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'function_call' | 'content_filter';
  functionCall?: {
    name: string;
    arguments: string;
  };
  raw?: any;
  metadata?: Record<string, any>;
  _execution?: CoreExecutionResult;
}

export interface AssistResponse {
  response: string;
  confidence?: number;
  suggestions?: string[];
  context?: Record<string, any>;
  _execution?: CoreExecutionResult;
}

export interface Provider {
  name: string;
  displayName: string;
  description?: string;
  models?: string[];
  capabilities?: {
    streaming?: boolean;
    functionCalling?: boolean;
    vision?: boolean;
    embeddings?: boolean;
  };
  status?: 'connected' | 'disconnected' | 'error';
  metadata?: Record<string, any>;
}

export interface Connection {
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  connectedAt?: Date;
  config?: Record<string, any> | undefined;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface GeneratedInterface {
  code: string;
  types?: string;
  documentation?: string;
  filePath?: string | undefined;
  template: string;
  metadata?: Record<string, any> | undefined;
}

// ============================================================================
// ConfigClient Class
// ============================================================================

export class ConfigClient {
  private adapter: ConfigManagerAdapter;

  constructor(adapter: ConfigManagerAdapter) {
    this.adapter = adapter;
  }

  async get(key: string): Promise<any> {
    const result = await this.adapter.getConfig(key);
    return result.value;
  }

  async set(key: string, value: any): Promise<void> {
    await this.adapter.setConfig(key, value);
  }

  async resolve(template: string): Promise<string> {
    return template;
  }

  async getAll(): Promise<Record<string, any>> {
    return {};
  }

  async has(key: string): Promise<boolean> {
    try {
      const result = await this.adapter.getConfig(key);
      return result.value !== undefined && result.value !== null;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    await this.adapter.setConfig(key, null);
  }

  async save(): Promise<void> {}
  async reload(): Promise<void> {}
}

// ============================================================================
// ProviderClient Class
// ============================================================================

export class ProviderClient {
  private adapter: ConnectorHubAdapter;

  constructor(adapter: ConnectorHubAdapter) {
    this.adapter = adapter;
  }

  async list(): Promise<Provider[]> {
    const providers = await this.adapter.listProviders();
    return providers.map(p => ({
      name: p.id,
      displayName: p.name,
      models: p.models,
      status: p.status === 'active' ? 'connected' as const : 'disconnected' as const
    }));
  }

  async connect(name: string, config?: Record<string, any>): Promise<Connection> {
    await this.adapter.connectProvider(name, config || {});
    return {
      provider: name,
      status: 'connected',
      connectedAt: new Date(),
      config
    };
  }

  async disconnect(name: string): Promise<void> {}

  async get(name: string): Promise<Provider> {
    const providers = await this.list();
    const provider = providers.find(p => p.name === name);
    if (!provider) {
      throw new Error(`Provider not found: ${name}`);
    }
    return provider;
  }

  async isConnected(name: string): Promise<boolean> {
    return false;
  }

  async getConnection(name: string): Promise<Connection> {
    return { provider: name, status: 'disconnected' };
  }

  async listConnections(): Promise<Connection[]> {
    return [];
  }
}

// ============================================================================
// ForgeClient Class
// ============================================================================

export class ForgeClient {
  private adapter: ForgeAdapter;

  constructor(adapter: ForgeAdapter) {
    this.adapter = adapter;
  }

  async generate(template: string, options?: {
    variables?: Record<string, any>;
    outputPath?: string;
    save?: boolean;
    options?: Record<string, any>;
  }): Promise<GeneratedInterface> {
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

  async listTemplates(): Promise<string[]> {
    return [];
  }

  async getTemplate(name: string): Promise<{
    name: string;
    description?: string;
    variables?: string[];
    metadata?: Record<string, any>;
  }> {
    return { name };
  }

  async registerTemplate(
    name: string,
    template: string,
    metadata?: Record<string, any>
  ): Promise<void> {}
}

// ============================================================================
// InterfaceCore Class
// ============================================================================

export class InterfaceCore {
  private config: InterfaceCoreConfig;
  private configAdapter: ConfigManagerAdapter;
  private connectorAdapter: ConnectorHubAdapter;
  private forgeAdapter: ForgeAdapter;
  private inferenceAdapter: InferenceGatewayAdapter;
  private assistAdapter: CoPilotAgentAdapter;

  constructor(config?: InterfaceCoreConfig) {
    this.config = config || {};
    this.configAdapter = new ConfigManagerAdapter();
    this.connectorAdapter = new ConnectorHubAdapter();
    this.forgeAdapter = new ForgeAdapter();
    this.inferenceAdapter = new InferenceGatewayAdapter();
    this.assistAdapter = new CoPilotAgentAdapter();
  }

  /**
   * Execute an operation with full Core → Repo → Agent span hierarchy.
   * This is the central instrumentation point for the agentics execution engine.
   */
  private async executeWithSpans<T>(
    operation: string,
    repoName: string,
    adapter: ExecutionAwareAdapter,
    fn: () => Promise<T>,
    parentSpanId?: string | null,
  ): Promise<{ result: T; execution: CoreExecutionResult }> {
    const executionId = generateExecutionId();
    const coreSpan = createCoreSpan(CORE_NAME, parentSpanId ?? null);
    const repoSpan = createRepoSpan(repoName, coreSpan.span_id);

    // Set execution context on adapter so it parents its agent spans correctly
    adapter.setExecutionContext(
      buildExecutionContext(executionId, coreSpan.span_id, repoSpan.span_id),
    );

    try {
      const result = await fn();

      // Collect agent spans from adapter and attach as children of repo span
      const agentSpans = adapter.getLastExecutionSpans();
      repoSpan.children.push(...agentSpans);

      // Finalize spans
      finalizeSpan(repoSpan, 'success');
      coreSpan.children.push(repoSpan);
      finalizeSpan(coreSpan, 'success');

      const execution = buildExecutionResult(coreSpan, CORE_NAME, executionId);
      return { result, execution };
    } catch (err) {
      // Still collect any agent spans produced before failure
      const agentSpans = adapter.getLastExecutionSpans();
      repoSpan.children.push(...agentSpans);

      finalizeSpan(repoSpan, 'failed');
      coreSpan.children.push(repoSpan);
      finalizeSpan(coreSpan, 'failed');

      const execution = buildExecutionResult(coreSpan, CORE_NAME, executionId);

      // Re-throw but attach execution graph to the error
      const error = err instanceof Error ? err : new Error(String(err));
      (error as any)._execution = execution;
      throw error;
    }
  }

  async infer(request: InferenceRequest): Promise<InferenceResponse> {
    const { result, execution } = await this.executeWithSpans(
      'infer',
      'LLM-Inference-Gateway',
      this.inferenceAdapter,
      async () => {
        const provider = request.provider || this.config.inference?.defaultProvider || 'default';
        const model = request.model || this.config.inference?.defaultModel || 'default';

        const prompt = typeof request.prompt === 'string'
          ? request.prompt
          : request.prompt.map(m => `${m.role}: ${m.content}`).join('\n');

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

        const params: typeof inferRequest.parameters = {};
        if (request.temperature !== undefined) params.temperature = request.temperature;
        if (request.maxTokens !== undefined) params.maxTokens = request.maxTokens;
        if (request.topP !== undefined) params.topP = request.topP;
        if (request.stop !== undefined) params.stopSequences = request.stop;
        if (Object.keys(params).length > 0) inferRequest.parameters = params;

        if (request.stream !== undefined) {
          inferRequest.options = { stream: request.stream };
        }

        const adapterResult = await this.inferenceAdapter.infer(inferRequest);

        return {
          content: adapterResult.response,
          model: adapterResult.model,
          provider,
          usage: adapterResult.usage,
          finishReason: adapterResult.metadata.finishReason,
          metadata: {
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            stream: request.stream,
            latency: adapterResult.metadata.latency,
            cached: adapterResult.metadata.cached
          }
        } as InferenceResponse;
      },
    );

    result._execution = execution;
    return result;
  }

  configure(): ConfigClient {
    return new ConfigClient(this.configAdapter);
  }

  providers(): ProviderClient {
    return new ProviderClient(this.connectorAdapter);
  }

  async assist(query: string, options?: {
    context?: Record<string, any>;
    model?: string;
    options?: Record<string, any>;
  }): Promise<AssistResponse> {
    const { result, execution } = await this.executeWithSpans(
      'assist',
      'LLM-CoPilot-Agent',
      this.assistAdapter,
      async () => {
        const adapterResult = await this.assistAdapter.assist({
          query,
          context: options?.context as any,
          options: options?.options as any
        });

        return {
          response: adapterResult.response,
          confidence: adapterResult.confidence,
          suggestions: adapterResult.suggestions.map(s => s.description),
          context: adapterResult.metadata
        } as AssistResponse;
      },
    );

    result._execution = execution;
    return result;
  }

  forge(): ForgeClient {
    return new ForgeClient(this.forgeAdapter);
  }

  getConfig(): Readonly<InterfaceCoreConfig> {
    return Object.freeze({ ...this.config });
  }

  updateConfig(config: Partial<InterfaceCoreConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async initialize(): Promise<void> {
    await Promise.all([]);
  }

  async dispose(): Promise<void> {}
}

// ============================================================================
// Exports
// ============================================================================

export default InterfaceCore;
export * from './types/index.js';
export * from './adapters/index.js';
export type { ExecutionAwareAdapter } from './types/adapter.interface.js';
export * from './execution/index.js';
