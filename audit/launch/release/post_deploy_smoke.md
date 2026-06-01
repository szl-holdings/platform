# Post-Deploy Smoke Tests
**Phase:** 5 + 9  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Automated Smoke Suite

```bash
# Run the full post-deploy smoke suite
BASE_URL="https://your-app.replit.app"

# API health
curl -f "$BASE_URL/api/health"
curl -f "$BASE_URL/api/health/ready"

# Route smoke check
node scripts/qa/smoke-routes.js

# Link integrity
node scripts/qa/check-links.js

# Metadata
node scripts/qa/check-metadata.js
```

---

## Manual Smoke Checklist

### Critical Path 1 — Authentication
- [ ] Navigate to `$BASE_URL`
- [ ] Click "Sign In"
- [ ] OIDC flow completes → landing at dashboard
- [ ] `/command/overview` loads with content
- [ ] Sign out → redirected to landing page

### Critical Path 2 — Demo Launchpad
- [ ] Navigate to `/command/demo`
- [ ] Demo Launchpad renders (6 stops, persona switcher, timer)
- [ ] Click "Reset Demo" → confirmation modal → reset completes
- [ ] Select "Investor" persona → content updates
- [ ] Click through all 6 stops → progress advances

### Critical Path 3 — Decision Intelligence (Lyte)
- [ ] Navigate to `/lyte/`
- [ ] Overview dashboard loads with KPIs and signals
- [ ] Navigate to `/lyte/decision-twin`
- [ ] Decision Twin renders (761 lines; Vantex scenario visible)
- [ ] Run a simulation → result renders with Monte Carlo output

### Critical Path 4 — Flagship Innovations
- [ ] `/lyte/decision-twin` — Decision Twin working
- [ ] `/command/operations/alloy/policy-compiler` — Policy Compiler working
- [ ] `/terra/why-this-property-now` — Why This Property Now working
- [ ] `/aegis/adversary-narrative-engine` — Adversary Narrative Engine working
- [ ] `/vessels/voyage-risk-twin` — Voyage Risk Twin working
- [ ] `/carlota-jo/concierge` — White-Glove Command working

### Critical Path 5 — Write Actions
- [ ] Create a new workflow in Command
- [ ] Submit an approval decision
- [ ] Add a signal in Lyte
- [ ] Verify proof chain entry created (`GET /api/proof-chain`)

### Critical Path 6 — Error States
- [ ] Navigate to a non-existent route → 404 page renders (not blank)
- [ ] Access a protected route while signed out → redirected to auth
- [ ] Submit invalid form data → validation error shown (not 500)

---

## Per-Domain Smoke Results (Expected)

| Domain | Route | Expected Status |
|---|---|---|
| Home | `/` | 200 |
| Command | `/command/` | 200 (auth) |
| Lyte | `/lyte/` | 200 (auth) |
| Terra | `/terra/` | 200 (auth) |
| Aegis | `/aegis/` | 200 (auth) |
| Vessels | `/vessels/` | 200 (auth) |
| Carlota Jo | `/carlota-jo/` | 200 (auth) |
| Sentra | `/sentra/` | 200 (auth) |
| Counsel | `/counsel/` | 200 (auth) |
| PRISM Counsel | `/prism-counsel/` | 200 (auth) |
| Pulse | `/pulse/` | 200 (auth) |
| API Health | `/api/health` | 200 |
| API GraphQL | `/api/graphql` | 200 |

---

## Smoke Failure Escalation

| Failure Type | Action | SLA |
|---|---|---|
| Auth broken | Immediate rollback | < 5 min |
| API health 503 | Investigate DB/service; rollback if > 5 min | < 5 min |
| Frontend 500 | Check artifact workflow; restart if needed | < 10 min |
| Demo Launchpad broken | Check Command workflow | < 10 min |
| Single route 404 | Investigate; no rollback unless P0 | < 30 min |
