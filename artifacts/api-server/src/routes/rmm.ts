import { Router, type IRouter } from "express";
import { db, mspDevicesTable, mspClientsTable } from "@szl-holdings/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { createRmmProvider, setCachedProvider, getCachedProvider, clearProviderCache, type RmmProviderConfig } from "../services/rmm-provider";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const SUPPORTED_PROVIDERS = ["ninjaone", "connectwise_automate", "connectwise_manage", "halopsa", "datto_rmm", "autotask_psa"] as const;

const ENCRYPTION_KEY = (() => {
  const key = process.env.CONNECTOR_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CONNECTOR_ENCRYPTION_KEY environment variable is required in production for credential encryption");
    }
    logger.warn("CONNECTOR_ENCRYPTION_KEY not set — using derived development key. Set this variable before deploying to production.");
    return scryptSync(process.env.DATABASE_URL ?? "rmm-dev-only-key", "rmm-connector-salt", 32);
  }
  return scryptSync(key, "rmm-connector-salt", 32);
})();

function encryptConfig(config: Record<string, unknown>): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const plaintext = JSON.stringify(config);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptConfig(data: unknown): Record<string, unknown> {
  if (typeof data === "string" && data.startsWith("enc:")) {
    const parts = data.split(":");
    if (parts.length !== 4) return {};
    const iv = Buffer.from(parts[1], "hex");
    const tag = Buffer.from(parts[2], "hex");
    const encrypted = Buffer.from(parts[3], "hex");
    const decipher = createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  }
  if (typeof data === "object" && data !== null) return data as Record<string, unknown>;
  return {};
}

const router: IRouter = Router();
const auth = authMiddleware({ required: true });
const authWrite = authMiddleware({ required: true });
const roleAdmin = requireRole("admin");
const roleOperator = requireRole("admin", "operator", "ops");

type ConnectorRow = {
  id: number;
  name: string;
  provider: string;
  mode: string;
  status: string;
  authType: string;
  config: Record<string, unknown>;
  lastSyncAt: Date | null;
  lastErrorAt: Date | null;
  lastError: string | null;
  syncIntervalMinutes: number | null;
  deviceCount: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PlaybookRow = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  executionMode: string;
  detectionRules: unknown[];
  remediationActions: unknown[];
  targetDeviceTypes: string[];
  targetClientIds: number[];
  confidenceThreshold: number | null;
  successRate: number | null;
  totalExecutions: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type RemoteActionRow = {
  id: number;
  deviceId: number | null;
  connectorId: number | null;
  actionType: string;
  target: string | null;
  parameters: Record<string, unknown>;
  status: string;
  requiresApproval: boolean | null;
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  providerJobId: string | null;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  executedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type HealingExecutionRow = {
  id: number;
  playbookId: number | null;
  deviceId: number | null;
  clientId: number | null;
  triggeredBy: string;
  status: string;
  approvalRequired: boolean | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  detectionContext: Record<string, unknown>;
  beforeMetrics: unknown;
  afterMetrics: unknown;
  actionsExecuted: unknown[];
  healingConfidenceScore: number | null;
  ticketId: number | null;
  psaTicketRef: string | null;
  notes: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

async function queryConnectors(): Promise<ConnectorRow[]> {
  const rows = await db.execute<ConnectorRow>(sql`
    SELECT id, name, provider, mode, status, auth_type as "authType", config,
           last_sync_at as "lastSyncAt", last_error_at as "lastErrorAt", last_error as "lastError",
           sync_interval_minutes as "syncIntervalMinutes", device_count as "deviceCount",
           notes, created_at as "createdAt", updated_at as "updatedAt"
    FROM msp_rmm_connectors
    ORDER BY created_at DESC
  `);
  return rows.rows as ConnectorRow[];
}

async function queryConnectorById(id: number): Promise<ConnectorRow | null> {
  const rows = await db.execute<ConnectorRow>(sql`
    SELECT id, name, provider, mode, status, auth_type as "authType", config,
           last_sync_at as "lastSyncAt", last_error_at as "lastErrorAt", last_error as "lastError",
           sync_interval_minutes as "syncIntervalMinutes", device_count as "deviceCount",
           notes, created_at as "createdAt", updated_at as "updatedAt"
    FROM msp_rmm_connectors WHERE id = ${id}
  `);
  return (rows.rows[0] as ConnectorRow) ?? null;
}

function stripSecrets(config: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (["clientSecret", "password", "apiKey"].includes(k) && typeof v === "string" && v.length > 4) {
      safe[k] = `${"*".repeat(v.length - 4)}${v.slice(-4)}`;
    } else {
      safe[k] = v;
    }
  }
  return safe;
}

function buildProviderConfig(row: ConnectorRow): RmmProviderConfig {
  const cfg = decryptConfig(row.config);
  return {
    provider: row.provider,
    authType: row.authType as RmmProviderConfig["authType"],
    baseUrl: cfg.baseUrl as string | undefined,
    apiKey: cfg.apiKey as string | undefined,
    clientId: cfg.clientId as string | undefined,
    clientSecret: cfg.clientSecret as string | undefined,
    username: cfg.username as string | undefined,
    password: cfg.password as string | undefined,
    companyId: cfg.companyId as string | undefined,
  };
}

function isProviderSupported(provider: string): boolean {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(provider);
}

router.get("/rmm/providers", auth, async (_req, res) => {
  try {
    const rows = await queryConnectors();
    const providers = rows.map(r => ({
      ...r,
      config: stripSecrets(decryptConfig(r.config)),
      supported: isProviderSupported(r.provider),
    }));
    sendSuccess(res, { providers, total: providers.length, supportedProviders: [...SUPPORTED_PROVIDERS] });
  } catch (err) { handleRouteError(res, err, "Failed to list RMM providers"); }
});

router.get("/rmm/providers/:id", auth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    const row = await queryConnectorById(id);
    if (!row) return sendNotFound(res, "Provider");
    sendSuccess(res, { ...row, config: stripSecrets(decryptConfig(row.config)), supported: isProviderSupported(row.provider) });
  } catch (err) { handleRouteError(res, err, "Failed to get RMM provider"); }
});

router.post("/rmm/providers", authWrite, roleAdmin, async (req, res) => {
  try {
    const { name, provider, mode, authType, config, syncIntervalMinutes, notes } = req.body;
    if (!name) return sendBadRequest(res, "name is required");
    if (!provider) return sendBadRequest(res, "provider is required");
    const encryptedConfig = encryptConfig(config ?? {});
    const result = await db.execute(sql`
      INSERT INTO msp_rmm_connectors (name, provider, mode, auth_type, config, sync_interval_minutes, notes, status)
      VALUES (${name}, ${provider}, ${mode ?? "both"}, ${authType ?? "api_key"}, ${JSON.stringify(encryptedConfig)}::jsonb, ${syncIntervalMinutes ?? 5}, ${notes ?? null}, 'pending')
      RETURNING id, name, provider, status, created_at as "createdAt"
    `);
    const row = result.rows[0] as { id: number; name: string; provider: string; status: string; createdAt: Date };
    sendCreated(res, { provider: row, supported: isProviderSupported(provider) });
  } catch (err) { handleRouteError(res, err, "Failed to create RMM provider"); }
});

router.patch("/rmm/providers/:id", authWrite, roleAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    const { name, mode, status, config, syncIntervalMinutes, notes } = req.body;
    const existing = await queryConnectorById(id);
    if (!existing) return sendNotFound(res, "Provider");

    const updName = name !== undefined ? String(name) : existing.name;
    const updMode = mode !== undefined ? String(mode) : existing.mode;
    const updStatus = status !== undefined ? String(status) : existing.status;
    const updConfig = config !== undefined ? JSON.stringify(encryptConfig(config)) : JSON.stringify(existing.config);
    const updSyncMin = syncIntervalMinutes !== undefined ? parseInt(syncIntervalMinutes, 10) : (existing.syncIntervalMinutes ?? 5);
    const updNotes = notes !== undefined ? String(notes) : (existing.notes ?? "");

    clearProviderCache(id);
    await db.execute(sql`
      UPDATE msp_rmm_connectors
      SET name = ${updName}, mode = ${updMode}, status = ${updStatus},
          config = ${updConfig}::jsonb, sync_interval_minutes = ${updSyncMin},
          notes = ${updNotes}, updated_at = NOW()
      WHERE id = ${id}
    `);
    const updated = await queryConnectorById(id);
    if (!updated) return sendNotFound(res, "Provider");
    sendSuccess(res, { ...updated, config: stripSecrets(decryptConfig(updated.config)) });
  } catch (err) { handleRouteError(res, err, "Failed to update RMM provider"); }
});

