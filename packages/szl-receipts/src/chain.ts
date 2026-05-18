import type {
  AppendInput,
  AuditClosureReceipt,
  LambdaReceipt,
  ReceiptChainOptions,
  ReceiptStorage,
} from './types.js';
import { canonicalJson, hashJson, sha256Hex } from './hash.js';
import { merkleRoot } from './merkle.js';

const ZERO_HASH = '0'.repeat(64);

class InMemoryStorage implements ReceiptStorage {
  private rows: LambdaReceipt[] = [];
  append(receipt: LambdaReceipt): void {
    this.rows.push(receipt);
  }
  readAll(): LambdaReceipt[] {
    return this.rows.slice();
  }
}

/**
 * Append-only Λ-receipt chain. Each appended row is SHA-256-linked to its
 * predecessor via `prevHash`, and content-addresses its call parameters via
 * `paramsHash`. `close()` returns an `AuditClosureReceipt` that seals the
 * chain with its Merkle root.
 *
 * All writes (`append`, `appendChunkReceipt`) go through a single-flight
 * promise queue, so concurrent callers can never observe the same `prevHash`
 * twice. This matters when ordinary calls and `StreamSession` chunk receipts
 * race on the same chain.
 */
export class ReceiptChain {
  private readonly storage: ReceiptStorage;
  private readonly operatorId: string;
  private readonly signer?: (selfHash: string) => string | Promise<string>;
  private cache: LambdaReceipt[] = [];
  private loaded = false;
  private closed = false;
  /** Single-flight write queue. Each enqueued function runs after the
   * previous one fully resolves, so seq/prevHash are computed atomically. */
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(options: ReceiptChainOptions) {
    this.operatorId = options.operatorId;
    this.storage = options.storage ?? new InMemoryStorage();
    if (options.signer) this.signer = options.signer;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    const all = await this.storage.readAll();
    this.cache = all.slice().sort((a, b) => a.seq - b.seq);
    this.loaded = true;
  }

  /** Serialize an async writer against any in-flight write. */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.writeQueue.then(() => fn(), () => fn());
    this.writeQueue = run.catch(() => {
      /* swallow so future enqueues continue past prior failures */
    });
    return run;
  }

  /** Append a receipt row. Returns the appended row. */
  append(input: AppendInput): Promise<LambdaReceipt> {
    return this.enqueue(async () => {
      if (this.closed) throw new Error('ReceiptChain: cannot append to a closed chain');
      await this.ensureLoaded();

      const prev = this.cache[this.cache.length - 1];
      const seq = prev ? prev.seq + 1 : 0;
      const prevHash = prev ? prev.selfHash : ZERO_HASH;

      const skeleton: Omit<LambdaReceipt, 'selfHash' | 'agentSignature'> = {
        seq,
        ts: new Date().toISOString(),
        endpoint: input.endpoint,
        method: input.method,
        paramsHash: hashJson(input.params),
        ...(input.result !== undefined ? { resultHash: hashJson(input.result) } : {}),
        operatorId: this.operatorId,
        prevHash,
        ...(input.metadata ? { metadata: input.metadata } : {}),
      };

      const selfHash = sha256Hex(canonicalJson(skeleton));
      const receipt: LambdaReceipt = { ...skeleton, selfHash };
      if (this.signer) {
        receipt.agentSignature = await this.signer(selfHash);
      }

      await this.storage.append(receipt);
      this.cache.push(receipt);
      return receipt;
    });
  }

  /**
   * Append a stream-chunk receipt whose `paramsHash` was pre-computed from
   * raw bytes (rather than `hashJson(params)`). Used by `StreamSession`.
   * Runs through the same write queue as `append`, so concurrent stream
   * chunks and ordinary calls cannot collide on `seq`/`prevHash`.
   */
  appendChunkReceipt(input: {
    endpoint: string;
    method: string;
    paramsHash: string;
    metadata?: Record<string, unknown>;
  }): Promise<LambdaReceipt> {
    return this.enqueue(async () => {
      if (this.closed) throw new Error('ReceiptChain: cannot append to a closed chain');
      await this.ensureLoaded();

      const prev = this.cache[this.cache.length - 1];
      const seq = prev ? prev.seq + 1 : 0;
      const prevHash = prev ? prev.selfHash : ZERO_HASH;

      const skeleton: Omit<LambdaReceipt, 'selfHash' | 'agentSignature'> = {
        seq,
        ts: new Date().toISOString(),
        endpoint: input.endpoint,
        method: input.method,
        paramsHash: input.paramsHash,
        operatorId: this.operatorId,
        prevHash,
        ...(input.metadata ? { metadata: input.metadata } : {}),
      };

      const selfHash = sha256Hex(canonicalJson(skeleton));
      const receipt: LambdaReceipt = { ...skeleton, selfHash };
      if (this.signer) {
        receipt.agentSignature = await this.signer(selfHash);
      }

      await this.storage.append(receipt);
      this.cache.push(receipt);
      return receipt;
    });
  }

  /** Return the full chain (load from storage if not yet cached). */
  async readAll(): Promise<LambdaReceipt[]> {
    await this.ensureLoaded();
    return this.cache.slice();
  }

  /** SHA-256 Merkle root over every receipt's `selfHash`. */
  async merkleRoot(): Promise<string> {
    await this.ensureLoaded();
    return merkleRoot(this.cache.map((r) => r.selfHash));
  }

  /** Seal the chain. Subsequent `append` calls throw. */
  close(): Promise<AuditClosureReceipt> {
    return this.enqueue(async () => {
      await this.ensureLoaded();
      const root = merkleRoot(this.cache.map((r) => r.selfHash));
      const first = this.cache[0];
      const last = this.cache[this.cache.length - 1];
      const skeleton = {
        closureTs: new Date().toISOString(),
        operatorId: this.operatorId,
        chainLength: this.cache.length,
        firstReceiptHash: first ? first.selfHash : ZERO_HASH,
        lastReceiptHash: last ? last.selfHash : ZERO_HASH,
        merkleRoot: root,
      };
      const selfHash = sha256Hex(canonicalJson(skeleton));
      this.closed = true;
      return { ...skeleton, selfHash };
    });
  }

  /** Verify SHA-256 link integrity across the whole chain. */
  async verify(): Promise<{ valid: boolean; brokenAt?: number; reason?: string }> {
    await this.ensureLoaded();
    let expectedPrev = ZERO_HASH;
    for (let i = 0; i < this.cache.length; i++) {
      const r = this.cache[i]!;
      if (r.seq !== i) return { valid: false, brokenAt: i, reason: 'seq-mismatch' };
      if (r.prevHash !== expectedPrev)
        return { valid: false, brokenAt: i, reason: 'prev-hash-mismatch' };
      const { selfHash, agentSignature, ...rest } = r;
      void agentSignature;
      const recomputed = sha256Hex(canonicalJson(rest));
      if (recomputed !== selfHash)
        return { valid: false, brokenAt: i, reason: 'self-hash-mismatch' };
      expectedPrev = selfHash;
    }
    return { valid: true };
  }
}
