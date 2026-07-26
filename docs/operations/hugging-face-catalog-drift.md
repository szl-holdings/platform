# Hugging Face Public Catalog Drift

The tracked Hugging Face snapshot is a reproducible inventory receipt, not a
deployment or model-quality claim.

## Evidence boundary

- The repository blocks changes only on deterministic tests and structural
  validation of `artifacts/huggingface-public-catalog.snapshot.json`.
- A scheduled advisory job queries the public Hugging Face API and compares
  exact asset IDs with that snapshot.
- The live probe follows every `rel="next"` cursor link. A full response page
  without a next link is rejected as incomplete instead of being counted as the
  full estate.
- Catalog drift and upstream availability do not fail product CI. They are
  evidence that the snapshot needs an intentional, reviewed refresh.
- Catalog presence does not prove that a model has weights, a Space serves
  successfully, a dataset has admitted training rights, or a Kernel has
  execution and performance receipts.
- `replit-sync/HF_ASSET_MANIFEST.json` is retained as a **HISTORICAL** design
  manifest. Its counts describe declared entries and are not live Hub counts.

## Commands

```text
node --test tools/hf-catalog/catalog.test.mjs
node tools/hf-catalog/catalog.mjs --check
node tools/hf-catalog/catalog.mjs --probe-live
node tools/hf-catalog/catalog.mjs --refresh
```

`--refresh` is intentionally manual. Review every added or removed asset ID
before committing a new snapshot.

## Maturity labels

- Tracked snapshot: **MEASURED** at its recorded `observedAt` timestamp.
- Scheduled comparison: **MEASURED** only when the API probe completes.
- Probe failure: **UNAVAILABLE**, never treated as zero assets.
- Asset readiness, model quality, live inference, and publication state:
  outside this catalog check and unchanged.
