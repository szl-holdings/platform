import type {
  BusinessSignal,
  ProofCarryingExecutionContract,
  ProofPacket,
  Workcell,
} from '@workspace/a11oy-fabric';

export type ProofCoverageStatus = 'SATISFIED' | 'MISMATCH' | 'UNAVAILABLE';

export interface ProofCoverageObligation {
  id:
    | 'signal-records'
    | 'origin-signal'
    | 'action-binding'
    | 'trace-binding'
    | 'policy-evaluation'
    | 'approval-binding'
    | 'proof-reference'
    | 'proof-subject'
    | 'proof-context'
    | 'proof-policy-binding'
    | 'proof-approval-binding'
    | 'terminal-state';
  label: string;
  status: ProofCoverageStatus;
  detail: string;
  refs: string[];
}

export interface ProofCoverageChallenges {
  removeProofReference?: boolean;
  substituteActionId?: boolean;
  removeApprovalReference?: boolean;
}

export interface WorkcellProofCoverageInput {
  workcell: Workcell;
  signals: readonly BusinessSignal[];
  pceContracts: readonly ProofCarryingExecutionContract[];
  proofPackets: readonly ProofPacket[];
  policyEvaluationIds?: readonly string[];
  approvalRecordIds?: readonly string[];
  challenges?: ProofCoverageChallenges;
}

export interface WorkcellProofCoverageResult {
  state: 'COMPLETE' | 'INCOMPLETE';
  satisfied: number;
  total: number;
  obligations: ProofCoverageObligation[];
}

const obligation = (
  id: ProofCoverageObligation['id'],
  label: string,
  status: ProofCoverageStatus,
  detail: string,
  refs: string[] = [],
): ProofCoverageObligation => ({ id, label, status, detail, refs });

