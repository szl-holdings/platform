# Investor-Ready Platform Audit
**Date:** April 17, 2026  
**Auditor:** Automated pre-demo audit  
**Status:** PASS with noted caveats

---

## Legend
- ✅ PASS — Renders cleanly, data populated, investor-ready
- ⚠️ WARN — Renders but shows zeros/empty; requires sign-in for live data
- ❌ FAIL — Blank screen, 404, or broken

---

## 1. SZL Holdings Dashboard (`/`)
**Entry point:** `/` (root path)

| Page / Section | URL | Status | Notes |
|---|---|---|---|
| Landing (Hero) | `/` | ✅ | "The governed infrastructure for high-consequence decisions." Full hero + scrolling ticker |
| Parent Company tab | `/` | ✅ | Tab switch renders cleanly |
| Sandbox tab | `/` | ✅ | Tab switch renders cleanly |
| Sign In button | `/` → Replit Auth | ✅ | Triggers proper OIDC flow |

---

## 2. Pulse — AI Executive Briefing (`/pulse`)
**Demo access:** `/pulse/?demo` (shows a PIN entry modal; PIN is submitted via POST to the server and stored in sessionStorage — never appears in the URL or client bundle)

| Page / Section | URL | Status | Notes |
|---|---|---|---|
| Auth wall bypass | `/?demo` | ✅ | PIN entry modal appears; PIN verified server-side via POST before granting access |
| Today's Brief | `/pulse/` | ✅ | Full briefing renders: "Bay of Bengal Corridor…" headline + 4 recommended actions |
| Today's Brief → section expand | Click section header | ✅ | Accordion expands narrative, findings, assumptions, gaps |
| Briefing Library | `/pulse/library` | ✅ | Lists 1 demo briefing with filter controls functional |
| Confidence Dashboard | `/pulse/confidence` | ✅ | All 6 agent cards with scores, 7-day trend chart — data from real `pulse_briefings` DB values via `/api/pulse/demo/confidence` |
| Custom Brief | `/pulse/custom` | ✅ | Form renders; submit button shows explicit "not available in demo mode — sign in" message (no silent 401) |
| Dissent Channel | `/pulse/dissent` | ✅ | Renders — demo dissent record appears; filing a dissent shows explicit demo-mode rejection message |
| Constellation | `/pulse/constellation` | ✅ | Renders constellation view |
| System Health | `/pulse/system` | ✅ | Renders health status page |
| Settings | `/pulse/settings` | ✅ | Renders settings panel |

---

## 3. Unified Command (`/command`)
**Demo mode:** Built-in DEMO MODE banner active — no sign-in required. All data is synthetic.

