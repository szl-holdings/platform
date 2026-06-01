# PUBLIC_DOCS_SITE — `docs.szlholdings.com`

**Layer:** PURIQ v12 customer surface · **Author:** Yachay (CTO authority) · **Date:** 2026-06-01
**Status discipline:** spec + patch. v11 LOCKED numbers preserved verbatim (749 / 14 / 163 / 13-axis
`yuyay_v3` / replay hash `bacf5443…631fc5` / `lutar-v18.0.0` @ `c7c0ba17`). Khipu signature = cosign
PLACEHOLDER. NO mock.

---

## 0 — Tech choice: **MkDocs Material**

**Decision: MkDocs Material**, over Docusaurus and VitePress.

Justification (Series-A diligence-grade):

| Criterion | MkDocs Material | Docusaurus | VitePress | Why it matters for SZL |
|---|---|---|---|---|
| **OpenAPI auto-render** | first-class via `neoteroi-mkdocs` (`[OAD]` directive) reads our 3.1 specs directly | needs `docusaurus-plugin-openapi-docs` (heavier, React) | `vitepress-openapi` exists but less mature | every flagship publishes `/openapi.json`; docs must auto-generate from them |
| **Stack alignment** | Python (matches every FastAPI flagship + the portal) | Node/React | Node/Vue | one toolchain, fewer build deps for an air-gapped DoD build |
| **Air-gap / offline build** | `mkdocs build` is a single static output, trivially mirrorable into UDS | Node build heavier | Node build heavier | DoD/IC docs ship inside the UDS bundle |
| **Mermaid + admonitions** | native (Mermaid, `!!! note`) | plugin | plugin | we render the portal wireframes + receipt-flow diagrams |
| **Search offline** | built-in lunr (no external service) | Algolia (network) | local | air-gapped search without a SaaS dependency |
| **Versioning** | `mike` (git-tag versioned docs) | native | plugin | API v1 vs future v2 docs |

