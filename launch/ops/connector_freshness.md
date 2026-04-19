# Connector Freshness
**Phase:** 5 + 9  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Connector Inventory and Freshness Status

| Connector | Type | Poll Interval | Last Known Status | Freshness Indicator | Notes |
|---|---|---|---|---|---|
| MarineTraffic AIS | Real-time feed | Configurable | Demo mode (no API key) | N/A | Activate with `MARINETRAFFIC_API_KEY` |
| BarentsWatch AIS | Real-time feed | Configurable | Demo mode | N/A | Fallback AIS source |
| STIX/TAXII threat feed | Scheduled poll | Configurable | Code present; not scheduled | Stale | Enable in production schedule |
| AlienVault OTX | Scheduled poll | 1h | Not scheduled | Stale | Enable in production |
| OFAC Sanctions List | Scheduled | Daily | Active | ✅ Fresh | Live in smoke test |
| EU Consolidated Sanctions | Scheduled | Daily | Active | ✅ Fresh | Live |
| UN Security Council | Scheduled | Daily | Active | ✅ Fresh | Live |
| CISA KEV | Scheduled | Daily | Not scheduled | Stale | Enable (GAP-013) |
| NVD CVE | Scheduled | Daily | Not scheduled | Stale | Enable (GAP-014) |
| MITRE ATT&CK | Scheduled | Weekly | Seeded | Static | Enable refresh |
| CourtListener | Scheduled | Configurable | No auth token | Degraded | Add `COURT_LISTENER_API_TOKEN` |
| NYSE/NASDAQ feeds | Not implemented | N/A | N/A | N/A | Post-GA roadmap |
| SEC EDGAR | Scheduled | Daily | Seeded | Static | Enable ETL |
| NYC Open Data | Scheduled ETL | Weekly | ETL scripts present | Stale | Run ETL on schedule |
| Stripe Webhooks | Event-driven | Real-time | ✅ Configured (test) | Live | Switch to live keys at billing activation |
| Slack | Event-driven | Real-time | ✅ Configured | Live | |
| Twilio | Event-driven | Real-time | ✅ Configured | Live | |
| Resend Email | Event-driven | Real-time | Not configured | N/A | Add `RESEND_API_KEY` |
| PostHog | Event-driven | Real-time | ✅ PASS (smoke test) | Live | |
| Amplitude | Event-driven | Real-time | ✅ PASS (smoke test) | Live | |

---

## Connector Health UI

The **Integration Health** panel in the Command app at `/command/overview` displays:
- Real-time connector status (green/yellow/red)
- Last-polled timestamp per connector
- Error count for last 24 hours
- Manual refresh trigger per connector

The **Connector Freshness View** at `/command/operations/agents` shows per-connector freshness badges with:
- Fresh (< 1h): Green
- Stale (1h–24h): Yellow
- Very stale (> 24h): Red

---

## Connector Activation Checklist (Production)

| Action | Priority | Owner |
|---|---|---|
| Set `MARINETRAFFIC_API_KEY` | P1 | Platform |
| Enable STIX/TAXII polling schedule | P2 | Platform |
| Enable CISA KEV polling | P3 | Platform |
| Enable NVD CVE polling | P3 | Platform |
| Add `COURT_LISTENER_API_TOKEN` | P3 | Platform |
| Set `RESEND_API_KEY` for email delivery | P1 | Platform |
| Activate NYC Open Data ETL schedule | P2 | Platform |
| Switch Stripe to live keys | Before billing | Platform |
