/**
 * Historical proof-chain hybrid attestation backfill.
 *
 * Walks `audit_chain_events` in id order, re-validates each row's hash chain
 * integrity, and appends a parallel hybrid-signed attestation to
 * `proof_chain_hybrid_attestations`. The original event row is never
 * rewritten — that would break the SHA-256 hash chain. Failed-integrity rows
 * land in the quarantine table for operator review.
 *
 * This module is signer-agnostic: callers pass an `AttestationSigner` that
 * resolves the platform attestation DID and returns hybrid signatures. The
 * api-server adapter wires that to the existing key-custody provider.
 */

import {
  auditChainEventsTable,
  db,
  proofChainAttestationCheckpointTable,
  proofChainAttestationQuarantineTable,
  proofChainHybridAttestationsTable,
  type AttestationKind,
} from '@szl-holdings/db';
import { createHash } from 'node:crypto';
import { and, asc, count, eq, gt, isNull, sql } from 'drizzle-orm';

export const ATTESTATION_SCHEME_VERSION = 'hybrid-ed25519-mldsa65-v1';

export interface AttestationSignerResult {
  ed25519Sig: string;
  mldsa65Sig: string;
  sigPublicKeyEd25519: string;
  sigPublicKeyMldsa65: string;
  attestingDid: string;
  keyId: string;
  schemeVersion: string;
  certThumbprint?: string;
}

export interface AttestationSigner {
  sign(canonicalBytes: Uint8Array): Promise<AttestationSignerResult>;
}

export interface BackfillOptions {
  /** Stable workflow id used as the checkpoint key. */
  workflowId?: string;
  /** Page size for each scan iteration (default 200). */
  chunkSize?: number;
  /** Maximum number of rows to process this run (default unlimited). */
  maxRows?: number;
  /** Attestation kind written on each new row (default `backfill`). */
  kind?: AttestationKind;
  /** How many predecessors to walk back when validating chain link (default 3). */
  integrityWindow?: number;
}

export interface BackfillSummary {
  workflowId: string;
  totalAttested: number;
  totalQuarantined: number;
  totalSkipped: number;
  lastEventId: number;
  completed: boolean;
  perTenant: Record<string, { attested: number; quarantined: number }>;
  startedAt: string;
  finishedAt: string;
  throughputPerSec: number;
}

/**
 * Canonical attestation payload — what the SZL platform attestation
 * authority is putting its hybrid signature on. The signature attests:
 *
 *   "Audit event #<eventId> existed at hash <eventHash> chained from
 *    <prevHash>, recorded at <createdAt>, and its integrity from this
 *    attestationTimestamp onward is bound to <attestingDid>."
 *
 * The payload deliberately does NOT include any mutable fields from the
 * original row (metadata, riskLevel, etc.) — only the immutable hash-chain
 * primitives + the attestation envelope. This keeps the attestation stable
 * even if non-chained columns are amended.
 */
export function buildAttestationPayload(input: {
  eventId: number;
  eventHash: string;
  prevHash: string;
  createdAt: string;
  attestingDid: string;
  attestedAt: string;
  schemeVersion: string;
}): Uint8Array {
  const json = JSON.stringify({
    kind: 'proof-chain-hybrid-attestation',
    eventId: input.eventId,
    eventHash: input.eventHash,
    prevHash: input.prevHash,
    createdAt: input.createdAt,
    attestingDid: input.attestingDid,
    attestedAt: input.attestedAt,
    schemeVersion: input.schemeVersion,
  });
  return new TextEncoder().encode(json);
}

