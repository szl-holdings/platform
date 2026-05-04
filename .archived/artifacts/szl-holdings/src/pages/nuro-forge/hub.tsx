import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Database,
  Layers,
  Play,
  Search,
  Pin,
  PinOff,
  ExternalLink,
  Upload,
  ChevronRight,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SplitSquareHorizontal,
  Image,
  Mic,
  Type,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

// ─── types ────────────────────────────────────────────────────────────────────

type Tab = "models" | "datasets" | "spaces" | "playground";
type Modality = "text" | "image" | "audio";

interface HFModel {
  id: string;
  modelId?: string;
  pipeline_tag?: string;
  downloads?: number;
  likes?: number;
  lastModified?: string;
  tags?: string[];
  description?: string;
}

interface HFDataset {
  id: string;
  downloads?: number;
  likes?: number;
  lastModified?: string;
  tags?: string[];
}

interface HFSpace {
  id: string;
  likes?: number;
  lastModified?: string;
  sdk?: string;
  tags?: string[];
}

interface PinnedItem {
  id: string;
  kind: "model" | "dataset" | "space";
  hfId: string;
  name: string;
  description?: string;
  task?: string;
  downloads?: number;
  likes?: number;
  pinnedAt: string;
}

interface HFStatus {
  tokenPresent: boolean;
  tokenValid: boolean;
  username?: string;
  inferenceReachable: boolean;
  pinnedModels: number;
  pinnedDatasets: number;
  pinnedSpaces: number;
  lastChecked: string;
  status: "healthy" | "degraded" | "auth_error" | "unconfigured";
  message?: string;
}

// ─── api helpers ──────────────────────────────────────────────────────────────

const BASE = "/api/hf/hub";

async function hfGet<T>(path: string): Promise<T> {
  const res = await apiRequest("GET", `${BASE}${path}`);
  if (!res.ok) throw new Error(`HF API error ${res.status}`);
  return res.json() as Promise<T>;
}

async function hfPost<T>(path: string, body: unknown): Promise<T> {
  const res = await apiRequest("POST", `${BASE}${path}`, body);
  if (!res.ok) throw new Error(`HF API error ${res.status}`);
  return res.json() as Promise<T>;
}

async function hfDelete(path: string): Promise<void> {
  await apiRequest("DELETE", `${BASE}${path}`);
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: HFStatus["status"] }) {
  const map = {
    healthy: { color: "text-emerald-400", icon: CheckCircle2, label: "Healthy" },
    degraded: { color: "text-amber-400", icon: AlertCircle, label: "Degraded" },
    auth_error: { color: "text-red-400", icon: AlertCircle, label: "Auth Error" },
    unconfigured: { color: "text-slate-400", icon: AlertCircle, label: "No Token" },
  };
  const cfg = map[status] ?? map.unconfigured;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function PinButton({
  isPinned,
  onClick,
  loading,
}: {
  isPinned: boolean;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={loading}
      className={`p-1.5 rounded-md transition-colors ${
        isPinned
          ? "text-violet-400 bg-violet-500/10 hover:bg-violet-500/20"
          : "text-slate-500 hover:text-violet-400 hover:bg-violet-500/10"
      }`}
      title={isPinned ? "Unpin" : "Pin to registry"}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPinned ? (
        <PinOff className="w-4 h-4" />
      ) : (
        <Pin className="w-4 h-4" />
      )}
    </button>
  );
}

// ─── Models Tab ───────────────────────────────────────────────────────────────

