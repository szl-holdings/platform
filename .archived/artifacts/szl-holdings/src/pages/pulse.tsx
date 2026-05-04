/**
 * Pulse — Executive Briefing Intelligence
 *
 * Unified briefing engine with Hugging Face model picker.
 * Users can select which HF model (or provider) generates each briefing section,
 * preview the model card, and pin preferred models for future use.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Zap,
  Cpu,
  ChevronDown,
  RefreshCw,
  Pin,
  PinOff,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  FileText,
  Globe,
  Layers,
  ChevronRight,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

// ─── types ────────────────────────────────────────────────────────────────────

interface HFModel {
  id: string;
  modelId: string;
  pipeline_tag?: string;
  private: boolean;
  downloads?: number;
  likes?: number;
}

interface PinnedModel {
  id: string;
  hfId: string;
  kind: "model";
  name: string;
  pinnedAt: string;
}

interface BriefingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  summary: string;
  status: "ready" | "generating" | "error";
  generatedAt?: string;
  modelUsed?: string;
}

// ─── api helpers ──────────────────────────────────────────────────────────────

async function fetchPinnedModels(): Promise<PinnedModel[]> {
  const res = await apiRequest("GET", "/api/hf/hub/pinned?kind=model");
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: PinnedModel[] };
  return data.items ?? [];
}

async function fetchSuggestedModels(): Promise<HFModel[]> {
  const res = await apiRequest(
    "GET",
    "/api/hf/hub/models?task=text-generation&limit=8&sort=downloads"
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { models?: HFModel[] };
  return data.models ?? [];
}

async function pinModel(modelId: string): Promise<void> {
  await apiRequest("POST", "/api/hf/hub/pinned", {
    kind: "model",
    hfId: modelId,
    name: modelId.split("/").pop() ?? modelId,
  });
}

async function unpinModel(pinnedId: string): Promise<void> {
  await apiRequest("DELETE", `/api/hf/hub/pinned/${pinnedId}`);
}

// ─── seeded briefing sections ─────────────────────────────────────────────────

const BRIEFING_SECTIONS: BriefingSection[] = [
  {
    id: "market-pulse",
    title: "Market Pulse",
    icon: <BarChart3 className="w-4 h-4" />,
    summary:
      "Global equity markets stabilized overnight following Fed commentary on rate path moderation. Portfolio exposure is within tolerance bands across all tracked positions.",
    status: "ready",
    generatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: "deal-watch",
    title: "Deal Watch",
    icon: <FileText className="w-4 h-4" />,
    summary:
      "3 term sheets pending partner review. Meridian Capital LOI executed — due diligence phase begins this week. Portfolio company Arvos raised Series B at $180M valuation.",
    status: "ready",
    generatedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
  {
    id: "geopolitical-signals",
    title: "Geopolitical Signals",
    icon: <Globe className="w-4 h-4" />,
    summary:
      "APAC regulatory environment remains stable for fintech operations. EU AI Act compliance requirements crystallizing — legal team reviewing implications for product roadmap.",
    status: "ready",
    generatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: "portfolio-health",
    title: "Portfolio Health",
    icon: <Layers className="w-4 h-4" />,
    summary:
      "Aggregate portfolio TVPI: 1.84x. 2 companies flagged for board-level attention. SZL-owned positions showing 14% YTD outperformance vs. benchmark.",
    status: "ready",
    generatedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
];

// ─── sub-components ───────────────────────────────────────────────────────────

function ModelPickerDropdown({
  pinnedModels,
  suggestedModels,
  selectedModel,
  onSelect,
  onPin,
  onUnpin,
  loadingPin,
}: {
  pinnedModels: PinnedModel[];
  suggestedModels: HFModel[];
  selectedModel: string | null;
  onSelect: (modelId: string) => void;
  onPin: (modelId: string) => void;
  onUnpin: (pinnedId: string) => void;
  loadingPin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pinnedIds = new Set(pinnedModels.map((m) => m.hfId));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/60 hover:border-slate-600 transition-all"
      >
        <Cpu className="w-3.5 h-3.5 text-yellow-400" />
        <span className="max-w-40 truncate">
          {selectedModel ?? "Select HF model"}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-500 ml-1" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-700/40">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                🤗 Pinned Models
              </div>
              {pinnedModels.length === 0 ? (
                <div className="text-xs text-slate-600 py-1">
                  No pinned models — discover models in NuroForge Hub
                </div>
              ) : (
                <div className="space-y-1">
                  {pinnedModels.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelect(m.hfId);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors group ${
                        selectedModel === m.hfId
                          ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span className="truncate">{m.hfId}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnpin(m.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-400 transition-all"
                      >
                        <PinOff className="w-3 h-3" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Suggested (text-generation)
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {suggestedModels.map((m) => {
                  const hfId = m.modelId ?? m.id;
                  return (
                  <div key={hfId} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelect(hfId);
                        setOpen(false);
                      }}
                      className="flex-1 text-left px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors truncate"
                    >
                      {hfId}
                    </button>
                    <button
                      disabled={pinnedIds.has(hfId) || loadingPin}
                      onClick={() => onPin(hfId)}
                      className="p-1 text-slate-600 hover:text-yellow-400 disabled:opacity-30 transition-colors shrink-0"
                      title="Pin model"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                  </div>
                  );
                })}
                {suggestedModels.length === 0 && (
                  <div className="text-xs text-slate-600 py-1">
                    HF_TOKEN required to load suggestions
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BriefingCard({
  section,
  selectedModel,
  onRegenerate,
  isRegenerating,
}: {
  section: BriefingSection;
  selectedModel: string | null;
  onRegenerate: (sectionId: string) => void;
  isRegenerating: boolean;
}) {
  const minutesAgo = section.generatedAt
    ? Math.floor((Date.now() - new Date(section.generatedAt).getTime()) / 60000)
    : null;

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-700/60 rounded-lg flex items-center justify-center text-slate-300">
            {section.icon}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-200">{section.title}</div>
            {minutesAgo !== null && (
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Clock className="w-2.5 h-2.5" />
                <span>{minutesAgo}m ago</span>
                {section.modelUsed && (
                  <>
                    <span>·</span>
                    <span className="text-yellow-600">{section.modelUsed.split("/").pop()}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {section.status === "ready" && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          )}
          {section.status === "error" && (
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          )}
          <button
            onClick={() => onRegenerate(section.id)}
            disabled={isRegenerating || !selectedModel}
            title={!selectedModel ? "Select a model first" : "Regenerate with selected model"}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 disabled:opacity-30 transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-400 leading-relaxed">{section.summary}</p>

      {selectedModel && (
        <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Cpu className="w-3 h-3 text-yellow-600" />
            <span>
              Will regenerate with{" "}
              <span className="text-yellow-500">{selectedModel.split("/").pop()}</span>
            </span>
          </div>
          <a
            href={`https://huggingface.co/${selectedModel}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-slate-600 hover:text-slate-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function PulsePage() {
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [sections, setSections] = useState<BriefingSection[]>(BRIEFING_SECTIONS);

  const { data: pinnedModels = [] } = useQuery({
    queryKey: ["hf-pinned-models"],
    queryFn: fetchPinnedModels,
    staleTime: 30_000,
  });

  const { data: suggestedModels = [] } = useQuery({
    queryKey: ["hf-suggested-text-models"],
    queryFn: fetchSuggestedModels,
    staleTime: 120_000,
  });

  const pinMutation = useMutation({
    mutationFn: pinModel,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["hf-pinned-models"] }),
  });

  const unpinMutation = useMutation({
    mutationFn: unpinModel,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["hf-pinned-models"] }),
  });

  const handleRegenerate = async (sectionId: string) => {
    if (!selectedModel) return;
    setRegeneratingSection(sectionId);
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, status: "generating" } : s))
    );

    try {
      const section = sections.find((s) => s.id === sectionId);
      const res = await apiRequest("POST", "/api/hf/hub/inference", {
        modelId: selectedModel,
        input: `Write a concise executive briefing for the section "${section?.title}" in the context of SZL Holdings LP operations. 2-3 sentences.`,
        modality: "text",
        maxTokens: 150,
      });

      if (res.ok) {
        const data = (await res.json()) as { primary?: { output?: string } };
        const output = data.primary?.output ?? "";
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  status: "ready",
                  summary: output || s.summary,
                  generatedAt: new Date().toISOString(),
                  modelUsed: selectedModel,
                }
              : s
          )
        );
      } else {
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, status: "error" } : s
          )
        );
      }
    } catch {
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, status: "error" } : s))
      );
    } finally {
      setRegeneratingSection(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-slate-100">
                Pulse — Executive Briefing
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              AI-generated intelligence briefings for leadership. Select a Hugging Face model to
              regenerate any section.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ModelPickerDropdown
              pinnedModels={pinnedModels}
              suggestedModels={suggestedModels}
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
              onPin={pinMutation.mutate}
              onUnpin={unpinMutation.mutate}
              loadingPin={pinMutation.isPending}
            />
          </div>
        </div>

        {/* Model context banner */}
        {selectedModel && (
          <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-6">
            <Cpu className="w-4 h-4 text-yellow-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-yellow-300 font-medium">
                {selectedModel}
              </span>
              <span className="text-sm text-slate-500">
                {" "}
                is selected — click the refresh icon on any section to regenerate with this model
              </span>
            </div>
            <a
              href={`https://huggingface.co/${selectedModel}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-600 hover:text-yellow-400 transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setSelectedModel(null)}
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Briefing sections */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {sections.map((section) => (
            <BriefingCard
              key={section.id}
              section={section}
              selectedModel={selectedModel}
              onRegenerate={handleRegenerate}
              isRegenerating={regeneratingSection === section.id}
            />
          ))}
        </div>

        {/* HF Hub link */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
          <div className="w-7 h-7 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-sm">🤗</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-300 font-medium">
              Explore Hugging Face Hub
            </div>
            <div className="text-xs text-slate-600">
              Discover, pin, and compare models for briefing generation in NuroForge Hub
            </div>
          </div>
          <a
            href="/nuro-forge/hub"
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors shrink-0"
          >
            Open Hub <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
