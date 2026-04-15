# SZL Holdings — Demo Assets
## LinkedIn Investor Showcase Package

This folder contains all assets for the SZL Holdings LinkedIn investor showcase campaign.
Target audience: Series A investors, strategic partners, enterprise buyers.

---

## Contents

### Screenshots (`screenshots/`)

High-quality captures of each production web application:

| File | Application | Status | Preview Path |
|------|------------|--------|--------------|
| `szl-holdings-hero.jpg` | SZL Holdings Dashboard | ✅ Running | `/` |
| `carlota-jo-hero.jpg` | Carlota Jo Consulting | ✅ Running | `/carlota-jo/` |
| `terra-hero.jpg` | Terra — Real Estate Intelligence | ✅ Running | `/terra/` |
| `vessels-hero.jpg` | Vessels Maritime Intelligence | ✅ Running | `/vessels/` |
| `lyte-hero.jpg` | Lyte — Business Observability | ✅ Running | `/lyte-command-center/` |
| `prism-counsel-hero.jpg` | PRISM Counsel — Legal Command | ✅ Running | `/prism-counsel/` |
| `stephen-site-hero.jpg` | Stephen Lutar — Founder Site | ✅ Running | `/stephen/` |
| `command-hero.jpg` | Ecosystem Command Portal | ✅ Running | `/command/` |
| `firestorm-hero.jpg` | Aegis — Defense & Intelligence | 🔧 Fix Applied | `/firestorm/` |

**Not captured (routing fix applied, needs restart):**
- IMPERIUM — Cloud Sovereignty Engine (`/imperium/`)

---

### LinkedIn Content Files

| File | Format | Word Count | Usage |
|------|--------|------------|-------|
| `linkedin-carousel.md` | 10-slide carousel brief | ~1,400 words | Design-ready slide content with design notes |
| `linkedin-post-longform.md` | Single long-form post | ~1,100 words | Publish directly or paste into LinkedIn article |
| `linkedin-series.md` | 7-post series | ~3,500 words total | Schedule across 2-3 weeks |

---

## The SZL Holdings Ecosystem

Eleven production systems across five industries, all sharing one compounding architecture:

### Core Intelligence Layer
- **SZL Holdings Dashboard** — Business observability with explainable execution. The parent command surface: OBSERVE → UNDERSTAND → DECIDE → EXECUTE.
- **Ecosystem Command Portal** — Cross-portfolio signal aggregation powered by CORTEX AI.

### Vertical Platforms
- **Lyte** — Business observability. "In the dark, let Lyte guide you." Revenue stalls, approval bottlenecks, and ownership gaps surfaced before damage compounds.
- **Vessels** — Maritime intelligence. "Fleet operations. Decided faster." 214 vessels tracked, voyage economics, sanctions compliance.
- **Terra** — Real estate intelligence. "The operating surface for serious real estate." Distressed property discovery through deal execution.
- **PRISM Counsel** — Legal matter command. Matter observability, deadline risk queuing, AI settlement forecasting.

### Defense & Infrastructure
- **Aegis** — Unified defense and intelligence. Three workspaces: Defense (SOC, XDR), Command (NOC, managed operations), Labs (AI reasoning). MTTD < 4 min.
- **IMPERIUM** — Cloud sovereignty engine. Roman military hierarchy: Legion → Cohort → Century → Sentinel. Aquila Score 0-100 health. Praetorian Guard, Senate Chamber.

### Advisory & Human Layer
- **Carlota Jo Consulting** — Private advisory for principals who demand precision and discretion. "Where life's complexity finds quiet clarity."
- **Stephen Lutar** — Founder site. "I build command systems that close the loop from signal to decision to auditable action."
- **CORTEX** (mobile) — Unified command mobile app.

---

## Technical Architecture Notes

### Routing Fix (Applied in This Session)
All 11 web apps previously shared `localPort = 9090` via a reusePort health-check proxy, causing routing collisions where any app could answer requests meant for another.

**Fix applied:** Each app now has a unique proxy port:
- carlota-jo: 21201
- terra: 25101
- vessels: 18486
- lyte-command-center: 19291
- prism-counsel: 26501
- stephen-site: 5174
- command: 25201
- szl-holdings: 21130 (direct, no proxy needed)
- firestorm: 23932 (PORT direct, simplified)
- imperium: 3002 (PORT direct, simplified)

**Status:** All running apps have the unique-port fix active (applied via hot-reload). Firestorm and imperium have all config files updated and will come up correctly on the next platform restart.

### Shared Infrastructure
- Unified component library: `@szl-holdings/shared-ui`
- Shared authentication: `@szl-holdings/replit-auth-web`
- Intelligence bus: CORTEX (MCP-based AI orchestration)
- Design tokens: consistent across all 11 applications
- API backbone: `artifacts/api-server` (Fastify + PostgreSQL + Drizzle ORM)

---

## LinkedIn Campaign Approach

### Recommended Sequence
1. **Week 1:** Post the long-form article (`linkedin-post-longform.md`) on Tuesday morning
2. **Weeks 2-3:** Run the 7-post series (`linkedin-series.md`) every 2-3 days
3. **Week 4:** Share the carousel (`linkedin-carousel.md`) — produce in Canva/Figma first

### Carousel Production
The `linkedin-carousel.md` file is a design brief. To produce the final carousel:
1. Open Canva Pro or Figma
2. Create 1080×1080px slides (or 1080×1350 for portrait)
3. Use the dark background (#080a10), white headlines, accent colors per app
4. Drop in screenshots from `screenshots/` folder
5. Export as PDF for LinkedIn carousel upload

### Key Messages by Audience Segment
- **Series A investors:** Compounding architecture, structural moat, marginal cost thesis
- **Enterprise buyers (maritime/defense/real estate):** Domain-specific capability depth, decision intelligence, < 4min MTTD
- **Strategic partners:** Shared infrastructure opens co-development opportunities

---

## Contact

Stephen Lutar — Founder, CEO, Architect  
contact@stephenl.dev  
LinkedIn: /in/stephen-lutar (update with actual handle)
