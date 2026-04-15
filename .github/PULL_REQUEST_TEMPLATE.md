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
- [ ] Dependency update — Package upgrades

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
- [ ] `firestorm` (Aegis — Unified Defense & Intelligence)
- [ ] `vessels`
- [ ] `terra`
- [ ] `carlota-jo`
- [ ] `prism-counsel`
- [ ] `imperium`
- [ ] `command` (Command Portal)
- [ ] `szl-holdings`
- [ ] `command` (Ecosystem Command Portal)
- [ ] `imperium`
- [ ] `szl-holdings-mobile` (CORTEX — Unified Mobile Command)
- [ ] `stephen-site`
- [ ] Shared library (`lib/`)
- [ ] Infrastructure (`infra/`)
- [ ] Documentation (`docs/`)

---

## Quality Checklist

### Code Quality
- [ ] CI passes locally — lint, typecheck, and unit tests all green
- [ ] No `any` types without justification and inline comment
- [ ] No debug artifacts, console.log, or commented-out code left in
- [ ] PR is scoped to the stated changes — no unrelated diffs
- [ ] Code follows project conventions (see `.github/instructions/`)

### Testing
- [ ] New functionality is covered by tests (unit or e2e)
- [ ] Existing tests pass — no regressions introduced
- [ ] E2E tests updated if new routes or critical user flows added
- [ ] Tested manually on at least one browser/viewport

### Security
- [ ] No secrets, credentials, or tokens committed
- [ ] No new external API calls without documented auth pattern
- [ ] New endpoints have RBAC checks applied
- [ ] Audit trail entries added for consequential actions
- [ ] Data returned does not include fields not required by the consumer

### API & Data
- [ ] API changes reflected in OpenAPI spec (`lib/api-spec/`)
- [ ] Database migrations included if schema changed
- [ ] Breaking changes documented in CHANGELOG.md
- [ ] Multi-tenant scoping preserved — all queries include `org_id`

### UI & Accessibility
- [ ] New UI components follow the shared design system (`@workspace/shared-ui`)
- [ ] Responsive — tested at mobile viewport (390px)
- [ ] No accessibility regressions — keyboard navigable, proper ARIA labels

### Documentation
- [ ] Architecture docs updated if relevant
- [ ] README updated if scope/setup changed
- [ ] CHANGELOG entry added for notable changes
- [ ] CODEOWNERS updated if new areas of ownership introduced

---

## Testing Notes

_Describe how this was tested. What scenarios were validated?_

---

## Performance Notes

_Any performance implications? (bundle size, DB query count, render cost)_

---

## Screenshots / Demo

_For UI changes, include before/after screenshots or a short recording._

---

## Linked Issues / Tasks

_Reference any related issues, tasks, or PRs._

- Task: #
- Issue: #
- Related PR: #
