/**
 * LLM-Interface-Core Types
 *
 * Defines the routing interface for the core orchestration layer.
 * This is thin glue logic - all business logic lives in downstream systems:
 * - LLM-Inference-Gateway: Handles inference requests
 * - LLM-Config-Manager: Manages configuration
 * - LLM-CoPilot-Agent: Processes copilot requests
 * - LLM-Connector-Hub: Manages provider connections
 */

// ============================================================================
// Core Configuration Types
// ============================================================================

/**
 * Main configuration for the Interface Core system
 */
export interface InterfaceCoreConfig {
  /** Unique identifier for this interface instance */
  instanceId: string;

  /** Environment (development, staging, production) */
  environment: 'development' | 'staging' | 'production';

  /** Routing table configuration */
  routing: RoutingTable;

  /** Timeout settings in milliseconds */
  timeouts: {
    inference: number;
    config: number;
    copilot: number;
    provider: number;
  };

  /** Retry policy configuration */
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };

  /** Logging configuration */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableRequestLogging: boolean;
    enableResponseLogging: boolean;
  };

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Request Types - Routes to Downstream Systems
// ============================================================================

/**
 * Request for LLM inference
 * Routes to: LLM-Inference-Gateway
 */
export interface InferenceRequest {
  requestType: 'inference';
  requestId: string;
  timestamp: string;

  /** Model identifier */
  model: string;

  /** Provider (anthropic, openai, etc.) */
  provider: string;

  /** Input messages or prompt */
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;

  /** Inference parameters */
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    stream?: boolean;
  };

  /** User/session context */
  context?: {
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Request for configuration operations
 * Routes to: LLM-Config-Manager
 */
export interface ConfigRequest {
  requestType: 'config';
  requestId: string;
  timestamp: string;

  /** Operation type */
  operation: 'get' | 'set' | 'update' | 'delete' | 'list';

  /** Configuration scope */
  scope: 'global' | 'provider' | 'model' | 'user';

  /** Target identifier (provider name, model id, user id, etc.) */
  target?: string;

  /** Configuration key path (dot notation supported) */
  key?: string;

  /** Value for set/update operations */
  value?: unknown;

  /** Filter criteria for list operations */
  filter?: Record<string, unknown>;

  /** User context */
  context?: {
    userId?: string;
    permissions?: string[];
  };
}

/**
 * Request for copilot/agent operations
 * Routes to: LLM-CoPilot-Agent
 */
export interface CoPilotRequest {
  requestType: 'copilot';
  requestId: string;
  timestamp: string;

  /** Copilot action type */
  action: 'assist' | 'complete' | 'explain' | 'refactor' | 'debug' | 'generate';

  /** Programming language or context type */
  language?: string;

  /** Source code or content to process */
  content: string;

  /** Cursor position or selection range */
  position?: {
    line: number;
    character: number;
    endLine?: number;
    endCharacter?: number;
  };

  /** Additional context */
  additionalContext?: {
    filePath?: string;
    projectType?: string;
    dependencies?: string[];
    recentChanges?: string[];
  };

  /** User preferences */
  preferences?: {
    verbosity?: 'concise' | 'detailed';
    includeExamples?: boolean;
    codeStyle?: Record<string, unknown>;
  };

  /** Session context */
  context?: {
    userId?: string;
    sessionId?: string;
    conversationHistory?: Array<{
      role: string;
      content: string;
    }>;
  };
}

/**
 * Request for provider/connector operations
 * Routes to: LLM-Connector-Hub
 */
export interface ProviderRequest {
  requestType: 'provider';
  requestId: string;
  timestamp: string;

  /** Operation type */
  operation: 'list' | 'get' | 'test' | 'configure' | 'healthcheck';

  /** Provider identifier (anthropic, openai, etc.) */
  providerId?: string;

  /** Configuration for configure operation */
  configuration?: {
    apiKey?: string;
    endpoint?: string;
    timeout?: number;
    retryPolicy?: {
      maxRetries: number;
      backoffMultiplier: number;
    };
    customHeaders?: Record<string, string>;
    customParams?: Record<string, unknown>;
  };

  /** Test parameters for test operation */
  testParams?: {
    model?: string;
    sampleInput?: string;
  };

  /** User context */
  context?: {
    userId?: string;
    permissions?: string[];
  };
}

/**
 * Union type of all possible requests
 */
export type InterfaceRequest =
  | InferenceRequest
  | ConfigRequest
  | CoPilotRequest
  | ProviderRequest;

// ============================================================================
// Response Types - From Downstream Systems
// ============================================================================

/**
 * Response from LLM-Inference-Gateway
 */
export interface InferenceResponse {
  requestId: string;
  timestamp: string;
  status: 'success' | 'error' | 'partial';

  /** Generated response */
  completion?: {
    content: string;
    role: 'assistant';
    finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
  };

  /** Usage statistics */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** Model information */
  model: string;
  provider: string;

  /** Error details if status is error */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };

  /** Performance metrics */
  metrics?: {
    latencyMs: number;
    timeToFirstTokenMs?: number;
  };
}

