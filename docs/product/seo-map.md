# SEO Map — SZL Holdings Platform

> All public routes with expected titles, descriptions, and OG tag configuration.

---

## SZL Holdings Main Site (`szlholdings.com`)

### Core Marketing Routes

| Route | Title | Meta Description | OG Image |
|-------|-------|-----------------|---------|
| `/` | SZL Holdings — Governed Decision Infrastructure | The governed decision infrastructure platform. Connect what's observable to what's executable, under governance, with full attribution. | `og-home.jpg` |
| `/platform` | Platform — SZL Holdings | The SZL Holdings platform: Lyte observability, Alloy execution fabric, and domain packs for security, maritime, and real estate. | `og-platform.jpg` |
| `/lyte` | Lyte — Business Observability | Lyte is the command surface for operators. PRISM framework: signals, routing, priority action queue, and execution accountability. | `og-lyte.jpg` |
| `/alloy-fabric` | Alloy — Execution Fabric | Signal normalization, workflow orchestration, approval controls, and immutable audit trail. The governance layer for AI-assisted operations. | `og-alloy.jpg` |
| `/solutions` | Solutions — SZL Holdings | Governed decision infrastructure for security, maritime, real estate, and professional services. | `og-solutions.jpg` |
| `/solutions/aegis` | Aegis — Security & Defense Intelligence | SOC command, MITRE ATT&CK mapping, SOAR playbooks, AI triage with human approval gates. | `og-aegis.jpg` |
| `/solutions/vessels` | Vessels — Maritime Intelligence | Fleet command, AIS telemetry, sanctions screening, dark vessel detection, exception-based workflows. | `og-vessels.jpg` |
| `/solutions/terra` | Terra — Real Estate Intelligence | NYC distress property pipeline, ownership entity graph, deal pipeline, broker workflow. | `og-terra.jpg` |
| `/solutions/prism-counsel` | Counsel — Legal Intelligence | AI-assisted legal operations with approval gates, proof chain, and immutable audit trail. | `og-prism-counsel.jpg` |
| `/pricing` | Pricing — SZL Holdings | Transparent pricing for Lyte, Alloy, and domain pack products. Design partner pricing available. | `og-pricing.jpg` |
| `/contact` | Contact — SZL Holdings | Enterprise inquiries, design partner opportunities, and investment conversations. | `og-contact.jpg` |
| `/design-partners` | Design Partners — SZL Holdings | Join the SZL Holdings design partner program. Shape the governed intelligence platform alongside the founding team. | `og-design-partners.jpg` |
| `/how-it-works` | How It Works — SZL Holdings | How the SZL Holdings governed decision infrastructure platform connects signals to accountable action. | `og-how-it-works.jpg` |

### Trust Routes

| Route | Title | Meta Description |
|-------|-------|-----------------|
| `/trust-center` | Trust Center — SZL Holdings | Security, governance, data privacy, and compliance documentation for the SZL Holdings platform. |
| `/trust` | Trust — SZL Holdings | Our approach to trust: AI governance, access control, audit trail, and operational security. |
| `/trust/security` | Security — SZL Holdings Trust | TLS 1.3, HMAC-signed WebSocket tickets, 11-role RBAC, org-scoped tenant isolation. |
| `/trust/governance` | Governance — SZL Holdings Trust | How governance is enforced: approval gates, human-in-the-loop, policy controls, audit trail. |
| `/trust/architecture` | Architecture — SZL Holdings Trust | Technical trust: multi-tenant isolation, data flow, authentication model. |
| `/trust/ai` | AI Governance — SZL Holdings Trust | AI agents as advisors only. Evidence attribution, confidence scores, human approval required. |
| `/trust/approvals` | Approvals Framework — SZL Holdings Trust | The Alloy approval gate model: when AI can act and when humans must decide. |
| `/trust/operations` | Operational Trust — SZL Holdings Trust | Backup, recovery, incident response, and operational security. |

### Legal Routes

| Route | Title | Meta Description | Indexed |
|-------|-------|-----------------|---------|
| `/legal/privacy` | Privacy Policy — SZL Holdings | How SZL Holdings collects, uses, and protects your data. | Yes |
| `/legal/terms` | Terms of Service — SZL Holdings | Terms governing use of the SZL Holdings platform and services. | Yes |
| `/accessibility` | Accessibility — SZL Holdings | Our commitment to accessible design and WCAG compliance. | Yes |
| `/status` | System Status — SZL Holdings | Current operational status of all SZL Holdings platform services. | Yes |

### Documentation Routes

| Route | Title | Meta Description |
|-------|-------|-----------------|
| `/docs` | Documentation — SZL Holdings | Technical documentation for the SZL Holdings platform. |
| `/docs/architecture` | Architecture — SZL Holdings Docs | Platform architecture: signal flow, control plane, execution fabric. |
| `/docs/control-plane` | Control Plane — SZL Holdings Docs | The Alloy control plane: routing, orchestration, and policy enforcement. |
| `/docs/worldline` | Worldline — SZL Holdings Docs | Worldline: immutable timeline of decisions and actions. |
| `/docs/proof-chain` | Proof Chain — SZL Holdings Docs | Proof Chain: cryptographically verifiable audit trail. |
| `/docs/model-mesh` | Model Mesh — SZL Holdings Docs | Model Mesh: multi-model AI inference routing. |
| `/docs/trust` | Trust Documentation — SZL Holdings Docs | Trust framework documentation for developers and enterprise evaluators. |

---

## Robots.txt Configuration

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /ops
Disallow: /kpi-dashboard
Disallow: /investors
Disallow: /alloy
Disallow: /prism-counsel
Disallow: /s31
Disallow: /s32
Disallow: /ny
Disallow: /__mockup

Sitemap: https://szlholdings.com/sitemap.xml
```

---

## Sitemap Coverage

All `PUBLIC` routes from [ROUTE_INVENTORY.md](../architecture/route-inventory.md) should be included in the sitemap.

Priority values:
- `/` — 1.0
- Product pages (`/lyte`, `/alloy-fabric`, `/solutions/*`) — 0.9
- Trust pages (`/trust-center`, `/trust/*`) — 0.8
- Contact, design partners, pricing — 0.8
- Documentation — 0.7
- Legal pages — 0.5

Change frequency:
- Landing page — weekly
- Product pages — monthly
- Legal pages — yearly

---

## OG Image Specifications

- Dimensions: 1200 × 630px
- Format: JPG (preferred for social)
- Location: `public/og/` in the SZL Holdings artifact
- Fallback: `og-default.jpg` (SZL Holdings logo + tagline on dark background)

---

## Implementation Checklist

- [ ] `react-helmet-async` or equivalent for dynamic meta tags
- [ ] OG images created for all major routes
- [ ] `robots.txt` deployed at root
- [ ] `sitemap.xml` generated and auto-submitted to Google Search Console
- [ ] Google Search Console property verified for `szlholdings.com`
- [ ] Core Web Vitals passing (Lighthouse ≥ 85)
- [ ] Structured data (JSON-LD) for organization schema on homepage
