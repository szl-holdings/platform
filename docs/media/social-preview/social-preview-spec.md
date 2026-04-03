# Social Preview Spec — szl-holdings-platform

## Current Status

**`repo-social-preview.png`** — A 1280×640 placeholder PNG exists at this path (solid `#0F172A` background). This is a valid, uploadable image that satisfies the GitHub social preview format requirement.

**Phase 3 action:** Replace with the designed version using the spec below (composited with Lyte screenshot + text panel).

---

## Overview

The social preview image is the Open Graph / Twitter Card thumbnail shown when the repository URL is shared on LinkedIn, Twitter/X, Slack, or in email. It is the first visual impression of the platform for external audiences.

**GitHub dimensions:** 1280 × 640px (2:1 ratio). Minimum 640 × 320px.

---

## Selection Rationale

The social preview must accomplish three things in under two seconds of visual scanning:
1. Identify the company and product clearly
2. Signal enterprise grade / premium positioning
3. Indicate what the product does

Given the platform's dark-first design aesthetic and command-center density, the social preview should use the Lyte dashboard screenshot as the primary visual — it is the most recognizable product surface and the one most likely to resonate with the target audience (enterprise buyers, investors, technical reviewers).

---

## Design Specification

### Composition

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   SZL Holdings                          [screenshot crop:      │
│                                          Lyte command surface  │
│   Governed Operational Intelligence      right half of card]   │
│   Software                                                     │
│                                                                │
│   ─────────────────────────                                   │
│   Lyte · Alloy · Aegis · Vessels                              │
│   Terra · Carlota Jo                                           │
│                                                                │
│   szlholdings.com                                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Typography

- Company name: Inter or system-ui, 32–36px, white, weight 700
- Tagline: Inter, 18–20px, gray-300 (`#D1D5DB`), weight 400
- Product list: Inter, 14px, gray-400 (`#9CA3AF`), weight 400
- Domain: Inter, 13px, gray-500 (`#6B7280`)

### Color

- Background: `#0F172A` (Slate 950 — matches platform dark theme)
- Left panel background: `#0F172A`
- Right panel: screenshot crop with 20–30% overlay at left edge for text readability
- Accent line: `#3B82F6` (Blue 500 — platform primary accent)

### Logo / Wordmark

Use the SZL Holdings wordmark or initials lockup if available. If not, use the company name in bold Inter as the primary identifier.

---

## File Requirements

| Property | Value |
|----------|-------|
| Filename | `repo-social-preview.png` |
| Dimensions | 1280 × 640px |
| Format | PNG |
| Color mode | RGB |
| Max file size | 1MB (GitHub recommendation) |

---

## Creation Instructions

**Option A — Design tool (preferred):**
1. Open Figma or similar design tool
2. Create a 1280 × 640px frame
3. Apply `#0F172A` background
4. Left panel: add company name, tagline, product list, domain text
5. Right panel: import `docs/media/screenshots/lyte-overview.jpg`, crop to fill right 55% of frame, add left-edge gradient overlay
6. Add 4px accent line in `#3B82F6` at the bottom or as left-panel border
7. Export as PNG at 1x (1280 × 640)

**Option B — Placeholder (interim):**
Until a designed version exists, upload the `lyte-overview.jpg` screenshot directly as the social preview. This is not ideal but better than the default GitHub card.

---

## Upload Instructions

See `scripts/github/update-social-preview-guide.md` for the manual upload process.

---

## Update Triggers

Re-generate the social preview if:
- The Lyte dashboard UI changes significantly
- The company name or tagline changes
- The platform adds a major new product not listed on the card
- The existing screenshot is replaced with a higher-quality version
