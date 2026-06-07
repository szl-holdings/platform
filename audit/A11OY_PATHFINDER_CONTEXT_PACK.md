# A11OY_PATHFINDER_CONTEXT_PACK.md — Repo Context Pack

**Produced by:** Pathfinder (Task #3489 — A11oy Operationalization Sweep)  
**Date:** 2026-04-25  
**Scope:** Full scan of SZL Holdings monorepo

---

## 1. Repository Identity

| Field | Value |
|-------|-------|
| Repository | SZL Holdings Platform |
| Monorepo manager | pnpm workspaces |
| Node.js requirement | 22+ |
| pnpm requirement | 10+ |
| Primary language | TypeScript 5.x |
| Database | PostgreSQL 16 (Drizzle ORM) |
| License | UNLICENSED (proprietary) |

---

## 2. Framework Inventory

| Layer | Framework / Tool | Notes |
|-------|-----------------|-------|
| Web frontend | React 18 + Vite 7 | All 12 web artifacts |
| CSS | Tailwind CSS v4 | Via `@tailwindcss/vite` plugin |
| Mobile | Expo (React Native) | `artifacts/szl-holdings-mobile` |
| API server | Express.js + TypeScript | `artifacts/api-server` |
| ORM | Drizzle ORM | `lib/db` |
| Auth | OIDC/PKCE (custom) | `lib/auth` |
| Testing | Vitest (unit), Playwright (E2E) | `tests/e2e/` |
| CI | GitHub Actions | `.github/workflows/` (20+ workflows) |
| Secret scanning | gitleaks v8.21.2 | `.gitleaks.toml` |
| Observability | OpenTelemetry + Pino | `lib/observability`, `artifacts/api-server/src/lib/` |

---

## 3. Artifact Registry

| Artifact ID | Kind | Preview Path | Status | Port |
|-------------|------|-------------|--------|------|
| artifacts/a11oy | web | /a11oy/ | ⚠️ FAILED — port 9090 conflict | 9090 |
| artifacts/aegis | web | /aegis/ | ✅ RUNNING | 3002 |
| artifacts/api-server | web | /api/ | ✅ RUNNING | varies |
| artifacts/carlota-jo | web | /carlota-jo/ | ✅ RUNNING | 8098 |
| artifacts/command | web | /command/ | ✅ RUNNING | 5000 |
| artifacts/counsel | web | /counsel/ | ✅ RUNNING | 4199 |
| artifacts/lyte-command-center | web | /lyte/ | ✅ RUNNING | 7099 |
| artifacts/mockup-sandbox | web | /nexus/ | ⚠️ FAILED — port timeout | 8008 |
| artifacts/pulse | web | /pulse/ | ✅ RUNNING | 5201 |
| artifacts/sentra | web | /sentra/ | ✅ RUNNING | 4099 |
| artifacts/szl-demo-video | video | /szl-demo-video/ | ✅ RUNNING | 8765 |
| artifacts/szl-holdings-mobile | mobile (Expo) | /szl-holdings-mobile/ | ⚠️ FAILED — port 9090 conflict | 9090 |
| artifacts/szl-holdings | web | / | ✅ RUNNING | 21130 |
| artifacts/terra | web | /terra/ | ✅ RUNNING | 6000 |
| artifacts/vessels | web | /vessels/ | ✅ RUNNING | varies |

**Root cause of port 9090 conflict:** Both `artifacts/a11oy` and `artifacts/szl-holdings-mobile` are assigned port 9090 in the Replit workspace configuration. Multiple REUSEPORT IPv6 sockets on 9090 are held by the Replit platform proxy layer and are not visible to user processes, making the port appear occupied at startup. Both artifacts cannot run simultaneously on the same port. Remediation requires reassigning one artifact to a different port via the Replit workspace `artifact.toml` configuration — this requires platform-level support as it is controlled by the `.replit` port mapping.

**Workflow summary:** 12/15 artifacts running | 3 failed (port conflict + platform timeout) | 3 utility workflows not started (brand-strings, nexus-smoke-e2e, security-tests)

---

## 4. Route Inventory (API Server)

The API server routes directory contains 100+ route files covering:

| Domain | Route Files |
|--------|------------|
| A11oy fabric | `a11oy-fabric-api.ts`, `a11oy-runtime-api.ts` |
| Security / Cyber | `aegis-intel.ts`, `aegis-modules.ts`, `aegis-pcap.ts`, `ai-safety.ts` |
| AI / Agent | `agent-autonomy.ts`, `agent-federation.ts`, `agent-mesh.ts`, `agent-os.ts`, `ai-engine.ts` |
| Maritime | `vessels.ts`, `vessels-fleets.ts` |
| Real estate | `terra.ts` |
| Legal | `counsel.ts`, `prism-counsel.ts` |
| Admin | `admin/users.ts`, `admin/orgs.ts`, `admin/roles.ts` |
| Observability | `analytics.ts`, `telemetry.ts` |
| Auth | `auth.ts`, `oidc.ts`, `scim.ts` |
| Health | `health.ts` |

**Pre-existing API server issue:** The `launch-publish-scheduler` background job fails on every tick with `column "campaign_id" does not exist` in `dos_content_calendar_items`. This is a schema migration ordering issue pre-dating this task. The server continues running normally; only the content calendar auto-publish feature is affected. Logged as a pre-existing issue, not introduced by this task.

---

## 5. Doctrine Status

| Doctrine Document | Present | Notes |
|------------------|---------|-------|
| `AGENTS.md` | ✅ | Authoritative operating doctrine |
| `docs/A11OY_DOCTRINE.md` | ✅ | Product thesis and operating philosophy |
| `docs/A11OY_AGENT_DOCTRINE.md` | ✅ | 18 named agents with specifications |
| `docs/A11OY_DEFINITION_OF_DONE.md` | ✅ | Full done checklist |
| `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md` | ✅ | Blocked claims, required qualifiers |
| `docs/A11OY_SCREENSHOT_DOCTRINE.md` | ✅ | Screenshot quality rules |
| `docs/A11OY_SECURITY_DOCTRINE.md` | ✅ | Security rules, secret hygiene |
| `docs/A11OY_RELEASE_DOCTRINE.md` | ✅ | Release readiness checklist, scoring |

**Doctrine drift:** No drift detected. All eight doctrine documents are present and current.

---

## 6. Known Gaps Status

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG019 | No Lighthouse CI performance regression guard | P2 | ⚠️ Open — being closed this task |
| KG020c | No virus/malware scanning on uploads | P2 | ⚠️ Partial — signature scanner exists; ClamAV-REST feature flag added this task |
| KG020d | No field-level encryption for PII columns | P2 | ⚠️ Open — encryption helper created this task |
| KG023 | SLI/SLO definitions absent | P2 | ⚠️ Open — SLI/SLO doc created this task |
| KG024 | Large vendor bundle sizes (1–1.7 MB) | P2 | ⚠️ Open — accepted risk with documented budget targets |
| KG025 | WCAG accessibility not audited | P2 | ⚠️ Open — initial audit report created this task |
| KG030 | PostHog product analytics not wired | P1 | ⚠️ Open — PostHog SDK integration planned, env contract documented |
| KG031 | `/status` page not live | P1 | ⚠️ Open — status route created this task |
| VD1 | No `security.txt` | P2 | ⚠️ Open — `security.txt` served from API server this task |
| GAP-001 | Firebase / Google credentials rotation | High | ✅ Documented — runbook exists at CREDENTIAL_ROTATION.md |

---

## 7. Screenshot Inventory

**Location:** `docs/assets/screenshots/current/` — 7 files  
**Location:** `screenshots/` — 188 files  
**Location:** `launch-shots/` — 7 files  

See `audit/A11OY_SCREENSHOT_FRESHNESS_SCORE.md` for per-screenshot evaluation.

---

## 8. Public Claims Surfaces Scanned

| File | Result |
|------|--------|
| `README.md` | Reviewed — see `audit/A11OY_PUBLIC_CLAIM_SAFETY_SCORE.md` |
| `SECURITY.md` | Clean — accurate security architecture description |
| `SUPPORT.md` | Clean — factual contact info only |
| `docs/A11OY_DOCTRINE.md` | Clean — uses correct qualifiers throughout |
| `docs/investor/` | Contains "SOC 2 roadmap" and correct qualifiers; no blocked claims found |

---

## 9. Security Posture Summary

| Control | Status |
|---------|--------|
| gitleaks scan (7,014 commits) | ✅ Clean |
| Secret scan (working tree) | ✅ Clean |
| Cross-tenant isolation | ✅ org_id scoping on all routes |
| SSRF guard | ✅ `lib/ssrf-guard.ts` applied |
| Timing-safe auth | ✅ `crypto.timingSafeEqual` |
| Dependency scan | ✅ `.github/workflows/dependency-review.yml` |
| CodeQL SAST | ✅ `.github/workflows/codeql.yml` |
| `security.txt` | ✅ Added this task |

---

*End of Pathfinder Context Pack — Task #3489*
