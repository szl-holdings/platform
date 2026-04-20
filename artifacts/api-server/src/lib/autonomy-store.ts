/**
 * Per-tenant + per-domain autonomy mode store.
 *
 * Backs the AutonomyModeToggle wired into ProofEnvelope surfaces.
 * Side-effecting Alloy workflow steps consult this store to decide whether
 * to execute, draft, queue for approval, or block.
 *
 * Persisted in Postgres via the `alloy_autonomy_modes` table so choices
 * survive api-server restarts and are consistent across replicas.
 */

import { alloyAutonomyModesTable, db } from '@szl-holdings/db';
import { and, eq, isNull, sql } from 'drizzle-orm';

export type AutonomyMode = 'observe' | 'recommend' | 'draft' | 'ask-to-act' | 'approved-act';

export const AUTONOMY_MODES: AutonomyMode[] = [
  'observe',
  'recommend',
  'draft',
  'ask-to-act',
  'approved-act',
];

export const DEFAULT_AUTONOMY_MODE: AutonomyMode = 'ask-to-act';

export interface AutonomyModeRecord {
  tenantOrgId: number | null;
  domain: string;
  mode: AutonomyMode;
  updatedAt: string;
  updatedBy: string | null;
  reason: string | null;
}

export interface AutonomyDecision {
  /** Effective UI policy state for the proof envelope */
  policyState: 'allowed' | 'requires-approval' | 'blocked';
  /** Human-readable reason — surfaced on the proof envelope */
  policyReason?: string;
  /**
   * What happens to a side-effecting workflow step at this mode:
   *  - execute: run inline
   *  - queue:   create approval record, do not execute
   *  - draft:   create artifact in draft state, no execution
   *  - block:   reject (observe mode — agent must not act)
   */
  disposition: 'execute' | 'queue' | 'draft' | 'block';
  mode: AutonomyMode;
}

function tenantPredicate(tenantOrgId: number | null) {
  return tenantOrgId == null
    ? isNull(alloyAutonomyModesTable.tenantOrgId)
    : eq(alloyAutonomyModesTable.tenantOrgId, tenantOrgId);
}

/**
 * Domains are matched case-insensitively to match the legacy in-memory store
 * behavior, which keyed by `domain.toLowerCase()`. We normalize on both read
 * and write so callers can use any casing without producing duplicate rows.
 */
function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase();
}

function rowToRecord(row: typeof alloyAutonomyModesTable.$inferSelect): AutonomyModeRecord {
  return {
    tenantOrgId: row.tenantOrgId,
    domain: row.domain,
    mode: row.mode as AutonomyMode,
    updatedAt: (row.updatedAt instanceof Date
      ? row.updatedAt
      : new Date(row.updatedAt)
    ).toISOString(),
    updatedBy: row.updatedBy,
    reason: row.reason,
  };
}

function defaultRecord(tenantOrgId: number | null, domain: string): AutonomyModeRecord {
  return {
    tenantOrgId,
    domain,
    mode: DEFAULT_AUTONOMY_MODE,
    updatedAt: new Date(0).toISOString(),
    updatedBy: null,
    reason: null,
  };
}

export async function getAutonomyMode(
  tenantOrgId: number | null,
  domain: string,
): Promise<AutonomyModeRecord> {
  const normalizedDomain = normalizeDomain(domain);
  const [row] = await db
    .select()
    .from(alloyAutonomyModesTable)
    .where(and(tenantPredicate(tenantOrgId), eq(alloyAutonomyModesTable.domain, normalizedDomain)))
    .limit(1);
  if (row) return rowToRecord(row);
  return defaultRecord(tenantOrgId, normalizedDomain);
}

export async function setAutonomyMode(params: {
  tenantOrgId: number | null;
  domain: string;
  mode: AutonomyMode;
  updatedBy?: string | null;
  reason?: string | null;
}): Promise<AutonomyModeRecord> {
  const now = new Date();
  const updatedBy = params.updatedBy ?? null;
  const reason = params.reason ?? null;
  const domain = normalizeDomain(params.domain);

  // Race-safe upsert. Two partial unique indexes back this table — one for
  // (tenant_org_id, domain) WHERE tenant_org_id IS NOT NULL, one for
  // (domain) WHERE tenant_org_id IS NULL — so we target whichever applies.
  const setOnConflict = {
    mode: params.mode,
    updatedAt: now,
    updatedBy,
    reason,
  };
  const values = {
    tenantOrgId: params.tenantOrgId,
    domain,
    mode: params.mode,
    updatedAt: now,
    updatedBy,
    reason,
  };

  const [row] =
    params.tenantOrgId == null
      ? await db
          .insert(alloyAutonomyModesTable)
          .values(values)
          .onConflictDoUpdate({
            target: [alloyAutonomyModesTable.domain],
            targetWhere: sql`tenant_org_id IS NULL`,
            set: setOnConflict,
          })
          .returning()
      : await db
          .insert(alloyAutonomyModesTable)
          .values(values)
          .onConflictDoUpdate({
            target: [alloyAutonomyModesTable.tenantOrgId, alloyAutonomyModesTable.domain],
            targetWhere: sql`tenant_org_id IS NOT NULL`,
            set: setOnConflict,
          })
          .returning();
  return rowToRecord(row);
}

export async function listAutonomyModes(tenantOrgId: number | null): Promise<AutonomyModeRecord[]> {
  const rows = await db.select().from(alloyAutonomyModesTable).where(tenantPredicate(tenantOrgId));
  return rows.map(rowToRecord);
}

/** For tests only. */
export async function _clearAutonomyStore(): Promise<void> {
  await db.delete(alloyAutonomyModesTable);
}

/**
 * Decide what should happen to a side-effecting action under the current
 * autonomy mode for (tenant, domain). Returns the policy state to display
 * in the ProofEnvelope and the runtime disposition for the workflow engine.
 */
export async function evaluateAutonomyForAction(
  tenantOrgId: number | null,
  domain: string,
  opts?: { actionLabel?: string },
): Promise<AutonomyDecision> {
  const record = await getAutonomyMode(tenantOrgId, domain);
  const action = opts?.actionLabel ?? 'this action';
  switch (record.mode) {
    case 'observe':
      return {
        mode: record.mode,
        policyState: 'blocked',
        policyReason: `Autonomy mode is OBSERVE for ${domain} — agents may monitor but must not execute ${action}.`,
        disposition: 'block',
      };
    case 'recommend':
      return {
        mode: record.mode,
        policyState: 'requires-approval',
        policyReason: `Autonomy mode is RECOMMEND — ${action} surfaced for human action; no agent execution.`,
        disposition: 'queue',
      };
    case 'draft':
      return {
        mode: record.mode,
        policyState: 'requires-approval',
        policyReason: `Autonomy mode is DRAFT — ${action} prepared for human review before send.`,
        disposition: 'draft',
      };
    case 'ask-to-act':
      return {
        mode: record.mode,
        policyState: 'requires-approval',
        policyReason: `Autonomy mode is ASK-TO-ACT — approval required before ${action}.`,
        disposition: 'queue',
      };
    case 'approved-act':
      return {
        mode: record.mode,
        policyState: 'allowed',
        policyReason: `Autonomy mode is APPROVED-ACT — ${action} executes within policy without per-action approval.`,
        disposition: 'execute',
      };
    default:
      return {
        mode: DEFAULT_AUTONOMY_MODE,
        policyState: 'requires-approval',
        policyReason: 'Defaulting to ASK-TO-ACT — approval required.',
        disposition: 'queue',
      };
  }
}
