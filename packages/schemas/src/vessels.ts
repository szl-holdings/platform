/**
 * SEXTANT maritime intelligence domain schemas.
 */
import { z } from 'zod';

export const vesselSchema = z.object({
  id: z.number().int().positive(),
  imo: z.string().length(7).regex(/^\d+$/, 'IMO must be 7 digits'),
  name: z.string().min(1).max(256),
  flag: z.string().length(2).optional(),
  type: z.string().optional(),
  grossTonnage: z.number().positive().optional(),
  buildYear: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 2)
    .optional(),
  orgId: z.number().int().positive().optional(),
});
export type Vessel = z.infer<typeof vesselSchema>;

export const vesselPositionSchema = z.object({
  vesselId: z.number().int().positive(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  course: z.number().min(0).max(360).optional(),
  navStatus: z.string().optional(),
  timestamp: z.coerce.date(),
  source: z.enum(['ais', 'satellite', 'manual', 'demo']).optional(),
});
export type VesselPosition = z.infer<typeof vesselPositionSchema>;

export const voyageSchema = z.object({
  id: z.number().int().positive(),
  vesselId: z.number().int().positive(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  status: z.enum(['planned', 'underway', 'completed', 'diverted', 'cancelled']),
  departedAt: z.coerce.date().optional(),
  arrivedAt: z.coerce.date().nullable().optional(),
  etaAt: z.coerce.date().nullable().optional(),
});
export type Voyage = z.infer<typeof voyageSchema>;

export const anomalySchema = z.object({
  id: z.number().int().positive(),
  vesselId: z.number().int().positive(),
  voyageId: z.number().int().positive().optional(),
  type: z.enum(['dark_period', 'ais_gap', 'route_deviation', 'suspicious_rendezvous', 'spoofing']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().optional(),
  detectedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable().optional(),
});
export type Anomaly = z.infer<typeof anomalySchema>;

export const sanctionsCheckSchema = z.object({
  id: z.number().int().positive(),
  vesselId: z.number().int().positive(),
  listName: z.string(),
  status: z.enum(['clear', 'flagged', 'under_review']),
  checkedAt: z.coerce.date(),
  details: z.record(z.unknown()).optional(),
});
export type SanctionsCheck = z.infer<typeof sanctionsCheckSchema>;
