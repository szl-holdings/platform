# Known Issues — SZL Holdings

## Current Known Issues

| ID | Issue | Severity | Workaround | Status |
|----|-------|----------|------------|--------|
| KI-001 | Large bundle sizes may cause slow initial load | Low | Hard refresh after first load | Investigating |
| KI-002 | drizzle-kit push may timeout on large schema changes | Low | Use psql direct SQL for schema changes | Known limitation |
| KI-003 | .npmrc NODE_AUTH_TOKEN warning on pnpm install | Info | Non-blocking, can be ignored | Will fix |

## Recently Resolved

| ID | Issue | Resolution Date | Fix |
|----|-------|----------------|-----|
| KI-R001 | Article status enum mismatch | April 3, 2026 | Fixed "review" → "in-review" |
| KI-R002 | Missing DELETE endpoint for X posts | April 3, 2026 | Added DELETE /x-posts/:id |
| KI-R003 | Admin write routes unprotected | April 3, 2026 | Added auth middleware |

## Reporting New Issues
If you encounter an issue not listed here:
1. [Report a Bug](./report-a-bug.md)
2. Email support@szlholdings.com
3. Include: steps to reproduce, expected behavior, actual behavior, browser/device info

*Last updated: April 3, 2026*