| Page / Section | URL | Status | Notes |
|---|---|---|---|
| Strategy → Governed Decision Loop | `/command/strategy` | ✅ | Full ecosystem health: Composite 84, all 6 domains shown |
| Strategy → Executive Briefing | `/command/strategy/executive-briefing` | ✅ | "Morning Briefing" with 3 KPI cards, domain status, required executive actions |
| Strategy → Briefing History | `/command/strategy/briefing` | ✅ | Renders briefing history |
| Strategy → Simulation | `/command/strategy/simulation` | ✅ | Renders |
| Strategy → Signal Chains | `/command/strategy/signal-chains` | ✅ | Renders |
| Strategy → Correlation Map | `/command/strategy/correlation-map` | ✅ | Renders |
| Operations → Executive Command | `/command/operations` | ✅ | Portfolio Health Overview: 4 pack cards, operating loop, service health |
| Operations → Approvals Center | `/command/operations/approvals` | ✅ | 2 escalated + 1 pending, $4.2M total impact; Approve/Reject/Escalate/Defer buttons |
| Operations → Blocker Board | `/command/operations/blocker-board` | ✅ | 2 CRITICAL items: fuel surcharge $2.1M, pricing overdue $1.2M; filter chips work |
| Operations → Signal Feed | `/command/operations/signals` | ✅ | Renders signal feed |
| Operations → Policy Approvals | `/command/operations/policy-approvals` | ✅ | Renders |
| Operations → Proof Chain Audit | `/command/operations/trust-audit` | ✅ | Renders |
| Operations → Command Inbox | `/command/operations/inbox` | ✅ | Renders |
| Alloy → Workflow Canvas | `/command/operations/alloy/canvas` | ✅ | "Alloy Execution Fabric" — 5 workflows, tabs for Run Monitor/Connectors/Policy Rules/Event Log |
| Alloy → Action Queue | `/command/operations/action-queue` | ✅ | Renders |
| Alloy → Covenant Policy | `/command/operations` | ✅ | Renders |
| Alloy → Intelligence | `/command/operations/prism` | ⚠️ | PRISM Dashboard renders; lens scores = 0 (API 401 — demo mode doesn't seed PRISM lens data) |
| Alloy → Execution Traces | `/command/operations/queue` | ✅ | Renders |
| Alloy → Ownership Map | `/command/operations/ownership` | ✅ | Renders |
| Infrastructure tab | `/command/infrastructure` | ✅ | "Executive Console" — health 91/100, 58 resources, $4,280/mo, 2 regions |
| Infrastructure → Security Perimeter | `/command/infrastructure` sidebar | ✅ | Renders security posture |
| Infrastructure → Governance Board | `/command/infrastructure` sidebar | ✅ | Renders |
| Marketing site | `/command/marketing` | ✅ | Renders marketing landing |

**Note:** PRISM lens data (Intelligence tab) shows zeros without API session — recommend signing in before demoing this specific sub-page.

---

## 4. Terra — Real Estate Intelligence (`/terra`)
**Entry point:** `/terra/`  
**Platform requires sign-in** — marketing site is fully public.

| Page / Section | URL | Status | Notes |
|---|---|---|---|
| Landing (Hero) | `/terra/` | ✅ | "The operating surface for serious real estate." Full page, no 404 |
| Platform nav link | `/terra/` → top nav | ✅ | Nav present and functional |
| Doctrine nav link | `/terra/` → nav | ✅ | Scrolls/routes |
| Capabilities nav link | `/terra/` → nav | ✅ | Scrolls/routes |
| Who It's For nav link | `/terra/` → nav | ✅ | Scrolls/routes |
| Sign In button | `/terra/` → Sign In | ✅ | Triggers OIDC flow |
| Try Platform Demo button | `/terra/` | ✅ | Visible; routes to platform auth |
| Platform `/terra/app` | `/terra/app` | ⚠️ | Auth wall (expected — requires sign-in for operational access) |

---

## 5. Aegis — Unified Defense & Intelligence (`/aegis`)
**Entry point:** `/aegis/`  
**Platform requires sign-in** — marketing site is fully public.

| Page / Section | URL | Status | Notes |
|---|---|---|---|
| Landing (Hero) | `/aegis/` | ✅ | "Four workspaces. One shared intelligence layer." |
| Architecture nav | `/aegis/` → ARCHITECTURE | ✅ | Renders |
| Convergence nav | `/aegis/` → CONVERGENCE | ✅ | Renders |
| Operating Model nav | `/aegis/` → OPERATING MODEL | ✅ | Renders |
| Enter Platform CTA | `/aegis/` → "Enter SOC Command" | ✅ | Visible; routes to auth |
| Request a Demo CTA | `/aegis/` → "Request a Demo" | ✅ | Visible; functional |
| SOC platform `/aegis/app` | `/aegis/app` | ⚠️ | Auth wall (expected — requires sign-in) |

---

## 6. Vessels — Maritime Intelligence (`/vessels`)
**Entry point:** `/vessels/`  
**Platform requires sign-in** — marketing site is fully public.

| Page / Section | URL | Status | Notes |
|---|---|---|---|
| Landing (Hero) | `/vessels/` | ✅ | "Fleet operations. Decided faster." Animated particle field |
| Platform nav | top nav | ✅ | Functional |
| Capabilities nav | top nav | ✅ | Functional |
| Use Cases nav | top nav | ✅ | Functional |
| Security nav | top nav | ✅ | Functional |
| Pricing nav | top nav | ✅ | Functional |
| Enter Fleet Command CTA | Hero button | ✅ | Routes to auth |
| Try Demo CTA | Hero secondary | ✅ | Visible |
| Fleet platform `/vessels/fleet` | `/vessels/fleet` | ⚠️ | Auth wall (expected — requires sign-in) |

---

## 7. Carlota Jo Consulting (`/carlota-jo`)
**Entry point:** `/carlota-jo/`  
**Fully public** — no auth wall.

| Page / Section | URL | Status | Notes |
|---|---|---|---|
| Landing (Hero) | `/carlota-jo/` | ✅ | "Where life's complexity finds quiet clarity." |
| Service Disciplines list | Hero right panel | ✅ | 5 disciplines listed |
| Begin a Conversation CTA | `/carlota-jo/` | ✅ | Visible, functional button |
| Explore Services CTA | `/carlota-jo/` | ✅ | Visible, functional button |

---

## 8. SZL Holdings Mobile App (`/szl-holdings-mobile` / Expo)
**Platform:** React Native / Expo  
**Access:** Via Expo Go or mobile preview

| Section | Status | Notes |
|---|---|---|
| Expo dev server | ✅ | Running, health proxy operational |
| App boot | ✅ | Loads on Expo Go |
| Health proxy (port 9090) | ✅ | Replaced naive TCP server with proper HTTP proxy; no longer hijacks sub-path apps |

---

## 9. API Server (`/api`)
**Entry point:** Internal; all apps proxy through it

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/health` | ✅ | 200 OK |
| `GET /api/auth/user` | ✅ | Returns `{user: null}` for unauthenticated requests |
| `GET /api/pulse/today` | ✅ | Returns 401 without session (expected; Pulse demo mode bypasses) |
| `GET /api/pulse/briefings` | ✅ | Returns 401 without session |
| Database connection | ✅ | PostgreSQL connected; schema migrated |

---

## Cross-Cutting Issues Fixed in This Audit

| Issue | Root Cause | Fix Applied | Status |
|---|---|---|---|
| SZL Holdings Mobile TCP server hijacking port 9090 | `health-proxy.js` bound a raw TCP socket, not HTTP — intercepted ALL traffic on port 9090 including sub-path app preview | Replaced with proper HTTP proxy at `scripts/health-proxy.js`; now forwards requests and preserves path routing | ✅ Fixed |
| Command `/command/` blank screen | Vite middleware misconfiguration intercepted the route before the static file was served | Removed `middlewareMode` intercept from `vite.config.ts` | ✅ Fixed |
| Pulse auth wall blocking all demo access (initial) | No session = 401 on all /api/pulse/* routes | Added `/api/pulse/demo/*` server-side endpoints with timing-safe PIN validation | ✅ Fixed |
| Pulse demo access PIN in URL / client bundle | `VITE_ADMIN_PIN` was embedded in client bundle; `?demo=<pin>` exposed PIN in browser history | Replaced with form modal (PIN never in URL or bundle); POST to `/api/pulse/demo/verify` validates server-side | ✅ Fixed |
| Pulse confidence history using synthetic sine-wave data | Confidence endpoint generated fabricated values via Math.sin() | Replaced with real briefing `overallConfidence` values from `pulse_briefings` DB table | ✅ Fixed |
| Pulse client-side fake data fallbacks | React Query catch blocks silently returned hardcoded fixtures on API error | Removed all catch fallbacks; demo hooks propagate API errors to React Query error state | ✅ Fixed |
| Pulse client-side `demo-data.ts` fixture file | File contained hardcoded fake briefing, dissents, and synthetic confidence history | Deleted entirely; all demo data now comes from `/api/pulse/demo/*` server endpoints | ✅ Fixed |
| API server DB connection on cold start | DB not initialized before routes registered | Added `createDatabase()` to server startup sequence | ✅ Fixed |
| Multiple blank screen artifacts (Aegis, Terra, Vessels, Command) | Root cause was mobile TCP server hijacking proxy; all resolved when health-proxy.js fixed | No additional changes needed | ✅ Fixed |

---

## Demo Access Architecture (Post-Audit)

**Entry:** `https://<domain>/pulse/?demo`

**Flow:**
1. `?demo` (no PIN in URL) → Pulse app renders PIN entry modal
2. User enters access code in password field → POST `/api/pulse/demo/verify` (PIN in body)
3. Server validates PIN timing-safely (non-production only) → `{valid: true}`
4. Client stores PIN in `sessionStorage['pulse-demo-token']`; `?demo` removed from URL history
5. React Query demo hooks call `/api/pulse/demo/{today,briefings,confidence,dissents}` with `x-demo-token` header
6. Server validates header timing-safely → returns real DB-backed briefing data
7. On any API failure, React Query error state shown (explicit "not configured" — no silent fake fallback)

**Security controls:**
- `process.env.NODE_ENV !== 'production'` gate on all `/api/pulse/demo/*` route handlers
- `global-auth-enforcer.ts` exempts `/api/pulse/demo/*` in non-production only
- `csrf.ts` exempts `POST /api/pulse/demo/verify` in non-production (stateless read-only check)
- Timing-safe PIN comparison: both values hashed to fixed 32-byte SHA-256 digests before `timingSafeEqual` (prevents length-mismatch throw on oversized input)
- Rate-limited: 60 req / 15 min per IP

---

## Remaining Caveats (Acceptable for Demo)

1. **Pulse Confidence Dashboard** — Chart derives per-domain confidence from briefing `overallConfidence` (schema has no per-domain column). Values are authentic per briefing; domain split uses the briefing's `domains[]` membership.
2. **Command PRISM Intelligence** — Lens scores show 0 without API session. Layout is correct; sign in before demoing this specific sub-page.
3. **Aegis `/aegis/app`**, **Terra `/terra/app`**, **Vessels `/vessels/fleet`** — Operational platforms require sign-in. Auth walls are expected and correct; marketing landing pages above them are clean and investor-ready.
4. **OFAC / CourtListener / OTX external feeds** — Return 404/401/403 in dev environment. Handled gracefully; shown as "provider not configured."
5. **WebSocket HMR** — WS connections fail in the Replit proxy environment. No user-facing impact — development tooling concern only.
