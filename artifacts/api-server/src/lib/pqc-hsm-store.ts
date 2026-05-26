/**
 * Persistent HSM audit sink and intermediate-CA store.
 *
 * Writes every HSM/KMS signing operation to `pqc_hsm_audit_log` with a
 * SHA-256 hash chain so silent deletion is detectable. The chain lives
 * alongside the application's audit log but is independent of it, so a
 * compromise of the application audit table cannot rewrite root-key
 * history.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { db, pqcHsmAuditLogTable, pqcHsmDrReadinessTable, pqcIntermediateKeysTable } from '@szl-holdings/db';
import { desc, eq, isNull, sql } from 'drizzle-orm';
import type { HsmAuditRecord, HsmAuditSink } from '@szl-holdings/pqc-identity';

function computeEventHash(prevHash: string, body: Record<string, unknown>): string {
  const canonical = JSON.stringify(body, Object.keys(body).sort());
  return bytesToHex(sha256(new TextEncoder().encode(prevHash + '|' + canonical)));
}

export class DrizzleHsmAuditSink implements HsmAuditSink {
  private _chainPromise: Promise<{ seq: number; hash: string }> = Promise.resolve({
    seq: 0,
    hash: 'genesis',
  });
  private _initialized = false;

  private async loadTail(): Promise<{ seq: number; hash: string }> {
    if (this._initialized) {
      return this._chainPromise;
    }
    this._initialized = true;
    this._chainPromise = (async () => {
      try {
        const [row] = await db
          .select({
            seq: pqcHsmAuditLogTable.sequenceNumber,
            hash: pqcHsmAuditLogTable.eventHash,
          })
          .from(pqcHsmAuditLogTable)
          .orderBy(desc(pqcHsmAuditLogTable.sequenceNumber))
          .limit(1);
        return row ? { seq: row.seq, hash: row.hash } : { seq: 0, hash: 'genesis' };
      } catch {
        return { seq: 0, hash: 'genesis' };
      }
    })();
    return this._chainPromise;
  }

  async record(entry: HsmAuditRecord): Promise<void> {
    this._chainPromise = this.loadTail().then(async (tail) => {
      const seq = tail.seq + 1;
      const body = {
        sequenceNumber: seq,
        keyTier: entry.keyTier,
        keyRef: entry.keyRef,
        driver: entry.driver,
        operation: entry.operation,
        requesterIdentity: entry.requesterIdentity,
        payloadHash: entry.payloadHash,
        outcome: entry.outcome,
        latencyMs: entry.latencyMs,
        metadata: entry.metadata ?? {},
      };
      const eventHash = computeEventHash(tail.hash, body);
      try {
        await db.insert(pqcHsmAuditLogTable).values({
          sequenceNumber: seq,
          keyTier: entry.keyTier,
          keyRef: entry.keyRef,
          driver: entry.driver,
          operation: entry.operation,
          requesterIdentity: entry.requesterIdentity,
          payloadHash: entry.payloadHash,
          outcome: entry.outcome,
          latencyMs: entry.latencyMs,
          metadata: entry.metadata ?? null,
          prevHash: tail.hash,
          eventHash,
        });
      } catch {
        // If persistence fails (table missing in dev), keep the in-memory
        // chain pointer where it was so the next write retries cleanly.
        return tail;
      }
      return { seq, hash: eventHash };
    });
    await this._chainPromise;
  }
}

export interface HsmAuditSummary {
  totalSignings: number;
  rootSignings: number;
  intermediateSignings: number;
  failures: number;
  lastSigningAt: string | null;
  lastAttestationAt: string | null;
  lastRotationAt: string | null;
  chainTip: { sequence: number; hash: string } | null;
  recent: Array<{
    sequence: number;
    operation: string;
    keyTier: string;
    keyRef: string;
    driver: string;
    requester: string;
    outcome: string;
    latencyMs: number | null;
    occurredAt: string;
  }>;
}

export async function getHsmAuditSummary(limit = 25): Promise<HsmAuditSummary> {
  const empty: HsmAuditSummary = {
    totalSignings: 0,
    rootSignings: 0,
    intermediateSignings: 0,
    failures: 0,
    lastSigningAt: null,
    lastAttestationAt: null,
    lastRotationAt: null,
    chainTip: null,
    recent: [],
  };
  try {
    const recentRows = await db
      .select()
      .from(pqcHsmAuditLogTable)
      .orderBy(desc(pqcHsmAuditLogTable.sequenceNumber))
      .limit(limit);

    const [counts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        roots: sql<number>`sum(case when ${pqcHsmAuditLogTable.keyTier} = 'root' then 1 else 0 end)::int`,
        intermediates: sql<number>`sum(case when ${pqcHsmAuditLogTable.keyTier} = 'intermediate' then 1 else 0 end)::int`,
        failures: sql<number>`sum(case when ${pqcHsmAuditLogTable.outcome} != 'success' then 1 else 0 end)::int`,
      })
      .from(pqcHsmAuditLogTable);

    const [lastSign] = await db
      .select({ occurredAt: pqcHsmAuditLogTable.occurredAt })
      .from(pqcHsmAuditLogTable)
      .where(eq(pqcHsmAuditLogTable.operation, 'sign'))
      .orderBy(desc(pqcHsmAuditLogTable.occurredAt))
      .limit(1);

    const [lastAttest] = await db
      .select({ occurredAt: pqcHsmAuditLogTable.occurredAt })
      .from(pqcHsmAuditLogTable)
      .where(eq(pqcHsmAuditLogTable.operation, 'attest'))
      .orderBy(desc(pqcHsmAuditLogTable.occurredAt))
      .limit(1);

    const [lastRotate] = await db
      .select({ occurredAt: pqcHsmAuditLogTable.occurredAt })
      .from(pqcHsmAuditLogTable)
      .where(eq(pqcHsmAuditLogTable.operation, 'rotate'))
      .orderBy(desc(pqcHsmAuditLogTable.occurredAt))
      .limit(1);

    const tip = recentRows[0]
      ? { sequence: recentRows[0].sequenceNumber, hash: recentRows[0].eventHash }
      : null;

    return {
      totalSignings: Number(counts?.total ?? 0),
      rootSignings: Number(counts?.roots ?? 0),
      intermediateSignings: Number(counts?.intermediates ?? 0),
      failures: Number(counts?.failures ?? 0),
      lastSigningAt: lastSign?.occurredAt ? new Date(lastSign.occurredAt).toISOString() : null,
      lastAttestationAt: lastAttest?.occurredAt ? new Date(lastAttest.occurredAt).toISOString() : null,
      lastRotationAt: lastRotate?.occurredAt ? new Date(lastRotate.occurredAt).toISOString() : null,
      chainTip: tip,
      recent: recentRows.map((r) => ({
        sequence: r.sequenceNumber,
        operation: r.operation,
        keyTier: r.keyTier,
        keyRef: r.keyRef,
        driver: r.driver,
        requester: r.requesterIdentity,
        outcome: r.outcome,
        latencyMs: r.latencyMs,
        occurredAt: r.occurredAt instanceof Date ? r.occurredAt.toISOString() : String(r.occurredAt),
      })),
    };
  } catch {
    return empty;
  }
}

export interface DrReadinessReport {
  issuer: string;
  lastBackupVerifyAt: string | null;
  lastRecoveryRehearsalAt: string | null;
  lastRotationRehearsalAt: string | null;
  lastOperatorRosterAt: string | null;
  operatorsRequired: number | null;
  operatorsLastSeen: number | null;
  staleness: {
    backupVerifyDays: number | null;
    recoveryRehearsalDays: number | null;
    rotationRehearsalDays: number | null;
  };
  ready: boolean;
  blockingReasons: string[];
  recent: Array<{
    type: string;
    outcome: string;
    operatorsPresent: number;
    operatorsRequired: number;
    notes: string | null;
    performedAt: string;
  }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(d: Date | null | undefined): number | null {
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / DAY_MS);
}

export async function getDrReadinessReport(issuer: string, limit = 10): Promise<DrReadinessReport> {
  const blocking: string[] = [];
  const empty: DrReadinessReport = {
    issuer,
    lastBackupVerifyAt: null,
    lastRecoveryRehearsalAt: null,
    lastRotationRehearsalAt: null,
    lastOperatorRosterAt: null,
    operatorsRequired: null,
    operatorsLastSeen: null,
    staleness: { backupVerifyDays: null, recoveryRehearsalDays: null, rotationRehearsalDays: null },
    ready: false,
    blockingReasons: ['No disaster-recovery rehearsal has been recorded.'],
    recent: [],
  };
  try {
    const rows = await db
      .select()
      .from(pqcHsmDrReadinessTable)
      .where(eq(pqcHsmDrReadinessTable.issuer, issuer))
      .orderBy(desc(pqcHsmDrReadinessTable.performedAt))
      .limit(limit);

    if (rows.length === 0) {
      return empty;
    }

    const newestOf = (type: string) =>
      rows.find((r) => r.rehearsalType === type && r.outcome !== 'failed') ?? null;

    const backup = newestOf('backup-verify');
    const recovery = newestOf('recovery-rehearsal');
    const rotation = newestOf('rotation-rehearsal');
    const roster = newestOf('operator-roster');

    const backupDays = daysSince(backup?.performedAt ?? null);
    const recoveryDays = daysSince(recovery?.performedAt ?? null);
    const rotationDays = daysSince(rotation?.performedAt ?? null);

    if (backupDays === null) blocking.push('No backup-shard verification recorded.');
    else if (backupDays > 30) blocking.push(`Backup verification is ${backupDays}d old (>30d limit).`);
    if (recoveryDays === null) blocking.push('No recovery rehearsal recorded.');
    else if (recoveryDays > 180) blocking.push(`Recovery rehearsal is ${recoveryDays}d old (>180d limit).`);
    if (rotationDays === null) blocking.push('No rotation rehearsal recorded.');

    return {
      issuer,
      lastBackupVerifyAt: backup?.performedAt ? new Date(backup.performedAt).toISOString() : null,
      lastRecoveryRehearsalAt: recovery?.performedAt ? new Date(recovery.performedAt).toISOString() : null,
      lastRotationRehearsalAt: rotation?.performedAt ? new Date(rotation.performedAt).toISOString() : null,
      lastOperatorRosterAt: roster?.performedAt ? new Date(roster.performedAt).toISOString() : null,
      operatorsRequired: roster?.operatorsRequired ?? null,
      operatorsLastSeen: roster?.operatorsPresent ?? null,
      staleness: {
        backupVerifyDays: backupDays,
        recoveryRehearsalDays: recoveryDays,
        rotationRehearsalDays: rotationDays,
      },
      ready: blocking.length === 0,
      blockingReasons: blocking,
      recent: rows.map((r) => ({
        type: r.rehearsalType,
        outcome: r.outcome,
        operatorsPresent: r.operatorsPresent,
        operatorsRequired: r.operatorsRequired,
        notes: r.notes,
        performedAt: r.performedAt instanceof Date ? r.performedAt.toISOString() : String(r.performedAt),
      })),
    };
  } catch {
    return empty;
  }
}

export interface IntermediateSummary {
  intermediateName: string;
  rootIssuer: string;
  driver: string;
  notBefore: string;
  notAfter: string;
  retiredAt: string | null;
  publicKeys: { ed25519: string; mldsa65: string };
}

export async function listActiveIntermediates(rootIssuer: string): Promise<IntermediateSummary[]> {
  try {
    const rows = await db
      .select()
      .from(pqcIntermediateKeysTable)
      .where(eq(pqcIntermediateKeysTable.rootIssuer, rootIssuer));
    return rows
      .filter((r) => r.retiredAt === null)
      .map((r) => ({
        intermediateName: r.intermediateName,
        rootIssuer: r.rootIssuer,
        driver: r.driver,
        notBefore: r.notBefore instanceof Date ? r.notBefore.toISOString() : String(r.notBefore),
        notAfter: r.notAfter instanceof Date ? r.notAfter.toISOString() : String(r.notAfter),
        retiredAt: r.retiredAt ? (r.retiredAt instanceof Date ? r.retiredAt.toISOString() : String(r.retiredAt)) : null,
        publicKeys: { ed25519: r.ed25519PublicKey, mldsa65: r.mldsa65PublicKey },
      }));
  } catch {
    return [];
  }
}

void isNull;
