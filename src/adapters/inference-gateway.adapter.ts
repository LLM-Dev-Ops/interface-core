import { AdapterConfig, ExecutionAwareAdapter } from '../types/adapter.interface.js';
import type { ExecutionSpan, ExecutionContext } from '../execution/types.js';
import { createAgentSpan, finalizeSpan } from '../execution/span-manager.js';

/**
 * InferenceGatewayAdapter - Connects to LLM-Inference-Gateway for model inference
 *
 * LLM-Inference-Gateway handles routing requests to appropriate LLM models,
 * load balancing, request forwarding, and inference orchestration.
 */
export class InferenceGatewayAdapter implements ExecutionAwareAdapter {
  config?: AdapterConfig;
  private lastSpans: ExecutionSpan[] = [];
  private executionContext: ExecutionContext | undefined;

  constructor(config?: AdapterConfig) {
    this.config = {
      baseUrl: 'http://localhost:3005',
      timeout: 60000,
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
      console.log('[InferenceGatewayAdapter] Initializing connection to LLM-Inference-Gateway...');
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this.config?.debug) {
      console.log('[InferenceGatewayAdapter] Health check: OK (simulated)');
    }
    return true;
  }

  async infer(request: {
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
    context?: {
      systemPrompt?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    };
    options?: {
      stream?: boolean;
      cache?: boolean;
      priority?: 'low' | 'normal' | 'high';
    };
  }): Promise<{
    id: string;
    model: string;
    response: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    metadata: {
      finishReason: 'stop' | 'length' | 'content_filter';
      latency: number;
      cached: boolean;
    };
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('inference-gateway:infer', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[InferenceGatewayAdapter] Running inference with model:', request.model);
      }

      const resultId = `infer-${Date.now()}`;
      const result = {
        id: resultId,
        model: request.model,
        response: `This is a simulated response to the prompt: "${request.prompt.substring(0, 50)}..."`,
        usage: {
          promptTokens: 150,
          completionTokens: 200,
          totalTokens: 350,
        },
        metadata: {
          finishReason: 'stop' as const,
          latency: 1500,
          cached: false,
        },
      };

      finalizeSpan(span, 'success', [], [
        { id: resultId, type: 'id', value: resultId },
      ]);
      this.lastSpans = [span];
      return result;
    } catch (err) {
      finalizeSpan(span, 'failed');
      this.lastSpans = [span];
      throw err;
    }
  }

  async forwardRequest(request: {
    provider: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    options?: {
      timeout?: number;
      retries?: number;
    };
  }): Promise<{
    status: number;
    headers: Record<string, string>;
    body: any;
    metadata: {
      provider: string;
      latency: number;
      retries: number;
    };
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('inference-gateway:forwardRequest', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[InferenceGatewayAdapter] Forwarding request to:', request.provider, request.endpoint);
      }

      const requestId = `fwd-${Date.now()}`;
      const result = {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-request-id': requestId,
        },
        body: {
          success: true,
          data: 'Simulated response from provider',
        },
        metadata: {
          provider: request.provider,
          latency: 800,
          retries: 0,
        },
      };

      finalizeSpan(span, 'success', [], [
        { id: requestId, type: 'id', value: requestId },
      ]);
      this.lastSpans = [span];
      return result;
    } catch (err) {
      finalizeSpan(span, 'failed');
      this.lastSpans = [span];
      throw err;
    }
  }

  async getModelInfo(modelId?: string): Promise<{
    models: Array<{
      id: string;
      name: string;
      provider: string;
      type: 'chat' | 'completion' | 'embedding' | 'image' | 'audio';
      capabilities: string[];
      parameters: {
        maxTokens: number;
        contextWindow: number;
        supportedLanguages?: string[];
      };
      pricing: {
        inputTokens: number;
        outputTokens: number;
        currency: string;
      };
      status: 'available' | 'limited' | 'unavailable';
      metadata: Record<string, any>;
    }>;
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('inference-gateway:getModelInfo', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[InferenceGatewayAdapter] Getting model info:', modelId || 'all models');
      }

      const allModels = [
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          provider: 'openai',
          type: 'chat' as const,
          capabilities: ['chat', 'function-calling', 'vision', 'json-mode'],
          parameters: { maxTokens: 4096, contextWindow: 128000, supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja'] },
          pricing: { inputTokens: 0.01, outputTokens: 0.03, currency: 'USD' },
          status: 'available' as const,
          metadata: { version: 'gpt-4-0125-preview', trainingCutoff: '2023-12' },
        },
        {
          id: 'claude-3-opus',
          name: 'Claude 3 Opus',
          provider: 'anthropic',
          type: 'chat' as const,
          capabilities: ['chat', 'vision', 'tool-use', 'long-context'],
          parameters: { maxTokens: 4096, contextWindow: 200000, supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt'] },
          pricing: { inputTokens: 0.015, outputTokens: 0.075, currency: 'USD' },
          status: 'available' as const,
          metadata: { version: '20240229', trainingCutoff: '2023-08' },
        },
        {
          id: 'gemini-pro',
          name: 'Gemini Pro',
          provider: 'google',
          type: 'chat' as const,
          capabilities: ['chat', 'multimodal', 'code-generation'],
          parameters: { maxTokens: 2048, contextWindow: 32000, supportedLanguages: ['en', 'multi'] },
          pricing: { inputTokens: 0.0005, outputTokens: 0.0015, currency: 'USD' },
          status: 'available' as const,
          metadata: { version: '1.0' },
        },
      ];

      const result = {
        models: modelId ? allModels.filter((m) => m.id === modelId) : allModels,
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

  async getMetrics(timeRange?: number): Promise<{
    requests: { total: number; successful: number; failed: number; cached: number };
    latency: { p50: number; p95: number; p99: number; avg: number };
    tokens: { input: number; output: number; total: number };
    costs: { total: number; currency: string; byProvider: Record<string, number> };
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('inference-gateway:getMetrics', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[InferenceGatewayAdapter] Getting metrics for time range:', timeRange);
      }

      const result = {
        requests: { total: 15420, successful: 15200, failed: 220, cached: 3500 },
        latency: { p50: 850, p95: 2100, p99: 3500, avg: 1200 },
        tokens: { input: 2500000, output: 1800000, total: 4300000 },
        costs: { total: 125.50, currency: 'USD', byProvider: { openai: 75.30, anthropic: 35.20, google: 15.00 } },
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

  async disconnect(): Promise<void> {
    if (this.config?.debug) {
      console.log('[InferenceGatewayAdapter] Disconnecting from LLM-Inference-Gateway...');
    }
  }
}
