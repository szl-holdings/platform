import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import { apiFetch } from "../lib/api";
import {
  Store, Search, Star, Zap, Shield, BarChart3, Brain, Anchor, Compass, Server,
  Play, Copy, GitBranch, ChevronRight, Clock, DollarSign, Activity,
  Check, Plus, Eye, Cpu, Award, Package, AlertCircle, Loader2, RefreshCw,
} from "lucide-react";

interface AgentListing {
  id: string;
  name: string;
  domain: string;
  capability: string;
  description: string;
  version: string;
  autonomyLevel: "supervised" | "semi-autonomous" | "autonomous";
  rating: number;
  reviews: number;
  ratingCount: number;
  deploymentCount: number;
  successRate: number;
  avgLatencyMs: number;
  costPerRun: number;
  provider: string;
  model: string;
  tags: string[];
  isSlaCompliant: boolean;
  slaCompliant: boolean;
  isFeatured: boolean;
  featured: boolean;
  capabilities: string[];
  changeLog: string[];
}

const DOMAIN_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Maritime: Anchor, Security: Shield, Legal: BarChart3, "Real Estate": Compass,
  Analytics: Activity, Commerce: Store, Infrastructure: Server, default: Brain,
};

const DOMAIN_COLOR: Record<string, string> = {
  Maritime: "#3b82f6", Security: "#f43f5e", Legal: "#f59e0b", "Real Estate": "#22d3ee",
  Analytics: "#10b981", Commerce: "#ec4899", Infrastructure: "#f97316",
};

const AUTONOMY_BADGE: Record<string, string> = {
  supervised: "bg-amber-500/10 border-amber-500/25 text-amber-400",
  "semi-autonomous": "bg-blue-500/10 border-blue-500/25 text-blue-400",
  autonomous: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn("w-3 h-3", i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-border")} />
      ))}
    </div>
  );
}

