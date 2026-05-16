/**
 * Canonical JSON hashing helper. Re-exported from @szl-holdings/szl-receipts
 * so the SDK and the receipt chain share one hash identity — the
 * `Idempotency-Key` attached to a write request is the same SHA-256 as
 * the `paramsHash` recorded in the corresponding receipt row.
 */
export { canonicalJson, sha256Hex, hashJson } from '@szl-holdings/szl-receipts';
