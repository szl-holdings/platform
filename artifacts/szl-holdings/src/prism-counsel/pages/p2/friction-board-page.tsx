import { useState } from "react";
import { Waves, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const DEMO_FRICTION = [
  { id: 1, title: "Rodriguez v. National General", frictionScore: 0.81, trend: "rising", frictionType: "insurer_posture", band: "critical", lienDrag: 0.72, readinessGaps: ["Missing wage docs", "No mediation brief"], insurerPosture: "Hostile — silent 28d", topDrivers: ["Carrier non-response", "Lien unresolved $38K", "Demand gap $55K"], recommendedAction: "Insurer escalation letter + lien negotiation push", daysBlocked: 28 },
  { id: 2, title: "Thompson v. Westfield Ins.", frictionScore: 0.73, trend: "rising", frictionType: "lien_drag", band: "critical", lienDrag: 0.85, readinessGaps: ["Medicare lien verification"], insurerPosture: "Moderate", topDrivers: ["Medicare lien $62K unresolved", "Opposing offer $80K below projection"], recommendedAction: "Prioritize Medicare lien negotiation; demand adjustment", daysBlocked: 41 },
  { id: 3, title: "Martinez v. Allstate", frictionScore: 0.64, trend: "stable", frictionType: "coverage_dispute", band: "high", lienDrag: 0.20, readinessGaps: ["Coverage confirmation pending"], insurerPosture: "Cooperative but slow", topDrivers: ["Coverage dispute unresolved", "Umbrella carrier not engaged"], recommendedAction: "File declaratory judgment motion", daysBlocked: 19 },
  { id: 4, title: "Johnson v. Progressive", frictionScore: 0.55, trend: "falling", frictionType: "documentation", band: "high", lienDrag: 0.10, readinessGaps: ["Expert report incomplete", "Lost wage verification"], insurerPosture: "Cooperative", topDrivers: ["Expert late", "Wage calc pending"], recommendedAction: "Expedite expert disclosure; complete wage calc", daysBlocked: 7 },
  { id: 5, title: "Lee v. State Farm", frictionScore: 0.48, trend: "stable", frictionType: "discovery_gap", band: "moderate", lienDrag: 0.05, readinessGaps: ["Interrogatory responses overdue"], insurerPosture: "Standard", topDrivers: ["Discovery compliance gap"], recommendedAction: "Respond to discovery this week", daysBlocked: 10 },
];

const FRICTION_TYPE_META: Record<string, { label: string; color: string }> = {
  insurer_posture: { label: "Insurer Posture", color: "#c8953c" },
  lien_drag: { label: "Lien Drag", color: "#c45a4a" },
  coverage_dispute: { label: "Coverage Dispute", color: "#8b7ac8" },
  documentation: { label: "Documentation", color: "#d4a054" },
  discovery_gap: { label: "Discovery Gap", color: "#4a90b8" },
};

const BAND_COLOR: Record<string, string> = { critical: "#c45a4a", high: "#c8953c", moderate: "#d4a054" };

function TrendIcon({ t }: { t: string }) {
  if (t === "rising") return <TrendingUp className="w-3 h-3 text-[#c45a4a]" />;
  if (t === "falling") return <TrendingDown className="w-3 h-3 text-[#4a90b8]" />;
  return <Minus className="w-3 h-3 text-slate-500" />;
}

function FrictionRow({ m }: { m: typeof DEMO_FRICTION[0] }) {
  const [expanded, setExpanded] = useState(false);
  const ft = FRICTION_TYPE_META[m.frictionType];
  const bandColor = BAND_COLOR[m.band] ?? "#d4a054";
  const pct = Math.round(m.frictionScore * 100);

  return (
    <div className="rounded border border-white/[0.06] overflow-hidden" style={{ background: "#080c14" }}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${bandColor}15`, color: bandColor }}>{pct}%</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/prism-counsel/matters/${m.id}`}><span className="text-xs font-medium text-slate-200 hover:text-[#d4a054]">{m.title}</span></Link>
            {ft && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${ft.color}15`, color: ft.color }}>{ft.label}</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-slate-500">Blocked {m.daysBlocked}d</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">{m.insurerPosture}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon t={m.trend} />
          <div className="w-20 h-1.5 bg-white/[0.06] rounded-full">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: bandColor }} />
          </div>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/[0.06] p-3 grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Top Friction Drivers</div>
            <div className="space-y-1">
              {m.topDrivers.map((d, i) => <div key={i} className="text-[10px] text-slate-400">• {d}</div>)}
            </div>
            {m.lienDrag > 0.3 && <div className="mt-2 px-2 py-1 rounded bg-[#c45a4a]/10 text-[#c45a4a] text-[9px]">Lien drag: {Math.round(m.lienDrag * 100)}%</div>}
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Readiness Gaps</div>
            <div className="space-y-1">
              {m.readinessGaps.map((g, i) => <div key={i} className="text-[10px] text-slate-400">• {g}</div>)}
            </div>
            <div className="mt-2">
              <div className="text-[9px] text-slate-600 uppercase mb-1">Recommended Action</div>
              <div className="text-[11px] text-slate-300 leading-relaxed">{m.recommendedAction}</div>
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Partner Actions</div>
            <div className="space-y-1">
              {["Escalate insurer silence", "Prioritize lien review", "Request movement memo"].map(a => (
                <button key={a} className="w-full text-left px-2 py-1 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors flex items-center gap-1">
                  <ArrowRight className="w-2.5 h-2.5" />{a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FrictionBoardPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Settlement Friction Board</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Where settlement friction is highest — insurer posture, lien drag, documentation gaps, coverage disputes</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Critical Friction", count: DEMO_FRICTION.filter(m => m.band === "critical").length, color: "#c45a4a" },
          { label: "Lien Drag", count: DEMO_FRICTION.filter(m => m.frictionType === "lien_drag").length, color: "#c8953c" },
          { label: "Insurer Posture", count: DEMO_FRICTION.filter(m => m.frictionType === "insurer_posture").length, color: "#d4a054" },
          { label: "Avg Blocked Days", count: Math.round(DEMO_FRICTION.reduce((s, m) => s + m.daysBlocked, 0) / DEMO_FRICTION.length), color: "#8b7ac8" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {DEMO_FRICTION.map(m => <FrictionRow key={m.id} m={m} />)}
      </div>
    </div>
  );
}
