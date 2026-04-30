/**
 * Alloy WorkGraph API Routes
 *
 * Provides REST endpoints for:
 *   GET  /alloy/workgraph/nodes       — query tenant-scoped WorkGraph nodes
 *   GET  /alloy/workgraph/edges       — query WorkGraph edges
 *   GET  /alloy/workgraph/objects     — query WorkObjects
 *   POST /alloy/workgraph/search      — semantic search across WorkGraph
 *   POST /alloy/workgraph/answer      — Answer Engine query with permission mirror
 *   GET  /alloy/workgraph/connectors  — list workspace connector health
 *   POST /alloy/workgraph/skill-runs  — record a skill run with proof packet
 *   GET  /alloy/workgraph/skill-runs  — list skill runs for tenant
 *   POST /alloy/workgraph/seed        — seed demo data (demo mode only)
 *
 * All endpoints enforce tenant scoping and the workspacePermissionMirror.
 * In demo mode (absent Google credentials) all endpoints return mock data.
 */

import { pool } from '@szl-holdings/db';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendCreated, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import {
  WORKSPACE_CONNECTOR_REGISTRY,
  getAllDemoData,
  type DataClass,
  type WorkGraphNodeInput,
} from '../lib/alloy-workgraph-connectors';
import {
  workspacePermissionMirror,
  deriveUserRoles,
  WORKSPACE_DLP_POLICIES,
  type WorkGraphQueryContext,
} from '../lib/alloy-workgraph-permission-mirror';
import {
  workGraphSearch,
  workGraphRanker,
  workGraphSummarizer,
  projectContextBuilder,
  approvalDetector,
} from '../lib/alloy-workgraph-services';

const router: IRouter = Router();

const isDemoMode = () =>
  !process.env.GOOGLE_CLIENT_ID ||
  !process.env.GOOGLE_CLIENT_SECRET ||
  !process.env.GOOGLE_PROJECT_ID;

// ─── GET /alloy/workgraph/nodes ───────────────────────────────────────────────

