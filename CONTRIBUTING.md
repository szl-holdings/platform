# Contributing to SZL Holdings Platform

  ## Getting Started

  1. Fork the repository
  2. Clone locally and install: `pnpm install`
  3. Create a feature branch: `git checkout -b feature/your-feature`

  ## Standards

  - **TypeScript strict mode** — no `any` types
  - **pnpm workspace** — respect package boundaries
  - **Drizzle ORM** — schema changes in `lib/db/schema/`
  - **Conventional commits** — `feat:`, `fix:`, `chore:`, `docs:`

  ## Pull Request Process

  1. Update documentation for API or schema changes
  2. Ensure TypeScript compiles cleanly
  3. Complete the security checklist in the PR template
  4. Link related issues

  ## Security

  - Never commit secrets, tokens, or credentials
  - Report vulnerabilities via [SECURITY.md](SECURITY.md)
  - PRs touching `/lib/`, `/scripts/`, or `/.github/` require CODEOWNER review

  ## Questions

  Open an issue or email inquiries@szlholdings.com.
  