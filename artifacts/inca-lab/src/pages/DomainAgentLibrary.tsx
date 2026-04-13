import { useState } from "react";
import { cn } from "../lib/utils";
import { Brain, Shield, BarChart3, Server, Compass, ChevronRight, X, Play, Star, Settings, Zap, Globe } from "lucide-react";

function AnchorIcon(props: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
    </svg>
  );
}
function TelescopeIcon(props: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="6" r="1"/><path d="M20.2 8.5 22 5l-5.3-1.8-1.8 3.5"/><path d="m11.2 5.2 6 16.4"/><path d="m3.4 14.2 6.1-3.1a1 1 0 0 0 .4-1.4L8.1 7.5a1 1 0 0 0-1.4-.4L0 10.2"/><path d="m4 14 3.5 6"/>
    </svg>
  );
}
function PaletteIcon(props: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  );
}
function ScaleIcon(props: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
  );
}
function HeartPulseIcon(props: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
    </svg>
  );
}
function UsersIcon(props: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

type Vertical = "Maritime" | "Defense" | "Real Estate" | "Legal" | "Operations" | "Advisory";

interface AgentTemplate {
  id: string;
  name: string;
  vertical: Vertical;
  tagline: string;
  description: string;
  icon: React.ComponentType<{className?:string; style?: React.CSSProperties}>;
  color: string;
  defaultModel: string;
  provider: string;
  tools: string[];
  domainKeywords: string[];
  capabilities: string[];
  benchmarks: { name: string; score: number; unit: string }[];
  configParams: { name: string; type: "text" | "select" | "number" | "toggle"; default: string | number | boolean; options?: string[] }[];
  deployedCount: number;
  rating: number;
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "maritime-intel", name: "Maritime Intelligence Agent", vertical: "Maritime",
    tagline: "Vessel tracking, sanctions screening, AIS anomaly detection",
    description: "Proprietary maritime domain agent trained on SZL's full AIS history, port call patterns, and sanctions watchlists. Detects dark period violations, ownership opacity, and flag state compliance failures in real time.",
    icon: AnchorIcon, color: "#3b82f6",
    defaultModel: "claude-sonnet-4-6", provider: "anthropic",
    tools: ["ais-feed", "vessel-db", "sanctions-api", "port-authority-api", "ownership-graph"],
    domainKeywords: ["vessel", "ship", "fleet", "AIS", "dark period", "sanctions", "IMO", "flag state", "MMSI"],
    capabilities: ["AIS dark period detection", "OFAC/EU sanctions screening", "Ownership opacity analysis", "Port call anomaly detection", "Cargo manifest validation", "Fleet risk scoring"],
    benchmarks: [{ name: "Vessel ID Accuracy", score: 99.2, unit: "%" }, { name: "Sanctions Match Rate", score: 98.7, unit: "%" }, { name: "P50 Latency", score: 142, unit: "ms" }],
    configParams: [
      { name: "Dark period threshold (hours)", type: "number", default: 4 },
      { name: "Risk score threshold", type: "number", default: 0.75 },
      { name: "Sanctions lists", type: "select", default: "OFAC+EU", options: ["OFAC only", "OFAC+EU", "OFAC+EU+UN"] },
      { name: "Enable ownership graph", type: "toggle", default: true },
    ],
    deployedCount: 3, rating: 4.9,
  },
  {
    id: "threat-assessment", name: "Threat Assessment Agent", vertical: "Defense",
    tagline: "Multi-domain threat triage, CVE analysis, incident classification",
    description: "Defense-grade threat intelligence agent combining MITRE ATT&CK framework analysis, CVE/CVSS scoring, and behavioral anomaly detection. Classifies threats, recommends response postures, and escalates to the Consensus Chamber for critical decisions.",
    icon: Shield, color: "#f43f5e",
    defaultModel: "claude-sonnet-4-6", provider: "anthropic",
    tools: ["cve-db", "threat-intel", "mitre-attack", "network-telemetry", "siem-api"],
    domainKeywords: ["threat", "CVE", "breach", "incident", "APT", "MITRE", "TTPs", "lateral movement", "exfiltration"],
    capabilities: ["CVE/CVSS triage", "MITRE ATT&CK mapping", "APT attribution", "Behavioral anomaly detection", "Incident severity classification", "Response playbook generation"],
    benchmarks: [{ name: "Threat Detection Rate", score: 97.4, unit: "%" }, { name: "False Positive Rate", score: 2.1, unit: "%" }, { name: "MTTD", score: 8.3, unit: "min" }],
    configParams: [
      { name: "Severity threshold for escalation", type: "select", default: "HIGH", options: ["CRITICAL", "HIGH", "MEDIUM"] },
      { name: "Enable auto-response", type: "toggle", default: false },
      { name: "MITRE framework version", type: "select", default: "ATT&CK v14", options: ["ATT&CK v13", "ATT&CK v14", "ATT&CK v15"] },
    ],
    deployedCount: 2, rating: 4.8,
  },
  {
    id: "property-valuation", name: "Property Valuation Agent", vertical: "Real Estate",
    tagline: "Commercial property analysis, cap rate modeling, market benchmarking",
    description: "Quantitative real estate intelligence agent combining transactional data, market comps, cap rate analysis, and GIS-enhanced location scoring. Generates investment-grade property reports with risk-adjusted return modeling.",
    icon: Compass, color: "#22d3ee",
    defaultModel: "gemini-3.1-pro-preview", provider: "gemini",
    tools: ["property-db", "market-feed", "gis-api", "zoning-db", "income-model"],
    domainKeywords: ["property", "cap rate", "NOI", "valuation", "commercial", "REIT", "due diligence", "market comps"],
    capabilities: ["Cap rate modeling", "DCF analysis", "Market comp selection", "GIS location scoring", "Zoning risk assessment", "Investment grade reporting"],
    benchmarks: [{ name: "Valuation Accuracy", score: 94.8, unit: "%" }, { name: "Report Generation", score: 2.3, unit: "min" }, { name: "Data Coverage", score: 89, unit: "% markets" }],
    configParams: [
      { name: "Valuation method", type: "select", default: "Income Approach", options: ["Income Approach", "Sales Comparison", "Cost Approach", "Blended"] },
      { name: "Cap rate sensitivity range", type: "text", default: "±50bps" },
      { name: "Include GIS scoring", type: "toggle", default: true },
    ],
    deployedCount: 4, rating: 4.7,
  },
  {
    id: "legal-compliance", name: "Legal Compliance Agent", vertical: "Legal",
    tagline: "Contract review, regulatory compliance, legal risk flagging",
    description: "Specialized legal AI trained on SZL's contract templates, regulatory frameworks (GDPR, MiFID II, AML/KYC), and case law. Reviews contracts for risk exposure, flags non-standard clauses, and generates compliance certificates.",
    icon: ScaleIcon, color: "#a78bfa",
    defaultModel: "claude-sonnet-4-6", provider: "anthropic",
    tools: ["legal-db", "regulatory-api", "contract-store", "case-law-search"],
    domainKeywords: ["contract", "compliance", "GDPR", "AML", "KYC", "regulatory", "liability", "indemnification"],
    capabilities: ["Contract clause extraction", "Risk clause flagging", "Regulatory mapping", "GDPR/AML/KYC compliance", "Legal exposure scoring", "Compliance certificate generation"],
    benchmarks: [{ name: "Clause Recall", score: 98.1, unit: "%" }, { name: "Risk Flag Precision", score: 95.3, unit: "%" }, { name: "Review Time", score: 4.2, unit: "min/doc" }],
    configParams: [
      { name: "Jurisdiction", type: "select", default: "UK/EU", options: ["UK/EU", "US", "UAE", "Singapore", "Multi-jurisdiction"] },
      { name: "Risk sensitivity", type: "select", default: "High", options: ["Standard", "High", "Conservative"] },
      { name: "Enable case law search", type: "toggle", default: true },
    ],
    deployedCount: 2, rating: 4.9,
  },
  {
    id: "ops-health", name: "Operational Health Agent", vertical: "Operations",
    tagline: "Infrastructure monitoring, anomaly detection, SRE support",
    description: "Site reliability intelligence agent that monitors platform health across Azure, Kubernetes, and database layers. Detects capacity anomalies, predicts outages 15+ minutes ahead, and generates incident runbooks.",
    icon: HeartPulseIcon, color: "#10b981",
    defaultModel: "gemini-3-flash-preview", provider: "gemini",
    tools: ["azure-api", "k8s-api", "telemetry-db", "pagerduty-api", "runbook-store"],
    domainKeywords: ["availability", "latency", "SLA", "Kubernetes", "Azure", "alert", "outage", "performance", "capacity"],
    capabilities: ["SLA monitoring", "Anomaly detection", "Capacity forecasting", "Incident runbook generation", "Auto-scaling recommendations", "RCA report generation"],
    benchmarks: [{ name: "Alert Precision", score: 96.7, unit: "%" }, { name: "Prediction Lead Time", score: 18, unit: "min" }, { name: "MTTR Reduction", score: 34, unit: "%" }],
    configParams: [
      { name: "Alert threshold (σ)", type: "number", default: 2.5 },
      { name: "Prediction window", type: "select", default: "15 min", options: ["5 min", "15 min", "30 min", "60 min"] },
      { name: "Enable auto-runbook", type: "toggle", default: true },
    ],
    deployedCount: 6, rating: 4.8,
  },
  {
    id: "client-advisory", name: "Client Advisory Agent", vertical: "Advisory",
    tagline: "Portfolio briefings, investment summaries, client communication",
    description: "Executive-grade advisory agent that synthesizes cross-domain intelligence from Maritime, Real Estate, and Defense verticals into client-ready briefings. Generates investment memos, risk summaries, and board-level reports.",
    icon: UsersIcon, color: "#f59e0b",
    defaultModel: "gpt-5.2", provider: "openai",
    tools: ["content-store", "web-search", "nexus-api", "template-engine", "translation-api"],
    domainKeywords: ["portfolio", "briefing", "investment memo", "client", "advisory", "board", "executive summary"],
    capabilities: ["Investment memo generation", "Risk summary synthesis", "Board presentation creation", "Multi-domain report fusion", "Client-ready formatting", "Translation support"],
    benchmarks: [{ name: "Client Satisfaction", score: 4.8, unit: "/5" }, { name: "Generation Time", score: 3.1, unit: "min" }, { name: "Format Compliance", score: 99.1, unit: "%" }],
    configParams: [
      { name: "Report format", type: "select", default: "Executive Memo", options: ["Executive Memo", "Board Deck", "Risk Digest", "Investment Brief"] },
      { name: "Output language", type: "select", default: "English", options: ["English", "French", "Spanish", "Arabic", "Chinese"] },
      { name: "Include market data", type: "toggle", default: true },
    ],
    deployedCount: 5, rating: 4.7,
  },
];

