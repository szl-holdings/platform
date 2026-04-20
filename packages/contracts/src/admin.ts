/**
 * Admin contracts — request/response schemas for admin endpoints.
 */
import { z } from 'zod';
import { paginationQuerySchema } from './common';

export const userListQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  search: z.string().max(256).optional(),
  role: z.string().optional(),
  orgId: z.coerce.number().int().positive().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
});
export type UserListQuery = z.infer<typeof userListQuerySchema>;

export const createTenantBodySchema = z.object({
  name: z.string().min(1).max(256),
  slug: z
    .string()
    .min(2)
    .max(128)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric'),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional().default('free'),
  adminEmail: z.string().email(),
});
export type CreateTenantBody = z.infer<typeof createTenantBodySchema>;

export const backupBodySchema = z.object({
  format: z.enum(['sql', 'json']).optional().default('sql'),
  compress: z.boolean().optional().default(true),
  includeSchema: z.boolean().optional().default(true),
  tables: z.array(z.string()).optional(),
});
export type BackupBody = z.infer<typeof backupBodySchema>;

export const observabilityTimeRangeQuerySchema = z.object({
  window: z.enum(['1h', '6h', '24h', '7d']).optional().default('24h'),
  orgId: z.coerce.number().int().positive().optional(),
});
export type ObservabilityTimeRangeQuery = z.infer<typeof observabilityTimeRangeQuerySchema>;