router.delete("/rmm/providers/:id", authWrite, roleAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    clearProviderCache(id);
    await db.execute(sql`DELETE FROM msp_rmm_connectors WHERE id = ${id}`);
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete RMM provider"); }
});

router.post("/rmm/providers/:id/test", authWrite, roleAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    const row = await queryConnectorById(id);
    if (!row) return sendNotFound(res, "Provider");
    let provider = getCachedProvider(id);
    if (!provider) provider = setCachedProvider(id, buildProviderConfig(row));
    if (!provider) return sendBadRequest(res, `Provider type '${row.provider}' not supported for live testing`);
    const result = await provider.testConnection();
    if (result.ok) {
      await db.execute(sql`UPDATE msp_rmm_connectors SET status = 'active', last_sync_at = NOW(), last_error = NULL, updated_at = NOW() WHERE id = ${id}`);
    } else {
      await db.execute(sql`UPDATE msp_rmm_connectors SET status = 'error', last_error_at = NOW(), last_error = ${result.error ?? "Unknown error"}, updated_at = NOW() WHERE id = ${id}`);
    }
    sendSuccess(res, { connectionTest: result });
  } catch (err) { handleRouteError(res, err, "Failed to test RMM provider"); }
});

router.post("/rmm/providers/:id/sync", authWrite, roleOperator, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    const row = await queryConnectorById(id);
    if (!row) return sendNotFound(res, "Provider");
    let provider = getCachedProvider(id);
    if (!provider) provider = setCachedProvider(id, buildProviderConfig(row));
    if (!provider) return sendBadRequest(res, `Provider type '${row.provider}' not yet supported`);
    const devices = await provider.getDevices();

    let upserted = 0;
    for (const dev of devices) {
      const d = dev as Record<string, unknown>;
      const hostname = String(d.hostname ?? d.systemName ?? d.name ?? `device-${d.id}`);
      const deviceId = String(d.id ?? d.deviceId ?? "");
      const ipAddress = String(d.ipAddress ?? d.lastIp ?? d.publicIP ?? "");
      const osName = String(d.os ?? d.osName ?? d.operatingSystem ?? "");
      const status = String(d.status ?? (d.online === true ? "online" : d.online === false ? "offline" : "online"));

      const cpuVal = Number(d.cpuUsage ?? d.cpu ?? 0);
      const memVal = Number(d.memoryUsage ?? d.memory ?? 0);
      const diskVal = Number(d.diskUsage ?? d.disk ?? 0);
      const alertsVal = Number(d.alerts ?? d.openAlertCount ?? 0);
      const patchesVal = Number(d.patchesPending ?? d.patchesMissing ?? 0);
      const threatsVal = Number(d.threats ?? 0);

      const upsertResult = await db.execute(sql`
        INSERT INTO msp_devices (device_id, hostname, client_name, connector_id, type, os, ip_address, status, cpu, memory, disk, alerts, patches_pending, threats, last_seen, updated_at)
        VALUES (${deviceId}, ${hostname}, ${row.name}, ${id}, 'workstation', ${osName}, ${ipAddress}, ${status}, ${cpuVal}, ${memVal}, ${diskVal}, ${alertsVal}, ${patchesVal}, ${threatsVal}, NOW(), NOW())
        ON CONFLICT (device_id) DO UPDATE SET
          hostname = EXCLUDED.hostname, os = EXCLUDED.os, ip_address = EXCLUDED.ip_address,
          status = EXCLUDED.status, connector_id = EXCLUDED.connector_id, cpu = EXCLUDED.cpu,
          memory = EXCLUDED.memory, disk = EXCLUDED.disk, alerts = EXCLUDED.alerts,
          patches_pending = EXCLUDED.patches_pending, threats = EXCLUDED.threats,
          last_seen = NOW(), updated_at = NOW()
        RETURNING id
      `);
      const resolvedDevicePk = (upsertResult.rows[0] as { id: number } | undefined)?.id ?? null;

      await db.execute(sql`
        INSERT INTO msp_rmm_device_metrics (device_id, device_db_id, connector_id, provider_device_id, cpu, memory, disk, snapshot_at)
        VALUES (${resolvedDevicePk}, ${deviceId}, ${id}, ${deviceId}, ${cpuVal}, ${memVal}, ${diskVal}, NOW())
      `);
      upserted++;
    }

    await db.execute(sql`UPDATE msp_rmm_connectors SET last_sync_at = NOW(), device_count = ${devices.length}, status = 'active', updated_at = NOW() WHERE id = ${id}`);
    sendSuccess(res, {
      syncedAt: new Date().toISOString(),
      devicesFound: devices.length,
      devicesUpserted: upserted,
      devices: devices.slice(0, 5),
    });
  } catch (err) { handleRouteError(res, err, "Failed to sync RMM provider"); }
});

