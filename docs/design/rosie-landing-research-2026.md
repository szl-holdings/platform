# ROSIE landing — design research, May 2026

## Mandate

Make the ROSIE landing feel like **Anthropic × True Anomaly** with the explanatory
depth of A11oy. The product surface behind it should feel like **Cursor ×
True Anomaly × Anthropic**: restrained, fast, signal-rich, ours.

The goal is **one-of-one identity** — not a graft of any single reference.

## Sources surveyed

| Source | What is worth borrowing | What to discard |
|---|---|---|
| **anthropic.com** | Editorial calm. Wide measure. Serif display paired with a quiet sans for body. Generous negative space. Copy that explains, not pitches. Single accent (their tan). Almost no decorative motion. | Their literal palette (cream-on-cream is too soft for a decision fabric). The "research lab brochure" tone — we are operator-facing, not academic. |
| **trueanomaly.space** | Operational gravity. Dark canvas. Thin hairlines. Telemetry-as-decoration (live counters, coords, timestamps). Diagram-first hero. Sentence-fragment subheads with strong nouns. | Aerospace skeuomorphism (HUD reticles, satellite renders). Heavy 3D in the hero. Military theatricality. |
| **cursor.com** | Demonstrate the product *in* the hero. Mono captions for "what just happened" callouts. Page transitions stay under 250ms. Hover states are signal, not decoration. Single primary CTA. | Trend-chasing motion (the rotating-tag carousel). Marketing-deck section count. |
| **a11oy.io** (sister artifact) | Explanatory rigor: every section answers a *why*, not just a *what*. Receipts and constitutions named on the page itself. Six-primitive pillar grid. | Doctrine-scanner UI density (too internal-tool for a public landing). |
| **stripe.com** | Code/IO panels treated as first-class content. Section anchors are scannable. | Per-vertical micro-product proliferation. |
| **linear.app** | Tight type ramp. Keyboard-shortcut chips inline with copy. | Their pastel-gradient hero — drift toward consumer. |
| **vercel.com** | Live-data ticker integrated into the hero. | Logo-soup customer wall. |
| **palantir.com / Foundry** | "Operator scenario" framing — "here is what someone *does* with this." | Enterprise-deck verbosity. |
| **midjourney/showcase** | Variant-grid as a way to show that *choice itself is the product*. | Aesthetic-only galleries with no semantic content. |

## Design language — what is ours

### Palette — "graphite + tungsten + halon"

ROSIE is a governed decision fabric. The palette is **warm tools on a cold
substrate** — graphite background, parchment/bone foreground for editorial
calm, tungsten amber for *action*, halon cyan for *signal/proof*. One
restrained pair, never competing.

| Token | Value | Role |
|---|---|---|
| `--graphite-950` | `#0A0B0D` | Page canvas |
| `--graphite-900` | `#101216` | Card / sidebar |
| `--graphite-800` | `#181B21` | Elevated card |
| `--graphite-700` | `#222730` | Hairline border |
| `--bone-100` | `#F2ECDC` | Primary text |
| `--bone-300` | `#C9C2B3` | Secondary text |
| `--bone-500` | `#857F73` | Tertiary / muted |
| `--tungsten-500` | `#E6A969` | Primary action, narrator badge |
| `--tungsten-700` | `#A87431` | Pressed / focus halo |
| `--halon-400` | `#7AD3D1` | Receipts, proof chain, live-data |
| `--halon-700` | `#2E6F6D` | Receipt-on-receipt accent |
| `--ember-500` | `#D9534F` | Destructive only |

The split is deliberate: every UI element in the product belongs either to
the *action* family (tungsten) or the *proof* family (halon). Never both.
Operators learn this in two minutes.

### Type ramp

| Token | Stack | Use |
|---|---|---|
| `--font-display` | `Newsreader, "Source Serif 4", Georgia, serif` | Hero, section heads — editorial, declarative |
| `--font-sans` | `Inter, "Inter Tight", ui-sans-serif` | Body, UI, nav |
| `--font-mono` | `"JetBrains Mono", "IBM Plex Mono", Menlo, monospace` | Receipts, hashes, telemetry, eyebrow labels |

Ramp:
- `display-xl` — 64/68, serif, -0.02em
- `display-lg` — 44/48, serif, -0.015em
- `heading-md` — 22/28, sans, -0.005em, 600
- `body-lg` — 17/28, sans, 0
- `body-md` — 14/22, sans
- `mono-eyebrow` — 11/14, mono, +0.18em, uppercase
- `mono-hash` — 11/16, mono, 0

Three families, no decorative weights, no italics outside body copy. The
serif carries the editorial calm; the mono carries the operational gravity.

### Motion budget

Restrained, deliberate, never decorative. Total moving mass on screen at any
time should fit in one sentence.

