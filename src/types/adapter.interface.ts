import type { ExecutionSpan, ExecutionContext } from '../execution/types.js';

/**
 * Base interface that all adapters must implement
 * Provides common structure for connecting to downstream LLM systems
 */
export interface AdapterInterface {
  /**
   * Configuration for the adapter
   */
  config?: Record<string, any>;

  /**
   * Initialize the adapter connection
   */
  initialize?(): Promise<void>;

  /**
   * Check if the adapter is connected and healthy
   */
  healthCheck?(): Promise<boolean>;

  /**
   * Cleanup and disconnect the adapter
   */
  disconnect?(): Promise<void>;
}

/**
 * Adapter that participates in the execution span hierarchy.
 * Must emit agent-level spans and make them retrievable.
 */
export interface ExecutionAwareAdapter extends AdapterInterface {
  /**
   * Retrieve the execution spans produced by the last operation.
   * Spans are agent-level and must include valid parent_span_id references.
   */
  getLastExecutionSpans(): ExecutionSpan[];

  /**
   * Set the execution context for the next operation.
   * The adapter uses this to correctly parent its agent spans.
   */
  setExecutionContext(context: ExecutionContext): void;
}

/**
 * Common configuration options for all adapters
 * Note: Infrastructure concerns (retry, circuit breaker, etc.) are owned by downstream systems
 */
export interface AdapterConfig {
  /**
   * Base URL for the downstream service
   */
  baseUrl?: string;

  /**
   * API key or authentication token
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds (passed to downstream)
   */
  timeout?: number;

  /**
   * Enable debug logging (for development only)
   */
  debug?: boolean;
}

// Re-export the main adapter interfaces from types/index.ts for compatibility
export type {
  InferenceAdapter,
  ConfigAdapter,
  CoPilotAdapter,
  ProviderAdapter,
} from './index.js';
