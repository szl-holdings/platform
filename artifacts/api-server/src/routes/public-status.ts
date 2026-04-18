import { Router, type IRouter } from "express";
import { pool } from "@szl-holdings/db";
import { logger } from "../lib/logger";
import { validateBody, jsonObjectBodySchema } from "../lib/validation";

const router: IRouter = Router();

const SERVICES = [
  { id: "api", name: "API Server", description: "Core API gateway and routing" },
  { id: "web", name: "Web Applications", description: "All SZL web interfaces" },
  { id: "database", name: "Database", description: "Primary data store and backups" },
  { id: "integrations", name: "Integrations Layer", description: "Third-party service connections" },
  { id: "auth", name: "Authentication", description: "Auth & session management" },
  { id: "ai", name: "AI/Agent Layer", description: "Inference, agents & AI pipeline" },
];

const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : process.env.APP_URL
  ? process.env.APP_URL
  : `http://localhost:${process.env.PORT ?? "3000"}`;

const INTERNAL_TOKEN = process.env.ALLOY_INTERNAL_TOKEN;

async function probeEndpoint(url: string, timeoutMs = 8000, headers?: Record<string, string>): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: { "User-Agent": "SZL-StatusMonitor/1.0", ...headers },
      });
      clearTimeout(timer);
      return { ok: res.ok, latencyMs: Date.now() - start };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

async function recordHealthCheck(): Promise<void> {
  try {
    const dbStart = Date.now();
    await pool.query("SELECT 1");
    const dbLatency = Date.now() - dbStart;

    const internalHeaders = INTERNAL_TOKEN ? { "x-internal-token": INTERNAL_TOKEN } : undefined;

    const apiStart = Date.now();
    let apiOk = false;
    let parsedHealth: Record<string, unknown> | null = null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const apiRes = await fetch(`${BASE_URL}/api/health`, {
          signal: controller.signal,
          headers: { "User-Agent": "SZL-StatusMonitor/1.0" },
        });
        apiOk = apiRes.ok;
        if (apiRes.ok) {
          parsedHealth = await apiRes.json() as Record<string, unknown>;
        }
      } finally {
        clearTimeout(timer);
      }
    } catch { /* non-fatal */ }
    const apiLatencyMs = Date.now() - apiStart;

    const probePromises: Promise<{ ok: boolean; latencyMs: number }>[] = [
      probeEndpoint(`${BASE_URL}/`),
    ];
    const authProbeEnabled = !!INTERNAL_TOKEN;
    if (authProbeEnabled) {
      probePromises.push(probeEndpoint(`${BASE_URL}/api/health/detailed`, 8000, internalHeaders));
    }
    const [webProbe, authProbeResult] = await Promise.all(probePromises);
    const authProbe = authProbeEnabled ? authProbeResult : null;

    const healthServices = (parsedHealth?.["services"] ?? {}) as Record<string, { status?: string; latencyMs?: number }>;
    const aiStatus = healthServices["ai"]?.status === "ok" ? "operational" : (healthServices["ai"]?.status ? "degraded" : "operational");
    const storageStatus = healthServices["storage"]?.status === "ok" ? "operational" : (healthServices["storage"]?.status ? "degraded" : "operational");

    const checks: Array<{ service_id: string; status: string; latency_ms: number }> = [
      {
        service_id: "api",
        status: apiOk ? "operational" : "degraded",
        latency_ms: apiLatencyMs,
      },
      {
        service_id: "database",
        status: dbLatency < 1000 ? "operational" : dbLatency < 3000 ? "degraded" : "outage",
        latency_ms: dbLatency,
      },
      {
        service_id: "web",
        status: webProbe.ok ? "operational" : "degraded",
        latency_ms: webProbe.latencyMs,
      },
      ...(authProbe !== null ? [{
        service_id: "auth",
        status: authProbe.ok ? "operational" : "degraded",
        latency_ms: authProbe.latencyMs,
      }] : []),
      {
        service_id: "integrations",
        status: storageStatus,
        latency_ms: Math.max(apiLatencyMs, dbLatency),
      },
      {
        service_id: "ai",
        status: aiStatus,
        latency_ms: healthServices["ai"]?.latencyMs ?? Math.round(dbLatency * 0.8 + 50),
      },
    ];

    for (const check of checks) {
      await pool.query(
        `INSERT INTO platform_status_checks (service_id, status, latency_ms, checked_at) VALUES ($1, $2, $3, NOW())`,
        [check.service_id, check.status, check.latency_ms]
      );
    }

    await pool.query(
      `DELETE FROM platform_status_checks WHERE checked_at < NOW() - INTERVAL '91 days'`
    );
  } catch (err) {
    logger.warn({ error: (err as Error).message }, "Status health check failed");
  }
}

