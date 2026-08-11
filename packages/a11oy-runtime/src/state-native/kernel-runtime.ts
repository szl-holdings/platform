import { performance } from 'node:perf_hooks';
import { digestObject, newId } from './canonical.js';
import { assertCompatibility } from './compatibility.js';
import { StateNativeError, assertStateNative } from './errors.js';
import { createKernelExecutionReceipt } from './receipt.js';
import { highestSensitivity, AlloyStateBus } from './state-bus.js';
import { CognitiveEpochManager } from './epoch-manager.js';
import type {
  ApprovalEvidence,
  CognitiveEpochRecord,
  CompatibilityFingerprint,
  KernelBudget,
  KernelDefinition,
  KernelExecutionContext,
  KernelExecutionInput,
  KernelExecutionReceipt,
  KernelExecutionRequest,
  KernelExecutionResult,
  KernelProducedState,
  KernelReceiptUnsigned,
  KernelRuntimeConfig,
  KernelVerifierResult,
  StateCapsule,
  StateGovernance,
  StateReadResult,
  StateSensitivity,
} from './types.js';

const SENSITIVITY_RANK: Readonly<Record<StateSensitivity, number>> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
};

const POLICY_EFFECTS = new Set(['allow', 'block', 'approval_required']);
const KERNEL_KINDS = new Set([
  'context_build',
  'prefill',
  'decode',
  'planning',
  'tool',
  'multimodal_encode',
  'policy',
  'verification',
  'custom',
]);

interface IdempotencyRecord {
  readonly requestDigest: string;
  readonly status: 'IN_FLIGHT' | 'SUCCESS' | 'INDETERMINATE';
  readonly result?: KernelExecutionResult;
}

export interface AlloyKernelRuntimeDependencies {
  readonly stateBus: AlloyStateBus;
  readonly epochManager: CognitiveEpochManager;
  readonly config: KernelRuntimeConfig;
}

export function kernelRequestDigest(request: KernelExecutionRequest): string {
  return digestObject({
    schema: 'szl.kernel-execution-request/v1',
    kernelId: request.kernelId,
    tenantId: request.tenantId,
    sessionId: request.sessionId,
    inputCapsuleIds: request.inputCapsuleIds,
    inputCompatibility: request.inputCompatibility,
    parameters: request.parameters,
    budget: request.budget,
    epochId: request.epochId,
    stateGrantId: request.stateGrantId,
  });
}

function idempotencyRequestDigest(request: KernelExecutionRequest): string {
  return digestObject({
    action: kernelRequestDigest(request),
    authorization: request.authorization,
  });
}

function idempotencyScopeKey(tenantId: string, idempotencyKey: string): string {
  return digestObject({
    schema: 'szl.kernel-idempotency-scope/v1',
    tenantId,
    idempotencyKey,
  });
}

function epochCompatibility(
  epoch: CognitiveEpochRecord,
  request: KernelExecutionRequest,
  definition: KernelDefinition,
  output: KernelProducedState,
): CompatibilityFingerprint {
  const defaults: CompatibilityFingerprint = {
    modelId: epoch.modelId,
    modelRevision: epoch.modelRevision,
    engineId: epoch.engineId,
    engineVersion: epoch.engineVersion,
    tokenizerDigest: epoch.tokenizerDigest,
    layoutDigest: epoch.layoutDigest,
    adapterSetDigest: epoch.adapterSetDigest,
    semanticSpaceDigest:
      request.inputCompatibility.semanticSpaceDigest ??
      digestObject({ kernelId: definition.kernelId, version: definition.version, semantic: output.stateType }),
    schemaDigest:
      request.inputCompatibility.schemaDigest ??
      digestObject({ kernelId: definition.kernelId, version: definition.version, stateType: output.stateType }),
    policyDigest: epoch.policyDigest,
    cognitiveEpoch: epoch.epochId,
    providerSessionId: request.inputCompatibility.providerSessionId,
  };
  const compatibility: CompatibilityFingerprint = output.compatibility ?? defaults;
  const expected: CompatibilityFingerprint = {
    ...defaults,
    semanticSpaceDigest: compatibility.semanticSpaceDigest,
    schemaDigest: compatibility.schemaDigest,
    providerSessionId: compatibility.providerSessionId,
  };

  assertCompatibility(output.portability, expected, compatibility);
  return compatibility;
}

