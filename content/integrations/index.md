# Integration Catalog — SZL Holdings

## Overview
SZL Holdings integrates with key services across authentication, data, distribution, and development tooling. Every integration is documented with its actual status — no vague "integrates with everything" claims.

## Integration Status Labels
- ✅ **Live**: Fully operational in production
- 🔶 **Beta**: Working but under active development
- 🗓️ **Planned**: On roadmap, not yet implemented
- 🔒 **Internal Only**: Used by SZL team, not exposed to customers

## Live Integrations

| Integration | Domain | Status | Description |
|-------------|--------|--------|-------------|
| GitHub | Engineering | ✅ Live | CI/CD, code scanning, dependency review, CODEOWNERS |
| Replit Auth | Authentication | ✅ Live | OpenID Connect with PKCE |
| PostgreSQL | Database | ✅ Live | Primary data store (798 tables) |
| HuggingFace | AI/ML | ✅ Live | Inference API, BGE embeddings |
| Census.gov | Data (Terra) | ✅ Live | Housing, demographic, economic data |
| HUD | Data (Terra) | ✅ Live | Fair market rents, housing data |
| FEMA | Data (Terra) | ✅ Live | Disaster declarations, risk zones |
| Replit Object Storage | Storage | ✅ Live | File and asset storage |

## Planned Integrations

| Integration | Domain | Status | Timeline |
|-------------|--------|--------|----------|
| Stripe | Payments | 🗓️ Planned | Q2 2026 |
| SendGrid | Email | 🗓️ Planned | Q2 2026 |
| Twilio | SMS | 🗓️ Planned | Q3 2026 |
| AIS Live Feed | Maritime | 🗓️ Planned | Q3 2026 |
| MLS | Real Estate | 🗓️ Planned | Q3 2026 |
| Slack | Notifications | 🗓️ Planned | Q2 2026 |
| LinkedIn | Distribution | 🗓️ Planned | Q2 2026 |

## Request an Integration
Need an integration we don't have? [Submit a request](./request.md)

## Integration Architecture
All integrations follow these principles:
1. Credentials stored as environment secrets (never in code)
2. Integration status tracked in dos_integration_status table
3. Errors surfaced to audit log
4. Integration health monitored via /api/health
