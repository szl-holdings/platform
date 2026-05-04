/**
 * GraphQL domain — Model Passport Registry
 *
 * Queries:
 *   modelPassports(lane, tier, state, tenantId, limit) → [ModelPassport!]!
 *   modelPassport(id) → ModelPassport
 *   resolveModelPassport(lane, budgetUsdPerCall, slaP95Ms, tenantId) → PassportResolution
 *
 * Mutations:
 *   verifyModelPassport(id) → PassportVerifyResult!
 *   transitionModelPassportState(id, state, reason) → ModelPassport!
 */

import { db, modelPassportsTable } from '@szl-holdings/db';
import {
  computeSignatureDigest,
  resolvePassport,
  verifyAndSummarize,
  type PassportResolverQuery,
  type SignedModelPassport,
} from '@szl-holdings/model-passport';
import { and, eq, isNull, or } from 'drizzle-orm';
import type { GraphQLContext } from '../index.js';
import { logger } from '../../lib/logger.js';

export const modelPassportsTypeDefs = /* GraphQL */ `
  type ModelPassportCostProfile {
    costPer1kTokensUsd: Float!
    p50LatencyMs: Int
    p95LatencyMs: Int
    evalPassRate: Float
  }

  type ModelPassportPolicyEnvelope {
    autonomyTier: String!
    allowedDomains: [String!]!
    piiHandling: String!
    escalationRules: [String!]!
    jurisdictions: [String!]!
    maxBudgetUsdPerCall: Float
  }

  type ModelPassportDowngradeEntry {
    passportId: String!
    displayName: String!
    reason: String!
  }

  type ModelPassport {
    id: String!
    displayName: String!
    provider: String!
    providerModelId: String!
    quantTier: String!
    lanes: [String!]!
    state: String!
    signatureDigest: String!
    provenanceHash: String!
    autonomyTier: String!
    costProfile: ModelPassportCostProfile
    policyEnvelope: ModelPassportPolicyEnvelope
    downgradeTo: [ModelPassportDowngradeEntry!]!
    tenantId: Int
    createdAt: String!
    updatedAt: String!
  }

  type PassportResolution {
    resolved: Boolean!
    passportId: String
    signatureDigest: String
    displayName: String
    model: String
    provider: String
    quantTier: String
    autonomyTier: String
    costPer1kTokensUsd: Float
    p95LatencyMs: Int
    evalPassRate: Float
    reason: String
  }

  type PassportVerifyResult {
    passportId: String!
    signatureDigest: String!
    valid: Boolean!
    signatureOk: Boolean!
    hashOk: Boolean!
    stateOk: Boolean!
    errors: [String!]!
    verifiedAt: String!
  }

  extend type Query {
    modelPassports(
      lane: String
      tier: String
      state: String
      tenantId: Int
      limit: Int
    ): [ModelPassport!]!

    modelPassport(id: String!): ModelPassport

    resolveModelPassport(
      lane: String!
      budgetUsdPerCall: Float
      slaP95Ms: Int
      tenantId: Int
    ): PassportResolution!
  }

  extend type Mutation {
    verifyModelPassport(id: String!): PassportVerifyResult!

    transitionModelPassportState(
      id: String!
      state: String!
      reason: String
    ): ModelPassport!
  }
`;

