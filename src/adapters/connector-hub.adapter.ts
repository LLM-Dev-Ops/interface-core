import { AdapterConfig, ExecutionAwareAdapter } from '../types/adapter.interface.js';
import type { ExecutionSpan, ExecutionContext } from '../execution/types.js';
import { createAgentSpan, finalizeSpan } from '../execution/span-manager.js';

/**
 * ConnectorHubAdapter - Connects to LLM-Connector-Hub for provider management
 *
 * LLM-Connector-Hub manages connections to various LLM providers
 * (OpenAI, Anthropic, Google, etc.) and handles provider-specific protocols.
 */
export class ConnectorHubAdapter implements ExecutionAwareAdapter {
  config?: AdapterConfig;
  private lastSpans: ExecutionSpan[] = [];
  private executionContext: ExecutionContext | undefined;

  constructor(config?: AdapterConfig) {
    this.config = {
      baseUrl: 'http://localhost:3003',
      timeout: 20000,
      debug: false,
      ...config,
    };
  }

  getLastExecutionSpans(): ExecutionSpan[] {
    return this.lastSpans;
  }

  setExecutionContext(context: ExecutionContext): void {
    this.executionContext = context;
  }

  async initialize(): Promise<void> {
    if (this.config?.debug) {
      console.log('[ConnectorHubAdapter] Initializing connection to LLM-Connector-Hub...');
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this.config?.debug) {
      console.log('[ConnectorHubAdapter] Health check: OK (simulated)');
    }
    return true;
  }

  async listProviders(filters?: {
    status?: 'active' | 'inactive' | 'all';
    capability?: string[];
    region?: string;
  }): Promise<Array<{
    id: string;
    name: string;
    status: 'active' | 'inactive';
    capabilities: string[];
    models: string[];
    pricing: {
      inputTokens: number;
      outputTokens: number;
      currency: string;
    };
  }>> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('connector-hub:listProviders', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[ConnectorHubAdapter] Listing providers with filters:', filters);
      }

      const result = [
        {
          id: 'openai',
          name: 'OpenAI',
          status: 'active' as const,
          capabilities: ['chat', 'completion', 'embeddings', 'vision'],
          models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
          pricing: { inputTokens: 0.03, outputTokens: 0.06, currency: 'USD' },
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          status: 'active' as const,
          capabilities: ['chat', 'completion', 'vision'],
          models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
          pricing: { inputTokens: 0.015, outputTokens: 0.075, currency: 'USD' },
        },
        {
          id: 'google',
          name: 'Google AI',
          status: 'active' as const,
          capabilities: ['chat', 'completion', 'embeddings'],
          models: ['gemini-pro', 'gemini-ultra'],
          pricing: { inputTokens: 0.0005, outputTokens: 0.0015, currency: 'USD' },
        },
      ];

      finalizeSpan(span, 'success');
      this.lastSpans = [span];
      return result;
    } catch (err) {
      finalizeSpan(span, 'failed');
      this.lastSpans = [span];
      throw err;
    }
  }

  async connectProvider(
    providerId: string,
    credentials: {
      apiKey?: string;
      endpoint?: string;
      options?: Record<string, any>;
    }
  ): Promise<{
    success: boolean;
    connectionId: string;
    provider: string;
    status: 'connected' | 'failed';
    metadata: Record<string, any>;
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('connector-hub:connectProvider', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[ConnectorHubAdapter] Connecting to provider:', providerId);
      }

      const connectionId = `conn-${providerId}-${Date.now()}`;
      const result = {
        success: true,
        connectionId,
        provider: providerId,
        status: 'connected' as const,
        metadata: {
          connectedAt: new Date().toISOString(),
          endpoint: credentials.endpoint || `https://api.${providerId}.com`,
          poolSize: 5,
        },
      };

      finalizeSpan(span, 'success', [], [
        { id: connectionId, type: 'id', value: connectionId },
      ]);
      this.lastSpans = [span];
      return result;
    } catch (err) {
      finalizeSpan(span, 'failed');
      this.lastSpans = [span];
      throw err;
    }
  }

  async getConnection(connectionId: string): Promise<{
    id: string;
    provider: string;
    status: 'connected' | 'disconnected' | 'error';
    statistics: {
      requestCount: number;
      errorCount: number;
      avgLatency: number;
      lastUsed: string;
    };
    metadata: Record<string, any>;
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('connector-hub:getConnection', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[ConnectorHubAdapter] Getting connection info:', connectionId);
      }

      const result = {
        id: connectionId,
        provider: 'openai',
        status: 'connected' as const,
        statistics: {
          requestCount: 1234,
          errorCount: 5,
          avgLatency: 450,
          lastUsed: new Date().toISOString(),
        },
        metadata: {
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          poolSize: 5,
          activeConnections: 3,
        },
      };

      finalizeSpan(span, 'success');
      this.lastSpans = [span];
      return result;
    } catch (err) {
      finalizeSpan(span, 'failed');
      this.lastSpans = [span];
      throw err;
    }
  }

  async disconnectProvider(connectionId: string): Promise<{
    success: boolean;
    connectionId: string;
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('connector-hub:disconnectProvider', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[ConnectorHubAdapter] Disconnecting provider:', connectionId);
      }

      const result = { success: true, connectionId };

      finalizeSpan(span, 'success');
      this.lastSpans = [span];
      return result;
    } catch (err) {
      finalizeSpan(span, 'failed');
      this.lastSpans = [span];
      throw err;
    }
  }

  async forwardEvent(body: Record<string, unknown>): Promise<void> {
    const url = `${this.config?.baseUrl}/api/v1/events`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config?.timeout ?? 20000),
    });
    if (!response.ok) {
      throw new Error(`connector-hub responded ${response.status}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.config?.debug) {
      console.log('[ConnectorHubAdapter] Disconnecting from LLM-Connector-Hub...');
    }
  }
}
