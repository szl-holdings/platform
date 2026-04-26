import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendCreated, sendNotFound, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { logger } from '../lib/logger';
import { getAdapter, listAdapters } from '../siem/registry';
import {
  siemConnectionsStore,
  createConnection,
  enableConnection,
  disableConnection,
  ingestWebhookAlert,
} from '../services/sentra-siem-store';
import { verifyWebhookSignature } from '../siem/adapters/generic-webhook';

const router: IRouter = Router();

const createConnectionSchema = z.object({
  name: z.string().min(1).max(100),
  adapterId: z.string().min(1).max(50),
  config: z.record(z.unknown()).optional().default({}),
});

const updateConnectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.record(z.unknown()).optional(),
});

// GET /api/sentra/siem/adapters — list available adapter types
router.get('/sentra/siem/adapters', (_req: Request, res: Response) => {
  try {
    const adapters = listAdapters().map((a) => ({
      id: a.id,
      displayName: a.displayName,
      description: a.description,
      configFields: Object.entries(a.configSchema.shape).map(([key, schema]) => ({
        key,
        description: (schema as { description?: string }).description ?? '',
        optional: !(schema instanceof z.ZodDefault) && schema.isOptional(),
      })),
    }));
    sendSuccess(res, { adapters });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list SIEM adapters');
  }
});

// GET /api/sentra/siem/connections
router.get('/sentra/siem/connections', (_req: Request, res: Response) => {
  try {
    const connections = Array.from(siemConnectionsStore.values()).map((c) => ({
      ...c,
      config: sanitizeConfig(c.config),
    }));
    sendSuccess(res, { connections, total: connections.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list SIEM connections');
  }
});

// POST /api/sentra/siem/connections
router.post(
  '/sentra/siem/connections',
  validateBody(createConnectionSchema),
  (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof createConnectionSchema>;
      const adapter = getAdapter(body.adapterId);
      if (!adapter) {
        sendBadRequest(res, `Unknown adapter: ${body.adapterId}`);
        return;
      }
      const validation = adapter.validate(body.config as Record<string, unknown>);
      if (!validation.ok) {
        sendBadRequest(res, 'Invalid adapter config: ' + validation.errors.join('; '));
        return;
      }
      const connection = createConnection({
        name: body.name,
        adapterId: body.adapterId,
        config: body.config as Record<string, unknown>,
      });
      logger.info({ connectionId: connection.id, adapterId: body.adapterId }, '[siem] connection created');
      sendCreated(res, { ...connection, config: sanitizeConfig(connection.config) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create SIEM connection');
    }
  },
);

// PATCH /api/sentra/siem/connections/:id
router.patch(
  '/sentra/siem/connections/:id',
  validateBody(updateConnectionSchema),
  (req: Request, res: Response) => {
    try {
      const conn = siemConnectionsStore.get(req.params.id as string);
      if (!conn) {
        sendNotFound(res, 'SIEM Connection');
        return;
      }
      const body = req.body as z.infer<typeof updateConnectionSchema>;
      if (body.name) conn.name = body.name;
      if (body.config) conn.config = { ...conn.config, ...body.config };
      conn.updatedAt = new Date().toISOString();
      siemConnectionsStore.set(conn.id, conn);
      sendSuccess(res, { ...conn, config: sanitizeConfig(conn.config) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update SIEM connection');
    }
  },
);

// DELETE /api/sentra/siem/connections/:id
router.delete('/sentra/siem/connections/:id', (req: Request, res: Response) => {
  try {
    const conn = siemConnectionsStore.get(req.params.id as string);
    if (!conn) {
      sendNotFound(res, 'SIEM Connection');
      return;
    }
    if (conn.enabled) disableConnection(conn.id);
    siemConnectionsStore.delete(conn.id);
    logger.info({ connectionId: conn.id }, '[siem] connection deleted');
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete SIEM connection');
  }
});

// POST /api/sentra/siem/connections/:id/test
router.post('/sentra/siem/connections/:id/test', async (req: Request, res: Response) => {
  try {
    const conn = siemConnectionsStore.get(req.params.id as string);
    if (!conn) {
      sendNotFound(res, 'SIEM Connection');
      return;
    }
    const adapter = getAdapter(conn.adapterId);
    if (!adapter) {
      sendBadRequest(res, 'Adapter not found');
      return;
    }
    const result = await adapter.testConnection(conn.config);
    conn.lastTestedAt = new Date().toISOString();
    conn.lastTestResult = {
      ok: result.ok,
      message: result.ok ? `Received ${result.sample.length} sample alert(s)` : result.error,
    };
    siemConnectionsStore.set(conn.id, conn);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to test SIEM connection');
  }
});

// POST /api/sentra/siem/connections/:id/enable
router.post('/sentra/siem/connections/:id/enable', (req: Request, res: Response) => {
  try {
    const conn = enableConnection(req.params.id as string);
    if (!conn) {
      sendNotFound(res, 'SIEM Connection');
      return;
    }
    sendSuccess(res, { ...conn, config: sanitizeConfig(conn.config) });
  } catch (err) {
    handleRouteError(res, err, 'Failed to enable SIEM connection');
  }
});

// POST /api/sentra/siem/connections/:id/disable
router.post('/sentra/siem/connections/:id/disable', (req: Request, res: Response) => {
  try {
    const conn = disableConnection(req.params.id as string);
    if (!conn) {
      sendNotFound(res, 'SIEM Connection');
      return;
    }
    sendSuccess(res, { ...conn, config: sanitizeConfig(conn.config) });
  } catch (err) {
    handleRouteError(res, err, 'Failed to disable SIEM connection');
  }
});

// POST /api/sentra/siem/ingest/:connectionId  — public webhook ingest endpoint
router.post('/sentra/siem/ingest/:connectionId', (req: Request, res: Response) => {
  try {
    const connectionId = req.params.connectionId as string;
    const conn = siemConnectionsStore.get(connectionId);
    if (!conn) {
      sendNotFound(res, 'SIEM Connection');
      return;
    }

    if (conn.adapterId === 'generic-webhook' && conn.config.hmacSecret) {
      const signature = req.headers['x-signature-sha256'] as string | undefined
        ?? req.headers[(String(conn.config.signatureHeader ?? 'x-signature-sha256')).toLowerCase()] as string | undefined;

      if (!signature) {
        sendBadRequest(res, 'Missing HMAC signature header');
        return;
      }
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
      const valid = verifyWebhookSignature(rawBody, String(conn.config.hmacSecret), signature);
      if (!valid) {
        logger.warn({ connectionId }, '[siem] webhook bad HMAC signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    const result = ingestWebhookAlert(connectionId, req.body);
    if (!result.ok) {
      sendBadRequest(res, result.error ?? 'Ingest failed');
      return;
    }
    sendSuccess(res, { accepted: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to ingest webhook alert');
  }
});

function sanitizeConfig(config: Record<string, unknown>): Record<string, unknown> {
  const redacted = ['token', 'secret', 'hmacSecret', 'password', 'apiKey', 'bearerToken'];
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    out[k] = redacted.some((r) => k.toLowerCase().includes(r.toLowerCase())) ? '***' : v;
  }
  return out;
}

export default router;
