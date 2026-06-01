# AEEP Design Style Principles

## Core Mandate

These principles govern every authenticated product surface in the AEEP monorepo.
They are enforced by token constraints, component API design, and code review.

---

## 1. Dark-First, Muted Neutrals

All product surfaces use the cool-neutral dark base:

| Token | Value | Use |
|---|---|---|
| `color.bg.base` | `#060b12` | Page background |
| `color.bg.surface` | `#0d1520` | Card / panel background |
| `color.bg.overlay` | `#111c2a` | Inline overlays, inputs |
| `color.bg.raised` | `#162030` | Raised elements |

No surface background is lighter than `color.bg.raised` in authenticated UX.

---

## 2. Enterprise Accent Family — No Neon

The AEEP accent palette is disciplined and enterprise-quiet.
Neon values (`#00d4ff`, `#00e878`, etc.) are **marketing-only** and must not appear in authenticated product screens.

| Token | Value | Use |
|---|---|---|
| `color.accent.blue` | `#4d8fcc` | Primary interactive, links, focus rings |
| `color.accent.teal` | `#3ea89a` | Holdings / operational accent |
| `color.accent.green` | `#5baa8a` | Success, allowed, confidence-high |
| `color.accent.amber` | `#c9a85c` | Warning, pending, aging |
| `color.accent.red` | `#c96070` | Error, blocked, confidence-low |
| `color.accent.violet` | `#9b7cc8` | Governance, legal, contradiction |

---

## 3. Typography Constraints

- Body text: `typography.scale.sm` (13px) or `typography.scale.base` (14px)
- **Maximum heading size in authenticated product UX: `typography.scale.2xl` (24px)**
- Mono font for trace IDs, code, JSON, IDs: `typography.fontFamily.mono`
- Weights: regular (400), medium (500), semibold (600)
- No decorative fonts

---

## 4. Motion — Maximum 200ms

All transitions must use tokens from `motion.duration` and `motion.easing`.
- Maximum duration: `motion.duration.normal` (200ms)
- No bounce, spring, or decorative animations in product UX
- Loading spinners: simple rotation only

---

## 5. Density Modes

Three density modes control the shell and all components:

| Mode | Row Height | Page Padding | Font Size |
|---|---|---|---|
| `comfortable` | 56px | 32px | 13px |
| `compact` | 40px | 24px | 12px |
| `dense` | 32px | 16px | 11px |

Use `useDensity()` hook. Never hardcode spacing values in components.

---

## 6. Screen Modes

**Executive mode**: Clean summary view. KPI grids, top risks, approval queues.
**Operator mode**: High-density. Filter/table-first. Trace visibility. Drawers.

Use `useScreenMode()` hook. Components must adapt to both modes.

---

## 7. Evidence-First

Every material AI result must surface:
1. `traceId` — why this result appeared
2. Source citations — what evidence backs it
3. Policy verdict — what policy ran and what it decided
4. Confidence + freshness score

Use `EvidencePanel` in all search/recommendation/workflow/brief screens.

---

## 8. No Raw Hex Outside Token Files

All color values must reference a token. No inline hex in component files.
Token files: `packages/design-system/src/tokens/index.ts` (and sub-modules).

---

## 9. Semantic Status — Use StatusBadge

Never implement custom status coloring. Use `StatusBadge` with a named variant.
Variants: `success | warning | error | info | neutral | pending | active | approved | rejected | escalated`

---

## 10. Accessibility Baseline

- All interactive elements: keyboard focusable, `aria-label` where icon-only
- Focus ring: `color.border.focus` (`#4d8fcc`), 2px solid
- Color alone must never be the sole indicator of state (always pair with text/icon)
