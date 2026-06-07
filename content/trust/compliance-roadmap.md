# Compliance Roadmap — SZL Holdings

## Current Posture

| Control | Status | Evidence |
|---------|--------|----------|
| Access control (RBAC) | ✅ Implemented | user_roles table, auth middleware |
| Audit logging | ✅ Implemented | alloy_audit_log, firestorm audit tables |
| Encryption in transit | ✅ Implemented | HTTPS/TLS on all endpoints |
| Code scanning | ✅ Implemented | CodeQL, dependency review |
| Dependency management | ✅ Implemented | Dependabot, automated PRs |
| Change management | ✅ Implemented | Git, PR reviews, CODEOWNERS |
| Incident response plan | ✅ Documented | content/trust/incident-response.md |
| Privacy policy | ✅ Published | /legal/privacy |
| Terms of service | ✅ Published | /legal/terms |
| Security disclosure | ✅ Published | /legal/security-disclosure |

## Roadmap

### Q2 2026 — Foundation
- [ ] Complete multi-tenant data isolation audit
- [ ] Implement automated E2E test suite
- [ ] Define SLI/SLO targets
- [ ] Conduct first internal security review

### Q3 2026 — Hardening
- [ ] SOC 2 Type I preparation
- [ ] Penetration testing (third-party)
- [ ] GDPR compliance review
- [ ] Data processing agreements (DPA) template
- [ ] Vendor security questionnaire responses

### Q4 2026 — Certification
- [ ] SOC 2 Type I audit
- [ ] ISO 27001 gap analysis
- [ ] HIPAA readiness assessment (if applicable)
- [ ] Third-party security audit report

### 2027 — Maturity
- [ ] SOC 2 Type II
- [ ] ISO 27001 certification
- [ ] Automated compliance monitoring
- [ ] Customer security portal

## Applicable Frameworks
- SOC 2 (Trust Service Criteria)
- ISO 27001 (Information Security Management)
- GDPR (EU Data Protection)
- CCPA (California Consumer Privacy)
- NIST Cybersecurity Framework

*Last updated: April 3, 2026*