function validateInputCompatibilityAgainstEpoch(
  epoch: CognitiveEpochRecord,
  compatibility: CompatibilityFingerprint,
): void {
  const expected: Readonly<
    Pick<
      CompatibilityFingerprint,
      | 'modelId'
      | 'modelRevision'
      | 'engineId'
      | 'engineVersion'
      | 'tokenizerDigest'
      | 'layoutDigest'
      | 'adapterSetDigest'
      | 'policyDigest'
      | 'cognitiveEpoch'
    >
  > = {
    modelId: epoch.modelId,
    modelRevision: epoch.modelRevision,
    engineId: epoch.engineId,
    engineVersion: epoch.engineVersion,
    tokenizerDigest: epoch.tokenizerDigest,
    layoutDigest: epoch.layoutDigest,
    adapterSetDigest: epoch.adapterSetDigest,
    policyDigest: epoch.policyDigest,
    cognitiveEpoch: epoch.epochId,
  };
  const mandatory = new Set<keyof CompatibilityFingerprint>(['policyDigest', 'cognitiveEpoch']);
  const mismatches: Array<{ readonly field: string; readonly expected: string; readonly actual?: string }> = [];

  for (const [field, expectedValue] of Object.entries(expected) as Array<
    [keyof typeof expected, string]
  >) {
    const actual = compatibility[field];
    if ((mandatory.has(field) || actual !== undefined) && actual !== expectedValue) {
      mismatches.push({ field, expected: expectedValue, actual });
    }
  }

  if (mismatches.length > 0) {
    throw new StateNativeError(
      'COMPATIBILITY_MISMATCH',
      'Input compatibility is not bound to the pinned cognitive epoch.',
      { epochId: epoch.epochId, mismatches },
    );
  }
}

function defaultGovernance(
  inputCapsules: readonly StateCapsule[],
  output: KernelProducedState,
): StateGovernance {
  const minimumSensitivity =
    inputCapsules.length > 0 ? highestSensitivity(inputCapsules) : 'public';
  const governance =
    output.governance ?? {
      sensitivity: inputCapsules.length > 0 ? minimumSensitivity : 'internal',
      retentionClass: 'session',
      reusePolicy: 'same_session',
      evidenceTier: 'MEASURED',
    };
  assertStateNative(
    SENSITIVITY_RANK[governance.sensitivity] >= SENSITIVITY_RANK[minimumSensitivity],
    'REUSE_DENIED',
    'Kernel output cannot reduce the highest input sensitivity without governed declassification.',
    {
      minimumSensitivity,
      outputSensitivity: governance.sensitivity,
    },
  );
  return governance;
}

function producedStateSnapshot(
  output: readonly KernelProducedState[],
): readonly KernelProducedState[] {
  return Object.freeze(
    output.map((produced) =>
      Object.freeze({
        ...produced,
        payload: Uint8Array.from(produced.payload),
        compatibility: produced.compatibility
          ? Object.freeze({ ...produced.compatibility })
          : undefined,
        governance: produced.governance
          ? Object.freeze({ ...produced.governance })
          : undefined,
      }),
    ),
  );
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    return value;
  }
  seen.add(objectValue);

  if (!ArrayBuffer.isView(objectValue)) {
    for (const nested of Object.values(objectValue as Record<string, unknown>)) {
      deepFreeze(nested, seen);
    }
    Object.freeze(objectValue);
  }
  return value;
}

