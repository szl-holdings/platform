/**
 * Evidence Ledger
 *
 * Append-only, hash-chained record of every detection, response action,
 * Sentinel counter-move, and operator approval/decline.
 *
 * Each entry hashes the previous entry's hash + its own content to produce
 * an entryHash, forming a tamper-evident chain of custody.
 */

import { createHash, randomUUID } from 'node:crypto';
import { logger } from '../logger.js';

export type LedgerEntryType =
  | 'detection'
  | 'response'
  | 'counter_move'
  | 'approval'
  | 'scope_violation'
  | 'canary_trigger'
  | 'sentinel_action';

export type LedgerActorType = 'system' | 'operator' | 'sentinel' | 'evaluator';

export type LedgerOutcome = 'executed' | 'approved' | 'rejected' | 'blocked' | 'pending';

export interface LedgerEntry {
  id: string;
  sequenceNumber: number;
  entryType: LedgerEntryType;
  actorType: LedgerActorType;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  action: string;
  outcome: LedgerOutcome;
  details: Record<string, unknown>;
  previousHash: string | null;
  entryHash: string;
  linkedEventId?: string;
  linkedIncidentId?: string;
  createdAt: string;
}

interface WriteLedgerInput {
  entryType: LedgerEntryType;
  actorType: LedgerActorType;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  action: string;
  outcome: LedgerOutcome;
  details?: Record<string, unknown>;
  linkedEventId?: string;
  linkedIncidentId?: string;
}

// In-memory buffer — entries are also persisted to DB asynchronously
const _inMemoryEntries: LedgerEntry[] = [];
let _lastHash: string | null = null;
let _sequence = 0;

let _dbWriter: ((entry: LedgerEntry) => Promise<void>) | null = null;

export function registerLedgerDbWriter(fn: (entry: LedgerEntry) => Promise<void>): void {
  _dbWriter = fn;
}

function computeHash(previousHash: string | null, content: string): string {
  return createHash('sha256')
    .update(`${previousHash ?? 'GENESIS'}::${content}`)
    .digest('hex');
}

export function appendLedgerEntry(input: WriteLedgerInput): LedgerEntry {
  const id = randomUUID();
  const seq = ++_sequence;
  const now = new Date().toISOString();
  const contentForHash = JSON.stringify({
    seq,
    entryType: input.entryType,
    action: input.action,
    outcome: input.outcome,
    actorType: input.actorType,
    actorId: input.actorId,
    targetType: input.targetType,
    targetId: input.targetId,
    ts: now,
  });

  const entryHash = computeHash(_lastHash, contentForHash);

  const entry: LedgerEntry = {
    id,
    sequenceNumber: seq,
    entryType: input.entryType,
    actorType: input.actorType,
    actorId: input.actorId,
    targetType: input.targetType,
    targetId: input.targetId,
    action: input.action,
    outcome: input.outcome,
    details: input.details ?? {},
    previousHash: _lastHash,
    entryHash,
    linkedEventId: input.linkedEventId,
    linkedIncidentId: input.linkedIncidentId,
    createdAt: now,
  };

  _lastHash = entryHash;
  _inMemoryEntries.push(entry);

  if (_inMemoryEntries.length > 1000) {
    _inMemoryEntries.splice(0, _inMemoryEntries.length - 1000);
  }

  logger.debug({ seq, entryType: input.entryType, action: input.action }, '[EvidenceLedger] entry appended');

  if (_dbWriter) {
    _dbWriter(entry).catch((err) =>
      logger.debug({ err, seq }, '[EvidenceLedger] DB write error (non-fatal)'),
    );
  }

  return entry;
}

export function getRecentEntries(limit = 50): LedgerEntry[] {
  return _inMemoryEntries.slice(-limit).reverse();
}

export function verifyChainIntegrity(): { valid: boolean; brokenAt?: number; checkedEntries: number } {
  let prevHash: string | null = null;
  for (const entry of _inMemoryEntries) {
    const contentForHash = JSON.stringify({
      seq: entry.sequenceNumber,
      entryType: entry.entryType,
      action: entry.action,
      outcome: entry.outcome,
      actorType: entry.actorType,
      actorId: entry.actorId,
      targetType: entry.targetType,
      targetId: entry.targetId,
      ts: entry.createdAt,
    });
    const expected = computeHash(prevHash, contentForHash);
    if (expected !== entry.entryHash) {
      return { valid: false, brokenAt: entry.sequenceNumber, checkedEntries: entry.sequenceNumber };
    }
    prevHash = entry.entryHash;
  }
  return { valid: true, checkedEntries: _inMemoryEntries.length };
}

export function getLastHash(): string | null {
  return _lastHash;
}
