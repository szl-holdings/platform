# A11OY_SECURITY_DOCTRINE.md — Security Rules and Secret Hygiene

Security is a structural property of A11oy, not a policy document. These rules are enforced at the repo, execution, and governance layers. Every agent and contributor must apply them unconditionally.

---

## Security Rules

### Secret Hygiene

1. **No secrets in committed files.** This includes: API keys, tokens, database URLs, connection strings, credentials, service account JSON, private keys, certificates, and any value that grants access to a system.
2. **No `.env` file contents committed.** The only committed env-adjacent files are `.env.example` and `.env.*.example`. All real env files must be covered by `.gitignore`.
3. **All credentials come from environment variables.** No default passwords, no hardcoded credentials, no fallback credential strings in application code.
4. **Gitleaks or equivalent must pass before any release.** A secret detection hit is a release blocker — no exceptions.
5. **If you accidentally commit a secret, treat it as compromised immediately.** Rotate the secret, scrub the history (with authorization), and file an incident report in `audit/`.

### Access Control

6. **All routes require authentication.** The deny-by-default global auth enforcer must be in place. No route bypasses auth without explicit, documented justification.
7. **All queries are org-scoped.** Cross-org data access must return 404, not 403 or empty results. Information leakage prevention is structural.
8. **RBAC is enforced at the service layer.** 11-role RBAC with org-scoped tenant isolation. Role checks happen in middleware, not in individual route handlers.
9. **No privilege escalation without policy.** Agents cannot grant themselves elevated permissions mid-execution. Escalation routes through Covenant Policy and the appropriate approval gate.

### Dependency Security

10. **Dependencies must pass audit.** `pnpm audit` must produce zero high or critical vulnerabilities before any production release. Moderate vulnerabilities require documented justification.
11. **No direct dependency on deprecated or unmaintained packages.** If a dependency has been abandoned, add it to `docs/operations/known-gaps.md` and create a remediation task.
12. **Lock file must be committed.** The `pnpm-lock.yaml` is committed and kept in sync. Do not run `--no-frozen-lockfile` in production contexts.

### Data Protection

13. **No production data in development.** Seed data and demo data only in development and staging. No real customer data, no real PII, no real financial data in any non-production environment.
14. **Database dumps are never committed.** `*.dump`, `*.pgdump`, and `.sql.gz` files are covered by `.gitignore`. If a dump is needed for debugging, it is handled out-of-band and destroyed after use.
15. **All external API calls are authenticated and logged.** No anonymous external calls from application code without documented justification.

---

## .gitignore Recommendation

The following patterns must be present in `.gitignore`:

```
# Environment files
.env
.env.local
.env.*.local
*.env
.env.*
!.env.example
!.env.*.example

# Dependencies
node_modules

# Build outputs
dist
build
.next
coverage

# Turbo
.turbo

# Test and QA outputs
test-results
playwright-report

# Screenshot raw captures (processed copies go in docs/assets/screenshots/current/)
screenshots/raw

# Logs
*.log
```

Verify these patterns are present before every release. Any missing pattern must be added and recorded in the install report.

---

## Incident Response

If a security incident is suspected:

1. **Halt all affected Workcells** that may be touching the compromised system.
2. **Document the incident** in `audit/` with timestamp, nature of the issue, affected systems, and immediate actions taken.
3. **Rotate any potentially exposed credentials** before resuming work.
4. **File a gap** in `docs/operations/known-gaps.md` referencing the incident.
5. **Do not minimize or suppress** the incident report. Transparent documentation is required.

See `SECURITY.md` for the responsible disclosure policy and contact information.

---

## Security Checklist (Pre-Release)

- [ ] `pnpm audit` — zero high or critical vulnerabilities
- [ ] Gitleaks scan — clean (no secret pattern matches)
- [ ] All `.env` patterns in `.gitignore` — verified present
- [ ] No hardcoded credentials in application code
- [ ] All routes authenticated — auth enforcer in place
- [ ] All queries org-scoped — cross-org returns 404
- [ ] Lock file committed and in sync
- [ ] No production data in seed or test fixtures
- [ ] No database dumps committed
