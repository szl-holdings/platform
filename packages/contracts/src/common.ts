/**
 * Common request/response primitives used across all API contracts.
 */
import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  cursor: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type IdParam = z.infer<typeof idParamSchema>;

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(128),
});

export const errorEnvelopeSchema = z.object({
  error: z.string(),
  code: z.string(),
  requestId: z.string(),
  correlationId: z.string().optional(),
  details: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export const successEnvelopeSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data,
    meta: z
      .object({
        page: z.number().int().optional(),
        limit: z.number().int().optional(),
        total: z.number().int().optional(),
        hasMore: z.boolean().optional(),
      })
      .optional(),
  });

export const orgIdSchema = z.object({
  orgId: z.coerce.number().int().positive(),
});

export const timestampsSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const sortQuerySchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Build a request-body schema for routes whose handler reads a known set of
 * fields off req.body. The shape declares which fields the handler depends on
 * (so they appear in the contract) while still accepting unknown extras
 * (passthrough) for forward compatibility. Null/undefined bodies are coerced
 * to an empty object so optional fields validate cleanly.
 *
 * Use this in place of the deprecated catch-all `jsonObjectBodySchema` so the
 * route's contract is self-documenting and type-inferable.
 */
export function bodyShape<T extends z.ZodRawShape>(shape: T) {
  return z.preprocess(
    (val) => (val == null ? {} : val),
    z.object(shape).passthrough(),
  ) as z.ZodType<z.infer<z.ZodObject<T>> & Record<string, unknown>>;
}

/**
 * Build a query-string schema for routes that read a known set of query
 * parameters. Like {@link bodyShape}, declared fields participate in the
 * contract while extras are passed through.
 */
export function queryShape<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).passthrough() as z.ZodType<
    z.infer<z.ZodObject<T>> & Record<string, unknown>
  >;
}
