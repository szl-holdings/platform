# OPENAPI_SPECS_PER_FLAGSHIP — every flagship publishes OpenAPI 3.1 at `/openapi.json`

**Layer:** PURIQ v12 customer surface · **Author:** Yachay (CTO authority) · **Date:** 2026-06-01
**Status discipline (Doctrine v12 / v11 LOCKED):** spec + patch deliverable. Nothing here is "shipped"
or "verified". Patch files are written to `patches/` and **not pushed** by the authoring step; the push
step is gated. v11 LOCKED numbers preserved verbatim: **749 declarations · 14 unique axioms (15 raw, 1
dup) · 163 sorries (112 baseline + 51 Putnam) · 13-axis `yuyay_v3` conjunctive AND · replay hash
`bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` · lutar-lean tag `lutar-v18.0.0` /
`c7c0ba17`**. SLSA = **L1 (honest)**; Khipu signature = **DSSE/cosign PLACEHOLDER** until Sigstore lands.

---

## 0 — Why OpenAPI 3.1 is the spine of the commercial surface

Every other customer-facing deliverable in this folder is *generated from* these specs:

```
/openapi.json (per flagship)
        │
        ├──▶ PUBLIC_DOCS_SITE  (MkDocs Material via neoteroi-mkdocs OpenAPI plugin)
        ├──▶ SDK_SPEC_PYTHON_TS (openapi-python-client + openapi-typescript-codegen)
        ├──▶ API_KEY_SYSTEM     (scope/route enforcement table derived from paths)
        ├──▶ STATUS_PAGE        (per-endpoint synthetic probes derived from paths)
        └──▶ EXAMPLES_GALLERY   (request/response shapes copied from schema components)
```

