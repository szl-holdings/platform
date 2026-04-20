export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Alloy Embedding Fabric API",
    version: "0.1.0",
    description:
      "REST gateway for AEF: embed, rerank, hybrid-search, ingest, index operations, and evals. " +
      "All retrieval paths write an evidence entry and return it in the response.",
  },
  servers: [{ url: "/alloy-embedding-api", description: "AEF API" }],
  security: [{ BearerAuth: [] }],
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer" },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Liveness & backend health check",
        security: [],
        responses: {
          200: { description: "Service is healthy" },
        },
      },
    },
    "/metrics": {
      get: {
        summary: "Prometheus metrics exposition",
        security: [],
        responses: {
          200: { description: "Prometheus text format metrics" },
        },
      },
    },
    "/v1/embed": {
      post: {
        summary: "Embed texts into dense vectors",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["requestId", "tenantId", "texts"],
                properties: {
                  requestId: { type: "string" },
                  tenantId: { type: "string" },
                  profileId: { type: "string" },
                  texts: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 512 },
                  model: { type: "string" },
                  normalize: { type: "boolean", default: true },
                  metadata: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Embedding vectors returned" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    "/v1/rerank": {
      post: {
        summary: "Rerank candidate documents",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["requestId", "tenantId", "query", "candidates"],
                properties: {
                  requestId: { type: "string" },
                  tenantId: { type: "string" },
                  query: { type: "string" },
                  candidates: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["id", "text"],
                      properties: {
                        id: { type: "string" },
                        text: { type: "string" },
                        score: { type: "number" },
                        metadata: { type: "object" },
                      },
                    },
                  },
                  topK: { type: "integer", default: 10 },
                  model: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Reranked results" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/v1/hybrid-search": {
      post: {
        summary: "Hybrid dense+keyword search with optional reranking",
        responses: {
          200: { description: "Ranked search results with evidence" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/v1/ingest": {
      post: {
        summary: "Ingest documents for Phase 4 processing",
        responses: {
          202: { description: "Ingest payload accepted and persisted for Phase 4 orchestration" },
        },
      },
    },
    "/v1/index/rebuild": {
      post: {
        summary: "Trigger an index rebuild job",
        responses: {
          202: { description: "Rebuild job queued" },
        },
      },
    },
    "/v1/index/verify": {
      post: {
        summary: "Verify index integrity",
        responses: {
          200: { description: "Verification result" },
        },
      },
    },
    "/v1/evals/run": {
      post: {
        summary: "Run an eval suite (returns 'not yet configured' when no harness is registered)",
        responses: {
          200: { description: "Eval result or not-yet-configured response" },
        },
      },
    },
    "/v1/openai/embeddings": {
      post: {
        summary: "OpenAI-compatible embeddings endpoint",
        responses: {
          200: { description: "OpenAI-format embedding response" },
        },
      },
    },
  },
};
