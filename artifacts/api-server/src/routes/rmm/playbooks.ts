import { bodyShape } from '@szl-holdings/contracts/common';
import { db, mspClientsTable, mspDevicesTable } from '@szl-holdings/db';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendError,
  sendNotFound,
  sendSuccess,
} from '../../lib/api-response';
import { logger } from '../../lib/logger';
import {
  listQuerySchema,
  rmmPlaybookCreateSchema,
  validateBody,
  validateQuery,
} from '../../lib/validation';
import { authMiddleware, requireRole } from '../../middlewares/auth';
import {
  clearProviderCache,
  createRmmProvider,
  getCachedProvider,
  type RmmProviderConfig,
  setCachedProvider,
} from '../../services/rmm-provider';
import {
  auth,
  authWrite,
  buildProviderConfig,
  type HealingExecutionRow,
  isProviderSupported,
  type PlaybookRow,
  queryConnectorById,
  queryConnectors,
  roleAdmin,
  roleOperator,
  stripSecrets,
} from './shared';

const router: IRouter = Router();

import { executeRemoteAction } from './actions';

router.get('/rmm/playbooks', auth, async (_req, res) => {
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
  } catch (err) {
    handleRouteError(res, err, 'Failed to list healing playbooks');
  }
});

router.post(
  '/rmm/playbooks',
  authWrite,
  roleAdmin,
  validateBody(rmmPlaybookCreateSchema),
  async (req, res) => {
    try {
      const {
        name,
        description,
        executionMode,
        detectionRules,
        remediationActions,
        targetDeviceTypes,
        targetClientIds,
        confidenceThreshold,
      } = req.body;
      const result = await db.execute(sql`
      INSERT INTO msp_healing_playbooks (name, description, execution_mode, detection_rules, remediation_actions, target_device_types, target_client_ids, confidence_threshold)
      VALUES (${name}, ${description ?? null}, ${executionMode ?? 'human_gated'}, ${JSON.stringify(detectionRules ?? [])}::jsonb,
              ${JSON.stringify(remediationActions ?? [])}::jsonb, ${JSON.stringify(targetDeviceTypes ?? [])}::jsonb,
              ${JSON.stringify(targetClientIds ?? [])}::jsonb, ${confidenceThreshold ?? 70})
      RETURNING id, name, execution_mode as "executionMode", status, created_at as "createdAt"
    `);
      sendCreated(res, { playbook: result.rows[0] });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create playbook');
    }
  },
);

router.patch(
  '/rmm/playbooks/:id',
  authWrite,
  roleAdmin,
  validateBody(
    bodyShape({
      confidenceThreshold: z.unknown().optional(),
      description: z.unknown().optional(),
      detectionRules: z.unknown().optional(),
      executionMode: z.unknown().optional(),
      name: z.unknown().optional(),
      remediationActions: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return sendBadRequest(res, 'Invalid ID');
      const {
        name,
        description,
        status,
        executionMode,
        detectionRules,
        remediationActions,
        confidenceThreshold,
      } = req.body;
      const existing = await db.execute<PlaybookRow>(sql`
      SELECT id, name, description, status, execution_mode as "executionMode",
             detection_rules as "detectionRules", remediation_actions as "remediationActions",
             confidence_threshold as "confidenceThreshold"
      FROM msp_healing_playbooks WHERE id = ${id}
    `);
      const existingRow = existing.rows[0] as PlaybookRow | undefined;
      if (!existingRow) return sendNotFound(res, 'Playbook');

      const updName = name !== undefined ? String(name) : existingRow.name;
      const updDesc =
        description !== undefined ? String(description) : (existingRow.description ?? '');
      const updStatus = status !== undefined ? String(status) : existingRow.status;
      const updMode =
        executionMode !== undefined ? String(executionMode) : existingRow.executionMode;
      const updRules =
        detectionRules !== undefined
          ? JSON.stringify(detectionRules)
          : JSON.stringify(existingRow.detectionRules ?? []);
      const updActions =
        remediationActions !== undefined
          ? JSON.stringify(remediationActions)
          : JSON.stringify(existingRow.remediationActions ?? []);
      const updThreshold =
        confidenceThreshold !== undefined
          ? parseInt(confidenceThreshold, 10)
          : (existingRow.confidenceThreshold ?? 70);

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
      if (!updated.rows[0]) return sendNotFound(res, 'Playbook');
      sendSuccess(res, { playbook: updated.rows[0] });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update playbook');
    }
  },
);

router.delete(
  '/rmm/playbooks/:id',
  validateBody(bodyShape({})),
  authWrite,
  roleAdmin,
  async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return sendBadRequest(res, 'Invalid ID');
      await db.execute(sql`DELETE FROM msp_healing_playbooks WHERE id = ${id}`);
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete playbook');
    }
  },
);

