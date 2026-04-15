import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { m } from "framer-motion";
import {
  Radio, Brain, Zap, Shield, GitBranch, Search, TrendingUp, Activity,
  ChevronRight, RefreshCw, Play, CheckCircle2, XCircle, AlertTriangle,
  Circle, Clock, Cpu, Lock, Unlock, ArrowUpRight,
  Eye, Layers, Server, Globe, Workflow, Sparkles,
  FlaskConical, ChevronDown, Hash, Trash2, PlusCircle, GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const API_BASE = "/api";

type LayerTab = "sense" | "decide" | "act" | "govern" | "search" | "evolve";

const LAYER_CONFIG: Record<LayerTab, { label: string; icon: React.ElementType; color: string; description: string }> = {
  sense: { label: "Sense", icon: Radio, color: "text-sky-400", description: "Signal Bus — unified event stream from all domain agents" },
  decide: { label: "Decide", icon: Brain, color: "text-violet-400", description: "Decision Mesh — agent registry, decision journal, orchestration" },
  act: { label: "Act", icon: Zap, color: "text-amber-400", description: "Pipeline Builder — visual workflow execution and monitoring" },
  govern: { label: "Govern", icon: Shield, color: "text-emerald-400", description: "Governance Console — scope certificates, compliance posture, audit trail" },
  search: { label: "Search", icon: Search, color: "text-rose-400", description: "Federated Search — query across all domain signals, decisions, and artifacts" },
  evolve: { label: "Evolve", icon: Sparkles, color: "text-fuchsia-400", description: "Self-Evolution — agent performance metrics and optimization proposals" },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  low: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  info: "text-muted-foreground bg-muted/20 border-border/30",
};

const DOMAIN_COLORS: Record<string, string> = {
  firestorm: "text-red-400",
  vessels: "text-sky-400",
  terra: "text-green-400",
  lyte: "text-amber-400",
  prism: "text-violet-400",
  alloy: "text-fuchsia-400",
  orchestration: "text-cyan-400",
  pipeline: "text-orange-400",
};

function StatusDot({ status }: { status: string }) {
  const color = status === "healthy" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : status === "operational" ? "bg-emerald-500" : "bg-red-500";
  return (
    <span className={cn("inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse", color)} />
  );
}

function SectionCard({ title, icon: Icon, color, children, className }: {
  title: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <Icon className={cn("w-3.5 h-3.5", color)} />
        <span className="text-xs font-semibold text-foreground">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TimeAgo({ ts }: { ts: string | number | null | undefined }) {
  if (!ts) return <span className="text-muted-foreground/50">—</span>;
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return <span className="text-muted-foreground">{secs}s ago</span>;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return <span className="text-muted-foreground">{mins}m ago</span>;
  const hrs = Math.floor(mins / 60);
  return <span className="text-muted-foreground">{hrs}h ago</span>;
}

function ConfidenceBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground/50 text-[10px]">—</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400";
  return <span className={cn("text-[10px] font-mono font-medium", color)}>{pct}%</span>;
}

// ─── Status Bar ─────────────────────────────────────────────────────────────

function ControlTowerStatusBar() {
  const { data, isLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-status"],
    queryFn: () => fetch(`${API_BASE}/control-tower/status`).then(r => r.json()),
    refetchInterval: 30000,
  });

  const status = data?.data as Record<string, unknown> | undefined;
  const ct = status?.controlTower as Record<string, unknown> | undefined;
  const sense = status?.sense as Record<string, unknown> | undefined;
  const decide = status?.decide as Record<string, unknown> | undefined;
  const govern = status?.govern as Record<string, unknown> | undefined;

  const kpis = [
    { label: "Total Signals", value: sense ? String(sense.totalSignalsPublished ?? 0) : "—", icon: Radio, color: "text-sky-400" },
    { label: "Agents Registered", value: decide ? String(decide.registeredAgents ?? 0) : "—", icon: Cpu, color: "text-violet-400" },
    { label: "Decisions Journaled", value: decide ? String(decide.totalDecisionsJournaled ?? 0) : "—", icon: Brain, color: "text-fuchsia-400" },
    { label: "Compliance Score", value: govern ? `${govern.overallComplianceScore}` : "—", icon: Shield, color: "text-emerald-400" },
    { label: "Audit Entries", value: govern ? String(govern.totalAuditEntries ?? 0) : "—", icon: Lock, color: "text-amber-400" },
  ];

  return (
    <div className="bg-card/80 border border-border rounded-xl px-4 py-3 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-foreground">AI Control Tower</span>
          <span className="text-[10px] text-muted-foreground font-mono bg-muted/30 px-1.5 py-0.5 rounded">
            {ct ? String(ct.status ?? "—") : isLoading ? "loading…" : "—"}
          </span>
        </div>
        <Link href="/command-center" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowUpRight className="w-3 h-3" />
          Command Center
        </Link>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Icon className={cn("w-3 h-3", color)} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
            <p className={cn("text-base font-bold font-mono", color)}>{isLoading ? "…" : value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sense Layer ─────────────────────────────────────────────────────────────

function SenseLayer() {
  const [domainFilter, setDomainFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const { data: signalData, isLoading: signalLoading, refetch } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-signals", domainFilter, severityFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "60" });
      if (domainFilter) params.set("domain", domainFilter);
      if (severityFilter) params.set("severity", severityFilter);
      return fetch(`${API_BASE}/control-tower/sense/signals?${params}`).then(r => r.json());
    },
    refetchInterval: 10000,
  });

  const { data: domainSnapshot } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-domain-snapshot"],
    queryFn: () => fetch(`${API_BASE}/control-tower/sense/domain-snapshot`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const signals = (signalData?.data as Record<string, unknown>)?.events as unknown[] ?? [];
  const snapshot = (signalData?.data as Record<string, unknown>)?.snapshot as Record<string, unknown> | undefined;
  const domainSummary = (snapshot?.domainSummary as Record<string, unknown>[]) ?? [];
  const simSignals = ((domainSnapshot?.data as Record<string, unknown>)?.signals as unknown[]) ?? [];

  const combinedSignals = [...simSignals.slice(0, 20), ...signals.slice(0, 20)].slice(0, 40);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Published", value: snapshot?.totalSignals ?? 0, color: "text-sky-400" },
          { label: "Active Subscribers", value: snapshot?.activeSubscribers ?? 0, color: "text-violet-400" },
          { label: "History Buffer", value: snapshot?.historyWindowSize ?? 0, color: "text-amber-400" },
          { label: "Domain Sources", value: domainSummary.length, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={cn("text-xl font-bold font-mono", color)}>{String(value)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <SectionCard title="Live Signal Feed" icon={Radio} color="text-sky-400">
            <div className="flex items-center gap-2 mb-3">
              <select
                className="text-xs bg-muted/30 border border-border rounded px-2 py-1 text-foreground"
                value={domainFilter}
                onChange={e => setDomainFilter(e.target.value)}
              >
                <option value="">All Domains</option>
                {["firestorm", "vessels", "terra", "lyte", "prism", "alloy", "orchestration"].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                className="text-xs bg-muted/30 border border-border rounded px-2 py-1 text-foreground"
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severity</option>
                {["critical", "high", "medium", "low", "info"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={() => refetch()}
                className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 border border-border rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
              {signalLoading ? (
                <div className="space-y-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-8 bg-muted/20 rounded animate-pulse" />
                  ))}
                </div>
              ) : combinedSignals.length === 0 ? (
                <div className="text-center py-8">
                  <Radio className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No signals in window</p>
                </div>
              ) : (
                combinedSignals.map((sig: unknown, i) => {
                  const s = sig as Record<string, unknown>;
                  const severity = String(s.severity ?? "info");
                  const domain = String(s.domain ?? s.sourceDomain ?? "unknown");
                  const type = String(s.type ?? "unknown");
                  const ts = s.timestamp ?? s.ts;
                  return (
                    <div
                      key={String(s.id ?? i)}
                      className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px]", SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.info)}
                    >
                      <span className={cn("font-mono font-medium shrink-0", DOMAIN_COLORS[domain] ?? "text-muted-foreground")}>{domain}</span>
                      <span className="text-muted-foreground mx-0.5">›</span>
                      <span className="font-medium flex-1 truncate">{s.title ?? type.replace(/_/g, " ")}</span>
                      <span className={cn("shrink-0 px-1 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide border", SEVERITY_COLORS[severity] ?? "")}>
                        {severity}
                      </span>
                      <TimeAgo ts={ts as string} />
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Domain Activity" icon={Activity} color="text-violet-400">
            <div className="space-y-2">
              {domainSummary.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No domain activity yet</p>
              ) : (
                domainSummary.map((d: unknown) => {
                  const dom = d as Record<string, unknown>;
                  const domain = String(dom.domain ?? "unknown");
                  return (
                    <div key={domain} className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-mono w-20 shrink-0", DOMAIN_COLORS[domain] ?? "text-muted-foreground")}>{domain}</span>
                      <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", DOMAIN_COLORS[domain]?.replace("text-", "bg-") ?? "bg-muted")}
                          style={{ width: `${Math.min(100, (Number(dom.count ?? 0) / 50) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{String(dom.count ?? 0)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>

          <SectionCard title="Event Types" icon={Hash} color="text-sky-400">
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {Object.entries((snapshot?.eventsByType as Record<string, number>) ?? {}).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No event data yet</p>
              ) : (
                Object.entries((snapshot?.eventsByType as Record<string, number>) ?? {})
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 12)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground truncate">{type.replace(/_/g, " ")}</span>
                      <span className="text-[10px] font-mono text-foreground">{count}</span>
                    </div>
                  ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─── Decide Layer ─────────────────────────────────────────────────────────────

function DecideLayer() {
  const [orchestrateQuery, setOrchestrateQuery] = useState("");
  const [orchestrateDepth, setOrchestrateDepth] = useState<"shallow" | "standard" | "deep">("standard");
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: agentsData, isLoading: agentsLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-agents"],
    queryFn: () => fetch(`${API_BASE}/control-tower/decide/agents`).then(r => r.json()),
    staleTime: 60000,
  });

  const { data: journalData, isLoading: journalLoading, refetch: refetchJournal } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-journal"],
    queryFn: () => fetch(`${API_BASE}/control-tower/decide/journal?limit=20`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const orchestrateMutation = useMutation({
    mutationFn: (body: { query: string; depth: string }) =>
      fetch(`${API_BASE}/control-tower/decide/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ct-journal"] });
    },
  });

  const agents = ((agentsData?.data as Record<string, unknown>)?.agents as unknown[]) ?? [];
  const healthSummary = (agentsData?.data as Record<string, unknown>)?.healthySummary as Record<string, number> | undefined;
  const journalEntries = ((journalData?.data as Record<string, unknown>)?.entries as unknown[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Healthy Agents", value: healthSummary?.healthy ?? 0, color: "text-emerald-400" },
          { label: "Degraded", value: healthSummary?.degraded ?? 0, color: "text-amber-400" },
          { label: "Decisions Logged", value: (journalData?.data as Record<string, unknown>)?.total ?? 0, color: "text-violet-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={cn("text-xl font-bold font-mono", color)}>{String(value)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Agent Registry" icon={Cpu} color="text-violet-400">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {agentsLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted/20 rounded animate-pulse" />)
            ) : (
              agents.map((agent: unknown) => {
                const a = agent as Record<string, unknown>;
                const health = a.health as Record<string, unknown>;
                const perf = a.performance as Record<string, unknown>;
                return (
                  <div key={String(a.id)} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/10 border border-border/30">
                    <StatusDot status={String(health?.status ?? "unknown")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{String(a.name)}</span>
                        <span className={cn("text-[9px] font-mono px-1 py-0.5 rounded border", DOMAIN_COLORS[String(a.domain)] ?? "text-muted-foreground")}>
                          {String(a.domain)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{String(a.subtitle)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-muted-foreground">Confidence:</span>
                        <ConfidenceBadge value={perf?.avgConfidence as number | null} />
                        <span className="text-[9px] text-muted-foreground">Decisions:</span>
                        <span className="text-[9px] font-mono text-foreground">{String(perf?.totalDecisions ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Orchestrate Query" icon={Brain} color="text-fuchsia-400">
            <div className="space-y-2">
              <textarea
                className="w-full text-xs bg-muted/20 border border-border rounded-lg p-2.5 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/40"
                rows={3}
                placeholder="What cross-domain intelligence do you need?"
                value={orchestrateQuery}
                onChange={e => setOrchestrateQuery(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <select
                  className="text-xs bg-muted/30 border border-border rounded px-2 py-1 text-foreground flex-1"
                  value={orchestrateDepth}
                  onChange={e => setOrchestrateDepth(e.target.value as "shallow" | "standard" | "deep")}
                >
                  <option value="shallow">Shallow</option>
                  <option value="standard">Standard</option>
                  <option value="deep">Deep</option>
                </select>
                <button
                  onClick={() => orchestrateQuery && orchestrateMutation.mutate({ query: orchestrateQuery, depth: orchestrateDepth })}
                  disabled={!orchestrateQuery || orchestrateMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  {orchestrateMutation.isPending ? "Running…" : "Orchestrate"}
                </button>
              </div>
            </div>
            {orchestrateMutation.data && (
              <div className="mt-3 p-2.5 bg-muted/10 border border-border/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-1">Synthesis</p>
                <p className="text-xs text-foreground leading-relaxed line-clamp-4">
                  {((orchestrateMutation.data as Record<string, unknown>)?.data as Record<string, unknown>)?.result
                    ? String((((orchestrateMutation.data as Record<string, unknown>)?.data as Record<string, unknown>)?.result as Record<string, unknown>)?.synthesis ?? "").slice(0, 400)
                    : "Processing…"}
                </p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Decision Journal" icon={GitBranch} color="text-violet-400">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {journalLoading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-muted/20 rounded animate-pulse" />)
          ) : journalEntries.length === 0 ? (
            <div className="text-center py-6">
              <GitBranch className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No decisions journaled yet — run an orchestration to populate</p>
            </div>
          ) : (
            journalEntries.map((entry: unknown) => {
              const e = entry as Record<string, unknown>;
              const id = String(e.id);
              const isExpanded = expandedDecision === id;
              return (
                <div key={id} className="border border-border/40 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/20 transition-colors text-left"
                    onClick={() => setExpandedDecision(isExpanded ? null : id)}
                  >
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase",
                      e.outcome === "accepted" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                      e.outcome === "rejected" ? "text-red-400 border-red-500/30 bg-red-500/10" :
                      "text-muted-foreground border-border/30 bg-muted/10"
                    )}>
                      {String(e.outcome ?? "pending")}
                    </span>
                    <span className={cn("text-[10px] font-mono shrink-0", DOMAIN_COLORS[String(e.domain)] ?? "text-muted-foreground")}>{String(e.domain)}</span>
                    <span className="text-xs text-foreground flex-1 truncate">{String(e.query ?? "").slice(0, 80)}</span>
                    <ConfidenceBadge value={e.confidence as number | null} />
                    <TimeAgo ts={e.timestamp as string} />
                    <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")} />
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2">
                      <div>
                        <p className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">Decision</p>
                        <p className="text-[10px] text-foreground leading-relaxed">{String(e.decision ?? "").slice(0, 400)}</p>
                      </div>
                      {(e.reasoningChain as string[])?.length > 0 && (
                        <div>
                          <p className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">Reasoning Chain</p>
                          <div className="space-y-0.5">
                            {(e.reasoningChain as string[]).slice(0, 3).map((r, i) => (
                              <div key={i} className="flex items-start gap-1">
                                <span className="text-[9px] text-muted-foreground/50 font-mono mt-0.5 shrink-0">{i + 1}.</span>
                                <span className="text-[10px] text-muted-foreground">{r.slice(0, 150)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-mono text-foreground">{String(e.durationMs ?? 0)}ms</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Act Layer ─────────────────────────────────────────────────────────────────

type ComposerStage = { id: string; type: string; name: string };

const STAGE_LIBRARY: { type: string; label: string; color: string; description: string }[] = [
  { type: "ingest",    label: "Ingest",    color: "bg-sky-500/20 text-sky-400 border-sky-500/30",          description: "Pull data from source" },
  { type: "classify",  label: "Classify",  color: "bg-violet-500/20 text-violet-400 border-violet-500/30", description: "Tag and categorise input" },
  { type: "score",     label: "Score",     color: "bg-amber-500/20 text-amber-400 border-amber-500/30",    description: "Risk / relevance scoring" },
  { type: "enrich",    label: "Enrich",    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", description: "Add context from knowledge-base" },
  { type: "recommend", label: "Recommend", color: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30", description: "Generate ranked recommendations" },
  { type: "audit",     label: "Audit",     color: "bg-rose-500/20 text-rose-400 border-rose-500/30",       description: "Compliance & governance check" },
];

const STAGE_COLOR_MAP: Record<string, string> = Object.fromEntries(
  STAGE_LIBRARY.map(s => [s.type, s.color]),
);

function ActLayer() {
  const [mode, setMode] = useState<"templates" | "compose">("templates");
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [pipelineInput, setPipelineInput] = useState("");
  const [pipelineResult, setPipelineResult] = useState<Record<string, unknown> | null>(null);

  // Composer state
  const [composedStages, setComposedStages] = useState<ComposerStage[]>([]);
  const [composerInput, setComposerInput] = useState("");
  const [composerResult, setComposerResult] = useState<Record<string, unknown> | null>(null);
  const dragSrcIdx = useRef<number | null>(null);
  const queryClient = useQueryClient();

  const { data: pipelinesData, isLoading: pipelinesLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-pipelines"],
    queryFn: () => fetch(`${API_BASE}/control-tower/act/pipelines`).then(r => r.json()),
    staleTime: 300000,
  });

  const runMutation = useMutation({
    mutationFn: (body: { pipelineId: string; input: string }) =>
      fetch(`${API_BASE}/control-tower/act/pipelines/${body.pipelineId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: body.input }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      setPipelineResult((data as Record<string, unknown>)?.data as Record<string, unknown>);
      queryClient.invalidateQueries({ queryKey: ["ct-journal"] });
    },
  });

  const composerRunMutation = useMutation({
    mutationFn: (body: { stages: ComposerStage[]; input: string }) =>
      fetch(`${API_BASE}/control-tower/act/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: (data) => {
      setComposerResult((data as Record<string, unknown>)?.data as Record<string, unknown>);
      queryClient.invalidateQueries({ queryKey: ["ct-journal"] });
    },
  });

  const pipelines = ((pipelinesData?.data as Record<string, unknown>)?.pipelines as unknown[]) ?? [];
  const selected = pipelines.find((p: unknown) => (p as Record<string, unknown>).id === selectedPipeline) as Record<string, unknown> | undefined;

  // ── Drag handlers for library → canvas
  const onLibraryDragStart = useCallback((e: React.DragEvent, stageType: string) => {
    e.dataTransfer.setData("library-stage-type", stageType);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const onCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("library-stage-type");
    if (type) {
      const def = STAGE_LIBRARY.find(s => s.type === type);
      if (def) {
        setComposedStages(prev => [
          ...prev,
          { id: `${type}-${Date.now()}`, type, name: def.label },
        ]);
      }
    }
  }, []);

  const onCanvasDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };

  // ── Reorder within canvas via drag
  const onStageDragStart = useCallback((e: React.DragEvent, idx: number) => {
    dragSrcIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onStageDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const srcIdx = dragSrcIdx.current;
    if (srcIdx === null || srcIdx === dropIdx) return;
    setComposedStages(prev => {
      const next = [...prev];
      const [moved] = next.splice(srcIdx, 1);
      next.splice(dropIdx, 0, moved);
      return next;
    });
    dragSrcIdx.current = null;
  }, []);

  const removeStage = useCallback((id: string) => setComposedStages(prev => prev.filter(s => s.id !== id)), []);

  return (
    <div className="space-y-4">
      {/* Mode switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode("templates")}
          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
            mode === "templates"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-muted/10 text-muted-foreground border-border/30 hover:bg-muted/20"
          )}
        >
          <Workflow className="inline w-3 h-3 mr-1.5" />
          Pipeline Templates
        </button>
        <button
          onClick={() => setMode("compose")}
          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
            mode === "compose"
              ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
              : "bg-muted/10 text-muted-foreground border-border/30 hover:bg-muted/20"
          )}
        >
          <PlusCircle className="inline w-3 h-3 mr-1.5" />
          Compose Pipeline
        </button>
      </div>

      {mode === "templates" && (
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title="Pipeline Templates" icon={Workflow} color="text-amber-400">
            <div className="space-y-2">
              {pipelinesLoading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-muted/20 rounded animate-pulse" />)
              ) : (
                pipelines.map((p: unknown) => {
                  const pl = p as Record<string, unknown>;
                  const stages = (pl.stages as unknown[]) ?? [];
                  const isSelected = selectedPipeline === String(pl.id);
                  return (
                    <button
                      key={String(pl.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        isSelected
                          ? "border-primary/40 bg-primary/10"
                          : "border-border/40 bg-muted/10 hover:bg-muted/20"
                      )}
                      onClick={() => setSelectedPipeline(isSelected ? null : String(pl.id))}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", DOMAIN_COLORS[String(pl.domain)] ?? "text-muted-foreground")}>
                          {String(pl.domain)}
                        </span>
                        <span className="text-xs font-semibold text-foreground">{String(pl.name)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2 line-clamp-1">{String(pl.description)}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {stages.map((stage: unknown) => {
                          const s = stage as Record<string, unknown>;
                          return (
                            <span key={String(s.name)} className={cn("text-[9px] px-1.5 py-0.5 rounded border", STAGE_COLOR_MAP[String(s.type)] ?? "")}>
                              {String(s.type)}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </SectionCard>

          <div className="space-y-4">
            {selected && (
              <SectionCard title="Visual Pipeline" icon={Layers} color="text-violet-400">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {(selected.stages as unknown[]).map((stage: unknown, i) => {
                    const s = stage as Record<string, unknown>;
                    const isLast = i === (selected.stages as unknown[]).length - 1;
                    const resultStage = pipelineResult
                      ? ((pipelineResult?.result as Record<string, unknown>)?.stages as unknown[] ?? []).find(
                          (rs: unknown) => (rs as Record<string, unknown>).stageName === String(s.name)
                        ) as Record<string, unknown> | undefined
                      : undefined;
                    const stageStatus = resultStage?.status as string | undefined;
                    return (
                      <div key={String(s.name)} className="flex items-center gap-1.5 shrink-0">
                        <div className={cn("text-center px-2 py-1.5 rounded-lg border min-w-16", STAGE_COLOR_MAP[String(s.type)] ?? "")}>
                          <p className="text-[9px] font-semibold uppercase">{String(s.type)}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5 max-w-16 truncate">{String(s.name)}</p>
                          {stageStatus && (
                            <span className={cn("text-[8px]",
                              stageStatus === "completed" ? "text-emerald-400" :
                              stageStatus === "failed" ? "text-red-400" : "text-amber-400"
                            )}>
                              {stageStatus === "completed" ? "✓" : stageStatus === "failed" ? "✗" : "○"}
                            </span>
                          )}
                        </div>
                        {!isLast && <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            <SectionCard title="Execute Pipeline" icon={Play} color="text-amber-400">
              {!selected ? (
                <p className="text-xs text-muted-foreground text-center py-4">Select a pipeline template to execute</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground font-medium">{String(selected.name)}</p>
                  <textarea
                    className="w-full text-xs bg-muted/20 border border-border rounded-lg p-2.5 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/40"
                    rows={4}
                    placeholder="Paste input data for the pipeline…"
                    value={pipelineInput}
                    onChange={e => setPipelineInput(e.target.value)}
                  />
                  <button
                    onClick={() => selectedPipeline && pipelineInput && runMutation.mutate({ pipelineId: selectedPipeline, input: pipelineInput })}
                    disabled={!pipelineInput || runMutation.isPending}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" />
                    {runMutation.isPending ? "Running pipeline…" : "Execute Pipeline"}
                  </button>
                </div>
              )}

              {pipelineResult && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase",
                      (pipelineResult?.result as Record<string, unknown>)?.status === "completed"
                        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                    )}>
                      {String((pipelineResult?.result as Record<string, unknown>)?.status ?? "unknown")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {String((pipelineResult?.result as Record<string, unknown>)?.totalDurationMs ?? 0)}ms
                    </span>
                  </div>
                  <div className="p-2.5 bg-muted/10 border border-border/50 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {String((pipelineResult?.result as Record<string, unknown>)?.finalOutput ?? "").slice(0, 600)}
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {mode === "compose" && (
        <div className="grid grid-cols-[180px_1fr] gap-4">
          {/* Stage Library */}
          <SectionCard title="Stage Library" icon={Layers} color="text-violet-400">
            <p className="text-[9px] text-muted-foreground mb-2">Drag stages onto the canvas</p>
            <div className="space-y-1.5">
              {STAGE_LIBRARY.map(s => (
                <div
                  key={s.type}
                  draggable
                  onDragStart={e => onLibraryDragStart(e, s.type)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing select-none",
                    s.color
                  )}
                  title={s.description}
                >
                  <GripVertical className="w-2.5 h-2.5 opacity-50" />
                  <span className="text-[10px] font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Composer canvas + run */}
          <div className="space-y-4">
            <SectionCard title="Pipeline Canvas" icon={Workflow} color="text-amber-400">
              <div
                onDrop={onCanvasDrop}
                onDragOver={onCanvasDragOver}
                className={cn(
                  "min-h-20 rounded-lg border-2 border-dashed transition-colors p-3",
                  composedStages.length === 0
                    ? "border-border/30 flex items-center justify-center"
                    : "border-border/20"
                )}
              >
                {composedStages.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/60 text-center select-none">
                    Drop stages here to build a pipeline
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {composedStages.map((stage, i) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-1"
                        draggable
                        onDragStart={e => onStageDragStart(e, i)}
                        onDrop={e => onStageDrop(e, i)}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                      >
                        <div className={cn(
                          "group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing select-none",
                          STAGE_COLOR_MAP[stage.type] ?? ""
                        )}>
                          <GripVertical className="w-2.5 h-2.5 opacity-50" />
                          <span className="text-[10px] font-semibold">{stage.name}</span>
                          <button
                            onPointerDown={e => { e.stopPropagation(); removeStage(stage.id); }}
                            className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-current hover:text-red-400"
                            title="Remove stage"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        {i < composedStages.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {composedStages.length > 0 && (
                <button
                  onClick={() => setComposedStages([])}
                  className="mt-1.5 text-[9px] text-muted-foreground hover:text-rose-400 transition-colors"
                >
                  Clear canvas
                </button>
              )}
            </SectionCard>

            <SectionCard title="Execute Composed Pipeline" icon={Play} color="text-amber-400">
              {composedStages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Build a pipeline on the canvas first</p>
              ) : (
                <div className="space-y-2">
                  <textarea
                    className="w-full text-xs bg-muted/20 border border-border rounded-lg p-2.5 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/40"
                    rows={3}
                    placeholder="Paste input data to run through the composed pipeline…"
                    value={composerInput}
                    onChange={e => setComposerInput(e.target.value)}
                  />
                  <button
                    onClick={() => composerInput && composerRunMutation.mutate({ stages: composedStages, input: composerInput })}
                    disabled={!composerInput || composerRunMutation.isPending}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" />
                    {composerRunMutation.isPending ? "Running composed pipeline…" : `Run ${composedStages.length}-Stage Pipeline`}
                  </button>
                </div>
              )}

              {composerResult && (
                <div className="mt-3 space-y-2">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase",
                    (composerResult as Record<string, unknown>)?.status === "completed"
                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                  )}>
                    {String((composerResult as Record<string, unknown>)?.status ?? "unknown")}
                  </span>
                  <div className="p-2.5 bg-muted/10 border border-border/50 rounded-lg max-h-32 overflow-y-auto mt-1">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {String((composerResult as Record<string, unknown>)?.finalOutput ?? JSON.stringify(composerResult)).slice(0, 600)}
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Govern Layer ─────────────────────────────────────────────────────────────

function GovernLayer() {
  const { data: complianceData, isLoading: complianceLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-compliance"],
    queryFn: () => fetch(`${API_BASE}/control-tower/govern/compliance`).then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: auditData, isLoading: auditLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-audit"],
    queryFn: () => fetch(`${API_BASE}/control-tower/govern/audit?limit=30`).then(r => r.json()),
    refetchInterval: 20000,
  });

  const { data: certsData, isLoading: certsLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-certs"],
    queryFn: () => fetch(`${API_BASE}/control-tower/govern/certificates`).then(r => r.json()),
    staleTime: 300000,
  });

  const compliance = complianceData?.data as Record<string, unknown> | undefined;
  const policies = (compliance?.policies as unknown[]) ?? [];
  const auditEntries = ((auditData?.data as Record<string, unknown>)?.entries as unknown[]) ?? [];
  const integrity = (auditData?.data as Record<string, unknown>)?.integrity as Record<string, unknown> | undefined;
  const certs = ((certsData?.data as Record<string, unknown>)?.certificates as unknown[]) ?? [];

  const score = Number(compliance?.overallComplianceScore ?? 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Compliance Score", value: complianceLoading ? "—" : `${score}`, color: score >= 90 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-red-400" },
          { label: "Risk Posture", value: String(compliance?.riskPosture ?? "—"), color: compliance?.riskPosture === "low" ? "text-emerald-400" : compliance?.riskPosture === "medium" ? "text-amber-400" : "text-red-400" },
          { label: "Audit Chain", value: integrity?.valid ? "✓ Valid" : "⚠ Broken", color: integrity?.valid ? "text-emerald-400" : "text-red-400" },
          { label: "Total Audit Entries", value: String(compliance?.totalAuditEntries ?? 0), color: "text-sky-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={cn("text-base font-bold font-mono", color)}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SectionCard title="Policy Compliance" icon={Shield} color="text-emerald-400">
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {complianceLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted/20 rounded animate-pulse" />)
            ) : (
              policies.map((policy: unknown) => {
                const p = policy as Record<string, unknown>;
                const status = String(p.status ?? "unknown");
                return (
                  <div key={String(p.id)} className="p-2.5 rounded-lg bg-muted/10 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      {status === "compliant" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : status === "violation" ? (
                        <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                      ) : (
                        <Circle className="w-3 h-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-[10px] font-semibold text-foreground truncate">{String(p.name)}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground line-clamp-2 pl-5">{String(p.description)}</p>
                    <div className="flex items-center gap-2 mt-1 pl-5">
                      <span className={cn("text-[9px] px-1 py-0.5 rounded border font-medium",
                        status === "compliant" ? "text-emerald-400 border-emerald-500/30" :
                        status === "violation" ? "text-red-400 border-red-500/30" :
                        "text-muted-foreground border-border/30"
                      )}>
                        {status}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono">{String(p.category)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard title="Scope Certificates" icon={Lock} color="text-amber-400">
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {certsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-muted/20 rounded animate-pulse" />)
            ) : (
              certs.map((cert: unknown) => {
                const c = cert as Record<string, unknown>;
                const certificate = c.certificate as Record<string, unknown>;
                const expiresAt = new Date(String(certificate?.expiresAt ?? ""));
                const isExpired = expiresAt < new Date();
                return (
                  <div key={String(c.agentId)} className="p-2.5 rounded-lg bg-muted/10 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      {isExpired ? <Unlock className="w-3 h-3 text-red-400 shrink-0" /> : <Lock className="w-3 h-3 text-emerald-400 shrink-0" />}
                      <span className="text-[10px] font-semibold text-foreground">{String(c.agentName)}</span>
                      <span className={cn("text-[9px] font-mono px-1 py-0.5 rounded border ml-auto", DOMAIN_COLORS[String(c.domain)] ?? "text-muted-foreground")}>
                        {String(c.domain)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-muted-foreground">Risk:</span>
                      <span className={cn("text-[9px] font-mono", certificate?.maxRiskLevel === "critical" ? "text-red-400" : certificate?.maxRiskLevel === "high" ? "text-orange-400" : "text-emerald-400")}>
                        {String(certificate?.maxRiskLevel ?? "—")}
                      </span>
                      <span className={cn("text-[9px] px-1 py-0.5 rounded border ml-auto", isExpired ? "text-red-400 border-red-500/30" : "text-emerald-400 border-emerald-500/30")}>
                        {isExpired ? "expired" : "active"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard title="Audit Trail" icon={Eye} color="text-violet-400">
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {auditLoading ? (
              Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-7 bg-muted/20 rounded animate-pulse" />)
            ) : auditEntries.length === 0 ? (
              <div className="text-center py-6">
                <Eye className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No audit entries yet</p>
              </div>
            ) : (
              auditEntries.map((entry: unknown, i) => {
                const e = entry as Record<string, unknown>;
                const execResult = String(e.executionResult ?? "unknown");
                return (
                  <div key={String(e.entryId ?? i)} className="flex items-center gap-2 text-[10px] py-1 border-b border-border/20 last:border-0">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                      execResult === "success" ? "bg-emerald-500" :
                      execResult === "failure" ? "bg-red-500" :
                      execResult === "skipped" ? "bg-muted-foreground" :
                      "bg-amber-500"
                    )} />
                    <span className="font-mono text-muted-foreground truncate flex-1">{String(e.agentId ?? "—").slice(0, 20)}</span>
                    <span className="text-foreground truncate max-w-24">{String(e.toolName ?? "—")}</span>
                    <TimeAgo ts={e.timestamp as string} />
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Federated Search ─────────────────────────────────────────────────────────

function SearchLayer() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string[]>([]);

  const { data: searchData, isLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-search", submittedQuery, domainFilter],
    queryFn: () => {
      const params = new URLSearchParams({ q: submittedQuery, limit: "30" });
      if (domainFilter.length > 0) params.set("domains", domainFilter.join(","));
      return fetch(`${API_BASE}/control-tower/search?${params}`).then(r => r.json());
    },
    enabled: !!submittedQuery,
  });

  const results = ((searchData?.data as Record<string, unknown>)?.results as unknown[]) ?? [];
  const domainsSearched = ((searchData?.data as Record<string, unknown>)?.domainsSearched as unknown[]) ?? [];
  const latency = (searchData?.data as Record<string, unknown>)?.searchLatencyMs as number | undefined;

  const DOMAINS = ["firestorm", "vessels", "terra", "lyte", "prism", "alloy"];

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-semibold text-foreground">Federated Enterprise Search</span>
          <span className="text-[10px] text-muted-foreground ml-auto">Queries signals, decisions, and artifacts across all domains</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 text-sm bg-muted/20 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
            placeholder="Search across all domains — threats, vessels, properties, incidents, decisions…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setSubmittedQuery(query)}
          />
          <button
            onClick={() => setSubmittedQuery(query)}
            disabled={!query || isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            {isLoading ? "Searching…" : "Search"}
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground">Filter domains:</span>
          {DOMAINS.map(d => (
            <button
              key={d}
              className={cn(
                "text-[9px] px-2 py-0.5 rounded-full border transition-colors",
                domainFilter.includes(d)
                  ? cn(DOMAIN_COLORS[d], "border-current bg-current/10")
                  : "text-muted-foreground border-border/40 hover:border-muted-foreground"
              )}
              onClick={() => setDomainFilter(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {submittedQuery && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{results.length} results</span>
            {latency !== undefined && <span>in {latency}ms</span>}
            {domainsSearched.map((d: unknown) => {
              const ds = d as Record<string, unknown>;
              return (
                <span key={String(ds.domain)} className={cn("font-mono", DOMAIN_COLORS[String(ds.domain)] ?? "text-muted-foreground")}>
                  {String(ds.domain)}: {String(ds.resultCount)}
                </span>
              );
            })}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted/20 rounded animate-pulse" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No results found for "{submittedQuery}"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((r: unknown, i) => {
                const result = r as Record<string, unknown>;
                return (
                  <div key={String(result.id ?? i)} className="bg-card border border-border rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5", DOMAIN_COLORS[String(result.domain)] ?? "text-muted-foreground")}>
                        {String(result.domain)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground truncate">{String(result.title)}</span>
                          <span className="text-[9px] font-mono text-muted-foreground/50 ml-auto shrink-0">
                            {(Number(result.relevance) * 100).toFixed(0)}% relevance
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{String(result.summary)}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] text-muted-foreground/60 font-mono">{String(result.type)}</span>
                          <TimeAgo ts={result.timestamp as string} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!submittedQuery && (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Search the entire intelligence fabric</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Query signals, decisions, audit trail, and artifacts from Aegis, Vessels, Terra, Lyte, PRISM, and Alloy simultaneously
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Evolve Layer ─────────────────────────────────────────────────────────────

function EvolveLayer() {
  const [proposeAgentId, setProposeAgentId] = useState("");
  const [proposeDescription, setProposeDescription] = useState("");
  const [proposeExpected, setProposeExpected] = useState("");
  const queryClient = useQueryClient();

  const { data: metricsData, isLoading: metricsLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-evolve-metrics"],
    queryFn: () => fetch(`${API_BASE}/control-tower/evolve/metrics`).then(r => r.json()),
    refetchInterval: 30000,
  });

  const proposeMutation = useMutation({
    mutationFn: (body: { agentId: string; description: string; expectedImprovement: string }) =>
      fetch(`${API_BASE}/control-tower/evolve/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => {
      setProposeDescription("");
      setProposeExpected("");
      queryClient.invalidateQueries({ queryKey: ["ct-evolve-metrics"] });
    },
  });

  const agentMetrics = ((metricsData?.data as Record<string, unknown>)?.agentMetrics as unknown[]) ?? [];
  const systemMetrics = (metricsData?.data as Record<string, unknown>)?.systemMetrics as Record<string, unknown> | undefined;
  const providerHealth = ((metricsData?.data as Record<string, unknown>)?.providerHealth as unknown[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Inferences", value: String(systemMetrics?.totalInferences ?? 0), color: "text-fuchsia-400" },
          { label: "Avg Latency", value: `${Math.round(Number(systemMetrics?.avgLatencyMs ?? 0))}ms`, color: "text-sky-400" },
          { label: "Total Decisions", value: String(systemMetrics?.totalDecisions ?? 0), color: "text-violet-400" },
          { label: "Pending Optimizations", value: String(agentMetrics.reduce((s, a) => s + ((a as Record<string, unknown>)?.optimizationProposals as unknown[] ?? []).filter((p: unknown) => (p as Record<string, unknown>).status === "pending").length, 0)), color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={cn("text-lg font-bold font-mono", color)}>{metricsLoading ? "…" : value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Agent Performance" icon={TrendingUp} color="text-fuchsia-400">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {metricsLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted/20 rounded animate-pulse" />)
            ) : (
              agentMetrics.map((agent: unknown) => {
                const a = agent as Record<string, unknown>;
                const metrics = a.metrics as Record<string, unknown>;
                const proposals = (a.optimizationProposals as unknown[]) ?? [];
                const pendingProposals = proposals.filter((p: unknown) => (p as Record<string, unknown>).status === "pending");
                return (
                  <div key={String(a.agentId)} className="p-2.5 rounded-lg bg-muted/10 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-foreground">{String(a.agentName)}</span>
                      <span className={cn("text-[9px] font-mono px-1 py-0.5 rounded border", DOMAIN_COLORS[String(a.domain)] ?? "text-muted-foreground")}>
                        {String(a.domain)}
                      </span>
                      {pendingProposals.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 ml-auto">
                          {pendingProposals.length} proposals
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[9px] text-muted-foreground">Decisions</p>
                        <p className="text-[10px] font-mono text-foreground">{String(metrics?.totalDecisions ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground">Confidence</p>
                        <ConfidenceBadge value={metrics?.avgConfidence as number | null} />
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground">Success</p>
                        <p className="text-[10px] font-mono text-foreground">
                          {metrics?.successRate != null ? `${Math.round(Number(metrics.successRate) * 100)}%` : "—"}
                        </p>
                      </div>
                    </div>
                    {proposals.slice(0, 1).map((prop: unknown) => {
                      const p = prop as Record<string, unknown>;
                      return (
                        <div key={String(p.id)} className="mt-2 p-1.5 bg-amber-500/5 border border-amber-500/20 rounded text-[9px]">
                          <span className="text-amber-400 font-medium">Proposal: </span>
                          <span className="text-muted-foreground">{String(p.description).slice(0, 100)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Provider Health" icon={Server} color="text-sky-400">
            <div className="space-y-2">
              {providerHealth.slice(0, 5).map((p: unknown) => {
                const ph = p as Record<string, unknown>;
                const errorRate = Number(ph.errorRate ?? 0);
                return (
                  <div key={String(ph.provider)} className="flex items-center gap-2">
                    <StatusDot status={errorRate > 0.2 ? "degraded" : "healthy"} />
                    <span className="text-[10px] font-mono text-foreground w-24 shrink-0">{String(ph.provider)}</span>
                    <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, (1 - errorRate) * 100))}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground w-16 text-right">
                      {Math.round(Number(ph.avgLatencyMs ?? 0))}ms
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Propose Optimization" icon={FlaskConical} color="text-amber-400">
            <div className="space-y-2">
              <select
                className="w-full text-xs bg-muted/30 border border-border rounded px-2 py-1.5 text-foreground"
                value={proposeAgentId}
                onChange={e => setProposeAgentId(e.target.value)}
              >
                <option value="">Select agent…</option>
                {agentMetrics.map((a: unknown) => {
                  const ag = a as Record<string, unknown>;
                  return <option key={String(ag.agentId)} value={String(ag.agentId)}>{String(ag.agentName)}</option>;
                })}
              </select>
              <textarea
                className="w-full text-xs bg-muted/20 border border-border rounded-lg p-2 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/40"
                rows={2}
                placeholder="Describe the optimization…"
                value={proposeDescription}
                onChange={e => setProposeDescription(e.target.value)}
              />
              <input
                className="w-full text-xs bg-muted/20 border border-border rounded-lg px-2 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
                placeholder="Expected improvement…"
                value={proposeExpected}
                onChange={e => setProposeExpected(e.target.value)}
              />
              <button
                onClick={() => proposeAgentId && proposeDescription && proposeMutation.mutate({
                  agentId: proposeAgentId,
                  description: proposeDescription,
                  expectedImprovement: proposeExpected,
                })}
                disabled={!proposeAgentId || !proposeDescription || proposeMutation.isPending}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {proposeMutation.isPending ? "Submitting…" : "Submit Proposal"}
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─── Main Control Tower Page ──────────────────────────────────────────────────

export default function ControlTowerPage() {
  const [activeTab, setActiveTab] = useState<LayerTab>("sense");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/command-center" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-xs">Command Center</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">AI Control Tower</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/20 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-sky-400" />
                </div>
                AI Control Tower
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Unified intelligence operating system — Sense → Decide → Act → Govern across the entire agent mesh
              </p>
            </div>
            <Link
              href="/nuro-forge"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Nuro Forge
            </Link>
          </div>
        </div>

        <ControlTowerStatusBar />

        <div className="flex items-center gap-1 mb-6 bg-card border border-border rounded-xl p-1">
          {(Object.entries(LAYER_CONFIG) as [LayerTab, typeof LAYER_CONFIG[LayerTab]][]).map(([tab, config]) => (
            <button
              key={tab}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center",
                activeTab === tab
                  ? cn("bg-muted/60 text-foreground shadow-sm", config.color)
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
              )}
              onClick={() => setActiveTab(tab)}
            >
              <config.icon className={cn("w-3.5 h-3.5", activeTab === tab ? config.color : "")} />
              <span>{config.label}</span>
            </button>
          ))}
        </div>

        <m.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground">{LAYER_CONFIG[activeTab].description}</p>
          </div>

          {activeTab === "sense" && <SenseLayer />}
          {activeTab === "decide" && <DecideLayer />}
          {activeTab === "act" && <ActLayer />}
          {activeTab === "govern" && <GovernLayer />}
          {activeTab === "search" && <SearchLayer />}
          {activeTab === "evolve" && <EvolveLayer />}
        </m.div>
      </div>
    </div>
  );
}
