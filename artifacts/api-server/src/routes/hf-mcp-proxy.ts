import { type IRouter, type Request, type Response, Router } from 'express';
import { logger } from '../lib/logger';
import { handleRouteError, sendSuccess } from '../lib/api-response';

const router: IRouter = Router();

const HF_MCP_URL = 'https://huggingface.co/mcp';
const PROXY_TIMEOUT_MS = 25_000;

const ALLOWED_HF_TOOLS = new Set([
  'search_models',
  'search_datasets',
  'search_papers',
  'search_spaces',
  'get_model_info',
  'get_dataset_info',
]);

const ALLOWED_PROXY_METHODS = new Set(['tools/list', 'tools/call', 'initialize']);

function getHfToken(): string | undefined {
  return process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
}

interface HfMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

let cachedTools: HfMcpTool[] | null = null;
let cacheTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function hfMcpCall(
  method: string,
  params?: Record<string, unknown>,
): Promise<unknown> {
  const token = getHfToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const body = {
      jsonrpc: '2.0' as const,
      id: `szl-${Date.now()}`,
      method,
      ...(params ? { params } : {}),
    };

    const resp = await fetch(HF_MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`HF MCP returned ${resp.status}: ${errText.slice(0, 300)}`);
    }

    const data = await resp.json() as {
      result?: unknown;
      error?: { code: number; message: string; data?: unknown };
    };

    if (data.error) {
      throw new Error(`HF MCP error ${data.error.code}: ${data.error.message}`);
    }

    return data.result;
  } finally {
    clearTimeout(timer);
  }
}

async function discoverTools(): Promise<HfMcpTool[]> {
  if (cachedTools && Date.now() - cacheTs < CACHE_TTL_MS) return cachedTools;

  try {
    const result = await hfMcpCall('tools/list') as { tools?: HfMcpTool[] } | HfMcpTool[];
    const tools = Array.isArray(result) ? result : (result as { tools?: HfMcpTool[] })?.tools ?? [];
    cachedTools = tools;
    cacheTs = Date.now();
    logger.info({ count: tools.length }, '[hf-mcp] discovered tools from HuggingFace MCP');
    return tools;
  } catch (err) {
    logger.warn({ err }, '[hf-mcp] failed to discover tools');
    return cachedTools ?? [];
  }
}

async function callHfTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const start = Date.now();
  try {
    const result = await hfMcpCall('tools/call', { name: toolName, arguments: args });
    logger.info(
      { tool: toolName, latencyMs: Date.now() - start },
      '[hf-mcp] tool call completed',
    );
    return result;
  } catch (err) {
    logger.error(
      { tool: toolName, err, latencyMs: Date.now() - start },
      '[hf-mcp] tool call failed',
    );
    throw err;
  }
}

router.get('/hf-mcp/health', async (_req: Request, res: Response) => {
  try {
    const token = getHfToken();
    const tools = await discoverTools();
    return sendSuccess(res, {
      status: token ? 'configured' : 'no_token',
      endpoint: HF_MCP_URL,
      toolCount: tools.length,
      tokenConfigured: !!token,
      cachedAt: cacheTs > 0 ? new Date(cacheTs).toISOString() : null,
    });
  } catch (err) {
    return handleRouteError(res, err, 'hf-mcp-health');
  }
});

router.get('/hf-mcp/tools', async (_req: Request, res: Response) => {
  try {
    const tools = await discoverTools();
    return sendSuccess(res, {
      server: 'huggingface-mcp',
      endpoint: HF_MCP_URL,
      tools,
    });
  } catch (err) {
    return handleRouteError(res, err, 'hf-mcp-tools');
  }
});

router.post('/hf-mcp/tools/call', async (req: Request, res: Response) => {
  try {
    const { name, toolName, arguments: args } = req.body as {
      name?: string;
      toolName?: string;
      arguments?: Record<string, unknown>;
    };
    const resolvedName = name ?? toolName;
    if (!resolvedName) {
      return res.status(400).json({ error: 'tool name is required (provide "name" or "toolName")' });
    }
    if (!ALLOWED_HF_TOOLS.has(resolvedName)) {
      return res.status(403).json({ error: `tool "${resolvedName}" is not in the HuggingFace MCP allowlist` });
    }
    if (!getHfToken()) {
      return res.status(503).json({ error: 'HuggingFace API token not configured (set HF_TOKEN or HUGGINGFACE_API_KEY)' });
    }
    const result = await callHfTool(resolvedName, args ?? {});
    return sendSuccess(res, { tool: resolvedName, result });
  } catch (err) {
    return handleRouteError(res, err, 'hf-mcp-tool-call');
  }
});

router.post('/hf-mcp/proxy', async (req: Request, res: Response) => {
  try {
    const body = req.body as { method?: string; params?: Record<string, unknown> };
    if (!body.method) {
      return res.status(400).json({ error: 'method is required' });
    }
    if (!ALLOWED_PROXY_METHODS.has(body.method)) {
      return res.status(403).json({
        error: `method "${body.method}" is not allowed — permitted: ${[...ALLOWED_PROXY_METHODS].join(', ')}`,
      });
    }
    if (body.method === 'tools/call') {
      const toolName = (body.params as { name?: string } | undefined)?.name;
      if (toolName && !ALLOWED_HF_TOOLS.has(toolName)) {
        return res.status(403).json({ error: `tool "${toolName}" is not in the HuggingFace MCP allowlist` });
      }
    }
    if (!getHfToken()) {
      return res.status(503).json({ error: 'HuggingFace API token not configured (set HF_TOKEN or HUGGINGFACE_API_KEY)' });
    }
    const result = await hfMcpCall(body.method, body.params);
    return sendSuccess(res, { method: body.method, result });
  } catch (err) {
    return handleRouteError(res, err, 'hf-mcp-proxy');
  }
});

export { discoverTools as discoverHfMcpTools, callHfTool };
export default router;
