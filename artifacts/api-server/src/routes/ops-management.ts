import { Router, type IRouter } from "express";
import { pool } from "@szl-holdings/db";
import { logger } from "../lib/logger";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { z } from "zod";
import { validateBody } from "../lib/validation";
// Valid incident status transitions (state machine)
const INCIDENT_TRANSITIONS: Record<string, string[]> = {
  open: ["investigating"],
  investigating: ["mitigating", "open"],
  mitigating: ["resolved", "investigating"],
  resolved: ["postmortem"],
  postmortem: [],
};

const router: IRouter = Router();
router.use("/ops", authMiddleware());
router.use("/ops", requireRole("admin"));

// ──────────────────────────────────────────────────────────────────────────────
// Ensure new columns exist (idempotent migration)
// ──────────────────────────────────────────────────────────────────────────────
async function ensureSchema(): Promise<void> {
  const migrations = [
    `ALTER TABLE platform_incidents ADD COLUMN IF NOT EXISTS assignee TEXT`,
    `ALTER TABLE platform_incidents ADD COLUMN IF NOT EXISTS postmortem TEXT`,
    `ALTER TABLE platform_incident_updates ADD COLUMN IF NOT EXISTS author TEXT`,
    `ALTER TABLE platform_runbooks ADD COLUMN IF NOT EXISTS affected_services TEXT[] NOT NULL DEFAULT '{}'`,
    `CREATE TABLE IF NOT EXISTS platform_alert_rules (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      metric_name TEXT NOT NULL,
      condition TEXT NOT NULL DEFAULT 'gt',
      threshold REAL NOT NULL,
      window_minutes INTEGER NOT NULL DEFAULT 5,
      severity TEXT NOT NULL DEFAULT 'warning',
      enabled BOOLEAN NOT NULL DEFAULT true,
      notify_in_app BOOLEAN NOT NULL DEFAULT true,
      notify_email BOOLEAN NOT NULL DEFAULT false,
      email_recipients TEXT[] NOT NULL DEFAULT '{}',
      runbook_id INTEGER,
      last_evaluated_at TIMESTAMPTZ,
      last_fired_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS platform_alert_events (
      id SERIAL PRIMARY KEY,
      rule_id INTEGER NOT NULL,
      rule_name TEXT NOT NULL,
      severity TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      metric_value REAL NOT NULL,
      threshold REAL NOT NULL,
      condition TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'firing',
      resolved_at TIMESTAMPTZ,
      acknowledged_at TIMESTAMPTZ,
      acknowledged_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS platform_runbooks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      content TEXT NOT NULL,
      tags TEXT[] NOT NULL DEFAULT '{}',
      alert_rule_ids INTEGER[] NOT NULL DEFAULT '{}',
      incident_categories TEXT[] NOT NULL DEFAULT '{}',
      affected_services TEXT[] NOT NULL DEFAULT '{}',
      severity TEXT NOT NULL DEFAULT 'any',
      author TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS platform_service_deps (
      id SERIAL PRIMARY KEY,
      source_id TEXT NOT NULL,
      source_name TEXT NOT NULL,
      source_category TEXT NOT NULL DEFAULT 'service',
      target_id TEXT NOT NULL,
      target_name TEXT NOT NULL,
      target_category TEXT NOT NULL DEFAULT 'service',
      dep_type TEXT NOT NULL DEFAULT 'depends_on',
      is_critical BOOLEAN NOT NULL DEFAULT false,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ];
  for (const sql of migrations) {
    await pool.query(sql).catch(err => logger.warn({ err, sql: sql.slice(0, 60) }, "[ops-mgmt] Migration warning"));
  }
}
ensureSchema().catch(err => logger.warn({ err }, "[ops-mgmt] Schema init failed (non-fatal)"));

// Seed default service dependencies
async function seedServiceDeps(): Promise<void> {
  const count = await pool.query(`SELECT COUNT(*) as c FROM platform_service_deps`);
  if (parseInt(count.rows[0]?.c) > 0) return;
  const deps = [
    ["api", "API Server", "service", "database", "PostgreSQL Database", "database", "depends_on", true, "Primary data store for all API operations"],
    ["api", "API Server", "service", "auth", "Auth Service", "service", "depends_on", true, "Session and token validation"],
    ["api", "API Server", "service", "storage", "Object Storage", "storage", "depends_on", false, "File uploads and asset delivery"],
    ["api", "API Server", "service", "openai", "OpenAI API", "ai_provider", "depends_on", false, "AI inference and completions"],
    ["web", "Web Applications", "service", "api", "API Server", "service", "depends_on", true, "All data fetching through REST API"],
    ["auth", "Auth Service", "service", "database", "PostgreSQL Database", "database", "depends_on", true, "Session and user storage"],
    ["integrations", "Integrations Layer", "service", "api", "API Server", "service", "depends_on", true, "Webhook processing and connector sync"],
    ["integrations", "Integrations Layer", "service", "database", "PostgreSQL Database", "database", "depends_on", false, "Connector state persistence"],
    ["ai", "AI/Agent Layer", "service", "api", "API Server", "service", "depends_on", true, "Job queuing and orchestration"],
    ["ai", "AI/Agent Layer", "service", "openai", "OpenAI API", "ai_provider", "depends_on", true, "LLM inference calls"],
    ["ai", "AI/Agent Layer", "service", "database", "PostgreSQL Database", "database", "depends_on", false, "Vector store and knowledge graph"],
    ["database", "PostgreSQL Database", "database", "backup", "Backup Service", "storage", "feeds_into", false, "Automated daily backup snapshots"],
  ];
  for (const [src_id, src_name, src_cat, tgt_id, tgt_name, tgt_cat, dep_type, critical, desc] of deps) {
    await pool.query(
      `INSERT INTO platform_service_deps (source_id, source_name, source_category, target_id, target_name, target_category, dep_type, is_critical, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
      [src_id, src_name, src_cat, tgt_id, tgt_name, tgt_cat, dep_type, critical, desc]
    ).catch(() => {});
  }
}
setTimeout(() => { seedServiceDeps().catch(() => {}); }, 5000);

