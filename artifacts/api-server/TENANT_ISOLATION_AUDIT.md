# Tenant Isolation Audit — Route Handler Org Scoping

**Task:** #1415  
**Scope:** `artifacts/api-server/src/routes/` — ALL route files audited  
**Pattern used:** `inArray(table.orgId, getUserOrgIds(req.user))` for list queries; `assertTenantAccess(req, res, record.orgId)` for single-record lookups; orgId in WHERE for mutations.

---

## Summary of Changes

### Files Fixed (this task)

| File | Endpoints Fixed | Guard Type |
|------|----------------|-----------|
| `governance.ts` | `GET /budgets`, `/cost-events`, `/incidents`, `/cost-summary`, `/policies`, `/model-routing`; `GET /policies/:id`; PATCH/DELETE mutations; `POST /cost-events` budget update | `inArray` on list (typed as `SQL[]`); `assertTenantAccess` on single record; orgId in WHERE on mutations (incl. `AND org_id` on budget spend update); `requireRole` on `/analytics` |
| `files.ts` | `GET /files` (list), `GET /files/:id`, `GET /files/:id/preview`, `DELETE /files/:id`, `GET /assets` | `inArray` on list; `assertTenantAccess` on single record; JOIN on assets |
| `compliance.ts` | `GET /compliance/posture`, `/suitability`, `/archival`, `/supervision`, `/calendar`; PATCH `/suitability/:id/review`, `/supervision/:id/action` | `inArray` on list; orgId in WHERE on mutations; orgId stamped on INSERT |
| `billing.ts` | `GET /billing/subscriptions`, `/invoices`, `/fulfillments`; `GET /billing/entitlements/check` | `inArray` on list; `assertTenantAccess` on entitlement check |
| `prism-counsel-purview.ts` | `GET /purview/case-links`, `/hold-awareness`, `/export-handoffs`, `/scope-links`, `/diagnostics`, `/bridge-summary`; `POST /diagnostics/run`, `/export-handoffs/:id/confirm` | Fixed IDOR — replaced attacker-controlled `req.query.orgId` with `req.user`-derived orgId; upgraded `authMiddleware({ required: false })` to `authMiddleware()` |
| `signal-bus.ts` | `GET /rules`, `/events`, `/dead-letters`; `PUT /rules/:ruleId`; `DELETE /rules/:ruleId` | `inArray` with `String()` conversion for text `org_id` column on reads + `and()` on mutations |
| `atlas-artifacts.ts` | `GET /atlas/artifacts/:id`, `PATCH /atlas/artifacts/:id`, `POST /:id/regenerate`, `GET /:slug/versions`, `GET /:idA/compare/:idB`, `POST /:id/share`, `POST /:id/export`, `GET /export-jobs/:id`, `GET /export-jobs/:id/download`; fixed `user?.orgId` → `req.user?.orgs?.[0]?.orgId` on create/list/export | `assertTenantAccess` on all single-artifact endpoints (detail, update, regenerate, share, export, compare, version-history); org-filtered download; org-stamped create/export |
| `prism-counsel-purview.ts` | All 8 endpoints: `case-links`, `hold-awareness`, `export-handoffs`, `scope-links`, `diagnostics`, `diagnostics/run`, `export-handoffs/:id/confirm`, `bridge-summary` | Replaced unsafe `?? 1` fallback with `getCallerScope()` (`elevated` / `org` / `none`) derived from `getUserOrgIds(req.user!)`. Elevated users see all orgs (no filter), org users filter by their orgId, no-org users get empty results (reads) or 403 (writes). Removed attacker-controlled `orgId` from request schemas. |
| `vessels-cognitive.ts` | `GET /vessels/cognitive/owner-graph` | `inArray(orgId)` on vessel query; upgraded to `authMiddleware()` |
| `governance-counts.ts` | `GET /pending` | `inArray(orgId)` on approvalRequestsTable count; early return for empty orgs |
| `multiplayer-sessions.ts` | `POST /sessions/command` (create/join), `GET /sessions/command` (list), `GET /sessions/command/:sessionId` (detail), `DELETE /sessions/command/:id`, `GET/POST /sessions/command/:sessionId/comments` | `assertTenantAccess` on session join, detail, and comment endpoints; `inArray(orgId)` on list (typed as `(SQL\|undefined)[]`); `and(eq(id), orgFilter)` on delete; upgraded ALL endpoints from `authMiddleware({ required: false })` to `authMiddleware()` |
| `signal-bus.ts` (stats) | `GET /stats` | Added org-filtered counts for rules, events, dead-letters (uses `String()` conversion for text orgId) |
| `crm.ts` | `POST /crm/sync/:crmType` | `inArray(orgId)` on connectorsTable query; scopes sync to caller's org connectors |

### Already Correct (verified, no changes needed)

