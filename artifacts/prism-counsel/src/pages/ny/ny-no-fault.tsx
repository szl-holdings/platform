import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function NyNoFaultPage() {
  const noFaultMatters: Array<{ id: number; title: string; matterType: string; noFaultClaims: Array<{ claimant: string; carrier: string; dateOfLoss: string; noticeStatus: string; arbitrationStatus: string; totalBilled: number; totalPaid: number; totalDenied: number; evidenceLockRisk: number }>; verificationRequests: Array<{ type: string; requestedBy: string; suspensionTrigger: boolean; status: string; dueDate: string }>; denials: Array<{ type: string; amountDenied: number; appealStatus: string; reason: string; deniedBy: string; deniedAt: string }> }> = [];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">No-Fault Intelligence</h1>
        </div>
        <p className="text-xs text-slate-500">NY no-fault claims, bill cycles, verification requests, arbitration tracking, and evidence-lock risk</p>
      </div>

      {noFaultMatters.map(m => (
        <div key={m.id} className="space-y-3">
          <div className="text-sm font-semibold text-[#d4a054] border-b border-white/[0.06] pb-2">{m.title.split(" (")[0]}</div>

          {m.noFaultClaims.map((claim, ci) => (
            <div key={ci} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-medium text-slate-200">{claim.claimant} — No-Fault Claim</div>
                  <div className="text-[10px] text-slate-500">{claim.carrier} · Loss: {new Date(claim.dateOfLoss).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${claim.noticeStatus === "timely" ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-[#c45a4a]/10 text-[#c45a4a]"}`}>
                    NOTICE: {claim.noticeStatus.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${claim.arbitrationStatus === "not_filed" ? "bg-slate-500/10 text-slate-400" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
                    ARB: {claim.arbitrationStatus.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-3">
                {[
                  { label: "Total Billed", value: `$${(claim.totalBilled / 1000).toFixed(1)}K`, color: "#d4a054" },
                  { label: "Total Paid", value: `$${(claim.totalPaid / 1000).toFixed(1)}K`, color: "#4a90b8" },
                  { label: "Total Denied", value: `$${(claim.totalDenied / 1000).toFixed(1)}K`, color: "#c45a4a" },
                  { label: "Evidence-Lock Risk", value: String(claim.evidenceLockRisk), color: claim.evidenceLockRisk >= 70 ? "#c45a4a" : "#d4a054" },
                ].map((stat, si) => (
                  <div key={si}>
                    <div className="text-[10px] text-slate-500 mb-0.5">{stat.label}</div>
                    <div className="text-lg font-mono" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {m.verificationRequests.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Verification Requests</div>
                  <div className="space-y-1.5">
                    {m.verificationRequests.map((vr, vri) => (
                      <div key={vri} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${vr.status === "completed" ? "bg-[#4a90b8]" : vr.suspensionTrigger ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
                        <div className="flex-1">
                          <span className="text-[11px] text-slate-300">{vr.type.toUpperCase()}</span>
                          <span className="mx-2 text-slate-600">·</span>
                          <span className="text-[10px] text-slate-500">Requested by {vr.requestedBy}</span>
                          {vr.suspensionTrigger && <span className="ml-2 text-[9px] text-[#c45a4a]">SUSPENSION TRIGGER</span>}
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${vr.status === "completed" ? "bg-[#4a90b8]/10 text-[#4a90b8]" : vr.status === "scheduled" ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-slate-500/10 text-slate-400"}`}>
                          {vr.status.toUpperCase()}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">Due: {new Date(vr.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {m.denials.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Denials on Record</div>
                  <div className="space-y-1.5">
                    {m.denials.map((d, di) => (
                      <div key={di} className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="text-[11px] text-slate-300">{d.type.replace(/_/g, " ").toUpperCase()} — ${(d.amountDenied / 1000).toFixed(1)}K denied</div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${d.appealStatus === "filed" ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-slate-500/10 text-slate-400"}`}>
                            Appeal: {d.appealStatus.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{d.reason}</div>
                        <div className="text-[10px] text-slate-600">{d.deniedBy} · {new Date(d.deniedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {noFaultMatters.length === 0 && (
        <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No no-fault matter data</p>
          <p className="text-xs text-slate-600 mt-1">Connect NY matter data with no-fault claims to populate this view.</p>
        </div>
      )}
    </div>
  );
}