// Seed default runbooks
async function seedRunbooks(): Promise<void> {
  const count = await pool.query(`SELECT COUNT(*) as c FROM platform_runbooks`);
  if (parseInt(count.rows[0]?.c) > 0) return;
  const runbooks = [
    {
      title: "High API Error Rate Response",
      description: "Steps to investigate and resolve elevated API error rates",
      category: "api",
      severity: "critical",
      tags: ["api", "errors", "latency"],
      incident_categories: ["api_degradation", "service_disruption"],
      content: `# High API Error Rate Response

## Detection
Alert fires when error rate exceeds 5% over a 5-minute window.

## Impact Assessment
1. Check the current error rate in the analytics dashboard
2. Identify which endpoints are affected using APM traces
3. Determine if it's client-side (4xx) or server-side (5xx) errors

## Investigation Steps
1. **Check recent deployments** — did a deploy happen in the last 30 minutes?
2. **Review logs** — search for ERROR level entries in the last 15 minutes
3. **Database health** — verify connection pool and query latency
4. **Memory/CPU** — check if the server is resource-constrained
5. **Dependency checks** — verify external API responses (Stripe, OpenAI, etc.)

## Mitigation
- If caused by a bad deploy: rollback using \`git revert\` and redeploy
- If database issue: increase connection pool or restart connection pool
- If external dependency: enable circuit breaker / fallback mode
- If traffic spike: enable rate limiting on affected endpoints

## Resolution
1. Confirm error rate returns below 1%
2. Update the incident with root cause
3. Write postmortem within 48 hours`,
    },
    {
      title: "Database Connection Pool Exhaustion",
      description: "Recover from database connection pool failures",
      category: "database",
      severity: "critical",
      tags: ["database", "postgres", "connection"],
      incident_categories: ["database_incident"],
      content: `# Database Connection Pool Exhaustion

## Symptoms
- API responses timing out
- "too many clients" errors in logs
- Pool connection wait time > 2s

## Immediate Actions
1. **Identify runaway queries** — connect to DB and run:
   \`SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC;\`
2. **Kill long-running queries** if safe:
   \`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE duration > interval '5 minutes';\`
3. **Restart API server** if connection leak is the cause

## Root Cause Analysis
- Check for missing connection releases in recently deployed code
- Verify connection pool max setting in environment config
- Look for missing \`await\` on database calls causing leaked connections

## Prevention
- Set max pool size to \`DATABASE_POOL_MAX=20\`
- Enable connection timeout in pool config
- Add connection leak detection in staging`,
    },
    {
      title: "AI Provider Outage Fallback",
      description: "Handle OpenAI or other AI provider downtime",
      category: "ai",
      severity: "major",
      tags: ["ai", "openai", "fallback"],
      incident_categories: ["ai_degradation"],
      content: `# AI Provider Outage Fallback

## Detection
Alert fires when AI inference failure rate exceeds 10% or latency exceeds 10s.

## Impact
- AI recommendations become unavailable
- Automated workflows requiring LLM will queue or fail

## Immediate Response
1. **Verify the provider status** — check status.openai.com
2. **Enable fallback mode** — set feature flag \`ai_fallback_mode=true\`
3. **Notify users** — display maintenance banner on AI-dependent features

## Fallback Behavior
When in fallback mode:
- AI recommendations: show cached recommendations (up to 24h old)
- Automated workflows: queue for retry (max 4 hours)
- Real-time inference: return graceful "unavailable" response

## Recovery
1. Confirm provider is responding normally
2. Disable fallback mode: set \`ai_fallback_mode=false\`
3. Process queued workflow jobs
4. Monitor for any stuck jobs`,
    },
    {
      title: "Service Deployment Rollback",
      description: "Emergency rollback procedure for bad deployments",
      category: "deployment",
      severity: "critical",
      tags: ["deployment", "rollback", "emergency"],
      incident_categories: ["deployment_incident"],
      content: `# Service Deployment Rollback

## When to Use
Use this runbook when a recent deployment causes:
- Error rate spike > 5%
- Core user flows broken
- Data integrity issues

## Rollback Steps
1. **Identify the bad commit**
   \`git log --oneline -10\`

2. **Revert the commit**
   \`git revert <commit-hash>\`
   Or for multiple commits: \`git revert HEAD~3..HEAD\`

3. **Redeploy**
   Push to the main branch and trigger a new deploy.

4. **Verify rollback**
   - Check error rate drops below 1%
   - Run smoke tests
   - Verify key user flows

## Communication
- Post update to status page immediately
- Notify affected users via status subscription email
- Document in incident timeline

## Post-Rollback
- Identify root cause before re-attempting the deployment
- Add regression tests for the failed scenario`,
    },
    {
      title: "High Memory Usage Alert Response",
      description: "Respond to elevated server memory consumption",
      category: "infrastructure",
      severity: "warning",
      tags: ["memory", "performance", "infrastructure"],
      incident_categories: ["performance_degradation"],
      content: `# High Memory Usage Alert Response

## Alert Threshold
Fires when Node.js heap usage exceeds 80% of available memory.

## Diagnosis
1. **Check memory telemetry** in the admin observability dashboard
2. **Identify memory hogs** — look for large in-memory caches or leaks
3. **Review recent changes** — any new features caching large datasets?

## Immediate Mitigation
- Restart the API server (causes brief interruption): \`pm2 restart api\`
- If a leak is suspected, enable heap snapshots and analyze

## Common Causes
- **Unbounded caches**: LRU caches without size limits
- **WebSocket connections**: Stale connections not being cleaned up
- **Large query results**: Missing pagination on admin queries
- **Event listener leaks**: Missing removeEventListener calls

## Prevention
- Set max heap to \`NODE_OPTIONS=--max-old-space-size=512\`
- Add memory leak tests using clinic.js in CI
- Review cache implementations for size bounds`,
    },
  ];
  for (const rb of runbooks) {
    await pool.query(
      `INSERT INTO platform_runbooks (title, description, category, severity, tags, incident_categories, content, author)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [rb.title, rb.description, rb.category, rb.severity, rb.tags, rb.incident_categories, rb.content, "Platform Engineering"]
    ).catch(() => {});
  }
}
setTimeout(() => { seedRunbooks().catch(() => {}); }, 6000);

// Seed default alert rules
async function seedAlertRules(): Promise<void> {
  const count = await pool.query(`SELECT COUNT(*) as c FROM platform_alert_rules`);
  if (parseInt(count.rows[0]?.c) > 0) return;
  const rules = [
    { name: "High Error Rate", description: "API error rate exceeds 5%", metric_name: "api.error_rate", condition: "gt", threshold: 5, window_minutes: 5, severity: "critical" },
    { name: "High Latency", description: "API P95 latency exceeds 2000ms", metric_name: "api.latency_p95", condition: "gt", threshold: 2000, window_minutes: 5, severity: "warning" },
    { name: "Queue Depth", description: "Job queue depth exceeds 100", metric_name: "queue.depth", condition: "gt", threshold: 100, window_minutes: 10, severity: "warning" },
    { name: "DB Connection Pool", description: "Database connection pool utilization exceeds 80%", metric_name: "db.pool_utilization", condition: "gt", threshold: 80, window_minutes: 5, severity: "critical" },
    { name: "Memory Usage", description: "Server memory usage exceeds 80%", metric_name: "system.memory_pct", condition: "gt", threshold: 80, window_minutes: 5, severity: "warning" },
    { name: "AI Failure Rate", description: "AI provider failure rate exceeds 10%", metric_name: "ai.failure_rate", condition: "gt", threshold: 10, window_minutes: 5, severity: "major" },
  ];
  for (const r of rules) {
    await pool.query(
      `INSERT INTO platform_alert_rules (name, description, metric_name, condition, threshold, window_minutes, severity)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [r.name, r.description, r.metric_name, r.condition, r.threshold, r.window_minutes, r.severity]
    ).catch(() => {});
  }
}
setTimeout(() => { seedAlertRules().catch(() => {}); }, 7000);

