import { ShieldOff, AlertTriangle, CheckCircle } from "lucide-react";
import { NY_DEMO_MATTERS } from "../../data/ny-demo-matters";

export default function NyCoveragePage() {
  const DISCLAIMER_RULES = [
    {
      rule: "Insurance Law § 3420(d)(2)",
      description: "Disclaimer must be issued as soon as reasonably possible after learning of the grounds. Courts have held 30 days is presumptively untimely for straight-forward claims.",
      consequence: "Late disclaimer is void as matter of law — coverage is restored",
    },
    {
      rule: "Reservation of Rights",
      description: "If carrier defends under a ROR, they must simultaneously disclaim coverage they do not intend to provide. Failure to simultaneously disclaim triggers estoppel.",
      consequence: "Carrier may be estopped from later disclaiming",
    },
    {
      rule: "Exclusion Specificity",
      description: "Policy exclusions must be specific, clear, and unambiguous. Ambiguous exclusions are construed against the insurer in New York.",
      consequence: "Ambiguous exclusion = coverage affirmed",
    },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldOff className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Coverage & Disclaimer Intelligence</h1>
        </div>
        <p className="text-xs text-slate-500">Disclaimer timeliness analysis, coverage positions, denial patterns, vulnerability scoring, and bad faith indicators</p>
      </div>

      {NY_DEMO_MATTERS.map(m => (
        <div key={m.id} className="space-y-3">
          <div className="text-sm font-medium text-[#d4a054] border-b border-white/[0.06] pb-2">{m.title.split(" (")[0]}</div>

          {m.disclaimers.length > 0 ? (
            m.disclaimers.map((d, di) => (
              <div key={di} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Disclaimer Analysis</div>
                    <div className="text-[10px] text-slate-500">{d.issuedBy} · Issued: {new Date(d.issuedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="px-3 py-1 rounded text-sm font-bold"
                      style={{ background: "#c45a4a20", color: "#c45a4a" }}
                    >
                      Vuln Score: {d.vulnerabilityScore}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] ${d.isTimely ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-[#c45a4a]/10 text-[#c45a4a] font-bold"}`}>
                      {d.isTimely ? "TIMELY" : "UNTIMELY"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5">Days From Loss</div>
                    <div className="text-lg font-mono" style={{ color: d.daysFromLoss > 30 ? "#c45a4a" : "#4a90b8" }}>{d.daysFromLoss}d</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5">Challenge Status</div>
                    <div className="text-sm font-medium text-[#d4a054]">{d.challengeStatus.replace("_", " ").toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5">Exclusion Basis</div>
                    <div className="text-[11px] text-slate-300">{d.basis}</div>
                  </div>
                </div>

                <div className="rounded border border-[#c45a4a]/20 p-2.5" style={{ background: "#140a0a" }}>
                  <div className="text-[10px] font-medium text-[#c45a4a] mb-1">Challenge Position</div>
                  <div className="text-[10px] text-slate-400">
                    Disclaimer issued {d.daysFromLoss} days after loss — presumptively untimely under NY Insurance Law § 3420(d)(2).
                    {!d.isTimely && " A late disclaimer is void as a matter of law under NY precedent. Coverage must be restored pending challenge."}
                    {d.vulnerabilityScore >= 80 && " The underlying exclusion language is ambiguous and likely to be construed in plaintiff's favor."}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="text-[11px] text-slate-500">No disclaimer on record for this matter.</div>
              {m.noFaultClaims.length > 0 && m.denials.length > 0 && (
                <div className="text-[10px] text-slate-600 mt-1">{m.denials.length} no-fault denials on file — see No-Fault page for denial analysis</div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">NY Coverage Disclaimer Framework</h2>
        <div className="space-y-2">
          {DISCLAIMER_RULES.map((r, i) => (
            <div key={i} className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
              <div className="flex items-start gap-3">
                <div className="text-[11px] font-mono text-[#d4a054] flex-shrink-0 w-44">{r.rule}</div>
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