function AgentCard({ agent, onDeploy, onClone, onView, isDeployed, isCloned }: {
  agent: AgentListing;
  onDeploy: (id: string) => void;
  onClone: (id: string) => void;
  onView: (agent: AgentListing) => void;
  isDeployed: boolean;
  isCloned: boolean;
}) {
  const Icon = DOMAIN_ICON[agent.domain] || Brain;
  const color = DOMAIN_COLOR[agent.domain] || "#7c3aed";
  const sla = agent.isSlaCompliant || agent.slaCompliant;
  const featured = agent.isFeatured || agent.featured;

  return (
    <div className={cn("inca-panel p-4 flex flex-col gap-3 hover:border-primary/30 transition-all cursor-pointer", featured && "border-primary/20")}>
      {featured && (
        <div className="flex items-center gap-1 text-xs text-primary font-medium">
          <Award className="w-3 h-3" /> Featured
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-foreground">{agent.name}</span>
            <span className="text-xs text-muted-foreground font-mono">v{agent.version}</span>
            {sla && (
              <span className="flex items-center gap-0.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                <Check className="w-2.5 h-2.5" /> SLA
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs px-1.5 py-0.5 rounded border font-medium capitalize", AUTONOMY_BADGE[agent.autonomyLevel])}>
              {agent.autonomyLevel}
            </span>
            <span className="text-xs text-muted-foreground">{agent.domain} · {agent.capability}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{agent.description}</p>

      <div className="flex flex-wrap gap-1">
        {agent.tags.slice(0, 4).map(t => (
          <span key={t} className="text-xs font-mono bg-secondary border border-border rounded px-1.5 py-0.5 text-muted-foreground">{t}</span>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 py-2 border-y border-border/40">
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">{agent.successRate?.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Success</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">{agent.avgLatencyMs}ms</div>
          <div className="text-xs text-muted-foreground">Latency</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">${(agent.costPerRun ?? 0).toFixed(3)}</div>
          <div className="text-xs text-muted-foreground">/run</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">{agent.deploymentCount}</div>
          <div className="text-xs text-muted-foreground">Deploys</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <StarRating rating={agent.rating} />
          <span className="text-xs text-muted-foreground">{agent.rating} ({agent.ratingCount ?? agent.reviews})</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{agent.model}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onDeploy(agent.id)}
          disabled={isDeployed}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            isDeployed
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-default"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isDeployed ? <><Check className="w-3 h-3" /> Deployed</> : <><Play className="w-3 h-3" /> Deploy</>}
        </button>
        <button
          onClick={() => onClone(agent.id)}
          className="px-3 py-1.5 bg-secondary text-muted-foreground hover:text-foreground rounded-lg text-xs transition-colors flex items-center gap-1"
        >
          {isCloned ? <><Check className="w-3 h-3" /> Cloned</> : <><GitBranch className="w-3 h-3" /> Clone</>}
        </button>
        <button
          onClick={() => onView(agent)}
          className="px-3 py-1.5 bg-secondary text-muted-foreground hover:text-foreground rounded-lg text-xs transition-colors flex items-center gap-1"
        >
          <Eye className="w-3 h-3" /> Details
        </button>
      </div>
    </div>
  );
}

function AgentDetailModal({ agent, onClose, onDeploy }: { agent: AgentListing; onClose: () => void; onDeploy: (id: string) => void }) {
  const Icon = DOMAIN_ICON[agent.domain] || Brain;
  const color = DOMAIN_COLOR[agent.domain] || "#7c3aed";
  const [tab, setTab] = useState<"overview" | "history" | "variants">("overview");
  const sla = agent.isSlaCompliant || agent.slaCompliant;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-semibold text-foreground">{agent.name}</div>
            <div className="text-xs text-muted-foreground">{agent.domain} · {agent.capability} · v{agent.version}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {sla && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                <Check className="w-3 h-3" /> SLA Compliant
              </span>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
          </div>
        </div>

        <div className="flex gap-1 px-5 pt-4 border-b border-border">
          {(["overview", "history", "variants"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 text-xs font-medium rounded-t-md capitalize transition-all", tab === t ? "bg-secondary text-foreground border-t border-x border-border" : "text-muted-foreground hover:text-foreground")}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {tab === "overview" && (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">{agent.description}</p>
              {agent.capabilities?.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.map(c => (
                      <span key={c} className="text-xs bg-secondary border border-border rounded px-1.5 py-0.5 text-foreground">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Provider", value: agent.provider },
                  { label: "Model", value: agent.model },
                  { label: "Autonomy", value: agent.autonomyLevel },
                  { label: "Deployments", value: String(agent.deploymentCount) },
                  { label: "Success Rate", value: `${agent.successRate?.toFixed(1)}%` },
                  { label: "Avg Latency", value: `${agent.avgLatencyMs}ms` },
                  { label: "Cost / Run", value: `$${(agent.costPerRun ?? 0).toFixed(3)}` },
                  { label: "Rating", value: `${agent.rating}/5 (${agent.ratingCount ?? agent.reviews} reviews)` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-secondary rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                    <div className="text-sm font-medium text-foreground font-mono">{value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Capability Tags</div>
                <div className="flex flex-wrap gap-1">
                  {agent.tags.map(t => (
                    <span key={t} className="text-xs font-mono bg-secondary border border-border rounded px-1.5 py-0.5 text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
            </>
          )}
          {tab === "history" && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Version History</div>
              {(agent.changeLog?.length ? agent.changeLog : ["No changelog available"]).map((entry, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{entry}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "variants" && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">A/B Variants</div>
              {["Production (Current)", "Canary (5% traffic)", "Shadow (monitoring only)"].map((v, i) => (
                <div key={v} className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
                  <div>
                    <div className="text-sm font-medium text-foreground">{v}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">v{agent.version} · {i === 0 ? "100" : i === 1 ? "5" : "0"}% traffic</div>
                  </div>
                  <button className="text-xs text-primary hover:text-primary/80 transition-colors">Configure</button>
                </div>
              ))}
              <button className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                <Plus className="w-3 h-3" /> Create New Variant
              </button>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border flex gap-3">
          <button
            onClick={() => { onDeploy(agent.id); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Play className="w-4 h-4" /> Deploy to Nuro Mesh
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const DOMAINS = ["All", "Maritime", "Security", "Legal", "Real Estate", "Analytics", "Commerce", "Infrastructure"];
const CAPABILITIES = ["All", "Analysis", "Monitoring", "Generation", "Automation"];
const AUTONOMY_LEVELS = ["All", "supervised", "semi-autonomous", "autonomous"];

export function AgentMarketplace() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [domain, setDomain] = useState("All");
  const [capability, setCapability] = useState("All");
  const [autonomy, setAutonomy] = useState("All");
  const [sortBy, setSortBy] = useState<"rating" | "deployments" | "cost" | "latency">("rating");
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set());
  const [clonedIds, setClonedIds] = useState<Set<string>>(new Set());
  const [selectedAgent, setSelectedAgent] = useState<AgentListing | null>(null);

  const params = new URLSearchParams({ kind: "agent" });
  if (domain !== "All") params.set("domain", domain);
  if (capability !== "All") params.set("category", capability);
  if (searchQuery) params.set("search", searchQuery);

  const listingsQuery = useQuery({
    queryKey: ["marketplace-agents", domain, capability, searchQuery],
    queryFn: () => apiFetch<{ agents: AgentListing[] }>(`/api/marketplace/listings?${params.toString()}`),
    staleTime: 30_000,
  });

  const statsQuery = useQuery({
    queryKey: ["marketplace-stats"],
    queryFn: () => apiFetch<{ totalAgents: number; totalDeployments: number; userDeployments: number }>("/api/marketplace/stats"),
    staleTime: 60_000,
  });

  const deployMutation = useMutation({
    mutationFn: (id: string) => apiFetch<{ deploymentId: string }>(`/api/marketplace/listings/${id}/deploy`, { method: "POST", body: JSON.stringify({}) }),
    onSuccess: (_, id) => {
      setDeployedIds(prev => new Set([...prev, id]));
      qc.invalidateQueries({ queryKey: ["marketplace-stats"] });
      qc.invalidateQueries({ queryKey: ["marketplace-agents"] });
      setTimeout(() => setDeployedIds(prev => { const s = new Set(prev); s.delete(id); return s; }), 3000);
    },
  });

  const agents: AgentListing[] = useMemo(() => {
    const base = listingsQuery.data?.agents ?? [];
    const filtered = base.filter(a => {
      if (autonomy !== "All" && a.autonomyLevel !== autonomy) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "deployments") return b.deploymentCount - a.deploymentCount;
      if (sortBy === "cost") return (a.costPerRun ?? 0) - (b.costPerRun ?? 0);
      return (a.avgLatencyMs ?? 0) - (b.avgLatencyMs ?? 0);
    });
  }, [listingsQuery.data, autonomy, sortBy]);

  function handleClone(id: string) {
    setClonedIds(prev => new Set([...prev, id]));
    setTimeout(() => setClonedIds(prev => { const s = new Set(prev); s.delete(id); return s; }), 2000);
  }

  const stats = statsQuery.data;
  const totalDeployments = stats?.totalDeployments ?? agents.reduce((s, a) => s + (a.deploymentCount ?? 0), 0);
  const avgCost = agents.length ? agents.reduce((s, a) => s + (a.costPerRun ?? 0), 0) / agents.length : 0;
  const slaCount = agents.filter(a => a.isSlaCompliant || a.slaCompliant).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} onDeploy={id => deployMutation.mutate(id)} />
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Agent Marketplace</h1>
          {listingsQuery.isFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Browse, deploy, and clone production-ready AI agents. Live performance metrics from AgentOps telemetry.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-primary">{stats?.totalAgents ?? agents.length}</div>
          <div className="text-xs text-muted-foreground">Agents Available</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-foreground">{totalDeployments}</div>
          <div className="text-xs text-muted-foreground">Total Deployments</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-foreground">${avgCost.toFixed(3)}</div>
          <div className="text-xs text-muted-foreground">Avg Cost/Run</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-emerald-400">{slaCount}</div>
          <div className="text-xs text-muted-foreground">SLA Compliant</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search agents, capabilities, tags..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
          />
        </div>
        <select value={domain} onChange={e => setDomain(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          {DOMAINS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={capability} onChange={e => setCapability(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          {CAPABILITIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={autonomy} onChange={e => setAutonomy(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          {AUTONOMY_LEVELS.map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          <option value="rating">Sort: Rating</option>
          <option value="deployments">Sort: Most Deployed</option>
          <option value="cost">Sort: Lowest Cost</option>
          <option value="latency">Sort: Fastest</option>
        </select>
        <button onClick={() => qc.invalidateQueries({ queryKey: ["marketplace-agents"] })} className="px-3 py-2 bg-secondary border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {deployedIds.size > 0 && (
        <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-sm text-emerald-400 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" /> Agent deployed to Nuro Mesh successfully.
        </div>
      )}
      {clonedIds.size > 0 && (
        <div className="mb-4 px-4 py-3 bg-primary/10 border border-primary/25 rounded-lg text-sm text-primary flex items-center gap-2 animate-fade-in">
          <Copy className="w-4 h-4" /> Agent cloned. Find your copy in Agent Library.
        </div>
      )}

      {listingsQuery.error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-lg text-sm text-red-400">
          Failed to load agents: {(listingsQuery.error as Error).message}
        </div>
      )}

      {listingsQuery.isPending ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="text-xs text-muted-foreground mb-3">{agents.length} agents found</div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDeploy={id => deployMutation.mutate(id)}
                onClone={handleClone}
                onView={setSelectedAgent}
                isDeployed={deployedIds.has(agent.id)}
                isCloned={clonedIds.has(agent.id)}
              />
            ))}
            {agents.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-16 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mb-3" />
                <div className="text-sm">No agents match your filters</div>
                <button onClick={() => { setSearchQuery(""); setDomain("All"); setCapability("All"); setAutonomy("All"); }} className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors">Clear filters</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
