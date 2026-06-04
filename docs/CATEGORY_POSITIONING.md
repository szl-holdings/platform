# CATEGORY POSITIONING — Phase 2

Captured: 2026-04-23.

## The category sentence

> **GOVERNED BUSINESS OBSERVABILITY THAT CONVERTS SIGNALS INTO PERMISSIONED ACTIONS.**

Every code path, doc, demo, dashboard, metric, and investor surface should reinforce this sentence. If something does not reinforce it, the verdict is one of: reduce, consolidate, quarantine, or remove.

## What "governed business observability" means in this codebase

| Concept | Where it lives today | Strength |
| --- | --- | --- |
| Observability | `@szl-holdings/observability`, OBS-007 in `lib/db`, Sentry across all artifacts | STRONG |
| Governance | `routes/guardian.ts` (3,973 LOC), tier system, audit log on every privileged action, tenant isolation tests | STRONG |
| Business workflows | `routes/pulse.ts` (executive briefings), `routes/nexus.ts` (agent runtime), Counsel (legal matter), Vessels (maritime), Terra (real estate) | DOMAIN-RICH but spread across 13 web artifacts |
| Signal → action conversion | `lib/scheduled-jobs.ts`, Guardian approvals, evidence panels in Counsel/Pulse | PARTIAL — fragmented across surfaces |

## What this means for the next iteration

### Reinforce
- Guardian (governance) is the spine. Every customer-visible surface must show its Guardian footprint.
- OBS-007 (long-checkout warning) is the observability proof point — surface it in the operator dashboard as a live signal.
- Pulse (executive briefings) is the most direct embodiment of "signals → permissioned actions". Keep it featured.

### Reduce
- Marketing surfaces should stop enumerating 13 artifacts. Cite **3 flagship workflows** (see `FLAGSHIP_WORKFLOWS.md`) and treat the artifacts as their containers.
- Internal docs should stop describing artifacts as separate products. Frame them as views onto one platform.

### Consolidate
- Approval objects, evidence panels, status models — anywhere these are duplicated across artifacts, promote one shared shape (post-launch consolidation; not in this pass).

### Quarantine
- Anything that doesn't fit the three flagship workflows: hold position, do not invest further until post-launch.

### Remove
- (Nothing to remove categorically — every artifact has at least one paying or near-paying use case. Remove dead code, not domain products.)

## What this DOES NOT mean

- It does **not** mean rebranding. Visual identity is out of scope per brief.
- It does **not** mean shutting down domain artifacts (Counsel, Vessels, Terra, etc.). They become **proof surfaces** for the platform sentence, not standalone products.
- It does **not** mean rewriting the routes. Domain logic stays put; framing changes.

## Public copy template

When describing the platform externally, use a sentence-fitting structure:

> SZL Holdings provides **governed business observability** for [domain]. Operators see live **signals** from [data sources], approve **permissioned actions** through Guardian, and execute via [workflow]. Every action is traced, audited, and reversible.

Substitute domain + data sources + workflow per audience. The frame stays constant.

## Telltale signs we are off-message (red flags to watch)

- Public copy that lists the 13 artifacts as "products" rather than as "modules" or "surfaces".
- Demo flows that show 5 different artifacts without showing Guardian governance once.
- ROI claims that don't tie back to the three flagship workflows.
- Investor decks that lead with model count, agent count, or architecture diagrams instead of leading with **outcome** + **governance**.

If any of these appear, treat as a Phase 2 violation and flag for revision.
