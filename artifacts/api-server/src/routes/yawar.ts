/**
 * yawar-bus HTTP surface (task #5173).
 *
 * Mounts the canonical event-bus over the existing api-server. Each topic
 * is backed by a `ReceiptChain` from `@szl-holdings/szl-receipts`, with
 * a custom `ReceiptStorage` adapter that persists every appended
 * `LambdaReceipt` to the `yawar_events` table:
 *
 *   POST /api/yawar/publish                — append an event to a topic
 *   GET  /api/yawar/subscribe?topic=X      — SSE stream of new events
 *   GET  /api/yawar/events?topic=X&since=H — replay since a known hash
 *   GET  /api/yawar/receipt/:id            — fetch a single receipt
 *   GET  /api/yawar/chain/verify?topic=X&from=H&to=H — verify link integrity
 *
 * In-process pub/sub fans out SSE subscribers; persistence is the source
 * of truth for replay and verify.
 *
 * Payload canonicalization invariant: the byte-identical JSON value that
 * is persisted in the `payload` jsonb column is the same value that is
 * hashed into `paramsHash` (and through it into the receipt's `selfHash`,
 * stored as the `hash` column). The normalization rule is "missing or
 * null → `{}`" applied once on entry, then used in BOTH the hash and
 * the row insert. This closes the previous divergence where
 * `payload ?? null` was hashed while `payload ?? {}` was stored, which
 * caused false `hash-mismatch` reports from `/chain/verify`.
 */
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { db, yawarEventsTable } from '@szl-holdings/db';
import { type IRouter, type Request, type Response, Router } from 'express';
import { and, asc, eq, gt } from 'drizzle-orm';
import { z } from 'zod';
import {
  ReceiptChain,
  canonicalJson,
  hashJson,
  sha256Hex,
  type LambdaReceipt,
  type ReceiptStorage,
} from '@szl-holdings/szl-receipts';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';

const router: IRouter = Router();

const ZERO_HASH = '0'.repeat(64);

// In-process broadcaster; one channel per topic name.
const bus = new EventEmitter();
bus.setMaxListeners(0);

interface PersistedEvent {
  receiptId: string;
  topic: string;
  ts: string;
  payload: Record<string, unknown>;
  prevHash: string;
  hash: string;
  signer: string | null;
}

/**
 * Normalize the inbound payload to its canonical jsonb form. Applied
 * once and then used by BOTH the chain hasher and the row insert so
 * the persisted bytes match the hashed bytes byte-for-byte.
 */
function normalizePayload(p: unknown): Record<string, unknown> {
  if (p === null || p === undefined) return {};
  if (typeof p === 'object' && !Array.isArray(p)) return p as Record<string, unknown>;
  // Wrap primitives/arrays so the jsonb column (which is `notNull` with
  // a Record<string, unknown>) stays object-shaped; the chain hash still
  // captures the original value losslessly under the `value` key.
  return { value: p } as Record<string, unknown>;
}

function rowToEvent(row: typeof yawarEventsTable.$inferSelect): PersistedEvent {
  return {
    receiptId: row.receiptId,
    topic: row.topic,
    ts: row.ts.toISOString(),
    payload: (row.payload ?? {}) as Record<string, unknown>,
    prevHash: row.prevHash,
    hash: row.hash,
    signer: row.signer ?? null,
  };
}

function rowToLambdaReceipt(row: typeof yawarEventsTable.$inferSelect, seq: number): LambdaReceipt {
  return {
    seq,
    ts: row.ts.toISOString(),
    endpoint: row.topic,
    method: 'yawar.publish',
    paramsHash: hashJson(row.payload ?? {}),
    operatorId: `yawar:${row.topic}`,
    prevHash: row.prevHash,
    selfHash: row.hash,
    metadata: {
      receiptId: row.receiptId,
      ...(row.signer ? { signer: row.signer } : {}),
    },
  };
}

/**
 * Per-topic ReceiptStorage adapter for ReceiptChain. Reads the topic
 * slice of `yawar_events` in seq order. Writes are serialized PER TOPIC
 * by `publishOnce()` via `topicMutex`, which also gates assignment of
 * the `pendingInsert` side-channel — so even though `pendingInsert` is
 * a single field on the storage instance, only one publish is ever
 * in-flight per topic and the next caller cannot overwrite it.
 *
 * (We use a side-channel because ReceiptChain's `AppendInput` doesn't
 *  carry the row-only fields — `receiptId`, raw `payload` jsonb,
 *  `signer` — which the yawar_events table needs in addition to the
 *  chain's hash/prevHash. The mutex makes the side-channel safe.)
 */
class YawarTopicStorage implements ReceiptStorage {
  pendingInsert: { payload: Record<string, unknown>; signer: string | null; receiptId: string } | null = null;
  lastInserted: typeof yawarEventsTable.$inferSelect | null = null;

  constructor(private readonly topic: string) {}

  async readAll(): Promise<LambdaReceipt[]> {
    const rows = await db
      .select()
      .from(yawarEventsTable)
      .where(eq(yawarEventsTable.topic, this.topic))
      .orderBy(asc(yawarEventsTable.seq));
    return rows.map((r, i) => rowToLambdaReceipt(r, i));
  }

