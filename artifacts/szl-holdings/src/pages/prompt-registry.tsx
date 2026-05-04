import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Brain,
  Tag,
  ChevronDown,
  ChevronRight,
  Plus,
  ExternalLink,
  Link2,
  Unlink,
  CheckCircle2,
  Loader2,
  Search,
  Clock,
  Activity,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

// ─── types ────────────────────────────────────────────────────────────────────

interface PromptVersion {
  versionId: string;
  version: number;
  status: string;
  createdAt: string;
  template: string;
  systemPrompt?: string;
  modelHints?: {
    preferredModel?: string;
    temperature?: number;
    maxTokens?: number;
    hfModel?: string;
  };
}

interface Prompt {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  routeClass?: string;
  tags?: string[];
  versions: PromptVersion[];
  activeVersion?: number;
  createdBy?: string;
}

interface PinnedModel {
  id: string;
  kind: "model";
  hfId: string;
  name: string;
  task?: string;
  downloads?: number;
  likes?: number;
  pinnedAt: string;
}

// ─── api helpers ──────────────────────────────────────────────────────────────

async function fetchPrompts(): Promise<{ prompts: Prompt[] }> {
  const res = await apiRequest("GET", "/api/ai/prompts/with-versions");
  if (!res.ok) throw new Error("Failed to fetch prompts");
  const data = (await res.json()) as { data?: Prompt[] } | Prompt[];
  if (Array.isArray(data)) return { prompts: data };
  const inner = (data as { data?: Prompt[] }).data;
  return { prompts: Array.isArray(inner) ? inner : [] };
}

async function fetchPinnedModels(): Promise<{ items: PinnedModel[] }> {
  const res = await apiRequest("GET", "/api/hf/hub/pinned?kind=model");
  if (!res.ok) return { items: [] };
  return res.json() as Promise<{ items: PinnedModel[] }>;
}

async function attachHFModel(promptId: string, versionId: string, hfModel: string): Promise<void> {
  await apiRequest("PATCH", `/api/ai/prompts/${promptId}/versions/${versionId}/hf-model`, {
    hfModel,
  });
}

// ─── sub-components ───────────────────────────────────────────────────────────

