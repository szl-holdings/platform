# SZL Holdings — Ecosystem Overview

*Updated: Q1 2026*

---

## Platform Inventory

| Platform | Type | Visibility |
|----------|------|-----------|
| SZL Holdings | Web app | Public — corporate site, investor relations, trust center |
| Lyte | Web app | Private — authenticated command center |
| Aegis | Web app | Authenticated — defense, command, and intelligence workspaces |
| Terra | Web app | Authenticated — real estate intelligence dashboard |
| Vessels | Web app | Hybrid — public marketing, authenticated dashboard |
| Carlota Jo | Web app | Public marketing + authenticated client portal |
| Stephen Lutar | Web app | Public — founder identity and portfolio |
| API Server | Express API | Backend — authenticated API endpoints |
| Mobile Apps | Expo/React Native | iOS and Android clients for key platforms |

---

## Platform Hierarchy

```
SZL Holdings (parent company)
  └── Alloy (execution fabric)
       ├── Lyte (business observability)
       ├── Aegis (defense & intelligence)
       ├── Terra (real estate intelligence)
       ├── Vessels (maritime intelligence)
       └── Carlota Jo (private advisory)
  └── Stephen Lutar (founder identity)
```

---

## Public Surfaces

### SZL Holdings
- Corporate homepage, ecosystem overview, ventures, founder profile
- Investor relations, trust center, legal documentation
- Contact and partnership inquiry

### Vessels
- Public marketing pages: platform overview, capabilities, use cases, security, pricing
- Authenticated dashboard: fleet management, voyage economics, exception center

### Carlota Jo
- Public marketing: services, approach, inquiry form
- Authenticated client portal

### Stephen Lutar
- Founder portfolio, case studies, frameworks, writing, contact

---

## Authenticated Surfaces

The following platform areas require authentication and are not publicly accessible:

- **Lyte Command Center** — business observability dashboard, action queue, approvals
- **Aegis Defense/Command/Intelligence** — SOC operations, managed services, AI research
- **Terra Dashboard** — real estate intelligence, distress map, deal pipeline
- **Vessels Dashboard** — fleet command, voyage tracking, exception management
- **Alloy Console** — workflow orchestration, governance, audit trail
- **All API endpoints** — authenticated access via Bearer token or session cookie

---

## Authentication and Access

- **Authentication**: OpenID Connect (PKCE) with session cookie management
- **Authorization**: Organization-scoped role-based access control
- **Roles**: Layered from executive viewer through operator, analyst, and compliance personnel
- **API Security**: Bearer token authentication, CSRF protection, rate limiting

---

## Data Architecture

The platform runs on a shared PostgreSQL database with domain-organized schema. All platforms share authentication, audit logging, and real-time infrastructure. Domain-specific tables (vessels, terra, alloy, etc.) are organized within the shared database.

---

## Security Posture

See [docs/trust-center.md](trust-center.md) for the full security posture, AI governance framework, and audit trail design.

See [docs/architecture.md](architecture.md) for the complete technical architecture, data flow, and service boundaries.
