import { z } from 'zod';
import { TenantIdSchema } from './tenant.js';

export const AefEventKindSchema = z.enum([
  'aef.embed.completed',
  'aef.rerank.completed',
  'aef.search.completed',
  'aef.ingest.completed',
  'aef.index.rebuild.started',
  'aef.index.rebuild.completed',
  'aef.index.verify.completed',
  'aef.policy.denied',
  'aef.evals.run.completed',
]);
export type AefEventKind = z.infer<typeof AefEventKindSchema>;

export const AefEventSchema = z.object({
  eventId: z.string().min(1),
  kind: AefEventKindSchema,
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  profileId: z.string().optional(),
  occurredAt: z.string().datetime(),
  payload: z.record(z.unknown()).default({}),
});
export type AefEvent = z.infer<typeof AefEventSchema>;

export const AefPolicyDeniedPayloadSchema = z.object({
  reasons: z.array(z.string()),
  rule: z.string().optional(),
});
export type AefPolicyDeniedPayload = z.infer<typeof AefPolicyDeniedPayloadSchema>;