router.get("/rmm/devices", auth, async (req, res) => {
  try {
    const connectorId = req.query.connectorId ? parseInt(req.query.connectorId as string, 10) : null;

    if (connectorId) {
      const row = await queryConnectorById(connectorId);
      if (!row) return sendNotFound(res, "Connector");
      let provider = getCachedProvider(connectorId);
      if (!provider) provider = setCachedProvider(connectorId, buildProviderConfig(row));
      if (!provider) return sendBadRequest(res, "Provider not supported");
      const devices = await provider.getDevices();
      sendSuccess(res, { devices, source: row.provider, total: devices.length, fetchedAt: new Date().toISOString() });
      return;
    }

    const connectors = await queryConnectors();
    const activeConnectors = connectors.filter(c => c.status === "active");
    const allDevices: Array<unknown> = [];
    const providerStatus: Array<{ id: number; name: string; provider: string; deviceCount: number; status: string }> = [];

    for (const conn of activeConnectors) {
      let provider = getCachedProvider(conn.id);
      if (!provider) provider = setCachedProvider(conn.id, buildProviderConfig(conn));
      if (!provider) continue;
      try {
        const devices = await provider.getDevices();
        allDevices.push(...devices.map(d => ({ ...d, connectorId: conn.id, connectorName: conn.name })));
        providerStatus.push({ id: conn.id, name: conn.name, provider: conn.provider, deviceCount: devices.length, status: "synced" });
      } catch (err) {
        logger.warn({ err, connectorId: conn.id }, "Failed to get devices from provider");
        providerStatus.push({ id: conn.id, name: conn.name, provider: conn.provider, deviceCount: 0, status: "error" });
      }
    }

    const dbDevices = await db.select().from(mspDevicesTable).orderBy(desc(mspDevicesTable.updatedAt)).limit(200);

    sendSuccess(res, {
      source: activeConnectors.length > 0 ? "live_providers" : "database",
      providerDevices: allDevices,
      dbDevices,
      providerStatus,
      totalProviderDevices: allDevices.length,
      totalDbDevices: dbDevices.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch RMM devices"); }
});

router.get("/rmm/health", auth, async (_req, res) => {
  try {
    const connectors = await queryConnectors();

    const [deviceStats] = await db.select({
      total: sql<number>`count(*)::int`,
      online: sql<number>`count(*) filter (where status = 'online')::int`,
      warning: sql<number>`count(*) filter (where status = 'warning')::int`,
      critical: sql<number>`count(*) filter (where status = 'critical')::int`,
      offline: sql<number>`count(*) filter (where status = 'offline')::int`,
      avgCpu: sql<number>`coalesce(avg(cpu), 0)::int`,
      avgMemory: sql<number>`coalesce(avg(memory), 0)::int`,
      avgDisk: sql<number>`coalesce(avg(disk), 0)::int`,
      totalAlerts: sql<number>`coalesce(sum(alerts), 0)::int`,
    }).from(mspDevicesTable);

    const healingStats = await db.execute<{ status: string; count: number }>(sql`
      SELECT status, count(*)::int as count FROM msp_healing_executions GROUP BY status
    `);

    const pendingActions = await db.execute<{ count: number }>(sql`
      SELECT count(*)::int as count FROM msp_remote_actions WHERE status = 'pending_approval'
    `);

    const overallStatus = (deviceStats.critical ?? 0) > 0 ? "critical" :
      (deviceStats.warning ?? 0) > 0 ? "degraded" : "healthy";

    sendSuccess(res, {
      overallStatus,
      providers: {
        total: connectors.length,
        active: connectors.filter(c => c.status === "active").length,
        error: connectors.filter(c => c.status === "error").length,
        list: connectors.map(c => ({
          id: c.id, name: c.name, provider: c.provider, status: c.status,
          lastSyncAt: c.lastSyncAt, deviceCount: c.deviceCount,
        })),
      },
      devices: deviceStats,
      healing: {
        stats: Object.fromEntries((healingStats.rows as Array<{ status: string; count: number }>).map(r => [r.status, r.count])),
        pendingApprovals: (pendingActions.rows[0] as { count: number })?.count ?? 0,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to get RMM health"); }
});

router.get("/rmm/actions", auth, async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const deviceId = req.query.deviceId ? parseInt(req.query.deviceId as string, 10) : null;
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);

    const statusFilter = status && status !== "all" ? status : null;
    const actions = await db.execute<RemoteActionRow>(sql`
      SELECT ra.id, ra.device_id as "deviceId", ra.connector_id as "connectorId",
             ra.action_type as "actionType", ra.target, ra.parameters, ra.status,
             ra.requires_approval as "requiresApproval", ra.requested_by as "requestedBy",
             ra.approved_by as "approvedBy", ra.approved_at as "approvedAt",
             ra.provider_job_id as "providerJobId", ra.result, ra.error_message as "errorMessage",
             ra.executed_at as "executedAt", ra.completed_at as "completedAt",
             ra.created_at as "createdAt",
             d.hostname, d.client_name as "clientName"
      FROM msp_remote_actions ra
      LEFT JOIN msp_devices d ON d.id = ra.device_id
      WHERE (${statusFilter}::text IS NULL OR ra.status = ${statusFilter})
        AND (${deviceId}::int IS NULL OR ra.device_id = ${deviceId})
      ORDER BY ra.created_at DESC
      LIMIT ${limit}
    `);
    sendSuccess(res, { actions: actions.rows, total: actions.rows.length });
  } catch (err) { handleRouteError(res, err, "Failed to list remote actions"); }
});

router.post("/rmm/actions", authWrite, roleOperator, async (req, res) => {
  try {
    const { deviceId, actionType, target, parameters, requestedBy } = req.body;
    let { connectorId } = req.body;
    if (!deviceId) return sendBadRequest(res, "deviceId is required");
    if (!actionType) return sendBadRequest(res, "actionType is required");

    if (!connectorId) {
      const deviceRows = await db.select().from(mspDevicesTable).where(eq(mspDevicesTable.id, deviceId)).limit(1);
      const device = deviceRows[0];
      if (device?.connectorId) {
        connectorId = device.connectorId;
      } else {
        const activeConnectors = (await queryConnectors()).filter(c => c.status === "active" && (c.mode === "rmm" || c.mode === "both"));
        if (activeConnectors.length > 0) connectorId = activeConnectors[0].id;
      }
    }

    const DESTRUCTIVE_ACTIONS = ["reboot", "forced_reboot", "kill_process", "run_script", "service_stop"];
    const requiresApproval = DESTRUCTIVE_ACTIONS.includes(actionType);

    const result = await db.execute(sql`
      INSERT INTO msp_remote_actions (device_id, connector_id, action_type, target, parameters, status, requires_approval, requested_by)
      VALUES (${deviceId}, ${connectorId ?? null}, ${actionType}, ${target ?? null}, ${JSON.stringify(parameters ?? {})}::jsonb, ${requiresApproval ? "pending_approval" : "approved"}, ${requiresApproval}, ${requestedBy ?? "operator"})
      RETURNING id, action_type as "actionType", status, requires_approval as "requiresApproval", created_at as "createdAt"
    `);
    const action = result.rows[0] as { id: number; actionType: string; status: string; requiresApproval: boolean; createdAt: Date };
    if (!requiresApproval) {
      void executeRemoteAction(action.id, deviceId, connectorId, actionType, target, parameters ?? {});
    }
    sendCreated(res, { action, message: requiresApproval ? "Action queued for approval" : "Action executing" });
  } catch (err) { handleRouteError(res, err, "Failed to create remote action"); }
});

router.post("/rmm/actions/:id/approve", authWrite, roleOperator, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    const { approvedBy } = req.body;
    await db.execute(sql`
      UPDATE msp_remote_actions SET status = 'approved', approved_by = ${approvedBy ?? "operator"}, approved_at = NOW(), updated_at = NOW()
      WHERE id = ${id} AND status = 'pending_approval'
    `);
    const rows = await db.execute<RemoteActionRow>(sql`
      SELECT id, device_id as "deviceId", connector_id as "connectorId",
             action_type as "actionType", target, parameters, status,
             requires_approval as "requiresApproval", requested_by as "requestedBy",
             approved_by as "approvedBy", approved_at as "approvedAt",
             provider_job_id as "providerJobId", result, error_message as "errorMessage",
             executed_at as "executedAt", completed_at as "completedAt",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM msp_remote_actions WHERE id = ${id}
    `);
    const action = rows.rows[0] as RemoteActionRow | undefined;
    if (!action) return sendNotFound(res, "Action");
    void executeRemoteAction(action.id, action.deviceId!, action.connectorId, action.actionType, action.target, action.parameters);
    sendSuccess(res, { action, message: "Action approved and executing" });
  } catch (err) { handleRouteError(res, err, "Failed to approve action"); }
});

router.post("/rmm/actions/:id/cancel", authWrite, roleOperator, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    await db.execute(sql`UPDATE msp_remote_actions SET status = 'cancelled', updated_at = NOW() WHERE id = ${id} AND status = 'pending_approval'`);
    sendSuccess(res, { cancelled: true });
  } catch (err) { handleRouteError(res, err, "Failed to cancel action"); }
});

async function executeRemoteAction(
  actionId: number,
  deviceId: number,
  connectorId: number | null | undefined,
  actionType: string,
  target: string | null | undefined,
  parameters: Record<string, unknown>,
): Promise<void> {
  try {
    await db.execute(sql`UPDATE msp_remote_actions SET status = 'executing', executed_at = NOW() WHERE id = ${actionId}`);

    if (!connectorId) {
      await db.execute(sql`
        UPDATE msp_remote_actions SET status = 'completed', result = '{"note": "No provider configured — action logged for audit"}'::jsonb, completed_at = NOW()
        WHERE id = ${actionId}
      `);
      return;
    }

    const connRow = await queryConnectorById(connectorId);
    if (!connRow) {
      await db.execute(sql`UPDATE msp_remote_actions SET status = 'failed', error_message = 'Connector not found', completed_at = NOW() WHERE id = ${actionId}`);
      return;
    }

    let provider = getCachedProvider(connectorId);
    if (!provider) provider = setCachedProvider(connectorId, buildProviderConfig(connRow));
    if (!provider) {
      await db.execute(sql`UPDATE msp_remote_actions SET status = 'failed', error_message = 'Provider not supported', completed_at = NOW() WHERE id = ${actionId}`);
      return;
    }

    const deviceRows = await db.execute<{ deviceId: string }>(sql`SELECT device_id as "deviceId" FROM msp_devices WHERE id = ${deviceId}`);
    const providerDeviceId = (deviceRows.rows[0] as { deviceId: string } | undefined)?.deviceId ?? String(deviceId);

    let result: { success: boolean; jobId?: string; output?: string; errorMessage?: string };
    const normalizedAction = actionType.replace("restart_service", "service_restart").replace("clear_disk", "clear_temp");
    switch (normalizedAction) {
      case "service_restart":
        result = await provider.restartService(providerDeviceId, target ?? "");
        break;
      case "service_start":
        result = await provider.runScript(providerDeviceId, `Start-Service -Name '${(target ?? "").replace(/'/g, "''")}'`, "powershell");
        break;
      case "service_stop":
        result = await provider.runScript(providerDeviceId, `Stop-Service -Name '${(target ?? "").replace(/'/g, "''")}'`, "powershell");
        break;
      case "reboot":
        result = await provider.rebootDevice(providerDeviceId, false);
        break;
      case "forced_reboot":
        result = await provider.rebootDevice(providerDeviceId, true);
        break;
      case "run_script":
        result = await provider.runScript(providerDeviceId, (parameters.script as string) ?? "", (parameters.scriptType as "powershell" | "bash") ?? "powershell");
        break;
      case "kill_process": {
        const pid = parseInt(String(parameters.processId ?? target ?? 0), 10);
        result = pid > 0
          ? await provider.killProcess(providerDeviceId, pid)
          : { success: false, errorMessage: "No valid PID provided" };
        break;
      }
      case "clear_temp":
        result = await provider.runScript(providerDeviceId, "Remove-Item -Path $env:TEMP\\* -Recurse -Force -ErrorAction SilentlyContinue; Write-Output 'Temp cleared'", "powershell");
        break;
      default:
        result = { success: false, errorMessage: `Unknown action type: ${actionType}` };
    }

    if (result.success) {
      await db.execute(sql`
        UPDATE msp_remote_actions SET status = 'completed', provider_job_id = ${result.jobId ?? null},
        result = ${JSON.stringify({ output: result.output, jobId: result.jobId })}::jsonb, completed_at = NOW()
        WHERE id = ${actionId}
      `);
    } else {
      await db.execute(sql`
        UPDATE msp_remote_actions SET status = 'failed', error_message = ${result.errorMessage ?? "Unknown error"}, completed_at = NOW()
        WHERE id = ${actionId}
      `);
    }
  } catch (err) {
    logger.error({ err, actionId }, "Remote action execution failed");
    await db.execute(sql`UPDATE msp_remote_actions SET status = 'failed', error_message = ${String(err)}, completed_at = NOW() WHERE id = ${actionId}`).catch(() => undefined);
  }
}

