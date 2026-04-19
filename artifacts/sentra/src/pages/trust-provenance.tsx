import { Lock, ShieldCheck, FileText, Activity, Bot } from "lucide-react";

const PROOF_ENTRIES = [
  { action: "OT-Segment Isolation", actor: "CISO (Admin)", time: "2h ago", status: "VERIFIED", tag: "ot-response" },
  { action: "Ransomware Payload Detection", actor: "Signal Mesh", time: "4h ago", status: "VERIFIED", tag: "threat-detect" },
  { action: "Control Drift Alert: Respond", actor: "System Engine", time: "12h ago", status: "VERIFIED", tag: "control-drift" },
  { action: "Agent Mesh: GITHUB_TOKEN Exposure Detected", actor: "Mesh Engine", time: "5m ago", status: "VERIFIED", tag: "agent-mesh", highlight: true },
  { action: "Agent Mesh: ext-scraper-v2 Quarantine Fix Submitted", actor: "CISO (Admin)", time: "3m ago", status: "PENDING", tag: "agent-mesh", highlight: true },
  { action: "Agent Mesh: Containment Rule Violation — Codex CLI", actor: "Mesh Engine", time: "2h ago", status: "VERIFIED", tag: "agent-mesh", highlight: true },
  { action: "Agent Mesh: Mesh Drift — CLAUDE.md Unapproved Change", actor: "Mesh Engine", time: "5h ago", status: "VERIFIED", tag: "agent-mesh", highlight: true },
];

export default function TrustProvenance() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-100">Trust & Provenance</h1>
        <p className="text-slate-400 mt-1">Evidence-backed decision audit trail and policy verification</p>
      </header>

      <div className="flex gap-3 text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          VERIFIED
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          PENDING
        </div>
        <div className="flex items-center gap-1.5">
          <Bot className="w-3 h-3 text-sky-400" />
          AGENT MESH
        </div>
      </div>

      <div className="space-y-3">
        {PROOF_ENTRIES.map((item, i) => (
          <div
            key={i}
            className={`sentra-panel p-4 flex items-center justify-between ${item.highlight ? "border-sky-500/20" : ""}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded flex items-center justify-center ${item.highlight ? "bg-sky-500/10" : "bg-emerald-500/10"}`}>
                {item.highlight ? (
                  <Bot className="w-5 h-5 text-sky-400" />
                ) : (
                  <Lock className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-200">{item.action}</div>
                <div className="text-xs text-slate-500 font-mono">
                  ACTOR: {item.actor} · {item.time}
                  {item.highlight && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] uppercase">
                      agent-mesh
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <FileText className="w-3 h-3" />
                PROOF-HASH: 0x{(Math.abs(i * 7 + 13) * 0xdeadbeef).toString(16).slice(0, 4)}...{(Math.abs(i * 3 + 7) * 0xcafe).toString(16).slice(0, 4)}
              </div>
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${item.status === "VERIFIED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