function boundarySnapshot<T>(value: T, label: string): T {
  try {
    return deepFreeze(structuredClone(value));
  } catch (error) {
    throw new StateNativeError(
      'INVALID_INPUT',
      `${label} must be structured-clone compatible.`,
      undefined,
      { cause: error },
    );
  }
}

function requestSnapshot(request: KernelExecutionRequest): KernelExecutionRequest {
  return boundarySnapshot(request, 'Kernel execution request');
}

function definitionSnapshot(definition: KernelDefinition): KernelDefinition {
  return Object.freeze({
    kernelId: definition.kernelId,
    version: definition.version,
    kind: definition.kind,
    route: definition.route,
    requiresVerification: definition.requiresVerification,
    execute: definition.execute,
    verify: definition.verify,
  });
}

function stateReadSnapshot(input: readonly StateReadResult[]): readonly StateReadResult[] {
  return Object.freeze(
    input.map((item) =>
      Object.freeze({
        capsule: item.capsule,
        payload: Uint8Array.from(item.payload),
      }),
    ),
  );
}

function kernelInputSnapshot(
  input: readonly StateReadResult[],
  parameters: Readonly<Record<string, unknown>>,
): KernelExecutionInput {
  return Object.freeze({
    capsules: stateReadSnapshot(input),
    parameters: boundarySnapshot(parameters, 'Kernel parameters'),
  });
}

function kernelContextSnapshot(input: {
  readonly actionId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly epoch: CognitiveEpochRecord;
  readonly budget: KernelBudget;
  readonly signal: AbortSignal;
}): KernelExecutionContext {
  return Object.freeze({
    actionId: input.actionId,
    tenantId: input.tenantId,
    sessionId: input.sessionId,
    epoch: boundarySnapshot(input.epoch, 'Cognitive epoch'),
    budget: Object.freeze({ ...input.budget }),
    signal: input.signal,
  });
}

function verifierResultSnapshot(result: KernelVerifierResult): KernelVerifierResult {
  assertStateNative(typeof result.passed === 'boolean', 'INVALID_INPUT', 'Verifier passed must be boolean.');
  assertStateNative(typeof result.reason === 'string', 'INVALID_INPUT', 'Verifier reason must be a string.');
  assertStateNative(Array.isArray(result.evidenceDigests), 'INVALID_INPUT', 'Verifier evidenceDigests must be an array.');
  const evidenceDigests = Object.freeze([...result.evidenceDigests]);
  for (const digest of evidenceDigests) {
    assertStateNative(
      typeof digest === 'string' && /^[0-9a-f]{64}$/u.test(digest),
      'INVALID_INPUT',
      'Verifier evidenceDigests must be lowercase SHA-256 digests.',
    );
  }
  return Object.freeze({
    passed: result.passed,
    reason: result.reason,
    evidenceDigests,
  });
}

function validatePolicyEffect(effect: unknown): void {
  assertStateNative(
    typeof effect === 'string' && POLICY_EFFECTS.has(effect),
    'INVALID_INPUT',
    'Policy effect is unsupported; execution fails closed.',
    { effect },
  );
}

function validateBudget(request: KernelExecutionRequest): void {
  const { budget } = request;
  assertStateNative(
    Number.isSafeInteger(budget.maxRuntimeMs) && budget.maxRuntimeMs > 0,
    'INVALID_INPUT',
    'maxRuntimeMs must be a positive integer.',
  );
  assertStateNative(
    Number.isSafeInteger(budget.maxInputBytes) && budget.maxInputBytes >= 0,
    'INVALID_INPUT',
    'maxInputBytes must be a non-negative integer.',
  );
  assertStateNative(
    Number.isSafeInteger(budget.maxOutputBytes) && budget.maxOutputBytes >= 0,
    'INVALID_INPUT',
    'maxOutputBytes must be a non-negative integer.',
  );
  assertStateNative(
    Number.isSafeInteger(budget.maxStateWrites) && budget.maxStateWrites >= 0,
    'INVALID_INPUT',
    'maxStateWrites must be a non-negative integer.',
  );
}

