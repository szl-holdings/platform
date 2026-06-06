# A11oy + API Server — Full Build Roadmap (for Perplexity / any agent to make it real)

> Purpose: a single, self-contained brief that an external builder (Perplexity, an
> AI coding agent, or a new engineer) can follow to take the **A11oy** front-end and
> the shared **API Server** from their current prototype-rich state to a real,
> production-grade, sellable product. This document is intentionally concrete:
> what exists today, what is real vs. demo, and the exact phased work to make it real.

Repository: `szl-holdings/szl-holdings-platform`
Snapshot branch with everything: `replit-snapshot-2026-05-29`
Stack: pnpm monorepo · TypeScript 5.9 · React 19 · Vite · Node 24 · Express 5 · Drizzle ORM · PostgreSQL

---

## 0. TL;DR of current state

| Thing | Count / Fact |
|---|---|
| Artifacts (apps) in monorepo | 20 (web, mobile, slides, api-server) |
| A11oy front-end pages | 195 `.tsx` pages |
| A11oy data modules | 26 |
| API server route files | 476 |
| Shared packages (`packages/`) | 164 |
| Database | PostgreSQL via Drizzle, 242 migration files |

**Honest assessment:** A11oy today is an exceptionally broad, well-designed
*narrative + prototype surface*. It demonstrates a coherent governance doctrine
across ~195 pages and ~476 API routes. The gap between "impressive demo" and
"real product" is not breadth — it is **depth on a small number of flows**:
real auth, real tenant data, real persistence, real billing, and a tight set of
end-to-end workflows that a paying customer uses every day.

The roadmap below is therefore about **subtraction and depth**, not adding more pages.

---

## 1. What A11oy *is* (the product thesis)

A11oy is the **governed enterprise AI hub** for regulated industries. It is the
control plane that sits over every AI agent, model, dataset, workflow, and
decision an organization runs, and it produces an **immutable, auditable proof
trail** for each one.

Core promise: *"Run AI in regulated environments with provable governance —
every decision is policy-checked, evidence-bound, and replayable."*

The pillars (already expressed in code under `lib/shared-ui` and `packages/`):

1. **FORGE Execution Fabric** — human-in-the-loop governance, outcome graph, proof chain, covenant policy.
2. **Proof Chain** — append-only, hash-chained audit ledger of every agent action.
3. **SIGIL trust scoring** — closed-form weighted geometric mean over Provenance, Containment, Coherence, Convergence axes → a single monotonic trust score.
4. **Covenant Policies** — declarative, compiled policies enforced at runtime.
5. **Ouroboros Loop Kernel** — bounded, convergent, replay-grade agent loops.
6. **Domain packs** — Vessels (maritime), Terra (real estate), Sentra (cyber), Aegis (defense), Counsel (legal).

## 2. What the API Server *is*

A single **Express 5** backend serving every front-end artifact. Routes are
scoped `/api/<domain>/`. It owns:
- OIDC/PKCE auth + sessions
- Multi-provider AI orchestration (Anthropic, OpenAI, Gemini) via the Replit AI proxy
- All DB access via Drizzle ORM
- Webhook ingestion + automation bridges
- The Proof Chain audit trail
- The `X-App-Mode` runtime header (demo vs. live mode)

---

## 3. The "make it real" gap analysis

Before building, classify every surface into one of three buckets:

| Bucket | Meaning | Action |
|---|---|---|
| **REAL** | Backed by DB + auth + tested | Keep, harden |
| **DEMO** | Renders fixture/seeded data | Either wire to real data or quarantine behind a demo flag |
| **NARRATIVE** | Doctrine / investor / explainer pages | Keep as marketing, exclude from the product SLA |

**First deliverable of any builder:** a spreadsheet/issue list that tags all 195
pages and 476 routes into these three buckets. You cannot make it real until you
know what "it" is. ~80% of pages are likely NARRATIVE or DEMO; the real product
is probably 15–25 pages and 30–50 routes.

---

## 4. Phased roadmap

### Phase 0 — Ground truth (1 week)
- [ ] Run the full monorepo locally: `pnpm install` → start `api-server` + `a11oy`.
- [ ] Stand up a real PostgreSQL (already wired via `DATABASE_URL`); run `pnpm --filter @szl-holdings/db migrate`.
- [ ] Bucket every page/route (REAL/DEMO/NARRATIVE) — see §3.
- [ ] Pick **one** vertical to make real first. Recommendation: **Sentra (cyber)** or **Vessels (maritime)** — both have the most mature data models.
- [ ] Define 3–5 "golden journeys" a paying user performs daily. Everything else is secondary.

