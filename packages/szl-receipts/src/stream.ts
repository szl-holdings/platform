/**
 * Per-chunk receipt streaming primitive.
 *
 * A `StreamSession` records one `LambdaReceipt` per emitted chunk
 * (`paramsHash` = sha256 of the chunk's raw bytes) and folds them at
 * end-of-stream into a `StreamClosureReceipt` over the contiguous seq
 * range that belongs to this stream.
 *
 * The session never closes the underlying chain — multiple streams can
 * coexist on the same `ReceiptChain`, and per-call receipts can be
 * interleaved with per-chunk ones. The closure is the auditable artifact
 * that lets a verifier offline-check:
 *   1. that no chunk receipt was removed or reordered (Merkle root mismatch),
 *   2. that no chunk's bytes were altered (paramsHash mismatch),
 *   3. whether the consumer aborted vs. completed (`reason` field).
 */
import type {
  LambdaReceipt,
  StreamClosureReceipt,
} from './types.js';
import { canonicalJson, hashJson, sha256Hex, sha256HexBytes } from './hash.js';
import { merkleRoot } from './merkle.js';
import type { ReceiptChain } from './chain.js';

const ZERO_HASH = '0'.repeat(64);

export interface StreamSessionOptions {
  chain: ReceiptChain;
  streamId: string;
  endpoint: string;
  method: string;
  /** Caller-supplied params for the opening request (recorded as metadata.openParams on each chunk receipt). */
  params: unknown;
  operatorId: string;
}

/** Convert a chunk to its canonical raw-byte form before hashing. */
function bytesOf(chunk: Uint8Array | string): Uint8Array {
  if (typeof chunk === 'string') return new TextEncoder().encode(chunk);
  return chunk;
}

/**
 * Tracks the per-stream receipt window and folds it on close.
 * Construct one per logical stream; call `appendChunk` per emitted chunk,
 * then `close('end' | 'abort')` exactly once.
 */
export class StreamSession {
  private readonly chain: ReceiptChain;
  private readonly streamId: string;
  private readonly endpoint: string;
  private readonly method: string;
  /** sha256 of the opening request params — recorded as metadata.openParamsHash on every chunk receipt so a verifier can attribute chunks to the originating request. */
  private readonly openParamsHash: string;
  private readonly operatorId: string;
  private readonly emitted: LambdaReceipt[] = [];
  private chunkIndex = 0;
  private closed = false;

  constructor(opts: StreamSessionOptions) {
    this.chain = opts.chain;
    this.streamId = opts.streamId;
    this.endpoint = opts.endpoint;
    this.method = opts.method;
    this.openParamsHash = hashJson(opts.params);
    this.operatorId = opts.operatorId;
  }

  /**
   * Append one chunk receipt. `paramsHash` is computed from the raw bytes
   * so any tampering downstream is detectable by the closure.
   *
   * `extraMetadata` is merged in alongside the streamId/chunkIndex bookkeeping.
   *
   * Runs through `ReceiptChain.appendChunkReceipt`, which serializes against
   * all other writers on the same chain so concurrent ordinary `append`s
   * and stream chunks can never duplicate `seq` or `prevHash`.
   */
  async appendChunk(
    bytes: Uint8Array | string,
    extraMetadata?: Record<string, unknown>,
  ): Promise<LambdaReceipt> {
    if (this.closed) throw new Error('StreamSession: cannot append to a closed stream');
    const raw = bytesOf(bytes);
    // sha256 of the raw chunk bytes — no UTF-8 round-trip. Any single
    // byte mutation (including non-UTF-8 noise) localizes to that
    // chunk's paramsHash and propagates to the closure's Merkle root.
    const paramsHash = sha256HexBytes(raw);
    const idx = this.chunkIndex++;
    const row = await this.chain.appendChunkReceipt({
      endpoint: this.endpoint,
      method: this.method,
      paramsHash,
      metadata: {
        ...(extraMetadata ?? {}),
        streamId: this.streamId,
        chunkIndex: idx,
        openParamsHash: this.openParamsHash,
        kind: 'stream-chunk',
      },
    });
    this.emitted.push(row);
    return row;
  }

  /** Number of chunks appended so far. */
  get length(): number {
    return this.emitted.length;
  }

  /** Snapshot of the receipts emitted by this stream so far. */
  receipts(): LambdaReceipt[] {
    return this.emitted.slice();
  }

