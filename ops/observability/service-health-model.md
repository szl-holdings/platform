# Service Health Model

Last updated: 2026-04-16

## Health Endpoint Architecture

The API server exposes a tiered health check system designed for different consumers:

### Tier 1: Liveness (`/api/health/live`)

**Purpose:** Kubernetes/container orchestrator liveness probe.

- Always returns `200 {"status": "ok"}` if the process is running
- No dependency checks — pure process liveness
- Zero latency, no I/O

### Tier 2: Readiness (`/api/health/ready`, `/api/ready`)

**Purpose:** Load balancer readiness probe.

- Checks PostgreSQL connectivity with 3-second timeout
- Returns `200 {"status": "ready"}` if DB is reachable
- Returns `503 {"status": "degraded"}` if DB is unreachable
- Response includes server uptime

### Tier 3: Health (`/api/health`)

**Purpose:** Monitoring systems, status pages.

- Checks: database connectivity + latency, job queue status, storage availability, auth configuration, AI provider status
- Returns `200 {"status": "healthy"}` if all systems nominal
- Returns `503 {"status": "degraded"}` if any subsystem is degraded
- Includes memory usage (heap, RSS), uptime, platform app registry
- Public — no authentication required

### Tier 4: Detailed Health (`/api/health/detailed`)

**Purpose:** Internal operations dashboard, on-call debugging.

- Everything in Tier 3 plus:
  - Database connection pool stats (total/idle/waiting)
  - Job queue depth (pending/running/completed/failed)
  - Telemetry snapshot (P95 latency, error rate, active alerts)
- **Production:** Requires authenticated session or `X-Internal-Token` header
- **Development:** No auth enforced

## Health Status Taxonomy

| Status | Meaning | HTTP | Action |
|--------|---------|------|--------|
| `ok` / `healthy` | All systems nominal | 200 | None |
| `warning` | Elevated metrics but functional | 200 | Monitor closely |
| `degraded` | Subsystem unhealthy, reduced capability | 503 | Investigate |
| `backpressure` | Queue depth exceeds threshold (>50) | 200 | Reduce load |
| `not_configured` | Subsystem not enabled | 200 | Expected in dev |
| `unavailable` | Subsystem cannot be reached | 503 | Alert |

## Subsystem Checks

| Subsystem | Check Method | Degradation Impact |
|-----------|-------------|-------------------|
| Database | `SELECT 1` with 3s timeout | All reads/writes fail |
| Job Queue | `durableJobQueue.getStats()` | Background processing stops |
| Storage | Bucket ID env var check | File uploads/downloads fail |
| Auth | `SESSION_SECRET` presence | Sessions use ephemeral keys |
| AI | Provider key presence | AI features return mock/fallback |
| Telemetry | `serverTelemetry.getSnapshot()` | Monitoring blind spot |

## Self-Monitoring

The API server runs `lib/self-monitor.ts` which polls `/api/health/detailed` every 5 minutes. Alert thresholds:

| Metric | Warning | Critical |
|--------|---------|----------|
| Error rate | > 2% | > 5% |
| P95 latency | > 1000ms | > 2000ms |
| Database status | — | `degraded` or `unavailable` |
| Queue depth | > 25 | > 50 |
| Heap usage | > 82% of 512MB limit | > 92% of limit |

## Memory Management

The server monitors heap usage on a 20-second interval:

| Threshold | Action |
|-----------|--------|
| 70% (358MB) | Silent GC if available |
| 82% (420MB) | Warning log + GC |
| 92% (471MB) | Error log + double GC |

## AI Provider Health

Active health probes (via `providerHealth.startActiveProbes()`) check OpenAI, Anthropic, and Gemini every 2 minutes. Results available via:
- Startup log: `[startup] API server fully ready — configuration summary`
- Runtime: `providerHealth` status in detailed health endpoint

## Platform App Registry

Health endpoints include a `platform.apps` array listing all canonical artifacts:

| Slug | Name | Type |
|------|------|------|
| `szl-holdings` | SZL Holdings Dashboard | command_surface |
| `command` | Unified Command | command_surface |
| `aegis` | Aegis — Defense & Intelligence | domain_pack |
| `terra` | Terra — Real Estate Intelligence | domain_pack |
| `vessels` | Vessels — Maritime Intelligence | domain_pack |
| `carlota-jo` | Carlota Jo Consulting | domain_pack |
| `szl-holdings-mobile` | CORTEX — Mobile Command | mobile |
| `api-server` | API Server | backend |

## Startup Sequence Health

The bootstrap sequence reports a comprehensive startup matrix:

1. Migrations complete
2. Platform flags loaded
3. Knowledge store loaded
4. Durable job queue started
5. Embedding worker started
6. Agent schedules registered
7. Durable scheduler started
8. Demo seeds (if enabled)
9. Ingestion framework initialized
10. `[bootstrap] Bootstrap sequence complete — server fully ready`

If any step fails fatally, the server logs `Schema bootstrap failed` and calls `process.exit(1)`.

---

*See also: [slo-sli-catalog.md](slo-sli-catalog.md) · [otel-plan.md](otel-plan.md) · [alerting-and-runbooks.md](alerting-and-runbooks.md)*
