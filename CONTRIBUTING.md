# Contributing to SZL Holdings Platform

> [Platform Repo](https://github.com/szl-holdings/platform) | [Security](./SECURITY.md) | [Code of Conduct](./CODE_OF_CONDUCT.md) | [Architecture](./docs/architecture/architecture.md) | [Contact](https://szlholdings.com)

The SZL Holdings platform is a **proprietary, founder-led governed decision infrastructure platform**. This repository is a public mirror for evaluation, transparency, and technical review purposes — not an open-source project accepting community contributions.

All participants in SZL Holdings spaces are expected to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

**New here?** Start with [`docs/onboarding.md`](./docs/onboarding.md) — the 10-minute path from clone to a running artifact with tests passing. This document is the contribution workflow; the onboarding doc is the hands-on path.

---

## Who Contributes

Development is led by **Stephen Lutar** and a small team of trusted collaborators. Contributions are by invitation and subject to contractual agreements with SZL Holdings.

---

## If You've Found a Bug

**Security vulnerabilities:** Follow the responsible disclosure process in [SECURITY.md](SECURITY.md). Do not open public issues for security findings.

**Non-security bugs or issues:** You may open a GitHub issue using the provided issue templates. Issues are reviewed and triaged by the SZL Holdings team. We do not guarantee response timelines on non-partner issues.

---

## Pull Request Workflow

All changes go through pull requests targeting `main`. Direct commits to `main` are not permitted once branch protection is enabled.

### Branch Naming

```
feat/<scope>/<short-description>    # New functionality
fix/<scope>/<short-description>     # Bug fix
refactor/<scope>/<short-description># Code improvement
docs/<short-description>            # Documentation only
chore/<short-description>           # Maintenance, dependencies
```

**Scope** is the affected artifact or library: `aegis`, `vessels`, `terra`, `command`, `api-server`, `shared-ui`, `db`, etc.

### Commit Conventions

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(vessels): add sanctions screening to fleet overview
fix(api-server): prevent cross-tenant data leak in RAG retrieval
refactor(lib/auth): extract RBAC middleware into shared utility
docs: update TENANCY-MODEL.md with SCIM provisioning details
chore(deps): bump drizzle-orm to 0.38
```

**Breaking changes** use `!` after the type: `feat(api-server)!: change approval endpoint schema`

### PR Requirements

1. **CI must pass** — lint, typecheck, build (see `.github/workflows/ci.yml`)
2. **PR template completed** — all relevant checklist items addressed
3. **Scoped changes** — one concern per PR; no unrelated diffs
4. **Tests included** — new functionality must have test coverage
5. **Documentation updated** — architecture, API spec, or CHANGELOG as needed
6. **Code review approved** — at least one approving review from a CODEOWNER

### Code Review Expectations

Reviewers check for:
- Correctness and completeness against the stated scope
- Multi-tenant isolation preserved (all queries scoped by `org_id`)
- No secrets, credentials, or PII committed
- Consistent use of shared libraries — no duplicated business logic
- TypeScript strictness maintained (no untyped `any` without comment)
- Audit trail entries for consequential actions
- Platform primitive usage where applicable (Proof Chain for audit, Covenant Policy for approvals)

---

## Engineering Standards

The following standards apply to all work on the SZL Holdings platform:

### Code Quality

- **TypeScript** — All code is strictly typed. `any` is prohibited except in rare adapter patterns, with explicit justification in comments.
- **Lint clean** — All files must pass ESLint with no errors or suppressions without justification.
- **No dead code** — Unused imports, variables, and functions must be removed.

### Architecture Conventions

- **Shared libraries** — Cross-surface logic belongs in `lib/`. Never duplicate business logic across `artifacts/`.
- **Platform primitives** — Use the six platform primitives (Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, Event Fabric) where applicable. Do not rebuild governance infrastructure in a domain pack.
- **API-first** — All data access goes through the API server. Frontends never directly query the database.
- **Typed API contracts** — All API endpoints are typed via Zod schemas in `lib/api-zod/` and codegen hooks in `lib/api-client-react/`.
- **Explicit over implicit** — Platform state (data freshness, demo mode, model version) is always visible to the user.

### Security Requirements

- Secrets are **never** committed to source control. All credentials go in environment variables. See `SECRETS_SETUP.md`.
- All API routes require authentication unless explicitly designated public. The `globalAuthEnforcer` middleware enforces deny-by-default.
- Destructive operations require multi-step confirmation and audit log entries via Proof Chain.
- AI agents are advisory-only — all consequential actions require human approval via Covenant Policy gates.
- The api-server **security test suite** (`pnpm --filter @workspace/api-server test`, including `security-middleware.test.ts`, `security-routes.test.ts`, and `security-hardening.test.ts`) runs automatically in CI on every push and pull request via the [Security workflow](./.github/workflows/security.yml) ([![Security](https://github.com/szl-holdings/platform/actions/workflows/security.yml/badge.svg)](https://github.com/szl-holdings/platform/actions/workflows/security.yml)). The `Security Gate (blocking)` job is a required status check on the default branch, so failures block merges. Run the suite locally before pushing to avoid red builds.

### Design Conventions

- **Dark-first** — All UI is designed for the dark premium aesthetic defined in `@workspace/shared-ui` (except Carlota Jo, which uses a luxury light-mode theme).
- **Command-surface density** — Information density with clarity. No decorative chrome.
- **Shared component library** — New UI primitives go in `@workspace/shared-ui`. Domain-specific components stay in their artifact.
- **Accessible** — Color contrast and keyboard navigation are non-negotiable.

### Documentation Requirements

- Architecture-significant changes require documentation updates in `docs/architecture/`.
- API changes require OpenAPI spec updates in `lib/api-spec/`.
- Breaking changes require CHANGELOG.md entries.
- New environment variables require `ENV_MATRIX.md` entries.

---

## Monorepo Structure

```
artifacts/          # Deployable surfaces (web apps, mobile, API server)
lib/                # Shared libraries and platform primitives
docs/               # Architecture, investor, buyer, and operational docs
infra/              # Azure Bicep IaC templates
scripts/            # Build, seed, QA, and automation scripts
.github/            # CI/CD workflows, issue templates, CODEOWNERS
```

For full monorepo conventions, see `docs/architecture/architecture.md` and `docs/product/product-surface-map.md`.

---

## Developer Certificate of Origin (DCO)

All commits to this repository must carry a Developer Certificate of Origin sign-off, per the [DCO v1.1](https://developercertificate.org/). This applies to all contributors — internal, partner, and external. Add it with:

```bash
git commit -s -m "your commit message"
# Produces: Signed-off-by: Name <email>
```

PRs without a DCO sign-off on every commit will be blocked by CI. By signing off, you certify you wrote the code or have the right to contribute it under the repository's license.

---

## Licensing

All content in this repository is proprietary. See [LICENSE](./LICENSE).

---

## Contact

For enterprise partnerships, integration inquiries, or evaluation access:
[inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
