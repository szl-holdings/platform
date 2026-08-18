import { createHmac, randomUUID } from 'node:crypto';
import { link, lstat, mkdir, open, readFile, realpath, rm } from 'node:fs/promises';
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
import { canonicalJson, digestObject, sha256Hex } from './canonical.js';
import {
  assertMasterKey,
  constantTimeEqualHex,
  decryptEnvelope,
  encryptEnvelope,
  type EncryptedEnvelope,
} from './crypto.js';
import { StateNativeError, assertStateNative } from './errors.js';
import type { PortableStateObject, StateCapsule, StateTransportAdapter } from './types.js';

const RECORD_SCHEMA = 'szl.encrypted-portable-state/v1' as const;
const DELETION_SCHEMA = 'szl.state-transport-deletion/v1' as const;
const ID_PATTERN = /^state_([0-9a-f]{64})$/;
const DEFAULT_MAX_PAYLOAD_BYTES = 512 * 1024 * 1024;
const RECORD_OVERHEAD_BYTES = 1024 * 1024;
const UNSUPPORTED_DIRECTORY_SYNC = new Set(['EBADF', 'EISDIR', 'EINVAL', 'ENOSYS', 'ENOTSUP', 'EPERM']);

interface EncryptedPortableStateRecord {
  readonly schema: typeof RECORD_SCHEMA;
  readonly capsule: StateCapsule;
  readonly envelope: EncryptedEnvelope;
  readonly recordDigest: string;
}

export interface StateTransportDeletionReceipt {
  readonly schema: typeof DELETION_SCHEMA;
  readonly capsuleId: string;
  readonly adapter: string;
  readonly deletedAt: string;
  readonly priorRecordDigest: string;
  readonly deletionDigest: string;
  readonly authenticationTag: string;
}

export interface FileSystemStateTransportInspection {
  readonly capsuleId: string;
  readonly state: 'ACTIVE' | 'DELETED' | 'MISSING';
  readonly recordDigest?: string;
  readonly deletionReceipt?: StateTransportDeletionReceipt;
}

