import { canonicalJson, digestObject, newId, sha256Hex } from './canonical.js';
import { assertCompatibility, assertCompatibilityFingerprint } from './compatibility.js';
import {
  constantTimeEqualHex,
  decryptEnvelope,
  encryptEnvelope,
  type EncryptedEnvelope,
} from './crypto.js';
import { StateNativeError, assertStateNative } from './errors.js';
import type {
  PortableStateObject,
  PutStateRequest,
  StateCapsule,
  StateReadContext,
  StateReadResult,
  StateSensitivity,
  StateTransferReceipt,
  StateTransitionReceipt,
  StateTransitionType,
  StateTransportAdapter,
} from './types.js';

interface StoredState {
  capsule: StateCapsule;
  envelope?: EncryptedEnvelope;
}

interface IdempotencyRecord {
  readonly requestDigest: string;
  readonly capsuleId: string;
}

export interface AlloyStateBusConfig {
  readonly masterKey: Uint8Array;
  readonly clock?: () => Date;
}

const SENSITIVITY_RANK: Readonly<Record<StateSensitivity, number>> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
};

const STATE_TYPES = new Set([
  'prompt',
  'kv_cache',
  'hidden_state',
  'embedding',
  'verifier_trace',
  'adapter',
  'tool_output',
  'reasoning_state',
  'structured_memory',
  'custom',
]);
const PORTABILITY_TIERS = new Set(['P0', 'P1', 'P2', 'P3', 'P4', 'P5']);
const SENSITIVITIES = new Set(['public', 'internal', 'confidential', 'restricted']);
const RETENTION_CLASSES = new Set(['ephemeral', 'session', 'short', 'regulated', 'custom']);
const REUSE_POLICIES = new Set(['never', 'same_action', 'same_session', 'same_tenant', 'explicit']);
const EVIDENCE_TIERS = new Set(['MEASURED', 'REPORTED', 'MODELED', 'CONJECTURE', 'UNKNOWN']);

function capsuleIdentity(request: PutStateRequest, contentDigest: string): string {
  return digestObject({
    schema: 'szl.state-capsule-identity/v1',
    tenantId: request.tenantId,
    sessionId: request.sessionId,
    stateType: request.stateType,
    portability: request.portability,
    contentDigest,
    compatibility: request.compatibility,
    governance: request.governance,
    provenance: request.provenance,
    expiresAt: request.expiresAt,
  });
}

function stateRequestDigest(request: PutStateRequest, contentDigest: string): string {
  return digestObject({
    schema: 'szl.put-state-request/v1',
    tenantId: request.tenantId,
    sessionId: request.sessionId,
    stateType: request.stateType,
    portability: request.portability,
    contentDigest,
    compatibility: request.compatibility,
    governance: request.governance,
    provenance: request.provenance,
    expiresAt: request.expiresAt,
  });
}

function idempotencyScopeKey(tenantId: string, idempotencyKey: string): string {
  return digestObject({
    schema: 'szl.state-idempotency-scope/v1',
    tenantId,
    idempotencyKey,
  });
}

function capsuleAad(capsule: StateCapsule): string {
  return canonicalJson({
    schema: capsule.schema,
    capsuleId: capsule.capsuleId,
    tenantId: capsule.tenantId,
    sessionId: capsule.sessionId,
    stateType: capsule.stateType,
    portability: capsule.portability,
    contentDigest: capsule.contentDigest,
    byteLength: capsule.byteLength,
    createdAt: capsule.createdAt,
    expiresAt: capsule.expiresAt,
    compatibility: capsule.compatibility,
    governance: capsule.governance,
    provenance: capsule.provenance,
  });
}

function assertNonEmpty(value: string, field: string): void {
  assertStateNative(value.trim().length > 0, 'INVALID_INPUT', `${field} must not be empty.`);
}

function importRequest(object: PortableStateObject): PutStateRequest {
  return {
    tenantId: object.capsule.tenantId,
    sessionId: object.capsule.sessionId,
    stateType: object.capsule.stateType,
    portability: object.capsule.portability,
    payload: object.payload,
    compatibility: object.capsule.compatibility,
    governance: object.capsule.governance,
    provenance: object.capsule.provenance,
    expiresAt: object.capsule.expiresAt,
  };
}

