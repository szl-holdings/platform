# @szl-holdings/szl-receipts

Λ-receipt chain primitive — SHA-256 linked `LambdaReceipt[]` with Merkle root
and audit-closure receipts. Shared between `@szl-holdings/sdk` and
`@workspace/aef-sdk` so the `Idempotency-Key` header attached to a write
request is the same SHA-256 as the `paramsHash` recorded in the corresponding
receipt row — one hash identity, two purposes.

## Surface

```ts
import { ReceiptChain, hashJson, merkleRoot } from '@szl-holdings/szl-receipts';

const chain = new ReceiptChain({ operatorId: 'me@szlholdings.com' });
await chain.append({ endpoint: '/v1/portfolio', method: 'POST', params: { foo: 1 } });
const root = await chain.merkleRoot();
const closure = await chain.close(); // AuditClosureReceipt
```

## Provenance

This package was created fresh per the surface specified in
`attached_assets/Pasted--SDK-Deep-Dive-Innovation-Evolution-Memo-Author-Stephen_1778908858842.txt`
(§4.1).

The original SDK memo proposed extracting from
`packages/a11oy-cli/src/receipts/chain.ts` and re-exporting from the same
path. That file does not exist in the current tree (verified — `a11oy-cli/src/`
contains only `client.ts`, `cli.ts`, `envelope.ts`, `mcp/`, `output.ts`, and
no file under any package imports `LambdaReceipt` or `ReceiptChain`). No
compatibility re-export is needed: nothing in the workspace currently
depends on the old path, so a fresh implementation matching the memo's
required surface (`LambdaReceipt`, `ReceiptChain`, `merkleRoot()`, `close() →
AuditClosureReceipt`) is sufficient. Crypto stays within the memo's
constraints: SHA-256 + optional ed25519 signer hook only.

## Cited primitives

- v1/v2 receipts-as-product — 10.5281/zenodo.19867281 / 19934129
- v9 deterministic replay — 10.5281/zenodo.20053148
- v10 Λ-Ω audit-closure — 10.5281/zenodo.20053163