export interface FileSystemStateTransportAdapterConfig {
  readonly rootDirectory: string;
  readonly masterKey: Uint8Array;
  readonly name?: string;
  readonly maxPayloadBytes?: number;
  readonly fileMode?: number;
  readonly directoryMode?: number;
  readonly requireDirectorySync?: boolean;
  readonly clock?: () => Date;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function errorCode(error: unknown): string | undefined {
  return objectValue(error)?.code as string | undefined;
}

function capsuleDigest(capsuleId: string): string {
  const digest = ID_PATTERN.exec(capsuleId)?.[1];
  assertStateNative(
    digest !== undefined,
    'INVALID_INPUT',
    'Filesystem transport requires a canonical state_<sha256> capsule ID.',
    { capsuleId },
  );
  return digest;
}

function expectedCapsuleDigest(capsule: StateCapsule): string {
  return digestObject({
    schema: 'szl.state-capsule-identity/v1',
    tenantId: capsule.tenantId,
    sessionId: capsule.sessionId,
    stateType: capsule.stateType,
    portability: capsule.portability,
    contentDigest: capsule.contentDigest,
    compatibility: capsule.compatibility,
    governance: capsule.governance,
    provenance: capsule.provenance,
    expiresAt: capsule.expiresAt,
  });
}

function payloadAad(capsule: StateCapsule): string {
  return canonicalJson({ schema: RECORD_SCHEMA, capsule });
}

function assertPortableObject(object: PortableStateObject, maxPayloadBytes: number): void {
  const idDigest = capsuleDigest(object.capsule.capsuleId);
  assertStateNative(
    object.capsule.schema === 'szl.state-capsule/v1' &&
      constantTimeEqualHex(idDigest, expectedCapsuleDigest(object.capsule)),
    'SIGNATURE_INVALID',
    'State Capsule identity does not match its immutable metadata.',
    { capsuleId: object.capsule.capsuleId },
  );
  assertStateNative(
    object.capsule.revocationStatus === 'ACTIVE',
    'INVALID_TRANSITION',
    'Only ACTIVE State Capsules may enter the durable transport.',
    { capsuleId: object.capsule.capsuleId, state: object.capsule.revocationStatus },
  );
  assertStateNative(
    object.payload.byteLength <= maxPayloadBytes,
    'BUDGET_EXCEEDED',
    'Portable state exceeds the configured durable transport payload limit.',
    { byteLength: object.payload.byteLength, maxPayloadBytes },
  );
  assertStateNative(
    object.payload.byteLength === object.capsule.byteLength &&
      constantTimeEqualHex(sha256Hex(object.payload), object.capsule.contentDigest),
    'SIGNATURE_INVALID',
    'Portable state payload does not match its State Capsule.',
    { capsuleId: object.capsule.capsuleId },
  );
}

function parseJson(raw: string, label: string, capsuleId: string): Record<string, unknown> {
  try {
    const value = objectValue(JSON.parse(raw));
    assertStateNative(value, 'SIGNATURE_INVALID', `${label} is malformed.`, { capsuleId });
    return value;
  } catch (error) {
    if (error instanceof StateNativeError) throw error;
    throw new StateNativeError(
      'SIGNATURE_INVALID',
      `${label} is not valid JSON.`,
      { capsuleId },
      { cause: error },
    );
  }
}

function parseRecord(raw: string, capsuleId: string): EncryptedPortableStateRecord {
  const value = parseJson(raw, 'Durable state record', capsuleId);
  const capsule = objectValue(value.capsule) as unknown as StateCapsule | undefined;
  const envelope = objectValue(value.envelope) as unknown as EncryptedEnvelope | undefined;
  assertStateNative(
    value.schema === RECORD_SCHEMA &&
      typeof value.recordDigest === 'string' &&
      capsule?.schema === 'szl.state-capsule/v1' &&
      capsule.capsuleId === capsuleId &&
      envelope?.algorithm === 'AES-256-GCM' &&
      typeof envelope.ciphertext === 'string' &&
      typeof envelope.iv === 'string' &&
      typeof envelope.authTag === 'string' &&
      typeof envelope.wrappedKey === 'string' &&
      typeof envelope.wrapIv === 'string' &&
      typeof envelope.wrapAuthTag === 'string',
    'SIGNATURE_INVALID',
    'Durable state record is malformed.',
    { capsuleId },
  );
  assertStateNative(
    constantTimeEqualHex(capsuleDigest(capsuleId), expectedCapsuleDigest(capsule)),
    'SIGNATURE_INVALID',
    'Durable State Capsule identity is invalid.',
    { capsuleId },
  );
  const record = {
    schema: RECORD_SCHEMA,
    capsule,
    envelope,
    recordDigest: value.recordDigest,
  } satisfies EncryptedPortableStateRecord;
  const expected = digestObject({
    schema: RECORD_SCHEMA,
    capsule: record.capsule,
    envelope: record.envelope,
  });
  assertStateNative(
    constantTimeEqualHex(record.recordDigest, expected),
    'SIGNATURE_INVALID',
    'Durable state record digest is invalid.',
    { capsuleId },
  );
  return record;
}

function deletionAuthenticationTag(
  masterKey: Uint8Array,
  receipt: Omit<StateTransportDeletionReceipt, 'authenticationTag'>,
): string {
  return createHmac('sha256', masterKey)
    .update(
      canonicalJson({
        domain: 'szl.state-transport-deletion-auth/v1',
        receipt,
      }),
      'utf8',
    )
    .digest('hex');
}

function parseDeletionReceipt(
  raw: string,
  capsuleId: string,
  adapter: string,
  masterKey: Uint8Array,
): StateTransportDeletionReceipt {
  const value = parseJson(raw, 'Durable state deletion receipt', capsuleId);
  assertStateNative(
    value.schema === DELETION_SCHEMA &&
      value.capsuleId === capsuleId &&
      value.adapter === adapter &&
      typeof value.deletedAt === 'string' &&
      typeof value.priorRecordDigest === 'string' &&
      typeof value.deletionDigest === 'string' &&
      typeof value.authenticationTag === 'string',
    'SIGNATURE_INVALID',
    'Durable state deletion receipt is malformed.',
    { capsuleId },
  );
  const receipt = {
    schema: DELETION_SCHEMA,
    capsuleId,
    adapter,
    deletedAt: value.deletedAt,
    priorRecordDigest: value.priorRecordDigest,
    deletionDigest: value.deletionDigest,
    authenticationTag: value.authenticationTag,
  } satisfies StateTransportDeletionReceipt;
  const expected = digestObject({
    schema: DELETION_SCHEMA,
    capsuleId,
    adapter,
    deletedAt: receipt.deletedAt,
    priorRecordDigest: receipt.priorRecordDigest,
  });
  assertStateNative(
    constantTimeEqualHex(receipt.deletionDigest, expected),
    'SIGNATURE_INVALID',
    'Durable state deletion receipt digest is invalid.',
    { capsuleId },
  );
  const authenticated = {
    schema: receipt.schema,
    capsuleId: receipt.capsuleId,
    adapter: receipt.adapter,
    deletedAt: receipt.deletedAt,
    priorRecordDigest: receipt.priorRecordDigest,
    deletionDigest: receipt.deletionDigest,
  } satisfies Omit<StateTransportDeletionReceipt, 'authenticationTag'>;
  assertStateNative(
    constantTimeEqualHex(
      receipt.authenticationTag,
      deletionAuthenticationTag(masterKey, authenticated),
    ),
    'SIGNATURE_INVALID',
    'Durable state deletion receipt authentication failed.',
    { capsuleId },
  );
  return receipt;
}

export class FileSystemStateTransportAdapter implements StateTransportAdapter {
  public readonly name: string;
  #rootDirectory: string;
  readonly #masterKey: Buffer;
  readonly #maxPayloadBytes: number;
  readonly #maxRecordBytes: number;
  readonly #fileMode: number;
  readonly #directoryMode: number;
  readonly #requireDirectorySync: boolean;
  readonly #clock: () => Date;
  readonly #ready: Promise<void>;