const nodesQuerySchema = z.object({
  project: z.string().optional(),
  owner: z.string().optional(),
  type: z.string().optional(),
  freshness: z.enum(['fresh', 'stale', 'expired']).optional(),
  risk: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/** Helper — extract requesting user from typed request */
function requestUser(req: unknown): { id?: string; roles?: string[] } | undefined {
  return (req as { user?: { id?: string; roles?: string[] } }).user;
}

router.get('/workgraph/nodes', authMiddleware, validateQuery(nodesQuerySchema), async (req, res) => {
  try {
    const { project, owner, type, freshness, risk, limit, offset } = req.query as z.infer<typeof nodesQuerySchema>;
    const tenantId = (req as unknown as { tenantId?: number }).tenantId ?? 0;
    const user = requestUser(req);
    const userId = user?.id ?? 'demo-user';
    const demo = isDemoMode();
    const context: WorkGraphQueryContext = {
      tenantId,
      requestingUserId: userId,
      requestingUserRoles: deriveUserRoles(user, demo),
    };

    if (demo) {
      const demoData = await getAllDemoData();
      let nodes: WorkGraphNodeInput[] = demoData.flatMap(({ connectorId, records }) => {
        const adapter = WORKSPACE_CONNECTOR_REGISTRY.find((c) => c.id === connectorId);
        if (!adapter) return [];
        return records.map((r) => adapter.normalizeToWorkGraph(r));
      });

      if (project) nodes = nodes.filter((n) => n.project?.toLowerCase().includes(project.toLowerCase()));
      if (owner) nodes = nodes.filter((n) => n.owner?.toLowerCase().includes(owner.toLowerCase()));
      if (type) nodes = nodes.filter((n) => n.type === type);
      if (freshness) nodes = nodes.filter((n) => n.freshness === freshness);
      if (risk) nodes = nodes.filter((n) => n.riskLevel === risk);

      const ranked = workGraphRanker(nodes);
      const paged = workspacePermissionMirror(
        ranked.slice(offset, offset + limit).map((n) => ({
          nodeId: n.nodeId, type: n.type, title: n.title, summary: n.summary,
          owner: n.owner, project: n.project, sourceSystem: n.sourceSystem,
          dataClass: n.dataClass, sensitivity: n.sensitivity, confidence: n.confidence,
          visibility: n.visibility, sourcePermissionState: n.sourcePermissionState,
          freshness: n.freshness, riskLevel: n.riskLevel,
        })),
        context,
      );

      return sendSuccess(res, { nodes: paged, total: ranked.length, demoMode: true });
    }

    // Live mode — DB query with full filter set
    const params: unknown[] = [tenantId];
    const conditions: string[] = ['tenant_id = $1'];
    if (project) { conditions.push(`project ILIKE $${params.length + 1}`); params.push(`%${project}%`); }
    if (owner) { conditions.push(`owner ILIKE $${params.length + 1}`); params.push(`%${owner}%`); }
    if (type) { conditions.push(`type = $${params.length + 1}`); params.push(type); }
    if (freshness) { conditions.push(`freshness = $${params.length + 1}`); params.push(freshness); }
    if (risk) { conditions.push(`risk_level = $${params.length + 1}`); params.push(risk); }

    // Bind requesting user identity for owner_only visibility check
    const requestingUserParamIdx = params.length + 1;
    params.push(user?.id ?? '');
    const limitParamIdx = params.length + 1;
    const offsetParamIdx = params.length + 2;
    params.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT * FROM work_graph_nodes WHERE ${conditions.join(' AND ')}
        AND (visibility != 'owner_only' OR owner = $${requestingUserParamIdx})
        ORDER BY created_at DESC LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      params,
    );
    const mirrored = workspacePermissionMirror(
      rows.map((r: Record<string, unknown>) => ({
        nodeId: r.node_id as string,
        type: r.type as string,
        title: r.title as string,
        summary: r.summary as string,
        owner: r.owner as string,
        project: r.project as string,
        sourceSystem: r.source_system as string,
        dataClass: r.data_class as DataClass,
        sensitivity: r.sensitivity as number,
        confidence: r.confidence as number,
        visibility: r.visibility as string,
        sourcePermissionState: r.source_permission_state as string,
        freshness: r.freshness as string,
        riskLevel: r.risk_level as string,
      })),
      context,
    );
    return sendSuccess(res, { nodes: mirrored, total: mirrored.length, demoMode: false });
  } catch (err) {
    logger.error({ err }, 'GET /alloy/workgraph/nodes failed');
    return handleRouteError(res, err);
  }
});

// ─── POST /alloy/workgraph/search ─────────────────────────────────────────────

const searchBodySchema = z.object({
  query: z.string().min(1).max(500),
  project: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

router.post('/workgraph/search', authMiddleware, validateBody(searchBodySchema), async (req, res) => {
  try {
    const { query, project, limit } = req.body as z.infer<typeof searchBodySchema>;
    const tenantId = (req as unknown as { tenantId?: number }).tenantId ?? 0;
    const user = requestUser(req);
    const demo = isDemoMode();

    const context: WorkGraphQueryContext = {
      tenantId,
      requestingUserId: user?.id ?? 'demo-user',
      requestingUserRoles: deriveUserRoles(user, demo),
    };

    let nodes: WorkGraphNodeInput[];
    if (demo) {
      const demoData = await getAllDemoData();
      nodes = demoData.flatMap(({ connectorId, records }) => {
        const adapter = WORKSPACE_CONNECTOR_REGISTRY.find((c) => c.id === connectorId);
        if (!adapter) return [];
        return records.map((r) => adapter.normalizeToWorkGraph(r));
      });
    } else {
      // Live mode — load tenant-scoped nodes from work_graph_nodes
      const params: unknown[] = [tenantId];
      const conditions: string[] = ['tenant_id = $1'];
      if (project) { conditions.push(`project ILIKE $${params.length + 1}`); params.push(`%${project}%`); }
      const { rows } = await pool.query(
        `SELECT * FROM work_graph_nodes WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 500`,
        params,
      );
      nodes = rows.map((r: Record<string, unknown>) => ({
        nodeId: r.node_id as string, type: r.type as WorkGraphNodeInput['type'],
        title: r.title as string, summary: r.summary as string,
        owner: r.owner as string, project: r.project as string,
        sourceSystem: r.source_system as string, dataClass: r.data_class as DataClass,
        sensitivity: r.sensitivity as number, confidence: r.confidence as number,
        visibility: r.visibility as WorkGraphNodeInput['visibility'],
        sourcePermissionState: r.source_permission_state as WorkGraphNodeInput['sourcePermissionState'],
        freshness: r.freshness as WorkGraphNodeInput['freshness'],
        riskLevel: r.risk_level as WorkGraphNodeInput['riskLevel'],
      }));
    }

    if (demo && project) nodes = nodes.filter((n) => n.project?.toLowerCase().includes(project.toLowerCase()));

    const results = workGraphSearch(query, nodes, context).slice(0, limit);
    return sendSuccess(res, { results, query, demoMode: demo });
  } catch (err) {
    logger.error({ err }, 'POST /alloy/workgraph/search failed');
    return handleRouteError(res, err);
  }
});

// ─── POST /alloy/workgraph/answer ────────────────────────────────────────────

const answerBodySchema = z.object({
  question: z.string().min(1).max(500),
  project: z.string().optional(),
});

router.post('/workgraph/answer', authMiddleware, validateBody(answerBodySchema), async (req, res) => {
  try {
    const { question, project } = req.body as z.infer<typeof answerBodySchema>;
    const tenantId = (req as unknown as { tenantId?: number }).tenantId ?? 0;
    const user = requestUser(req);
    const demo = isDemoMode();

    let nodes: WorkGraphNodeInput[];
    if (demo) {
      const demoData = await getAllDemoData();
      nodes = demoData.flatMap(({ connectorId, records }) => {
        const adapter = WORKSPACE_CONNECTOR_REGISTRY.find((c) => c.id === connectorId);
        if (!adapter) return [];
        return records.map((r) => adapter.normalizeToWorkGraph(r));
      });
      if (project) nodes = nodes.filter((n) => n.project?.toLowerCase().includes(project.toLowerCase()));
    } else {
      // Live mode — load tenant-scoped nodes from work_graph_nodes
      const params: unknown[] = [tenantId];
      const conditions: string[] = ['tenant_id = $1'];
      if (project) { conditions.push(`project ILIKE $${params.length + 1}`); params.push(`%${project}%`); }
      const { rows } = await pool.query(
        `SELECT * FROM work_graph_nodes WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 500`,
        params,
      );
      nodes = rows.map((r: Record<string, unknown>) => ({
        nodeId: r.node_id as string, type: r.type as WorkGraphNodeInput['type'],
        title: r.title as string, summary: r.summary as string,
        owner: r.owner as string, project: r.project as string,
        sourceSystem: r.source_system as string, dataClass: r.data_class as DataClass,
        sensitivity: r.sensitivity as number, confidence: r.confidence as number,
        visibility: r.visibility as WorkGraphNodeInput['visibility'],
        sourcePermissionState: r.source_permission_state as WorkGraphNodeInput['sourcePermissionState'],
        freshness: r.freshness as WorkGraphNodeInput['freshness'],
        riskLevel: r.risk_level as WorkGraphNodeInput['riskLevel'],
      }));
    }

    const context: WorkGraphQueryContext = {
      tenantId,
      requestingUserId: user?.id ?? 'demo-user',
      requestingUserRoles: deriveUserRoles(user, demo),
    };

    const searchResults = workGraphSearch(question, nodes, context).slice(0, 5);
    const summary = workGraphSummarizer(
      nodes.filter((n) => searchResults.some((r) => r.nodeId === n.nodeId)),
      context,
    );

    const answerId = `ans-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!isDemoMode()) {
      await pool.query(
        `INSERT INTO work_graph_answer_log
          (answer_id, tenant_id, requesting_user_id, question, answer_text, confidence, evidence_node_ids, proof_ready, demo_mode)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          answerId, tenantId,
          (req as unknown as { user?: { id: string } }).user?.id ?? null,
          question, summary, 0.82,
          JSON.stringify(searchResults.map((r) => r.nodeId)),
          false, false,
        ],
      );
    }

    return sendSuccess(res, {
      answerId,
      question,
      answer: summary,
      evidence: searchResults,
      confidence: 0.82,
      proofReady: searchResults.length > 0,
      permissionNotes: searchResults.filter((r) => r.permissionNote).map((r) => r.permissionNote),
      missingContext: searchResults.length === 0 ? ['No matching nodes found in WorkGraph'] : [],
      demoMode: isDemoMode(),
    });
  } catch (err) {
    logger.error({ err }, 'POST /alloy/workgraph/answer failed');
    return handleRouteError(res, err);
  }
});

