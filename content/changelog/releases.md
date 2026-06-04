# Release Notes — SZL Holdings

## Release Process
All releases follow a structured governance model:
1. Feature development on feature branch
2. PR with CI checks (lint, typecheck, build, CodeQL, dependency review)
3. Code review via CODEOWNERS
4. Merge to main
5. Automated deployment
6. Post-release verification

## Release History

### v0.9.0 — Distribution OS (April 3, 2026)
**Highlights**: Full content publishing platform with social distribution
- 22 new database tables
- 1,618 API endpoints (up from 1,166)
- Admin panel with articles CMS, newsletters, carousels, X studio, campaigns, leads, calendar, analytics, automations, settings
- Public pages: link-in-bio, newsletter subscription
- Social profiles: X (@szlholdings), Medium (@stephen_38454), Substack (szlholdings.substack.com), Linktree (linktr.ee/szlholdings)

### v0.8.0 — GitHub Engineering Spine (April 2, 2026)
**Highlights**: Professional CI/CD and security posture
- 14 GitHub workflow files
- CodeQL security scanning
- Automated dependency review
- CODEOWNERS with full path coverage
- Dependabot with grouped weekly updates

### v0.7.0 — Platform Foundation (March 2026)
**Highlights**: Full product family operational
- 8 web applications deployed
- 8 mobile applications deployed
- 442 PostgreSQL tables
- AI engine with evidence retrieval and policy gates
- Shared UI component library

## Breaking Changes
No breaking changes in current release cycle. All changes are additive.

## Known Limitations
See /docs/known-limitations for current limitations and planned improvements.