  public constructor(config: FileSystemStateTransportAdapterConfig) {
    const name = config.name ?? 'encrypted-filesystem-transport';
    assertStateNative(name.trim(), 'INVALID_INPUT', 'Transport adapter name must not be empty.');
    assertStateNative(
      config.rootDirectory.trim(),
      'INVALID_INPUT',
      'Filesystem transport rootDirectory must not be empty.',
    );
    assertMasterKey(config.masterKey);
    const rootDirectory = resolve(config.rootDirectory);
    assertStateNative(
      rootDirectory !== parse(rootDirectory).root,
      'INVALID_INPUT',
      'Filesystem transport rootDirectory must not be a filesystem root.',
      { rootDirectory },
    );
    const maxPayloadBytes = config.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD_BYTES;
    assertStateNative(
      Number.isSafeInteger(maxPayloadBytes) && maxPayloadBytes > 0,
      'INVALID_INPUT',
      'maxPayloadBytes must be a positive safe integer.',
    );
    this.name = name;
    this.#rootDirectory = rootDirectory;
    this.#masterKey = Buffer.from(config.masterKey);
    this.#maxPayloadBytes = maxPayloadBytes;
    this.#maxRecordBytes = Math.ceil(maxPayloadBytes * 1.5) + RECORD_OVERHEAD_BYTES;
    this.#fileMode = config.fileMode ?? 0o600;
    this.#directoryMode = config.directoryMode ?? 0o700;
    this.#requireDirectorySync = config.requireDirectorySync ?? process.platform !== 'win32';
    this.#clock = config.clock ?? (() => new Date());
    this.#ready = this.#initialize();
  }

