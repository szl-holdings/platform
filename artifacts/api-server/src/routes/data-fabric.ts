import { type IRouter, Router } from 'express';
import { handleRouteError, sendNotFound, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();
const noAuth = authMiddleware({ required: false });

async function getRegistry() {
  const { dataFabricRegistry } = await import('@szl-holdings/ai-engine/data-fabric');
  return dataFabricRegistry;
}

router.get('/data-fabric/adapters', noAuth, async (_req, res) => {
  try {
    const registry = await getRegistry();
    const adapters = registry.listAdapters();
    sendSuccess(res, {
      adapters,
      count: adapters.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list data fabric adapters');
  }
});

router.get('/data-fabric/adapters/:id', noAuth, async (req, res) => {
  try {
    const registry = await getRegistry();
    const adapter = registry.get(req.params.id as string);
    if (!adapter) {
      sendNotFound(res, 'Adapter');
      return;
    }
    sendSuccess(res, {
      id: adapter.id,
      displayName: adapter.displayName,
      domain: adapter.domain,
      category: adapter.category,
      configured: adapter.isConfigured(),
      costPerQueryUsd: adapter.costPerQueryUsd,
      refreshSchedule: adapter.refreshSchedule,
      ontologyMappings: adapter.ontologyMappings,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get adapter details');
  }
});

router.get('/data-fabric/adapters/:id/data', noAuth, async (req, res) => {
  try {
    const registry = await getRegistry();
    const adapterId = req.params.id as string;
    const tenantId = (req.query.tenantId as string) || 'default';
    const forceRefresh = req.query.refresh === 'true';

    const params: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(req.query)) {
      if (key !== 'tenantId' && key !== 'refresh') {
        params[key] = val;
      }
    }

    const result = await registry.fetchFromAdapter(adapterId, tenantId, params, forceRefresh);
    sendSuccess(res, {
      adapterId,
      entities: result.entities,
      entityCount: result.entities.length,
      provenance: result.provenance,
      cached: result.cached,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch adapter data');
  }
});

router.get('/data-fabric/data', noAuth, async (req, res) => {
  try {
    const registry = await getRegistry();
    const tenantId = (req.query.tenantId as string) || 'default';
    const adapterIds = req.query.adapters
      ? (req.query.adapters as string).split(',').map((s) => s.trim())
      : undefined;

    const result = await registry.fetchAll(tenantId, adapterIds);
    sendSuccess(res, {
      entities: result.entities,
      entityCount: result.entities.length,
      byAdapter: Object.fromEntries(
        Object.entries(result.byAdapter).map(([k, v]) => [k, { count: v.length, entities: v }]),
      ),
      provenances: result.provenances,
      totalCostUsd: result.totalCostUsd,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch all fabric data');
  }
});

router.get('/data-fabric/costs', noAuth, async (req, res) => {
  try {
    const registry = await getRegistry();
    const tenantId = req.query.tenantId as string | undefined;
    const costs = registry.getCostReport(tenantId);
    const totalSpend = costs.reduce((s, c) => s + c.totalCostUsd, 0);
    sendSuccess(res, {
      costs,
      totalSpendUsd: totalSpend,
      totalQueries: costs.reduce((s, c) => s + c.queryCount, 0),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get cost report');
  }
});

router.get('/data-fabric/health', noAuth, async (_req, res) => {
  try {
    const registry = await getRegistry();
    const health = registry.getHealthReport();
    const healthy = health.filter((h) => h.status === 'healthy').length;
    const degraded = health.filter((h) => h.status === 'degraded').length;
    const down = health.filter((h) => h.status === 'down').length;

    sendSuccess(res, {
      adapters: health,
      summary: {
        total: health.length,
        healthy,
        degraded,
        down,
        overallStatus: down > 0 ? 'degraded' : degraded > 0 ? 'partial' : 'healthy',
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get health report');
  }
});

export default router;