router.get('/rmm/playbooks/executions', auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200);
    const statusFilter = status && status !== 'all' ? status : null;
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
  } catch (err) {
    handleRouteError(res, err, 'Failed to list healing executions');
  }
});

router.post(
  '/rmm/playbooks/:id/execute',
  authWrite,
  roleOperator,
  validateBody(
    bodyShape({
      clientId: z.unknown().optional(),
      detectionContext: z.unknown().optional(),
      deviceId: z.unknown().optional(),
      triggeredBy: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return sendBadRequest(res, 'Invalid ID');
      const { deviceId, clientId, triggeredBy, detectionContext } = req.body;
      if (!deviceId) return sendBadRequest(res, 'deviceId is required');

      const playbookRows = await db.execute<PlaybookRow>(sql`
      SELECT id, name, description, status, execution_mode as "executionMode",
             detection_rules as "detectionRules", remediation_actions as "remediationActions",
             target_device_types as "targetDeviceTypes", target_client_ids as "targetClientIds",
             confidence_threshold as "confidenceThreshold", success_rate as "successRate",
             total_executions as "totalExecutions", created_at as "createdAt", updated_at as "updatedAt"
      FROM msp_healing_playbooks WHERE id = ${id} AND status = 'active'
    `);
      const playbook = playbookRows.rows[0] as PlaybookRow | undefined;
      if (!playbook) return sendNotFound(res, 'Active playbook');

      const deviceRows = await db
        .select()
        .from(mspDevicesTable)
        .where(eq(mspDevicesTable.id, deviceId))
        .limit(1);
      const device = deviceRows[0];
      if (!device) return sendNotFound(res, 'Device');

      const beforeMetrics = {
        cpu: device.cpu ?? 0,
        memory: device.memory ?? 0,
        disk: device.disk ?? 0,
      };
      const requiresApproval = playbook.executionMode === 'human_gated';
      const isNotifyOnly = playbook.executionMode === 'notify_only';
      const confidenceScore = playbook.confidenceThreshold ?? 70;
      const initialStatus = isNotifyOnly
        ? 'completed'
        : requiresApproval
          ? 'pending_approval'
          : 'running';

      const result = await db.execute(sql`
      INSERT INTO msp_healing_executions (playbook_id, device_id, client_id, triggered_by, status, approval_required, detection_context, before_metrics, healing_confidence_score, completed_at)
      VALUES (${id}, ${deviceId}, ${clientId ?? device.clientId ?? null}, ${triggeredBy ?? 'manual'}, ${initialStatus},
              ${requiresApproval}, ${JSON.stringify(detectionContext ?? {})}::jsonb, ${JSON.stringify(beforeMetrics)}::jsonb, ${confidenceScore}, ${isNotifyOnly ? sql`NOW()` : sql`NULL`})
      RETURNING id, status, approval_required as "approvalRequired", created_at as "createdAt"
    `);
      const execution = result.rows[0] as {
        id: number;
        status: string;
        approvalRequired: boolean;
        createdAt: Date;
      };

      if (playbook.executionMode === 'full_auto') {
        void runHealingExecution(execution.id, deviceId, playbook);
      }

      const message = isNotifyOnly
        ? 'Detection recorded (notify-only mode — no remediation executed)'
        : requiresApproval
          ? 'Execution queued pending approval'
          : 'Execution started';

      sendCreated(res, { execution, message });
    } catch (err) {
      handleRouteError(res, err, 'Failed to execute playbook');
    }
  },
);

router.post(
  '/rmm/playbooks/executions/:id/approve',
  authWrite,
  roleOperator,
  validateBody(
    bodyShape({
      approvedBy: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return sendBadRequest(res, 'Invalid ID');
      const { approvedBy } = req.body;
      await db.execute(sql`
      UPDATE msp_healing_executions SET status = 'running', approved_by = ${approvedBy ?? 'operator'}, approved_at = NOW(), started_at = NOW()
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
      if (!exec) return sendNotFound(res, 'Execution');

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
      sendSuccess(res, { execution: exec, message: 'Execution approved and running' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to approve execution');
    }
  },
);

router.post(
  '/rmm/playbooks/executions/:id/reject',
  authWrite,
  roleOperator,
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return sendBadRequest(res, 'Invalid ID');
      await db.execute(
        sql`UPDATE msp_healing_executions SET status = 'rejected', completed_at = NOW() WHERE id = ${id}`,
      );
      sendSuccess(res, { rejected: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to reject execution');
    }
  },
);

export async function runHealingExecution(
  executionId: number,
  deviceId: number,
  playbook: PlaybookRow,
): Promise<void> {
  try {
    const actionsExecuted: Array<{ action: string; result: string; at: string }> = [];
    const actions = playbook.remediationActions as Array<{
      type: string;
      target?: string;
      parameters?: Record<string, unknown>;
    }>;

    const deviceRows = await db
      .select()
      .from(mspDevicesTable)
      .where(eq(mspDevicesTable.id, deviceId))
      .limit(1);
    const deviceRow = deviceRows[0];
    let connectorId: number | null = deviceRow?.connectorId ?? null;
    if (!connectorId) {
      const activeConnectors = (await queryConnectors()).filter(
        (c) => c.status === 'active' && (c.mode === 'rmm' || c.mode === 'both'),
      );
      connectorId = activeConnectors.length > 0 ? activeConnectors[0].id : null;
    }

    for (const action of actions) {
      try {
        if (action.type === 'escalate') {
          actionsExecuted.push({
            action: action.type,
            result: 'escalated',
            at: new Date().toISOString(),
          });
          continue;
        }
        const actionResult = await db.execute(sql`
          INSERT INTO msp_remote_actions (device_id, connector_id, action_type, target, parameters, status, requires_approval, requested_by)
          VALUES (${deviceId}, ${connectorId}, ${action.type}, ${action.target ?? null}, ${JSON.stringify(action.parameters ?? {})}::jsonb, 'approved', false, 'auto-healing')
          RETURNING id
        `);
        const actionId = (actionResult.rows[0] as { id: number }).id;
        await executeRemoteAction(
          actionId,
          deviceId,
          connectorId,
          action.type,
          action.target ?? null,
          action.parameters ?? {},
        );
        const completedRow = await db.execute<{ status: string }>(
          sql`SELECT status FROM msp_remote_actions WHERE id = ${actionId}`,
        );
        const finalStatus =
          (completedRow.rows[0] as { status: string } | undefined)?.status ?? 'unknown';
        actionsExecuted.push({
          action: action.type,
          result: finalStatus === 'completed' ? 'success' : `failed: ${finalStatus}`,
          at: new Date().toISOString(),
        });
      } catch (err) {
        actionsExecuted.push({
          action: action.type,
          result: `error: ${String(err)}`,
          at: new Date().toISOString(),
        });
      }
    }

    const afterDeviceRows = await db
      .select()
      .from(mspDevicesTable)
      .where(eq(mspDevicesTable.id, deviceId))
      .limit(1);
    const afterDevice = afterDeviceRows[0];
    const afterMetrics = afterDevice
      ? { cpu: afterDevice.cpu ?? 0, memory: afterDevice.memory ?? 0, disk: afterDevice.disk ?? 0 }
      : null;

    const allSuccess = actionsExecuted.every((a) => a.result === 'success');
    await db.execute(sql`
      UPDATE msp_healing_executions SET status = ${allSuccess ? 'completed' : 'failed'},
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
    logger.error({ err, executionId }, 'Healing execution failed');
    await db
      .execute(
        sql`UPDATE msp_healing_executions SET status = 'failed', completed_at = NOW() WHERE id = ${executionId}`,
      )
      .catch(() => undefined);
  }
}

export function register(r: IRouter): void {
  r.use(router);
}