function validateApproval(approval: ApprovalEvidence | undefined, requestDigest: string, actionId: string): void {
  if (!approval) {
    throw new StateNativeError('APPROVAL_REQUIRED', 'Policy requires exact approval evidence.');
  }
  if (approval.actionId !== actionId || approval.scopeDigest !== requestDigest) {
    throw new StateNativeError(
      'APPROVAL_REQUIRED',
      'Approval evidence is not bound to this action and exact request digest.',
      { approvalId: approval.approvalId },
    );
  }
  if (!Number.isFinite(Date.parse(approval.approvedAt)) || approval.approvedBy.trim().length === 0) {
    throw new StateNativeError('APPROVAL_REQUIRED', 'Approval evidence is malformed.', {
      approvalId: approval.approvalId,
    });
  }
}

export class AlloyKernelRuntime {
  readonly #stateBus: AlloyStateBus;
  readonly #epochManager: CognitiveEpochManager;
  readonly #config: KernelRuntimeConfig;
  readonly #clock: () => Date;
  readonly #kernels = new Map<string, KernelDefinition>();
  readonly #lastReceiptByTenant = new Map<string, string>();
  readonly #receiptTailByTenant = new Map<string, Promise<void>>();
  readonly #idempotency = new Map<string, IdempotencyRecord>();

  public constructor(dependencies: AlloyKernelRuntimeDependencies) {
    this.#stateBus = dependencies.stateBus;
    this.#epochManager = dependencies.epochManager;
    this.#config = dependencies.config;
    this.#clock = dependencies.config.clock ?? (() => new Date());
  }

  public register(definition: KernelDefinition): void {
    assertStateNative(
      typeof definition.kernelId === 'string' && definition.kernelId.trim().length > 0,
      'INVALID_INPUT',
      'kernelId must not be empty.',
    );
    assertStateNative(
      typeof definition.version === 'string' && definition.version.trim().length > 0,
      'INVALID_INPUT',
      'kernel version must not be empty.',
    );
    assertStateNative(
      typeof definition.route === 'string' && definition.route.trim().length > 0,
      'INVALID_INPUT',
      'kernel route must not be empty.',
    );
    assertStateNative(KERNEL_KINDS.has(definition.kind), 'INVALID_INPUT', 'kernel kind is unsupported.');
    assertStateNative(
      typeof definition.requiresVerification === 'boolean',
      'INVALID_INPUT',
      'requiresVerification must be boolean.',
    );
    assertStateNative(typeof definition.execute === 'function', 'INVALID_INPUT', 'kernel execute must be callable.');
    assertStateNative(
      definition.verify === undefined || typeof definition.verify === 'function',
      'INVALID_INPUT',
      'kernel verify must be callable when present.',
    );
    if (definition.requiresVerification && !definition.verify) {
      throw new StateNativeError(
        'INVALID_INPUT',
        'A verification-required kernel must provide an independent verifier.',
        { kernelId: definition.kernelId },
      );
    }

    const snapshot = definitionSnapshot(definition);
    if (this.#kernels.has(snapshot.kernelId)) {
      throw new StateNativeError('DIVERGENT_REPLAY', 'Kernel identifier is already registered.', {
        kernelId: snapshot.kernelId,
      });
    }
    this.#kernels.set(snapshot.kernelId, snapshot);
  }

