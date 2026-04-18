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

export async function executeRemoteAction(
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


export function register(r: IRouter): void { r.use(router); }