router.get("/rmm/playbooks", auth, async (_req, res) => {
  try {
    const playbooks = await db.execute<PlaybookRow>(sql`
      SELECT id, name, description, status, execution_mode as "executionMode",
             detection_rules as "detectionRules", remediation_actions as "remediationActions",
             target_device_types as "targetDeviceTypes", target_client_ids as "targetClientIds",
             confidence_threshold as "confidenceThreshold", success_rate as "successRate",
             total_executions as "totalExecutions", created_at as "createdAt", updated_at as "updatedAt"
      FROM msp_healing_playbooks
      ORDER BY created_at DESC
    `);
    sendSuccess(res, { playbooks: playbooks.rows, total: playbooks.rows.length });
  } catch (err) { handleRouteError(res, err, "Failed to list healing playbooks"); }
});

router.post("/rmm/playbooks", authWrite, roleAdmin, async (req, res) => {
  try {
    const { name, description, executionMode, detectionRules, remediationActions, targetDeviceTypes, targetClientIds, confidenceThreshold } = req.body;
    if (!name) return sendBadRequest(res, "name is required");
    const result = await db.execute(sql`
      INSERT INTO msp_healing_playbooks (name, description, execution_mode, detection_rules, remediation_actions, target_device_types, target_client_ids, confidence_threshold)
      VALUES (${name}, ${description ?? null}, ${executionMode ?? "human_gated"}, ${JSON.stringify(detectionRules ?? [])}::jsonb,
              ${JSON.stringify(remediationActions ?? [])}::jsonb, ${JSON.stringify(targetDeviceTypes ?? [])}::jsonb,
              ${JSON.stringify(targetClientIds ?? [])}::jsonb, ${confidenceThreshold ?? 70})
      RETURNING id, name, execution_mode as "executionMode", status, created_at as "createdAt"
    `);
    sendCreated(res, { playbook: result.rows[0] });
  } catch (err) { handleRouteError(res, err, "Failed to create playbook"); }
});

router.patch("/rmm/playbooks/:id", authWrite, roleAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    const { name, description, status, executionMode, detectionRules, remediationActions, confidenceThreshold } = req.body;
    const existing = await db.execute<PlaybookRow>(sql`
      SELECT id, name, description, status, execution_mode as "executionMode",
             detection_rules as "detectionRules", remediation_actions as "remediationActions",
             confidence_threshold as "confidenceThreshold"
      FROM msp_healing_playbooks WHERE id = ${id}
    `);
    const existingRow = existing.rows[0] as PlaybookRow | undefined;
    if (!existingRow) return sendNotFound(res, "Playbook");

    const updName = name !== undefined ? String(name) : existingRow.name;
    const updDesc = description !== undefined ? String(description) : (existingRow.description ?? "");
    const updStatus = status !== undefined ? String(status) : existingRow.status;
    const updMode = executionMode !== undefined ? String(executionMode) : existingRow.executionMode;
    const updRules = detectionRules !== undefined ? JSON.stringify(detectionRules) : JSON.stringify(existingRow.detectionRules ?? []);
    const updActions = remediationActions !== undefined ? JSON.stringify(remediationActions) : JSON.stringify(existingRow.remediationActions ?? []);
    const updThreshold = confidenceThreshold !== undefined ? parseInt(confidenceThreshold, 10) : (existingRow.confidenceThreshold ?? 70);

    await db.execute(sql`
      UPDATE msp_healing_playbooks
      SET name = ${updName}, description = ${updDesc}, status = ${updStatus},
          execution_mode = ${updMode}, detection_rules = ${updRules}::jsonb,
          remediation_actions = ${updActions}::jsonb, confidence_threshold = ${updThreshold},
          updated_at = NOW()
      WHERE id = ${id}
    `);
    const updated = await db.execute<PlaybookRow>(sql`
      SELECT id, name, description, status, execution_mode as "executionMode",
             detection_rules as "detectionRules", remediation_actions as "remediationActions",
             target_device_types as "targetDeviceTypes", target_client_ids as "targetClientIds",
             confidence_threshold as "confidenceThreshold", success_rate as "successRate",
             total_executions as "totalExecutions", created_at as "createdAt", updated_at as "updatedAt"
      FROM msp_healing_playbooks WHERE id = ${id}
    `);
    if (!updated.rows[0]) return sendNotFound(res, "Playbook");
    sendSuccess(res, { playbook: updated.rows[0] });
  } catch (err) { handleRouteError(res, err, "Failed to update playbook"); }
});

router.delete("/rmm/playbooks/:id", authWrite, roleAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    await db.execute(sql`DELETE FROM msp_healing_playbooks WHERE id = ${id}`);
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete playbook"); }
});

router.get("/rmm/playbooks/executions", auth, async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
    const statusFilter = status && status !== "all" ? status : null;
    const executions = await db.execute<HealingExecutionRow>(sql`
      SELECT he.id, he.playbook_id as "playbookId", he.device_id as "deviceId", he.client_id as "clientId",
             he.triggered_by as "triggeredBy", he.status, he.approval_required as "approvalRequired",
             he.approved_by as "approvedBy", he.approved_at as "approvedAt",
             he.detection_context as "detectionContext", he.before_metrics as "beforeMetrics",
             he.after_metrics as "afterMetrics", he.actions_executed as "actionsExecuted",
             he.healing_confidence_score as "healingConfidenceScore",
             he.psa_ticket_ref as "psaTicketRef", he.notes,
             he.started_at as "startedAt", he.completed_at as "completedAt", he.created_at as "createdAt",
             p.name as "playbookName", d.hostname, d.client_name as "clientName"
      FROM msp_healing_executions he
      LEFT JOIN msp_healing_playbooks p ON p.id = he.playbook_id
      LEFT JOIN msp_devices d ON d.id = he.device_id
      WHERE (${statusFilter}::text IS NULL OR he.status = ${statusFilter})
      ORDER BY he.created_at DESC
      LIMIT ${limit}
    `);
    sendSuccess(res, { executions: executions.rows, total: executions.rows.length });
  } catch (err) { handleRouteError(res, err, "Failed to list healing executions"); }
});

