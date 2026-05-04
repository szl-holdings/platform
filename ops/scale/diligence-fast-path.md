# Diligence Fast Path

Phase E · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The running playbook for Stage 4 of `enterprise-evaluation-flow.md`.
Map every common enterprise diligence question to the canonical SZL
answer and the source document.

## Operating Principle

We are honest about what is in place today and what is roadmap. Honest
fast answers beat dressed-up slow answers in enterprise diligence.

## Question Map

### Organization

| Question | Answer | Source |
|----------|--------|--------|
| Company entity | SZL Holdings | Counsel-prepared corp doc |
| Founders | Stephen Lutar (Founder & CEO) | Public |
| Headcount | Founder-stage; named team in pitch materials | Counsel-prepared |
| Location | Per corporate registration | Counsel-prepared |
| Insurance | Cyber + E&O policies in force; certificates on request | Counsel-prepared |

### Architecture

| Question | Answer | Source |
|----------|--------|--------|
| Hosting | Replit Autoscale (managed) | `ops/scale/environment-promotion-model.md` |
| Database | Replit-managed PostgreSQL 16 | Same |
| Multi-tenant model | Single-tenant per organization; org-scoped queries | `ops/security/threat-model-summary.md` |
| Geographic data residency | Replit deployment region | Discuss per opportunity |
| Backup / DR | Replit-managed point-in-time recovery; RPO/RTO per Replit SLA | Replit infra |
| Subprocessor list | Replit, Clerk, Stripe, OpenAI/Anthropic/Gemini (via Replit proxy), Sentry | `ops/scale/buyer-faq.md` |

### Security controls

| Control | Status | Source |
|---------|--------|--------|
| Access control (RBAC) | 11-role hierarchy, server-enforced | `lib/services/rbac` |
| Authentication | Clerk + OIDC + session middleware | Same |
| Secret management | Replit Secrets only; no secrets in source or shared env | `ops/security/secret-inventory.md` |
| Encryption at rest | DB encryption + field-level AES-256-GCM for Restricted data | `ops/security/threat-model-summary.md` |
| Encryption in transit | TLS via Replit proxy | Same |
| Vulnerability scanning | CodeQL + npm audit + Dependabot | `.github/workflows/security.yml` |
| Audit logging | `lib/audit` middleware on sensitive routes | `support-troubleshooting-guide.md` |
| Rate limiting | 200/15m global, 10/15m on auth | `ops/security/threat-model-summary.md` |
| Body size limit | 10MB | Same |
| CORS | Production origin only | `production-cutover-checklist.md` |
| Security headers | Helmet (HSTS, CSP, XFO, etc.) | Same |
| Secret rotation schedule | 90 days for crypto secrets, 180 days for API keys | `ops/security/rotate-now.md` |
| Incident response | Documented severity model and procedure | `ops/scale/incident-triage-model.md` |

### Compliance

| Standard | Status | Honest read |
|----------|--------|-------------|
| SOC 2 Type II | Not certified | Aligned controls per `ops/security/production-hardening-checklist.md`; certification path begins on first enterprise contract requiring it |
| ISO 27001 | Not certified | Same as SOC 2 |
| HIPAA | Not BAA-eligible today | DPA + field encryption supports the path; full BAA on roadmap |
| GDPR | DPA template ready; data subject request flow documented | Counsel-prepared DPA |
| CCPA | Same as GDPR | Same |
| StateRAMP | No | Not on near-term roadmap |
| PCI DSS | Stripe handles cardholder data; SZL is out of scope for cardholder data | Stripe attestation |

### Operations

| Question | Answer | Source |
|----------|--------|--------|
| Uptime target | 99.9% | `ops/scale/buyer-faq.md` |
| RTO / RPO | Per Replit SLA + same-day fix for application-level issues | `incident-triage-model.md` |
| Change management | Release train + smoke tests + founder approval | `release-train-model.md` |
| Monitoring | OpenTelemetry plan + 3-tier alarm matrix | `telemetry-priority-matrix.md` |
| On-call | Founder-led today; rotation defined post next-hire | `next-hires-or-outsourcing.md` |
| Customer notification | DPA-defined; Slack Connect for partners | `incident-triage-model.md` |

### Privacy and data

| Question | Answer | Source |
|----------|--------|--------|
| Personal data processed | Per DPA scope | DPA |
| Data subject requests | 30-day response | DPA |
| Data deletion on termination | 30 days, written confirmation | `buyer-faq.md` |
| Data export format | CSV / JSON | Same |
| Data minimization | Field classification (Public / Confidential / Restricted) | `customer-launch-pack.md` |

### Code, IP, supply chain

| Question | Answer | Source |
|----------|--------|--------|
| Source code ownership | SZL owns all SZL-developed code | Counsel |
| Open-source posture | Standard permissive license usage; SBOM published per `security.yml` | CI artifacts |
| Source code escrow | Available on request for >$500k ARR | `buyer-faq.md` |
| Dependency hygiene | pnpm-lock.yaml; Dependabot; weekly review | `dependency-review.yml` |
| AI usage transparency | Provider names disclosed; tokens consumed logged per tenant | `telemetry-priority-matrix.md` |

## Process

1. Receive buyer questionnaire (CAIQ, SIG-Lite, vendor-specific)
2. For each question: copy the answer + source from this doc
3. Mark anything not yet in this doc as a new row to add after answering
4. Hand to counsel for legal review of phrasing
5. Send within 5 business days of receipt

## Living Document

Every new buyer question that is not in this doc is added on resolution.
The doc grows; entries are not deleted. Quarterly review confirms all
linked sources still reflect reality.
