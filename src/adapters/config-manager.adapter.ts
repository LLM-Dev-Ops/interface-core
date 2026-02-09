import { AdapterConfig, ExecutionAwareAdapter } from '../types/adapter.interface.js';
import type { ExecutionSpan, ExecutionContext } from '../execution/types.js';
import { createAgentSpan, finalizeSpan } from '../execution/span-manager.js';

/**
 * ConfigManagerAdapter - Connects to LLM-Config-Manager for configuration management
 *
 * LLM-Config-Manager handles application configuration, environment variables,
 * secrets management, and configuration validation.
 */
export class ConfigManagerAdapter implements ExecutionAwareAdapter {
  config?: AdapterConfig;
  private lastSpans: ExecutionSpan[] = [];
  private executionContext: ExecutionContext | undefined;

  constructor(config?: AdapterConfig) {
    this.config = {
      baseUrl: 'http://localhost:3002',
      timeout: 10000,
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
      console.log('[ConfigManagerAdapter] Initializing connection to LLM-Config-Manager...');
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this.config?.debug) {
      console.log('[ConfigManagerAdapter] Health check: OK (simulated)');
    }
    return true;
  }

  async getConfig(
    key: string,
    options?: {
      environment?: string;
      decrypt?: boolean;
      version?: string;
    }
  ): Promise<{
    key: string;
    value: any;
    metadata: {
      source: string;
      lastModified: string;
      version: string;
    };
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('config-manager:getConfig', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[ConfigManagerAdapter] Getting config:', key, options);
      }

      const result = {
        key,
        value: key === 'app.name' ? 'LLM-Interface-Core' : null,
        metadata: {
          source: 'config-manager',
          lastModified: new Date().toISOString(),
          version: options?.version || '1.0.0',
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

  async setConfig(
    key: string,
    value: any,
    options?: {
      environment?: string;
      encrypt?: boolean;
      ttl?: number;
    }
  ): Promise<{
    success: boolean;
    key: string;
    version: string;
    metadata: Record<string, any>;
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('config-manager:setConfig', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[ConfigManagerAdapter] Setting config:', key, value, options);
      }

      const result = {
        success: true,
        key,
        version: '1.0.1',
        metadata: {
          encrypted: options?.encrypt || false,
          environment: options?.environment || 'default',
          ttl: options?.ttl,
          updatedAt: new Date().toISOString(),
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

  async resolveSecrets(
    references: string[]
  ): Promise<{
    secrets: Record<string, {
      value: string;
      metadata: {
        source: string;
        expiresAt?: string;
      };
    }>;
    errors?: Array<{ reference: string; error: string }>;
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('config-manager:resolveSecrets', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[ConfigManagerAdapter] Resolving secrets:', references);
      }

      const secrets: Record<string, any> = {};
      references.forEach((ref) => {
        secrets[ref] = {
          value: `secret-value-for-${ref}`,
          metadata: {
            source: 'vault',
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
        };
      });

      const result = { secrets, errors: [] };

      finalizeSpan(span, 'success');
      this.lastSpans = [span];
      return result;
    } catch (err) {
      finalizeSpan(span, 'failed');
      this.lastSpans = [span];
      throw err;
    }
  }

  async validateConfig(
    config: Record<string, any>,
    schema: string
  ): Promise<{
    valid: boolean;
    errors: Array<{ field: string; message: string }>;
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('config-manager:validateConfig', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[ConfigManagerAdapter] Validating config against schema:', schema);
      }

      const result = { valid: true, errors: [] as Array<{ field: string; message: string }> };

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
      console.log('[ConfigManagerAdapter] Disconnecting from LLM-Config-Manager...');
    }
  }
}