  async append(receipt: LambdaReceipt): Promise<void> {
    const insertExtras = this.pendingInsert;
    this.pendingInsert = null;
    if (!insertExtras) {
      throw new Error('YawarTopicStorage: append() called without pendingInsert side-channel');
    }
    const [inserted] = await db
      .insert(yawarEventsTable)
      .values({
        receiptId: insertExtras.receiptId,
        topic: this.topic,
        ts: new Date(receipt.ts),
        payload: insertExtras.payload,
        prevHash: receipt.prevHash,
        hash: receipt.selfHash,
        signer: insertExtras.signer,
      })
      .returning();
    this.lastInserted = inserted ?? null;
  }
}

/**
 * Per-topic ReceiptChain registry. Chains are stateful (in-memory cache
 * + write queue) so we reuse them across requests.
 */
interface TopicEntry {
  chain: ReceiptChain;
  storage: YawarTopicStorage;
  /** Serializes publishOnce() per topic so the side-channel + chain.append
   *  + lastInserted read happen atomically for one caller at a time. */
  mutex: Promise<unknown>;
}
const chains = new Map<string, TopicEntry>();
function getTopicEntry(topic: string): TopicEntry {
  let entry = chains.get(topic);
  if (!entry) {
    const storage = new YawarTopicStorage(topic);
    const chain = new ReceiptChain({ operatorId: `yawar:${topic}`, storage });
    entry = { chain, storage, mutex: Promise.resolve() };
    chains.set(topic, entry);
  }
  return entry;
}

const TOPIC_RE = /^[a-zA-Z0-9._-]{1,128}$/;

const publishBody = z.object({
  topic: z.string().regex(TOPIC_RE, 'topic must match [a-zA-Z0-9._-]{1,128}'),
  payload: z.unknown(),
  signer: z.string().max(256).optional(),
});
type PublishBody = z.infer<typeof publishBody>;

async function publishOnce(
  topic: string,
  payload: unknown,
  signer: string | undefined,
): Promise<PersistedEvent> {
  const entry = getTopicEntry(topic);
  // Acquire the per-topic mutex. This is what makes the storage
  // side-channel safe: the next publishOnce on the same topic cannot
  // overwrite pendingInsert until this one has returned.
  const run = entry.mutex.then(
    () => doPublish(),
    () => doPublish(),
  );
  entry.mutex = run.catch(() => undefined);
  return run;

  async function doPublish(): Promise<PersistedEvent> {
    const { chain, storage } = entry;
    const normalizedPayload = normalizePayload(payload);
    const receiptId = randomUUID();
    storage.pendingInsert = {
      receiptId,
      payload: normalizedPayload,
      signer: signer ?? null,
    };
    try {
      await chain.append({
        endpoint: topic,
        method: 'yawar.publish',
        params: normalizedPayload,
        metadata: {
          receiptId,
          ...(signer ? { signer } : {}),
        },
      });
      const inserted = storage.lastInserted;
      storage.lastInserted = null;
      if (!inserted) throw new Error('yawar publish: storage side-channel missed the insert');
      const event = rowToEvent(inserted);
      bus.emit(`topic:${topic}`, event);
      return event;
    } finally {
      // Defensive: clear any leftover side-channel on failure paths so a
      // future publish can't reuse stale state.
      storage.pendingInsert = null;
      storage.lastInserted = null;
    }
  }
}

/**
 * POST /api/yawar/publish
 * Body: { topic, payload, signer? }
 */
router.post('/publish', validateBody<PublishBody>(publishBody), async (req: Request, res: Response) => {
  try {
    const { topic, payload, signer } = req.body as PublishBody;
    const event = await publishOnce(topic, payload, signer);
    sendSuccess(res, event);
  } catch (err) {
    handleRouteError(res, err, 'yawar publish failed');
  }
});

/**
 * GET /api/yawar/events?topic=X&since=<hash>
 * Replay all events after the given hash (exclusive). If `since` is
 * omitted or unknown, returns the whole topic from genesis.
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const topic = String(req.query.topic ?? '');
    if (!TOPIC_RE.test(topic)) {
      sendBadRequest(res, 'topic query param is required');
      return;
    }
    const since = req.query.since ? String(req.query.since) : null;

    let cursorSeq = 0;
    if (since) {
      const [cur] = await db
        .select({ seq: yawarEventsTable.seq })
        .from(yawarEventsTable)
        .where(and(eq(yawarEventsTable.topic, topic), eq(yawarEventsTable.hash, since)));
      if (cur) cursorSeq = cur.seq;
    }
    const rows = await db
      .select()
      .from(yawarEventsTable)
      .where(and(eq(yawarEventsTable.topic, topic), gt(yawarEventsTable.seq, cursorSeq)))
      .orderBy(asc(yawarEventsTable.seq));

    sendSuccess(res, { topic, events: rows.map(rowToEvent) });
  } catch (err) {
    handleRouteError(res, err, 'yawar events failed');
  }
});

/**
 * GET /api/yawar/subscribe?topic=X
 * Server-Sent Events stream of newly published events on the topic.
 */
