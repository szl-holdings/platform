import { bodyShape } from '@szl-holdings/contracts/common';
import type { PrismDomain } from '@szl-holdings/prism-bus';
import { prismBus } from '@szl-holdings/prism-bus';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendCreated, sendSuccess } from '../lib/api-response';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

export type HandoffContractType =
  | 'lyte_priority_to_forge'
  | 'aegis_threat_to_covenant'
  | 'vessels_voyage_to_forge'
  | 'terra_blocker_to_carlota'
  | 'holdings_investor_to_atlas';

export interface HandoffContract {
  id: string;
  type: HandoffContractType;
  sourceDomain: PrismDomain;
  targetDomain: PrismDomain;
  sourceApp: string;
  targetApp: string;
  triggerCondition: string;
  governedAction: string;
  payload: Record<string, unknown>;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  correlationId?: string;
  tenantId?: string;
  timestamp: number;
  status: 'pending' | 'routed' | 'executed' | 'failed';
}

const HANDOFF_DEFINITIONS: Record<
  HandoffContractType,
  Omit<HandoffContract, 'id' | 'payload' | 'correlationId' | 'tenantId' | 'timestamp' | 'status'>
> = {
  lyte_priority_to_forge: {
    type: 'lyte_priority_to_forge',
    sourceDomain: 'lyte',
    targetDomain: 'global',
    sourceApp: 'Command',
    targetApp: 'FORGE RUNTIME',
    triggerCondition: 'Priority signal detected with severity >= high',
    governedAction:
      'FORGE creates governed execution workflow with human-in-the-loop approval gate',
    severity: 'high',
  },
  aegis_threat_to_covenant: {
    type: 'aegis_threat_to_covenant',
    sourceDomain: 'aegis',
    targetDomain: 'global',
    sourceApp: 'Aegis SOC',
    targetApp: 'COVENANT POLICY ENGINE',
    triggerCondition: 'Confirmed threat identified with MITRE ATT&CK classification',
    governedAction:
      'COVENANT enforces policy-gated response: containment, escalation, or mitigation',
    severity: 'critical',
  },
  vessels_voyage_to_forge: {
    type: 'vessels_voyage_to_forge',
    sourceDomain: 'vessels',
    targetDomain: 'global',
    sourceApp: 'Vessels Maritime Intelligence',
    targetApp: 'FORGE RUNTIME',
    triggerCondition: 'Voyage anomaly or route risk detected above threshold',
    governedAction:
      'FORGE creates command workflow for rerouting decision with compliance audit trail',
    severity: 'high',
  },
  terra_blocker_to_carlota: {
    type: 'terra_blocker_to_carlota',
    sourceDomain: 'terra',
    targetDomain: 'carlota-jo',
    sourceApp: 'Terra Real Estate Intelligence',
    targetApp: 'Carlota Jo Consulting',
    triggerCondition: 'Deal or project blocker identified needing advisory services',
    governedAction: 'Carlota Jo service routing activated with context-enriched brief',
    severity: 'medium',
  },
  holdings_investor_to_atlas: {
    type: 'holdings_investor_to_atlas',
    sourceDomain: 'szl-holdings',
    targetDomain: 'global',
    sourceApp: 'SZL Holdings',
    targetApp: 'ATLAS ARTIFACTS',
    triggerCondition: 'Investor prospect identified or capital event milestone reached',
    governedAction:
      'ATLAS generates investor-appropriate artifact package (deck, data room, proof chain)',
    severity: 'medium',
  },
};

const handoffHistory: HandoffContract[] = [];
const MAX_HANDOFF_HISTORY = 500;

