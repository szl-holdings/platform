import { useState } from "react";
import { useLocation } from "wouter";
import { Database, AlertTriangle, FileText, Mail, Cloud, Monitor, Shield, Eye, ChevronDown, ChevronUp, Plus, Search } from "lucide-react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

const RISK_COLOR: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#22c55e" };
const STATUS_COLOR: Record<string, string> = { "Open": "#ef4444", "Under Review": "#f97316", "Resolved": "#22c55e", "Dismissed": "#94a3b8" };

interface DLPPolicy {
  id: string;
  name: string;
  channel: "email" | "cloud-storage" | "endpoint" | "web-upload";
  patterns: string[];
  dataTypes: string[];
  action: "block" | "alert" | "quarantine";
  hitsToday: number;
  enabled: boolean;
}

interface DLPViolation {
  id: string;
  policyId: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "Open" | "Under Review" | "Resolved" | "Dismissed";
  user: string;
  channel: "email" | "cloud-storage" | "endpoint" | "web-upload";
  description: string;
  dataType: string;
  timestamp: string;
  matchedPattern: string;
  destination?: string;
  fileSize?: string;
  caseId?: string;
}

const POLICIES: DLPPolicy[] = [
  { id: "DLP-POL-001", name: "PII Detection — Email Outbound", channel: "email", patterns: ["SSN (###-##-####)", "Credit card regex", "DOB pattern"], dataTypes: ["PII", "Financial"], action: "block", hitsToday: 47, enabled: true },
  { id: "DLP-POL-002", name: "PHI — Cloud Storage Upload", channel: "cloud-storage", patterns: ["ICD-10 codes", "NPI numbers", "Patient ID"], dataTypes: ["PHI", "HIPAA"], action: "alert", hitsToday: 12, enabled: true },
  { id: "DLP-POL-003", name: "PCI — Card Data on Endpoint", channel: "endpoint", patterns: ["PAN regex", "CVV pattern", "Track data"], dataTypes: ["PCI-DSS", "Financial"], action: "quarantine", hitsToday: 8, enabled: true },
  { id: "DLP-POL-004", name: "IP & Source Code — Web Upload", channel: "web-upload", patterns: ["API key patterns", "Private key headers", "Internal domain refs"], dataTypes: ["IP", "Trade Secret"], action: "block", hitsToday: 23, enabled: true },
  { id: "DLP-POL-005", name: "Executive Comms Monitoring", channel: "email", patterns: ["M&A keywords", "Non-public financials"], dataTypes: ["MNPI", "Insider"], action: "alert", hitsToday: 3, enabled: false },
];

const VIOLATIONS: DLPViolation[] = [
  { id: "DLV-001", policyId: "DLP-POL-001", severity: "critical", status: "Open", user: "finance.admin@szl.com", channel: "email", description: "147 SSNs detected in email attachment sent to external domain", dataType: "PII / SSN", timestamp: "18m ago", matchedPattern: "SSN (###-##-####)", destination: "vendor-external.com", fileSize: "2.3 MB", caseId: undefined },
  { id: "DLV-002", policyId: "DLP-POL-003", severity: "critical", status: "Under Review", user: "j.smith@szl.com", channel: "endpoint", description: "Full credit card track data found in locally cached file on unencrypted drive", dataType: "PCI-DSS / PAN", timestamp: "1h ago", matchedPattern: "PAN regex", fileSize: "890 KB", caseId: "CASE-4821" },
  { id: "DLV-003", policyId: "DLP-POL-004", severity: "high", status: "Open", user: "dev.contractor@szl.com", channel: "web-upload", description: "AWS access key and secret uploaded to GitHub public repository", dataType: "API Key / Secrets", timestamp: "35m ago", matchedPattern: "API key pattern", destination: "github.com", caseId: undefined },
  { id: "DLV-004", policyId: "DLP-POL-002", severity: "high", status: "Resolved", user: "medical.records@szl.com", channel: "cloud-storage", description: "Unsecured patient records file (PHI) uploaded to personal OneDrive", dataType: "PHI / HIPAA", timestamp: "3h ago", matchedPattern: "NPI numbers", destination: "onedrive.com", fileSize: "5.1 MB", caseId: "CASE-4819" },
  { id: "DLV-005", policyId: "DLP-POL-001", severity: "medium", status: "Dismissed", user: "hr.team@szl.com", channel: "email", description: "Employee salary data in internal email — approved HR workflow", dataType: "PII / Financial", timestamp: "6h ago", matchedPattern: "SSN (###-##-####)", destination: "hr@szl-internal.com" },
];

const CHANNEL_ICON: Record<string, typeof Database> = { email: Mail, "cloud-storage": Cloud, endpoint: Monitor, "web-upload": FileText };
const CHANNEL_COLOR: Record<string, string> = { email: "#3b82f6", "cloud-storage": "#8b5cf6", endpoint: "#06b6d4", "web-upload": "#f97316" };

const ACTION_COLOR: Record<string, string> = { block: "#ef4444", alert: "#f59e0b", quarantine: "#f97316" };

