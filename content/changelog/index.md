# Changelog — SZL Holdings

## How We Track Changes
Every significant change to the SZL platform is documented here. We follow semantic versioning principles and categorize changes as:

- **Added** — New features and capabilities
- **Changed** — Modifications to existing features
- **Fixed** — Bug fixes and corrections
- **Security** — Security improvements and patches
- **Deprecated** — Features planned for removal
- **Removed** — Features that have been removed

## Recent Changes

### April 3, 2026
**Added**
- Distribution OS — Complete content publishing and distribution platform
  - 22 database tables (dos_* prefix)
  - Full CRUD API at /api/distribution-os/*
  - Admin panel with 11 sub-pages
  - Public link-in-bio and newsletter pages
- Social profile connections (X, Medium, Substack, Linktree)
- Trust Center content (security, privacy, architecture, data handling)
- Docs Portal (getting started, platform overview, FAQ, glossary)
- Help Center structure
- Elite layer workspace (trust, docs, flags, analytics, support, demo, proof, academy)

**Changed**
- API endpoints grew from 1,166 to 1,618
- Database tables grew from ~400 to 442
- GitHub workflows expanded from 3 to 14

**Fixed**
- Article status enum mismatch (UI "review" → "in-review")
- Lead stage enum alignment with database values
- Missing DELETE /x-posts/:id endpoint added
- Auth middleware added to all Distribution OS admin write routes

**Security**
- Auth hardening on all admin write endpoints
- CodeQL scanning added to CI pipeline
- Dependency review automation on all PRs
- CODEOWNERS enforcement configured

### April 2, 2026
**Added**
- GitHub CI/CD pipeline expansion (ci, build, e2e, codeql, dependency-review, lighthouse, release)
- CODEOWNERS file with comprehensive path coverage
- Dependabot configuration with grouped updates
- Branch protection documentation
- PR and issue templates

## Subscribe to Updates
Follow our changelog for platform updates. Major releases are also announced via our newsletter at /newsletter.
