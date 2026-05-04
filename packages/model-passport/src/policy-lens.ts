/**
 * Tenant Policy Lenses — Zero-fork policy overlays
 *
 * A Policy Lens is a partial policy envelope override that a tenant stacks
 * on top of an active passport without creating a new passport per tenant.
 * The resolver merges lens + passport at request time using deterministic
 * precedence rules: a lens may only tighten, never loosen the envelope.
 *
 * Merge semantics:
 *   - autonomyTier: lens wins if stricter (read_only < advisory < supervised < autonomous)
 *   - allowedDomains: intersection of passport ∩ lens (tighten = reduce)
 *   - piiHandling: lens wins if stricter (blocked < redacted < allowed)
 *   - jurisdictions: intersection of passport ∩ lens
 *   - maxBudgetUsdPerCall: min(passport, lens) — lower is stricter
 *   - escalationRules: union (more rules = tighter)
 * Conflicts (lens tries to loosen) are logged and surfaced; the passport's
 * tighter value is kept.
 */

import type { PassportPolicyEnvelope } from './types.js';

export interface PolicyLens {
  lensId: string;
  tenantId: number;
  passportId: string;
  displayName: string;
  description?: string;
  envelope: Partial<PassportPolicyEnvelope>;
  createdAt: string;
  createdBy?: string;
}

export interface LensMergeResult {
  effectiveEnvelope: PassportPolicyEnvelope;
  appliedLenses: string[];
  conflicts: LensMergeConflict[];
}

export interface LensMergeConflict {
  lensId: string;
  field: string;
  passportValue: unknown;
  lensValue: unknown;
  resolution: 'kept_passport' | 'kept_lens';
  reason: string;
}

const AUTONOMY_RANK: Record<string, number> = {
  read_only: 0,
  advisory: 1,
  supervised: 2,
  autonomous: 3,
};

const PII_RANK: Record<string, number> = {
  blocked: 0,
  redacted: 1,
  allowed: 2,
};

export function mergePassportWithLenses(
  baseEnvelope: PassportPolicyEnvelope,
  lenses: PolicyLens[],
): LensMergeResult {
  let effective: PassportPolicyEnvelope = { ...baseEnvelope };
  const appliedLenses: string[] = [];
  const conflicts: LensMergeConflict[] = [];

  for (const lens of lenses) {
    const override = lens.envelope;
    let anyApplied = false;

    if (override.autonomyTier != null) {
      const passportRank = AUTONOMY_RANK[effective.autonomyTier] ?? 3;
      const lensRank = AUTONOMY_RANK[override.autonomyTier] ?? 3;
      if (lensRank < passportRank) {
        effective = { ...effective, autonomyTier: override.autonomyTier };
        anyApplied = true;
      } else if (lensRank > passportRank) {
        conflicts.push({
          lensId: lens.lensId,
          field: 'autonomyTier',
          passportValue: effective.autonomyTier,
          lensValue: override.autonomyTier,
          resolution: 'kept_passport',
          reason: 'Lens attempts to loosen autonomy tier — passport value kept',
        });
      }
    }

    if (override.piiHandling != null) {
      const passportRank = PII_RANK[effective.piiHandling] ?? 2;
      const lensRank = PII_RANK[override.piiHandling] ?? 2;
      if (lensRank < passportRank) {
        effective = { ...effective, piiHandling: override.piiHandling };
        anyApplied = true;
      } else if (lensRank > passportRank) {
        conflicts.push({
          lensId: lens.lensId,
          field: 'piiHandling',
          passportValue: effective.piiHandling,
          lensValue: override.piiHandling,
          resolution: 'kept_passport',
          reason: 'Lens attempts to loosen PII handling — passport value kept',
        });
      }
    }

    if (override.allowedDomains != null && override.allowedDomains.length > 0) {
      if (effective.allowedDomains.includes('*')) {
        effective = { ...effective, allowedDomains: override.allowedDomains };
        anyApplied = true;
      } else {
        const intersection = effective.allowedDomains.filter(
          (d) => override.allowedDomains!.includes(d) || override.allowedDomains!.includes('*'),
        );
        if (intersection.length < effective.allowedDomains.length) {
          effective = { ...effective, allowedDomains: intersection };
          anyApplied = true;
        } else if (
          override.allowedDomains.some((d) => !effective.allowedDomains.includes(d) && d !== '*')
        ) {
          conflicts.push({
            lensId: lens.lensId,
            field: 'allowedDomains',
            passportValue: effective.allowedDomains,
            lensValue: override.allowedDomains,
            resolution: 'kept_passport',
            reason: 'Lens attempts to add domains not in passport — intersection kept',
          });
        }
      }
    }

    if (override.jurisdictions != null && override.jurisdictions.length > 0) {
      if (effective.jurisdictions.length === 0) {
        effective = { ...effective, jurisdictions: override.jurisdictions };
        anyApplied = true;
      } else {
        const intersection = effective.jurisdictions.filter((j) =>
          override.jurisdictions!.includes(j),
        );
        if (intersection.length < effective.jurisdictions.length) {
          effective = { ...effective, jurisdictions: intersection };
          anyApplied = true;
        }
      }
    }

    if (override.maxBudgetUsdPerCall != null) {
      const passportBudget = effective.maxBudgetUsdPerCall ?? Infinity;
      const lensBudget = override.maxBudgetUsdPerCall;
      if (lensBudget < passportBudget) {
        effective = { ...effective, maxBudgetUsdPerCall: lensBudget };
        anyApplied = true;
      } else if (lensBudget > passportBudget) {
        conflicts.push({
          lensId: lens.lensId,
          field: 'maxBudgetUsdPerCall',
          passportValue: passportBudget,
          lensValue: lensBudget,
          resolution: 'kept_passport',
          reason: 'Lens attempts to raise cost ceiling — passport value kept',
        });
      }
    }

    if (override.escalationRules != null && override.escalationRules.length > 0) {
      const merged = Array.from(
        new Set([...effective.escalationRules, ...override.escalationRules]),
      );
      if (merged.length > effective.escalationRules.length) {
        effective = { ...effective, escalationRules: merged };
        anyApplied = true;
      }
    }

    if (anyApplied) appliedLenses.push(lens.lensId);
  }

  return { effectiveEnvelope: effective, appliedLenses, conflicts };
}

const _lensStore = new Map<string, PolicyLens[]>();

export function storeLens(lens: PolicyLens): void {
  const key = `${lens.tenantId}:${lens.passportId}`;
  const existing = _lensStore.get(key) ?? [];
  const idx = existing.findIndex((l) => l.lensId === lens.lensId);
  if (idx >= 0) existing[idx] = lens;
  else existing.push(lens);
  _lensStore.set(key, existing);
}

export function removeLens(tenantId: number, passportId: string, lensId: string): boolean {
  const key = `${tenantId}:${passportId}`;
  const existing = _lensStore.get(key);
  if (!existing) return false;
  const filtered = existing.filter((l) => l.lensId !== lensId);
  _lensStore.set(key, filtered);
  return filtered.length < existing.length;
}

export function getLenses(tenantId: number, passportId: string): PolicyLens[] {
  return _lensStore.get(`${tenantId}:${passportId}`) ?? [];
}

export function getAllLensesForTenant(tenantId: number): PolicyLens[] {
  const result: PolicyLens[] = [];
  for (const [key, lenses] of _lensStore.entries()) {
    if (key.startsWith(`${tenantId}:`)) result.push(...lenses);
  }
  return result;
}
