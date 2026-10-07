# SZL Holdings — Source of Truth

> **Canonical contextual metrics registry.** Every README, website, deck, and
> compliance document must take quantitative claims from this file,
> `audit/source-of-truth.json`, and the machine-generated
> `artifacts/SOURCE_OF_TRUTH.json`. The generated artifact is authoritative for
> overlapping current metrics; this registry may retain separately defined
> source-tree and locked-kernel measurements. A value without reproducible
> evidence is **UNVERIFIED**, not estimated.

**Registry version:** 2.1.9

**Integration baseline inspected:** `platform@95d303fe94b0e773b31593426f8172e48bcb9d5f`

**Measured:** 2026-10-07

**Validator:** `node scripts/audit/validate-source-of-truth.js`

The counts describe the integrated Turn Capsule candidate source tree after the
obsolete legacy DCO compatibility workflow was retired. They do not claim that
the inspected baseline is already on protected `main`. The validator recomputes
the current-tree metrics from whichever commit is checked out.

> **Candidate measurement (2026-10-07):** The staged frontier candidate measures
> 44 route source files, 333 handler declarations, and 246 root example
> environment variables. Source counts require a passing validator and do not
> establish hosted availability or production readiness.

---

## Canonical Current-Tree Metrics

| Metric | Canonical Value | Definition / verification |
|---|---:|---|
| Registered artifacts | **6** | Tracked `artifacts/*/(.replit-artifact/)?artifact.toml` files |
| Artifact directories | **8** | Unique tracked top-level children of `artifacts/`; includes the unregistered, asset-only `szl-holdings` directory |
| Registered product verticals | **5** | Registered customer-facing domain artifacts; A11oy is counted separately as the orchestration product |
| Domain packages (`packages/`) | **162** | Tracked top-level package directories; excludes root file `packages/proxy-routes.ts` |
| Shared library packages (`lib/`) | **53** | Tracked top-level library directories |
| Total packages (`packages/` + `lib/`) | **215** | 162 + 53 |
| Apps (`apps/`) | **11** | Unique tracked top-level children of `apps/` |
| Services (`services/`) | **11** | Unique tracked top-level children of `services/` |
| Workers (`workers/`) | **5** | Unique tracked top-level children of `workers/` |
| DB schema files | **197** | Tracked `lib/db/src/schema/**/*.ts` files |
| DB `pgTable` call sites | **1,067** | Source call sites; not a claim about currently provisioned tables |
| DB migrations (SQL files) | **149** | Tracked `lib/db/drizzle/*.sql` files; duplicate sequence numbers may exist |
| API route source files | **44** | Non-test files under `apps/`, `services/`, and `artifacts/api-server/` containing a detected Express route declaration |
| API handler declarations | **333** | Static non-test HTTP method declarations on `app`, `router`, and named Express Router receivers in the current runtime roots |
| CI workflows | **47** | Permanent tracked `.github/workflows/*.yml` and `*.yaml`, including exact-head screenshot evidence, hosted observability proof, public npm release paths, and the frontier receipt-chain gate; excludes the retired DCO compatibility workflow |
| Environment variables (in `.env.example`) | **246** | Lines matching `^[A-Z_]+=` |

These are source-tree measurements. They do not by themselves prove that a
service is deployed, reachable, authenticated correctly, or returning HTTP 200.

---

## Product Registry

### Orchestration product

| Product | Registered artifact | Status proven by this registry |
|---|---|---|
| A11oy | `artifacts/a11oy` | **REGISTERED** |

### Registered product verticals

| Product vertical | Registered artifact | Status proven by this registry |
|---|---|---|
| Carlota Jo | `artifacts/carlota-jo` | **REGISTERED** |
| Counsel | `artifacts/counsel` | **REGISTERED** |
| Sentra | `artifacts/sentra` | **REGISTERED** |
| Terra | `artifacts/terra` | **REGISTERED** |
| Vessels | `artifacts/vessels` | **REGISTERED** |

`artifacts/api-server` is tracked backend infrastructure and
`artifacts/szl-holdings` currently contains generated social-card assets only.
Neither has an artifact manifest or is counted as a product vertical.

