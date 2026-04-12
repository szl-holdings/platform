import { useState } from "react";
import {
  Search, Network, Globe, Server, Users, Database, Hash,
  Link2, Brain, ChevronRight, Plus, X, AlertTriangle,
  Target, Activity, Eye, Shield, TrendingUp, Clock,
  Zap, MapPin, Monitor, Lock
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BG = "#070A10";
const CARD = "#0c1220";
const BORDER = "#1a2235";

type IndicatorType = "ip" | "domain" | "hash" | "user" | "process" | "registry" | "email" | "url";

interface Indicator {
  id: string;
  type: IndicatorType;
  value: string;
  severity: "critical" | "high" | "medium" | "low" | "unknown";
  confidence: number;
  firstSeen: string;
  lastSeen: string;
  tags: string[];
  associations: string[];
  context: string;
}

interface HypothesisChain {
  id: string;
  title: string;
  indicators: string[];
  status: "investigating" | "confirmed" | "ruled-out";
  confidence: number;
  narrative: string;
}

const INDICATORS: Indicator[] = [
  {
    id: "ip-185",
    type: "ip",
    value: "185.220.101.47",
    severity: "critical",
    confidence: 94,
    firstSeen: "2026-04-10T02:14:00Z",
    lastSeen: "2026-04-12T08:33:00Z",
    tags: ["C2", "APT29", "TOR-exit", "threat-actor"],
    associations: ["dom-microsoftonline", "user-jsmith"],
    context: "Known Cozy Bear C2 infrastructure. Associated with SUNBURST campaign. Multiple AV vendors flagged. TOR exit node.",
  },
  {
    id: "dom-microsoftonline",
    type: "domain",
    value: "microsoftonline-security[.]com",
    severity: "critical",
    confidence: 97,
    firstSeen: "2026-04-08T19:00:00Z",
    lastSeen: "2026-04-11T22:00:00Z",
    tags: ["phishing", "typosquat", "OAuth", "active"],
    associations: ["ip-185", "email-spearphish"],
    context: "Typosquat of Microsoft identity platform. Used in OAuth consent phishing campaign. Registered 3 days before first observed use.",
  },
  {
    id: "hash-malware",
    type: "hash",
    value: "4a8f3c91e2d7b0f1...",
    severity: "critical",
    confidence: 99,
    firstSeen: "2026-04-11T03:27:00Z",
    lastSeen: "2026-04-11T03:27:00Z",
    tags: ["ALPHV", "ransomware", "dropper"],
    associations: ["user-tyler", "process-svchost"],
    context: "ALPHV/BlackCat dropper binary. Signed with stolen Nvidia certificate. Matches 7/7 YARA rules for ALPHV v3.",
  },
  {
    id: "user-jsmith",
    type: "user",
    value: "jsmith@company.com",
    severity: "high",
    confidence: 88,
    firstSeen: "2026-04-10T09:15:00Z",
    lastSeen: "2026-04-12T11:02:00Z",
    tags: ["victim", "compromised-oauth", "mailbox-accessed"],
    associations: ["ip-185", "dom-microsoftonline"],
    context: "CFO EA account. OAuth token stolen via phishing. Mailbox accessed from 3 foreign IPs. Reset performed April 11.",
  },
  {
    id: "user-tyler",
    type: "user",
    value: "tyler.k@company.com (IT Help Desk)",
    severity: "medium",
    confidence: 76,
    firstSeen: "2026-04-09T14:30:00Z",
    lastSeen: "2026-04-09T14:31:00Z",
    tags: ["insider-risk", "mfa-reset", "social-engineering-victim"],
    associations: ["hash-malware", "user-svc"],
    context: "Junior help desk analyst socially engineered into resetting MFA for unauthorized caller. 23-day tenure. Completed training 2 weeks prior.",
  },
  {
    id: "user-svc",
    type: "user",
    value: "svc-reportgen@company.com",
    severity: "critical",
    confidence: 91,
    firstSeen: "2026-04-10T22:47:00Z",
    lastSeen: "2026-04-11T04:15:00Z",
    tags: ["service-account", "lateral-movement", "domain-admin"],
    associations: ["user-tyler", "ip-185"],
    context: "Shared service account credentials found in attacker's possession. Login from Netherlands IP — first foreign login in 8 months. Has domain admin equivalent access.",
  },
  {
    id: "process-svchost",
    type: "process",
    value: "svchost-update.exe",
    severity: "critical",
    confidence: 98,
    firstSeen: "2026-04-11T03:14:00Z",
    lastSeen: "2026-04-11T03:14:00Z",
    tags: ["malware", "masquerading", "ALPHV-loader"],
    associations: ["hash-malware"],
    context: "Masquerading as legitimate Windows process. Created via scheduled task by compromised service account. Drops ALPHV encryptor payload.",
  },
  {
    id: "email-spearphish",
    type: "email",
    value: "security-team@microsoft-security-alerts[.]com",
    severity: "high",
    confidence: 95,
    firstSeen: "2026-04-08T07:22:00Z",
    lastSeen: "2026-04-08T07:22:00Z",
    tags: ["spearphishing", "sender-spoofing", "initial-access"],
    associations: ["dom-microsoftonline", "user-jsmith"],
    context: "Spearphishing email sent to executive team. Impersonates Microsoft security alert. Bypassed email gateway via SPF pass on lookalike domain.",
  },
];

const SUGGESTIONS: Record<string, string[]> = {
  "ip-185": ["dom-microsoftonline", "hash-malware"],
  "dom-microsoftonline": ["email-spearphish", "user-jsmith"],
  "user-jsmith": ["user-svc", "email-spearphish"],
  "user-tyler": ["user-svc"],
  "hash-malware": ["process-svchost"],
  "user-svc": ["ip-185", "process-svchost"],
  "process-svchost": ["hash-malware"],
  "email-spearphish": ["dom-microsoftonline"],
};

const TYPE_CONFIG: Record<IndicatorType, { icon: typeof Globe; color: string; label: string }> = {
  ip: { icon: Globe, color: "#ef4444", label: "IP Address" },
  domain: { icon: Globe, color: "#f97316", label: "Domain" },
  hash: { icon: Hash, color: "#8b5cf6", label: "File Hash" },
  user: { icon: Users, color: "#3b82f6", label: "User Account" },
  process: { icon: Monitor, color: "#14b8a6", label: "Process" },
  registry: { icon: Database, color: "#64748b", label: "Registry Key" },
  email: { icon: Globe, color: "#f59e0b", label: "Email" },
  url: { icon: Link2, color: "#22c55e", label: "URL" },
};

const SEVERITY_COLOR = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#22c55e",
  unknown: "#64748b",
};