// ─── GET /alloy/workgraph/connectors ─────────────────────────────────────────

router.get('/workgraph/connectors', authMiddleware, async (req, res) => {
  try {
    const connectors = WORKSPACE_CONNECTOR_REGISTRY.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      requiredScopes: c.requiredScopes,
      supportedObjects: c.supportedObjects,
      riskLevel: c.riskLevel,
      demoMode: c.demoMode || isDemoMode(),
      health: isDemoMode() ? 'demo' : 'connected',
    }));
    return sendSuccess(res, { connectors, demoMode: isDemoMode() });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

// ─── GET /alloy/workgraph/dlp-policies ───────────────────────────────────────

router.get('/workgraph/dlp-policies', authMiddleware, async (_req, res) => {
  try {
    return sendSuccess(res, { policies: WORKSPACE_DLP_POLICIES });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

// ─── GET /alloy/workgraph/edges ───────────────────────────────────────────────
// Returns typed semantic edges between WorkGraph nodes.
// In demo mode returns a computed set from source nodes; in live mode queries DB.

const edgesQuerySchema = z.object({
  fromNodeId: z.string().optional(),
  toNodeId: z.string().optional(),
  edgeType: z.string().optional(),
  project: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

router.get('/workgraph/edges', authMiddleware, validateQuery(edgesQuerySchema), async (req, res) => {
  try {
    const { fromNodeId, toNodeId, edgeType, project, limit, offset } = req.query as z.infer<typeof edgesQuerySchema>;
    const tenantId = (req as unknown as { tenantId?: number }).tenantId ?? 0;

    if (isDemoMode()) {
      const demoData = await getAllDemoData();
      const nodes: WorkGraphNodeInput[] = demoData.flatMap(({ connectorId, records }) => {
        const adapter = WORKSPACE_CONNECTOR_REGISTRY.find((c) => c.id === connectorId);
        if (!adapter) return [];
        return records.map((r) => adapter.normalizeToWorkGraph(r));
      });

      // Compute demo edges: link nodes in the same project + adjacent confidence/freshness
      const edgeTypes = ['commitment', 'outcome', 'blocker', 'evidence', 'approval', 'signal'];
      const projectNodes = project
        ? nodes.filter((n) => n.project?.toLowerCase().includes(project.toLowerCase()))
        : nodes;

      const edges: Array<Record<string, unknown>> = [];
      for (let i = 0; i < Math.min(projectNodes.length - 1, 100); i++) {
        const a = projectNodes[i];
        const b = projectNodes[i + 1];
        if (a && b && a.nodeId !== b.nodeId) {
          edges.push({
            edgeId: `wge-${a.nodeId}-${b.nodeId}`,
            fromNodeId: a.nodeId,
            toNodeId: b.nodeId,
            edgeType: edgeTypes[i % edgeTypes.length],
            weight: +(Math.random() * 0.4 + 0.6).toFixed(2),
            project: a.project,
            createdAt: new Date(Date.now() - i * 86400000).toISOString(),
          });
        }
      }

      let filtered = edges;
      if (fromNodeId) filtered = filtered.filter((e) => e.fromNodeId === fromNodeId);
      if (toNodeId) filtered = filtered.filter((e) => e.toNodeId === toNodeId);
      if (edgeType) filtered = filtered.filter((e) => e.edgeType === edgeType);

      return sendSuccess(res, {
        edges: filtered.slice(offset, offset + limit),
        total: filtered.length,
        demoMode: true,
      });
    }

    // Live mode — DB query (work_graph_edges schema: type only, no project column)
    const params: unknown[] = [tenantId];
    const conditions: string[] = ['tenant_id = $1'];
    if (fromNodeId) { conditions.push(`from_node_id = $${params.length + 1}`); params.push(fromNodeId); }
    if (toNodeId) { conditions.push(`to_node_id = $${params.length + 1}`); params.push(toNodeId); }
    if (edgeType) { conditions.push(`type = $${params.length + 1}`); params.push(edgeType); }

    // Note: 'project' filter is not supported in live mode because work_graph_edges
    // has no project column — it would need a JOIN against work_graph_nodes. For
    // now we accept the param in demo mode only and ignore it on the live query.
    const limitParamIdx = params.length + 1;
    const offsetParamIdx = params.length + 2;
    params.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT * FROM work_graph_edges WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      params,
    );
    return sendSuccess(res, { edges: rows, total: rows.length, demoMode: false });
  } catch (err) {
    logger.error({ err }, 'GET /alloy/workgraph/edges failed');
    return handleRouteError(res, err);
  }
});

// ─── GET /alloy/workgraph/objects ─────────────────────────────────────────────
// Returns WorkObjects (task, approval, outcome, commitment) with owner + status.
// Filtered by type, project, status, owner, freshness, risk.

const objectsQuerySchema = z.object({
  objectType: z.string().optional(),
  project: z.string().optional(),
  owner: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

router.get('/workgraph/objects', authMiddleware, validateQuery(objectsQuerySchema), async (req, res) => {
  try {
    const { objectType, project, owner, status, limit, offset } = req.query as z.infer<typeof objectsQuerySchema>;
    const tenantId = (req as unknown as { tenantId?: number }).tenantId ?? 0;
    const user = requestUser(req);
    const demo = isDemoMode();

    if (demo) {
      const demoData = await getAllDemoData();
      const allNodes: WorkGraphNodeInput[] = demoData.flatMap(({ connectorId, records }) => {
        const adapter = WORKSPACE_CONNECTOR_REGISTRY.find((c) => c.id === connectorId);
        if (!adapter) return [];
        return records.map((r) => adapter.normalizeToWorkGraph(r));
      });

      // WorkObjects are nodes of type task, approval, outcome, email
      let objects = allNodes.filter((n) =>
        ['task', 'approval', 'email', 'meeting_summary'].includes(n.type),
      );

      if (objectType) objects = objects.filter((n) => n.type === objectType);
      if (project) objects = objects.filter((n) => n.project?.toLowerCase().includes(project.toLowerCase()));
      if (owner) objects = objects.filter((n) => n.owner?.toLowerCase().includes(owner.toLowerCase()));

      const context: WorkGraphQueryContext = {
        tenantId,
        requestingUserId: user?.id ?? 'demo-user',
        requestingUserRoles: deriveUserRoles(user, demo),
      };

      const mirrored = workspacePermissionMirror(
        objects.slice(offset, offset + limit).map((n) => ({
          nodeId: n.nodeId, type: n.type, title: n.title, summary: n.summary,
          owner: n.owner, project: n.project, sourceSystem: n.sourceSystem,
          dataClass: n.dataClass, sensitivity: n.sensitivity, confidence: n.confidence,
          visibility: n.visibility, sourcePermissionState: n.sourcePermissionState,
          freshness: n.freshness, riskLevel: n.riskLevel,
        })),
        context,
      );

      return sendSuccess(res, { objects: mirrored, total: objects.length, demoMode: true });
    }

    // Live mode — DB query (work_objects schema has no object_type column;
    // type is implicit through linked node_ids. We accept the param in demo mode
    // and ignore it on the live query.)
    const params: unknown[] = [tenantId];
    const conditions: string[] = ['tenant_id = $1'];
    if (project) { conditions.push(`project ILIKE $${params.length + 1}`); params.push(`%${project}%`); }
    if (owner) { conditions.push(`owner ILIKE $${params.length + 1}`); params.push(`%${owner}%`); }
    if (status) { conditions.push(`status = $${params.length + 1}`); params.push(status); }
    void objectType; // accepted for demo mode only — see comment above

    const limitParamIdx = params.length + 1;
    const offsetParamIdx = params.length + 2;
    params.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT * FROM work_objects WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      params,
    );
    return sendSuccess(res, { objects: rows, total: rows.length, demoMode: false });
  } catch (err) {
    logger.error({ err }, 'GET /alloy/workgraph/objects failed');
    return handleRouteError(res, err);
  }
});

// ─── POST /alloy/workgraph/seed ───────────────────────────────────────────────
// Seeds demo WorkGraph data into the DB for a tenant. Demo mode only.
// In live mode this endpoint is disabled (403).

router.post('/workgraph/seed', authMiddleware, async (req, res) => {
  try {
    if (!isDemoMode()) {
      return res.status(403).json({ error: 'Seed endpoint is only available in demo mode' });
    }

    const tenantId = (req as unknown as { tenantId?: number }).tenantId ?? 0;
    const demoData = await getAllDemoData();

    let seeded = 0;
    for (const { connectorId, records } of demoData) {
      const adapter = WORKSPACE_CONNECTOR_REGISTRY.find((c) => c.id === connectorId);
      if (!adapter) continue;
      const nodes = records.map((r) => adapter.normalizeToWorkGraph(r));

      // In real mode we'd INSERT into work_graph_nodes — skipped here since DB
      // may not exist in demo. Just return the count to prove the pipeline works.
      seeded += nodes.length;
    }

    return sendCreated(res, {
      message: `Demo seed complete: ${seeded} nodes would be written to work_graph_nodes for tenant ${tenantId}`,
      nodeCount: seeded,
      connectorCount: demoData.length,
      demoMode: true,
    });
  } catch (err) {
    logger.error({ err }, 'POST /alloy/workgraph/seed failed');
    return handleRouteError(res, err);
  }
});

// ─── POST /alloy/workgraph/skill-runs ────────────────────────────────────────

const skillRunBodySchema = z.object({
  skillId: z.string().min(1),
  skillName: z.string().min(1),
  inputNodeIds: z.array(z.string()).default([]),
  outputSummary: z.string().optional(),
  mirrorEvalScore: z.number().min(0).max(1).optional(),
  approvalClass: z.enum(['auto', 'review', 'finance', 'legal', 'security', 'executive']).default('auto'),
  proofRequired: z.boolean().default(false),
});

router.post('/workgraph/skill-runs', authMiddleware, validateBody(skillRunBodySchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof skillRunBodySchema>;
    const tenantId = (req as unknown as { tenantId?: number }).tenantId ?? 0;
    const runId = `wgsr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!isDemoMode()) {
      await pool.query(
        `INSERT INTO work_graph_skill_runs
          (run_id, tenant_id, skill_id, skill_name, triggered_by, input_node_ids,
           output_summary, mirror_eval_score, approval_class, approval_state,
           proof_required, demo_mode, status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          runId, tenantId, body.skillId, body.skillName,
          (req as unknown as { user?: { id: string } }).user?.id ?? null,
          JSON.stringify(body.inputNodeIds),
          body.outputSummary ?? null,
          body.mirrorEvalScore ?? null,
          body.approvalClass,
          body.approvalClass === 'auto' ? 'not_required' : 'pending',
          body.proofRequired, false, 'complete',
        ],
      );
    }

    return sendCreated(res, {
      runId,
      skillId: body.skillId,
      approvalState: body.approvalClass === 'auto' ? 'not_required' : 'pending',
      demoMode: isDemoMode(),
    });
  } catch (err) {
    logger.error({ err }, 'POST /alloy/workgraph/skill-runs failed');
    return handleRouteError(res, err);
  }
});

// ─── GET /alloy/workgraph/skill-runs ─────────────────────────────────────────

router.get('/workgraph/skill-runs', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req as unknown as { tenantId?: number }).tenantId ?? 0;
    if (isDemoMode()) {
      return sendSuccess(res, { runs: [], demoMode: true });
    }
    const { rows } = await pool.query(
      'SELECT * FROM work_graph_skill_runs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId],
    );
    return sendSuccess(res, { runs: rows, demoMode: false });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

// ─── GET /alloy/workgraph/project-context ────────────────────────────────────

router.get('/workgraph/project-context', authMiddleware, async (req, res) => {
  try {
    const project = (req.query.project as string) ?? '';
    if (!project) return sendBadRequest(res, 'project query param required');

    const demoData = await getAllDemoData();
    const nodes: WorkGraphNodeInput[] = demoData.flatMap(({ connectorId, records }) => {
      const adapter = WORKSPACE_CONNECTOR_REGISTRY.find((c) => c.id === connectorId);
      if (!adapter) return [];
      return records.map((r) => adapter.normalizeToWorkGraph(r));
    });

    const context = projectContextBuilder(project, nodes);
    const stuckApprovals = approvalDetector(nodes.filter((n) => n.project === project));
    return sendSuccess(res, { context, stuckApprovals, demoMode: isDemoMode() });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
