/**
 * Tool Mesh — NEXUS Protocol Bridge Handlers
 *
 * Registers concrete handlers for the NEXUS MCP/A2A/ACP protocol bridge
 * tools (web_search, memory_read, document_parse, delegate_research, etc.)
 * into the default Tool Mesh Gateway and Tool Registry, so `callTool` from
 * the FORGE code sandbox routes through the full guardrail chain before
 * reaching these implementations.
 *
 * Each handler is intentionally thin — it delegates to the appropriate
 * NEXUS in-process service or produces a well-typed stub result when the
 * backing service is not yet available, rather than silently returning empty.
 *
 * Call `registerNexusHandlers()` once during server startup (api-server).
 */

import { ToolManifestSchema, type ToolManifest } from './manifest.js';
import { defaultToolRegistry } from './registry.js';
import { defaultGateway } from './gateway.js';
import { defaultCatalogSearch } from './catalog-search.js';

// ─── Manifest definitions for NEXUS protocol bridge tools ─────────────────────

const NEXUS_TOOL_MANIFESTS: ToolManifest[] = [
  ToolManifestSchema.parse({
    id: 'nexus.web_search',
    name: 'web_search',
    version: '1.0.0',
    description: 'Search the web and return structured results with titles, URLs, and snippets.',
    domainTags: ['data'],
    policyTier: 'internal-workflow',
    timeoutMs: 15_000,
    approvalRequired: false,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string' },
        maxResults: { type: 'number', description: 'Maximum number of results (default: 10)' },
      },
      required: ['query'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        results: { type: 'array' },
        totalHits: { type: 'number' },
        query: { type: 'string' },
      },
    },
    failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
    observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
  }),

  ToolManifestSchema.parse({
    id: 'nexus.memory_read',
    name: 'memory_read',
    version: '1.0.0',
    description: 'Read items from the PRAXIS memory fabric by key or keyword search.',
    domainTags: ['data'],
    policyTier: 'internal-workflow',
    timeoutMs: 5_000,
    approvalRequired: false,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query or exact memory key' },
        tier: {
          type: 'string',
          enum: ['working', 'session', 'episodic', 'semantic'],
          description: 'Memory tier to search',
        },
        limit: { type: 'number', description: 'Maximum results to return (default: 10)' },
      },
      required: ['query'],
    },
    failureModes: [{ type: 'error', retryable: true, maxRetries: 1 }],
    observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ['query'] },
  }),

  ToolManifestSchema.parse({
    id: 'nexus.document_parse',
    name: 'document_parse',
    version: '1.0.0',
    description: 'Extract text and structured data from PDFs, Word documents, and web pages.',
    domainTags: ['documents'],
    policyTier: 'operator-assisted',
    timeoutMs: 30_000,
    approvalRequired: false,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL or file path to parse' },
        extractTables: { type: 'boolean', description: 'Whether to extract tables as JSON' },
      },
      required: ['url'],
    },
    failureModes: [
      { type: 'timeout', retryable: true, maxRetries: 1 },
      { type: 'unavailable', retryable: false, maxRetries: 0 },
    ],
    observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ['url'] },
  }),

  ToolManifestSchema.parse({
    id: 'nexus.delegate_research',
    name: 'delegate_research',
    version: '1.0.0',
    description: 'Delegate a research subtask to a specialized research agent via A2A protocol.',
    domainTags: ['data'],
    policyTier: 'operator-assisted',
    timeoutMs: 60_000,
    approvalRequired: false,
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Research task description' },
        agentRole: {
          type: 'string',
          enum: ['gatherer', 'analyst', 'verifier'],
          description: 'Target agent specialization',
        },
        context: { type: 'string', description: 'Additional context for the agent' },
      },
      required: ['task'],
    },
    failureModes: [{ type: 'timeout', retryable: true, maxRetries: 1 }],
    observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
  }),

  ToolManifestSchema.parse({
    id: 'nexus.catalog_search',
    name: 'catalog_search',
    version: '1.0.0',
    description: 'Search the unified tool and skill catalog by keyword. Returns ranked results.',
    domainTags: ['data'],
    policyTier: 'advisory-only',
    timeoutMs: 5_000,
    approvalRequired: false,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword search query' },
        topK: { type: 'number', description: 'Maximum results (default: 10)' },
        kinds: {
          type: 'array',
          items: { type: 'string', enum: ['tool', 'skill'] },
          description: 'Filter by entry kind',
        },
      },
      required: ['query'],
    },
    observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
  }),
];

