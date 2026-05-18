/**
 * Sandbox API Routes
 *
 * Exposes session CRUD, agent runs, file inspection, and artifact retrieval
 * for the governed sandbox runtime. All routes are behind tenantScope-scoped
 * auth middleware; sessions are isolated per tenant (IDOR-safe).
 *
 * POST   /sandbox/sessions                         — create session from manifest
 * GET    /sandbox/sessions                         — list sessions (tenant-filtered)
 * GET    /sandbox/sessions/:id                     — session status + file listing
 * POST   /sandbox/sessions/:id/run                 — run agent in session
 * POST   /sandbox/sessions/:id/snapshot            — save snapshot
 * POST   /sandbox/sessions/:id/resume              — resume from snapshot
 * DELETE /sandbox/sessions/:id                     — destroy session
 * GET    /sandbox/sessions/:id/files/*             — read file from workspace
 * GET    /sandbox/sessions/:id/artifacts           — list generated artifacts
 */

import {
  defaultSandboxClient,
  ManifestSchema,
  SandboxRunConfigSchema,
} from '@workspace/sandbox-runtime';
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendCreated, sendNoContent, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const router: IRouter = Router();

/** Extract `req.tenantOrgId` and assert it is present (tenantScope guarantees this). */
function requireTenantId(req: Request, res: Response): string | null {
  const tenantId = req.tenantOrgId;
  if (!tenantId) {
    res.status(403).json({ error: 'Tenant context is required for sandbox operations.' });
    return null;
  }
  return tenantId;
}

// ─── POST /sandbox/sessions ───────────────────────────────────────────────────

router.post(
  '/sandbox/sessions',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req, res);
      if (!tenantId) return;

      const parsed = ManifestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Invalid manifest',
          details: parsed.error.flatten(),
        });
        return;
      }

      const session = await defaultSandboxClient.createSession(parsed.data, tenantId);
      sendCreated(res, {
        sessionId: session.sessionId,
        tenantId: session.tenantId,
        workspaceRoot: session.workspaceRoot,
        status: session.status,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create sandbox session');
    }
  },
);

// ─── GET /sandbox/sessions ────────────────────────────────────────────────────

router.get(
  '/sandbox/sessions',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req, res);
      if (!tenantId) return;

      const sessions = await defaultSandboxClient.listSessions(tenantId);
      sendSuccess(res, { sessions, count: sessions.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list sandbox sessions');
    }
  },
);

// ─── GET /sandbox/sessions/:id ────────────────────────────────────────────────

router.get(
  '/sandbox/sessions/:id',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req, res);
      if (!tenantId) return;

      const session = defaultSandboxClient.getSession(req.params.id!, tenantId);
      if (!session) {
        res.status(404).json({ error: `Session '${req.params.id}' not found` });
        return;
      }

      const state = await session.getState();
      sendSuccess(res, state);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get sandbox session');
    }
  },
);

// ─── POST /sandbox/sessions/:id/run ──────────────────────────────────────────

router.post(
  '/sandbox/sessions/:id/run',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req, res);
      if (!tenantId) return;

      const { objective, config } = req.body as {
        objective?: unknown;
        config?: unknown;
      };

      if (!objective || typeof objective !== 'string') {
        res.status(400).json({ error: "'objective' (string) is required" });
        return;
      }

      const parsedConfig = SandboxRunConfigSchema.safeParse(config ?? {});
      if (!parsedConfig.success) {
        res.status(400).json({
          error: 'Invalid run config',
          details: parsedConfig.error.flatten(),
        });
        return;
      }

      const result = await defaultSandboxClient.runAgent(
        req.params.id!,
        objective,
        parsedConfig.data,
        tenantId,
      );
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to run sandbox agent');
    }
  },
);

// ─── POST /sandbox/sessions/:id/snapshot ─────────────────────────────────────

router.post(
  '/sandbox/sessions/:id/snapshot',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req, res);
      if (!tenantId) return;

      const snapshot = await defaultSandboxClient.snapshot(req.params.id!, tenantId);
      sendSuccess(res, snapshot);
    } catch (err) {
      handleRouteError(res, err, 'Failed to snapshot sandbox session');
    }
  },
);

// ─── POST /sandbox/sessions/:id/resume ───────────────────────────────────────

router.post(
  '/sandbox/sessions/:id/resume',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req, res);
      if (!tenantId) return;

      const snapshot = req.body as Parameters<typeof defaultSandboxClient.resumeFromSnapshot>[0];
      if (!snapshot?.snapshotId) {
        res.status(400).json({ error: 'A valid snapshot object is required in the request body' });
        return;
      }

      const session = await defaultSandboxClient.resumeFromSnapshot(snapshot, tenantId);
      sendCreated(res, {
        sessionId: session.sessionId,
        tenantId: session.tenantId,
        workspaceRoot: session.workspaceRoot,
        status: session.status,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to resume sandbox session');
    }
  },
);

// ─── DELETE /sandbox/sessions/:id ────────────────────────────────────────────

router.delete(
  '/sandbox/sessions/:id',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req, res);
      if (!tenantId) return;

      await defaultSandboxClient.destroySession(req.params.id!, tenantId);
      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to destroy sandbox session');
    }
  },
);

// ─── GET /sandbox/sessions/:id/files/* ───────────────────────────────────────

router.get(
  '/sandbox/sessions/:id/files/*splat',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req, res);
      if (!tenantId) return;

      const session = defaultSandboxClient.getSession(req.params.id!, tenantId);
      if (!session) {
        res.status(404).json({ error: `Session '${req.params.id}' not found` });
        return;
      }

      // Express 5 / path-to-regexp v7 captures `*splat` as an array of path
      // segments under req.params.splat. Older builds used req.params[0]
      // (string). Support both shapes so the handler stays backward-compatible
      // if the runtime ever rolls back.
      const splatParam = (req.params as Record<string, unknown>).splat;
      const filePath = Array.isArray(splatParam)
        ? splatParam.join('/')
        : typeof splatParam === 'string'
          ? splatParam
          : ((req.params as Record<string, string>)[0] ?? '');
      if (!filePath) {
        res.status(400).json({ error: 'File path is required' });
        return;
      }

      const offsetBytes = req.query.offset ? Number(req.query.offset) : undefined;
      const limitBytes = req.query.limit ? Number(req.query.limit) : undefined;

      const { FilesystemCapability } = await import('@workspace/sandbox-runtime/capabilities/filesystem');
      const fs = new FilesystemCapability({ workspaceRoot: session.workspaceRoot });
      const result = await fs.readFile(filePath, { offsetBytes, limitBytes });

      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to read sandbox file');
    }
  },
);

// ─── GET /sandbox/sessions/:id/artifacts ─────────────────────────────────────

router.get(
  '/sandbox/sessions/:id/artifacts',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req, res);
      if (!tenantId) return;

      const session = defaultSandboxClient.getSession(req.params.id!, tenantId);
      if (!session) {
        res.status(404).json({ error: `Session '${req.params.id}' not found` });
        return;
      }

      const state = await session.getState();
      const artifacts = state.fileInventory.map((f) => ({
        path: f.path,
        sizeBytes: f.sizeBytes,
        modifiedAt: f.modifiedAt,
      }));

      sendSuccess(res, { sessionId: session.sessionId, artifacts, count: artifacts.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list sandbox artifacts');
    }
  },
);

export default router;
