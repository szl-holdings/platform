import { useState } from "react";
import { cn } from "../lib/utils";
import {
  Store, Search, Filter, Star, Zap, Shield, BarChart3, Brain, Anchor, Compass, Server,
  Play, Copy, GitBranch, ChevronRight, TrendingUp, Clock, DollarSign, Activity,
  Check, Plus, Eye, Cpu, Award, Package, AlertCircle
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
  deployments: number;
  successRate: number;
  avgLatency: number;
  costPerRun: number;
  provider: string;
  model: string;
  tags: string[];
  slaCompliant: boolean;
  featured?: boolean;
  changeLog?: string[];
}

const AGENTS: AgentListing[] = [
  {
    id: "sentinel-v4", name: "Sentinel v4", domain: "Security", capability: "Monitoring",
    description: "Advanced threat detection with real-time OFAC screening, CVE correlation, and maker-checker validation. Handles critical escalations with full audit trail.",
    version: "4.1.0", autonomyLevel: "supervised", rating: 4.9, reviews: 142, deployments: 38,
    successRate: 99.1, avgLatency: 890, costPerRun: 0.042, provider: "anthropic", model: "claude-sonnet-4-6",
    tags: ["threat-intel", "OFAC", "maker-checker", "audit"], slaCompliant: true, featured: true,
    changeLog: ["v4.1.0: Enhanced OFAC secondary screening", "v4.0.0: Added maker-checker protocol", "v3.8.0: CVE correlation engine"],
  },
  {
    id: "helmsman-v3", name: "Helmsman v3", domain: "Maritime", capability: "Analysis",
    description: "End-to-end maritime intelligence: AIS dark period detection, vessel ownership resolution, sanctions route analysis, and crew compliance screening.",
    version: "3.2.4", autonomyLevel: "supervised", rating: 4.8, reviews: 87, deployments: 24,
    successRate: 97.3, avgLatency: 1240, costPerRun: 0.071, provider: "anthropic", model: "claude-sonnet-4-6",
    tags: ["AIS", "vessels", "sanctions", "maritime"], slaCompliant: true, featured: true,
    changeLog: ["v3.2.4: Improved AIS gap detection", "v3.2.0: Ownership graph resolution", "v3.0.0: Full rewrite"],
  },
  {
    id: "docminer-v2", name: "DocMiner v2", domain: "Legal", capability: "Analysis",
    description: "High-throughput legal document parsing. Extracts deadlines, obligations, counterparties, and risk flags from contracts, filings, and correspondence.",
    version: "2.5.1", autonomyLevel: "semi-autonomous", rating: 4.7, reviews: 63, deployments: 19,
    successRate: 94.8, avgLatency: 2100, costPerRun: 0.034, provider: "openai", model: "gpt-4o-mini",
    tags: ["contracts", "deadlines", "NLP", "legal"], slaCompliant: true,
    changeLog: ["v2.5.1: Deadline confidence improved", "v2.5.0: New obligation extractor"],
  },
  {
    id: "prospector-v2", name: "Prospector v2", domain: "Real Estate", capability: "Analysis",
    description: "Distressed property identification, automated due diligence scoring, comparable sales analysis, and market risk assessment across target regions.",
    version: "2.1.0", autonomyLevel: "semi-autonomous", rating: 4.6, reviews: 44, deployments: 12,
    successRate: 96.2, avgLatency: 1580, costPerRun: 0.055, provider: "gemini", model: "gemini-1.5-pro",
    tags: ["property", "due-diligence", "market-analysis"], slaCompliant: false,
    changeLog: ["v2.1.0: Comparable sales engine", "v2.0.0: GIS integration"],
  },
  {
    id: "beacon-v3", name: "Beacon v3", domain: "Analytics", capability: "Monitoring",
    description: "Multi-dimensional anomaly detection across KPI streams. 3σ statistical thresholds, trend forecasting, and automated alerting with root-cause suggestions.",
    version: "3.0.1", autonomyLevel: "autonomous", rating: 4.8, reviews: 91, deployments: 31,
    successRate: 98.4, avgLatency: 650, costPerRun: 0.028, provider: "gemini", model: "gemini-1.5-pro",
    tags: ["anomaly", "KPI", "alerting", "telemetry"], slaCompliant: true, featured: true,
    changeLog: ["v3.0.1: Root cause analysis", "v3.0.0: Forecasting engine"],
  },
  {
    id: "muse-v2", name: "Muse v2", domain: "Commerce", capability: "Generation",
    description: "Brand-aligned content generation at scale. Campaign strategy, copywriting variants, SEO-optimized assets, and tone consistency enforcement.",
    version: "2.0.3", autonomyLevel: "semi-autonomous", rating: 4.3, reviews: 28, deployments: 8,
    successRate: 91.4, avgLatency: 2800, costPerRun: 0.065, provider: "openai", model: "gpt-4o",
    tags: ["content", "brand", "copy", "campaign"], slaCompliant: false,
    changeLog: ["v2.0.3: Tone consistency module", "v2.0.0: Brand alignment engine"],
  },
  {
    id: "oracle-v1", name: "Oracle v1", domain: "Analytics", capability: "Analysis",
    description: "72-hour predictive risk forecasting for maritime corridors, sanctions pressure, and geopolitical volatility. Trained on multi-source intelligence feeds.",
    version: "1.4.2", autonomyLevel: "supervised", rating: 4.4, reviews: 19, deployments: 6,
    successRate: 89.7, avgLatency: 3800, costPerRun: 0.12, provider: "openai", model: "gpt-4o",
    tags: ["forecast", "risk", "geopolitical", "maritime"], slaCompliant: false,
    changeLog: ["v1.4.2: 72h horizon support", "v1.4.0: Multi-source fusion"],
  },
  {
    id: "zeus-v3", name: "Zeus v3", domain: "Infrastructure", capability: "Automation",
    description: "Autonomous Azure/Kubernetes operations with intelligent rollback. Handles deployment orchestration, health checks, and infrastructure scaling decisions.",
    version: "3.0.5", autonomyLevel: "supervised", rating: 4.5, reviews: 37, deployments: 15,
    successRate: 96.8, avgLatency: 920, costPerRun: 0.038, provider: "anthropic", model: "claude-sonnet-4-6",
    tags: ["Azure", "Kubernetes", "DevOps", "infrastructure"], slaCompliant: true,
    changeLog: ["v3.0.5: Intelligent rollback", "v3.0.0: k8s operator integration"],
  },
];

