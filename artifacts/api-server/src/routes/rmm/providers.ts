import { Router, type IRouter } from "express";
import { db, mspDevicesTable, mspClientsTable } from "@szl-holdings/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendError, handleRouteError } from "../../lib/api-response";
import { authMiddleware, requireRole } from "../../middlewares/auth";
import { logger } from "../../lib/logger";
import { createRmmProvider, setCachedProvider, getCachedProvider, clearProviderCache, type RmmProviderConfig } from "../../services/rmm-provider";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { auth, authWrite, roleAdmin, roleOperator, queryConnectors, queryConnectorById, stripSecrets, buildProviderConfig, isProviderSupported, decryptConfig, encryptConfig, SUPPORTED_PROVIDERS } from "./shared";
import { validateBody, rmmProviderCreateSchema, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../../lib/validation";

const router: IRouter = Router();


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

router.post("/rmm/providers", authWrite, roleAdmin, validateBody(rmmProviderCreateSchema), async (req, res) => {
  try {
    const { name, provider, mode, authType, config, syncIntervalMinutes, notes } = req.body;
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

router.patch("/rmm/providers/:id", authWrite, roleAdmin, validateBody(jsonObjectBodySchema), async (req, res) => {
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

router.post("/rmm/providers/:id/test", authWrite, roleAdmin, validateBody(jsonObjectBodySchema), async (req, res) => {
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

router.post("/rmm/providers/:id/sync", authWrite, roleOperator, validateBody(jsonObjectBodySchema), async (req, res) => {
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
      const d = dev as unknown as Record<string, unknown>;
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

router.get("/rmm/devices", auth, validateQuery(listQuerySchema), async (req, res) => {
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


export function register(r: IRouter): void { r.use(router); }
