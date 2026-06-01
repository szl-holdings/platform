# KANCHAY — Logo Suite & Rationale

**License:** CC BY 4.0 (brand assets). **Attribution:** ORCID 0009-0001-0110-4173.
**Files:** `LOGO_SUITE.svg` (4-lockup sheet), `kanchay-glyph.svg` (square mark),
`kanchay-favicon.svg`, `favicon.ico`, `ALTERNATES.svg`, PNG renders in `../renders/`.

## The glyph

A stylized **khipu knot intertwined with a Greek lambda (Λ)**. Two strokes meet at an apex
and descend as the legs of a lambda; the right leg doubles as a **khipu primary cord** carrying
**three pendant knots**. A white ring at the apex shows the cord **wrapping** the lambda vertex —
the literal "intertwine." Both elements are core doctrine, not decoration:

- **Λ (lambda)** = the Λ-SPINE aggregator backbone (SF-07), the weighted geometric mean that
  produces the single trust scalar. Greek letter, not mystical.
- **khipu** = the receipt DAG / Merkle accumulator (SF-06); the three knots stand for the
  **sum-of-sums invariant** (primary-cord value = Σ pendant = ΣΣ sub-pendant), the algebraic
  source of INV-3 ([Urton, *Signs of the Inka Khipu*, UT Press 2003](https://utpress.utexas.edu/9780292785403/)).

Read together: *the spine aggregates (Λ); the cord records (khipu).* That is the entire SZL
thesis in one mark — aggregate trust, and prove its provenance.

## Color usage

| Element | Token | Hex |
|---|---|---|
| Left leg (Λ) | `hatun` gold gradient | `#e4cf99 → #c08f2f` |
| Right leg (khipu cord) | `yuyay` teal gradient | `#5cc4bf → #168f89` |
| Knots | `yawar` red | `#c0392b` |
| Apex ring / monochrome ink | `gray-50` | `#f5f7fa` |
| Backdrop | `gray-950` navy | `#0a0f1e` |

## The four lockups (`LOGO_SUITE.svg`)

1. **Primary** — stacked glyph + `KANCHAY` wordmark + descriptor. Full color on navy.
2. **Monochrome** — single-ink (`currentColor`) version for one-color print, embossing, dark/light
   inversion. Uses the `kanchay-glyph-mono` symbol.
3. **Favicon** — rounded-square containment of the glyph; rendered to `.ico` (16/32/64) and PNG.
4. **Horizontal lockup** — glyph left, wordmark + rule + tagline right; for headers/nav bars.

## PNG renders (`../renders/`)

`kanchay-{16,32,64,128,256,512,1024}.png` (square mark), `favicon-{16,32,64}.png`,
`LOGO_SUITE_preview.png`, `ALTERNATES_preview.png`. Rendered with `rsvg-convert` from the
canonical SVGs (source of truth). The mark remains legible at 16px (verified — knots collapse
to a dotted cord but the Λ reads).

## Three alternates (`ALTERNATES.svg`)

| Alt | Concept | Best use |
|---|---|---|
| **A · folded cord** | one continuous curved cord folded into a Λ, single apex knot | soft/organic contexts, app splash |
| **B · radial DAG** | central node with three radial cords + ring (the receipt DAG fanning out) | technical diagrams, "node" contexts |
| **C · monoline** | thin Λ with a dotted (dashed) knot cord | small sizes, embossing, watermarks, single-color stamps |

## Clear space & minimum size

- **Clear space:** ≥ one knot-diameter on all sides of the glyph.
- **Minimum size:** glyph 16px; wordmark lockup 120px wide. Below 24px prefer favicon variant.
- **Do not:** recolor knots to non-`yawar`, stretch the Λ angle, add the banned `Mythos` framing,
  or place full-color glyph on a light background without switching to monochrome.

— Yachay, 2026-06-01. Glyph derives from doctrine primitives (Λ-SPINE SF-07, KHIPU SF-06); no mystical content.