function HFModelBadge({
  hfModel,
  onDetach,
  loading,
}: {
  hfModel: string;
  onDetach: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
      <span className="text-xs text-yellow-400">🤗</span>
      <span className="text-xs text-yellow-300 font-medium truncate max-w-32">{hfModel}</span>
      <button
        onClick={onDetach}
        disabled={loading}
        className="text-yellow-500 hover:text-red-400 transition-colors"
        title="Detach HF model"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Unlink className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}

function AttachModelDropdown({
  pinnedModels,
  onAttach,
  loading,
}: {
  pinnedModels: PinnedModel[];
  onAttach: (hfId: string) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (pinnedModels.length === 0) {
    return (
      <a
        href="/nuro-forge/hub"
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400 transition-colors"
      >
        <Plus className="w-3 h-3" />
        Pin models in HF Hub
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-1.5 px-2 py-1 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/60 rounded-md text-xs text-slate-300 transition-colors"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Link2 className="w-3 h-3 text-yellow-400" />
        )}
        Attach HF model
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-700/60 rounded-lg shadow-xl z-20 overflow-hidden">
          <div className="p-2 text-xs text-slate-400 border-b border-slate-700/40">
            Pinned HF Models
          </div>
          <div className="max-h-48 overflow-y-auto">
            {pinnedModels.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onAttach(m.hfId);
                  setOpen(false);
                }}
                className="w-full flex items-start gap-2 px-3 py-2 hover:bg-slate-700/60 text-left transition-colors"
              >
                <Brain className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-slate-200 truncate font-medium">{m.hfId}</div>
                  {m.task && <div className="text-xs text-slate-500">{m.task}</div>}
                </div>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-slate-700/40">
            <a
              href="/nuro-forge/hub"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
            >
              <ExternalLink className="w-3 h-3" />
              Manage pinned models
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function PromptCard({
  prompt,
  pinnedModels,
}: {
  prompt: Prompt;
  pinnedModels: PinnedModel[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [attachingVersion, setAttachingVersion] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const activeVersion =
    prompt.versions.find((v) => v.version === prompt.activeVersion) ?? prompt.versions[0];

  const attachMutation = useMutation({
    mutationFn: ({ versionId, hfId }: { versionId: string; hfId: string }) =>
      attachHFModel(prompt.id, versionId, hfId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prompt-registry"] });
    },
  });

  const detachMutation = useMutation({
    mutationFn: (versionId: string) => attachHFModel(prompt.id, versionId, ""),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prompt-registry"] });
    },
  });

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-800/60 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-200">{prompt.name}</span>
            {prompt.domain && (
              <span className="px-1.5 py-0.5 bg-slate-700/60 text-slate-400 text-xs rounded">
                {prompt.domain}
              </span>
            )}
            {prompt.routeClass && (
              <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 text-xs rounded">
                {prompt.routeClass}
              </span>
            )}
            {activeVersion?.modelHints?.hfModel && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                <span>🤗</span>
                <span className="truncate max-w-24">{activeVersion.modelHints.hfModel}</span>
              </div>
            )}
          </div>
          {prompt.description && (
            <div className="text-xs text-slate-500 mt-0.5 truncate">{prompt.description}</div>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-600">
              {prompt.versions.length} version{prompt.versions.length !== 1 ? "s" : ""}
            </span>
            {prompt.tags?.map((tag) => (
              <span key={tag} className="text-xs text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${expanded ? "rotate-90" : ""}`}
        />
      </div>

      {expanded && (
        <div className="border-t border-slate-700/40 px-4 pb-4 pt-3 space-y-3">
          {prompt.versions.map((version) => (
            <div
              key={version.version}
              className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-300">v{version.version}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      version.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : version.status === "draft"
                          ? "bg-slate-700/60 text-slate-400"
                          : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {version.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {version.modelHints?.hfModel ? (
                    <HFModelBadge
                      hfModel={version.modelHints.hfModel}
                      loading={detachMutation.isPending && attachingVersion === version.versionId}
                      onDetach={() => {
                        setAttachingVersion(version.versionId);
                        detachMutation.mutate(version.versionId);
                      }}
                    />
                  ) : (
                    <AttachModelDropdown
                      pinnedModels={pinnedModels}
                      loading={attachMutation.isPending && attachingVersion === version.versionId}
                      onAttach={(hfId) => {
                        setAttachingVersion(version.versionId);
                        attachMutation.mutate({ versionId: version.versionId, hfId });
                      }}
                    />
                  )}
                </div>
              </div>

              {version.modelHints?.preferredModel && (
                <div className="text-xs text-slate-500 mb-2">
                  Default model: {version.modelHints.preferredModel}
                </div>
              )}

              <div className="text-xs text-slate-500 font-mono bg-slate-950/60 rounded p-2 truncate">
                {version.template.slice(0, 150)}
                {version.template.length > 150 ? "…" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PromptRegistry() {
  const [search, setSearch] = useState("");

  const { data: promptsData, isLoading: promptsLoading } = useQuery({
    queryKey: ["prompt-registry"],
    queryFn: fetchPrompts,
  });

  const { data: pinnedData } = useQuery({
    queryKey: ["hf-hub-pinned-models"],
    queryFn: fetchPinnedModels,
  });

  const pinnedModels = (pinnedData?.items ?? []) as PinnedModel[];

  const prompts = (promptsData?.prompts ?? []).filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.domain?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  const withHFBinding = prompts.filter((p) =>
    p.versions.some((v) => v.modelHints?.hfModel),
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-7 h-7 text-violet-400" />
              <h1 className="text-2xl font-semibold text-slate-100">Prompt Registry</h1>
            </div>
            <p className="text-sm text-slate-400">
              Versioned prompts with HuggingFace model bindings. Pin a model in HF Hub to attach it
              to any prompt version.
            </p>
          </div>
          <a
            href="/nuro-forge/hub"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400 hover:bg-yellow-500/20 transition-colors"
          >
            <span>🤗</span>
            Manage HF Models
          </a>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: "Total Prompts",
              value: promptsData?.prompts.length ?? "—",
              icon: FileText,
              color: "text-slate-300",
            },
            {
              label: "HF Model Bindings",
              value: withHFBinding,
              icon: Brain,
              color: "text-yellow-400",
            },
            {
              label: "Pinned HF Models",
              value: pinnedModels.length,
              icon: Activity,
              color: "text-violet-400",
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
                <div className={`text-xl font-semibold ${stat.color}`}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* HF notice */}
        {pinnedModels.length === 0 && (
          <div className="mb-5 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-1">
              <Brain className="w-4 h-4" />
              No pinned HF models
            </div>
            <p className="text-xs text-yellow-400/70">
              Visit{" "}
              <a href="/nuro-forge/hub" className="underline hover:text-yellow-300">
                Nuro Forge → HF Hub
              </a>{" "}
              to search and pin models. Pinned models will appear as options to attach to any
              prompt version.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter prompts by name, domain, or tag…"
            className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Prompt list */}
        {promptsLoading && (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading prompts…
          </div>
        )}

        {!promptsLoading && prompts.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <div className="text-sm text-slate-500">
              {search ? "No prompts match your search" : "No prompts registered yet"}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} pinnedModels={pinnedModels} />
          ))}
        </div>
      </div>
    </div>
  );
}