const MOCK_CHAINS: HypothesisChain[] = [
  {
    id: "h1",
    title: "APT29 OAuth Phishing → Lateral Movement Chain",
    indicators: ["email-spearphish", "dom-microsoftonline", "user-jsmith", "ip-185", "user-svc"],
    status: "confirmed",
    confidence: 92,
    narrative: "The initial phishing email (email-spearphish) directed jsmith to the typosquat domain (dom-microsoftonline). After OAuth token theft, the C2 IP (ip-185) accessed the mailbox, discovered svc-reportgen credentials in a Slack export, and logged in from the Netherlands. This chain is CONFIRMED — all indicators link with >88% confidence.",
  },
  {
    id: "h2",
    title: "Help Desk Social Engineering → Ransomware Staging",
    indicators: ["user-tyler", "user-svc", "hash-malware", "process-svchost"],
    status: "confirmed",
    confidence: 87,
    narrative: "Tyler's MFA reset allowed the attacker to pivot from the compromised OAuth session to a service account with broader access. The svc-reportgen account then deployed the ALPHV dropper (hash-malware) via a masqueraded process (svchost-update.exe). This secondary chain is CONFIRMED as a parallel attack vector.",
  },
  {
    id: "h3",
    title: "Independent Nation-State Intrusion (Alternative Hypothesis)",
    indicators: ["ip-185", "user-svc"],
    status: "ruled-out",
    confidence: 18,
    narrative: "Initial hypothesis that the service account compromise was independent of the phishing chain. Ruled out — forensic timeline shows svc-reportgen credentials discovered in mailbox data accessed via stolen OAuth token. Same actor, unified campaign.",
  },
];

function IndicatorBadge({ ind, selected, onSelect }: { ind: Indicator; selected: boolean; onSelect: () => void }) {
  const cfg = TYPE_CONFIG[ind.type];
  const sev = SEVERITY_COLOR[ind.severity];

  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all w-full"
      style={{
        background: selected ? `${sev}10` : "rgba(255,255,255,0.02)",
        border: selected ? `1px solid ${sev}35` : `1px solid ${BORDER}`,
      }}
    >
      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ background: `${cfg.color}15` }}>
        <cfg.icon className="w-3 h-3" style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono font-medium text-slate-300 truncate">{ind.value}</div>
        <div className="text-[8px] text-slate-500">{cfg.label}</div>
      </div>
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sev }} />
    </button>
  );
}

