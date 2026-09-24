import { createHash, randomUUID } from 'node:crypto';
import {
  ATELIER_RECEIPT_SCHEMA_VERSION,
  type AtelierAskRequest,
  AtelierAskRequestSchema,
  type AtelierAskResponse,
} from './contracts.js';

export const ATELIER_TURN_CAPSULE_SCHEMA_VERSION = 'a11oy.atelier.turn-capsule.v1' as const;
export const ATELIER_STATE_RETENTION_HOURS = 24 as const;
export const ATELIER_STATE_RETENTION_MS = ATELIER_STATE_RETENTION_HOURS * 60 * 60 * 1_000;
export const ATELIER_IN_PROCESS_PERSISTENCE_STATE = 'IN_PROCESS_NON_DURABLE' as const;

export type AtelierStateErrorCode =
  | 'ATELIER_CANONICALIZATION_ERROR'
  | 'ATELIER_INVALID_STATE_INPUT'
  | 'ATELIER_IDEMPOTENCY_DIVERGENT'
  | 'ATELIER_IDEMPOTENCY_PENDING'
  | 'ATELIER_SESSION_BUSY'
  | 'ATELIER_AMBIGUOUS_PROVIDER_COMPLETION'
  | 'ATELIER_RESERVATION_NOT_FOUND'
  | 'ATELIER_RESERVATION_EXPIRED'
  | 'ATELIER_RESERVATION_MISMATCH'
  | 'ATELIER_SEQUENCE_CONFLICT'
  | 'ATELIER_CAPSULE_INTEGRITY';

export class AtelierStateError extends Error {
  override readonly name: string = 'AtelierStateError';

  constructor(
    readonly code: AtelierStateErrorCode,
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
  }
}

export class AtelierCanonicalizationError extends AtelierStateError {
  override readonly name = 'AtelierCanonicalizationError';

  constructor(message: string) {
    super('ATELIER_CANONICALIZATION_ERROR', message);
  }
}

export class AtelierInvalidStateInputError extends AtelierStateError {
  override readonly name = 'AtelierInvalidStateInputError';

  constructor(message: string, details: Readonly<Record<string, unknown>> = {}) {
    super('ATELIER_INVALID_STATE_INPUT', message, details);
  }
}

export class AtelierIdempotencyDivergenceError extends AtelierStateError {
  override readonly name = 'AtelierIdempotencyDivergenceError';

  constructor(
    readonly idempotencyKeyDigest: string,
    readonly existingRequestDigest: string,
    readonly receivedRequestDigest: string,
  ) {
    super(
      'ATELIER_IDEMPOTENCY_DIVERGENT',
      'The idempotency key is already bound to a different request.',
      { idempotencyKeyDigest, existingRequestDigest, receivedRequestDigest },
    );
  }
}

export class AtelierReservationNotFoundError extends AtelierStateError {
  override readonly name = 'AtelierReservationNotFoundError';

  constructor(reservationId: string) {
    super('ATELIER_RESERVATION_NOT_FOUND', 'The turn reservation was not found.', {
      reservationId,
    });
  }
}

export class AtelierReservationExpiredError extends AtelierStateError {
  override readonly name = 'AtelierReservationExpiredError';

  constructor(reservationId: string, expiresAt: string) {
    super('ATELIER_RESERVATION_EXPIRED', 'The turn reservation has expired.', {
      reservationId,
      expiresAt,
    });
  }
}

export class AtelierReservationMismatchError extends AtelierStateError {
  override readonly name = 'AtelierReservationMismatchError';

  constructor(reservationId: string) {
    super(
      'ATELIER_RESERVATION_MISMATCH',
      'The reservation does not belong to the supplied tenant and session.',
      { reservationId },
    );
  }
}

export class AtelierSequenceConflictError extends AtelierStateError {
  override readonly name = 'AtelierSequenceConflictError';

  constructor(params: {
    reservationId: string;
    reservedSequence: number;
    currentSequence: number;
    reservedPriorCapsuleDigest: string | null;
    currentCapsuleDigest: string | null;
  }) {
    super(
      'ATELIER_SEQUENCE_CONFLICT',
      'The session advanced after this turn was reserved; reserve the turn again.',
      params,
    );
  }
}

export class AtelierAmbiguousProviderCompletionError extends AtelierStateError {
  override readonly name = 'AtelierAmbiguousProviderCompletionError';

  constructor(reservationId: string) {
    super(
      'ATELIER_AMBIGUOUS_PROVIDER_COMPLETION',
      'A response is staged for this reservation; it must be committed or recovered, not released.',
      { reservationId },
    );
  }
}

export class AtelierCapsuleIntegrityError extends AtelierStateError {
  override readonly name = 'AtelierCapsuleIntegrityError';

  constructor(message: string, details: Readonly<Record<string, unknown>> = {}) {
    super('ATELIER_CAPSULE_INTEGRITY', message, details);
  }
}

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue | undefined };

function canonicalize(value: CanonicalValue, path: string): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new AtelierCanonicalizationError(`Cannot canonicalize a non-finite number at ${path}.`);
    }
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (Array.isArray(value)) {
    return `[${value
      .map((entry, index) => {
        if (entry === undefined) {
          throw new AtelierCanonicalizationError(
            `Cannot canonicalize undefined at ${path}[${index}].`,
          );
        }
        return canonicalize(entry, `${path}[${index}]`);
      })
      .join(',')}]`;
  }
  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new AtelierCanonicalizationError(`Cannot canonicalize a non-plain object at ${path}.`);
    }
    const entries = Object.entries(value)
      .filter((entry): entry is [string, CanonicalValue] => entry[1] !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalize(entry, `${path}.${key}`)}`)
      .join(',')}}`;
  }
  throw new AtelierCanonicalizationError(`Cannot canonicalize ${typeof value} at ${path}.`);
}

