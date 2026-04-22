# SZL Holdings — Open Risks

> Updated April 22, 2026

## Critical Risks

None currently identified.

## High Risks

| Risk | Impact | Mitigation | Owner | Timeline |
|------|--------|-----------|-------|----------|
| Migration ordering (Task #2886) | 12 DB statements fail on missing table relations at startup | Server continues normally; fix migration dependency graph | Engineering | Sprint 1 |
| No production error monitoring | Production errors may go undetected | Configure Sentry or equivalent APM | DevOps | Sprint 1 |
| SOC 2 Type II not obtained | Enterprise procurement may be blocked | Initiate audit engagement | Compliance | Q3 2026 |

## Medium Risks

| Risk | Impact | Mitigation | Owner | Timeline |
|------|--------|-----------|-------|----------|
| In-memory sessions only | Session loss on server restart | Configure Redis session store | Engineering | Sprint 2 |
| No SBOM in CI | Supply chain transparency gap | Add SBOM generation step to release workflow | Engineering | Sprint 2 |
| Mapbox token missing | Terra map visualization unavailable | Acquire Mapbox subscription | Product | Sprint 2 |
| AIS data feed missing | Vessels real-time tracking unavailable | Acquire AIS subscription | Product | Sprint 3 |
| No SLSA provenance attestation | Supply chain provenance gap | Add SLSA build attestation to CI | Engineering | Sprint 3 |

## Low Risks

| Risk | Impact | Mitigation | Owner | Timeline |
|------|--------|-----------|-------|----------|
| Dev-only tokens in .replit | Minimal — tokens are prefixed dev- and overridden in production | Document in security FAQ | Engineering | Complete |
| External link validation not automated | Broken external links possible | Add link-check CI step | Engineering | Sprint 3 |
| Dead artifact directories | Disk space waste, cognitive overhead | Delete cortex-mobile, imperium, prism-counsel | Engineering | Sprint 1 |

## Risk Acceptance

All low and medium risks have defined mitigation paths. No risk requires immediate action to prevent platform failure. The API server is healthy and all platform primitives are operational.
