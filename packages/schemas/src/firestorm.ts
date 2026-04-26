/**
 * Aegis / Aegis security operations domain schemas.
 */
import { z } from 'zod';

export const severitySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type Severity = z.infer<typeof severitySchema>;

export const threatSchema = z.object({
  id: z.number().int().positive(),
  source: z.string().min(1).max(256),
  severity: severitySchema,
  mitreTechnique: z.string().optional(),
  status: z.enum(['active', 'contained', 'resolved', 'false_positive']),
  orgId: z.number().int().positive().optional(),
  detectedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable().optional(),
});
export type Threat = z.infer<typeof threatSchema>;

export const incidentSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(512),
  severity: severitySchema,
  status: z.enum(['open', 'investigating', 'contained', 'resolved', 'post_mortem']),
  assignedTo: z.number().int().positive().nullable().optional(),
  orgId: z.number().int().positive().optional(),
  openedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable().optional(),
});
export type Incident = z.infer<typeof incidentSchema>;

export const vulnerabilitySchema = z.object({
  id: z.number().int().positive(),
  cveId: z
    .string()
    .regex(/^CVE-\d{4}-\d{4,}$/)
    .optional(),
  title: z.string().min(1).max(512),
  severity: severitySchema,
  cvssScore: z.number().min(0).max(10).optional(),
  affectedAssets: z.array(z.string()).optional(),
  status: z.enum(['open', 'in_remediation', 'remediated', 'accepted_risk', 'wont_fix']),
  orgId: z.number().int().positive().optional(),
  discoveredAt: z.coerce.date(),
  remediatedAt: z.coerce.date().nullable().optional(),
});
export type Vulnerability = z.infer<typeof vulnerabilitySchema>;

export const playbookRunSchema = z.object({
  id: z.number().int().positive(),
  playbookId: z.number().int().positive(),
  incidentId: z.number().int().positive().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'aborted']),
  triggeredBy: z.number().int().positive().optional(),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable().optional(),
});
export type PlaybookRun = z.infer<typeof playbookRunSchema>;
