import type {
  BusinessSignal,
  ExecutionTrace,
  ProofCarryingExecutionContract,
  ProofPacket,
  Workcell,
} from '@workspace/a11oy-fabric';

export type ProofCoverageStatus = 'SATISFIED' | 'MISMATCH' | 'UNAVAILABLE';

export interface ProofCoverageObligation {
  id:
    | 'signal-records'
    | 'contract-record'
    | 'contract-integrity'
    | 'origin-signal'
    | 'action-binding'
    | 'action-context'
    | 'evaluation-lineage'
    | 'trace-binding'
    | 'policy-evaluation'
    | 'approval-binding'
    | 'proof-reference'
    | 'proof-subject'
    | 'proof-context'
    | 'proof-policy-binding'
    | 'proof-approval-binding'
    | 'proof-integrity'
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
  executionTraces?: readonly ExecutionTrace[];
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

const SHA256_REFERENCE = /^sha256:[a-f0-9]{64}$/i;

const isNonEmpty = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isTimestamp = (value: string | undefined): value is string =>
  isNonEmpty(value) && Number.isFinite(Date.parse(value));

const duplicateValues = (values: readonly string[]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
};

export function evaluateWorkcellProofCoverage({
  workcell,
  signals,
  pceContracts,
  proofPackets,
  executionTraces = [],
  policyEvaluationIds = [],
  approvalRecordIds = [],
  challenges = {},
}: WorkcellProofCoverageInput): WorkcellProofCoverageResult {
  const contractMatches = pceContracts.filter((contract) => contract.id === workcell.pceContractId);
  const storedContract = contractMatches.length === 1 ? contractMatches[0] : undefined;
  const actionId = challenges.substituteActionId
    ? `${storedContract?.actionId ?? workcell.actionBrief.id}:challenge`
    : storedContract?.actionId;
  const approvalRecordId = challenges.removeApprovalReference
    ? undefined
    : storedContract?.approvalRecordId;
  const proofPacketId = challenges.removeProofReference ? undefined : storedContract?.proofPacketId;
  const proofPacketMatches = proofPacketId
    ? proofPackets.filter((packet) => packet.id === proofPacketId)
    : [];
  const proofPacket = proofPacketMatches.length === 1 ? proofPacketMatches[0] : undefined;
  const obligations: ProofCoverageObligation[] = [];

  const declaredSignalDuplicates = duplicateValues(workcell.signals);
  const missingSignalIds: string[] = [];
  const ambiguousSignalIds: string[] = [];
  const wrongVerticalSignalIds: string[] = [];
  for (const signalId of new Set(workcell.signals)) {
    const matches = signals.filter((signal) => signal.id === signalId);
    if (matches.length === 0) missingSignalIds.push(signalId);
    if (matches.length > 1) ambiguousSignalIds.push(signalId);
    if (matches.length === 1 && matches[0]?.vertical !== workcell.vertical) {
      wrongVerticalSignalIds.push(signalId);
    }
  }

  if (declaredSignalDuplicates.length > 0 || ambiguousSignalIds.length > 0) {
    obligations.push(
      obligation(
        'signal-records',
        'Signal records resolve uniquely',
        'MISMATCH',
        `Signal identity is ambiguous. Duplicate Workcell references: ${declaredSignalDuplicates.join(', ') || 'none'}; duplicate registry records: ${ambiguousSignalIds.join(', ') || 'none'}.`,
        [...declaredSignalDuplicates, ...ambiguousSignalIds],
      ),
    );
  } else if (wrongVerticalSignalIds.length > 0) {
    obligations.push(
      obligation(
        'signal-records',
        'Signal records resolve uniquely',
        'MISMATCH',
        `Resolved signal records do not belong to Workcell vertical ${workcell.vertical}.`,
        wrongVerticalSignalIds,
      ),
    );
  } else if (missingSignalIds.length > 0) {
    obligations.push(
      obligation(
        'signal-records',
        'Signal records resolve uniquely',
        'UNAVAILABLE',
        `No repository fixture was found for ${missingSignalIds.join(', ')}.`,
        missingSignalIds,
      ),
    );
  } else {
    obligations.push(
      obligation(
        'signal-records',
        'Signal records resolve uniquely',
        'SATISFIED',
        `${workcell.signals.length} declared signal reference${workcell.signals.length === 1 ? '' : 's'} joined uniquely to fixtures in the Workcell vertical.`,
        workcell.signals,
      ),
    );
  }

  obligations.push(
    contractMatches.length === 0
      ? obligation(
          'contract-record',
          'PCE contract resolves uniquely',
          'UNAVAILABLE',
          `Contract ${workcell.pceContractId} is not present in the fixture registry.`,
          [workcell.pceContractId],
        )
      : contractMatches.length > 1
        ? obligation(
            'contract-record',
            'PCE contract resolves uniquely',
            'MISMATCH',
            `${contractMatches.length} contract records share ID ${workcell.pceContractId}; no record was selected.`,
            contractMatches.map((contract) => contract.id),
          )
        : obligation(
            'contract-record',
            'PCE contract resolves uniquely',
            'SATISFIED',
            'Exactly one PCE contract resolves for this Workcell.',
            [workcell.pceContractId],
          ),
  );

  const actionContextIssues: string[] = [];
  if (!isNonEmpty(workcell.actionBrief.id)) actionContextIssues.push('missing action ID');
  if (workcell.actionBrief.vertical !== workcell.vertical) {
    actionContextIssues.push('ActionBrief vertical differs from Workcell vertical');
  }
  if (workcell.actionBrief.linkedSignalIds.length === 0) {
    actionContextIssues.push('ActionBrief has no linked signal');
  }
  if (duplicateValues(workcell.actionBrief.linkedSignalIds).length > 0) {
    actionContextIssues.push('ActionBrief repeats a linked signal');
  }
  const foreignActionSignalIds = workcell.actionBrief.linkedSignalIds.filter(
    (id) => !workcell.signals.includes(id),
  );
  if (foreignActionSignalIds.length > 0) {
    actionContextIssues.push('ActionBrief links signals outside this Workcell');
  }
  if (
    workcell.actionBrief.proofPacketId &&
    workcell.actionBrief.proofPacketId !== workcell.proofPacketId
  ) {
    actionContextIssues.push('ActionBrief and Workcell identify different Proof Packets');
  }
  if (
    (workcell.actionBrief.requiresApproval && workcell.actionBrief.approvalTier === 'auto') ||
    (!workcell.actionBrief.requiresApproval && workcell.actionBrief.approvalTier !== 'auto')
  ) {
    actionContextIssues.push('ActionBrief approval tier contradicts its approval requirement');
  }
  obligations.push(
    actionContextIssues.length === 0
      ? obligation(
          'action-context',
          'Action context agrees',
          'SATISFIED',
          'The ActionBrief vertical, signal lineage, and optional proof reference agree with the Workcell.',
          [workcell.actionBrief.id, ...workcell.actionBrief.linkedSignalIds],
        )
      : obligation(
          'action-context',
          'Action context agrees',
          'MISMATCH',
          actionContextIssues.join('; '),
          [workcell.actionBrief.id, workcell.actionBrief.vertical, ...foreignActionSignalIds],
        ),
  );

  const evaluationLineageValid =
    isNonEmpty(workcell.mirrorEvalResult.id) &&
    workcell.mirrorEvalResult.targetType === 'action' &&
    workcell.mirrorEvalResult.targetId === workcell.actionBrief.id &&
    isNonEmpty(workcell.mirrorEvalResult.evaluatorModel) &&
    isTimestamp(workcell.mirrorEvalResult.evaluatedAt);
  obligations.push(
    evaluationLineageValid
      ? obligation(
          'evaluation-lineage',
          'Evaluation lineage agrees',
          'SATISFIED',
          'The MirrorEval fixture names this ActionBrief, an evaluator, and a parseable evaluation time.',
          [workcell.mirrorEvalResult.id, workcell.actionBrief.id],
        )
      : obligation(
          'evaluation-lineage',
          'Evaluation lineage agrees',
          'MISMATCH',
          'The MirrorEval target, evaluator, or evaluation time is inconsistent with this ActionBrief.',
          [
            workcell.mirrorEvalResult.id,
            workcell.mirrorEvalResult.targetType,
            workcell.mirrorEvalResult.targetId,
          ],
        ),
  );

  if (storedContract) {
    const contractIntegrityIssues: string[] = [];
    const contractIdentityFields = [
      storedContract.id,
      storedContract.actionId,
      storedContract.originSignalId,
      storedContract.policyEvaluationId,
      storedContract.executionTraceId,
      storedContract.proofPacketId,
    ];
    if (contractIdentityFields.some((value) => !isNonEmpty(value))) {
      contractIntegrityIssues.push('one or more required contract identifiers are empty');
    }
    if (
      storedContract.causalChainIds.length === 0 ||
      !storedContract.causalChainIds.includes(storedContract.originSignalId)
    ) {
      contractIntegrityIssues.push('causal chain does not include its origin signal');
    }
    if (duplicateValues(storedContract.causalChainIds).length > 0) {
      contractIntegrityIssues.push('causal chain repeats an identifier');
    }
    if (!storedContract.isVerified) contractIntegrityIssues.push('contract is not verified');
    if (!isTimestamp(storedContract.verifiedAt)) {
      contractIntegrityIssues.push('verifiedAt is missing or invalid');
    }
    if (!isTimestamp(storedContract.createdAt)) {
      contractIntegrityIssues.push('createdAt is invalid');
    }
    if (
      isTimestamp(storedContract.verifiedAt) &&
      isTimestamp(storedContract.createdAt) &&
      Date.parse(storedContract.verifiedAt) < Date.parse(storedContract.createdAt)
    ) {
      contractIntegrityIssues.push('verifiedAt precedes createdAt');
    }
    obligations.push(
      contractIntegrityIssues.length === 0
        ? obligation(
            'contract-integrity',
            'PCE contract integrity is recorded',
            'SATISFIED',
            'Required identifiers, causal origin, verification flag, and timestamps are present and coherent.',
            [storedContract.id, ...storedContract.causalChainIds],
          )
        : obligation(
            'contract-integrity',
            'PCE contract integrity is recorded',
            'MISMATCH',
            contractIntegrityIssues.join('; '),
            [storedContract.id, ...storedContract.causalChainIds],
          ),
    );
  } else {
    obligations.push(
      obligation(
        'contract-integrity',
        'PCE contract integrity is recorded',
        'UNAVAILABLE',
        'One unique PCE contract is required before contract integrity can be checked.',
        [workcell.pceContractId],
      ),
    );
  }

  if (!storedContract) {
    obligations.push(
      obligation(
        'origin-signal',
        'Origin signal belongs to the Workcell',
        'UNAVAILABLE',
        `One unique contract ${workcell.pceContractId} is required to inspect its origin signal.`,
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
        'proof-integrity',
        'Proof Packet integrity fields are recorded',
        'UNAVAILABLE',
        'A unique joined contract and Proof Packet are required before packet integrity can be checked.',
        [workcell.proofPacketId],
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
    let traceCoverage: ProofCoverageObligation;
    if (!isNonEmpty(storedContract.executionTraceId) || !isNonEmpty(workcell.executionTraceId)) {
      traceCoverage = obligation(
        'trace-binding',
        'Execution trace resolves uniquely',
        'UNAVAILABLE',
        'The contract and Workcell must declare a non-empty execution-trace ID.',
        [storedContract.executionTraceId, workcell.executionTraceId],
      );
    } else if (storedContract.executionTraceId !== workcell.executionTraceId) {
      traceCoverage = obligation(
        'trace-binding',
        'Execution trace resolves uniquely',
        'MISMATCH',
        'The contract trace reference does not match the Workcell trace reference.',
        [storedContract.executionTraceId, workcell.executionTraceId],
      );
    } else {
      const traceMatches = executionTraces.filter(
        (trace) => trace.id === storedContract.executionTraceId,
      );
      if (traceMatches.length === 0) {
        traceCoverage = obligation(
          'trace-binding',
          'Execution trace resolves uniquely',
          'UNAVAILABLE',
          'The trace IDs agree, but no ExecutionTrace record resolves in the supplied registry.',
          [storedContract.executionTraceId],
        );
      } else if (traceMatches.length > 1) {
        traceCoverage = obligation(
          'trace-binding',
          'Execution trace resolves uniquely',
          'MISMATCH',
          `${traceMatches.length} ExecutionTrace records share this ID; no record was selected.`,
          traceMatches.map((trace) => trace.id),
        );
      } else {
        const trace = traceMatches[0];
        const traceIssues: string[] = [];
        if (!trace) {
          traceIssues.push('trace record is unavailable');
        } else {
          if (trace.workcellId !== workcell.id)
            traceIssues.push('trace belongs to another Workcell');
          if (
            trace.proofPacketId !== storedContract.proofPacketId ||
            trace.proofPacketId !== workcell.proofPacketId
          ) {
            traceIssues.push('trace names a different Proof Packet');
          }
          if (!isNonEmpty(trace.runId)) traceIssues.push('trace run ID is empty');
          if (!isTimestamp(trace.startedAt) || !isTimestamp(trace.completedAt)) {
            traceIssues.push('trace start or completion time is invalid');
          } else if (Date.parse(trace.completedAt) < Date.parse(trace.startedAt)) {
            traceIssues.push('trace completion precedes its start');
          }
          if (!Number.isFinite(trace.durationMs) || trace.durationMs < 0) {
            traceIssues.push('trace duration is invalid');
          }
          if (trace.steps.length === 0) traceIssues.push('trace has no steps');
          if (duplicateValues(trace.steps.map((step) => step.stepId)).length > 0) {
            traceIssues.push('trace repeats a step ID');
          }
          if (
            trace.steps.some(
              (step) =>
                !isNonEmpty(step.stepId) ||
                !isNonEmpty(step.name) ||
                !isNonEmpty(step.tool) ||
                !isTimestamp(step.timestamp) ||
                !Number.isFinite(step.durationMs) ||
                step.durationMs < 0,
            )
          ) {
            traceIssues.push('one or more trace steps lack required integrity fields');
          }
        }
        traceCoverage =
          traceIssues.length === 0 && trace
            ? obligation(
                'trace-binding',
                'Execution trace resolves uniquely',
                'SATISFIED',
                'One trace record binds this Workcell and Proof Packet with coherent run, step, and timing fields.',
                [trace.id, trace.runId, trace.proofPacketId],
              )
            : obligation(
                'trace-binding',
                'Execution trace resolves uniquely',
                'MISMATCH',
                traceIssues.join('; '),
                [storedContract.executionTraceId],
              );
      }
    }

    obligations.push(
      workcell.signals.includes(storedContract.originSignalId) &&
        workcell.actionBrief.linkedSignalIds.includes(storedContract.originSignalId)
        ? obligation(
            'origin-signal',
            'Origin signal belongs to the Workcell',
            'SATISFIED',
            'The contract origin is a Workcell signal input linked to this ActionBrief.',
            [storedContract.originSignalId],
          )
        : obligation(
            'origin-signal',
            'Origin signal belongs to the Workcell',
            'MISMATCH',
            'The contract origin must be declared by this Workcell and linked to this ActionBrief.',
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
      traceCoverage,
    );

    const policyEvaluationMatches = policyEvaluationIds.filter(
      (id) => id === storedContract.policyEvaluationId,
    );
    obligations.push(
      policyEvaluationMatches.length === 0
        ? obligation(
            'policy-evaluation',
            'Policy evaluation resolves uniquely',
            'UNAVAILABLE',
            'The contract declares an ID, but no policy-evaluation registry record resolves it.',
            [storedContract.policyEvaluationId],
          )
        : policyEvaluationMatches.length > 1
          ? obligation(
              'policy-evaluation',
              'Policy evaluation resolves uniquely',
              'MISMATCH',
              `${policyEvaluationMatches.length} policy-evaluation records share the declared ID.`,
              policyEvaluationMatches,
            )
          : obligation(
              'policy-evaluation',
              'Policy evaluation resolves uniquely',
              'SATISFIED',
              'Exactly one declared policy-evaluation record is present in the supplied registry.',
              [storedContract.policyEvaluationId],
            ),
    );

    const approvalRecordMatches = approvalRecordId
      ? approvalRecordIds.filter((id) => id === approvalRecordId)
      : [];
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
    } else if (approvalRecordMatches.length > 1) {
      obligations.push(
        obligation(
          'approval-binding',
          'Approval reference resolves',
          'MISMATCH',
          `${approvalRecordMatches.length} approval records share the declared ID.`,
          approvalRecordMatches,
        ),
      );
    } else if (approvalRecordMatches.length === 1) {
      obligations.push(
        obligation(
          'approval-binding',
          'Approval reference resolves',
          'SATISFIED',
          'The approval ID resolves uniquely in the supplied reference registry. Scope and actor are not verified.',
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
    } else if (proofPacketMatches.length > 1) {
      obligations.push(
        obligation(
          'proof-reference',
          'Proof Packet resolves',
          'MISMATCH',
          `${proofPacketMatches.length} Proof Packet records share this ID; no record was selected.`,
          proofPacketMatches.map((packet) => packet.id),
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
      proofPacket.vertical !== workcell.vertical ||
      proofPacket.payload.actionId !== workcell.actionBrief.id
    ) {
      obligations.push(
        obligation(
          'proof-context',
          'Proof Packet has execution context',
          'MISMATCH',
          'The Proof Packet must be action-execution evidence for the Workcell vertical and its payload must name this ActionBrief.',
          [proofPacket.kind, proofPacket.vertical, workcell.vertical],
        ),
      );
    } else {
      obligations.push(
        obligation(
          'proof-context',
          'Proof Packet has execution context',
          'SATISFIED',
          'The Proof Packet declares action-execution evidence for the Workcell vertical and names this ActionBrief in its payload.',
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

    if (!proofPacket) {
      obligations.push(
        obligation(
          'proof-integrity',
          'Proof Packet integrity fields are recorded',
          'UNAVAILABLE',
          'One unique joined Proof Packet is required before packet integrity can be checked.',
          [proofPacketId ?? workcell.proofPacketId],
        ),
      );
    } else {
      const packetIntegrityIssues: string[] = [];
      if (!SHA256_REFERENCE.test(proofPacket.hash)) {
        packetIntegrityIssues.push('packet hash is not a SHA-256 reference');
      }
      if (Object.keys(proofPacket.payload).length === 0) {
        packetIntegrityIssues.push('packet payload is empty');
      }
      if (
        proofPacket.witnessedBy.length === 0 ||
        proofPacket.witnessedBy.some((witness) => !isNonEmpty(witness))
      ) {
        packetIntegrityIssues.push('packet has no non-empty witness identifier');
      }
      if (duplicateValues(proofPacket.witnessedBy).length > 0) {
        packetIntegrityIssues.push('packet repeats a witness identifier');
      }
      if (!isTimestamp(proofPacket.issuedAt)) {
        packetIntegrityIssues.push('packet issue time is invalid');
      }
      obligations.push(
        packetIntegrityIssues.length === 0
          ? obligation(
              'proof-integrity',
              'Proof Packet integrity fields are recorded',
              'SATISFIED',
              'The packet has a SHA-256-shaped reference, payload, unique witnesses, and parseable issue time. This is not signature verification.',
              [proofPacket.id, proofPacket.hash, ...proofPacket.witnessedBy],
            )
          : obligation(
              'proof-integrity',
              'Proof Packet integrity fields are recorded',
              'MISMATCH',
              `${packetIntegrityIssues.join('; ')}. This is not signature verification.`,
              [proofPacket.id, proofPacket.hash],
            ),
      );
    }

    const terminalStatusRecorded = ['passed', 'failed'].includes(
      workcell.verificationResult.status,
    );
    const terminalChecksumValid = SHA256_REFERENCE.test(workcell.verificationResult.checksum);
    const terminalTraces = executionTraces.filter(
      (trace) => trace.id === storedContract.executionTraceId,
    );
    const terminalTrace = terminalTraces.length === 1 ? terminalTraces[0] : undefined;
    const terminalOutcomeAgrees =
      terminalTrace !== undefined &&
      (workcell.verificationResult.status === 'passed'
        ? terminalTrace.finalStatus === 'completed'
        : workcell.verificationResult.status === 'failed' &&
          ['failed', 'cancelled'].includes(terminalTrace.finalStatus));
    obligations.push(
      !proofPacket
        ? obligation(
            'terminal-state',
            'Terminal fixture state is recorded',
            'UNAVAILABLE',
            'A unique joined Proof Packet is required before terminal fixture state can be checked.',
            [workcell.verificationResult.status],
          )
        : terminalStatusRecorded && terminalChecksumValid && terminalOutcomeAgrees
          ? obligation(
              'terminal-state',
              'Terminal fixture state is recorded',
              'SATISFIED',
              `The fixture records a ${workcell.verificationResult.status} terminal check coherent with its execution trace and a SHA-256-shaped checksum. This is not signature verification.`,
              [
                workcell.verificationResult.status,
                workcell.verificationResult.checksum,
                proofPacket.id,
              ],
            )
          : obligation(
              'terminal-state',
              'Terminal fixture state is recorded',
              'MISMATCH',
              'The Workcell terminal status or verification checksum is missing, malformed, or inconsistent with the execution trace outcome. This is not signature verification.',
              [workcell.verificationResult.status, workcell.verificationResult.checksum],
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
