import { Router, type IRouter } from "express";
import { db, mspDevicesTable, mspClientsTable } from "@szl-holdings/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendError, handleRouteError } from "../../lib/api-response";
import { authMiddleware, requireRole } from "../../middlewares/auth";
import { logger } from "../../lib/logger";
import { createRmmProvider, setCachedProvider, getCachedProvider, clearProviderCache, type RmmProviderConfig } from "../../services/rmm-provider";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { auth, authWrite, roleAdmin, roleOperator, queryConnectors, queryConnectorById, stripSecrets, buildProviderConfig, isProviderSupported } from "./shared";

const router: IRouter = Router();


import { executeRemoteAction } from "./actions";
import { runHealingExecution } from "./playbooks";

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



export function register(r: IRouter): void { r.use(router); }