export default function ThreatHuntWorkbench() {
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>("ip-185");
  const [pivotedTo, setPivotedTo] = useState<string[]>([]);
  const [searchQ, setSearchQ] = useState("");

  const selected = INDICATORS.find((i) => i.id === selectedIndicator);
  const suggestions = selectedIndicator ? (SUGGESTIONS[selectedIndicator] ?? []) : [];
  const suggestedInds = suggestions.map((id) => INDICATORS.find((i) => i.id === id)).filter(Boolean) as Indicator[];

  const filtered = INDICATORS.filter((ind) =>
    !searchQ || ind.value.toLowerCase().includes(searchQ.toLowerCase()) || ind.tags.some((t) => t.includes(searchQ.toLowerCase()))
  );

  return (
    <div className="flex h-full" style={{ background: BG }}>
      <div className="w-72 shrink-0 flex flex-col border-r overflow-y-auto" style={{ borderColor: BORDER }}>
        <div className="p-4 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-blue-400" />
            <h1 className="text-sm font-bold text-slate-100">Threat Hunt Workbench</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search indicators…"
              className="w-full rounded-md text-[11px] pl-7 pr-3 py-1.5 outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, color: "#cbd5e1" }}
            />
          </div>
        </div>
        <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-widest text-slate-600 px-1 mb-1">Indicators ({filtered.length})</div>
          {filtered.map((ind) => (
            <IndicatorBadge
              key={ind.id}
              ind={ind}
              selected={selectedIndicator === ind.id}
              onSelect={() => setSelectedIndicator(ind.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {selected && (
          <>
            <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {(() => { const cfg = TYPE_CONFIG[selected.type]; return <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />; })()}
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: TYPE_CONFIG[selected.type].color, background: `${TYPE_CONFIG[selected.type].color}15` }}>
                      {TYPE_CONFIG[selected.type].label}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded ml-1" style={{ color: SEVERITY_COLOR[selected.severity], background: `${SEVERITY_COLOR[selected.severity]}12` }}>
                      {selected.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-base font-bold font-mono text-slate-100">{selected.value}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest">Confidence</div>
                  <div className="text-2xl font-bold font-mono" style={{ color: SEVERITY_COLOR[selected.severity] }}>{selected.confidence}%</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">{selected.context}</p>

              <div className="flex items-center gap-4 text-[9px] text-slate-500">
                <span>First seen: <span className="text-slate-400">{new Date(selected.firstSeen).toLocaleString()}</span></span>
                <span>Last seen: <span className="text-slate-400">{new Date(selected.lastSeen).toLocaleString()}</span></span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {selected.tags.map((t) => (
                  <span key={t} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {suggestedInds.length > 0 && (
              <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-slate-100">AI-Suggested Pivot Targets</span>
                  <span className="text-[9px] text-slate-500 ml-1">Based on correlation analysis</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {suggestedInds.map((ind) => {
                    const cfg = TYPE_CONFIG[ind.type];
                    const sev = SEVERITY_COLOR[ind.severity];
                    return (
                      <button
                        key={ind.id}
                        onClick={() => { setSelectedIndicator(ind.id); setPivotedTo((p) => [...p, ind.id]); }}
                        className="flex items-start gap-3 p-3 rounded-lg border text-left transition-all"
                        style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}20` }}>
                          <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-slate-300 leading-tight mb-0.5 break-all">{ind.value}</div>
                          <div className="text-[8px] text-slate-500">{cfg.label}</div>
                          <div className="mt-1 flex gap-1">
                            {ind.tags.slice(0, 2).map((t) => (
                              <span key={t} className="text-[7px] px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "#64748b" }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 p-3 rounded-md text-[10px] text-slate-400 leading-relaxed" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.10)" }}>
                  <span className="text-purple-400 font-medium">AI Assessment:</span> These indicators show high co-occurrence probability based on TTP pattern matching and temporal clustering. Pivoting to domain indicators is recommended next to trace the initial access vector.
                </div>
              </div>
            )}
          </>
        )}

        <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-slate-100">Hypothesis Chains</span>
          </div>
          <div className="space-y-3">
            {MOCK_CHAINS.map((chain) => {
              const statusColors = {
                confirmed: { color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
                investigating: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
                "ruled-out": { color: "#64748b", bg: "rgba(100,116,139,0.08)" },
              };
              const cfg = statusColors[chain.status];
              return (
                <div key={chain.id} className="rounded-lg p-4" style={{ background: cfg.bg, border: `1px solid ${cfg.color}20` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-semibold text-slate-200">{chain.title}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ color: cfg.color, background: `${cfg.color}15` }}>
                        {chain.status.replace("-", " ")}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: cfg.color }}>{chain.confidence}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{chain.narrative}</p>
                  <div className="flex flex-wrap gap-1">
                    {chain.indicators.map((id) => {
                      const ind = INDICATORS.find((i) => i.id === id);
                      if (!ind) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => setSelectedIndicator(id)}
                          className="text-[8px] font-mono px-1.5 py-0.5 rounded transition-colors"
                          style={{ background: "rgba(255,255,255,0.05)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          {ind.value.slice(0, 20)}{ind.value.length > 20 ? "…" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
