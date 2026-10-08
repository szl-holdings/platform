import { createHash, randomBytes } from 'node:crypto';
import { link, mkdtemp, open, readdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import type { AtelierAskResponse } from '@szl-holdings/a11oy-atelier';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AtelierContinuityConfigurationError,
  createEncryptedLocalAtelierStateStoreFromEnv,
  EncryptedLocalAtelierStateStore,
} from './atelier-continuity-store.js';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, link: vi.fn(actual.link), open: vi.fn(actual.open) };
});

const roots: string[] = [];

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function response(prompt: string, answer: string, sessionId: string): AtelierAskResponse {
  return {
    answer,
    disclosure: 'A11oy Atelier test disclosure.',
    receipt: {
      receiptId: 'atelier_receipt_test',
      traceId: 'trace_test',
      sessionId,
      provider: 'xai',
      providerLabel: 'xAI',
      model: 'grok-4.6',
      providerRequestId: 'provider_request_test',
      promptSha256: sha256(prompt),
      responseSha256: sha256(answer),
      policyEffect: 'allow',
      policyEvaluationId: 'policy_test',
      evidenceState: 'OBSERVED',
      ledgerEntryId: null,
      ledgerState: 'PENDING_API_APPEND',
      memoryState: 'PENDING_API_COMMIT',
      localOnly: true,
      latencyMs: 1,
      usage: { inputTokens: 2, outputTokens: 1, totalTokens: 3 },
      generatedAt: '2026-08-29T12:00:00.000Z',
    },
  };
}

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'a11oy-atelier-continuity-'));
  roots.push(root);
  return root;
}

async function filesBelow(path: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const candidate = join(path, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(candidate)));
    else files.push(candidate);
  }
  return files;
}

async function pauseNextLinkIn(directory: string): Promise<{
  reached: Promise<void>;
  release: () => void;
}> {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  let signalReached!: () => void;
  let release!: () => void;
  const reached = new Promise<void>((resolve) => {
    signalReached = resolve;
  });
  const resumed = new Promise<void>((resolve) => {
    release = resolve;
  });
  let paused = false;
  vi.mocked(link).mockImplementation(async (source, destination) => {
    if (!paused && String(destination).includes(`${sep}${directory}${sep}`)) {
      paused = true;
      signalReached();
      await resumed;
    }
    return actual.link(source, destination);
  });
  return { reached, release };
}

async function pauseNextLinkTo(path: string): Promise<{
  reached: Promise<void>;
  release: () => void;
}> {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  let signalReached!: () => void;
  let release!: () => void;
  const reached = new Promise<void>((resolve) => {
    signalReached = resolve;
  });
  const resumed = new Promise<void>((resolve) => {
    release = resolve;
  });
  let paused = false;
  vi.mocked(link).mockImplementation(async (source, destination) => {
    if (!paused && destination === path) {
      paused = true;
      signalReached();
      await resumed;
    }
    return actual.link(source, destination);
  });
  return { reached, release };
}

async function commitEncryptedTurn(params: {
  store: EncryptedLocalAtelierStateStore;
  tenantId: string;
  sessionId: string;
  idempotencyKey: string;
  prompt: string;
  answer: string;
}) {
  const reserved = await params.store.reserveTurn({
    tenantId: params.tenantId,
    sessionId: params.sessionId,
    idempotencyKey: params.idempotencyKey,
    request: {
      prompt: params.prompt,
      sessionId: params.sessionId,
      idempotencyKey: params.idempotencyKey,
    },
  });
  if (reserved.status !== 'reserved') throw new Error('expected reservation');
  const identity = {
    tenantId: params.tenantId,
    sessionId: params.sessionId,
    reservationId: reserved.reservation.reservationId,
  };
  await params.store.stageTurnResponse({
    ...identity,
    providerPrompt: params.prompt,
    response: response(params.prompt, params.answer, params.sessionId),
  });
  return params.store.commitTurn(identity);
}

