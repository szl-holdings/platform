# SZL Holdings — Production Readiness Package

_Prepared: March 30, 2026_

---

## 1. Environment Separation

### Core Infrastructure
| Variable | Development | Production | Status |
|----------|-------------|-----------|--------|
| NODE_ENV | development | production | Configured via Replit |
| DATABASE_URL | Replit PostgreSQL (dev) | Replit PostgreSQL (prod) | Configured — separate instances |
| SESSION_SECRET | Set in Replit secrets | Set in Replit secrets | Configured |
| PORT | Auto-assigned per artifact | Auto-assigned per artifact | Configured |
| REPL_ID | Auto-set by Replit | Auto-set by Replit | Platform-provided |
| REPLIT_DEV_DOMAIN | Auto-set by Replit | N/A (production domain) | Platform-provided |
| CORS_ORIGINS | Not set (dev allows all) | Must be set for production | Pending — set before deploy |
| ISSUER_URL | Default: https://replit.com/oidc | https://replit.com/oidc | Configured with default |

### AI Integration Keys
| Variable | Development | Production | Status |
|----------|-------------|-----------|--------|
| AI_INTEGRATIONS_OPENAI_API_KEY | Replit AI proxy | Replit AI proxy | Configured |
| AI_INTEGRATIONS_OPENAI_BASE_URL | Replit AI proxy URL | Replit AI proxy URL | Configured |
| AI_INTEGRATIONS_ANTHROPIC_API_KEY | Replit AI proxy | Replit AI proxy | Configured |
| AI_INTEGRATIONS_ANTHROPIC_BASE_URL | Replit AI proxy URL | Replit AI proxy URL | Configured |
| AI_INTEGRATIONS_GEMINI_API_KEY | Replit AI proxy | Replit AI proxy | Configured |
| AI_INTEGRATIONS_GEMINI_BASE_URL | Replit AI proxy URL | Replit AI proxy URL | Configured |

### Internal Tokens & Auth
| Variable | Development | Production | Status |
|----------|-------------|-----------|--------|
| ALLOY_INTERNAL_TOKEN | Set in Replit secrets | Set in Replit secrets | Configured |
| SESSION_TTL_MS | Default: 7 days | Default: 7 days | Configured with default |

### Feature Flags (env-based)
| Variable | Default | Description |
|----------|---------|-------------|
| FEATURE_ALLOY_ORCHESTRATION | true | Alloy orchestration subsystem |
| FEATURE_ALLOY_GOVERNANCE | true | Alloy governance subsystem |
| FEATURE_ALLOY_WEBHOOKS | true | Alloy webhook delivery |
| FEATURE_AUDIT_LOGGING | true | Audit log capture |
| ALLOY_WORKFLOW_AUTO_RUN | true | Auto-run workflows on startup |
| ALLOY_REQUIRE_APPROVAL_CRITICAL | true | Require approval for critical ops |
| ALLOY_MAX_BATCH_SIZE | 100 | Max batch processing size |

### Logging
| Variable | Default | Description |
|----------|---------|-------------|
| LOG_LEVEL | info | Pino log level (fatal/error/warn/info/debug) |

### Email (optional, graceful fallback if absent)
| Variable | Required | Description |
|----------|----------|-------------|
| RESEND_API_KEY | No | Resend API key for transactional email |
| SMTP_HOST | No | SMTP host (fallback to Resend) |
| SMTP_PORT | No | SMTP port (default: 587) |
| SMTP_USER | No | SMTP username |
| SMTP_PASS | No | SMTP password |
| SZL_INTERNAL_EMAIL | No | Internal notification email (default: team@szlholdings.com) |

### Billing (optional, Stripe integration)
| Variable | Required | Description |
|----------|----------|-------------|
| STRIPE_PRICE_STRATEGY_SESSION | No | Stripe price ID for strategy sessions |
| STRIPE_PRICE_PORTFOLIO_REVIEW | No | Stripe price ID for portfolio reviews |
| STRIPE_PRICE_ADVISORY_RETAINER | No | Stripe price ID for advisory retainer |

