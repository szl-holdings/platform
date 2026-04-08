import { Clock, AlertTriangle, CheckCircle, ShieldOff } from "lucide-react";
import { NY_DEMO_MATTERS } from "../../data/ny-demo-matters";

const STATUS_CONFIG = {
  breached: { color: "#c45a4a", label: "BREACHED" },
  running: { color: "#4a90b8", label: "RUNNING" },
  met: { color: "#4a90b8", label: "MET" },
  tolled: { color: "#d4a054", label: "TOLLED" },
};

export default function NyDeadlinesPage() {
  const allClocks = NY_DEMO_MATTERS.flatMap(m =>
    m.clocks.map(c => ({ ...c, matterTitle: m.title, matterId: m.id }))
  ).sort((a, b) => a.daysRemaining - b.daysRemaining);

  const NY_RULES = [
    { rule: "11 NYCRR § 65-3.3", description: "No-fault notice of claim — must be filed within 30 days of accident", consequence: "Late notice grounds for disclaimer" },
    { rule: "11 NYCRR § 65-3.5", description: "EUO / verification request — insurer must schedule within 30 days; claimant must attend", consequence: "Non-attendance triggers suspension of benefits" },
    { rule: "11 NYCRR § 65-4.2", description: "No-fault arbitration — must be filed within 3 years of denial or right is lost", consequence: "Forfeiture of no-fault recovery" },
    { rule: "Insurance Law § 3420(d)(2)", description: "Disclaimer must be issued 'as soon as reasonably possible' — typically within 30 days", consequence: "Late disclaimer is void — coverage restored" },
    { rule: "CPLR § 214", description: "3-year statute of limitations for personal injury actions in New York", consequence: "Action time-barred" },
    { rule: "CPLR § 3101", description: "Discovery obligations — full disclosure of all matter material and necessary", consequence: "Sanctions, preclusion, or default" },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">NY Statutory Clock Monitor</h1>
        </div>
        <p className="text-xs text-slate-500">{allClocks.length} clocks across {NY_DEMO_MATTERS.length} NY matters · breaches tracked in real time</p>
      </div>

      <div className="space-y-2">
        {allClocks.map((c, i) => {
          const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.running;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: cfg.color + "15" }}
                >
                  {c.status === "breached" ? (
                    <AlertTriangle className="w-4 h-4" style={{ color: cfg.color }} />
                  ) : c.status === "met" ? (
                    <CheckCircle className="w-4 h-4" style={{ color: cfg.color }} />
                  ) : (
                    <Clock className="w-4 h-4" style={{ color: cfg.color }} />
                  )}
                  {c.status === "running" && (
                    <span className="text-[9px] font-bold mt-0.5" style={{ color: cfg.color }}>{c.daysRemaining}d</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">{c.label}</span>
                      <span className="ml-2 text-[10px] text-slate-500">{c.matterTitle.split(" (")[0]}</span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-[9px] font-bold"
                      style={{ background: cfg.color + "20", color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-[10px]">
                    <div>
                      <div className="text-slate-500 mb-0.5">Started</div>
                      <div className="text-slate-300">{new Date(c.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">Deadline</div>
                      <div className="font-mono" style={{ color: cfg.color }}>{new Date(c.deadlineAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">Rule Reference</div>
                      <div className="text-[#d4a054]">{c.ruleRef}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">NY Rule Reference</h2>
        <div className="space-y-2">
          {NY_RULES.map((r, i) => (
            <div key={i} className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
              <div className="flex items-start gap-3">
                <div className="text-[11px] font-mono text-[#d4a054] flex-shrink-0 w-40">{r.rule}</div>
                <div className="flex-1">
                  <div className="text-[11px] text-slate-300 mb-0.5">{r.description}</div>
                  <div className="text-[10px] text-[#c45a4a]">Consequence: {r.consequence}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
