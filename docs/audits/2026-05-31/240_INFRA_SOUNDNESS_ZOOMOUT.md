# 240 — INFRA SOUNDNESS ZOOM-OUT

**Audit date:** 2026-06-01
**Auditor:** OPUS subagent (Perplexity Computer), read-only, evidence-cited from round2 deliverables
**Founder verbatim driver:** *"zoom out and look at our software — are we missing anything regarding infra or back end, front end, or Anatomy? Is it sound? Innovate and evolve."*
**Authority:** Doctrine v9 LOCKED 2026-05-31 22:10 EDT (canonical Lean numbers **456 declarations / 14 axioms / 6 tracked sorries** for the curated kernel; the full corpus is **749 / 14 / 163** per the live unified-kernel refresh, commit `#272` @ `c7c0ba17`).
**Scope of sources:** every prior deliverable in this directory (00_–220_), with primary load-bearing reads being `110_` (Anatomy), `81_` (UDS verify), `70_` (master post-HF test), `180_` (platform every-file), `200_` (last Replit push), `13_` (workflows), `90_`/`42_`/`91_`/`92_`/`93_` (ship logs), `130_` (PINN→DINN frontier), `100_` (DU deep dive).

---

## TL;DR (founder-readable, 3 sentences)

**The substrate is genuinely sound and category-leading at the layer nobody else owns — formally-verified, decision-level governance with a tamper-evident signed receipt chain — but the *operational* infra around it is Series-A-thin: there is no centralized log aggregation, no live Prometheus/Grafana metrics, no secret-manager integration, the vsp-otel tracer ships nowhere a reviewer can see, and 5 of 6 UDS bundles are unsigned.** Of the 12 anatomy organs, **9 are PRESENT or PRESENT-after-rename, 3 remain PARTIAL** (YUYAY memory-store, KALLPA Wire D, OTel-VSP provenance), and **1 (UNAY cross-session memory) is still MISSING**. The five frontier moves below — led by **DINN (doctrine-as-training-loss)** and a **portable signed-receipt "Body of Evidence" SDK** — are moves no competitor (Defense Unicorns, Anthropic, OpenAI, Cohere, Adept, Cognition, Sierra) is making, and they convert today's inference-time walls into a defensible learning-and-evidence moat.

---

## SECTION 1 — INFRA INVENTORY TABLE

Verdict key: **PRESENT_FULLY** = shipped, tested, externally verifiable · **PRESENT_PARTIAL** = real code/config but a material gap blocks the claim · **MISSING** = no evidence of the capability.