  public listKernels(): readonly Pick<KernelDefinition, 'kernelId' | 'version' | 'kind' | 'route'>[] {
    return Object.freeze(
      [...this.#kernels.values()]
        .map(({ kernelId, version, kind, route }) => Object.freeze({ kernelId, version, kind, route }))
        .sort((left, right) => left.kernelId.localeCompare(right.kernelId)),
    );
  }

  public async execute(inputRequest: KernelExecutionRequest): Promise<KernelExecutionResult> {
    const request = requestSnapshot(inputRequest);
    const definition = this.#kernels.get(request.kernelId);
    if (!definition) {
      throw new StateNativeError('NOT_FOUND', 'Kernel is not registered.', { kernelId: request.kernelId });
    }

    validateBudget(request);
    validatePolicyEffect(request.authorization.decision.effect);
    this.#validateAuthorizationBoundary(request);
    const actionDigest = kernelRequestDigest(request);
    if (request.authorization.envelope.argsDigest !== actionDigest) {
      throw new StateNativeError(
        'DIVERGENT_REPLAY',
        'Governed action envelope is not bound to the exact kernel request.',
        { actionId: request.authorization.envelope.actionId },
      );
    }

    const idempotencyKey = request.idempotencyKey
      ? idempotencyScopeKey(request.tenantId, request.idempotencyKey)
      : undefined;
    const replayDigest = idempotencyRequestDigest(request);
    if (idempotencyKey) {
      const prior = this.#idempotency.get(idempotencyKey);
      if (prior) {
        if (prior.requestDigest !== replayDigest) {
          throw new StateNativeError(
            'DIVERGENT_REPLAY',
            'Kernel idempotency key was used for a different governed request.',
          );
        }
        if (prior.status === 'SUCCESS' && prior.result) {
          return prior.result;
        }
        if (prior.status === 'IN_FLIGHT') {
          throw new StateNativeError('ALREADY_IN_FLIGHT', 'Kernel execution is already in flight.');
        }
        throw new StateNativeError(
          'INDETERMINATE',
          'Prior execution reached an ambiguous terminal boundary and will not be retried automatically.',
        );
      }
    }

    let executionStarted = false;
    let receiptWritten = false;
    let inputCapsules: StateCapsule[] = [];
    const outputCapsules: StateCapsule[] = [];
    const startedAt = performance.now();
    const deadlineAt = startedAt + request.budget.maxRuntimeMs;
    const lease = this.#epochManager.pin(request.tenantId, definition.route, request.epochId);
    try {
      if (idempotencyKey) {
        this.#idempotency.set(idempotencyKey, { requestDigest: replayDigest, status: 'IN_FLIGHT' });
      }
      if (lease.epoch.route !== definition.route) {
        throw new StateNativeError('EPOCH_NOT_ACTIVE', 'Kernel route does not match the pinned epoch.');
      }
      validateInputCompatibilityAgainstEpoch(lease.epoch, request.inputCompatibility);

      const decision = request.authorization.decision;
      if (decision.effect === 'block') {
        const receipt = await this.#writeTerminalReceipt({
          request,
          definition,
          epoch: lease.epoch,
          outcome: 'blocked',
          reason: decision.reason,
          runtimeMs: performance.now() - startedAt,
          inputCapsules: request.inputCapsuleIds.map((id) => this.#stateBus.requireMetadata(id, request.tenantId)),
          outputCapsules: [],
        });
        receiptWritten = true;
        throw new StateNativeError('POLICY_BLOCKED', 'Kernel execution was blocked by policy.', {
          receiptId: receipt.receiptId,
        });
      }
      if (decision.effect === 'approval_required') {
        try {
          validateApproval(
            request.authorization.approval,
            actionDigest,
            request.authorization.envelope.actionId,
          );
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Approval evidence failed validation.';
          const receipt = await this.#writeTerminalReceipt({
            request,
            definition,
            epoch: lease.epoch,
            outcome: 'blocked',
            reason,
            runtimeMs: performance.now() - startedAt,
            inputCapsules: request.inputCapsuleIds.map((id) =>
              this.#stateBus.requireMetadata(id, request.tenantId),
            ),
            outputCapsules: [],
          });
          receiptWritten = true;
          throw new StateNativeError('APPROVAL_REQUIRED', reason, { receiptId: receipt.receiptId });
        }
      }