// ──────────────────────────────────────────────────────────────────────────────
// INCIDENTS
// ──────────────────────────────────────────────────────────────────────────────

router.get("/ops/incidents", async (req, res) => {
  try {
    const { status, severity, limit = "50" } = req.query as Record<string, string>;
    let sql = `SELECT * FROM platform_incidents WHERE 1=1`;
    const params: unknown[] = [];
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    if (severity) { params.push(severity); sql += ` AND severity = $${params.length}`; }
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(Math.min(parseInt(limit) || 50, 200));
    const result = await pool.query(sql, params);
    res.json({ incidents: result.rows });
  } catch (err) {
    logger.error({ err }, "[ops] Failed to list incidents");
    res.status(500).json({ error: "Failed to list incidents" });
  }
});

const createIncidentSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(5000),
  severity: z.enum(["minor", "major", "critical"]).default("minor"),
  affectedServices: z.array(z.string()).default([]),
  assignee: z.string().max(200).optional(),
});

router.post("/ops/incidents", validateBody(createIncidentSchema), async (req, res) => {
  const { title, description, severity, affectedServices, assignee } = req.body as z.infer<typeof createIncidentSchema>;
  try {
    const user = req.user;
    const result = await pool.query<{ id: number }>(
      `INSERT INTO platform_incidents (title, status, severity, affected_services, description, assignee, posted_by)
       VALUES ($1, 'open', $2, $3, $4, $5, $6) RETURNING id`,
      [title, severity, affectedServices, description, assignee ?? null, user?.displayName ?? user?.email ?? "System"]
    );
    const id = result.rows[0]!.id;
    await pool.query(
      `INSERT INTO platform_incident_updates (incident_id, message, status, author) VALUES ($1, $2, 'open', $3)`,
      [id, `Incident opened: ${description}`, user?.displayName ?? "System"]
    );
    res.json({ ok: true, id });
  } catch (err) {
    logger.error({ err }, "[ops] Failed to create incident");
    res.status(500).json({ error: "Failed to create incident" });
  }
});

