## Summary

_Brief description of what this PR does and why._

---

## Type of Change

- [ ] Feature — New functionality
- [ ] Fix — Bug fix or error correction
- [ ] Refactor — Code improvement without functional change
- [ ] Documentation — Docs, comments, or README updates
- [ ] Infrastructure — IaC, CI/CD, environment configuration
- [ ] Design — UI/UX changes
- [ ] Breaking change — Requires migration or consumer updates

---

## What Changed

_List the key changes made. Be specific._

-
-
-

---

## Affected Artifacts

_Which applications or libraries are affected?_

- [ ] `api-server`
- [ ] `lyte-command-center`
- [ ] `firestorm` (Aegis)
- [ ] `vessels`
- [ ] `terra`
- [ ] `carlota-jo`
- [ ] `szl-holdings`
- [ ] `stephen-site`
- [ ] Mobile apps (`szl-holdings-mobile`, `aegis-mobile`, `vessels-mobile`, `lyte-mobile`, `carlota-jo-mobile`, `terra-mobile`, `stephen-mobile`)
- [ ] Shared library (`lib/`)
- [ ] Infrastructure (`infra/`)
- [ ] Documentation (`docs/`)

---

## Checklist

- [ ] No secrets or credentials committed
- [ ] TypeScript types are correct — no `any` without justification
- [ ] API changes are reflected in OpenAPI spec (`lib/api-spec/`)
- [ ] Breaking changes documented in CHANGELOG.md
- [ ] New UI components follow the shared design system (`@workspace/shared-ui`)
- [ ] Audit trail entries added for consequential actions
- [ ] RBAC access controls verified for new routes/endpoints
- [ ] Demo data state explicitly labeled in any new dashboards

---

## Testing Notes

_Describe how this was tested. What scenarios were validated?_

---

## Security Review

- [ ] No secrets, credentials, or tokens committed
- [ ] No new external API calls without documented auth pattern
- [ ] New endpoints have RBAC checks applied
- [ ] Audit trail entries added for consequential actions
- [ ] Data returned does not include fields not required by the consumer

---

## Documentation

_Is documentation updated? If not, explain why._

- [ ] Architecture docs updated if relevant
- [ ] README updated if scope/setup changed
- [ ] CHANGELOG entry added for notable changes
