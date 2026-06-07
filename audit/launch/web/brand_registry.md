# Brand Registry
**Phase:** 2 + 10  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)  
**Source of Truth:** `packages/brand-registry` (`@szl-holdings/brand-registry`)

---

## Product Names (Canonical)

| Product | Canonical Name | Preview Path | Notes |
|---|---|---|---|
| Platform | SZL Holdings Platform | `/` | Parent brand |
| Decision Intelligence | Lyte — Decision Intelligence | `/lyte/` | DO NOT abbreviate as "Lyte Decision" |
| Unified Operations | Command | `/command/` | Full name: "SZL Holdings Command" |
| Maritime Intelligence | Vessels — Maritime Intelligence | `/vessels/` | DO NOT call "Vessel" (singular) |
| Real Estate Intelligence | Terra — Real Estate Intelligence | `/terra/` | DO NOT call "Terra RE" |
| Cyber Resilience | Aegis — Cyber Resilience Command | `/aegis/` | Aegis is the investor pitch; Sentra is supplementary |
| Premium Advisory | Carlota Jo — Consulting | `/carlota-jo/` | Full name always; never just "Carlota" |
| Legal Command | Counsel — Legal Matter Command | `/counsel/` | |
| Legal Intelligence | PRISM Counsel — Legal Command | `/prism-counsel/` | PRISM = all caps |
| AI Briefing | Pulse — AI Executive Briefing | `/pulse/` | |
| Mobile Command | SZL Holdings — Mobile Command | Expo | CORTEX is the internal codename |
| Demo Video | SZL Holdings — Governed Autonomy Demo | `/szl-demo-video/` | |
| AI Layer | NEXUS — Unified Agentic AI Layer | `/nexus/` | Internal; not for external branding |

---

## Platform Primitive Names (Canonical)

| Primitive | Canonical Name | Package |
|---|---|---|
| Decision lifecycle | Outcome Graph | `lib/outcome-graph` |
| Audit trail | Proof Chain | `lib/proof-chain` |
| Permission model | Covenant Policy | `lib/covenant-policy` |
| Risk simulation | Decision Simulation (Monte Carlo) | `lib/monte-carlo` |
| Orchestration | Workflow Engine (Alloy) | `packages/alloy` |
| Event bus | Event Fabric (PRISM Bus) | `packages/signal-mesh` |

---

## Approved Vocabulary

Per `AGENTS.md` and `packages/brand-registry`:

| Approved | Banned |
|---|---|
| "governed intelligence" | "AI magic" |
| "evidence-backed" | "sentient" |
| "traceable autonomy" | "automagically" |
| "human-confirmed" | "black box AI" |
| "policy-gated" | "fully autonomous" |
| "calibrated confidence" | "thinks for itself" |

---

## Canonical Statistics (Source of Truth)

These numbers must be consistent across all marketing, investor, and product materials. Do not use different numbers in different places.

| Statistic | Value | Source |
|---|---|---|
| Platform primitives | 6 | `packages/brand-registry` |
| Domain packs | 6 (Lyte, Vessels, Terra, Aegis, Carlota Jo, Counsel) | Product inventory |
| RBAC roles | 11 | `lib/config` |
| Signature innovations | 6 | `replit.md` |
| Active artifacts | 15 (including mobile, video, sandbox) | Artifact inventory |
| Capabilities documented | 89 | `artifacts/internal-audit/capability-manifest.md` |
| Capabilities working | 81% (72/89) | Same source |
| Platform readiness score | 7.8 / 10 | `artifacts/internal-audit/investor-readiness-scorecard.md` |
| DB tables | ~700 | `replit.md` (updated estimate) |
| API route files | 254 | Filesystem count |
| Demo scenario | Vantex Acquisition — $4.2M / 47-day stalled approval | `replit.md` |

---

## Number Drift Prevention

**Rule:** Any numeric claim in marketing, investor materials, or product UI must be sourced from this registry or from a live DB query. Static numbers that drift from the live platform undermine investor trust.

**Enforcement:** The `scripts/lint-copy.sh` linter checks for banned phrases. A complementary check (`pnpm qa:site` → `qa:meta`) validates canonical counts in public-facing pages.
