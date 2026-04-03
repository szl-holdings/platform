import { useState } from "react";
import { Mail, FileText, Users, Database, Link2, CheckCircle, AlertTriangle, RefreshCw, Send, Download, MessageSquare, Archive } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL + "api";

type Tab = "outlook" | "word" | "teams" | "sharepoint";

const OUTLOOK_CLUSTERS = [
  { insurer: "National General Insurance", threads: 14, lastActivity: "2026-04-03T09:30:00Z", waitingOnResponse: 3, escalationsDrafted: 1, status: "active" },
  { insurer: "GEICO", threads: 8, lastActivity: "2026-04-02T14:00:00Z", waitingOnResponse: 1, escalationsDrafted: 0, status: "active" },
  { insurer: "State Farm", threads: 5, lastActivity: "2026-04-01T11:00:00Z", waitingOnResponse: 0, escalationsDrafted: 0, status: "stale" },
];

const WORD_EXPORTS = [
  { template: "Reviewed Chronology Packet", description: "Complete medical timeline with source citations and Proof Chain reference", lastGenerated: "2026-04-03T08:00:00Z", matters: 3, proofChainPreserved: true },
  { template: "Settlement-Blocker Memo", description: "Identified blockers to settlement with owner assignments and resolution paths", lastGenerated: "2026-04-02T15:00:00Z", matters: 2, proofChainPreserved: true },
  { template: "Recovery Dependency Memo", description: "Lien and recovery dependency status with stale-state alerts", lastGenerated: "2026-04-01T10:00:00Z", matters: 4, proofChainPreserved: true },
  { template: "Portfolio Digest Export (Partner)", description: "Partner-facing portfolio summary with matter status, recovery status, and next actions", lastGenerated: "2026-04-03T07:00:00Z", matters: 8, proofChainPreserved: true },
];

const TEAMS_ALERTS = [
  { type: "Managed Review Alert", channel: "Legal Ops", matter: "Rodriguez v. National General", message: "3 documents require additional review before export — 2 flagged for privilege", sentAt: "2026-04-03T09:45:00Z", priority: "high" },
  { type: "Partner Digest Card", channel: "Partner Updates", matter: null, message: "Weekly portfolio summary: 12 active matters, $2.1M settlement range, 4 pending approvals", sentAt: "2026-04-03T07:00:00Z", priority: "normal" },
  { type: "Backlog Escalation Alert", channel: "Legal Ops", matter: null, message: "Approval backlog has 12 items — 3 expiring in 48 hours", sentAt: "2026-04-02T16:00:00Z", priority: "high" },
  { type: "Recovery / Lien Stale-State", channel: "Legal Ops", matter: "Vasquez v. GEICO", message: "Medicare lien status has not been updated in 14 days — conditional payment of $12,847", sentAt: "2026-04-02T14:00:00Z", priority: "medium" },
];

const SP_PACKETS = [
  { title: "Rodriguez Matter — Review Packet", site: "SZL Legal Ops", library: "Reviewed Documents", publishedAt: "2026-04-03T09:00:00Z", evidenceComplete: true, stalenessFlag: false },
  { title: "Vasquez — Source Bundle", site: "SZL Legal Ops", library: "Managed Review Sources", publishedAt: "2026-04-02T11:00:00Z", evidenceComplete: false, stalenessFlag: true },
  { title: "Portfolio Q1 2026 Digest", site: "Partner Portal", library: "Partner Reports", publishedAt: "2026-04-03T07:00:00Z", evidenceComplete: true, stalenessFlag: false },
];

