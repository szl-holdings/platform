import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Download,
  HardDrive,
  Loader2,
  Monitor,
  Power,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const SUBSTRATE_BASE_URL: string =
  import.meta.env.VITE_SUBSTRATE_INFERENCE_URL || 'http://localhost:8070';
const SUBSTRATE_API_KEY: string = import.meta.env.VITE_SUBSTRATE_API_KEY || '';

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (SUBSTRATE_API_KEY) h['Authorization'] = `Bearer ${SUBSTRATE_API_KEY}`;
  return h;
}

interface SubstrateModel {
  id: string;
  name: string;
  parameters: string;
  contextLength: number;
  modalities: string[];
  loaded: boolean;
  vramUsedMb: number;
  tags: string[];
}

interface GpuStatus {
  name: string;
  vramTotalMb: number;
  vramUsedMb: number;
  vramFreeMb: number;
  temperature: number | null;
}

interface ServiceHealth {
  status: string;
  loadedModels: string[];
  gpuInfo: GpuStatus;
  queueDepth: number;
  avgLatencyMs: number;
  uptime: number;
  engine: string;
}

interface ApiModelInfo {
  id: string;
  context_length: number;
  modalities: string[];
  parameters: string;
  loaded: boolean;
  vram_used_mb: number;
}

interface ApiHealthResponse {
  status: string;
  loaded_models: string[];
  gpu_info: {
    name: string;
    vram_total_mb: number;
    vram_used_mb: number;
    vram_free_mb: number;
    temperature: number | null;
  } | null;
  queue_depth: number;
  avg_latency_ms: number;
  uptime: number;
  engine: string;
}

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'llama-3.3-70b-instruct': 'Llama 3.3 70B Instruct',
  'llama-3.1-8b-instruct': 'Llama 3.1 8B Instruct',
  'qwen3-next-80b': 'Qwen3-Next 80B',
  'gemma3-12b': 'Gemma3 12B',
  'gpt-oss-20b': 'GPT-OSS 20B',
  'voxtral-small-24b': 'Voxtral Small 24B',
};

const MODEL_TAGS: Record<string, string[]> = {
  'llama-3.3-70b-instruct': ['reasoning', 'generation', 'planning'],
  'llama-3.1-8b-instruct': ['triage', 'classification', 'extraction'],
  'qwen3-next-80b': ['reasoning', 'generation', 'planning'],
  'gemma3-12b': ['reasoning', 'generation', 'summarization'],
  'gpt-oss-20b': ['reasoning', 'generation', 'triage'],
  'voxtral-small-24b': ['generation', 'summarization'],
};

const FALLBACK_GPU: GpuStatus = {
  name: 'Unavailable',
  vramTotalMb: 0,
  vramUsedMb: 0,
  vramFreeMb: 0,
  temperature: null,
};

const FALLBACK_MODELS: SubstrateModel[] = [
  {
    id: 'llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    parameters: '70B',
    contextLength: 131072,
    modalities: ['text'],
    loaded: false,
    vramUsedMb: 0,
    tags: ['reasoning', 'generation', 'planning'],
  },
  {
    id: 'llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    parameters: '8B',
    contextLength: 131072,
    modalities: ['text'],
    loaded: false,
    vramUsedMb: 0,
    tags: ['triage', 'classification', 'extraction'],
  },
  {
    id: 'qwen3-next-80b',
    name: 'Qwen3-Next 80B',
    parameters: '80B',
    contextLength: 131072,
    modalities: ['text'],
    loaded: false,
    vramUsedMb: 0,
    tags: ['reasoning', 'generation', 'planning'],
  },
  {
    id: 'gemma3-12b',
    name: 'Gemma3 12B',
    parameters: '12B',
    contextLength: 32768,
    modalities: ['text', 'image'],
    loaded: false,
    vramUsedMb: 0,
    tags: ['reasoning', 'generation', 'summarization'],
  },
  {
    id: 'gpt-oss-20b',
    name: 'GPT-OSS 20B',
    parameters: '20B',
    contextLength: 65536,
    modalities: ['text'],
    loaded: false,
    vramUsedMb: 0,
    tags: ['reasoning', 'generation', 'triage'],
  },
  {
    id: 'voxtral-small-24b',
    name: 'Voxtral Small 24B',
    parameters: '24B',
    contextLength: 32768,
    modalities: ['text', 'audio'],
    loaded: false,
    vramUsedMb: 0,
    tags: ['generation', 'summarization'],
  },
];

