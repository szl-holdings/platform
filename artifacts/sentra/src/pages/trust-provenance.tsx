import { Lock, ShieldCheck, FileText, Activity } from "lucide-react";

export default function TrustProvenance() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-100">Trust & Provenance</h1>
        <p className="text-slate-400 mt-1">Evidence-backed decision audit trail and policy verification</p>
      </header>

      <div className="space-y-4">
        {[
          { action: "OT-Segment Isolation", actor: "CISO (Admin)", time: "2h ago", status: "VERIFIED" },
          { action: "Ransomware Payload Detection", actor: "Signal Mesh", time: "4h ago", status: "VERIFIED" },
          { action: "Control Drift Alert: Respond", actor: "System Engine", time: "12h ago", status: "VERIFIED" },
        ].map((item, i) => (
          <div key={i} className="sentra-panel p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-200">{item.action}</div>
                <div className="text-xs text-slate-500 font-mono">ACTOR: {item.actor} · {item.time}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <FileText className="w-3 h-3" />
                PROOF-HASH: 0x8d1e...a290
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold">
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
