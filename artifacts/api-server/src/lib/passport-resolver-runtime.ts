/**
 * Passport Resolver Runtime — bridges the Model Passport registry with the
 * ai-engine model router at boot time.
 *
 * Installed by the API server on startup: registers a PassportResolverFn that
 * queries the live DB, scores active passports against the request criteria,
 * and returns the best match plus its downgrade ladder.
 *
 * The resolver falls back gracefully: if the DB is unavailable or no passport
 * matches, it returns null and the router continues with its static lane→model
 * map — zero behavior change without passports.
 */

import { db, modelPassportsTable } from '@szl-holdings/db';
import {
  computeSignatureDigest,
  resolvePassport,
  verifyPassportSignature,
  type PassportResolverQuery,
  type SignedModelPassport,
} from '@szl-holdings/model-passport';
import {
  registerPassportResolver,
  type PassportResolverInput,
} from '@szl-holdings/ai-engine';
import { and, eq, isNull, or } from 'drizzle-orm';
import { logger } from './logger';

/** Placeholder used by seed passports that have never been signed with a real key. */
const SEED_PLACEHOLDER = 'SEED_PLACEHOLDER_SIGNATURE';

/**
 * Verify the cryptographic integrity of a passport before it can govern routing.
 * Returns false for any passport that:
 *   - carries the seed placeholder signature
 *   - fails Ed25519 signature verification
 *   - has a mismatched provenance hash
 *
 * Passports that fail verification are silently dropped from candidate lists.
 * This guarantees that only genuinely signed artifacts govern live model selection.
 */
function isVerified(signed: SignedModelPassport): boolean {
  if (signed.signature === SEED_PLACEHOLDER || signed.signerPublicKey === SEED_PLACEHOLDER) {
    return false;
  }
  try {
    const { signatureOk, hashOk } = verifyPassportSignature(signed);
    return signatureOk && hashOk;
  } catch {
    return false;
  }
}

async function dbListActive(query: PassportResolverQuery): Promise<SignedModelPassport[]> {
  try {
    // Include global (tenant_id IS NULL) passports for all tenant-scoped queries.
    const tenantFilter =
      query.tenantId != null
        ? or(isNull(modelPassportsTable.tenantId), eq(modelPassportsTable.tenantId, query.tenantId))
        : isNull(modelPassportsTable.tenantId);

    const rows = await db
      .select()
      .from(modelPassportsTable)
      .where(and(eq(modelPassportsTable.state, 'active'), tenantFilter));

    // Only surface passports that pass cryptographic verification.
    // Passports with SEED_PLACEHOLDER_SIGNATURE or invalid Ed25519 signatures
    // are excluded; they may exist in the registry for reference but MUST NOT
    // govern live routing decisions.
    const verified = rows
      .map((r) => r.signedJson as unknown as SignedModelPassport)
      .filter(isVerified);

    return verified;
  } catch {
    return [];
  }
}

async function dbGetById(id: string): Promise<SignedModelPassport | null> {
  try {
    const [row] = await db
      .select()
      .from(modelPassportsTable)
      .where(and(eq(modelPassportsTable.id, id), eq(modelPassportsTable.state, 'active')))
      .limit(1);

    if (!row) return null;
    const signed = row.signedJson as unknown as SignedModelPassport;

    // Reject if signature verification fails.
    if (!isVerified(signed)) {
      logger.warn({ id }, '[passport-resolver] passport failed verification — excluded from routing');
      return null;
    }

    return signed;
  } catch {
    return null;
  }
}

export function installPassportResolver(): void {
  registerPassportResolver(async (input: PassportResolverInput) => {
    try {
      // Downgrade-ladder path: resolve a specific passport by ID directly.
      // This bypasses scoring and returns the named passport as long as it is
      // active and passes signature verification.
      if (input.passportId) {
        const signed = await dbGetById(input.passportId);
        if (!signed) return null;
        return {
          passportId: signed.passport.identity.id,
          signatureDigest: computeSignatureDigest(signed.signature),
          model: signed.passport.identity.providerModelId,
          provider: signed.passport.identity.provider,
          quantTier: signed.passport.quantProfile.tier,
          autonomyTier: signed.passport.policyEnvelope.autonomyTier,
          downgradeLadder: signed.passport.downgradeTo,
        };
      }

      const query: PassportResolverQuery = {
        lane: input.lane as PassportResolverQuery['lane'],
        budgetUsdPerCall: input.budgetUsdPerCall,
        slaP95Ms: input.slaP95Ms,
        tenantId: typeof input.tenantId === 'number' ? input.tenantId : undefined,
        requiredCapabilities: input.requiredCapabilities,
      };

      const result = await resolvePassport(query, {
        listActive: dbListActive,
        getById: dbGetById,
      });

      if (!result) return null;

      return {
        passportId: result.passportId,
        signatureDigest: computeSignatureDigest(result.passport.signature),
        model: result.passport.passport.identity.providerModelId,
        provider: result.passport.passport.identity.provider,
        quantTier: result.passport.passport.quantProfile.tier,
        autonomyTier: result.passport.passport.policyEnvelope.autonomyTier,
        downgradeLadder: result.downgradeLadder,
      };
    } catch (err) {
      logger.debug({ err }, '[passport-resolver] resolver error — falling back to static routing');
      return null;
    }
  });

  logger.info('[passport-resolver] Passport resolver installed — quant-aware routing active');
}