function ModelsTab({
  pinned,
  onPin,
  onUnpin,
  pinningId,
}: {
  pinned: PinnedItem[];
  onPin: (item: Omit<PinnedItem, "id" | "pinnedAt">) => void;
  onUnpin: (id: string) => void;
  pinningId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [task, setTask] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["hf-models", debouncedSearch, task],
    queryFn: () => {
      const params = new URLSearchParams({ search: debouncedSearch, limit: "20" });
      if (task) params.set("task", task);
      return hfGet<{ models: HFModel[] }>(`/models?${params}`);
    },
  });

  const TASKS = [
    "text-generation",
    "text2text-generation",
    "question-answering",
    "summarization",
    "translation",
    "image-classification",
    "image-to-text",
    "automatic-speech-recognition",
    "text-to-image",
    "feature-extraction",
    "text-classification",
    "token-classification",
  ];

  const pinnedIds = new Set(pinned.filter((p) => p.kind === "model").map((p) => p.hfId));

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models…"
            className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <select
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-violet-500/50"
        >
          <option value="">All tasks</option>
          {TASKS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading models…
        </div>
      )}
      {error && (
        <div className="py-8 text-center text-red-400 text-sm">
          Failed to load models. Check HF_TOKEN configuration.
        </div>
      )}
      {data && (
        <div className="space-y-2">
          {data.models.map((m) => {
            const hfId = m.modelId ?? m.id;
            const isPinned = pinnedIds.has(hfId);
            const isLoading = pinningId === hfId;
            return (
              <div
                key={hfId}
                className="flex items-start gap-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-colors"
              >
                <Brain className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200 truncate">{hfId}</span>
                    {m.pipeline_tag && (
                      <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 text-xs rounded">
                        {m.pipeline_tag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {m.downloads != null && (
                      <span className="text-xs text-slate-500">
                        {(m.downloads / 1000).toFixed(0)}k downloads
                      </span>
                    )}
                    {m.likes != null && (
                      <span className="text-xs text-slate-500">{m.likes} likes</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`https://huggingface.co/${hfId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <PinButton
                    isPinned={isPinned}
                    loading={isLoading}
                    onClick={() =>
                      isPinned
                        ? onUnpin(pinned.find((p) => p.hfId === hfId)!.id)
                        : onPin({
                            kind: "model",
                            hfId,
                            name: hfId,
                            task: m.pipeline_tag,
                            downloads: m.downloads,
                            likes: m.likes,
                          })
                    }
                  />
                </div>
              </div>
            );
          })}
          {data.models.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">No models found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Datasets Tab ─────────────────────────────────────────────────────────────

function DatasetsTab({
  pinned,
  onPin,
  onUnpin,
  pinningId,
}: {
  pinned: PinnedItem[];
  onPin: (item: Omit<PinnedItem, "id" | "pinnedAt">) => void;
  onUnpin: (id: string) => void;
  pinningId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["hf-datasets", debouncedSearch],
    queryFn: () =>
      hfGet<{ datasets: HFDataset[] }>(`/datasets?search=${encodeURIComponent(debouncedSearch)}&limit=20`),
  });

  const { data: detail } = useQuery({
    queryKey: ["hf-dataset-detail", selectedDataset],
    queryFn: () =>
      selectedDataset
        ? hfGet<{ dataset: string; preview: { rows?: unknown[] } | null }>(`/datasets/${selectedDataset}`)
        : null,
    enabled: !!selectedDataset,
  });

  const pinnedIds = new Set(pinned.filter((p) => p.kind === "dataset").map((p) => p.hfId));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search datasets…"
          className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading datasets…
        </div>
      )}

      {data && (
        <div className="space-y-2">
          {data.datasets.map((d) => {
            const hfId = d.id;
            const isPinned = pinnedIds.has(hfId);
            return (
              <div
                key={hfId}
                className="flex items-start gap-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-colors cursor-pointer"
                onClick={() => setSelectedDataset(selectedDataset === hfId ? null : hfId)}
              >
                <Database className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200 truncate">{hfId}</span>
                    <ChevronRight
                      className={`w-3 h-3 text-slate-500 transition-transform ${selectedDataset === hfId ? "rotate-90" : ""}`}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {d.downloads != null && (
                      <span className="text-xs text-slate-500">
                        {(d.downloads / 1000).toFixed(0)}k downloads
                      </span>
                    )}
                    {d.likes != null && (
                      <span className="text-xs text-slate-500">{d.likes} likes</span>
                    )}
                  </div>
                  {selectedDataset === hfId && detail?.preview && (
                    <div className="mt-3 overflow-x-auto rounded-md border border-slate-700/60 text-xs">
                      <table className="w-full text-left">
                        <tbody>
                          {(detail.preview.rows as unknown[] ?? []).slice(0, 5).map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-slate-900/40" : ""}>
                              <td className="px-2 py-1 text-slate-400 border-r border-slate-700/40">
                                {i}
                              </td>
                              <td className="px-2 py-1 text-slate-300 truncate max-w-xs">
                                {JSON.stringify(row).slice(0, 120)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`https://huggingface.co/datasets/${hfId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <PinButton
                    isPinned={isPinned}
                    loading={pinningId === hfId}
                    onClick={() =>
                      isPinned
                        ? onUnpin(pinned.find((p) => p.hfId === hfId)!.id)
                        : onPin({
                            kind: "dataset",
                            hfId,
                            name: hfId,
                            downloads: d.downloads,
                            likes: d.likes,
                          })
                    }
                  />
                </div>
              </div>
            );
          })}
          {data.datasets.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">No datasets found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Spaces Tab ───────────────────────────────────────────────────────────────

function SpacesTab({
  pinned,
  onPin,
  onUnpin,
  pinningId,
}: {
  pinned: PinnedItem[];
  onPin: (item: Omit<PinnedItem, "id" | "pinnedAt">) => void;
  onUnpin: (id: string) => void;
  pinningId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [embeddedSpace, setEmbeddedSpace] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["hf-spaces", debouncedSearch],
    queryFn: () =>
      hfGet<{ spaces: HFSpace[] }>(`/spaces?search=${encodeURIComponent(debouncedSearch)}&limit=20`),
  });

  const pinnedSpaces = pinned.filter((p) => p.kind === "space");
  const pinnedIds = new Set(pinnedSpaces.map((p) => p.hfId));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search spaces…"
          className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
        />
      </div>

      {pinnedSpaces.length > 0 && (
        <div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            Pinned Spaces
          </div>
          <div className="grid grid-cols-2 gap-2">
            {pinnedSpaces.map((s) => (
              <button
                key={s.id}
                onClick={() => setEmbeddedSpace(embeddedSpace === s.hfId ? null : s.hfId)}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  embeddedSpace === s.hfId
                    ? "border-violet-500/60 bg-violet-500/10"
                    : "border-slate-700/40 bg-slate-800/40 hover:border-slate-600/60"
                }`}
              >
                <div className="text-xs font-medium text-slate-200 truncate">{s.hfId}</div>
                <div className="text-xs text-slate-500 mt-0.5">Click to embed</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {embeddedSpace && (
        <div className="rounded-xl overflow-hidden border border-violet-500/30 bg-slate-900">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/40">
            <span className="text-xs text-slate-300 font-medium">{embeddedSpace}</span>
            <div className="flex items-center gap-2">
              <a
                href={`https://huggingface.co/spaces/${embeddedSpace}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-400 hover:text-violet-300"
              >
                Open in HF ↗
              </a>
              <button onClick={() => setEmbeddedSpace(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <iframe
            src={`https://huggingface.co/spaces/${embeddedSpace}`}
            title={`HF Space: ${embeddedSpace}`}
            className="w-full h-96"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading spaces…
        </div>
      )}

      {data && (
        <div className="space-y-2">
          {data.spaces.map((s) => {
            const hfId = s.id;
            const isPinned = pinnedIds.has(hfId);
            return (
              <div
                key={hfId}
                className="flex items-start gap-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-colors"
              >
                <Layers className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200 truncate">{hfId}</span>
                    {s.sdk && (
                      <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded">
                        {s.sdk}
                      </span>
                    )}
                  </div>
                  {s.likes != null && (
                    <span className="text-xs text-slate-500">{s.likes} likes</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`https://huggingface.co/spaces/${hfId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <PinButton
                    isPinned={isPinned}
                    loading={pinningId === hfId}
                    onClick={() =>
                      isPinned
                        ? onUnpin(pinned.find((p) => p.hfId === hfId)!.id)
                        : onPin({ kind: "space", hfId, name: hfId, likes: s.likes })
                    }
                  />
                </div>
              </div>
            );
          })}
          {data.spaces.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">No spaces found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inference Playground Tab ─────────────────────────────────────────────────

function PlaygroundTab({ pinned }: { pinned: PinnedItem[] }) {
  const pinnedModels = pinned.filter((p) => p.kind === "model");
  const [modelId, setModelId] = useState(pinnedModels[0]?.hfId ?? "");
  const [compareModelId, setCompareModelId] = useState("");
  const [modality, setModality] = useState<Modality>("text");
  const [textInput, setTextInput] = useState("");
  const [fileInput, setFileInput] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  const { mutate: runInference, isPending, data: result } = useMutation({
    mutationFn: () =>
      hfPost<{
        primary: { output: string; latencyMs: number; error?: string };
        compare: { modelId: string; output: string; latencyMs: number; error?: string } | null;
        modality: Modality;
      }>("/inference", {
        modelId,
        input: modality === "text" ? textInput : fileInput,
        modality,
        maxTokens: 512,
        compareModelId: comparing && compareModelId ? compareModelId : undefined,
      }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFileInput(reader.result as string);
    reader.readAsDataURL(file);
  };

  const canRun = modelId && (modality === "text" ? textInput.trim() : fileInput);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Primary Model</label>
          {pinnedModels.length > 0 ? (
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
            >
              <option value="">Select model…</option>
              {pinnedModels.map((m) => (
                <option key={m.id} value={m.hfId}>
                  {m.hfId}
                </option>
              ))}
            </select>
          ) : (
            <div className="px-3 py-2 bg-slate-800/40 border border-slate-700/40 rounded-lg text-sm text-slate-500">
              No pinned models — pin models from the Models tab
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-400">Compare Model</label>
            <button
              onClick={() => setComparing(!comparing)}
              className={`text-xs flex items-center gap-1 ${comparing ? "text-violet-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              <SplitSquareHorizontal className="w-3 h-3" />
              {comparing ? "Comparing" : "Enable comparison"}
            </button>
          </div>
          {comparing && pinnedModels.length > 0 ? (
            <select
              value={compareModelId}
              onChange={(e) => setCompareModelId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
            >
              <option value="">None</option>
              {pinnedModels
                .filter((m) => m.hfId !== modelId)
                .map((m) => (
                  <option key={m.id} value={m.hfId}>
                    {m.hfId}
                  </option>
                ))}
            </select>
          ) : (
            <div className="px-3 py-2 bg-slate-800/40 border border-slate-700/40 rounded-lg text-sm text-slate-500">
              {comparing ? "Pin more models to compare" : "Toggle comparison above"}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {(["text", "image", "audio"] as Modality[]).map((m) => {
          const icons = { text: Type, image: Image, audio: Mic };
          const Icon = icons[m];
          return (
            <button
              key={m}
              onClick={() => setModality(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                modality === m
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          );
        })}
      </div>

      {modality === "text" && (
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Enter your prompt or text input…"
          rows={4}
          className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none"
        />
      )}

      {(modality === "image" || modality === "audio") && (
        <div className="border-2 border-dashed border-slate-700/60 rounded-lg p-6 text-center">
          <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400 mb-2">
            Upload {modality === "image" ? "an image" : "an audio file"}
          </p>
          <input
            type="file"
            accept={modality === "image" ? "image/*" : "audio/*"}
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="px-3 py-1.5 bg-slate-700/60 text-slate-300 text-xs rounded-md cursor-pointer hover:bg-slate-700"
          >
            Choose file
          </label>
          {fileInput && (
            <p className="mt-2 text-xs text-emerald-400">File loaded ✓</p>
          )}
        </div>
      )}

      <button
        onClick={() => runInference()}
        disabled={isPending || !canRun}
        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        {isPending ? "Running…" : "Run Inference"}
      </button>

      {result && (
        <div className={`grid gap-3 ${comparing && result.compare ? "grid-cols-2" : "grid-cols-1"}`}>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300 truncate">{modelId}</span>
              {result.primary.latencyMs && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {result.primary.latencyMs}ms
                </span>
              )}
            </div>
            {result.primary.error ? (
              <p className="text-sm text-red-400">{result.primary.error}</p>
            ) : (
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{result.primary.output}</p>
            )}
          </div>

          {comparing && result.compare && (
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300 truncate">
                  {result.compare.modelId}
                </span>
                {result.compare.latencyMs && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {result.compare.latencyMs}ms
                  </span>
                )}
              </div>
              {result.compare.error ? (
                <p className="text-sm text-red-400">{result.compare.error}</p>
              ) : (
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{result.compare.output}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HuggingFaceHub() {
  const [activeTab, setActiveTab] = useState<Tab>("models");
  const [pinningId, setPinningId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: statusData } = useQuery({
    queryKey: ["hf-hub-status"],
    queryFn: () => hfGet<HFStatus>("/status"),
    refetchInterval: 60_000,
  });

  const { data: pinnedData, refetch: refetchPinned } = useQuery({
    queryKey: ["hf-hub-pinned"],
    queryFn: () => hfGet<{ items: PinnedItem[] }>("/pinned"),
  });

  const pinned = pinnedData?.items ?? [];

  const pinMutation = useMutation({
    mutationFn: (item: Omit<PinnedItem, "id" | "pinnedAt">) =>
      hfPost<{ item: PinnedItem }>("/pinned", item),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hf-hub-pinned"] });
      void queryClient.invalidateQueries({ queryKey: ["hf-hub-status"] });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: (id: string) => hfDelete(`/pinned/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hf-hub-pinned"] });
      void queryClient.invalidateQueries({ queryKey: ["hf-hub-status"] });
    },
  });

  const handlePin = useCallback(
    async (item: Omit<PinnedItem, "id" | "pinnedAt">) => {
      setPinningId(item.hfId);
      try {
        await pinMutation.mutateAsync(item);
      } finally {
        setPinningId(null);
      }
    },
    [pinMutation],
  );

  const handleUnpin = useCallback(
    async (id: string) => {
      const item = pinned.find((p) => p.id === id);
      if (item) setPinningId(item.hfId);
      try {
        await unpinMutation.mutateAsync(id);
      } finally {
        setPinningId(null);
      }
    },
    [unpinMutation, pinned],
  );

  const TABS: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "models", label: "Models", icon: Brain, count: statusData?.pinnedModels },
    { id: "datasets", label: "Datasets", icon: Database, count: statusData?.pinnedDatasets },
    { id: "spaces", label: "Spaces", icon: Layers, count: statusData?.pinnedSpaces },
    { id: "playground", label: "Inference Playground", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="text-yellow-400 text-sm font-bold">🤗</span>
              </div>
              <h1 className="text-2xl font-semibold text-slate-100">Hugging Face Hub</h1>
              {statusData && <StatusBadge status={statusData.status} />}
            </div>
            <p className="text-sm text-slate-400">
              Discover, pin, and run models, datasets, and spaces — all HF traffic through one
              unified surface.
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            {statusData?.username && (
              <div className="text-slate-300 font-medium">@{statusData.username}</div>
            )}
            {statusData?.lastChecked && (
              <div>Last synced {new Date(statusData.lastChecked).toLocaleTimeString()}</div>
            )}
          </div>
        </div>

        {/* Stats strip */}
        {statusData && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Pinned Models", value: statusData.pinnedModels, icon: Brain, color: "text-violet-400" },
              { label: "Pinned Datasets", value: statusData.pinnedDatasets, icon: Database, color: "text-blue-400" },
              { label: "Pinned Spaces", value: statusData.pinnedSpaces, icon: Layers, color: "text-orange-400" },
              {
                label: "Inference API",
                value: statusData.inferenceReachable ? "Online" : "Offline",
                icon: Activity,
                color: statusData.inferenceReachable ? "text-emerald-400" : "text-red-400",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-xs text-slate-400">{stat.label}</span>
                  </div>
                  <div className={`text-lg font-semibold ${stat.color}`}>{stat.value}</div>
                </div>
              );
            })}
          </div>
        )}

        {statusData?.status === "unconfigured" && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-1">
              <AlertCircle className="w-4 h-4" />
              HF_TOKEN not configured
            </div>
            <p className="text-xs text-amber-400/70">
              {statusData.message}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-700/60 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-6">
          {activeTab === "models" && (
            <ModelsTab
              pinned={pinned}
              onPin={handlePin}
              onUnpin={handleUnpin}
              pinningId={pinningId}
            />
          )}
          {activeTab === "datasets" && (
            <DatasetsTab
              pinned={pinned}
              onPin={handlePin}
              onUnpin={handleUnpin}
              pinningId={pinningId}
            />
          )}
          {activeTab === "spaces" && (
            <SpacesTab
              pinned={pinned}
              onPin={handlePin}
              onUnpin={handleUnpin}
              pinningId={pinningId}
            />
          )}
          {activeTab === "playground" && <PlaygroundTab pinned={pinned} />}
        </div>
      </div>
    </div>
  );
}
