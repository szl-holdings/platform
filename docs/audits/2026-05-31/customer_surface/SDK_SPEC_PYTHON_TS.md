# SDK_SPEC_PYTHON_TS — `szl-python` and `szl-js`/`szl-ts`

**Layer:** PURIQ v12 customer surface · **Author:** Yachay (CTO authority) · **Date:** 2026-06-01
**Status discipline:** spec + patch. v11 LOCKED numbers preserved verbatim (749 / 14 / 163 / 13-axis
`yuyay_v3` / replay hash `bacf5443…631fc5` / `lutar-v18.0.0` @ `c7c0ba17`). Khipu signature = cosign
PLACEHOLDER; `chainVerified` reflects hash-chain only. NO mock.

---

## 0 — Shape of the SDKs

Two packages, one mental model. Each exposes **one client** with **five flagship modules**, each module
mapping 1:1 to a flagship's OpenAPI 3.1 spec (OPENAPI_SPECS_PER_FLAGSHIP.md):

```
client.a11oy      -> /api/a11oy   (router / reason / brain)
client.amaru      -> /api/amaru   (ingest / recall / summarize)
client.sentra     -> /api/sentra  (screen / scan)
client.killinchu  -> /api/killinchu (fleet / track / cue / audit)
client.rosie      -> /api/rosie   (mission.evolve / jack / mesh)
```

Every successful response carries a `khipu_receipt` (Python) / `khipuReceipt` (TS). A response where
`khipu_receipt.chain_verified is False` **or** `khipu_receipt.hukla_check.tripwire == "T01"` raises a
typed `HaltError` — the SDK enforces the caller-obligation from the router contract (`isHalt()`), so a
customer can never accidentally act on a halted response.

**Auto-generation:** the low-level transport + models are generated from the OpenAPI specs
(`openapi-python-client`, `openapi-typescript-codegen`); the hand-written ergonomic layer wraps them. A
spec change regenerates `_gen/`, and the ergonomic wrapper surfaces any breaking diff in review.

---

## 1 — `szl-python`

### Install
```bash
pip install szl            # PyPI package name: szl  (namespace: SZLHOLDINGS)
```
- Requires Python ≥ 3.9. Deps: `httpx` (sync+async), `pydantic` v2 (models).

### Init
```python
from szl import SZL
client = SZL(api_key="szl_live_...")        # or env SZL_API_KEY
# base_url defaults to https://api.szlholdings.com ; override for HF-direct or on-prem:
# SZL(api_key=..., base_url="https://szlholdings-vessels.hf.space/api")
```

### Every flagship as a client module (sync)
```python
client.a11oy.router(organ="amaru", task_class="reasoning", messages=[...])
client.amaru.ingest(source="incident-441", payload={...})
client.amaru.summarize(incident_id="441")
client.sentra.screen(payload="DROP TABLE users; --")
client.killinchu.fleet()
client.killinchu.track(target_id="MMSI:477...", kind="vessel")
client.killinchu.cue(bbox="-117.3,32.5,-117.0,32.8")     # ATAK CoT
client.rosie.mission_evolve(goal="surveil sector 7", generations=3)
```

### async/await
```python
import asyncio
from szl import AsyncSZL

async def main():
    async with AsyncSZL(api_key="szl_live_...") as client:
        fleet = await client.killinchu.fleet()
        print(fleet.khipu_receipt.chain_verified)

asyncio.run(main())
```

### streaming (router + summarize support SSE)
```python
for chunk in client.a11oy.router_stream(organ="a11oy", task_class="code",
                                        messages=[{"role":"user","content":"refactor this"}]):
    print(chunk.delta, end="", flush=True)
# final chunk carries chunk.khipu_receipt
```

### error handling (typed)
```python
from szl.errors import HaltError, RateLimitError, AuthError, QuotaAdvisory
try:
    r = client.sentra.screen(payload="<script>alert(1)</script>")
except HaltError as e:                 # HUKLLA tripwire or chain_verified False
    print("HALTED:", e.tripwire, e.receipt_id)   # do NOT act on any content
except RateLimitError as e:            # 429 hard ceiling
    print("backoff", e.retry_after)
except QuotaAdvisory as e:             # 402 soft over-quota (still served)
    print("over soft quota; still served. usage:", e.calls_this_period)
except AuthError:
    print("bad/revoked key")
```

