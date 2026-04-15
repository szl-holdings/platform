# SEO Gap Report

Generated: 2026-04-15

## Current State

- `SEO_MAP.md` exists at root with planned metadata
- SZL Holdings is a React SPA (client-side rendering)
- No server-side rendering (SSR) or static site generation (SSG)
- Social cards may be incomplete

## Critical SEO Gaps

### 1. Client-Side Rendering
- React SPA renders content client-side
- Search engines may not fully index dynamic content
- **Recommendation**: Add `react-helmet-async` for meta tags (already may be present). For full SSR, consider migrating flagship marketing pages to a static build step.

### 2. Sitemap
- No `sitemap.xml` generation confirmed
- **Action**: Generate sitemap from route definitions, serve at `/sitemap.xml`

### 3. Robots.txt
- Status unknown
- **Action**: Create `robots.txt` allowing search engines, referencing sitemap

### 4. Meta Tags per Page
Each public page needs:
- `<title>` — unique, under 60 chars
- `<meta name="description">` — unique, 150-160 chars
- `<meta property="og:title">`
- `<meta property="og:description">`
- `<meta property="og:image">` — 1200x630 social card
- `<meta property="og:url">`
- `<meta name="twitter:card" content="summary_large_image">`
- Canonical URL

### 5. Structured Data
- No JSON-LD schema markup detected
- **Action**: Add Organization, WebSite, and SoftwareApplication schemas

## Priority Pages

| Page | Priority | Current Meta Status |
|------|----------|-------------------|
| Homepage (`/`) | P0 | Needs verification |
| Platform (`/platform`) | P0 | Needs verification |
| Trust Center (`/trust`) | P1 | Needs verification |
| Pricing/Packages (`/packages`) | P1 | Needs verification |
| Company (`/company`) | P1 | Needs verification |
| Docs (`/docs`) | P2 | Needs verification |
| Contact (`/contact`) | P2 | Needs verification |

## Quick Wins

1. Add `react-helmet-async` to all marketing pages
2. Generate `sitemap.xml` from route list
3. Add `robots.txt`
4. Add Organization JSON-LD to homepage
5. Create OG image template for social sharing
