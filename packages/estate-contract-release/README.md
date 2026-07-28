# Estate contract release

This package creates one deterministic identity for the cross-estate contracts
owned by `szl-holdings/platform`:

- the canonical `@szl-holdings/design-system` source and tokens;
- the canonical OpenAPI specification and generator configuration;
- the present React and Zod generated-client outputs, including the React
  client's exported entrypoint and runtime request/mutator sources; and
- the canonical `@szl-holdings/shared-contracts` types.

`manifest.json` inventories every byte in those allowlisted roots. Its
`release_id` is a SHA-256 digest over the complete component inventories and
the consumer rules. No registry publication, production deployment, or
cross-repository adoption is inferred from the hash closure.

Consumers must pin a protected Platform Git revision, download the manifest
from that immutable revision, recompute the file and component digests, and
record the manifest `release_id` in their own source-bound release evidence.

```bash
pnpm --filter @szl-holdings/estate-contract-release build
pnpm --filter @szl-holdings/estate-contract-release test
```
