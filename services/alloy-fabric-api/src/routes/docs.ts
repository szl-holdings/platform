import type { IRouter, Request, Response } from 'express';

const API_DOCS = {
  openapi: '3.1.0',
  info: {
    title: 'FORGE Embedding Fabric API',
    description: 'Governed, multi-tenant, evidence-first retrieval layer for SZL Holdings.',
    version: '1.0.0',
  },
  paths: {
    '/v1/embed': { post: { summary: 'Dense text embedding' } },
    '/v1/rerank': { post: { summary: 'Cross-encoder reranking' } },
    '/v1/hybrid-search': { post: { summary: 'Hybrid RRF retrieval' } },
    '/v1/ingest': { post: { summary: 'Document ingestion' } },
    '/v1/index/rebuild': { post: { summary: 'Index rebuild workflow' } },
    '/v1/index/verify': { post: { summary: 'Index integrity verification' } },
    '/v1/evals/run': { post: { summary: 'Retrieval eval run' } },
    '/v1/openai/embeddings': { post: { summary: 'OpenAI-compatible embeddings' } },
    '/health': { get: { summary: 'Health probe' } },
    '/ready': { get: { summary: 'Readiness probe' } },
    '/metrics': { get: { summary: 'Prometheus metrics' } },
  },
  // Legacy flat endpoint listing retained for backward compatibility
  service: 'alloy-fabric-api',
  endpoints: [
    {
      method: 'POST',
      path: '/v1/embed',
      description:
        'Produce dense embeddings for one or more text strings. Requires X-Tenant-ID header.',
      auth: 'Bearer token',
      body: {
        requestId: 'string (required)',
        tenantId: 'string (required)',
        texts: 'string[] (1–512 items)',
        model: 'string (optional, default: aef-embed-cpu-v1)',
        normalize: 'boolean (default: true)',
      },
    },
    {
      method: 'POST',
      path: '/v1/rerank',
      description: 'Cross-encoder reranking of candidate chunks against a query.',
      auth: 'Bearer token',
      body: {
        requestId: 'string (required)',
        tenantId: 'string (required)',
        query: 'string (required)',
        candidates: 'Array<{id, text, score?, metadata?}>',
        topK: 'number (default: 10)',
        model: 'string (optional, default: aef-rerank-cpu-v1)',
      },
    },
    {
      method: 'POST',
      path: '/v1/hybrid-search',
      description:
        'Hybrid retrieval combining dense ANN search and keyword BM25 scoring, fused via RRF.',
      auth: 'Bearer token',
      body: {
        requestId: 'string (required)',
        tenantId: 'string (required)',
        query: 'string (required)',
        profileId: 'string (optional)',
        topK: 'number (default: 10)',
        denseWeight: 'number 0–1 (default: 0.6)',
        keywordWeight: 'number 0–1 (default: 0.4)',
        includeProvenance: 'boolean (default: true)',
      },
    },
    {
      method: 'POST',
      path: '/v1/ingest',
      description: 'Ingest one or more documents. Chunks, embeds, and indexes asynchronously.',
      auth: 'Bearer token',
      body: {
        requestId: 'string (required)',
        tenantId: 'string (required)',
        documents: 'IngestDocument[] (1–256 items)',
        chunkSize: 'number (default: 512 tokens)',
        chunkOverlap: 'number (default: 64 tokens)',
      },
    },
    {
      method: 'POST',
      path: '/v1/index/rebuild',
      description: 'Trigger a full or partial index rebuild workflow. Returns a jobId for polling.',
      auth: 'Bearer token',
    },
    {
      method: 'POST',
      path: '/v1/index/verify',
      description: 'Verify index integrity — checks for missing or corrupt chunk vectors.',
      auth: 'Bearer token',
    },
    {
      method: 'POST',
      path: '/v1/evals/run',
      description:
        'Run a retrieval evaluation against a golden fixture set. Returns nDCG, recall, precision, MRR.',
      auth: 'Bearer token',
    },
    {
      method: 'POST',
      path: '/v1/openai/embeddings',
      description:
        'OpenAI-compatible embeddings endpoint. Drop-in replacement for openai.embeddings.create().',
      auth: 'Bearer token',
      body: {
        input: 'string | string[]',
        model: 'string (optional)',
        dimensions: 'number (optional)',
      },
    },
    {
      method: 'GET',
      path: '/health',
      description: 'Service health check. No auth required.',
    },
    {
      method: 'GET',
      path: '/ready',
      description: 'Readiness probe. No auth required.',
    },
    {
      method: 'GET',
      path: '/metrics',
      description: 'Request counts, error rates, and latency percentiles. No auth required.',
    },
  ],
};

export function registerDocsRoute(router: IRouter): void {
  router.get('/docs', (_req: Request, res: Response) => {
    res.json(API_DOCS);
  });
}
