# SZL Holdings — Visual Brand Kit

## Overview

All SZL Holdings video and screenshot assets follow these visual tokens. Any new video or graphic asset must use these exact values.

---

## Color Palette

### Parent Brand (SZL Holdings)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-szl-base` | `hsl(214,18%,3%)` | Page background |
| `--color-szl-accent` | `hsl(38,52%,58%)` | Gold accent — SZL brand color |
| `--color-szl-platinum` | `hsl(210,8%,78%)` | Platinum secondary |
| `--color-szl-text` | `hsl(38,8%,95%)` | Primary text |
| `--color-szl-text-secondary` | `hsl(214,7%,64%)` | Secondary/muted text |

### Lyte (Decision Intelligence)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-lyte` | `hsl(191,92%,44%)` | Electric cyan — primary product accent |
| `--color-lyte-light` | `hsl(191,92%,58%)` | Light variant |

### Domain Product Accents
| Product | Token | Hex |
|---------|-------|-----|
| Aegis | `--color-aegis` | `hsl(222,60%,50%)` — brand blue |
| Vessels | `--color-vessels` | `hsl(206,72%,40%)` — maritime blue |
| Terra | `--color-terra` | `hsl(140,50%,38%)` — earth green |
| Carlota Jo | `--color-carlota` | `hsl(36,48%,52%)` — warm amber |

### Semantic Status
| State | Hex |
|-------|-----|
| Critical/Danger | `hsl(0,62%,52%)` — red |
| Warning | `hsl(42,80%,50%)` — amber |
| Success | `hsl(145,62%,40%)` — green |

### Alloy Fabric
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-alloy` | `hsl(228,65%,54%)` — deep indigo |

---

## Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display (video headlines) | Fraunces | 300–700 | Serif with optical size axis; used for hero headlines in video |
| Body | Inter | 400–600 | Clean sans for UI labels and captions |
| Mono / Data | JetBrains Mono | 400–500 | Trace IDs, policy badges, system data |

**Loading:**
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## Intro / Outro Cards

### Intro Card (0.0s – 2.0s)
- Background: `hsl(214,18%,3%)` with slow radial gold glow
- SZL Holdings wordmark: Fraunces 400, `hsl(38,8%,95%)`, 5vw
- Tagline below: `GOVERNED DECISION OPERATING SYSTEM` in JetBrains Mono, `hsl(38,52%,58%)`, 0.8vw, tracked wide
- Animated gold accent line draws in from left at 0.4s

### Outro Card (final 3.0s)
- Same background as intro
- Product name in Fraunces (large)
- SZL Holdings parent lockup below in smaller mono
- Thin gold rule between product and parent
- `szlholdings.com` URL in mono, muted

---

## Lower Thirds

Used as scene labels and speaker callouts.

```
┌──────────────────────────────────────────────────────┐
│  PRODUCT NAME  ·  SCENE LABEL              (mono)   │
│  Supporting descriptor                              │
└──────────────────────────────────────────────────────┘
```

- Background: `hsla(214,14%,6%,0.88)` with subtle border `hsla(255,255,255,0.08)`
- Product name: JetBrains Mono, 0.65vw, product accent color, tracked +0.1em
- Scene label: JetBrains Mono, 0.65vw, muted text
- Descriptor: Inter 400, 0.75vw, secondary text

---

## Caption Style

- Font: Inter 500 or JetBrains Mono 400
- Size: 1.1vw (~16px at 1920)
- Color: `rgba(255,255,255,0.92)` on dark pill
- Background: `rgba(0,0,0,0.72)` rounded pill, 12px radius
- Position: centered, 80px from bottom
- Max width: 880px
- Timing: 0.25s fade in / out on each cue
- Speaker name: shown above caption in mono, 9px, `rgba(255,255,255,0.4)`
- Burned in for silent playback

---

## Screenshot Standards

- Resolution: 1920×1080 px canvas, deviceScaleFactor 2 (produces 3840×2160 file)
- Color scheme: dark
- Settle time: ≥3s after network idle (5s for animated scenes)
- File format: PNG
- Path: `media/screenshots/<artifact-id>/<view-name>.png`
- Hero shot: `hero.png` — full viewport, no UI chrome
- Views: at least two per artifact (hero + key secondary view)

---

## Video Standards

| Attribute | Value |
|-----------|-------|
| Aspect ratio | 16:9 |
| Render resolution | 1920×1080 |
| Scene minimum | 5 scenes |
| Scene duration range | 2s (punchy) – 8s (dramatic) |
| Transition style | clip-path reveal, morph-expand, zoom-through |
| Caption track | Required on every export |
| Intro card | Required (2s) |
| Outro card | Required (3s) |
| Loop | Continuous; first pass triggers recording stop |

---

## File Organization

```
media/
├── brand-kit/
│   ├── tokens.md           ← This file
│   └── intro-outro-spec.md ← Detailed intro/outro frame spec
├── screenshots/
│   ├── szl-holdings/
│   │   ├── hero.png
│   │   └── portfolio.png
│   ├── pulse/
│   ├── sentra/
│   ├── lyte/
│   ├── vessels/
│   ├── terra/
│   ├── prism-counsel/
│   ├── counsel/
│   ├── aegis/
│   ├── command/
│   └── szl-demo-video/
└── thumbnails/
    └── <artifact-id>-thumb.png
```

---

## Regeneration

```bash
# Refresh all screenshots (all workflows must be running)
bash scripts/capture-screenshots.sh

# Single artifact
bash scripts/capture-screenshots.sh sentra
```
