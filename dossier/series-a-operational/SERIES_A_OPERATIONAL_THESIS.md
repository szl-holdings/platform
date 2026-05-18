# SZL Holdings — Series A Operational Thesis

> Deep analysis of the public GitHub org + the private `platform` monorepo, mapped against the Ouroboros Thesis chain (v1 → v14) and the four flagship apps (a11oy · amaru · sentra · vessels). Written 2026‑05‑18.

---

## 0. Headline

You have **two parallel realities** right now and they are quietly drifting apart:

| Reality | What's there | Operational? |
|---|---|---|
| **Public (`github.com/szl-holdings`)** — 18 repos | Thesis v1–v14, Lean kernel, runtime, doctrine, brand, cookbook, trust portal, 8 product repos (a11oy, amaru, sentra, vessels, terra, counsel, carlota-jo, agi-forecast), vsp-otel, lutar-lean | **Docs + receipts only.** Most "product" repos are alpha shells whose only commits this week were CITATION/DOI/badge updates. |
| **Private (`platform` monorepo, this workspace)** — 9 registered artifacts | 848 DB tables, 5,524 API endpoints, 126 packages, the actual running code | **Live.** But four of the seven verticals (terra, counsel, carlota-jo, lexicon/rosie/pulse) aren't wired through the a11oy orchestration bridge yet, and several "flagship" pages still ship setTimeout theater. |

The thesis says you have an **anatomy** (HEART/HANDS/FEET/WIRES/BRAIN/IMMUNE SYSTEM). The runtime only has a torso. The Series A bar is: make the body whole, make every limb signed, and make the public repos reflect what the private platform actually does — not what the badges claim.

---

## 1. GitHub org inventory (18 repos)

### 1.1 Foundation / science layer
| Repo | Role | Last push | Health |
|---|---|---|---|
| `ouroboros-thesis` | The v1→v14 paper chain (Zenodo DOI ladder, 14 Lean skeletons, anatomy figures) | 2026‑05‑18 | ✅ Active, **v14 landed today** |
| `ouroboros` | TS runtime, v6.3.0, 218/218 tests, ClusterFuzzLite, lambda‑gate CWE‑209 fix | 2026‑05‑18 | ✅ Strongest repo |
| `lutar-lean` | Machine‑checked Lean 4 proofs (Λ_k uniqueness) | 2026‑05‑18 | ✅ But TH8 still has sorries |
| `vsp-otel` | Verifiable Span Protocol bridge (OTel GenAI semconv → signed envelopes) | 2026‑05‑16 | ⚠️ 6 open issues, low traffic |
| `agi-forecast` | Lutar‑Forecast Gauge (METR/Epoch/ARC/Apollo/AISI) | 2026‑05‑18 | ⚠️ "Pre‑implementation (proposal stage)" — README admits it |

### 1.2 Doctrine & trust
| Repo | Role | Status |
|---|---|---|
| `.github` | Org profile, doctrine constants | ✅ |
| `szl-trust` | Public Trust Portal (CPS run artifacts) | ⚠️ 52 KB — receipts but no front‑end |
| `szl-brand` | Social previews, logo monograms | ✅ Asset‑only |
| `szl-cookbook` | 9 engineering skills (Anthropic pattern) | ✅ 1 open issue |

