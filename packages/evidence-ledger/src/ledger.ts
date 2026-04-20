/**
 * AEEP Evidence Ledger
 *
 * Append-only ledger of LedgerEntry records.
 * Entries are immutable once written. Any mutation attempt throws.
 *
 * Each entry carries a ProofEnvelope with:
 *  - traceId
 *  - Source citations
 *  - Tool call records
 *  - Confidence and freshness scores
 *  - Policy verdict
 */
import type {
  ConfidenceLevel,
  FreshnessLevel,
  LedgerEntry,
  ProofEnvelope,
} from '@szl-holdings/shared-contracts';

export interface LedgerAppendOptions {
  entityType: string;
  entityId: string;
  action: string;
  actor?: string;
  actorRole?: string;
  envelope: Omit<ProofEnvelope, 'generatedAt'>;
}

let _entryCounter = 0;

function generateEntryId(): string {
  return `le_${Date.now()}_${(++_entryCounter).toString().padStart(6, '0')}`;
}

export class EvidenceLedger {
  private readonly entries: LedgerEntry[] = [];

  /**
   * Append a new immutable ledger entry.
   */
  append(options: LedgerAppendOptions): LedgerEntry {
    const entry: LedgerEntry = Object.freeze({
      entryId: generateEntryId(),
      traceId: options.envelope.traceId,
      entityType: options.entityType,
      entityId: options.entityId,
      action: options.action,
      ...(options.actor !== undefined ? { actor: options.actor } : {}),
      ...(options.actorRole !== undefined ? { actorRole: options.actorRole } : {}),
      envelope: Object.freeze({
        ...options.envelope,
        generatedAt: new Date().toISOString(),
      }),
      immutable: true as const,
      timestamp: new Date().toISOString(),
    });

    this.entries.push(entry);
    return entry;
  }

  /**
   * Query entries by entity.
   */
  getByEntity(entityType: string, entityId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.entityType === entityType && e.entityId === entityId);
  }

  /**
   * Query entries by traceId.
   */
  getByTrace(traceId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.traceId === traceId);
  }

  /**
   * Query entries by workflow run.
   */
  getByWorkflowRun(workflowRunId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.envelope.workflowRunId === workflowRunId);
  }

  /**
   * Return all entries (read-only view).
   */
  getAll(): readonly LedgerEntry[] {
    return this.entries;
  }

  /**
   * Compile an EvidencePackage from a set of entries.
   */
  compilePackage(
    entries: LedgerEntry[],
    options?: { title?: string; generatedBy?: string; workflowRunId?: string },
  ) {
    const allSources = entries.flatMap((e) => e.envelope.sources);
    const confidences = entries.map((e) => e.envelope.confidence);

    const overallConfidence = resolveOverallConfidence(confidences);
    const freshnesses = entries.map((e) => e.envelope.freshness);
    const overallFreshness = resolveOverallFreshness(freshnesses);

    return {
      packageId: `pkg_${Date.now()}`,
      title: options?.title,
      entries,
      overallConfidence,
      overallFreshness,
      generatedAt: new Date().toISOString(),
      generatedBy: options?.generatedBy,
      workflowRunId: options?.workflowRunId,
    };
  }
}

function resolveOverallConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  if (levels.includes('contradiction')) return 'contradiction';
  if (levels.every((l) => l === 'high')) return 'high';
  if (levels.includes('low')) return 'low';
  return 'medium';
}

function resolveOverallFreshness(levels: FreshnessLevel[]): FreshnessLevel {
  if (levels.includes('stale')) return 'stale';
  if (levels.every((l) => l === 'fresh')) return 'fresh';
  if (levels.includes('aging')) return 'aging';
  return 'unknown';
}
