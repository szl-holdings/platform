/**
 * Λ-receipt types. A LambdaReceipt is one append-only row capturing a
 * single tool/API call with content-addressed parameters, a SHA-256 link
 * to the previous receipt, and (optionally) an ed25519 operator signature.
 */
export interface LambdaReceipt {
  /** Monotonic sequence number within the chain. */
  seq: number;
  /** ISO-8601 timestamp of the call. */
  ts: string;
  /** Endpoint / tool name (e.g. POST /v1/portfolio). */
  endpoint: string;
  /** HTTP method (or `tool` for non-HTTP). */
  method: string;
  /** SHA-256 of the canonical JSON of the call parameters. */
  paramsHash: string;
  /** SHA-256 of the canonical JSON of the response (if recorded). */
  resultHash?: string;
  /** Operator identity recorded at append time. */
  operatorId: string;
  /** Optional ed25519 signature over `selfHash`. */
  agentSignature?: string;
  /** SHA-256 of the previous receipt's `selfHash`. "0..0" for seq=0. */
  prevHash: string;
  /** SHA-256 of this row's canonical JSON sans `selfHash`. */
  selfHash: string;
  /** Arbitrary structured metadata (tenant, region, status code, etc.). */
  metadata?: Record<string, unknown>;
}

/**
 * Audit-closure receipt (Λ-Ω). Returned by `ReceiptChain.close()` and
 * seals the chain with its Merkle root + length so an auditor can verify
 * offline that no rows were added or removed after closure.
 */
export interface AuditClosureReceipt {
  closureTs: string;
  operatorId: string;
  chainLength: number;
  firstReceiptHash: string;
  lastReceiptHash: string;
  merkleRoot: string;
  /** SHA-256 of the canonical JSON of all closure fields above. */
  selfHash: string;
}

export interface ReceiptStorage {
  /** Append a single receipt row. Implementations MUST be append-only. */
  append(receipt: LambdaReceipt): Promise<void> | void;
  /** Read the full chain in seq order. */
  readAll(): Promise<LambdaReceipt[]> | LambdaReceipt[];
}

export interface ReceiptChainOptions {
  operatorId: string;
  storage?: ReceiptStorage;
  /** Optional ed25519 signer over `selfHash`. Returns hex signature. */
  signer?: (selfHash: string) => string | Promise<string>;
}

export interface AppendInput {
  endpoint: string;
  method: string;
  params: unknown;
  result?: unknown;
  metadata?: Record<string, unknown>;
}