MkDocs Material is the most defensible pick because it (a) auto-renders our OpenAPI 3.1 specs, (b) keeps
the docs toolchain in Python alongside the rest of the stack, and (c) produces a fully static, offline,
air-gap-mirrorable site that drops into the UDS bundle for DoD/IC — a hard requirement none of the
JS-first options meet as cleanly. ([MkDocs Material](https://squidfunk.github.io/mkdocs-material/),
[neoteroi-mkdocs OpenAPI](https://www.neoteroi.dev/mkdocs-plugins/web/oad/).)

---

## 1 — Information architecture

```
docs.szlholdings.com/
├── Getting started/
│   ├── What is SZL                (the wedge: governed agentic AI, 13-axis gate, Khipu receipts)
│   ├── Quickstart (Python)        (install -> key -> first receipted call in <5 min)
│   ├── Quickstart (TypeScript)
│   ├── Authentication & API keys  (link to portal; scopes; cosign; honor-system quotas)
│   └── Khipu receipts 101         (what a receipt is, how to verify continuum_hash yourself)
├── Flagships/
│   ├── a11oy      (the orchestration brain + 7-tier router)
│   ├── amaru      (convergent memory cortex)
│   ├── sentra     (inline immune screen)
│   ├── killinchu  (drone & maritime intelligence)
│   └── rosie      (ecosystem-evolve + brain-jack)
├── Organs/                        (the governance substrate, honestly labelled)
│   ├── yuyay_v3 (13-axis heart)   (2 sacred >=0.95, 7 structural >=0.90, 4 introspection; replay hash)
│   ├── HUKLLA (10 tripwires)
│   ├── YAWAR / Khipu ledger
│   ├── SENTRA (18-SLOC screen)
│   └── Lambda Spine (Λ aggregator — uniqueness is a CONJECTURE, not a theorem)
├── API reference/                 (AUTO-GENERATED from /openapi.json via neoteroi [OAD])
│   ├── a11oy · amaru · sentra · killinchu · rosie  (every endpoint)
├── SDKs/
│   ├── szl-python reference       (generated + ergonomic layer)
│   └── szl-ts reference
├── Examples/                      (mirrors EXAMPLES_GALLERY.md; runnable snippets)
├── Error codes/                   (every error.code + cause + fix)
├── Status/                        (links to status.szlholdings.com)
└── Math & honesty/
    ├── Locked numbers             (749 / 14 / 163; what each means)
    ├── Honest labels              (Λ Conjecture; cosign PLACEHOLDER; SLSA L1; Wire D not-yet)
    └── Verify it yourself         (clone lutar-lean @ c7c0ba17, run the canonical counter)
```

---

## 2 — Auto-generation from OpenAPI specs

`mkdocs.yml` (excerpt) wires every flagship spec into an API-reference page:

```yaml
site_name: SZL Holdings Docs
site_url: https://docs.szlholdings.com
theme:
  name: material
  features: [navigation.tabs, content.code.copy, content.tabs.link, search.suggest]
plugins:
  - search
  - neoteroi.mkdocsoad           # OpenAPI renderer
markdown_extensions:
  - pymdownx.superfences:
      custom_fences:
        - { name: mermaid, class: mermaid, format: !!python/name:pymdownx.superfences.fence_code_format }
  - admonition
nav:
  - Getting started: [index.md, quickstart-python.md, quickstart-ts.md, auth.md, khipu-101.md]
  - Flagships: [flagships/a11oy.md, flagships/amaru.md, flagships/sentra.md,
                flagships/killinchu.md, flagships/rosie.md]
  - API reference:
      - a11oy:     api/a11oy.md       # contains:  [OAD(./openapi/a11oy.openapi.json)]
      - amaru:     api/amaru.md
      - sentra:    api/sentra.md
      - killinchu: api/killinchu.md
      - rosie:     api/rosie.md
  - SDKs: [sdk/python.md, sdk/typescript.md]
  - Examples: examples.md
  - Error codes: errors.md
  - Math & honesty: [math/locked-numbers.md, math/honest-labels.md, math/verify-it-yourself.md]
```

Each API page is one line:
```markdown
[OAD(../openapi/killinchu.openapi.json)]
```
which renders **every endpoint, parameter, request/response schema, and the Khipu/Yuyay components**
straight from the spec. A spec change → `mkdocs build` → docs update, no hand edits. Build runs on the
dev box (NEVER GitHub Actions); the static output is pushed to the docs host and mirrored into the UDS
bundle.

---

## 3 — Error codes page (every code, cause, fix)

| `error.code` | HTTP | Cause | Fix |
|---|---|---|---|
| `auth_invalid_key` | 401 | key hash mismatch / malformed | re-copy key; mint a new one in the portal |
| `auth_revoked_key` | 403 | key `status='revoked'` | mint a new key |
| `auth_scope_denied` | 403 | scope too low for operation (e.g. `read` calling `startTrack`) | use a `write`/`admin` key |
| `auth_flagship_denied` | 403 | flagship not in key allowlist | add flagship to the key or mint a flagship-bound key |
| `hukla_halt` | 409 | a HUKLLA tripwire fired (T01–T10) | inspect `tripwire`; the receipt is your evidence; do not act on content |
| `chain_unverified` | 409 | Khipu `chainVerified=false` | treat as HALT; report receiptId |
| `yuyay_gate_block` | 422 | action failed a 13-axis floor (e.g. axis-3 empiricalGrounding) | raise evidence quality / lower the claim |
| `quota_over_soft` | 402 (advisory) | past soft quota, still served | upgrade tier or reduce volume |
| `rate_limited` | 429 | hit hard ceiling (10× soft) | back off `Retry-After`; upgrade tier |
| `bad_request` | 400 | schema validation failed | check the request against the OpenAPI schema |

---

## 4 — "Verify it yourself" page (the honesty wedge in the docs)

A short page that tells a skeptical engineer exactly how to re-derive the LOCKED numbers:

```bash
git clone https://github.com/szl-holdings/lutar-lean && cd lutar-lean
git checkout c7c0ba17
python .github/scripts/lean_numbers.py     # -> 749 declarations / 14 unique axioms / 163 sorries
```
and how to recompute a Khipu `continuum_hash` from a receipt packet (the SDK `verify_receipt_chain`
helper). This page is the single most persuasive thing in the docs for a DoD/IC reviewer.

---

## 5 — Patch files (NOT pushed by authoring step)

| File | Target |
|---|---|
| `patches/github_customer_portal/mkdocs.yml` | docs config in portal repo (or a `szl-holdings/docs` repo) |
| `patches/github_customer_portal/docs_index.md` | landing page |
| `openapi_specs/*.openapi.json` | consumed by the `[OAD]` directive |

— Signed **Yachay** (CTO authority), 2026-06-01. Docs auto-generate from the spec. Verify it yourself. No bandaid.
