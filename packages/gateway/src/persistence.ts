/** Required evidence/audit persistence boundary for the Agent Gateway. */

import { createHash } from 'node:crypto';
import { closeSync, fsyncSync, openSync, writeSync } from 'node:fs';
import type { AuditEntry, EvidenceRecord, GatewayConfig } from './types.js';

type PersistedPayload =
  | { kind: 'audit'; id: string; payload: AuditEntry }
  | { kind: 'evidence'; id: string; payload: EvidenceRecord };

type LedgerEnvelope = PersistedPayload & { digest: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function envelopeFor(record: PersistedPayload): LedgerEnvelope {
  const serializedPayload = JSON.stringify({
    kind: record.kind,
    id: record.id,
    payload: record.payload,
  });
  return {
    ...record,
    digest: `sha256:${createHash('sha256').update(serializedPayload).digest('hex')}`,
  };
}

function appendDevelopmentRecord(path: string, envelope: LedgerEnvelope): void {
  const descriptor = openSync(path, 'a', 0o600);
  try {
    writeSync(descriptor, `${JSON.stringify(envelope)}\n`, undefined, 'utf8');
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

async function appendRemoteRecord(config: GatewayConfig, envelope: LedgerEnvelope): Promise<void> {
  const ledger = config.evidenceLedger;
  if (!ledger) throw new Error('remote evidence ledger is not configured');

  let response: Response;
  try {
    response = await fetch(`${ledger.endpoint.replace(/\/$/, '')}/v1/records`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ledger.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelope),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    throw new Error(
      `required evidence ledger is unreachable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!response.ok) {
    throw new Error(`required evidence ledger rejected the record with HTTP ${response.status}`);
  }

  let acknowledgement: unknown;
  try {
    acknowledgement = await response.json();
  } catch {
    throw new Error('required evidence ledger returned malformed acknowledgement JSON');
  }
  if (
    !isRecord(acknowledgement) ||
    acknowledgement.stored !== true ||
    typeof acknowledgement.recordId !== 'string' ||
    acknowledgement.recordId.length === 0 ||
    acknowledgement.digest !== envelope.digest
  ) {
    throw new Error('required evidence ledger did not attest the exact stored record digest');
  }
}

async function persist(config: GatewayConfig, record: PersistedPayload): Promise<void> {
  const envelope = envelopeFor(record);
  if (config.evidenceLedger) {
    await appendRemoteRecord(config, envelope);
    return;
  }
  appendDevelopmentRecord(config.auditLogPath, envelope);
}

export async function persistEvidenceRecord(
  config: GatewayConfig,
  evidence: EvidenceRecord,
): Promise<void> {
  await persist(config, { kind: 'evidence', id: evidence.evidenceId, payload: evidence });
}

export async function persistAuditRecord(config: GatewayConfig, entry: AuditEntry): Promise<void> {
  await persist(config, { kind: 'audit', id: entry.auditId, payload: entry });
}

export async function probeEvidenceLedger(config: GatewayConfig): Promise<boolean> {
  const ledger = config.evidenceLedger;
  if (!ledger) return true;

  try {
    const response = await fetch(`${ledger.endpoint.replace(/\/$/, '')}/health`, {
      headers: { Authorization: `Bearer ${ledger.token}` },
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) return false;
    const body: unknown = await response.json();
    return (
      isRecord(body) &&
      body.status === 'ready' &&
      body.durable === true &&
      body.tamperEvident === true &&
      body.appendOnly === true
    );
  } catch {
    return false;
  }
}
