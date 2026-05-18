# Round 5 / T004 — GitHub Alignment Audit + Inspiration Synthesis
**Date:** 2026-05-18  
**Scope:** All 17 public `szl-holdings/*` repos (inventory anchored to
`dossier/series-a-operational/ROUND4_AUDIT_2026-05-18.md` §2.1 and
the live `/api/org-intelligence/snapshot` payload at audit time).  
**Method:** Read-only GitHub REST via `curl` + `$GH_WORKFLOW_TOKEN`
against `GET /orgs/szl-holdings/repos`, `…/repos/{slug}/readme`, and
`…/repos/{slug}/contents/{path}`. No source files modified. No
`*-ops-core.ts` touched. No workflows restarted.

---

## PART A — GitHub alignment audit (17 rows)

Verdict legend  
- **Tree-evidence verdict** — `MATCH` (README headline accurately
  reflects what the tree ships), `DRIFT` (headline overpromises vs.
  tree), `EMPTY` (README claims implementation; tree ships no
  implementation files).  
- **Aligned-with-platform** — `Y` (repo is the canonical home of the
  capability OR is the public mirror of code that also lives in the
  monorepo `platform/`/`artifacts/`/`lib/` tree), `N` (claim implies a
  product whose real implementation lives elsewhere in the monorepo
  and the public repo does not say so), `N-A` (governance, brand,
  proofs, or research artifacts where the platform-alignment question
  doesn't apply).  
- **Action** — `leave as-is`, `rewrite README`, `promote into
  platform/`, or `close`.

Citations are to the repo + path observed at audit time.

| # | Slug | README headline claim (verbatim) | Tree evidence (root + relevant subdir) | Tree verdict | Aligned w/ platform | Action recommended |
|---|------|----------------------------------|----------------------------------------|--------------|---------------------|--------------------|
| 1 | `a11oy` | "Governed agentic execution fabric. Policy gates, signal mesh, proof ledger, and Λ invariant runtime." (`a11oy/README.md` §title) | `packages/a11oy-knowledge/`, `docs/{agi-horizon.md,brain-reports,in-app-explainer.md,moonshot-one-of-one.md,rag-synthesis.md,releases}`; **no** runtime/, ledger/, gates/, mesh/ source dirs at root | DRIFT | N (full fabric runtime lives in monorepo: `lib/a11oy-fabric/`, `lib/a11oy-orchestration/`, `packages/a11oy-runtime/`, `packages/a11oy-reliquary/`, `artifacts/a11oy/`) | rewrite README — scope to "knowledge package + public docs companion; runtime is platform-internal" |
| 2 | `agi-forecast` | "Lutar-Forecast Gauge — receipt-attested AGI capability gauges … **Status: Pre-implementation (proposal stage)**" (`agi-forecast/README.md` §header) | `runtime/{package.json, src/, tsconfig.json, vitest.config.ts}` + governance files; no ingestors yet | MATCH (README admits proposal stage; scaffold present) | Y (mirrors monorepo `packages/agi-forecast/src/{ingestors,__tests__}`) | leave as-is |
| 3 | `amaru` | "Convergent multi-source data sync. Append-only delta logs, hash-verified ingest, and bounded loops with measurable convergence." (`amaru/README.md` §title + tagline) | `src/{amaru_scheduler.py, chakana_wiring.py, chakras/, yawar_bus.py}`, `tests/`, `docs/{codex-and-flow.md, decisions-locked.md, doctrine-springboard.md, proposal.md, spine-reconciliation.md, wiring-rationale.md}` | MATCH | Y (Amaru sidecar `localhost:6810` + bridge routes verified live in ROUND4 §3.2 against `artifacts/api-server` proxy) | leave as-is |
| 4 | `carlota-jo` | "Private advisory operations. Concierge workflow with proof-chain delivery and multi-party coordination for high-net-worth clients." (`carlota-jo/README.md` §title) | Root only: `docs/charter.md`, `social-preview.svg`, governance files. **No `src/`, no runtime.** | DRIFT (headline implies operational product; tree is charter-only) | N (real domain service lives in `artifacts/api-server/src/lib/domain-services/carlota-jo/`) | rewrite README — re-frame as public charter + DOI/badges, with explicit "runtime is platform-internal" line |
| 5 | `counsel` | "Legal matter command. Policy-gated AI workflows, document review, obligation mapping, and proof-chain delivery." (`counsel/README.md` §title) | Root only: `docs/charter.md`, governance files. **No `src/`.** | DRIFT | N (related code at `artifacts/api-server/src/lib/domain-services/prism-counsel/`, `artifacts/counsel/`) | rewrite README — same pattern as `carlota-jo` |
| 6 | `lutar-lean` | "Machine-checked Lean 4 proofs of the Lutar Invariant (Λ_k) — uniqueness theorem and Egyptian-exact weights." (`lutar-lean/README.md` §subtitle) | `Lutar.lean`, `Lutar/`, `Main.lean`, `MainRef.lean`, `RefVectors.lean`, `TH8/`, `lakefile.lean`, `lean-toolchain`, `reference-vectors.json` | MATCH | N-A (formal proof artifact, paired with `ouroboros-thesis`) | leave as-is |
| 7 | `.github` | "Org-wide governance, reusable workflows, templates, and security policy for SZL Holdings." (`.github/README.md` §title) | `profile/`, `templates/`, `docs/`, `assets/`, `WORKFLOWS.md`, `SUPPORT.md`, `security.txt`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md` | MATCH | N-A | leave as-is |
| 8 | `ouroboros` | "Bounded loops with measurable convergence as a system primitive — the v6 ecosystem layer (services, halts, routing, permissions, sandbox, agent registry) plus a structured government-procurement readiness module." (`ouroboros/README.md` §subtitle) | `packages/ouroboros/`, `runtime/`, `agentic/`, `src/`, `scripts/`, `docs/`, `LUTAR_EVIDENCE.md`, `package.json`, `pnpm-lock.yaml`, `vitest.config.ts`, `biome.json` | MATCH | Y (this is the canonical runtime; cited by every vertical README badge) | leave as-is |
| 9 | `ouroboros-thesis` | "The Ouroboros Thesis — peer-reviewable preprints on bounded recursive computation and audit-closure operators for governed AI. Zenodo DOI-pinned." (org description + `README.md` §title) | `papers/`, `phd_thesis/`, `arxiv_pkg/`, `arxiv_pkg_v14/`, `zenodo_pkg/`, `figures/`, `v2/`, `ouroboros-thesis-v2.{md,docx}`, `ouroboros-runtime-contract.v2.json` | MATCH | N-A (research artifact) | leave as-is |
| 10 | `platform` | Root `README.md` titled **"SZL Holdings"** with CI/CodeQL/Security badges and TypeScript-monorepo positioning; badges link to `szl-holdings/szl-holdings-platform/actions/…` paths, not to `szl-holdings/platform/…`. The tree at root also surfaces a `.github/README.md` titled "GitHub Surface Map" which the REST `/readme` endpoint preferred. | Full monorepo: `apps/`, `lib/`, `packages/`, `artifacts/`, `infra/`, `ops/`, plus ~60+ top-level governance MD docs (`ARCHITECTURE.md`, `API-CATALOGUE.md`, `OPERATIONAL_ACCEPTANCE.md`, `RELEASE_TRUST_PACK.md`, etc.) | MATCH (tree is the monorepo the README implies) | Y (this **is** platform) | rewrite README — fix stale badge slug (`szl-holdings-platform` → `szl-holdings/platform`); collapse the two competing READMEs (root vs `.github/`) so REST `/readme` returns the canonical one |
| 11 | `sentra` | "Cyber resilience command. Threat modeling, posture drift detection, incident response, and policy-gated remediation with full audit trails." (`sentra/README.md` §title + tagline) | `src/{sentra_immune.py, tupu_replay_5x.py, tupu_verify.py}`, `runtime/`, `docs/tupu-verdict.md`, governance files. **No SOC UI, no detectors, no incidents pipeline in this repo.** | DRIFT | N (live SOC product is `artifacts/sentra/` + `artifacts/api-server/src/lib/{sentra-defense,sentra-detectors,siem/adapters}` — see ROUND4 §3.1 detector framework migration `lib/db/drizzle/0165_sentra_detector_framework.sql`) | rewrite README — re-scope public repo to "tupu-verdict replay verifier + public proof scripts; the SOC runtime lives in platform/" |
| 12 | `szl-brand` | "SZL Holdings brand assets. Source-of-truth for social preview images, logo monograms, and brand guidance applied across the GitHub organization. Updated 2026-05-12." (`szl-brand/README.md` §title + tagline) | `anatomy/`, `mockups/`, `motion/`, `posts/`, `social-previews/`, `docs/`, governance files | MATCH | N-A | leave as-is |
| 13 | `szl-cookbook` | "SZL Holdings engineering cookbook. A curated set of skills (Anthropic SKILL.md pattern) used by every engineer and every agent across the SZL Holdings platform." + "Skills: 9" badge (`szl-cookbook/README.md` §title) | `skills/`, `recipes/`, `ops/`, `meta/`, governance files | MATCH | N-A | leave as-is |
| 14 | `szl-trust` | "SZL Holdings Public Trust Portal. Publishes verifiable run artifacts from the Covenant Proof Standard (CPS) — the proof-chain emitted by every governed execution across the SZL Holdings platform." + "E4 Codex Kernel reference run with 12 receipts (mocked:false)" (`szl-trust/README.md` §title) | `runs/E4-codex-kernel-2026-04-29/`, governance files | MATCH | Y (downstream of platform CPS emitter; ROUND4 classifier marks OPERATIONAL via this manifest) | leave as-is |
| 15 | `terra` | "Real estate intelligence. Deal pipeline scoring, portfolio analytics, market signals, and AI-assisted underwriting." (`terra/README.md` §title + tagline) | Root only: `docs/charter.md`, governance files. **No `src/`.** | DRIFT | N (related code at `artifacts/api-server/src/lib/domain-services/terra/`, `artifacts/api-server/src/routes/terra-crm/`, `artifacts/api-server/src/services/terra/`) | rewrite README — charter-only scope, same pattern as `carlota-jo` / `counsel` |
| 16 | `vessels` | "Maritime fleet intelligence. Sanctions screening, dark-vessel detection, ownership graph analysis, and voyage analytics." (`vessels/README.md` §title + tagline) + body claims "Fleet command — live position, voyage state, alarms / Sanctions screening / Dark-vessel detection / Voyage analytics / Compliance audit pack" | Root only: `docs/charter.md`, `social-preview.svg`, governance files. **No `src/`, no AIS adapters, no graph code.** | DRIFT | N (the live Vessels SPA + API live in monorepo: `artifacts/vessels/`, `artifacts/vessels-pitch/`, `artifacts/api-server/src/lib/{domain-services/vessels,vessels}`, `artifacts/api-server/src/routes/…`, `artifacts/api-server/src/services/vessels/`) | rewrite README — same charter-only re-scope; OR (alternative) promote `artifacts/vessels/` into a public `szl-holdings/vessels/src/` mirror, then keep current README. Recommend rewrite first; promotion is a separate Series-A motion. |
| 17 | `vsp-otel` | "Verifiable Span Protocol — Cryptographically-verifiable OpenTelemetry GenAI bridge for the ouroboros runtime. **Status: Pre-implementation (proposal stage)**" (`vsp-otel/README.md` §header) | Only `README.md`, `LICENSE`, `CITATION.cff`, `.github/`. **No `src/`, no spans, no exporter.** | EMPTY (matches ROUND4 §2.1 THEATER flag: "claims an exporter, ships none") | N (planned home; not aligned today) | rewrite README — drop "Pre-implementation" framing for the unambiguous "this repo is a placeholder; design lives in `ouroboros-thesis` v13 and `lib/observability/`"; OR close the repo until first commit of an exporter. Recommendation: **rewrite README** (close is reversible-blocking for badge backlinks). |

### Summary roll-up
- **MATCH:** 8 — `agi-forecast`, `amaru`, `lutar-lean`, `.github`,
  `ouroboros`, `ouroboros-thesis`, `szl-brand`, `szl-cookbook`,
  `szl-trust`, `platform` (10 if we count by row; `platform` matches
  the tree but its dual-README situation triggers a separate
  `rewrite README` action).
- **DRIFT:** 6 — `a11oy`, `carlota-jo`, `counsel`, `sentra`, `terra`,
  `vessels`.
- **EMPTY:** 1 — `vsp-otel`.
- **Aligned with platform (Y):** 5 — `agi-forecast`, `amaru`,
  `ouroboros`, `szl-trust`, `platform`.
- **N-A (governance / proofs / brand):** 5 — `.github`, `lutar-lean`,
  `ouroboros-thesis`, `szl-brand`, `szl-cookbook`.
- **N (drift away from platform):** 7 — `a11oy`, `carlota-jo`,
  `counsel`, `sentra`, `terra`, `vessels`, `vsp-otel`.

### Pattern
The vertical-product repos that ship **only** `docs/charter.md` +
governance scaffolding (`carlota-jo`, `counsel`, `terra`, `vessels`,
and to a lesser extent `a11oy` and `sentra`) all share an identical
README template that overstates implementation. The honest re-framing
is "public **charter** + DOI backlinks; runtime is platform-internal."
That single template change closes 6 of the 7 platform-alignment
gaps without touching any platform code.

---

## PART B — Web inspiration synthesis (7 entries, all URLs fetched HTTP 200)

For each entry, the URL was fetched live during this audit. Every URL
below returned HTTP 200 to `curl -L --max-time 10`. Categories with
no fetchable canonical source for our purpose are called out
honestly at the end.

### B.1 — Platform engineering control plane (Backstage)
- **URL:** https://backstage.io/docs/overview/what-is-backstage (200)
- **Title:** *Backstage — What is Backstage? (official docs)*
- **Summary:** Backstage is Spotify's open-source developer-portal
  framework: a unified catalog of every service, library, dataset, and
  workflow, plus pluggable scorecards and tech docs, with the explicit
  job of being the **single front door** to an organisation's software
  estate. Its design language is "catalog + scorecard + plugin" —
  every entity is an addressable card with its own freshness, owner,
  and tier.
- **How we'd absorb it into SZL without copy-pasting:** Our
  `/organism` board already treats each of the 8 verticals + 17 repos
  as a card; we should adopt Backstage's *scorecard discipline* — each
  card surfaces (owner, tier, last-verified evidence, drift state)
  computed from the snapshot, not a free-text description. We do NOT
  adopt Backstage's plugin runtime; we keep our own ops-core registry.
  The lift is purely the **information architecture** of "every entity
  is owned, scored, and dated."

### B.2 — Platform engineering: GitOps composition (Crossplane)
- **URL:** https://docs.crossplane.io/ (200)
- **Title:** *Crossplane — official docs*
- **Summary:** Crossplane models the entire cloud control plane as
  Kubernetes Custom Resource Definitions: every infra primitive
  becomes a typed, reconcilable object with declared state, observed
  state, and a controller that closes the gap. The key idea is **the
  control loop IS the product** — observability and remediation are
  the same code path.
- **How we'd absorb it into SZL without copy-pasting:** Our Λ-gate /
  ouroboros runtime is already a bounded control loop; what we don't
  yet do is **surface every snapshot field as a "declared vs.
  observed" pair** the way Crossplane does. The next iteration of
  `b7_org_overview` should add `expected.*` siblings to every
  `observed.*` count, and a drift chip per row. This is
  reconciliation-as-UI, not reconciliation-as-CRD.

### B.3 — Platform engineering: app-side runtime (Dapr)
- **URL:** https://docs.dapr.io/concepts/overview/ (200)
- **Title:** *Dapr — Concepts overview*
- **Summary:** Dapr is a sidecar runtime that exposes a **uniform
  set of building blocks** (state, pub/sub, bindings, secrets,
  workflows, actors) to any application over a localhost gRPC/HTTP
  port, decoupling app logic from infra choice. Its strength is the
  *insistence on a tiny, opinionated vocabulary* for an otherwise
  sprawling problem space.
- **How we'd absorb it into SZL without copy-pasting:** SZL today
  exposes wildly different verbs across `sentra-ops-core.ts`,
  `vessels-ops-core.ts`, etc. We should freeze a **5-verb vocabulary**
  (`snapshot`, `incidents`, `detectors`, `actions`, `evidence`) that
  every ops-core must implement, modelled on Dapr's "every building
  block has the same shape" discipline. We keep our own transport; we
  borrow the discipline.

### B.4 — Cyber-resilience cockpit (Microsoft Sentinel)
- **URL:** https://learn.microsoft.com/en-us/azure/sentinel/overview (200)
- **Title:** *Microsoft Sentinel — overview (Microsoft Learn)*
- **Summary:** Sentinel's product spine is **investigation → hunt
  → automate → report**, with the front-page conceit that every
  incident is a typed graph node (entity, alert, evidence) and every
  automation is a versioned playbook with an audit trail. The screen
  estate is dominated by *evidence cards*, not by raw log tails.
- **How we'd absorb it into SZL without copy-pasting:** Sentra's UI
  should make the four-verb spine (`detect → triage → respond →
  evidence`) literal — every page is one of those four. We already
  ship a detectors framework (ROUND4 §3.1) and a paginated incidents
  list; the missing piece is the **evidence card as the unit of
  truth**, not the row. We borrow the IA, not the data model.

### B.5 — Cyber-resilience cockpit (Wiz)
- **URL:** https://www.wiz.io/platform (200)
- **Title:** *Wiz — Platform*
- **Summary:** Wiz's positioning is *one graph for cloud, identity,
  data, code* — the user always sees a **single attack-path view**
  that crosses asset boundaries, not a tab-per-asset view. The
  product's marketing repeats one phrase: "every finding has a
  path to a CEO-level outcome."
- **How we'd absorb it into SZL without copy-pasting:** Our `/organism`
  page is already cross-vertical; we should add a **path overlay**:
  for any THEATER flag or DRIFT row, draw the chain
  (repo → module → DOI → live route) so an operator (or investor) sees
  one path from "this is wrong" to "this is the receipt." We do NOT
  build a cloud graph; we build an evidence path graph using fields
  already in the snapshot.

### B.6 — Maritime intelligence UI (Spire Maritime)
- **URL:** https://spire.com/maritime/ (200)
- **Title:** *Spire Maritime*
- **Summary:** Spire's product surface is built around **AIS-as-feed,
  enrichment-as-product**: positions, predicted ETAs, vessel-identity
  resolution, and dark-activity flags are all delivered as typed
  streams a customer composes. The UI emphasises **time-window
  scrubbing** and **identity reconciliation across spoofed/silent
  vessels** more than map prettiness.
- **How we'd absorb it into SZL without copy-pasting:** Vessels'
  monorepo SPA (`artifacts/vessels/`) already has voyage analytics;
  the upgrade is to **lead the UI with identity-reconciliation
  receipts** (MMSI ↔ IMO ↔ beneficial-owner) and an explicit
  silent-window scrubber, not with a live globe. Maps are table-stakes;
  receipts are the SZL differentiator.

### B.7 — Investor-facing operational dashboard (GitLab Handbook)
- **URL:** https://about.gitlab.com/handbook/ (200)
- **Title:** *The GitLab Handbook*
- **Summary:** GitLab's handbook is a single, fully public,
  versioned, link-stable surface — the operational state of an entire
  company, with **measured-vs-target values and dated evidence** for
  every claim. It is the canonical proof that "public + dated + linked"
  beats "polished + private."
- **How we'd absorb it into SZL without copy-pasting:** Our dossier
  already follows this pattern at small scale (every claim has a file
  + line citation, every snapshot has a timestamp). The next step is
  to **publish `/organism` read-only** behind a stable URL with a
  per-card "last-verified" timestamp, so a Series-A investor lands on
  the same source-of-truth surface we audit ourselves against. The
  borrow is "evidence-density as marketing," not the handbook tooling.

### Categories where the audit returned no fetchable canonical source
- **Quechua / anatomy / biological-system framing in software
  products.** I attempted fetches against Karpathy's "Software 2.0"
  Medium post (403), Crossplane "biology" docs (404), and several
  product pages claiming organism metaphors. None returned a stable
  HTTP 200 canonical source whose framing was substantively about
  "organism-as-architecture." **Honest finding:** the metaphor is
  ours; there is no peer surface to borrow from. This is actually a
  defensibility signal — the *tukuy / yawar / chakana / tupu*
  anatomy vocabulary that already lives in `artifacts/api-server/
  src/lib/domain-services/` and `amaru/src/{chakana_wiring.py,
  yawar_bus.py, chakras/}` is unique to SZL and should be treated as
  a brand moat, not a borrowed pattern.
- **Marine Traffic Pro / Pole Star / Windward.** All three either
  returned 403/404 on their canonical product pages
  (`marinetraffic.com` 403, `polestarglobal.com/our-products/` 404,
  `windward.ai/platform/` 404 — though the root domain `windward.ai`
  did serve 200). I did not include them as inspirations because I
  could not fetch a product page that justified a specific UI lesson.
  Spire (B.6) is the single maritime entry I could verify at depth.
- **Palo Alto XSIAM / CrowdStrike Falcon.** XSIAM's marketing page
  (`paloaltonetworks.com/cortex/cortex-xsiam`) returned 200, but its
  content is positioning copy, not a UI doctrine I could cite cleanly;
  Falcon's `/platform/falcon-platform/` returned 404. I therefore
  carried only Microsoft Sentinel (B.4) and Wiz (B.5) as
  cyber-resilience inspirations rather than fabricate XSIAM/Falcon
  lessons.

---

## Acceptance check (self-audit)
- **17 alignment rows:** ✓ (table above; numbered 1–17).
- **≥ 5 inspirations with real URLs:** ✓ (7 entries: B.1–B.7; each
  URL fetched HTTP 200 during this audit).
- **Dossier exists:** ✓ (`dossier/series-a-operational/
  ALIGNMENT_AND_INSPIRATION_2026-05-18.md`, this file).
- **No source files outside dossier path were modified:** ✓ (only
  read-only `curl` against api.github.com; no writes outside
  `dossier/`; no `*-ops-core.ts` touched; no workflow restarted).
- **Token hygiene:** `$GH_WORKFLOW_TOKEN` used only as a bearer
  header; never echoed, never written to disk.