/**
 * Response from LLM-Config-Manager
 */
export interface ConfigResponse {
  requestId: string;
  timestamp: string;
  status: 'success' | 'error';

  /** Operation that was performed */
  operation: 'get' | 'set' | 'update' | 'delete' | 'list';

  /** Result data for get/list operations */
  data?: unknown;

  /** List of configurations for list operation */
  configurations?: Array<{
    key: string;
    value: unknown;
    scope: string;
    target?: string;
    metadata?: Record<string, unknown>;
  }>;

  /** Confirmation for write operations */
  modified?: {
    key: string;
    previousValue?: unknown;
    newValue?: unknown;
  };

  /** Error details if status is error */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Response from LLM-CoPilot-Agent
 */
export interface CoPilotResponse {
  requestId: string;
  timestamp: string;
  status: 'success' | 'error';

  /** Copilot action that was performed */
  action: 'assist' | 'complete' | 'explain' | 'refactor' | 'debug' | 'generate';

  /** Generated suggestions or completions */
  suggestions?: Array<{
    content: string;
    confidence: number;
    type: 'code' | 'explanation' | 'documentation';
    range?: {
      startLine: number;
      startCharacter: number;
      endLine: number;
      endCharacter: number;
    };
  }>;

  /** Explanation or analysis */
  explanation?: string;

  /** Generated code */
  generatedCode?: {
    content: string;
    language: string;
    description?: string;
  };

  /** Refactoring suggestions */
  refactorings?: Array<{
    description: string;
    changes: Array<{
      range: {
        startLine: number;
        startCharacter: number;
        endLine: number;
        endCharacter: number;
      };
      newText: string;
    }>;
  }>;

  /** Debug insights */
  debugInfo?: {
    issues: Array<{
      severity: 'error' | 'warning' | 'info';
      message: string;
      line?: number;
      suggestion?: string;
    }>;
  };

  /** Error details if status is error */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Response from LLM-Connector-Hub
 */
export interface ProviderResponse {
  requestId: string;
  timestamp: string;
  status: 'success' | 'error';

  /** Operation that was performed */
  operation: 'list' | 'get' | 'test' | 'configure' | 'healthcheck';

  /** List of available providers */
  providers?: Array<{
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'error';
    models: string[];
    capabilities: string[];
    metadata?: Record<string, unknown>;
  }>;

  /** Single provider details for get operation */
  provider?: {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'error';
    models: string[];
    capabilities: string[];
    configuration?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };

  /** Test results */
  testResult?: {
    success: boolean;
    latencyMs: number;
    response?: string;
    error?: string;
  };

  /** Health check results */
  health?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      message?: string;
    }>;
  };

  /** Configuration confirmation */
  configured?: {
    providerId: string;
    appliedSettings: string[];
  };

  /** Error details if status is error */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Union type of all possible responses
 */
export type InterfaceResponse =
  | InferenceResponse
  | ConfigResponse
  | CoPilotResponse
  | ProviderResponse;

// ============================================================================
// Routing Types
// ============================================================================

/**
 * Downstream system endpoints
 */
export interface DownstreamEndpoint {
  /** System name */
  name: string;

  /** Base URL for the downstream system */
  baseUrl: string;

  /** Health check endpoint */
  healthEndpoint?: string;

  /** Authentication configuration */
  auth?: {
    type: 'bearer' | 'apikey' | 'oauth' | 'none';
    credentials?: string;
  };

  /** Circuit breaker configuration */
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold: number;
    resetTimeoutMs: number;
  };

  /** Custom headers to include in requests */
  headers?: Record<string, string>;
}

/**
 * Routing table that maps request types to downstream systems
 */
export interface RoutingTable {
  /** Routes InferenceRequest to LLM-Inference-Gateway */
  inference: DownstreamEndpoint;

  /** Routes ConfigRequest to LLM-Config-Manager */
  config: DownstreamEndpoint;

