# SZL Holdings Platform Health Report

**Date:** 2026-03-28 UTC  
**Scope:** Full platform debug, stress test, and smoke test across all apps + API server  
**Test Script:** `scripts/smoke-test.sh`  
**Post-Rebase Note:** Dreamscape and Nimbus artifacts were removed upstream; this report reflects the current 17-app platform state.

---

## 1. API Health Endpoints (18/18 PASS)

All health endpoints return HTTP 200:

| Endpoint | Status | Result |
|---|---|---|
| `/api/rosie/health` | 200 | PASS |
| `/api/aegis/health` | 200 | PASS |
| `/api/beacon/health` | 200 | PASS |
| `/api/zeus/health` | 200 | PASS |
| `/api/vessels/health` | 200 | PASS |
| `/api/inca/health` | 200 | PASS |
| `/api/firestorm/health` | 200 | PASS |
| `/api/dreamera/health` | 200 | PASS |
| `/api/alloyscape/health` | 200 | PASS |
| `/api/lutar/health` | 200 | PASS |
| `/api/lyte/health` | 200 | PASS |
| `/api/carlota-jo/health` | 200 | PASS |
| `/api/szl-holdings/health` | 200 | PASS |
| `/api/career/health` | 200 | PASS |
| `/api/readiness/health` | 200 | PASS |
| `/api/apps-showcase/health` | 200 | PASS |
| `/api/event-bus/health` | 200 | PASS |
| `/api/contact/health` | 200 | PASS |

---

## 2. Protected Endpoint Auth Tests (11/11 PASS)

Protected endpoints correctly return 401 for unauthenticated requests:

| Endpoint | Status | Result |
|---|---|---|
| `GET /api/event-bus/events` | 401 | PASS |
| `GET /api/event-bus/notifications` | 401 | PASS |
| `GET /api/event-bus/stats` | 401 | PASS |
| `GET /api/beacon/metrics` | 401 | PASS |
| `GET /api/beacon/projects` | 401 | PASS |
| `GET /api/extensions/notifications` | 401 | PASS |
| `GET /api/szl-holdings/portfolio` | 401 | PASS |
| `GET /api/szl-holdings/ecosystem-health` | 401 | PASS |
| `GET /api/rosie/threats` | 401 | PASS |
| `GET /api/aegis/compliance-matrix` | 401 | PASS |
| `GET /api/carlota-jo/inquiries` | 401 | PASS |

---

## 3. Public Data Endpoints (14/14 PASS)

| Endpoint | Status | Result |
|---|---|---|
| `GET /api/inca/projects` | 200 | PASS |
| `GET /api/inca/experiments` | 200 | PASS |
| `GET /api/vessels/fleet` | 200 | PASS |
| `GET /api/career/profile` | 200 | PASS |
| `GET /api/career/skills` | 200 | PASS |
| `GET /api/career/certifications` | 200 | PASS |
| `GET /api/career/timeline` | 200 | PASS |
| `GET /api/career/case-studies` | 200 | PASS |
| `GET /api/career/all` | 200 | PASS |
| `GET /api/szl-holdings/metrics` | 200 | PASS |
| `GET /api/szl-holdings/company` | 200 | PASS |
| `GET /api/szl-holdings/team` | 200 | PASS |
| `GET /api/szl-holdings/investor-brief` | 200 | PASS |
| `GET /api/event-bus/event-types` | 200 | PASS |

---

## 4. Form Submission Tests (3/3 PASS)

| Form | Endpoint | Payload | Status | Result |
|---|---|---|---|---|
| General Contact | `POST /api/contact` | name, email, message, inquiryType | 200 | PASS |
| Carlota Jo Inquiry | `POST /api/carlota-jo/inquiries` | name, email, message, service | 200 | PASS |
| Platform Access Request | `POST /api/contact/access-request` | name, email, company, reason, requestedApp | 200 | PASS |

---

## 5. Frontend App Serving (16/16 PASS)

All frontend apps serve their index page correctly:

