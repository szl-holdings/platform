export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Alloy Embedding Fabric API',
    version: '0.2.0',
    description:
      'Governed text and multimodal embedding, reranking, hybrid retrieval, ingestion, index operations, and evaluation. ' +
      'Embedding responses carry exact model/runtime execution receipts and retrieval paths write evidence entries. ' +
      'Every protected operation requires a non-empty X-Tenant-Id header matching the credential binding and any tenantId in the request body or query.',
  },
  servers: [{ url: '/alloy-embedding-api', description: 'AEF API' }],
  security: [{ BearerAuth: [] }],
  components: {
    securitySchemes: { BearerAuth: { type: 'http', scheme: 'bearer' } },
    schemas: {
      ExecutionReceipt: {
        type: 'object',
        required: ['backendId', 'modelId', 'dimensions', 'normalized', 'promotionState'],
        properties: {
          backendId: { type: 'string' },
          modelId: { type: 'string' },
          modelRevision: { type: 'string' },
          artifactSetDigest: { type: 'string', pattern: '^[a-fA-F0-9]{64}$' },
          processorRevision: { type: 'string' },
          runtimeId: { type: 'string' },
          runtimeVersion: { type: 'string' },
          dimensions: { type: 'integer', minimum: 1 },
          normalized: { type: 'boolean' },
          promotionState: {
            type: 'string',
            enum: ['DEVELOPMENT', 'EVALUATION_HOLD', 'QUALIFIED', 'REVOKED'],
          },
        },
      },
      RerankExecutionReceipt: {
        type: 'object',
        required: ['backendId', 'modelId', 'promotionState', 'implementationKind', 'fallback'],
        properties: {
          backendId: { type: 'string' },
          modelId: { type: 'string', const: 'lexical-overlap-v1' },
          modelRevision: { type: 'string' },
          artifactSetDigest: { type: 'string', pattern: '^[a-fA-F0-9]{64}$' },
          promotionState: {
            type: 'string',
            enum: ['DEVELOPMENT', 'EVALUATION_HOLD', 'QUALIFIED', 'REVOKED'],
          },
          implementationKind: { type: 'string', const: 'lexical-overlap' },
          fallback: { type: 'boolean' },
          fallbackReason: { type: 'string', enum: ['forced', 'primary-error'] },
        },
      },
      CasAsset: {
        type: 'object',
        required: ['assetId', 'uri', 'sha256', 'mediaType', 'byteLength', 'modality'],
        properties: {
          assetId: { type: 'string' },
          uri: { type: 'string', pattern: '^cas://sha256/[a-fA-F0-9]{64}$' },
          sha256: { type: 'string', pattern: '^[a-fA-F0-9]{64}$' },
          mediaType: { type: 'string' },
          byteLength: { type: 'integer', minimum: 0 },
          modality: {
            type: 'string',
            enum: ['image', 'visual_document', 'audio', 'video'],
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Liveness check',
        security: [],
        responses: { 200: { description: 'Service is healthy' } },
      },
    },
    '/metrics': {
      get: {
        summary: 'Prometheus metrics exposition',
        security: [],
        responses: { 200: { description: 'Prometheus text metrics' } },
      },
    },
    '/v1/embed': {
      post: {
        summary: 'Embed text with an admitted backend and return its execution receipt',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['requestId', 'tenantId', 'texts'],
                properties: {
                  requestId: { type: 'string' },
                  tenantId: { type: 'string' },
                  profileId: { type: 'string' },
                  texts: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 512 },
                  model: { type: 'string' },
                  modelRevision: { type: 'string' },
                  normalize: { type: 'boolean', default: true },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Vectors plus execution receipt' },
          400: { description: 'Validation error' },
          409: { description: 'Requested model identity is not admitted' },
          503: {
            description:
              'Production embedder or durable tamper-evident evidence ledger is not admitted',
          },
        },
      },
    },
    '/v1/multimodal/health': {
      get: {
        summary: 'Readiness of the exact-revision multimodal evaluation runtime',
        responses: {
          200: { description: 'Runtime is reachable' },
          503: { description: 'Runtime is absent or unavailable' },
        },
      },
    },
    '/v1/multimodal/embed': {
      post: {
        summary: 'Embed text, image, visual-document, audio, video, or interleaved evidence',
        description:
          'Evaluation-only until a Forge qualification receipt promotes the exact model revision. Media must be immutable CAS references. Only the native 2048-dimensional space is admitted.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['requestId', 'tenantId', 'modelId', 'modelRevision', 'items'],
                properties: {
                  requestId: { type: 'string' },
                  tenantId: { type: 'string' },
                  profileId: { type: 'string' },
                  modelId: { type: 'string' },
                  modelRevision: { type: 'string' },
                  dimensions: { type: 'integer', enum: [2048, 1024, 512, 256, 128], default: 2048 },
                  normalize: { type: 'boolean', const: true, default: true },
                  items: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 32,
                    items: {
                      type: 'object',
                      required: ['itemId', 'instruction', 'segments'],
                      properties: {
                        itemId: { type: 'string' },
                        instruction: { type: 'string' },
                        segments: {
                          type: 'array',
                          minItems: 1,
                          items: {
                            oneOf: [
                              {
                                type: 'object',
                                required: ['kind', 'text'],
                                properties: { kind: { const: 'text' }, text: { type: 'string' } },
                              },
                              {
                                type: 'object',
                                required: ['kind', 'asset'],
                                properties: {
                                  kind: { const: 'asset' },
                                  asset: { $ref: '#/components/schemas/CasAsset' },
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Receipt-bound multimodal vectors' },
          400: { description: 'Validation error' },
          409: { description: 'Model revision or projection is not admitted' },
          503: {
            description: 'Runtime/model is not qualified or the production evidence ledger is held',
          },
        },
      },
    },
    '/v1/rerank': {
      post: {
        summary: 'Rerank candidates with a server-owned implementation identity',
        description:
          'Returns an execution receipt. Deterministic fallback is development/test-only; production is disabled unless a qualified immutable backend is configured.',
        responses: {
          200: { description: 'Reranked results plus execution receipt' },
          400: { description: 'Validation error or duplicate candidate identity' },
          502: { description: 'Configured reranker unavailable or returned invalid evidence' },
          503: {
            description:
              'Reranking is disabled, its configuration is not admitted, or the production evidence ledger is held',
          },
        },
      },
    },
    '/v1/hybrid-search': {
      post: {
        summary: 'Hybrid dense and keyword search with optional reranking',
        responses: {
          200: { description: 'Ranked results with embedding and optional rerank evidence' },
          502: { description: 'Embedding, retrieval, or requested rerank backend unavailable' },
          503: {
            description:
              'Production model, durable retrieval store, or durable evidence ledger is not admitted',
          },
        },
      },
    },
    '/v1/ingest': {
      post: {
        summary: 'Ingest documents',
        responses: {
          200: { description: 'Development ingest completed' },
          207: { description: 'Development ingest completed with per-document failures' },
          503: { description: 'Production durability admission hold' },
        },
      },
    },
    '/v1/index/rebuild': {
      post: {
        summary: 'Trigger index rebuild',
        responses: {
          202: { description: 'Development workflow queued' },
          503: { description: 'Production durability admission hold' },
        },
      },
    },
    '/v1/index/verify': {
      post: {
        summary: 'Verify index integrity',
        responses: {
          200: { description: 'Development workflow result' },
          503: { description: 'Production durability admission hold' },
        },
      },
    },
    '/v1/evals/run': {
      post: {
        summary: 'Run an evaluation suite',
        responses: {
          200: { description: 'Development workflow result' },
          503: { description: 'Production durability admission hold' },
        },
      },
    },
    '/v1/openai/embeddings': {
      post: {
        summary: 'OpenAI-compatible text embeddings endpoint',
        responses: { 200: { description: 'OpenAI-format vectors with AEF receipt extensions' } },
      },
    },
  },
};
