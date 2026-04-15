# Contributing to SZL Holdings Platform

> [Platform Repo](https://github.com/szl-holdings/szl-holdings-platform) | [Security](./SECURITY.md) | [Code of Conduct](./CODE_OF_CONDUCT.md) | [Architecture](./docs/architecture/system-overview.md) | [Contact](https://szlholdings.com)

The SZL Holdings platform is a **proprietary, founder-led software ecosystem**. This repository is a public mirror for evaluation, transparency, and technical review purposes — not an open-source project accepting community contributions.

All participants in SZL Holdings spaces are expected to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## Who Contributes

Development is led by **Stephen Lutar** and a small team of trusted collaborators. Contributions are by invitation and subject to contractual agreements with SZL Holdings.

---

## If You've Found a Bug

**Security vulnerabilities:** Follow the responsible disclosure process in [SECURITY.md](SECURITY.md). Do not open public issues for security findings.

**Non-security bugs or issues:** You may open a GitHub issue using the provided issue templates. Issues are reviewed and triaged by the SZL Holdings team. We do not guarantee response timelines on non-partner issues.

---

## Engineering Standards (For Reference)

The following standards apply to all work on the SZL Holdings platform:

### Code Quality

- **TypeScript** — All code is strictly typed. `any` is prohibited except in rare adapter patterns, with explicit justification in comments.
- **Lint clean** — All files must pass ESLint with no errors or suppressions without justification.
- **No dead code** — Unused imports, variables, and functions must be removed.

### Architecture Conventions

- **Shared libraries** — Cross-app logic belongs in `lib/`. Never duplicate business logic across `artifacts/`.
- **API-first** — All data access goes through the API server. Frontends never directly query the database.
- **Typed API contracts** — All API endpoints are typed via Zod schemas in `lib/api-zod/` and codegen hooks in `lib/api-client-react/`.
- **Explicit over implicit** — Platform state (data freshness, demo mode, model version) is always visible to the user.

### Security Requirements

- Secrets are **never** committed to source control. All credentials go in environment variables.
- All API routes require authentication unless explicitly designated public.
- Destructive operations require multi-step confirmation and audit log entries.
- AI agents require explicit human approval before executing consequential actions.

### Design Conventions

- **Dark-first** — All UI is designed for the dark premium aesthetic defined in `@workspace/shared-ui`.
- **Command-center density** — Information density with clarity. No decorative chrome.
- **Shared component library** — New UI primitives go in `@workspace/shared-ui`. Platform-specific components stay in their artifact.
- **Accessible** — Color contrast and keyboard navigation are non-negotiable.

### Documentation Requirements

- Architecture-significant changes require documentation updates in `docs/architecture/`.
- API changes require OpenAPI spec updates in `lib/api-spec/`.
- Breaking changes require CHANGELOG.md entries.

---

## Licensing

All content in this repository is proprietary. See [LICENSE.md](LICENSE.md).

---

## Contact

For enterprise partnerships, integration inquiries, or evaluation access:  
[inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
