import { useState } from "react";
import { Brain, Sparkles, TrendingUp, Shield, Activity, DollarSign, ChevronDown } from "lucide-react";
import { demoRecommendations } from "@lyte/lib/demo-seed";

const BG = { surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.06)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };

const CAT_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  revenue: { icon: DollarSign, color: "#6b8f71", label: "Revenue" },
  risk_mitigation: { icon: Shield, color: "#c45a4a", label: "Risk Mitigation" },
  operational: { icon: Activity, color: "#4a90b8", label: "Operational" },
  compliance: { icon: Shield, color: "#8b7ac8", label: "Compliance" },
  growth: { icon: TrendingUp, color: "#d4a054", label: "Growth" },
};

const IMPACT: Record<string, string> = { high: "#c45a4a", medium: "#c8953c", low: "#d4a054" };
const CONF: Record<string, string> = { high: "#6b8f71", medium: "#d4a054", low: "#c8953c" };
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  pending: { color: "#c8953c", bg: "rgba(200,149,60,0.08)" },
  accepted: { color: "#6b8f71", bg: "rgba(107,143,113,0.08)" },
  dismissed: { color: TEXT.muted as string, bg: "rgba(255,255,255,0.04)" },
  in_progress: { color: "#d4a054", bg: "rgba(212,160,84,0.08)" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function RecommendationCard({ rec }: { rec: typeof demoRecommendations[0] }) {
  const [open, setOpen] = useState(false);
  const cat = CAT_META[rec.category];
  const Icon = cat.icon;
  const confColor = CONF[rec.confidence];
  const impactColor = IMPACT[rec.impact];
  const statusStyle = STATUS_COLORS[rec.status];

  return (
    <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
      <div className="h-px" style={{ background: `linear-gradient(90deg, ${cat.color}, transparent)` }} />
      <div className="px-4 py-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}25` }}>
            <Icon className="w-4 h-4" style={{ color: cat.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <span className="text-[12px] font-semibold leading-snug" style={{ color: TEXT.primary }}>{rec.title}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-[8px] uppercase tracking-wider font-medium" style={{ color: cat.color }}>{cat.label}</span>
              <span className="text-[8px] px-1.5 py-px rounded" style={{ color: impactColor, background: `${impactColor}10`, border: `1px solid ${impactColor}20` }}>
                {rec.impact.toUpperCase()} IMPACT
              </span>
              <span className="text-[8px] px-1.5 py-px rounded" style={{ color: rec.status === "in_progress" ? "#d4a054" : TEXT.muted, background: statusStyle.bg, border: `1px solid rgba(255,255,255,0.08)` }}>
                {rec.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1">
                <div className="flex-1 h-1 rounded-full overflow-hidden max-w-[80px]" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${rec.confidenceScore}%`, background: confColor }} />
                </div>
                <span className="text-[8px] font-mono shrink-0" style={{ color: confColor }}>{rec.confidenceScore}% confidence</span>
              </div>
              <span className="text-[10px] font-mono font-bold shrink-0" style={{ color: "#6b8f71" }}>{fmt(rec.valueEstimate)} est. value</span>
              <span className="text-[9px] shrink-0" style={{ color: TEXT.muted }}>Owner: {rec.owner}</span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 shrink-0 mt-1 transition-transform" style={{ color: TEXT.muted, transform: open ? "rotate(180deg)" : "none" }} />
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 border-t space-y-4" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="pt-3">
            <div className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: TEXT.muted }}>AI Reasoning</div>
            <p className="text-[11px] leading-relaxed" style={{ color: TEXT.secondary }}>{rec.reasoning}</p>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: TEXT.muted }}>Supporting Evidence</div>
            <ul className="space-y-1">
              {rec.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-[10px]" style={{ color: TEXT.secondary }}>
                  <span className="shrink-0 mt-0.5" style={{ color: cat.color }}>·</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded px-3 py-2.5" style={{ background: `${cat.color}08`, border: `1px solid ${cat.color}20` }}>
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: cat.color }}>Suggested Action</div>
            <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>{rec.suggestedAction}</p>
          </div>
          <div className="flex gap-2">
            <button className="text-[10px] px-3 py-1.5 rounded border font-medium" style={{ color: "#6b8f71", background: "rgba(107,143,113,0.1)", borderColor: "rgba(107,143,113,0.25)" }}>Accept</button>
            <button className="text-[10px] px-3 py-1.5 rounded border font-medium" style={{ color: "#d4a054", background: "rgba(212,160,84,0.1)", borderColor: "rgba(212,160,84,0.25)" }}>Assign Owner</button>
            <button className="text-[10px] px-3 py-1.5 rounded border" style={{ color: TEXT.muted, background: "transparent", borderColor: BORDER.subtle }}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DemoRecommendationsPage() {
  const [catFilter, setCatFilter] = useState("all");

  const filtered = catFilter === "all"
    ? demoRecommendations
    : demoRecommendations.filter(r => r.category === catFilter);

  const highConfidence = demoRecommendations.filter(r => r.confidence === "high").length;
  const totalValue = demoRecommendations.reduce((a, r) => a + r.valueEstimate, 0);

  return (
    <div className="p-4 max-w-[1000px] space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Brain className="w-3.5 h-3.5" style={{ color: "#8b7ac8" }} />
            <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#8b7ac8" }}>Lyte · AI Engine</span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>AI Recommendations</h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>Action recommendations with confidence scores, reasoning, and explainability context</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full" style={{ color: "#8b7ac8", background: "rgba(139,122,200,0.1)", border: "1px solid rgba(139,122,200,0.2)" }}>
            <Sparkles className="w-2.5 h-2.5" />
            {highConfidence} high confidence
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Recommendations", value: demoRecommendations.length, color: "#8b7ac8" },
          { label: "High Confidence", value: highConfidence, color: "#6b8f71" },
          { label: "Est. Total Value", value: fmt(totalValue), color: "#d4a054" },
        ].map(c => (
          <div key={c.label} className="rounded-md p-3" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>{c.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {["all", "revenue", "risk_mitigation", "operational", "growth"].map(f => {
          const cat = CAT_META[f];
          return (
            <button key={f} onClick={() => setCatFilter(f)}
              className="text-[9px] px-2.5 py-1 rounded border capitalize transition-all"
              style={{
                color: catFilter === f ? (cat?.color ?? "#d4a054") : TEXT.muted,
                background: catFilter === f ? `${cat?.color ?? "#d4a054"}12` : "transparent",
                borderColor: catFilter === f ? `${cat?.color ?? "#d4a054"}25` : BORDER.subtle,
              }}>{f === "all" ? "All" : cat.label}</button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map(rec => <RecommendationCard key={rec.id} rec={rec} />)}
      </div>
    </div>
  );
}
