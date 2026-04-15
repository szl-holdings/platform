import { useState } from "react";
import { Globe, AlertTriangle, Search, RefreshCw, Eye, ChevronDown, ChevronUp, Radio, Server, Cloud, Wifi, Lock, TrendingUp, Filter } from "lucide-react";

const RISK_COLOR: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#22c55e", info: "#3b82f6" };

interface Asset {
  id: string;
  name: string;
  type: "domain" | "ip" | "cloud" | "service" | "certificate" | "shadow-it";
  riskLevel: "critical" | "high" | "medium" | "low" | "info";
  score: number;
  exposure: string;
  tags: string[];
  lastSeen: string;
  ports?: string[];
  vulns?: number;
  shadowIt?: boolean;
  org?: string;
  geo?: string;
}

const ASSETS: Asset[] = [
  { id: "A-001", name: "api.szl-prod.com", type: "domain", riskLevel: "critical", score: 94, exposure: "Public", tags: ["API", "OAuth", "No WAF"], lastSeen: "2m ago", ports: ["443", "8443"], vulns: 3, org: "SZL Holdings", geo: "US-East" },
  { id: "A-002", name: "203.0.113.45", type: "ip", riskLevel: "high", score: 78, exposure: "Public", tags: ["Unmanaged", "RDP Open"], lastSeen: "8m ago", ports: ["3389", "22", "80"], vulns: 5, shadowIt: true, org: "Unknown", geo: "US-West" },
  { id: "A-003", name: "dev-legacy.szl-internal.io", type: "domain", riskLevel: "high", score: 71, exposure: "Semi-public", tags: ["Legacy", "HTTP only"], lastSeen: "15m ago", ports: ["80", "8080"], vulns: 7, org: "SZL Holdings", geo: "EU-West" },
  { id: "A-004", name: "s3://szl-backups-2021", type: "cloud", riskLevel: "critical", score: 97, exposure: "Public read", tags: ["Misconfigured", "PII", "No encryption"], lastSeen: "1h ago", vulns: 1, shadowIt: true, org: "AWS", geo: "us-east-1" },
  { id: "A-005", name: "*.szl-staging.net", type: "domain", riskLevel: "medium", score: 52, exposure: "Semi-public", tags: ["Staging", "Self-signed cert"], lastSeen: "30m ago", ports: ["443", "22"], vulns: 2, org: "SZL Holdings", geo: "US-East" },
  { id: "A-006", name: "smtp.szl-corp.com", type: "service", riskLevel: "medium", score: 48, exposure: "Public", tags: ["Email relay", "SPF weak"], lastSeen: "5m ago", ports: ["25", "587"], vulns: 0, org: "SZL Corp", geo: "EU-Central" },
  { id: "A-007", name: "vpn-edge.szl.io (exp 12d)", type: "certificate", riskLevel: "high", score: 76, exposure: "Public", tags: ["Expiring", "TLS 1.1"], lastSeen: "1d ago", vulns: 0, org: "SZL Holdings", geo: "US-East" },
  { id: "A-008", name: "jira.szl-workforce.com", type: "shadow-it", riskLevel: "medium", score: 44, exposure: "Semi-public", tags: ["Unmanaged SaaS", "No SSO"], lastSeen: "6h ago", vulns: 0, shadowIt: true, org: "Unknown SaaS", geo: "Cloud" },
  { id: "A-009", name: "198.51.100.22", type: "ip", riskLevel: "low", score: 21, exposure: "Public", tags: ["CDN edge"], lastSeen: "3m ago", ports: ["80", "443"], vulns: 0, org: "SZL CDN", geo: "US-East" },
  { id: "A-010", name: "grafana.szl-ops.internal", type: "service", riskLevel: "high", score: 68, exposure: "Internet exposed", tags: ["Default creds risk", "No MFA"], lastSeen: "20m ago", ports: ["3000"], vulns: 1, shadowIt: true, org: "SZL Ops", geo: "US-West" },
];

const INTEL_FEEDS = [
  { source: "Shodan", matched: 4, lastUpdate: "5m ago", color: "#f97316" },
  { source: "Censys", matched: 7, lastUpdate: "12m ago", color: "#8b5cf6" },
  { source: "RiskIQ PassiveTotal", matched: 3, lastUpdate: "1h ago", color: "#3b82f6" },
  { source: "VirusTotal", matched: 2, lastUpdate: "30m ago", color: "#ef4444" },
];

const TYPE_ICON: Record<string, typeof Globe> = {
  domain: Globe, ip: Wifi, cloud: Cloud, service: Server, certificate: Lock, "shadow-it": Eye
};

const TYPE_COLOR: Record<string, string> = {
  domain: "#3b82f6", ip: "#06b6d4", cloud: "#8b5cf6", service: "#10b981", certificate: "#f59e0b", "shadow-it": "#ef4444"
};

const METRICS = [
  { label: "Total Assets", value: 10, sub: "Continuously discovered", color: "#3b82f6" },
  { label: "Critical Risk", value: 2, sub: "Immediate action needed", color: "#ef4444" },
  { label: "Shadow IT", value: 4, sub: "Unmanaged / unknown", color: "#f97316" },
  { label: "Avg Risk Score", value: 65, sub: "Out of 100", color: "#f59e0b" },
];

