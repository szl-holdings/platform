import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import { api, type CatalogModel } from "../lib/api";
import {
  Shield, CheckCircle, AlertTriangle, XCircle, Star, ExternalLink,
  ChevronDown, ChevronUp, Search, Filter, BookOpen, Cpu, DollarSign,
  Lock, Activity, Check, Play, Clock, Tag, Info, TrendingUp, FileText, Award,
  Loader2
} from "lucide-react";

interface ModelCard extends CatalogModel {
  benchmarks: {
    mmlu?: number;
    humaneval?: number;
    gsm8k?: number;
    hellaswag?: number;
  };
  quantizations: {
    level: string;
    vramGb: number;
    latencyMs: number;
    qualityRetention: number;
    costPer1kTokens: number;
  }[];
}

function toModelCard(m: CatalogModel): ModelCard {
  const benchmarks: ModelCard["benchmarks"] = {};
  if (m.mmlu !== null) benchmarks.mmlu = m.mmlu;
  if (m.humaneval !== null) benchmarks.humaneval = m.humaneval;
  if (m.gsm8k !== null) benchmarks.gsm8k = m.gsm8k;
  if (m.hellaswag !== null) benchmarks.hellaswag = m.hellaswag;
  return { ...m, benchmarks, quantizations: [] };
}

const TASKS = ["All", "text-generation", "multimodal", "code", "embedding", "vision", "audio"];
const PROVIDERS = ["All", "openai", "anthropic", "gemini", "meta", "alibaba", "microsoft"];
const STATUS_OPTIONS = ["All", "approved", "pending", "under-review", "blocked"];

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f97316",
  gemini: "#60a5fa",
  meta: "#a78bfa",
  alibaba: "#f43f5e",
  microsoft: "#22d3ee",
  huggingface: "#fbbf24",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{className?: string}> }> = {
  approved: { label: "Approved", color: "text-emerald-400", icon: CheckCircle },
  pending: { label: "Pending Review", color: "text-amber-400", icon: Clock },
  "under-review": { label: "Under Review", color: "text-blue-400", icon: Activity },
  blocked: { label: "Blocked", color: "text-red-400", icon: XCircle },
};

function SecurityBadge({ score }: { score: number }) {
  const color = score >= 90 ? "#22c55e" : score >= 75 ? "#f59e0b" : "#ef4444";
  const label = score >= 90 ? "Secure" : score >= 75 ? "Caution" : "At Risk";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{score}</span>
      <span className="text-xs text-muted-foreground">· {label}</span>
    </div>
  );
}

function CompliancePill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={cn(
      "px-1.5 py-0.5 rounded text-xs font-medium border",
      ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-secondary border-border text-muted-foreground line-through opacity-50"
    )}>
      {label}
    </span>
  );
}

function ApprovalButton({
  model,
  onApprove,
  isPending,
  policyError,
}: {
  model: ModelCard;
  onApprove: (id: string) => void;
  isPending?: boolean;
  policyError?: string | null;
}) {
  if (isPending) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Checking policies…
      </span>
    );
  }

  if (model.approvalStatus === "approved") {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
        <CheckCircle className="w-3 h-3" /> Approved for Production
      </span>
    );
  }

  if (model.approvalStatus === "blocked") {
    return (
      <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
        <XCircle className="w-3 h-3" /> Blocked by Policy
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => onApprove(model.id)}
        className="flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg hover:bg-primary/15 transition-colors"
      >
        <Play className="w-3 h-3" /> Approve for Production
      </button>
      {policyError && (
        <span className="text-xs text-red-400 max-w-xs text-right">{policyError}</span>
      )}
    </div>
  );
}

