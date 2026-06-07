# SZL Holdings — Frontend Audit
**Phase:** 2 + 10  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Summary

| Dimension | Status |
|---|---|
| Workflow | ✅ RUNNING (port 21130) |
| Build | ✅ PASS |
| Console errors (normal usage) | ✅ None expected |
| Auth model | Public (landing/trust) + OIDC (investor portal) |
| Data mode | Real + Illustrative content |

---

## Screen Inventory

| Route | Screen | CTA Wired | Auth Gate | Seeded Data | Status |
|---|---|---|---|---|---|
| `/` | Home / Corporate | ✅ | None | Illustrative | ✅ |
| `/about` | About | ✅ | None | Illustrative | ✅ |
| `/products` | Products overview | ✅ | None | Illustrative | ✅ |
| `/platform` | Platform overview | ✅ | None | Illustrative | ✅ |
| `/lyte` | Lyte product page | ✅ | None | Illustrative | ✅ |
| `/command` | Command product page | ✅ | None | Illustrative | ✅ |
| `/vessels` | Vessels product page | ✅ | None | Illustrative | ✅ |
| `/terra` | Terra product page | ✅ | None | Illustrative | ✅ |
| `/carlota-jo` | Carlota Jo product page | ✅ | None | Illustrative | ✅ |
| `/aegis` | Aegis / pitch deck | ✅ | None | Illustrative | ✅ |
| `/trust` | Trust Center | ✅ | None | Live docs | ✅ |
| `/legal/privacy` | Privacy Policy | N/A | None | Legal doc | ✅ |
| `/legal/terms` | Terms of Service | N/A | None | Legal doc | ✅ |
| `/legal/dpa` | Data Processing Agreement | N/A | None | Legal doc | ✅ |
| `/investor` | Investor portal | ✅ | OIDC | Illustrative | ✅ |
| `/founder` | Founder profile | N/A | None | Profile | ✅ |
| `/contact` | Contact form | ✅ | None | None | ✅ |
| `/demo` | Demo request form | ✅ | None | None | ✅ |
| `/blog` | Blog/insights | ✅ | None | Content | ✅ |
| `/press` | Press kit | ✅ | None | Assets | ✅ |

---

## Issues Found

| Issue | Severity | Action |
|---|---|---|
| Corporate dashboard autopilot stats hardcoded | P2 | Add "Illustrative" label |
| Some stat callouts lack source attribution | P2 | Add "Illustrative" label or wire to DB |
| Design partner program CTA destination | P3 | Confirm routes to wired form |

---

## Verdict

**Status: ✅ Demo-ready | 🟡 Minor labeling fixes needed before GA**
