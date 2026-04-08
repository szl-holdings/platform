import { useState } from "react";
import { FileText, Play, Check, Clock, Loader2, ArrowRight, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

const DIGEST_TYPES = [
  { key: "weekly_partner", label: "Weekly Partner Digest", description: "Full portfolio summary — pressure, friction, movements, team throughput, top actions", schedule: "Every Monday 7:00 AM", color: "#d4a054" },
  { key: "high_pressure", label: "High-Pressure Digest", description: "All critical and high-pressure matters — what is rising, why, and what to do today", schedule: "Daily when critical count > 3", color: "#c45a4a" },
  { key: "movement_opportunity", label: "Movement Opportunity Digest", description: "Matters closest to meaningful movement — insurer softening, evidence complete, mediation ready", schedule: "Weekly Wednesday", color: "#4a90b8" },
  { key: "bottleneck", label: "Bottleneck Digest", description: "Review backlog, approval bottlenecks, and sign-off queue — where the firm is losing time", schedule: "Every Tuesday, Thursday", color: "#8b7ac8" },
  { key: "insurer_drag", label: "Insurer Drag Digest", description: "Carrier cohort analysis — silence patterns, reserve behavior, offer trajectory across all matters", schedule: "Every Friday", color: "#c8953c" },
  { key: "recovery_lien_drag", label: "Recovery / Lien Drag Digest", description: "All open liens by type, drag score, days pending — which lien is blocking what settlement", schedule: "Weekly Thursday", color: "#d4a054" },
];

const DEMO_RECENT_RUNS = [
  { digestType: "weekly_partner", status: "complete", completedAt: "Apr 7, 2026 7:03 AM", matterCount: 47, highlights: ["8 critical matters", "Team throughput: Chen/Williams leads at 91%", "3 high-opportunity movement matters identified"] },
  { digestType: "high_pressure", status: "complete", completedAt: "Apr 6, 2026 8:15 AM", matterCount: 22, highlights: ["Rodriguez rising +6%", "Thompson insurer silent 28d", "2 new critical matters this week"] },
  { digestType: "movement_opportunity", status: "complete", completedAt: "Apr 2, 2026 7:00 AM", matterCount: 9, highlights: ["Chen v. GEICO: insurer softening detected", "Rodriguez: demand ready", "Thompson: mediation booked"] },
];

function DigestCard({ dtype }: { dtype: typeof DIGEST_TYPES[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const recentRun = DEMO_RECENT_RUNS.find(r => r.digestType === dtype.key);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="rounded-lg border border-white/[0.06] overflow-hidden" style={{ background: "#0c1220" }}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4" style={{ color: dtype.color }} />
              <span className="text-sm font-semibold text-slate-200">{dtype.label}</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">{dtype.description}</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium transition-colors disabled:opacity-50"
            style={{ background: `${dtype.color}15`, color: dtype.color, border: `1px solid ${dtype.color}30` }}
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-600" />
            <span className="text-[9px] text-slate-500">{dtype.schedule}</span>
          </div>
          {recentRun && (
            <div className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-[#4a90b8]" />
              <span className="text-[9px] text-slate-500">Last: {recentRun.completedAt}</span>
            </div>
          )}
        </div>
      </div>

      {recentRun && (
        <>
          <div className="px-4 pb-2">
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-slate-300 transition-colors">
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Last digest highlights
            </button>
          </div>
          {expanded && (
            <div className="border-t border-white/[0.04] px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-[#8b7ac8]" />
                <span className="text-[9px] text-[#8b7ac8] font-mono">LAST DIGEST — {recentRun.matterCount} matters</span>
              </div>
              <div className="space-y-1">
                {recentRun.highlights.map((h, i) => <div key={i} className="text-[10px] text-slate-400">• {h}</div>)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PortfolioDigestsPage() {
  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Portfolio Digests</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">6 digest types — scheduled generation with highlights, recommended actions, and matter-level drill-down</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DIGEST_TYPES.map(dtype => <DigestCard key={dtype.key} dtype={dtype} />)}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-300 mb-2">Digest Delivery</h3>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Digests are generated automatically on schedule or on-demand. Each digest incorporates portfolio snapshot data, matter twin states, pressure scores, and Worldline signals. Digest content is source-grounded with full Proof Chain traceability, requires attorney sign-off before external delivery, and is logged in the audit trail.
        </p>
      </div>
    </div>
  );
}
