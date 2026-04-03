# Demo Guide — SZL Holdings Platform

> Instructions for running product demos, what to show to which audiences, and how to manage demo state.

---

## Before Every Demo

1. Verify all required workflows are running in Replit
2. Clear any previous demo state if doing a fresh walkthrough
3. Confirm the correct demo org is seeded (`pnpm seed:demo`)
4. Open the relevant demo URL in a fresh browser window (not an existing session)
5. Have backup screenshots ready in case of network issues

---

## Demo URLs

| Product | Demo URL | Auth Required |
|---------|----------|---------------|
| SZL Holdings (marketing) | `https://szlholdings.com` | No |
| Lyte Command Center | `/lyte-command-center/?view=app` | Yes (demo org) |
| Alloy Fabric | `/alloy/` | Yes (demo org) |
| Aegis Defense | `/firestorm/` | Yes (demo org) |
| Vessels Maritime | `/vessels/` | Yes (demo org) |
| Terra Real Estate | `/terra/` | Yes (demo org) |
| PRISM Counsel | `/prism-counsel/` | Yes (demo org) |
| Carlota Jo | `/carlota-jo/` | No (public) |

---

## What Is Live vs. Staged

### Live (Real Functionality)
- All authentication flows (login, session management, RBAC)
- Database-backed CMS content (ventures, articles, testimonials)
- Contact form submissions (land in real database)
- Trust Center and legal pages
- Carlota Jo client intake flow

### Staged / Demo Data (Not Real)
- KPI metrics and business signals in Lyte dashboards
- Fleet positions and vessel data in Vessels
- Real estate deals and distress signals in Terra
- SOAR playbook executions in Aegis
- Law firm matters and forecasts in PRISM Counsel
- Workflow execution history in Alloy

Demo data is seeded via `pnpm seed:demo` and uses realistic but entirely synthetic data.

---

## Audience-Specific Demo Flows

### Investor Demo (~20 minutes)

**Goal:** Establish platform credibility, demonstrate breadth and depth, show governance differentiation.

1. **Start:** `szlholdings.com` — company overview (1 min)
2. **Platform thesis:** `/platform` or `/investors/overview` (3 min)
3. **Lyte walkthrough:** Signal timeline → PRISM dashboard → Action queue → Approval gate (5 min)
4. **Alloy governance:** Workflow engine → Human-in-the-loop → Audit trail (3 min)
5. **Trust:** `/trust-center` — security posture, governance model (2 min)
6. **Domain packs:** Brief overview of Aegis/Vessels/Terra as vertical extensions (3 min)
7. **Close:** Roadmap, revenue model, design partner opportunity (3 min)

**What NOT to show:** Internal admin routes, investor data room (unless invited), unfinished sprint routes.

---

### Enterprise Buyer Demo (~30 minutes)

**Goal:** Demonstrate operational fit for their vertical, show trust and compliance posture.

**For legal/professional services buyers (PRISM Counsel):**
1. Landing `/solutions/prism-counsel` (2 min)
2. PRISM Counsel dashboard — matter list, deadlines, forecast (5 min)
3. Copilot workbench — AI with approval gate (5 min)
4. Proof chain — immutable audit trail (3 min)
5. Trust: `/solutions/prism-counsel/trust` (3 min)
6. Discussion and Q&A (12 min)

**For maritime operators (Vessels):**
1. Landing `/solutions/vessels` (2 min)
2. Vessels dashboard — fleet map, AIS feed, alerts (5 min)
3. Exception-based workflow — dark vessel alert → Alloy action → approval (5 min)
4. Trust: `/solutions/vessels/trust` (3 min)
5. Discussion and Q&A (15 min)

**For security/defense buyers (Aegis):**
1. Landing `/solutions/aegis` (2 min)
2. Aegis SOC — threat feed, MITRE ATT&CK map (5 min)
3. SOAR playbook — Sentinel triage → human approval → response (5 min)
4. Trust: `/solutions/aegis/trust` (3 min)
5. Discussion and Q&A (15 min)

---

### Design Partner Demo (~45 minutes)

**Goal:** Deep product exploration, feedback capture, co-design opportunity.

1. Full platform walkthrough (15 min)
2. Focus on their specific vertical in depth (15 min)
3. Show admin/configuration surfaces (appropriate routes only) (5 min)
4. Discuss customization and white-labeling options (5 min)
5. Roadmap and design partner agreement (5 min)
6. Collect structured feedback

---

## What to Show — Lyte Walkthrough

Recommended sequence for Lyte Command Center:

1. **Command Inbox** — signals arriving, priority-ranked
2. **PRISM Dashboard** — P/R/I/S/M modules with health scoring
3. **Signal Timeline** — correlated signal chain with attribution
4. **Action Queue** — pending decisions with consequence modeling
5. **Approvals Center** — human-in-the-loop gate in action
6. **Ownership Map** — accountability graph

Key talking points:
- "Not a dashboard — it's a decision surface"
- "Every recommendation has a source, confidence score, and approval gate"
- "Audit trail is immutable — every action is attributed"

---

## What to Show — Alloy Walkthrough

1. **Factory Floor** — active workflow canvas
2. **Signal Feed** — normalized signals from all sources
3. **Workflow Orchestration** — DAG view of a workflow in execution
4. **Governance Audit** — audit log of all workflow actions
5. **Connector Mesh** — 40+ integration connectors

---

## Screenshots for Demos

Key screenshots for offline/backup use are in `docs/media/screenshots/`:
- `landing-hero.jpg` — main landing page
- `lyte-overview.jpg` — Lyte PRISM dashboard
- `alloy-overview.jpg` — Alloy factory floor
- `trust-center.jpg` — Trust Center overview

Refresh screenshots before major demos:
```bash
pnpm capture:screens
```

---

## Demo Environment Reset

If demo state is messy or stale:

```bash
pnpm seed:demo
```

This reseeds all demo data for the canonical demo organization. Does not affect production data.

For a specific product's demo org only:
```bash
pnpm --filter scripts run seed:demo -- --product lyte
pnpm --filter scripts run seed:demo -- --product vessels
```

---

## During the Demo — Practical Tips

- Use a dedicated browser profile for demos (no personal accounts, no browser history visible)
- Keep browser dev tools closed
- If something breaks, have screenshots ready as backup
- Acknowledge any rough edges with confidence: "This is alpha — we're validating the core workflow here"
- Never apologize for missing features — pivot to what's working
- Record demos (with consent) for async review

---

## Post-Demo

1. Log the demo in the CRM/pipeline
2. Send follow-up within 24 hours
3. Note any feedback or questions that came up
4. If demo data needs cleanup, run `pnpm seed:demo` to reset
