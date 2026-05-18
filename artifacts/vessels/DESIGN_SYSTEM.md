# Vessels — Design System (v1, locked)

This document is the single source of truth for the visual language of the
Vessels artifact. It is the foundation deliverable for project task #5181.

## Thesis

Vessels operates a high-density operational surface (122 pages, 4 formula
families, real-time AIS, anomaly persistence). The design language has to
read as **calm, expert, and auditable** — not as a marketing skin.

We anchor on three real-world references and evolve past them.

### Reference 1 — anomaly.com

What we take:
- Restraint in color. Heavy use of off-white / paper grounds and a single
  accent reserved for state changes (not decoration).
- Typographic confidence. Display weight reserved for one thing per page;
  body copy carries the work.
- Empty space treated as a deliberate compositional element.

What we evolve past:
- Anomaly's chart treatment is sparse to the point of absence. Vessels
  needs charts on first paint because numerics are the product. We keep
  the calm grounds but add a rigorous chart system with weighted ink.

### Reference 2 — anthropic.com

What we take:
- Editorial seriousness. Long-form content blocks, generous measure, the
  willingness to let a single number or sentence carry a page.
- The "claude" warm neutral palette: cream, sand, terracotta accent.
  Aligns naturally with the warm-gold direction from #5096.
- Documentation density without visual noise — code blocks, callouts, and
  numbered steps treated as first-class typographic citizens.

What we evolve past:
- Anthropic's pages are read-only essays. Vessels pages are operator
  surfaces that emit receipts. We borrow the editorial calm but add the
  "show the math" affordance and the receipt-trail footer as a recurring
  page primitive.

### Reference 3 — A11oy (our own artifact)

What we take:
- The orchestration backbone visual: workcell cards, governance-class
  badges (observation / recommendation / autonomous), the cross-product
  handoff banner.
- The proof-ledger row primitive — a single horizontal record with hash,
  timestamp, actor, action — reused as the Vessels receipt footer.
- The accent token `#c9b787` (the warm gold already locked in by #5096
  and registered in `src/main.tsx`).

What we evolve past:
- A11oy is platform-wide and generic. Vessels is domain-specific (vessels,
  voyages, ports, sanctions, bunkers). We extend the A11oy primitives with
  a maritime semantic layer: vessel-state color, port-state-control badge,
  AIS-dark indicator, sanctions-hit badge.

## Tokens

All tokens are CSS custom properties scoped under `:root` in
`artifacts/vessels/src/index.css`. Component implementations consume
them via `tailwind.config` aliases and the shared CSS-var bindings.

### Color

```
--vessels-ground-paper:        #f7f4ee   /* page background */
--vessels-ground-card:         #fdfbf6   /* card surface */
--vessels-ink-primary:         #1a1612   /* body & headings */
--vessels-ink-secondary:       #6b6358   /* metadata, captions */
--vessels-ink-tertiary:        #a8a092   /* axis labels, gridline copy */

--vessels-gold:                #c9b787   /* primary accent (locked) */
--vessels-gold-strong:         #a8956a   /* hover, focused */
--vessels-gold-wash:           #f4ecd8   /* selected row, active chip */

--vessels-state-ok:            #4a7c59   /* AIS live, compliant */
--vessels-state-warn:          #c08a3e   /* anomaly < 0.7, overdue soon */
--vessels-state-alert:         #b54a3a   /* anomaly >= 0.7, sanctions hit, AIS dark */
--vessels-state-info:          #4a6c8c   /* recommendation, advisory */

--vessels-rule-strong:         #d4ccba
--vessels-rule-faint:          #ece6d6
```

### Type

```
--vessels-font-sans:   "InterVariable", system-ui, sans-serif
--vessels-font-serif:  "Source Serif 4", Georgia, serif    /* display & long-form */
--vessels-font-mono:   "JetBrains Mono", "SF Mono", monospace  /* numerics, hashes, AIS, IMO */
```