export function evaluateWorkcellProofCoverage({
  workcell,
  signals,
  pceContracts,
  proofPackets,
  policyEvaluationIds = [],
  approvalRecordIds = [],
  challenges = {},
}: WorkcellProofCoverageInput): WorkcellProofCoverageResult {
  const storedContract = pceContracts.find((contract) => contract.id === workcell.pceContractId);
  const actionId = challenges.substituteActionId
    ? `${storedContract?.actionId ?? workcell.actionBrief.id}:challenge`
    : storedContract?.actionId;
  const approvalRecordId = challenges.removeApprovalReference
    ? undefined
    : storedContract?.approvalRecordId;
  const proofPacketId = challenges.removeProofReference ? undefined : storedContract?.proofPacketId;
  const proofPacket = proofPackets.find((packet) => packet.id === proofPacketId);
  const knownSignalIds = new Set(signals.map((signal) => signal.id));
  const missingSignalIds = workcell.signals.filter((id) => !knownSignalIds.has(id));
  const obligations: ProofCoverageObligation[] = [];

  obligations.push(
    missingSignalIds.length === 0
      ? obligation(
          'signal-records',
          'Signal records resolve',
          'SATISFIED',
          `${workcell.signals.length} declared signal reference${workcell.signals.length === 1 ? '' : 's'} joined to repository fixtures.`,
          workcell.signals,
        )
      : obligation(
          'signal-records',
          'Signal records resolve',
          'UNAVAILABLE',
          `No repository fixture was found for ${missingSignalIds.join(', ')}.`,
          missingSignalIds,
        ),
  );

  if (!storedContract) {
    obligations.push(
      obligation(
        'origin-signal',
        'Origin signal belongs to the Workcell',
        'UNAVAILABLE',
        `Contract ${workcell.pceContractId} is not present in the fixture registry.`,
        [workcell.pceContractId],
      ),
      obligation(
        'action-binding',
        'Action identity is bound',
        'UNAVAILABLE',
        `Contract ${workcell.pceContractId} is required to join the action.`,
        [workcell.actionBrief.id, workcell.pceContractId],
      ),
      obligation(
        'trace-binding',
        'Trace references agree',
        'UNAVAILABLE',
        `Contract ${workcell.pceContractId} is required to compare the trace reference.`,
        [workcell.executionTraceId, workcell.pceContractId],
      ),
      obligation(
        'policy-evaluation',
        'Policy evaluation resolves',
        'UNAVAILABLE',
        'No contract is available to declare a policy-evaluation reference.',
        [workcell.pceContractId],
      ),
      obligation(
        'approval-binding',
        'Approval reference resolves',
        'UNAVAILABLE',
        'No contract is available to declare an approval reference.',
        [workcell.actionBrief.id],
      ),
      obligation(
        'proof-reference',
        'Proof Packet resolves',
        'UNAVAILABLE',
        'No contract is available to declare a Proof Packet reference.',
        [workcell.proofPacketId],
      ),
      obligation(
        'proof-subject',
        'Proof Packet covers this execution',
        'UNAVAILABLE',
        'A joined Proof Packet is required before its subject can be checked.',
        [workcell.id, workcell.actionBrief.id],
      ),
      obligation(
        'proof-context',
        'Proof Packet has execution context',
        'UNAVAILABLE',
        'A joined Proof Packet is required before its kind and vertical can be checked.',
        [workcell.vertical],
      ),
      obligation(
        'proof-policy-binding',
        'Proof Packet policy reference agrees',
        'UNAVAILABLE',
        'A joined contract and Proof Packet are required before policy references can be compared.',
        [workcell.pceContractId],
      ),
      obligation(
        'proof-approval-binding',
        'Proof Packet approval reference agrees',
        'UNAVAILABLE',
        'A joined contract and Proof Packet are required before approval references can be compared.',
        [workcell.pceContractId],
      ),
      obligation(
        'terminal-state',
        'Terminal fixture state is recorded',
        'UNAVAILABLE',
        'A joined Proof Packet is required before terminal fixture state can be checked.',
        [workcell.verificationResult.status],
      ),
    );
  } else {
    obligations.push(
      workcell.signals.includes(storedContract.originSignalId)
        ? obligation(
            'origin-signal',
            'Origin signal belongs to the Workcell',
            'SATISFIED',
            'The contract origin is one of the Workcell signal inputs.',
            [storedContract.originSignalId],
          )
        : obligation(
            'origin-signal',
            'Origin signal belongs to the Workcell',
            'MISMATCH',
            'The contract origin is not declared by this Workcell.',
            [storedContract.originSignalId, ...workcell.signals],
          ),
      actionId === workcell.actionBrief.id
        ? obligation(
            'action-binding',
            'Action identity is bound',
            'SATISFIED',
            'The contract and ActionBrief identify the same action.',
            [workcell.actionBrief.id],
          )
        : obligation(
            'action-binding',
            'Action identity is bound',
            'MISMATCH',
            'The contract action does not match the Workcell ActionBrief.',
            [actionId ?? 'missing', workcell.actionBrief.id],
          ),
      storedContract.executionTraceId === workcell.executionTraceId
        ? obligation(
            'trace-binding',
            'Trace references agree',
            'SATISFIED',
            'The contract and Workcell declare the same trace ID. No trace record is resolved.',
            [workcell.executionTraceId],
          )
        : obligation(
            'trace-binding',
            'Trace references agree',
            'MISMATCH',
            'The contract trace reference does not match the Workcell trace reference.',
            [storedContract.executionTraceId, workcell.executionTraceId],
          ),
    );

    obligations.push(
      policyEvaluationIds.includes(storedContract.policyEvaluationId)
        ? obligation(
            'policy-evaluation',
            'Policy evaluation resolves',
            'SATISFIED',
            'The declared policy-evaluation record is present in the supplied registry.',
            [storedContract.policyEvaluationId],
          )
        : obligation(
            'policy-evaluation',
            'Policy evaluation resolves',
            'UNAVAILABLE',
            'The contract declares an ID, but no policy-evaluation registry record resolves it.',
            [storedContract.policyEvaluationId],
          ),
    );

    if (workcell.requiresApproval !== workcell.actionBrief.requiresApproval) {
      obligations.push(
        obligation(
          'approval-binding',
          'Approval reference resolves',
          'MISMATCH',
          'The Workcell and ActionBrief disagree about whether approval is required.',
          [
            `workcell:${String(workcell.requiresApproval)}`,
            `action:${String(workcell.actionBrief.requiresApproval)}`,
          ],
        ),
      );
    } else if (!workcell.requiresApproval && approvalRecordId) {
      obligations.push(
        obligation(
          'approval-binding',
          'Approval reference resolves',
          'MISMATCH',
          'Approval is not required, but the contract still declares an approval-record reference.',
          [approvalRecordId],
        ),
      );
    } else if (!workcell.requiresApproval) {
      obligations.push(
        obligation(
          'approval-binding',
          'Approval reference resolves',
          'SATISFIED',
          'The Workcell and ActionBrief require no approval, and the contract declares no approval reference.',
        ),
      );
    } else if (!approvalRecordId) {
      obligations.push(
        obligation(
          'approval-binding',
          'Approval reference resolves',
          'UNAVAILABLE',
          'This approval-required Workcell has no approval-record reference in the inspected contract.',
          [workcell.actionBrief.id],
        ),
      );
    } else if (approvalRecordIds.includes(approvalRecordId)) {
      obligations.push(
        obligation(
          'approval-binding',
          'Approval reference resolves',
          'SATISFIED',
          'The approval ID resolves in the supplied reference registry. Scope and actor are not verified.',
          [approvalRecordId, workcell.actionBrief.id],
        ),
      );
    } else {
      obligations.push(
        obligation(
          'approval-binding',
          'Approval reference resolves',
          'UNAVAILABLE',
          'The contract declares an approval ID, but no approval registry record resolves it.',
          [approvalRecordId],
        ),
      );
    }

    if (!proofPacketId) {
      obligations.push(
        obligation(
          'proof-reference',
          'Proof Packet resolves',
          'UNAVAILABLE',
          'The inspected contract has no Proof Packet reference.',
          [storedContract.id],
        ),
      );
    } else if (workcell.proofPacketId !== proofPacketId) {
      obligations.push(
        obligation(
          'proof-reference',
          'Proof Packet resolves',
          'MISMATCH',
          'The Workcell and contract identify different Proof Packets.',
          [workcell.proofPacketId, proofPacketId],
        ),
      );
    } else if (!proofPacket) {
      obligations.push(
        obligation(
          'proof-reference',
          'Proof Packet resolves',
          'UNAVAILABLE',
          'The Proof Packet ID does not resolve in the repository fixture registry.',
          [proofPacketId],
        ),
      );
    } else {
      obligations.push(
        obligation(
          'proof-reference',
          'Proof Packet resolves',
          'SATISFIED',
          'The Workcell and contract join to one repository Proof Packet fixture.',
          [proofPacket.id],
        ),
      );
    }

    if (!proofPacket) {
      obligations.push(
        obligation(
          'proof-subject',
          'Proof Packet covers this execution',
          'UNAVAILABLE',
          'A joined Proof Packet is required before its subject can be checked.',
          [workcell.id, workcell.actionBrief.id],
        ),
      );
    } else if (
      (proofPacket.entityType === 'workcell' && proofPacket.entityId === workcell.id) ||
      (proofPacket.entityType === 'action' && proofPacket.entityId === workcell.actionBrief.id)
    ) {
      obligations.push(
        obligation(
          'proof-subject',
          'Proof Packet covers this execution',
          'SATISFIED',
          'The Proof Packet subject is this Workcell or its declared action.',
          [proofPacket.entityType, proofPacket.entityId],
        ),
      );
    } else {
      obligations.push(
        obligation(
          'proof-subject',
          'Proof Packet covers this execution',
          'MISMATCH',
          'The joined Proof Packet concerns a different fixture subject.',
          [proofPacket.entityType, proofPacket.entityId, workcell.id, workcell.actionBrief.id],
        ),
      );
    }

    if (!proofPacket) {
      obligations.push(
        obligation(
          'proof-context',
          'Proof Packet has execution context',
          'UNAVAILABLE',
          'A joined Proof Packet is required before its kind and vertical can be checked.',
          [workcell.vertical],
        ),
      );
    } else if (
      proofPacket.kind !== 'action_execution' ||
      proofPacket.vertical !== workcell.vertical
    ) {
      obligations.push(
        obligation(
          'proof-context',
          'Proof Packet has execution context',
          'MISMATCH',
          'The Proof Packet must be action-execution evidence for the Workcell vertical.',
          [proofPacket.kind, proofPacket.vertical, workcell.vertical],
        ),
      );
    } else {
      obligations.push(
        obligation(
          'proof-context',
          'Proof Packet has execution context',
          'SATISFIED',
          'The Proof Packet declares action-execution evidence for the Workcell vertical.',
          [proofPacket.kind, proofPacket.vertical],
        ),
      );
    }

    if (!proofPacket?.policyEvaluationId) {
      obligations.push(
        obligation(
          'proof-policy-binding',
          'Proof Packet policy reference agrees',
          'UNAVAILABLE',
          'The joined Proof Packet has no policy-evaluation reference.',
          [storedContract.policyEvaluationId],
        ),
      );
    } else if (proofPacket.policyEvaluationId !== storedContract.policyEvaluationId) {
      obligations.push(
        obligation(
          'proof-policy-binding',
          'Proof Packet policy reference agrees',
          'MISMATCH',
          'The Proof Packet and contract declare different policy-evaluation references.',
          [proofPacket.policyEvaluationId, storedContract.policyEvaluationId],
        ),
      );
    } else {
      obligations.push(
        obligation(
          'proof-policy-binding',
          'Proof Packet policy reference agrees',
          'SATISFIED',
          'The Proof Packet and contract declare the same policy-evaluation reference.',
          [proofPacket.policyEvaluationId],
        ),
      );
    }

    if (workcell.requiresApproval !== workcell.actionBrief.requiresApproval) {
      obligations.push(
        obligation(
          'proof-approval-binding',
          'Proof Packet approval reference agrees',
          'MISMATCH',
          'The Workcell and ActionBrief disagree about whether approval is required.',
          [
            `workcell:${String(workcell.requiresApproval)}`,
            `action:${String(workcell.actionBrief.requiresApproval)}`,
          ],
        ),
      );
    } else if (!workcell.requiresApproval && (approvalRecordId || proofPacket?.approvalRecordId)) {
      obligations.push(
        obligation(
          'proof-approval-binding',
          'Proof Packet approval reference agrees',
          'MISMATCH',
          'Approval is not required, but the contract or Proof Packet still declares an approval-record reference.',
          [approvalRecordId ?? 'contract:none', proofPacket?.approvalRecordId ?? 'packet:none'],
        ),
      );
    } else if (!workcell.requiresApproval) {
      obligations.push(
        obligation(
          'proof-approval-binding',
          'Proof Packet approval reference agrees',
          'SATISFIED',
          'The Workcell and ActionBrief require no approval, and neither joined record declares an approval reference.',
        ),
      );
    } else if (!approvalRecordId) {
      obligations.push(
        obligation(
          'proof-approval-binding',
          'Proof Packet approval reference agrees',
          'UNAVAILABLE',
          'The inspected contract has no approval-record reference to compare with the Proof Packet.',
          [workcell.actionBrief.id],
        ),
      );
    } else if (!proofPacket?.approvalRecordId) {
      obligations.push(
        obligation(
          'proof-approval-binding',
          'Proof Packet approval reference agrees',
          'UNAVAILABLE',
          'The joined Proof Packet has no approval-record reference.',
          [approvalRecordId],
        ),
      );
    } else if (proofPacket.approvalRecordId !== approvalRecordId) {
      obligations.push(
        obligation(
          'proof-approval-binding',
          'Proof Packet approval reference agrees',
          'MISMATCH',
          'The Proof Packet and contract declare different approval-record references.',
          [proofPacket.approvalRecordId, approvalRecordId],
        ),
      );
    } else {
      obligations.push(
        obligation(
          'proof-approval-binding',
          'Proof Packet approval reference agrees',
          'SATISFIED',
          'The Proof Packet and contract declare the same approval-record reference.',
          [proofPacket.approvalRecordId],
        ),
      );
    }

    obligations.push(
      proofPacket?.hash && ['passed', 'failed'].includes(workcell.verificationResult.status)
        ? obligation(
            'terminal-state',
            'Terminal fixture state is recorded',
            'SATISFIED',
            `The fixture records a ${workcell.verificationResult.status} terminal check and a packet hash string. This is not signature verification.`,
            [workcell.verificationResult.status, proofPacket.id],
          )
        : obligation(
            'terminal-state',
            'Terminal fixture state is recorded',
            'UNAVAILABLE',
            'The joined fixture lacks a terminal check or Proof Packet hash string.',
            [workcell.verificationResult.status],
          ),
    );
  }

  const satisfied = obligations.filter((item) => item.status === 'SATISFIED').length;
  return {
    state: satisfied === obligations.length ? 'COMPLETE' : 'INCOMPLETE',
    satisfied,
    total: obligations.length,
    obligations,
  };
}