afterEach(async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  vi.mocked(link).mockImplementation(actual.link);
  vi.mocked(open).mockImplementation(actual.open);
  vi.restoreAllMocks();
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('EncryptedLocalAtelierStateStore', () => {
  it('accepts a live hard-link cleanup during authenticated marker readback', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    await new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey }).ready();
    const markerPath = join(rootDirectory, 'key-check.json');
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    let intercepted = false;
    let released = false;
    let markerOpens = 0;
    vi.mocked(open).mockImplementation(async (filePath, flags, mode) => {
      const handle = await actual.open(filePath, flags, mode);
      if (filePath === markerPath) markerOpens += 1;
      if (filePath === markerPath && !intercepted) {
        intercepted = true;
        const temporaryLink = join(rootDirectory, 'key-check-live-link.tmp');
        await actual.link(markerPath, temporaryLink);
        const read = handle.read.bind(handle);
        vi.spyOn(handle, 'read').mockImplementation(async (...args) => {
          const result = await read(...args);
          if (!released) {
            await actual.unlink(temporaryLink);
            released = true;
          }
          return result;
        });
      }
      return handle;
    });
    const reopened = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await expect(reopened.ready()).resolves.toBeUndefined();
    expect(released).toBe(true);
    expect(markerOpens).toBe(2);
  });

  it('rejects unrelated ctime drift during authenticated marker readback', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    await new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey }).ready();
    const markerPath = join(rootDirectory, 'key-check.json');
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    let adjusted = false;
    let markerOpens = 0;
    vi.mocked(open).mockImplementation(async (filePath, flags, mode) => {
      const handle = await actual.open(filePath, flags, mode);
      if (filePath === markerPath) markerOpens += 1;
      if (filePath === markerPath && !adjusted) {
        adjusted = true;
        const stat = handle.stat.bind(handle);
        let calls = 0;
        vi.spyOn(handle, 'stat').mockImplementation(async (...args) => {
          const result = await stat(...args);
          if (++calls === 2) Object.assign(result, { ctimeMs: Number(result.ctimeMs) + 1 });
          return result;
        });
      }
      return handle;
    });
    const reopened = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await expect(reopened.ready()).rejects.toMatchObject({
      code: 'ATELIER_CAPSULE_INTEGRITY',
    });
    expect(adjusted).toBe(true);
    expect(markerOpens).toBe(1);
  });

  it('never retries a foreign-key marker authentication failure', async () => {
    const rootDirectory = await tempRoot();
    await new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey: randomBytes(32),
    }).ready();
    const markerPath = join(rootDirectory, 'key-check.json');
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    let markerOpens = 0;
    vi.mocked(open).mockImplementation(async (filePath, flags, mode) => {
      if (filePath === markerPath) markerOpens += 1;
      return actual.open(filePath, flags, mode);
    });
    const foreign = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey: randomBytes(32),
    });
    await expect(foreign.ready()).rejects.toMatchObject({ code: 'ATELIER_CAPSULE_INTEGRITY' });
    expect(markerOpens).toBe(1);
  });

  it('never retries a malformed marker parse failure', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    await new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey }).ready();
    const markerPath = join(rootDirectory, 'key-check.json');
    await writeFile(markerPath, '{malformed-json');
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    let markerOpens = 0;
    vi.mocked(open).mockImplementation(async (filePath, flags, mode) => {
      if (filePath === markerPath) markerOpens += 1;
      return actual.open(filePath, flags, mode);
    });
    const reopened = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await expect(reopened.ready()).rejects.toMatchObject({ code: 'ATELIER_CAPSULE_INTEGRITY' });
    expect(markerOpens).toBe(1);
  });

  it('bounds publication-link readback retry to one fresh descriptor', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    await new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey }).ready();
    const markerPath = join(rootDirectory, 'key-check.json');
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    let markerOpens = 0;
    vi.mocked(open).mockImplementation(async (filePath, flags, mode) => {
      const handle = await actual.open(filePath, flags, mode);
      if (filePath === markerPath) {
        markerOpens += 1;
        const stat = handle.stat.bind(handle);
        let calls = 0;
        vi.spyOn(handle, 'stat').mockImplementation(async (...args) => {
          const result = await stat(...args);
          if (++calls === 1) Object.assign(result, { nlink: 2 });
          else Object.assign(result, { nlink: 1, ctimeMs: Number(result.ctimeMs) + 1 });
          return result;
        });
      }
      return handle;
    });
    const reopened = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await expect(reopened.ready()).rejects.toMatchObject({
      code: 'ATELIER_CAPSULE_INTEGRITY',
    });
    expect(markerOpens).toBe(2);
  });

  it('allows matching-key first-start peers to race marker publication', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const markerPath = join(rootDirectory, 'key-check.json');
    const publication = await pauseNextLinkTo(markerPath);
    const writer = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await publication.reached;
    try {
      const reader = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
      await expect(reader.ready()).resolves.toBeUndefined();
    } finally {
      publication.release();
    }
    await expect(writer.ready()).resolves.toBeUndefined();
    expect((await filesBelow(rootDirectory)).filter((path) => path === markerPath)).toHaveLength(1);
  });

  it('rejects a different-key first-start loser after marker publication', async () => {
    const rootDirectory = await tempRoot();
    const markerPath = join(rootDirectory, 'key-check.json');
    const publication = await pauseNextLinkTo(markerPath);
    const writer = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey: randomBytes(32),
    });
    await publication.reached;
    try {
      const reader = new EncryptedLocalAtelierStateStore({
        rootDirectory,
        masterKey: randomBytes(32),
      });
      await expect(reader.ready()).resolves.toBeUndefined();
    } finally {
      publication.release();
    }
    await expect(writer.ready()).rejects.toMatchObject({
      code: 'ATELIER_CAPSULE_INTEGRITY',
    });
  });

  it('rejects an unexpected root file while the key marker is absent', async () => {
    const rootDirectory = await tempRoot();
    await writeFile(join(rootDirectory, 'key-check.json.not-a-publication.tmp'), 'unexpected');
    const store = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey: randomBytes(32),
    });
    await expect(store.ready()).rejects.toMatchObject({
      code: 'ATELIER_CAPSULE_INTEGRITY',
    });
  });

  it('rejects authenticated index replacement after opening the original descriptor', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const store = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await commitEncryptedTurn({
      store,
      tenantId: 'tenant-replaced-index',
      sessionId: 'session-replaced-index',
      idempotencyKey: 'replaced-index-key',
      prompt: 'original descriptor',
      answer: 'original answer',
    });
    const indexPath = (await filesBelow(join(rootDirectory, 'indexes')))[0];
    const originalBytes = await readFile(indexPath);
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    let replaced = false;
    vi.mocked(open).mockImplementation(async (filePath, flags, mode) => {
      const handle = await actual.open(filePath, flags, mode);
      if (filePath === indexPath && !replaced) {
        replaced = true;
        await actual.rename(indexPath, `${indexPath}.retired`);
        await actual.writeFile(indexPath, originalBytes);
      }
      return handle;
    });
    const reopened = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await expect(
      reopened.getSession('tenant-replaced-index', 'session-replaced-index'),
    ).rejects.toMatchObject({ code: 'ATELIER_CAPSULE_INTEGRITY' });
    expect(replaced).toBe(true);
  });

  it('bounds descriptor reads if an authenticated index grows after its initial stat', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const store = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await commitEncryptedTurn({
      store,
      tenantId: 'tenant-grown-index',
      sessionId: 'session-grown-index',
      idempotencyKey: 'grown-index-key',
      prompt: 'bounded descriptor',
      answer: 'bounded answer',
    });
    const indexPath = (await filesBelow(join(rootDirectory, 'indexes')))[0];
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    let consumed = 0;
    let grew = false;
    vi.mocked(open).mockImplementation(async (filePath, flags, mode) => {
      const handle = await actual.open(filePath, flags, mode);
      if (filePath === indexPath && !grew) {
        grew = true;
        const initialStat = await handle.stat();
        await actual.writeFile(indexPath, 'x'.repeat(256 * 1024 + 64));
        vi.spyOn(handle, 'stat').mockResolvedValueOnce(initialStat);
        const read = handle.read.bind(handle);
        vi.spyOn(handle, 'read').mockImplementation(async (...args) => {
          const result = await read(...args);
          consumed += result.bytesRead;
          return result;
        });
      }
      return handle;
    });
    const reopened = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await expect(
      reopened.getSession('tenant-grown-index', 'session-grown-index'),
    ).rejects.toMatchObject({ code: 'ATELIER_CAPSULE_INTEGRITY' });
    expect(grew).toBe(true);
    expect(consumed).toBe(256 * 1024 + 1);
  });

  it('persists encrypted full replay state and reopens a verifiable session', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const now = () => new Date('2026-08-29T12:00:00.000Z');
    const prompt = 'PROMPT_MUST_ONLY_EXIST_INSIDE_ENCRYPTION_93fd9';
    const answer = 'ANSWER_MUST_ONLY_EXIST_INSIDE_ENCRYPTION_81ac7';
    const identifiers = {
      tenantId: 'tenant-raw-must-not-be-a-path',
      sessionId: 'session-raw-must-not-be-a-path',
      idempotencyKey: 'idempotency-raw-must-not-be-a-path',
    };
    const store = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey, now });
    const reserved = await store.reserveTurn({
      ...identifiers,
      request: {
        prompt,
        sessionId: identifiers.sessionId,
        idempotencyKey: identifiers.idempotencyKey,
      },
    });
    expect(reserved.status).toBe('reserved');
    if (reserved.status !== 'reserved') throw new Error('expected reservation');
    const identity = {
      tenantId: identifiers.tenantId,
      sessionId: identifiers.sessionId,
      reservationId: reserved.reservation.reservationId,
    };
    const staged = await store.stageTurnResponse({
      ...identity,
      providerPrompt: prompt,
      response: response(prompt, answer, identifiers.sessionId),
    });
    expect(staged.persistenceState).toBe('RESPONSE_STAGED_ENCRYPTED_LOCAL_DURABLE');
    const capsule = await store.commitTurn(identity);
    expect(capsule.persistenceState).toBe('COMMITTED_ENCRYPTED_LOCAL_DURABLE');
    expect(capsule.durable).toBe(true);
    expect(capsule.response.receipt.memoryState).toBe('COMMITTED_ENCRYPTED_LOCAL');

    const allFiles = await filesBelow(rootDirectory);
    const durableBytes = (await Promise.all(allFiles.map((path) => readFile(path, 'utf8')))).join(
      '\n',
    );
    expect(durableBytes).not.toContain(prompt);
    expect(durableBytes).not.toContain(answer);
    for (const raw of Object.values(identifiers)) {
      expect(durableBytes).not.toContain(raw);
      expect(allFiles.join('\n')).not.toContain(raw);
    }

    const reopened = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey, now });
    const replay = await reopened.getTurn(identifiers);
    expect(replay?.response.answer).toBe(answer);
    expect(replay?.capsuleDigest).toBe(capsule.capsuleDigest);
    const session = await reopened.getSession(identifiers.tenantId, identifiers.sessionId);
    expect(session?.turns.map((turn) => turn.content)).toEqual([prompt, answer]);
    expect(session?.persistence).toMatchObject({
      durable: true,
      encryptionState: 'ENCRYPTED_AT_REST',
      persistenceState: 'ENCRYPTED_LOCAL_DURABLE',
    });
  });

  it('surfaces an interrupted durable reservation as PENDING_RECOVERY after restart', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const input = {
      tenantId: 'tenant-recovery',
      sessionId: 'session-recovery',
      idempotencyKey: 'retry-recovery',
      request: {
        prompt: 'recover me',
        sessionId: 'session-recovery',
        idempotencyKey: 'retry-recovery',
      },
    };
    const first = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    expect((await first.reserveTurn(input)).status).toBe('reserved');

    const reopened = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    const pending = await reopened.reserveTurn(input);
    expect(pending.status).toBe('pending');
    if (pending.status !== 'pending') throw new Error('expected pending recovery');
    expect(pending.reason).toBe('PENDING_RECOVERY');
    expect(pending.reservation.persistenceState).toBe('PENDING_RECOVERY');
    expect(pending.reservation.durable).toBe(true);
  });

  it('fails closed for a wrong key and authenticated-index tampering', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const input = {
      tenantId: 'tenant-integrity',
      sessionId: 'session-integrity',
      idempotencyKey: 'retry-integrity',
      request: {
        prompt: 'integrity prompt',
        sessionId: 'session-integrity',
        idempotencyKey: 'retry-integrity',
      },
    };
    const store = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    const reserved = await store.reserveTurn(input);
    if (reserved.status !== 'reserved') throw new Error('expected reservation');
    const identity = {
      tenantId: input.tenantId,
      sessionId: input.sessionId,
      reservationId: reserved.reservation.reservationId,
    };
    await store.stageTurnResponse({
      ...identity,
      providerPrompt: input.request.prompt,
      response: response(input.request.prompt, 'integrity answer', input.sessionId),
    });
    await store.commitTurn(identity);

    const wrongKey = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey: randomBytes(32),
    });
    await expect(wrongKey.ready()).rejects.toMatchObject({
      code: 'ATELIER_CAPSULE_INTEGRITY',
    });
    await expect(wrongKey.getSession(input.tenantId, input.sessionId)).rejects.toMatchObject({
      code: 'ATELIER_CAPSULE_INTEGRITY',
    });

    const indexPath = (await filesBelow(join(rootDirectory, 'indexes')))[0];
    const record = JSON.parse(await readFile(indexPath, 'utf8')) as { authenticationTag: string };
    record.authenticationTag = `${record.authenticationTag[0] === '0' ? '1' : '0'}${record.authenticationTag.slice(1)}`;
    await writeFile(indexPath, `${JSON.stringify(record)}\n`, 'utf8');
    const tampered = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await expect(tampered.getTurn(input)).rejects.toMatchObject({
      code: 'ATELIER_CAPSULE_INTEGRITY',
    });
  });

  it('durably stages recovery state and refuses to release an observed provider response', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const input = {
      tenantId: 'tenant-staged-recovery',
      sessionId: 'session-staged-recovery',
      idempotencyKey: 'retry-staged-recovery',
      request: {
        prompt: 'stage this response',
        sessionId: 'session-staged-recovery',
        idempotencyKey: 'retry-staged-recovery',
      },
    };
    const store = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
    });
    const reserved = await store.reserveTurn(input);
    if (reserved.status !== 'reserved') throw new Error('expected reservation');
    const identity = {
      tenantId: input.tenantId,
      sessionId: input.sessionId,
      reservationId: reserved.reservation.reservationId,
    };
    const recovery = await store.markTurnPendingRecovery({
      ...identity,
      providerPrompt: input.request.prompt,
      response: response(input.request.prompt, 'recovered answer', input.sessionId),
    });
    expect(recovery.persistenceState).toBe('PENDING_RECOVERY');
    await expect(
      store.releaseTurn({
        ...identity,
        reason: 'PROVIDER_FAILED_BEFORE_RESPONSE',
      }),
    ).rejects.toMatchObject({ code: 'ATELIER_AMBIGUOUS_PROVIDER_COMPLETION' });

    const reopened = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
    });
    const capsule = await reopened.commitTurn(identity);
    expect(capsule.response.answer).toBe('recovered answer');
  });

  it('releases only pre-response reservations and permits a fresh lease', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const input = {
      tenantId: 'tenant-release',
      sessionId: 'session-release',
      idempotencyKey: 'retry-release',
      request: {
        prompt: 'release before response',
        sessionId: 'session-release',
        idempotencyKey: 'retry-release',
      },
    };
    const store = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
    });
    const reserved = await store.reserveTurn(input);
    if (reserved.status !== 'reserved') throw new Error('expected reservation');
    await expect(
      store.releaseTurn({
        tenantId: input.tenantId,
        sessionId: input.sessionId,
        reservationId: reserved.reservation.reservationId,
        reason: 'PROVIDER_UNAVAILABLE',
      }),
    ).resolves.toBe(true);
    await expect(
      store.reserveTurn({
        ...input,
        idempotencyKey: 'retry-release-second',
        request: {
          ...input.request,
          idempotencyKey: 'retry-release-second',
        },
      }),
    ).resolves.toMatchObject({ status: 'reserved' });
  });

  it('publishes only one cross-process local-filesystem session lease', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const left = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
    });
    const right = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
    });
    const attempts = await Promise.allSettled([
      left.reserveTurn({
        tenantId: 'tenant-race',
        sessionId: 'session-race',
        idempotencyKey: 'race-left',
        request: {
          prompt: 'left',
          sessionId: 'session-race',
          idempotencyKey: 'race-left',
        },
      }),
      right.reserveTurn({
        tenantId: 'tenant-race',
        sessionId: 'session-race',
        idempotencyKey: 'race-right',
        request: {
          prompt: 'right',
          sessionId: 'session-race',
          idempotencyKey: 'race-right',
        },
      }),
    ]);
    // A runner that sees the published lease returns pending; a runner that
    // loses atomic publication rejects. Neither outcome is a second grant.
    const grants = attempts.filter(
      (attempt) => attempt.status === 'fulfilled' && attempt.value.status === 'reserved',
    );
    expect(grants).toHaveLength(1);
    const granted = grants[0];
    if (granted?.status !== 'fulfilled' || granted.value.status !== 'reserved') {
      throw new Error('expected exactly one granted session lease');
    }
    const blocked = attempts.find((attempt) => attempt !== granted);
    if (blocked?.status === 'fulfilled') {
      expect(blocked.value).toMatchObject({
        status: 'pending',
        code: 'ATELIER_SESSION_BUSY',
        reservation: { reservationId: granted.value.reservation.reservationId },
      });
    } else {
      expect(blocked).toMatchObject({
        status: 'rejected',
        reason: { code: 'ATELIER_CAPSULE_INTEGRITY' },
      });
    }
    expect(
      (await filesBelow(join(rootDirectory, 'indexes'))).filter((path) => path.endsWith('.json')),
    ).toHaveLength(1);
    const session = await left.getSession('tenant-race', 'session-race');
    expect(session?.capsules).toHaveLength(0);
  });

  it("does not unlink another store's live index publication candidate", async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const writer = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    const reader = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await Promise.all([writer.ready(), reader.ready()]);
    const publication = await pauseNextLinkIn('indexes');
    const reservation = writer.reserveTurn({
      tenantId: 'tenant-live-index',
      sessionId: 'session-live-index',
      idempotencyKey: 'live-index-key',
      request: {
        prompt: 'index publication',
        sessionId: 'session-live-index',
        idempotencyKey: 'live-index-key',
      },
    });
    await publication.reached;
    try {
      expect(await reader.getSession('tenant-live-index', 'session-live-index')).toBeNull();
    } finally {
      publication.release();
    }
    await expect(reservation).resolves.toMatchObject({ status: 'reserved' });
    expect(
      (await filesBelow(join(rootDirectory, 'indexes'))).filter((path) => path.endsWith('.json')),
    ).toHaveLength(1);
  });

  it("does not unlink another store's live encrypted-object publication candidate", async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const writer = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
    await writer.ready();
    const publication = await pauseNextLinkIn(join('capsules', 'objects'));
    const reservation = writer.reserveTurn({
      tenantId: 'tenant-live-object',
      sessionId: 'session-live-object',
      idempotencyKey: 'live-object-key',
      request: {
        prompt: 'object publication',
        sessionId: 'session-live-object',
        idempotencyKey: 'live-object-key',
      },
    });
    await publication.reached;
    try {
      const reader = new EncryptedLocalAtelierStateStore({ rootDirectory, masterKey });
      await reader.ready();
    } finally {
      publication.release();
    }
    await expect(reservation).resolves.toMatchObject({ status: 'reserved' });
    expect(
      (await filesBelow(join(rootDirectory, 'capsules', 'objects'))).filter((path) =>
        path.endsWith('.json'),
      ),
    ).toHaveLength(1);
  });

  it('uses the first capsule expiry for a staggered encrypted chain', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    let currentTime = Date.parse('2026-08-29T12:00:00.000Z');
    const store = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
      now: () => new Date(currentTime),
    });

    const first = await commitEncryptedTurn({
      store,
      tenantId: 'tenant-expiry',
      sessionId: 'session-expiry',
      idempotencyKey: 'expiry-one',
      prompt: 'first',
      answer: 'first answer',
    });
    currentTime += 60 * 60 * 1_000;
    const second = await commitEncryptedTurn({
      store,
      tenantId: 'tenant-expiry',
      sessionId: 'session-expiry',
      idempotencyKey: 'expiry-two',
      prompt: 'second',
      answer: 'second answer',
    });

    expect(second.expiresAt).toBe(first.expiresAt);
    expect(second.response.receipt.stateRetentionExpiresAt).toBe(first.expiresAt);
    expect(second.response.receipt.memoryState).toBe('COMMITTED_ENCRYPTED_LOCAL');
  });

  it('reconciles a committed turn with its stale pending lease after restart', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    const store = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
    });
    const input = {
      tenantId: 'tenant-stale-lease',
      sessionId: 'session-stale-lease',
      idempotencyKey: 'stale-lease-key',
      request: {
        prompt: 'commit before lease cleanup',
        sessionId: 'session-stale-lease',
        idempotencyKey: 'stale-lease-key',
      },
    };
    const reserved = await store.reserveTurn(input);
    if (reserved.status !== 'reserved') throw new Error('expected reservation');
    const identity = {
      tenantId: input.tenantId,
      sessionId: input.sessionId,
      reservationId: reserved.reservation.reservationId,
    };
    await store.stageTurnResponse({
      ...identity,
      providerPrompt: input.request.prompt,
      response: response(input.request.prompt, 'committed answer', input.sessionId),
    });
    const pendingIndexPath = (await filesBelow(join(rootDirectory, 'indexes'))).find((candidate) =>
      candidate.endsWith('.json'),
    );
    if (!pendingIndexPath) throw new Error('expected pending index');
    const pendingBytes = await readFile(pendingIndexPath, 'utf8');
    const pendingRecord = JSON.parse(pendingBytes) as {
      stateCapsuleId: string;
    };
    await store.commitTurn(identity);
    await writeFile(pendingIndexPath, pendingBytes, 'utf8');

    const reopened = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
    });
    await reopened.ready();
    const session = await reopened.getSession(input.tenantId, input.sessionId);
    expect(session?.capsules).toHaveLength(1);
    expect(
      (await filesBelow(join(rootDirectory, 'indexes'))).filter((candidate) =>
        candidate.endsWith('.json'),
      ),
    ).toHaveLength(1);
    expect(
      (await filesBelow(join(rootDirectory, 'capsules', 'objects'))).some((candidate) =>
        candidate.endsWith(`${pendingRecord.stateCapsuleId}.json`),
      ),
    ).toBe(false);
    expect(
      await reopened.reserveTurn({
        ...input,
        idempotencyKey: 'fresh-after-reconcile',
        request: {
          ...input.request,
          idempotencyKey: 'fresh-after-reconcile',
        },
      }),
    ).toMatchObject({ status: 'reserved' });
  });

  it('retains an unindexed payload until expiry, then deletes it with a receipt', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    let currentTime = Date.parse('2026-08-29T12:00:00.000Z');
    const store = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
      now: () => new Date(currentTime),
    });
    const reservation = await store.reserveTurn({
      tenantId: 'tenant-orphan',
      sessionId: 'session-orphan',
      idempotencyKey: 'orphan-key',
      request: {
        prompt: 'orphan candidate',
        sessionId: 'session-orphan',
        idempotencyKey: 'orphan-key',
      },
    });
    if (reservation.status !== 'reserved') throw new Error('expected orphan candidate');
    const indexPath = (await filesBelow(join(rootDirectory, 'indexes'))).find((candidate) =>
      candidate.endsWith('.json'),
    );
    if (!indexPath) throw new Error('expected orphan index');
    const record = JSON.parse(await readFile(indexPath, 'utf8')) as {
      stateCapsuleId: string;
    };
    await unlink(indexPath);

    const reopened = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
      now: () => new Date(currentTime),
    });
    await reopened.ready();
    expect(
      (await filesBelow(join(rootDirectory, 'capsules', 'objects'))).some((candidate) =>
        candidate.endsWith(`${record.stateCapsuleId}.json`),
      ),
    ).toBe(true);
    expect(await reopened.getSession('tenant-orphan', 'session-orphan')).toBeNull();
    currentTime = Date.parse(reservation.reservation.expiresAt);
    await reopened.pruneExpired();
    expect(
      (await filesBelow(join(rootDirectory, 'capsules', 'objects'))).some((candidate) =>
        candidate.endsWith(`${record.stateCapsuleId}.json`),
      ),
    ).toBe(false);
    expect(
      (await filesBelow(join(rootDirectory, 'capsules', 'tombstones'))).some((candidate) =>
        candidate.endsWith(`${record.stateCapsuleId}.json`),
      ),
    ).toBe(true);
  });

  it('purges expired encrypted content during startup readiness', async () => {
    const rootDirectory = await tempRoot();
    const masterKey = randomBytes(32);
    let currentTime = Date.parse('2026-08-29T12:00:00.000Z');
    const store = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
      now: () => new Date(currentTime),
    });
    const capsule = await commitEncryptedTurn({
      store,
      tenantId: 'tenant-startup-prune',
      sessionId: 'session-startup-prune',
      idempotencyKey: 'startup-prune-key',
      prompt: 'expires at startup',
      answer: 'expired answer',
    });
    currentTime = Date.parse(capsule.expiresAt);

    const reopened = new EncryptedLocalAtelierStateStore({
      rootDirectory,
      masterKey,
      now: () => new Date(currentTime),
    });
    await reopened.ready();
    expect(await reopened.getSession('tenant-startup-prune', 'session-startup-prune')).toBeNull();
    expect(
      (await filesBelow(join(rootDirectory, 'indexes'))).filter((candidate) =>
        candidate.endsWith('.json'),
      ),
    ).toHaveLength(0);
    expect(
      (await filesBelow(join(rootDirectory, 'capsules', 'objects'))).filter((candidate) =>
        candidate.endsWith('.json'),
      ),
    ).toHaveLength(0);
  });

  it('requires the directory/key pair and never silently falls back when durable state is required', () => {
    expect(
      () =>
        new EncryptedLocalAtelierStateStore({
          rootDirectory: 'relative-continuity',
          masterKey: randomBytes(32),
        }),
    ).toThrow(AtelierContinuityConfigurationError);
    expect(createEncryptedLocalAtelierStateStoreFromEnv({ env: {} })).toBeUndefined();
    expect(() => createEncryptedLocalAtelierStateStoreFromEnv({ env: {}, required: true })).toThrow(
      AtelierContinuityConfigurationError,
    );
    expect(() =>
      createEncryptedLocalAtelierStateStoreFromEnv({
        env: { A11OY_ATELIER_CONTINUITY_DIR: 'C:\\durable' },
      }),
    ).toThrow(AtelierContinuityConfigurationError);
    expect(() =>
      createEncryptedLocalAtelierStateStoreFromEnv({
        env: {
          A11OY_ATELIER_CONTINUITY_DIR: 'C:\\durable',
          A11OY_ATELIER_CONTINUITY_KEY: 'too-short',
        },
      }),
    ).toThrow(AtelierContinuityConfigurationError);
  });
});