function freezeImportedCapsule(capsule: StateCapsule, payloadLength: number): StateCapsule {
  return Object.freeze({
    schema: 'szl.state-capsule/v1' as const,
    capsuleId: capsule.capsuleId,
    tenantId: capsule.tenantId,
    sessionId: capsule.sessionId,
    stateType: capsule.stateType,
    portability: capsule.portability,
    contentDigest: capsule.contentDigest,
    byteLength: payloadLength,
    createdAt: capsule.createdAt,
    expiresAt: capsule.expiresAt,
    compatibility: Object.freeze({ ...capsule.compatibility }),
    governance: Object.freeze({ ...capsule.governance }),
    provenance: Object.freeze({
      ...capsule.provenance,
      parentCapsuleIds: Object.freeze([...capsule.provenance.parentCapsuleIds]),
    }),
    revocationStatus: 'ACTIVE' as const,
  });
}

export class AlloyStateBus {
  readonly #masterKey: Buffer;
  readonly #clock: () => Date;
  readonly #objects = new Map<string, StoredState>();
  readonly #idempotency = new Map<string, IdempotencyRecord>();
  readonly #transitions = new Map<string, StateTransitionReceipt[]>();

  public constructor(config: AlloyStateBusConfig) {
    assertStateNative(config.masterKey.byteLength === 32, 'INVALID_INPUT', 'masterKey must contain 32 bytes.');
    this.#masterKey = Buffer.from(config.masterKey);
    this.#clock = config.clock ?? (() => new Date());
  }