| Motion | Duration | Easing | Where |
|---|---|---|---|
| Page transition | 220ms | `cubic-bezier(.2,.0,.0,1)` | route fade + 8px y |
| Hover lift | 120ms | `ease-out` | cards, nav items |
| Focus ring | 80ms | `ease-out` | inputs, buttons, links |
| Live pulse | 1800ms | `ease-in-out` | live-stream dot only |
| Progress bar | 80ms | linear | descent telemetry |

No parallax. No scroll-jacked hero animation. No gradient sweeps. The single
permitted gradient is the descent progress bar (tungsten → halon, signalling
"action becomes proof").

### Component idioms

- **Hairlines, not shadows.** 1px `--graphite-700` borders everywhere; no
  drop shadows except a single 1px inset highlight on cards.
- **Eyebrow + headline + lede.** Every section opens with a `mono-eyebrow`
  label, then a serif headline, then one sentence of lede. Same three-beat
  rhythm across the page so scanning is predictable.
- **Telemetry-as-decoration.** Live counters, ingest timestamps, GPU adapter
  name, chain length appear *as content*, not as charts. Same as
  True Anomaly's status strip, but rendered in mono and never decorative.
- **CTA is a single tungsten button + a single ghost button.** Never three.
- **Receipt-trust section ends every page.** A hairline strip with the last
  receipt hash + verify link, so the chain is visible from anywhere.

## What we kept, discarded, re-invented

**Kept**
- Editorial three-beat rhythm (eyebrow / headline / lede) — Anthropic.
- Live ticker integrated into the page body, not a popover — Vercel.
- Operator-scenario sections written in second person — Palantir.
- Code / receipt panels as first-class content — Stripe + A11oy.
- Mono captions paired with serif heads — Cursor + Anthropic.

**Discarded**
- Glassmorphism / blurred panels (every reference avoids these now; they
  read as 2021 SaaS).
- Logo wall (we have no customer logos to show, and faking is dishonest).
- Animated background gradients (no semantic content, expensive on the GPU
  budget we want for the actual descent visualisation).
- Multi-column footer link garden (one footer line, mono).
- "Tour the product" carousel — the product itself is one click away.

**Re-invented**
- The **tungsten/halon split** above — neither reference has this
  *action vs. proof* color discipline. It is the single most ROSIE-shaped
  thing about the design.
- The **descent line** as recurring motif — the SA energy trace from the
  Optimizer surface (a downward jagged curve) is used as both hero
  visual and section divider. It is literally what ROSIE does.
- The **receipt-trust strip** that closes every page — neither Anthropic nor
  True Anomaly does this. It is direct evidence of the governance contract.

## Landing structure (one page, six sections)

1. **Hero** — eyebrow ("governed decision fabric · covenant proof standard v1"),
   serif headline ("The optimizer decides. The narrator explains. The chain
   proves."), one-sentence lede, two CTAs (`Launch Optimizer`, `Inspect Proof
   Chain`), descent-curve visual as right column.
2. **What ROSIE is (in three lines)** — Graph Planner, deterministic
   solver, receipt-chained narration. Each gets one sentence, one verb,
   one consequence.
3. **Capability narrative** — four-card grid: Deterministic Optimizer,
   Covenant Proof Chain, Narrator (LLM as governance-only), Live Research
   Loop. Each card carries an eyebrow / heading / lede + one piece of live
   telemetry pulled from the API.
4. **Operator scenarios** — "You are a port master." / "You are a CISO." /
   "You are a research lead." Three short second-person vignettes that
   describe the *action* an operator takes and the *receipt* they walk away
   with. Concrete, not aspirational.
5. **Receipt-trust strip** — live count of sealed receipts + last receipt
   hash + verify CTA. The chain is the proof; the proof is on the page.
6. **Warhacker CTA** — single tungsten button into the Warhacker hub
   (`/warhacker` if present in this artifact, otherwise the external
   Warhacker brief route). Single sentence above. Nothing else.

## Product surface polish (post-"Enter ROSIE")

- **Shell**: thin top bar, mono nav with the same eyebrow treatment, live
  UTC clock, live-stream pulse. Identical on every product page.
- **Page transitions**: 220ms fade + 8px y on route change, gated by
  `prefers-reduced-motion`.
- **Focus rings**: 2px tungsten halo on every interactive element,
  consistent with the action/proof color rule.
- **Hover states**: cards lift by 1px border-color shift (graphite-700 →
  tungsten-500/40), never by shadow or scale.
- **Receipt-trust strip**: pinned to footer on every product page.
- **No new animation** in Optimizer/Fabric/Proof beyond what already
  exists (descent line, fabric rotation, SSE ticker). Restraint is the
  product.

## Auditability

This doc is the source of truth for the design choices. Token values land
in `artifacts/rosie/src/index.css`. The landing rebuild lives in
`artifacts/rosie/src/pages/Identity.tsx`. Any future deviation should
update this file in lockstep.