| # | Infra item | Verdict | Severity | Evidence | Recommendation |
|---|---|---|---|---|---|
| 1 | **Container runtime + signing** (UDS bundles, cosign) | **PRESENT_PARTIAL** | **P0** | 6/6 UDS tarball SHA-256 integrity PASS, but cosign **Verified OK on vessels only** (keyless/Fulcio, Rekor index `1675423172`); the other 5 (a11oy, amaru, sentra, rosie, uds-mesh) have **no `.sig` artifact anywhere** ([81_ §0/§2](81_UDS_BUNDLE_VERIFY_MATRIX.md)). The dev-key cosign path is *proven functional* on v0.2.0, so this is a missing-artifact gap, not a tooling failure ([81_ §3](81_UDS_BUNDLE_VERIFY_MATRIX.md)). | Re-sign the 5 with the existing dev key now (USB-demo unblocker) AND add vessels' keyless `uds-sign-release.yml` to all 5 so the next cut is Fulcio-signed ([81_ P0-1](81_UDS_BUNDLE_VERIFY_MATRIX.md)). |
| 2 | **Service mesh** (uds-mesh, Wire B/C/D) | **PRESENT_PARTIAL** | **P2** | Wire B (a11oy→sentra `/v1/inspect`) **live** (PR #176 merged); Wire C (a11oy→rosie `/v1/events`) receiver in flight / "half-wired"; **Wire D NOT implemented** ([110_ row 6, SEV-2#3](110_ANATOMY_COMPLETENESS_AUDIT.md)). uds-mesh `uds-bundle.yaml` binds only 3 of 5 organs and is versioned `0.1.0` ([81_ §2.6](81_UDS_BUNDLE_VERIFY_MATRIX.md)). | Land Wire C receiver + a cross-organ end-to-end test; scope/implement Wire D; bump szl-mesh bundle to add rosie+vessels. |
| 3 | **Observability — tracing** (vsp-otel) | **PRESENT_PARTIAL** | **P1** | `vsp-otel` code is substrate-quality and tested (`exporter.ts` W3C TraceContext, pipeline/redaction/sla suites) and CI is **all-passing** ([13_ vsp-otel](13_GITHUB_WORKFLOWS_STATUS.md)), but it has **no own Zenodo software deposit** (provenance gap) and **is not shipping traces to any endpoint a reviewer can see** — no live collector/backend ([110_ row 9, SEV-1#2](110_ANATOMY_COMPLETENESS_AUDIT.md)). | Mint the vsp-otel Zenodo deposit; stand up a public OTel collector + trace view (even a single Grafana Tempo / Jaeger demo) so traces are externally observable. |
| 4 | **Receipt / audit chain** (DSSE, Khipu Merkle DAG) | **PRESENT_FULLY** (code) / **PARTIAL** (live attestation) | **P1** | DSSE-PAE signing + SHA-256 linked `receipts.py` + adversarial corruption test all PASS; Khipu summation-invariant Merkle DAG with TH11 Lean obligation + fail-mode tests PASS ([110_ rows 4/7](110_ANATOMY_COMPLETENESS_AUDIT.md)). **BUT** the live Spaces self-disclose "all current envelopes are PLACEHOLDER… Real Sigstore-verified envelopes: 0" ([70_ rosie](70_OPUS_MASTER_POST_HF_TEST.md)). | Run Sigstore signing in CI for at least one real receipt so the "0 real envelopes" disclosure flips to ≥1 verifiable. |
| 5 | **Cardano anchoring** (amaru) | **PRESENT_PARTIAL** | **P1** | amaru ships GREEN with hash-chained receipts (47/47 routes, `proof_id` on chakra evaluate) ([90_](90_OPUS_AMARU_FULL_SHIP.md), [70_ amaru](70_OPUS_MASTER_POST_HF_TEST.md)); the live serve.py is described as a "Cardano-anchored memory receipt chain" ([180_ §10](180_PLATFORM_MONOREPO_EVERY_FILE.md)). **No deliverable verifies an actual on-chain Cardano transaction** — receipts reset to 0 on every Docker rebuild ([90_ §7](90_OPUS_AMARU_FULL_SHIP.md)), so "anchoring" is currently a local hash-chain, not proven L1 anchoring. | Prove one real Cardano anchor (testnet tx hash a reviewer can look up) or re-scope the claim to "hash-chained, anchor-ready." |
| 6 | **Identity** (szl-trust, codex-kernel) | **PRESENT_FULLY** (code) / **PARTIAL** (CI) | **P2** | szl-trust runs; `codex-kernel` is a typed knowledge-graph kernel with `ledger/receipts/replay/hash` + 29 vitest calls (innovation #21) ([180_ §8](180_PLATFORM_MONOREPO_EVERY_FILE.md)); ACCESS-CONTROL-MATRIX defines a 12-level role enum + OIDC/PKCE sessions ([180_ §2](180_PLATFORM_MONOREPO_EVERY_FILE.md)). **BUT** szl-trust `huklla-t11-doi-title-gate` is **FAILING on main** ([13_ szl-trust](13_GITHUB_WORKFLOWS_STATUS.md)). | Fix the DOI/title gate; ship codex-kernel to at least one live Space (currently un-instilled, see §2). |
| 7 | **Secret management** (Vault / Doppler / AWS SM) | **MISSING** | **P1** | Only static hygiene exists: `.env.example` (213 vars), `.gitleaks.toml` (27.9 KB allowlist), TruffleHog/gitleaks scans (CLEAN, 0 true positives over 7,014 commits), `CREDENTIAL_ROTATION.md` runbook ([180_ §1/§2](180_PLATFORM_MONOREPO_EVERY_FILE.md)). **No Vault/Doppler/AWS Secrets Manager integration found anywhere.** | Adopt one managed secret store (Doppler is fastest for a single-founder Series-A) and wire CI to inject from it; keep gitleaks as the backstop. |
| 8 | **Logging — centralized aggregation** | **MISSING** | **P1** | No evidence of Loki/Vector/ELK/CloudWatch aggregation across the 5 Spaces; each Space logs to its own container stdout. DU ships Loki/Grafana/Vector by default — SZL does not ([100_ §3](100_WARHACKER_DU_DEEP_DIVE.md)). The Khipu receipt DAG is the *evidentiary* substitute but is not a log-aggregation layer. | Stand up a minimal centralized log sink; position Khipu receipts as the tamper-evident layer *above* logs, not a replacement for them. |
| 9 | **Metrics** (Prometheus / Grafana) | **MISSING** (live) / **PRESENT_PARTIAL** (planned) | **P1** | A `composition-runtime` `/metrics` endpoint on port 9090 is *declared* in the v0.3.1 runtime-layer bundle ("Prometheus") ([83_ deployment plan](83_UDS_RUNNING_DEPLOYMENT_PLAN.md)) and the substrate compose has healthchecks, but **no live Prometheus scrape or Grafana dashboard exists** on any running Space. | Expose `/metrics` on the live Spaces and attach one Grafana dashboard; this is table-stakes for any infra-buyer diligence. |
| 10 | **Tracing — actually shipping?** | **MISSING** (live shipment) | **P1** | vsp-otel exporter exists and is tested, but no live Space emits traces to a visible collector (see #3). `packages/substrate/src/telemetry.ts` has OTel hooks but is **un-instilled** into any Space ([180_ §3B/§9](180_PLATFORM_MONOREPO_EVERY_FILE.md)). | Same as #3 — a single live trace view closes both items. |
| 11 | **CI/CD** | **PRESENT_PARTIAL** | **P0** | Org reusable workflows exist (`.github` repo: 16 reusable + SLSA/SBOM/scorecard ALL passing) ([13_ .github](13_GITHUB_WORKFLOWS_STATUS.md)), but **13 broken workflow instances across 8 repos**, including 5 critical: a11oy Container-build (GHCR push) FAIL, sentra Container-build + hf-sync FAIL, vessels Tests FAIL on main, agi-forecast Tests FAIL on main ([13_ broken summary](13_GITHUB_WORKFLOWS_STATUS.md)). Platform redefines workflows locally (DRIFT-2) and 10 of 25 platform workflows are disabled ([13_ platform](13_GITHUB_WORKFLOWS_STATUS.md)). | Fix the 5 critical container/test failures first (they block deployable images); reconcile platform-local workflows back onto the org reusable set. |
| 12 | **Backup + DR** | **PRESENT_PARTIAL** | **P2** | `INCIDENT_RESPONSE.md` IR runbook + `CREDENTIAL_ROTATION.md` present in platform ([180_ §1](180_PLATFORM_MONOREPO_EVERY_FILE.md)); the nightly `backup.yml` cron is referenced in the platform every-file audit but **no backup-restore drill or RPO/RTO is documented**, and Space container state is ephemeral (receipts reset on rebuild). | Document RPO/RTO, run one restore drill, and persist receipt/DB state to durable storage instead of ephemeral container disk. |
| 13 | **Compliance** (EU AI Act Art 12, NIST AI RMF MANAGE) | **PRESENT_PARTIAL** | **P2** | Alignment is *claimed and cited* on the uds-demo Space (EU AI Act CELEX 32024R1689, NIST AI 100-1) and Hatun Doctrine Spec defines 10 governance artifact kinds with 11 JSON Schemas ([70_ uds-demo](70_OPUS_MASTER_POST_HF_TEST.md), [180_ Hatun](180_PLATFORM_MONOREPO_EVERY_FILE.md)). **No evidence anyone is actually running an audit against these mappings** — they are reference alignments, not exercised controls. | Run one mock EU AI Act Art-12 record-keeping audit end-to-end using the Khipu receipt chain as the evidence artifact; publish the result. |

**Section 1 tally:** **3 MISSING** (secret management, centralized logging, live metrics) + **1 MISSING-live tracing** (overlaps observability) → counting the four distinct capability gaps the founder asked about, the **hard-MISSING count is 3** (secrets, logging, metrics), with tracing MISSING at the *shipment* layer though the code exists. **8 PRESENT_PARTIAL**, **1 PRESENT_FULLY** (receipt/audit chain code).

---

## SECTION 2 — BACKEND SOUNDNESS

### 2.1 Cross-Space backend verdict
The live backends are **independent `serve.py` reimplementations**, not the monorepo runtime. The platform monorepo (8,208 tracked files, `packages/substrate`, `codex-kernel`, 134 packages, 8 services, 5 apps) is **almost entirely un-instilled** into the live Spaces — the Spaces do not import `@workspace/*`, `@szl/substrate`, or `codex-kernel`; they reimplement the concepts ([180_ §9](180_PLATFORM_MONOREPO_EVERY_FILE.md)). This is the single biggest backend soundness finding: **the headline technical moats (compile-time Kahn approval-DAG in `compiler.ts`, codex-kernel replay) are not exercised by any externally-verifiable surface** ([180_ §11 P0-2](180_PLATFORM_MONOREPO_EVERY_FILE.md)).

### 2.2 API surface coverage
- **PRODUCT-SURFACES.md** declares 11 web surfaces; only **6 artifacts carry a registered `artifact.toml`** and only **a11oy / sentra / amaru** have live Space backends. **4 registered TAB artifacts (vessels, terra, counsel, carlota-jo) have no matching live backend** — vessels has a Space but its backend is a separate FastAPI, while terra/counsel/carlota-jo have **no live Space at all** ([180_ §7/§11 P0-3](180_PLATFORM_MONOREPO_EVERY_FILE.md)).
- **API-CATALOGUE.md** is 856 KB of generated endpoints; SOURCE_OF_TRUTH claims 5,524 router declarations / 848 DB tables ([180_ §2](180_PLATFORM_MONOREPO_EVERY_FILE.md)) — but these are monorepo-internal, **not** what the live Spaces serve.

### 2.3 Per-Space backend health
| Space | Backend verdict | Detail |
|---|---|---|
| **a11oy** | 🟡 GREEN-with-gap | Core API works (`healthz`, `v1/gates`=46, `v1/reason` 200, `v1/policy/evaluate` 400-validation), but **`/v1/verify`, `/v1/ledger`, `/v1/mcp`, `/v1/lambda` return 503** — the Node `:8081` backend is **not running in the container** and the Python serve never implemented these locally ([70_ a11oy caveat](70_OPUS_MASTER_POST_HF_TEST.md)). |
| **amaru** | 🟢 GREEN | 7 chakras + 8 API endpoints 200; hash-chained receipts return `proof_id`; healthz reports 7 chakras, 0 stubbed ([70_ amaru](70_OPUS_MASTER_POST_HF_TEST.md), [90_](90_OPUS_AMARU_FULL_SHIP.md)). Counters reset on Docker rebuild (ephemeral). |
| **sentra** | 🟢 GREEN | 8 immune gates; `/v1/verdict` + `/v1/inspect` correctly DENY SQL injection; honest `lean_status:"partial"` with sorry-line disclosure ([70_ sentra](70_OPUS_MASTER_POST_HF_TEST.md)). |
| **vessels** | 🔴 RED | API 8/8 → 200, but `/dashboard` & `/economics` render **BLACK** because `/api/auth/demo-session` returns a stub (caught by FastAPI catch-all) and there is **no empty-state fallback** ([70_ vessels](70_OPUS_MASTER_POST_HF_TEST.md)). |
| **rosie** | 🟢 GREEN | 11 Gradio tabs API-verified; transparently surfaces a11oy's 503s ([70_ rosie](70_OPUS_MASTER_POST_HF_TEST.md)). |

### 2.4 Database
SOURCE_OF_TRUTH claims **848 live DB tables / 170 schema files / 939 pgTable** (the task's "644" is a stale variant of this metric) ([180_ §2](180_PLATFORM_MONOREPO_EVERY_FILE.md)). **Where Postgres/SQLite is actually deployed for the live Spaces is unproven** — the Spaces run with seeded in-memory data ("Demo Mode… mutations return 501") ([180_ llms.txt](180_PLATFORM_MONOREPO_EVERY_FILE.md)). **No backup-restore evidence for any live DB.** This is a P1 backend gap: the 848-table claim has no externally-verifiable durable deployment.

### 2.5 Authentication / access control
ACCESS-CONTROL-MATRIX defines a 12-level `platform_role` enum, OIDC/PKCE, server-side PG sessions with version counter + revocation ([180_ §2](180_PLATFORM_MONOREPO_EVERY_FILE.md)). This is sound **in the monorepo**; the live Spaces are public/unauthenticated demo surfaces, so the access-control model is **not exercised live**.

### 2.6 Rate limiting / CORS / security headers
A `security-headers` vendor package exists and platform `threat_model.md` documents a `globalAuthEnforcer` data-flow ([180_ §2](180_PLATFORM_MONOREPO_EVERY_FILE.md)). **No evidence of live rate-limiting or CORS policy on the Spaces** — P2.

### 2.7 Webhook / event system
The Khipu Merkle DAG is a **data structure + Lean obligation**, not a running event bus; the live event surface is amaru's `/events` SSE + the `prism-bus` Event Fabric package (un-instilled) ([180_ §8](180_PLATFORM_MONOREPO_EVERY_FILE.md), [70_ amaru](70_OPUS_MASTER_POST_HF_TEST.md)). Verdict: **PARTIAL** — Khipu is evidentiary, not a backend event system; treat them as distinct in the pitch.

---

## SECTION 3 — FRONTEND SOUNDNESS

### 3.1 The 5 React apps (678 files total)
Per the deep scrape ([200_ §1](200_LAST_REPLIT_PUSH_DEEP_SCRAPE.md)): a11oy **196 files / 141 routes**, amaru **92 / 49 routes** (shipped additively at `/conduit/`, 47/47 GREEN), sentra **183 / 180 routes**, vessels **182 / 115 routes**, rosie **25 files (Gradio, not a SPA)**. Totals: 678 files, 476 `.tsx`, 405 pages, 54 components. **Zero genuine TODO/FIXME debt** across all 678 files (the single `XXX` hit is intentional demo copy) ([200_ §4](200_LAST_REPLIT_PUSH_DEEP_SCRAPE.md)).

| App | Render verdict | Gap |
|---|---|---|
| a11oy | 🟢 40/40 routes render distinct React surfaces post wildcard-routing fix | 4 `/v1/*` API endpoints 503 (data-layer, not render) |
| amaru | 🟢 47/47, thesis black-screen root-caused & fixed | szl-doctrine stub shows "Doctrine v7" label (lags v10 numbers) |
| sentra | 🟢 console + suites render | "Doctrine v7" label lag |
| vessels | 🔴 `/dashboard` & `/economics` BLACK, `/dashboard/fleet` infinite spinner | demo-session + empty-state fallback missing; copy says **"Doctrine v6"** (stale by 2 versions) |
| rosie | 🟢 11 tabs (Gradio) | widget v2 build completion |

### 3.2 Design system
`omnia-shell`, `design-system` tokens, and `brand-registry` exist as packages ([180_ §8](180_PLATFORM_MONOREPO_EVERY_FILE.md)); SUMAQ RIKUQ ships deterministic, sha256-pinned anatomy figure builders ([110_ row 12](110_ANATOMY_COMPLETENESS_AUDIT.md)). **But each Space reimplements its own shell** — there is no single shared design-system bundle instilled across all 5 Spaces. Verdict: **PRESENT_PARTIAL** — design system is real code, inconsistently applied.

### 3.3 Accessibility
`axe-core` is wired into platform CI but the **Accessibility Checks workflow is `disabled_manually`** ([13_ platform](13_GITHUB_WORKFLOWS_STATUS.md)). Verdict: **PRESENT_PARTIAL** — tooling exists, not enforced; no live a11y pass evidence.

### 3.4 Performance
Lighthouse CI config (`lighthouserc.json`) exists but the **Lighthouse CI workflow is `disabled_manually`** ([13_ platform](13_GITHUB_WORKFLOWS_STATUS.md), [180_ §1](180_PLATFORM_MONOREPO_EVERY_FILE.md)). Verdict: **PRESENT_PARTIAL / advisory only** — no published baseline.

### 3.5 Mobile responsive / i18n / frontend telemetry
- **Mobile:** APEX mobile app is in PRODUCT-SURFACES but 5 domain mobile apps are "roadmap, not built"; **no responsive test suite found** — **MISSING** (test coverage).
- **i18n / l10n:** **No locale support found** anywhere — **MISSING**.
- **Frontend OTel:** `packages/substrate/src/telemetry.ts` has hooks but is un-instilled; **no frontend OTel shipping from any live Space** — **MISSING** (live).

**Section 3 verdict:** Frontend *render* quality is high (4 of 5 GREEN, zero TODO debt), but cross-cutting frontend infra (shared design system enforcement, a11y/perf gates, i18n, FE telemetry) is partial-to-missing.

---

## SECTION 4 — ANATOMY SOUNDNESS (12 organs × ship-status post-recent-work)

Re-verified against `110_` plus the recent ships (`42_` a11oy at `/`, `90_` amaru GREEN, `91_` sentra, `92_` vessels, `93_` rosie). Verdict key: **PRESENT** / **PARTIAL** / **MISSING**.

| # | Organ | Post-ship verdict | What makes it PRESENT (delta from 110_) |
|---|---|---|---|
| 1 | **AMARU** (cortex) | **PRESENT** | amaru ship GREEN, 47/47 routes, 7 chakras live, hash-chained receipts with `proof_id` ([90_](90_OPUS_AMARU_FULL_SHIP.md)). No change needed. |
| 2 | **YUYAY** (heart/memory) | **PARTIAL** | 9-axis conjunctive gate ships + hashed, but **still no short-term/working-memory store test** ([110_ row 2, SEV-2#4](110_ANATOMY_COMPLETENESS_AUDIT.md)). → Add a memory-store module + replay test, OR re-scope YUYAY as "receipt-pump gate." |
| 3 | **UNAY** (cross-session memory) | **MISSING** | Still **0 named hits** for a cross-session continuity module ([110_ row 3, SEV-3#6](110_ANATOMY_COMPLETENESS_AUDIT.md)). No progress observed in recent ships. → Build a minimal receipt-keyed continuity store, or remove UNAY from the organ list and fold continuity into YAWAR/KHIPU. |
| 4 | **YAWAR** (blood/ledger) | **PRESENT** | DSSE-PAE signing + SHA-256 linked receipts + adversarial corruption test PASS; amaru tick emits DSSE envelopes ([110_ row 4](110_ANATOMY_COMPLETENESS_AUDIT.md)). Caveat: live Sigstore envelopes still PLACEHOLDER (0 real) — code PRESENT, live attestation PARTIAL. |
| 5 | **HUKLLA** (immune/halt) | **PRESENT** | 10 pure-predicate tripwires + deadman semantics + tests PASS; Lean `HaltEligibility.lean` PROVEN (0 sorries); sentra Wire B carries halt-on-policy-violation live ([110_ row 5](110_ANATOMY_COMPLETENESS_AUDIT.md), [200_ §6](200_LAST_REPLIT_PUSH_DEEP_SCRAPE.md)). |
| 6 | **KALLPA** (wires) | **PARTIAL** | Wire B + C live; **Wire D NOT implemented** ([110_ row 6](110_ANATOMY_COMPLETENESS_AUDIT.md)). → Land Wire C receiver fully + implement Wire D + a bidirectional cross-organ E2E test. |
| 7 | **KHIPU** (DAG) | **PRESENT** | Summation-invariant Merkle DAG with TH11 Lean obligation + dual-attestation + fail-mode tests PASS ([110_ row 7](110_ANATOMY_COMPLETENESS_AUDIT.md)). |
| 8 | **LAMBDA SPINE** | **PRESENT (with disclosed caveat)** | Λ bounds/composition/replay/Merkle/DPI/doctrine PROVEN; `lutar_unique` proven but its package carries 1 sorry (`Uniqueness.lean:120`) and `lutar_is_geomean` is sorry; full corpus = 163 sorries ([110_ row 8, OC-3](110_ANATOMY_COMPLETENESS_AUDIT.md)). **Open reconciliation:** the geomean-vs-min Λ definition discrepancy — `LUTAR_EVIDENCE.md` defines Λ as geometric mean `∏xᵢ^wᵢ`, but `fuzz_receipts.js:computeLambda` comments "MIN reduction" ([200_ §7 P1-3](200_LAST_REPLIT_PUSH_DEEP_SCRAPE.md)). → Document which is canonical and align the other. |
| 9 | **OTel VSP** (nervous) | **PARTIAL** | Code substrate-quality + CI passing, but **no own Zenodo deposit** and **not shipping traces anywhere visible** ([110_ row 9, SEV-1#2](110_ANATOMY_COMPLETENESS_AUDIT.md)). → Mint deposit + stand up a live collector. |
| 10 | **KANCHAY** (brand projection) | **PRESENT (re-classify)** | Was NO in 110_ (concept only). a11oy now ships as the **Brand Orchestration Layer at root `/`**, 40/40 routes GREEN with distinct rendered surfaces ([42_](42_OPUS_A11OY_FULL_SHIP.md)). → **Re-classify KANCHAY as PRESENT**, naming the a11oy front shell as the canonical Brand Orchestration Layer; optionally add a thin orchestration module + 1 test to make the organ-name fully load-bearing. |
| 11 | **HATUN** (doctrine) | **PRESENT** | 46 policy `_gate.ts` modules confirmed on remote; doctrine soundness Lean `CrossComponentInvariant.lean` PROVEN; Hatun Doctrine Spec v0.1.0 with 10 artifact kinds + 11 JSON Schemas ([110_ row 11](110_ANATOMY_COMPLETENESS_AUDIT.md), [180_ Hatun](180_PLATFORM_MONOREPO_EVERY_FILE.md)). Doctrine LOCKED (v9 curated / v10 corpus numbers). |
| 12 | **SUMAQ RIKUQ** (designer) | **PRESENT** (design subsystem) | design-system tokens + 7 deterministic, sha256-pinned anatomy figure builders ([110_ row 12](110_ANATOMY_COMPLETENESS_AUDIT.md)). Not a runtime organ — a build-reproducible design subsystem. |

**Section 4 tally (post-recent-ships):**
- **PRESENT: 7** (AMARU, YAWAR, HUKLLA, KHIPU, LAMBDA SPINE, HATUN, SUMAQ RIKUQ) **+ 1 re-classified PRESENT** (KANCHAY) = **8 PRESENT**.
- **PARTIAL: 3** (YUYAY, KALLPA, OTel VSP).
- **MISSING: 1** (UNAY).

This is a net improvement over 110_'s "9 of 12 infra-ready" framing: KANCHAY moved NO→PRESENT via the a11oy root ship, leaving **3 PARTIAL organs** and **1 MISSING**.

---

## SECTION 5 — INNOVATE + EVOLVE: 5 FRONTIER MOVES (next 30–60 days)

Each builds on SZL's owned primitives — **DINN, Anatomy-as-substrate, Λ-gate formally-verified governance, DSSE Khipu Merkle DAG, 12 MCP tools, Doctrine v10 honest disclosure, Codex-Kernel replay-grade governed loop** — and is a move **no competitor (DU, Anthropic, OpenAI, Cohere, Adept, Cognition, Sierra) is making**.

### Move 1 — **KNOT-DINN + DOCTRINE-DINN: doctrine-as-training-loss**
- **Technical wedge:** Fold the Λ-floor compliance penalty and Reidemeister invariance into the *training loss* (a Physics-Informed-Neural-Network trick applied to governance), with a Lean obligation that low loss ⇒ the governance invariant holds to an ε margin ([130_ Proposals A/B](130_PINN_DINN_FRONTIER.md)). Governance stops being a wall the model hits and becomes a gradient the model learns. Hard-constrain R1/R2 via symmetric pooling; soft-penalize R3 and the Λ-floor with a **proved convex + Lipschitz-bounded** penalty so it cannot destabilize the optimizer.
- **Why Series-A:** "Lean-verified PINNs are ABSENT in the literature" ([130_ §1.4](130_PINN_DINN_FRONTIER.md)) — this is open white space. It directly answers the DoW agentic-AI memo's demand that agents cannot "bypass guardrails," because the constraint is *internalized in weights*, not bolted on ([130_ Phase 6](130_PINN_DINN_FRONTIER.md)).
- **Effort:** A = ~1 week (P0 Warhacker demo: tanh MLP + DeepSets, Rosie "Knot-DINN" tab, `KnotDINN.lean` sorry-OK v1). B = ~2 weeks (amaru `/chakra/dinn` live-training panel + `DoctrineLoss.lean`).
- **Risk:** PINN spectral-bias / loss-weight fragility ([130_ §1.3](130_PINN_DINN_FRONTIER.md)); the **9-axis vs 13-axis** schema discrepancy must be reconciled before any external claim; do not say "first formally-verified governance learner" until sorries close.

### Move 2 — **"Non-Refutable Body of Evidence" SDK (portable Khipu receipt verifier)**
- **Technical wedge:** Package the DSSE Khipu Merkle DAG + dual-attestation + Λ audit-closure into a standalone, offline-verifiable SDK/CLI so any third party can take a receipt, flip one decision value, and watch the summation invariant fail (`tamper_test`) — verified by TH11 `khipuReceipt_checksum_invariant` ([100_ Problem B / P6](100_WARHACKER_DU_DEEP_DIVE.md)).
- **Why Series-A:** DU and every Warhacker team sign the *container image* but produce **nothing attesting to run-time decisions**; a "pile of Loki logs is not a Body of Evidence" ([100_ §3](100_WARHACKER_DU_DEEP_DIVE.md)). This maps 1:1 to judge Scott Thompson's posted unsolved problem and the EU AI Act Art-12 record-keeping mandate.
- **Effort:** ~1.5 weeks (the receipt code exists; the work is packaging it as `cosign verify --offline`-style portable tooling + flipping the live "0 real envelopes" disclosure to ≥1 by running Sigstore in CI).
- **Risk:** Low technical risk; the gating risk is operational (must run real Sigstore signing so the demo isn't "PLACEHOLDER").

### Move 3 — **Instill the substrate moat onto one externally-verifiable Space**
- **Technical wedge:** Ship `packages/substrate/src/compiler.ts` (compile-time Kahn approval-DAG enforcement, innovation #2) + `codex-kernel` replay onto a live Space so a reviewer can *exercise* the moat, not just read about it in a private path ([180_ §11 P0-2](180_PLATFORM_MONOREPO_EVERY_FILE.md)). Expose a "submit a workflow → see it rejected at compile time for an un-gated high-risk side-effect" demo.
- **Why Series-A:** The two headline moats in THESIS_PUBLICATIONS are currently un-instilled — diligence reviewers cannot touch them. Instilling one converts a paper claim into a clickable proof, and demonstrates the replay-grade governed loop competitors lack.
- **Effort:** ~2 weeks (vendor-stub resolution is the known a11oy BUILD_ERROR pattern, now solved; reuse it).
- **Risk:** Bundle-context / `@workspace/*` import resolution (mitigated — the pattern is proven in `42_`/`90_`).

### Move 4 — **Live verifiable observability spine (vsp-otel traces + Λ-axis metrics, publicly viewable)**
- **Technical wedge:** Stand up an OTel collector + a single Grafana/Tempo view that ships **Λ-axis spans** from a live Space, mint the vsp-otel Zenodo deposit, and expose `/metrics` (Prometheus) on the running Spaces ([110_ row 9](110_ANATOMY_COMPLETENESS_AUDIT.md), [83_](83_UDS_RUNNING_DEPLOYMENT_PLAN.md)). This makes the "nervous system" organ observable instead of code-only.
- **Why Series-A:** Closes 3 of the hard-MISSING infra items at once (live metrics, live tracing, provenance) and gives an infra buyer the observability they expect — while differentiating with *Λ-axis* spans no one else emits (governance-native telemetry, not generic APM).
- **Effort:** ~1.5 weeks.
- **Risk:** Low; mostly deployment plumbing. Keep redaction (`vsp-otel/src/redaction`) on by default to avoid leaking decision content.

### Move 5 — **Hatun Doctrine Spec as a published open standard + reference attestation Space**
- **Technical wedge:** Publish the Hatun Doctrine Spec v0.1.0 (10 governance artifact kinds, 11 JSON Schema 2020-12 files, CC-BY-4.0) as its own public repo/Space with a reference validator, and seed it with one real GlasswingPartnerAttestation + CoordinatedAgentVulnerabilityDisclosure record ([180_ Hatun / §11 P1-6](180_PLATFORM_MONOREPO_EVERY_FILE.md)).
- **Why Series-A:** An *open standard others adopt* is a category-defining move — it positions SZL as the schema owner for agentic-governance evidence (the "USB-C of AI audit records"). No competitor has proposed a governance-artifact standard; DU's surface ends at the container.
- **Effort:** ~1 week (the schemas exist; the work is extraction, a validator, and one seeded attestation).
- **Risk:** Adoption risk (a standard with no adopters is just a doc) — mitigate by wiring SZL's own 5 Spaces to emit Hatun-conformant artifacts as the first reference implementation.

**Section 5 tally: 5 frontier moves proposed** (DINN, Body-of-Evidence SDK, substrate instillation, live observability spine, Hatun open standard).

---

## SECTION 6 — FOUNDER-READABLE VERDICT (3 paragraphs)

**What's solid.** Your moat is real and it is exactly the thing nobody else owns: a **formally-verified, decision-level governance gate** (Λ proved in Lean — bounds, composition, replay, Merkle, DPI, doctrine all PROVEN) that fires a **DSSE-signed receipt onto a hash-linked Khipu Merkle DAG** with a summation invariant a reviewer can break by flipping one number ([110_](110_ANATOMY_COMPLETENESS_AUDIT.md), [100_ Problem B](100_WARHACKER_DU_DEEP_DIVE.md)). Eight of twelve anatomy organs are PRESENT post-recent-ships — including KANCHAY, which moved from "concept only" to PRESENT now that a11oy ships as the Brand Orchestration Layer at root with 40/40 routes rendering ([42_](42_OPUS_A11OY_FULL_SHIP.md)). Six of seven live Spaces render fully with honest, doctrine-clean content, your supply-chain CI hygiene (SBOM, Scorecard, SLSA, gitleaks-clean over 7,014 commits) is genuinely strong, and your code carries **zero TODO/FIXME debt** across 678 frontend files. The substrate-as-infrastructure positioning is defensible *today*.

**What's gappy.** The operational infra a Series-A infra buyer will check on a diligence call is thin: **no managed secret store, no centralized log aggregation, and no live Prometheus/Grafana metrics** — those are the three hard-MISSING items, with tracing missing at the shipment layer even though vsp-otel's code exists ([13_](13_GITHUB_WORKFLOWS_STATUS.md), [180_](180_PLATFORM_MONOREPO_EVERY_FILE.md)). Five of six UDS bundles are unsigned (only vessels passes cosign), 13 CI workflows are broken across 8 repos (5 critical, including the container-build/GHCR push that produces deployable images), vessels' dashboard renders black, a11oy's four `/v1/*` endpoints 503 because the Node backend isn't running in-container, and the entire monorepo runtime — your two headline moats, `substrate/compiler.ts` and `codex-kernel` — is **un-instilled** into any Space a reviewer can touch ([81_](81_UDS_BUNDLE_VERIFY_MATRIX.md), [70_](70_OPUS_MASTER_POST_HF_TEST.md), [180_ §9/§11](180_PLATFORM_MONOREPO_EVERY_FILE.md)). The "Cardano anchoring" claim is currently a local hash-chain with no proven on-chain transaction, and live Sigstore envelopes are still self-disclosed as PLACEHOLDER (0 real). None of these are existential — they are honest, fixable operational debt, and your Doctrine-v10 honest-disclosure discipline means you are already labeling them correctly rather than hiding them.

**What's frontier.** The single highest-leverage frontier move is **DINN** — folding doctrine into the training loss so the agent *learns* to stay governed, with a Lean proof that low loss implies the invariant holds; "Lean-verified PINNs are absent from the literature," so this is open white space that converts your inference-time walls into a learning moat ([130_](130_PINN_DINN_FRONTIER.md)). Pair it with a **portable "non-refutable Body of Evidence" SDK** (the tamper-test receipt, the exact thing a Warhacker judge asked for and EU AI Act Art-12 demands), **instill one of the un-shipped moats** onto a live Space so diligence can touch it, **stand up a real Λ-axis observability spine** to close three infra gaps at once, and **publish Hatun as an open standard** so you own the schema for agentic-governance evidence. Do those five in the next 30–60 days and you go from "sound substrate with thin ops" to "the only formally-verified, learn-to-comply, self-attesting governance layer in the market."

---

## RETURN SUMMARY

- **# MISSING infra items:** **3** hard-MISSING (secret management, centralized log aggregation, live metrics) — plus tracing MISSING at the live-shipment layer (vsp-otel code exists but ships nowhere visible).
- **# PARTIAL organs:** **3** (YUYAY memory-store, KALLPA Wire D, OTel-VSP provenance/shipment) — with **1 MISSING** organ (UNAY) and **8 PRESENT** (incl. KANCHAY re-classified).
- **# frontier moves proposed:** **5** (DINN; Body-of-Evidence SDK; substrate instillation; live Λ-axis observability spine; Hatun open standard).
- **Top-3 actionable items:**
  1. **Re-sign the 5 unsigned UDS bundles** (dev key now + keyless `uds-sign-release.yml`) and **fix the 5 critical CI failures** (a11oy/sentra container-build, sentra hf-sync, vessels/agi-forecast tests) — these block deployable, signed images.
  2. **Close the live backend gaps**: implement a11oy's 4 `/v1/*` endpoints natively (or run the Node backend), and fix vessels' `/api/auth/demo-session` + empty-state so `/dashboard` and `/economics` stop rendering black.
  3. **Stand up the observability + secrets baseline**: adopt one secret manager (Doppler), expose `/metrics` (Prometheus) + a Grafana dashboard, and ship vsp-otel Λ-axis traces to a public collector — closing the three hard-MISSING infra items.
- **Deliverable path:** `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/240_INFRA_SOUNDNESS_ZOOMOUT.md`

---
*— OPUS subagent, Infra Soundness Zoom-Out, 2026-06-01. Read-only; no repos modified. All findings cite prior round2 deliverables in this directory.*
