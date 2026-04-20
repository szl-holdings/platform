import { z } from "zod";

export const DenseBackendKindSchema = z.enum(["pgvector", "qdrant", "weaviate", "pinecone", "stub"]);
export type DenseBackendKind = z.infer<typeof DenseBackendKindSchema>;

export const KeywordBackendKindSchema = z.enum(["pg-tsvector", "elasticsearch", "opensearch", "stub"]);
export type KeywordBackendKind = z.infer<typeof KeywordBackendKindSchema>;

export const RerankBackendKindSchema = z.enum(["cross-encoder-http", "stub"]);
export type RerankBackendKind = z.infer<typeof RerankBackendKindSchema>;

export const BackendDescriptorSchema = z.object({
  backendId: z.string().min(1),
  displayName: z.string(),
  denseKind: DenseBackendKindSchema,
  keywordKind: KeywordBackendKindSchema,
  rerankKind: RerankBackendKindSchema.optional(),
  embeddingModel: z.string().optional(),
  dimensions: z.number().int().positive().optional(),
  baseUrl: z.string().url().optional(),
  healthPath: z.string().default("/health"),
  metadata: z.record(z.unknown()).default({}),
});
export type BackendDescriptor = z.infer<typeof BackendDescriptorSchema>;
