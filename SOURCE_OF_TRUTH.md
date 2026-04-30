# SZL Holdings — Source of Truth

> **Single source of truth** for canonical public metrics, platform names, model profiles, and endpoint references.
> Every downstream document, README, slide, and investor deck must draw numbers from this file.
> Do not invent or guess metrics — re-run the documented commands to verify before making claims.

---

## Canonical Public Metrics

| Metric | Canonical Value | Verification Command |
|---|---|---|
| Registered artifacts | **14** | `find artifacts -name artifact.toml \| wc -l` |
| Database tables (live, provisioned) | **798** | `bash scripts/audit/db/inventory-schema.sh` |
| API endpoints | **2,816** | `grep -rh 'router\.(get\|post\|put\|patch\|delete\|use)' artifacts/api-server/src/routes --include='*.ts' \| wc -l` |
| Verticals | **8** | See Verticals section below |
| Monorepo packages (packages/ + lib/) | **126** | `echo $(( $(ls packages/ \| wc -l) + $(ls lib/ \| wc -l) ))` |
| DB schema files | **170** | `find lib/db/src/schema -name '*.ts' \| wc -l` |
| CI workflows | **23** | `ls .github/workflows/ \| wc -l` |
| Declared env vars | **213** | `grep -cE '^[A-Z_]+=' .env.example` |
| Platform primitives | **6** | See Primitives section below |
| RBAC roles | **11** | Cross-document consistency (README + docs) |

**Last verified:** 2026-04-28
**Audit trail:** `audit/source-of-truth.json`

---

## Canonical Platform Names

| Display Name | Slug / Path | Former Name | Notes |
|---|---|---|---|
| SZL Holdings Platform | `/` | — | Root dashboard |
| FORGE | — | — | Governed operational intelligence platform |
| Continuum | — | Alloy, AEEP | Business Observability Fabric |
| TENAX | `/sentra/` | Sentra | Cyber Resilience Command; slug retained |
| SEXTANT | `/vessels/` | — | Maritime Intelligence |
| DOMAINE | `/terra/` | — | Real Estate Intelligence |
| Counsel | `/counsel/` | PRISM Counsel | Legal Matter Command |
| LUMINA | `/pulse/` | Pulse | AI Executive Briefing; slug retained |
| PARAGON | `/aegis/` | Aegis | Security & Compliance |
| KORA | `/lyte/` | Lyte | Decision Intelligence |
| Carlota Jo | `/carlota-jo/` | — | Consulting vertical |
| Amaru | `/conduit/` | Conduit | Convergent Reverse-ETL; slug retained |
| Unified Command | `/command/` | — | Cross-vertical intelligence layer |
| APEX | `/szl-holdings-mobile/` | — | Mobile Command app |
| PRAXIS | `/nexus/` | NEXUS | Agentic AI layer |

**Rule:** Display names in UI and docs use the canonical name above. Slugs and API paths are stable and do not change on rebrand.

---

## Eight Verticals

1. **TENAX** — Cyber Resilience Command (`/sentra/`)
2. **SEXTANT** — Maritime Intelligence (`/vessels/`)
3. **DOMAINE** — Real Estate Intelligence (`/terra/`)
4. **Counsel** — Legal Matter Command (`/counsel/`)
5. **LUMINA** — AI Executive Briefing (`/pulse/`)
6. **PARAGON** — Security & Compliance (`/aegis/`)
7. **KORA** — Decision Intelligence (`/lyte/`)
8. **Carlota Jo** — Consulting (`/carlota-jo/`)

---

## Six Platform Primitives

1. Outcome Graph
2. Proof Chain
3. Covenant Policy
4. Decision Simulation
5. Workflow Engine
6. Event Fabric (PRISM Bus)

---

## Model Profile Reference

**Governed model:** Qwen 3.6 — 27B Reasoning Model
**Profile file:** `model-profiles/qwen3_6_27b_szl_profile.json`
**Provider:** Hugging Face Inference Endpoints
**Serving transport:** OpenAI-compatible REST
**Key env vars:** `QWEN36_BASE_URL`, `QWEN36_API_KEY`, `QWEN36_MODEL`, `HF_TOKEN`, `HF_ENDPOINT_NAMESPACE`
**Gateway adapter:** `lib/ai-engine/src/alloy-model-gateway.ts`

No model weights are hosted locally. All inference routes through the configured remote endpoint.

---

## Endpoint Plane Reference

**Profile file:** `endpoint-profiles/alloy_endpoint_plane.json`
**Provider:** Hugging Face Inference Endpoints
**Autoscaling:** 0–4 replicas; scales to zero after 15 min idle
**Daily budget cap:** $50 USD (hard cutoff — new requests rejected when limit is reached)
**Monthly budget cap:** $1,000 USD
**Cold-start retries:** 3 attempts with 2s / 5s / 10s backoff
**Deployment:** requires human approval; profile documents policy only

---

## Plugin Registry Reference

**Registry file:** `ecosystem-plugin-registry.json`
**Shared plugins:** GitHub, HuggingFace, Vercel, Neon, Cloudflare
**Coverage:** all 8 verticals with domain-specific plugins and approval gates

---

## Update Rule

When any metric changes, update **both**:
1. This file (`SOURCE_OF_TRUTH.md`) — human-readable table
2. `audit/source-of-truth.json` — machine-readable audit record (with `computed` date and verification command)

Do not update one without the other. Run the verification command and paste the output — never estimate.
