/**
 * DOMAINE real estate intelligence domain schemas.
 */
import { z } from 'zod';

export const propertySchema = z.object({
  id: z.number().int().positive(),
  address: z.string().min(1).max(512),
  blockLot: z.string().optional(),
  borough: z.string().optional(),
  distressScore: z.number().min(0).max(100).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  orgId: z.number().int().positive().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});
export type Property = z.infer<typeof propertySchema>;

export const distressSignalTypeSchema = z.enum([
  'lis_pendens',
  'foreclosure',
  'tax_lien',
  'code_violation',
  'probate',
  'divorce',
  'eviction',
  'judgment',
  'other',
]);

export const distressSignalSchema = z.object({
  id: z.number().int().positive(),
  propertyId: z.number().int().positive(),
  type: distressSignalTypeSchema,
  filingDate: z.coerce.date().optional(),
  source: z.string().optional(),
  liabilityAmount: z.number().positive().optional(),
  notes: z.string().max(2048).optional(),
  createdAt: z.coerce.date(),
});
export type DistressSignal = z.infer<typeof distressSignalSchema>;

export const dealStageSchema = z.enum([
  'lead',
  'contacted',
  'qualified',
  'under_contract',
  'due_diligence',
  'closed',
  'lost',
]);

export const dealSchema = z.object({
  id: z.number().int().positive(),
  propertyId: z.number().int().positive(),
  stage: dealStageSchema,
  value: z.number().positive().optional(),
  brokerId: z.number().int().positive().optional(),
  orgId: z.number().int().positive().optional(),
  closedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});
export type Deal = z.infer<typeof dealSchema>;

export const leadScoreSchema = z.object({
  propertyId: z.number().int().positive(),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  factors: z.record(z.number()).optional(),
  computedAt: z.coerce.date(),
});
export type LeadScore = z.infer<typeof leadScoreSchema>;