/** Stable UTF-8 JSON for the JSON subset accepted by Atelier state. */
export function canonicalizeAtelierValue(value: unknown): string {
  return canonicalize(value as CanonicalValue, '$');
}

/** Lower-case SHA-256 of Atelier's canonical JSON representation. */
export function createAtelierCanonicalDigest(value: unknown): string {
  return createHash('sha256').update(canonicalizeAtelierValue(value), 'utf8').digest('hex');
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function canonicalClone<T>(value: T): T {
  return JSON.parse(canonicalizeAtelierValue(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export type AtelierPersistedAskRequest = Omit<AtelierAskRequest, 'idempotencyKey'>;

export interface AtelierConversationTurn {
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly sequence: number;
  readonly capsuleDigest: string;
  readonly createdAt: string;
}

export function createAtelierIdempotencyKeyDigest(idempotencyKey: string): string {
  assertIdentifier('idempotencyKey', idempotencyKey, 128);
  return sha256Text(idempotencyKey);
}

export function createAtelierRequestDigest(request: unknown): string {
  return createAtelierCanonicalDigest(request);
}

export function createAtelierContextDigest(
  turns: readonly Pick<AtelierConversationTurn, 'role' | 'content'>[],
): string {
  return createAtelierCanonicalDigest(turns.map(({ role, content }) => ({ role, content })));
}

function responseDigestMaterial(response: AtelierAskResponse): AtelierAskResponse {
  return {
    ...response,
    receipt: { ...response.receipt, capsuleDigest: null },
  };
}

export function createAtelierResponseDigest(response: AtelierAskResponse): string {
  return createAtelierCanonicalDigest(responseDigestMaterial(response));
}

export type AtelierStatePersistenceState =
  | typeof ATELIER_IN_PROCESS_PERSISTENCE_STATE
  | 'ENCRYPTED_LOCAL_DURABLE'
  | 'PENDING_RECOVERY'
  | 'UNAVAILABLE';

export interface AtelierStatePersistenceMetadata {
  readonly backend: string;
  readonly persistenceState: AtelierStatePersistenceState;
  readonly durable: boolean;
  readonly encryptionState: 'NONE' | 'ENCRYPTED_AT_REST' | 'UNAVAILABLE';
  readonly evidenceState: 'OBSERVED' | 'UNAVAILABLE';
  readonly retentionHours: number;
  readonly retentionMs: number;
}

export type AtelierReservationPersistenceState =
  | 'RESERVED_IN_PROCESS_NON_DURABLE'
  | 'RESERVED_ENCRYPTED_LOCAL_DURABLE'
  | 'RESPONSE_STAGED_IN_PROCESS_NON_DURABLE'
  | 'RESPONSE_STAGED_ENCRYPTED_LOCAL_DURABLE'
  | 'PENDING_RECOVERY';

export type AtelierCapsulePersistenceState =
  | 'COMMITTED_IN_PROCESS_NON_DURABLE'
  | 'COMMITTED_ENCRYPTED_LOCAL_DURABLE';

export interface AtelierTurnReservation {
  readonly schemaVersion: typeof ATELIER_TURN_CAPSULE_SCHEMA_VERSION;
  readonly reservationId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly idempotencyKeyDigest: string;
  readonly request: AtelierPersistedAskRequest;
  readonly providerPrompt?: string;
  readonly stagedResponse?: AtelierAskResponse;
  readonly requestDigest: string;
  readonly contextDigest: string;
  readonly sequence: number;
  readonly priorCapsuleDigest: string | null;
  readonly reservedAt: string;
  readonly expiresAt: string;
  readonly persistenceState: AtelierReservationPersistenceState;
  readonly durable: boolean;
}

export interface AtelierTurnCapsuleUnsigned {
  readonly schemaVersion: typeof ATELIER_TURN_CAPSULE_SCHEMA_VERSION;
  readonly reservationId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly idempotencyKeyDigest: string;
  readonly request: AtelierPersistedAskRequest;
  readonly providerPrompt: string;
  readonly providerPromptSha256: string;
  readonly response: AtelierAskResponse;
  readonly requestDigest: string;
  readonly contextDigest: string;
  readonly responseDigest: string;
  readonly receiptId: string;
  readonly sequence: number;
  readonly priorCapsuleDigest: string | null;
  readonly committedAt: string;
  readonly expiresAt: string;
  readonly persistenceState: AtelierCapsulePersistenceState;
  readonly durable: boolean;
}

export interface AtelierTurnCapsule extends AtelierTurnCapsuleUnsigned {
  readonly capsuleDigest: string;
}

export interface AtelierTurnCapsuleInput {
  readonly reservationId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly idempotencyKeyDigest: string;
  readonly request: AtelierPersistedAskRequest;
  readonly providerPrompt: string;
  readonly response: AtelierAskResponse;
  readonly requestDigest: string;
  readonly contextDigest: string;
  readonly receiptId: string;
  readonly sequence: number;
  readonly priorCapsuleDigest: string | null;
  readonly committedAt: string;
  readonly expiresAt: string;
  readonly persistenceState: AtelierCapsulePersistenceState;
  readonly durable: boolean;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function assertIdentifier(name: string, value: string, maximumLength = 256): void {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > maximumLength ||
    value.trim() !== value
  ) {
    throw new AtelierInvalidStateInputError(
      `${name} must be a non-empty, trimmed string of at most ${maximumLength} characters.`,
      { field: name },
    );
  }
}

function assertDigest(name: string, value: string | null): void {
  if (value !== null && !SHA256_PATTERN.test(value)) {
    throw new AtelierInvalidStateInputError(`${name} must be a lower-case SHA-256 hex digest.`, {
      field: name,
    });
  }
}

function parseTimestamp(name: string, value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new AtelierInvalidStateInputError(`${name} must be an ISO-8601 timestamp.`, {
      field: name,
    });
  }
  return parsed;
}

function assertResponse(response: AtelierAskResponse): void {
  if (
    typeof response.answer !== 'string' ||
    typeof response.disclosure !== 'string' ||
    response.receipt === null ||
    typeof response.receipt !== 'object'
  ) {
    throw new AtelierInvalidStateInputError('response must be a complete AtelierAskResponse.', {
      field: 'response',
    });
  }
}

function capsuleDigestMaterial(capsule: AtelierTurnCapsuleUnsigned): AtelierTurnCapsuleUnsigned {
  return { ...capsule, response: responseDigestMaterial(capsule.response) };
}

export function createAtelierTurnCapsule(input: AtelierTurnCapsuleInput): AtelierTurnCapsule {
  assertIdentifier('reservationId', input.reservationId);
  assertIdentifier('tenantId', input.tenantId, 128);
  assertIdentifier('sessionId', input.sessionId, 128);
  assertIdentifier('receiptId', input.receiptId);
  assertIdentifier('providerPrompt', input.providerPrompt, 400_000);
  assertDigest('idempotencyKeyDigest', input.idempotencyKeyDigest);
  assertDigest('requestDigest', input.requestDigest);
  assertDigest('contextDigest', input.contextDigest);
  assertDigest('priorCapsuleDigest', input.priorCapsuleDigest);
  if (!Number.isSafeInteger(input.sequence) || input.sequence < 1) {
    throw new AtelierInvalidStateInputError('sequence must be a positive safe integer.', {
      field: 'sequence',
    });
  }
  const committedAt = parseTimestamp('committedAt', input.committedAt);
  const expiresAt = parseTimestamp('expiresAt', input.expiresAt);
  if (expiresAt <= committedAt || expiresAt - committedAt > ATELIER_STATE_RETENTION_MS) {
    throw new AtelierInvalidStateInputError(
      `expiresAt must be after committedAt and no more than ${ATELIER_STATE_RETENTION_HOURS} hours later.`,
      { field: 'expiresAt' },
    );
  }

  const request = deepFreeze(canonicalClone(input.request));
  if (createAtelierRequestDigest(request) !== input.requestDigest) {
    throw new AtelierCapsuleIntegrityError(
      'requestDigest does not match the canonical persisted request.',
    );
  }
  const providerPromptSha256 = sha256Text(input.providerPrompt);
  assertResponse(input.response);
  const response = canonicalClone<AtelierAskResponse>({
    ...input.response,
    receipt: {
      ...input.response.receipt,
      sessionId: input.sessionId,
      promptSha256: sha256Text(request.prompt),
      providerPromptSha256,
      schemaVersion: ATELIER_RECEIPT_SCHEMA_VERSION,
      idempotencyKeyDigest: input.idempotencyKeyDigest,
      requestDigest: input.requestDigest,
      contextDigest: input.contextDigest,
      capsuleDigest: null,
      sequence: input.sequence,
      priorCapsuleDigest: input.priorCapsuleDigest,
      persistenceState: input.persistenceState,
      stateRetentionExpiresAt: input.expiresAt,
      stateDurable: input.durable,
      memoryState: input.durable ? 'COMMITTED_ENCRYPTED_LOCAL' : 'COMMITTED_IN_PROCESS',
    },
  });
  const responseDigest = createAtelierResponseDigest(response);
  const unsigned: AtelierTurnCapsuleUnsigned = {
    schemaVersion: ATELIER_TURN_CAPSULE_SCHEMA_VERSION,
    reservationId: input.reservationId,
    tenantId: input.tenantId,
    sessionId: input.sessionId,
    idempotencyKeyDigest: input.idempotencyKeyDigest,
    request,
    providerPrompt: input.providerPrompt,
    providerPromptSha256,
    response,
    requestDigest: input.requestDigest,
    contextDigest: input.contextDigest,
    responseDigest,
    receiptId: input.receiptId,
    sequence: input.sequence,
    priorCapsuleDigest: input.priorCapsuleDigest,
    committedAt: input.committedAt,
    expiresAt: input.expiresAt,
    persistenceState: input.persistenceState,
    durable: input.durable,
  };
  const capsuleDigest = createAtelierCanonicalDigest(capsuleDigestMaterial(unsigned));
  const finalizedResponse: AtelierAskResponse = {
    ...response,
    receipt: { ...response.receipt, capsuleDigest },
  };
  const finalized: AtelierTurnCapsule = {
    ...unsigned,
    response: finalizedResponse,
    capsuleDigest,
  };

  // Recompute after receipt finalization; capsuleDigest is normalized to null in both
  // response and capsule digest material, avoiding a self-referential hash.
  const finalResponseDigest = createAtelierResponseDigest(finalizedResponse);
  if (finalResponseDigest !== responseDigest) {
    throw new AtelierCapsuleIntegrityError(
      'Receipt finalization changed response material outside capsuleDigest.',
    );
  }
  return deepFreeze(finalized);
}

export type AtelierCapsuleVerification =
  | { readonly valid: true; readonly capsuleDigest: string }
  | {
      readonly valid: false;
      readonly code: 'ATELIER_CAPSULE_INTEGRITY';
      readonly message: string;
      readonly index?: number;
      readonly expected?: string | number | null;
      readonly actual?: string | number | null;
    };

type AtelierCapsuleFailure = Exclude<AtelierCapsuleVerification, { readonly valid: true }>;

function invalidCapsule(
  message: string,
  expected?: string | number | null,
  actual?: string | number | null,
): AtelierCapsuleFailure {
  return {
    valid: false,
    code: 'ATELIER_CAPSULE_INTEGRITY',
    message,
    ...(expected !== undefined ? { expected } : {}),
    ...(actual !== undefined ? { actual } : {}),
  };
}

export function verifyAtelierTurnCapsule(capsule: AtelierTurnCapsule): AtelierCapsuleVerification {
  try {
    assertDigest('capsuleDigest', capsule.capsuleDigest);
    assertDigest('idempotencyKeyDigest', capsule.idempotencyKeyDigest);
    assertDigest('requestDigest', capsule.requestDigest);
    assertDigest('contextDigest', capsule.contextDigest);
    assertDigest('responseDigest', capsule.responseDigest);
    assertDigest('priorCapsuleDigest', capsule.priorCapsuleDigest);
    if (capsule.schemaVersion !== ATELIER_TURN_CAPSULE_SCHEMA_VERSION) {
      return invalidCapsule('The capsule schema version is unsupported.');
    }
    if (createAtelierRequestDigest(capsule.request) !== capsule.requestDigest) {
      return invalidCapsule('The request digest does not match the persisted request.');
    }
    if (createAtelierResponseDigest(capsule.response) !== capsule.responseDigest) {
      return invalidCapsule('The response digest does not match the persisted response.');
    }
    if (sha256Text(capsule.request.prompt) !== capsule.response.receipt.promptSha256) {
      return invalidCapsule('The receipt prompt digest does not match the persisted prompt.');
    }
    if (
      sha256Text(capsule.providerPrompt) !== capsule.providerPromptSha256 ||
      capsule.response.receipt.providerPromptSha256 !== capsule.providerPromptSha256
    ) {
      return invalidCapsule('The provider prompt digest does not match its persisted input.');
    }
    if (sha256Text(capsule.response.answer) !== capsule.response.receipt.responseSha256) {
      return invalidCapsule('The receipt response digest does not match the persisted answer.');
    }
    const receipt = capsule.response.receipt;
    if (
      receipt.receiptId !== capsule.receiptId ||
      receipt.sessionId !== capsule.sessionId ||
      receipt.schemaVersion !== ATELIER_RECEIPT_SCHEMA_VERSION ||
      receipt.idempotencyKeyDigest !== capsule.idempotencyKeyDigest ||
      receipt.requestDigest !== capsule.requestDigest ||
      receipt.contextDigest !== capsule.contextDigest ||
      receipt.capsuleDigest !== capsule.capsuleDigest ||
      receipt.sequence !== capsule.sequence ||
      receipt.priorCapsuleDigest !== capsule.priorCapsuleDigest ||
      receipt.persistenceState !== capsule.persistenceState ||
      receipt.stateRetentionExpiresAt !== capsule.expiresAt ||
      receipt.stateDurable !== capsule.durable
    ) {
      return invalidCapsule('The response receipt is not bound to its capsule.');
    }
    const { capsuleDigest, ...unsigned } = capsule;
    const calculated = createAtelierCanonicalDigest(capsuleDigestMaterial(unsigned));
    if (capsuleDigest !== calculated) {
      return invalidCapsule(
        'The capsule digest does not match its canonical content.',
        calculated,
        capsuleDigest,
      );
    }
    return { valid: true, capsuleDigest: calculated };
  } catch (error) {
    return invalidCapsule(error instanceof Error ? error.message : 'The capsule is invalid.');
  }
}

export function capsuleConversationTurns(
  capsule: AtelierTurnCapsule,
): readonly AtelierConversationTurn[] {
  return [
    {
      role: 'user',
      content: capsule.request.prompt,
      sequence: capsule.sequence,
      capsuleDigest: capsule.capsuleDigest,
      createdAt: capsule.committedAt,
    },
    {
      role: 'assistant',
      content: capsule.response.answer,
      sequence: capsule.sequence,
      capsuleDigest: capsule.capsuleDigest,
      createdAt: capsule.committedAt,
    },
  ];
}

export function verifyAtelierCapsuleChain(
  capsules: readonly AtelierTurnCapsule[],
): AtelierCapsuleVerification {
  let priorDigest: string | null = null;
  let priorSequence = 0;
  let tenantId: string | undefined;
  let sessionId: string | undefined;
  const turns: AtelierConversationTurn[] = [];

  for (const [index, capsule] of capsules.entries()) {
    const integrity = verifyAtelierTurnCapsule(capsule);
    if (!integrity.valid) return { ...integrity, index };
    if (tenantId !== undefined && capsule.tenantId !== tenantId) {
      return {
        ...invalidCapsule(
          'A capsule chain cannot cross tenant boundaries.',
          tenantId,
          capsule.tenantId,
        ),
        index,
      };
    }
    if (sessionId !== undefined && capsule.sessionId !== sessionId) {
      return {
        ...invalidCapsule(
          'A capsule chain cannot cross session boundaries.',
          sessionId,
          capsule.sessionId,
        ),
        index,
      };
    }
    if (capsule.sequence !== priorSequence + 1) {
      return {
        ...invalidCapsule(
          'The capsule sequence is not contiguous.',
          priorSequence + 1,
          capsule.sequence,
        ),
        index,
      };
    }
    if (capsule.priorCapsuleDigest !== priorDigest) {
      return {
        ...invalidCapsule(
          'The capsule prior digest does not match the chain head.',
          priorDigest,
          capsule.priorCapsuleDigest,
        ),
        index,
      };
    }
    const expectedContextDigest = createAtelierContextDigest(turns);
    if (capsule.contextDigest !== expectedContextDigest) {
      return {
        ...invalidCapsule(
          'The context digest does not match preceding conversation turns.',
          expectedContextDigest,
          capsule.contextDigest,
        ),
        index,
      };
    }
    tenantId = capsule.tenantId;
    sessionId = capsule.sessionId;
    priorSequence = capsule.sequence;
    priorDigest = capsule.capsuleDigest;
    turns.push(...capsuleConversationTurns(capsule));
  }

  return {
    valid: true,
    capsuleDigest: priorDigest ?? createAtelierCanonicalDigest([]),
  };
}

export function assertAtelierCapsuleChain(capsules: readonly AtelierTurnCapsule[]): void {
  const result = verifyAtelierCapsuleChain(capsules);
  if (!result.valid) throw new AtelierCapsuleIntegrityError(result.message, result);
}

export interface AtelierReserveTurnInput {
  readonly tenantId: string;
  readonly sessionId: string;
  readonly idempotencyKey: string;
  readonly request: unknown;
}

export type AtelierReservationOutcome =
  | {
      readonly status: 'reserved';
      readonly reservation: AtelierTurnReservation;
    }
  | {
      readonly status: 'replay';
      readonly capsule: AtelierTurnCapsule;
      readonly response: AtelierAskResponse;
    }
  | {
      readonly status: 'pending';
      readonly code: 'ATELIER_IDEMPOTENCY_PENDING' | 'ATELIER_SESSION_BUSY';
      readonly reason: 'IDEMPOTENCY_KEY' | 'SESSION_BUSY' | 'PENDING_RECOVERY';
      readonly reservation: AtelierTurnReservation;
    }
  | {
      readonly status: 'divergent';
      readonly code: 'ATELIER_IDEMPOTENCY_DIVERGENT';
      readonly idempotencyKeyDigest: string;
      readonly existingRequestDigest: string;
      readonly receivedRequestDigest: string;
    };

export interface AtelierReservationIdentity {
  readonly tenantId: string;
  readonly sessionId: string;
  readonly reservationId: string;
}

export interface AtelierStageTurnResponseInput extends AtelierReservationIdentity {
  readonly providerPrompt: string;
  readonly response: AtelierAskResponse;
}

export type AtelierReleaseReason =
  | 'VALIDATION_FAILED'
  | 'POLICY_DENIED'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_FAILED_BEFORE_RESPONSE';

export interface AtelierReleaseTurnInput extends AtelierReservationIdentity {
  readonly reason: AtelierReleaseReason;
}

export type AtelierCommitTurnInput = AtelierReservationIdentity;

export type AtelierMarkPendingRecoveryInput = AtelierStageTurnResponseInput;

export interface AtelierGetTurnInput {
  readonly tenantId: string;
  readonly sessionId: string;
  readonly idempotencyKey: string;
}

export interface AtelierSessionSnapshot {
  readonly tenantId: string;
  readonly sessionId: string;
  readonly capsules: readonly AtelierTurnCapsule[];
  readonly turns: readonly AtelierConversationTurn[];
  readonly persistence: AtelierStatePersistenceMetadata;
  /** This in-process implementation expires the whole chain by this time. */
  readonly expiresAt: string | null;
}

export interface AtelierPruneResult {
  readonly sessions: number;
  readonly reservations: number;
  readonly capsules: number;
}

export interface AtelierStateStore {
  readonly persistence: AtelierStatePersistenceMetadata;
  ready(): Promise<void>;
  reserveTurn(input: AtelierReserveTurnInput): Promise<AtelierReservationOutcome>;
  stageTurnResponse(input: AtelierStageTurnResponseInput): Promise<AtelierTurnReservation>;
  markTurnPendingRecovery(input: AtelierMarkPendingRecoveryInput): Promise<AtelierTurnReservation>;
  releaseTurn(input: AtelierReleaseTurnInput): Promise<boolean>;
  commitTurn(input: AtelierCommitTurnInput): Promise<AtelierTurnCapsule>;
  getTurn(input: AtelierGetTurnInput): Promise<AtelierTurnCapsule | null>;
  getSession(tenantId: string, sessionId: string): Promise<AtelierSessionSnapshot | null>;
  pruneExpired(): Promise<AtelierPruneResult>;
}

type IdempotencyRecord =
  | { readonly status: 'pending'; readonly reservationId: string }
  | { readonly status: 'committed'; readonly capsuleDigest: string };

interface SessionRecord {
  readonly tenantId: string;
  readonly sessionId: string;
  readonly capsules: AtelierTurnCapsule[];
  readonly reservations: Map<string, AtelierTurnReservation>;
  readonly idempotency: Map<string, IdempotencyRecord>;
  lastSequence: number;
  lastCapsuleDigest: string | null;
}

export interface InMemoryAtelierStateStoreOptions {
  readonly now?: () => Date;
  readonly randomId?: () => string;
}

export class InMemoryAtelierStateStore implements AtelierStateStore {
  readonly persistence: AtelierStatePersistenceMetadata = Object.freeze({
    backend: 'memory',
    persistenceState: ATELIER_IN_PROCESS_PERSISTENCE_STATE,
    durable: false,
    encryptionState: 'NONE',
    evidenceState: 'OBSERVED',
    retentionHours: ATELIER_STATE_RETENTION_HOURS,
    retentionMs: ATELIER_STATE_RETENTION_MS,
  });

  private readonly sessions = new Map<string, SessionRecord>();
  private readonly now: () => Date;
  private readonly randomId: () => string;
  private lockTail: Promise<void> = Promise.resolve();

  constructor(options: InMemoryAtelierStateStoreOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.randomId = options.randomId ?? randomUUID;
  }

  ready(): Promise<void> {
    return Promise.resolve();
  }

  reserveTurn(input: AtelierReserveTurnInput): Promise<AtelierReservationOutcome> {
    return this.withLock(() => {
      assertIdentifier('tenantId', input.tenantId, 128);
      assertIdentifier('sessionId', input.sessionId, 128);
      const idempotencyKeyDigest = createAtelierIdempotencyKeyDigest(input.idempotencyKey);
      const parsed = AtelierAskRequestSchema.parse(input.request);
      if (parsed.idempotencyKey !== undefined && parsed.idempotencyKey !== input.idempotencyKey) {
        throw new AtelierInvalidStateInputError(
          'The request idempotencyKey does not match the reservation key.',
          { field: 'idempotencyKey' },
        );
      }
      const { idempotencyKey: _discarded, ...requestWithoutKey } = parsed;
      const request = deepFreeze(canonicalClone(requestWithoutKey as AtelierPersistedAskRequest));
      const requestDigest = createAtelierRequestDigest(request);
      const now = this.currentTime();
      this.pruneExpiredLocked(now.milliseconds);
      const session = this.getOrCreateSession(input.tenantId, input.sessionId);
      const contextDigest = createAtelierContextDigest(
        session.capsules.flatMap(capsuleConversationTurns),
      );
      const existing = session.idempotency.get(idempotencyKeyDigest);
      if (existing !== undefined) {
        const existingTurn =
          existing.status === 'pending'
            ? session.reservations.get(existing.reservationId)
            : session.capsules.find((capsule) => capsule.capsuleDigest === existing.capsuleDigest);
        if (existingTurn === undefined) {
          session.idempotency.delete(idempotencyKeyDigest);
        } else if (existingTurn.requestDigest !== requestDigest) {
          return {
            status: 'divergent',
            code: 'ATELIER_IDEMPOTENCY_DIVERGENT',
            idempotencyKeyDigest,
            existingRequestDigest: existingTurn.requestDigest,
            receivedRequestDigest: requestDigest,
          };
        } else if (existing.status === 'pending') {
          const reservation = existingTurn as AtelierTurnReservation;
          return {
            status: 'pending',
            code: 'ATELIER_IDEMPOTENCY_PENDING',
            reason:
              reservation.persistenceState === 'PENDING_RECOVERY'
                ? 'PENDING_RECOVERY'
                : 'IDEMPOTENCY_KEY',
            reservation,
          };
        } else {
          const capsule = existingTurn as AtelierTurnCapsule;
          return { status: 'replay', capsule, response: capsule.response };
        }
      }

      const activeReservation = session.reservations.values().next().value as
        | AtelierTurnReservation
        | undefined;
      if (activeReservation !== undefined) {
        return {
          status: 'pending',
          code: 'ATELIER_SESSION_BUSY',
          reason:
            activeReservation.persistenceState === 'PENDING_RECOVERY'
              ? 'PENDING_RECOVERY'
              : 'SESSION_BUSY',
          reservation: activeReservation,
        };
      }

      const reservation: AtelierTurnReservation = deepFreeze({
        schemaVersion: ATELIER_TURN_CAPSULE_SCHEMA_VERSION,
        reservationId: `atelier_res_${this.randomId()}`,
        tenantId: input.tenantId,
        sessionId: input.sessionId,
        idempotencyKeyDigest,
        request,
        requestDigest,
        contextDigest,
        sequence: session.lastSequence + 1,
        priorCapsuleDigest: session.lastCapsuleDigest,
        reservedAt: now.iso,
        expiresAt: new Date(now.milliseconds + ATELIER_STATE_RETENTION_MS).toISOString(),
        persistenceState: 'RESERVED_IN_PROCESS_NON_DURABLE',
        durable: false,
      });
      session.reservations.set(reservation.reservationId, reservation);
      session.idempotency.set(idempotencyKeyDigest, {
        status: 'pending',
        reservationId: reservation.reservationId,
      });
      return { status: 'reserved', reservation };
    });
  }

  stageTurnResponse(input: AtelierStageTurnResponseInput): Promise<AtelierTurnReservation> {
    return this.withLock(() =>
      this.stageTurnResponseLocked(input, 'RESPONSE_STAGED_IN_PROCESS_NON_DURABLE'),
    );
  }

  markTurnPendingRecovery(input: AtelierMarkPendingRecoveryInput): Promise<AtelierTurnReservation> {
    return this.withLock(() => this.stageTurnResponseLocked(input, 'PENDING_RECOVERY'));
  }

  releaseTurn(input: AtelierReleaseTurnInput): Promise<boolean> {
    return this.withLock(() => {
      const reservation = this.requireReservationLocked(input);
      if (reservation.stagedResponse !== undefined) {
        throw new AtelierAmbiguousProviderCompletionError(input.reservationId);
      }
      const session = this.sessions.get(this.sessionKey(input.tenantId, input.sessionId));
      if (session === undefined) return false;
      this.removeReservation(session, reservation);
      this.deleteSessionIfEmpty(session);
      return true;
    });
  }

  commitTurn(input: AtelierCommitTurnInput): Promise<AtelierTurnCapsule> {
    return this.withLock(() => {
      assertIdentifier('tenantId', input.tenantId, 128);
      assertIdentifier('sessionId', input.sessionId, 128);
      assertIdentifier('reservationId', input.reservationId);
      const now = this.currentTime();
      const sessionKey = this.sessionKey(input.tenantId, input.sessionId);
      const prePruneSession = this.sessions.get(sessionKey);
      const prePruneReservation = prePruneSession?.reservations.get(input.reservationId);
      if (
        prePruneSession !== undefined &&
        prePruneReservation !== undefined &&
        Date.parse(prePruneReservation.expiresAt) <= now.milliseconds
      ) {
        this.removeReservation(prePruneSession, prePruneReservation);
        this.deleteSessionIfEmpty(prePruneSession);
        throw new AtelierReservationExpiredError(
          prePruneReservation.reservationId,
          prePruneReservation.expiresAt,
        );
      }
      this.pruneExpiredLocked(now.milliseconds);
      const session = this.sessions.get(sessionKey);
      const reservation = session?.reservations.get(input.reservationId);
      if (session === undefined || reservation === undefined) {
        if (this.findReservation(input.reservationId) !== undefined) {
          throw new AtelierReservationMismatchError(input.reservationId);
        }
        throw new AtelierReservationNotFoundError(input.reservationId);
      }
      if (reservation.stagedResponse === undefined || reservation.providerPrompt === undefined) {
        throw new AtelierInvalidStateInputError(
          'A provider response must be staged before the turn can be committed.',
          { reservationId: input.reservationId },
        );
      }
      if (
        reservation.sequence !== session.lastSequence + 1 ||
        reservation.priorCapsuleDigest !== session.lastCapsuleDigest
      ) {
        session.reservations.set(reservation.reservationId, this.pendingRecovery(reservation));
        throw new AtelierSequenceConflictError({
          reservationId: reservation.reservationId,
          reservedSequence: reservation.sequence,
          currentSequence: session.lastSequence,
          reservedPriorCapsuleDigest: reservation.priorCapsuleDigest,
          currentCapsuleDigest: session.lastCapsuleDigest,
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
          session.capsules[0]?.expiresAt ??
          new Date(now.milliseconds + ATELIER_STATE_RETENTION_MS).toISOString(),
        persistenceState: 'COMMITTED_IN_PROCESS_NON_DURABLE',
        durable: false,
      });
      session.reservations.delete(reservation.reservationId);
      session.idempotency.set(reservation.idempotencyKeyDigest, {
        status: 'committed',
        capsuleDigest: capsule.capsuleDigest,
      });
      session.capsules.push(capsule);
      session.lastSequence = capsule.sequence;
      session.lastCapsuleDigest = capsule.capsuleDigest;
      return capsule;
    });
  }

  getTurn(input: AtelierGetTurnInput): Promise<AtelierTurnCapsule | null> {
    return this.withLock(() => {
      assertIdentifier('tenantId', input.tenantId, 128);
      assertIdentifier('sessionId', input.sessionId, 128);
      const idempotencyKeyDigest = createAtelierIdempotencyKeyDigest(input.idempotencyKey);
      this.pruneExpiredLocked(this.currentTime().milliseconds);
      const session = this.sessions.get(this.sessionKey(input.tenantId, input.sessionId));
      const record = session?.idempotency.get(idempotencyKeyDigest);
      if (record?.status !== 'committed') return null;
      return (
        session?.capsules.find((capsule) => capsule.capsuleDigest === record.capsuleDigest) ?? null
      );
    });
  }

  getSession(tenantId: string, sessionId: string): Promise<AtelierSessionSnapshot | null> {
    return this.withLock(() => {
      assertIdentifier('tenantId', tenantId, 128);
      assertIdentifier('sessionId', sessionId, 128);
      this.pruneExpiredLocked(this.currentTime().milliseconds);
      const session = this.sessions.get(this.sessionKey(tenantId, sessionId));
      if (session === undefined) return null;
      const capsules = Object.freeze([...session.capsules]);
      const turns = Object.freeze(capsules.flatMap(capsuleConversationTurns));
      const expiresAt =
        capsules[0]?.expiresAt ?? session.reservations.values().next().value?.expiresAt ?? null;
      return Object.freeze({
        tenantId,
        sessionId,
        capsules,
        turns,
        persistence: this.persistence,
        expiresAt,
      });
    });
  }

  pruneExpired(): Promise<AtelierPruneResult> {
    return this.withLock(() => this.pruneExpiredLocked(this.currentTime().milliseconds));
  }

  private withLock<T>(operation: () => T | Promise<T>): Promise<T> {
    const run = this.lockTail.then(operation, operation);
    this.lockTail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private currentTime(): { milliseconds: number; iso: string } {
    const date = this.now();
    const milliseconds = date.getTime();
    if (!Number.isFinite(milliseconds)) {
      throw new AtelierInvalidStateInputError('The injected clock returned an invalid date.');
    }
    return { milliseconds, iso: date.toISOString() };
  }

  private requireReservationLocked(input: AtelierReservationIdentity): AtelierTurnReservation {
    assertIdentifier('tenantId', input.tenantId, 128);
    assertIdentifier('sessionId', input.sessionId, 128);
    assertIdentifier('reservationId', input.reservationId);
    const now = this.currentTime();
    const sessionKey = this.sessionKey(input.tenantId, input.sessionId);
    const prePruneSession = this.sessions.get(sessionKey);
    const prePruneReservation = prePruneSession?.reservations.get(input.reservationId);
    if (
      prePruneSession !== undefined &&
      prePruneReservation !== undefined &&
      Date.parse(prePruneReservation.expiresAt) <= now.milliseconds
    ) {
      this.removeReservation(prePruneSession, prePruneReservation);
      this.deleteSessionIfEmpty(prePruneSession);
      throw new AtelierReservationExpiredError(
        prePruneReservation.reservationId,
        prePruneReservation.expiresAt,
      );
    }
    this.pruneExpiredLocked(now.milliseconds);
    const reservation = this.sessions.get(sessionKey)?.reservations.get(input.reservationId);
    if (reservation !== undefined) return reservation;
    if (this.findReservation(input.reservationId) !== undefined) {
      throw new AtelierReservationMismatchError(input.reservationId);
    }
    throw new AtelierReservationNotFoundError(input.reservationId);
  }

  private stageTurnResponseLocked(
    input: AtelierStageTurnResponseInput,
    persistenceState: 'RESPONSE_STAGED_IN_PROCESS_NON_DURABLE' | 'PENDING_RECOVERY',
  ): AtelierTurnReservation {
    assertIdentifier('providerPrompt', input.providerPrompt, 400_000);
    assertResponse(input.response);
    const reservation = this.requireReservationLocked(input);
    const session = this.sessions.get(this.sessionKey(input.tenantId, input.sessionId));
    if (session === undefined) throw new AtelierReservationNotFoundError(input.reservationId);
    const providerPrompt = input.providerPrompt;
    const stagedResponse = deepFreeze(canonicalClone(input.response));
    if (
      reservation.stagedResponse !== undefined &&
      (reservation.providerPrompt !== providerPrompt ||
        createAtelierResponseDigest(reservation.stagedResponse) !==
          createAtelierResponseDigest(stagedResponse))
    ) {
      throw new AtelierAmbiguousProviderCompletionError(input.reservationId);
    }
    const staged = deepFreeze({
      ...reservation,
      providerPrompt,
      stagedResponse,
      persistenceState,
    });
    session.reservations.set(reservation.reservationId, staged);
    return staged;
  }

  private pendingRecovery(reservation: AtelierTurnReservation): AtelierTurnReservation {
    return deepFreeze({ ...reservation, persistenceState: 'PENDING_RECOVERY' });
  }

  private sessionKey(tenantId: string, sessionId: string): string {
    return JSON.stringify([tenantId, sessionId]);
  }

  private getOrCreateSession(tenantId: string, sessionId: string): SessionRecord {
    const key = this.sessionKey(tenantId, sessionId);
    const existing = this.sessions.get(key);
    if (existing !== undefined) return existing;
    const session: SessionRecord = {
      tenantId,
      sessionId,
      capsules: [],
      reservations: new Map(),
      idempotency: new Map(),
      lastSequence: 0,
      lastCapsuleDigest: null,
    };
    this.sessions.set(key, session);
    return session;
  }

  private removeReservation(session: SessionRecord, reservation: AtelierTurnReservation): void {
    session.reservations.delete(reservation.reservationId);
    const idempotency = session.idempotency.get(reservation.idempotencyKeyDigest);
    if (
      idempotency?.status === 'pending' &&
      idempotency.reservationId === reservation.reservationId
    ) {
      session.idempotency.delete(reservation.idempotencyKeyDigest);
    }
  }

  private findReservation(reservationId: string): AtelierTurnReservation | undefined {
    for (const session of this.sessions.values()) {
      const reservation = session.reservations.get(reservationId);
      if (reservation !== undefined) return reservation;
    }
    return undefined;
  }

  private deleteSessionIfEmpty(session: SessionRecord): void {
    if (session.capsules.length === 0 && session.reservations.size === 0) {
      this.sessions.delete(this.sessionKey(session.tenantId, session.sessionId));
    }
  }

  private pruneExpiredLocked(now: number): AtelierPruneResult {
    let sessions = 0;
    let reservations = 0;
    let capsules = 0;
    for (const session of this.sessions.values()) {
      // Capsules form one verifiable chain. When its oldest retained content reaches
      // the 24-hour maximum, remove the entire chain instead of retaining an
      // unverifiable suffix or keeping any content beyond its declared boundary.
      if (session.capsules.some((capsule) => Date.parse(capsule.expiresAt) <= now)) {
        capsules += session.capsules.length;
        reservations += session.reservations.size;
        this.sessions.delete(this.sessionKey(session.tenantId, session.sessionId));
        sessions += 1;
        continue;
      }
      for (const reservation of session.reservations.values()) {
        if (Date.parse(reservation.expiresAt) <= now) {
          this.removeReservation(session, reservation);
          reservations += 1;
        }
      }
      if (session.capsules.length === 0 && session.reservations.size === 0) {
        this.sessions.delete(this.sessionKey(session.tenantId, session.sessionId));
        sessions += 1;
      }
    }
    return { sessions, reservations, capsules };
  }
}