const VERTICALS: Vertical[] = ["Maritime", "Defense", "Real Estate", "Legal", "Operations", "Advisory"];

const VERTICAL_COLORS: Record<Vertical, string> = {
  Maritime: "#3b82f6",
  Defense: "#f43f5e",
  "Real Estate": "#22d3ee",
  Legal: "#a78bfa",
  Operations: "#10b981",
  Advisory: "#f59e0b",
};

export function DomainAgentLibrary() {
  const [activeVertical, setActiveVertical] = useState<Vertical | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [deployedAgents, setDeployedAgents] = useState<Set<string>>(new Set());
  const [configuring, setConfiguring] = useState<string | null>(null);

  const filtered = activeVertical ? AGENT_TEMPLATES.filter(a => a.vertical === activeVertical) : AGENT_TEMPLATES;
  const selected = AGENT_TEMPLATES.find(a => a.id === selectedAgent);

  function deployAgent(id: string) {
    setDeployedAgents(prev => new Set([...prev, id]));
    setTimeout(() => setDeployedAgents(prev => { const next = new Set(prev); next.delete(id); return next; }), 3000);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Domain Agent Library</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          SZL-proprietary domain agent templates. Browse by vertical, configure parameters, and deploy to the Nuro Mesh.
        </p>
      </div>

      {/* Vertical filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setActiveVertical(null)}
          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", !activeVertical ? "bg-primary/15 text-primary border-primary/25" : "bg-secondary text-muted-foreground border-transparent hover:text-foreground")}
        >
          All Verticals ({AGENT_TEMPLATES.length})
        </button>
        {VERTICALS.map(v => (
          <button
            key={v}
            onClick={() => setActiveVertical(v === activeVertical ? null : v)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", activeVertical === v ? "border" : "bg-secondary text-muted-foreground border-transparent hover:text-foreground")}
            style={activeVertical === v ? { background: `${VERTICAL_COLORS[v]}18`, color: VERTICAL_COLORS[v], borderColor: `${VERTICAL_COLORS[v]}35` } : {}}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agent cards */}
        <div className={cn("space-y-3", selectedAgent ? "lg:col-span-2" : "lg:col-span-3")}>
          <div className={cn("grid gap-3", selectedAgent ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3")}>
            {filtered.map((agent) => {
              const Icon = agent.icon;
              const isDeployed = deployedAgents.has(agent.id);
              const isSelected = selectedAgent === agent.id;
              return (
                <div
                  key={agent.id}
                  className={cn("inca-panel p-4 cursor-pointer transition-all", isSelected && "border-primary/40")}
                  onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}30` }}>
                      <Icon className="w-5 h-5" style={{ color: agent.color }} />
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded border font-medium"
                      style={{ background: `${VERTICAL_COLORS[agent.vertical]}18`, color: VERTICAL_COLORS[agent.vertical], borderColor: `${VERTICAL_COLORS[agent.vertical]}35` }}
                    >
                      {agent.vertical}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm font-medium text-foreground mb-0.5">{agent.name}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{agent.tagline}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {agent.domainKeywords.slice(0, 4).map(kw => (
                      <span key={kw} className="badge-idle px-1.5 py-0 rounded text-xs">{kw}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={cn("w-3 h-3", s <= Math.floor(agent.rating) ? "text-amber-400" : "text-muted-foreground/20")} fill={s <= Math.floor(agent.rating) ? "currentColor" : "none"} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{agent.rating}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{agent.deployedCount} deployed</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground">Default: <span className="font-mono text-foreground">{agent.defaultModel}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:col-span-1">
            <div className="inca-panel-active p-4 sticky top-4 animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Agent Details</div>
                <button onClick={() => setSelectedAgent(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${selected.color}18`, border: `1px solid ${selected.color}30` }}>
                  <selected.icon className="w-5 h-5" style={{ color: selected.color }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{selected.name}</div>
                  <div className="text-xs text-muted-foreground">{selected.vertical}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground leading-relaxed mb-4">{selected.description}</div>

              {/* Benchmarks */}
              <div className="mb-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Benchmarks</div>
                <div className="space-y-2">
                  {selected.benchmarks.map(b => (
                    <div key={b.name} className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{b.name}</div>
                      <div className="text-xs font-mono text-foreground">{b.score}{b.unit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capabilities */}
              <div className="mb-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Capabilities</div>
                <div className="space-y-1">
                  {selected.capabilities.map(cap => (
                    <div key={cap} className="flex items-center gap-1.5 text-xs text-foreground">
                      <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                      {cap}
                    </div>
                  ))}
                </div>
              </div>

              {/* Config */}
              {configuring === selected.id && (
                <div className="mb-4 p-3 bg-secondary rounded-lg animate-fade-in">
                  <div className="text-xs font-medium text-foreground mb-2">Configuration</div>
                  <div className="space-y-2">
                    {selected.configParams.map(p => (
                      <div key={p.name}>
                        <div className="text-xs text-muted-foreground mb-0.5">{p.name}</div>
                        {p.type === "select" ? (
                          <select defaultValue={p.default as string} className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/40">
                            {p.options?.map(o => <option key={o}>{o}</option>)}
                          </select>
                        ) : p.type === "toggle" ? (
                          <div className="flex items-center gap-2">
                            <div className={cn("w-8 h-4 rounded-full transition-colors", p.default ? "bg-primary" : "bg-secondary border border-border")} />
                            <span className="text-xs text-muted-foreground">{p.default ? "Enabled" : "Disabled"}</span>
                          </div>
                        ) : (
                          <input defaultValue={String(p.default)} className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/40" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => deployAgent(selected.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                    deployedAgents.has(selected.id)
                      ? "bg-green-500/10 border border-green-500/25 text-green-400"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {deployedAgents.has(selected.id) ? <><Zap className="w-3.5 h-3.5" /> Deployed!</> : <><Play className="w-3.5 h-3.5" /> Deploy to Mesh</>}
                </button>
                <button
                  onClick={() => setConfiguring(configuring === selected.id ? null : selected.id)}
                  className="px-3 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
