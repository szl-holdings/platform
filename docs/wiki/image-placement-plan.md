# Image Placement Plan

This document maps each screenshot and visual asset to its intended placement across README, wiki, social preview, and profile README. It governs where images appear and why.

---

## Asset Inventory

| File | Description |
|------|-------------|
| `docs/media/screenshots/landing-hero.jpg` | SZL Holdings homepage — ecosystem overview |
| `docs/media/screenshots/lyte-overview.jpg` | Lyte command dashboard — PRISM framework |
| `docs/media/screenshots/alloy-overview.jpg` | Alloy workflow and governance view |
| `docs/media/screenshots/trust-center.jpg` | Trust Center and compliance posture view |
| `docs/media/social-preview/repo-social-preview.png` | 1280×640 social preview card (to be designed) |
| `profile-readme/assets/platform-map.svg` | Architecture diagram SVG |
| `profile-readme/assets/ecosystem-map.svg` | Ecosystem overview diagram SVG |
| `profile-readme/assets/founder-card.svg` | Founder identity card SVG |

---

## Placement Matrix

| Asset | README | Wiki — Screenshots | Wiki — Home | Social Preview | Profile README |
|-------|--------|-------------------|-------------|---------------|---------------|
| `landing-hero.jpg` | ✓ Primary hero | ✓ | — | — | — |
| `lyte-overview.jpg` | ✓ Product section | ✓ | — | ✓ Source image | — |
| `alloy-overview.jpg` | ✓ Product section | ✓ | — | — | — |
| `trust-center.jpg` | ✓ Trust section | ✓ | — | — | — |
| `repo-social-preview.png` | — | — | — | ✓ Primary | — |
| `platform-map.svg` | ✓ Architecture section | — | — | — | ✓ |
| `ecosystem-map.svg` | — | — | ✓ Embed or reference | — | ✓ |
| `founder-card.svg` | — | — | — | — | ✓ |

---

## Placement Rationale

### README
All four screenshots appear in the README in the following order:
1. `landing-hero.jpg` — Opens the Screenshots section. First visual impression.
2. `lyte-overview.jpg` — Flagship product, most important visual.
3. `alloy-overview.jpg` — Shows the governance layer.
4. `trust-center.jpg` — Closes with trust signal.

The README also embeds the architecture diagram inline as ASCII (not as an image) to ensure rendering everywhere. The `platform-map.svg` is referenced in the Architecture section.

### Wiki — Screenshots and Demos
All four screenshots appear with detailed captions explaining what to look for in each view. The wiki page provides more context than the README image references.

### Wiki — Home
No screenshot images embedded directly in the wiki Home page — the home page uses ASCII diagram for the ecosystem overview. Screenshots are in their dedicated wiki page.

### Social Preview (1280×640)
The social preview uses `lyte-overview.jpg` as the source screenshot for the right-panel background. It is not displayed raw — it is composited with the text panel. The final rendered file is `repo-social-preview.png`.

**Rationale for Lyte:** It is the flagship product, has the most recognizable command-center UI, and best represents the platform to a non-technical first-time viewer.

### Profile README
The profile README uses SVG diagrams rather than product screenshots to maintain a cleaner, more abstract founder-level presentation. Screenshots are product-level assets; the profile README is the founder and company presentation layer.

---

## Screenshot Guidelines

- Screenshots must show real UI, not mockups
- Demo/seed data must be visually labeled in the interface if present
- Screenshots are updated whenever the UI changes significantly enough to be misleading
- All screenshots are taken at 1440px viewport width for consistency
- Format: JPEG for screenshots (file size), PNG for diagrams and SVG

---

## Next Screenshot Additions (Phase 3)

When Phase 3 screenshots are captured, add to this plan:

| Planned Asset | Placement |
|---------------|-----------|
| `aegis-soc-command.jpg` | README (Aegis section), Wiki |
| `vessels-fleet-map.jpg` | README (Vessels section), Wiki |
| `terra-distress-map.jpg` | README (Terra section), Wiki |
| `mobile-overview.jpg` | README (Mobile section), Wiki |
