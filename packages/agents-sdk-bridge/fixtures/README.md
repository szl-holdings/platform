# Evidence Steward source fixtures

These are exact public Forge source files for an offline, source-only replay. They
are not a live Hugging Face census, artifact-byte verification, model evaluation,
or promotion decision. The four source bindings are a curated subset of the
model-type repository IDs described in Forge's metadata audit.

Observed public Forge `main` commit: `53287761f823c3b5114e3e741b17568229688331`.

| Fixture | Forge path | Git blob SHA-1 |
|---|---|---|
| `model-source-bindings.json` | `publishing/model-source-bindings.json` | `3f59306bf19d0ecd3321c5243b1f3dc55cc85385` |
| `model_portfolio.json` | `portfolio/model_portfolio.json` | `151ce1e4c1ca9fb3096793a192b2599f4b454575` |

The demo reads the existing platform snapshot at
`audit/evidence/huggingface-public-catalog.snapshot.json`, pinned to platform
source commit `f2f8df6f89056e9104587674ccec0855dd5b177a`. Its pinned Git
blob SHA-1 is `67300a17f2255f7e10cd23eed4cb0dfed597ff29`. The snapshot records
`observedAt=2026-08-20T09:51:06.037Z`; replay at `2026-10-02T00:00:00.000Z`
correctly treats that inventory as stale. The historical
`replit-sync/HF_ASSET_MANIFEST.json` is not a current inventory source.

Fixture content was copied from the connected GitHub repository at the pinned
commit. No model files, credentials, remote calls, or execution receipts are
included. Repository-declared signed receipts establish only the stated key
continuity scope; Khipu GGUF runtime records remain unsigned. Lambda unconditional
uniqueness remains Conjecture 1, open and not a theorem.
