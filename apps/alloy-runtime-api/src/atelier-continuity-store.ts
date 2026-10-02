import { createHmac, randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { link, lstat, mkdir, open, readdir, realpath, rename, rm, unlink } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, parse, resolve } from 'node:path';
import {
  ATELIER_STATE_RETENTION_HOURS,
  ATELIER_STATE_RETENTION_MS,
  ATELIER_TURN_CAPSULE_SCHEMA_VERSION,
  AtelierAmbiguousProviderCompletionError,
  AtelierAskRequestSchema,
  AtelierCapsuleIntegrityError,
  type AtelierCommitTurnInput,
  type AtelierGetTurnInput,
  AtelierInvalidStateInputError,
  type AtelierMarkPendingRecoveryInput,
  type AtelierPersistedAskRequest,
  type AtelierPruneResult,
  type AtelierReleaseTurnInput,
  AtelierReservationExpiredError,
  AtelierReservationNotFoundError,
  type AtelierReservationOutcome,
  type AtelierReserveTurnInput,
  AtelierSequenceConflictError,
  type AtelierSessionSnapshot,
  type AtelierStageTurnResponseInput,
  type AtelierStatePersistenceMetadata,
  type AtelierStateStore,
  type AtelierTurnCapsule,
  type AtelierTurnReservation,
  assertAtelierCapsuleChain,
  canonicalizeAtelierValue,
  capsuleConversationTurns,
  createAtelierContextDigest,
  createAtelierIdempotencyKeyDigest,
  createAtelierRequestDigest,
  createAtelierResponseDigest,
  createAtelierTurnCapsule,
  verifyAtelierTurnCapsule,
} from '@szl-holdings/a11oy-atelier';
import {
  AlloyStateBus,
  type CompatibilityFingerprint,
  canonicalJson,
  constantTimeEqualHex,
  FileSystemStateTransportAdapter,
  StateNativeError,
  sha256Hex,
} from '@workspace/a11oy-runtime/state-native';

