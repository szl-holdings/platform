import { ShieldOff, AlertTriangle, CheckCircle } from "lucide-react";

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

      <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
        <ShieldOff className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-400">No disclaimer data</p>
        <p className="text-xs text-slate-600 mt-1">Connect NY matter data with disclaimer records to populate this analysis.</p>
      </div>

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
