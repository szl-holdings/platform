# Evidence Steward source fixtures

These are exact public platform and Forge source files for an offline,
source-only replay. They are not a live Hugging Face census, artifact-byte
verification, model evaluation, or promotion decision. The four source bindings
are a curated subset of the model-type repository IDs described in Forge's
metadata audit.

Observed public Forge `main` commit: `53287761f823c3b5114e3e741b17568229688331`.

| Fixture | Forge path | Git blob SHA-1 |
|---|---|---|
| `model-source-bindings.json` | `publishing/model-source-bindings.json` | `3f59306bf19d0ecd3321c5243b1f3dc55cc85385` |
| `model_portfolio.json` | `portfolio/model_portfolio.json` | `151ce1e4c1ca9fb3096793a192b2599f4b454575` |

`huggingface-public-catalog.snapshot.json` is the complete historical platform
snapshot, copied byte for byte from
`audit/evidence/huggingface-public-catalog.snapshot.json` at platform commit
`f2f8df6f89056e9104587674ccec0855dd5b177a`, including its datasets, spaces and
terminal newline.

| Identity | Value |
|---|---|
| Git blob SHA-1 | `67300a17f2255f7e10cd23eed4cb0dfed597ff29` |
| Raw file SHA-256 (3,449 bytes) | `640d53f9cccace100f64455a9151c8636d59227d38d9f8992fbd3613b6f0605a` |
| Canonical JSON SHA-256 | `638f73ca32d148d98c8421685f06c0a94cb93b26536306ed264d8b03b9eee31c` |
| `observedAt` | `2026-08-20T09:51:06.037Z` |
| Assets | 17 models, 27 datasets, 26 spaces |

The model list intentionally includes `SZLHOLDINGS/SZLHOLDINGS`, which the
replay reports as `UNKNOWN`. Replay at `2026-10-02T00:00:00.000Z` is 42
complete days after observation, so the steward correctly treats that inventory
as stale. The tracked root catalog at that path is refreshed independently
(see the [dated source](https://github.com/szl-holdings/platform/blob/aaa5417bd9a1fe755a5eaaa4e45bb29c8940370c/audit/evidence/huggingface-public-catalog.snapshot.json));
it is not a replacement for this fixture and the replay never reads it. The historical
`replit-sync/HF_ASSET_MANIFEST.json` is not a current inventory source.

Fixture content was copied from the connected GitHub repository at the pinned
commit. No model files, credentials, remote calls, or execution receipts are
included. Repository-declared signed receipts establish only the stated key
continuity scope; Khipu GGUF runtime records remain unsigned. Lambda unconditional
uniqueness remains Conjecture 1, open and not a theorem.
