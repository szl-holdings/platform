# SZL Holdings — Deployment Options

**Date:** Q1 2026

---

## Deployment Models

SZL Holdings supports three deployment models for enterprise customers.

---

## Option 1: Replit Cloud (Managed)

**Best for:** Initial evaluation, design partners, and organizations without strict data residency requirements

| Property | Detail |
|---------|--------|
| Infrastructure | Replit managed cloud |
| Setup time | Hours to days |
| Database | Managed PostgreSQL |
| Secrets | Replit secret management |
| TLS | Automatic (HTTPS enforced) |
| Scaling | Automatic |
| Monitoring | Replit platform monitoring + application health endpoints |
| Backup | Daily automated database backups |
| Customization | Limited (Replit platform constraints) |

**Suitable for:** Design partners, early commercial deployments, organizations without enterprise security procurement requirements.

---

## Option 2: Azure Enterprise (IaC)

**Best for:** Enterprise deployments, compliance-sensitive organizations, organizations with existing Azure infrastructure

Full Azure infrastructure is defined in `/infra/` using Bicep templates.

| Component | Azure Resource |
|-----------|---------------|
| Compute | App Service (Linux, Node.js 20 LTS, autoscale) |
| Database | PostgreSQL Flexible Server (General Purpose, automated backups) |
| Secrets | Azure Key Vault |
| Session / Cache | Azure Cache for Redis |
| CDN | Azure Front Door |
| APM | Application Insights (distributed tracing, log analytics) |

**Features:**
- Per-tenant configuration with Row-Level Security
- Azure AD integration for SSO
- Multi-tenant isolation with tenant provisioning wizard
- Custom domain with SSL/TLS
- Configurable data residency (Azure region selection)

**Setup time:** 1–2 weeks for standard deployment. Longer for custom network configuration or private endpoints.

**Deployment steps:**
```bash
# 1. Deploy infrastructure
az deployment group create \
  --resource-group szl-production \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.json

# 2. Configure secrets in Key Vault
az keyvault secret set --vault-name szl-keyvault \
  --name DATABASE-URL --value "<your-connection-string>"

# 3. Deploy application
pnpm --filter @workspace/api-server build
# Azure Web App deployment via GitHub Actions or Azure CLI
```

---

## Option 3: On-Premises / Private Cloud

**Best for:** Organizations with strict data sovereignty, classified data handling requirements, or air-gapped environments

SZL Holdings can support on-premises deployments for organizations with specific requirements (financial services, healthcare, government). This requires:

- Node.js 20+ runtime environment
- PostgreSQL 15+ database
- Network configuration for inter-service communication
- Custom deployment and operational support agreement

**Setup time:** By arrangement. Requires dedicated engagement.

---

## Multi-Tenant Architecture

For managed security providers (Aegis), property firms (Terra), and fleet operators (Vessels) managing multiple client organizations, the platform supports multi-tenant configuration:

- Organization-scoped data isolation (all queries include `organizationId` filter)
- Per-tenant feature flags
- Per-tenant branding configuration
- Role assignment scoped to organization
- Tenant provisioning workflow (4-step onboarding)

---

## Environment Variable Requirements

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session signing secret (generate: `openssl rand -hex 32`) |
| `ISSUER_URL` | Yes | OIDC provider URL |
| `PORT` | Platform-provided | Auto-assigned per artifact |
| `STRIPE_SECRET_KEY` | Optional | Activates payment flows |
| `RESEND_API_KEY` | Optional | Activates transactional email |
| `MAPBOX_ACCESS_TOKEN` | Optional | Activates maps (Terra, Vessels) |

---

## Support and SLA

Commercial deployments include:
- Dedicated onboarding support
- Documented escalation path
- Response time commitments (defined per contract tier)
- Post-incident review within 5 business days of any material incident

Contact: [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
