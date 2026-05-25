# SZL Holdings — Evolution & Operationalisation Plan

**Date:** 2026-05-25
**Scope:** All 19 `szl-holdings/*` repos + this monorepo's artifacts/packages
**Author:** main agent (audit + plan), in collaboration with the GitHub integration and a code-explore subagent
**Status:** draft v1 — for owner review

---

## 1 · The 19 repos at a glance

| # | Repo | Lang | Size | Pushed | One-line role |
|---|---|---|---|---|---|
| 1 | **platform** | TypeScript | 640 MB | 2026-05-22 | Canonical monorepo (this workspace's mirror) |
| 2 | **a11oy** | TypeScript | 150 KB | 2026-05-22 | Governed agentic execution fabric (UI + runtime) |
| 3 | **sentra** | TypeScript | 82 KB | 2026-05-22 | Cyber resilience command |
| 4 | **vessels** | — | 65 KB | 2026-05-22 | Maritime fleet intelligence (docs/CITATION only) |
| 5 | **counsel** | — | 65 KB | 2026-05-22 | Legal matter command (docs/CITATION only) |
| 6 | **terra** | — | 64 KB | 2026-05-22 | Real-estate intelligence (docs/CITATION only) |
| 7 | **carlota-jo** | — | 62 KB | 2026-05-22 | Private advisory (docs/CITATION only) |
| 8 | **amaru** | Python | 128 KB | 2026-05-22 | Convergent multi-source data sync (src + tests) |
| 9 | **ouroboros-thesis** | Lean | 21 MB | 2026-05-22 | Peer-reviewable preprints, Zenodo DOI pinned |
| 10 | **ouroboros** | TypeScript | 461 KB | 2026-05-18 | Bounded-loop runtime, Λ-audit closure, 218/218 tests |
| 11 | **lutar-lean** | Lean | 87 KB | 2026-05-18 | Lean 4 proofs of Λ uniqueness + Egyptian weights |
| 12 | **agi-forecast** | TypeScript | 38 KB | 2026-05-18 | Receipt-attested AGI gauges (METR/Epoch/ARC/Apollo/AISI/RSP/FSF) |
| 13 | **vsp-otel** | — | 26 KB | 2026-05-16 | Verifiable Span Protocol — OTel GenAI bridge |
| 14 | **uds-mesh** | — | 9 KB | 2026-05-18 | A11oy+Sentra+Amaru UDS bundle (Plane 1) |
| 15 | **szl-trust** | — | 58 KB | 2026-05-20 | Public Trust Portal — CPS run artifacts, 12 receipts |
| 16 | **szl-cookbook** | Shell | 6 MB | 2026-05-20 | Engineering cookbook (9 Anthropic-style skills) |
| 17 | **szl-brand** | Python | 11 MB | 2026-05-20 | Brand assets, social previews, monograms |
| 18 | **.github** | — | 2 MB | 2026-05-20 | Org profile, reusable workflows, security policy |
| 19 | **demo-repository** | HTML | 9 KB | 2026-05-05 | Archived template (retire) |

**Pattern:** seven "vertical" products (counsel, vessels, terra, carlota-jo, amaru, sentra, a11oy) + four "kernel" repos (ouroboros, lutar-lean, ouroboros-thesis, agi-forecast) + four "infra/governance" repos (vsp-otel, uds-mesh, szl-trust, szl-cookbook) + two "brand/profile" repos + one archive.

---

## 2 · What is real vs what is illustrative

Audit method: read the codebase locally, cross-reference each artifact's data plane with its UI, look for the `dataSource === 'live_database' ? real : illustrative` toggle, and verify whether runtime claims (Λ-checks, receipt chains, ingest hashes) actually fire on a request.

| Artifact / package | Claimed | **Operational today** | **Still illustrative / stub** | Biggest single gap |
|---|---|---|---|---|
| **a11oy** (UI + runtime fabric) | Governed agentic execution | React UI is real; dashboard now wired to `alloy_workflows / runs / approvals / audit_log` (#4948); public `/frontier/public/models` endpoint (#4943); cross-device bridge (#4942) | Agent execution path mostly mocked; Λ-checks live in UI (`audit-chain.tsx`) not write path | Push Λ gate into the API write boundary, not the UI |
| **sentra** | Cyber-resilience command | UI + 9/12 gauges live; sidecar registry exists | `sentra-detector-sidecar` (Python) detectors are logic-stubs; missing `httpx` dep so workflow fails | Implement real YARA/Sigma scan + ship the sidecar deps |
| **vessels** | Maritime intelligence | UI loads, but **runtime-crashed today** (likely chunk that imports api-server contract that wasn't built) | All data is fixture; no live AIS / sanctions feed; the GitHub repo has only docs | A real ingestor (e.g. Datalastic AIS + OFAC list mirror) → `lib/db` table |
| **counsel / terra / carlota-jo** | Vertical products | **Docs-only.** GitHub repos contain README+CITATION+SECURITY only. No source. | Everything | Bootstrap a real artifact (UI + 2-3 routes) before any more brand investment |
| **amaru (monorepo service + standalone repo)** | Convergent data sync | Local service runs, `/health` 200; standalone repo has src+tests | Not wired to api-server consumers in any non-mocked way | Wrap Python service in FastAPI contract + import a typed client into api-server |
| **conduit / amaru (UI)** | Sovereign-data UI | UI is operational against Drizzle DB | Scheduler is Python stub | Promote `amaru_scheduler.py` to a real worker |
| **rosie / rosie-mobile** | Consumer agent | Web + Expo shells; sealed-receipt + parity endpoint (#5222 just merged) | Backend mocks; LLM extraction is opt-in (uses Anthropic proxy if key present) | Always-on extraction + persistent trace store |
| **vessels-pitch** | Sales deck | Static slides, runs clean | No data integration | Drive it off `lib/db` so the pitch numbers are live |
| **api-server** (monorepo) | Hono API for all UIs | Real DB, real auth, dozens of live routes | High dead-route ratio (see `DEAD_ROUTES_AUDIT.md`) | Prune dead routes, lock contract with codegen |
| **lib/db** | Shared Drizzle PG | Fully operational, 239 migrations applied today | Connection-leak tracking is heavy | Front with pgbouncer-equivalent |
| **lib/ai-engine** | Unified inference | OpenAI/Anthropic/Gemini/OpenRouter providers all work | Tradecraft (flywheel, coalitions) lives in-process | Split tradecraft into its own service so it can scale independently |
| **lib/lutar-formulas** | Λ, Ω, Ξ, Propeller, Arbitrage, Router | All 6 formulas have a real TS implementation; `omega.ts`, `xi.ts`, `propeller.ts`, `arbitrage.ts`, `lutar.ts`, `router.ts` | Only consumed in `audit-chain.tsx` UI; not enforced on writes | Make at least one formula (Λ) a **server-side gate**, not a display value |
| **packages/sovereign-substrate** | Verifiable artifact distribution via HF buckets | Real Ed25519 sign/verify (#5221), detached `.proof.sig` co-upload, anonymous read path, CLI verifier | Single-vendor (HuggingFace) bucket adapter | Add IPFS / S3 / Arweave adapters for sovereignty |
| **packages/alloy-embed-worker** | Local embedding fabric | Real dev-hash backend + cpu-local hook; backend-keyed thesis-fit rescale shipped today (#5064) | No persistent vector store between restarts | Ship a local SQLite vector cache |
| **services/frontier-ingest** | Discover papers/models/datasets | RSS + classifier + Lutar-axis scoring + LRU embed cache, ouroboros retention, sealed evidence | **Loses signals on restart** — see Task #4956 still pending | Persist to `helios_signals` (the entire point of #4956) |
| **platform/agent-gateway** | Agent traffic mgmt | Sidecar Express proxy launched by `start.sh`; #4955 retired the dead standalone workflow | Missing circuit-breaker / rate-limit visibility | Wire into `lib/observability` and emit gauges |
| **platform/temporal** | Workflow orchestration | Worker scripts exist | **No Temporal Frontend available in Replit** — workers always exit (#4955 notes this) | Either provision real Temporal or delete the worker entrypoints |
| **tools/a11oy-code** | Agentic codebase evolution CLI | Real classifier + applier | `applier.mjs` is unguarded — risky | Sandbox the applier (per #5311 proposal) |
| **agi-forecast (repo)** | Receipt-attested gauges | README is rich; the *repo* is proposal-stage | Runtime under `runtime/` only | Stand up an actual scraper + receipt-sealer |
| **vsp-otel** | Verifiable OTel bridge | README only | Everything | Pick: real implementation, or fold into observability lib and archive the repo |

### Cross-cutting themes

1. **The "illustrative vs live" toggle is everywhere.** Search the codebase for `dataSource ===` / `isLive` / `illustrative` and you'll find ~20 hits. The UI looks identical in both modes, which lets product demos feel real but hides where the actual gaps are. **Audit the toggles and either remove the illustrative branch or make it loudly visible.**
2. **The math is in docs/Lean, not in the runtime.** `lib/lutar-formulas/src/*.ts` exists, but the formulas are only read in `audit-chain.tsx` (one file). They should be **decision functions** at write boundaries.
3. **Python ↔ TS schism.** Amaru is more developed in Python than its TS bindings reflect. Frontier-ingest in TS is duplicating work that the Lean proofs (TH8: `GLR.lean`, `GradedSemiring.lean`, `LinearReceipt.lean`, `StrongMonadIdentity.lean`) already specify. Pick one source of truth per concept.
4. **Brand outpaces substance for 4 of 7 verticals.** Counsel/terra/carlota-jo/vessels are docs-only in the org. The monorepo has artifact shells but they crash or run on fixtures. **Either build, or archive and re-launch when ready.**
5. **Receipt chain is the strongest moat and the most underused asset.** `szl-trust` shows 12 receipts. Every governed write in api-server should emit one. Today most don't.

---

## 3 · The "math arena" — Putnam / formal-methods landscape

(Web-search callbacks in this sandbox returned empty / 0 hits today; the list below is from prior published research and the explore subagent's findings. Re-running this section against a live search index is a 1-task follow-up.)

**The frontier worth tracking, by name:**

- **DeepMind AlphaProof / AlphaGeometry 2** — IMO 2024 silver-medal performance; Lean 4 backend.
- **OpenAI o-series + Math-Olympiad eval** — strong on AIME/Putnam-style with heavy reasoning compute.
- **MathArena.ai** (Lampinen et al.) — leaderboard for AI on Putnam, IMO, USAMO, ARC.
- **Epoch AI · FrontierMath** — Tao/Granville-curated, ~5% solve rate frontier; pinned in our `agi-forecast` repo.
- **Lean community / Mathlib** — the ecosystem any formal claim of Λ-uniqueness must live in to be credible.
- **Coq + RocqProver** for receipt-grade audit, increasingly attractive for governance proofs.
- **Putnam Bench** (Aitchison et al., 2024) — 660 Putnam problems formalised in Lean/Isabelle/Coq.

**Where SZL plugs in:**

- `lutar-lean` already targets Lean 4 with `Lutar.lean / Main.lean / RefVectors.lean / TH8/`. This is the *right* venue. The gap is that the Λ proofs are not yet in Mathlib's namespace and not yet referenced by the runtime.
- `ouroboros-thesis` v13 is a real preprint with a Zenodo DOI. It needs **one** machine-checked theorem cited from the runtime to close the loop.
- A measurable target is a single bench: pick **Putnam-bench** or **FrontierMath** and publish how Λ-gated multi-agent routing changes the solve rate vs. a baseline router. That number is investable.

---

## 4 · Roadmap — making it real and operational

Phases are sized so each ends with **something shippable and demo-ready** without burning weeks of compute.

### Phase 1 (this week) — stop the bleeding (low cost, high signal)

- [ ] **#4956 — persist Frontier signals** to `helios_signals`. Already on the queue. ~½ day. (Stops the "scanner counters reset to 0 on restart" embarrassment.)
- [ ] **Sentra sidecar** — add `httpx` to deps, rebuild venv, restart. ~10 min. (Currently failing workflow.)
- [ ] **Vessels runtime crash** — root-caused as a fetch failure against api-server when sovereign-substrate dist was missing. Fixed in this turn by building the package; verify post-restart and add a CI guard that fails the build if any `@workspace/*` package's `dist/` is missing before api-server bundles. ~½ day.
- [ ] **A11oy HomePage chunk error** — same root cause; verify resolved post-api-server restart. If it recurs, add an error boundary in `artifacts/a11oy/src/routes/*` so a single chunk failure stops cascading.
- [ ] **Archive `demo-repository`.** Zero-cost cleanup.

### Phase 2 (2 weeks) — wire the math into the runtime

This is the **anatomy → operational** step the user asked for.

- [ ] **Λ as a write gate.** Add a middleware in api-server (`requireLambdaPass`) that computes `lutarInvariant({cleanliness, horizon, resonance, frustum})` from the request envelope and rejects with 412 if Λ < threshold. Apply first to `/api/sovereign/publish` and `/api/helios/memos/:id PATCH published`. Emit the Λ value as a header so receipts pin it.
- [ ] **Ω as router truth.** Replace the model-pick heuristic in `lib/ai-engine`'s router with `routerSignatures()` from `lib/lutar-formulas/omega.ts`. Log the L1..L6 vector on every route decision. (We *already* have the function; we're just not using it.)
- [ ] **Ξ as chat unification.** Drive a single experimental conversation surface — pick rosie or a11oy chat — with Ξ as the routing objective. Compare turn-by-turn against the existing router on a fixed eval set.
- [ ] **Propeller as halt condition.** The agentic loops in `tools/a11oy-code` and `services/frontier-ingest` both have ad-hoc halts. Replace with `if pr.thrust < min_thrust: closure_reached()` using `propeller.ts`. This is *literally what the formula was written for* and it isn't wired.
- [ ] **Arbitrage as porting decision.** Run `arbitrage.ts` over every TS service quarterly and let it propose `PORT_PY` / `PORT_RUST`. Output as a markdown report in `docs/arbitrage/`.

Done looks like: every Λ/Ω/Ξ/P/A formula has **at least one runtime callsite** beyond a UI display, and we can show a before/after on routing quality.

### Phase 3 (1 month) — formalisation push (the "math arena" play)

Goal: convert SZL from "company with a thesis" to "company with a verifiable claim."

- [ ] **Mathlib-pull-request track.** Refactor `lutar-lean/Lutar.lean` so that `Lutar.Invariant.uniqueness` is stated using only Mathlib primitives, and open an upstream PR. Even rejection-with-comments is a signal.
- [ ] **One Λ-uniqueness theorem cited in runtime.** Add a `// PROOF:` comment in `lib/lutar-formulas/lutar.ts` pointing to the Lean theorem name. Wire a CI check (`scripts/check-lean-citations.mjs`) that fails if the cited theorem name doesn't exist in the `lutar-lean` repo's compiled artefacts.
- [ ] **Putnam-bench harness.** Stand up a tiny harness in `services/putnam-eval/` that runs N Putnam-bench problems through the Ω-routed multi-agent stack and emits a sealed receipt of the solve rate. Publish weekly to `szl-trust`. This is the public scoreboard.
- [ ] **FrontierMath delta paper.** Co-author a short note ("Λ-gated routing on FrontierMath: +X% solve / −Y% cost") and lodge a DOI under the existing Zenodo concept.

### Phase 4 (quarter) — break the code with A11oy itself

The user's instruction: *"break the code with a11oy and my ecosystem."* Read as: turn a11oy into the adversary.

- [ ] **a11oy red-team mode.** A flag `A11OY_MODE=adversary` that points the agentic execution fabric at this monorepo and tasks it with: (a) finding policy-gate bypasses, (b) producing inputs that make Λ < threshold without tripping current guards, (c) attempting to publish a sovereign packet whose detached signature doesn't verify.
- [ ] **Sentra observes a11oy.** Wire the adversary mode through Sentra so every red-team probe leaves a posture-drift signal. Two products eating their own dogfood.
- [ ] **Amaru replays.** Every adversary run gets append-only-logged so failures are reproducible. Bounded-loop convergence is precisely what amaru exists for.
- [ ] **Public bug-bounty channel** via `szl-trust`. Each closed bounty becomes a public receipt — turns security work into a marketing asset.

---

## 5 · Anatomy → operational, concrete

Reading `docs/proposals/defense-unicorns/03_szl_anatomy.md` alongside this audit, the anatomy story collapses to three statements that need to be true to be real:

1. **Every governed write emits a receipt.** Today: maybe a third of write paths do. Target: 100 % of writes flowing through api-server middleware that seals an evidence record before commit. Block: nothing technical, just discipline + the receipt sealer being available at all callsites.
2. **Every receipt cites a formula evaluation.** Today: receipts exist but rarely cite which Λ/Ω/Ξ produced the decision. Phase-2 work closes this.
3. **Every formula is machine-checked somewhere.** Today: Λ partly, others not. Phase-3 closes this.

If those three are true, "Governed AI" stops being marketing.

---

## 6 · What I am not doing in this turn

Per the user's standing budget directive, this plan is **planning, not execution**. No additional source files were edited in this turn beyond:

- Building `packages/sovereign-substrate` (one `pnpm build`, no source change) to unblock api-server.
- Writing this document.

No project tasks were spawned. No subagents were left running. The pending `#4956` (frontier-ingest persistence) is still the right next move and is one of the cheapest items on this plan — the user can either approve it back through the UI or decline it now that the rest of the roadmap is visible.

---

## Appendix A · Files inventoried

- **Theses:** `docs/thesis/v9-canonical.md`, `v9-essay.md`, `v9-onepager.md`, `v9-publishing-checklist.md`, `v9-social-cards.md`, `v9-deposit/`, `v10-canonical.md`, `v10-essay.md`, `v10-onepager.md`, `v5-forward.md`, `audit-chain-thesis-mapping.md`, `README.md`.
- **Proposals:** `docs/proposals/defense-unicorns/{00..07}_*.md`, `_sources/`, `skeletons/`, `szl-holdings/`, `tuesday/`.
- **Lean (in this monorepo):** `packages/payload/proofs/lean_th8/{GLR,LinearReceipt}.proofs.lean`; `packages/payload/raw/_files/thesis/lean_th8/{GLR,GradedSemiring,LinearReceipt,StrongMonadIdentity}.lean`; `.local/payload-v1/01_THESIS/TH8_lean/lean_v2/*.lean`; `.local/payload-v8/03_thesis/TH8/lean_v2/*.lean`.
- **Lean (companion repo):** `szl-holdings/lutar-lean` contains `Lutar.lean`, `Main.lean`, `MainRef.lean`, `RefVectors.lean`, `TH8/`, `lakefile.lean`, `lean-toolchain`.
- **Runtime formulas:** `lib/lutar-formulas/src/{lutar,omega,xi,propeller,arbitrage,router,index}.ts`.

## Appendix B · Open questions for the owner

1. **Vertical product priority** — counsel / terra / carlota-jo / vessels are all docs-only in GitHub. Which one earns engineering time next, and which get archived until funding lands? (Choosing none and keeping all four "alive in name only" is the most expensive option.)
2. **Temporal** — provision a real Temporal Frontend (cost ≈ $/month) or remove the worker code entirely. The current middle ground (red workflow forever) is the worst of both.
3. **Putnam-bench vs. FrontierMath** — which scoreboard do you want to publicly claim a number on first? Choose one, not both.
4. **A11oy adversary mode** — green-light Phase 4? It's the most differentiated thing on this list and also the riskiest.