### Package & publish (PyPI under SZLHOLDINGS namespace)
```toml
# pyproject.toml
[project]
name = "szl"
version = "1.0.0"
description = "Official Python SDK for SZL Holdings flagships (governed agentic AI)."
authors = [{ name = "SZL Holdings", email = "sdk@szlholdings.com" }]
requires-python = ">=3.9"
dependencies = ["httpx>=0.27", "pydantic>=2"]
[project.urls]
Homepage = "https://docs.szlholdings.com"
Source = "https://github.com/szl-holdings/szl-python"
```
```bash
python -m build && twine upload dist/*   # run on dev box; NEVER GitHub Actions (HfApi-only push rule
                                         # applies to HF; PyPI publish is manual/keyring-signed)
```

---

## 2 — `szl-ts` (published as `@szlholdings/szl`)

### Install
```bash
npm install @szlholdings/szl     # works in Node 18+, Deno, Bun, and the browser (fetch)
```

### Init
```ts
import { SZL } from "@szlholdings/szl";
const client = new SZL({ apiKey: process.env.SZL_API_KEY! });
// baseUrl defaults to https://api.szlholdings.com
```

### Every flagship module (async/await native)
```ts
const fleet = await client.killinchu.fleet();
const track = await client.killinchu.track({ targetId: "UAS:abc", kind: "drone" });
const sum   = await client.amaru.summarize({ incidentId: "441" });
const route = await client.a11oy.router({ organ: "a11oy", taskClass: "code",
                                          messages: [{ role: "user", content: "..." }] });
console.log(fleet.khipuReceipt.chainVerified);
```

### streaming (async iterator)
```ts
for await (const chunk of client.a11oy.routerStream({ organ: "rosie", taskClass: "reasoning",
                                                      messages: [{ role: "user", content: "..." }] })) {
  process.stdout.write(chunk.delta);
}
```

### error handling
```ts
import { HaltError, RateLimitError, QuotaAdvisory, AuthError } from "@szlholdings/szl";
try {
  await client.sentra.screen({ payload: "rm -rf /" });
} catch (e) {
  if (e instanceof HaltError) console.error("HALT", e.tripwire, e.receiptId);
  else if (e instanceof RateLimitError) console.error("retry after", e.retryAfter);
  else if (e instanceof QuotaAdvisory) console.warn("over soft quota, still served");
  else if (e instanceof AuthError) console.error("bad key");
}
```

### Package & publish (npm under @szlholdings)
```json
{
  "name": "@szlholdings/szl",
  "version": "1.0.0",
  "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "repository": "github:szl-holdings/szl-ts",
  "homepage": "https://docs.szlholdings.com"
}
```
```bash
npm publish --access public    # run on dev box; @szlholdings scope, manual 2FA. No GitHub Actions.
```

---

## 3 — Shared behaviors (both SDKs)

- **Khipu enforcement.** Both SDKs implement `isHalt(receipt)` (router-contract §"Caller obligation") and
  raise `HaltError` so the receipt gate is impossible to bypass accidentally.
- **Receipt surfacing.** Every method returns `.khipu_receipt` / `.khipuReceipt`; a helper
  `client.verify_receipt_chain(receipt)` recomputes `continuum_hash` locally so customers can audit
  byte-for-byte.
- **Replay-hash constant.** Both ship `SZL.REPLAY_HASH ==
  "bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5"` for client-side gate replay checks.
- **Retries.** Idempotent GETs retry with jittered backoff up to 3×; POSTs never auto-retry (respects the
  bounded action space / no unbounded retry, mirroring the HUKLLA fallback walk).
- **Honest labels in `__doc__`.** SDK docstrings state cosign signature = PLACEHOLDER and `chain_verified`
  = hash-chain only.

---

## 4 — Auto-generation pipeline

```bash
# from OPENAPI_SPECS_PER_FLAGSHIP.md section 5
openapi-python-client generate --path openapi_specs/killinchu.openapi.json \
  --meta none --output-path szl-python/src/szl/_gen/killinchu
npx openapi-typescript-codegen --input openapi_specs/killinchu.openapi.json \
  --output szl-ts/src/_gen/killinchu --client fetch --useOptions
```
Ergonomic wrappers (`szl/killinchu.py`, `src/killinchu.ts`) are hand-written thin façades over `_gen/`.
A reference Python wrapper ships in `sdk_samples/szl_killinchu.py`; a TS wrapper in
`sdk_samples/szl_killinchu.ts`.

---

## 5 — Patch files (NOT pushed by authoring step)

| File | Target |
|---|---|
| `sdk_samples/szl_killinchu.py` | reference for `szl-holdings/szl-python` |
| `sdk_samples/szl_killinchu.ts` | reference for `szl-holdings/szl-ts` |
| `sdk_samples/pyproject.toml` | PyPI packaging |
| `sdk_samples/package.json` | npm packaging |

— Signed **Yachay** (CTO authority), 2026-06-01. One model, five organs, every call receipted. No bandaid.
