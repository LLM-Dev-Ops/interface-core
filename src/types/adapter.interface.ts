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
 * Common configuration options for all adapters
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
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Retry configuration
   */
  retry?: {
    maxAttempts?: number;
    backoff?: number;
  };
}

// Re-export the main adapter interfaces from types/index.ts for compatibility
export type {
  InferenceAdapter,
  ConfigAdapter,
  CoPilotAdapter,
  ProviderAdapter,
} from './index.js';
