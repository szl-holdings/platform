# Third-Party Register — SZL Holdings Platform

> Complete register of all third-party services, their data access scope, and trust assessment.

Last updated: 2026-04-03

---

## Register

### Infrastructure

| Service | Provider | Purpose | Data Access | Location | DPA/Trust |
|---------|----------|---------|-------------|----------|-----------|
| App Service | Microsoft Azure | Web app hosting | Application code, logs | US East (configurable) | Microsoft DPA |
| PostgreSQL Flexible | Microsoft Azure | Primary database | All platform data | US East | Microsoft DPA |
| Redis Cache | Microsoft Azure | Session storage | Session tokens | US East | Microsoft DPA |
| Key Vault | Microsoft Azure | Secrets management | Secret values (encrypted) | US East | Microsoft DPA |
| Application Insights | Microsoft Azure | Monitoring/telemetry | Error logs, performance data | US East | Microsoft DPA |
| CDN | Microsoft Azure | Static asset delivery | Static files (no user data) | Global CDN | Microsoft DPA |
| Blob Storage | Microsoft Azure | File/backup storage | Backups, media assets | US East | Microsoft DPA |

---

### Development Platform

| Service | Provider | Purpose | Data Access | Notes |
|---------|----------|---------|-------------|-------|
| Replit | Replit, Inc. | Development workspace | Source code, dev database, secrets | Development only |
| GitHub | Microsoft | Version control (public mirror) | Curated public code only | No customer data |

---

### Authentication

| Service | Provider | Purpose | Data Access | Notes |
|---------|----------|---------|-------------|-------|
| Replit Auth | Replit, Inc. | OIDC provider (dev) | User identity (Replit account) | Dev only |
| Azure Active Directory | Microsoft | OIDC + SCIM (prod) | User identity, group membership | Enterprise SSO |

---

### AI / Machine Learning

| Service | Provider | Purpose | Data Access | Notes |
|---------|----------|---------|-------------|-------|
| HuggingFace Inference API | HuggingFace | AI model inference (Qwen3-8B) | Query text sent to API | Primary AI provider |
| OpenAI API | OpenAI | Fallback AI inference | Query text sent to API | Fallback only |
| Anthropic API | Anthropic | Fallback AI inference | Query text sent to API | Fallback only |

**AI data handling:** Queries sent to AI providers do not include PII or customer-identifying information. All AI calls are logged in the internal audit trail.

---

### Payments

| Service | Provider | Purpose | Data Access | Compliance |
|---------|----------|---------|-------------|-----------|
| Stripe | Stripe, Inc. | Payment processing | Payment card data (via Stripe Elements, never touches our server) | PCI DSS Level 1 |

---

### Mapping

| Service | Provider | Purpose | Data Access | Notes |
|---------|----------|---------|-------------|-------|
| Mapbox | Mapbox, Inc. | Geospatial maps | Map tile requests, viewport data | Terra, Vessels |

---

### Email

| Service | Provider | Purpose | Data Access | Notes |
|---------|----------|---------|-------------|-------|
| SMTP (Nodemailer) | Configurable | Transactional email | Email addresses, email content | Contact form responses |

---

### Analytics

| Service | Provider | Purpose | Data Access | Notes |
|---------|----------|---------|-------------|-------|
| Google Analytics 4 | Google | Site analytics | Anonymized usage data, page views | GDPR consent required |
| PostHog | PostHog | Event tracking | Anonymized event data | Planned |

---

## Data Sharing Principles

1. **Minimum necessary data.** Only the data required for the service to function is shared.
2. **No PII to analytics.** Analytics providers never receive personally identifiable information.
3. **AI query sanitization.** Queries to AI APIs are stripped of PII before transmission.
4. **No selling data.** SZL Holdings does not sell customer data to any third party.
5. **DPA in place.** Data Processing Agreements are in place with all processors of personal data.

---

## Customer Notification

Customers are informed of third-party data processors via the Privacy Policy at `/legal/privacy`. Material changes to this register are communicated with 30 days notice.

---

## Annual Review

This register is reviewed annually and upon onboarding any new third-party service.

Next review: **2027-04-01**
