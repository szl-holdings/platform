import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendError } from '../lib/api-response';
import { logger } from '../lib/logger';

const router: IRouter = Router();

const N8N_INSTANCE_URL = process.env.N8N_INSTANCE_URL?.replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY;
const CONFIGURED = Boolean(N8N_INSTANCE_URL && N8N_API_KEY);

function n8nHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': N8N_API_KEY ?? '',
  };
}

function notConfiguredResponse(res: Response) {
  // Return 200 with configured:false so the frontend can detect the "not set
  // up" state without hitting an HTTP error. The body carries enough detail
  // for operators to understand what is missing.
  return res.status(200).json({
    configured: false,
    message:
      'n8n is not connected. Set N8N_INSTANCE_URL and N8N_API_KEY environment variables to enable automations.',
  });
}

async function n8nFetch(path: string, init?: RequestInit) {
  const url = `${N8N_INSTANCE_URL}/api/v1${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      ...n8nHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`n8n API error ${response.status}: ${text}`);
  }
  return response.json();
}

router.get('/n8n/health', async (_req: Request, res: Response) => {
  if (!CONFIGURED) return notConfiguredResponse(res);
  try {
    await n8nFetch('/workflows?limit=1');
    res.json({ configured: true, reachable: true });
  } catch (err) {
    logger.warn({ err }, 'n8n health check failed');
    res.status(502).json({ configured: true, reachable: false, error: String(err) });
  }
});

router.get('/n8n/workflows', async (_req: Request, res: Response) => {
  if (!CONFIGURED) return notConfiguredResponse(res);
  try {
    const data = await n8nFetch('/workflows?limit=100');
    res.json(data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list n8n workflows');
  }
});

router.get('/n8n/workflows/:id', async (req: Request, res: Response) => {
  if (!CONFIGURED) return notConfiguredResponse(res);
  try {
    const data = await n8nFetch(`/workflows/${req.params.id}`);
    res.json(data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get n8n workflow');
  }
});

router.post('/n8n/workflows/:id/execute', async (req: Request, res: Response) => {
  if (!CONFIGURED) return notConfiguredResponse(res);
  try {
    const data = await n8nFetch(`/workflows/${req.params.id}/execute`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    });
    res.status(202).json(data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to execute n8n workflow');
  }
});

router.post('/n8n/workflows/:id/activate', async (req: Request, res: Response) => {
  if (!CONFIGURED) return notConfiguredResponse(res);
  try {
    const data = await n8nFetch(`/workflows/${req.params.id}/activate`, {
      method: 'POST',
    });
    res.json(data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to activate n8n workflow');
  }
});

router.get('/n8n/executions', async (req: Request, res: Response) => {
  if (!CONFIGURED) return notConfiguredResponse(res);
  try {
    const workflowId = req.query.workflowId ? `&workflowId=${req.query.workflowId}` : '';
    const limit = req.query.limit ? `&limit=${req.query.limit}` : '&limit=25';
    const data = await n8nFetch(`/executions?includeData=false${workflowId}${limit}`);
    res.json(data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list n8n executions');
  }
});

router.get('/n8n/executions/:id', async (req: Request, res: Response) => {
  if (!CONFIGURED) return notConfiguredResponse(res);
  try {
    const data = await n8nFetch(`/executions/${req.params.id}`);
    res.json(data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get n8n execution');
  }
});

export default router;