export default function AdminM365Page() {
  const [tab, setTab] = useState<Tab>("outlook");
  const qc = useQueryClient();

  const sendTeamsAlert = useMutation({
    mutationFn: async (text: string) => {
      const r = await fetch(`${API}/microsoft/teams/notify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, title: "PRISM Counsel Alert" }) });
      return r.json();
    },
  });

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "outlook", label: "Outlook", icon: Mail },
    { key: "word", label: "Word Exports", icon: FileText },
    { key: "teams", label: "Teams Alerts", icon: MessageSquare },
    { key: "sharepoint", label: "SharePoint / OneDrive", icon: Database },
  ];

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-[#4a90b8]" />
          <h1 className="text-lg font-semibold text-slate-100">Microsoft 365 Integration</h1>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">ADMIN / OPS</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Outlook insurer thread clustering, Word export templates, Teams alerts, and SharePoint/OneDrive packet publishing for Pilot Two managed review and partner operations</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Insurer Clusters", value: OUTLOOK_CLUSTERS.length, color: "#4a90b8", icon: Mail },
          { label: "Word Templates", value: WORD_EXPORTS.length, color: "#8b7ac8", icon: FileText },
          { label: "Teams Alerts (24h)", value: TEAMS_ALERTS.length, color: "#d4a054", icon: MessageSquare },
          { label: "Published Packets", value: SP_PACKETS.length, color: "#c8953c", icon: Database },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-1.5 mb-1"><Icon className="w-3.5 h-3.5" style={{ color: s.color }} /><span className="text-[10px] text-slate-500">{s.label}</span></div>
              <div className="text-xl font-semibold" style={{ color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${tab === t.key ? "bg-[#4a90b8]/15 text-[#4a90b8]" : "text-slate-500 hover:text-slate-300"}`}>
              <Icon className="w-3 h-3" />{t.label}
            </button>
          );
        })}
      </div>

      {tab === "outlook" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Insurer Thread Clusters</h3>
            <div className="space-y-3">
              {OUTLOOK_CLUSTERS.map((cluster, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                  <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cluster.status === "active" ? "#4a90b8" : "#64748b" }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-200">{cluster.insurer}</span>
                      <span className="text-[9px] text-slate-500">{cluster.threads} threads</span>
                    </div>
                    <div className="flex gap-3 mt-1">
                      {cluster.waitingOnResponse > 0 && <span className="text-[9px] text-[#d4a054]">⏳ {cluster.waitingOnResponse} waiting on response</span>}
                      {cluster.escalationsDrafted > 0 && <span className="text-[9px] text-[#c45a4a]">📝 {cluster.escalationsDrafted} escalation draft</span>}
                      {cluster.waitingOnResponse === 0 && cluster.escalationsDrafted === 0 && <span className="text-[9px] text-slate-600">No pending signals</span>}
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500">{new Date(cluster.lastActivity).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Draft Template Library</h3>
            <div className="space-y-2">
              {["Reviewed Escalation Draft", "Reviewed Partner Update Draft", "Waiting-on-Response Signal"].map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-300 flex-1">{t}</span>
                  <span className="text-[9px] text-[#4a90b8] bg-[#4a90b8]/10 px-1.5 py-0.5 rounded">template ready</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "word" && (
        <div className="space-y-3">
          {WORD_EXPORTS.map((exp, i) => (
            <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-medium text-slate-200">{exp.template}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{exp.description}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {exp.proofChainPreserved && <span className="text-[9px] text-[#4a90b8] bg-[#4a90b8]/10 px-1.5 py-0.5 rounded">Proof Chain preserved</span>}
                  <span className="text-[9px] text-slate-500">{exp.matters} matters</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-[9px] text-slate-600">Last generated: {new Date(exp.lastGenerated).toLocaleString()}</div>
                <button className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-medium bg-[#8b7ac8]/10 text-[#8b7ac8] hover:bg-[#8b7ac8]/20 transition-colors">
                  <Download className="w-2.5 h-2.5" /> Generate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "teams" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => sendTeamsAlert.mutate("PRISM Counsel test alert from admin ops panel")} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium bg-[#d4a054]/10 text-[#d4a054] hover:bg-[#d4a054]/20 transition-colors">
              <Send className="w-3 h-3" /> Send Test Alert
            </button>
          </div>
          {TEAMS_ALERTS.map((alert, i) => (
            <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${alert.priority === "high" ? "bg-[#c45a4a]/10 text-[#c45a4a]" : alert.priority === "medium" ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-slate-500/10 text-slate-400"}`}>{alert.priority}</span>
                  <span className="text-xs font-medium text-slate-200">{alert.type}</span>
                </div>
                <span className="text-[9px] text-slate-500">{new Date(alert.sentAt).toLocaleString()}</span>
              </div>
              {alert.matter && <div className="text-[10px] text-[#4a90b8] mb-1">{alert.matter}</div>}
              <div className="text-[10px] text-slate-400">{alert.message}</div>
              <div className="text-[9px] text-slate-600 mt-1">Channel: #{alert.channel}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "sharepoint" && (
        <div className="space-y-3">
          {SP_PACKETS.map((pkt, i) => (
            <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-medium text-slate-200">{pkt.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{pkt.site} / {pkt.library}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {pkt.evidenceComplete
                    ? <span className="text-[9px] text-[#4a90b8] bg-[#4a90b8]/10 px-1.5 py-0.5 rounded">evidence complete</span>
                    : <span className="text-[9px] text-[#d4a054] bg-[#d4a054]/10 px-1.5 py-0.5 rounded">evidence incomplete</span>}
                  {pkt.stalenessFlag && <span className="text-[9px] text-[#c45a4a] bg-[#c45a4a]/10 px-1.5 py-0.5 rounded">stale — needs refresh</span>}
                </div>
              </div>
              <div className="text-[9px] text-slate-600">Published: {new Date(pkt.publishedAt).toLocaleString()}</div>
            </div>
          ))}
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Publishing Actions</h3>
            <div className="space-y-2">
              {["Publish Reviewed Packet to SharePoint", "Publish Managed Review Source Bundle", "Refresh Stale Evidence Overlay"].map((action, i) => (
                <button key={i} className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-slate-300 hover:text-slate-100 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left">
                  <Archive className="w-3.5 h-3.5 text-[#4a90b8]" />
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
