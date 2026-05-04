import type { ModelPassport, PassportDowngradeEntry, PassportResolverQuery, PassportResolverResult, SignedModelPassport } from './types.js';
import { computeSignatureDigest, verifyPassportSignature } from './crypto.js';

export interface PassportStore {
  listActive(query: PassportResolverQuery): Promise<SignedModelPassport[]>;
  getById(id: string): Promise<SignedModelPassport | null>;
}

export function scorePassport(
  passport: ModelPassport,
  query: PassportResolverQuery,
): number {
  let score = 0;

  if (!passport.capabilitySurface.lanes.includes(query.lane)) return -1;

  // Budget gate: ~2k-token call cost vs per-call budget ceiling (same $ units).
  if (
    query.budgetUsdPerCall != null &&
    passport.costProfile.costPer1kTokensUsd * 2 > query.budgetUsdPerCall
  ) {
    score -= 10;
  }

  if (
    query.slaP95Ms != null &&
    passport.costProfile.p95LatencyMs > query.slaP95Ms
  ) {
    score -= 20;
  }

  score += passport.costProfile.evalPassRate * 100;

  score -= (passport.costProfile.costPer1kTokensUsd / 0.01) * 5;

  if (query.requiredCapabilities?.length) {
    const skills = new Set(passport.capabilitySurface.skills);
    const tools = new Set(passport.capabilitySurface.supportedTools);
    for (const cap of query.requiredCapabilities) {
      if (skills.has(cap) || tools.has(cap)) score += 10;
    }
  }

  const tierWeights: Record<string, number> = {
    fp32: 5, fp16: 5, bf16: 5, int8: 3, int4: 1, 'gguf-q8': 4, 'gguf-q5': 3, 'gguf-q4': 2, hosted: 5,
  };
  score += tierWeights[passport.quantProfile.tier] ?? 0;

  return score;
}

export async function resolvePassport(
  query: PassportResolverQuery,
  store: PassportStore,
): Promise<PassportResolverResult | null> {
  const candidates = await store.listActive(query);
  if (candidates.length === 0) return null;

  const scored = candidates
    .map((sp) => ({ sp, score: scorePassport(sp.passport, query) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const best = scored[0]!.sp;
  return {
    passport: best,
    passportId: best.passport.identity.id,
    signatureDigest: computeSignatureDigest(best.signature),
    downgradeLadder: best.passport.downgradeTo,
  };
}

export function buildDowngradeLadder(
  passportId: string,
  allActive: SignedModelPassport[],
): PassportDowngradeEntry[] {
  const passport = allActive.find((p) => p.passport.identity.id === passportId);
  if (!passport) return [];

  const result: PassportDowngradeEntry[] = [];
  const visited = new Set<string>([passportId]);
  let current = passport.passport.downgradeTo;

  while (current.length > 0) {
    const next = current[0]!;
    if (visited.has(next.passportId)) break;
    visited.add(next.passportId);
    result.push(next);

    const nextPassport = allActive.find((p) => p.passport.identity.id === next.passportId);
    if (!nextPassport) break;
    current = nextPassport.passport.downgradeTo;
  }

  return result;
}

export function verifyAndSummarize(signed: SignedModelPassport): {
  valid: boolean;
  signatureOk: boolean;
  hashOk: boolean;
  stateOk: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { signatureOk, hashOk } = verifyPassportSignature(signed);

  if (!signatureOk) errors.push('Ed25519 signature verification failed');
  if (!hashOk) errors.push('Provenance hash mismatch — passport body has been tampered');

  const stateOk = signed.passport.state === 'active';
  if (!stateOk) errors.push(`Passport state is '${signed.passport.state}', expected 'active'`);

  return {
    valid: signatureOk && hashOk && stateOk,
    signatureOk,
    hashOk,
    stateOk,
    errors,
  };
}