export default function DLPDashboard() {
  const [, navigate] = useLocation();
  const [expandedViolation, setExpandedViolation] = useState<string | null>("DLV-001");
  const [tab, setTab] = useState<"violations" | "policies">("violations");
  const [search, setSearch] = useState("");

  const openCount = VIOLATIONS.filter(v => v.status === "Open").length;
  const criticalCount = VIOLATIONS.filter(v => v.severity === "critical").length;
  const totalHitsToday = POLICIES.reduce((s, p) => s + p.hitsToday, 0);

  const filteredViolations = VIOLATIONS.filter(v => {
    if (search && !v.description.toLowerCase().includes(search.toLowerCase()) && !v.user.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Data Loss Prevention
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Content inspection policies · PII · PHI · PCI · violation triage · case management integration</p>
        </div>
        <button onClick={() => toast.success("DLP policy builder opened")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs hover:bg-cyan-500/20 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Policy
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open Violations", value: openCount, color: "#ef4444" },
          { label: "Critical Incidents", value: criticalCount, color: "#ef4444" },
          { label: "Policy Hits Today", value: totalHitsToday, color: "#f97316" },
          { label: "Active Policies", value: POLICIES.filter(p => p.enabled).length, color: "#06b6d4" },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="text-xs text-white/40 mb-1">{m.label}</div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Channel breakdown */}
      <div className="grid grid-cols-4 gap-3">
        {(["email", "cloud-storage", "endpoint", "web-upload"] as const).map(ch => {
          const Icon = CHANNEL_ICON[ch];
          const policyHits = POLICIES.filter(p => p.channel === ch).reduce((s, p) => s + p.hitsToday, 0);
          return (
            <div key={ch} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${CHANNEL_COLOR[ch]}15` }}>
                <Icon className="w-4 h-4" style={{ color: CHANNEL_COLOR[ch] }} />
              </div>
              <div>
                <div className="text-xs font-medium text-white capitalize">{ch.replace("-", " ")}</div>
                <div className="text-[11px] font-bold" style={{ color: CHANNEL_COLOR[ch] }}>{policyHits} hits</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 w-fit">
        {(["violations", "policies"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all" style={tab === t ? { background: "rgba(6,182,212,0.12)", color: "#67e8f9", border: "1px solid rgba(6,182,212,0.2)" } : { color: "rgba(255,255,255,0.4)" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "violations" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search violations, users..." className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-white placeholder:text-white/25 outline-none focus:border-cyan-500/40" />
          </div>
          <div className="space-y-2">
            {filteredViolations.map(v => {
              const Icon = CHANNEL_ICON[v.channel];
              const isExpanded = expandedViolation === v.id;
              return (
                <div key={v.id} className="rounded-xl border overflow-hidden" style={{ borderColor: isExpanded ? `${RISK_COLOR[v.severity]}30` : "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left" onClick={() => setExpandedViolation(isExpanded ? null : v.id)}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${CHANNEL_COLOR[v.channel]}15` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: CHANNEL_COLOR[v.channel] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white truncate">{v.description.slice(0, 60)}...</span>
                        {v.caseId && <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{v.caseId}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/30">
                        <span className="font-mono">{v.user}</span>
                        <span>{v.dataType}</span>
                        <span>{v.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] px-2 py-0.5 rounded font-semibold uppercase" style={{ color: STATUS_COLOR[v.status], background: `${STATUS_COLOR[v.status]}15` }}>{v.status}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded font-semibold uppercase" style={{ color: RISK_COLOR[v.severity], background: `${RISK_COLOR[v.severity]}15` }}>{v.severity}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/[0.04] space-y-3">
                      <p className="text-xs text-white/60">{v.description}</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Matched Pattern", value: v.matchedPattern },
                          { label: "Destination", value: v.destination ?? "Internal" },
                          { label: "File Size", value: v.fileSize ?? "N/A" },
                        ].map(f => (
                          <div key={f.label} className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2.5">
                            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">{f.label}</div>
                            <div className="text-[10px] font-mono text-white/70">{f.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {v.status === "Open" && (
                          <>
                            <button onClick={() => { toast.success("DLP violation escalated → navigating to Case Management"); navigate("/cases"); }} className="px-3 py-1.5 rounded-lg text-[11px] border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                              <AlertTriangle className="w-3 h-3 inline mr-1" />Escalate to Case
                            </button>
                            <button onClick={() => toast.success("Marked under review")} className="px-3 py-1.5 rounded-lg text-[11px] border border-orange-500/25 text-orange-400 hover:bg-orange-500/10 transition-colors">
                              <Eye className="w-3 h-3 inline mr-1" />Review
                            </button>
                          </>
                        )}
                        <button onClick={() => toast.success("Dismissed")} className="px-3 py-1.5 rounded-lg text-[11px] border border-white/10 text-white/50 hover:bg-white/[0.04] transition-colors">Dismiss</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "policies" && (
        <div className="space-y-2">
          {POLICIES.map(policy => {
            const Icon = CHANNEL_ICON[policy.channel];
            return (
              <div key={policy.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4" style={{ opacity: policy.enabled ? 1 : 0.6 }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${CHANNEL_COLOR[policy.channel]}15` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: CHANNEL_COLOR[policy.channel] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{policy.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold" style={{ color: ACTION_COLOR[policy.action], background: `${ACTION_COLOR[policy.action]}15` }}>{policy.action}</span>
                      {!policy.enabled && <span className="text-[9px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">disabled</span>}
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {policy.dataTypes.map(dt => <span key={dt} className="text-[9px] text-cyan-400/70 bg-cyan-500/10 px-1.5 py-0.5 rounded">{dt}</span>)}
                      {policy.patterns.slice(0, 2).map(p => <span key={p} className="text-[9px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">{p}</span>)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold" style={{ color: policy.hitsToday > 20 ? "#ef4444" : policy.hitsToday > 5 ? "#f97316" : "#22c55e" }}>{policy.hitsToday}</div>
                    <div className="text-[9px] text-white/25">hits today</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
