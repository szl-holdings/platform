import type { WorkcellPhase } from '../types.js';
import { randomUUID } from 'node:crypto';
import { createTrace, appendEntry, completeTrace, buildTraceEntry } from '../tracing/store.js';
import { runPCEGate, createApprovalRecord, approveAction, attachTraceToContract, generateProofPacket, getPCEContract } from '../governance/pce-gate.js';

export interface WorkcellEntity {
  id: string;
  name: string;
  description: string;
  vertical: string;
  phase: WorkcellPhase;
  operatorId: string;
  tools: string[];
  approvalTier: 'auto' | 'operator' | 'executive';
  maxRunDurationMs: number;
  pceContractId?: string;
  approvalRecordId?: string;
  traceId?: string;
  proofPacketId?: string;
  lastError?: string;
  originSignalIds: string[];
  createdAt: string;
  updatedAt: string;
  history: Array<{ phase: WorkcellPhase; timestamp: string; note?: string }>;
}

const MAX_WORKCELLS = 200;
const workcells = new Map<string, WorkcellEntity>();

const VALID_TRANSITIONS: Partial<Record<WorkcellPhase, WorkcellPhase[]>> = {
  intake: ['planning', 'blocked', 'rejected'],
  planning: ['context_building', 'blocked', 'rejected'],
  context_building: ['risk_review', 'blocked'],
  risk_review: ['action_brief_created', 'approval_required', 'blocked'],
  action_brief_created: ['pce_contract_created', 'blocked'],
  pce_contract_created: ['approval_required', 'approved', 'blocked'],
  approval_required: ['approved', 'rejected', 'blocked'],
  approved: ['executing', 'blocked'],
  executing: ['verifying', 'blocked', 'rejected'],
  verifying: ['proven', 'blocked'],
  proven: ['archived'],
  blocked: ['archived', 'intake'],
  rejected: ['archived'],
  archived: [],
};

export function createWorkcell(opts: {
  name: string;
  description?: string;
  vertical: string;
  operatorId?: string;
  approvalTier?: 'auto' | 'operator' | 'executive';
  originSignalIds?: string[];
  tools?: string[];
}): WorkcellEntity {
  if (workcells.size >= MAX_WORKCELLS) {
    const oldest = [...workcells.values()]
      .filter((w) => ['archived', 'proven', 'rejected'].includes(w.phase))
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))[0];
    if (oldest) workcells.delete(oldest.id);
  }

  const now = new Date().toISOString();
  const wc: WorkcellEntity = {
    id: `wc-${randomUUID().slice(0, 8)}`,
    name: opts.name,
    description: opts.description ?? '',
    vertical: opts.vertical,
    phase: 'intake',
    operatorId: opts.operatorId ?? 'planner',
    tools: opts.tools ?? [],
    approvalTier: opts.approvalTier ?? 'operator',
    maxRunDurationMs: 300_000,
    originSignalIds: opts.originSignalIds ?? [],
    createdAt: now,
    updatedAt: now,
    history: [{ phase: 'intake', timestamp: now }],
  };

  workcells.set(wc.id, wc);
  return wc;
}

export function transition(workcellId: string, toPhase: WorkcellPhase, note?: string): WorkcellEntity | undefined {
  const wc = workcells.get(workcellId);
  if (!wc) return undefined;

  const valid = VALID_TRANSITIONS[wc.phase];
  if (!valid?.includes(toPhase)) return undefined;

  wc.phase = toPhase;
  wc.updatedAt = new Date().toISOString();
  wc.history.push({ phase: toPhase, timestamp: wc.updatedAt, note });

  return wc;
}

