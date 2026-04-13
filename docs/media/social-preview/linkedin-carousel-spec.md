# LinkedIn Carousel Spec — SZL Holdings Portfolio

**April 2026**

---

## Purpose

This document specifies the LinkedIn carousel PDF for the SZL Holdings portfolio announcement post. The carousel targets operators, investors, and technical builders on LinkedIn.

## File Details

| Property | Value |
|----------|-------|
| **Filenames** | `slide-01.jpg` through `slide-08.jpg` (8 files) |
| **Location** | `export/linkedin/carousel-assets/` |
| **Dimensions** | 1080 × 1350px per slide (portrait 4:5) |
| **Format** | JPEG (individual images — upload as LinkedIn image carousel or combine to PDF) |
| **Slides** | 8 |
| **Resolution** | 150 DPI equivalent |
| **Font** | Inter (or system-ui) |

---

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| Background | `#0F172A` | Slide background (slate-950) |
| Primary text | `#F8FAFC` | Headlines (slate-50) |
| Body text | `#CBD5E1` | Body copy (slate-300) |
| Accent | `#3B82F6` | Section dividers, highlights (blue-500) |
| Muted text | `#94A3B8` | Captions, sub-labels (slate-400) |
| Card bg | `#1E293B` | Inner card backgrounds (slate-800) |

---

## Slide Script

### Slide 1 — Hook
**Layout:** Full-bleed dark, large centered text
```
I built 18 enterprise
applications solo.

Here's every one
(and what they do) →
```
**Visual:** SZL Holdings wordmark top-left, subtle grid pattern background

---

### Slide 2 — The Platform
**Layout:** Left headline + right stats grid
```
SZL Holdings

The governed operational
intelligence layer.

─────────────────────
18 apps · 600+ tables
1,618+ API endpoints
11 web · 7 mobile
5 industries · 1 founder
─────────────────────

Alloy: Signal → Evidence
→ Decision → Human Approval
→ Audit Trail
```
**Visual:** Blueprint/grid pattern, stat badges in blue

---

### Slide 3 — Lyte + Alloy
**Layout:** Screenshot right, text left
```
Lyte + Alloy
─────────────
Business Observability
& Execution Engine

PRISM Framework:
People · Revenue ·
Infrastructure ·
Security · Market

Alloy: propose_only mode
AI proposes.
Humans approve.
Immutable audit trail.
```
**Visual:** Lyte dashboard screenshot (lyte-overview.jpg) right side, 60% opacity

---

### Slide 4 — Aegis + Vessels
**Layout:** Split card grid
```
Aegis                 Vessels
──────────────────────────────
Unified Defense       Maritime
& SOC Command         Intelligence

Threat correlation    Fleet command
Adversary personas    AIS analytics
Blast radius viz      Voyage economics
Incident governance   MARPOL compliance
```
**Visual:** Aegis and Vessels hero screenshots as card backgrounds (30% opacity)

---

### Slide 5 — Terra + PRISM Counsel
**Layout:** Split card grid
```
Terra                 PRISM Counsel
──────────────────────────────────
Real Estate           Legal Command
Intelligence

Distress signals      Deadline governance
Ownership maps        Evidence chains
ACRIS + HPD + DOB     Proof chain export
NYC 5 boroughs        AI outcome scoring
```

---

### Slide 6 — Carlota Jo · Forge · Nexus · INCA Lab
**Layout:** 2×2 icon grid
```
Carlota Jo            Forge
Private Advisory      Client & Investor Portal
UHNW estate ops       Deal room · Document vault
AI concierge          Stakeholder intelligence

Nexus                 INCA Lab
Cross-Domain          AI Model Command
Fusion Canvas         Multi-provider governance
Signal correlation    Routing · Audit · Latency
```

---

### Slide 7 — The Architecture
**Layout:** Code block / terminal aesthetic
```
The Compounding Architecture
──────────────────────────────

Shared across all 18 apps:
→ PostgreSQL schema (600+ tables)
→ Alloy execution engine
→ 6 TypeScript shared libraries
→ Design system (60+ components)
→ JWT + RBAC auth layer

Result:
Platform 1: 6 weeks
Platform 5: 4 weeks
Platform 10+: 3 weeks each

One person.
One monorepo.
TypeScript 5.9 · React 19 · Expo SDK 53
```
**Visual:** Terminal/code aesthetic, monospace font for the code block

---

### Slide 8 — CTA
**Layout:** Centered, clean, spacious
```
Built in 18 months.
Solo.

szlholdings.com

────────────────────────

Connect if you're:
→ An operator evaluating pilots
→ An investor reviewing the thesis
→ A builder who wants to talk
   compounding architecture

Which of these platforms
would your organization use?

↓ Drop a comment ↓

Stephen Lutar · @szlholdings
```

---

## Design Instructions

**To create this carousel:**

1. **Figma** (preferred): Create 8 frames at 1080×1350px each. Apply styles above. Export as PDF.
2. **Canva**: Use LinkedIn Carousel template (portrait), apply brand colors.
3. **React-PDF** (code-based): Use `@react-pdf/renderer` with styled components matching the spec above.

**Upload to LinkedIn:**
- LinkedIn → Start a post → Document icon → Upload PDF
- LinkedIn displays each page as a swipeable slide
- Do NOT use image posts — PDF carousel gets 3–4× the reach

---

## Performance Benchmarks (LinkedIn Carousel, 2025)

| Metric | Carousels | Text Posts |
|--------|-----------|------------|
| Avg engagement rate | 24.42% | 6.67% |
| Relative reach | 11× higher | baseline |
| Optimal slides | 6–9 | N/A |
| Click-through required | ≥35% | N/A |

---

## Output Files

| File | Location | Status |
|------|----------|--------|
| Slide 01 (Cover) | `export/linkedin/carousel-assets/slide-01.jpg` | DELIVERED |
| Slide 02 | `export/linkedin/carousel-assets/slide-02.jpg` | DELIVERED |
| Slide 03 | `export/linkedin/carousel-assets/slide-03.jpg` | DELIVERED |
| Slide 04 | `export/linkedin/carousel-assets/slide-04.jpg` | DELIVERED |
| Slide 05 | `export/linkedin/carousel-assets/slide-05.jpg` | DELIVERED |
| Slide 06 | `export/linkedin/carousel-assets/slide-06.jpg` | DELIVERED |
| Slide 07 | `export/linkedin/carousel-assets/slide-07.jpg` | DELIVERED |
| Slide 08 (CTA) | `export/linkedin/carousel-assets/slide-08.jpg` | DELIVERED |

**Upload instructions:** On LinkedIn, create a new post → select "Image" → upload all 8 JPEGs in order. LinkedIn will automatically present them as a swipeable carousel. Alternatively, use any PDF-to-slides tool (e.g., Canva, Adobe Acrobat) to combine the 8 JPEGs into a single PDF for native PDF carousel upload.
