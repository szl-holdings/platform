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
  KernelDefinition,
  KernelExecutionReceipt,
  KernelExecutionRequest,
  KernelExecutionResult,
  KernelProducedState,
  KernelReceiptUnsigned,
  KernelRuntimeConfig,
  StateCapsule,
  StateGovernance,
} from './types.js';

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
  return (
    output.governance ?? {
      sensitivity: inputCapsules.length > 0 ? highestSensitivity(inputCapsules) : 'internal',
      retentionClass: 'session',
      reusePolicy: 'same_session',
      evidenceTier: 'MEASURED',
    }
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
    assertStateNative(definition.kernelId.trim().length > 0, 'INVALID_INPUT', 'kernelId must not be empty.');
    assertStateNative(definition.version.trim().length > 0, 'INVALID_INPUT', 'kernel version must not be empty.');
    assertStateNative(definition.route.trim().length > 0, 'INVALID_INPUT', 'kernel route must not be empty.');
    if (definition.requiresVerification && !definition.verify) {
      throw new StateNativeError(
        'INVALID_INPUT',
        'A verification-required kernel must provide an independent verifier.',
        { kernelId: definition.kernelId },
      );
    }
    if (this.#kernels.has(definition.kernelId)) {
      throw new StateNativeError('DIVERGENT_REPLAY', 'Kernel identifier is already registered.', {
        kernelId: definition.kernelId,
      });
    }
    this.#kernels.set(definition.kernelId, definition);
  }

  public listKernels(): readonly Pick<KernelDefinition, 'kernelId' | 'version' | 'kind' | 'route'>[] {
    return Object.freeze(
      [...this.#kernels.values()]
        .map(({ kernelId, version, kind, route }) => Object.freeze({ kernelId, version, kind, route }))
        .sort((left, right) => left.kernelId.localeCompare(right.kernelId)),
    );
  }

  public async execute(request: KernelExecutionRequest): Promise<KernelExecutionResult> {
    const definition = this.#kernels.get(request.kernelId);
    if (!definition) {
      throw new StateNativeError('NOT_FOUND', 'Kernel is not registered.', { kernelId: request.kernelId });
    }

    validateBudget(request);
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
      ? `${request.tenantId}:${request.idempotencyKey}`
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

      const input = await Promise.all(
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
      const context = {
        actionId: request.authorization.envelope.actionId,
        tenantId: request.tenantId,
        sessionId: request.sessionId,
        epoch: lease.epoch,
        budget: request.budget,
        signal: controller.signal,
      };
      const output = await this.#runWithDeadline(
        () => {
          executionStarted = true;
          return definition.execute(
            {
              capsules: Object.freeze(input),
              parameters: request.parameters,
            },
            context,
          );
        },
        controller,
        deadlineAt,
        'Kernel execution',
      );

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
        ? await this.#runWithDeadline(
            () =>
              definition.verify!(
                output,
                { capsules: Object.freeze(input), parameters: request.parameters },
                context,
              ),
            controller,
            deadlineAt,
            'Kernel verification',
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
            ? `${request.idempotencyKey}:output:${index}`
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
          receiptWritten = true;
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
