# SZL Holdings — Content Engine Scorecard

## Infrastructure Status

| Component | Status | Score | Notes |
|-----------|--------|-------|-------|
| **Distribution OS Database** | ✅ Live | 9/10 | 22 dos_* tables — articles, newsletters, carousels, X posts, campaigns, leads, analytics |
| **Distribution OS API** | ✅ Live | 8/10 | Full CRUD at /api/distribution-os/*, auth-protected write routes |
| **Admin Dashboard** | ✅ Live | 8/10 | 11 sub-pages: articles CMS, newsletters, carousel lab, X studio, leads, campaigns, calendar, analytics, automations, settings |
| **Public Pages** | ✅ Live | 8/10 | /link-in-bio (Linktree), /newsletter (subscription landing) |
| **Seed Data** | ✅ Loaded | 7/10 | 6 pillars, 12 articles, 4 newsletters, 12 calendar items, 10 linktree links, 3 campaigns |
| **Social Profiles** | ✅ Connected | 8/10 | X (@szlholdings), Medium (@stephen_38454), Substack (szlholdings.substack.com), Linktree (linktr.ee/szlholdings) |
| **AI Carousels** | ✅ Connected | 7/10 | Integration marked connected, carousel generation templates exist |
| **PDF Generation** | ⚠️ Templates Only | 5/10 | social-content/generate-*.js scripts exist, need operationalization |
| **Banner Generation** | ⚠️ Templates Only | 5/10 | generate-banners.js exists, 15+ banners already created |
| **Direct Publish Connectors** | ❌ Not Built | 2/10 | No live X/Medium/LinkedIn/Substack API publish flow |
| **Approval Queue** | ❌ Not Built | 2/10 | Schema supports it, UI not built |
| **Analytics Pull** | ❌ Not Built | 2/10 | Page view tracking exists, no platform analytics pull |

## Content Assets Inventory

| Asset Type | Count | Location |
|------------|-------|----------|
| PDF Carousels | 6 | social-content/pdf-guides/ |
| Banners (LinkedIn/X/YouTube/IG) | 15+ | social-content/banners/ |
| Logos | 2 (Lyte) | social-content/logos/ |
| Screenshots | 16 | social-content/screenshots/ |
| Profile Kit PDF | 1 | social-content/pdf-guides/social-media-profile-kit.pdf |
| Marketing Playbook PDF | 1 | social-content/pdf-guides/szl-marketing-playbook.pdf |
| Content Calendar | 1 | social-content/content-calendar.md |
| Hackajob Profile | 1 | social-content/hackajob-profile.md |

## Publishing State Machine Coverage

| State | Implemented | Notes |
|-------|------------|-------|
| draft | ✅ | Default for new articles |
| in-review | ✅ | Status enum in DB and admin UI |
| approved | ✅ | Status enum in DB and admin UI |
| published | ✅ | Status enum in DB and admin UI |
| archived | ✅ | Status enum in DB and admin UI |
| scheduled | ❌ | Not in current enum — needed for automation |
| failed | ❌ | Not in current enum — needed for publish error handling |
| retry-needed | ❌ | Not in current enum — needed for publish error handling |

## Profile Readiness

| Platform | Handle/URL | Status | Bio | Avatar | Banner | Pinned Links |
|----------|-----------|--------|-----|--------|--------|-------------|
| X | @szlholdings | ✅ Connected | Needs update | Needs branded avatar | Needs branded banner | Needs strategy |
| Medium | @stephen_38454 | ✅ Connected | Needs update | Needs branded avatar | Needs branded banner | N/A |
| Substack | szlholdings.substack.com | ✅ Connected | Needs update | Needs branded avatar | Needs branded banner | N/A |
| Linktree | linktr.ee/szlholdings | ✅ Connected | Needs update | Needs branded avatar | Needs branded banner | ✅ In-app linktree |
| LinkedIn | Not connected | ❌ Missing | — | — | — | — |

## Overall Content Engine Score: **6/10**
- Infrastructure solid (DB, API, admin panel)
- Content assets exist but need operationalization
- Direct publish connectors not built
- Day-one launch content needs generation
- 30/90/180 day cadence needs planning