const DOMAINS = ["All", "Maritime", "Security", "Legal", "Real Estate", "Analytics", "Commerce", "Infrastructure"];
const CAPABILITIES = ["All", "Analysis", "Monitoring", "Generation", "Automation"];
const AUTONOMY_LEVELS = ["All", "supervised", "semi-autonomous", "autonomous"];

const DOMAIN_ICON: Record<string, React.ComponentType<{className?: string}>> = {
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

function AgentCard({ agent, onDeploy, onClone, onView }: {
  agent: AgentListing;
  onDeploy: (id: string) => void;
  onClone: (id: string) => void;
  onView: (agent: AgentListing) => void;
}) {
  const Icon = DOMAIN_ICON[agent.domain] || Brain;
  const color = DOMAIN_COLOR[agent.domain] || "#7c3aed";

  return (
    <div className={cn("inca-panel p-4 flex flex-col gap-3 hover:border-primary/30 transition-all cursor-pointer", agent.featured && "border-primary/20")}>
      {agent.featured && (
        <div className="flex items-center gap-1 text-xs text-primary font-medium">
          <Award className="w-3 h-3" /> Featured
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-foreground">{agent.name}</span>
            <span className="text-xs text-muted-foreground font-mono">v{agent.version}</span>
            {agent.slaCompliant && (
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
          <div className="text-sm font-mono font-bold text-foreground">{agent.successRate}%</div>
          <div className="text-xs text-muted-foreground">Success</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">{agent.avgLatency}ms</div>
          <div className="text-xs text-muted-foreground">Latency</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">${agent.costPerRun.toFixed(3)}</div>
          <div className="text-xs text-muted-foreground">/run</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">{agent.deployments}</div>
          <div className="text-xs text-muted-foreground">Deploys</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <StarRating rating={agent.rating} />
          <span className="text-xs text-muted-foreground">{agent.rating} ({agent.reviews})</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{agent.model}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onDeploy(agent.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Play className="w-3 h-3" /> Deploy
        </button>
        <button
          onClick={() => onClone(agent.id)}
          className="px-3 py-1.5 bg-secondary text-muted-foreground hover:text-foreground rounded-lg text-xs transition-colors flex items-center gap-1"
        >
          <GitBranch className="w-3 h-3" /> Clone
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <div className="font-display font-semibold text-foreground">{agent.name}</div>
            <div className="text-xs text-muted-foreground">{agent.domain} · {agent.capability} · v{agent.version}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {agent.slaCompliant && (
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
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Provider", value: agent.provider },
                  { label: "Model", value: agent.model },
                  { label: "Autonomy", value: agent.autonomyLevel },
                  { label: "Deployments", value: String(agent.deployments) },
                  { label: "Success Rate", value: `${agent.successRate}%` },
                  { label: "Avg Latency", value: `${agent.avgLatency}ms` },
                  { label: "Cost / Run", value: `$${agent.costPerRun.toFixed(3)}` },
                  { label: "Rating", value: `${agent.rating}/5 (${agent.reviews} reviews)` },
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
              {(agent.changeLog ?? ["No changelog available"]).map((entry, i) => (
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

export function AgentMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [domain, setDomain] = useState("All");
  const [capability, setCapability] = useState("All");
  const [autonomy, setAutonomy] = useState("All");
  const [sortBy, setSortBy] = useState<"rating" | "deployments" | "cost" | "latency">("rating");
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set());
  const [clonedIds, setClonedIds] = useState<Set<string>>(new Set());
  const [selectedAgent, setSelectedAgent] = useState<AgentListing | null>(null);

  const filtered = AGENTS.filter(a => {
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) && !a.description.toLowerCase().includes(searchQuery.toLowerCase()) && !a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    if (domain !== "All" && a.domain !== domain) return false;
    if (capability !== "All" && a.capability !== capability) return false;
    if (autonomy !== "All" && a.autonomyLevel !== autonomy) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "deployments") return b.deployments - a.deployments;
    if (sortBy === "cost") return a.costPerRun - b.costPerRun;
    return a.avgLatency - b.avgLatency;
  });

  function handleDeploy(id: string) {
    setDeployedIds(prev => new Set([...prev, id]));
    setTimeout(() => setDeployedIds(prev => { const s = new Set(prev); s.delete(id); return s; }), 3000);
  }

  function handleClone(id: string) {
    setClonedIds(prev => new Set([...prev, id]));
    setTimeout(() => setClonedIds(prev => { const s = new Set(prev); s.delete(id); return s; }), 2000);
  }

  const totalDeployments = AGENTS.reduce((s, a) => s + a.deployments, 0);
  const avgCost = AGENTS.reduce((s, a) => s + a.costPerRun, 0) / AGENTS.length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} onDeploy={handleDeploy} />
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Agent Marketplace</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Browse, deploy, and clone production-ready AI agents. Live performance metrics from AgentOps telemetry.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-primary">{AGENTS.length}</div>
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
          <div className="text-xl font-display font-bold text-emerald-400">{AGENTS.filter(a => a.slaCompliant).length}</div>
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

      <div className="text-xs text-muted-foreground mb-3">{filtered.length} agents found</div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onDeploy={handleDeploy}
            onClone={handleClone}
            onView={setSelectedAgent}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mb-3" />
            <div className="text-sm">No agents match your filters</div>
            <button onClick={() => { setSearchQuery(""); setDomain("All"); setCapability("All"); setAutonomy("All"); }} className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
