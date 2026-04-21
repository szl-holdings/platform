# SZL Holdings — UI/UX Overhaul Decisions

**Audit date:** 2026-04-21
**Status:** AUTHORITATIVE — governs all design decisions for the enterprise repositioning task.
**Applies to:** SZL Holdings public shell (`artifacts/szl-holdings`), Command portal (`artifacts/command`), Lyte (`artifacts/lyte-command-center`), Vessels (`artifacts/vessels`), and token-level pass for all other artifacts.

---

## Problem Statement

The current public-facing surface presents as a multi-product, gaming/sci-fi aesthetic with the following credibility blockers:

1. **Dark gaming palette with neon accents** — `hsl(192,72%,48%)` cyan, multicolor step indicators (`#0ea5e9`, `#8b5cf6`, `#ec4899`, `#f59e0b`, `#6366f1`, `#14b8a6`, `#ef4444`, `#f97316`), decorative chrome borders, sci-fi grid textures.
2. **Over-complex navigation** — 7 top-level nav items (Platform, Primitives, Domain Packs, Trust, Proof, Company, Resources), each with 5–12 dropdown entries. Enterprise buyers cannot find their way.
3. **Contradictory information architecture** — hero claims "governed infrastructure" but the nine-step animated loop with neon colors reads like a product demo, not an enterprise platform.
4. **Unsupported counts on public surfaces** — "700+ Database tables", "40+ Shared packages", "13 Active surfaces" — all contradicted by the audit.
5. **Copy tone** — marketing-speak, feature-dense, not buyer-oriented.

---

## Design Decisions

### D-01: Institutional design language

**Decision:** Replace gaming/neon palette with restrained institutional design language on all public-facing surfaces.

**Rationale:** Enterprise buyers (CFOs, CISOs, fleet executives, compliance officers) evaluate platforms by how they signal competence and stability. Neon colors, sci-fi borders, and gaming gradients signal the opposite.

**Implementation:**
- Remove all inline hardcoded neon hex values from public-facing landing pages.
- Use only the institutional token set from `packages/design-system/src/tokens/index.ts`: `--gi-bg-base`, `--gi-bg-surface`, `--gi-accent-blue`, `--gi-accent-amber`, `--gi-text-primary`, `--gi-text-secondary`, `--gi-text-muted`, `--gi-border-subtle`, `--gi-border-default`.
- The dark background (`--gi-bg-base: #060b12`) is retained — it is institutional, not gaming, when combined with a restrained accent family.
- Remove grid texture overlays from hero sections.
- Remove multi-color step indicators. Use a single accent color (blue) for numbered steps.
- Remove glowing border and box-shadow decorations from cards.

**Status:** EXECUTED in Task #2849 — `artifacts/szl-holdings/src/pages/landing.tsx` rebuilt.

---

### D-02: Navigation collapse to 6 institutional items

**Decision:** Top navigation collapses from 7 items to 6: **Platform / Solutions / Trust / Architecture / Company / Contact**.

**Rationale:** Enterprise buyers evaluate menus as a signal of platform coherence. 7 top-level items with overlapping submenus (Primitives, Proof, Resources all duplicating Architecture content) is confusing and childish. 6 clean items with clear domains is the enterprise standard.

**Item mapping:**
- `Platform` — Overview, Alloy, Lyte, Command Portal, How It Works
- `Solutions` — Overview, Vessels (primary), Aegis, Terra, PRISM Counsel, Carlota Jo
- `Trust` — Trust Center, Security, AI Governance, Executive Brief, Technical Brief, Investor Brief
- `Architecture` — Overview, Proof Chain, Outcome Graph, Covenant Policy, Simulation, Technical Proof
- `Company` — About, Founder, Investor Relations, Design Partners, Doctrine, Insights
- `Contact` — Direct link (no dropdown)

**Items removed from top-level nav:**
- `Primitives` → merged into Architecture
- `Domain Packs` → merged into Solutions
- `Proof` → merged into Architecture (Technical Proof, Changelog)
- `Resources` → merged into Company (Insights) and Architecture (Documentation)
- `Request Demo` as standalone CTA → moved to header action button

