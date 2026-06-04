# SZL Holdings API Server — Integration Health Audit

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** External integrations, live data feeds, internal service connections

---

## Integration Inventory

### Live External Data Feeds (Active)

| Integration | Domain | Status | Notes |
|---|---|---|---|
| CISA KEV | Aegis/Sentra | ✅ Active | Known Exploited Vulnerabilities feed |
| NVD CVE | Aegis/Sentra | ✅ Active | National Vulnerability Database |
| MITRE ATT&CK v14 | Aegis/Sentra | ✅ Active | Threat intelligence framework |
| AbuseIPDB | Aegis/Sentra | ✅ Active | IP reputation data |
| NOAA CO-OPS | Vessels | ✅ Active | Port operational conditions |
| Open-Meteo Marine | Vessels | ✅ Active | Marine weather data |
| GDELT | Vessels | ✅ Active | Global geopolitical event data |
| NYC Open Data | Terra | ✅ Active | Distress pipeline |
| US Census ACS | Terra | ✅ Active | American Community Survey |
| BLS | Terra | ✅ Active | Bureau of Labor Statistics |
| FEMA | Terra | ✅ Active | Flood/hazard data |
| SEC EDGAR | Terra | ✅ Active | Public company filings |

### Live External Data Feeds (Simulated / Not Yet Connected)

| Integration | Domain | Status | Notes |
|---|---|---|---|
| AIS Telemetry | Vessels | ⚠️ Simulated | Live AIS requires $15–40K/yr subscription |
| Mapbox | Terra | ❌ Not configured | MAPBOX_TOKEN env var not set; maps render blank |
| MLS/CoStar | Terra | ❌ Not connected | No live market data integration |

### Platform Integrations (Replit-Managed)

| Integration | Status | Notes |
|---|---|---|
| GitHub | ✅ Installed | Source control integration active |
| PostgreSQL | ✅ Active | Primary database; Drizzle ORM |
| Object Storage | ✅ Active | File/asset storage via Replit connectors |

### Internal Service Connections

| Service | Status | Notes |
|---|---|---|
| OpenTelemetry OTLP | ✅ Configured | Structured telemetry export |
| Sentry | ✅ Active | Error tracking; @sentry/node configured |
| Redis / Session store | ⚠️ Verify | Session management; confirm Redis vs. in-memory |
| Pino structured logging | ✅ Active | Structured JSON logs; pinoHttp middleware |

### AI / LLM Integrations

| Integration | Status | Notes |
|---|---|---|
| Anthropic (via Replit AI proxy) | ⚠️ Verify | Alloy AI engine; confirm API key configuration |
| OpenAI (via Replit AI proxy) | ⚠️ Verify | AI analysis routes; confirm active |
| Gemini (via Replit AI proxy) | ⚠️ Verify | Alternative model support |

---

## Integration Failure Behavior

All integrations are wrapped with graceful degradation:
- Missing env vars produce startup warnings, not crashes
- Failed external API calls return structured error responses
- Demo mode (`DEMO_MODE=true`) substitutes mock data for external calls
- No silent mock substitution detected in production paths

---

## Missing Integration Configurations (Action Required)

| Gap | Env Var | Impact | Priority |
|---|---|---|---|
| Mapbox not configured | `MAPBOX_TOKEN` | Terra maps blank | P1 |
| AIS subscription missing | External account | Vessels AIS shows simulated data | P2 (cost gated) |
| LLM API keys verification | `ANTHROPIC_API_KEY`, etc. | AI analysis may fall back to demo | P1 |

---

## Recommendations

1. **Configure MAPBOX_TOKEN** — Terra maps are a significant demo differentiator; blank maps undermine investor demos.
2. **Verify LLM API key routing** — Confirm Replit AI proxy integration is properly configured for Alloy AI engine routes.
3. **Document demo vs. live mode clearly** — When `DEMO_MODE=true`, all AI and external integration responses are mocked. This should be visually indicated in the UI (already partially implemented via `appModeMiddleware`).
4. **AIS subscription roadmap** — Budget $15–40K/yr for live AIS when maritime goes to full production. Use simulated data transparently until then.

---

*Environment variable matrix: `audit/infra/env-matrix-verified.md`*