  /**
   * Fold the per-chunk receipts into a `StreamClosureReceipt`. Safe to call
   * with zero chunks (returns a closure with chainLength=0 and zero hashes).
   * `reason` distinguishes a clean end-of-stream from a consumer abort.
   */
  close(reason: 'end' | 'abort'): StreamClosureReceipt {
    if (this.closed) throw new Error('StreamSession: already closed');
    this.closed = true;
    const first = this.emitted[0];
    const last = this.emitted[this.emitted.length - 1];
    const root = merkleRoot(this.emitted.map((r) => r.selfHash));
    const skeleton = {
      closureTs: new Date().toISOString(),
      operatorId: this.operatorId,
      chainLength: this.emitted.length,
      firstReceiptHash: first ? first.selfHash : ZERO_HASH,
      lastReceiptHash: last ? last.selfHash : ZERO_HASH,
      merkleRoot: root,
      streamId: this.streamId,
      firstSeq: first ? first.seq : -1,
      lastSeq: last ? last.seq : -1,
      reason,
    };
    const selfHash = sha256Hex(canonicalJson(skeleton));
    return { ...skeleton, selfHash };
  }
}

/**
 * Parse a fetch `Response` body as Server-Sent Events. Yields one frame
 * object per `event:`/`data:` block, plus the raw bytes of the `data`
 * payload (so callers can hash exactly what came off the wire).
 */
export interface SSEFrame {
  event: string;
  data: string;
  rawBytes: Uint8Array;
}

export async function* parseSSE(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<SSEFrame, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buf = '';
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
      const { value, done } = await reader.read();
      if (done) {
        if (buf.trim().length > 0) {
          const frame = parseFrame(buf);
          if (frame) yield frame;
        }
        return;
      }
      // Normalize CRLF → LF so the rest of the parser only handles one line ending.
      buf += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let sep: number;
      while ((sep = buf.indexOf('\n\n')) !== -1) {
        const block = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        const frame = parseFrame(block);
        if (frame) yield frame;
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
}

function parseFrame(block: string): SSEFrame | null {
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
  }
  if (dataLines.length === 0) return null;
  const data = dataLines.join('\n');
  return { event, data, rawBytes: new TextEncoder().encode(data) };
}

/**
 * Helper for tests / non-HTTP transports: wrap an async iterable of raw
 * chunk bytes into a typed stream with per-chunk receipts and a final
 * closure receipt. Mid-iteration abort yields a closure with `reason: 'abort'`.
 */
export interface StreamWithReceiptsOptions<TChunk> {
  chain: ReceiptChain;
  operatorId: string;
  streamId: string;
  endpoint: string;
  method: string;
  params: unknown;
  source: AsyncIterable<{ rawBytes: Uint8Array; data: string; event: string }>;
  parseChunk: (data: string) => TChunk;
  /** Predicate for whether a frame should be folded into the receipt chain. Default: only `event === 'chunk'`. */
  isChunkFrame?: (frame: { event: string }) => boolean;
}

export interface ReceiptedStream<TChunk> extends AsyncIterable<TChunk> {
  /** Resolves after the iterator has been fully consumed or aborted. */
  readonly closure: Promise<StreamClosureReceipt>;
}

export function streamWithReceipts<TChunk>(
  opts: StreamWithReceiptsOptions<TChunk>,
): ReceiptedStream<TChunk> {
  const isChunk = opts.isChunkFrame ?? ((f) => f.event === 'chunk');
  const session = new StreamSession({
    chain: opts.chain,
    streamId: opts.streamId,
    endpoint: opts.endpoint,
    method: opts.method,
    params: opts.params,
    operatorId: opts.operatorId,
  });
  let resolveClosure!: (c: StreamClosureReceipt) => void;
  let rejectClosure!: (e: unknown) => void;
  const closure = new Promise<StreamClosureReceipt>((res, rej) => {
    resolveClosure = res;
    rejectClosure = rej;
  });

  async function* gen(): AsyncGenerator<TChunk, void, void> {
    let reason: 'end' | 'abort' = 'abort';
    try {
      for await (const frame of opts.source) {
        if (!isChunk(frame)) continue;
        await session.appendChunk(frame.rawBytes);
        yield opts.parseChunk(frame.data);
      }
      reason = 'end';
    } finally {
      try {
        resolveClosure(session.close(reason));
      } catch (err) {
        rejectClosure(err);
      }
    }
  }

  const iter = gen();
  return Object.assign(iter, { closure });
}
