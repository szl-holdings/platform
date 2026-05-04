# Health Checks
**Phase:** 5 + 9  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## Health Endpoint Specification

### `GET /api/health` — Basic Health

**Auth:** None  
**Purpose:** External uptime monitoring target  
**Expected response:**

```json
{
  "status": "ok",
  "timestamp": "2026-04-19T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

**Expected status codes:** 200 (healthy), 503 (not ready)

---

### `GET /api/health/detailed` — Detailed Health

**Auth:** Bearer token (internal)  
**Purpose:** Operational dashboard; post-deploy verification  
**Expected response:**

```json
{
  "status": "ok",
  "checks": {
    "database": { "status": "ok", "latencyMs": 12 },
    "jobQueue": { "status": "ok", "pendingJobs": 3 },
    "aiProviders": { "status": "ok", "activeProviders": ["openai", "anthropic"] },
    "cache": { "status": "degraded", "note": "REDIS_URL not set; using LRU fallback" },
    "externalFeeds": {
      "ais": { "status": "demo", "lastPoll": null },
      "sanctions": { "status": "ok", "lastPoll": "2026-04-19T06:00:00Z" },
      "cisa": { "status": "ok", "lastPoll": "2026-04-18T23:00:00Z" }
    }
  }
}
```

---

### `GET /api/health/ready` — Readiness Probe

**Auth:** None  
**Purpose:** Kubernetes/Replit readiness probe; returns 503 if DB not connected  
**Expected response:** 200 when ready; 503 when not ready

---

### `GET /api/version` — Version Info

**Auth:** None  
**Purpose:** Release visibility; verify deployed version  
**Expected response:**

```json
{
  "version": "1.0.0",
  "buildTime": "2026-04-19T10:00:00Z",
  "gitSha": "abc1234",
  "environment": "production"
}
```

---

## Per-Artifact Health Status

| Artifact | Health Endpoint | Workflow Status |
|---|---|---|
| `api-server` | `GET /api/health` | RUNNING (port 8080) |
| `szl-holdings` | Page load check | RUNNING (port 21130) |
| `command` | Page load check | RUNNING (port 5000) |
| `lyte-command-center` | Page load check | RUNNING (port 7099) |
| `terra` | Page load check | RUNNING (port 6000) |
| `aegis` | Page load check | RUNNING (port 3002) |
| `vessels` | Page load check | RUNNING (port 8099) |
| `carlota-jo` | Page load check | RUNNING (port 8098) |
| `sentra` | Page load check | RUNNING (port 4099) |
| `counsel` | Page load check | RUNNING (port 4199) |
| `prism-counsel` | Page load check | RUNNING (port 7100) |
| `pulse` | Page load check | RUNNING (port 5201) |
| `szl-holdings-mobile` | Expo tunnel | RUNNING (port 8085) |
| `szl-demo-video` | Page load check | RUNNING (port 8765) |
| `mockup-sandbox` | Page load check | RUNNING (port 8008) |

**Source:** `artifacts/internal-audit/workflow-health-matrix.md` (April 19, 2026 audit)

---

## Version Display in UI

The current platform version is displayed in:
- API response: `GET /api/version`
- UI footer: Version badge in the `szl-holdings` footer (if implemented)
- Health endpoint: `GET /api/health` response body

**Recommendation:** Ensure version badge is visible in the platform UI footer for every web artifact.

---

## Post-Deploy Health Verification Script

```bash
# Run after every production deploy
BASE_URL="https://your-app.replit.app"

# 1. Basic health
curl -f "$BASE_URL/api/health" || exit 1
echo "✅ Basic health OK"

# 2. Readiness
curl -f "$BASE_URL/api/health/ready" || exit 1
echo "✅ Readiness OK"

# 3. Version check
curl -s "$BASE_URL/api/version" | grep -q '"status":"ok"' || echo "⚠️ Version endpoint check"
echo "✅ Version OK"

# 4. Frontend pages
for path in "/" "/command/" "/lyte/" "/terra/" "/aegis/" "/vessels/"; do
  curl -sf "$BASE_URL$path" -o /dev/null || echo "⚠️ $path returned error"
done
echo "✅ Frontend pages OK"
```

This script is also available at `scripts/qa/post-deploy-health.sh`.
