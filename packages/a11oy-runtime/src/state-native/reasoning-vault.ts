import { digestObject, newId, sha256Hex } from './canonical.js';
import {
  constantTimeEqualHex,
  decryptEnvelope,
  encryptEnvelope,
  type EncryptedEnvelope,
} from './crypto.js';
import { StateNativeError, assertStateNative } from './errors.js';
import type {
  ReasoningCheckout,
  ReasoningCheckoutRequest,
  ReasoningVaultEntry,
  ReasoningVaultState,
  StoreReasoningStateRequest,
} from './types.js';

interface StoredReasoningState {
  entry: ReasoningVaultEntry;
  envelope?: EncryptedEnvelope;
}

interface IdempotencyRecord {
  readonly requestDigest: string;
  readonly entryId: string;
}

export interface ReasoningVaultConfig {
  readonly masterKey: Uint8Array;
  readonly maxEntryBytes?: number;
  readonly maxTenantBytes?: number;
  readonly clock?: () => Date;
}

function entryAad(entry: ReasoningVaultEntry): string {
  return JSON.stringify({
    schema: entry.schema,
    entryId: entry.entryId,
    tenantId: entry.tenantId,
    sessionId: entry.sessionId,
    modelId: entry.modelId,
    modelRevision: entry.modelRevision,
    cognitiveEpoch: entry.cognitiveEpoch,
    providerRequestId: entry.providerRequestId,
    createdAt: entry.createdAt,
    expiresAt: entry.expiresAt,
    byteLength: entry.byteLength,
    contentDigest: entry.contentDigest,
  });
}

function freezeEntry(entry: ReasoningVaultEntry): ReasoningVaultEntry {
  return Object.freeze({ ...entry });
}

function idempotencyScopeKey(tenantId: string, idempotencyKey: string): string {
  return digestObject({
    schema: 'szl.reasoning-idempotency-scope/v1',
    tenantId,
    idempotencyKey,
  });
}

export class ReasoningVault {
  readonly #masterKey: Buffer;
  readonly #maxEntryBytes: number;
  readonly #maxTenantBytes: number;
  readonly #clock: () => Date;
  readonly #entries = new Map<string, StoredReasoningState>();
  readonly #idempotency = new Map<string, IdempotencyRecord>();

  public constructor(config: ReasoningVaultConfig) {
    assertStateNative(config.masterKey.byteLength === 32, 'INVALID_INPUT', 'masterKey must contain 32 bytes.');
    const maxEntryBytes = config.maxEntryBytes ?? 8 * 1024 * 1024;
    const maxTenantBytes = config.maxTenantBytes ?? 64 * 1024 * 1024;
    assertStateNative(
      Number.isSafeInteger(maxEntryBytes) && maxEntryBytes > 0,
      'INVALID_INPUT',
      'maxEntryBytes must be a positive safe integer.',
    );
    assertStateNative(
      Number.isSafeInteger(maxTenantBytes) && maxTenantBytes > 0,
      'INVALID_INPUT',
      'maxTenantBytes must be a positive safe integer.',
    );
    assertStateNative(
      maxTenantBytes >= maxEntryBytes,
      'INVALID_INPUT',
      'maxTenantBytes must be greater than or equal to maxEntryBytes.',
    );
    this.#masterKey = Buffer.from(config.masterKey);
    this.#maxEntryBytes = maxEntryBytes;
    this.#maxTenantBytes = maxTenantBytes;
    this.#clock = config.clock ?? (() => new Date());
  }