### Database Connection (alternative to DATABASE_URL)
| Variable | Status | Description |
|----------|--------|-------------|
| PGHOST | Platform-provided | PostgreSQL host |
| PGPORT | Platform-provided | PostgreSQL port |
| PGUSER | Platform-provided | PostgreSQL username |
| PGPASSWORD | Platform-provided | PostgreSQL password |
| PGDATABASE | Platform-provided | PostgreSQL database name |

## 2. Secret Management Audit

### Secrets properly stored in Replit Secrets (not in code):
- DATABASE_URL
- SESSION_SECRET
- ALLOY_INTERNAL_TOKEN
- AI_INTEGRATIONS_OPENAI_API_KEY
- AI_INTEGRATIONS_OPENAI_BASE_URL
- AI_INTEGRATIONS_ANTHROPIC_API_KEY
- AI_INTEGRATIONS_ANTHROPIC_BASE_URL
- AI_INTEGRATIONS_GEMINI_API_KEY
- AI_INTEGRATIONS_GEMINI_BASE_URL
- PGPASSWORD, PGHOST, PGPORT, PGUSER, PGDATABASE

### .env.example sanitized:
- All placeholder values use `YOUR_*_HERE` pattern
- No `sk_live_`, `sk-`, or real-looking tokens
- GitHub secret scanning bypass applied for historical commits

### No hardcoded secrets found in source code:
- All API keys read from `process.env`
- Session secret from environment variable
- Database URL from environment variable

## 3. Deployment Checklist

- [x] All 13 workflows start without errors
- [x] API server health endpoint returns `{"status":"healthy"}`
- [x] Database schema synced (drizzle push successful)
- [x] Seed data runs on startup (non-fatal if fails)
- [x] No TypeScript compilation errors in API server build
- [x] No duplicate export conflicts in shared libraries
- [x] .env.example sanitized for GitHub secret scanning
- [x] GitHub repository pushed and current
- [x] Non-core apps hidden from public navigation
- [x] Brand hierarchy enforced (Nimbus → Alloy complete)
- [ ] Rate limiting on public endpoints (recommended)
- [ ] CORS configuration for production domains
- [ ] Custom domain DNS configuration
- [ ] SSL/TLS via Replit deployment (automatic)

## 4. Rollback Procedures

### Code Rollback:
- Replit checkpoints are created automatically before each task merge
- Git history preserved: `git log --oneline` shows full commit history
- GitHub mirror at `stephenlutar2-hash/szl-holdings-platform` (master branch)
- To rollback: Replit UI → Checkpoints → select a previous checkpoint

### Database Rollback:
- Drizzle ORM manages schema via `db:push` (forward-only)
- Database snapshots available through Replit
- Seed data is idempotent (uses `onConflictDoNothing()`)
- No destructive migrations in current schema

### Emergency Procedures:
1. If API server crashes: Restart workflow from Replit UI
2. If database corruption: Restore from Replit DB snapshot
3. If deployment fails: Rollback to previous Replit checkpoint
4. If frontend broken: Each artifact independently deployable

## 5. Seed / Demo Mode Separation

### Seed Data (runs on every startup):
- `seedPlatformData()` — Products, feature flags, signals, workflows, readiness items
- Uses `onConflictDoNothing()` — safe to run repeatedly
- Non-fatal failure: logs warning but doesn't crash server

### Demo Data:
- Vessels: 10 simulated vessels with positions, readiness, fuel data
- INCA: Generated experiments, models, insights
- Firestorm: Mix of real SOC data and simulated threats
- Demo mode indicated by `DEMO` banner in Vessels UI

### Real Data:
- Terra: NYC Open Data API pipeline (5 sources, scheduled runs)
- Lyte: Platform signals and executive summary from canonical schema
- Auth: Real OIDC sessions and user management
- Feature flags: Controlled via API and admin panel

## 6. Logging Strategy

### API Server:
- **Logger**: Pino (structured JSON logging)
- **Levels**: FATAL, ERROR, WARN, INFO, DEBUG
- **Correlation IDs**: Every request gets a unique correlationId
- **Request logging**: Method, URL, status code, response time
- **Agent logging**: Run start/complete, event publishing, findings count

