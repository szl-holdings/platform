# Investor Demo Script — SZL Holdings Platform

**Date:** April 18, 2026  
**Version:** 2.0 — Launch-Readiness Audit Edition  
**Format:** ~25 minutes, screen-share, guided click-path  
**Audience:** Institutional investors / strategic partners  
**Previous version:** `docs/audit/demo-script.md`

---

## Pre-Demo Checklist

### Environment Setup (15 minutes before demo)

```bash
# Verify all workflows running
# In Replit workflow panel, confirm these are GREEN:
# - artifacts/szl-holdings: web
# - artifacts/command: web
# - artifacts/vessels: web
# - artifacts/terra: web
# - artifacts/aegis: web
# - artifacts/carlota-jo: web
# - artifacts/pulse: web
# - artifacts/api-server: api
```

1. **Sign in once** at: `https://<your-domain>/api/login`  
   (This sets a session cookie for all apps)

2. **Verify seed data is loaded:**
   ```bash
   pnpm seed:demo   # or: bash scripts/seed-demo-canonical.sh
   ```

3. **Configure Mapbox (required for map demos):**  
   - Replit Secrets → `MAPBOX_ACCESS_TOKEN` must be set  
   - Without this, Vessels tracking and Terra map views are blank  
   - **Do NOT demo Vessels/Tracking or Terra/Map if token is missing**

4. **Open tabs in advance:**
   - Tab 1: `/` — SZL Holdings landing
   - Tab 2: `/command/strategy` — Unified Command (Strategy)
   - Tab 3: `/command/operations` — Unified Command (Operations)
   - Tab 4: `/pulse/?demo` — Pulse Executive Briefing (demo mode)
   - Tab 5: `/vessels/` — Vessels Maritime
   - Tab 6: `/aegis/` — Aegis pitch deck
   - Tab 7: `/carlota-jo/` — Carlota Jo Advisory

5. **Test health endpoint:**
   ```
   GET https://<your-domain>/api/health/detailed
   ```
   Confirm all services show healthy.

---

## Avoidance Guide — What NOT to Click

> Before you demo, memorize this list. Clicking these will reveal visibly unfinished UI.

| Avoid | Why |
|-------|-----|
| Vessels → Platform module | UI complete; no data connected |
| Vessels → Tracking (if no Mapbox) | Map blank |
| Aegis → 5 of the 8 new security modules (Deception Grid, OT/ICS, Phishing Sim, DLP, ASM) | UI only — CISO Dashboard, ITDR, Sentinel are now live |
| szl-holdings → Autopilot genome score | Hardcoded placeholder |
| Command → CORTEX badge counts | Not wired to live counts |

---

## Segment 1 — The Platform Overview (~3 min)

**URL: `/`**

> "SZL Holdings is the governed infrastructure layer for high-consequence decisions. Every subsidiary — maritime, real estate, defense, consulting — runs on the same signal-to-decision loop."

Point to the ecosystem ticker: Alloy · Lyte · Aegis · Vessels · Terra · PRISM · CJ

> "Each of those is a live domain pack. Every decision made anywhere in the portfolio is captured, attributed, and traceable."

Click **"PARENT COMPANY"** and **"SANDBOX"** tabs to show dual-view architecture.

> "This is not a demo environment and a production environment. This is the same platform presenting two modes: the operating company and the sandbox where you experiment before committing."

Navigate to **Trust Center** (`/trust-center`):

> "Transparency is not a checkbox here. This trust center exposes our security posture, data handling, compliance certifications, and uptime in real time. An investor can review this independently."

---

## Segment 2 — Unified Command: The Operating System (~7 min)

### 2a. Strategy Layer
**URL: `/command/strategy`**

> "This is Command — the unified operating layer. Every subsidiary surfaces here. Note the composite health score — each domain is scored."

Point to the six domain health cards.

> "Terra is monitoring because we have positions approaching a maturity wall. That's not a crisis — it's the system detecting it 90 days in advance."

Click **"Executive Briefing"** (sidebar).  
**URL: `/command/strategy/executive-briefing`**

> "Every morning, the system generates a briefing — ecosystem health, domain status, and the exact actions waiting for executive sign-off."

Point to **"Required Executive Actions"** panel.

> "That approval recommendation has a model behind it. The AI computed a probability of savings and generated the justification. The executive approves or rejects with attribution."

### 2b. Operations Layer
**URL: `/command/operations`**

> "Switch to Operations. Portfolio Health Overview — the six-step loop: Observe, Evaluate, Decide, Approve, Act, Prove."

Point to the loop counter at the top.

