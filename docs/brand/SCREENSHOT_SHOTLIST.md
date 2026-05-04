# Screenshot Shot List

> Canonical shot list for SZL Holdings public-facing visual assets · April 2026

All approved screenshots are stored in `docs/assets/screenshots/current/`. Retired screenshots go to `docs/assets/screenshots/archive/`.

---

## Capture Specification

| Spec | Value |
|------|-------|
| Resolution | 1440×900 minimum (2880×1800 for retina-ready) |
| Color mode | Dark mode (all surfaces except Carlota Jo) |
| State | Data populated — realistic demo seed, not empty states |
| Browser chrome | Hidden (use full-page capture mode) |
| Format | JPEG at 85% quality |
| Naming | `{surface-slug}-{view-name}.jpg` |

---

## Priority 1 — Investor-Facing (Must Capture)

### 1. SZL Holdings Dashboard (`szl-holdings-dashboard.jpg`)
- **Surface:** `/` (SZL Holdings web app)
- **View:** Main dashboard, portfolio overview
- **Must show:** Multi-domain signal tiles, clean premium aesthetic, live data indicators
- **Avoid:** Empty states, loading spinners, debug overlays

### 2. Lyte / Unified Command — PRISM Overview (`lyte-prism-command.jpg`)
- **Surface:** `/command/` (Unified Command)
- **View:** PRISM framework overview — People, Revenue, Infrastructure, Security, Market
- **Must show:** Five-domain signal cards, recommendation panel
- **Notes:** This is the flagship differentiator view

### 3. Vessels — Fleet Intelligence (`vessels-fleet-command.jpg`)
- **Surface:** `/vessels/`
- **View:** Fleet map + vessel list, or voyage P&L panel
- **Must show:** AIS data visualization, fleet status, commercial intelligence
- **Notes:** Sanctions screening view is a strong trust signal

### 4. Terra — Deal Pipeline (`terra-deal-pipeline.jpg`)
- **Surface:** `/terra/`
- **View:** Distress pipeline or ownership graph
- **Must show:** Deal cards, AI analysis panel, workflow state
- **Notes:** Pro Forma or financial analysis view if available

### 5. Carlota Jo — Client Portal (`carlota-jo-client-portal.jpg`)
- **Surface:** `/carlota-jo/`
- **View:** Client engagement view or service catalog
- **Must show:** Premium light-mode aesthetic, UHNW polish
- **Condition:** Capture only if presentation-quality; skip if not ready
- **Notes:** Light mode — verify contrast and spacing

### 6. Command Portal — Executive View (`command-portal-executive.jpg`)
- **Surface:** `/command/`
- **View:** Cross-domain dashboard, executive briefing
- **Must show:** Multi-domain SSE feeds, executive intelligence summary

---

## Priority 2 — Should Capture

### 7. CORTEX Mobile (`cortex-mobile-home.jpg`)
- **Surface:** Mobile command app
- **View:** Home screen or workspace selector
- **Must show:** Native iOS framing (device mockup optional), biometric auth indicator
- **Condition:** Only if polished; deferred surfaces show "coming soon" correctly

### 8. Pulse — AI Briefing (`pulse-executive-briefing.jpg`)
- **Surface:** `/pulse/`
- **View:** AI-generated executive briefing narrative
- **Must show:** Narrative intelligence report, source citations, confidence indicators

### 9. Sentra / Aegis — Security Command (`sentra-soc-command.jpg`)
- **Surface:** `/sentra/`
- **View:** SOC dashboard or threat intelligence panel
- **Condition:** Only if presentation-ready

---

## Hero / Architecture

### 10. Architecture Diagram (`architecture-hero.jpg` or SVG)
- **Type:** Rendered diagram (not ASCII art)
- **Shows:** Platform hierarchy — Lyte, Alloy, CORTEX, Domain Packs, Governance Infrastructure, Data Layer
- **Use:** README hero, org profile, investor slides

---

## Screenshot Policy

- Screenshots are reviewed before each external presentation / investor meeting
- A screenshot is "current" if it reflects the current GA or Beta release
- Retired screenshots are moved to `archive/` and never deleted (for audit history)
- No personally identifiable information (PII) appears in any screenshot
- All screenshots use seeded demo data only
- No internal hostnames, tokens, or credentials visible

See `docs/governance/SCREENSHOT_POLICY.md` for full policy.

---

*Generated: April 21, 2026 — growth capital GitHub Rehaul*