router.get('/subscribe', (req: Request, res: Response) => {
  const topic = String(req.query.topic ?? '');
  if (!TOPIC_RE.test(topic)) {
    sendBadRequest(res, 'topic query param is required');
    return;
  }
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const channel = `topic:${topic}`;
  const listener = (event: PersistedEvent) => {
    res.write(`event: yawar.event\n`);
    res.write(`id: ${event.hash}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  bus.on(channel, listener);

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 25_000);

  res.write(`event: yawar.open\n`);
  res.write(`data: ${JSON.stringify({ topic })}\n\n`);

  const close = () => {
    clearInterval(heartbeat);
    bus.off(channel, listener);
    try {
      res.end();
    } catch {
      /* already closed */
    }
  };
  req.on('close', close);
  req.on('aborted', close);
});

/**
 * GET /api/yawar/receipt/:id
 */
router.get('/receipt/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? '');
    const [row] = await db
      .select()
      .from(yawarEventsTable)
      .where(eq(yawarEventsTable.receiptId, id));
    if (!row) {
      sendNotFound(res, `yawar receipt ${id} not found`);
      return;
    }
    sendSuccess(res, rowToEvent(row));
  } catch (err) {
    handleRouteError(res, err, 'yawar receipt failed');
  }
});

/**
 * GET /api/yawar/chain/verify?topic=X&from=<hash>&to=<hash>
 * Recomputes hashes for the segment [from, to] on the topic using the
 * SAME skeleton as `ReceiptChain` (so the verifier and the writer can
 * never disagree by construction). `from`/`to` omitted ⇒ verify whole
 * topic from genesis.
 */
router.get('/chain/verify', async (req: Request, res: Response) => {
  try {
    const topic = String(req.query.topic ?? '');
    if (!TOPIC_RE.test(topic)) {
      sendBadRequest(res, 'topic query param is required');
      return;
    }
    const from = req.query.from ? String(req.query.from) : null;
    const to = req.query.to ? String(req.query.to) : null;

    const rows = await db
      .select()
      .from(yawarEventsTable)
      .where(eq(yawarEventsTable.topic, topic))
      .orderBy(asc(yawarEventsTable.seq));

    let startIdx = 0;
    let endIdx = rows.length - 1;
    if (from) {
      const i = rows.findIndex((r) => r.hash === from);
      if (i < 0) {
        sendBadRequest(res, `from hash not found on topic ${topic}`);
        return;
      }
      startIdx = i;
    }
    if (to) {
      const i = rows.findIndex((r) => r.hash === to);
      if (i < 0) {
        sendBadRequest(res, `to hash not found on topic ${topic}`);
        return;
      }
      endIdx = i;
    }
    if (endIdx < startIdx) {
      sendBadRequest(res, 'to is older than from');
      return;
    }

    let expectedPrev = startIdx === 0 ? ZERO_HASH : rows[startIdx - 1]!.hash;
    const issues: Array<{ index: number; hash: string; reason: string }> = [];
    for (let i = startIdx; i <= endIdx; i++) {
      const r = rows[i]!;
      if (r.prevHash !== expectedPrev) {
        issues.push({ index: i, hash: r.hash, reason: 'prev-hash-mismatch' });
      }
      // Same skeleton as ReceiptChain.append(): seq, ts, endpoint, method,
      // paramsHash, operatorId, prevHash. No `metadata` was passed at write
      // time (receiptId/signer live in the storage side-channel, not the
      // hashed skeleton) so we omit it here too.
      const skeleton = {
        seq: i,
        ts: r.ts.toISOString(),
        endpoint: r.topic,
        method: 'yawar.publish',
        paramsHash: hashJson(r.payload ?? {}),
        operatorId: `yawar:${r.topic}`,
        prevHash: r.prevHash,
      };
      const recomputed = sha256Hex(canonicalJson(skeleton));
      if (recomputed !== r.hash) {
        issues.push({ index: i, hash: r.hash, reason: 'hash-mismatch' });
      }
      expectedPrev = r.hash;
    }

    sendSuccess(res, {
      topic,
      from: rows[startIdx]?.hash ?? null,
      to: rows[endIdx]?.hash ?? null,
      length: Math.max(0, endIdx - startIdx + 1),
      valid: issues.length === 0,
      issues,
    });
  } catch (err) {
    handleRouteError(res, err, 'yawar chain verify failed');
  }
});

/**
 * Internal helper for other in-process modules (e.g. a11oy-runtime
 * `evaluate()`) that want to publish without an HTTP round trip. Uses
 * the same ReceiptChain + persistence + broadcast as POST /publish.
 */
export async function publishYawarEvent(opts: {
  topic: string;
  payload: unknown;
  signer?: string;
}): Promise<PersistedEvent> {
  if (!TOPIC_RE.test(opts.topic)) {
    throw new Error(`yawar: invalid topic "${opts.topic}"`);
  }
  return publishOnce(opts.topic, opts.payload, opts.signer);
}

export default router;