OpenAPI 3.1 (not 3.0) is mandatory because 3.1 is a strict superset of **JSON Schema 2020-12**, which we
already use for the Khipu receipt envelope and the Yuyay-13 axis vector. 3.0's bespoke schema dialect
would force us to lossily re-encode `oneOf`/`const`/`$ref` patterns the receipt schema relies on. The
OpenAPI Initiative documents 3.1's full JSON-Schema alignment in the
[3.1.0 specification](https://spec.openapis.org/oas/v3.1.0.html). Both FastAPI (Python flagships) and
the Node servers can emit 3.1 natively.

---

## 1 — Audit: current `/openapi.json` state per flagship

Measured against the live HF Spaces probe (`a11oy_audit/probe_live_results.json`) and the canonical router
contract (`puriq/integration/a11oy_patch/v1_router_contract.md`). "Has spec" = a machine-readable
OpenAPI document is currently served; "Routes live" = endpoints respond 200 in the probe.

| Flagship | HF Space | Base path | Routes live (probe) | `/openapi.json` today | Gap |
|---|---|---|---|---|---|
| **a11oy** | `SZLHOLDINGS/a11oy` | `/api/a11oy` | 23 GET + 9 POST verified 200 | **partial** — FastAPI auto-docs at `/api/a11oy/docs` but no stable versioned 3.1 doc at `/openapi.json` | Pin 3.1, add servers[], add Khipu components, publish at root `/openapi.json` |
| **amaru** | `SZLHOLDINGS/amaru` | `/api/amaru` | 8 `/math/*` + reasoner UI | **none** at `/openapi.json` | Author full 3.1 from route map |
| **sentra** | `SZLHOLDINGS/sentra` | `/api/sentra` | inline screen + `/math/*` | **none** | Author full 3.1 |
| **killinchu** | `SZLHOLDINGS/vessels` (rename in-flight) | `/api/vessels` → `/api/killinchu` | 7/7 dashboard routes | **none** | Author full 3.1; include `/v1/cue` for ATAK |
| **rosie** | `SZLHOLDINGS/rosie` | `/api/rosie` | 162 endpoints (per Hatun-Willay card) | **partial** — large surface, undocumented | Author 3.1 covering the documented public subset |

**Honest label:** the live a11oy service `version` field reports `2.0.0` and `doctrine: v10` in its
`/healthz` payload (probe snippet); the doctrine-v12 layer is additive and does not change those LOCKED
fields. The OpenAPI `info.version` we publish is the **API contract version** (`1.0.0`), independent of
the doctrine version and the service build version. This is disclosed, not hidden.

---

## 2 — Canonical shared components (every flagship `$ref`s these)

All five specs `$ref` a single shared component file `components/szl-common.yaml` so the Khipu receipt,
the Yuyay-13 vector, the HUKLLA check, and the error envelope are byte-identical across flagships. This
is what lets one SDK model class (`KhipuReceipt`, `YuyayVector`) deserialize every flagship's responses.

```yaml
# components/szl-common.yaml  (OpenAPI 3.1 / JSON Schema 2020-12)
components:
  securitySchemes:
    SZLApiKey:
      type: apiKey
      in: header
      name: Authorization          # value: "Bearer szl_live_..."
      description: >
        SZL API key, format `szl_{env}_{flagship?}_{random}`. Scopes and per-flagship
        access enforced server-side (see API_KEY_SYSTEM.md). Every authenticated call
        emits a Khipu receipt; the receipt id is returned in the `X-Khipu-Receipt` header.
  parameters:
    GovernanceTier:
      name: X-SZL-Governance-Tier
      in: header
      required: false
      schema: { type: string, enum: [standard, elevated, sovereign], default: standard }
  schemas:
    KhipuReceipt:
      type: object
      required: [receiptId, chainVerified, continuumHash, routeReason, huklaCheck, ts]
      properties:
        receiptId:     { type: string, format: uuid }
        chainVerified: { type: boolean, description: "true iff every receipt in the DAG path verifies" }
        continuumHash: { type: string, pattern: "^[0-9a-f]{64}$",
                         description: "json.dumps(sort_keys=True) -> sha256 hexdigest of the receipt packet" }
        prevHash:      { type: [string, "null"], pattern: "^[0-9a-f]{64}$" }
        routeReason:   { type: string }
        signature:
          type: object
          description: "DSSE/cosign envelope. PLACEHOLDER until Sigstore lands (Doctrine v12 §2)."
          properties:
            scheme:    { type: string, const: "dsse-cosign-placeholder" }
            sig:       { type: [string, "null"] }
        huklaCheck:
          type: object
          required: [tripwire, passed]
          properties:
            tripwire: { type: [string, "null"], enum: [null, T01,T02,T03,T04,T05,T06,T07,T08,T09,T10] }
            passed:   { type: array, items: { type: string } }
        ts: { type: string, format: date-time }
    YuyayVector:
      type: object
      description: "13-axis yuyay_v3 score vector. Conjunctive AND: action passes iff ALL 13 floors clear."
      required: [axes, passed, replayHash]
      properties:
        axes:
          type: array
          minItems: 13
          maxItems: 13
          items: { type: number, minimum: 0, maximum: 1 }
        floors:
          type: object
          description: "2 sacred >= 0.95, 7 structural >= 0.90, 4 introspection cross-linked to HUKLLA"
          properties:
            sacred:        { type: array, items: { type: number }, minItems: 2, maxItems: 2 }
            structural:    { type: array, items: { type: number }, minItems: 7, maxItems: 7 }
            introspection: { type: array, items: { type: number }, minItems: 4, maxItems: 4 }
        passed:     { type: boolean }
        replayHash: { type: string, const: "bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5" }
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code:    { type: string }     # see PUBLIC_DOCS_SITE error-codes table
            message: { type: string }
            tripwire: { type: [string, "null"] }   # set when a HUKLLA tripwire caused the refusal
            receiptId: { type: [string, "null"] }
  responses:
    Halt:
      description: "HUKLLA halt or chain-verification failure. Caller MUST NOT act on any body content."
      headers:
        X-Khipu-Receipt: { schema: { type: string } }
      content:
        application/json:
          schema: { $ref: "#/components/schemas/Error" }
```

---

## 3 — Per-flagship spec inventory (paths covered)

Each full spec lives in `openapi_specs/<flagship>.openapi.json`. Path coverage below is derived from the
live probe + router contract; every path carries `security: [{ SZLApiKey: [] }]` and returns the shared
`KhipuReceipt` (in body or `X-Khipu-Receipt` header) on success and `$ref Halt` on tripwire.

### a11oy (`/api/a11oy`) — the orchestration brain
- `POST /v1/router` — single cognition entrypoint (7-tier router; request/response from router contract)
- `POST /v1/reason` · `POST /v1/brain/compose` · `POST /v1/llm/route` · `POST /v1/code/route`
  · `POST /v1/code/auto` · `POST /v1/brain/jack` · `POST /v1/brain/multi-jack`
- `GET /v1/gates` · `GET /v1/gates/{gateId}` · `GET /v1/brain` · `GET /v1/brain/gates`
  · `GET /v1/llm/tiers` · `GET /v1/code/tiers` · `GET /v1/honest` · `GET /v1/lean-verify`
- `GET /healthz` · `GET /readyz` (no auth; excluded from billing/Khipu)

### amaru (`/api/amaru`) — convergent memory cortex
- `POST /v1/ingest` — append-only hash-verified delta ingest
- `POST /v1/recall` — cross-session recall (re-enters 13-axis gate)
- `POST /v1/summarize` — incident/source summarization (routes via a11oy `/v1/router`)
- `GET /v1/math/{primitive}` — 8 math endpoints · `GET /v1/chain/{root}` — delta-chain verification

### sentra (`/api/sentra`) — inline immune screen
- `POST /v1/screen` — 18-SLOC inline screen; returns `{cleared: bool}`, refuses on signature hit
- `POST /v1/scan` — batch payload scan (GitHub Action integration target)
- `GET /v1/signatures` — the six threat signatures + DoS guard config (read-only)

### killinchu (`/api/killinchu`, alias `/api/vessels`) — drone & maritime intelligence
- `GET /v1/fleet` — live fleet dashboard state (MMSI vessels + FAA UAS zones)
- `POST /v1/track` — start a track on a target id; passes axis-3 `empiricalGrounding` floor
- `GET /v1/track/{trackId}` — track state + Khipu provenance
- `GET /v1/cue` — **ATAK cursor-on-target (CoT) feed**; XML or JSON per `Accept` header
- `GET /v1/audit/{missionId}` — Khipu DAG for a mission; `?format=boe` exports Body-of-Evidence bundle

### rosie (`/api/rosie`) — ecosystem-evolve + brain-jack mesh
- `POST /v1/mission/evolve` — evolve a mission plan (genetic/iterative compose via a11oy router)
- `GET /v1/mission/{missionId}` — mission state + decision-flow trace
- `POST /v1/jack` — brain-jack a single decision; returns the 13-axis block trace
- `GET /v1/mesh/state` — live ecosystem mesh state (8 organs)

---

## 4 — Patch files (NOT pushed by authoring step)

Generated patch files live under `patches/` and `openapi_specs/`:

| Patch file | Target | Push path |
|---|---|---|
| `openapi_specs/a11oy.openapi.json` | a11oy Space `static/openapi.json` + route `/openapi.json` | HfApi → `SZLHOLDINGS/a11oy` |
| `openapi_specs/amaru.openapi.json` | amaru Space | HfApi → `SZLHOLDINGS/amaru` |
| `openapi_specs/sentra.openapi.json` | sentra Space | HfApi → `SZLHOLDINGS/sentra` |
| `openapi_specs/killinchu.openapi.json` | vessels/killinchu Space | HfApi → `SZLHOLDINGS/vessels` |
| `openapi_specs/rosie.openapi.json` | rosie Space | HfApi → `SZLHOLDINGS/rosie` |
| `openapi_specs/serve_openapi_patch.py` | FastAPI mount snippet to serve `/openapi.json` 3.1 | per-flagship `app.py` patch |

The serve snippet pins 3.1 and injects the shared components:

```python
# serve_openapi_patch.py  — mount at each flagship's FastAPI app (Zero-Bandaid: real, no mock)
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
import json, pathlib

def install_openapi(app: FastAPI, flagship: str):
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema
        schema = get_openapi(title=f"SZL {flagship} API", version="1.0.0", routes=app.routes)
        schema["openapi"] = "3.1.0"
        schema.setdefault("info", {})["x-szl-doctrine"] = "v12 (carries v11 LOCKED verbatim)"
        schema["info"]["x-szl-replay-hash"] = "bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5"
        common = json.loads(pathlib.Path("static/szl-common.json").read_text())
        schema.setdefault("components", {}).update(common["components"])
        schema["servers"] = [{"url": f"https://api.szlholdings.com/{flagship}",
                              "description": "production"},
                             {"url": f"https://szlholdings-{flagship}.hf.space/api/{flagship}",
                              "description": "HF Space (direct)"}]
        app.openapi_schema = schema
        return schema
    app.openapi = custom_openapi
    return app
```

---

## 5 — Auto-generation pipeline (docs + SDK from these specs)

Run **locally / on the dev box** (NEVER GitHub Actions — HfApi direct push only, per hard rules):

```bash
# 1. Validate every spec (3.1 strict)
for f in openapi_specs/*.openapi.json; do
  npx @redocly/cli@latest lint "$f" --extends recommended
done

# 2. Generate Python SDK modules (one client module per flagship)
for fp in a11oy amaru sentra killinchu rosie; do
  openapi-python-client generate \
    --path "openapi_specs/${fp}.openapi.json" \
    --meta none --output-path "szl-python/src/szl/_gen/${fp}"
done

# 3. Generate TypeScript SDK modules
for fp in a11oy amaru sentra killinchu rosie; do
  npx openapi-typescript-codegen \
    --input "openapi_specs/${fp}.openapi.json" \
    --output "szl-ts/src/_gen/${fp}" --client fetch --useOptions
done

# 4. Render docs (MkDocs Material + neoteroi OpenAPI plugin reads the same specs)
mkdocs build -f docs/mkdocs.yml
```

**Coverage discipline:** the SDK hand-written ergonomic layer (`szl.amaru.summarize(...)`) wraps the
generated low-level client; only the generated layer is auto-derived, so a spec change never silently
breaks the public ergonomic API without a diff in `szl-python/src/szl/amaru.py`.

---

## 6 — Honest gaps (disclosed, not hidden)

- rosie publishes 162 endpoints internally; the 3.1 spec covers only the **documented public subset**
  (mission/jack/mesh). The rest are marked `x-internal: true` and excluded from the public docs build.
- killinchu rename `/api/vessels` → `/api/killinchu` is **in-flight**; the spec ships both with the
  vessels path marked `deprecated: true` and a `Sunset` header date TBD.
- The Khipu `signature` field is a **cosign/DSSE PLACEHOLDER** in every spec. The schema reserves the
  field shape so the SDK type is stable once signing lands; today `chainVerified` reflects **hash-chain**
  verification only, exactly as Doctrine v12 §2 states.

— Signed **Yachay** (CTO authority), PURIQ customer-surface agent, 2026-06-01. No mysticism. No bandaid.