> "31 actions have been proven effective this period. That's the feedback loop that makes the system smarter over time."

Click **"Approvals"** (sidebar).  
**URL: `/command/operations/approvals`**

> "Pending approvals — live. Each item has an Alloy Rationale: AI-generated justification for approving or rejecting. The system recommends; the human decides."

Click **"Blocker Board"** (sidebar).  
**URL: `/command/operations/blocker-board`**

> "The Blocker Board surfaces stuck things automatically. Fuel surcharge approval — $2.1M in limbo, blocked by Finance. The system doesn't wait for a human to notice. It escalates."

### 2c. Infrastructure
**URL: `/command/infrastructure`** (click INFRASTRUCTURE tab)

> "IMPERIUM — platform health at a glance. Resources, regions, cost, threat posture. Everything classified by data sensitivity."

---

## Segment 3 — Pulse: The Intelligence Layer (~5 min)

**URL: `/pulse/?demo`**

> "Pulse is the executive intelligence layer. Every morning at 6am, the system reads across all domains and delivers a structured briefing — in prose, with supporting data, and with the decisions that need attention today."

Navigate through a briefing section.

> "This isn't a dashboard. It's a synthesized narrative. The executive doesn't look at charts — they read a 5-minute summary and then act."

Click into a **Decision Summary**.

> "Every decision has a proof trail. Who recommended it, what data was cited, when it was approved, what the outcome was. That's what governed autonomy looks like."

---

## Segment 4 — Vessels: Maritime Intelligence (~5 min)

**URL: `/vessels/`**

> "The Vessels domain manages a maritime fleet. Position tracking, voyage P&L, incident response, sanctions screening."

Navigate to **Fleet Management** (`/vessels/fleet`).

> "Each vessel has a full telemetry profile. Speed, heading, port of call, risk flags."

Navigate to **Maritime Intelligence** (`/vessels/intelligence`).

> "Intelligence layer — dark vessel events, geopolitical shipping risk, sanctions flags. These are real signals from GDELT and OFAC."

Navigate to **Port Analysis** (`/vessels/ports`).

> "Port analysis — congestion, weather risk, dwell time benchmarks."

**If Mapbox token is configured:**  
Navigate to **Vessel Tracking** (`/vessels/tracking`).

> "Vessel tracking — live map. Each dot is a vessel in our simulated fleet. In production, this connects to AIS feeds."

**If no Mapbox token:** Skip this route.

---

## Segment 5 — Terra: Real Estate Intelligence (~3 min)

**URL: `/terra/`**

> "Terra manages the real estate portfolio. Deal management, market intelligence, valuation tools."

Navigate to **Market Analysis** (`/terra/market`).

> "This pipeline pulls from NYC Open Data in real time — property distress signals, foreclosure filings, liens. Real public data, processed and ranked."

Navigate to **Portfolio** (`/terra/portfolio`).

> "Portfolio view — each position, performance, risk flags."

---

## Segment 6 — The Investment Case (~2 min)

**URL: `/aegis/`** (Aegis investor pitch deck)

> "This is the investor-facing version of the platform narrative. Let me walk you through the key slides."

Navigate through the pitch deck slides.

> "The core claim is this: every high-consequence organization needs a governed decision layer. We've built it. We've proven the architecture works across maritime, real estate, security, and advisory. We're now capitalizing to scale."

---

## Handling Awkward Questions

**Q: "Is this live data or demo data?"**  
A: "The intelligence feeds — NOAA weather, GDELT geopolitics, NYC property records, CISA threat intelligence — those are live. The portfolio metrics and transaction histories are seeded demo data, which is appropriate pre-revenue. Everything is labeled clearly: Demo, Pilot, or Live."

**Q: "What's real-time and what's batch?"**  
A: "Intelligence feeds run on cron schedules — some hourly, some daily. The decision loop itself is event-driven — when a trigger fires, the system responds in near-real-time. Approval notifications are synchronous."

**Q: "What happens when something breaks?"**  
A: "Sentry monitors all 6 apps and the API server. We have structured logging via pino and health check endpoints that expose service status in detail. The system degrades gracefully — a failed intelligence feed doesn't take down the platform."

---

## Post-Demo

After the demo session:
1. Share the Trust Center URL with investors: `<your-domain>/trust-center`
2. Share the API health page: `<your-domain>/api/health/detailed`
3. Offer technical due diligence access to the codebase

---

*See also: `docs/audit/KNOWN_LIMITATIONS.md` for what not to show; `docs/audit/RELEASE_READINESS.md` for Gate 1 checklist*