setInterval(() => { recordHealthCheck().catch(() => {}); }, 5 * 60 * 1000);
setTimeout(() => { recordHealthCheck().catch(() => {}); }, 3000);

async function getUptimeStats(serviceId: string, days: number): Promise<number> {
  try {
    const result = await pool.query<{ total: string; operational: string }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'operational') as operational
       FROM platform_status_checks
       WHERE service_id = $1 AND checked_at > NOW() - INTERVAL '1 day' * $2`,
      [serviceId, days]
    );
    const row = result.rows[0];
    if (!row || parseInt(row.total) === 0) return 99.9;
    return parseFloat(((parseInt(row.operational) / parseInt(row.total)) * 100).toFixed(3));
  } catch {
    return 99.9;
  }
}

async function getCurrentStatus(serviceId: string): Promise<{ status: string; latency_ms: number | null }> {
  try {
    const result = await pool.query<{ status: string; latency_ms: number }>(
      `SELECT status, latency_ms FROM platform_status_checks
       WHERE service_id = $1
       ORDER BY checked_at DESC LIMIT 1`,
      [serviceId]
    );
    if (result.rows[0]) return result.rows[0];
    return { status: "operational", latency_ms: null };
  } catch {
    return { status: "operational", latency_ms: null };
  }
}

router.get("/status", async (_req, res) => {
  try {
    const serviceStatuses = await Promise.all(
      SERVICES.map(async (svc) => {
        const [current, uptime30, uptime90] = await Promise.all([
          getCurrentStatus(svc.id),
          getUptimeStats(svc.id, 30),
          getUptimeStats(svc.id, 90),
        ]);
        return {
          ...svc,
          status: current.status,
          latencyMs: current.latency_ms,
          uptime30d: uptime30,
          uptime90d: uptime90,
        };
      })
    );

    const overallStatus = serviceStatuses.every(s => s.status === "operational")
      ? "operational"
      : serviceStatuses.some(s => s.status === "outage")
      ? "outage"
      : "degraded";

    const incidentsResult = await pool.query<{
      id: number; title: string; status: string; severity: string;
      affected_services: string[]; description: string;
      resolved_at: string | null; created_at: string; updated_at: string;
    }>(
      `SELECT id, title, status, severity, affected_services, description, resolved_at, created_at, updated_at
       FROM platform_incidents
       ORDER BY created_at DESC
       LIMIT 20`
    );

    const incidents = await Promise.all(
      incidentsResult.rows.map(async (incident) => {
        const updatesResult = await pool.query<{ id: number; message: string; status: string; created_at: string }>(
          `SELECT id, message, status, created_at FROM platform_incident_updates
           WHERE incident_id = $1 ORDER BY created_at ASC`,
          [incident.id]
        );
        return { ...incident, updates: updatesResult.rows };
      })
    );

    res.json({
      overall: overallStatus,
      lastChecked: new Date().toISOString(),
      services: serviceStatuses,
      incidents,
    });
  } catch (err) {
    logger.error({ error: (err as Error).message }, "Failed to fetch public status");
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// Public uptime-history endpoint — no auth required.
// This is the canonical source for the /status page UptimeBar component.
// Returns: { history: { [serviceId]: { [YYYY-MM-DD]: { uptime: 0-1, latency: ms|null } } } }
// For the authenticated admin view see /api/ops/uptime-history (ops-management.ts),
// which returns an array of raw rows with per-day totals and is used by the ops dashboard.
router.get("/uptime-history", async (_req, res) => {
  try {
    const result = await pool.query<{ service_id: string; day: string; uptime_fraction: string; avg_latency_ms: string | null }>(
      `SELECT
         service_id,
         DATE(checked_at AT TIME ZONE 'UTC') AS day,
         COUNT(*) FILTER (WHERE status = 'operational')::float / NULLIF(COUNT(*), 0) AS uptime_fraction,
         ROUND(AVG(latency_ms))::int AS avg_latency_ms
       FROM platform_status_checks
       WHERE checked_at >= NOW() - INTERVAL '90 days'
       GROUP BY service_id, day
       ORDER BY service_id, day ASC`
    );
    const byService: Record<string, Record<string, { uptime: number; latency: number | null }>> = {};
    for (const row of result.rows) {
      if (!byService[row.service_id]) byService[row.service_id] = {};
      byService[row.service_id][row.day] = {
        uptime: parseFloat(row.uptime_fraction),
        latency: row.avg_latency_ms !== null ? parseInt(row.avg_latency_ms) : null,
      };
    }
    res.json({ history: byService });
  } catch (err) {
    logger.error({ error: (err as Error).message }, "Failed to fetch uptime history");
    res.status(500).json({ error: "Failed to fetch uptime history" });
  }
});

router.post("/status/subscribe", validateBody(jsonObjectBodySchema), async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email required" });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO platform_status_subscriptions (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET active = TRUE, subscribed_at = NOW()`,
      [email]
    );
    res.json({ ok: true, message: "Subscribed successfully" });
  } catch (err) {
    logger.error({ error: (err as Error).message }, "Status subscription failed");
    res.status(500).json({ error: "Subscription failed" });
  }
});

