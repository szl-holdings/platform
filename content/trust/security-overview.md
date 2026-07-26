# Security Overview — SZL Holdings

## Authentication & Access Control
- **Authentication**: Session-based auth with Replit Auth (OpenID Connect with PKCE)
- **Authorization**: Role-based access control (RBAC) via user_roles table
- **Session management**: Secure session tokens with httpOnly cookies
- **API protection**: All admin/write endpoints protected with requireAuth middleware
- **SCIM provisioning**: SCIM 2.0 endpoints for enterprise identity management

## Data Protection
- **Encryption in transit**: All traffic over HTTPS/TLS
- **Database**: PostgreSQL with connection-level encryption
- **Secrets management**: Environment-managed secrets, never stored in code
- **Input validation**: Server-side request validation on all API endpoints

## Code Security
- **Static analysis**: CodeQL scanning on every push and pull request
- **Dependency scanning**: Dependabot with weekly automated dependency review
- **Dependency review**: Automated dependency change review on every PR
- **Code ownership**: CODEOWNERS file enforcing review requirements

## Infrastructure
- **Hosting**: Replit managed infrastructure with automatic scaling
- **Database**: Managed PostgreSQL with automated backups
- **CI/CD**: GitHub Actions with 45 measured workflow files
- **Branch protection**: Documented branch protection rules (require PR, require approval, require status checks)

## AI Governance
- **Propose-only mode**: AI decisions require human approval before execution
- **Policy-gated execution**: 9 validated tool schemas with policy gates
- **Immutable audit trail**: Every AI decision logged to alloy_ai_audit_log
- **Evidence provenance**: Hybrid search with BGE embeddings and reranking

## Monitoring & Logging
- **Audit logging**: Structured audit events across all domains
- **API logging**: Request/response logging on all endpoints
- **Error tracking**: Structured error capture and reporting
- **Health checks**: /api/health endpoint for service monitoring

## Incident Response
- **Contact**: security@szlholdings.com (or via /contact page)
- **Responsible disclosure**: /legal/security-disclosure page
- **Response timeline**: Acknowledge within 24 hours, triage within 72 hours

## What Is Implemented vs Planned

| Capability | Status |
|------------|--------|
| Auth middleware on all admin routes | ✅ Implemented |
| CodeQL scanning | ✅ Implemented |
| Dependency review automation | ✅ Implemented |
| CODEOWNERS enforcement | ✅ Implemented |
| AI audit trail | ✅ Implemented |
| SOC 2 certification | 🗓️ Planned |
| Penetration testing | 🗓️ Planned |
| Multi-tenant data isolation audit | 🗓️ Planned |
| WAF/DDoS protection | 🗓️ Planned |
| SIEM integration | 🗓️ Planned |

*Last updated: April 3, 2026*
