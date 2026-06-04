# SZL Holdings — Rollback and Canary Deployment Plan

**Purpose:** Define the rollback procedures and canary deployment strategy for the SZL platform.

**As of:** April 2026

---

## Rollback Procedures

### Code Rollback

**Current mechanism:** Replit checkpoint system
- Replit automatically creates checkpoints before each task merge
- Checkpoints include: codebase snapshot + chat session + database state
- Full git history is preserved

**Rollback procedure (application code):**

1. Navigate to Replit UI → Version history / Checkpoints
2. Identify the last known good checkpoint (before the problematic deploy)
3. Restore checkpoint
4. Verify API health: `GET /api/health` → `status: healthy`
5. Run smoke test: `pnpm qa:site`
6. Verify database schema is consistent (Drizzle schema should not need migration after rollback)
7. Restart all affected workflows
8. Confirm monitoring shows healthy state

**Emergency rollback (no Replit UI access):**
```bash
# Find last known good commit
git log --oneline | head -20

# Checkout last known good state
git checkout <commit-hash>

# Restart API server workflow
# Restart all affected frontend workflows
```

**Rollback decision criteria:**
- P0 incident that cannot be resolved within 30 minutes
- Data corruption detected
- Security vulnerability being actively exploited
- Error rate > 5% sustained for > 15 minutes

---

### Database Rollback

**Current mechanism:** Drizzle ORM forward-only schema management + Replit PostgreSQL snapshots

**Important constraint:** Drizzle uses `db:push` (forward-only). There is no automatic down-migration.

**Rollback procedure (database schema):**

1. For additive changes (new columns/tables added): No rollback needed — old code handles absence of new fields gracefully
2. For breaking changes (columns removed/renamed): Restore from Replit database snapshot
   - Navigate to Replit PostgreSQL → Snapshots
   - Restore snapshot from before the breaking migration
   - Verify data integrity with: `pnpm health:check`
3. Seed data rollback: Seed scripts are idempotent (`onConflictDoNothing`) — re-running is safe

**Pre-migration checklist:**
- [ ] Backup current database before any schema change
- [ ] Verify migration is additive (no destructive changes)
- [ ] Test migration against a copy of production data (when available)
- [ ] Have rollback procedure ready before applying

---

### Configuration Rollback

| Configuration | Rollback Method | Time to Restore |
|---|---|---|
| Environment variables / secrets | Revert in Replit Secrets; restart workflows | < 5 minutes |
| CORS_ORIGINS | Revert in Replit Secrets | < 5 minutes |
| Feature flags | Toggle in application config; restart | < 5 minutes |
| Stripe keys | Revert in Replit Secrets | < 5 minutes |

---

## Canary Deployment Plan

**Current state:** Replit does not natively support canary routing between artifact versions. The canary plan uses a phased user activation approach.

### Canary Strategy: Phased Tenant Activation

For significant feature releases, the platform will use phased tenant activation rather than traffic splitting:

**Phase 0 — Internal canary (Day 1–2)**
- New version deployed to Replit development environment
- Engineering team uses new version exclusively
- Monitor for P0/P1 signals
- Exit criteria: Zero P0/P1 incidents in 48 hours

**Phase 1 — Trusted beta (Day 3–5)**
- First enterprise customer or advisor given access
- Feature flag `FEATURE_<NAME>_CANARY=true` set for their workspace
- Monitor approval latency, signal routing, and error rate for that workspace
- Exit criteria: No degradation in customer experience; zero data anomalies

**Phase 2 — Expanded beta (Day 6–10)**
- Up to 20% of tenants activated via workspace-level feature flag
- Monitor aggregate error rate, latency, and business SLO metrics
- Exit criteria: Error rate not elevated vs. baseline; all SLOs met

**Phase 3 — General release (Day 11+)**
- Feature flag removed; all tenants on new version
- Monitor for 48 hours post-release

---

### Feature Flag System

Feature flags control rollout without code changes:

```typescript
// Feature flag check pattern
const isEnabled = process.env[`FEATURE_${FLAG_NAME}`] === 'true';

// Workspace-level feature flag check
const workspaceFlags = await db.select()
  .from(featureFlags)
  .where(eq(featureFlags.workspaceId, workspaceId));
```

**Active feature flags:**

| Flag | Default | Description |
|---|---|---|
| `FEATURE_ALLOY_ORCHESTRATION` | `true` | Alloy orchestration subsystem |
| `FEATURE_ALLOY_GOVERNANCE` | `true` | Alloy governance subsystem |
| `FEATURE_ALLOY_WEBHOOKS` | `true` | Alloy webhook delivery |
| `FEATURE_AUDIT_LOGGING` | `true` | Audit log capture |
| `ALLOY_WORKFLOW_AUTO_RUN` | `true` | Auto-run workflows on startup |
| `ALLOY_REQUIRE_APPROVAL_CRITICAL` | `true` | Require approval for critical operations |

**Adding a new flag for canary:**
1. Add flag to `.env.example` with description
2. Add flag check to relevant code path
3. Set `FEATURE_<NAME>=false` in production secrets
4. Activate for specific workspace by adding to `feature_flags` table

---

## Dependency Version Rollback

If a package upgrade causes issues:

```bash
# Check what changed
git diff HEAD~1 package.json

# Rollback to previous version
pnpm add <package>@<previous-version>

# Rebuild and restart
pnpm build
# Restart affected workflows
```

**Rollback prevention:** `pnpm audit:deps` should be run before any dependency upgrade to identify version conflicts.

---

## AI Model Rollback

If a new model version causes agent eval degradation or production issues:

1. Set model version environment variable to previous version:
   ```
   AGENT_MODEL_<DOMAIN>=<previous-model-id>
   ```
2. Restart AI engine service
3. Run eval suite against previous model version to confirm stability
4. Document the incident in the Decision Ledger as a `governance.agent.model.demoted` event

**Promotion gate:** New model versions must pass the eval gate (≥ 0.85 aggregate score, zero safety violations) before production promotion. This is the primary defense against model regression.

---

## Rollback Communication

| Scenario | Internal Communication | Customer Communication |
|---|---|---|
| Code rollback (< 30 min downtime) | Slack `#incidents` | None required |
| Code rollback (> 30 min downtime) | Slack `#incidents` + exec | Email to affected tenants |
| Database rollback | Slack `#incidents-p0` + exec | Email to all tenants (potential data impact) |
| AI model rollback | Slack `#incidents` | None (internal capability; no user-visible change) |

---

*This plan should be reviewed and practiced in a tabletop exercise before the platform's first enterprise customer goes live.*
