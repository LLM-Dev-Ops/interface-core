/**
 * Execution Span Types for Agentics Execution Engine
 *
 * Defines the hierarchical span model enforced by agentics-execution-engine.
 * Every execution MUST produce: Core → Repo → Agent.
 */

// ============================================================================
// Span Types
// ============================================================================

export type SpanType = 'core' | 'repo' | 'agent';

export type SpanStatus = 'success' | 'failed' | 'pending';

/**
 * Artifact attached to a span. Must be at the lowest possible span level.
 */
export interface Artifact {
  /** Stable identifier for this artifact */
  id: string;
  /** Artifact type (plan, mapping, config, export, report, etc.) */
  type: string;
  /** Stable reference (file path, URL, key) */
  reference: string;
  /** Optional inline data */
  data?: unknown;
}

/**
 * Machine-verifiable evidence reference attached to the span that produced it.
 */
export interface EvidenceReference {
  /** Stable identifier */
  id: string;
  /** Evidence type - must be machine-verifiable */
  type: 'hash' | 'uri' | 'id';
  /** The verifiable value (hash digest, URI, or stable ID) */
  value: string;
}

/**
 * A single execution span in the hierarchy.
 * Spans form a tree: Core → Repo → Agent.
 */
export interface ExecutionSpan {
  /** Unique span identifier (UUID v4) */
  span_id: string;
  /** Parent span identifier. Null only for root core spans with no external parent. */
  parent_span_id: string | null;
  /** Span type in the hierarchy */
  type: SpanType;
  /** Human-readable name (core name, repo name, or agent name) */
  name: string;
  /** ISO 8601 timestamp when this span started */
  start_time: string;
  /** ISO 8601 timestamp when this span ended. Null if still pending. */
  end_time: string | null;
  /** Current span status */
  status: SpanStatus;
  /** Artifacts attached at this span level */
  artifacts: Artifact[];
  /** Evidence references attached at this span level */
  evidence: EvidenceReference[];
  /** Child spans (repos for core, agents for repo) */
  children: ExecutionSpan[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Execution Graph & Result
// ============================================================================

/**
 * The complete execution graph. Fully hierarchical, append-only,
 * JSON-serializable without loss.
 */
export interface ExecutionGraph {
  /** Unique execution identifier */
  execution_id: string;
  /** Root core span containing the full tree */
  root_span: ExecutionSpan;
  /** Flat list of all spans for indexing (preserves parent_span_id references) */
  all_spans: ExecutionSpan[];
  /** ISO 8601 creation timestamp */
  created_at: string;
  /** Whether the graph passed structural validation */
  valid: boolean;
  /** Validation failure reasons, if any */
  failure_reasons: string[];
}

/**
 * The Core execution result conforming to agentics-execution-engine contract.
 * Returned on success, partial failure, and total failure.
 */
export interface CoreExecutionResult {
  /** Name of this core */
  core_name: string;
  /** Unique execution identifier */
  execution_id: string;
  /** Overall execution status */
  status: SpanStatus;
  /** The full execution graph */
  execution_graph: ExecutionGraph;
  /** Failure reasons (populated even on partial failure) */
  failure_reasons: string[];
}

// ============================================================================
// Execution Context (passed downstream)
// ============================================================================

/**
 * Context passed to downstream repos/adapters to maintain span hierarchy.
 */
export interface ExecutionContext {
  /** Execution-wide unique ID */
  execution_id: string;
  /** The parent span ID for the downstream to use */
  parent_span_id: string;
  /** The core span ID (root of this execution) */
  core_span_id: string;
}
