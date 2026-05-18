/**
 * Zod schemas mirroring `./contracts.ts`. Used by the api-server to
 * validate sidecar registration payloads and run responses.
 */
import { z } from 'zod';

export const detectorKindSchema = z.enum([
  'heuristic',
  'signature',
  'statistical',
  'ml',
  'correlation',
]);

export const detectorRuntimeSchema = z.enum(['ts', 'python']);

export const costClassSchema = z.enum(['free', 'cheap', 'moderate', 'expensive']);

export const governanceClassSchema = z.enum([
  'read-only',
  'advisory',
  'mutating',
  'auto-remediable',
]);

export const findingSeveritySchema = z.enum([
  'critical',
  'high',
  'medium',
  'low',
  'info',
]);

export const detectorManifestSchema = z.object({
  id: z.string().min(1).max(200),
  label: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  kind: detectorKindSchema,
  runtime: detectorRuntimeSchema,
  inputs: z.array(z.string()).default([]),
  costClass: costClassSchema,
  governanceClass: governanceClassSchema,
  attackTechniques: z.array(z.string()).optional(),
  version: z.string().optional(),
});

export const findingSchema = z.object({
  id: z.string().min(1),
  detectorId: z.string().min(1),
  runId: z.string().min(1),
  severity: findingSeveritySchema,
  score: z.number().min(0).max(1),
  title: z.string().min(1).max(300),
  summary: z.string().min(1).max(2000),
  attackTechniques: z.array(z.string()).optional(),
  affectedAssets: z.array(z.string()).default([]),
  evidence: z.record(z.string(), z.unknown()).default({}),
  recommendedAction: z
    .object({
      kind: z.enum(['patch', 'block', 'quarantine', 'investigate', 'tune']),
      detail: z.string(),
    })
    .optional(),
  emittedAt: z.string(),
  governanceClass: governanceClassSchema,
});

/** Sidecar wire protocol — request/response envelopes. */
export const sidecarRegisterRequestSchema = z.object({
  sidecarId: z.string().min(1),
  baseUrl: z.string().url(),
  detectors: z.array(detectorManifestSchema).min(1),
});

export const sidecarRunRequestSchema = z.object({
  detectorId: z.string().min(1),
  runId: z.string().min(1),
  triggeredBy: z.string().default('system'),
  startedAt: z.string(),
  params: z.record(z.string(), z.unknown()).default({}),
  /** Pre-fetched input rows keyed by input name. */
  inputs: z.record(z.string(), z.array(z.unknown())).default({}),
});

export const sidecarRunResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  findings: z.array(findingSchema).default([]),
  trace: z
    .array(
      z.object({
        ts: z.string(),
        msg: z.string(),
        data: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .default([]),
  errorMessage: z.string().optional(),
});

export type SidecarRegisterRequest = z.infer<typeof sidecarRegisterRequestSchema>;
export type SidecarRunRequest = z.infer<typeof sidecarRunRequestSchema>;
export type SidecarRunResponse = z.infer<typeof sidecarRunResponseSchema>;