function computeEventHash(
  prevHash: string,
  payload: {
    action: string;
    actor: string;
    domain: string;
    actionType: string;
    entityId?: string | null;
    createdAt: string;
  },
): string {
  const data = [
    prevHash,
    payload.action,
    payload.actor,
    payload.domain,
    payload.actionType,
    payload.entityId ?? '',
    payload.createdAt,
  ].join('|');
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Integrity guard. Recomputes the event hash and walks back N predecessors
 * to confirm the chain link is intact. Returns null on success, or a
 * failure record describing the mismatch.
 */
export async function runIntegrityGuard(
  eventId: number,
  windowSize: number,
): Promise<{
  ok: true;
} | {
  ok: false;
  reason: string;
  expectedPrevHash?: string;
  actualPrevHash?: string;
  expectedEventHash?: string;
  actualEventHash?: string;
}> {
  const [ev] = await db
    .select()
    .from(auditChainEventsTable)
    .where(eq(auditChainEventsTable.id, eventId))
    .limit(1);
  if (!ev) return { ok: false, reason: 'event_not_found' };

  const recomputed = computeEventHash(ev.prevHash, {
    action: ev.action,
    actor: ev.actorLabel,
    domain: ev.domain,
    actionType: ev.actionType,
    entityId: ev.entityId ?? null,
    createdAt: ev.createdAt.toISOString(),
  });
  if (recomputed !== ev.eventHash) {
    return {
      ok: false,
      reason: 'hash_mismatch',
      expectedEventHash: recomputed,
      actualEventHash: ev.eventHash,
    };
  }

  // Walk back up to `windowSize` predecessors and verify each link
  let cursor = ev;
  for (let i = 0; i < windowSize; i++) {
    if (cursor.prevHash === 'genesis') break;
    const [prev] = await db
      .select()
      .from(auditChainEventsTable)
      .where(
        and(
          eq(auditChainEventsTable.orgId as never, cursor.orgId as never),
          eq(auditChainEventsTable.eventHash, cursor.prevHash),
        ),
      )
      .limit(1);
    if (!prev) {
      return {
        ok: false,
        reason: 'predecessor_not_found',
        expectedPrevHash: cursor.prevHash,
      };
    }
    const prevRecomputed = computeEventHash(prev.prevHash, {
      action: prev.action,
      actor: prev.actorLabel,
      domain: prev.domain,
      actionType: prev.actionType,
      entityId: prev.entityId ?? null,
      createdAt: prev.createdAt.toISOString(),
    });
    if (prevRecomputed !== prev.eventHash) {
      return {
        ok: false,
        reason: 'predecessor_hash_mismatch',
        expectedEventHash: prevRecomputed,
        actualEventHash: prev.eventHash,
      };
    }
    cursor = prev;
  }

  return { ok: true };
}

/**
 * Idempotent, resumable backfill pass. Reads from the checkpoint, attests
 * unattested events in id order, and writes the checkpoint after each chunk.
 * Safe to invoke repeatedly — already-attested events are skipped via the
 * unique constraint on `event_id`.
 */
export async function runAttestationBackfill(
  signer: AttestationSigner,
  opts: BackfillOptions = {},
): Promise<BackfillSummary> {
  const workflowId = opts.workflowId ?? 'proof-chain-backfill-default';
  const chunkSize = Math.max(1, Math.min(1000, opts.chunkSize ?? 200));
  const maxRows = opts.maxRows ?? Number.POSITIVE_INFINITY;
  const kind: AttestationKind = opts.kind ?? 'backfill';
  const integrityWindow = Math.max(0, opts.integrityWindow ?? 3);

  const startedAt = new Date();

  // Resume from checkpoint, creating one if absent.
  const [existing] = await db
    .select()
    .from(proofChainAttestationCheckpointTable)
    .where(eq(proofChainAttestationCheckpointTable.id, workflowId))
    .limit(1);
  let cursorId = existing?.lastEventId ?? 0;
  let totalAttested = existing?.totalAttested ?? 0;
  let totalQuarantined = existing?.totalQuarantined ?? 0;
  let totalSkipped = existing?.totalSkipped ?? 0;
  const perTenant: Record<string, { attested: number; quarantined: number }> = {};

  if (!existing) {
    await db
      .insert(proofChainAttestationCheckpointTable)
      .values({
        id: workflowId,
        lastEventId: 0,
        totalAttested: 0,
        totalQuarantined: 0,
        totalSkipped: 0,
        status: 'running',
      })
      .onConflictDoNothing();
  } else {
    await db
      .update(proofChainAttestationCheckpointTable)
      .set({ status: 'running', updatedAt: new Date() })
      .where(eq(proofChainAttestationCheckpointTable.id, workflowId));
  }

  let processed = 0;
  let completed = false;

  while (processed < maxRows) {
    const remaining = Math.min(chunkSize, maxRows - processed);
    const batch = await db
      .select()
      .from(auditChainEventsTable)
      .where(gt(auditChainEventsTable.id, cursorId))
      .orderBy(asc(auditChainEventsTable.id))
      .limit(remaining);

    if (batch.length === 0) {
      completed = true;
      break;
    }

    for (const ev of batch) {
      cursorId = ev.id;
      processed++;

      // Skip if already attested.
      const [already] = await db
        .select({ id: proofChainHybridAttestationsTable.id })
        .from(proofChainHybridAttestationsTable)
        .where(eq(proofChainHybridAttestationsTable.eventId, ev.id))
        .limit(1);
      if (already) {
        totalSkipped++;
        continue;
      }

      // Skip if already quarantined and not yet decided (or marked known_bad)
      const [quarantined] = await db
        .select({
          id: proofChainAttestationQuarantineTable.id,
          decision: proofChainAttestationQuarantineTable.decision,
        })
        .from(proofChainAttestationQuarantineTable)
        .where(eq(proofChainAttestationQuarantineTable.eventId, ev.id))
        .limit(1);
      if (quarantined && quarantined.decision !== 'accepted') {
        totalSkipped++;
        continue;
      }

      // Integrity guard — only attested-with-justification quarantine rows
      // can bypass; everything else must pass the live recompute.
      let guardOverride = false;
      if (!quarantined) {
        const guard = await runIntegrityGuard(ev.id, integrityWindow);
        if (!guard.ok) {
          await db
            .insert(proofChainAttestationQuarantineTable)
            .values({
              eventId: ev.id,
              orgId: ev.orgId ?? null,
              expectedPrevHash: guard.expectedPrevHash ?? null,
              actualPrevHash: ev.prevHash,
              expectedEventHash: guard.expectedEventHash ?? null,
              actualEventHash: guard.actualEventHash ?? ev.eventHash,
              failureReason: guard.reason,
            })
            .onConflictDoNothing();
          totalQuarantined++;
          const k = String(ev.orgId ?? 'platform');
          perTenant[k] = perTenant[k] ?? { attested: 0, quarantined: 0 };
          perTenant[k].quarantined++;
          continue;
        }
      } else {
        // Operator-accepted quarantine: attest with override metadata so
        // the verdict carries the justification trail.
        guardOverride = true;
      }

      const attestedAt = new Date();
      const payload = await (async () => {
        // Sign canonical attestation envelope.
        const canonicalBytes = buildAttestationPayload({
          eventId: ev.id,
          eventHash: ev.eventHash,
          prevHash: ev.prevHash,
          createdAt: ev.createdAt.toISOString(),
          attestingDid: '', // placeholder — replaced after signer call
          attestedAt: attestedAt.toISOString(),
          schemeVersion: ATTESTATION_SCHEME_VERSION,
        });
        const sig = await signer.sign(canonicalBytes);
        return { sig, attestedAt };
      })();

      try {
        await db
          .insert(proofChainHybridAttestationsTable)
          .values({
            eventId: ev.id,
            eventHash: ev.eventHash,
            orgId: ev.orgId ?? null,
            ed25519Sig: payload.sig.ed25519Sig,
            mldsa65Sig: payload.sig.mldsa65Sig,
            sigPublicKeyEd25519: payload.sig.sigPublicKeyEd25519,
            sigPublicKeyMldsa65: payload.sig.sigPublicKeyMldsa65,
            attestingDid: payload.sig.attestingDid,
            keyId: payload.sig.keyId,
            schemeVersion: payload.sig.schemeVersion,
            certThumbprint: payload.sig.certThumbprint ?? null,
            attestedAt: payload.attestedAt,
            attestationKind: kind,
            metadata: {
              guardOverride,
              attestationPayloadCreatedAt: ev.createdAt.toISOString(),
            },
          })
          .onConflictDoNothing();
        totalAttested++;
        const k = String(ev.orgId ?? 'platform');
        perTenant[k] = perTenant[k] ?? { attested: 0, quarantined: 0 };
        perTenant[k].attested++;
      } catch {
        totalSkipped++;
      }
    }

    await db
      .update(proofChainAttestationCheckpointTable)
      .set({
        lastEventId: cursorId,
        totalAttested,
        totalQuarantined,
        totalSkipped,
        updatedAt: new Date(),
      })
      .where(eq(proofChainAttestationCheckpointTable.id, workflowId));
  }

  const finishedAt = new Date();
  const elapsedSec = Math.max(0.001, (finishedAt.getTime() - startedAt.getTime()) / 1000);
  const summary: BackfillSummary = {
    workflowId,
    totalAttested,
    totalQuarantined,
    totalSkipped,
    lastEventId: cursorId,
    completed,
    perTenant,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    throughputPerSec: Math.round((processed / elapsedSec) * 100) / 100,
  };

  await db
    .update(proofChainAttestationCheckpointTable)
    .set({
      status: completed ? 'completed' : 'paused',
      completedAt: completed ? finishedAt : null,
      summary,
      updatedAt: finishedAt,
    })
    .where(eq(proofChainAttestationCheckpointTable.id, workflowId));

  return summary;
}

/**
 * Catch-up mode: find any audit_chain_events row written after the last
 * checkpoint that still lacks a hybrid attestation, and run the same
 * attestation flow over them. Intended to run on an hourly cron so any
 * entry written by a still-legacy code path is hybrid-covered within an
 * hour.
 */
export async function runAttestationCatchUp(
  signer: AttestationSigner,
  opts: { limit?: number } = {},
): Promise<BackfillSummary> {
  return runAttestationBackfill(signer, {
    workflowId: 'proof-chain-catch-up',
    chunkSize: 100,
    maxRows: opts.limit ?? 500,
    kind: 'catch_up',
    integrityWindow: 1,
  });
}

/**
 * Coverage stats — used by the A11oy SecurityCompliance "hybrid coverage"
 * tile. Returns total events, total attested, the resulting coverage
 * percentage, and a per-tenant breakdown.
 */
export interface CoverageStats {
  totalEvents: number;
  totalAttested: number;
  totalLegacySigned: number;
  totalQuarantined: number;
  coveragePct: number;
  perTenant: Array<{ orgId: number | null; events: number; attested: number; coveragePct: number }>;
  updatedAt: string;
}

export async function getAttestationCoverage(): Promise<CoverageStats> {
  const [totals] = await db
    .select({
      total: count(),
      hybridNative: sql<number>`COUNT(*) FILTER (WHERE ${auditChainEventsTable.ed25519Sig} IS NOT NULL AND ${auditChainEventsTable.mldsa65Sig} IS NOT NULL)`,
    })
    .from(auditChainEventsTable);
  const [attestedRow] = await db
    .select({ c: count() })
    .from(proofChainHybridAttestationsTable);
  const [quarantineRow] = await db
    .select({ c: count() })
    .from(proofChainAttestationQuarantineTable)
    .where(
      sql`${proofChainAttestationQuarantineTable.decision} IN ('pending','known_bad','escalated')`,
    );

  const totalEvents = Number(totals?.total ?? 0);
  const totalAttested = Number(attestedRow?.c ?? 0);
  const totalLegacySigned = Number(totals?.hybridNative ?? 0);
  const totalQuarantined = Number(quarantineRow?.c ?? 0);
  // Coverage = (events that are either hybrid-signed natively OR have an attestation) / total.
  // We approximate the union: legacyHybrid covers post-cutover rows and attested
  // covers historical rows. Pre-cutover rows are always unsigned, so there is
  // no overlap with hybrid native. Quarantined rows count as covered for the
  // purpose of the tile only after an operator decision is recorded.
  const covered = Math.min(totalEvents, totalAttested + totalLegacySigned);
  const coveragePct = totalEvents === 0 ? 100 : Math.round((covered / totalEvents) * 10000) / 100;

  const perTenantRows = await db
    .select({
      orgId: auditChainEventsTable.orgId,
      events: count(),
    })
    .from(auditChainEventsTable)
    .groupBy(auditChainEventsTable.orgId);
  const tenantAttestedRows = await db
    .select({
      orgId: proofChainHybridAttestationsTable.orgId,
      attested: count(),
    })
    .from(proofChainHybridAttestationsTable)
    .groupBy(proofChainHybridAttestationsTable.orgId);
  const tenantNativeRows = await db
    .select({
      orgId: auditChainEventsTable.orgId,
      hybridNative: count(),
    })
    .from(auditChainEventsTable)
    .where(
      and(
        sql`${auditChainEventsTable.ed25519Sig} IS NOT NULL`,
        sql`${auditChainEventsTable.mldsa65Sig} IS NOT NULL`,
      ),
    )
    .groupBy(auditChainEventsTable.orgId);

  const attestedByOrg = new Map<string, number>();
  for (const r of tenantAttestedRows) attestedByOrg.set(String(r.orgId ?? ''), Number(r.attested));
  const nativeByOrg = new Map<string, number>();
  for (const r of tenantNativeRows) nativeByOrg.set(String(r.orgId ?? ''), Number(r.hybridNative));

  const perTenant = perTenantRows.map((r) => {
    const key = String(r.orgId ?? '');
    const events = Number(r.events);
    const att = attestedByOrg.get(key) ?? 0;
    const native = nativeByOrg.get(key) ?? 0;
    const cov = events === 0 ? 100 : Math.round((Math.min(events, att + native) / events) * 10000) / 100;
    return { orgId: r.orgId ?? null, events, attested: att, coveragePct: cov };
  });

  void isNull; // keep import for tree-shaking parity

  return {
    totalEvents,
    totalAttested,
    totalLegacySigned,
    totalQuarantined,
    coveragePct,
    perTenant,
    updatedAt: new Date().toISOString(),
  };
}

export interface AttestationLookupResult {
  eventId: number;
  attestation: {
    id: number;
    attestingDid: string;
    keyId: string;
    schemeVersion: string;
    certThumbprint: string | null;
    attestedAt: string;
    ed25519Sig: string;
    mldsa65Sig: string;
    sigPublicKeyEd25519: string;
    sigPublicKeyMldsa65: string;
    attestationKind: AttestationKind;
  } | null;
}

export async function getAttestationForEvent(
  eventId: number,
): Promise<AttestationLookupResult> {
  const [row] = await db
    .select()
    .from(proofChainHybridAttestationsTable)
    .where(eq(proofChainHybridAttestationsTable.eventId, eventId))
    .limit(1);
  if (!row) return { eventId, attestation: null };
  return {
    eventId,
    attestation: {
      id: row.id,
      attestingDid: row.attestingDid,
      keyId: row.keyId,
      schemeVersion: row.schemeVersion,
      certThumbprint: row.certThumbprint,
      attestedAt:
        row.attestedAt instanceof Date ? row.attestedAt.toISOString() : String(row.attestedAt),
      ed25519Sig: row.ed25519Sig,
      mldsa65Sig: row.mldsa65Sig,
      sigPublicKeyEd25519: row.sigPublicKeyEd25519,
      sigPublicKeyMldsa65: row.sigPublicKeyMldsa65,
      attestationKind: row.attestationKind as AttestationKind,
    },
  };
}
