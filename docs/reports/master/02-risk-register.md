# SZL Holdings — Risk Register

## P0 — Critical

| ID | Risk | Impact | Mitigation |
|----|------|--------|------------|
| R001 | GitHub CI missing CodeQL, e2e, dependency-review, CODEOWNERS | Code quality and security scanning gaps | Add workflows in Phase 4 |
| R002 | Bundle sizes exceed 500KB on all web apps | Performance, SEO, mobile experience | Code splitting, lazy loading |
| R003 | Many API endpoints return seeded data, not live | Buyer confusion, credibility risk | Label demo/seeded explicitly |
| R004 | alloyRetrieval singleton has no tenant partitioning | Cross-tenant data leakage risk | Add tenantId to all retrieval queries |
| R005 | No automated E2E test suite | Regression risk on every change | Build Playwright suite |
| R006 | Force-push workaround required for GitHub | Bypasses branch protection | Fix .github/workflows or repo settings |

## P1 — High

| ID | Risk | Impact | Mitigation |
|----|------|--------|------------|
| R007 | Firestorm has 41 pages, many are decorative | Scope confusion, maintenance burden | Audit and consolidate |
| R008 | 80+ env vars, unclear which are required vs optional | Deployment failures, onboarding friction | Create env docs |
| R009 | Large chunk sizes across all web apps (1-1.7MB vendor bundles) | Slow initial loads | Manual chunks, tree shaking |
| R010 | Mobile apps may lack comprehensive error/loading states | UX quality issues | Audit and fix |
| R011 | No CODEOWNERS file | Code review discipline gap | Create CODEOWNERS |
| R012 | Missing PR template and issue templates | Inconsistent contributions | Add templates |

## P2 — Medium

| ID | Risk | Impact | Mitigation |
|----|------|--------|------------|
| R013 | shared-ui components not fully adopted across apps | Inconsistent UX | Migrate to shared components |
| R014 | No lighthouse CI integration | Performance regression risk | Add lighthouse workflow |
| R015 | Accessibility not systematically audited | WCAG compliance gaps | Add a11y audit |
