# Duplicate Artifact Review
**Date:** April 20, 2026  
**Auditor:** Agent Task #2669  
**Scope:** All 15 registered artifacts (14 web/mobile + 1 design)

---

## 1. Primary Finding: counsel vs prism-counsel

### Comparison

| Attribute | `artifacts/counsel` | `artifacts/prism-counsel` |
|---|---|---|
| **Title** | Counsel — Legal Matter Command | PRISM Counsel — Legal Command |
| **Preview Path** | `/counsel/` | `/prism-counsel/` |
| **Branding** | Violet `#8b5cf6`, Scale icon | Violet `#7c3aed`, Scale icon |
| **Purpose** | In-house legal matter command center | Legal matter command center (predecessor) |
| **Routes** | dashboard, matters, obligations, dependencies, performance, risk, decision-center, alerts, approvals, trust | matters, obligation-graph, deadline-heatmap, proof-chain, evidence, privilege, audit, aef-search |
| **Key Differentiator** | Active canonical app with Sentient Layer, cross-domain enrichment, full Human Lock integration | Archived predecessor; replaced by counsel in Task #634 |
| **API routes** | `/api/counsel/*` | `/api/prism-counsel/*` (legacy, still mounted) |

### Recommendation: **Keep `counsel`, archive `prism-counsel`**

**Rationale:** `prism-counsel` was officially superseded by `counsel` in Task #634. The `counsel` artifact is architecturally richer (Sentient Layer, cross-domain graph, full Alloy Fabric integration) and already linked as the canonical Legal domain app in all platform surfaces. Archiving `prism-counsel` eliminates duplicate routing, reduces maintenance surface, and clarifies the platform story for investors.

---

## 2. Full Artifact Sweep — Overlap Analysis

All 15 artifacts were reviewed for functional overlap. Only one confirmed duplicate was found.

| Artifact | Kind | Domain | Overlaps With | Verdict |
|---|---|---|---|---|
| `szl-holdings` | web | Portfolio dashboard (root) | None | **Keep** |
| `command` | web | Unified portal / cross-domain ops | None — complementary to szl-holdings | **Keep** |
| `counsel` | web | Legal domain vertical | prism-counsel (archived) | **Keep (canonical)** |
| **`prism-counsel`** | web | Legal domain vertical | counsel | **ARCHIVED** |
| `sentra` | web | Cyber resilience / SOC | None | **Keep** |
| `vessels` | web | Maritime intelligence | None | **Keep** |
| `terra` | web | Real estate intelligence | None | **Keep** |
| `aegis` | web | Defense & intelligence command + investor slides | szl-demo-video (thematic) | **Keep — different outputs** |
| `szl-demo-video` | video | Motion graphics / marketing video | aegis (thematic) | **Keep — different outputs** |
| `pulse` | web | AI executive briefing | None | **Keep** |
| `lyte-command-center` | web | AIOps / autonomous NOC | None | **Keep** |
| `carlota-jo` | web | Advisory consulting | None | **Keep** |
| `szl-holdings-mobile` | mobile | Mobile command | None | **Keep** |
| `mockup-sandbox` | design | UI prototyping canvas | None | **Keep** |

### Note on aegis vs szl-demo-video

These share branding and narrative ("Governed Decision Layer") but serve distinct purposes: `aegis` is a functional SOC + investor slides web app for interactive use; `szl-demo-video` is a programmatic motion-graphics engine for marketing/keynote playback. They are **not duplicates** — they are complementary.

### Note on command vs szl-holdings

`szl-holdings` (at `/`) is the main portfolio/ventures dashboard for SZL Holdings as a company. `command` (at `/command/`) is the cross-domain operational portal that aggregates signals from all verticals. They serve different audiences (investors/leadership vs. operators) and are **not duplicates**.

---

## 3. Actions Taken

1. **Archived** `artifacts/prism-counsel` → `archive/duplicate-artifacts/prism-counsel/`
2. **Removed** `artifacts/prism-counsel/.replit-artifact/artifact.toml` → deregistered workflow and artifact
3. **Updated** Command Portal app launcher (`command-bar.tsx`) — removed duplicate PRISM Counsel entry (counsel was already listed under Domain)
4. **Updated** Ecosystem Apps Grid (`ecosystem-apps-grid.tsx`) — removed PRISM Counsel card
5. **Updated** Unified Layout sidebar nav (`unified-layout.tsx`) — replaced PRISM Counsel link with Counsel — Legal
6. **Updated** Domain Packs quick-links in sidebar — replaced "PRISM → /prism-counsel/" with "COUNSEL → /counsel/"

---

## 4. Remaining Work (Out of Scope for This Task)

- Legacy API routes under `/api/prism-counsel/*` remain mounted on the api-server. These should be deprecated and removed in a follow-up task once confirmed no active clients depend on them.
- The `competitive-atlas.tsx` and `atlas-execute.tsx` files in the command artifact reference `prism-counsel` as a historical artifact path in documentation/metadata fields — these are non-functional links that can be cleaned up separately.
