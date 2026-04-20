/**
 * Core entity schemas shared across the platform.
 */
import { z } from "zod";

export const orgSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(256),
  slug: z.string().min(2).max(128),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  plan: z.enum(["free", "starter", "professional", "enterprise"]).optional(),
  logoUrl: z.string().url().nullable().optional(),
  domain: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});
export type Org = z.infer<typeof orgSchema>;

export const userSummarySchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable().optional(),
  platformRole: z.string().optional(),
});
export type UserSummary = z.infer<typeof userSummarySchema>;

export const auditEventSchema = z.object({
  id: z.number().int().positive(),
  organizationId: z.number().int().nullable().optional(),
  actorUserId: z.number().int().nullable().optional(),
  actionType: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable().optional(),
  payloadJson: z.record(z.unknown()).nullable().optional(),
  createdAt: z.coerce.date(),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

export const canonicalEntityTypeSchema = z.enum([
  "vessel",
  "property",
  "agent",
  "model",
  "supplier",
  "matter",
  "incident",
  "workflow",
  "organization",
  "user",
]);
export type CanonicalEntityType = z.infer<typeof canonicalEntityTypeSchema>;

export const correlatedEventSchema = z.object({
  correlationId: z.string().uuid(),
  requestId: z.string().uuid().optional(),
  orgId: z.number().int().positive().optional(),
  eventType: z.string(),
  payload: z.record(z.unknown()).optional(),
  timestamp: z.coerce.date(),
});
export type CorrelatedEvent = z.infer<typeof correlatedEventSchema>;