  public async put(object: PortableStateObject): Promise<void> {
    await this.#ready;
    assertPortableObject(object, this.#maxPayloadBytes);
    const capsuleId = object.capsule.capsuleId;
    if (await this.#readDeletionReceipt(capsuleId)) {
      throw new StateNativeError(
        'SHREDDED',
        'A durable deletion receipt prevents State Capsule resurrection.',
        { capsuleId },
      );
    }
    const existing = await this.#readObject(capsuleId);
    if (existing) {
      if (await this.#readDeletionReceipt(capsuleId)) {
        throw new StateNativeError(
          'SHREDDED',
          'A concurrent deletion prevented State Capsule persistence.',
          { capsuleId },
        );
      }
      this.#assertSameObject(existing, object);
      return;
    }
    const base = {
      schema: RECORD_SCHEMA,
      capsule: object.capsule,
      envelope: encryptEnvelope(this.#masterKey, object.payload, payloadAad(object.capsule)),
    } satisfies Omit<EncryptedPortableStateRecord, 'recordDigest'>;
    const record = { ...base, recordDigest: digestObject(base) };
    const created = await this.#atomicCreate(
      this.#objectPath(capsuleId),
      `${canonicalJson(record)}\n`,
    );
    if (!created) {
      const raced = await this.#readObject(capsuleId);
      assertStateNative(
        raced,
        'RECEIPT_WRITE_FAILED',
        'Concurrent durable state write could not be read back.',
        { capsuleId },
      );
      if (await this.#readDeletionReceipt(capsuleId)) {
        await this.#removeObjectFile(capsuleId);
        throw new StateNativeError(
          'SHREDDED',
          'A concurrent deletion prevented State Capsule persistence.',
          { capsuleId },
        );
      }
      this.#assertSameObject(raced, object);
      return;
    }
    if (await this.#readDeletionReceipt(capsuleId)) {
      await this.#removeObjectFile(capsuleId);
      throw new StateNativeError(
        'SHREDDED',
        'A concurrent deletion prevented State Capsule persistence.',
        { capsuleId },
      );
    }
    const persisted = await this.#readObject(capsuleId);
    assertStateNative(
      persisted,
      'RECEIPT_WRITE_FAILED',
      'Durable state write did not survive exact readback.',
      { capsuleId },
    );
    this.#assertSameObject(persisted, object);
  }

  public async get(capsuleId: string): Promise<PortableStateObject | undefined> {
    await this.#ready;
    capsuleDigest(capsuleId);
    if (await this.#readDeletionReceipt(capsuleId)) return undefined;
    const object = await this.#readObject(capsuleId);
    if (!object || (await this.#readDeletionReceipt(capsuleId))) return undefined;
    return object;
  }

  public async delete(capsuleId: string): Promise<void> {
    await this.#ready;
    capsuleDigest(capsuleId);
    if (await this.#readDeletionReceipt(capsuleId)) {
      await this.#removeObjectFile(capsuleId);
      return;
    }
    const record = await this.#readRecord(capsuleId);
    if (!record) return;
    const base = {
      schema: DELETION_SCHEMA,
      capsuleId,
      adapter: this.name,
      deletedAt: this.#clock().toISOString(),
      priorRecordDigest: record.recordDigest,
    } satisfies Omit<StateTransportDeletionReceipt, 'deletionDigest' | 'authenticationTag'>;
    const authenticated = {
      ...base,
      deletionDigest: digestObject(base),
    } satisfies Omit<StateTransportDeletionReceipt, 'authenticationTag'>;
    const receipt = {
      ...authenticated,
      authenticationTag: deletionAuthenticationTag(this.#masterKey, authenticated),
    } satisfies StateTransportDeletionReceipt;
    const created = await this.#atomicCreate(
      this.#tombstonePath(capsuleId),
      `${canonicalJson(receipt)}\n`,
    );
    if (!created) await this.#readDeletionReceipt(capsuleId);
    await this.#removeObjectFile(capsuleId);
  }

  public async getDeletionReceipt(
    capsuleId: string,
  ): Promise<StateTransportDeletionReceipt | undefined> {
    await this.#ready;
    capsuleDigest(capsuleId);
    return this.#readDeletionReceipt(capsuleId);
  }

  public async inspect(capsuleId: string): Promise<FileSystemStateTransportInspection> {
    await this.#ready;
    capsuleDigest(capsuleId);
    const deletionReceipt = await this.#readDeletionReceipt(capsuleId);
    if (deletionReceipt) return { capsuleId, state: 'DELETED', deletionReceipt };
    const record = await this.#readRecord(capsuleId);
    return record
      ? { capsuleId, state: 'ACTIVE', recordDigest: record.recordDigest }
      : { capsuleId, state: 'MISSING' };
  }

  async #initialize(): Promise<void> {
    await mkdir(this.#rootDirectory, { recursive: true, mode: this.#directoryMode });
    this.#rootDirectory = await realpath(this.#rootDirectory);
    await this.#ensureDirectory(join(this.#rootDirectory, 'objects'));
    await this.#ensureDirectory(join(this.#rootDirectory, 'tombstones'));
  }

  async #ensureDirectory(path: string): Promise<void> {
    const target = resolve(path);
    const relativePath = relative(this.#rootDirectory, target);
    assertStateNative(
      relativePath === '' ||
        (!isAbsolute(relativePath) && relativePath !== '..' && !relativePath.startsWith(`..${sep}`)),
      'INVALID_INPUT',
      'Filesystem transport directory escaped the configured root.',
      { path: target },
    );
    await mkdir(target, { recursive: true, mode: this.#directoryMode });

    let current = this.#rootDirectory;
    for (const component of relativePath.split(sep).filter(Boolean)) {
      current = join(current, component);
      const metadata = await lstat(current);
      assertStateNative(
        metadata.isDirectory() && !metadata.isSymbolicLink(),
        'INVALID_INPUT',
        'Filesystem transport path components must be real directories, not symbolic links.',
        { path: current },
      );
    }
    assertStateNative(
      (await realpath(target)) === target,
      'INVALID_INPUT',
      'Filesystem transport directory resolved through an unexpected link.',
      { path: target },
    );
  }

  #path(kind: 'objects' | 'tombstones', capsuleId: string): string {
    const digest = capsuleDigest(capsuleId);
    return join(
      this.#rootDirectory,
      kind,
      digest.slice(0, 2),
      digest.slice(2, 4),
      `${capsuleId}.json`,
    );
  }

  #objectPath(capsuleId: string): string {
    return this.#path('objects', capsuleId);
  }

  #tombstonePath(capsuleId: string): string {
    return this.#path('tombstones', capsuleId);
  }

  async #readBounded(path: string): Promise<string | undefined> {
    let metadata;
    try {
      metadata = await lstat(path);
    } catch (error) {
      if (errorCode(error) === 'ENOENT') return undefined;
      throw error;
    }
    assertStateNative(
      metadata.isFile() && !metadata.isSymbolicLink(),
      'SIGNATURE_INVALID',
      'Durable state paths must contain regular files, not links or special files.',
      { path },
    );
    assertStateNative(
      metadata.size <= this.#maxRecordBytes,
      'BUDGET_EXCEEDED',
      'Durable state record exceeds the configured read limit.',
      { path, size: metadata.size, maxRecordBytes: this.#maxRecordBytes },
    );
    return readFile(path, 'utf8');
  }

  async #readRecord(capsuleId: string): Promise<EncryptedPortableStateRecord | undefined> {
    const raw = await this.#readBounded(this.#objectPath(capsuleId));
    return raw === undefined ? undefined : parseRecord(raw, capsuleId);
  }

  async #readObject(capsuleId: string): Promise<PortableStateObject | undefined> {
    const record = await this.#readRecord(capsuleId);
    if (!record) return undefined;
    const payload = decryptEnvelope(this.#masterKey, record.envelope, payloadAad(record.capsule));
    assertStateNative(
      payload.byteLength === record.capsule.byteLength &&
        constantTimeEqualHex(sha256Hex(payload), record.capsule.contentDigest),
      'SIGNATURE_INVALID',
      'Durable state payload failed exact capsule verification.',
      { capsuleId },
    );
    return { capsule: record.capsule, payload: Uint8Array.from(payload) };
  }

  async #readDeletionReceipt(
    capsuleId: string,
  ): Promise<StateTransportDeletionReceipt | undefined> {
    const raw = await this.#readBounded(this.#tombstonePath(capsuleId));
    return raw === undefined
      ? undefined
      : parseDeletionReceipt(raw, capsuleId, this.name, this.#masterKey);
  }

  #assertSameObject(existing: PortableStateObject, candidate: PortableStateObject): void {
    assertStateNative(
      canonicalJson(existing.capsule) === canonicalJson(candidate.capsule) &&
        constantTimeEqualHex(sha256Hex(existing.payload), sha256Hex(candidate.payload)),
      'DIVERGENT_REPLAY',
      'Durable state path already contains different protected inputs.',
      { capsuleId: candidate.capsule.capsuleId },
    );
  }

  async #atomicCreate(path: string, content: string): Promise<boolean> {
    const directory = dirname(path);
    await this.#ensureDirectory(directory);
    const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
    let handle;
    let prepared = false;
    try {
      handle = await open(temporaryPath, 'wx', this.#fileMode);
      await handle.writeFile(content, 'utf8');
      await handle.sync();
      prepared = true;
    } catch (error) {
      throw new StateNativeError(
        'RECEIPT_WRITE_FAILED',
        'Failed to create the fsynced durable state candidate.',
        { path },
        { cause: error },
      );
    } finally {
      await handle?.close();
      if (!prepared) await rm(temporaryPath, { force: true });
    }
    try {
      await link(temporaryPath, path);
      await this.#syncDirectory(directory);
      return true;
    } catch (error) {
      if (errorCode(error) === 'EEXIST') return false;
      throw new StateNativeError(
        'RECEIPT_WRITE_FAILED',
        'Failed to atomically publish the durable state record.',
        { path },
        { cause: error },
      );
    } finally {
      await rm(temporaryPath, { force: true });
    }
  }

  async #removeObjectFile(capsuleId: string): Promise<void> {
    const path = this.#objectPath(capsuleId);
    let metadata;
    try {
      metadata = await lstat(path);
    } catch (error) {
      if (errorCode(error) === 'ENOENT') return;
      throw error;
    }
    assertStateNative(
      metadata.isFile() && !metadata.isSymbolicLink(),
      'SIGNATURE_INVALID',
      'Durable state object removal refused a link or special file.',
      { path },
    );
    await rm(path, { force: true });
    await this.#syncDirectory(dirname(path));
  }

  async #syncDirectory(path: string): Promise<void> {
    let handle;
    try {
      handle = await open(path, 'r');
      await handle.sync();
    } catch (error) {
      if (!this.#requireDirectorySync && UNSUPPORTED_DIRECTORY_SYNC.has(errorCode(error) ?? '')) {
        return;
      }
      throw new StateNativeError(
        'RECEIPT_WRITE_FAILED',
        'Filesystem directory synchronization failed.',
        { path },
        { cause: error },
      );
    } finally {
      await handle?.close();
    }
  }
}