**Status:** EXECUTED in Task #2849 — `artifacts/szl-holdings/src/components/SiteNav.tsx` rebuilt.

---

### D-03: Homepage information architecture

**Decision:** Rebuild homepage with the following sequence: hero → proof strip → core platform → primary wedge → secondary wedge → trust → ROI → CTA.

**Rationale:** The buyer journey for enterprise software follows a specific cognitive path:
1. **What is this and why should I care?** (hero)
2. **Is this real?** (proof strip — verified numbers)
3. **What is the actual product?** (core platform)
4. **What does it do in my industry?** (primary wedge, secondary wedge)
5. **Can I trust it?** (trust)
6. **What do I get out of it?** (ROI)
7. **What do I do next?** (CTA)

The previous homepage led with an animated 9-step loop (too complex for a first impression) and buried the actual value proposition.

**Copy rules enforced:**
- No "revolutionary," "sentient," "world-changing," "unprecedented," or equivalent superlatives.
- No unverified counts. All numbers on the proof strip are sourced from `audit/00-executive-summary.md`.
- One primary CTA per page (Request Demo). One secondary CTA (Design Partners or See Platform).
- Hero H1: ≤ 12 words, buyer-oriented, plain English.
- All body copy: plain English, ≤ 55 characters per line width.

**Status:** EXECUTED in Task #2849 — `artifacts/szl-holdings/src/pages/landing.tsx` rebuilt.

---

### D-04: Shared design primitive standards

**Decision:** Shared primitives across primary artifacts must use the institutional token set. No one-off color values in component files.

**Standard primitives in scope:**
- Button: primary (blue solid), secondary (transparent border), text (no border)
- Card: `--gi-bg-surface` background, `--gi-border-subtle` border, no glow/shadow decorations
- Section labels: `0.6875rem` mono, uppercase, letter-spaced, `--gi-text-muted`
- Headings: Space Grotesk/DM Sans, `letter-spacing: -0.025em`, `line-height: 1.15`
- Body: Inter, `line-height: 1.6`, `--gi-text-secondary`
- Status badges: standard vocabulary from `docs/design/design-system-tokens.md`

**Status:** PARTIALLY EXECUTED — landing page and nav use tokens. Full primitive component normalization across Command and Lyte is deferred to a follow-on task.

---

### D-05: Proof strip number discipline

**Decision:** Every number on any public surface must be sourced from `audit/00-executive-summary.md` canonical resolutions or have a direct `grep` command that reproduces it.

**Verified numbers for public use:**
| Number | Claim | Verification |
|--------|-------|-------------|
| 915 | Database table definitions | `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` |
| 122 | Total packages | 81 package dirs + 41 lib dirs |
| 382 | API route files | `find artifacts/api-server/src/routes -name "*.ts" \| wc -l` |
| 165 | Schema files | `find lib/db/src/schema -name "*.ts" \| wc -l` |

**Numbers removed from public surfaces:**
- "700+ Database tables" — actual is 915; replaced with "915"
- "40+ Shared packages" — actual is 122; replaced with "122"
- "13 Active surfaces" — no workflow is running; removed
- "116 schema files" — actual is 165; replaced with "165"

---

### D-06: Demo/seeded data disclosure

**Decision:** Any data shown in investor or buyer demos that is seeded or simulated must be labeled as such. Labels must be visible and honest.

**Standard disclosure language:**
- For seeded operational data: "Seeded demonstration data."
- For simulated external data: "AIS is simulated. Sanctions data is seeded for demonstration."
- For public API data: Name the source explicitly (e.g., "NOAA public data").

**Status:** EXECUTED — landing page includes explicit disclosure on the approval queue mock and Vessels section.

---

## Out of Scope for This Task

- Full component library rebuild (Button, Input, Select, Table, Modal) — deferred to a follow-on task.
- Light mode support — the institutional dark palette is sufficient for enterprise demo contexts; light mode is a follow-on.
- Command and Lyte shell normalization beyond token-level pass — deferred to a follow-on task.
- Screenshot regeneration — handled in the proof/trust task.

---

*This document is the authoritative UI/UX decision record for Task #2849. Do not change design decisions without updating this file.*
