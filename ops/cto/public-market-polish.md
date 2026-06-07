# Public Market Polish — CTO Pass Phase A

**Status:** Complete  
**Date:** April 16, 2026  
**Artifact:** `artifacts/szl-holdings` → `szlholdings.com`

---

## What Was Done

### 1. Homepage Hero (landing.tsx)
- Headline kept: "Business observability with explainable execution." — specific, not commodity.
- Sub-headline retained and tightened: names Lyte and Alloy explicitly, anchors the value loop.
- Hero CTA array cleaned up:
  - **Primary:** Request a demo (`/demo`) — highest-conversion action
  - **Secondary:** Explore the platform (`/platform`) — evaluator path
  - **Tertiary:** Become a design partner (`/design-partner`) — replaces "Platform Pulse" which was internal tooling, not a marketing CTA
- No vague AI language ("AI-powered", "intelligent", "smart") in the hero.

### 2. Navigation Restructure (SiteNav.tsx)
**Before:** Nexus (highlighted primary), Platform, Lyte, Trust, Docs, Resources, Company, Fund Intel, Demo  
**After:** Platform, Domain Packs, Trust, Company, Resources, Demo (primary CTA)

- Removed **Nexus** as a highlighted nav item — it's an authenticated internal command center, not a public marketing page.
- Removed **Fund Intel** from public nav — it's an authenticated tool, not a public entry point.
- Removed standalone **Lyte** top-level link — now lives inside Platform dropdown with context note "Operator command layer."
- Added **Domain Packs** as a top-level dropdown with all governed extensions listed and context notes.
- **Trust** dropdown now includes Proof Chain link — surfacing a key diligence signal.
- **Company** dropdown now includes Design Partners and Investor Relations as named items.
- **Resources** dropdown rationalised: Insights, Docs, FAQ, ROI Calculator, Roadmap, Case Studies.
- **Demo** remains the primary CTA button (highlighted).
- Dropdown items now include context notes in mono font (e.g., "Operator command layer", "Governed extensions", "Series A path") to aid first-touch navigation.
- Mobile menu rebuilt with the same audience-aware priority ordering.

### 3. Audience Paths Section (new section, landing.tsx)
Added a compact "Where do you start?" section between the hero and the Lyte summary. Five audience tiles:
- **Executive buyer** → /platform
- **Technical evaluator** → /architecture
- **Security reviewer** → /trust
- **Design partner** → /design-partner
- **Investor** → /investor

Each tile has a distinct accent color, icon, label, and one-line description. Tiles animate on scroll (fadeUp). Mobile: 2-col grid. Desktop: 5-col row.

### 4. Domain Pack Framing (landing.tsx)
- Section label changed: "Expansion lanes" → "Domain packs — governed extensions"
- Section headline changed: "The architecture generalizes..." → "One backbone. Every high-consequence domain."
- Section body added: explicitly states each pack inherits Alloy's proof chain, policy controls, and audit architecture — not a separate product.
- Card status badges changed from "Design partner stage" → "Domain pack" — consistent terminology.
- Card descriptions updated to reinforce backbone inheritance ("Same proof chain, maritime layer", "Alloy backbone, legal domain layer").

### 5. Trust Center Discovery
- Trust is now a top-level nav item with prominent dropdown.
- Trust section on homepage has a "View the Trust Center" CTA with ChevronRight — already present, retained.
- Proof Chain link added to Trust dropdown.
- Trust Center listed prominently in Company dropdown under Investor Relations.

### 6. Metadata Polish (index.html)
- `maximum-scale=5` (was `1`) — restores pinch-zoom for accessibility.
- Added `focus-visible` CSS rule — keyboard focus always visible.
- Added `prefers-reduced-motion` CSS rule — accessibility improvement.
- Updated Organization schema.org: added `contactPoint`, improved `logo` to `ImageObject` with dimensions.
- Added all domain packs to `hasOfferCatalog` as `SoftwareApplication` entities with `operatingSystem`.
- All JSON-LD structured data remains valid.

### 7. Sitemap (sitemap.xml)
- Added `<lastmod>` dates to all URLs (2026-04-16).
- Added missing pages: `/architecture`, `/how-it-works`, `/company`, `/founder`, `/leadership`, `/operating-doctrine`, `/design-partner`, `/trust/ai`, `/docs/architecture`, `/docs/proof-chain`, `/docs/control-plane`, `/case-studies`, `/roi`, `/relief`, `/packages`, `/investor`, `/accessibility`.
- Removed `/stephen` (not a public route), `/ventures`, `/portfolio` (internal tools).
- Priorities re-calibrated: demo at 0.9, design-partner at 0.85, investor at 0.85.

### 8. robots.txt
- Added explicit `Disallow` rules for all authenticated/internal tools: `/forge`, `/nexus`, `/alloy/`, `/ops/`, `/nuro-forge/`, `/distribution-os/`, `/azure-tenant/`, `/control-tower`, `/nexus-explorer`, `/analyst-workspace`, `/oracle-briefing`, `/report-builder`, `/kpi-dashboard`, `/ai-cost-analytics`, `/tenant-health-scorecards`, `/unified-settings`, `/scim-provisioning`, `/powerbi-config`, `/venture-intel/`.
- Added `Crawl-delay: 10` recommendation.

---

## What Was Not Changed
- No new product pages or concept apps created.
- No changes to other artifacts (command, api-server, aegis, vessels, etc.).
- Product canon not reopened — Lyte, Alloy, and domain pack definitions are as specified.
- Page content (Lyte Summary, Alloy Summary, Operating Loop, Trust section, Architecture section, Company strip) retained without rewriting.