const INDEX_SCHEMA = 'a11oy.atelier.encrypted-local-index.v1' as const;
const KEY_CHECK_SCHEMA = 'a11oy.atelier.encrypted-local-key-check.v1' as const;
const PENDING_PAYLOAD_SCHEMA = 'a11oy.atelier.pending-turn-payload.v1' as const;
const COMMITTED_PAYLOAD_SCHEMA = 'a11oy.atelier.committed-turn-payload.v1' as const;
const INDEX_AUTH_DOMAIN = 'a11oy.atelier.encrypted-local-index-auth.v1';
const PATH_DOMAIN = 'a11oy.atelier.encrypted-local-path.v1';
const MAX_INDEX_BYTES = 256 * 1024;
const HEX_64 = /^[a-f0-9]{64}$/;
const STATE_CAPSULE_ID = /^state_[a-f0-9]{64}$/;
const TEMPORARY_CANDIDATE = /\.(\d+)\.[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.tmp$/;
const DIRECTORY_SYNC_UNSUPPORTED = new Set([
  'EBADF',
  'EISDIR',
  'EINVAL',
  'ENOSYS',
  'ENOTSUP',
  'EPERM',
]);

const COMPATIBILITY: CompatibilityFingerprint = Object.freeze({
  schemaDigest: sha256Hex('a11oy.atelier.encrypted-local-payload.v1'),
  policyDigest: sha256Hex('a11oy.atelier.encrypted-local-policy.v1'),
  cognitiveEpoch: 'a11oy.atelier.encrypted-local.v1',
});

export const ATELIER_ENCRYPTED_LOCAL_CONTINUITY_LIMITS = Object.freeze({
  coordination: 'SERIALIZED_PER_PROCESS',
  crossProcess: 'LOCAL_FILESYSTEM_SESSION_LEASE_ONLY_NO_DISTRIBUTED_LOCKING',
  storageScope: 'SINGLE_HOST_LOCAL_FILESYSTEM',
  recovery: 'INTERRUPTED_RESERVATIONS_SURFACE_AS_PENDING_RECOVERY',
});

export class AtelierContinuityConfigurationError extends Error {
  override readonly name = 'AtelierContinuityConfigurationError';
  readonly code = 'ATELIER_CONTINUITY_CONFIGURATION';
}

interface PendingPayload {
  readonly schema: typeof PENDING_PAYLOAD_SCHEMA;
  readonly reservation: AtelierTurnReservation;
}

interface CommittedPayload {
  readonly schema: typeof COMMITTED_PAYLOAD_SCHEMA;
  readonly capsule: AtelierTurnCapsule;
}

interface IndexRecordBase {
  readonly schema: typeof INDEX_SCHEMA;
  readonly tenantPathDigest: string;
  readonly sessionPathDigest: string;
  readonly idempotencyPathDigest: string;
  readonly idempotencyKeyDigest: string;
  readonly requestDigest: string;
  readonly sequence: number;
  readonly priorCapsuleDigest: string | null;
  readonly stateCapsuleId: string;
  readonly retiredStateCapsuleIds: readonly string[];
  readonly expiresAt: string;
}

interface PendingIndexRecord extends IndexRecordBase {
  readonly state: 'PENDING';
  readonly reservationPathDigest: string;
  readonly reservedAt: string;
  readonly writerInstanceDigest: string;
  readonly authenticationTag: string;
}

interface CommittedIndexRecord extends IndexRecordBase {
  readonly state: 'COMMITTED';
  readonly reservationPathDigest: string;
  readonly capsuleDigest: string;
  readonly committedAt: string;
  readonly authenticationTag: string;
}

type IndexRecord = PendingIndexRecord | CommittedIndexRecord;

interface KeyCheckRecord {
  readonly schema: typeof KEY_CHECK_SCHEMA;
  readonly verifier: string;
  readonly authenticationTag: string;
}

export interface EncryptedLocalAtelierStateStoreOptions {
  readonly rootDirectory: string;
  readonly masterKey: Uint8Array;
  readonly now?: () => Date;
  readonly randomId?: () => string;
}

export interface EncryptedLocalAtelierStateStoreEnvironmentOptions {
  readonly env?: NodeJS.ProcessEnv;
  readonly required?: boolean;
  readonly now?: () => Date;
  readonly randomId?: () => string;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function errorCode(error: unknown): string | undefined {
  return objectValue(error)?.code as string | undefined;
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function cloneCanonical<T>(value: T): T {
  return JSON.parse(canonicalizeAtelierValue(value)) as T;
}

function configurationError(message: string): never {
  throw new AtelierContinuityConfigurationError(message);
}

function decodeEnvironmentKey(encoded: string): Buffer {
  const value = encoded.trim();
  let decoded: Buffer;
  if (/^(?:hex:)?[a-fA-F0-9]{64}$/.test(value)) {
    decoded = Buffer.from(value.startsWith('hex:') ? value.slice(4) : value, 'hex');
  } else {
    const raw = value.startsWith('base64:') ? value.slice(7) : value;
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(raw) || raw.length % 4 !== 0) {
      return configurationError(
        'A11OY_ATELIER_CONTINUITY_KEY must encode exactly 32 bytes as 64 hex characters or padded base64.',
      );
    }
    decoded = Buffer.from(raw, 'base64');
  }
  if (decoded.byteLength !== 32) {
    return configurationError('A11OY_ATELIER_CONTINUITY_KEY must decode to exactly 32 bytes.');
  }
  return decoded;
}

export function createEncryptedLocalAtelierStateStoreFromEnv(
  options: EncryptedLocalAtelierStateStoreEnvironmentOptions = {},
): EncryptedLocalAtelierStateStore | undefined {
  const env = options.env ?? process.env;
  const rootDirectory = env.A11OY_ATELIER_CONTINUITY_DIR?.trim();
  const encodedKey = env.A11OY_ATELIER_CONTINUITY_KEY?.trim();
  if (!rootDirectory && !encodedKey) {
    if (options.required) {
      return configurationError(
        'Encrypted Atelier continuity is required, but both continuity environment variables are absent.',
      );
    }
    return undefined;
  }
  if (!rootDirectory || !encodedKey) {
    return configurationError(
      'A11OY_ATELIER_CONTINUITY_DIR and A11OY_ATELIER_CONTINUITY_KEY must be configured together.',
    );
  }
  return new EncryptedLocalAtelierStateStore({
    rootDirectory,
    masterKey: decodeEnvironmentKey(encodedKey),
    ...(options.now ? { now: options.now } : {}),
    ...(options.randomId ? { randomId: options.randomId } : {}),
  });
}

export class EncryptedLocalAtelierStateStore implements AtelierStateStore {
  readonly persistence: AtelierStatePersistenceMetadata = Object.freeze({
    backend: 'state-native-encrypted-local-filesystem',
    persistenceState: 'ENCRYPTED_LOCAL_DURABLE',
    durable: true,
    encryptionState: 'ENCRYPTED_AT_REST',
    evidenceState: 'OBSERVED',
    retentionHours: ATELIER_STATE_RETENTION_HOURS,
    retentionMs: ATELIER_STATE_RETENTION_MS,
  });

  readonly #masterKey: Buffer;
  readonly #now: () => Date;
  readonly #randomId: () => string;
  readonly #instanceDigest: string;
  readonly #transport: FileSystemStateTransportAdapter;
  #rootDirectory: string;
  #lockTail: Promise<void> = Promise.resolve();
  #initializationFailure: { readonly error: unknown } | undefined;
  readonly #ready: Promise<void>;

  constructor(options: EncryptedLocalAtelierStateStoreOptions) {
    if (options.masterKey.byteLength !== 32) {
      configurationError('Encrypted Atelier continuity requires a 32-byte master key.');
    }
    if (!isAbsolute(options.rootDirectory)) {
      configurationError('Encrypted Atelier continuity requires an absolute storage directory.');
    }
    const rootDirectory = resolve(options.rootDirectory);
    if (!options.rootDirectory.trim() || rootDirectory === parse(rootDirectory).root) {
      configurationError('Encrypted Atelier continuity requires a non-root storage directory.');
    }
    this.#masterKey = Buffer.from(options.masterKey);
    this.#now = options.now ?? (() => new Date());
    this.#randomId = options.randomId ?? randomUUID;
    this.#rootDirectory = rootDirectory;
    this.#instanceDigest = this.#pathDigest('instance', this.#randomId());
    this.#transport = new FileSystemStateTransportAdapter({
      rootDirectory: join(rootDirectory, 'capsules'),
      masterKey: this.#masterKey,
      name: 'a11oy-atelier-encrypted-local',
      clock: this.#now,
    });
    this.#ready = this.#initialize().catch((error: unknown) => {
      this.#initializationFailure = { error };
    });
  }

  async ready(): Promise<void> {
    await this.#ready;
    if (this.#initializationFailure) {
      throw this.#initializationFailure.error;
    }
  }

  reserveTurn(input: AtelierReserveTurnInput): Promise<AtelierReservationOutcome> {
    return this.#withLock(async () => {
      await this.ready();
      const parsed = AtelierAskRequestSchema.parse(input.request);
      if (parsed.idempotencyKey !== undefined && parsed.idempotencyKey !== input.idempotencyKey) {
        throw new AtelierInvalidStateInputError(
          'The request idempotencyKey does not match the reservation key.',
          { field: 'idempotencyKey' },
        );
      }
      const { idempotencyKey: _discarded, ...withoutKey } = parsed;
      const request = freeze(cloneCanonical(withoutKey as AtelierPersistedAskRequest));
      const requestDigest = createAtelierRequestDigest(request);
      const idempotencyKeyDigest = createAtelierIdempotencyKeyDigest(input.idempotencyKey);
      const scope = this.#scope(input.tenantId, input.sessionId);
      let records = await this.#readSessionRecords(scope);
      records = await this.#pruneSessionIfExpired(scope, records, this.#clock().milliseconds);
      const committed = records.find(
        (record): record is CommittedIndexRecord =>
          record.state === 'COMMITTED' && record.idempotencyKeyDigest === idempotencyKeyDigest,
      );
      if (committed) {
        const capsule = await this.#loadCommitted(committed, input.tenantId, input.sessionId);
        if (capsule.requestDigest !== requestDigest) {
          return {
            status: 'divergent',
            code: 'ATELIER_IDEMPOTENCY_DIVERGENT',
            idempotencyKeyDigest,
            existingRequestDigest: capsule.requestDigest,
            receivedRequestDigest: requestDigest,
          };
        }
        return { status: 'replay', capsule, response: capsule.response };
      }

      const pending = records.find(
        (record): record is PendingIndexRecord => record.state === 'PENDING',
      );
      if (pending) {
        const reservation = await this.#loadPending(pending, input.tenantId, input.sessionId);
        const recovered = pending.writerInstanceDigest !== this.#instanceDigest;
        const visible = recovered
          ? freeze({ ...reservation, persistenceState: 'PENDING_RECOVERY' as const })
          : reservation;
        if (pending.idempotencyKeyDigest === idempotencyKeyDigest) {
          if (pending.requestDigest !== requestDigest) {
            return {
              status: 'divergent',
              code: 'ATELIER_IDEMPOTENCY_DIVERGENT',
              idempotencyKeyDigest,
              existingRequestDigest: pending.requestDigest,
              receivedRequestDigest: requestDigest,
            };
          }
          return {
            status: 'pending',
            code: 'ATELIER_IDEMPOTENCY_PENDING',
            reason: recovered ? 'PENDING_RECOVERY' : 'IDEMPOTENCY_KEY',
            reservation: visible,
          };
        }
        return {
          status: 'pending',
          code: 'ATELIER_SESSION_BUSY',
          reason: recovered ? 'PENDING_RECOVERY' : 'SESSION_BUSY',
          reservation: visible,
        };
      }

      const capsules = await this.#loadCommittedChain(records, input.tenantId, input.sessionId);
      const now = this.#clock();
      const reservation: AtelierTurnReservation = freeze({
        schemaVersion: ATELIER_TURN_CAPSULE_SCHEMA_VERSION,
        reservationId: `atelier_res_${this.#randomId()}`,
        tenantId: input.tenantId,
        sessionId: input.sessionId,
        idempotencyKeyDigest,
        request,
        requestDigest,
        contextDigest: createAtelierContextDigest(capsules.flatMap(capsuleConversationTurns)),
        sequence: capsules.length + 1,
        priorCapsuleDigest: capsules.at(-1)?.capsuleDigest ?? null,
        reservedAt: now.iso,
        expiresAt: new Date(now.milliseconds + ATELIER_STATE_RETENTION_MS).toISOString(),
        persistenceState: 'RESERVED_ENCRYPTED_LOCAL_DURABLE',
        durable: true,
      });
      const stateCapsuleId = await this.#persistPayload(
        scope,
        this.#pathDigest('reservation', reservation.reservationId),
        reservation.expiresAt,
        { schema: PENDING_PAYLOAD_SCHEMA, reservation } satisfies PendingPayload,
      );
      const base = {
        schema: INDEX_SCHEMA,
        state: 'PENDING',
        ...scope,
        idempotencyPathDigest: this.#pathDigest('idempotency', input.idempotencyKey),
        idempotencyKeyDigest,
        reservationPathDigest: this.#pathDigest('reservation', reservation.reservationId),
        requestDigest,
        sequence: reservation.sequence,
        priorCapsuleDigest: reservation.priorCapsuleDigest,
        stateCapsuleId,
        retiredStateCapsuleIds: [],
        reservedAt: reservation.reservedAt,
        expiresAt: reservation.expiresAt,
        writerInstanceDigest: this.#instanceDigest,
      } satisfies Omit<PendingIndexRecord, 'authenticationTag'>;
      const record = this.#authenticate(base) as PendingIndexRecord;
      const indexPath = this.#indexPath(record);
      const created = await this.#atomicCreate(indexPath, record);
      if (!created) {
        const published = await this.#readAuthenticated(indexPath, INDEX_SCHEMA);
        if (published?.stateCapsuleId !== stateCapsuleId) {
          await this.#transport.delete(stateCapsuleId);
        }
        throw new AtelierCapsuleIntegrityError(
          'A concurrent process already holds the hashed session lease.',
        );
      }
      return { status: 'reserved', reservation };
    });
  }

  stageTurnResponse(input: AtelierStageTurnResponseInput): Promise<AtelierTurnReservation> {
    return this.#stageResponse(input, 'RESPONSE_STAGED_ENCRYPTED_LOCAL_DURABLE');
  }

  markTurnPendingRecovery(input: AtelierMarkPendingRecoveryInput): Promise<AtelierTurnReservation> {
    return this.#stageResponse(input, 'PENDING_RECOVERY');
  }

  releaseTurn(input: AtelierReleaseTurnInput): Promise<boolean> {
    return this.#withLock(async () => {
      await this.ready();
      const scope = this.#scope(input.tenantId, input.sessionId);
      const records = await this.#readSessionRecords(scope);
      const reservationDigest = this.#pathDigest('reservation', input.reservationId);
      const pending = records.find(
        (record): record is PendingIndexRecord =>
          record.state === 'PENDING' && record.reservationPathDigest === reservationDigest,
      );
      if (!pending) throw new AtelierReservationNotFoundError(input.reservationId);
      const reservation = await this.#loadPending(pending, input.tenantId, input.sessionId);
      if (Date.parse(reservation.expiresAt) <= this.#clock().milliseconds) {
        await this.#removeIndex(pending);
        await this.#deleteRecordCapsules(pending);
        throw new AtelierReservationExpiredError(reservation.reservationId, reservation.expiresAt);
      }
      if (reservation.stagedResponse !== undefined) {
        throw new AtelierAmbiguousProviderCompletionError(input.reservationId);
      }
      await this.#removeIndex(pending);
      await this.#deleteRecordCapsules(pending);
      return true;
    });
  }

  commitTurn(input: AtelierCommitTurnInput): Promise<AtelierTurnCapsule> {
    return this.#withLock(async () => {
      await this.ready();
      const scope = this.#scope(input.tenantId, input.sessionId);
      let records = await this.#readSessionRecords(scope);
      const now = this.#clock();
      records = await this.#pruneSessionIfExpired(scope, records, now.milliseconds);
      const reservationDigest = this.#pathDigest('reservation', input.reservationId);
      const pending = records.find(
        (record): record is PendingIndexRecord =>
          record.state === 'PENDING' && record.reservationPathDigest === reservationDigest,
      );
      if (!pending) throw new AtelierReservationNotFoundError(input.reservationId);
      const reservation = await this.#loadPending(pending, input.tenantId, input.sessionId);
      if (reservation.stagedResponse === undefined || reservation.providerPrompt === undefined) {
        throw new AtelierInvalidStateInputError(
          'A provider response must be staged before the turn can be committed.',
          { reservationId: input.reservationId },
        );
      }
      const committedRecords = records.filter(
        (record): record is CommittedIndexRecord => record.state === 'COMMITTED',
      );
      const chain = await this.#loadCommittedChain(
        committedRecords,
        input.tenantId,
        input.sessionId,
      );
      const currentSequence = chain.length;
      const currentDigest = chain.at(-1)?.capsuleDigest ?? null;
      if (
        reservation.sequence !== currentSequence + 1 ||
        reservation.priorCapsuleDigest !== currentDigest
      ) {
        await this.#stageResponseLocked(
          pending,
          reservation,
          reservation.providerPrompt,
          reservation.stagedResponse,
          'PENDING_RECOVERY',
        );
        throw new AtelierSequenceConflictError({
          reservationId: reservation.reservationId,
          reservedSequence: reservation.sequence,
          currentSequence,
          reservedPriorCapsuleDigest: reservation.priorCapsuleDigest,
          currentCapsuleDigest: currentDigest,
        });
      }
      const capsule = createAtelierTurnCapsule({
        reservationId: reservation.reservationId,
        tenantId: reservation.tenantId,
        sessionId: reservation.sessionId,
        idempotencyKeyDigest: reservation.idempotencyKeyDigest,
        request: reservation.request,
        providerPrompt: reservation.providerPrompt,
        response: reservation.stagedResponse,
        requestDigest: reservation.requestDigest,
        contextDigest: reservation.contextDigest,
        receiptId: reservation.stagedResponse.receipt.receiptId,
        sequence: reservation.sequence,
        priorCapsuleDigest: reservation.priorCapsuleDigest,
        committedAt: now.iso,
        expiresAt:
          chain[0]?.expiresAt ??
          new Date(now.milliseconds + ATELIER_STATE_RETENTION_MS).toISOString(),
        persistenceState: 'COMMITTED_ENCRYPTED_LOCAL_DURABLE',
        durable: true,
      });
      const stateCapsuleId = await this.#persistPayload(
        scope,
        reservationDigest,
        capsule.expiresAt,
        { schema: COMMITTED_PAYLOAD_SCHEMA, capsule } satisfies CommittedPayload,
        [pending.stateCapsuleId],
      );
      const base = {
        schema: INDEX_SCHEMA,
        state: 'COMMITTED',
        tenantPathDigest: pending.tenantPathDigest,
        sessionPathDigest: pending.sessionPathDigest,
        idempotencyPathDigest: pending.idempotencyPathDigest,
        idempotencyKeyDigest: pending.idempotencyKeyDigest,
        reservationPathDigest: pending.reservationPathDigest,
        requestDigest: pending.requestDigest,
        sequence: capsule.sequence,
        priorCapsuleDigest: capsule.priorCapsuleDigest,
        stateCapsuleId,
        retiredStateCapsuleIds: [...pending.retiredStateCapsuleIds, pending.stateCapsuleId],
        capsuleDigest: capsule.capsuleDigest,
        committedAt: capsule.committedAt,
        expiresAt: capsule.expiresAt,
      } satisfies Omit<CommittedIndexRecord, 'authenticationTag'>;
      const committed = this.#authenticate(base) as CommittedIndexRecord;
      const committedPath = this.#indexPath(committed);
      if (!(await this.#atomicCreate(committedPath, committed))) {
        const published = await this.#readAuthenticated(committedPath, INDEX_SCHEMA);
        if (published?.stateCapsuleId !== stateCapsuleId) {
          await this.#transport.delete(stateCapsuleId);
        }
        throw new AtelierCapsuleIntegrityError(
          'A concurrent commit occupied the hashed idempotency index.',
        );
      }
      await this.#removeIndex(pending);
      return capsule;
    });
  }
  getTurn(input: AtelierGetTurnInput): Promise<AtelierTurnCapsule | null> {
    return this.#withLock(async () => {
      await this.ready();
      const scope = this.#scope(input.tenantId, input.sessionId);
      let records = await this.#readSessionRecords(scope);
      records = await this.#pruneSessionIfExpired(scope, records, this.#clock().milliseconds);
      const digest = createAtelierIdempotencyKeyDigest(input.idempotencyKey);
      const record = records.find(
        (candidate): candidate is CommittedIndexRecord =>
          candidate.state === 'COMMITTED' && candidate.idempotencyKeyDigest === digest,
      );
      return record ? this.#loadCommitted(record, input.tenantId, input.sessionId) : null;
    });
  }

  getSession(tenantId: string, sessionId: string): Promise<AtelierSessionSnapshot | null> {
    return this.#withLock(async () => {
      await this.ready();
      const scope = this.#scope(tenantId, sessionId);
      let records = await this.#readSessionRecords(scope);
      records = await this.#pruneSessionIfExpired(scope, records, this.#clock().milliseconds);
      if (records.length === 0) return null;
      const capsules = freeze(await this.#loadCommittedChain(records, tenantId, sessionId));
      const turns = freeze(capsules.flatMap(capsuleConversationTurns));
      return freeze({
        tenantId,
        sessionId,
        capsules,
        turns,
        persistence: this.persistence,
        expiresAt: records.map((record) => record.expiresAt).sort()[0] ?? null,
      });
    });
  }

  pruneExpired(): Promise<AtelierPruneResult> {
    return this.#withLock(async () => {
      await this.ready();
      const result = await this.#pruneExpiredUnlocked();
      await this.#reconcileOrphans();
      return result;
    });
  }

  #stageResponse(
    input: AtelierStageTurnResponseInput,
    persistenceState: 'RESPONSE_STAGED_ENCRYPTED_LOCAL_DURABLE' | 'PENDING_RECOVERY',
  ): Promise<AtelierTurnReservation> {
    return this.#withLock(async () => {
      await this.ready();
      if (
        typeof input.providerPrompt !== 'string' ||
        input.providerPrompt.length === 0 ||
        input.providerPrompt.length > 400_000 ||
        input.providerPrompt.trim() !== input.providerPrompt
      ) {
        throw new AtelierInvalidStateInputError(
          'providerPrompt must be a non-empty, trimmed string of at most 400000 characters.',
          { field: 'providerPrompt' },
        );
      }
      if (
        typeof input.response?.answer !== 'string' ||
        typeof input.response?.disclosure !== 'string' ||
        typeof input.response?.receipt !== 'object' ||
        input.response.receipt === null
      ) {
        throw new AtelierInvalidStateInputError('response must be a complete AtelierAskResponse.', {
          field: 'response',
        });
      }
      const scope = this.#scope(input.tenantId, input.sessionId);
      const records = await this.#readSessionRecords(scope);
      const reservationDigest = this.#pathDigest('reservation', input.reservationId);
      const pending = records.find(
        (record): record is PendingIndexRecord =>
          record.state === 'PENDING' && record.reservationPathDigest === reservationDigest,
      );
      if (!pending) throw new AtelierReservationNotFoundError(input.reservationId);
      const reservation = await this.#loadPending(pending, input.tenantId, input.sessionId);
      if (Date.parse(reservation.expiresAt) <= this.#clock().milliseconds) {
        await this.#removeIndex(pending);
        await this.#deleteRecordCapsules(pending);
        throw new AtelierReservationExpiredError(reservation.reservationId, reservation.expiresAt);
      }
      return this.#stageResponseLocked(
        pending,
        reservation,
        input.providerPrompt,
        input.response,
        persistenceState,
      );
    });
  }

  async #stageResponseLocked(
    pending: PendingIndexRecord,
    reservation: AtelierTurnReservation,
    providerPrompt: string,
    response: AtelierStageTurnResponseInput['response'],
    persistenceState: 'RESPONSE_STAGED_ENCRYPTED_LOCAL_DURABLE' | 'PENDING_RECOVERY',
  ): Promise<AtelierTurnReservation> {
    if (
      reservation.stagedResponse !== undefined &&
      (reservation.providerPrompt !== providerPrompt ||
        createAtelierResponseDigest(reservation.stagedResponse) !==
          createAtelierResponseDigest(response))
    ) {
      throw new AtelierAmbiguousProviderCompletionError(reservation.reservationId);
    }
    const staged = freeze({
      ...reservation,
      providerPrompt,
      stagedResponse: freeze(cloneCanonical(response)),
      persistenceState,
      durable: true,
    });
    const stateCapsuleId = await this.#persistPayload(
      {
        tenantPathDigest: pending.tenantPathDigest,
        sessionPathDigest: pending.sessionPathDigest,
      },
      pending.reservationPathDigest,
      pending.expiresAt,
      { schema: PENDING_PAYLOAD_SCHEMA, reservation: staged },
      [pending.stateCapsuleId],
    );
    const base = {
      schema: INDEX_SCHEMA,
      state: 'PENDING',
      tenantPathDigest: pending.tenantPathDigest,
      sessionPathDigest: pending.sessionPathDigest,
      idempotencyPathDigest: pending.idempotencyPathDigest,
      idempotencyKeyDigest: pending.idempotencyKeyDigest,
      reservationPathDigest: pending.reservationPathDigest,
      requestDigest: pending.requestDigest,
      sequence: pending.sequence,
      priorCapsuleDigest: pending.priorCapsuleDigest,
      stateCapsuleId,
      retiredStateCapsuleIds: [...pending.retiredStateCapsuleIds, pending.stateCapsuleId],
      reservedAt: pending.reservedAt,
      expiresAt: pending.expiresAt,
      writerInstanceDigest: this.#instanceDigest,
    } satisfies Omit<PendingIndexRecord, 'authenticationTag'>;
    const indexPath = this.#indexPath(pending);
    try {
      await this.#atomicReplace(indexPath, this.#authenticate(base));
    } catch (error) {
      let published: Record<string, unknown> | undefined;
      try {
        published = await this.#readAuthenticated(indexPath, INDEX_SCHEMA);
      } catch {
        throw error;
      }
      if (published?.stateCapsuleId === pending.stateCapsuleId) {
        await this.#transport.delete(stateCapsuleId);
      }
      throw error;
    }
    return staged;
  }
  #withLock<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.#lockTail.then(operation, operation);
    this.#lockTail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  #clock(): { milliseconds: number; iso: string } {
    const date = this.#now();
    if (!Number.isFinite(date.getTime())) {
      throw new AtelierInvalidStateInputError('The injected clock returned an invalid date.');
    }
    return { milliseconds: date.getTime(), iso: date.toISOString() };
  }

  #pathDigest(kind: string, value: string): string {
    return createHmac('sha256', this.#masterKey)
      .update(canonicalJson({ domain: PATH_DOMAIN, kind, value }), 'utf8')
      .digest('hex');
  }

  #scope(tenantId: string, sessionId: string) {
    for (const [field, value] of [
      ['tenantId', tenantId],
      ['sessionId', sessionId],
    ] as const) {
      if (
        typeof value !== 'string' ||
        value.length === 0 ||
        value.length > 128 ||
        value.trim() !== value
      ) {
        throw new AtelierInvalidStateInputError(
          `${field} must be a non-empty, trimmed string of at most 128 characters.`,
          { field },
        );
      }
    }
    return {
      tenantPathDigest: this.#pathDigest('tenant', tenantId),
      sessionPathDigest: this.#pathDigest('session', sessionId),
    };
  }

  #authenticate(
    record: Omit<IndexRecord, 'authenticationTag'> | Omit<KeyCheckRecord, 'authenticationTag'>,
  ) {
    return {
      ...record,
      authenticationTag: createHmac('sha256', this.#masterKey)
        .update(canonicalJson({ domain: INDEX_AUTH_DOMAIN, record }), 'utf8')
        .digest('hex'),
    };
  }

  #indexPath(
    record: Pick<
      IndexRecord,
      'state' | 'tenantPathDigest' | 'sessionPathDigest' | 'idempotencyPathDigest'
    >,
  ): string {
    const fileDigest =
      record.state === 'PENDING'
        ? this.#pathDigest('session-lease', record.sessionPathDigest)
        : record.idempotencyPathDigest;
    return join(
      this.#rootDirectory,
      'indexes',
      record.tenantPathDigest,
      record.sessionPathDigest,
      `${fileDigest}.json`,
    );
  }

  async #initialize(): Promise<void> {
    await mkdir(this.#rootDirectory, { recursive: true, mode: 0o700 });
    this.#rootDirectory = await realpath(this.#rootDirectory);
    await this.#ensureDirectory(join(this.#rootDirectory, 'indexes'));
    const markerPath = join(this.#rootDirectory, 'key-check.json');
    const marker = await this.#readAuthenticated(markerPath, KEY_CHECK_SCHEMA);
    if (!marker) {
      if (await this.#containsFiles(this.#rootDirectory, markerPath)) {
        throw new AtelierCapsuleIntegrityError(
          'Continuity key marker is missing from non-empty durable state.',
        );
      }
      const base = {
        schema: KEY_CHECK_SCHEMA,
        verifier: this.#pathDigest('key-check', KEY_CHECK_SCHEMA),
      } satisfies Omit<KeyCheckRecord, 'authenticationTag'>;
      await this.#atomicCreate(markerPath, this.#authenticate(base));
      await this.#readAuthenticated(markerPath, KEY_CHECK_SCHEMA);
    }
    await this.#pruneExpiredUnlocked();
    await this.#reconcileOrphans();
  }

  async #indexScopes(): Promise<Array<{ tenantPathDigest: string; sessionPathDigest: string }>> {
    const scopes: Array<{
      tenantPathDigest: string;
      sessionPathDigest: string;
    }> = [];
    const indexRoot = join(this.#rootDirectory, 'indexes');
    const tenants = await this.#directoryEntries(indexRoot);
    for (const tenant of tenants) {
      if (!tenant.isDirectory() || tenant.isSymbolicLink() || !HEX_64.test(tenant.name)) {
        throw new AtelierCapsuleIntegrityError(
          'Continuity index root contains an unexpected entry.',
        );
      }
      const tenantPath = join(indexRoot, tenant.name);
      const sessions = await this.#directoryEntries(tenantPath);
      for (const session of sessions) {
        if (!session.isDirectory() || session.isSymbolicLink() || !HEX_64.test(session.name)) {
          throw new AtelierCapsuleIntegrityError(
            'Continuity tenant index contains an unexpected entry.',
          );
        }
        scopes.push({
          tenantPathDigest: tenant.name,
          sessionPathDigest: session.name,
        });
      }
    }
    return scopes;
  }

  async #allIndexRecords(): Promise<IndexRecord[]> {
    const records: IndexRecord[] = [];
    for (const scope of await this.#indexScopes()) {
      records.push(...(await this.#readSessionRecords(scope)));
    }
    return records;
  }

  async #pruneExpiredUnlocked(): Promise<AtelierPruneResult> {
    const now = this.#clock().milliseconds;
    let sessions = 0;
    let reservations = 0;
    let capsules = 0;
    for (const scope of await this.#indexScopes()) {
      const records = await this.#readSessionRecords(scope);
      if (!records.some((record) => Date.parse(record.expiresAt) <= now)) {
        continue;
      }
      sessions += 1;
      reservations += records.filter((record) => record.state === 'PENDING').length;
      capsules += records.filter((record) => record.state === 'COMMITTED').length;
      for (const record of records) {
        await this.#removeIndex(record);
        await this.#deleteRecordCapsules(record);
      }
    }
    return { sessions, reservations, capsules };
  }

  async #reconcileOrphans(): Promise<void> {
    await this.#transport.inspect(`state_${'0'.repeat(64)}`);
    const referenced = new Set<string>();
    for (const record of await this.#allIndexRecords()) {
      referenced.add(record.stateCapsuleId);
      for (const retired of record.retiredStateCapsuleIds) {
        referenced.add(retired);
      }
    }

    const objectsRoot = join(this.#rootDirectory, 'capsules', 'objects');
    for (const firstShard of await this.#directoryEntries(objectsRoot)) {
      if (
        !firstShard.isDirectory() ||
        firstShard.isSymbolicLink() ||
        !/^[a-f0-9]{2}$/.test(firstShard.name)
      ) {
        throw new AtelierCapsuleIntegrityError(
          'Encrypted continuity object root contains an unexpected entry.',
        );
      }
      const firstPath = join(objectsRoot, firstShard.name);
      for (const secondShard of await this.#directoryEntries(firstPath)) {
        if (
          !secondShard.isDirectory() ||
          secondShard.isSymbolicLink() ||
          !/^[a-f0-9]{2}$/.test(secondShard.name)
        ) {
          throw new AtelierCapsuleIntegrityError(
            'Encrypted continuity object shard contains an unexpected entry.',
          );
        }
        const secondPath = join(firstPath, secondShard.name);
        let removedTemporary = false;
        for (const entry of await this.#directoryEntries(secondPath)) {
          const entryPath = join(secondPath, entry.name);
          if (entry.name.endsWith('.tmp')) {
            if (!entry.isFile() || entry.isSymbolicLink()) {
              throw new AtelierCapsuleIntegrityError(
                'Encrypted continuity temporary object is not a regular file.',
              );
            }
            if (!this.#temporaryWriterIsLive(entry.name)) {
              removedTemporary =
                (await unlink(entryPath).then(
                  () => true,
                  (error: unknown) => {
                    if (errorCode(error) === 'ENOENT') return false;
                    throw error;
                  },
                )) || removedTemporary;
            }
            continue;
          }
          const capsuleId = basename(entry.name, '.json');
          if (!entry.isFile() || entry.isSymbolicLink() || !STATE_CAPSULE_ID.test(capsuleId)) {
            throw new AtelierCapsuleIntegrityError(
              'Encrypted continuity object shard contains an unexpected record.',
            );
          }
          const digest = capsuleId.slice('state_'.length);
          if (digest.slice(0, 2) !== firstShard.name || digest.slice(2, 4) !== secondShard.name) {
            throw new AtelierCapsuleIntegrityError(
              'Encrypted continuity object is stored in the wrong shard.',
            );
          }
          if (!referenced.has(capsuleId)) {
            // Publication writes the encrypted object before its index. A
            // concurrent writer may still be linking (or withdrawing) that
            // index. Do not inspect a freshly published object while its
            // writer is active; require authenticated expiry before shredding.
            const metadata = await lstat(entryPath).catch((error: unknown) => {
              if (errorCode(error) === 'ENOENT') return undefined;
              throw error;
            });
            if (!metadata) continue;
            if (!metadata.isFile() || metadata.isSymbolicLink()) {
              throw new AtelierCapsuleIntegrityError(
                'Encrypted continuity object shard contains an unexpected record.',
              );
            }
            if (Date.now() - metadata.mtimeMs < ATELIER_STATE_RETENTION_MS) continue;
            const object = await this.#transport.get(capsuleId);
            if (object?.capsule.expiresAt &&
                Date.parse(object.capsule.expiresAt) <= this.#clock().milliseconds) {
              await this.#transport.delete(capsuleId);
            }
          }
        }
        if (removedTemporary) await this.#syncDirectory(secondPath);
      }
    }
  }

  async #persistPayload(
    scope: { tenantPathDigest: string; sessionPathDigest: string },
    sourceActionId: string,
    expiresAt: string,
    payload: PendingPayload | CommittedPayload,
    parents: readonly string[] = [],
  ): Promise<string> {
    const bus = new AlloyStateBus({ masterKey: this.#masterKey, clock: this.#now });
    try {
      const capsule = await bus.put({
        tenantId: scope.tenantPathDigest,
        sessionId: scope.sessionPathDigest,
        stateType: 'structured_memory',
        portability: 'P4',
        payload: Buffer.from(canonicalizeAtelierValue(payload), 'utf8'),
        compatibility: COMPATIBILITY,
        governance: {
          sensitivity: 'restricted',
          retentionClass: 'short',
          reusePolicy: 'same_session',
          evidenceTier: 'MEASURED',
        },
        provenance: {
          sourceActionId,
          parentCapsuleIds: parents,
          producerKernelId: 'a11oy.atelier.continuity',
          producerKernelVersion: '1.0.0',
        },
        expiresAt,
      });
      await bus.exportTo(capsule.capsuleId, this.#readContext(scope), this.#transport);
      return capsule.capsuleId;
    } catch (error) {
      if (error instanceof StateNativeError) {
        throw new AtelierCapsuleIntegrityError('Encrypted state persistence failed closed.', {
          stateNativeCode: error.code,
        });
      }
      throw error;
    } finally {
      bus.dispose();
    }
  }

  async #loadPayload(
    record: IndexRecord,
    expectedSchema: typeof PENDING_PAYLOAD_SCHEMA | typeof COMMITTED_PAYLOAD_SCHEMA,
  ): Promise<PendingPayload | CommittedPayload> {
    const bus = new AlloyStateBus({ masterKey: this.#masterKey, clock: this.#now });
    try {
      await bus.importFrom(record.stateCapsuleId, record.tenantPathDigest, this.#transport);
      const result = await bus.get(record.stateCapsuleId, this.#readContext(record));
      const parsed = JSON.parse(Buffer.from(result.payload).toString('utf8')) as unknown;
      const value = objectValue(parsed);
      if (value?.schema !== expectedSchema) {
        throw new AtelierCapsuleIntegrityError(
          'Encrypted state payload uses an unexpected schema.',
        );
      }
      return parsed as PendingPayload | CommittedPayload;
    } catch (error) {
      if (error instanceof AtelierCapsuleIntegrityError) throw error;
      if (error instanceof StateNativeError || error instanceof SyntaxError) {
        throw new AtelierCapsuleIntegrityError(
          'Encrypted state payload failed authenticated readback.',
          {
            stateNativeCode: error instanceof StateNativeError ? error.code : 'INVALID_JSON',
          },
        );
      }
      throw error;
    } finally {
      bus.dispose();
    }
  }

  #readContext(scope: { tenantPathDigest: string; sessionPathDigest: string }) {
    return {
      tenantId: scope.tenantPathDigest,
      sessionId: scope.sessionPathDigest,
      actionId: 'a11oy.atelier.continuity.read',
      compatibility: COMPATIBILITY,
      allowedSensitivities: ['restricted'] as const,
    };
  }

  async #loadPending(
    record: PendingIndexRecord,
    tenantId: string,
    sessionId: string,
  ): Promise<AtelierTurnReservation> {
    const payload = (await this.#loadPayload(record, PENDING_PAYLOAD_SCHEMA)) as PendingPayload;
    const reservation = payload.reservation;
    if (
      reservation.tenantId !== tenantId ||
      reservation.sessionId !== sessionId ||
      reservation.idempotencyKeyDigest !== record.idempotencyKeyDigest ||
      reservation.requestDigest !== record.requestDigest ||
      reservation.sequence !== record.sequence ||
      reservation.priorCapsuleDigest !== record.priorCapsuleDigest
    ) {
      throw new AtelierCapsuleIntegrityError(
        'Pending reservation does not match its authenticated index.',
      );
    }
    return freeze(reservation);
  }

  async #loadCommitted(
    record: CommittedIndexRecord,
    tenantId: string,
    sessionId: string,
  ): Promise<AtelierTurnCapsule> {
    const payload = (await this.#loadPayload(record, COMMITTED_PAYLOAD_SCHEMA)) as CommittedPayload;
    const capsule = payload.capsule;
    const verified = verifyAtelierTurnCapsule(capsule);
    if (
      !verified.valid ||
      capsule.tenantId !== tenantId ||
      capsule.sessionId !== sessionId ||
      capsule.idempotencyKeyDigest !== record.idempotencyKeyDigest ||
      capsule.requestDigest !== record.requestDigest ||
      capsule.sequence !== record.sequence ||
      capsule.priorCapsuleDigest !== record.priorCapsuleDigest ||
      capsule.capsuleDigest !== record.capsuleDigest
    ) {
      throw new AtelierCapsuleIntegrityError(
        'Committed Turn Capsule does not match its authenticated index.',
      );
    }
    return freeze(capsule);
  }

  async #loadCommittedChain(
    records: readonly IndexRecord[],
    tenantId: string,
    sessionId: string,
  ): Promise<AtelierTurnCapsule[]> {
    const committed = records
      .filter((record): record is CommittedIndexRecord => record.state === 'COMMITTED')
      .sort((left, right) => left.sequence - right.sequence);
    const capsules = await Promise.all(
      committed.map((record) => this.#loadCommitted(record, tenantId, sessionId)),
    );
    assertAtelierCapsuleChain(capsules);
    return capsules;
  }

  async #readSessionRecords(scope: {
    tenantPathDigest: string;
    sessionPathDigest: string;
  }): Promise<IndexRecord[]> {
    const directory = join(
      this.#rootDirectory,
      'indexes',
      scope.tenantPathDigest,
      scope.sessionPathDigest,
    );
    await this.#ensureDirectory(directory);
    const entries = await this.#directoryEntries(directory);
    const records: IndexRecord[] = [];
    for (const entry of entries) {
      if (entry.name.endsWith('.tmp')) {
        if (!entry.isFile() || entry.isSymbolicLink()) {
          throw new AtelierCapsuleIntegrityError(
            'Continuity index temporary entries must be regular files.',
          );
        }
        if (!this.#temporaryWriterIsLive(entry.name)) {
          const removed = await unlink(join(directory, entry.name)).then(
            () => true,
            (error: unknown) => {
              if (errorCode(error) === 'ENOENT') return false;
              throw error;
            },
          );
          if (removed) await this.#syncDirectory(directory);
        }
        continue;
      }
      if (!entry.isFile() || entry.isSymbolicLink() || !entry.name.endsWith('.json')) {
        throw new AtelierCapsuleIntegrityError(
          'Continuity index directories may contain only regular JSON records.',
        );
      }
      const record = (await this.#readAuthenticated(join(directory, entry.name), INDEX_SCHEMA)) as
        | IndexRecord
        | undefined;
      if (!record) continue;
      if (
        record.tenantPathDigest !== scope.tenantPathDigest ||
        record.sessionPathDigest !== scope.sessionPathDigest ||
        !HEX_64.test(record.idempotencyPathDigest) ||
        !HEX_64.test(record.idempotencyKeyDigest) ||
        !HEX_64.test(record.requestDigest) ||
        !Number.isSafeInteger(record.sequence) ||
        record.sequence < 1 ||
        (record.priorCapsuleDigest !== null && !HEX_64.test(record.priorCapsuleDigest)) ||
        typeof record.stateCapsuleId !== 'string' ||
        !STATE_CAPSULE_ID.test(record.stateCapsuleId) ||
        !Array.isArray(record.retiredStateCapsuleIds) ||
        record.retiredStateCapsuleIds.some(
          (capsuleId) => typeof capsuleId !== 'string' || !STATE_CAPSULE_ID.test(capsuleId),
        ) ||
        !Number.isFinite(Date.parse(record.expiresAt)) ||
        (record.state !== 'PENDING' && record.state !== 'COMMITTED')
      ) {
        throw new AtelierCapsuleIntegrityError(
          'Continuity index metadata is malformed or mis-scoped.',
        );
      }
      if (
        record.state === 'PENDING'
          ? !HEX_64.test(record.reservationPathDigest) ||
            !HEX_64.test(record.writerInstanceDigest) ||
            !Number.isFinite(Date.parse(record.reservedAt))
          : !HEX_64.test(record.reservationPathDigest) ||
            !HEX_64.test(record.capsuleDigest) ||
            !Number.isFinite(Date.parse(record.committedAt))
      ) {
        throw new AtelierCapsuleIntegrityError(
          'Continuity index state-specific metadata is malformed.',
        );
      }
      records.push(record);
    }
    const committed = records.filter(
      (record): record is CommittedIndexRecord => record.state === 'COMMITTED',
    );
    const pending = records.filter(
      (record): record is PendingIndexRecord => record.state === 'PENDING',
    );
    const committedSequences = committed.map((record) => record.sequence);
    if (new Set(committedSequences).size !== committedSequences.length || pending.length > 1) {
      throw new AtelierCapsuleIntegrityError(
        'Continuity index contains conflicting session state.',
      );
    }

    const pendingRecord = pending[0];
    if (pendingRecord) {
      const related = committed.filter(
        (record) =>
          record.sequence === pendingRecord.sequence ||
          record.reservationPathDigest === pendingRecord.reservationPathDigest ||
          record.idempotencyPathDigest === pendingRecord.idempotencyPathDigest ||
          record.idempotencyKeyDigest === pendingRecord.idempotencyKeyDigest,
      );
      const matching = related.filter(
        (record) =>
          record.reservationPathDigest === pendingRecord.reservationPathDigest &&
          record.idempotencyPathDigest === pendingRecord.idempotencyPathDigest &&
          record.idempotencyKeyDigest === pendingRecord.idempotencyKeyDigest &&
          record.requestDigest === pendingRecord.requestDigest &&
          record.sequence === pendingRecord.sequence &&
          record.priorCapsuleDigest === pendingRecord.priorCapsuleDigest &&
          record.retiredStateCapsuleIds.includes(pendingRecord.stateCapsuleId),
      );
      if (related.length > 0 && matching.length !== 1) {
        throw new AtelierCapsuleIntegrityError(
          'Pending lease conflicts with authenticated committed state.',
        );
      }
      if (matching.length === 1) {
        await this.#removeIndex(pendingRecord);
        await this.#deleteRecordCapsules(pendingRecord);
        return records.filter((record) => record !== pendingRecord);
      }
    }
    return records;
  }

  async #pruneSessionIfExpired(
    _scope: { tenantPathDigest: string; sessionPathDigest: string },
    records: IndexRecord[],
    now: number,
  ): Promise<IndexRecord[]> {
    if (!records.some((record) => Date.parse(record.expiresAt) <= now)) return records;
    for (const record of records) {
      await this.#removeIndex(record);
      await this.#deleteRecordCapsules(record);
    }
    return [];
  }

  async #readAuthenticated(
    path: string,
    schema: string,
  ): Promise<Record<string, unknown> | undefined> {
    // Open once before inspecting the file. All content and size checks use
    // this descriptor, not a path that may be replaced between check and use.
    const flags =
      fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0) | (fsConstants.O_NONBLOCK ?? 0);
    const handle = await open(path, flags).catch((error: unknown) => {
      if (errorCode(error) === 'ENOENT') return undefined;
      if (errorCode(error) === 'ELOOP') {
        throw new AtelierCapsuleIntegrityError('Continuity index must not be a symbolic link.');
      }
      throw error;
    });
    if (!handle) return undefined;
    try {
      const opened = await handle.stat();
      if (!opened.isFile() || opened.size > MAX_INDEX_BYTES) {
        throw new AtelierCapsuleIntegrityError('Continuity index is not a bounded regular file.');
      }
      // Bound allocation and bytes consumed even if another writer grows the
      // open file after stat. The extra byte distinguishes overflow from EOF.
      const buffer = Buffer.alloc(MAX_INDEX_BYTES + 1);
      let length = 0;
      while (length < buffer.length) {
        const read = await handle.read(buffer, length, buffer.length - length, null);
        if (read.bytesRead === 0) break;
        length += read.bytesRead;
      }
      if (length > MAX_INDEX_BYTES) {
        throw new AtelierCapsuleIntegrityError('Continuity index exceeded its read bound.');
      }
      const afterRead = await handle.stat();
      const current = await lstat(path).catch(() => undefined);
      if (
        !current?.isFile() ||
        current.isSymbolicLink() ||
        current.dev !== afterRead.dev ||
        current.ino !== afterRead.ino ||
        opened.size !== afterRead.size ||
        opened.mtimeMs !== afterRead.mtimeMs ||
        (opened.ctimeMs !== afterRead.ctimeMs &&
          // Atomic creation links a fsynced candidate to its final name,
          // then unlinks the candidate. That 2-to-1 link-count transition
          // changes ctime without changing the opened file or its bytes.
          !(opened.nlink === 2 && afterRead.nlink === 1)) ||
        length !== afterRead.size
      ) {
        throw new AtelierCapsuleIntegrityError(
          'Continuity index changed during authenticated readback.',
        );
      }

      const value = objectValue(JSON.parse(buffer.subarray(0, length).toString('utf8')));
      if (
        value?.schema !== schema ||
        typeof value.authenticationTag !== 'string' ||
        !HEX_64.test(value.authenticationTag)
      ) {
        throw new AtelierCapsuleIntegrityError('Continuity index record is malformed.');
      }
      const { authenticationTag, ...record } = value;
      const expected = createHmac('sha256', this.#masterKey)
        .update(canonicalJson({ domain: INDEX_AUTH_DOMAIN, record }), 'utf8')
        .digest('hex');
      if (!constantTimeEqualHex(authenticationTag, expected)) {
        throw new AtelierCapsuleIntegrityError('Continuity index authentication failed.');
      }
      return value;
    } catch (error) {
      if (error instanceof AtelierCapsuleIntegrityError) throw error;
      throw new AtelierCapsuleIntegrityError('Continuity index failed closed during parsing.');
    } finally {
      await handle.close();
    }
  }

  async #atomicCreate(path: string, record: object): Promise<boolean> {
    await this.#ensureDirectory(dirname(path));
    const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
    const handle = await open(temporary, 'wx', 0o600);
    try {
      await handle.writeFile(`${canonicalJson(record)}\n`, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      try {
        await link(temporary, path);
      } catch (error) {
        if (errorCode(error) === 'EEXIST') return false;
        throw error;
      }
      await this.#syncDirectory(dirname(path));
      return true;
    } finally {
      await rm(temporary, { force: true });
    }
  }

  async #atomicReplace(path: string, record: object): Promise<void> {
    await this.#ensureDirectory(dirname(path));
    const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
    const handle = await open(temporary, 'wx', 0o600);
    try {
      await handle.writeFile(`${canonicalJson(record)}\n`, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      await rename(temporary, path);
      await this.#syncDirectory(dirname(path));
    } finally {
      await rm(temporary, { force: true });
    }
  }

  async #deleteRecordCapsules(record: IndexRecord): Promise<void> {
    const capsuleIds = new Set([...record.retiredStateCapsuleIds, record.stateCapsuleId]);
    for (const capsuleId of capsuleIds) {
      await this.#transport.delete(capsuleId);
    }
  }
  async #removeIndex(record: IndexRecord): Promise<void> {
    const path = this.#indexPath(record);
    await unlink(path).catch((error: unknown) => {
      if (errorCode(error) !== 'ENOENT') throw error;
    });
    await this.#syncDirectory(dirname(path));
  }

  async #ensureDirectory(path: string): Promise<void> {
    await mkdir(path, { recursive: true, mode: 0o700 });
    const stat = await lstat(path);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new AtelierCapsuleIntegrityError(
        'Continuity storage directories must not be symbolic links.',
      );
    }
  }

  async #directoryEntries(path: string) {
    return readdir(path, { withFileTypes: true }).catch((error: unknown) => {
      if (errorCode(error) === 'ENOENT') return [];
      throw error;
    });
  }

  async #syncDirectory(path: string): Promise<void> {
    const handle = await open(path, 'r');
    try {
      await handle.sync();
    } catch (error) {
      if (process.platform !== 'win32' || !DIRECTORY_SYNC_UNSUPPORTED.has(errorCode(error) ?? ''))
        throw error;
    } finally {
      await handle.close();
    }
  }

  async #containsFiles(path: string, markerPath: string): Promise<boolean> {
    for (const entry of await this.#directoryEntries(path)) {
      const candidate = join(path, entry.name);
      if (candidate === markerPath) continue;
      if (entry.isSymbolicLink())
        throw new AtelierCapsuleIntegrityError(
          'Continuity storage must not contain symbolic links.',
        );
      if (entry.isFile() && this.#temporaryWriterIsLive(entry.name)) continue;
      if (entry.isFile()) return true;
      if (entry.isDirectory() && (await this.#containsFiles(candidate, markerPath))) return true;
    }
    return false;
  }

  #temporaryWriterIsLive(name: string): boolean {
    const match = TEMPORARY_CANDIDATE.exec(name);
    if (!match) return false;
    const pid = Number(match[1]);
    if (!Number.isSafeInteger(pid) || pid < 1) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      if (errorCode(error) === 'EPERM') return true;
      if (errorCode(error) === 'ESRCH') return false;
      throw error;
    }
  }
}
