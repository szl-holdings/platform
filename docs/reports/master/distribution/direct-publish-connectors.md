# SZL Holdings — Direct Publish Connectors

## Connector Status Matrix

| Platform | Direct Publish | Export/Copy | Approval Queue | Status |
|----------|---------------|-------------|----------------|--------|
| Owned Site | ✅ Built | N/A | N/A | Live — publish via admin panel |
| X | ❌ Not built | ✅ Copy from admin | ❌ Not built | Blocked by OAuth credentials |
| Medium | ❌ Not built | ✅ Copy from admin | ❌ Not built | Blocked by integration token |
| Substack | ❌ Not built | ✅ Copy from admin | ❌ Not built | No public API |
| LinkedIn | ❌ Not built | ✅ Copy from admin | ❌ Not built | Blocked by OAuth credentials |
| Linktree | ❌ Not built | ✅ In-app linktree | ❌ Not built | Manual sync |

## X Connector (When Credentials Available)

| Feature | Priority | Status |
|---------|----------|--------|
| Auth/token handling (OAuth 2.0) | P0 | Not started |
| Publish single post | P0 | Not started |
| Publish thread (multi-post) | P0 | Not started |
| Attach media | P1 | Not started |
| Capture permalink | P0 | Not started |
| Retry and failure handling | P1 | Not started |
| Analytics pull | P2 | Not started |

## Medium Connector (When Token Available)

| Feature | Priority | Status |
|---------|----------|--------|
| Auth/token handling | P0 | Not started |
| Create profile post | P0 | Not started |
| Draft/public/unlisted modes | P1 | Not started |
| Canonical URL support | P0 | Not started |
| Tags | P1 | Not started |
| Response capture (published URL) | P0 | Not started |

## Current Workaround: Export & Copy

For all platforms without direct API access:
1. Write content in Distribution OS admin panel
2. Copy formatted content from admin UI
3. Manually paste into platform
4. Record published URL back in dos_publication_urls
5. Track in dos_distribution_runs

## Integration Architecture (Future)

```
dos_articles (canonical)
    ↓
Distribution OS Admin Panel
    ↓
[Publish Button per platform]
    ↓
Platform Connector (X API, Medium API, etc.)
    ↓
dos_distribution_runs (status: pending → completed/failed)
    ↓
dos_publication_urls (permalink captured)
```