export async function advanceWorkcell(workcellId: string): Promise<WorkcellEntity | undefined> {
  const wc = workcells.get(workcellId);
  if (!wc) return undefined;

  const traceId = createTrace({ entityId: wc.id, entityType: 'workcell' });
  wc.traceId = traceId;

  const runId = `run-${randomUUID().slice(0, 8)}`;

  function log(name: string, input: Record<string, unknown>, output: Record<string, unknown>, status: 'ok' | 'error' | 'blocked') {
    appendEntry(traceId, buildTraceEntry(runId, wc.id, 'operator', name, input, output, status, 0));
  }

  switch (wc.phase) {
    case 'intake': {
      transition(wc.id, 'planning', 'Intake processed. Moving to planning.');
      log('workcell:intake', {}, { nextPhase: 'planning' }, 'ok');
      break;
    }

    case 'planning': {
      transition(wc.id, 'context_building', 'Planning complete. Building context.');
      log('workcell:planning', {}, { nextPhase: 'context_building' }, 'ok');
      break;
    }

    case 'context_building': {
      transition(wc.id, 'risk_review', 'Context built. Moving to risk review.');
      log('workcell:context_building', {}, { nextPhase: 'risk_review' }, 'ok');
      break;
    }

    case 'risk_review': {
      const requiresApproval = wc.approvalTier !== 'auto';
      if (requiresApproval) {
        const approval = createApprovalRecord({ actionId: wc.id, tier: wc.approvalTier });
        wc.approvalRecordId = approval.approvalId;
        transition(wc.id, 'action_brief_created', 'Risk reviewed. Action brief created.');
        log('workcell:risk_review', {}, { approvalRecordId: approval.approvalId, nextPhase: 'action_brief_created' }, 'ok');
      } else {
        transition(wc.id, 'action_brief_created', 'Risk reviewed (auto). Action brief created.');
        log('workcell:risk_review', {}, { nextPhase: 'action_brief_created' }, 'ok');
      }
      break;
    }

    case 'action_brief_created': {
      const pceResult = await runPCEGate({
        actionId: wc.id,
        workcellId: wc.id,
        originSignalIds: wc.originSignalIds,
        vertical: wc.vertical,
        riskLevel: 'medium',
        isDestructive: false,
        approvalRecordId: wc.approvalRecordId,
      });

      if (pceResult.allowed && pceResult.contract) {
        wc.pceContractId = pceResult.contract.contractId;
        transition(wc.id, 'pce_contract_created', 'PCE contract created.');
        log('workcell:pce_gate', {}, { contractId: pceResult.contract.contractId }, 'ok');
      } else {
        const needsApproval = pceResult.errorType === 'approval_required';
        if (needsApproval) {
          transition(wc.id, 'approval_required', pceResult.blockedReason);
        } else {
          transition(wc.id, 'blocked', pceResult.blockedReason ?? 'PCE gate blocked execution.');
          wc.lastError = pceResult.blockedReason;
        }
        log('workcell:pce_gate', {}, { blocked: true, reason: pceResult.blockedReason }, 'blocked');
      }
      break;
    }

    case 'pce_contract_created': {
      if (wc.approvalTier === 'auto') {
        if (wc.approvalRecordId) {
          approveAction(wc.approvalRecordId, 'auto-approval-system');
        }
        transition(wc.id, 'approved', 'Auto-approved. Ready to execute.');
        log('workcell:auto_approve', {}, { nextPhase: 'approved' }, 'ok');
      } else {
        transition(wc.id, 'approval_required', 'Awaiting human approval.');
        log('workcell:awaiting_approval', {}, { tier: wc.approvalTier }, 'ok');
      }
      break;
    }

    case 'approval_required': {
      transition(wc.id, 'blocked', 'Waiting for approval. Not auto-advancing.');
      log('workcell:approval_wait', {}, { status: 'pending' }, 'ok');
      break;
    }

    case 'approved': {
      transition(wc.id, 'executing', 'Approved. Executing actions.');
      log('workcell:executing', {}, { nextPhase: 'executing' }, 'ok');
      break;
    }

    case 'executing': {
      if (wc.pceContractId) {
        attachTraceToContract(wc.pceContractId, traceId);
      }
      transition(wc.id, 'verifying', 'Execution complete. Moving to verification.');
      log('workcell:verifying', {}, { nextPhase: 'verifying' }, 'ok');
      break;
    }

    case 'verifying': {
      if (wc.pceContractId) {
        const contract = getPCEContract(wc.pceContractId);
        if (contract) {
          const packet = generateProofPacket({ ...contract, isVerified: true });
          wc.proofPacketId = packet.packetId;
        }
      }
      transition(wc.id, 'proven', 'Verified and proven.');
      completeTrace(traceId, 'completed');
      log('workcell:proven', {}, { proofPacketId: wc.proofPacketId }, 'ok');
      break;
    }

    default:
      break;
  }

  return wc;
}