function ModelDetailPanel({
  model,
  onClose,
  onApprove,
  approveIsPending,
  approveError,
}: {
  model: ModelCard;
  onClose: () => void;
  onApprove: (id: string) => void;
  approveIsPending?: boolean;
  approveError?: string | null;
}) {
  const [tab, setTab] = useState<"aibom" | "benchmarks" | "quantization" | "compliance">("aibom");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl animate-fade-in overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-border flex-shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${PROVIDER_COLORS[model.provider] || "#888"}18`, border: `1px solid ${PROVIDER_COLORS[model.provider] || "#888"}30` }}>
            <FileText className="w-4 h-4" style={{ color: PROVIDER_COLORS[model.provider] || "#888" }} />
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold text-foreground">{model.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{model.provider} · {model.task} · {model.parameters} params</div>
          </div>
          <ApprovalButton model={model} onApprove={onApprove} isPending={approveIsPending} policyError={approveError} />
          <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>

        <div className="flex gap-1 px-5 pt-4 border-b border-border flex-shrink-0">
          {(["aibom", "benchmarks", "quantization", "compliance"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 text-xs font-medium rounded-t-md capitalize transition-all", tab === t ? "bg-secondary text-foreground border-t border-x border-border" : "text-muted-foreground hover:text-foreground")}>
              {t === "aibom" ? "AIBOM" : t}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto">
          {tab === "aibom" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">AIBOM Hash</div>
                  <div className="text-xs font-mono text-foreground truncate">{model.aibomHash}</div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Last Scanned</div>
                  <div className="text-xs font-mono text-foreground">{model.lastScanned}</div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">License</div>
                  <div className="text-xs text-foreground">{model.license}</div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">License Type</div>
                  <div className={cn("text-xs capitalize font-medium", model.licenseType === "commercial" ? "text-emerald-400" : model.licenseType === "research-only" ? "text-amber-400" : "text-red-400")}>{model.licenseType}</div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Training Cutoff</div>
                  <div className="text-xs font-mono text-foreground">{model.trainingCutoff}</div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Context Window</div>
                  <div className="text-xs font-mono text-foreground">{model.contextWindow.toLocaleString()} tokens</div>
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Provenance Chain</div>
                <div className="text-xs text-foreground leading-relaxed">{model.provenance}</div>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Data Origin</div>
                <div className="text-xs text-foreground leading-relaxed">{model.dataOrigin}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Security Assessment</div>
                <SecurityBadge score={model.securityScore} />
                {model.vulnerabilities > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    {model.vulnerabilities} known {model.vulnerabilities === 1 ? "vulnerability" : "vulnerabilities"} — review required
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "benchmarks" && (
            <div className="space-y-3">
              {Object.entries(model.benchmarks).map(([name, score]) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-muted-foreground uppercase font-medium">{name}</div>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${score}%` }} />
                  </div>
                  <div className="w-12 text-right text-xs font-mono text-foreground">{score}%</div>
                </div>
              ))}
              {Object.keys(model.benchmarks).length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6">No benchmark data available</div>
              )}
              <div className="mt-4 p-3 bg-secondary rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Cost Per 1K Tokens</div>
                <div className="text-sm font-mono text-primary">${model.costPer1kTokens}</div>
              </div>
            </div>
          )}

          {tab === "quantization" && (
            <div className="space-y-2">
              {model.quantizations.length > 0 ? model.quantizations.map((q) => (
                <div key={q.level} className="bg-secondary rounded-lg p-3 grid grid-cols-4 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Level</div>
                    <div className="text-xs font-mono text-primary font-medium">{q.level}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">VRAM</div>
                    <div className="text-xs font-mono text-foreground">{q.vramGb > 0 ? `${q.vramGb}GB` : "API"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Latency</div>
                    <div className="text-xs font-mono text-foreground">{q.latencyMs}ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Quality</div>
                    <div className={cn("text-xs font-mono", q.qualityRetention >= 99 ? "text-emerald-400" : q.qualityRetention >= 96 ? "text-amber-400" : "text-red-400")}>{q.qualityRetention}%</div>
                  </div>
                </div>
              )) : (
                <div className="text-xs text-muted-foreground text-center py-8 bg-secondary rounded-lg">
                  Quantization profiles not available for API-hosted models.
                  <br />Use Local Lab to explore self-hosted quantization options.
                </div>
              )}
            </div>
          )}

          {tab === "compliance" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {Object.entries(model.compliance).map(([key, val]) => (
                  <CompliancePill key={key} label={key.toUpperCase()} ok={val} />
                ))}
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-2">Approval Status</div>
                {(() => {
                  const cfg = STATUS_CONFIG[model.approvalStatus];
                  const Icon = cfg.icon;
                  return (
                    <div className={cn("flex items-center gap-2 text-sm font-medium", cfg.color)}>
                      <Icon className="w-4 h-4" /> {cfg.label}
                    </div>
                  );
                })()}
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Production Status</div>
                <div className={cn("text-xs font-medium", model.inProduction ? "text-emerald-400" : "text-muted-foreground")}>
                  {model.inProduction ? "✓ Active in production" : "Not deployed to production"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModelCatalog() {
  const qc = useQueryClient();
  const [task, setTask] = useState("All");
  const [provider, setProvider] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [expandedQuant, setExpandedQuant] = useState<string | null>(null);
  const [approveErrorMap, setApproveErrorMap] = useState<Record<string, string>>({});

  const catalogQuery = useQuery({
    queryKey: ["inca-model-catalog"],
    queryFn: () => api.getModelCatalog(),
    staleTime: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.approveModel(id, "ops-lead@szl.internal"),
    onSuccess: (_data, id) => {
      setApproveErrorMap(prev => { const n = { ...prev }; delete n[id]; return n; });
      qc.invalidateQueries({ queryKey: ["inca-model-catalog"] });
    },
    onError: (err: Error, id) => {
      let msg = err.message;
      try {
        const parsed = JSON.parse(msg);
        if (parsed.blockedBy?.length) {
          msg = `Policy blocked: ${parsed.blockedBy.map((b: {name: string}) => b.name).join(", ")}`;
        }
      } catch {}
      setApproveErrorMap(prev => ({ ...prev, [id]: msg }));
    },
  });

  const models: ModelCard[] = (catalogQuery.data?.data ?? []).map(toModelCard);
  const selectedModel = selectedModelId ? models.find(m => m.id === selectedModelId) ?? null : null;

  const filtered = models.filter(m => {
    if (task !== "All" && m.task !== task) return false;
    if (provider !== "All" && m.provider !== provider) return false;
    if (statusFilter !== "All" && m.approvalStatus !== statusFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.provider.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const approvedCount = models.filter(m => m.approvalStatus === "approved").length;
  const pendingCount = models.filter(m => m.approvalStatus === "pending" || m.approvalStatus === "under-review").length;
  const blockedCount = models.filter(m => m.approvalStatus === "blocked").length;
  const avgSecurity = models.length > 0 ? Math.round(models.reduce((s, m) => s + m.securityScore, 0) / models.length) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {selectedModel && (
        <ModelDetailPanel
          model={selectedModel}
          onClose={() => setSelectedModelId(null)}
          onApprove={id => approveMutation.mutate(id)}
          approveIsPending={approveMutation.isPending && approveMutation.variables === selectedModel.id}
          approveError={approveErrorMap[selectedModel.id] ?? null}
        />
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Model Catalog</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Governed model registry with AI Bill of Materials (AIBOM). Every model has a security score, license assessment, benchmark suite, and server-enforced production approval.
        </p>
      </div>

      {catalogQuery.isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading model catalog…</span>
        </div>
      )}

      {catalogQuery.isError && (
        <div className="inca-panel p-4 border-red-500/20 text-sm text-red-400 flex items-center gap-2 mb-5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Failed to load model catalog: {catalogQuery.error?.message}
        </div>
      )}

      {!catalogQuery.isLoading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Approved Models</div>
              <div className="text-xl font-display font-bold text-emerald-400">{approvedCount}</div>
              <div className="text-xs text-muted-foreground">cleared for production</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Pending Review</div>
              <div className="text-xl font-display font-bold text-amber-400">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">awaiting governance</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Blocked</div>
              <div className={cn("text-xl font-display font-bold", blockedCount > 0 ? "text-red-400" : "text-foreground")}>{blockedCount}</div>
              <div className="text-xs text-muted-foreground">policy violations</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Fleet Security Score</div>
              <div className={cn("text-xl font-display font-bold", avgSecurity >= 85 ? "text-emerald-400" : avgSecurity >= 70 ? "text-amber-400" : "text-red-400")}>{avgSecurity}</div>
              <div className="text-xs text-muted-foreground">avg across {models.length} models</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search models…"
                className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
            </div>
            <select value={task} onChange={e => setTask(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
              {TASKS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={provider} onChange={e => setProvider(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
              {PROVIDERS.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            {filtered.map((model) => {
              const statusCfg = STATUS_CONFIG[model.approvalStatus];
              const StatusIcon = statusCfg.icon;
              const providerColor = PROVIDER_COLORS[model.provider] || "#888";
              const approveErr = approveErrorMap[model.id];

              return (
                <div key={model.id} className={cn("inca-panel overflow-hidden", model.featured && "border-primary/20")}>
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${providerColor}18`, border: `1px solid ${providerColor}30` }}>
                        <FileText className="w-5 h-5" style={{ color: providerColor }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {model.featured && (
                            <span className="flex items-center gap-0.5 text-xs text-primary"><Award className="w-3 h-3" /> Featured</span>
                          )}
                          <button
                            onClick={() => setSelectedModelId(model.id)}
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {model.name}
                          </button>
                          <span className="text-xs text-muted-foreground capitalize font-mono">{model.provider}</span>
                          <span className="badge-idle px-1.5 py-0.5 rounded text-xs">{model.task}</span>
                          <span className={cn("flex items-center gap-1 text-xs", statusCfg.color)}>
                            <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                          </span>
                          {model.inProduction && (
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Live</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-2">
                          <span>AIBOM: <span className="font-mono text-foreground">{model.aibomHash.slice(7, 17)}…</span></span>
                          <span>Scanned: <span className="text-foreground">{model.lastScanned}</span></span>
                          <span>Context: <span className="font-mono text-foreground">{model.contextWindow.toLocaleString()} tk</span></span>
                          <span>Params: <span className="text-foreground">{model.parameters}</span></span>
                          <span>Cost: <span className="font-mono text-primary">${model.costPer1kTokens}/1k</span></span>
                        </div>

                        <SecurityBadge score={model.securityScore} />

                        {approveErr && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5">
                            <XCircle className="w-3 h-3 flex-shrink-0" />
                            {approveErr}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {Object.entries(model.compliance).filter(([, v]) => v).map(([key]) => (
                            <span key={key} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">{key.toUpperCase()}</span>
                          ))}
                          <span className={cn("text-xs px-1.5 py-0.5 rounded capitalize border", model.licenseType === "commercial" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : model.licenseType === "research-only" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-red-400 bg-red-500/10 border-red-500/20")}>{model.licenseType}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <ApprovalButton
                          model={model}
                          onApprove={id => approveMutation.mutate(id)}
                          isPending={approveMutation.isPending && approveMutation.variables === model.id}
                        />
                        <button
                          onClick={() => setSelectedModelId(model.id)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" /> View AIBOM
                        </button>
                      </div>
                    </div>

                    {model.benchmarks && Object.keys(model.benchmarks).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/40">
                        <div className="flex gap-4 flex-wrap">
                          {Object.entries(model.benchmarks).map(([name, score]) => (
                            <div key={name} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground uppercase">{name}</span>
                              <span className={cn("text-xs font-mono font-semibold", (score ?? 0) >= 90 ? "text-emerald-400" : (score ?? 0) >= 80 ? "text-amber-400" : "text-red-400")}>{score}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && !catalogQuery.isLoading && (
              <div className="inca-panel p-10 text-center">
                <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">No models match the current filters.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
