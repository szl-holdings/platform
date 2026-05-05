/**
 * Disclosure Audit Helpers
 *
 * Wraps common third-party disclosure events into properly structured
 * Evidence Ledger entries. All disclosure events are appended to the
 * immutable hash-chained Proof Ledger.
 *
 * Entity types registered here:
 *  - disclosure_record       — a data-sharing disclosure event
 *  - legal_agreement         — an agreement lifecycle transition
 *  - subprocessor_change     — a subprocessor addition or removal
 */
import type { LedgerEntry, ProofEnvelope } from '@szl-holdings/shared-contracts';
import { EvidenceLedger } from './ledger.js';

export type DisclosureEntityType =
  | 'disclosure_record'
  | 'legal_agreement'
  | 'subprocessor_change';

export interface DisclosureAuditOptions {
  traceId: string;
  actor?: string;
  actorRole?: string;
  orgId?: string;
  workflowRunId?: string;
}

const sharedLedger = new EvidenceLedger();

function buildEnvelope(
  opts: DisclosureAuditOptions,
  extra?: Omit<Partial<ProofEnvelope>, 'traceId' | 'generatedAt' | 'sources' | 'toolCalls' | 'confidence' | 'freshness'>,
): Omit<ProofEnvelope, 'generatedAt'> {
  return {
    traceId: opts.traceId,
    workflowRunId: opts.workflowRunId,
    sources: [],
    toolCalls: [],
    confidence: 'high',
    freshness: 'fresh',
    policyVerdict: 'allowed',
    ...extra,
  };
}

/**
 * Log a data-sharing disclosure event to the Proof Ledger.
 * Called whenever a new disclosure record is created or its status changes.
 */
export function logDisclosureEvent(opts: {
  disclosureId: string;
  recipientName: string;
  action: 'created' | 'approved' | 'updated' | 'expired' | 'terminated' | 'archived';
  legalBasis: string;
  dataCategories: string[];
  agreementId?: string;
  audit: DisclosureAuditOptions;
}): LedgerEntry {
  const dataStr = opts.dataCategories.join(', ');
  const agreementSuffix = opts.agreementId ? ` Agreement: ${opts.agreementId}.` : '';
  return sharedLedger.append({
    entityType: 'disclosure_record',
    entityId: opts.disclosureId,
    action: `disclosure.${opts.action}`,
    actor: opts.audit.actor,
    actorRole: opts.audit.actorRole,
    envelope: buildEnvelope(opts.audit, {
      agentRole: 'disclosure-registry',
      policyReason: `[${opts.disclosureId}] recipient=${opts.recipientName} basis=${opts.legalBasis} data=[${dataStr}]${agreementSuffix} org=${opts.audit.orgId ?? 'unknown'}`,
    }),
  });
}

/**
 * Log a legal agreement lifecycle transition to the Proof Ledger.
 * Called whenever an agreement changes status (draft → sent → active → …).
 */
export function logAgreementEvent(opts: {
  agreementId: string;
  agreementType: string;
  counterpartyName: string;
  action:
    | 'created'
    | 'sent'
    | 'countersigned'
    | 'activated'
    | 'expired'
    | 'terminated'
    | 'amended';
  previousStatus?: string;
  newStatus: string;
  audit: DisclosureAuditOptions;
}): LedgerEntry {
  const transition = opts.previousStatus
    ? `${opts.previousStatus}->${opts.newStatus}`
    : opts.newStatus;
  return sharedLedger.append({
    entityType: 'legal_agreement',
    entityId: opts.agreementId,
    action: `agreement.${opts.action}`,
    actor: opts.audit.actor,
    actorRole: opts.audit.actorRole,
    envelope: buildEnvelope(opts.audit, {
      agentRole: 'legal-agreement-lifecycle',
      policyReason: `[${opts.agreementId}] type=${opts.agreementType.toUpperCase()} counterparty=${opts.counterpartyName} status=${transition} org=${opts.audit.orgId ?? 'unknown'}`,
    }),
  });
}

/**
 * Log a subprocessor addition or removal to the Proof Ledger.
 * Called whenever a subprocessor is added, removed, or changes status.
 */
export function logSubprocessorChange(opts: {
  subprocessorId: string;
  subprocessorName: string;
  country: string;
  action: 'added' | 'removed' | 'status_changed' | 'audited';
  previousStatus?: string;
  newStatus: string;
  dataCategories: string[];
  audit: DisclosureAuditOptions;
}): LedgerEntry {
  const transition = opts.previousStatus
    ? `${opts.previousStatus}->${opts.newStatus}`
    : opts.newStatus;
  const dataStr = opts.dataCategories.join(', ');
  return sharedLedger.append({
    entityType: 'subprocessor_change',
    entityId: opts.subprocessorId,
    action: `subprocessor.${opts.action}`,
    actor: opts.audit.actor,
    actorRole: opts.audit.actorRole,
    envelope: buildEnvelope(opts.audit, {
      agentRole: 'subprocessor-registry',
      policyReason: `[${opts.subprocessorId}] name=${opts.subprocessorName} country=${opts.country} status=${transition} data=[${dataStr}] org=${opts.audit.orgId ?? 'unknown'}`,
    }),
  });
}

export { sharedLedger as disclosureLedger };
