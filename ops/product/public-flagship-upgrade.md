# Public Flagship Web Upgrade — Phase 6

**Status:** Complete  
**Date:** April 2026  
**Scope:** `artifacts/szl-holdings/` — public-facing marketing and product site

---

## What was done

### 1. Hero redesign — company → platform → product hierarchy

The previous hero ("Business observability with explainable execution") over-indexed on Lyte and failed to communicate the platform company story. The new hero:

- Positions SZL Holdings at the company level with the correct tagline: "Governed Operational Intelligence"
- Communicates the platform architecture (Alloy → Lyte → Domain Packs) as a visual inline hierarchy
- Uses the tagline from BRAND_GUIDELINES.md as the primary position signal
- Hero headline: "The governed decision layer for enterprise operations."

### 2. Trust strip added near the top of the experience

A persistent trust strip appears directly below the hero, surfacing:
- Human-in-the-loop enforcement
- TLS 1.3 / AES-256 at rest
- Immutable Proof Chain audit trail
- 11-role RBAC / org-scoped tenant isolation
- Link to full Trust Center

### 3. Platform architecture section

New three-tier architecture section:
- **Command Surfaces** (Lyte, CORTEX, Command Portal)
- **Execution Fabric** (Alloy, Outcome Graph, Proof Chain)
- **Domain Packs** (Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo)

Each tier shows its products as tagged chips with one-line descriptions.

### 4. Proof / evidence section

New section replacing vague "AI marketing" copy with real numbers:
- 685 database tables across 112 schema files
- 51 shared packages
- 15 active artifacts
- 11-role RBAC
- 9 AI decision types
- 5 platform primitives

Framed explicitly as "design-partner stage" to set honest expectations.

### 5. Domain packs section upgraded

Full domain pack grid with:
- Icon, domain category, and description per pack
- Capability chips per pack
- Hover states linked to individual solution pages
- Clear statement that domain packs share the same governance infrastructure

### 6. Trust / governance section

Dedicated section linking to Trust Center and AI governance model, with four trust primitives explained in plain language.

### 7. Company section narrative

Separated company story from product story. Explicit: "A platform company, not a portfolio of products."

Transparent statements:
- Design-partner stage
- SOC 2 Type II targeted post-funding
- No fake traction or fabricated logos

### 8. CTA architecture — three engagement paths

Old: single "Request a demo" CTA  
New: three clear paths at the bottom — Request a Demo, Design Partner Inquiry, Enterprise Diligence

### 9. SEO / metadata

Updated:
- Title: "SZL Holdings — Governed Operational Intelligence"
- Description aligned with SEO_MAP.md
- OG title, description, image path updated
- Twitter card updated
- JSON-LD foundingDate corrected (2021 → 2025)
- JSON-LD description updated to reflect governed intelligence framing

### 10. robots.txt

Created at `artifacts/szl-holdings/public/robots.txt` matching SEO_MAP.md specification.

### 11. Accessibility

- `aria-label` on all major sections
- `aria-label` on interactive links
- `aria-hidden="true"` on all decorative icons
- Existing skip-to-content link preserved in index.html
- `focus-visible` outline styles preserved

### 12. Motion

- All animations use `whileInView` with `viewport={{ once: true }}` — no infinite loops
- Staggered entry animations capped at 0.07s delay increments
- `prefers-reduced-motion` support preserved in index.html critical CSS

---

## What was not changed

- Backend API routes (out of scope per task)
- Operator surface pages (separate task)
- Analytics implementation (separate task)
- Other artifact UX changes

---

## Files modified

- `artifacts/szl-holdings/src/pages/landing.tsx` — full overhaul
- `artifacts/szl-holdings/index.html` — title, description, OG, Twitter, JSON-LD
- `artifacts/szl-holdings/public/robots.txt` — created

## Files created

- `ops/product/public-flagship-upgrade.md` (this file)
- `ops/product/copy-system.md`
- `ops/product/page-priorities.md`
- `ops/product/design-system-hardening.md`