      const input = stateReadSnapshot(
        await Promise.all(
          request.inputCapsuleIds.map((capsuleId) =>
            this.#stateBus.get(capsuleId, {
              tenantId: request.tenantId,
              sessionId: request.sessionId,
              actionId: request.authorization.envelope.actionId,
              compatibility: request.inputCompatibility,
              explicitGrantId: request.stateGrantId,
              allowedSensitivities: request.authorization.allowedSensitivities,
            }),
          ),
        ),
      );
      inputCapsules = input.map((item) => item.capsule);
      const inputBytes = input.reduce((total, item) => total + item.payload.byteLength, 0);
      if (inputBytes > request.budget.maxInputBytes) {
        throw new StateNativeError('BUDGET_EXCEEDED', 'Kernel input exceeds the declared byte budget.', {
          inputBytes,
          maxInputBytes: request.budget.maxInputBytes,
        });
      }

      const controller = new AbortController();
      const makeContext = (): KernelExecutionContext =>
        kernelContextSnapshot({
          actionId: request.authorization.envelope.actionId,
          tenantId: request.tenantId,
          sessionId: request.sessionId,
          epoch: lease.epoch,
          budget: request.budget,
          signal: controller.signal,
        });
      const rawOutput = await this.#runWithDeadline(
        () => {
          executionStarted = true;
          return definition.execute(
            kernelInputSnapshot(input, request.parameters),
            makeContext(),
          );
        },
        controller,
        deadlineAt,
        'Kernel execution',
      );
      const output = producedStateSnapshot(rawOutput);

      if (output.length > request.budget.maxStateWrites) {
        throw new StateNativeError('BUDGET_EXCEEDED', 'Kernel exceeded the state-write budget.', {
          stateWrites: output.length,
          maxStateWrites: request.budget.maxStateWrites,
        });
      }
      const outputBytes = output.reduce((total, item) => total + item.payload.byteLength, 0);
      if (outputBytes > request.budget.maxOutputBytes) {
        throw new StateNativeError('BUDGET_EXCEEDED', 'Kernel output exceeds the declared byte budget.', {
          outputBytes,
          maxOutputBytes: request.budget.maxOutputBytes,
        });
      }

      const verifier = definition.verify
        ? verifierResultSnapshot(
            await this.#runWithDeadline(
              () =>
                definition.verify!(
                  producedStateSnapshot(output),
                  kernelInputSnapshot(input, request.parameters),
                  makeContext(),
                ),
              controller,
              deadlineAt,
              'Kernel verification',
            ),
          )
        : undefined;
      if (definition.requiresVerification && (!verifier || !verifier.passed)) {
        const reason = verifier?.reason ?? 'Required kernel verifier was unavailable.';
        await this.#writeTerminalReceipt({
          request,
          definition,
          epoch: lease.epoch,
          outcome: 'blocked',
          reason,
          runtimeMs: performance.now() - startedAt,
          inputCapsules,
          outputCapsules: [],
          verifier,
        });
        receiptWritten = true;
        throw new StateNativeError('VERIFICATION_FAILED', reason);
      }

      const successReceiptId = newId('kernel_receipt');
      for (const [index, produced] of output.entries()) {
        const compatibility = epochCompatibility(lease.epoch, request, definition, produced);
        const capsule = await this.#stateBus.put({
          tenantId: request.tenantId,
          sessionId: request.sessionId,
          stateType: produced.stateType,
          portability: produced.portability,
          payload: produced.payload,
          compatibility,
          governance: defaultGovernance(inputCapsules, produced),
          provenance: {
            sourceActionId: request.authorization.envelope.actionId,
            parentCapsuleIds: Object.freeze([...request.inputCapsuleIds]),
            producerKernelId: definition.kernelId,
            producerKernelVersion: definition.version,
            sourceReceiptId: successReceiptId,
          },
          expiresAt: produced.expiresAt,
          idempotencyKey: request.idempotencyKey
            ? digestObject({
                schema: 'szl.kernel-output-idempotency/v1',
                parentIdempotencyKey: request.idempotencyKey,
                index,
              })
            : undefined,
        });
        outputCapsules.push(capsule);
      }

      let receipt: KernelExecutionReceipt;
      try {
        receipt = await this.#writeTerminalReceipt({
          request,
          definition,
          epoch: lease.epoch,
          outcome: 'success',
          reason: 'Kernel execution and verification completed.',
          runtimeMs: performance.now() - startedAt,
          inputCapsules,
          outputCapsules,
          verifier,
          receiptId: successReceiptId,
        });
        receiptWritten = true;
      } catch (error) {
        await Promise.all(
          outputCapsules.map((capsule) =>
            this.#stateBus.quarantine(
              capsule.capsuleId,
              request.tenantId,
              'Receipt persistence failed after kernel output creation.',
            ),
          ),
        );
        throw error;
      }

      const result: KernelExecutionResult = Object.freeze({
        outputs: Object.freeze(outputCapsules),
        receipt,
      });
      if (idempotencyKey) {
        this.#idempotency.set(idempotencyKey, {
          requestDigest: replayDigest,
          status: 'SUCCESS',
          result,
        });
      }
      return result;
    } catch (error) {
      let terminalError: unknown = error;
      if (outputCapsules.length > 0) {
        await Promise.all(
          outputCapsules.map(async (capsule) => {
            const current = this.#stateBus.metadata(capsule.capsuleId);
            if (current?.revocationStatus === 'ACTIVE') {
              await this.#stateBus.quarantine(
                capsule.capsuleId,
                request.tenantId,
                'Kernel execution did not reach a persisted successful receipt.',
              );
            }
          }),
        );
      }

      const receiptPersistenceFailed =
        error instanceof StateNativeError && error.code === 'RECEIPT_WRITE_FAILED';
      if (!receiptWritten && !receiptPersistenceFailed) {
        try {
          await this.#writeTerminalReceipt({
            request,
            definition,
            epoch: lease.epoch,
            outcome: 'error',
            reason: error instanceof Error ? error.message : 'Kernel execution failed.',
            runtimeMs: performance.now() - startedAt,
            inputCapsules:
              inputCapsules.length > 0
                ? inputCapsules
                : request.inputCapsuleIds.flatMap((id) => {
                    const capsule = this.#stateBus.metadata(id);
                    return capsule && capsule.tenantId === request.tenantId ? [capsule] : [];
                  }),
            outputCapsules,
          });
        } catch (receiptError) {
          terminalError = receiptError;
        }
      }

      if (idempotencyKey) {
        if (executionStarted || outputCapsules.length > 0) {
          this.#idempotency.set(idempotencyKey, {
            requestDigest: replayDigest,
            status: 'INDETERMINATE',
          });
        } else {
          this.#idempotency.delete(idempotencyKey);
        }
      }
      throw terminalError;
    } finally {
      lease.release();
    }
  }

  #validateAuthorizationBoundary(request: KernelExecutionRequest): void {
    const envelope = request.authorization.envelope;
    if (envelope.tenantId !== request.tenantId) {
      throw new StateNativeError('TENANT_MISMATCH', 'Action envelope belongs to another tenant.');
    }
    if (envelope.toolName !== request.kernelId) {
      throw new StateNativeError('INVALID_INPUT', 'Action envelope toolName must equal kernelId.');
    }
    if (!envelope.mutatesState) {
      throw new StateNativeError(
        'INVALID_INPUT',
        'State-native kernel execution must declare its state mutation in the governed action envelope.',
      );
    }
    if (!Number.isFinite(Date.parse(envelope.requestedAt))) {
      throw new StateNativeError('INVALID_INPUT', 'Action envelope requestedAt is malformed.');
    }
  }

  async #runWithDeadline<T>(
    operation: () => Promise<T>,
    controller: AbortController,
    deadlineAt: number,
    phase: string,
  ): Promise<T> {
    const remainingMs = Math.ceil(deadlineAt - performance.now());
    if (remainingMs <= 0) {
      const error = new StateNativeError(
        'BUDGET_EXCEEDED',
        `${phase} exceeded the shared kernel runtime budget.`,
      );
      controller.abort(error);
      throw error;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        const error = new StateNativeError(
          'BUDGET_EXCEEDED',
          `${phase} exceeded the shared kernel runtime budget.`,
        );
        reject(error);
        controller.abort(error);
      }, remainingMs);
    });

    try {
      return await Promise.race([operation(), deadline]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  async #writeTerminalReceipt(input: {
    readonly request: KernelExecutionRequest;
    readonly definition: KernelDefinition;
    readonly epoch: CognitiveEpochRecord;
    readonly outcome: KernelReceiptUnsigned['outcome'];
    readonly reason: string;
    readonly runtimeMs: number;
    readonly inputCapsules: readonly StateCapsule[];
    readonly outputCapsules: readonly StateCapsule[];
    readonly verifier?: KernelReceiptUnsigned['verifier'];
    readonly receiptId?: string;
  }): Promise<KernelExecutionReceipt> {
    const { request, definition, epoch } = input;
    return this.#withTenantReceiptLock(request.tenantId, async () => {
      const unsigned: KernelReceiptUnsigned = {
        schema: 'szl.kernel-execution-receipt/v1',
        receiptId: input.receiptId ?? newId('kernel_receipt'),
        actionId: request.authorization.envelope.actionId,
        tenantId: request.tenantId,
        sessionId: request.sessionId,
        kernelId: definition.kernelId,
        kernelVersion: definition.version,
        kernelKind: definition.kind,
        epochId: epoch.epochId,
        policyEffect: request.authorization.decision.effect,
        policyReason: request.authorization.decision.reason,
        policyVersion: request.authorization.decision.policyVersion,
        approvalId: request.authorization.approval?.approvalId,
        outcome: input.outcome,
        reason: input.reason,
        inputCapsuleIds: Object.freeze(input.inputCapsules.map((capsule) => capsule.capsuleId)),
        inputDigests: Object.freeze(input.inputCapsules.map((capsule) => capsule.contentDigest)),
        outputCapsuleIds: Object.freeze(input.outputCapsules.map((capsule) => capsule.capsuleId)),
        outputDigests: Object.freeze(input.outputCapsules.map((capsule) => capsule.contentDigest)),
        verifier: input.verifier,
        budget: request.budget,
        runtimeMs: Math.max(0, Math.round(input.runtimeMs * 1000) / 1000),
        occurredAt: this.#clock().toISOString(),
        priorReceiptDigest: this.#lastReceiptByTenant.get(request.tenantId),
      };
      const receipt = createKernelExecutionReceipt(unsigned, this.#config.receiptSigner);
      try {
        await this.#config.receiptWriter(receipt);
      } catch (error) {
        throw new StateNativeError(
          'RECEIPT_WRITE_FAILED',
          'Kernel receipt persistence failed; produced state is not releasable.',
          { receiptId: receipt.receiptId },
          { cause: error },
        );
      }
      this.#lastReceiptByTenant.set(request.tenantId, receipt.receiptDigest);
      return receipt;
    });
  }

  async #withTenantReceiptLock<T>(tenantId: string, operation: () => Promise<T>): Promise<T> {
    const prior = this.#receiptTailByTenant.get(tenantId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = prior.catch(() => undefined).then(() => current);
    this.#receiptTailByTenant.set(tenantId, tail);

    await prior.catch(() => undefined);
    try {
      return await operation();
    } finally {
      release();
      if (this.#receiptTailByTenant.get(tenantId) === tail) {
        this.#receiptTailByTenant.delete(tenantId);
      }
    }
  }
}
