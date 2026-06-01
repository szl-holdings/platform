---
title: sentra — Policy Immune System
emoji: 🛡️
colorFrom: green
colorTo: gray
sdk: docker
pinned: true
license: apache-2.0
short_description: sentra — policy immune system · 8 gates live
tags:
  - formal-verification
  - lean4
  - mathlib
  - dsse
  - governance
  - agentic-ai
  - doctrine-v10
  - sentra
  - security
  - immune-system
ecosystem-stage: operational
---

# sentra — Policy Immune System

**Deny by default. Allow with proof.**

Eight gates evaluate every action. Verdict signed, traced, and chained.

## Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Vessels-DNA landing (preserved, commit bf908105) |
| `/console/` | GET | Replit SPA — Cyber Resilience Command console |
| `/api/sentra/healthz` | GET | Liveness probe |
| `/api/sentra/v1/verdict` | POST | Full immune verdict (Wire B) |
| `/api/sentra/v1/inspect` | POST | Full-signal inspect, no short-circuit |
| `/api/sentra/v1/gates` | GET | List all 8 immune gates |
| `/api/sentra/v1/gates/{id}` | GET | Per-gate detail |
| `/api/sentra/v1/gates/{id}/test` | POST | Per-gate test endpoint |
| `/api/sentra/v1/audit-log` | GET | Recent verdict history |
| `/api/sentra/v1/threats` | GET | Threat-signature STIX corpus |
| `/api/sentra/v1/forecast` | GET/POST | Witnessed forecasting — Mādhava error envelope (Cursor #65) |

## 8 Immune Gates

1. **signature-scan** — Threat signature corpus scan (SQL injection, shell injection, XSS, path traversal)
2. **size-guard** — DoS protection via 1MB payload limit
3. **lambda-threshold** — Λ-gate axis score evaluation (MIN of axes)
4. **dual-use-detection** — Dual-use pattern detection (ArtDomain.DualUse)
5. **stix-taxii-ingest** — STIX/TAXII threat intel cross-reference
6. **traceparent-propagation** — W3C traceparent validation (Wire E)
7. **wire-b-contract** — a11oy → sentra Wire B contract enforcement
8. **receipt-hash** — Audit chain / non-repudiation receipt hash

## Architecture

- **Landing**: Vessels-DNA design system, commit `bf908105` preserved verbatim
- **Console**: Replit SPA (standalone build, `@szl-holdings/shared-ui` stubbed)
- **Backend**: FastAPI, inline immune logic from `szl-holdings/sentra/src/sentra_immune.py`
- **Wire B**: `/v1/verdict` + `/v1/inspect` — a11oy mesh-router integration
- **Rosie widget**: Embedded on both landing and console

Doctrine v10 · 749 declarations · 14 unique axioms · 163 tracked sorries · 12 MCP tools · 46 policy gates
