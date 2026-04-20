import { z } from "zod";
import { TenantIdSchema } from "./tenant.js";

export const IngestDocumentSchema = z.object({
  sourceId: z.string().min(1),
  sourceUri: z.string().optional(),
  title: z.string().optional(),
  content: z.string().min(1),
  contentType: z.enum(["text/plain", "text/markdown", "application/pdf", "text/html"]).default("text/plain"),
  metadata: z.record(z.unknown()).default({}),
  profileId: z.string().optional(),
});
export type IngestDocument = z.infer<typeof IngestDocumentSchema>;

export const IngestRequestSchema = z.object({
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  documents: z.array(IngestDocumentSchema).min(1).max(256),
  chunkSize: z.number().int().positive().default(512),
  chunkOverlap: z.number().int().nonnegative().default(64),
  model: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type IngestRequest = z.infer<typeof IngestRequestSchema>;

export const IngestResultSchema = z.object({
  sourceId: z.string(),
  chunksProduced: z.number().int().nonnegative(),
  chunksIndexed: z.number().int().nonnegative(),
  error: z.string().optional(),
});
export type IngestResult = z.infer<typeof IngestResultSchema>;

export const IngestResponseSchema = z.object({
  requestId: z.string(),
  tenantId: TenantIdSchema,
  results: z.array(IngestResultSchema),
  totalChunksIndexed: z.number().int().nonnegative(),
  processingMs: z.number().nonnegative().optional(),
});
export type IngestResponse = z.infer<typeof IngestResponseSchema>;
