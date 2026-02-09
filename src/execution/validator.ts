/**
 * Execution Graph Validator
 *
 * Enforces the invariants required by agentics-execution-engine:
 * - Core span must have ≥1 repo child span
 * - Every repo span must have ≥1 agent child span
 * - All parent_span_id relationships must be correct
 * - Execution is FAILED if any invariant is violated
 */

import type {
  ExecutionSpan,
  ExecutionGraph,
  CoreExecutionResult,
} from './types.js';
import { generateExecutionId } from './span-manager.js';

/**
 * Validate the structural integrity of an execution graph rooted at a core span.
 */
export function validateExecutionGraph(
  coreSpan: ExecutionSpan,
): { valid: boolean; failures: string[] } {
  const failures: string[] = [];

  // Core span must be type 'core'
  if (coreSpan.type !== 'core') {
    failures.push(`Root span type is "${coreSpan.type}", expected "core"`);
  }

  // Core span must have ≥1 repo child
  const repoChildren = coreSpan.children.filter(c => c.type === 'repo');
  if (repoChildren.length === 0) {
    failures.push('Core span has zero repo-level child spans');
  }

  // Every repo span must have ≥1 agent child
  for (const repoSpan of repoChildren) {
    if (repoSpan.parent_span_id !== coreSpan.span_id) {
      failures.push(
        `Repo span "${repoSpan.name}" parent_span_id "${repoSpan.parent_span_id}" does not match core span_id "${coreSpan.span_id}"`,
      );
    }

    const agentChildren = repoSpan.children.filter(c => c.type === 'agent');
    if (agentChildren.length === 0) {
      failures.push(
        `Repo span "${repoSpan.name}" has zero agent-level child spans`,
      );
    }

    // Validate agent parent references
    for (const agentSpan of agentChildren) {
      if (agentSpan.parent_span_id !== repoSpan.span_id) {
        failures.push(
          `Agent span "${agentSpan.name}" parent_span_id "${agentSpan.parent_span_id}" does not match repo span_id "${repoSpan.span_id}"`,
        );
      }
    }
  }

  // Check for non-repo children at core level (invalid)
  const invalidCoreChildren = coreSpan.children.filter(c => c.type !== 'repo');
  for (const invalid of invalidCoreChildren) {
    failures.push(
      `Core span has non-repo child "${invalid.name}" of type "${invalid.type}"`,
    );
  }

  return { valid: failures.length === 0, failures };
}

/**
 * Recursively collect all spans from a root span into a flat array.
 * Preserves parent_span_id references for graph reconstruction.
 */
export function collectAllSpans(rootSpan: ExecutionSpan): ExecutionSpan[] {
  const spans: ExecutionSpan[] = [rootSpan];
  for (const child of rootSpan.children) {
    spans.push(...collectAllSpans(child));
  }
  return spans;
}

/**
 * Build the complete ExecutionGraph from a finalized core span.
 */
export function buildExecutionGraph(
  coreSpan: ExecutionSpan,
  executionId?: string,
): ExecutionGraph {
  const validation = validateExecutionGraph(coreSpan);
  const allSpans = collectAllSpans(coreSpan);

  return {
    execution_id: executionId ?? generateExecutionId(),
    root_span: coreSpan,
    all_spans: allSpans,
    created_at: new Date().toISOString(),
    valid: validation.valid,
    failure_reasons: validation.failures,
  };
}

/**
 * Build the CoreExecutionResult conforming to the agentics-execution-engine contract.
 * Always returns a graph — on success, partial failure, and total failure.
 */
export function buildExecutionResult(
  coreSpan: ExecutionSpan,
  coreName: string,
  executionId?: string,
): CoreExecutionResult {
  const execId = executionId ?? generateExecutionId();
  const graph = buildExecutionGraph(coreSpan, execId);

  // Determine overall status
  let status = coreSpan.status;
  if (!graph.valid) {
    status = 'failed';
  }

  return {
    core_name: coreName,
    execution_id: execId,
    status,
    execution_graph: graph,
    failure_reasons: graph.failure_reasons,
  };
}
