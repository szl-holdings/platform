# Screenshot Plan — Series-A Reset
*April 2026 · Screens to recapture once redesign is in main*

## Purpose
Defines the exact screens to screenshot from each artifact for the public-facing asset refresh. These captures should be taken after both the design reset (this task) and the public-surface task have merged.

---

## Capture Specifications

- **Format:** PNG, 2× (retina)
- **Viewport:** 1440 × 900 unless noted
- **Theme:** Dark (system dark) for all command-center apps; Light for Carlota-Jo
- **State:** Data loaded (not skeleton), authenticated session, no modals open unless specified
- **Sequence:** Load page → wait 2s for animations to settle → capture

---

## 1. sentra — Cyber Resilience Command

| # | Screen | Path | Notes |
|---|---|---|---|
| 1 | Dashboard — Threat Overview | `/sentra/` | Show KPI row + threat feed populated |
| 2 | Findings Detail Panel | `/sentra/findings` | Show severity bands, filter bar |
| 3 | Risk Heatmap | `/sentra/risk` | Colored heatmap cells visible |
| 4 | Audit Rail | `/sentra/audit` | Timeline visible with events |
| 5 | Login | `/sentra/login` | Clean auth surface |

---

## 2. counsel — Legal Matter Command

| # | Screen | Path | Notes |
|---|---|---|---|
| 1 | Matter Dashboard | `/counsel/` | KPI row + active matters list |
| 2 | Matter Detail | `/counsel/matters/[id]` | Sidebar, document list, timeline |
| 3 | Contracts View | `/counsel/contracts` | Table with filter bar |
| 4 | PRISM Analysis Panel | `/counsel/prism` | AI analysis surface |
| 5 | Login | `/counsel/login` | Clean auth surface |

---

## 3. pulse — AI Executive Briefing

| # | Screen | Path | Notes |
|---|---|---|---|
| 1 | Today's Briefing | `/pulse/` | Classification bar + briefing prose visible |
| 2 | Signal Feed | `/pulse/signals` | Multi-source signal list |
| 3 | Archive | `/pulse/archive` | List of past briefings |
| 4 | Briefing Detail | `/pulse/briefing/[id]` | Full prose view with Crimson Pro typography |

---

## 4. aegis — SZL Holdings Investor Pitch Deck

| # | Screen | Path | Notes |
|---|---|---|---|
| 1 | Cover Slide | `/aegis/` | Slide 1 — brand identity |
| 2 | Market Opportunity | Slide 3 | Data chart visible |
| 3 | Platform Architecture | Slide 5 | Architecture diagram |
| 4 | Financials | Slide 7 | Metrics table |
| 5 | Team | Final slide | Full-bleed photo |

---

## 5. command — Unified Command

| # | Screen | Path | Notes |
|---|---|---|---|
| 1 | Command Dashboard | `/command/` | All product tiles visible, alert summary |
| 2 | Alert Drilldown | `/command/alerts` | Severity-banded list |
| 3 | Portfolio Overview | `/command/portfolio` | Multi-asset summary |
| 4 | AI Activity Feed | `/command/activity` | CORTEX event log |

---

## 6. terra — Real Estate Intelligence

| # | Screen | Path | Notes |
|---|---|---|---|
| 1 | Pipeline Dashboard | `/terra/` | Deal pipeline with map |
| 2 | Pro Forma Module | `/terra/pro-forma` | Input form + output metrics |
| 3 | Waterfall Module | `/terra/waterfall` | Distribution waterfall chart |
| 4 | 1031 Exchange | `/terra/1031` | Analysis surface |
| 5 | Lease Abstraction | `/terra/lease` | Document + extracted terms |

---

## 7. carlota-jo — Carlota Jo Consulting

| # | Screen | Path | Notes |
|---|---|---|---|
| 1 | Homepage Hero | `/carlota-jo/` | Light ivory background, serif heading visible |
| 2 | Services Section | `/carlota-jo/#services` | Scrolled to services grid |
| 3 | About Section | `/carlota-jo/#about` | Editorial portrait layout |
| 4 | Contact Form | `/carlota-jo/contact` | Clean form, gold CTA |

---

## 8. szl-holdings — SZL Holdings Dashboard

| # | Screen | Path | Notes |
|---|---|---|---|
| 1 | Platform Overview | `/` | Hero + 6 platform tiles visible |
| 2 | Holdings Portfolio | `/#portfolio` | Asset cards + metrics |
| 3 | CORTEX AI Activity | `/#ai` | AI pipeline diagram |
| 4 | Ventures Section | `/#ventures` | Venture listings |

---

## 9. vessels — Vessels Maritime Intelligence

| # | Screen | Path | Notes |
|---|---|---|---|
| 1 | Fleet Map | `/vessels/` | Map + fleet status sidebar |
| 2 | Vessel Detail | `/vessels/[id]` | KPI row + voyage data |
| 3 | Exception Feed | `/vessels/exceptions` | Severity-banded alert list |
| 4 | Trading Orders | `/vessels/orders` | Order book table |

---

## 10. lyte-command-center — Lyte Decision Intelligence

| # | Screen | Path | Notes |
|---|---|---|---|
| 1 | Decision Dashboard | `/lyte/` | Scenario table + KPI row |
| 2 | Sensitivity Heatmap | `/lyte/sensitivity` | Heatmap cells |
| 3 | Scenario Builder | `/lyte/scenarios` | Multi-variable form |
| 4 | AI Recommendations | `/lyte/recommendations` | ProofEnvelope cards |

---

## 11. szl-holdings-mobile — Mobile Command (Expo)

| # | Screen | Device | Notes |
|---|---|---|---|
| 1 | Home Tab | iPhone 15 Pro | CORTEX summary + KPI row |
| 2 | Ventures Tab | iPhone 15 Pro | Venture list |
| 3 | Terra Module | iPhone 15 Pro | Pro Forma quick view |
| 4 | Spotlight Search | iPhone 15 Pro | CORTEX search overlay |
| 5 | Settings Screen | iPhone 15 Pro | Theme toggle if applicable |

---

## Capture Tool
Use the `screenshot` tool with `type: 'app_preview'` for each path. Recommended: start all workflows, wait for hydration, then batch screenshots per artifact. Store in `attached_assets/screenshots/[artifact-slug]/` at 1440×900 default.
