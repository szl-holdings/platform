# Incident Response — SZL Holdings

## Response Process

### 1. Detection
- Automated monitoring via health endpoints
- Audit log anomaly detection
- User reports via /contact or security@szlholdings.com
- GitHub security alerts (Dependabot, CodeQL)

### 2. Triage (Within 4 Hours)
- Severity classification (Critical / High / Medium / Low)
- Impact assessment (data, availability, users affected)
- Owner assignment
- Communication decision

### 3. Containment (Within 24 Hours)
- Isolate affected systems
- Revoke compromised credentials
- Enable maintenance mode if needed
- Preserve evidence for investigation

### 4. Resolution
- Root cause analysis
- Fix implementation and testing
- Security review of fix
- Deployment with rollback plan

### 5. Post-Incident
- Post-incident review within 72 hours
- Documentation updates
- Process improvements
- Stakeholder communication

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| Critical | Active data breach or complete service outage | 1 hour | Data exfiltration, DB compromise |
| High | Security vulnerability actively exploited | 4 hours | Auth bypass, privilege escalation |
| Medium | Vulnerability discovered, not exploited | 24 hours | Dependency CVE, XSS potential |
| Low | Minor security improvement needed | 1 week | Header hardening, logging gap |

## Contact
- Security reports: security@szlholdings.com
- Responsible disclosure: /legal/security-disclosure
- General contact: /contact

*Last updated: April 3, 2026*
