import { useState } from "react";
import { Plus, CheckCircle, AlertTriangle, Users, Monitor, Globe, Lock, Activity, Zap, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

const RISK_COLOR: Record<string, string> = { allow: "#22c55e", deny: "#ef4444", conditional: "#f59e0b", review: "#f97316" };

interface PolicyRule {
  id: string;
  name: string;
  action: "allow" | "deny" | "conditional";
  identityCondition: string;
  deviceCondition: string;
  locationCondition: string;
  riskCondition: string;
  resource: string;
  hits24h: number;
  blockedAttempts: number;
  enabled: boolean;
}

interface Segment {
  id: string;
  name: string;
  type: "zone" | "workload" | "identity-group";
  trustLevel: "high" | "medium" | "low" | "untrusted";
  assets: number;
  connections: string[];
  riskScore: number;
}

const POLICIES: PolicyRule[] = [
  { id: "P-001", name: "Exec — MFA Required + Managed Device", action: "allow", identityCondition: "Group: Executive", deviceCondition: "Managed & Compliant", locationCondition: "Any", riskCondition: "Risk Score < 40", resource: "All Corporate Resources", hits24h: 847, blockedAttempts: 12, enabled: true },
  { id: "P-002", name: "Deny Unmanaged Devices to Finance", action: "deny", identityCondition: "Dept: Finance", deviceCondition: "Unmanaged", locationCondition: "Any", riskCondition: "Any", resource: "Finance Applications", hits24h: 234, blockedAttempts: 234, enabled: true },
  { id: "P-003", name: "Conditional — BYOD to Low-Risk Apps", action: "conditional", identityCondition: "All Users", deviceCondition: "BYOD", locationCondition: "Trusted country", riskCondition: "Risk Score < 60", resource: "Low-Risk Apps Only", hits24h: 1892, blockedAttempts: 341, enabled: true },
  { id: "P-004", name: "Block Tor / VPN Exit Nodes", action: "deny", identityCondition: "Any", deviceCondition: "Any", locationCondition: "IP: Tor, known VPN exit", riskCondition: "Any", resource: "All Resources", hits24h: 178, blockedAttempts: 178, enabled: true },
  { id: "P-005", name: "Dev — Prod DB Access Requires Justification", action: "conditional", identityCondition: "Group: Engineering", deviceCondition: "Managed", locationCondition: "Corporate network", riskCondition: "Session approval required", resource: "Production Databases", hits24h: 43, blockedAttempts: 8, enabled: true },
  { id: "P-006", name: "Service Accounts — Network Microsegmentation", action: "allow", identityCondition: "Service accounts", deviceCondition: "Server managed", locationCondition: "Internal subnets only", riskCondition: "Risk Score < 20", resource: "Approved API endpoints", hits24h: 12847, blockedAttempts: 23, enabled: false },
];

const SEGMENTS: Segment[] = [
  { id: "SEG-001", name: "Production Core", type: "zone", trustLevel: "high", assets: 47, connections: ["SEG-002", "SEG-004"], riskScore: 18 },
  { id: "SEG-002", name: "Corporate Users", type: "identity-group", trustLevel: "medium", assets: 892, connections: ["SEG-001", "SEG-003", "SEG-005"], riskScore: 42 },
  { id: "SEG-003", name: "BYOD / Contractors", type: "identity-group", trustLevel: "low", assets: 234, connections: ["SEG-005"], riskScore: 67 },
  { id: "SEG-004", name: "Finance Workloads", type: "workload", trustLevel: "high", assets: 12, connections: ["SEG-002"], riskScore: 22 },
  { id: "SEG-005", name: "Internet-Facing Services", type: "zone", trustLevel: "untrusted", assets: 8, connections: ["SEG-002", "SEG-003"], riskScore: 74 },
  { id: "SEG-006", name: "OT / ICS Network", type: "zone", trustLevel: "high", assets: 34, connections: [], riskScore: 14 },
];

const TRUST_COLOR: Record<string, string> = { high: "#22c55e", medium: "#3b82f6", low: "#f59e0b", untrusted: "#ef4444" };

const SCORES = [
  { label: "Identity Maturity", value: 78, detail: "MFA deployed, conditional access active" },
  { label: "Device Trust", value: 61, detail: "34% BYOD — compliance gaps" },
  { label: "Network Segmentation", value: 84, detail: "East-west inspection enabled" },
  { label: "App Access Controls", value: 72, detail: "SAML/OIDC on 89% of apps" },
  { label: "Data Protection", value: 55, detail: "DLP coverage gaps in 3 segments" },
  { label: "Visibility & Analytics", value: 88, detail: "SIEM + XDR correlation active" },
];

export default function ZeroTrustEngine() {
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>("P-001");
  const [tab, setTab] = useState<"policies" | "segments" | "scorecard">("policies");

  const overallScore = Math.round(SCORES.reduce((s, m) => s + m.value, 0) / SCORES.length);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            Zero Trust Policy Engine
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Network microsegmentation · conditional access rules · identity + device + location + risk score</p>
        </div>
        <button onClick={() => toast.success("Policy builder opened — visual rule composer ready")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Policy
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "ZT Maturity Score", value: `${overallScore}%`, color: "#22c55e" },
          { label: "Active Policies", value: POLICIES.filter(p => p.enabled).length, color: "#3b82f6" },
          { label: "Blocked Today", value: POLICIES.reduce((s, p) => s + p.blockedAttempts, 0).toLocaleString(), color: "#ef4444" },
          { label: "Network Segments", value: SEGMENTS.length, color: "#8b5cf6" },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="text-xs text-white/40 mb-1">{m.label}</div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 w-fit">
        {(["policies", "segments", "scorecard"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all" style={tab === t ? { background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" } : { color: "rgba(255,255,255,0.4)" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "policies" && (
        <div className="space-y-2">
          {POLICIES.map(policy => {
            const isExpanded = expandedPolicy === policy.id;
            return (
              <div key={policy.id} className="rounded-xl border overflow-hidden" style={{ borderColor: isExpanded ? `${RISK_COLOR[policy.action]}30` : "rgba(255,255,255,0.06)", background: policy.enabled ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.01)", opacity: policy.enabled ? 1 : 0.6 }}>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left" onClick={() => setExpandedPolicy(isExpanded ? null : policy.id)}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: `${RISK_COLOR[policy.action]}20` }}>
                    {policy.action === "allow" ? <CheckCircle className="w-3 h-3" style={{ color: RISK_COLOR[policy.action] }} /> : policy.action === "deny" ? <AlertTriangle className="w-3 h-3" style={{ color: RISK_COLOR[policy.action] }} /> : <Zap className="w-3 h-3" style={{ color: RISK_COLOR[policy.action] }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{policy.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold" style={{ color: RISK_COLOR[policy.action], background: `${RISK_COLOR[policy.action]}15` }}>{policy.action}</span>
                      {!policy.enabled && <span className="text-[9px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">disabled</span>}
                    </div>
                    <div className="text-[10px] text-white/30 mt-0.5">{policy.resource}</div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div><div className="text-xs font-mono text-white/50">{policy.hits24h.toLocaleString()}</div><div className="text-[9px] text-white/25">hits/day</div></div>
                    {policy.blockedAttempts > 0 && <div><div className="text-xs font-mono text-red-400">{policy.blockedAttempts}</div><div className="text-[9px] text-white/25">blocked</div></div>}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/[0.04]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      {[
                        { label: "Identity", value: policy.identityCondition, icon: Users },
                        { label: "Device", value: policy.deviceCondition, icon: Monitor },
                        { label: "Location", value: policy.locationCondition, icon: Globe },
                        { label: "Risk Score", value: policy.riskCondition, icon: Activity },
                      ].map(c => {
                        const Icon = c.icon;
                        return (
                          <div key={c.label} className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2.5">
                            <div className="flex items-center gap-1 mb-1"><Icon className="w-3 h-3 text-white/30" /><span className="text-[9px] text-white/30 uppercase tracking-wider">{c.label}</span></div>
                            <div className="text-[10px] text-white/70">{c.value}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toast.success(`Policy "${policy.name}" ${policy.enabled ? "disabled" : "enabled"}`)} className="px-3 py-1.5 rounded-lg text-[11px] border border-white/10 text-white/50 hover:bg-white/[0.04] transition-colors">
                        <Settings className="w-3 h-3 inline mr-1" />Configure
                      </button>
                      <button onClick={() => toast.success("Policy cloned")} className="px-3 py-1.5 rounded-lg text-[11px] border border-blue-500/25 text-blue-400 hover:bg-blue-500/10 transition-colors">
                        Clone Rule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "segments" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SEGMENTS.map(seg => (
            <div key={seg.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold text-white">{seg.name}</div>
                  <div className="text-[10px] text-white/30 mt-0.5 capitalize">{seg.type.replace("-", " ")} · {seg.assets} assets</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-2 py-0.5 rounded capitalize font-semibold" style={{ color: TRUST_COLOR[seg.trustLevel], background: `${TRUST_COLOR[seg.trustLevel]}15` }}>{seg.trustLevel}</span>
                  <span className="text-xs font-bold" style={{ color: seg.riskScore > 60 ? "#ef4444" : seg.riskScore > 30 ? "#f59e0b" : "#22c55e" }}>{seg.riskScore}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.05] mb-2">
                <div className="h-full rounded-full" style={{ width: `${seg.riskScore}%`, background: seg.riskScore > 60 ? "#ef4444" : seg.riskScore > 30 ? "#f59e0b" : "#22c55e" }} />
              </div>
              {seg.connections.length > 0 && (
                <div className="text-[10px] text-white/30">Connects to: {seg.connections.map(c => SEGMENTS.find(s => s.id === c)?.name).join(", ")}</div>
              )}
              {seg.connections.length === 0 && <div className="text-[10px] text-emerald-400/60">Air-gapped — no external connections</div>}
            </div>
          ))}
        </div>
      )}

      {tab === "scorecard" && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="text-4xl font-bold text-emerald-400">{overallScore}</div>
            <div>
              <div className="text-sm font-semibold text-white">Zero Trust Maturity Score</div>
              <div className="text-xs text-white/40">Based on CISA Zero Trust Maturity Model</div>
            </div>
          </div>
          {SCORES.map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white">{s.label}</span>
                <span className="text-sm font-bold" style={{ color: s.value >= 80 ? "#22c55e" : s.value >= 60 ? "#f59e0b" : "#ef4444" }}>{s.value}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.05]">
                <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.value >= 80 ? "#22c55e" : s.value >= 60 ? "#f59e0b" : "#ef4444" }} />
              </div>
              <div className="text-[10px] text-white/30 mt-1">{s.detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