function apiModelToSubstrateModel(m: ApiModelInfo): SubstrateModel {
  return {
    id: m.id,
    name: MODEL_DISPLAY_NAMES[m.id] ?? m.id,
    parameters: m.parameters,
    contextLength: m.context_length,
    modalities: m.modalities,
    loaded: m.loaded,
    vramUsedMb: m.vram_used_mb,
    tags: MODEL_TAGS[m.id] ?? [],
  };
}

function apiHealthToServiceHealth(h: ApiHealthResponse): ServiceHealth {
  return {
    status: h.status,
    loadedModels: h.loaded_models,
    gpuInfo: h.gpu_info
      ? {
          name: h.gpu_info.name,
          vramTotalMb: h.gpu_info.vram_total_mb,
          vramUsedMb: h.gpu_info.vram_used_mb,
          vramFreeMb: h.gpu_info.vram_free_mb,
          temperature: h.gpu_info.temperature,
        }
      : FALLBACK_GPU,
    queueDepth: h.queue_depth,
    avgLatencyMs: h.avg_latency_ms,
    uptime: h.uptime,
    engine: h.engine,
  };
}

function VramBar({ usedMb, totalMb }: { usedMb: number; totalMb: number }) {
  if (totalMb <= 0) {
    return (
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-slate-500">VRAM Usage</span>
          <span className="font-mono text-[10px] text-slate-600">N/A</span>
        </div>
        <div className="h-2 bg-white/6 rounded-full overflow-hidden" />
      </div>
    );
  }
  const pct = Math.min((usedMb / totalMb) * 100, 100);
  const color = pct < 60 ? '#4ade80' : pct < 80 ? '#facc15' : '#ef4444';
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-slate-500">VRAM Usage</span>
        <span className="font-mono text-[10px]" style={{ color }}>
          {(usedMb / 1024).toFixed(1)} / {(totalMb / 1024).toFixed(1)} GB
        </span>
      </div>
      <div className="h-2 bg-white/6 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ModalityBadge({ modality }: { modality: string }) {
  const colors: Record<string, string> = {
    text: '#4ade80',
    image: '#818cf8',
    audio: '#f472b6',
  };
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider"
      style={{
        background: `${colors[modality] ?? '#94a3b8'}15`,
        color: colors[modality] ?? '#94a3b8',
        border: `1px solid ${colors[modality] ?? '#94a3b8'}30`,
      }}
    >
      {modality}
    </span>
  );
}

