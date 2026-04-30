# Category Site Pass — Flagship Site Elevation Record

**Status**: Phase C complete (April 2026)
**Scope**: `artifacts/szl-holdings` — public flagship site
**Owner**: Stephen Lutar, Founder & CEO
**Pairs with**: `one-sentence-category-statement.md`, `message-architecture.md`, `no-commodity-ai-language.md`, `buyer-journey-by-persona.md`, `public-architecture-story.md`

---

## 1. Purpose

This document records the category-positioning pass made on the public flagship site during Phase C. It exists so that future edits, agents, and reviewers do not unintentionally regress the site back into a "premium product site" or generic AI-platform posture.

The site is no longer marketing a product. It is asserting a **category**.

The category is **Governed Decision Infrastructure** — *"the structural layer between signal detection and action execution, where governance, attribution, and outcome tracking live on every decision that matters."*

Everything on the site exists to make that category clear, to qualify the buyer, and to route them to the right next step.

## 2. The category, as stated on the site

One sentence (homepage hero subhead, repeated across `index.html` metadata, OG, and Twitter cards):

> **Governed decision infrastructure for enterprise operations. Not a dashboard. Not an AI copilot. The structural layer between signal detection and action execution — with governance, attribution, and outcome tracking on every decision that matters.**

The canonical loop, displayed beneath the hero in monospace as a category signature:

> Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning

The platform hierarchy is read in one glance:

> **Lyte** (flagship command) → **Continuum** (execution fabric) → **CORTEX** (mobile command) → **Domain Packs** (Aegis · Vessels · Terra · Counsel · Carlota Jo · IMPERIUM)

## 3. What changed in this pass

### 3.1 Metadata and SEO
- `index.html` `<title>` rewritten to lead with category, not feature: *"Governed Decision Infrastructure for Enterprise Operations"*
- `<meta name="description">` and `<meta name="keywords">` re-anchored on category language and the 9-step loop
- Open Graph and Twitter Card titles unified on *"Governed Decision Infrastructure"*
- Organization JSON-LD `description` field rewritten to assert the category and list the platform hierarchy explicitly

### 3.2 Language sweep
- All non-negation usages of "AI platform," "AI-driven," "AI-powered," and "AI copilot" reviewed across the in-scope public pages
- Surviving usages on the public site are exclusively in **negation context** — i.e., "no generic 'AI platform' positioning" — and are intentional. They are positioning posture, not category language
- `milestones.json` founding entry rewritten so the company's stated thesis at incorporation matches the current category
- `leadership.tsx` rewritten to use *"governed decision infrastructure"* and *"model-assisted reasoning"* in the founder bio and Aegis outcome line

### 3.3 Design Partner page (the most important conversion surface)
- Hero rewritten to lead with the full Signal → Recommendation → Policy → Execution → Proof loop, not generic pilot language
- Added **five concrete qualification criteria** (named workflow, named operator, system access, baseline commitment, expansion thesis) — the bar is structural, not commercial
- Added **persona shortcut row** at the bottom of the page (executive sponsor, technical evaluator, security reviewer, investor) so any reviewer landing on this page can route themselves to the surface that fits their role

### 3.4 Five-persona entry on the homepage
- The "Where do you start?" row already on the homepage is the canonical persona-routing surface. It covers the five personas explicitly: **executive buyer, technical evaluator, security reviewer, design partner, investor.**
- Each card has a one-line value statement and routes to a deep page for that persona. This is the structural answer to *"who is this site for?"*

## 4. Truth-pass discipline

This site does not claim things that are not architecturally true.

- The site does not say "non-bypassable" or "architecturally impossible." It says *"enforced at [layer] through [mechanism]; bypass requires explicit, attributed override record."*
- Domain packs are listed with their **Beta** status visible in the navigation. We do not claim production maturity we have not earned.
- Logos and case studies are scoped to design-partner participants (named where consent exists; sector-only where not). No fabricated logos.
- "AI" appears on the site only where there is real, governed, model-assisted reasoning behind it — and never as the category itself. The category is the **infrastructure that governs AI-assisted decisions**, not the AI.

## 5. What this site is not optimized for

- **It is not optimized for self-serve buyers.** Every meaningful CTA routes to the founder, a demo, or a design-partner conversation. There is no signup flow, no free trial, no automated onboarding.
- **It is not optimized for breadth.** The persona row deliberately offers five paths, not fifty. Domain packs are six, not sixty.
- **It is not optimized for category-curious skim readers.** The hero, the loop signature, the platform hierarchy, and the persona row are all designed to make a serious reviewer slow down.

## 6. What is intentionally still visible-but-secondary

- Trust Center is one click from any page in the nav, surfaced on the homepage trust strip, and linked from the Design Partner page persona row.
- Investor Relations is in the nav, in the persona row, and linked from the Design Partner page.
- Domain pack pages are in the nav under Domain Packs and on the homepage. They support the category, they do not lead it.
- Documentation and Architecture surfaces are linked from the persona row (technical evaluator).

## 7. Out of scope for this pass

- Operator command center surfaces (`/forge`, `/continuum/*`) — these belong to Phase D, not Phase C
- Any new product features or domain packs
- Pricing page logic — handled by the commercial engine task (#796)
- Other artifacts (`aegis`, `vessels`, `terra`, `carlota-jo`, `command`, `szl-holdings-mobile`) — each has its own elevation queue
- Internal/admin pages, fund/venture-intel pages, distribution-os pages — not part of the public conversion surface

## 8. Maintenance rules going forward

1. **Hero discipline.** The hero subhead, the loop signature, and the platform hierarchy are the category statement. Do not soften them. Do not replace them with feature copy.
2. **No commodity AI language.** See `no-commodity-ai-language.md`. Negation usage is the only allowed appearance of "AI platform" on the public site.
3. **Persona row is canonical.** If a sixth persona ever appears, the row needs structural revision — do not silently overflow it.
4. **Truth-pass discipline.** Any new claim added to this site must be supported by either shipped architecture or named design-partner evidence. If it is neither, it does not go on the public surface — it goes into `ops/leadership/` or `ops/commercial/` until it is.
5. **Buyer journey is documented.** See `buyer-journey-by-persona.md`. Any new public page must declare which persona it serves and what step of the journey it occupies.