Registration is a discoverability fact, not a readiness claim. LIVE, MODELED,
PLANNED, and conformance status require separate evidence.

---

## Public Surface Reachability Snapshot

The generated [`artifacts/PUBLIC_SURFACES.json`](artifacts/PUBLIC_SURFACES.json) records reviewed
customer-facing routes and their item-level evidence. This narrative deliberately does not
duplicate a quantitative route claim: public platform counts remain governed by the canonical
[`docs/platform-facts.md`](docs/platform-facts.md) registry path.

The manifest also preserves unrouted historical paths and missing `a11oy.net` routes as explicit
`UNAVAILABLE` records. Route reachability does not prove uptime, customer use, feature
completeness, correctness, or that mixed-mode content is live. See
[`docs/product/public-surface-truth.md`](docs/product/public-surface-truth.md) for the evidence
vocabulary and refresh procedure.

---

## Doctrine v11 — Locked Metrics

Doctrine v11 is a frozen kernel contract tied to commit `c7c0ba17`. These
numbers are not recalculated from experimental `main`.

| Metric | Locked Value | Definition |
|---|---:|---|
| Declarations | **749** | Declarations in the frozen Doctrine v11 Lean kernel |
| Unique axioms | **14** | Unique declared axioms; 15 raw occurrences with one duplicate |
| Tracked `sorry` obligations | **163** | Tracked obligations in the frozen kernel snapshot |
| Locked-proven formulas | **8** | `{F1, F4, F7, F11, F12, F18, F19, F22}` |

The exact locked-proven count is separately enforced by the no-axiom Lean
theorem `locked_count_eight`. The 163 tracked obligations are not part of the
locked-proven set. Λ unconditional uniqueness remains **Conjecture 1 — OPEN**.

---

## GitHub Estate — Current Metadata Observation

**Observed:** 2026-10-06T04:33:40Z

**Method:** authenticated, cursor-complete GitHub repository-metadata read. The
privacy-preserving receipt is
[`audit/evidence/github-org-metadata-summary-2026-10-06.json`](audit/evidence/github-org-metadata-summary-2026-10-06.json).

| Metric | Observed Value |
|---|---:|
| Repositories | **140** |
| Public | **128** |
| Private | **12** |
| Active | **111** |
| Archived | **29** |
| Forks | **0** |
| Default branch `main` | **140** |

The accepted authority was repository metadata read. These aggregates do not
establish repository contents, branch protection, rulesets, checks, security
alerts, packages, deployment, or readiness. Private repository names and raw
responses are intentionally absent from the committed receipt.

### Historical July public-only snapshot

The 2026-07-25 observation recorded 53 public repositories: 41 active and 12
archived. It is retained as history and is superseded for current inventory
counts by the observation above. Its nine-public-repository FRONTIER target was
a conditional planning target, not an applied visibility decision.

Repository visibility must not change until aliases, ownership, release tags,
conformance evidence, and a reversible disposition process are resolved.

---

## Runtime and Database Values Not Current

The prior registry included live-database and deployed-route numbers measured
in April and May 2026. No live database was queried during the 2026-07-25 truth
lock, so those values are historical snapshots in
`audit/source-of-truth.json`, not current public claims.

Use these labels:

- **CURRENT-TREE** — recomputed by the validator at the current commit.
- **LOCKED** — frozen at a named kernel commit.
- **OBSERVED** — refreshed from a named external system and timestamped.
- **HISTORICAL** — retained for audit history; not current.
- **UNVERIFIED** — no current evidence; do not publish as fact.

---

## Vocabulary

Use the canonical governance terms in [`docs/GLOSSARY.md`](docs/GLOSSARY.md):

- **holographic state**
- **product vertical**
- **runtime organ**
- **policy gate module**

Do not use one of these terms as a synonym for another.

---

## Update Rule

When a current-tree metric changes:

1. Recompute it from tracked source.
2. Update `audit/source-of-truth.json`.
3. Update this file.
4. Update the quick-reference table in `audit/README.md`.
5. Run `node scripts/audit/validate-source-of-truth.js`.
6. Attach the command output to the pull request Proof Packet.

Never update only one representation, and never replace a failed measurement
with an estimate.
