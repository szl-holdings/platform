# Demo Users and Organizations
**Phase:** 7  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## Demo Organizations

| Org Name | Org ID | Purpose |
|---|---|---|
| SZL Holdings Demo | `org-demo-szl` | Default demo organization — all demo flows |
| Vantex Capital | `org-vantex` | Acquisition target in the Lyte decision narrative |

---

## Demo Users

| Email | Role | Persona | Primary Domain |
|---|---|---|---|
| `demo-investor@szl.demo` | `executive` | Investor | Platform-wide (read-only) |
| `demo-ceo@szl.demo` | `executive` | CEO | Command + Lyte |
| `demo-coo@szl.demo` | `operator` | COO | Command + all ops |
| `demo-ciso@szl.demo` | `operator` | CISO | Aegis + Sentra |
| `demo-analyst@szl.demo` | `analyst` | Analyst | Lyte (decision intelligence) |
| `demo-admin@szl.demo` | `tenant_admin` | Platform Admin | Full tenant management |

**Note:** Demo credentials are provisioned via `pnpm seed:demo` using values from Replit Secrets (`DEMO_USER_PASSWORD`). Passwords are never committed to the repository. Production users are provisioned separately via OIDC.

---

## Persona Content Adaptation

The Demo Launchpad persona switcher at `/command/demo` adapts the following content per persona:

| Persona | Content Focus | Key Surfaces |
|---|---|---|
| Investor | ROI metrics, governance posture, cross-domain breadth | Executive dashboard, platform KPIs, proof chain breadth |
| CEO | Strategic signals, cross-domain correlation, decision velocity | Command overview, entity graph, decision twin |
| COO | Workflow health, approval queues, agent efficiency | Alloy canvas, approval gates, run console |
| CISO | Security posture, threat landscape, SOAR playbooks | Aegis SOC, adversary narrative engine, MITRE mapping |
| Analyst | Signal depth, simulation precision, evidence traceability | Lyte signals, Monte Carlo, evidence explorer |

---

## Demo Org Reset Process

When the Demo Launchpad **Reset** button is clicked:

```
POST /api/demo/reset
{
  "orgId": "org-demo-szl",
  "scenario": "LYTE-SEED-v2"
}
```

Response:
```json
{
  "status": "ok",
  "resetAt": "2026-04-19T14:30:00Z",
  "itemsSeeded": {
    "decisions": 8,
    "signals": 47,
    "workflows": 6,
    "approvals": 3,
    "agentRuns": 12,
    "proofEntries": 24
  }
}
```

---

## Seeding Commands (Terminal)

```bash
# Full demo seed from scratch
pnpm db:migrate && pnpm seed:demo

# Verify demo org exists
node scripts/qa/check-demo-seed.js

# Domain-specific seeds (if needed)
pnpm seed:atlas:aegis
pnpm seed:atlas:vessels
pnpm seed:atlas:terra
pnpm seed:atlas:counsel
```