### Phase 1 — Real identity & tenancy (2–3 weeks)
- [ ] Lock down auth: choose Clerk (recommended, `clerk-auth` skill) or Replit Auth. Wire real sign-in/sign-up.
- [ ] Enforce **multi-tenant scoping** on every REAL route — every query filtered by `org_id`. (Several routes already assert tenant scope; extend to all REAL routes.)
- [ ] Replace fixture data on the chosen vertical's surfaces with real tenant data (tasks like "Replace fixture data on Ownership/Distress/Knowledge surfaces" already track this).
- [ ] Admin-only access control on registry/config endpoints.

### Phase 2 — Real persistence & the Proof Chain (2–3 weeks)
- [ ] Make the Proof Chain durable: every governed action writes a hash-chained row that survives restarts (AI trace persistence is already a tracked task).
- [ ] Verify-on-read: expose a "verify audit chain" endpoint and a UI badge that proves the chain is intact.
- [ ] Persist AI traces + feedback (thumbs up/down) so reviewer signal isn't lost.
- [ ] Add per-trace detail view for operators to inspect individual AI decisions.

### Phase 3 — Real AI governance loop (3–4 weeks)
- [ ] Wire the SIGIL trust score to live signals, not constants.
- [ ] Make Covenant Policies actually gate execution: a denied policy blocks the action and records a proof receipt.
- [ ] Approval queue: destructive actions require human approval; approvals expire; "reverted by X" markers (tracked tasks #5065–5067, #5168).
- [ ] Per-domain evaluator hooks so quality scoring reflects real criteria.

### Phase 4 — Runtime mode honesty (3–5 days)
- [ ] Finish the in-flight task: front-end trusts the API's `X-App-Mode` header instead of build-time `VITE_APP_MODE` (Task #5000). One shared hook in `lib/shared-ui` reads `X-App-Mode` from the first API response and both `detectEnvironment()` and `AppModeProvider` prefer it.
- [ ] This guarantees the demo/live chip always matches reality without a rebuild.

### Phase 5 — Billing & packaging (2–3 weeks)
- [ ] Pick a provider via the `monetization` skill (Stripe for SaaS subscriptions).
- [ ] Gate REAL features behind plans; meter AI usage.
- [ ] Build a real pricing page wired to checkout (an `AlloyPricing` page already exists as narrative — make it transact).

### Phase 6 — Productionize (2–3 weeks)
- [ ] CI green: typecheck, lint, the existing doctrine-drift and risk-formula-drift checks must pass.
- [ ] E2E tests on the golden journeys (Playwright; `testing` skill).
- [ ] Observability: the OTEL endpoint is already wired (`VITE_OTEL_*`); ship Proof-Chain spans to a real backend (Honeycomb task #5152).
- [ ] Deploy via Replit Deployments or container host; health checks on `/api/health`.
- [ ] Security pass: dependency audit + SAST (`security_scan` skill), secret hygiene.

---

## 5. Hard rules (do not break these)

1. **Doctrine values come from `@szl-holdings/szl-doctrine`**, sourced from `.local/payload-v8/`. Never hardcode them in artifacts. `pnpm run check:szl-doctrine-drift` enforces this.
2. **No silent fallbacks.** Governance surfaces must fail loudly, not show fake green.
3. **Every REAL route is tenant-scoped and auth-guarded.** No exceptions.
4. **The Proof Chain is append-only.** Never mutate or delete rows.
5. `.github/workflows/*` changes require the workflow-scoped token (`GH_WORKFLOW_TOKEN`).

## 6. Where to start reading the code

| To understand… | Read |
|---|---|
| Project overview + architecture | `replit.md` |
| Shared UI / app-mode / nav | `lib/shared-ui/src/` |
| A11oy pages | `artifacts/a11oy/src/pages/` |
| API routes | `artifacts/api-server/src/routes/` |
| DB schema + migrations | `lib/db/` |
| Governance doctrine source | `.local/payload-v8/` |
| Monorepo conventions | `.local/skills/pnpm-workspace/SKILL.md` |

## 7. Suggested team & timeline

- **1 full-stack lead** (owns golden journeys + Proof Chain), **1 front-end** (collapse 195 → ~25 real pages), **1 platform/devops** (auth, CI, deploy, billing).
- **~12–16 weeks** to a real, sellable single-vertical product. Each additional vertical is ~3–4 weeks once the platform spine is real.

---

*Generated as the canonical build brief. Keep this file in sync as phases complete.*
