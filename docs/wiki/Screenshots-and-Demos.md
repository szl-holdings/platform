# Screenshots & Demos

**SZL Holdings Platform — Visual Gallery**

This page contains live screenshots and visual assets from all products in the SZL Holdings ecosystem. Screenshots are captured from running applications at 1440×900 (desktop) and 390×844 (mobile) viewports with dark-premium styling.

> Last updated: April 2026

---

## Table of Contents

- [SZL Holdings](#szl-holdings)
- [Lyte](#lyte)
- [Aegis](#aegis)
- [Vessels](#vessels)
- [Terra](#terra)
- [Architecture](#architecture)

---

## SZL Holdings {#szl-holdings}

### SZL Holdings — Mobile Responsive

Mobile viewport (390px) — responsive layout verification for the platform landing page.

![SZL Holdings — Mobile Responsive](assets/mobile-view.jpg)

---

### SZL Holdings — Platform Landing

Main marketing landing page. Dark-premium aesthetic with the core thesis: "Signal → visibility → forecast → governed action."

![SZL Holdings — Platform Landing](assets/szl-holdings-landing.jpg)

---

## Lyte {#lyte}

### Lyte — Business Observability

Lyte marketing and command surface. PRISM framework: People, Revenue, Infrastructure, Security, Market.

![Lyte — Business Observability](assets/lyte-overview.jpg)

---

## Aegis {#aegis}

### Aegis — Defense & Intelligence

Aegis unified defense and intelligence platform. SOC, managed operations, and intelligence engine in one console.

![Aegis — Defense & Intelligence](assets/aegis-overview.jpg)

---

## Vessels {#vessels}

### Vessels — Fleet Command

Vessels maritime intelligence platform. Fleet tracking, voyage economics, and exception-based operations.

![Vessels — Fleet Command](assets/vessels-overview.jpg)

---

## Terra {#terra}

### Terra — Real Estate Intelligence

Terra real estate intelligence platform. Distress signal detection, ownership analysis, and deal pipeline.

![Terra — Real Estate Intelligence](assets/terra-overview.jpg)

---

## Architecture {#architecture}

### Ecosystem Map

Ecosystem-level view showing how all SZL Holdings products connect.

![Ecosystem Map](assets/ecosystem-map.svg)

---

### Platform Architecture Map

Full platform architecture diagram showing Lyte, Alloy, and domain packs.

![Platform Architecture Map](assets/platform-map.svg)

---

## Capture Pipeline

Screenshots are captured using the automated pipeline in `scripts/media/`:

```bash
# Capture all screenshots (requires running apps)
npx tsx scripts/media/capture-screenshots.ts

# Optimize and distribute to correct folders
npx tsx scripts/media/optimize-images.ts

# Regenerate this gallery
npx tsx scripts/media/generate-wiki-gallery.ts
```

### Quality Standards

- Viewport: 1440×900 (desktop), 390×844 (mobile)
- Format: JPEG, 85–90% quality, progressive
- Color scheme: Dark (forced)
- Scale: 1x device pixel ratio
- No debug chrome, no broken states, no placeholder data
- Meaningful demo data in all views

### Asset Placement

| Destination | Purpose |
|-------------|---------|
| `docs/media/screenshots/` | Source originals |
| `docs/wiki/assets/` | Wiki gallery (this page) |
| `profile-readme/assets/` | GitHub profile README |
| `docs/media/social-preview/` | Social preview / OG image |