export function approveWorkcell(workcellId: string, approvedBy: string): WorkcellEntity | undefined {
  const wc = workcells.get(workcellId);
  if (!wc || wc.phase !== 'approval_required') return undefined;
  if (wc.approvalRecordId) {
    approveAction(wc.approvalRecordId, approvedBy);
  }
  transition(wc.id, 'approved', `Approved by ${approvedBy}`);
  return wc;
}

export function getWorkcell(id: string): WorkcellEntity | undefined {
  return workcells.get(id);
}

export function listWorkcells(opts?: { vertical?: string; phase?: WorkcellPhase }): WorkcellEntity[] {
  let list = [...workcells.values()];
  if (opts?.vertical) list = list.filter((w) => w.vertical === opts.vertical);
  if (opts?.phase) list = list.filter((w) => w.phase === opts.phase);
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function replayWorkcell(workcellId: string): WorkcellEntity | undefined {
  const original = workcells.get(workcellId);
  if (!original) return undefined;

  const clone = createWorkcell({
    name: `[Replay] ${original.name}`,
    description: original.description,
    vertical: original.vertical,
    operatorId: original.operatorId,
    approvalTier: original.approvalTier,
    originSignalIds: original.originSignalIds,
    tools: original.tools,
  });

  return clone;
}

// ─── Demo Seed ────────────────────────────────────────────────────────────────
// Pre-populate the in-memory store with the canonical demo workcell entries so
// that CLI replay, advance, and approve calls work against the standard IDs
// without requiring a prior `POST /api/a11oy/workcells` call in the session.

const DEMO_WORKCELLS: Array<{
  id: string;
  name: string;
  description: string;
  vertical: string;
  operatorId: string;
  approvalTier: 'auto' | 'operator' | 'executive';
  phase: WorkcellPhase;
}> = [
  { id: 'wc-lyte-churn', name: 'Revenue Friction Remediation', description: 'Investigate and remediate enterprise ARR growth deceleration.', vertical: 'lyte-revenue', operatorId: 'op-csm-lyte', approvalTier: 'executive', phase: 'approval_required' },
  { id: 'wc-terra-covenant', name: 'Terra Covenant Breach Response', description: 'Emergency lease-up and lender notification for covenant remediation.', vertical: 'terra-real-estate', operatorId: 'op-portfolio-terra', approvalTier: 'executive', phase: 'action_brief_created' },
  { id: 'wc-vessels-psc', name: 'Voyage Risk Assessment', description: 'Assess and mitigate risks for active maritime voyages.', vertical: 'vessels-maritime', operatorId: 'op-fleet-vessels', approvalTier: 'operator', phase: 'risk_review' },
  { id: 'wc-aegis-threat', name: 'APT Attribution & Containment', description: 'Threat intelligence and incident containment for state-level adversary.', vertical: 'aegis-defense', operatorId: 'op-ti-aegis', approvalTier: 'executive', phase: 'executing' },
  { id: 'wc-a11oy-fabric-health', name: 'Fabric Health Sweep', description: 'Automated fabric health check and state engine maintenance.', vertical: 'alloy-core', operatorId: 'op-platform-a11oy', approvalTier: 'auto', phase: 'proven' },
];

function seedDemoWorkcells(): void {
  const now = new Date().toISOString();
  for (const seed of DEMO_WORKCELLS) {
    if (!workcells.has(seed.id)) {
      const wc: WorkcellEntity = {
        id: seed.id,
        name: seed.name,
        description: seed.description,
        vertical: seed.vertical,
        phase: seed.phase,
        operatorId: seed.operatorId,
        tools: [],
        approvalTier: seed.approvalTier,
        maxRunDurationMs: 300_000,
        originSignalIds: [],
        createdAt: now,
        updatedAt: now,
        history: [{ phase: seed.phase, timestamp: now }],
      };
      workcells.set(wc.id, wc);
    }
  }
}

seedDemoWorkcells();
