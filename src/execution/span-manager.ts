/**
 * Span Manager - Lifecycle utilities for execution spans
 *
 * Provides factory functions to create and finalize spans
 * at each level of the Core → Repo → Agent hierarchy.
 */

import { randomUUID } from 'node:crypto';
import type {
  ExecutionSpan,
  SpanStatus,
  SpanType,
  Artifact,
  EvidenceReference,
  ExecutionContext,
} from './types.js';

/**
 * Generate a unique span ID (UUID v4).
 */
export function generateSpanId(): string {
  return randomUUID();
}

/**
 * Generate a unique execution ID (UUID v4).
 */
export function generateExecutionId(): string {
  return randomUUID();
}

/**
 * Create a new span with the given type and name.
 */
function createSpan(
  type: SpanType,
  name: string,
  parentSpanId: string | null,
): ExecutionSpan {
  return {
    span_id: generateSpanId(),
    parent_span_id: parentSpanId,
    type,
    name,
    start_time: new Date().toISOString(),
    end_time: null,
    status: 'pending',
    artifacts: [],
    evidence: [],
    children: [],
  };
}

/**
 * Create a core-level span (root of execution tree).
 */
export function createCoreSpan(
  name: string,
  parentSpanId?: string | null,
): ExecutionSpan {
  return createSpan('core', name, parentSpanId ?? null);
}

/**
 * Create a repo-level span (child of core).
 */
export function createRepoSpan(
  repoName: string,
  parentSpanId: string,
): ExecutionSpan {
  return createSpan('repo', repoName, parentSpanId);
}

/**
 * Create an agent-level span (child of repo).
 */
export function createAgentSpan(
  agentName: string,
  parentSpanId: string,
): ExecutionSpan {
  return createSpan('agent', agentName, parentSpanId);
}

/**
 * Finalize a span by setting its end time, status, and optional artifacts/evidence.
 * Returns the mutated span for chaining.
 */
export function finalizeSpan(
  span: ExecutionSpan,
  status: SpanStatus,
  artifacts?: Artifact[],
  evidence?: EvidenceReference[],
): ExecutionSpan {
  span.end_time = new Date().toISOString();
  span.status = status;
  if (artifacts) {
    span.artifacts.push(...artifacts);
  }
  if (evidence) {
    span.evidence.push(...evidence);
  }
  return span;
}

/**
 * Build an execution context to pass downstream to adapters/repos.
 */
export function buildExecutionContext(
  executionId: string,
  coreSpanId: string,
  parentSpanId: string,
): ExecutionContext {
  return {
    execution_id: executionId,
    parent_span_id: parentSpanId,
    core_span_id: coreSpanId,
  };
}
