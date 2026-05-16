/**
 * @szl-holdings/szl-receipts — Λ-receipt chain primitive.
 *
 * SHA-256-linked LambdaReceipt[] with Merkle root and audit-closure
 * receipts. Extracted from the a11oy-cli receipts layer so both
 * @szl-holdings/sdk and @workspace/aef-sdk can share the exact same
 * provenance model.
 *
 * No cryptography beyond SHA-256 (and ed25519 if a signer is supplied).
 */

export type {
  LambdaReceipt,
  AuditClosureReceipt,
  ReceiptStorage,
  ReceiptChainOptions,
  AppendInput,
} from './types.js';

export { canonicalJson, sha256Hex, hashJson } from './hash.js';
export { merkleRoot } from './merkle.js';
export { ReceiptChain } from './chain.js';
