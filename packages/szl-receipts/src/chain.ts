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
 */
export class ReceiptChain {
  private readonly storage: ReceiptStorage;
  private readonly operatorId: string;
  private readonly signer?: (selfHash: string) => string | Promise<string>;
  private cache: LambdaReceipt[] = [];
  private loaded = false;
  private closed = false;

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

  /** Append a receipt row. Returns the appended row. */
  async append(input: AppendInput): Promise<LambdaReceipt> {
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
  }

  /**
   * Append a pre-built receipt row directly. Used by `StreamSession` so
   * stream-chunk receipts (whose `paramsHash` is computed from raw bytes,
   * not from `hashJson(params)`) can still flow through the same storage
   * and Merkle root as ordinary receipts. The caller MUST have already
   * computed `seq`, `prevHash`, and `selfHash` consistently with the
   * current chain head; otherwise `verify()` will report a break.
   */
  async appendRaw(receipt: LambdaReceipt): Promise<LambdaReceipt> {
    if (this.closed) throw new Error('ReceiptChain: cannot append to a closed chain');
    await this.ensureLoaded();
    await this.storage.append(receipt);
    this.cache.push(receipt);
    return receipt;
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
  async close(): Promise<AuditClosureReceipt> {
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