export default function ASMDashboard() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const filtered = ASSETS.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tags.join(" ").toLowerCase().includes(search.toLowerCase())) return false;
    if (riskFilter !== "all" && a.riskLevel !== riskFilter) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Attack Surface Management
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Continuous external asset discovery · risk ranking · shadow IT detection</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <Radio className="w-3 h-3 animate-pulse" /> Live scan active
          </div>
          <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {METRICS.map(m => (
          <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="text-xs text-white/40 mb-1">{m.label}</div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Threat Intel Feed panel */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Intel Feed Matches</div>
          {INTEL_FEEDS.map(f => (
            <div key={f.source} className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-white/80">{f.source}</div>
                <div className="text-[10px] text-white/30">{f.lastUpdate}</div>
              </div>
              <span className="text-sm font-bold" style={{ color: f.color }}>{f.matched}</span>
            </div>
          ))}
          <div className="border-t border-white/[0.05] pt-2 mt-1">
            <div className="text-[9px] text-white/25 uppercase tracking-wider">Asset Type Breakdown</div>
            <div className="mt-2 space-y-1.5">
              {Object.entries({ domain: 3, ip: 2, cloud: 1, service: 2, certificate: 1, "shadow-it": 1 }).map(([type, count]) => {
                const Icon = TYPE_ICON[type] ?? Globe;
                return (
                  <div key={type} className="flex items-center gap-2">
                    <Icon className="w-3 h-3 shrink-0" style={{ color: TYPE_COLOR[type] }} />
                    <span className="text-[10px] capitalize text-white/50 flex-1">{type.replace("-", " ")}</span>
                    <span className="text-[10px] font-mono text-white/40">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Asset table */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search assets, tags..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-white placeholder:text-white/25 outline-none focus:border-blue-500/40"
              />
            </div>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-white/70 outline-none"
            >
              <option value="all">All Risk</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="flex items-center gap-1 text-[10px] text-white/30 px-2">
              <Filter className="w-3 h-3" /> {filtered.length}/{ASSETS.length}
            </div>
          </div>

          <div className="space-y-1.5">
            {filtered.map(asset => {
              const Icon = TYPE_ICON[asset.type] ?? Globe;
              const isExpanded = expandedId === asset.id;
              return (
                <div
                  key={asset.id}
                  className="rounded-xl border overflow-hidden transition-all"
                  style={{ borderColor: isExpanded ? `${RISK_COLOR[asset.riskLevel]}30` : "rgba(255,255,255,0.06)", background: isExpanded ? `${RISK_COLOR[asset.riskLevel]}08` : "rgba(255,255,255,0.025)" }}
                >
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
                    onClick={() => setExpandedId(isExpanded ? null : asset.id)}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${TYPE_COLOR[asset.type]}15` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: TYPE_COLOR[asset.type] }} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-white font-mono">{asset.name}</span>
                        {asset.shadowIt && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 font-semibold uppercase">Shadow IT</span>
                        )}
                        {asset.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-white/40">{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/30">
                        <span className="capitalize">{asset.type.replace("-", " ")}</span>
                        <span>{asset.exposure}</span>
                        <span>{asset.lastSeen}</span>
                        {asset.org && <span>{asset.org}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono" style={{ color: RISK_COLOR[asset.riskLevel] }}>{asset.score}</div>
                        <div className="text-[9px] font-semibold uppercase" style={{ color: RISK_COLOR[asset.riskLevel] }}>{asset.riskLevel}</div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/[0.04] space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {asset.ports && (
                          <div>
                            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Open Ports</div>
                            <div className="flex gap-1 flex-wrap">
                              {asset.ports.map(p => (
                                <span key={p} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {asset.vulns !== undefined && (
                          <div>
                            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Vulnerabilities</div>
                            <div className="text-lg font-bold" style={{ color: asset.vulns > 0 ? RISK_COLOR.high : "#22c55e" }}>{asset.vulns}</div>
                          </div>
                        )}
                        {asset.geo && (
                          <div>
                            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Location</div>
                            <div className="text-xs text-white/60">{asset.geo}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Risk Score</div>
                          <div className="h-1.5 rounded-full bg-white/[0.05] mt-2">
                            <div className="h-full rounded-full" style={{ width: `${asset.score}%`, background: RISK_COLOR[asset.riskLevel] }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded-lg text-[11px] border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />Create Finding
                        </button>
                        <button className="px-3 py-1.5 rounded-lg text-[11px] border border-blue-500/25 text-blue-400 hover:bg-blue-500/10 transition-colors">
                          <Eye className="w-3 h-3 inline mr-1" />Add to Watchlist
                        </button>
                        <button className="px-3 py-1.5 rounded-lg text-[11px] border border-white/10 text-white/50 hover:bg-white/[0.04] transition-colors">
                          <TrendingUp className="w-3 h-3 inline mr-1" />View History
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
