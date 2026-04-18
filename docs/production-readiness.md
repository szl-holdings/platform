# SZL Holdings — Production Readiness Package

_Updated: April 3, 2026_

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
| CORS_ORIGINS | Not set (dev allows all) | Must be set for production | **Pending — set before deploy** |
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

### Error Tracking (Sentry)
| Variable | Required | Description |
|----------|----------|-------------|
| `SENTRY_DSN` | No — graceful fallback | Server-side Sentry DSN. Captures uncaught exceptions, Express errors, and PostgreSQL query errors in the API server. Obtain from your Sentry project → Settings → Client Keys. |
| `SENTRY_TRACES_SAMPLE_RATE` | No | Fraction of transactions sampled for performance traces (default: `0.1`). Range: `0.0`–`1.0`. |
| `SENTRY_PROFILES_SAMPLE_RATE` | No | Fraction of sampled traces that also collect CPU profiles (default: `0.1`). |
| `VITE_SENTRY_DSN` | No — graceful fallback | Frontend Sentry DSN. Injected at Vite build time. Shared across `szl-holdings`, `command`, and `vessels` frontends. Can be the same DSN as the server or a separate Sentry project per environment. |

**Setup steps:**
1. Create a Sentry project at [sentry.io](https://sentry.io) (free tier supports up to 5K errors/month).
2. Copy the DSN from Settings → Client Keys (DSN).
3. Set `SENTRY_DSN` and `VITE_SENTRY_DSN` in Replit Secrets before deploying.
4. Optionally configure a Slack alert rule in Sentry: Project → Alerts → Create Alert → set threshold (e.g. error rate > 5 events/min) → action: notify Slack channel.

> **If `SENTRY_DSN` is not set:** The API server starts normally without error tracking — no crash risk. Errors are still captured in Pino structured logs.

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
| STRIPE_SECRET_KEY | No | Stripe secret key (live mode for production) |
| STRIPE_WEBHOOK_SECRET | No | Stripe webhook signing secret |
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

---

## 2. External Credentials Required

### Must be obtained before live production launch:

| Credential | Provider | Where Used | Status |
|------------|----------|-----------|--------|
| `STRIPE_SECRET_KEY` (live) | Stripe dashboard | Billing, invoices, subscriptions | **Not configured** — demo mode only |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard | Webhook signature verification | **Not configured** |
| `RESEND_API_KEY` | Resend.com | Transactional email delivery | Optional — falls back silently |
| `OBJECT_STORAGE_BUCKET_ID` | Replit Object Storage | File uploads, assets | Optional — falls back to local |
| Production `DATABASE_URL` | Replit PostgreSQL (prod instance) | All database operations | Separate from dev DB |
| `CORS_ORIGINS` | Manual config | Production CORS policy | **Must set before deploy** |

### External service dependencies (paid, third-party):

> **Deployment clarification (updated April 16, 2026):** The platform is hosted on **Replit** (autoscale deployment), not Azure App Service or Azure infrastructure. Azure AD/Entra ID and Azure Power BI in the table below are **enterprise feature integrations** (SSO, embedded analytics) — not the deployment or hosting target. See `docs/architecture/canonical-deployment-model.md` for the authoritative deployment doctrine.

| Service | Purpose | Tier | Notes |
|---------|---------|------|-------|
| Stripe | Payment processing | Paid | Requires live key for real charges |
| Resend | Email delivery | Free tier available | 100 emails/day free |
| Replit Object Storage | File/asset storage | Paid (Replit) | Object storage plan required |
| OpenAI / Anthropic / Gemini | AI inference | Via Replit AI proxy | No extra key needed in dev |
| Azure AD / Entra ID | Enterprise SSO, SCIM | Enterprise Azure subscription | Feature integration only — required for corporate tenant SSO |
| Azure Power BI | Embedded analytics | Power BI Pro/Premium | Feature integration only — required for per-tenant Power BI embed |
| SendGrid / Twilio | (Optional) SMS/push | Paid | Not currently wired |

---

## 3. Tenant Consent Requirements

### Before onboarding enterprise tenants:
1. **Terms of Service** — Tenant must accept SZL Holdings MSA/ToS (currently in `/legal/terms`)
2. **Data Processing Agreement (DPA)** — Required for GDPR/CCPA compliance if tenant has EU/CA users
3. **Azure AD Consent** — Admin consent required in tenant's Azure AD for Entra ID integration
4. **SCIM Provisioning Consent** — IT admin must configure SCIM endpoint in IdP (Okta, Azure AD, etc.)
5. **Power BI Embed Consent** — Tenant must grant read access to their Power BI workspaces
6. **Webhook URL Whitelist** — Tenant's firewall must allow outbound to Replit deployment domain

---

## 4. Domain / DNS Requirements

### For production deployment:
- **Primary domain**: `szlholdings.com` — requires DNS A/CNAME pointed to Replit deployment
- **API subdomain** (optional): `api.szlholdings.com` — or use path-based `/api/` routing (current)
- **Wildcard SSL**: Replit handles SSL automatically via deployment
- **Custom domains per artifact**: Each app (`vessels.szlholdings.com`, etc.) requires separate DNS entry
- **Email domain**: SPF/DKIM records needed for `@szlholdings.com` sender domain (Resend or SMTP)
- **Webhook endpoints**: Must be accessible from Stripe, GitHub, and other webhook sources

---

## 5. Security Review Items

### Completed:
- [x] Session secret stored in Replit Secrets (not in code)
- [x] Database URL stored in Replit Secrets
- [x] No raw API keys hardcoded in source
- [x] `.env.example` uses `YOUR_*_HERE` placeholders
- [x] CSRF middleware on all state-mutating routes
- [x] Helmet.js with production CSP headers
- [x] Rate limiting on auth and write endpoints
- [x] Admin routes behind `requireRole("admin")` middleware
- [x] OIDC-based authentication (Replit Auth) — no password storage
- [x] Audit log for all admin actions
- [x] Immutable proof chain for governed workflows
- [x] SQL injection prevention via Drizzle ORM parameterized queries

### Pending / Recommended before launch:
- [ ] CORS_ORIGINS must be set to production domains before deploy
- [ ] Rate limiting on public marketing pages (currently no limit)
- [x] Sentry SDK integrated — API server + 3 frontend apps (szl-holdings, command, vessels)
- [ ] Set `SENTRY_DSN` and `VITE_SENTRY_DSN` in Replit Secrets to activate error tracking
- [ ] Configure external uptime monitor for `/api/health` (see `docs/observability-setup.md`)
- [ ] Configure Sentry Slack/email alert rules (see `docs/observability-setup.md`)
- [ ] Log aggregation service (Logtail, Datadog, etc.) for production
- [ ] Security headers audit for all frontend apps
- [ ] DDoS mitigation (Cloudflare proxy recommended in front of Replit)
- [ ] Penetration testing for admin endpoints before handling sensitive data
- [ ] Review and harden Content Security Policy for each artifact
- [ ] Set SESSION_TTL_MS appropriately for production (shorter for sensitive apps)

---

## 6. Recommended Rollout Order

### Phase 1 — Core Platform (Week 1)
1. Configure production `DATABASE_URL` and run `db:push`
2. Set `CORS_ORIGINS` to production domains
3. Deploy API server — verify `/api/health` returns healthy
4. Deploy SZL Holdings public site
5. Deploy Lyte Command Center (auth required)
6. Run `pnpm health:check` against production URL

### Phase 2 — Product Apps (Week 2)
7. Deploy Vessels (maritime intelligence)
8. Deploy Terra (real estate intelligence)
9. Deploy Aegis/Firestorm (security command)
10. Configure Stripe live keys — test billing flow
11. Configure Resend for transactional email

### Phase 3 — Enterprise Features (Week 3+)
12. Azure AD SCIM provisioning for first enterprise tenant
13. Power BI embed configuration per tenant workspace
14. Custom domain DNS configuration per artifact
15. CDN setup (Cloudflare) for asset caching
16. Error monitoring (Sentry) deployment

---

## 7. Quality Validation Scripts

All scripts are available via `pnpm` from the workspace root:

| Script | Purpose | Command |
|--------|---------|---------|
| `audit:mocks` | Detect mock data in production paths | `pnpm audit:mocks` |
| `audit:routes` | Verify all registered routes exist as files | `pnpm audit:routes` |
| `audit:copy` | Find stale/placeholder copy | `pnpm audit:copy` |
| `audit:deps` | Check dependency version conflicts | `pnpm audit:deps` |
| `audit:design-system` | Check for hardcoded colors/fonts | `pnpm audit:design-system` |
| `audit:broken-links` | Find broken internal imports | `pnpm audit:broken-links` |
| `audit:all` | Run all audits sequentially | `pnpm audit:all` |
| `health:check` | Ping API health endpoints | `pnpm health:check` |
| `qa:site` | Smoke test public routes | `pnpm qa:site` |

---

## 8. Secret Management Audit

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

---

## 9. Deployment Checklist

- [x] All 16 workflows configured and startable
- [x] API server health endpoint returns comprehensive status
- [x] Database schema synced (drizzle push successful)
- [x] Seed data runs on startup (non-fatal if fails)
- [x] No TypeScript compilation errors in API server build
- [x] No duplicate export conflicts in shared libraries
- [x] .env.example sanitized for GitHub secret scanning
- [x] Admin routes protected with RBAC middleware
- [x] Quality audit scripts implemented and documented
- [x] Ops Console available at `/command/admin/ops`
- [ ] CORS_ORIGINS configured for production domains
- [ ] Rate limiting on public endpoints
- [ ] Custom domain DNS configuration
- [x] Sentry SDK integrated (API server + 3 frontend apps) — set SENTRY_DSN to activate
- [ ] SSL/TLS via Replit deployment (automatic)

---

## 10. Rollback Procedures

### Code Rollback:
- Replit checkpoints created automatically before each task merge
- Git history preserved: `git log --oneline` shows full commit history
- To rollback: Replit UI → Checkpoints → select previous checkpoint

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

---

## 11. What Is Real vs. What Needs External Setup

### Currently Real (works today):
- Replit OIDC authentication — fully wired, real sessions
- PostgreSQL database — real data, real queries
- Drizzle ORM schema — real migrations, seeded data
- API server — real Express routes, real middleware
- Lyte business observability — real signals, real scoring
- Terra NYC Open Data ingestion — real public data pipeline
- Firestorm security scenarios — real structured data, real scoring
- Vessels fleet intelligence — real structured data (simulated positions)
- Alloy workflow engine — real durable execution, real audit trail
- PRISM Counsel matter management — real data structure, real search
- Job queue — real background job execution
- Audit logging — real immutable event trail
- Feature flags — real runtime flag system
- Proof chain — real action attribution tracking

### Requires External Setup Before Being "Live":
- **Stripe payments** — currently in demo mode; needs `STRIPE_SECRET_KEY` (live)
- **Email delivery** — gracefully degraded without `RESEND_API_KEY`; no emails are sent in dev
- **Azure AD SSO** — real integration code exists; needs tenant admin consent per organization
- **Power BI embed** — real embed code exists; needs per-tenant Power BI workspace access token
- **SCIM provisioning** — real endpoint exists; needs IdP admin configuration per tenant
- **Object Storage** — falls back to local filesystem without `OBJECT_STORAGE_BUCKET_ID`
- **Production domain** — DNS and custom domain configuration required for public access
- **Error monitoring** — Sentry SDK integrated in code; requires `SENTRY_DSN` and `VITE_SENTRY_DSN` set in Replit Secrets to activate. See `docs/observability-setup.md`.
- **External uptime monitoring** — `/api/health` endpoint is ready; requires configuration in Better Uptime / UptimeRobot / Freshping. See `docs/observability-setup.md`.

---

## 12. Verification Evidence (April 3, 2026)

### API Server Health Check (enhanced):
```
GET /api/health → HTTP 200
{
  "status": "healthy",
  "timestamp": "2026-04-03T...",
  "uptime": 1234,
  "uptime_human": "0h 20m 34s",
  "version": "0.0.0",
  "environment": "development",
  "node": "v24.x.x",
  "memory": { "heapUsedMb": 145, "heapTotalMb": 350, "rssMb": 220, "heapUsedPct": 41 },
  "services": {
    "server": { "status": "ok" },
    "database": { "status": "ok", "latencyMs": 3 },
    "job_queue": { "status": "ok", "depth": 0 },
    "storage": { "status": "configured" },
    "auth": { "status": "configured" },
    "ai": { "status": "configured" }
  }
}
```

### Quality Scripts — Expected Pass State:
| Script | Expected Result | Notes |
|--------|----------------|-------|
| `pnpm audit:mocks` | PASS | No blocking mock patterns in production paths |
| `pnpm audit:routes` | PASS | All registered routes exist as files |
| `pnpm audit:copy` | PASS | No lorem ipsum or placeholder text |
| `pnpm audit:deps` | PASS (advisory) | Version conflicts are advisory, not blocking |
| `pnpm audit:design-system` | PASS | No blocking design token violations |
| `pnpm audit:broken-links` | PASS | All lazy imports resolve to existing files |
| `pnpm health:check` | PASS | API health endpoints responding |

---

## ATLAS Spatial Runtime — Production Readiness

### Readiness Status: Functional Alpha

| Dimension | Status | Notes |
|-----------|--------|-------|
| Export adapters | ✅ Implemented | JSON snapshot, branch package, proof bundle, OpenUSD manifest stub |
| Feature flags | ✅ Registered | 5 flags in platform-flags.ts |
| Demo seed data | ✅ Ready | 4 canonical demo scenes, `pnpm seed:atlas` |
| Unit tests | ✅ Passing | 48+ tests across 5 test files |
| Integration tests | ✅ Passing | All 4 export adapters + 4 domain scenarios |
| Documentation | ✅ Complete | Architecture, buyer, trust, investor, demo docs |
| OpenUSD / NIM integration | 🔧 Stub only | Roadmap item — requires NVIDIA USD SDK + NIM endpoint |
| Snapshot compaction automation | 🔧 Documented | Policy defined, implementation is a future ops item |
| Route handlers for export APIs | 🔧 Not implemented | Out of scope — adapters ready for route integration |

### Commands

```bash
pnpm seed:atlas       # Seed all 4 canonical demo scenes
pnpm qa:atlas         # Verify seed completeness
pnpm test:atlas       # Run all ATLAS tests
```

### Proof-Chain Retention Policy

Proof chain entries for ATLAS are retained for the lifetime of the organization record and are never purged. This includes: scene snapshots, drift Guard critical entries (score ≥ 0.75), branch proposals, approval decisions, and export records.

### Snapshot Compaction Policy (Documented, Not Yet Automated)

Full-resolution snapshots are retained for 72 hours, hourly checkpoints for 30 days, and monthly aggregates indefinitely. Intra-hour changes beyond 72 hours are not individually recoverable — this is by design to prevent unbounded storage growth.

### Demo vs. Production Isolation

Demo mode is controlled by `DEMO_MODE=true` or `NODE_ENV !== "production"`. In demo mode, scene state is served from the seeded snapshot store. Demo scenes carry `metadata.demo: true` and are always seeded under the demo organization. Production scenes can never be confused with demo scenes.
