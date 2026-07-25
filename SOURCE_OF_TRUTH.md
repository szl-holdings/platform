# SZL Holdings — Source of Truth

> **SUPERSEDED 2026-07-25.** This hand-maintained snapshot is retained only as
> historical audit evidence. Current public measurements live in
> [`artifacts/SOURCE_OF_TRUTH.json`](artifacts/SOURCE_OF_TRUTH.json), are generated
> from fresh evidence, and must never be copied from the legacy tables below.
>
> **Current status:** the generated artifact is authoritative. Any unavailable
> measurement is intentionally reported as `null` with label `UNAVAILABLE`.
>
> **Obsolete historical instruction (do not follow):** this file once supplied
> downstream metrics. Regenerate the JSON artifact before making a current claim;
> do not copy a number from the legacy tables below.

---

## Canonical Public Metrics

| Metric | Canonical Value | Verification Command |
|---|---|---|
| Registered artifacts (artifact.toml) | **9** | `find artifacts -name artifact.toml \| wc -l` |
| Database tables (live, provisioned) | **848** | `psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"` |
| API endpoints (router declarations) | **5,524** | `grep -rhE 'router\.(get\|post\|put\|patch\|delete\|use)' artifacts/api-server/src/routes --include='*.ts' \| wc -l` |
| Verticals (post KORA consolidation) | **7** | See Verticals section below |
| Monorepo packages (packages/ + lib/) | **126** | `echo $(( $(ls packages/ \| wc -l) + $(ls lib/ \| wc -l) ))` |
| DB schema files | **170** | `find lib/db/src/schema -name '*.ts' \| wc -l` |
| CI workflows | **23** | `ls .github/workflows/ \| wc -l` |
| Declared env vars | **213** | `grep -cE '^[A-Z_]+=' .env.example` |
| Platform primitives | **6** | See Primitives section below |
| RBAC roles | **11** | Cross-document consistency (README + docs) |
| Ouroboros vitest test calls | **133** | `grep -rhE "^\s*(it\|test)\(" packages/ouroboros/src --include='*.test.ts' \| wc -l` |
| Codex-kernel vitest test calls | **29** | `grep -rhE "^\s*(it\|test)\(" packages/codex-kernel/src --include='*.test.ts' \| wc -l` |
| Sovereign engine innovations | **44** | Count of entries in INNOVATION_MANIFEST in `packages/ouroboros-integrations/src/sovereign-engine.ts` |
| Thesis papers (papers/) | **10** | `ls papers/*.tex \| wc -l` |
| Security tests passing | **126** | `pnpm --filter @workspace/api-server test` (security suite) |

**Last verified:** 2026-05-04
**Audit trail:** `audit/source-of-truth.json`
**Note:** Re-verification on 2026-05-03 produced material deltas from the 2026-04-28 baseline. DB tables grew 798 → 848 (+50). API endpoints grew 2,816 → 5,524 (+2,708) following recent route-system expansion. Registered artifacts dropped 14 → 9 (vestigial artifact.toml files were removed in the 2026-04-25 cleanup; the canonical count is now `find artifacts -name artifact.toml`). Ouroboros tests revised to a literal call count of 133 (the earlier "150" figure was a declared-suite count and is no longer authoritative). Verticals dropped 8 → 7: KORA (Decision Intelligence) consolidated into A11oy as a unified Orchestration + Decision Intelligence surface; the `/lyte/` archive directory is retained but is no longer a standalone product line.

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
| KORA | `/lyte/` | Lyte | Decision Intelligence — consolidated into A11oy 2026-05-03; archive directory `archive/artifacts/lyte-command-center` retained for history |
| A11oy | `/a11oy/` | Alloy, AEEP | Orchestration + Decision Intelligence — unified surface that powers and orchestrates all verticals |
| Carlota Jo | `/carlota-jo/` | — | Consulting vertical |
| Amaru | `/conduit/` | Conduit | Convergent Reverse-ETL; slug retained |
| Unified Command | `/command/` | — | Cross-vertical intelligence layer |
| APEX | `/szl-holdings-mobile/` | — | Mobile Command app |
| PRAXIS | `/nexus/` | NEXUS | Agentic AI layer |

**Rule:** Display names in UI and docs use the canonical name above. Slugs and API paths are stable and do not change on rebrand.

---

## Seven Verticals (post KORA consolidation)

1. **TENAX** — Cyber Resilience Command (`/sentra/`)
2. **SEXTANT** — Maritime Intelligence (`/vessels/`)
3. **DOMAINE** — Real Estate Intelligence (`/terra/`)
4. **Counsel** — Legal Matter Command (`/counsel/`)
5. **LUMINA** — AI Executive Briefing (`/pulse/`)
6. **PARAGON** — Security & Compliance (`/aegis/`)
7. **Carlota Jo** — Consulting (`/carlota-jo/`)

**Orchestration layer (powers and unifies all seven):** **A11oy** — `/a11oy/` — Brand Orchestration + Decision Intelligence (formerly KORA `/lyte/`, consolidated 2026-05-03).

**Public-proof open source (not a vertical, foundational runtime):** **Ouroboros** runtime (`@szl-holdings/ouroboros`, current release v6.2.0, full suite 172/172 tests passing) and **Ouroboros Thesis** — 11 Zenodo-archived papers (v1–v11). Canonical latest is v11 "Applied Λ: Measured Per-Request Overhead of the Audit-Closure Operator" (per-version DOI 10.5281/zenodo.20119582, published 2026-05-11). v3 in the same series is paper-v3-2.0.0 "The Lutar Invariant (audit-supported rewrite)" (per-version DOI 10.5281/zenodo.19983066, published 2026-05-02). Concept DOI is 10.5281/zenodo.19944926 and resolves to the latest version (currently v11). Both repositories are public on `github.com/szl-holdings`. The earlier reserved DOI 10.5281/zenodo.19951520 was withdrawn during a re-release sequence on 2026-05-02 and is not the canonical v3 record.

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