| App | URL | Status | Result |
|---|---|---|---|
| Aegis Security | `/aegis/` | 200 | PASS |
| AlloyScape Infrastructure | `/alloyscape/` | 200 | PASS |
| Apps Showcase | `/apps-showcase/` | 200 | PASS |
| Beacon Analytics | `/beacon/` | 200 | PASS |
| Career Portfolio | `/career/` | 200 | PASS |
| Carlota Jo Consulting | `/carlota-jo/` | 200 | PASS |
| DreamEra Creative | `/dreamera/` | 200 | PASS |
| Firestorm Security Lab | `/firestorm/` | 200 | PASS |
| INCA Intelligence | `/inca/` | 200 | PASS |
| Lutar Command Center | `/lutar/` | 200 | PASS |
| Lyte Observability | `/lyte/` | 200 | PASS |
| Readiness Report | `/readiness-report/` | 200 | PASS |
| ROSIE Cybersecurity | `/rosie/` | 200 | PASS |
| SZL Holdings | `/szl-holdings/` | 200 | PASS |
| Vessels Maritime | `/vessels/` | 200 | PASS |
| Zeus Architecture | `/zeus/` | 200 | PASS |

---

## 6. Per-App Navigation Route Verification

All apps use client-side routing (wouter). Routes verified via source inspection:

| App | Key Routes | Register Fix Applied | SPA Routing |
|---|---|---|---|
| aegis | `/`, `/register`, `/login`, `/dashboard` | Yes | OK |
| alloyscape | `/`, `/register`, `/login`, `/dashboard` | Yes | OK |
| apps-showcase | `/`, catalog, details | No (no Register) | OK |
| beacon | `/`, `/register`, `/login`, `/dashboard` | No (compatible) | OK |
| career | `/`, `/skills`, `/timeline`, `/contact` | No (no Register) | OK |
| carlota-jo | `/`, `/services`, `/contact` | No (no Register) | OK |
| dreamera | `/`, `/register`, `/login`, `/dashboard` | Yes | OK |
| firestorm | `/`, `/register`, `/login`, `/dashboard` | Yes | OK |
| inca | `/`, `/register`, `/login`, `/projects`, `/experiments` | Yes | OK |
| lutar | `/`, `/register`, `/login`, `/dashboard` | No (compatible) | OK |
| lyte | `/`, `/register`, `/login`, `/dashboard` | Yes | OK |
| readiness-report | `/`, report views | No (no Register) | OK |
| rosie | `/`, `/register`, `/login`, `/dashboard` | No (compatible) | OK |
| szl-holdings | `/`, `/portfolio`, `/ecosystem`, `/contact` | No (no Register) | OK |
| vessels | `/`, `/register`, `/login`, `/fleet` | Yes | OK |
| zeus | `/`, `/register`, `/login`, `/dashboard` | Yes | OK |

---

## 7. TypeScript Type Checking

**`pnpm typecheck` — PASS (zero errors)**

All artifacts + libs compiled successfully.

---

## 8. Production Build

**`pnpm build` — PASS**

All frontend apps and API server built successfully.

---

## 9. Issues Found & Fixed

### Fix 1: Event-bus notification 401 spam
- **File:** `lib/ui/src/components/ecosystem-bar.tsx`
- **Problem:** `NotificationBell` component polled `/api/event-bus/notifications` every 30 seconds regardless of auth state, generating constant 401 responses in server logs for unauthenticated users.
- **Fix:** Added early return when no `szl_token` exists in localStorage. Applied to `fetchNotifications`, `markRead`, and `markAllRead` functions.

### Fix 2: TypeScript Register route type errors (8 apps, post-rebase)
- **Files:** `App.tsx` in aegis, alloyscape, dreamera, firestorm, inca, lyte, vessels, zeus
- **Problem:** `Register` components define custom `RegisterProps` (`{ onSuccess, onBack }`) incompatible with wouter's `RouteComponentProps`. Using `component={Register}` on `<Route>` caused TS2322 errors.
- **Fix:** Changed from `component={Register}` to render function pattern `{() => <Register />}`.
- **Note:** Previously applied to 10 apps; dreamscape and nimbus were removed upstream during rebase.

---

## 10. Rebase Resolution

During rebase, two `DU` (deleted-upstream, updated-by-us) conflicts were resolved:
- `artifacts/dreamscape/src/App.tsx` — accepted upstream deletion
- `artifacts/nimbus/src/App.tsx` — accepted upstream deletion

Our Register route fixes for the remaining 8 apps were preserved cleanly.

---

## 11. Overall Platform Status

| Category | Tested | Passed | Failed |
|---|---|---|---|
| API Health | 18 | 18 | 0 |
| Auth Protection | 11 | 11 | 0 |
| Public Data | 14 | 14 | 0 |
| Form Submissions | 3 | 3 | 0 |
| Frontend Serving | 16 | 16 | 0 |
| TypeScript | all | all | 0 |
| Build | all | all | 0 |
| **Total** | **62+** | **62+** | **0** |

**HEALTHY** — All systems operational. No critical issues remaining.