  /** Routes CoPilotRequest to LLM-CoPilot-Agent */
  copilot: DownstreamEndpoint;

  /** Routes ProviderRequest to LLM-Connector-Hub */
  provider: DownstreamEndpoint;
}

/**
 * Routing context passed through the system
 */
export interface RoutingContext {
  /** Original request */
  request: InterfaceRequest;

  /** Routing destination */
  destination: DownstreamEndpoint;

  /** Correlation ID for tracing */
  correlationId: string;

  /** Start timestamp */
  startTime: number;

  /** Retry attempt number */
  retryAttempt?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Adapter Interface
// ============================================================================

/**
 * Base interface that all downstream system adapters must implement
 * This enforces a consistent contract for routing and communication
 */
export interface AdapterInterface<TRequest extends InterfaceRequest, TResponse extends InterfaceResponse> {
  /** Adapter name/identifier */
  readonly name: string;

  /** Target downstream system endpoint */
  readonly endpoint: DownstreamEndpoint;

  /**
   * Send a request to the downstream system
   * @param request - The request to send
   * @param context - Routing context
   * @returns Promise resolving to the response
   */
  send(request: TRequest, context?: Partial<RoutingContext>): Promise<TResponse>;

  /**
   * Check health of the downstream system
   * @returns Promise resolving to health status
   */
  healthCheck(): Promise<{
    healthy: boolean;
    latencyMs?: number;
    message?: string;
  }>;

  /**
   * Validate request before sending
   * @param request - The request to validate
   * @returns True if valid, false otherwise
   */
  validateRequest(request: TRequest): boolean;

  /**
   * Transform request to downstream format if needed
   * @param request - The request to transform
   * @returns Transformed request
   */
  transformRequest?(request: TRequest): unknown;

  /**
   * Transform response from downstream format if needed
   * @param response - The response to transform
   * @returns Transformed response
   */
  transformResponse?(response: unknown): TResponse;
}

/**
 * Specific adapter interfaces for each downstream system
 */
export interface InferenceAdapter extends AdapterInterface<InferenceRequest, InferenceResponse> {
  /** Stream inference if supported */
  stream?(request: InferenceRequest, onChunk: (chunk: string) => void): Promise<InferenceResponse>;
}

export interface ConfigAdapter extends AdapterInterface<ConfigRequest, ConfigResponse> {
  /** Watch for configuration changes */
  watch?(key: string, onChange: (value: unknown) => void): () => void;
}

export interface CoPilotAdapter extends AdapterInterface<CoPilotRequest, CoPilotResponse> {
  /** Get cached suggestions if available */
  getCachedSuggestions?(content: string): CoPilotResponse | null;
}

export interface ProviderAdapter extends AdapterInterface<ProviderRequest, ProviderResponse> {
  /** Register a new provider dynamically */
  registerProvider?(providerId: string, config: unknown): Promise<boolean>;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Standard error codes for routing operations
 */
export enum ErrorCode {
  // Request errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  UNSUPPORTED_REQUEST_TYPE = 'UNSUPPORTED_REQUEST_TYPE',

  // Routing errors
  ROUTING_FAILED = 'ROUTING_FAILED',
  DESTINATION_NOT_FOUND = 'DESTINATION_NOT_FOUND',
  ADAPTER_NOT_CONFIGURED = 'ADAPTER_NOT_CONFIGURED',

  // Downstream errors
  DOWNSTREAM_UNAVAILABLE = 'DOWNSTREAM_UNAVAILABLE',
  DOWNSTREAM_TIMEOUT = 'DOWNSTREAM_TIMEOUT',
  DOWNSTREAM_ERROR = 'DOWNSTREAM_ERROR',

  // Circuit breaker
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Interface routing error
 */
export interface RoutingError {
  code: ErrorCode;
  message: string;
  requestId?: string;
  destination?: string;
  details?: unknown;
  timestamp: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for InferenceRequest
 */
export function isInferenceRequest(request: InterfaceRequest): request is InferenceRequest {
  return request.requestType === 'inference';
}

/**
 * Type guard for ConfigRequest
 */
export function isConfigRequest(request: InterfaceRequest): request is ConfigRequest {
  return request.requestType === 'config';
}

/**
 * Type guard for CoPilotRequest
 */
export function isCoPilotRequest(request: InterfaceRequest): request is CoPilotRequest {
  return request.requestType === 'copilot';
}

/**
 * Type guard for ProviderRequest
 */
export function isProviderRequest(request: InterfaceRequest): request is ProviderRequest {
  return request.requestType === 'provider';
}