function rowToGql(row: typeof modelPassportsTable.$inferSelect) {
  const signed = row.signedJson as unknown as SignedModelPassport;
  return {
    id: row.id,
    displayName: row.displayName,
    provider: row.provider,
    providerModelId: row.providerModelId,
    quantTier: row.quantTier,
    lanes: row.lanes as string[],
    state: row.state,
    signatureDigest: computeSignatureDigest(row.signature),
    provenanceHash: row.provenanceHash,
    autonomyTier: row.autonomyTier,
    tenantId: row.tenantId,
    costProfile: {
      costPer1kTokensUsd: parseFloat(row.costPer1kTokensUsd),
      p50LatencyMs: row.p50LatencyMs,
      p95LatencyMs: row.p95LatencyMs,
      evalPassRate: row.evalPassRate ? parseFloat(row.evalPassRate) : null,
    },
    policyEnvelope: signed.passport.policyEnvelope ?? null,
    downgradeTo: (row.downgradeTo as Array<{ passportId: string; displayName: string; reason: string }>) ?? [],
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export const modelPassportsResolvers = {
  Query: {
    modelPassports: async (
      _: unknown,
      {
        lane,
        tier,
        state,
        tenantId,
        limit = 100,
      }: { lane?: string; tier?: string; state?: string; tenantId?: number; limit?: number },
    ) => {
      try {
        const conditions = [];
        if (state) conditions.push(eq(modelPassportsTable.state, state as 'active' | 'draft' | 'proposed' | 'approved' | 'deprecated' | 'revoked'));
        if (tier) conditions.push(eq(modelPassportsTable.quantTier, tier));
        // Include global passports (tenantId IS NULL) alongside tenant-scoped ones
        // so callers never see an empty list when global passports match the lane.
        if (tenantId != null) {
          conditions.push(
            or(isNull(modelPassportsTable.tenantId), eq(modelPassportsTable.tenantId, tenantId)),
          );
        }

        let query = db.select().from(modelPassportsTable).$dynamic();
        if (conditions.length > 0) query = query.where(and(...conditions));

        const rows = await query.limit(Math.min(limit, 500));
        let result = rows.map(rowToGql);

        if (lane) result = result.filter((r) => (r.lanes as string[]).includes(lane));

        return result;
      } catch (err) {
        logger.error({ err }, 'GraphQL modelPassports error');
        return [];
      }
    },

    modelPassport: async (_: unknown, { id }: { id: string }) => {
      try {
        const [row] = await db
          .select()
          .from(modelPassportsTable)
          .where(eq(modelPassportsTable.id, id))
          .limit(1);
        return row ? rowToGql(row) : null;
      } catch (err) {
        logger.error({ err }, 'GraphQL modelPassport error');
        return null;
      }
    },

    resolveModelPassport: async (
      _: unknown,
      {
        lane,
        budgetUsdPerCall,
        slaP95Ms,
        tenantId,
      }: { lane: string; budgetUsdPerCall?: number; slaP95Ms?: number; tenantId?: number },
    ) => {
      try {
        const query: PassportResolverQuery = {
          lane: lane as PassportResolverQuery['lane'],
          budgetUsdPerCall,
          slaP95Ms,
          tenantId,
        };

        const store = {
          listActive: async () => {
            const tenantFilter =
              tenantId != null
                ? or(isNull(modelPassportsTable.tenantId), eq(modelPassportsTable.tenantId, tenantId))
                : isNull(modelPassportsTable.tenantId);
            const rows = await db
              .select()
              .from(modelPassportsTable)
              .where(and(eq(modelPassportsTable.state, 'active'), tenantFilter));
            return rows.map((r) => r.signedJson as unknown as SignedModelPassport);
          },
          getById: async (pid: string) => {
            const [row] = await db
              .select()
              .from(modelPassportsTable)
              .where(and(eq(modelPassportsTable.id, pid), eq(modelPassportsTable.state, 'active')))
              .limit(1);
            return row ? (row.signedJson as unknown as SignedModelPassport) : null;
          },
        };

        const result = await resolvePassport(query, store);
        if (!result) {
          return { resolved: false, reason: 'No matching active passport found' };
        }

        const p = result.passport.passport;
        return {
          resolved: true,
          passportId: result.passportId,
          signatureDigest: result.signatureDigest,
          displayName: p.identity.displayName,
          model: p.identity.providerModelId,
          provider: p.identity.provider,
          quantTier: p.quantProfile.tier,
          autonomyTier: p.policyEnvelope.autonomyTier,
          costPer1kTokensUsd: p.costProfile.costPer1kTokensUsd,
          p95LatencyMs: p.costProfile.p95LatencyMs,
          evalPassRate: p.costProfile.evalPassRate,
          reason: null,
        };
      } catch (err) {
        logger.error({ err }, 'GraphQL resolveModelPassport error');
        return { resolved: false, reason: 'Resolver error' };
      }
    },
  },

  Mutation: {
    verifyModelPassport: async (_: unknown, { id }: { id: string }) => {
      const [row] = await db
        .select()
        .from(modelPassportsTable)
        .where(eq(modelPassportsTable.id, id))
        .limit(1);

      if (!row) throw new Error(`Passport '${id}' not found`);

      const signed = row.signedJson as unknown as SignedModelPassport;
      const result = verifyAndSummarize(signed);
      const signatureDigest = computeSignatureDigest(row.signature);

      return {
        passportId: row.id,
        signatureDigest,
        ...result,
        verifiedAt: new Date().toISOString(),
      };
    },

    transitionModelPassportState: async (
      _: unknown,
      { id, state, reason }: { id: string; state: string; reason?: string },
      context: GraphQLContext,
    ) => {
      const VALID_STATES = ['draft', 'proposed', 'approved', 'active', 'deprecated', 'revoked'];
      if (!VALID_STATES.includes(state)) throw new Error(`Invalid state: ${state}`);

      // Role gate: passport state transitions require an elevated role.
      const userRoles = context?.req?.user?.roles ?? [];
      const PERMITTED_ROLES = ['ops', 'admin', 'super_admin', 'approver'];
      if (!userRoles.some((r) => PERMITTED_ROLES.includes(r))) {
        throw new Error('Insufficient privileges — passport state transitions require ops or admin role');
      }

      const [existing] = await db
        .select()
        .from(modelPassportsTable)
        .where(eq(modelPassportsTable.id, id))
        .limit(1);

      if (!existing) throw new Error(`Passport '${id}' not found`);

      // Covenant Policy gate for high-risk transitions (active/revoked).
      const HIGH_RISK: Set<string> = new Set(['active', 'revoked']);
      if (HIGH_RISK.has(state)) {
        const { covenantEngine, createApprovalRequest } = await import('@szl-holdings/covenant-policy');
        const userId = context?.req?.user?.id;
        const tenantId = context?.req?.user?.orgs?.[0]?.orgId;

        const decision = covenantEngine.evaluate({
          subject: {
            roles: userRoles as string[],
            userId: String(userId ?? ''),
            tenantId: String(tenantId ?? ''),
            attributes: {},
          },
          resource: {
            type: 'model_passport',
            id,
            domain: null,
            actionClass: `state_transition.${state}`,
            attributes: { fromState: existing.state, toState: state },
          },
          action: 'model_passport.transition',
          context: { reason },
        });

        if (decision.effect === 'deny') {
          throw new Error(decision.reason ?? `Covenant policy denied state transition to '${state}'`);
        }

        const isApprover = userRoles.some((r) => ['admin', 'super_admin', 'approver'].includes(r));
        if (decision.effect === 'escalate' || !isApprover) {
          const approval = await createApprovalRequest({
            orgId: tenantId ?? null,
            resourceType: 'model_passport.state',
            resourceId: id,
            title: `Passport state transition to '${state}': ${existing.displayName}`,
            description: reason ?? `GraphQL transition from '${existing.state}' to '${state}'`,
            actionClass: 'model_governance',
            priority: state === 'revoked' ? 'critical' : 'high',
            requestedById: typeof userId === 'number' ? userId : null,
            requestedByRole: userRoles[0],
            requiredApproverRole: 'approver',
            correlationId: id,
            serviceAttribution: 'model-passport.graphql.state-transition',
            payload: { passportId: id, fromState: existing.state, toState: state, reason, covenantDecision: decision.effect },
          });
          // Return a synthetic passport-like object indicating the pending state.
          return {
            ...rowToGql(existing),
            state: 'pending_approval',
            approvalRequestId: approval.id,
          };
        }
        // decision.effect === 'permit' and isApprover — fall through to execute.
      }

      const updateData: Partial<typeof modelPassportsTable.$inferInsert> = {
        state: state as 'active' | 'draft' | 'proposed' | 'approved' | 'deprecated' | 'revoked',
        updatedAt: new Date(),
      };

      if (state === 'revoked') {
        updateData.revokedAt = new Date();
        updateData.revocationReason = reason ?? 'Revoked via GraphQL';
      }

      await db.update(modelPassportsTable).set(updateData).where(eq(modelPassportsTable.id, id));

      const [updated] = await db
        .select()
        .from(modelPassportsTable)
        .where(eq(modelPassportsTable.id, id))
        .limit(1);

      return rowToGql(updated!);
    },
  },
};