### 1.3 Product (the 8 flagship slugs)
| Repo | Pos | What it actually contains today |
|---|---|---|
| `a11oy` | Brand orchestration / decision intelligence | **Docs + packages/**, no app. The real app is `artifacts/a11oy/` in the private monorepo. |
| `amaru` | Convergent multi‑source sync | Docs + `src/` + `tests/`. Real engine in `services/amaru` + `artifacts/conduit`. |
| `sentra` | Cyber resilience command | Docs + `runtime/` + `src/`. Real app in `artifacts/sentra`. |
| `vessels` | Maritime fleet intel | **Docs‑only** (no src/ on public repo). Real app in `artifacts/vessels`. |
| `terra` | Real estate intel | Docs‑only. **No `artifacts/terra/` in private monorepo** — gap. |
| `counsel` | Legal matter command | Docs‑only. `artifacts/counsel/` exists privately but not orchestrated through a11oy. |
| `carlota-jo` | Concierge advisory | Docs‑only. `artifacts/carlota-jo/` exists privately, also not orchestrated. |
| `platform` | The private monorepo we're in | 637 MB; see auto-generated test/package counts at end of file |

### 1.4 The drift
Every product repo got the same three commits this week: `name-suffix "Jr."`, `doctrine drift sweep v12/v13/v6.3.0`, `thesis v13 DOI badge`. **Public commits are doctrine paperwork, not product code.** That's not a sin — but a Series A diligence team will notice the daylight between badge density and shipping cadence.

---

## 2. The thesis chain v1 → v14 (one paragraph each)

| v | DOI suffix | One‑line claim | What landed in code |
|---|---|---|---|
| **v1** | 19867281 | Three‑term foundation (Energy, Mass, Info) — `Tria Prima` | `lutarV1` kernel |
| **v2** | 19934129 | **Looped computation as a system primitive**; 7‑term Prisca‑closed | Loop Kernel, DepthAllocator, ConsistencyChecker |
| **v3** | 19944926 | Cross‑civilizational coupling (Egyptian / Inca weights) | 4‑axis runtime envelope; **concept DOI = umbrella** |
| **v4** | 19983066 | Noether symmetry closure; **Λ‑9 invariant introduced** | 9‑axis scalar, uniqueness theorem |
| **v5** | 20020841 | Federation over fleets; "stack of one" orchestration | **Aspirational** — federation layer slated Q4 2026 |
| **v6** | 20020845 | Lambda‑as‑a‑Service; Holographic‑Twistor‑Cyclic | `POST /api/ouroboros/a11oy/guard` shipped |
| **v7** | 20020846 | Newton Codex; Bianchi closure | 60‑node TS knowledge graph |
| **v8** | 20020848 | Civilizational discrete gauge group | Prisca‑coupling terms in code |
| **v9** | 20020849 | Unified Operational; Bekenstein holographic bound | 75 nodes / 94 edges in Supreme Codex |
| **v10** | 20053148 | Λ₁₀ meta‑invariant; **Lean 4 mechanization begins** | `lutarV10Audit()`; sorry count published |
| **v11** | 20053163 | Doctrine V6; 35 theorems published, 8 sorries open | TH1–TH7 mechanized; TH8 = proposal |
| **v12** | 20119582 | Graded Λ‑Receipt Calculus (GΛR) | Skeleton only; closure pending |
| **v13** | 20162352 | **"Anatomy as Architecture"** — Quechua namespace | All five seeds byte‑identical replay; **PASS gate** |
| **v13.1** | 20195368 | Master deposit (audit consolidation) | Re‑release for arXiv |
| **v14** | PENDING | **Lutar Calculus + Unified Extension + ML/AI Methodology** — TH13–TH16 | **Landed today on GitHub, not yet in runtime** |

### 2.1 The anatomy v13/v14 gives you (use this as your common language)

| Region | Quechua name | What it is | Where it lives today |
|---|---|---|---|
| **HEART** | `yuyay_v3` | 13‑axis conjunctive admission gate | `packages/ouroboros` |
| **HANDS** | `maki` (5 fingers) | Hashed retrieval fingers | partial — `aef-retrieval-core`, `alloy-agentic-rag` |
| **FEET** | `chaki` | Postgres + pgvector substrate | ✅ Replit DB (848 tables) |
| **WIRES** | `yawar` (bus) + `huklla` (tripwires) | 20‑line append‑only receipt bus + 660‑line policy layer | `aef-evidence-ledger`, `lib/covenant-policy` |
| **BRAIN** | `hatun` | Kernel orchestrator | `packages/codex-kernel` |
| **IMMUNE SYSTEM** | `sentra` | Adversarial validation | `artifacts/sentra` + `lib/sentra-defense` |

**This is the unifying frame for everything below.** The four flagship apps map directly: a11oy = BRAIN's console, amaru = HANDS' ingestion limb, sentra = IMMUNE SYSTEM, vessels = first organ that proves the body works on a regulated domain.

---

## 3. App‑by‑app anatomy & "real vs theater" audit

### 3.1 a11oy — the BRAIN console (orchestrator)
- **Real:** governance gates · agent identity registry · workcell replay · Mythos Doctrine 21 PG tables · SentraOps / VesselsOps bridges (live as of today).
- **Theater:** `pages/psyche/*` ("Cognitive Reflexivity", "Selfhood Trace") = mocked. `IntentRouter.tsx` has multiple `TODO: recursive self‑correction` stubs.
- **Gap to thesis:** v14 introduces the **Lutar Calculus categorical semantics** — a11oy still has no `λ`‑category visualizer. The hub is the natural home for it.

### 3.2 amaru — HANDS ingestion (the 5 fingers `maki`)
- **Real:** sync engine, credential validation, connector framework, conduitSyncs/Connections tables.
- **Theater:** `innovation/sim-theater.tsx` is explicitly labeled theater; `mappings.ts` has FIXME on circular‑dep detection in the **quipu‑wari** mapper agent.
- **Gap to thesis:** v13 specifies **five hashed retrieval fingers**. Amaru ships one (RDBMS reverse‑ETL). The other four (web, file, vector, structured) are scaffolded in `aef-retrieval-core` but not exposed through Amaru's UI.

### 3.3 sentra — IMMUNE SYSTEM
- **Real:** alert triage, incident commander, CPS payload format, `/api/sentra/*` CRUD, Overwatch r0513.
- **Theater:** "Sentience Duel" + "Quantum Threat Surface" use hardcoded seed data; `action-queue.tsx` has setTimeout demo timing.
- **Gap:** thesis v11 names sentra as the **adversarial validation layer** for the whole runtime — but today it only validates itself. The crisis‑simulator should be able to fire at a11oy/vessels/amaru and record receipts.

### 3.4 vessels — first regulated organ
- **Real:** fleet tracking, voyage P&L, sanctions screening, AIS ingest, **ops‑core/snapshot endpoint now public** (just shipped), VesselsOps mirror in a11oy.
- **Theater (post‑today):** cortex‑ssm `validateAndAdd` + `mintCovenantKey` are still setTimeout stubs; "Voyage Twin" / "Route Anomaly" fall back to Modeled Mode without a badge; `vessels-approval-review.tsx` has a "Demo Only" handler bypass.
- **Gap to thesis:** v14 §7 promises **10 regulated‑industry compliance frameworks via vertical covenant policy mappings**. Vessels only maps to OFAC/SDN today. Maritime alone touches: SOLAS, MARPOL, ISPS, BWM, MLC — five frameworks unclaimed.

---

## 4. The "promised but not built" delta (the canonical gap list)

These are referenced in published docs or shipped badges but absent from running code. Diligence will find them — better you fix them first.

| # | Promised | Doc evidence | Code reality | Severity |
|---|---|---|---|---|
| 1 | Federation Layer (v5.1, "stack of one") | `docs/thesis/v5-forward.md` §2 | No `packages/federation`; no `/api/federation/*` | **HIGH** — it's the thesis cover claim |
| 2 | Lean 4 mechanization TH8a–c | `03_szl_anatomy.md` §3.2 | 8 sorries open in `fly_high_v6_audit`; v14 only proves TH6, TH13–16 still proof sketches | **HIGH** — every README links the Lean badge |
| 3 | OpenUSD export adapter | `system-overview.md` §208 | `ENABLE_OPENUSD_EXPORTS=off`; stub | MED |
| 4 | NVIDIA NIM provider | §217 | `ENABLE_NIM_PROVIDER=off` | MED |
| 5 | Executive Safe Mode | §217 | `ENABLE_EXECUTIVE_SAFE_MODE=off` | MED |
| 6 | Sovereign infrastructure (v6.0) | `v5-forward.md` §3 | `v1.0.0-alpha`; window Q4 2027 | LOW (honest window) |
| 7 | Curry‑Howard receipt calculus (TH7) | `03_szl_anatomy.md` §3.2 | TH7 mechanized; **but the runtime doesn't emit categorically‑typed receipts yet** — only signed envelopes | HIGH — the thesis‑to‑runtime link |
| 8 | Terra (`/terra/`) artifact | `SOURCE_OF_TRUTH.md` row 4 | Public repo exists, **no `artifacts/terra/`** in private monorepo | HIGH — listed as one of 7 verticals |
| 9 | A11oy → Counsel / Carlota‑Jo / Pulse / Lexicon / Rosie orchestration bridges | `replit.md` "powers and orchestrates all verticals" | Only sentra + vessels have a `*-store.ts` bridge today | MED — pattern is now proven, just needs replication |
| 10 | Vessels cortex‑ssm real handlers | `vessels` README "operational" | `setTimeout` stubs in `validateAndAdd`, `mintCovenantKey` | MED — flagged but easy to ship |
| 11 | agi‑forecast operational gauge | repo README "Pre‑implementation (proposal stage)" | matches reality but the **README badges on every other repo** link to it as if it ships | LOW (self‑honest) |
| 12 | Public product repos contain the product | every product repo claims `runtime · thesis · lean` | repos are docs + CITATION shells; real code is private | **HIGH for public trust** |

---

## 5. Recommendations — make it real & operational

Five concrete moves, in dependency order. Each is shippable in a discrete sprint.

### Move 1 — Universal a11oy orchestration bridge (1 sprint)
The vessels pattern shipped today (`artifacts/vessels/src/lib/vessels-store.ts` + `/api/vessels/ops-core/snapshot` public + `artifacts/a11oy/src/pages/VesselsOps.tsx`) is the template. Replicate for **every artifact**:

```
artifacts/{X}/src/lib/{X}-store.ts   → polls /api/{X}/ops-core/snapshot
artifacts/api-server/src/routes/{X}-ops-core.ts   → auth({required:false}), aggregate counters only
artifacts/a11oy/src/pages/{X}Ops.tsx   → mirrors agents/modules/doctrine tabs
```
Targets: **conduit (amaru), counsel, carlota-jo, terra (build first), pulse, lexicon.** This is what makes "a11oy orchestrates all apps" true instead of slide copy. Effort: ~3 hours per app once the contract is fixed.

### Move 2 — Receipt envelope on every cross‑app event (v14 → runtime, 1–2 sprints)
v14 §6 defines the Lutar Calculus: receipts are typed objects, edges in the body‑graph. Today you emit JSON envelopes with provenance, but they aren't **categorically typed** (no morphism composition, no normal‑form canonicalization).

- Add `packages/lutar-calculus` exporting `ReceiptType<S,T>`, `compose`, `normalize`.
- Wrap `aef-evidence-ledger` writes so every entry has a typed source / target region (HEART, HANDS, FEET, WIRES, BRAIN, IMMUNE — the v13 vocabulary).
- Surface in a11oy as a "Body Graph" viz at `/a11oy/body-graph` (force‑directed, colored by region). This **proves** the anatomy claim, doesn't just narrate it.

### Move 3 — Kill the theater, replace with honest "Modeled" badges (1 sprint)
For everything that today falls back to seed data:
- `vessels` Voyage Twin / Route Anomaly → render a `<ModeledBadge mode="seed" reason="live AIS unavailable" />` instead of pretending.
- `sentra` Sentience Duel / Quantum Threat → same, plus a "Promote to live" CTA that opens an issue.
- `a11oy` psyche pages → either ship the real `IntentRouter` self‑correction loop or move to `/a11oy/research/*`.
- Vessels cortex‑ssm `setTimeout` stubs → either wire to `/api/cortex/ssm/*` or surface a `disabled + tooltip("Q3 2026")`.

This converts a diligence liability (silent mocks) into a credibility asset (named gaps).

### Move 4 — Make the public repos true mirrors (1 sprint)
The 8 product repos shouldn't carry runtime test badges they don't run. Two options, pick one per repo:
- **(a) Honest docs repo:** strip the runtime badges, keep CITATION/DOI/SECURITY, state "this is the public docs surface; product source is `szl-holdings/platform` (private)."
- **(b) Open‑core extraction:** publish the **types + contracts** (e.g., `packages/aef-contracts`, vessels OpenAPI snapshot schema) so external readers can verify receipts against the published schema. This is the strongest move for `vsp-otel` because the protocol is the product.

Per‑repo recommendation:
- `a11oy`, `amaru`, `sentra`, `vessels`, `terra`, `counsel`, `carlota-jo`: option (a) for now, option (b) over the next quarter for whichever vertical pilots first.
- `vsp-otel`, `agi-forecast`: option (b) immediately — these *are* the public contract.
- `ouroboros`, `lutar-lean`: already option (b), ✅.

### Move 5 — Close the TH8 sorries and ship the federation skeleton (2 sprints)
- TH8 Lean closure: assign one of the 8 sorries per week to a Math‑Pod cycle (the v14 paper section 8 already names the pod model — operationalize it).
- Federation skeleton (v5 promise): `packages/federation` exposes `register(node)`, `gossip(receipt)`, `quorum(λ_9)`. Even a one‑node "federation" with the contract shipped beats the current zero. Then add a second node = `artifacts/api-server` itself federating to a published Vercel function carrying a different signing DID.

---

## 6. What "innovate" looks like next (inspo, mapped)

The thesis v14 already cites the right frontier (LangGraph, Mastra, Microsoft Magentic, IETF SCITT, OTel GenAI semconv). The differentiators worth pressing on:

| External pattern | SZL move that beats it |
|---|---|
| **IETF SCITT** (signed receipts for software supply chain) | Position v14's `lambda9_mask` as a **privacy‑preserving SCITT extension** (already drafted §7). File an Internet‑Draft. |
| **OTel GenAI semconv** (span schema for LLM calls) | `vsp-otel` is the verifiable‑span layer on top. Land a reference implementation that any OTel collector can verify. |
| **LangGraph** (graph‑based agent orchestration) | a11oy's `BodyGraph` view is the **anatomical** counterpart — regions, not just nodes. Publish a "LangGraph → Lutar Calculus" adapter. |
| **Microsoft Magentic** (multi‑agent runtime) | sentra's crisis simulator can fire **Magentic agents** at the SZL runtime and record receipts → a public benchmark. v14 already references AgentBench receipts (`agentbench-receipts.ndjson`). |
| **Replit Agent + Anthropic Skills v2** | szl‑cookbook is the SZL flavor. Cross‑link each cookbook skill to a Lutar receipt schema; cookbook becomes "Anthropic Skills with proofs." |

---

## 7. The 30‑60‑90 (concrete)

**Days 0–30 — *Bridge everything***
- Ship Move 1 for amaru/conduit, counsel, carlota‑jo. (Defer terra until artifact exists.)
- Ship Move 3 (kill theater) on vessels + sentra; clean Modeled badges everywhere.
- Add `terra` artifact scaffold so SOURCE_OF_TRUTH count of 7 verticals matches reality.

**Days 30–60 — *Type the receipts***
- Ship Move 2 (`packages/lutar-calculus` + Body Graph viz at `/a11oy/body-graph`).
- Public repos: execute Move 4 option (a) on all five docs‑shell repos.
- Open `vsp-otel` reference collector PR + Internet‑Draft for SCITT extension.

**Days 60–90 — *Federate & prove***
- Ship Move 5: TH8 sorries 1–4 closed; `packages/federation` skeleton with one external node.
- Vessels: add 5 regulated frameworks (SOLAS / MARPOL / ISPS / BWM / MLC) — covenant policy mapping per v14 §7.
- Publish v15 thesis update covering the runtime closure of v14's proof sketches.

---

## 8. Diligence one‑liner you can put in the deck

> SZL Holdings is a 14‑version Lean‑mechanized thesis, an Apache‑2.0 runtime with 218/218 passing tests + ClusterFuzzLite, a private platform of 848 DB tables (current monorepo test/package counts are auto-generated at the end of this file — never hand-edit), and an anatomy — HEART · HANDS · FEET · WIRES · BRAIN · IMMUNE SYSTEM — proven on regulated maritime workloads today, with cyber, legal, real‑estate, and concierge verticals following the same orchestration spine.

That sentence is true today **for vessels and sentra only.** Ship Move 1, Move 2, and Move 3 and it's true for the whole company.

---

*Compiled 2026‑05‑18 against `szl-holdings/*` HEAD and `platform` HEAD. Re‑verify counts via `SOURCE_OF_TRUTH.md` commands before quoting externally.*

<!-- AUTOGEN:test-package-counts START -->
<!-- Regenerate with: node scripts/count-tests-and-packages.mjs --write -->
**Platform monorepo:** 8,682 test declarations across 640 test files in 206 workspace packages. _(measured 2026-05-18)_
<!-- AUTOGEN:test-package-counts END -->