  public async put(request: PutStateRequest): Promise<StateCapsule> {
    this.#validatePutRequest(request);
    const contentDigest = sha256Hex(request.payload);
    const requestDigest = stateRequestDigest(request, contentDigest);

    if (request.idempotencyKey) {
      const key = idempotencyScopeKey(request.tenantId, request.idempotencyKey);
      const prior = this.#idempotency.get(key);
      if (prior) {
        if (!constantTimeEqualHex(prior.requestDigest, requestDigest)) {
          throw new StateNativeError(
            'DIVERGENT_REPLAY',
            'The idempotency key was already used for a different state write.',
            { idempotencyKey: request.idempotencyKey },
          );
        }
        return this.requireMetadata(prior.capsuleId, request.tenantId);
      }
    }

    const identityDigest = capsuleIdentity(request, contentDigest);
    const capsuleId = `state_${identityDigest}`;
    const existing = this.#objects.get(capsuleId);
    if (existing) {
      if (existing.capsule.revocationStatus === 'SHREDDED') {
        throw new StateNativeError(
          'SHREDDED',
          'Content-addressed state was previously crypto-shredded and cannot be silently recreated.',
          { capsuleId },
        );
      }
      this.#recordIdempotency(request, requestDigest, capsuleId);
      return existing.capsule;
    }

    const now = this.#clock();
    const capsule: StateCapsule = Object.freeze({
      schema: 'szl.state-capsule/v1',
      capsuleId,
      tenantId: request.tenantId,
      sessionId: request.sessionId,
      stateType: request.stateType,
      portability: request.portability,
      contentDigest,
      byteLength: request.payload.byteLength,
      createdAt: now.toISOString(),
      expiresAt: request.expiresAt,
      compatibility: Object.freeze({ ...request.compatibility }),
      governance: Object.freeze({ ...request.governance }),
      provenance: Object.freeze({
        ...request.provenance,
        parentCapsuleIds: Object.freeze([...request.provenance.parentCapsuleIds]),
      }),
      revocationStatus: 'ACTIVE',
    });

    const envelope = encryptEnvelope(this.#masterKey, request.payload, capsuleAad(capsule));
    this.#objects.set(capsuleId, { capsule, envelope });
    const transition = this.#appendTransition(capsule, 'CREATED', 'State capsule created.');
    const transitioned = Object.freeze({ ...capsule, transitionDigest: transition.transitionDigest });
    this.#objects.set(capsuleId, { capsule: transitioned, envelope });
    this.#recordIdempotency(request, requestDigest, capsuleId);
    return transitioned;
  }

  public async get(capsuleId: string, context: StateReadContext): Promise<StateReadResult> {
    const stored = this.#objects.get(capsuleId);
    if (!stored) {
      throw new StateNativeError('NOT_FOUND', 'State capsule was not found.', { capsuleId });
    }

    const capsule = stored.capsule;
    this.#assertReadable(capsule, context);
    assertCompatibility(capsule.portability, capsule.compatibility, context.compatibility);

    if (!stored.envelope) {
      throw new StateNativeError('SHREDDED', 'State capsule key material is unavailable.', { capsuleId });
    }

    const payload = decryptEnvelope(this.#masterKey, stored.envelope, capsuleAad(capsule));
    const digest = sha256Hex(payload);
    if (!constantTimeEqualHex(digest, capsule.contentDigest)) {
      throw new StateNativeError('SIGNATURE_INVALID', 'State capsule content digest verification failed.', {
        capsuleId,
      });
    }

    return { capsule, payload };
  }

  public metadata(capsuleId: string): StateCapsule | undefined {
    return this.#objects.get(capsuleId)?.capsule;
  }

  public requireMetadata(capsuleId: string, tenantId?: string): StateCapsule {
    const capsule = this.metadata(capsuleId);
    if (!capsule) {
      throw new StateNativeError('NOT_FOUND', 'State capsule was not found.', { capsuleId });
    }
    if (tenantId !== undefined && capsule.tenantId !== tenantId) {
      throw new StateNativeError('TENANT_MISMATCH', 'State capsule belongs to a different tenant.', {
        capsuleId,
      });
    }
    return capsule;
  }

  public listMetadata(tenantId: string): readonly StateCapsule[] {
    return Object.freeze(
      [...this.#objects.values()]
        .map((item) => item.capsule)
        .filter((capsule) => capsule.tenantId === tenantId)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    );
  }

  public transitionHistory(capsuleId: string): readonly StateTransitionReceipt[] {
    return Object.freeze([...(this.#transitions.get(capsuleId) ?? [])]);
  }

  public async revoke(capsuleId: string, tenantId: string, reason: string): Promise<StateCapsule> {
    return this.#transition(capsuleId, tenantId, 'REVOKED', reason);
  }

  public async quarantine(capsuleId: string, tenantId: string, reason: string): Promise<StateCapsule> {
    return this.#transition(capsuleId, tenantId, 'QUARANTINED', reason);
  }

  public async cryptoShred(capsuleId: string, tenantId: string, reason: string): Promise<StateCapsule> {
    const capsule = await this.#transition(capsuleId, tenantId, 'SHREDDED', reason);
    const stored = this.#objects.get(capsuleId);
    if (stored) {
      this.#objects.set(capsuleId, { capsule });
    }
    return capsule;
  }

  public async exportTo(
    capsuleId: string,
    context: StateReadContext,
    adapter: StateTransportAdapter,
  ): Promise<StateTransferReceipt> {
    const object = await this.get(capsuleId, context);
    await adapter.put(object);
    return this.#transferReceipt(object.capsule, adapter.name, 'EXPORT');
  }

  public async importFrom(
    capsuleId: string,
    tenantId: string,
    adapter: StateTransportAdapter,
  ): Promise<{ readonly capsule: StateCapsule; readonly receipt: StateTransferReceipt }> {
    const object = await adapter.get(capsuleId);
    if (!object) {
      throw new StateNativeError('NOT_FOUND', 'Transport adapter did not contain the requested state.', {
        capsuleId,
        adapter: adapter.name,
      });
    }
    if (object.capsule.capsuleId !== capsuleId) {
      throw new StateNativeError('INVALID_INPUT', 'Transport object identity does not match the requested capsule.', {
        capsuleId,
        transportedCapsuleId: object.capsule.capsuleId,
      });
    }
    if (object.capsule.tenantId !== tenantId) {
      throw new StateNativeError('TENANT_MISMATCH', 'Transported state belongs to a different tenant.', {
        capsuleId,
      });
    }
    if (object.capsule.schema !== 'szl.state-capsule/v1') {
      throw new StateNativeError('INVALID_INPUT', 'Transported state uses an unsupported capsule schema.', {
        capsuleId,
        schema: object.capsule.schema,
      });
    }
    if (object.capsule.revocationStatus !== 'ACTIVE') {
      throw new StateNativeError(
        'REUSE_DENIED',
        'Only active state capsules may be imported through the transport boundary.',
        { capsuleId, revocationStatus: object.capsule.revocationStatus },
      );
    }
    if (!Number.isFinite(Date.parse(object.capsule.createdAt))) {
      throw new StateNativeError('INVALID_INPUT', 'Transported state has an invalid createdAt timestamp.', {
        capsuleId,
      });
    }
    if (object.capsule.byteLength !== object.payload.byteLength) {
      throw new StateNativeError('SIGNATURE_INVALID', 'Transported state byte length does not match its payload.', {
        capsuleId,
        declaredByteLength: object.capsule.byteLength,
        observedByteLength: object.payload.byteLength,
      });
    }

    const request = importRequest(object);
    this.#validatePutRequest(request);
    const digest = sha256Hex(object.payload);
    if (!constantTimeEqualHex(digest, object.capsule.contentDigest)) {
      throw new StateNativeError('SIGNATURE_INVALID', 'Transported state content digest verification failed.', {
        capsuleId,
      });
    }
    const expectedCapsuleId = `state_${capsuleIdentity(request, digest)}`;
    if (expectedCapsuleId !== capsuleId) {
      throw new StateNativeError(
        'SIGNATURE_INVALID',
        'Transported state metadata does not match its content-addressed capsule identity.',
        { capsuleId, expectedCapsuleId },
      );
    }

    const imported = freezeImportedCapsule(object.capsule, object.payload.byteLength);
    const existing = this.#objects.get(capsuleId);
    if (!existing) {
      const envelope = encryptEnvelope(this.#masterKey, object.payload, capsuleAad(imported));
      this.#objects.set(capsuleId, { capsule: imported, envelope });
      const transition = this.#appendTransition(imported, 'CREATED', `Imported through ${adapter.name}.`);
      const capsule = Object.freeze({ ...imported, transitionDigest: transition.transitionDigest });
      this.#objects.set(capsuleId, { capsule, envelope });
    } else {
      if (!constantTimeEqualHex(existing.capsule.contentDigest, digest)) {
        throw new StateNativeError('DIVERGENT_REPLAY', 'Existing local state disagrees with imported content.', {
          capsuleId,
        });
      }
      const existingAadDigest = sha256Hex(Buffer.from(capsuleAad(existing.capsule), 'utf8'));
      const importedAadDigest = sha256Hex(Buffer.from(capsuleAad(imported), 'utf8'));
      if (!constantTimeEqualHex(existingAadDigest, importedAadDigest)) {
        throw new StateNativeError(
          'DIVERGENT_REPLAY',
          'Existing local state disagrees with the imported immutable capsule contract.',
          { capsuleId },
        );
      }
    }

    const capsule = this.requireMetadata(capsuleId, tenantId);
    return { capsule, receipt: this.#transferReceipt(capsule, adapter.name, 'IMPORT') };
  }

  public dispose(): void {
    this.#masterKey.fill(0);
    this.#objects.clear();
    this.#idempotency.clear();
    this.#transitions.clear();
  }

  #validatePutRequest(request: PutStateRequest): void {
    assertNonEmpty(request.tenantId, 'tenantId');
    assertNonEmpty(request.sessionId, 'sessionId');
    assertStateNative(STATE_TYPES.has(request.stateType), 'INVALID_INPUT', 'stateType is unsupported.');
    assertStateNative(
      PORTABILITY_TIERS.has(request.portability),
      'INVALID_INPUT',
      'portability tier is unsupported.',
    );
    assertCompatibilityFingerprint(request.portability, request.compatibility);
    assertStateNative(
      SENSITIVITIES.has(request.governance.sensitivity),
      'INVALID_INPUT',
      'governance.sensitivity is unsupported.',
    );
    assertStateNative(
      RETENTION_CLASSES.has(request.governance.retentionClass),
      'INVALID_INPUT',
      'governance.retentionClass is unsupported.',
    );
    assertStateNative(
      REUSE_POLICIES.has(request.governance.reusePolicy),
      'INVALID_INPUT',
      'governance.reusePolicy is unsupported.',
    );
    assertStateNative(
      EVIDENCE_TIERS.has(request.governance.evidenceTier),
      'INVALID_INPUT',
      'governance.evidenceTier is unsupported.',
    );
    assertNonEmpty(request.compatibility.policyDigest, 'compatibility.policyDigest');
    assertNonEmpty(request.compatibility.cognitiveEpoch, 'compatibility.cognitiveEpoch');
    for (const [field, value] of Object.entries(request.compatibility)) {
      if (value !== undefined) {
        assertNonEmpty(value, `compatibility.${field}`);
      }
    }
    assertNonEmpty(request.provenance.sourceActionId, 'provenance.sourceActionId');
    assertStateNative(
      Array.isArray(request.provenance.parentCapsuleIds),
      'INVALID_INPUT',
      'provenance.parentCapsuleIds must be an array.',
    );
    const parentIds = new Set<string>();
    for (const parentCapsuleId of request.provenance.parentCapsuleIds) {
      assertNonEmpty(parentCapsuleId, 'provenance.parentCapsuleIds[]');
      assertStateNative(
        !parentIds.has(parentCapsuleId),
        'INVALID_INPUT',
        'provenance.parentCapsuleIds must not contain duplicates.',
      );
      parentIds.add(parentCapsuleId);
    }
    if (request.provenance.producerKernelId !== undefined) {
      assertNonEmpty(request.provenance.producerKernelId, 'provenance.producerKernelId');
    }
    if (request.provenance.producerKernelVersion !== undefined) {
      assertNonEmpty(request.provenance.producerKernelVersion, 'provenance.producerKernelVersion');
    }
    if (request.provenance.sourceReceiptId !== undefined) {
      assertNonEmpty(request.provenance.sourceReceiptId, 'provenance.sourceReceiptId');
    }
    assertStateNative(request.payload.byteLength > 0, 'INVALID_INPUT', 'State payload must not be empty.');

    if (request.expiresAt) {
      const expiry = Date.parse(request.expiresAt);
      assertStateNative(Number.isFinite(expiry), 'INVALID_INPUT', 'expiresAt must be an ISO-8601 timestamp.');
      assertStateNative(expiry > this.#clock().getTime(), 'EXPIRED', 'A new state capsule cannot already be expired.');
    }

    if (request.governance.reusePolicy === 'explicit') {
      assertStateNative(
        request.governance.explicitGrantId !== undefined &&
          request.governance.explicitGrantId.trim().length > 0,
        'INVALID_INPUT',
        'explicitGrantId is required when reusePolicy is explicit.',
      );
    } else {
      assertStateNative(
        request.governance.explicitGrantId === undefined,
        'INVALID_INPUT',
        'explicitGrantId is only allowed when reusePolicy is explicit.',
      );
    }
  }

  #recordIdempotency(request: PutStateRequest, requestDigest: string, capsuleId: string): void {
    if (!request.idempotencyKey) {
      return;
    }
    this.#idempotency.set(idempotencyScopeKey(request.tenantId, request.idempotencyKey), {
      requestDigest,
      capsuleId,
    });
  }

  #assertReadable(capsule: StateCapsule, context: StateReadContext): void {
    if (capsule.tenantId !== context.tenantId) {
      throw new StateNativeError('TENANT_MISMATCH', 'State capsule belongs to a different tenant.', {
        capsuleId: capsule.capsuleId,
      });
    }

    const now = this.#clock();
    if (capsule.expiresAt && Date.parse(capsule.expiresAt) <= now.getTime()) {
      throw new StateNativeError('EXPIRED', 'State capsule has expired.', { capsuleId: capsule.capsuleId });
    }

    switch (capsule.revocationStatus) {
      case 'ACTIVE':
        break;
      case 'REVOKED':
        throw new StateNativeError('REVOKED', 'State capsule has been revoked.', {
          capsuleId: capsule.capsuleId,
        });
      case 'QUARANTINED':
        throw new StateNativeError('QUARANTINED', 'State capsule is quarantined.', {
          capsuleId: capsule.capsuleId,
        });
      case 'SHREDDED':
        throw new StateNativeError('SHREDDED', 'State capsule has been crypto-shredded.', {
          capsuleId: capsule.capsuleId,
        });
      default: {
        const exhaustive: never = capsule.revocationStatus;
        throw new StateNativeError('INVALID_INPUT', `Unknown revocation state: ${String(exhaustive)}`);
      }
    }

    if (!context.allowedSensitivities.includes(capsule.governance.sensitivity)) {
      throw new StateNativeError('REUSE_DENIED', 'Caller is not authorized for this state sensitivity.', {
        capsuleId: capsule.capsuleId,
        sensitivity: capsule.governance.sensitivity,
      });
    }

    switch (capsule.governance.reusePolicy) {
      case 'never':
        throw new StateNativeError('REUSE_DENIED', 'State capsule policy forbids reuse.', {
          capsuleId: capsule.capsuleId,
        });
      case 'same_action':
        if (context.actionId !== capsule.provenance.sourceActionId) {
          throw new StateNativeError('REUSE_DENIED', 'State capsule is bound to its source action.', {
            capsuleId: capsule.capsuleId,
          });
        }
        break;
      case 'same_session':
        if (context.sessionId !== capsule.sessionId) {
          throw new StateNativeError('REUSE_DENIED', 'State capsule is bound to its source session.', {
            capsuleId: capsule.capsuleId,
          });
        }
        break;
      case 'same_tenant':
        break;
      case 'explicit':
        if (
          !capsule.governance.explicitGrantId ||
          context.explicitGrantId !== capsule.governance.explicitGrantId
        ) {
          throw new StateNativeError('REUSE_DENIED', 'State capsule requires an exact explicit grant.', {
            capsuleId: capsule.capsuleId,
          });
        }
        break;
      default: {
        const exhaustive: never = capsule.governance.reusePolicy;
        throw new StateNativeError('INVALID_INPUT', `Unknown state reuse policy: ${String(exhaustive)}`);
      }
    }
  }

  async #transition(
    capsuleId: string,
    tenantId: string,
    transition: Exclude<StateTransitionType, 'CREATED'>,
    reason: string,
  ): Promise<StateCapsule> {
    assertNonEmpty(reason, 'reason');
    const stored = this.#objects.get(capsuleId);
    if (!stored) {
      throw new StateNativeError('NOT_FOUND', 'State capsule was not found.', { capsuleId });
    }
    if (stored.capsule.tenantId !== tenantId) {
      throw new StateNativeError('TENANT_MISMATCH', 'State capsule belongs to a different tenant.', {
        capsuleId,
      });
    }
    if (stored.capsule.revocationStatus === 'SHREDDED') {
      throw new StateNativeError('SHREDDED', 'Crypto-shredded state is terminal.', { capsuleId });
    }
    const mayShred = transition === 'SHREDDED';
    if (!mayShred && stored.capsule.revocationStatus !== 'ACTIVE') {
      throw new StateNativeError(
        'INVALID_TRANSITION',
        `Cannot transition ${stored.capsule.revocationStatus} state to ${transition}.`,
        { capsuleId },
      );
    }

    const nextStatus = transition;
    const receipt = this.#appendTransition(stored.capsule, transition, reason);
    const capsule: StateCapsule = Object.freeze({
      ...stored.capsule,
      revocationStatus: nextStatus,
      transitionDigest: receipt.transitionDigest,
    });
    this.#objects.set(capsuleId, { capsule, envelope: stored.envelope });
    return capsule;
  }

  #appendTransition(
    capsule: StateCapsule,
    transition: StateTransitionType,
    reason: string,
  ): StateTransitionReceipt {
    const prior = this.#transitions.get(capsule.capsuleId) ?? [];
    const unsigned = {
      schema: 'szl.state-transition/v1' as const,
      transitionId: newId('transition'),
      capsuleId: capsule.capsuleId,
      tenantId: capsule.tenantId,
      transition,
      reason,
      occurredAt: this.#clock().toISOString(),
      priorTransitionDigest: prior.at(-1)?.transitionDigest,
    };
    const receipt: StateTransitionReceipt = Object.freeze({
      ...unsigned,
      transitionDigest: digestObject(unsigned),
    });
    prior.push(receipt);
    this.#transitions.set(capsule.capsuleId, prior);
    return receipt;
  }

  #transferReceipt(
    capsule: StateCapsule,
    adapter: string,
    direction: StateTransferReceipt['direction'],
  ): StateTransferReceipt {
    const unsigned = {
      schema: 'szl.state-transfer/v1' as const,
      transferId: newId('transfer'),
      capsuleId: capsule.capsuleId,
      tenantId: capsule.tenantId,
      adapter,
      direction,
      occurredAt: this.#clock().toISOString(),
      contentDigest: capsule.contentDigest,
    };
    return Object.freeze({ ...unsigned, receiptDigest: digestObject(unsigned) });
  }
}

export function highestSensitivity(capsules: readonly StateCapsule[]): StateSensitivity {
  return capsules.reduce<StateSensitivity>((highest, capsule) => {
    return SENSITIVITY_RANK[capsule.governance.sensitivity] > SENSITIVITY_RANK[highest]
      ? capsule.governance.sensitivity
      : highest;
  }, 'public');
}
