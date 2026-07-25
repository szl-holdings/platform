# SZL Holdings — Source of Truth

> **Canonical public metrics registry.** Every README, website, deck, and
> compliance document must take quantitative claims from this file and
> `audit/source-of-truth.json`. A value without reproducible evidence is
> **UNVERIFIED**, not estimated.

**Registry version:** 2.0.0

**Main baseline inspected:** `platform@280176de9fd99a33f1cfc2087372014e91d7ce8f`

**Measured:** 2026-07-25

**Validator:** `node scripts/audit/validate-source-of-truth.js`

The counts include the truth-lock workflow introduced on this branch. The
validator recomputes them from whichever commit is checked out.

---

## Canonical Current-Tree Metrics

| Metric | Canonical Value | Definition / verification |
|---|---:|---|
| Registered artifacts | **6** | Tracked `artifacts/*/(.replit-artifact/)?artifact.toml` files |
| Artifact directories | **7** | Unique tracked top-level children of `artifacts/` |
| Registered product verticals | **5** | Registered customer-facing domain artifacts; A11oy is counted separately as the orchestration product |
| Top-level package directories (`packages/`) | **156** | Tracked top-level directories; excludes root file `packages/proxy-routes.ts`; not every directory is a workspace package |
| Top-level library directories (`lib/`) | **53** | Tracked top-level directories; not every directory is a workspace package |
| Top-level package and library directories | **209** | Directory inventory only: 156 + 53 |
| Workspace package manifests | **196** | Tracked `package.json` files included by `pnpm-workspace.yaml`; pnpm reports 197 projects when the root is included |
| Apps (`apps/`) | **11** | Unique tracked top-level children of `apps/` |
| Services (`services/`) | **11** | Unique tracked top-level children of `services/` |
| Workers (`workers/`) | **5** | Unique tracked top-level children of `workers/` |
| DB schema files | **197** | Tracked `lib/db/src/schema/**/*.ts` files |
| DB `pgTable` call sites | **1,067** | Source call sites; not a claim about currently provisioned tables |
| DB migrations (SQL files) | **149** | Tracked `lib/db/drizzle/*.sql` files; duplicate sequence numbers may exist |
| API route source files | **43** | Non-test files under `apps/`, `services/`, and `artifacts/api-server/` containing a detected Express route declaration |
| API handler declarations | **306** | Static non-test HTTP method declarations on `app`, `router`, and named Express Router receivers in the current runtime roots |
| CI workflows | **45** | Tracked `.github/workflows/*.yml` and `*.yaml`, including both truth-lock workflows |
| Environment variables (in `.env.example`) | **238** | Lines matching `^[A-Z_]+=` |

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

`artifacts/api-server` is tracked backend infrastructure without an artifact
manifest. It is not counted as a product vertical.

Registration is a discoverability fact, not a readiness claim. LIVE, MODELED,
PLANNED, and conformance status require separate evidence.

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

## GitHub Public Estate — Observed State

**Observed:** 2026-07-25T22:03:01Z

**Method:** authenticated GitHub repository inventory, filtered by current
visibility and archive state.

| Metric | Observed Value |
|---|---:|
| Public repositories | **53** |
| Archived public repositories | **12** |
| Active public repositories | **41** |
| FRONTIER decision target | **9** |

The nine-public-repository target is **NOT APPLIED**. It is conditional on
vertical conformance and a reversible disposition process. This registry does
not claim that the current estate already matches the target.

The V2 names `sentra`, `vessels`, and `insurance` as conceptual repository
targets. Current repository truth differs:

- Sentra is a registered product vertical inside `platform`, not a current
  repository named `sentra`.
- Vessels is a registered product vertical inside `platform`; `killinchu` is a
  separate public repository.
- There is no current public repository named `insurance`; the candidate
  scoring workload has not been approved for public release.

Repository visibility must not change until aliases, ownership, release tags,
and conformance evidence are resolved.

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
