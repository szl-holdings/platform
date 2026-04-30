# SEO & Indexing Plan

Last updated: 2026-04-16

## Current State Assessment

### What's In Place

| Element | Status | Location |
|---------|--------|---------|
| `<title>` tags | Good — dynamic via `usePageMeta` | `src/hooks/usePageMeta.ts` |
| Meta descriptions | Good — page-specific via `usePageMeta` | Per-page |
| Canonical URLs | Good — set in index.html and `usePageMeta` | index.html + hook |
| OG tags (og:title, og:description, og:image) | Good | index.html |
| Twitter Cards | Good — summary_large_image | index.html |
| Organization JSON-LD | Good | index.html |
| WebSite + SearchAction JSON-LD | Good | index.html |
| BreadcrumbList JSON-LD | Partial — only homepage | index.html |
| robots.txt | Good — admin surfaces blocked | `public/robots.txt` |
| sitemap.xml | Present | `public/sitemap.xml` |
| Preconnect for fonts | Good | index.html |
| Font `display=swap` | Good | index.html |

### Gaps to Address

| Gap | Priority | Action |
|-----|----------|--------|
| FAQ JSON-LD on FAQ page | High | Add to `/faq` page |
| Product JSON-LD on product pages | High | Add to Lyte, Alloy, solution pages |
| BreadcrumbList on inner pages | Medium | Add via `usePageMeta` extension |
| sitemap.xml automated generation | Medium | Add build-time sitemap generator |
| Image alt text audit | Medium | Verify all `<img>` tags have descriptive alt |
| Heading hierarchy audit (H1-H6) | Medium | Each page should have exactly one H1 |
| Core Web Vitals (LCP, CLS, INP) | High | Already tracked via Web Vitals RUM |
| Page-specific OG images | Medium | `/og/` directory should have per-product images |

---

## Target Keywords (Seed List)

### Primary
- "business observability platform"
- "operational intelligence software"
- "governed workflow automation"
- "AI governance platform enterprise"

### Secondary
- "legal matter intelligence software" (Counsel)
- "maritime fleet intelligence platform" (Vessels)
- "real estate portfolio intelligence" (Terra)
- "SOC command platform" (Aegis)
- "enterprise workflow execution fabric"
- "human in the loop AI enterprise"

### Long-tail
- "how to track operational drift in enterprise"
- "AI audit trail for enterprise compliance"
- "proof chain for AI decisions"

---

## robots.txt Review

Current `public/robots.txt` correctly blocks:
- `/admin` — internal admin portal
- `/ops` — internal ops surfaces
- `/kpi-dashboard` — internal metrics
- `/investors` — private investor relations
- `/alloy`, `/forge`, `/nexus`, `/oracle`, `/control-tower`, `/analyst` — internal

**Action**: Verify no new internal routes are added without updating `robots.txt`.

---

## sitemap.xml Maintenance

**Current state**: Static XML file in `public/sitemap.xml`.

**Recommended approach**:
1. **Short-term**: Manually update `sitemap.xml` when new public pages are added.
2. **Medium-term**: Add a build-time script (`scripts/generate-sitemap.ts`) that reads the route config from `App.tsx` and emits `sitemap.xml` automatically.
3. **Long-term**: Use a sitemap submission API to notify Google Search Console on deploy.

**Sitemap must include all public marketing pages** and exclude all blocked paths from `robots.txt`.

---

## OG Image Strategy

**Current**: Single OG image at `/opengraph.jpg` and `/og/og-home.jpg`.

**Target**: Per-product OG images:

| Page | Image Path | Status |
|------|-----------|--------|
| Homepage | `/og/og-home.jpg` | Present |
| Lyte | `/og/og-lyte.jpg` | Needed |
| Alloy | `/og/og-alloy.jpg` | Needed |
| Vessels | `/og/og-vessels.jpg` | Needed |
| Terra | `/og/og-terra.jpg` | Needed |
| Aegis | `/og/og-aegis.jpg` | Needed |
| Trust Center | `/og/og-trust.jpg` | Needed |

OG images: 1200×630px, on-brand dark background with product name and tagline.

---

## Schema Markup Roadmap

| Schema Type | Page | Priority | Status |
|------------|------|----------|--------|
| Organization | Homepage | High | Done (index.html) |
| WebSite + SearchAction | Homepage | High | Done (index.html) |
| SoftwareApplication | Lyte, Alloy, solution pages | High | Partial (index.html global) |
| FAQPage | `/faq` | High | Needed |
| Product | Pricing page | Medium | Needed |
| BreadcrumbList | All inner pages | Medium | Needed |
| Article | Insights articles | Medium | Add to `usePageMeta` |
| Person | Founder page | Low | Needed |

---

## Core Web Vitals Targets

| Metric | Target | Current | Tool |
|--------|--------|---------|------|
| LCP | < 2.5s | Monitored | Web Vitals RUM → `/api/` |
| INP | < 200ms | Monitored | Web Vitals RUM |
| CLS | < 0.1 | Monitored | Web Vitals RUM |

**Action**: Set up Lighthouse CI in the build pipeline to catch regressions before deploy.

---

## Indexing Plan

1. Submit sitemap to Google Search Console: `https://szlholdings.com/sitemap.xml`
2. Submit to Bing Webmaster Tools
3. Check for crawl errors weekly
4. Monitor coverage report for indexing issues
5. Set up `@szl-holdings/analytics` integration with Search Console for keyword performance