router.get("/ops/incidents/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  try {
    const [incResult, updatesResult] = await Promise.all([
      pool.query(`SELECT * FROM platform_incidents WHERE id = $1`, [id]),
      pool.query(`SELECT * FROM platform_incident_updates WHERE incident_id = $1 ORDER BY created_at ASC`, [id]),
    ]);
    if (!incResult.rows[0]) { res.status(404).json({ error: "Incident not found" }); return; }
    res.json({ incident: incResult.rows[0], updates: updatesResult.rows });
  } catch (err) {
    logger.error({ err }, "[ops] Failed to get incident");
    res.status(500).json({ error: "Failed to get incident" });
  }
});

const updateIncidentSchema = z.object({
  status: z.enum(["open", "investigating", "mitigating", "resolved", "postmortem"]).optional(),
  message: z.string().min(1).max(3000).optional(),
  assignee: z.string().max(200).optional(),
  postmortem: z.string().max(20000).optional(),
  severity: z.enum(["minor", "major", "critical"]).optional(),
  affectedServices: z.array(z.string()).optional(),
});

router.patch("/ops/incidents/:id", validateBody(updateIncidentSchema), async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { status, message, assignee, postmortem, severity, affectedServices } = req.body as z.infer<typeof updateIncidentSchema>;
  const user = req.user;
  const actor = user?.displayName ?? user?.email ?? "System";
  try {
    // Fetch current incident to validate state transitions
    const current = await pool.query(`SELECT status, assignee FROM platform_incidents WHERE id = $1`, [id]);
    if (!current.rows[0]) { res.status(404).json({ error: "Incident not found" }); return; }
    const currentStatus: string = current.rows[0].status;
    const currentAssignee: string | null = current.rows[0].assignee;

    // Enforce state machine — reject invalid transitions
    if (status && status !== currentStatus) {
      const allowed = INCIDENT_TRANSITIONS[currentStatus] ?? [];
      if (!allowed.includes(status)) {
        res.status(400).json({
          error: `Invalid transition: ${currentStatus} → ${status}. Allowed: ${allowed.join(", ") || "none"}`,
        });
        return;
      }
    }

    const sets: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [];
    if (status && status !== currentStatus) {
      params.push(status); sets.push(`status = $${params.length}`);
      if (status === "resolved" || status === "postmortem") {
        sets.push("resolved_at = NOW()");
      }
    }
    if (assignee !== undefined) { params.push(assignee); sets.push(`assignee = $${params.length}`); }
    if (postmortem !== undefined) { params.push(postmortem); sets.push(`postmortem = $${params.length}`); }
    if (severity) { params.push(severity); sets.push(`severity = $${params.length}`); }
    if (affectedServices) { params.push(affectedServices); sets.push(`affected_services = $${params.length}`); }

    if (sets.length > 1) {
      params.push(id);
      await pool.query(`UPDATE platform_incidents SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    }

    // Always append timeline entries for any meaningful change
    const timelineEntries: Array<{ msg: string; statusLabel: string }> = [];
    if (message) {
      timelineEntries.push({ msg: message, statusLabel: status ?? currentStatus });
    }
    if (status && status !== currentStatus) {
      timelineEntries.push({ msg: `Status transitioned from ${currentStatus} to ${status}`, statusLabel: status });
    }
    if (assignee !== undefined && assignee !== (currentAssignee ?? "")) {
      const msg = assignee ? `Assignee set to ${assignee}` : "Assignee cleared";
      timelineEntries.push({ msg, statusLabel: status ?? currentStatus });
    }
    if (postmortem !== undefined) {
      timelineEntries.push({ msg: "Postmortem notes updated", statusLabel: status ?? currentStatus });
    }
    if (severity) {
      timelineEntries.push({ msg: `Severity set to ${severity}`, statusLabel: status ?? currentStatus });
    }
    if (affectedServices) {
      timelineEntries.push({ msg: `Affected services updated: ${affectedServices.join(", ") || "none"}`, statusLabel: status ?? currentStatus });
    }
    for (const entry of timelineEntries) {
      await pool.query(
        `INSERT INTO platform_incident_updates (incident_id, message, status, author) VALUES ($1, $2, $3, $4)`,
        [id, entry.msg, entry.statusLabel, actor]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[ops] Failed to update incident");
    res.status(500).json({ error: "Failed to update incident" });
  }
});

router.delete("/ops/incidents/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  try {
    await pool.query(`DELETE FROM platform_incidents WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete incident" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// ALERT RULES
// ──────────────────────────────────────────────────────────────────────────────

router.get("/ops/alert-rules", async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM platform_alert_rules ORDER BY created_at DESC`);
    res.json({ rules: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to list alert rules" });
  }
});

const alertRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  metricName: z.string().min(1).max(100),
  condition: z.enum(["gt", "lt", "gte", "lte", "eq"]).default("gt"),
  threshold: z.number(),
  windowMinutes: z.number().int().min(1).max(1440).default(5),
  severity: z.enum(["info", "warning", "major", "critical"]).default("warning"),
  enabled: z.boolean().default(true),
  notifyInApp: z.boolean().default(true),
  notifyEmail: z.boolean().default(false),
  emailRecipients: z.array(z.string().email()).default([]),
  runbookId: z.number().int().optional(),
});

router.post("/ops/alert-rules", validateBody(alertRuleSchema), async (req, res) => {
  const b = req.body as z.infer<typeof alertRuleSchema>;
  try {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO platform_alert_rules (name, description, metric_name, condition, threshold, window_minutes, severity, enabled, notify_in_app, notify_email, email_recipients, runbook_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [b.name, b.description ?? null, b.metricName, b.condition, b.threshold, b.windowMinutes, b.severity, b.enabled, b.notifyInApp, b.notifyEmail, b.emailRecipients, b.runbookId ?? null]
    );
    res.json({ ok: true, id: result.rows[0]!.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create alert rule" });
  }
});

router.patch("/ops/alert-rules/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const b = req.body as Partial<z.infer<typeof alertRuleSchema>>;
  try {
    const sets: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [];
    const fieldMap: Record<string, string> = {
      name: "name", description: "description", metricName: "metric_name",
      condition: "condition", threshold: "threshold", windowMinutes: "window_minutes",
      severity: "severity", enabled: "enabled", notifyInApp: "notify_in_app",
      notifyEmail: "notify_email", emailRecipients: "email_recipients", runbookId: "runbook_id",
    };
    const bRecord = b as Record<string, unknown>;
    for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
      if (jsKey in b) {
        params.push(bRecord[jsKey]); sets.push(`${dbCol} = $${params.length}`);
      }
    }
    params.push(id);
    await pool.query(`UPDATE platform_alert_rules SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update alert rule" });
  }
});

router.delete("/ops/alert-rules/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  try {
    await pool.query(`DELETE FROM platform_alert_rules WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete alert rule" });
  }
});

router.get("/ops/alert-events", async (req, res) => {
  try {
    const { status, limit = "50" } = req.query as Record<string, string>;
    let sql = `SELECT * FROM platform_alert_events WHERE 1=1`;
    const params: unknown[] = [];
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(Math.min(parseInt(limit) || 50, 200));
    const result = await pool.query(sql, params);
    res.json({ events: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to list alert events" });
  }
});

router.post("/ops/alert-events/:id/acknowledge", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const user = req.user;
  try {
    await pool.query(
      `UPDATE platform_alert_events SET acknowledged_at = NOW(), acknowledged_by = $1, status = 'acknowledged' WHERE id = $2`,
      [user?.displayName ?? "System", id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to acknowledge alert event" });
  }
});

// Alert rule evaluation against current metrics
router.post("/ops/alert-rules/evaluate", async (_req, res) => {
  try {
    const rulesResult = await pool.query(`SELECT * FROM platform_alert_rules WHERE enabled = true`);
    const rules = rulesResult.rows as Array<{
      id: number; name: string; metric_name: string; condition: string;
      threshold: number; window_minutes: number; severity: string;
      notify_email: boolean; email_recipients: string[];
    }>;

    // Get current metrics from observability snapshot
    const { serverTelemetry } = await import("@szl-holdings/observability");
    const snapshot = serverTelemetry.getSnapshot();

    const [latencyRes, queueRes, poolRes, aiFailRes] = await Promise.all([
      pool.query<{ p95: number | null }>(
        `SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)::float AS p95 FROM platform_status_checks WHERE service_id = 'api' AND latency_ms IS NOT NULL AND checked_at > NOW() - INTERVAL '5 minutes'`
      ).catch(() => ({ rows: [{ p95: null }] })),
      pool.query<{ depth: string }>(
        `SELECT COUNT(*)::text AS depth FROM durable_jobs WHERE status = 'pending'`
      ).catch(() => ({ rows: [{ depth: "0" }] })),
      pool.query<{ util: string }>(
        `SELECT ROUND(COUNT(*)::numeric / NULLIF((SELECT setting FROM pg_settings WHERE name = 'max_connections')::int, 0) * 100, 1)::text AS util FROM pg_stat_activity WHERE datname = current_database()`
      ).catch(() => ({ rows: [{ util: "0" }] })),
      pool.query<{ fail_rate: string }>(
        `SELECT ROUND(COUNT(*) FILTER (WHERE status = 'failed')::numeric / NULLIF(COUNT(*), 0) * 100, 1)::text AS fail_rate FROM durable_jobs WHERE type LIKE '%agent%' AND created_at > NOW() - INTERVAL '5 minutes'`
      ).catch(() => ({ rows: [{ fail_rate: "0" }] })),
    ]);

    const metricValues: Record<string, number> = {
      "api.error_rate": parseFloat((snapshot.errorRate ?? 0).toFixed(2)),
      "api.latency_p95": parseFloat((latencyRes.rows[0]?.p95 ?? 0).toString()),
      "queue.depth": parseInt(queueRes.rows[0]?.depth ?? "0"),
      "db.pool_utilization": parseFloat(poolRes.rows[0]?.util ?? "0"),
      "system.memory_pct": (() => {
        const mem = process.memoryUsage();
        return Math.round((mem.heapUsed / mem.heapTotal) * 100);
      })(),
      "ai.failure_rate": parseFloat(aiFailRes.rows[0]?.fail_rate ?? "0"),
    };

    const firedCount = { count: 0 };
    for (const rule of rules) {
      await pool.query(`UPDATE platform_alert_rules SET last_evaluated_at = NOW() WHERE id = $1`, [rule.id]);
      const metricVal = metricValues[rule.metric_name];
      if (metricVal === undefined) continue;

      let triggered = false;
      switch (rule.condition) {
        case "gt": triggered = metricVal > rule.threshold; break;
        case "lt": triggered = metricVal < rule.threshold; break;
        case "gte": triggered = metricVal >= rule.threshold; break;
        case "lte": triggered = metricVal <= rule.threshold; break;
        case "eq": triggered = metricVal === rule.threshold; break;
      }

      if (triggered) {
        const alertMsg = `${rule.name}: ${rule.metric_name} = ${metricVal} (threshold: ${rule.condition} ${rule.threshold})`;
        await pool.query(
          `INSERT INTO platform_alert_events (rule_id, rule_name, severity, metric_name, metric_value, threshold, condition, message)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [rule.id, rule.name, rule.severity, rule.metric_name, metricVal, rule.threshold, rule.condition, alertMsg]
        );
        await pool.query(`UPDATE platform_alert_rules SET last_fired_at = NOW() WHERE id = $1`, [rule.id]);
        firedCount.count++;

        // Dispatch email notifications if configured for this rule
        if (rule.notify_email && rule.email_recipients.length > 0) {
          const sgKey = process.env["SENDGRID_API_KEY"];
          const resendKey = process.env["RESEND_API_KEY"];
          if (sgKey || resendKey) {
            const severityUpper = rule.severity.toUpperCase();
            const subject = `[${severityUpper}] Alert fired: ${rule.name}`;
            const html = `<h2 style="color:#dc2626;">&#9888; Alert Fired: ${rule.name}</h2>
<table style="border-collapse:collapse;font-family:monospace;font-size:14px;">
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Severity</td><td><strong>${rule.severity}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Metric</td><td>${rule.metric_name}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Current value</td><td>${metricVal}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Threshold</td><td>${rule.condition} ${rule.threshold}</td></tr>
</table>
<p style="margin-top:16px;font-size:13px;color:#6b7280;">View alerts in your SZL Holdings ops dashboard.<br>This is an automated alert.</p>`;
            for (const recipient of rule.email_recipients) {
              const dispatchFn = async () => {
                if (sgKey) {
                  const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${sgKey}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      personalizations: [{ to: [{ email: recipient }] }],
                      from: { email: "inquiries@szlholdings.com", name: "SZL Holdings Ops" },
                      subject,
                      content: [{ type: "text/html", value: html }],
                    }),
                  });
                  if (!r.ok) throw new Error(`SendGrid ${r.status}`);
                } else if (resendKey) {
                  const r = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ from: "ops@szlholdings.com", to: [recipient], subject, html }),
                  });
                  if (!r.ok) throw new Error(`Resend ${r.status}`);
                }
              };
              dispatchFn().catch(emailErr => {
                logger.warn({ emailErr, recipient, rule: rule.name }, "[ops] Alert email dispatch failed (non-fatal)");
              });
            }
          } else {
            logger.warn({ rule: rule.name }, "[ops] Alert has notify_email=true but no email provider is configured (set SENDGRID_API_KEY or RESEND_API_KEY)");
          }
        }
      }
    }
    res.json({ ok: true, evaluated: rules.length, fired: firedCount.count, metrics: metricValues });
  } catch (err) {
    logger.error({ err }, "[ops] Alert evaluation failed");
    res.status(500).json({ error: "Alert evaluation failed" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// RUNBOOKS
// ──────────────────────────────────────────────────────────────────────────────

router.get("/ops/runbooks", async (req, res) => {
  try {
    const { category, severity, services } = req.query as Record<string, string>;
    let sql = `SELECT id, title, description, category, severity, tags, alert_rule_ids, incident_categories, affected_services, author, version, is_active, created_at, updated_at FROM platform_runbooks WHERE 1=1`;
    const params: unknown[] = [];
    if (category) { params.push(category); sql += ` AND category = $${params.length}`; }
    if (severity && severity !== "any") { params.push(severity); sql += ` AND (severity = $${params.length} OR severity = 'any')`; }
    if (services) {
      const svcArr = services.split(",").map(s => s.trim()).filter(Boolean);
      if (svcArr.length > 0) { params.push(svcArr); sql += ` AND (affected_services && $${params.length} OR cardinality(affected_services) = 0)`; }
    }
    sql += ` ORDER BY created_at DESC`;
    const result = await pool.query(sql, params);
    res.json({ runbooks: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to list runbooks" });
  }
});

router.get("/ops/runbooks/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  try {
    const result = await pool.query(`SELECT * FROM platform_runbooks WHERE id = $1`, [id]);
    if (!result.rows[0]) { res.status(404).json({ error: "Runbook not found" }); return; }
    res.json({ runbook: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to get runbook" });
  }
});

const runbookSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100).default("general"),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  alertRuleIds: z.array(z.number().int()).default([]),
  incidentCategories: z.array(z.string()).default([]),
  affectedServices: z.array(z.string()).default([]),
  severity: z.string().default("any"),
  author: z.string().max(200).optional(),
});

router.post("/ops/runbooks", validateBody(runbookSchema), async (req, res) => {
  const b = req.body as z.infer<typeof runbookSchema>;
  const user = req.user;
  try {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO platform_runbooks (title, description, category, content, tags, alert_rule_ids, incident_categories, affected_services, severity, author)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [b.title, b.description ?? null, b.category, b.content, b.tags, b.alertRuleIds, b.incidentCategories, b.affectedServices, b.severity, b.author ?? user?.displayName ?? "System"]
    );
    res.json({ ok: true, id: result.rows[0]!.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create runbook" });
  }
});

router.patch("/ops/runbooks/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const b = req.body as Partial<z.infer<typeof runbookSchema>> & { isActive?: boolean };
  try {
    const sets: string[] = ["updated_at = NOW()", "version = version + 1"];
    const params: unknown[] = [];
    const fieldMap: Record<string, string> = {
      title: "title", description: "description", category: "category", content: "content",
      tags: "tags", alertRuleIds: "alert_rule_ids", incidentCategories: "incident_categories",
      affectedServices: "affected_services", severity: "severity", author: "author", isActive: "is_active",
    };
    const bRecord = b as Record<string, unknown>;
    for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
      if (jsKey in b) {
        params.push(bRecord[jsKey]); sets.push(`${dbCol} = $${params.length}`);
      }
    }
    params.push(id);
    await pool.query(`UPDATE platform_runbooks SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update runbook" });
  }
});

router.delete("/ops/runbooks/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  try {
    await pool.query(`DELETE FROM platform_runbooks WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete runbook" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// SERVICE DEPENDENCY MAP
// ──────────────────────────────────────────────────────────────────────────────

router.get("/ops/service-deps", async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM platform_service_deps ORDER BY source_id, target_id`);
    const deps = result.rows as Array<{
      id: number; source_id: string; source_name: string; source_category: string;
      target_id: string; target_name: string; target_category: string;
      dep_type: string; is_critical: boolean; description: string;
    }>;

    const nodeMap = new Map<string, { id: string; name: string; category: string; status: string }>();
    for (const dep of deps) {
      if (!nodeMap.has(dep.source_id)) nodeMap.set(dep.source_id, { id: dep.source_id, name: dep.source_name, category: dep.source_category, status: "operational" });
      if (!nodeMap.has(dep.target_id)) nodeMap.set(dep.target_id, { id: dep.target_id, name: dep.target_name, category: dep.target_category, status: "operational" });
    }

    // Enrich with live status
    const statusResult = await pool.query(`SELECT service_id, status FROM platform_status_checks WHERE checked_at > NOW() - INTERVAL '10 minutes' ORDER BY checked_at DESC`);
    const statusByService: Record<string, string> = {};
    for (const row of statusResult.rows as Array<{ service_id: string; status: string }>) {
      if (!statusByService[row.service_id]) statusByService[row.service_id] = row.status;
    }
    for (const node of nodeMap.values()) {
      if (statusByService[node.id]) node.status = statusByService[node.id] === "operational" ? "operational" : statusByService[node.id];
    }

    res.json({
      nodes: Array.from(nodeMap.values()),
      edges: deps.map(d => ({
        id: d.id,
        source: d.source_id,
        target: d.target_id,
        type: d.dep_type,
        isCritical: d.is_critical,
        description: d.description,
      })),
    });
  } catch (err) {
    logger.error({ err }, "[ops] Failed to get service deps");
    res.status(500).json({ error: "Failed to get service dependencies" });
  }
});

router.post("/ops/service-deps", async (req, res) => {
  const b = req.body as {
    sourceId: string; sourceName: string; sourceCategory?: string;
    targetId: string; targetName: string; targetCategory?: string;
    depType?: string; isCritical?: boolean; description?: string;
  };
  if (!b.sourceId || !b.targetId || !b.sourceName || !b.targetName) {
    res.status(400).json({ error: "sourceId, sourceName, targetId, targetName required" });
    return;
  }
  try {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO platform_service_deps (source_id, source_name, source_category, target_id, target_name, target_category, dep_type, is_critical, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [b.sourceId, b.sourceName, b.sourceCategory ?? "service", b.targetId, b.targetName, b.targetCategory ?? "service", b.depType ?? "depends_on", b.isCritical ?? false, b.description ?? null]
    );
    res.json({ ok: true, id: result.rows[0]!.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create service dependency" });
  }
});

router.delete("/ops/service-deps/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  try {
    await pool.query(`DELETE FROM platform_service_deps WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete service dependency" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// UPTIME HISTORY (per-service daily snapshots for status page)
// ──────────────────────────────────────────────────────────────────────────────

router.get("/ops/uptime-history", async (req, res) => {
  try {
    const { serviceId, days = "30" } = req.query as Record<string, string>;
    let sql = `
      SELECT
        service_id,
        DATE_TRUNC('day', checked_at) as day,
        COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE status = 'operational') as operational_checks,
        ROUND(COUNT(*) FILTER (WHERE status = 'operational')::numeric / NULLIF(COUNT(*), 0) * 100, 2) as uptime_pct,
        AVG(latency_ms) as avg_latency_ms
      FROM platform_status_checks
      WHERE checked_at > NOW() - INTERVAL '1 day' * $1
    `;
    const params: unknown[] = [Math.min(parseInt(days) || 30, 90)];
    if (serviceId) { params.push(serviceId); sql += ` AND service_id = $${params.length}`; }
    sql += ` GROUP BY service_id, DATE_TRUNC('day', checked_at) ORDER BY service_id, day DESC`;
    const result = await pool.query(sql, params);
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to get uptime history" });
  }
});

export default router;