function generateId() {
  return `handoff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

router.get('/cross-app/handoffs/contracts', authMiddleware(), (_req: Request, res: Response) => {
  try {
    sendSuccess(res, {
      contracts: Object.values(HANDOFF_DEFINITIONS),
      count: Object.keys(HANDOFF_DEFINITIONS).length,
    });
  } catch (err) {
    handleRouteError(res, err, 'cross-app handoff contracts');
  }
});

router.get(
  '/cross-app/handoffs/history',
  authMiddleware(),
  validateQuery(listQuerySchema),
  (req: Request, res: Response) => {
    try {
      const { type, sourceDomain, targetDomain, limit } = req.query as Record<string, string>;
      let results = handoffHistory;
      if (type) results = results.filter((h) => h.type === type);
      if (sourceDomain) results = results.filter((h) => h.sourceDomain === sourceDomain);
      if (targetDomain) results = results.filter((h) => h.targetDomain === targetDomain);
      sendSuccess(res, {
        handoffs: results.slice(0, limit ? Number(limit) : 100),
        count: results.length,
      });
    } catch (err) {
      handleRouteError(res, err, 'cross-app handoff history');
    }
  },
);

router.get('/cross-app/handoffs/stats', authMiddleware(), (_req: Request, res: Response) => {
  try {
    const byType: Record<
      string,
      { total: number; routed: number; executed: number; failed: number }
    > = {};
    for (const h of handoffHistory) {
      if (!byType[h.type]) byType[h.type] = { total: 0, routed: 0, executed: 0, failed: 0 };
      byType[h.type].total++;
      if (h.status === 'routed') byType[h.type].routed++;
      if (h.status === 'executed') byType[h.type].executed++;
      if (h.status === 'failed') byType[h.type].failed++;
    }

    const totalHandoffs = handoffHistory.length;
    const successRate =
      totalHandoffs > 0
        ? Math.round(
            (handoffHistory.filter((h) => h.status === 'executed').length / totalHandoffs) * 100,
          )
        : 0;

    sendSuccess(res, {
      totalHandoffs,
      successRate,
      byType,
      recentHandoffs: handoffHistory.slice(0, 10),
      familyHealth: {
        lyteForge: byType['lyte_priority_to_forge'] ?? {
          total: 0,
          executed: 0,
          routed: 0,
          failed: 0,
        },
        aegisCovenant: byType['aegis_threat_to_covenant'] ?? {
          total: 0,
          executed: 0,
          routed: 0,
          failed: 0,
        },
        vesselsForge: byType['vessels_voyage_to_forge'] ?? {
          total: 0,
          executed: 0,
          routed: 0,
          failed: 0,
        },
        terraCarlota: byType['terra_blocker_to_carlota'] ?? {
          total: 0,
          executed: 0,
          routed: 0,
          failed: 0,
        },
        holdingsAtlas: byType['holdings_investor_to_atlas'] ?? {
          total: 0,
          executed: 0,
          routed: 0,
          failed: 0,
        },
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'cross-app handoff stats');
  }
});

router.post(
  '/cross-app/handoffs/trigger',
  authMiddleware(),
  validateBody(
    bodyShape({
      correlationId: z.unknown().optional(),
      payload: z.unknown().optional(),
      severity: z.unknown().optional(),
      type: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { type, payload, correlationId, severity } = req.body as {
        type?: string;
        payload?: Record<string, unknown>;
        correlationId?: string;
        severity?: string;
      };

      if (!type) {
        sendBadRequest(res, 'type is required');
        return;
      }

      const definition = HANDOFF_DEFINITIONS[type as HandoffContractType];
      if (!definition) {
        sendBadRequest(
          res,
          `Unknown handoff type: ${type}. Valid types: ${Object.keys(HANDOFF_DEFINITIONS).join(', ')}`,
        );
        return;
      }

      const tenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;

      const handoff: HandoffContract = {
        ...definition,
        id: generateId(),
        payload: payload ?? {},
        correlationId,
        tenantId: tenantId ?? undefined,
        timestamp: Date.now(),
        status: 'pending',
        severity: (severity as HandoffContract['severity']) ?? definition.severity,
      };

      handoffHistory.unshift(handoff);
      if (handoffHistory.length > MAX_HANDOFF_HISTORY) {
        handoffHistory.length = MAX_HANDOFF_HISTORY;
      }

      await prismBus.publish({
        type: 'cross_domain_correlation',
        domain: definition.sourceDomain,
        sourceId: `cross-app-handoff-${type}`,
        payload: {
          handoffId: handoff.id,
          handoffType: type,
          sourceDomain: definition.sourceDomain,
          targetDomain: definition.targetDomain,
          sourceApp: definition.sourceApp,
          targetApp: definition.targetApp,
          triggerCondition: definition.triggerCondition,
          governedAction: definition.governedAction,
          ...payload,
        },
        severity: handoff.severity,
        correlationId,
        tenantId,
      });

      handoffHistory[0].status = 'routed';

      sendCreated(res, {
        handoff: handoffHistory[0],
        message: `Handoff contract '${type}' triggered: ${definition.sourceApp} → ${definition.targetApp}`,
      });
    } catch (err) {
      handleRouteError(res, err, 'cross-app handoff trigger');
    }
  },
);

router.get('/cross-app/family/health', authMiddleware(), (_req: Request, res: Response) => {
  try {
    const prismStats = prismBus.getStats();

    const appHealth = [
      { app: 'Command', domain: 'lyte', status: 'active', handoffTarget: 'FORGE RUNTIME' },
      { app: 'Aegis SOC', domain: 'aegis', status: 'active', handoffTarget: 'COVENANT' },
      {
        app: 'Vessels Maritime',
        domain: 'vessels',
        status: 'active',
        handoffTarget: 'FORGE RUNTIME',
      },
      { app: 'Terra Real Estate', domain: 'terra', status: 'active', handoffTarget: 'Carlota Jo' },
      { app: 'SZL Holdings', domain: 'szl', status: 'active', handoffTarget: 'ATLAS' },
      { app: 'Carlota Jo Consulting', domain: 'carlota', status: 'active', handoffTarget: null },
    ];

    const totalHandoffs = handoffHistory.length;
    const recentHandoffs = handoffHistory.filter(
      (h) => h.timestamp > Date.now() - 24 * 60 * 60 * 1000,
    );

    sendSuccess(res, {
      familyStatus: 'operational',
      appCount: appHealth.length,
      appHealth,
      crossAppActivity: {
        totalHandoffs,
        last24hHandoffs: recentHandoffs.length,
        activeContracts: Object.keys(HANDOFF_DEFINITIONS).length,
        prismBusEvents: prismStats.totalPublished,
      },
      systemHealth: {
        prismBus: 'active',
        forgeRuntime: 'active',
        covenantPolicy: 'active',
        receiptGraph: 'active',
        outcomeGraph: 'active',
        atlasArtifacts: 'active',
        pulseEvals: 'active',
        helmConsole: 'active',
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'cross-app family health');
  }
});

interface RecentItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  appId: string;
  appName: string;
  timestamp: number;
}

const recentItemsByUser = new Map<string, RecentItem[]>();

router.get('/cross-app/recent-items', (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'anonymous';
    const items = recentItemsByUser.get(userId) || [];
    sendSuccess(res, items.slice(0, 20));
  } catch (err) {
    handleRouteError(res, err, 'get recent items');
  }
});

router.post(
  '/cross-app/recent-items',
  validateBody(
    bodyShape({
      appId: z.unknown().optional(),
      href: z.unknown().optional(),
      id: z.unknown().optional(),
    }),
  ),
  (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'anonymous';
      const item = req.body as Omit<RecentItem, 'timestamp'>;
      if (!item.id || !item.href || !item.appId) {
        return sendBadRequest(res, 'Missing required fields: id, href, appId');
      }
      const existing = recentItemsByUser.get(userId) || [];
      const filtered = existing.filter((i) => i.id !== item.id);
      const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 20);
      recentItemsByUser.set(userId, updated);
      sendCreated(res, updated[0]);
    } catch (err) {
      handleRouteError(res, err, 'track recent item');
    }
  },
);

router.delete(
  '/cross-app/recent-items',
  validateBody(bodyShape({})),
  (req: Request, res: Response) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'anonymous';
      recentItemsByUser.delete(userId);
      sendSuccess(res, { cleared: true });
    } catch (err) {
      handleRouteError(res, err, 'clear recent items');
    }
  },
);

export default router;
