# SZL Holdings — Launch Readiness Obstacles

## P0 — Must Fix Before Any Public Launch

| ID | Obstacle | Impact | Owner | Status |
|----|----------|--------|-------|--------|
| L001 | No day-one launch content generated | Cannot launch without foundational posts | Stephen | Docs created, content needed |
| L002 | Direct publish connectors not built (X, Medium, Substack) | Cannot auto-publish — must copy-paste | Engineering | Not started |
| L003 | LinkedIn profile not connected | Missing major professional channel | Stephen | Blocked by credentials |
| L004 | Bundle sizes exceed 500KB on all web apps | Slow first paint for visitors | Engineering | P1 backlog |
| L005 | Mobile apps need error/loading state audit | UX quality risk on mobile | Engineering | Not started |
| L006 | Profile bios/avatars/banners not branded for all platforms | First impression risk | Design/Stephen | Partial (banners exist) |
| L007 | Live-vs-roadmap labeling incomplete | Buyer confusion risk | Product | Partially addressed |

## P1 — Fix Within First 30 Days

| ID | Obstacle | Impact | Owner | Status |
|----|----------|--------|-------|--------|
| L008 | No automated E2E test suite running | Regression risk | Engineering | GitHub workflow exists, tests need writing |
| L009 | Accessibility not audited | WCAG compliance gaps | Engineering | Not started |
| L010 | No SLI/SLO definitions | No reliability targets | Engineering | Not started |
| L011 | Content calendar empty (no scheduled posts) | No publishing momentum | Content/Stephen | Calendar infrastructure built |
| L012 | Analytics dashboard shows seed data only | No real performance data | Engineering | Infrastructure built |
| L013 | PDF/carousel generation not operationalized | Cannot produce regular content assets | Engineering | Templates exist |
| L014 | Approval queue UI not built | No review workflow for content | Engineering | Schema supports it |

## P2 — Fix Within 90 Days

| ID | Obstacle | Impact | Owner | Status |
|----|----------|--------|-------|--------|
| L015 | Copy review system not built | No editorial quality gate | Content | Not started |
| L016 | OG image generation not automated | Social sharing quality | Engineering | OG meta tags exist |
| L017 | Campaign archive pages not public | No content discovery | Engineering | Campaign table exists |
| L018 | Second-order visual refinements | Polish gap | Design | Ongoing |
| L019 | Deeper AI workflow polish | Capability gaps | Engineering | Ongoing |
| L020 | Multi-tenant partitioning audit | Security risk for enterprise | Engineering | Not started |

## Critical Path to Launch

```
1. Generate day-one content (articles, X threads, LinkedIn posts)
2. Set up branded profile assets (avatars, banners, bios) per platform
3. Publish first flagship article on owned site
4. Cross-post to Substack, Medium
5. Launch X thread + singles
6. Update Linktree with launch links
7. Set 30-day cadence
```

## Blocked By Environment/Access

| Item | Blocker | Workaround |
|------|---------|------------|
| X API direct publish | OAuth credentials needed | Export/copy-paste flow |
| Medium API direct publish | Integration token needed | Manual publish from admin |
| Substack direct publish | No public API | Export + manual paste |
| LinkedIn API | OAuth credentials needed | Manual publish |
| Google Analytics pull | GA4 property needed | In-app analytics tracking (dos_page_views, dos_analytics_events) |