  public store(request: StoreReasoningStateRequest): ReasoningVaultEntry {
    this.#validateStoreRequest(request);
    const contentDigest = sha256Hex(request.payload);
    const requestDigest = digestObject({
      schema: 'szl.reasoning-vault-store/v1',
      tenantId: request.tenantId,
      sessionId: request.sessionId,
      modelId: request.modelId,
      modelRevision: request.modelRevision,
      cognitiveEpoch: request.cognitiveEpoch,
      providerRequestId: request.providerRequestId,
      contentDigest,
      ttlMs: request.ttlMs,
    });

    if (request.idempotencyKey) {
      const key = idempotencyScopeKey(request.tenantId, request.idempotencyKey);
      const prior = this.#idempotency.get(key);
      if (prior) {
        if (!constantTimeEqualHex(prior.requestDigest, requestDigest)) {
          throw new StateNativeError(
            'DIVERGENT_REPLAY',
            'Reasoning-vault idempotency key was used for a different request.',
          );
        }
        return this.require(prior.entryId, request.tenantId);
      }
    }

    const usedBytes = this.list(request.tenantId)
      .filter((entry) => entry.state !== 'SHREDDED')
      .reduce((total, entry) => total + entry.byteLength, 0);
    assertStateNative(
      usedBytes + request.payload.byteLength <= this.#maxTenantBytes,
      'BUDGET_EXCEEDED',
      'Tenant reasoning-vault quota would be exceeded.',
      { usedBytes, requestedBytes: request.payload.byteLength, maxTenantBytes: this.#maxTenantBytes },
    );

    const createdAt = this.#clock();
    const expiresAt = createdAt.getTime() + request.ttlMs;
    assertStateNative(
      Number.isFinite(expiresAt) && expiresAt <= 8_640_000_000_000_000,
      'INVALID_INPUT',
      'Reasoning-vault TTL exceeds the supported timestamp range.',
    );
    const entry = freezeEntry({
      schema: 'szl.reasoning-vault-entry/v1',
      entryId: newId('reasoning'),
      tenantId: request.tenantId,
      sessionId: request.sessionId,
      modelId: request.modelId,
      modelRevision: request.modelRevision,
      cognitiveEpoch: request.cognitiveEpoch,
      providerRequestId: request.providerRequestId,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      byteLength: request.payload.byteLength,
      contentDigest,
      state: 'PREPARED',
    });
    const envelope = encryptEnvelope(this.#masterKey, request.payload, entryAad(entry));
    this.#entries.set(entry.entryId, { entry, envelope });
    if (request.idempotencyKey) {
      this.#idempotency.set(idempotencyScopeKey(request.tenantId, request.idempotencyKey), {
        requestDigest,
        entryId: entry.entryId,
      });
    }
    return entry;
  }

  public checkout(request: ReasoningCheckoutRequest): ReasoningCheckout {
    const stored = this.#entries.get(request.entryId);
    if (!stored) {
      throw new StateNativeError('NOT_FOUND', 'Reasoning-vault entry was not found.', {
        entryId: request.entryId,
      });
    }
    this.#assertBinding(stored.entry, request);
    const now = this.#clock();
    if (Date.parse(stored.entry.expiresAt) <= now.getTime()) {
      throw new StateNativeError('EXPIRED', 'Reasoning-vault entry has expired.', {
        entryId: request.entryId,
      });
    }
    if (stored.entry.state === 'IN_FLIGHT') {
      throw new StateNativeError('ALREADY_IN_FLIGHT', 'Reasoning state is already checked out.', {
        entryId: request.entryId,
      });
    }
    if (stored.entry.state === 'INDETERMINATE') {
      throw new StateNativeError(
        'INDETERMINATE',
        'Ambiguous provider completion forbids automatic reasoning-state replay.',
        { entryId: request.entryId },
      );
    }
    if (stored.entry.state !== 'PREPARED') {
      throw new StateNativeError(
        stored.entry.state === 'SHREDDED' ? 'SHREDDED' : 'INVALID_TRANSITION',
        `Reasoning-vault entry cannot be checked out from ${stored.entry.state}.`,
        { entryId: request.entryId },
      );
    }
    if (!stored.envelope) {
      throw new StateNativeError('SHREDDED', 'Reasoning-vault key material is unavailable.', {
        entryId: request.entryId,
      });
    }

    const payload = decryptEnvelope(this.#masterKey, stored.envelope, entryAad(stored.entry));
    if (!constantTimeEqualHex(sha256Hex(payload), stored.entry.contentDigest)) {
      throw new StateNativeError('SIGNATURE_INVALID', 'Reasoning-vault content digest failed.', {
        entryId: request.entryId,
      });
    }

    const entry = freezeEntry({ ...stored.entry, state: 'IN_FLIGHT' });
    this.#entries.set(request.entryId, { entry, envelope: stored.envelope });
    return { entry, payload };
  }

  public complete(entryId: string, tenantId: string, reason = 'Provider request completed.'): ReasoningVaultEntry {
    return this.#transition(entryId, tenantId, 'COMPLETE', reason, ['IN_FLIGHT']);
  }

  public reject(entryId: string, tenantId: string, reason: string): ReasoningVaultEntry {
    return this.#transition(entryId, tenantId, 'REJECTED', reason, ['PREPARED', 'IN_FLIGHT']);
  }

  public markIndeterminate(entryId: string, tenantId: string, reason: string): ReasoningVaultEntry {
    return this.#transition(entryId, tenantId, 'INDETERMINATE', reason, ['IN_FLIGHT']);
  }

  public cryptoShred(entryId: string, tenantId: string, reason: string): ReasoningVaultEntry {
    const entry = this.#transition(
      entryId,
      tenantId,
      'SHREDDED',
      reason,
      ['PREPARED', 'IN_FLIGHT', 'COMPLETE', 'REJECTED', 'INDETERMINATE'],
    );
    this.#entries.set(entryId, { entry });
    return entry;
  }

