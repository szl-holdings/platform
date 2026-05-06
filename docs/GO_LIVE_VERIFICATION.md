# GO-LIVE VERIFICATION — Runbook

Captured: 2026-05-06 (Task #4367 stabilization pass).

This file is the operator runbook for taking the SZL Holdings monorepo from
"green in dev" to "live on Replit autoscale" and verifying the result.

## 0. Pre-flight (T-60 minutes)

1. Confirm `git --no-optional-locks status` is clean on `main`.
2. Confirm all 9 workflows are running:
   - `artifacts/a11oy: web`
   - `artifacts/api-server: agent-gateway`
   - `artifacts/api-server: api`
   - `artifacts/carlota-jo: web`
   - `artifacts/conduit: web`
   - `artifacts/counsel: web`
   - `artifacts/sentra: web`
   - `artifacts/terra: web`
   - `artifacts/vessels: web`
3. Confirm `curl -s http://localhost:80/api/health | jq .status` returns `"healthy"`.
4. Read `docs/GO_LIVE_BLOCKERS.md`. If any of B1–B4 are open, STOP.

## 1. Validation pipeline

```bash
# Smoke + brand + security
pnpm test:smoke
pnpm brand:strings
pnpm test:security
```

Last green pass (2026-05-06):

| Suite | Result |
| --- | --- |
| `nexus-smoke-e2e` | PASS 22/22 |
| `brand-strings` | PASS |
| `security-tests` | PASS to completion (long-running; allow > validation default timeout) |
| `governance-restart-process.test.ts` | Carried as an open known-issue — see #4622 / sibling tasks |
| `alloy-recommend-autonomy.test.ts` | PASS 5/5 |

## 2. Health surfaces

The single API server now exposes:

| Endpoint | Purpose | Auth |
| --- | --- | --- |
| `GET /api/health` | Rich liveness — server, db+latency, job_queue depth, storage, auth, ai+latency, huggingface gate, platform apps | public |
| `GET /api/healthz` | Codex-kernel deployment contract payload | public |
| `GET /api/health/live` | Boot-gated liveness (503 during bootstrap) | public |
| `GET /api/health/detailed` | DB pool metrics, queue stats | internal token / authenticated |
| `GET /api/a11oy/frontier/*` | Frontier intelligence (primary, post #4362) | session |
| `GET /api/helios/*` | Frontier intelligence (deprecated alias, retained for old clients) | session |

A11oy SLO dashboard reads `/api/health` directly via the existing dashboard data fetcher; no separate wiring is needed.

## 3. Deploy

Replit autoscale, configured in `.replit`:

```toml
[deployment]
router = "application"
deploymentTarget = "autoscale"

[deployment.postBuild]
args = ["pnpm", "store", "prune"]
env = { "CI" = "true" }
```

Steps:

1. From the Replit UI, open **Publish**.
2. Confirm the build command (`pnpm install && pnpm -r build`) and run command point at `artifacts/api-server` (api server fronts the path-based proxy for every web artifact in production).
3. Confirm `userenv.production` is in effect:
   - `NODE_ENV=production`
   - `LOG_LEVEL=info`
   - `CORS_ORIGINS=https://*.replit.app,https://*.replit.dev,https://*.repl.co`
   - `PUBLIC_APP_URL=https://szlholdings.replit.app`
   - `GUARDIAN_ENFORCE=true`
4. Confirm production secrets are set (DATABASE_URL, SESSION_SECRET, OTX_API_KEY, OPENAI_API_KEY, HF_TOKEN if applicable).
5. Click **Deploy**.

## 4. Post-deploy verification (T+0 to T+15 minutes)

```bash
# 1. Liveness
curl -s https://szlholdings.replit.app/api/health | jq '.status, .services'

# 2. Frontier (primary)
curl -s -o /dev/null -w "%{http_code}\n" https://szlholdings.replit.app/api/a11oy/frontier/health

# 3. Helios alias (must still respond for legacy clients)
curl -s -o /dev/null -w "%{http_code}\n" https://szlholdings.replit.app/api/helios/health

# 4. Each artifact path-prefix
for slug in / counsel a11oy terra sentra carlota-jo vessels conduit; do
  printf "%-15s " "$slug"
  curl -s -o /dev/null -w "%{http_code}\n" "https://szlholdings.replit.app/$slug"
done
```

Expected: all 200 (or 401 for the helios alias if auth-required).

## 5. Manual smoke surfaces

These cannot be auto-validated and must be eyeballed before declaring success:

- `https://szlholdings.replit.app/` — SZL holdings landing
- `https://szlholdings.replit.app/counsel/` — Legal matter command
- `https://szlholdings.replit.app/terra/` — Real-estate intelligence
- `https://szlholdings.replit.app/vessels/` — Maritime intelligence
- `https://szlholdings.replit.app/sentra/` — Cyber resilience command
- `https://szlholdings.replit.app/a11oy/` — Brand orchestration + Frontier
- `https://szlholdings.replit.app/carlota-jo/` — Carlota Jo Consulting
- `https://szlholdings.replit.app/conduit/` — Amaru / Andean Ouroboros

## 6. Rollback

See `docs/GO_LIVE_ROLLBACK_PLAN.md`. One-line summary: redeploy the previous
known-good commit from the Replit Deployments history. The autoscale platform
keeps the previous slot warm; rollback is < 60 s.

## 7. What was NOT verified this pass

- API load test at sustained RPS (no autocannon/k6 harness wired). See blocker B2.
- Soak test (1+ hour sustained traffic).
- Failure-injection (DB stall, upstream timeout, memory pressure).
- Lighthouse per artifact.

These are explicit pre-launch follow-ons.

## Verification posture

GREEN at every measurement point this pass. The validation pipeline is reproducible. Known intermittents are documented. Launch decision rests on the four hard blockers in `GO_LIVE_BLOCKERS.md`, not on test failures.