### Frontend:
- Vite HMR logs for development
- Browser console errors captured
- No production error reporting service configured yet

### Recommendations:
- Add Sentry DSN for production error tracking
- Configure log aggregation for production
- Set LOG_LEVEL=warn for production to reduce noise

## 7. Error Handling Strategy

### API Server:
- Global uncaughtException handler → graceful shutdown
- Global unhandledRejection handler → graceful shutdown
- Graceful shutdown with 10s timeout (closes HTTP server, job queue, DB pool)
- Per-route try/catch with structured error responses
- Non-fatal seed failures logged but don't crash

### Frontend:
- React error boundaries not globally configured (recommended)
- Lazy loading with Suspense fallbacks
- Query error handling via React Query (retry: false, staleTime: 5min)

### Recommendations:
- Add global React ErrorBoundary component
- Add Sentry browser SDK for production
- Add health check polling from frontend

## 8. Route Protection Review

### Public Routes (no auth required):
- SZL Holdings: `/`, `/ecosystem`, `/ventures`, `/founder`, `/contact`, `/legal/*`, `/trust`, `/investor`
- Vessels marketing: `/`, `/platform`, `/capabilities`, `/use-cases`, `/security`, `/pricing`, `/demo`
- Carlota Jo: `/`
- Stephen Site: `/`
- API health: `/api/health`
- API stephen: `/api/stephen/*`

### Protected Routes (auth required):
- All Alloy routes
- All Lyte routes
- Vessels dashboard routes
- All `/api/*` endpoints (except health and stephen)

### Issues Found:
- SZL Holdings `/admin` route has no frontend auth gate (API endpoints are protected)
- SZL Holdings `/kpis` route is publicly accessible
- Vessels marketing `/sign-in` page exists but sign-in flow not fully wired

## 9. Mobile / Responsive Pass

- All dashboard layouts received mobile drawer treatment (Task #125)
- Lyte layout: sidebar → mobile drawer with hamburger toggle
- Beacon/Terra layout: same mobile drawer pattern
- Alloy layout: mobile drawer + responsive padding
- MSP layout: mobile overlay sidebar
- SZL Holdings: Responsive navbar with mobile menu
- Carlota Jo: Responsive design
- Stephen Site: Responsive design

## 10. Performance Notes

### Current State:
- Vite dev servers: 280-2170ms cold start across artifacts
- API server build: ~1.5s via esbuild
- Response caching: SHORT (30s), MEDIUM (300s), LONG (3600s) on observability endpoints
- Database: Connection pooling configured (min: 2, max: 10)

### Recommendations for Production:
- Enable Vite production builds (minified, tree-shaken)
- Configure CDN for static assets
- Add Redis for session storage (currently in-memory)
- Enable HTTP/2 via deployment platform
- Add database query timeout (configured at 10s)
- Monitor slow queries (threshold: 500ms)

## 11. Verification Evidence (March 30, 2026)

### API Server Health Check:
```
GET /api/health → HTTP 200
{
  "status": "healthy",
  "timestamp": "2026-03-30T17:02:32.545Z",
  "uptime": 455.94s,
  "version": "0.0.0",
  "environment": "development",
  "node": "v24.13.0",
  "services": { "database": "configured", "server": "ok" }
}
```

### Public Page HTTP Status:
| Artifact | URL | HTTP Status |
|----------|-----|-------------|
| SZL Holdings | localhost:18490/ | 200 |
| Carlota Jo | localhost:21200/carlota-jo/ | 200 |
| Stephen Site | localhost:21130/stephen/ | 200 |
| Vessels | localhost:18485/vessels/ | 200 |

### Navigation Visibility:
- SZL Holdings Navbar.tsx: Zero references to Firestorm, Dreamscape, INCA, MSP
- Shared ecosystem-nav.tsx: Zero references to non-public apps
- Non-core apps accessible only via direct URL (not discoverable from public pages)

### All 13 Workflows Running:
- alloy, api-server, carlota-jo, dreamscape, firestorm, inca, lyte-command-center, mockup-sandbox, msp, stephen-site, szl-holdings, terra, vessels — all status: running