Scale (rem):
```
display     2.5     weight 400 (serif)
h1          1.875   weight 500
h2          1.375   weight 500
h3          1.125   weight 500
body        0.9375  weight 400
caption     0.8125  weight 400
mono-num    0.9375  weight 500 (tabular-nums)
```

**Rule:** every number that an operator reads — risk score, lat/lng,
IMO, MMSI, dollar amount, percentage — renders in `--vessels-font-mono`
with `font-variant-numeric: tabular-nums`. Non-negotiable.

### Spacing & rhythm

8-pt grid. Page gutters: 32 / 48 / 64 (sm/md/lg). Vertical rhythm between
sections: 48. Card padding: 24. Inline form gap: 12.

### Motion

- Page enter: 200ms ease-out fade + 4px upward translate. Once.
- Number tick: 400ms ease-in-out interpolation when a live value updates.
- Chart redraw on poll: 600ms ease-in-out; never blink.
- Receipt-emit confirmation: pulse the gold-wash on the affected row for
  800ms, then settle.

## Components

Source of truth: `artifacts/vessels/src/components/design-system/`.

| Component | Purpose | Props of note |
|---|---|---|
| `PageShell` | Standard page frame (header, breadcrumb, slot, receipt footer) | `title`, `subtitle`, `vesselContext?` |
| `KpiTile` | Single large number + label + delta | `value`, `unit`, `delta`, `formulaRef?` |
| `ChartFrame` | Wrapper applying the chart token system around any chart child | `title`, `contractRef`, `lastUpdated` |
| `ShowTheMath` | Inline expandable affordance for any formula-driven number | `formula`, `inputs`, `output`, `receiptId` |
| `ReceiptFooter` | Page footer listing receipts emitted by this page session | `source: PageSlug` |
| `GovernanceBadge` | Observation / Recommendation / Autonomous | `class` |
| `MaritimeBadge` | AIS-live, AIS-dark, sanctions-hit, PSC-detained, overdue | `kind`, `since?` |
| `A11oyHandoffButton` | Open a workcell in A11oy with this page's context | `template`, `payload` |

## Page templates

Three locked templates. Every page in `src/pages/` belongs to one.

1. **OperatorDetail** — fleet/vessel/voyage detail. Header KPI strip
   (3-5 `KpiTile`), 2-column body (charts left, evidence right), receipt
   footer. Used by `vessel-detail-enhanced`, `voyage-desk`,
   `risk-scoring`, `bunkering`.
2. **OperatorList** — sortable table with inline sparklines and a left-rail
   filter. Used by `vessels-list`, `exception-queue`, `alert-center`,
   `sanctions-screening`.
3. **MapConsole** — full-bleed map with right-rail context panel and a
   collapsible bottom drawer. Used by `fleet-map`, `ais-live-tracking`,
   `route-anomaly-engine`, `dark-vessel-detection`.

Marketing pages (`marketing-*`, `vessels-landing`, `vessels-home`) use a
fourth template, `Editorial`, that follows the anthropic.com reference
more directly. Marketing pages are exempt from the "chart on first paint"
rule and instead carry one live KPI strip pulled from the same backend
the operator surface uses.

## What "locked" means

Tokens are versioned. A change to any value in this file requires a PR
that updates this document AND `artifacts/vessels/src/styles/tokens.ts`
in the same commit. The doctrine-v6 scanner enforces no inline hex
colors or off-token type sizes in `src/pages/`.

## Open work tracked elsewhere

- Per-page chart wiring → see `CHART_AUDIT.md`.
- Investor demo walkthrough → see `VESSELS_INVESTOR_SCRIPT.md`.
- Formula elevation to `@szl-holdings/formulas` and the `ShowTheMath`
  component implementation → step 5 of #5181.
- Doctrine scanner rule for inline hex / off-token sizes → step 6 of #5181.