router.post("/rmm/playbooks/:id/execute", authWrite, roleOperator, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    const { deviceId, clientId, triggeredBy, detectionContext } = req.body;
    if (!deviceId) return sendBadRequest(res, "deviceId is required");

    const playbookRows = await db.execute<PlaybookRow>(sql`
      SELECT id, name, description, status, execution_mode as "executionMode",
             detection_rules as "detectionRules", remediation_actions as "remediationActions",
             target_device_types as "targetDeviceTypes", target_client_ids as "targetClientIds",
             confidence_threshold as "confidenceThreshold", success_rate as "successRate",
             total_executions as "totalExecutions", created_at as "createdAt", updated_at as "updatedAt"
      FROM msp_healing_playbooks WHERE id = ${id} AND status = 'active'
    `);
    const playbook = playbookRows.rows[0] as PlaybookRow | undefined;
    if (!playbook) return sendNotFound(res, "Active playbook");

    const deviceRows = await db.select().from(mspDevicesTable).where(eq(mspDevicesTable.id, deviceId)).limit(1);
    const device = deviceRows[0];
    if (!device) return sendNotFound(res, "Device");

    const beforeMetrics = { cpu: device.cpu ?? 0, memory: device.memory ?? 0, disk: device.disk ?? 0 };
    const requiresApproval = playbook.executionMode === "human_gated";
    const isNotifyOnly = playbook.executionMode === "notify_only";
    const confidenceScore = playbook.confidenceThreshold ?? 70;
    const initialStatus = isNotifyOnly ? "completed" : requiresApproval ? "pending_approval" : "running";

    const result = await db.execute(sql`
      INSERT INTO msp_healing_executions (playbook_id, device_id, client_id, triggered_by, status, approval_required, detection_context, before_metrics, healing_confidence_score, completed_at)
      VALUES (${id}, ${deviceId}, ${clientId ?? device.clientId ?? null}, ${triggeredBy ?? "manual"}, ${initialStatus},
              ${requiresApproval}, ${JSON.stringify(detectionContext ?? {})}::jsonb, ${JSON.stringify(beforeMetrics)}::jsonb, ${confidenceScore}, ${isNotifyOnly ? sql`NOW()` : sql`NULL`})
      RETURNING id, status, approval_required as "approvalRequired", created_at as "createdAt"
    `);
    const execution = result.rows[0] as { id: number; status: string; approvalRequired: boolean; createdAt: Date };

    if (playbook.executionMode === "full_auto") {
      void runHealingExecution(execution.id, deviceId, playbook);
    }

    const message = isNotifyOnly
      ? "Detection recorded (notify-only mode — no remediation executed)"
      : requiresApproval ? "Execution queued pending approval" : "Execution started";

    sendCreated(res, { execution, message });
  } catch (err) { handleRouteError(res, err, "Failed to execute playbook"); }
});

router.post("/rmm/playbooks/executions/:id/approve", authWrite, roleOperator, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    const { approvedBy } = req.body;
    await db.execute(sql`
      UPDATE msp_healing_executions SET status = 'running', approved_by = ${approvedBy ?? "operator"}, approved_at = NOW(), started_at = NOW()
      WHERE id = ${id} AND status = 'pending_approval'
    `);
    const execRows = await db.execute<HealingExecutionRow>(sql`
      SELECT id, playbook_id as "playbookId", device_id as "deviceId", client_id as "clientId",
             triggered_by as "triggeredBy", status, approval_required as "approvalRequired",
             approved_by as "approvedBy", approved_at as "approvedAt",
             detection_context as "detectionContext", before_metrics as "beforeMetrics",
             after_metrics as "afterMetrics", actions_executed as "actionsExecuted",
             healing_confidence_score as "healingConfidenceScore",
             ticket_id as "ticketId", psa_ticket_ref as "psaTicketRef", notes,
             started_at as "startedAt", completed_at as "completedAt", created_at as "createdAt"
      FROM msp_healing_executions WHERE id = ${id}
    `);
    const exec = execRows.rows[0] as HealingExecutionRow | undefined;
    if (!exec) return sendNotFound(res, "Execution");

    if (exec.playbookId && exec.deviceId) {
      const pbRows = await db.execute<PlaybookRow>(sql`
        SELECT id, name, description, status, execution_mode as "executionMode",
               detection_rules as "detectionRules", remediation_actions as "remediationActions",
               target_device_types as "targetDeviceTypes", target_client_ids as "targetClientIds",
               confidence_threshold as "confidenceThreshold", success_rate as "successRate",
               total_executions as "totalExecutions", created_at as "createdAt", updated_at as "updatedAt"
        FROM msp_healing_playbooks WHERE id = ${exec.playbookId}
      `);
      const playbook = pbRows.rows[0] as PlaybookRow | undefined;
      if (playbook) void runHealingExecution(id, exec.deviceId, playbook);
    }
    sendSuccess(res, { execution: exec, message: "Execution approved and running" });
  } catch (err) { handleRouteError(res, err, "Failed to approve execution"); }
});

router.post("/rmm/playbooks/executions/:id/reject", authWrite, roleOperator, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    await db.execute(sql`UPDATE msp_healing_executions SET status = 'rejected', completed_at = NOW() WHERE id = ${id}`);
    sendSuccess(res, { rejected: true });
  } catch (err) { handleRouteError(res, err, "Failed to reject execution"); }
});

async function runHealingExecution(executionId: number, deviceId: number, playbook: PlaybookRow): Promise<void> {
  try {
    const actionsExecuted: Array<{ action: string; result: string; at: string }> = [];
    const actions = playbook.remediationActions as Array<{ type: string; target?: string; parameters?: Record<string, unknown> }>;

    const deviceRows = await db.select().from(mspDevicesTable).where(eq(mspDevicesTable.id, deviceId)).limit(1);
    const deviceRow = deviceRows[0];
    let connectorId: number | null = deviceRow?.connectorId ?? null;
    if (!connectorId) {
      const activeConnectors = (await queryConnectors()).filter(c => c.status === "active" && (c.mode === "rmm" || c.mode === "both"));
      connectorId = activeConnectors.length > 0 ? activeConnectors[0].id : null;
    }

    for (const action of actions) {
      try {
        if (action.type === "escalate") {
          actionsExecuted.push({ action: action.type, result: "escalated", at: new Date().toISOString() });
          continue;
        }
        const actionResult = await db.execute(sql`
          INSERT INTO msp_remote_actions (device_id, connector_id, action_type, target, parameters, status, requires_approval, requested_by)
          VALUES (${deviceId}, ${connectorId}, ${action.type}, ${action.target ?? null}, ${JSON.stringify(action.parameters ?? {})}::jsonb, 'approved', false, 'auto-healing')
          RETURNING id
        `);
        const actionId = (actionResult.rows[0] as { id: number }).id;
        await executeRemoteAction(actionId, deviceId, connectorId, action.type, action.target ?? null, action.parameters ?? {});
        const completedRow = await db.execute<{ status: string }>(sql`SELECT status FROM msp_remote_actions WHERE id = ${actionId}`);
        const finalStatus = (completedRow.rows[0] as { status: string } | undefined)?.status ?? "unknown";
        actionsExecuted.push({ action: action.type, result: finalStatus === "completed" ? "success" : `failed: ${finalStatus}`, at: new Date().toISOString() });
      } catch (err) {
        actionsExecuted.push({ action: action.type, result: `error: ${String(err)}`, at: new Date().toISOString() });
      }
    }

    const afterDeviceRows = await db.select().from(mspDevicesTable).where(eq(mspDevicesTable.id, deviceId)).limit(1);
    const afterDevice = afterDeviceRows[0];
    const afterMetrics = afterDevice ? { cpu: afterDevice.cpu ?? 0, memory: afterDevice.memory ?? 0, disk: afterDevice.disk ?? 0 } : null;

    const allSuccess = actionsExecuted.every(a => a.result === "success");
    await db.execute(sql`
      UPDATE msp_healing_executions SET status = ${allSuccess ? "completed" : "failed"},
        actions_executed = ${JSON.stringify(actionsExecuted)}::jsonb,
        after_metrics = ${JSON.stringify(afterMetrics)}::jsonb,
        completed_at = NOW()
      WHERE id = ${executionId}
    `);

    await db.execute(sql`
      UPDATE msp_healing_playbooks SET total_executions = total_executions + 1,
        success_rate = CASE WHEN total_executions + 1 > 0 THEN
          (success_rate * total_executions + ${allSuccess ? 100 : 0}) / (total_executions + 1)
          ELSE ${allSuccess ? 100 : 0} END
      WHERE id = ${playbook.id}
    `);
  } catch (err) {
    logger.error({ err, executionId }, "Healing execution failed");
    await db.execute(sql`UPDATE msp_healing_executions SET status = 'failed', completed_at = NOW() WHERE id = ${executionId}`).catch(() => undefined);
  }
}

