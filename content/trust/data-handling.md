# Data Handling — SZL Holdings

## Data Classification

| Level | Description | Examples | Controls |
|-------|-------------|----------|----------|
| Public | Intentionally public | Marketing content, published articles | Standard web security |
| Internal | Business operations | Workflow configs, audit logs | Auth required, role-based access |
| Confidential | Sensitive business data | Customer records, financial data | Auth + role + audit logging |
| Restricted | Highest sensitivity | API keys, credentials, PII | Environment secrets, never in code |

## Data at Rest
- **Database**: PostgreSQL with managed encryption
- **Files**: Replit Object Storage with access controls
- **Secrets**: Environment-managed, never committed to repository
- **Backups**: Replit-managed automated backups

## Data in Transit
- All API communication over HTTPS/TLS
- No plaintext transmission of sensitive data
- Secure cookie flags (httpOnly, secure, sameSite)

## Data Access Controls
- Role-based access control (RBAC) via user_roles table
- Auth middleware on all admin and write endpoints
- Public endpoints limited to: lead capture, analytics tracking, public content reads
- Tenant-scoped data access (in progress)

## Data Retention & Deletion
- Business data retained per customer agreement
- Usage analytics: 90-day rolling retention
- Audit logs: Retained for compliance (minimum 1 year)
- Account deletion: Full data removal upon verified request

## Third-Party Data Sharing
- **Stripe**: Payment processing only (PCI-compliant)
- **Replit Auth**: Authentication tokens only
- **HuggingFace**: AI inference (no customer data sent)
- No data sold to third parties
- No advertising data sharing

*Last updated: April 3, 2026*
