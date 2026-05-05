/**
 * Unified HuggingFace Health/Status Endpoint
 *
 * Checks all HF subsystems in parallel:
 * - Inference API reachability (ping Qwen model)
 * - MCP proxy connectivity (discover tools)
 * - Connector adapter registration and token validity
 * - Local embedding backend availability
 * - AutoTrain API reachability
 *
 * Returns a structured status operators can use to verify the full HF stack is operational.
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import { sendSuccess } from '../lib/api-response';
import { db, hfModelRegistryTable, hfFailoverChainsTable } from '@szl-holdings/db';
import { desc, inArray } from 'drizzle-orm';

const router: IRouter = Router();

const HF_INFERENCE_BASE = 'https://router.huggingface.co/hf-inference/v1';
const HF_MCP_URL = 'https://huggingface.co/mcp';
const HF_AUTOTRAIN_BASE = 'https://huggingface.co/api/autotrain';
const PING_MODEL = 'Qwen/Qwen3-0.6B';
const TIMEOUT_MS = 10_000;

function getHfToken(): string | undefined {
  return process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
}

async function withTimeout<T>(factory: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await factory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function checkInferenceApi(): Promise<{
  reachable: boolean;
  latencyMs: number;
  model: string;
  error?: string;
}> {
  const token = getHfToken();
  const start = Date.now();
  try {
    const response = await withTimeout(
      (signal) =>
        fetch(`${HF_INFERENCE_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            model: PING_MODEL,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
            temperature: 0.0,
          }),
          signal,
        }),
      TIMEOUT_MS,
    );
    const latencyMs = Date.now() - start;
    if (response.ok || response.status === 422 || response.status === 400) {
      return { reachable: true, latencyMs, model: PING_MODEL };
    }
    const errText = await response.text().catch(() => '');
    return {
      reachable: false,
      latencyMs,
      model: PING_MODEL,
      error: `HTTP ${response.status}: ${errText.slice(0, 200)}`,
    };
  } catch (err) {
    return {
      reachable: false,
      latencyMs: Date.now() - start,
      model: PING_MODEL,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkMcpProxy(): Promise<{
  reachable: boolean;
  toolCount: number;
  latencyMs: number;
  error?: string;
}> {
  const token = getHfToken();
  const start = Date.now();
  try {
    const response = await withTimeout(
      (signal) =>
        fetch(HF_MCP_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ jsonrpc: '2.0', id: 'hf-status-check', method: 'tools/list' }),
          signal,
        }),
      TIMEOUT_MS,
    );
    const latencyMs = Date.now() - start;
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { reachable: false, toolCount: 0, latencyMs, error: `HTTP ${response.status}: ${errText.slice(0, 200)}` };
    }
    const data = (await response.json()) as {
      result?: { tools?: unknown[] } | unknown[];
      error?: { message: string };
    };
    if (data.error) {
      return { reachable: false, toolCount: 0, latencyMs, error: data.error.message };
    }
    const tools = Array.isArray(data.result)
      ? data.result
      : (data.result as { tools?: unknown[] })?.tools ?? [];
    return { reachable: true, toolCount: tools.length, latencyMs };
  } catch (err) {
    return {
      reachable: false,
      toolCount: 0,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkConnectorAdapter(): Promise<{
  registered: boolean;
  configured: boolean;
  toolCount: number;
}> {
  try {
    const { connectorRegistry } = await import('@szl-holdings/ai-engine');
    const adapter = connectorRegistry.get('huggingface');
    if (!adapter) return { registered: false, configured: false, toolCount: 0 };
    const health = await adapter.healthCheck();
    return {
      registered: true,
      configured: health.configured,
      toolCount: adapter.tools?.length ?? 0,
    };
  } catch {
    return { registered: false, configured: false, toolCount: 0 };
  }
}

async function checkTokenValidity(): Promise<{
  tokenPresent: boolean;
  tokenValid: boolean;
  username?: string;
  error?: string;
}> {
  const token = getHfToken();
  if (!token) return { tokenPresent: false, tokenValid: false };

  try {
    const response = await withTimeout(
      (signal) =>
        fetch('https://huggingface.co/api/whoami-v2', {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        }),
      TIMEOUT_MS,
    );
    if (!response.ok) {
      return { tokenPresent: true, tokenValid: false, error: `HTTP ${response.status}` };
    }
    const data = (await response.json()) as { name?: string };
    return { tokenPresent: true, tokenValid: true, username: data.name };
  } catch (err) {
    return {
      tokenPresent: true,
      tokenValid: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkEmbeddingBackend(): Promise<{
  available: boolean;
  backend?: string;
  error?: string;
}> {
  try {
    const { embeddingPipeline } = await import('@szl-holdings/ai-engine');
    const health = await embeddingPipeline.getHealth();
    const localProvider = health.providers?.find(
      (p: { name: string; healthy: boolean }) =>
        p.name === 'local' || p.name === 'transformers',
    );
    return {
      available: localProvider?.healthy ?? health.healthy ?? false,
      backend: localProvider?.name ?? 'transformers',
    };
  } catch (err) {
    return {
      available: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkAutoTrainApi(): Promise<{
  reachable: boolean;
  latencyMs: number;
  error?: string;
}> {
  const token = getHfToken();
  const start = Date.now();
  try {
    const response = await withTimeout(
      (signal) =>
        fetch(`${HF_AUTOTRAIN_BASE}/`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal,
        }),
      TIMEOUT_MS,
    );
    const latencyMs = Date.now() - start;
    return {
      reachable: response.ok || response.status === 401 || response.status === 403 || response.status === 404,
      latencyMs,
      ...(response.ok ? {} : { error: `HTTP ${response.status}` }),
    };
  } catch (err) {
    return {
      reachable: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function getPerModelGateStatus(): Promise<{
  models: Array<{
    modelId: string;
    displayName: string;
    lifecycleState: string;
    gates: {
      registryActive: boolean;
      licenseApproved: boolean;
      sensitivityMatch: boolean;
      liveInferenceAllowed: boolean;
      productionApproved: boolean;
      allPass: boolean;
    };
    failoverChain: {
      id: number;
      lane: string;
      primaryModelId: string;
      fallbackModelIds: unknown;
      isActive: boolean;
    } | null;
    lastInferenceAt: Date | null;
    recentFailureCount: number;
  }>;
  summary: { total: number; active: number; blocked: number; fullyGated: number };
  error?: string;
}> {
  try {
    const entries = await db
      .select()
      .from(hfModelRegistryTable)
      .orderBy(desc(hfModelRegistryTable.createdAt))
      .limit(100);

    if (entries.length === 0) {
      return { models: [], summary: { total: 0, active: 0, blocked: 0, fullyGated: 0 } };
    }

    const chainIds = [...new Set(entries.map((e) => e.failoverChainId).filter(Boolean) as number[])];
    const chains = chainIds.length > 0
      ? await db
          .select()
          .from(hfFailoverChainsTable)
          .where(inArray(hfFailoverChainsTable.id, chainIds))
      : [];

    const chainMap = new Map(chains.map((c) => [c.id, c]));

    const models = entries.map((e) => {
      const gateRegistryActive = e.lifecycleState === 'active';
      const allPass =
        gateRegistryActive &&
        e.gateLicenseApproved &&
        e.gateSensitivityMatch &&
        e.gateLiveInferenceAllowed &&
        e.gateProductionApproved;

      const chain = e.failoverChainId ? chainMap.get(e.failoverChainId) : null;

      return {
        modelId: e.modelId,
        displayName: e.displayName,
        lifecycleState: e.lifecycleState,
        gates: {
          registryActive: gateRegistryActive,
          licenseApproved: e.gateLicenseApproved,
          sensitivityMatch: e.gateSensitivityMatch,
          liveInferenceAllowed: e.gateLiveInferenceAllowed,
          productionApproved: e.gateProductionApproved,
          allPass,
        },
        failoverChain: chain
          ? {
              id: chain.id,
              lane: chain.lane,
              primaryModelId: chain.primaryModelId,
              fallbackModelIds: chain.fallbackModelIds,
              isActive: chain.isActive,
            }
          : null,
        lastInferenceAt: e.lastInferenceAt,
        recentFailureCount: e.recentFailureCount,
      };
    });

    const active = models.filter((m) => m.lifecycleState === 'active').length;
    const fullyGated = models.filter((m) => m.gates.allPass).length;
    const blocked = models.filter((m) => m.lifecycleState === 'active' && !m.gates.allPass).length;

    return {
      models,
      summary: { total: models.length, active, blocked, fullyGated },
    };
  } catch (err) {
    return {
      models: [],
      summary: { total: 0, active: 0, blocked: 0, fullyGated: 0 },
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

router.get('/hf/status', async (_req: Request, res: Response) => {
  const checkStart = Date.now();

  const [inferenceApi, mcpProxy, connector, tokenValidity, embeddingBackend, autoTrainApi, perModelGateStatus] =
    await Promise.all([
      checkInferenceApi(),
      checkMcpProxy(),
      checkConnectorAdapter(),
      checkTokenValidity(),
      checkEmbeddingBackend(),
      checkAutoTrainApi(),
      getPerModelGateStatus(),
    ]);

  const allHealthy =
    inferenceApi.reachable &&
    mcpProxy.reachable &&
    connector.registered &&
    tokenValidity.tokenValid &&
    embeddingBackend.available &&
    autoTrainApi.reachable;

  const status = allHealthy ? 'healthy' : 'degraded';

  return sendSuccess(res, {
    status,
    checkedAt: new Date().toISOString(),
    totalCheckMs: Date.now() - checkStart,
    subsystems: {
      inferenceApi: {
        ...inferenceApi,
        description: 'HuggingFace Inference API (chat completions)',
        endpoint: HF_INFERENCE_BASE,
      },
      mcpProxy: {
        ...mcpProxy,
        description: 'HuggingFace Hub MCP server (tool discovery)',
        endpoint: HF_MCP_URL,
      },
      connectorAdapter: {
        ...connector,
        description: 'HuggingFace connector adapter (text classification, embeddings, model search)',
      },
      tokenValidity: {
        ...tokenValidity,
        description: 'HuggingFace API token (HF_TOKEN / HUGGINGFACE_API_KEY)',
      },
      embeddingBackend: {
        ...embeddingBackend,
        description: 'Local @huggingface/transformers embedding backend',
      },
      autoTrainApi: {
        ...autoTrainApi,
        description: 'HuggingFace AutoTrain API (fine-tuning job submission)',
        endpoint: HF_AUTOTRAIN_BASE,
      },
    },
    modelRegistry: perModelGateStatus,
  });
});

export default router;