  public metadata(entryId: string): ReasoningVaultEntry | undefined {
    return this.#entries.get(entryId)?.entry;
  }

  public require(entryId: string, tenantId?: string): ReasoningVaultEntry {
    const entry = this.metadata(entryId);
    if (!entry) {
      throw new StateNativeError('NOT_FOUND', 'Reasoning-vault entry was not found.', { entryId });
    }
    if (tenantId !== undefined && entry.tenantId !== tenantId) {
      throw new StateNativeError('TENANT_MISMATCH', 'Reasoning-vault entry belongs to another tenant.', {
        entryId,
      });
    }
    return entry;
  }

  public list(tenantId: string): readonly ReasoningVaultEntry[] {
    return Object.freeze(
      [...this.#entries.values()]
        .map((stored) => stored.entry)
        .filter((entry) => entry.tenantId === tenantId)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    );
  }

  public purgeExpired(): readonly ReasoningVaultEntry[] {
    const now = this.#clock();
    const shredded: ReasoningVaultEntry[] = [];
    for (const stored of this.#entries.values()) {
      if (stored.entry.state !== 'SHREDDED' && Date.parse(stored.entry.expiresAt) <= now.getTime()) {
        shredded.push(this.cryptoShred(stored.entry.entryId, stored.entry.tenantId, 'TTL expired.'));
      }
    }
    return Object.freeze(shredded);
  }

  public dispose(): void {
    this.#masterKey.fill(0);
    this.#entries.clear();
    this.#idempotency.clear();
  }

  #transition(
    entryId: string,
    tenantId: string,
    state: ReasoningVaultState,
    reason: string,
    allowedFrom: readonly ReasoningVaultState[],
  ): ReasoningVaultEntry {
    assertStateNative(reason.trim().length > 0, 'INVALID_INPUT', 'State transition reason must not be empty.');
    const stored = this.#entries.get(entryId);
    if (!stored) {
      throw new StateNativeError('NOT_FOUND', 'Reasoning-vault entry was not found.', { entryId });
    }
    if (stored.entry.tenantId !== tenantId) {
      throw new StateNativeError('TENANT_MISMATCH', 'Reasoning-vault entry belongs to another tenant.', {
        entryId,
      });
    }
    if (!allowedFrom.includes(stored.entry.state)) {
      throw new StateNativeError(
        'INVALID_TRANSITION',
        `Reasoning-vault entry cannot move from ${stored.entry.state} to ${state}.`,
        { entryId },
      );
    }
    const entry = freezeEntry({ ...stored.entry, state, stateReason: reason });
    this.#entries.set(entryId, { entry, envelope: stored.envelope });
    return entry;
  }

  #assertBinding(entry: ReasoningVaultEntry, request: ReasoningCheckoutRequest): void {
    if (entry.tenantId !== request.tenantId) {
      throw new StateNativeError('TENANT_MISMATCH', 'Reasoning-vault entry belongs to another tenant.');
    }
    const bindingMatches =
      entry.sessionId === request.sessionId &&
      entry.modelId === request.modelId &&
      entry.modelRevision === request.modelRevision &&
      entry.cognitiveEpoch === request.cognitiveEpoch;
    if (!bindingMatches) {
      throw new StateNativeError(
        'COMPATIBILITY_MISMATCH',
        'Reasoning state is bound to a different session, model revision, or cognitive epoch.',
        { entryId: entry.entryId },
      );
    }
  }

  #validateStoreRequest(request: StoreReasoningStateRequest): void {
    const required = [
      request.tenantId,
      request.sessionId,
      request.modelId,
      request.modelRevision,
      request.cognitiveEpoch,
      request.providerRequestId,
    ];
    assertStateNative(
      required.every((value) => value.trim().length > 0),
      'INVALID_INPUT',
      'Reasoning-vault binding fields must not be empty.',
    );
    assertStateNative(
      Number.isSafeInteger(request.ttlMs) && request.ttlMs > 0,
      'INVALID_INPUT',
      'Reasoning-vault TTL must be a positive safe integer.',
    );
    assertStateNative(request.payload.byteLength > 0, 'INVALID_INPUT', 'Reasoning state must not be empty.');
    assertStateNative(
      request.payload.byteLength <= this.#maxEntryBytes,
      'BUDGET_EXCEEDED',
      'Reasoning state exceeds the per-entry quota.',
      { byteLength: request.payload.byteLength, maxEntryBytes: this.#maxEntryBytes },
    );
  }
}
