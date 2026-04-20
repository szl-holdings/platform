export { ingestTerraProperty } from '@szl-holdings/ai-engine/domain-embedding-hooks';
export {
  auditLogsTable,
  db,
  type InsertTerraDeal,
  type InsertTerraLead,
  pool,
  terraDealsTable,
  terraDistressPropertiesTable,
  terraLeadsTable,
  terraSavedOpportunitiesTable,
} from '@szl-holdings/db';
export { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
export { z } from 'zod';
export { handleRouteError, sendBadRequest, sendSuccess } from '../../lib/api-response';
export { logger } from '../../lib/logger';
export { broadcastWs, pubsub, TERRA_EVENTS } from '../../lib/pubsub-bridge.js';
export { scoreDistressProperty } from '../../lib/terra-ai-scoring';
export { authMiddleware } from '../../middlewares/auth';

import { auditLogsTable, db } from '@szl-holdings/db';
import { z } from 'zod';

export const CreateLeadSchema = z.object({
  firstName: z.string().min(1, 'firstName is required'),
  lastName: z.string().min(1, 'lastName is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  type: z.enum(['buyer', 'seller', 'investor', 'both']).optional(),
  source: z.string().optional(),
  stage: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  conversionProbability: z.number().min(0).max(1).optional(),
  ownerName: z.string().optional().nullable(),
  ownerUserId: z.number().int().optional().nullable(),
  nextFollowUp: z.string().optional().nullable(),
  distressPropertyId: z.number().int().optional().nullable(),
  distressPropertyExternalId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  nextAction: z.string().optional(),
});

export const DEAL_STAGES = [
  'lead',
  'qualified',
  'showing',
  'offer',
  'negotiation',
  'accepted',
  'inspection',
  'financing',
  'under-contract',
  'clear-to-close',
  'closed',
  'lost',
] as const;
export const DEAL_TYPES = ['acquisition', 'disposition', 'refinance', 'development'] as const;
export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export const CreateDealSchema = z.object({
  address: z.string().min(1, 'address is required'),
  title: z.string().optional(),
  leadId: z.union([z.number().int(), z.string()]).optional().nullable(),
  propertyAddress: z.string().optional().nullable(),
  borough: z.string().optional().nullable(),
  county: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  askingPrice: z.number().optional().nullable(),
  offerPrice: z.number().optional().nullable(),
  price: z.number().optional().nullable(),
  arv: z.number().optional().nullable(),
  probability: z.number().min(0).max(100).optional().nullable(),
  stage: z.enum(DEAL_STAGES).optional().default('lead'),
  type: z.enum(DEAL_TYPES).optional().default('acquisition'),
  riskLevel: z.enum(RISK_LEVELS).optional().default('medium'),
  closeDate: z.string().optional().nullable(),
  estimatedCloseDate: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  ownerUserId: z.number().int().optional().nullable(),
  clientName: z.string().optional().nullable(),
  distressPropertyId: z.number().int().optional().nullable(),
  distressPropertyExternalId: z.string().optional().nullable(),
});

export const SaveOpportunitySchema = z.object({
  propertyId: z.union([z.string().min(1), z.number()], { message: 'propertyId is required' }),
  note: z.string().optional().nullable(),
});

export const UpdateLeadSchema = z.object({
  stage: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  nextFollowUp: z.string().optional().nullable(),
  nextAction: z.string().optional(),
  notes: z.string().optional().nullable(),
  lastContact: z.string().optional(),
  addNote: z.string().optional(),
  timelineEvent: z.string().optional(),
  timelineType: z.string().optional(),
});

export const ConvertDistressToLeadSchema = z.object({
  propertyId: z.union([z.string().min(1), z.number()], { message: 'propertyId is required' }),
  ownerName: z.string().optional().nullable(),
  ownerUserId: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const ConvertLeadToDealSchema = z.object({
  leadId: z.union([z.string().min(1), z.number()], { message: 'leadId is required' }),
  dealTitle: z.string().optional(),
  stage: z.string().optional(),
  price: z.number().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  ownerUserId: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdateDealStageSchema = z.object({
  stage: z.enum(DEAL_STAGES, {
    errorMap: () => ({ message: `Invalid stage. Valid: ${DEAL_STAGES.join(', ')}` }),
  }),
  notes: z.string().optional(),
});

export async function auditLog(
  actionType: string,
  entityType: string,
  entityId?: string,
  payload?: Record<string, unknown>,
  actorUserId?: number,
) {
  try {
    await db.insert(auditLogsTable).values({
      actionType,
      entityType,
      entityId,
      payloadJson: payload ?? {},
      actorUserId,
    });
  } catch {
    /* non-fatal */
  }
}

export function nowStr() {
  return new Date().toISOString().slice(0, 10);
}
