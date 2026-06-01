# SZL Holdings — Gap Register

## P0 — Critical Gaps

| ID | Gap | Area | Impact | Status | Blocked By |
|----|-----|------|--------|--------|------------|
| G001 | Day-one launch content not generated | Content | Cannot launch without foundational posts | Not started | — |
| G002 | Direct publish connectors (X, Medium) | Distribution | Must copy-paste to publish | Not started | API credentials |
| G003 | LinkedIn profile not connected | Distribution | Missing major professional channel | Not started | Stephen to connect |
| G004 | Live-vs-roadmap labels incomplete | Trust | Buyer confusion risk | Partial | — |
| G005 | No automated E2E tests in CI | Quality | Regression risk | GitHub workflow exists, tests needed | — |

## P1 — High-Priority Gaps

| ID | Gap | Area | Impact | Status | Blocked By |
|----|-----|------|--------|--------|------------|
| G006 | Profile branding kit incomplete | Brand | First impression risk | Banners exist, avatars/bios needed | Design |
| G007 | Bundle size optimization | Performance | Slow initial loads (1-1.7MB vendors) | Known issue | Engineering time |
| G008 | Accessibility audit not done | Compliance | WCAG gaps unknown | Not started | — |
| G009 | SLI/SLO definitions missing | Reliability | No reliability targets | Not started | — |
| G010 | Content calendar empty (operational) | Content | No publishing momentum | Infrastructure built | Content creation |
| G011 | Mobile error/loading states incomplete | UX | Quality risk on mobile | Not started | — |
| G012 | PDF/carousel generation not operationalized | Content | Cannot produce regular assets | Templates exist | — |
| G013 | Approval queue UI not built | Workflow | No editorial review flow | Schema exists | Engineering |
| G014 | Publishing state machine missing states | Workflow | No scheduled/failed/retry states | Schema partial | Engineering |
| G015 | OG image generation not automated | Social | Social sharing quality | OG meta tags exist | — |

## P2 — Medium-Priority Gaps

| ID | Gap | Area | Impact | Status | Blocked By |
|----|-----|------|--------|--------|------------|
| G016 | Copy review system | Content | No editorial quality gate | Not started | — |
| G017 | Media library management | Content | No centralized asset management | Files scattered | — |
| G018 | Thumbnail generation | Content | Manual thumbnail creation | Not started | — |
| G019 | Analytics dashboard shows seed data only | Analytics | No real performance data | Infrastructure built | Live data |
| G020 | Campaign archive pages not public | Content | No content discovery | Campaign table exists | — |
| G021 | Content diff/version history UI | Workflow | No change tracking in admin | dos_article_versions table exists | UI |
| G022 | Privacy/security/trust pages audit | Legal | Completeness check needed | Pages exist, content needs review | — |
| G023 | Product analytics (beyond page views) | Analytics | Limited behavioral insights | Basic tracking exists | — |
| G024 | Favicon/app icon hygiene | Polish | Brand consistency | Partial | — |

## Fix/Merge/Archive/Roadmap Disposition

| Category | Count | IDs |
|----------|-------|-----|
| **Fix Now** | 5 | G001-G005 |
| **Fix 30-day** | 10 | G006-G015 |
| **Roadmap** | 9 | G016-G024 |
| **Merge** | 0 | — |
| **Archive** | 0 | — |
| **Blocked by Access** | 2 | G002 (API creds), G003 (LinkedIn) |
| **Blocked by Environment** | 0 | — |
