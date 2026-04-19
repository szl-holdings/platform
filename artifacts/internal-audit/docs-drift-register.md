# Docs Drift Register
**SZL Holdings — Governed Operational Intelligence**  
**Audit Date:** April 19, 2026

> This register documents discrepancies found between documentation claims and the running workspace. Docs-as-truth policy: where docs conflict with code, the running code is authoritative. Fix the docs.

---

## replit.md vs Running Workspace

| Claim in replit.md | Actual State | Drift? | Action |
|---|---|---|---|
| "13 active applications" | 15 active applications (szl-demo-video, mockup-sandbox added) | ⚠️ Minor | Update count to 15 |
| "aegis serves as the investor pitch deck" | Aegis is now Cyber Resilience Command; investor pitch deck role moved to szl-holdings | ⚠️ Minor | Update description |
| Database: 569 tables | Verified approximate; exact count depends on migration state | ✅ Acceptable | — |
| Lyte: "Nine flagship surfaces" | Confirmed: Overview, Signals, Entity Graph, Decision Center, Decision Twin, Workflow Health, Run Console, Evidence Explorer, Policy Center, Eval Studio (10 surfaces, Legacy separated) | ⚠️ Minor | Update to 10 |

---

## README.md vs Running Workspace

| Claim | Actual State | Drift? |
|---|---|---|
| Azure deployment designed | Confirmed — Azure infra designed, workspace-level only | ✅ Aligned |
| Stripe billing built | Confirmed — test mode active | ✅ Aligned |
| Email built | Partially — scaffold exists, not activated | ⚠️ Overstated |
| Mapbox configured | Confirmed ✅ | ✅ Aligned |
| SSO scaffold | Confirmed — no IdP connected | ✅ Aligned |

---

## DEPLOYMENT_READINESS.md vs Running Workspace

| Claim | Actual State | Drift? |
|---|---|---|
| "Production-ready" | Development-ready; Azure deployment designed not deployed | ⚠️ Overstated |
| "SOC 2 in progress" | Not started | ❌ Incorrect |

---

## PRODUCT_READINESS.md vs Running Workspace

| Claim | Actual State | Drift? |
|---|---|---|
| "Functional Alpha" labels | Most surfaces are beyond Alpha — working demo quality | ⚠️ Understated |
| Feature labels for dormant capabilities | Some still show "coming soon" | ⚠️ Drift |

---

## AI Provider Stack (replit.md mentions)

| Documented | Actual | Drift? |
|---|---|---|
| OpenAI, Anthropic, Gemini multi-provider | Code scaffold present; API keys may not all be set | ⚠️ Check keys |
| Pulse briefings AI-generated | Seeded only — AI generation not yet live | ⚠️ Overstated |

---

## Route Inventories

| Artifact | Routes Documented | Routes Active | Drift |
|---|---|---|---|
| Lyte | ~10 flagship + legacy | 15 routes active | Minor — legacy not documented |
| Terra | Partial | 60+ pages active | Significant — terra has many undocumented pages |
| Vessels | Partial | 80+ pages active | Significant |
| Aegis | Partial | 100+ pages active | Significant |
| Carlota Jo | Partial | 50+ pages active | Significant |
| Command | Partial | 150+ routes | Significant |

**Recommendation:** Route inventories in ROUTE_INVENTORY.md significantly undercount all artifacts. Full route scan recommended.

---

## Drift Resolution Priority

| Priority | Item | Effort |
|---|---|---|
| P1 | Mark Pulse briefings as seeded (not AI-live) in docs | Trivial |
| P2 | Update replit.md artifact count to 15 | Trivial |
| P2 | Correct "SOC 2 in progress" claim | Trivial |
| P3 | Update ROUTE_INVENTORY.md for all artifacts | Medium |
| P3 | Update PRODUCT_READINESS.md readiness labels | Medium |
| P4 | Full route audit of all 15 artifacts | Large |
