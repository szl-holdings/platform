import { useState } from "react";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, ArrowRight, Users, Clock } from "lucide-react";
import { Link } from "wouter";

type PressureMatter = { id: number; title: string; team: string; pressure: number; trend: string; status: string; band: string; topDrivers: string[]; recommendedAction: string; owner: string; blocker: string; confidence: number };
const DEMO_MATTERS: PressureMatter[] = [];

const BAND_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "#c45a4a", bg: "#c45a4a15" },
  high: { label: "High", color: "#c8953c", bg: "#c8953c15" },
  moderate: { label: "Moderate", color: "#d4a054", bg: "#d4a05415" },
  low: { label: "Low", color: "#4a90b8", bg: "#4a90b815" },
};

function TrendIcon({ t }: { t: string }) {
  if (t === "rising") return <TrendingUp className="w-3 h-3 text-[#c45a4a]" />;
  if (t === "falling") return <TrendingDown className="w-3 h-3 text-[#4a90b8]" />;
  return <Minus className="w-3 h-3 text-slate-500" />;
}

function MatterRow({ m }: { m: PressureMatter }) {
  const [expanded, setExpanded] = useState(false);
  const band = BAND_CONFIG[m.band] ?? BAND_CONFIG.moderate;
  const pct = Math.round(m.pressure * 100);

  return (
    <div className="rounded border border-white/[0.06] overflow-hidden" style={{ background: "#080c14" }}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: band.bg, color: band.color }}>{pct}%</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/prism-counsel/matters/${m.id}`}><span className="text-xs font-medium text-slate-200 hover:text-[#d4a054]">{m.title}</span></Link>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: band.bg, color: band.color }}>{band.label}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-slate-500">{m.team}</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">{m.status.replace("_", " ")}</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">{m.blocker}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon t={m.trend} />
          <div className="w-20 h-1.5 bg-white/[0.06] rounded-full">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: band.color }} />
          </div>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/[0.06] p-3 grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Top Drivers</div>
            <div className="space-y-1">
              {m.topDrivers.map((d, i) => <div key={i} className="text-[10px] text-slate-400">• {d}</div>)}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Recommended Action</div>
            <div className="text-[11px] text-slate-300 leading-relaxed">{m.recommendedAction}</div>
            <div className="flex items-center gap-1 mt-1.5">
              <Users className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500">{m.owner}</span>
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Partner Actions</div>
            <div className="space-y-1">
              {["Escalate matter", "Request partner memo", "Reassign review"].map(a => (
                <button key={a} className="w-full text-left px-2 py-1 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors flex items-center gap-1">
                  <ArrowRight className="w-2.5 h-2.5" />{a}
                </button>
              ))}
            </div>
            <div className="text-[9px] text-slate-600 mt-1.5">Conf: {Math.round(m.confidence * 100)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PilotTwoPressureBoardPage() {
  const [filterBand, setFilterBand] = useState<string>("all");

  const displayed = filterBand === "all" ? DEMO_MATTERS : DEMO_MATTERS.filter(m => m.band === filterBand);

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#c45a4a]" />
            <h1 className="text-lg font-semibold text-slate-100">Portfolio Pressure Board</h1>
            <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20">LIVE</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Every matter scored, ranked, trended — with recommended management action</p>
        </div>
        <div className="flex items-center gap-2">
          {["all", "critical", "high", "moderate"].map(b => (
            <button key={b} onClick={() => setFilterBand(b)} className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${filterBand === b ? "bg-white/[0.08] text-slate-200" : "text-slate-500 hover:text-slate-300"}`}>
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Critical", count: DEMO_MATTERS.filter(m => m.band === "critical").length, color: "#c45a4a" },
          { label: "High", count: DEMO_MATTERS.filter(m => m.band === "high").length, color: "#c8953c" },
          { label: "Moderate", count: DEMO_MATTERS.filter(m => m.band === "moderate").length, color: "#d4a054" },
          { label: "Rising", count: DEMO_MATTERS.filter(m => m.trend === "rising").length, color: "#c45a4a" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {displayed.map(m => <MatterRow key={m.id} m={m} />)}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-3.5 h-3.5 text-[#d4a054]" />
          <span className="text-xs font-medium text-slate-300">About the Pressure Board</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Pressure scores aggregate 12 dimensions: deadline urgency, insurer behavior, adjuster dynamics, coverage gaps, venue velocity, medical trajectory, damages completeness, settlement posture, weather context, evidence sufficiency, communication cadence, and governance state. Scores are recomputed daily or on significant signal changes.
        </p>
      </div>
    </div>
  );
}
