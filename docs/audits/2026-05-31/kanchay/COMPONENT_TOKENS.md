# KANCHAY — Component Tokens

**License:** Apache-2.0. **Attribution:** ORCID 0009-0001-0110-4173.
Spacing, radii, shadows, motion, z-index. **Material 3 + Radix Themes inspired but original.**
These ship in `tokens/COMPONENT_TOKENS.css` and are consumed by every flagship.

## 1 · Spacing scale (4px base grid)

A linear 4px grid (Material 3's 4dp baseline) with named steps; `space-px` for hairlines.

| Token | px | rem |
|---|---|---|
| `space-px` | 1 | 0.0625 |
| `space-0` | 0 | 0 |
| `space-1` | 4 | 0.25 |
| `space-2` | 8 | 0.5 |
| `space-3` | 12 | 0.75 |
| `space-4` | 16 | 1 |
| `space-5` | 20 | 1.25 |
| `space-6` | 24 | 1.5 |
| `space-8` | 32 | 2 |
| `space-10` | 40 | 2.5 |
| `space-12` | 48 | 3 |
| `space-16` | 64 | 4 |
| `space-20` | 80 | 5 |
| `space-24` | 96 | 6 |

## 2 · Border radii

| Token | px | Use |
|---|---|---|
| `radius-none` | 0 | tables, full-bleed |
| `radius-sm` | 4 | inputs, chips, code blocks |
| `radius-md` | 8 | buttons, cards (default) |
| `radius-lg` | 12 | panels, modals |
| `radius-xl` | 16 | hero cards |
| `radius-2xl` | 24 | feature surfaces |
| `radius-full` | 9999 | pills, avatars, the favicon glyph container |

## 3 · Shadows (elevation)

Dark-theme-first: shadows are subtle + paired with a 1px border (Radix pattern) since pure
shadow is weak on near-black. Values tuned for `gray-950` backdrop.

| Token | value | elevation |
|---|---|---|
| `shadow-none` | none | flat |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,.40)` | resting card |
| `shadow-md` | `0 2px 8px rgba(0,0,0,.45)` | raised card, dropdown |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,.50)` | popover, modal |
| `shadow-xl` | `0 16px 48px rgba(0,0,0,.55)` | dialog, command palette |
| `shadow-focus` | `0 0 0 3px color-mix(in srgb, var(--color-yuyay-400) 55%, transparent)` | focus ring (teal) |
| `shadow-glow-hatun` | `0 0 0 1px var(--color-hatun-500), 0 0 16px color-mix(in srgb, var(--color-hatun-400) 30%, transparent)` | premium accent emphasis |

## 4 · Motion

Easing + duration tuned for "calm, precise, systems." **All honor `prefers-reduced-motion`.**

| Token | value | use |
|---|---|---|
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | most enter/exit (M3 standard) |
| `ease-emphasized` | `cubic-bezier(0.3, 0, 0.1, 1)` | hero/large transitions |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | entering elements |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | exiting elements |
| `duration-instant` | 75ms | hover tint, small state |
| `duration-fast` | 150ms | buttons, toggles |
| `duration-base` | 250ms | dropdowns, accordions |
| `duration-slow` | 400ms | modals, drawers |
| `duration-slower` | 600ms | page/route transitions |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

## 5 · Z-index layers

Named scale (Radix-style) to prevent stacking wars across flagships.

| Token | value | layer |
|---|---|---|
| `z-base` | 0 | document flow |
| `z-raised` | 10 | sticky headers, raised cards |
| `z-dropdown` | 1000 | dropdowns, selects |
| `z-sticky` | 1100 | sticky nav/sidebar |
| `z-overlay` | 1200 | scrims/backdrops |
| `z-modal` | 1300 | dialogs, drawers |
| `z-popover` | 1400 | popovers, tooltips over modals |
| `z-toast` | 1500 | toasts/notifications |
| `z-max` | 2147483000 | skip-link, critical a11y overlays |

## 6 · Border widths & focus

| Token | value |
|---|---|
| `border-hairline` | 1px |
| `border-thick` | 2px |
| `border-focus` | 3px (matches `:focus-visible` outline used in a11oy index.html) |

Focus ring color: `--color-yuyay-400` (teal) — meets WCAG AA non-text contrast (≥3:1) against
both `gray-950` and `gray-50`.

## 7 · CSS drop-in (`tokens/COMPONENT_TOKENS.css`)

```css
:root {
  --space-px:1px; --space-1:.25rem; --space-2:.5rem; --space-3:.75rem; --space-4:1rem;
  --space-5:1.25rem; --space-6:1.5rem; --space-8:2rem; --space-10:2.5rem; --space-12:3rem;
  --space-16:4rem; --space-20:5rem; --space-24:6rem;
  --radius-sm:4px; --radius-md:8px; --radius-lg:12px; --radius-xl:16px; --radius-2xl:24px; --radius-full:9999px;
  --shadow-sm:0 1px 2px rgba(0,0,0,.40); --shadow-md:0 2px 8px rgba(0,0,0,.45);
  --shadow-lg:0 8px 24px rgba(0,0,0,.50); --shadow-xl:0 16px 48px rgba(0,0,0,.55);
  --ease-standard:cubic-bezier(.2,0,0,1); --ease-emphasized:cubic-bezier(.3,0,.1,1);
  --ease-out:cubic-bezier(0,0,.2,1); --ease-in:cubic-bezier(.4,0,1,1);
  --duration-instant:75ms; --duration-fast:150ms; --duration-base:250ms;
  --duration-slow:400ms; --duration-slower:600ms;
  --z-raised:10; --z-dropdown:1000; --z-sticky:1100; --z-overlay:1200;
  --z-modal:1300; --z-popover:1400; --z-toast:1500;
  --border-hairline:1px; --border-thick:2px; --border-focus:3px;
}
```

Inspirations cited: [Material Design 3 — spacing & motion](https://m3.material.io/),
[Radix Themes — tokens & z-index discipline](https://www.radix-ui.com/themes/docs/theme/overview).
Values are original (4px grid + Major-Third type + dark-first shadows); not copied verbatim.

— Yachay, 2026-06-01. Apache-2.0; no mystical content; no v11 LOCKED number changed.