function ModelCard({
  model,
  onLoad,
  onUnload,
  actionInProgress,
}: {
  model: SubstrateModel;
  onLoad: (id: string) => void;
  onUnload: (id: string) => void;
  actionInProgress: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isActioning = actionInProgress === model.id;

  return (
    <div className="imperial-card rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/2 transition-all"
      >
        <div
          className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{
            background: model.loaded ? 'rgba(74,222,128,0.1)' : 'rgba(148,163,184,0.08)',
            border: model.loaded
              ? '1px solid rgba(74,222,128,0.3)'
              : '1px solid rgba(148,163,184,0.15)',
          }}
        >
          {model.loaded ? (
            <Activity className="w-4 h-4 text-green-400" />
          ) : (
            <Power className="w-4 h-4 text-slate-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-display text-sm tracking-[0.08em] font-bold text-slate-200">
            {model.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[10px] text-slate-500">{model.parameters} params</span>
            <span className="text-slate-700">|</span>
            <span className="font-mono text-[10px] text-slate-500">
              {(model.contextLength / 1024).toFixed(0)}k ctx
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1">
            {model.modalities.map((m) => (
              <ModalityBadge key={m} modality={m} />
            ))}
          </div>
          {model.loaded && model.vramUsedMb > 0 && (
            <span className="font-mono text-[10px] text-green-400">
              {(model.vramUsedMb / 1024).toFixed(1)} GB
            </span>
          )}
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-600 flex-shrink-0 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0 ml-1" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {model.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider"
                style={{
                  background: 'rgba(201,162,39,0.08)',
                  color: 'rgba(201,162,39,0.8)',
                  border: '1px solid rgba(201,162,39,0.15)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded p-2 bg-white/3 text-center">
              <div className="text-[9px] text-slate-600 mb-0.5">Parameters</div>
              <div className="font-mono text-xs text-slate-300">{model.parameters}</div>
            </div>
            <div className="rounded p-2 bg-white/3 text-center">
              <div className="text-[9px] text-slate-600 mb-0.5">Context</div>
              <div className="font-mono text-xs text-slate-300">
                {(model.contextLength / 1024).toFixed(0)}k
              </div>
            </div>
            <div className="rounded p-2 bg-white/3 text-center">
              <div className="text-[9px] text-slate-600 mb-0.5">Cost</div>
              <div className="font-mono text-xs text-green-400">$0.00</div>
            </div>
          </div>

          <button
            onClick={() => (model.loaded ? onUnload(model.id) : onLoad(model.id))}
            disabled={isActioning}
            className="w-full py-2 rounded text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2"
            style={{
              background: model.loaded ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
              border: model.loaded
                ? '1px solid rgba(239,68,68,0.3)'
                : '1px solid rgba(74,222,128,0.3)',
              color: model.loaded ? '#ef4444' : '#4ade80',
            }}
          >
            {isActioning ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : model.loaded ? (
              <>
                <Power className="w-3 h-3" /> UNLOAD MODEL
              </>
            ) : (
              <>
                <Download className="w-3 h-3" /> LOAD MODEL
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SubstrateInferencePage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [models, setModels] = useState<SubstrateModel[]>(FALLBACK_MODELS);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${SUBSTRATE_BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiHealthResponse = await res.json();
      setHealth(apiHealthToServiceHealth(data));
      setConnected(true);
      setError(null);
    } catch {
      setConnected(false);
      setHealth(null);
    }
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch(`${SUBSTRATE_BASE_URL}/v1/models`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { data: ApiModelInfo[] } = await res.json();
      setModels(data.data.map(apiModelToSubstrateModel));
    } catch {
      setModels(FALLBACK_MODELS);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchHealth(), fetchModels()]);
    setLastRefresh(new Date());
  }, [fetchHealth, fetchModels]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleLoad = useCallback(
    async (modelId: string) => {
      setActionInProgress(modelId);
      setError(null);
      try {
        const res = await fetch(`${SUBSTRATE_BASE_URL}/v1/models/load`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ model_id: modelId }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
          throw new Error(body.detail || `HTTP ${res.status}`);
        }
        await refresh();
      } catch (err: unknown) {
        setError(`Failed to load ${modelId}: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setActionInProgress(null);
      }
    },
    [refresh],
  );

  const handleUnload = useCallback(
    async (modelId: string) => {
      setActionInProgress(modelId);
      setError(null);
      try {
        const res = await fetch(`${SUBSTRATE_BASE_URL}/v1/models/unload`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ model_id: modelId }),
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
          throw new Error(body.detail || `HTTP ${res.status}`);
        }
        await refresh();
      } catch (err: unknown) {
        setError(`Failed to unload ${modelId}: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setActionInProgress(null);
      }
    },
    [refresh],
  );

  const gpu = health?.gpuInfo ?? FALLBACK_GPU;
  const loadedModels = models.filter((m) => m.loaded);
  const totalVram = gpu.vramTotalMb;
  const usedVram = gpu.vramUsedMb;
  const vramPct = totalVram > 0 ? (usedVram / totalVram) * 100 : 0;
  const queueDepth = health?.queueDepth ?? 0;
  const avgLatency = health?.avgLatencyMs ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Server className="w-5 h-5" style={{ color: '#c9a227' }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Substrate Edge Inference
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {connected === true && (
              <span className="flex items-center gap-1 text-[10px] text-green-400 font-mono">
                <Wifi className="w-3 h-3" /> CONNECTED
              </span>
            )}
            {connected === false && (
              <span className="flex items-center gap-1 text-[10px] text-red-400 font-mono">
                <WifiOff className="w-3 h-3" /> OFFLINE
              </span>
            )}
            {connected === null && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" /> CONNECTING
              </span>
            )}
            <button
              onClick={refresh}
              className="p-1 rounded hover:bg-white/5 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-8">
          <p className="text-xs text-slate-500">
            oLLM-powered local GPU inference — 80B+ parameter models on consumer GPUs, zero cost,
            air-gapped capable
          </p>
          {lastRefresh && (
            <span className="text-[9px] text-slate-700 font-mono flex-shrink-0">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {connected === false && (
        <div
          className="rounded-lg p-4 flex items-center gap-3"
          style={{
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}
        >
          <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div>
            <div className="text-xs text-red-400 font-mono tracking-wider">
              SERVICE UNREACHABLE
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Cannot reach Substrate Inference at {SUBSTRATE_BASE_URL}. Ensure the FastAPI service
              is running. Showing registry defaults below.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="rounded-lg p-3 flex items-center gap-3"
          style={{
            background: 'rgba(250,204,21,0.04)',
            border: '1px solid rgba(250,204,21,0.15)',
          }}
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <div className="text-[10px] text-yellow-400 font-mono">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Loaded Models',
            value: loadedModels.length,
            total: models.length,
            color: '#c9a227',
            icon: Monitor,
          },
          {
            label: 'VRAM Used',
            value: totalVram > 0 ? `${(usedVram / 1024).toFixed(0)}G` : 'N/A',
            total: totalVram > 0 ? `${(totalVram / 1024).toFixed(0)}G` : null,
            color:
              totalVram <= 0
                ? '#94a3b8'
                : vramPct < 60
                  ? '#4ade80'
                  : vramPct < 80
                    ? '#facc15'
                    : '#ef4444',
            icon: HardDrive,
          },
          {
            label: 'Queue Depth',
            value: queueDepth,
            total: null,
            color: queueDepth < 5 ? '#4ade80' : '#facc15',
            icon: Zap,
          },
          {
            label: 'Avg Latency',
            value: avgLatency > 0 ? `${Math.round(avgLatency)}ms` : '—',
            total: null,
            color: avgLatency === 0 ? '#94a3b8' : avgLatency < 1000 ? '#4ade80' : '#facc15',
            icon: Activity,
          },
        ].map(({ label, value, total, color, icon: Icon }) => (
          <div key={label} className="imperial-card rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3 h-3" style={{ color }} />
              <span className="text-[10px] text-slate-500 tracking-wider uppercase">{label}</span>
            </div>
            <div className="font-mono text-xl font-bold" style={{ color }}>
              {value}
              {total !== null && (
                <span className="text-sm text-slate-600 font-normal">/{total}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="imperial-card rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" style={{ color: '#c9a227' }} />
          <span className="font-display text-xs tracking-[0.12em] font-bold gold-text uppercase">
            GPU Status
          </span>
          {gpu.temperature !== null && (
            <span className="ml-auto font-mono text-[10px] text-slate-500">
              {gpu.temperature}°C
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-slate-400">{gpu.name}</span>
        </div>
        <VramBar usedMb={usedVram} totalMb={totalVram} />
      </div>

      {loadedModels.length === 0 && connected !== false && (
        <div
          className="rounded-lg p-4 flex items-center gap-3"
          style={{
            background: 'rgba(250,204,21,0.04)',
            border: '1px solid rgba(250,204,21,0.15)',
          }}
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <div>
            <div className="text-xs text-yellow-500 font-mono tracking-wider">
              NO MODELS LOADED
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Load a model to begin edge inference. Loaded models consume GPU VRAM.
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4" style={{ color: '#c9a227' }} />
          <span className="font-display text-xs tracking-[0.12em] font-bold gold-text uppercase">
            Model Registry
          </span>
          <span className="ml-auto font-mono text-[10px] text-slate-600">
            {models.length} available
          </span>
        </div>
        {models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            onLoad={handleLoad}
            onUnload={handleUnload}
            actionInProgress={actionInProgress}
          />
        ))}
      </div>

      <div className="imperial-card rounded-lg p-4 space-y-2">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
          Service Configuration
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Endpoint', value: SUBSTRATE_BASE_URL },
            { label: 'Engine', value: health?.engine ?? 'oLLM/Substrate' },
            { label: 'Precision', value: 'fp16/bf16' },
            { label: 'KV Cache', value: 'SSD Offload' },
            { label: 'Status', value: health?.status ?? (connected === false ? 'unreachable' : 'unknown') },
            { label: 'Provider Type', value: 'substrate' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[10px] text-slate-600">{label}</span>
              <span className="font-mono text-[10px] text-slate-400">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