| File | Reason |
|------|--------|
| `vessels-extended.ts` | All queries already use `inArray(orgId)` via `getVesselsOrgWhere()` |
| `vessels-digital-twin.ts` | Already scoped with `inArray(orgId)` on all vessel queries |
| `vessels-psc.ts` | Uses `orgWhere` helper consistently |
| `vessels-platform.ts` | All list/detail queries already org-filtered |
| `prism-counsel-core.ts` | All pcMatters queries already use `inArray(orgId)` |
| `prism-counsel-court.ts` | Court schedule queries already org-scoped |
| `prism-counsel-ops.ts` | Ops queries already org-filtered |
| `prism-counsel-ny.ts` | NY-specific queries already org-scoped |
| `counsel.ts` | Uses `inArray(orgId)` on pcMatters throughout |
| `cortex.ts` | Full org-scoping via `inArray(orgId)` and `assertTenantAccess` on all endpoints |
| `alloy-cognitive-learning.ts` | Outcome learning and agent corrections already org-filtered |
| `constellation-views.ts` | Saved views scoped by `createdBy` (user-level) |
| `agent-mesh.ts` | Agent operations already scoped via `inArray(orgId)` |
| `invitations.ts` | Invitation queries already org-scoped |
| `org-settings.ts` | Settings queries inherently org-scoped |
| `usage.ts` | Usage queries already org-filtered |
| `scim.ts` | SCIM queries already org-scoped |
| `executive-briefings.ts` | Briefing queries already org-filtered |
| `briefing.ts` | Daily briefings already org-scoped via `req.user?.orgs?.[0]?.orgId` |
| `storage.ts` | Upload endpoint already validates org membership; private objects use ACL checks |
| `contact.ts` | Public contact form submission; admin-gated list routes via `adminGuard` |
| `analytics-engine-public.ts` | Public anonymous analytics ingest (write-only, no reads, no auth by design) |
| `approvals.ts` | Uses `loadAccessibleApproval()` and `callerOrgIdForGuard()` |
| `vessels.ts` | Uses `*OrgWhere()` helper functions and `req.tenantOrgId` throughout |
| `onboarding.ts` | Onboarding flow queries already org-scoped |
| `analytics-engine.ts` | Mounted behind group-level `tenantScope({ required: true })` in data-services group |

### Intentionally Unscoped (documented exceptions)

| File | Reason |
|------|--------|
| `forge.ts` | Platform-level agent registry — agents are shared across tenants by design |
| `action-store.ts` | Public/unauthenticated demo state endpoint; no user context available |
| `risk-evidence.ts` | Public/unauthenticated risk evidence endpoint; no user context available |
| `mcp-gateway.ts` | Internal MCP agent proxy gateway; no user auth context; accessed by system services |
| `linear.ts` | Admin-gated settings (`adminGuard`) + public bug-report ingestion; `platformSettingsTable` is platform-wide |
| `admin/*.ts` routes | Elevated admin users intentionally see cross-org data |
| `billing.ts` → `/billing/revenue-analytics` | Admin aggregate analytics behind `requireRole` |
| `billing.ts` → `/billing/admin/orgs/:orgId/*` | Already scoped by explicit URL param; admin-only |
| Analytics metric/funnel/dashboard definition tables | No `orgId` column by design — definitions are platform-wide |

### Schema-Level Gaps (tables lacking orgId — tracked for follow-up)

| File | Tables without orgId |
|------|---------------------|
| `delta-sync.ts` | firestormIncidents/Alerts/Findings/Assets, vesselsAlerts, vesselsEvents (no `org_id` column) |
| `correlation-map.ts` | firestormIncidents/Alerts, vesselsAlerts/Events, terraDistressProperties, holdingsVentures, fundNavRecords, kgEntities/Relationships |
| `cross-domain-query.ts` | Same tables as correlation-map |
| `signal-chains.ts` | Same tables as correlation-map |
| `terra-cognitive.ts` | terra property/deal/market tables lack `org_id` |
| `terra-broker.ts` | Same |
| `graph.ts`, `domains.ts`, `drift.ts` | Knowledge graph tables lack `org_id` |

---

## Security Tests

Test file: `src/routes/__tests__/route-tenant-isolation.test.ts`

Coverage:
- prism-counsel-purview IDOR prevention (server-derived orgId, not query param)
- governance cross-tenant budget mutation prevention
- signal-bus org-scoped reads (text orgId column with String() conversion)
- atlas-artifacts assertTenantAccess on export job detail (403 for wrong org)
- vessels-cognitive owner-graph org filtering
- No-org user gets empty results (deny-by-default)

---

## Guard Patterns Reference

### List query (org-filtered)
```typescript
const orgIds = getUserOrgIds(req.user!);
if (orgIds !== null && orgIds.size === 0) {
  return sendSuccess(res, []);
}
const rows = await db.select().from(table)
  .where(orgIds !== null ? inArray(table.orgId, [...orgIds]) : undefined)
```

### Single-record GET
```typescript
const [record] = await db.select().from(table).where(eq(table.id, id));
if (!record) return sendNotFound(res, 'Record');
if (!assertTenantAccess(req, res, record.orgId)) return;
```

### Mutation (PATCH/DELETE) — cross-tenant write prevention
```typescript
const orgFilter = orgIds !== null ? inArray(table.orgId, [...orgIds]) : undefined;
const [row] = await db.update(table).set(updates)
  .where(and(eq(table.id, id), orgFilter))
  .returning();
if (!row) return sendNotFound(res, 'Record');
```

---

## Follow-up Tasks

- **#3391**: Add `orgId` schema columns to Lyte, Firestorm, MSP, most Terra, and nuro-mesh tables (enables DB-level filtering for currently unscoped tables)
- **#3392**: Extend security regression tests for all fixed route families
