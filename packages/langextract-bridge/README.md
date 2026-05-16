# @workspace/langextract-bridge

Doctrine-clean TypeScript bridge to [google/langextract](https://github.com/google/langextract) (Apache-2.0).

## Why this exists

`google/langextract` is a Python library for LLM-driven structured extraction with precise source grounding. We want its extraction quality for ingestor pipelines (e.g. AGI-forecast citation extraction) **without** breaking Doctrine V6:

- **5× byte-identical replay** — LLM output is non-deterministic, so we wrap every call in a content-addressed cache keyed by `sha256(model + promptDescription + examples + sourceText)`. Replays read from cache; cache misses are a hard error unless `mode: 'live'` is explicitly passed.
- **License allowlist** — langextract is Apache-2.0 ✅; we ship no vendored copy.
- **PUBLIC-ONLY ingestion** — caller is responsible for ensuring `sourceText` is public.
- **No bandaids** — a cache miss in default (cache-only) mode throws `LangExtractCacheMissError`. We do not silently re-run the model.

## Usage

```ts
import { extract } from '@workspace/langextract-bridge';

// Deterministic: reads from cache, throws if missing
const result = await extract(request, { cacheDir: './.cache/langextract' });

// Refresh cache (requires LANGEXTRACT_API_KEY or GOOGLE_API_KEY)
const fresh = await extract(request, { cacheDir: './.cache/langextract', mode: 'live' });
```

## Sidecar setup (live mode only)

```bash
pip install langextract
export LANGEXTRACT_API_KEY=...   # or GOOGLE_API_KEY for Gemini
```

The TypeScript wrapper spawns `python3 src/python/extract.py` and communicates over stdin/stdout JSON. No keys are read or printed by this package.

---
© 2026 Lutar, Stephen P. — SZL Holdings
ORCID: 0009-0001-0110-4173 · CC-BY-4.0 (docs) · Apache-2.0 (code)