router.get("/rmm/predictions", auth, async (_req, res) => {
  try {
    const devices = await db.select().from(mspDevicesTable).limit(100);
    const predictions: Array<{
      deviceId: number; hostname: string; clientName: string;
      metric: string; currentValue: number; predictedFullAt?: string;
      severity: string; recommendation: string; dataSource: string;
    }> = [];

    const metricsRows = await db.execute<{
      device_id: number; fill_rate: number | null; predicted_full_at: string | null;
    }>(sql`
      SELECT device_id, disk_fill_rate_gb_per_hour as fill_rate, predicted_full_at
      FROM msp_rmm_device_metrics
      WHERE snapshot_at = (
        SELECT MAX(snapshot_at) FROM msp_rmm_device_metrics m2
        WHERE m2.device_id = msp_rmm_device_metrics.device_id
      )
    `);
    const metricsMap = new Map<number, { fillRate: number | null; predictedFullAt: string | null }>();
    for (const row of metricsRows.rows as Array<{ device_id: number; fill_rate: number | null; predicted_full_at: string | null }>) {
      metricsMap.set(row.device_id, { fillRate: row.fill_rate, predictedFullAt: row.predicted_full_at });
    }

    for (const device of devices) {
      if ((device.disk ?? 0) > 75) {
        const storedMetrics = metricsMap.get(device.id);
        const fillRate = storedMetrics?.fillRate ?? null;
        let predictedFullAt: string | null = storedMetrics?.predictedFullAt ?? null;
        if (!predictedFullAt && fillRate && fillRate > 0) {
          const remainingPct = 100 - (device.disk ?? 0);
          const hoursUntilFull = remainingPct / fillRate;
          predictedFullAt = new Date(Date.now() + hoursUntilFull * 3600 * 1000).toISOString();
        }
        predictions.push({
          deviceId: device.id,
          hostname: device.hostname,
          clientName: device.clientName ?? "",
          metric: "disk",
          currentValue: device.disk ?? 0,
          ...(predictedFullAt ? { predictedFullAt } : {}),
          severity: (device.disk ?? 0) > 90 ? "critical" : "warning",
          recommendation: "Clear temp files or expand storage",
          dataSource: storedMetrics ? "telemetry" : "threshold",
        });
      }
      if ((device.cpu ?? 0) > 85) {
        predictions.push({
          deviceId: device.id,
          hostname: device.hostname,
          clientName: device.clientName ?? "",
          metric: "cpu",
          currentValue: device.cpu ?? 0,
          severity: (device.cpu ?? 0) > 95 ? "critical" : "warning",
          recommendation: "Identify and restart runaway processes",
          dataSource: metricsMap.has(device.id) ? "telemetry" : "threshold",
        });
      }
      if ((device.memory ?? 0) > 88) {
        predictions.push({
          deviceId: device.id,
          hostname: device.hostname,
          clientName: device.clientName ?? "",
          metric: "memory",
          currentValue: device.memory ?? 0,
          severity: "warning",
          recommendation: "Restart memory-intensive services",
          dataSource: metricsMap.has(device.id) ? "telemetry" : "threshold",
        });
      }
    }

    const grouped = predictions.reduce<Record<string, typeof predictions>>((acc, p) => {
      const key = `${p.clientName}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

    const correlatedIncidents = Object.entries(grouped)
      .filter(([, items]) => items.length >= 3)
      .map(([client, items]) => ({
        client,
        affectedDevices: items.length,
        likelyCause: "Infrastructure issue — multiple devices affected simultaneously",
        recommendation: "Escalate to infrastructure team — may indicate network or shared resource failure",
        severity: "high",
      }));

    sendSuccess(res, {
      predictions: predictions.sort((a, b) => (b.currentValue - a.currentValue)),
      correlatedIncidents,
      totalPredictions: predictions.length,
      analyzedDevices: devices.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to generate predictions"); }
});

router.post("/rmm/psa/ticket", authWrite, roleOperator, async (req, res) => {
  try {
    const { connectorId, subject, description, priority, deviceId } = req.body;
    if (!connectorId || !subject) return sendBadRequest(res, "connectorId and subject are required");

    const connRow = await queryConnectorById(parseInt(connectorId, 10));
    if (!connRow) return sendNotFound(res, "Connector");
    let provider = getCachedProvider(connRow.id);
    if (!provider) provider = setCachedProvider(connRow.id, buildProviderConfig(connRow));
    if (!provider) return sendBadRequest(res, "Provider not supported");

    const ticket = await provider.createTicket({ subject, description, priority: priority ?? "medium" });
    if (!ticket) {
      sendSuccess(res, { created: false, note: "PSA provider does not support ticket creation or is not configured as PSA" });
      return;
    }

    if (deviceId) {
      const deviceRows = await db.select().from(mspDevicesTable).where(eq(mspDevicesTable.id, parseInt(deviceId))).limit(1);
      if (deviceRows[0]) {
        await db.execute(sql`
          INSERT INTO msp_psa_ticket_sync (connector_id, psa_ticket_id, psa_url, sync_status, sla_timer_started_at)
          VALUES (${connRow.id}, ${ticket.providerTicketId}, ${ticket.psaUrl ?? null}, 'synced', NOW())
        `);
      }
    }

    sendCreated(res, { ticket });
  } catch (err) { handleRouteError(res, err, "Failed to create PSA ticket"); }
});

router.post("/rmm/psa/ticket/:psaTicketId/close", authWrite, roleOperator, async (req, res) => {
  try {
    const psaTicketId = String(req.params.psaTicketId);
    const { connectorId, note } = req.body;
    if (!connectorId) return sendBadRequest(res, "connectorId is required");

    const connRow = await queryConnectorById(parseInt(connectorId, 10));
    if (!connRow) return sendNotFound(res, "Connector");
    let provider = getCachedProvider(connRow.id);
    if (!provider) provider = setCachedProvider(connRow.id, buildProviderConfig(connRow));
    if (!provider) return sendBadRequest(res, "Provider not supported");

    const closed = await provider.closeTicket(psaTicketId, note);
    if (closed) {
      await db.execute(sql`UPDATE msp_psa_ticket_sync SET sync_status = 'closed', closed_at = NOW(), updated_at = NOW() WHERE psa_ticket_id = ${psaTicketId}`);
    }
    sendSuccess(res, { closed, psaTicketId });
  } catch (err) { handleRouteError(res, err, "Failed to close PSA ticket"); }
});

router.get("/rmm/org-site-mappings", auth, async (req, res) => {
  try {
    const connectorId = req.query.connectorId ? parseInt(req.query.connectorId as string, 10) : null;
    const mappings = await db.execute(sql`
      SELECT m.id, m.connector_id as "connectorId", m.provider_org_id as "providerOrgId",
             m.provider_org_name as "providerOrgName", m.provider_site_id as "providerSiteId",
             m.provider_site_name as "providerSiteName", m.internal_client_id as "internalClientId",
             m.sync_enabled as "syncEnabled", m.created_at as "createdAt", m.updated_at as "updatedAt",
             c.name as "connectorName", cl.name as "clientName"
      FROM msp_org_site_mappings m
      LEFT JOIN msp_rmm_connectors c ON c.id = m.connector_id
      LEFT JOIN msp_clients cl ON cl.id = m.internal_client_id
      WHERE (${connectorId}::int IS NULL OR m.connector_id = ${connectorId})
      ORDER BY m.created_at DESC
    `);
    sendSuccess(res, { mappings: mappings.rows, total: mappings.rows.length });
  } catch (err) { handleRouteError(res, err, "Failed to list org/site mappings"); }
});

router.post("/rmm/org-site-mappings", authWrite, roleAdmin, async (req, res) => {
  try {
    const { connectorId, providerOrgId, providerOrgName, providerSiteId, providerSiteName, internalClientId, syncEnabled } = req.body;
    if (!connectorId || !providerOrgId) return sendBadRequest(res, "connectorId and providerOrgId are required");
    const result = await db.execute(sql`
      INSERT INTO msp_org_site_mappings (connector_id, provider_org_id, provider_org_name, provider_site_id, provider_site_name, internal_client_id, sync_enabled)
      VALUES (${connectorId}, ${providerOrgId}, ${providerOrgName ?? null}, ${providerSiteId ?? null}, ${providerSiteName ?? null}, ${internalClientId ?? null}, ${syncEnabled ?? true})
      RETURNING id, connector_id as "connectorId", provider_org_id as "providerOrgId", provider_org_name as "providerOrgName",
                provider_site_id as "providerSiteId", provider_site_name as "providerSiteName",
                internal_client_id as "internalClientId", sync_enabled as "syncEnabled", created_at as "createdAt"
    `);
    sendCreated(res, { mapping: result.rows[0] });
  } catch (err) { handleRouteError(res, err, "Failed to create org/site mapping"); }
});

router.patch("/rmm/org-site-mappings/:id", authWrite, roleAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    const { internalClientId, syncEnabled, providerOrgName, providerSiteName } = req.body;
    await db.execute(sql`
      UPDATE msp_org_site_mappings
      SET internal_client_id = COALESCE(${internalClientId ?? null}::int, internal_client_id),
          sync_enabled = COALESCE(${syncEnabled ?? null}::boolean, sync_enabled),
          provider_org_name = COALESCE(${providerOrgName ?? null}::text, provider_org_name),
          provider_site_name = COALESCE(${providerSiteName ?? null}::text, provider_site_name),
          updated_at = NOW()
      WHERE id = ${id}
    `);
    sendSuccess(res, { updated: true });
  } catch (err) { handleRouteError(res, err, "Failed to update org/site mapping"); }
});

router.delete("/rmm/org-site-mappings/:id", authWrite, roleAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid ID");
    await db.execute(sql`DELETE FROM msp_org_site_mappings WHERE id = ${id}`);
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete org/site mapping"); }
});

router.post("/rmm/actions/bulk", authWrite, roleOperator, async (req, res) => {
  try {
    const { deviceIds, actionType, target, parameters, requestedBy } = req.body;
    if (!Array.isArray(deviceIds) || deviceIds.length === 0) return sendBadRequest(res, "deviceIds array is required");
    if (!actionType) return sendBadRequest(res, "actionType is required");
    if (deviceIds.length > 100) return sendBadRequest(res, "Maximum 100 devices per bulk operation");

    const DESTRUCTIVE_ACTIONS = ["reboot", "forced_reboot", "kill_process", "run_script", "service_stop"];
    const requiresApproval = DESTRUCTIVE_ACTIONS.includes(actionType);
    const results: Array<{ deviceId: number; actionId: number; status: string }> = [];

    for (const devId of deviceIds) {
      const deviceId = parseInt(String(devId), 10);
      if (isNaN(deviceId)) continue;

      let connectorId: number | null = null;
      const deviceRows = await db.select().from(mspDevicesTable).where(eq(mspDevicesTable.id, deviceId)).limit(1);
      const device = deviceRows[0];
      if (device?.connectorId) {
        connectorId = device.connectorId;
      } else {
        const activeConnectors = (await queryConnectors()).filter(c => c.status === "active" && (c.mode === "rmm" || c.mode === "both"));
        if (activeConnectors.length > 0) connectorId = activeConnectors[0].id;
      }

      const result = await db.execute(sql`
        INSERT INTO msp_remote_actions (device_id, connector_id, action_type, target, parameters, status, requires_approval, requested_by)
        VALUES (${deviceId}, ${connectorId}, ${actionType}, ${target ?? null}, ${JSON.stringify(parameters ?? {})}::jsonb, ${requiresApproval ? "pending_approval" : "approved"}, ${requiresApproval}, ${requestedBy ?? req.user?.displayName ?? "operator"})
        RETURNING id, status
      `);
      const row = result.rows[0] as { id: number; status: string };
      results.push({ deviceId, actionId: row.id, status: row.status });

      if (!requiresApproval && connectorId) {
        void executeRemoteAction(row.id, deviceId, connectorId, actionType, target ?? null, parameters ?? {});
      }
    }

    sendCreated(res, {
      bulkAction: { actionType, totalDevices: results.length, requiresApproval, actions: results },
      message: requiresApproval ? `${results.length} actions queued for approval` : `${results.length} actions executing`,
    });
  } catch (err) { handleRouteError(res, err, "Failed to create bulk action"); }
});

let syncSchedulerHandle: ReturnType<typeof setInterval> | null = null;

interface DetectionRule {
  metric: string;
  operator: "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: number;
  durationMinutes?: number;
}

function evaluateRule(rule: DetectionRule, value: number): boolean {
  switch (rule.operator) {
    case "gt": return value > rule.threshold;
    case "lt": return value < rule.threshold;
    case "eq": return value === rule.threshold;
    case "gte": return value >= rule.threshold;
    case "lte": return value <= rule.threshold;
    default: return false;
  }
}

function getMetricValue(device: { cpu: number | null; memory: number | null; disk: number | null; alerts: number | null; threats: number | null }, metric: string): number {
  switch (metric) {
    case "cpu": return device.cpu ?? 0;
    case "memory": return device.memory ?? 0;
    case "disk": return device.disk ?? 0;
    case "alerts": return device.alerts ?? 0;
    case "threats": return device.threats ?? 0;
    default: return 0;
  }
}

async function runAutomatedDetection(): Promise<void> {
  try {
    const playbookRows = await db.execute<PlaybookRow>(sql`
      SELECT id, name, description, status, execution_mode as "executionMode",
             detection_rules as "detectionRules", remediation_actions as "remediationActions",
             target_device_types as "targetDeviceTypes", target_client_ids as "targetClientIds",
             confidence_threshold as "confidenceThreshold", success_rate as "successRate",
             total_executions as "totalExecutions"
      FROM msp_healing_playbooks WHERE status = 'active'
    `);
    const playbooks = playbookRows.rows as PlaybookRow[];
    if (playbooks.length === 0) return;

    const devices = await db.select().from(mspDevicesTable).limit(500);
    let triggered = 0;

    for (const playbook of playbooks) {
      const rules = (playbook.detectionRules ?? []) as DetectionRule[];
      if (rules.length === 0) continue;

      const targetTypes = (playbook.targetDeviceTypes ?? []) as string[];
      const targetClients = (playbook.targetClientIds ?? []) as number[];

      for (const device of devices) {
        if (targetTypes.length > 0 && !targetTypes.includes(device.type)) continue;
        if (targetClients.length > 0 && device.clientId && !targetClients.includes(device.clientId)) continue;

        const allRulesMatch = rules.every(rule => evaluateRule(rule, getMetricValue(device, rule.metric)));
        if (!allRulesMatch) continue;

        const recentExec = await db.execute(sql`
          SELECT id FROM msp_healing_executions
          WHERE playbook_id = ${playbook.id} AND device_id = ${device.id}
            AND created_at > NOW() - INTERVAL '15 minutes'
          LIMIT 1
        `);
        if (recentExec.rows.length > 0) continue;

        const isNotifyOnly = playbook.executionMode === "notify_only";
        const requiresApproval = playbook.executionMode === "human_gated";
        const initialStatus = isNotifyOnly ? "completed" : requiresApproval ? "pending_approval" : "running";
        const beforeMetrics = { cpu: device.cpu ?? 0, memory: device.memory ?? 0, disk: device.disk ?? 0 };
        const detectionContext = { rules, matchedValues: rules.map(r => ({ metric: r.metric, value: getMetricValue(device, r.metric), threshold: r.threshold })) };

        const execResult = await db.execute(sql`
          INSERT INTO msp_healing_executions (playbook_id, device_id, client_id, triggered_by, status, approval_required, detection_context, before_metrics, healing_confidence_score, completed_at)
          VALUES (${playbook.id}, ${device.id}, ${device.clientId ?? null}, 'auto-detection', ${initialStatus},
                  ${requiresApproval}, ${JSON.stringify(detectionContext)}::jsonb, ${JSON.stringify(beforeMetrics)}::jsonb, ${playbook.confidenceThreshold ?? 70}, ${isNotifyOnly ? sql`NOW()` : sql`NULL`})
          RETURNING id
        `);
        const executionId = (execResult.rows[0] as { id: number }).id;

        if (playbook.executionMode === "full_auto") {
          void runHealingExecution(executionId, device.id, playbook);
        }

        if (initialStatus !== "completed") {
          await createPsaTicketForDetection(device, playbook, detectionContext);
        }

        triggered++;
        logger.info({ playbookId: playbook.id, deviceId: device.id, executionId, mode: playbook.executionMode }, "Auto-detection triggered healing");
      }
    }

    if (triggered > 0) {
      logger.info({ triggered }, "Automated detection cycle completed");
    }
  } catch (err) {
    logger.error({ err }, "Automated detection cycle failed");
  }
}

async function createPsaTicketForDetection(
  device: { id: number; hostname: string; clientName: string | null; connectorId: number | null },
  playbook: PlaybookRow,
  detectionContext: Record<string, unknown>
): Promise<void> {
  try {
    const psaConnectors = (await queryConnectors()).filter(c => c.status === "active" && (c.mode === "psa" || c.mode === "both"));
    if (psaConnectors.length === 0) return;

    const conn = psaConnectors[0];
    let provider = getCachedProvider(conn.id);
    if (!provider) provider = setCachedProvider(conn.id, buildProviderConfig(conn));
    if (!provider) return;

    const matchedRules = (detectionContext.matchedValues as Array<{ metric: string; value: number; threshold: number }>) ?? [];
    const description = `Auto-detected issue on ${device.hostname}:\n${matchedRules.map(r => `• ${r.metric}: ${r.value} (threshold: ${r.threshold})`).join("\n")}\n\nPlaybook: ${playbook.name}`;

    const ticket = await provider.createTicket({
      subject: `[Auto-Heal] ${playbook.name} — ${device.hostname}`,
      description,
      priority: "high",
      status: "open",
    });

    if (ticket) {
      const ticketNumber = `PSA-${ticket.providerTicketId}`;
      await db.execute(sql`
        INSERT INTO msp_tickets (ticket_number, subject, description, client_name, priority, status, category, sla_deadline)
        VALUES (${ticketNumber}, ${`[Auto-Heal] ${playbook.name} — ${device.hostname}`}, ${description}, ${device.clientName ?? "Unknown"}, 'high', 'open', 'auto-healing', NOW() + INTERVAL '4 hours')
        ON CONFLICT (ticket_number) DO NOTHING
      `);

      const internalTicket = await db.execute<{ id: number }>(sql`SELECT id FROM msp_tickets WHERE ticket_number = ${ticketNumber} LIMIT 1`);
      const internalId = (internalTicket.rows[0] as { id: number } | undefined)?.id;

      if (internalId) {
        await db.execute(sql`
          INSERT INTO msp_psa_ticket_sync (internal_ticket_id, connector_id, psa_ticket_id, psa_url, sync_status, last_sync_at, sla_timer_started_at)
          VALUES (${internalId}, ${conn.id}, ${ticket.providerTicketId}, ${ticket.psaUrl ?? ""}, 'synced', NOW(), NOW())
        `);
      }

      logger.info({ psaTicketId: ticket.providerTicketId, deviceId: device.id, playbook: playbook.name }, "PSA ticket created for auto-detection");
    }
  } catch (err) {
    logger.warn({ err, deviceId: device.id }, "PSA ticket creation for detection failed (non-fatal)");
  }
}

async function syncPsaTicketLifecycle(): Promise<void> {
  try {
    const openSyncs = await db.execute<{ id: number; connector_id: number; psa_ticket_id: string; internal_ticket_id: number; sla_timer_started_at: string | null }>(sql`
      SELECT id, connector_id, psa_ticket_id, internal_ticket_id, sla_timer_started_at
      FROM msp_psa_ticket_sync WHERE sync_status NOT IN ('closed', 'error') AND psa_ticket_id IS NOT NULL
      LIMIT 100
    `);

    for (const sync of openSyncs.rows as Array<{ id: number; connector_id: number; psa_ticket_id: string; internal_ticket_id: number; sla_timer_started_at: string | null }>) {
      try {
        const internalTicket = await db.execute<{ status: string; sla_deadline: string | null }>(sql`
          SELECT status, sla_deadline FROM msp_tickets WHERE id = ${sync.internal_ticket_id} LIMIT 1
        `);
        const ticket = internalTicket.rows[0] as { status: string; sla_deadline: string | null } | undefined;
        if (!ticket) continue;

        if (ticket.status === "resolved" || ticket.status === "closed") {
          const conn = await queryConnectorById(sync.connector_id);
          if (conn) {
            let provider = getCachedProvider(conn.id);
            if (!provider) provider = setCachedProvider(conn.id, buildProviderConfig(conn));
            if (provider) {
              await provider.closeTicket(sync.psa_ticket_id, "Resolved via auto-healing remediation");
            }
          }
          await db.execute(sql`UPDATE msp_psa_ticket_sync SET sync_status = 'closed', closed_at = NOW(), last_sync_at = NOW(), updated_at = NOW() WHERE id = ${sync.id}`);
          continue;
        }

        if (ticket.sla_deadline) {
          const deadline = new Date(ticket.sla_deadline);
          const isBreached = deadline.getTime() < Date.now();
          const isAtRisk = !isBreached && (deadline.getTime() - Date.now()) < 30 * 60_000;
          const slaStatus = isBreached ? "breached" : isAtRisk ? "at-risk" : "on-track";
          await db.execute(sql`UPDATE msp_psa_ticket_sync SET sla_breach = ${isBreached}, last_sync_at = NOW(), updated_at = NOW() WHERE id = ${sync.id}`);
          await db.execute(sql`UPDATE msp_tickets SET sla_status = ${slaStatus}, updated_at = NOW() WHERE id = ${sync.internal_ticket_id}`);
        }

        await db.execute(sql`UPDATE msp_psa_ticket_sync SET last_sync_at = NOW(), updated_at = NOW() WHERE id = ${sync.id}`);
      } catch (err) {
        logger.warn({ err, syncId: sync.id }, "PSA sync for individual ticket failed");
      }
    }
  } catch (err) {
    logger.error({ err }, "PSA ticket lifecycle sync failed");
  }
}

async function runScheduledSync(): Promise<void> {
  try {
    const connectors = await queryConnectors();
    const active = connectors.filter(c => c.status === "active" && (c.mode === "rmm" || c.mode === "both"));
    for (const conn of active) {
      const syncInterval = (conn.syncIntervalMinutes ?? 5) * 60_000;
      const lastSync = conn.lastSyncAt ? new Date(conn.lastSyncAt).getTime() : 0;
      if (Date.now() - lastSync < syncInterval) continue;

      try {
        let provider = getCachedProvider(conn.id);
        if (!provider) provider = setCachedProvider(conn.id, buildProviderConfig(conn));
        if (!provider) continue;

        const devices = await provider.getDevices();
        let upserted = 0;
        for (const dev of devices) {
          const upsertResult = await db.execute(sql`
            INSERT INTO msp_devices (device_id, hostname, client_name, connector_id, type, os, ip_address, status, cpu, memory, disk, alerts, patches_pending, threats, last_seen, updated_at)
            VALUES (${dev.providerDeviceId}, ${dev.hostname}, ${dev.clientName}, ${conn.id}, ${dev.type}, ${dev.os}, ${dev.ipAddress}, ${dev.status}, ${dev.cpu}, ${dev.memory}, ${dev.disk}, ${dev.alerts}, ${dev.patchesPending}, ${dev.threats}, NOW(), NOW())
            ON CONFLICT (device_id) DO UPDATE SET
              hostname = EXCLUDED.hostname, os = EXCLUDED.os, ip_address = EXCLUDED.ip_address,
              status = EXCLUDED.status, connector_id = EXCLUDED.connector_id, cpu = EXCLUDED.cpu,
              memory = EXCLUDED.memory, disk = EXCLUDED.disk, alerts = EXCLUDED.alerts,
              patches_pending = EXCLUDED.patches_pending, threats = EXCLUDED.threats,
              last_seen = NOW(), updated_at = NOW()
            RETURNING id
          `);
          const resolvedId = (upsertResult.rows[0] as { id: number } | undefined)?.id ?? null;
          await db.execute(sql`
            INSERT INTO msp_rmm_device_metrics (device_id, device_db_id, connector_id, provider_device_id, cpu, memory, disk, snapshot_at)
            VALUES (${resolvedId}, ${dev.providerDeviceId}, ${conn.id}, ${dev.providerDeviceId}, ${dev.cpu}, ${dev.memory}, ${dev.disk}, NOW())
          `);
          upserted++;
        }
        await db.execute(sql`UPDATE msp_rmm_connectors SET last_sync_at = NOW(), device_count = ${devices.length}, status = 'active', updated_at = NOW() WHERE id = ${conn.id}`);
        logger.info({ connectorId: conn.id, provider: conn.provider, devicesUpserted: upserted }, "Scheduled sync completed");
      } catch (err) {
        logger.error({ err, connectorId: conn.id }, "Scheduled sync failed for connector");
        await db.execute(sql`UPDATE msp_rmm_connectors SET status = 'error', last_error = ${String(err)}, last_error_at = NOW(), updated_at = NOW() WHERE id = ${conn.id}`).catch(() => undefined);
      }
    }

    await runAutomatedDetection();
    await syncPsaTicketLifecycle();
  } catch (err) {
    logger.error({ err }, "Scheduled sync cycle failed");
  }
}

export function startSyncScheduler(intervalMs: number = 60_000): void {
  if (syncSchedulerHandle) return;
  logger.info({ intervalMs }, "Starting RMM sync scheduler");
  syncSchedulerHandle = setInterval(() => { void runScheduledSync(); }, intervalMs);
  setTimeout(() => { void runScheduledSync(); }, 5_000);
}

export function stopSyncScheduler(): void {
  if (syncSchedulerHandle) {
    clearInterval(syncSchedulerHandle);
    syncSchedulerHandle = null;
    logger.info("Stopped RMM sync scheduler");
  }
}

export default router;