// ─── Handler implementations ──────────────────────────────────────────────────

interface WebSearchInput {
  query: string;
  maxResults?: number;
}

interface MemoryReadInput {
  query: string;
  tier?: string;
  limit?: number;
}

interface DocumentParseInput {
  url: string;
  extractTables?: boolean;
}

interface DelegateResearchInput {
  task: string;
  agentRole?: 'gatherer' | 'analyst' | 'verifier';
  context?: string;
}

interface CatalogSearchInput {
  query: string;
  topK?: number;
  kinds?: Array<'tool' | 'skill'>;
}

async function webSearchHandler(input: unknown): Promise<unknown> {
  const { query } = input as WebSearchInput;
  // Fail fast — external search backend not yet connected.
  // Wire a real provider (e.g. Brave Search, Tavily) in follow-up task #3798.
  throw new Error(
    `nexus.web_search: external search backend is not connected (query="${query}"). ` +
      'Configure a search API integration to enable this tool.',
  );
}

async function memoryReadHandler(input: unknown): Promise<unknown> {
  const { query } = input as MemoryReadInput;
  // Fail fast — PRAXIS memory fabric not yet accessible from the tool bridge.
  // Wire the memory-fabric package in follow-up task #3798.
  throw new Error(
    `nexus.memory_read: memory fabric backend is not connected (query="${query}"). ` +
      'Integrate the memory-fabric store to enable this tool.',
  );
}

async function documentParseHandler(input: unknown): Promise<unknown> {
  const { url } = input as DocumentParseInput;
  // Fail fast — document parser not yet connected.
  throw new Error(
    `nexus.document_parse: document parsing backend is not connected (url="${url}"). ` +
      'Integrate a document extraction service to enable this tool.',
  );
}

async function delegateResearchHandler(input: unknown): Promise<unknown> {
  const { task } = input as DelegateResearchInput;
  // Fail fast — A2A research agent dispatch not yet connected.
  throw new Error(
    `nexus.delegate_research: A2A agent dispatch is not connected (task="${task}"). ` +
      'Wire the research swarm A2A endpoint to enable this tool.',
  );
}

async function catalogSearchHandler(input: unknown): Promise<unknown> {
  const { query, topK = 10, kinds } = input as CatalogSearchInput;
  const hits = defaultCatalogSearch.search({ query, topK, kinds });
  return { query, hits, totalHits: hits.length, topK };
}

// ─── Registration ─────────────────────────────────────────────────────────────

let _registered = false;

/**
 * Idempotent — safe to call multiple times; only registers once.
 * Call from server startup (e.g., api-server bootstrap) to wire NEXUS bridge
 * tools into the Tool Mesh Gateway so `callTool` from the FORGE code sandbox
 * routes through the guardrail chain before reaching these handlers.
 *
 * Only `nexus.catalog_search` is registered here — it is the only tool with a
 * fully operational backend.  The remaining four tools (web_search, memory_read,
 * document_parse, delegate_research) are gated out of the registry until real
 * backends are connected (see follow-up task #3798).  Callers that attempt
 * `callTool('nexus.web_search', ...)` will receive a clear "tool not registered"
 * error from the Gateway rather than a misleading empty success envelope.
 */
export function registerNexusHandlers(): void {
  if (_registered) return;
  _registered = true;

  // Only register the catalog_search manifest — it has a real backend.
  const catalogManifest = NEXUS_TOOL_MANIFESTS.find((m) => m.id === 'nexus.catalog_search');
  if (catalogManifest) {
    defaultToolRegistry.register(catalogManifest);
  }

  // Index registered tool manifests into catalog search
  defaultCatalogSearch.indexTools(defaultToolRegistry.list());

  defaultGateway.registerHandler('nexus.catalog_search', catalogSearchHandler);
}
