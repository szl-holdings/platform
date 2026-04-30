# Deployment Matrix & Branch Strategy

**Owner:** Engineering (Founder)  
**Last updated:** April 2026  
**Version:** 1.0

---

## Branch Strategy

### Model: Trunk-Based Development

SZL Holdings uses trunk-based development with `main` as the single always-deployable branch.

```
main  ←── feature/*, fix/*, chore/*, docs/* branches (short-lived, merged within days)
```

**Rationale:** At founder-scale, trunk-based development eliminates merge debt, keeps deployment simple, and ensures `main` is always in a deployable state.

**Branch naming:**
```
feature/<short-description>     # New functionality
fix/<short-description>          # Bug fixes
chore/<short-description>        # Non-functional maintenance
docs/<short-description>         # Documentation only
release/<semver>                 # Optional: used to freeze a release for tagging
hotfix/<short-description>       # Emergency production fixes
```

**Branch protection (configure in GitHub):**
- `main` requires all CI status checks to pass before merge
- Force-push to `main` is disabled in production phase
- At scale (>2 engineers): require at least 1 pull request review

---

## Environment Matrix

| Environment | Purpose | Deployment Trigger | Data | URL Pattern |
|-------------|---------|-------------------|------|------------|
| **Local / Dev** | Active development | Automatic (Replit workflow) | Seeded demo data | `*.replit.dev` |
| **Preview** | Stakeholder review, QA | Manual — Replit deploy (non-prod slot) | Seeded demo data | Replit preview URL |
| **Production** | Live product | Manual — tagged release, CI passing | Real data | Production Replit deploy |

### Environment-Specific Configuration

| Config Item | Development | Preview | Production |
|-------------|-------------|---------|------------|
| `NODE_ENV` | `development` | `staging` | `production` |
| CORS | Open (all origins) | Restricted to preview domain | Restricted to production domains |
| Helmet CSP | Disabled | Enabled | Enabled |
| HSTS | Disabled | Disabled | Enabled |
| Rate limiting | Relaxed | Standard | Standard + strict on auth |
| Cache headers | Development defaults | Standard | `no-store` on API |
| Database | Dev/seeded | Preview DB | Production DB (isolated) |
| Secrets | Dev placeholders | Preview secrets | Production secrets |

---

## Artifact Deployment Details

### Web Applications

All web apps are React + Vite SPA artifacts.

| Artifact | Preview Path | Build Output | API Dependency |
|----------|-------------|-------------|----------------|
| SZL Holdings (homepage) | `/` | `dist/` | None (mostly static) |
| Aegis | `/aegis/` | `dist/` | API Server required |
| Terra | `/terra/` | `dist/` | API Server required |
| Vessels | `/vessels/` | `dist/` | API Server required |
| Carlota Jo | `/carlota-jo/` | `dist/` | API Server required |
| Command | `/command/` | `dist/` | API Server required |
| ~~Firestorm~~ | ~~`/firestorm/`~~ | — | **Archived** — superseded by Aegis |
| ~~Counsel~~ | ~~`/prism-counsel/`~~ | — | **Deprecated** — consolidated into Aegis |
| ~~Stephen Site~~ | ~~`/stephen/`~~ | — | **Deprecated** — consolidated into szl-holdings |

### API Server

| Item | Detail |
|------|--------|
| Runtime | Node.js 22.x |
| Framework | Express + TypeScript |
| Port | `$PORT` (Replit-injected) |
| Health endpoints | `/api/health`, `/api/health/live`, `/api/health/ready`, `/api/health/detailed` |
| Migration gate | `pnpm --filter db push` must run before new app version starts |

### Mobile Applications (Expo)

| App | Bundle Identifier | EAS Build Profile | OTA Updates |
|-----|------------------|------------------|-------------|
| Lyte Mobile | `com.szlholdings.lyte` | `production` | Enabled |
| Aegis Mobile | `com.szlholdings.aegis` | `production` | Enabled |
| Vessels Mobile | `com.szlholdings.vessels` | `production` | Enabled |
| Terra Mobile | `com.szlholdings.terra` | `production` | Enabled |
| SZL Holdings Mobile | `com.szlholdings.szl` | `production` | Enabled |
| Carlota Jo Mobile | `com.szlholdings.carlotajo` | `production` | Enabled |

---

## Rollback Procedures

### Web App Rollback (any web artifact)

1. Open Replit deployment dashboard for the affected artifact
2. Navigate to "Deployments" history
3. Select previous successful deployment
4. Click "Roll back"
5. Verify smoke tests pass (see below)
6. Document rollback in incident log

**Time to rollback:** ~2 minutes (instantaneous for stateless SPAs)

### API Server Rollback

1. Determine if the rollback requires a database migration reversal:
   - If new schema was applied: restore from pre-migration backup (see `docs/internal/security/backup-restore.md`)
   - If no schema changes: rollback is safe to execute immediately
2. Roll back via Replit deployment dashboard
3. Verify all smoke tests pass
4. Monitor error rate for 10 minutes post-rollback

**Time to rollback:** ~5 minutes without migration reversal; ~30 minutes with

### Mobile App Rollback

**Expo OTA (fastest — no store required):**
```bash
eas update:rollback --channel production --group <previous-group-id>
```

**App Store (iOS) rollback:**
1. App Store Connect → App → Version History
2. Select previous approved version
3. Submit for expedited review (Apple may take 1–24 hours)

**Google Play rollback:**
1. Google Play Console → Production → Releases
2. Select previous release → "Roll back to this release"
3. Confirm — takes effect within 1–2 hours globally

---

## Smoke Test Protocol

Execute after every production deployment before marking release complete:

### API Server Smoke Tests

```bash
# 1. Liveness
curl -f https://$API_URL/api/health/live

# 2. Readiness (DB connected)
curl -f https://$API_URL/api/health/ready

# 3. Detailed health (internal token required)
curl -H "x-internal-token: $ALLOY_INTERNAL_TOKEN" https://$API_URL/api/health/detailed

# 4. Auth endpoint reachable
curl -f https://$API_URL/api/auth/providers

# 5. API docs accessible
curl -f https://$API_URL/api/docs
```

### Web App Smoke Tests

- [ ] Homepage loads without console errors
- [ ] Login flow completes (can reach authenticated dashboard)
- [ ] Primary domain-specific view loads (e.g., Lyte signals page)
- [ ] No 4xx/5xx errors in browser developer console network tab

### Mobile App Smoke Tests

- [ ] App launches without crash
- [ ] Authentication screen renders
- [ ] Login completes successfully
- [ ] Primary dashboard view loads with data

---

*See also: [Release Governance](release-governance.md) · [Release Checklist](release-checklist.md) · [Incident Response](../internal/ops/incident-response-runbook.md)*
