/**
 * LLM-Interface-Core - Main Library Entry Point
 *
 * This is the Phase-8 / Layer-3 core integration bundle that serves as
 * the primary interaction and access layer for developers and external systems.
 *
 * This module integrates:
 * - LLM-Forge: SDK and interface definitions
 * - LLM-Config-Manager: Configuration and secrets resolution
 * - LLM-Connector-Hub: Standardized provider access
 * - LLM-CoPilot-Agent: Developer assistance and guided interactions
 * - LLM-Inference-Gateway: Unified model serving and request forwarding
 *
 * LLM-Interface-Core is responsible ONLY for exposing a unified, ergonomic
 * interface surface (CLI + SDK) that routes requests to downstream systems.
 * It does NOT implement inference logic, provider adapters, workflow engines,
 * or infrastructure concerns (retry, tracing, logging, metrics).
 */

// Re-export adapters for direct access
export * from './adapters/index.js';

// Re-export handlers for request routing
export * from './handlers/index.js';

// Re-export services for thin glue logic
export * from './services/index.js';

// Re-export types
export * from './types/index.js';
