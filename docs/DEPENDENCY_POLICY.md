# Dependency Policy — SZL Holdings Platform

> Policy for managing third-party package dependencies across the SZL Holdings monorepo.

---

## Principles

1. **Minimize dependencies.** Add a dependency only when it provides clear value over a custom implementation.
2. **Prefer well-maintained packages.** Check: last published date, weekly downloads, open issues, GitHub activity.
3. **Pin major versions.** Use `^` for minor/patch flexibility, but never `*` or `latest`.
4. **Audit regularly.** Run dependency audits before every major release.
5. **One source of truth.** Use pnpm workspace catalog for shared dependency versions.

---

## Adding a New Dependency

Before adding any new package:

1. **Check if it already exists.** Review `pnpm-workspace.yaml` catalog and existing `package.json` files.
2. **Evaluate the package:**
   - Weekly downloads > 10,000 (prefer > 100,000)
   - Published within the last 6 months (active maintenance)
   - Open issues < 100 unresolved, no critical security issues
   - License compatible (MIT, Apache 2.0, BSD preferred; GPL requires review)
3. **Check for CVEs:** `pnpm audit` or review Snyk/npm advisory database
4. **Add to catalog if shared:** If used in multiple artifacts, add to `pnpm-workspace.yaml` catalog

**Avoid:**
- Packages with no recent updates (> 1 year since last publish)
- Packages with known unpatched CVEs
- GPL-licensed packages without legal review
- Packages that duplicate functionality already in the workspace

---

## Dependency Versioning

### In `pnpm-workspace.yaml` catalog

Shared dependencies use the catalog. Use:
- Exact versions for critical UI/data libraries: `recharts: 2.15.4`
- Caret ranges for utilities: `clsx: ^2.1.1`

### In artifact `package.json`

- Reference catalog versions via `catalog:` specifier
- Artifact-specific dependencies use caret ranges
- Never use `*` or `latest`

---

## Security Auditing

**Before every release:**
```bash
pnpm audit
```

**Severity thresholds:**
- `critical` — Must fix before release. No exceptions.
- `high` — Fix before release. If no fix available, document and accept with approval.
- `moderate` — Fix within 30 days. Track in backlog.
- `low` — Fix within 90 days or next major dependency update cycle.

**Tools:**
- `pnpm audit` — Built-in npm advisory database check
- Dependabot alerts (if GitHub repo configured)
- Snyk (optional, for deeper analysis)

---

## License Compliance

All dependencies must have licenses compatible with proprietary commercial software:

| License | Status |
|---------|--------|
| MIT | Approved |
| Apache 2.0 | Approved |
| BSD 2-Clause | Approved |
| BSD 3-Clause | Approved |
| ISC | Approved |
| CC0 | Approved |
| LGPL 2.1+ | Conditionally approved (review required) |
| GPL 2.0 / 3.0 | Requires legal review |
| AGPL | Requires legal review |
| Commercial | Requires explicit approval |

---

## Dependency Categories

### Production Dependencies

Must meet full policy requirements. Listed in `dependencies` in `package.json`.

### Development Dependencies

Must meet security requirements. License restrictions relaxed (GPL acceptable in dev-only tools). Listed in `devDependencies`.

### Peer Dependencies

Document clearly in `README.md` of the relevant package. Must be installable by the workspace peer resolution.

---

## Update Policy

| Update Type | Frequency | Process |
|-------------|-----------|---------|
| Security patches | Immediately on critical/high CVE | Apply, test, release as patch |
| Minor/patch updates | Monthly | pnpm update, test, bundle |
| Major updates | Quarterly | Evaluate, test in isolation, document breaking changes |

The `minimumReleaseAge: 1440` setting in `pnpm-workspace.yaml` ensures packages must be published for at least 24 hours before they can be installed (prevents supply chain attacks via immediate publication).

---

*Last updated: 2026-04-03*