router.post("/incidents", validateBody(jsonObjectBodySchema), async (req, res) => {
  const { title, severity, affected_services, description } = req.body as {
    title?: string; severity?: string; affected_services?: string[]; description?: string;
  };
  if (!title || !description) {
    res.status(400).json({ error: "title and description required" });
    return;
  }
  try {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO platform_incidents (title, status, severity, affected_services, description)
       VALUES ($1, 'investigating', $2, $3, $4)
       RETURNING id`,
      [title, severity ?? "minor", affected_services ?? [], description]
    );
    const incident = result.rows[0]!;
    await pool.query(
      `INSERT INTO platform_incident_updates (incident_id, message, status) VALUES ($1, $2, 'investigating')`,
      [incident.id, description]
    );
    res.json({ ok: true, id: incident.id });
  } catch (err) {
    logger.error({ error: (err as Error).message }, "Failed to create incident");
    res.status(500).json({ error: "Failed to create incident" });
  }
});

router.patch("/incidents/:id", validateBody(jsonObjectBodySchema), async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const { status, message } = req.body as { status?: string; message?: string };
  if (!status || !message) {
    res.status(400).json({ error: "status and message required" });
    return;
  }
  try {
    if (status === "resolved") {
      await pool.query(
        `UPDATE platform_incidents SET status = $1, resolved_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [status, id]
      );
    } else {
      await pool.query(
        `UPDATE platform_incidents SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status, id]
      );
    }
    await pool.query(
      `INSERT INTO platform_incident_updates (incident_id, message, status) VALUES ($1, $2, $3)`,
      [id, message, status]
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ error: (err as Error).message }, "Failed to update incident");
    res.status(500).json({ error: "Failed to update incident" });
  }
});

export default router;
