import { AdapterConfig, ExecutionAwareAdapter } from '../types/adapter.interface.js';
import type { ExecutionSpan, ExecutionContext } from '../execution/types.js';
import { createAgentSpan, finalizeSpan } from '../execution/span-manager.js';

/**
 * ForgeAdapter - Connects to LLM-Forge for interface generation
 *
 * LLM-Forge is responsible for generating interfaces, managing templates,
 * and providing interface scaffolding capabilities.
 */
export class ForgeAdapter implements ExecutionAwareAdapter {
  config?: AdapterConfig;
  private lastSpans: ExecutionSpan[] = [];
  private executionContext: ExecutionContext | undefined;

  constructor(config?: AdapterConfig) {
    this.config = {
      baseUrl: 'http://localhost:3001',
      timeout: 30000,
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
      console.log('[ForgeAdapter] Initializing connection to LLM-Forge...');
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this.config?.debug) {
      console.log('[ForgeAdapter] Health check: OK (simulated)');
    }
    return true;
  }

  async generateInterface(spec: {
    name: string;
    type: string;
    template?: string;
    parameters?: Record<string, any>;
  }): Promise<{
    success: boolean;
    interface: string;
    metadata: Record<string, any>;
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('forge:generateInterface', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[ForgeAdapter] Generating interface:', spec);
      }

      const result = {
        success: true,
        interface: `// Generated interface: ${spec.name}\nexport interface ${spec.name} {\n  // TODO: Implement interface\n}\n`,
        metadata: {
          generatedAt: new Date().toISOString(),
          template: spec.template || 'default',
          version: '1.0.0',
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

  async getTemplate(templateId: string): Promise<{
    id: string;
    name: string;
    description: string;
    content: string;
    parameters: Array<{ name: string; type: string; required: boolean }>;
  }> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('forge:getTemplate', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[ForgeAdapter] Fetching template:', templateId);
      }

      const result = {
        id: templateId,
        name: 'Default Template',
        description: 'A default interface template',
        content: 'export interface {{name}} {\n  // Interface definition\n}\n',
        parameters: [
          { name: 'name', type: 'string', required: true },
          { name: 'extends', type: 'string', required: false },
        ],
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

  async listTemplates(filters?: {
    type?: string;
    category?: string;
    tags?: string[];
  }): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
  }>> {
    const parentSpanId = this.executionContext?.parent_span_id ?? 'unknown';
    const span = createAgentSpan('forge:listTemplates', parentSpanId);
    this.lastSpans = [];

    try {
      if (this.config?.debug) {
        console.log('[ForgeAdapter] Listing templates with filters:', filters);
      }

      const result = [
        { id: 'template-1', name: 'Basic Interface', description: 'A basic TypeScript interface template', category: 'typescript', tags: ['basic', 'interface'] },
        { id: 'template-2', name: 'REST API Interface', description: 'Template for REST API interfaces', category: 'api', tags: ['rest', 'api', 'http'] },
        { id: 'template-3', name: 'GraphQL Schema', description: 'Template for GraphQL schema definitions', category: 'graphql', tags: ['graphql', 'schema'] },
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

  async disconnect(): Promise<void> {
    if (this.config?.debug) {
      console.log('[ForgeAdapter] Disconnecting from LLM-Forge...');
    }
  }
}
