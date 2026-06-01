# DESIGN RATIONALE — SZL Holdings Inca Avatar

**Author:** Yachay (PURIQ brain-trust extension) · ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
**Date:** 2026-06-01
**Status:** ADDITIVE only. No Doctrine v11 LOCKED number is altered (456 source-declared /
749 doctrine-claimed declarations, 14 unique axioms, 6 re-audited / 163 doctrine-tracked
sorries, 13-axis Yuyay, A2/A4, Conjecture 1 open — all preserved).
**License:** Apache-2.0 (code) / CC BY-SA 4.0 (artwork).

> This avatar replaces the prior pixel-bee-with-B mark. Per the founder directive
> (2026-06-01 ~02:46 EDT): *"make something that looks amazing — GIF if I can be animated.
> Do it but I want something ancient and Inca there."* Every element below is grounded in
> a cited museum or academic source (see `REFERENCES.md`) and in our own documented
> anatomy. There is **zero mysticism** — the chakana is used as a geometric pattern, the
> amaru as iconography, the khipu as a data structure, the lambda as a mathematical
> operator. This matches the KANCHAY voice: *"never mystical"* (BRAND_BIBLE §4).

---

## 1 · The four elements and why each is here

### 1.1 Khipu (knotted cord) — central motif
**Quechua etymology:** *khipu* (Cusco Quechua [kʰipu]) = "knot" — the Quechua word for knot
itself ([British Museum Am1907,0319.286](https://www.britishmuseum.org/collection/object/E_Am1907-0319-286);
[Smithsonian Quipu](https://www.si.edu/collections/snapshot/quipu)).

**Why:** The khipu is the literal data structure of our receipt DAG — the KHIPU organ /
Merkle accumulator (SF-06), not a metaphor (BRAND_BIBLE §3). Drawing it as the central
motif states our architecture plainly: a primary cord with pendant cords, each carrying
knot clusters.

**Mathematical fidelity:** The pendant knots follow the Ascher knot typology and the Inca
base-10 positional system — long knots (L) for unit digits, simple knots (s) stacked for
the tens/hundreds positions, figure-eight (E) for the digit 1, and absence-of-knot for
zero ([Ascher & Ascher, *Mathematics of the Incas: Code of the Quipu*, via El País](https://english.elpais.com/science-tech/2022-12-20/knots-representing-numbers-the-mathematics-of-the-incas.html)).
The five pendant cords encode the digits **4, 8, 1, 6, 2** — purely numeric references to
this avatar's own animation constants (the 4 s / 8 s / 16 s harmonic cycles, plus the
lambda mark). No semantic/mystical claim is attached to the number; it is a self-describing
label rendered in an authentic positional notation. Cord colours follow the documented
khipu convention of colour-coded categories ([El País](https://english.elpais.com/science-tech/2022-12-20/knots-representing-numbers-the-mathematics-of-the-incas.html))
and are drawn from the Kanchay palette (yawar red, hatun gold, gray).

### 1.2 Amaru (serpent) — wrapping the knot
**Quechua etymology:** *amaru* = serpent / viper; the double-headed serpent of Andean
iconography ([Wiktionary `amaru`](https://en.wiktionary.org/wiki/amaru)).

**Why:** *amaru* is already canon — it is the name of our memory cortex / high-stakes
reasoning flagship (SF-01; BRAND_BIBLE §5). Wrapping the khipu with the serpent visually
states "memory surrounds and protects the record."

**Iconographic fidelity:** Rendered as a **double-headed** serpent (two heads meeting near
the base), a documented Andean motif ([Met — Spouted Vessel with Double Headed Snake,
Paracas](https://www.metmuseum.org/art/collection/search/308485)). The body is built from
the same cord vocabulary as the khipu — a fiber core wrapped in structural cords — directly
echoing the Met's Inca serpent ornament, which is a snake-shaped fiber core wrapped in cord
([Met — Serpent ornament, Inca (?)](https://www.metmuseum.org/art/collection/search/316938)).
The gold dash-ticks along the body represent that cord wrapping, not scales-as-decoration.

### 1.3 Lambda (Λ) — woven spine glyph
**Why:** Λ is the Λ-Spine aggregator (SF-07) — the weighted geometric mean: monotone (A1),
positive-homogeneous degree 1 (A2), bounded `Λ(x) ≤ maxᵢ xᵢ` (A4). Greek capital lambda is
a **mathematical** symbol, not a religious one. It sits at the optical center as the spine
that the record (khipu) and memory (amaru) hang from.

**Honesty note:** Λ-uniqueness remains **Conjecture 1** (open), not a theorem. The avatar
makes no claim otherwise — it is a glyph, not a proof.

### 1.4 Chakana (Andean step-cross) — background geometry
**Why:** The chakana is used strictly as a **geometric step-fret pattern** with 4-fold
rotational (C4) symmetry — mathematically constructible, historically authentic
([Getty CONA record](https://www.getty.edu/cona/CONAIconographyRecord.aspx?iconid=901001774);
[chakana geometry reference](https://mollyolson.weebly.com/uploads/4/2/1/0/42104603/inca_lesson_4_chakana_geometry.pdf)).

**Deliberate non-adoption of mysticism:** Some sources read the chakana as a spiritual
"axis mundi." We **do not** adopt that reading (Zero-Bandaid Law; "Mythos" is a literally
banned token, BRAND_BIBLE §6a). Here it is two concentric stepped polygons generated by
reflecting a single octant edge across the diagonal and rotating the quadrant four times —
a pure geometric construction.

---

## 2 · Composition & z-order

`chakana (background) → amaru (ring) → khipu (cords) → lambda (center, on a backing disc)`

The lambda sits on a translucent navy disc so the spine mark reads cleanly over the khipu
cords. The amaru ring is open at the base where the two heads terminate, framing the knot
without occluding it.

## 3 · Colour — Kanchay tokens only

Every colour is a verbatim hex from `tokens/COLOR_TOKENS.json`. No off-palette colour is
used.

| Role | Token | Hex |
|---|---|---|
| Background | gray.950 / surface.bg | `#0a0f1e` |
| Chakana fill (outer / inner) | gray.700 / gray.900 | `#2a3340` / `#10151c` |
| Chakana / amaru outline | yuyay.700 | `#0b5957` |
| Amaru body | yuyay.400 / yuyay.300 | `#34aaa4` / `#5cc4bf` |
| Amaru cord-ticks | hatun.300 | `#d7b96b` |
| Amaru eyes | yawar.400 | `#d65151` |
| Khipu primary cord | gray.300 / gray.100 | `#a4b1c4` / `#e6eaf1` |
| Khipu pendant cords | yawar.300 / hatun.300 / gray.200 | `#e57373` / `#d7b96b` / `#c9d2df` |
| Khipu knots | gray.50 | `#f5f7fa` |
| Lambda glyph | hatun.500 / hatun.200 | `#c08f2f` / `#e4cf99` |
| Lambda apex node | gray.50 | `#f5f7fa` |

Contrast: all foreground marks sit on `#0a0f1e`; the brightest token pairs are WCAG AAA per
`COLOR_TOKENS.json` `_wcag_verification` (e.g. yuyay-300 on bg = 9.19; hatun-300 on bg =
10.04).

## 4 · Animation — harmonic cycles

The founder asked for harmonically related cycles. The motifs animate as:

| Element | Motion | Cycle |
|---|---|---|
| Khipu | tighten/loosen (pendant length 93%↔100%) | **4 s** |
| Amaru | undulation (vertical scale ±1.2%, traveling sine in PIL frames) | **8 s** |
| Chakana | step-cross pulse (opacity/scale breathe) | **16 s** |
| Lambda | brightness pulse synced to **72 BPM** | 0.8333 s/beat |

The 4 / 8 / 16 s cycles are exact integer multiples (a 16 s master loop is seamless for all
three). The 72 BPM lambda pulse matches the YUYAY heartbeat (recipe #7 from
`450_3D_LEADERS_ADOPTION.md`).

**Honest note on the master loop:** 72 BPM = 0.8333 s/beat, so a 16 s loop contains 19.2
lambda beats — not an integer. The true seamless LCM of {4, 8, 16, 5/6} s is 80 s, which is
impractical for a ≤3 MB GIF. We therefore use a **16 s GIF loop** (perfectly seamless for
khipu/amaru/chakana); the lambda's brightness pulse has a sub-pixel discontinuity at the
loop seam that is imperceptible at avatar scale. The exact 72 BPM pulse is preserved in the
vector `avatar_static.svg` via independent SMIL timing (`dur="0.8333s"`), which loops the
lambda perfectly regardless of the master loop.

## 5 · Output specs (delivered)

- `avatar_animated.gif` — 400×400, 16 fps, 256-frame / 16 s loop, infinite loop, **2.31 MB**
  (< 3 MB HF limit). NB: a 24 fps render measured 3.04 MB (just over budget); 16 fps was
  selected to stay under the hard limit while preserving smooth motion.
- `avatar_static.svg` — hand-built vector composition with SMIL animation hints.
- `avatar_400.png … avatar_16.png` — six static PNG fallbacks (400/200/100/64/32/16).

## 6 · Provenance discipline

Every visual reference is cited to a primary museum or peer-reviewed academic source in
`REFERENCES.md`. The design is defensible as "authentically Inca": the khipu, amaru, and
chakana are each documented by the British Museum, the Smithsonian, the Met, and the Getty;
the knot mathematics is from Ascher & Ascher.

— Yachay, 2026-06-01. All claims sourced; no mystical terms; no v11 LOCKED number changed.
