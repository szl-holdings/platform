import { Shield, Link2, Database, FileText, CheckCircle, AlertTriangle, Lock, Building2, Archive, Search } from "lucide-react";

const CASE_LINKAGES = [
  {
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    eDiscoveryCaseId: "EDC-2025-0042",
    holdStatus: "active",
    holdScope: "All communications and documents related to Rodriguez motor vehicle claim",
    reviewSetCount: 3,
    reviewSets: [
      { name: "Initial document collection", status: "complete", documentCount: 247 },
      { name: "Carrier correspondence", status: "in_review", documentCount: 83 },
      { name: "Medical records", status: "pending", documentCount: 156 },
    ],
    exportHandoff: { status: "ready", lastExport: "2026-03-28", format: "Relativity RSMF" },
  },
  {
    matterId: 3,
    matterTitle: "Vasquez v. GEICO",
    caseNumber: "2025-CV-02991",
    eDDiscoveryCaseId: "EDC-2025-0038",
    holdStatus: "active",
    holdScope: "All claim-related communications, medical records, and discovery documents",
    reviewSetCount: 2,
    reviewSets: [
      { name: "Discovery production set", status: "in_review", documentCount: 312 },
      { name: "Medical authorization documents", status: "complete", documentCount: 45 },
    ],
    exportHandoff: { status: "pending", lastExport: null, format: "Relativity RSMF" },
  },
];

export default function PurviewBridgePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#4a90b8]" />
          <h1 className="text-lg font-semibold text-slate-100">Purview Legal Operations Bridge</h1>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">ADMIN ONLY</span>
        </div>
        <p className="text-xs text-slate-500">eDiscovery case linkage, hold awareness, review-set tracking, matter-to-case mapping, and defensible export handoff — visible to authorized admin only</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Linked Cases", value: "2", icon: Link2, color: "#4a90b8" },
          { label: "Active Holds", value: "2", icon: Lock, color: "#c45a4a" },
          { label: "Review Sets", value: "5", icon: Database, color: "#d4a054" },
          { label: "Pending Handoffs", value: "1", icon: Archive, color: "#8b7ac8" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                <span className="text-[10px] text-slate-500">{stat.label}</span>
              </div>
              <div className="text-xl font-semibold" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {CASE_LINKAGES.map(link => (
          <div key={link.matterId} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{link.matterTitle}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{link.caseNumber}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Link2 className="w-3 h-3 text-[#4a90b8]" />
                  <span className="text-[10px] text-[#4a90b8] font-mono">{link.eDiscoveryCaseId || (link as any).eDDiscoveryCaseId}</span>
                  <span className="text-[10px] text-slate-600">eDiscovery Case</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${link.holdStatus === "active" ? "bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20" : "bg-slate-500/10 text-slate-400"}`}>
                {link.holdStatus === "active" ? <><Lock className="w-2.5 h-2.5 inline mr-1" />Hold Active</> : "No Hold"}
              </span>
            </div>

            <div className="rounded border border-white/[0.04] p-2.5 mb-3" style={{ background: "#080c14" }}>
              <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">Hold Scope</div>
              <p className="text-[10px] text-slate-400">{link.holdScope}</p>
            </div>

            <div className="mb-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Review Sets ({link.reviewSetCount})</div>
              <div className="space-y-1.5">
                {link.reviewSets.map((rs, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded" style={{ background: "#080c14" }}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rs.status === "complete" ? "bg-[#4a90b8]" : rs.status === "in_review" ? "bg-[#d4a054] animate-pulse" : "bg-slate-600"}`} />
                    <span className="text-[11px] text-slate-300 flex-1">{rs.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{rs.documentCount} docs</span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                      rs.status === "complete" ? "bg-[#4a90b8]/10 text-[#4a90b8]" :
                      rs.status === "in_review" ? "bg-[#d4a054]/10 text-[#d4a054]" :
                      "bg-slate-600/10 text-slate-500"
                    }`}>{rs.status.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded border border-white/[0.04]" style={{ background: "#080c14" }}>
              <div>
                <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">Defensible Export Handoff</div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium ${link.exportHandoff.status === "ready" ? "text-[#4a90b8]" : "text-[#d4a054]"}`}>
                    {link.exportHandoff.status === "ready" ? "Ready for handoff" : "Pending — review sets incomplete"}
                  </span>
                  <span className="text-[9px] text-slate-600">· {link.exportHandoff.format}</span>
                </div>
              </div>
              <button className={`px-3 py-1.5 rounded text-[10px] font-medium transition-colors ${
                link.exportHandoff.status === "ready"
                  ? "bg-[#4a90b8]/10 text-[#4a90b8] hover:bg-[#4a90b8]/20"
                  : "bg-white/[0.04] text-slate-500 cursor-not-allowed"
              }`}
                disabled={link.exportHandoff.status !== "ready"}>
                {link.exportHandoff.status === "ready" ? "Export to Relativity" : "Not Ready"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Matter-to-Case Mapping</h3>
        <p className="text-[10px] text-slate-500 mb-3">All matter-to-eDiscovery case links are managed by the legal operations team. Lawyer-facing views never expose eDiscovery infrastructure or case IDs unless required for production.</p>
        <div className="flex items-center gap-2 p-2 rounded" style={{ background: "#080c14" }}>
          <Search className="w-3 h-3 text-slate-600" />
          <input placeholder="Search by matter or case number..." className="flex-1 bg-transparent text-[11px] text-slate-400 placeholder-slate-600 focus:outline-none" />
        </div>
      </div>
    </div>
  );
}
