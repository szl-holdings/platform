import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Target, TrendingDown, DollarSign, Clock, AlertTriangle,
  ChevronRight, X, BarChart3, Activity, ArrowUpRight, Users,
  Zap, Shield, CheckCircle, Info, Loader2, Sliders
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

type AcceptanceCategory = "very-likely" | "likely" | "possible" | "unlikely";

interface MotivationFactor {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  weight: number;
  description: string;
}

interface SellerProfile {
  id: string;
  address: string;
  neighborhood: string;
  ownerName: string;
  ownerType: "individual" | "LLC" | "estate" | "institutional";
  debtLoad: number;
  estimatedEquity: number;
  daysInDistress: number;
  priorOffers: number;
  listingExpiry: string | null;
  acceptanceScore: number;
  acceptanceCategory: AcceptanceCategory;
  suggestedDiscount: number;
  factors: MotivationFactor[];
  aiInsight: string;
  comparableAcceptances: number;
}

const CATEGORY_META: Record<AcceptanceCategory, { label: string; color: string; bg: string; description: string }> = {
  "very-likely": { label: "Very Likely", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", description: "Strong motivation indicators — aggressive offer warranted" },
  "likely": { label: "Likely", color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20", description: "Multiple positive signals — below-market offer viable" },
  "possible": { label: "Possible", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", description: "Mixed signals — relationship-building approach recommended" },
  "unlikely": { label: "Unlikely", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", description: "Seller has leverage — full-price or near-market required" },
};

const SELLERS: SellerProfile[] = [
  {
    id: "s-001", address: "211 Liberty Ave", neighborhood: "East New York",
    ownerName: "Liberty RE Holdings LLC", ownerType: "LLC",
    debtLoad: 920_000, estimatedEquity: 180_000, daysInDistress: 127, priorOffers: 0,
    listingExpiry: null, acceptanceScore: 92, acceptanceCategory: "very-likely",
    suggestedDiscount: 28, comparableAcceptances: 7,
    aiInsight: "LLC in dissolution with cascading debt. Owner has no equity cushion and foreclosure is imminent. A cash offer with 15-day close will likely be accepted well below market. Comparable distress exits in this zip suggest 25-32% discount range.",
    factors: [
      { factor: "Tax delinquency severity", impact: "positive", weight: 0.92, description: "5 quarters unpaid — In Rem foreclosure imminent" },
      { factor: "LLC dissolution filing", impact: "positive", weight: 0.87, description: "Entity unwinding — principals motivated to liquidate" },
      { factor: "Days in distress", impact: "positive", weight: 0.81, description: "127 days — psychological exhaustion threshold exceeded" },
      { factor: "Equity position", impact: "positive", weight: 0.76, description: "Only $180K equity — can close at significant discount" },
      { factor: "No prior offer history", impact: "neutral", weight: 0.5, description: "No competing offers detected — no anchoring upward" },
      { factor: "Multiple code violations", impact: "positive", weight: 0.68, description: "HPD emergency order adding pressure to resolve" },
    ],
  },
  {
    id: "s-002", address: "1847 Myrtle Ave", neighborhood: "Bushwick",
    ownerName: "Myrtle Holdings LLC", ownerType: "LLC",
    debtLoad: 1_420_000, estimatedEquity: 430_000, daysInDistress: 87, priorOffers: 1,
    listingExpiry: "2026-05-30", acceptanceScore: 74, acceptanceCategory: "likely",
    suggestedDiscount: 18, comparableAcceptances: 12,
    aiInsight: "Motivated LLC with debt load at 77% LTV on declining NOI. One prior offer rejected — likely too low. Current window is a second approach at a 15-20% discount framed as certainty of execution vs. foreclosure risk. 60-day close preferred.",
    factors: [
      { factor: "Debt-to-equity ratio", impact: "positive", weight: 0.79, description: "77% LTV — high leverage amplifies distress" },
      { factor: "Utility disconnections", impact: "positive", weight: 0.71, description: "Service interruptions — operational failure underway" },
      { factor: "Code violations", impact: "positive", weight: 0.65, description: "Compounding liability risk motivating exit" },
      { factor: "Prior rejected offer", impact: "negative", weight: 0.42, description: "One offer rejected — may have higher reservation price" },
      { factor: "Listing expiry approaching", impact: "positive", weight: 0.69, description: "Agent contract expiring — increased willingness to deal direct" },
      { factor: "Equity buffer", impact: "negative", weight: 0.38, description: "$430K equity gives seller patience — not desperate" },
    ],
  },
  {
    id: "s-003", address: "392 Nostrand Ave", neighborhood: "Crown Heights",
    ownerName: "Crown Cap Partners", ownerType: "LLC",
    debtLoad: 1_890_000, estimatedEquity: 510_000, daysInDistress: 64, priorOffers: 2,
    listingExpiry: "2026-06-15", acceptanceScore: 61, acceptanceCategory: "possible",
    suggestedDiscount: 12, comparableAcceptances: 4,
    aiInsight: "Mixed motivation. Substantial equity creates patience, but permit liability ($240K) and LLC restructuring create urgency vectors. Two prior offers suggest an active market — differentiate on certainty and speed rather than just price.",
    factors: [
      { factor: "Permit lapse liability", impact: "positive", weight: 0.72, description: "$240K exposed construction liability — growing pressure" },
      { factor: "LLC restructuring", impact: "positive", weight: 0.66, description: "Manager transfers suggest entity stress" },
      { factor: "Tax delinquency", impact: "positive", weight: 0.64, description: "Lien filing imminent per DOF schedule" },
      { factor: "Strong equity position", impact: "negative", weight: 0.61, description: "$510K equity — seller can afford to wait" },
      { factor: "Prior offer competition", impact: "negative", weight: 0.55, description: "2 prior offers — seller has leverage & precedent" },
      { factor: "Days in distress", impact: "neutral", weight: 0.44, description: "64 days — early enough that patience remains" },
    ],
  },
  {
    id: "s-004", address: "78 Covert St", neighborhood: "Ridgewood",
    ownerName: "Covert Street Partners", ownerType: "LLC",
    debtLoad: 980_000, estimatedEquity: 640_000, daysInDistress: 30, priorOffers: 3,
    listingExpiry: "2026-07-01", acceptanceScore: 34, acceptanceCategory: "unlikely",
    suggestedDiscount: 5, comparableAcceptances: 1,
    aiInsight: "Seller has substantial equity and strong Ridgewood market tailwinds. Three prior offers demonstrate active demand at or near market. Below-market offer will likely be rejected. Monitor for 90 days — if NOD escalates, motivation will shift significantly.",
    factors: [
      { factor: "Equity position", impact: "negative", weight: 0.82, description: "$640K equity — no pressure to discount" },
      { factor: "Strong market trajectory", impact: "negative", weight: 0.78, description: "Ridgewood accelerating — time is on seller's side" },
      { factor: "Multiple competing offers", impact: "negative", weight: 0.74, description: "3 prior offers — seller knows market value" },
      { factor: "Early distress stage", impact: "negative", weight: 0.61, description: "Only 30 days in distress — psychology intact" },
      { factor: "Partial utility disruption", impact: "positive", weight: 0.32, description: "Minor cashflow signal — not yet motivating" },
      { factor: "Lender NOD issued", impact: "positive", weight: 0.48, description: "Notice of default — escalating timeline if not resolved" },
    ],
  },
  {
    id: "s-005", address: "5519 Flatlands Ave", neighborhood: "East Flatbush",
    ownerName: "Eugene Watts", ownerType: "individual",
    debtLoad: 640_000, estimatedEquity: 250_000, daysInDistress: 45, priorOffers: 0,
    listingExpiry: null, acceptanceScore: 67, acceptanceCategory: "likely",
    suggestedDiscount: 15, comparableAcceptances: 3,
    aiInsight: "Individual owner-occupant facing gas disconnection and code violations. Personal hardship signals are strong — utility shutoff in a residential context suggests payment inability. A compassionate direct outreach with a fair offer may be well-received.",
    factors: [
      { factor: "Gas service terminated", impact: "positive", weight: 0.81, description: "Owner-occupant hardship — personal motivation strong" },
      { factor: "Code violations accumulating", impact: "positive", weight: 0.68, description: "Remediation cost exceeding owner capacity" },
      { factor: "Individual owner psychology", impact: "positive", weight: 0.64, description: "No institutional sophistication — simpler negotiation" },
      { factor: "No prior offers", impact: "neutral", weight: 0.5, description: "No market anchoring — clean slate for negotiation" },
      { factor: "Declining neighborhood", impact: "positive", weight: 0.55, description: "East Flatbush declining — owner aware of trajectory" },
      { factor: "Some equity cushion", impact: "negative", weight: 0.41, description: "$250K equity provides some patience" },
    ],
  },
];

function formatCurrency(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#38bdf8" : score >= 40 ? "#fbbf24" : "#f87171";
  const angle = (score / 100) * 180 - 90;
  const r = 38;
  const cx = 52, cy = 52;
  const startAngle = -180 * (Math.PI / 180);
  const endAngle = (angle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = score > 50 ? 1 : 0;
  return (
    <div className="flex flex-col items-center">
      <svg width={104} height={60} viewBox="0 0 104 60">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight="bold" fill={color}>{score}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.3)">/ 100</text>
      </svg>
    </div>
  );
}

function FactorBar({ factor }: { factor: MotivationFactor }) {
  const color = factor.impact === "positive" ? "#34d399" : factor.impact === "negative" ? "#f87171" : "#94a3b8";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-white/60 flex-1">{factor.factor}</span>
        <span className="text-[10px] font-bold flex-shrink-0" style={{ color }}>{(factor.weight * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full">
        <div className="h-1 rounded-full" style={{ width: `${factor.weight * 100}%`, background: color }} />
      </div>
      <p className="text-[10px] text-white/30">{factor.description}</p>
    </div>
  );
}

function SellerCard({ seller, selected, onClick }: { seller: SellerProfile; selected: boolean; onClick: () => void }) {
  const meta = CATEGORY_META[seller.acceptanceCategory];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border cursor-pointer transition-all duration-200",
        selected ? "bg-white/4 border-white/15" : "bg-[#0f1115] border-white/5 hover:border-white/10"
      )}
    >
      <div className="flex items-start gap-4">
        <ScoreGauge score={seller.acceptanceScore} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">{seller.address}</p>
              <p className="text-xs text-white/40 mt-0.5">{seller.neighborhood} · {seller.ownerType === "individual" ? "Individual Owner" : seller.ownerName}</p>
            </div>
            <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold flex-shrink-0", meta.bg)}>
              <span className={meta.color}>{meta.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-xs"><span className="text-white/30">Debt: </span><span className="text-white/70">{formatCurrency(seller.debtLoad)}</span></div>
            <div className="text-xs"><span className="text-white/30">Equity: </span><span className="text-white/70">{formatCurrency(seller.estimatedEquity)}</span></div>
            <div className="text-xs"><span className="text-white/30">Days: </span><span className="text-white/70">{seller.daysInDistress}d</span></div>
            <div className="text-xs"><span className="text-[#40856a]">−{seller.suggestedDiscount}% target</span></div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

function DetailPanel({ seller, onClose }: { seller: SellerProfile; onClose: () => void }) {
  const meta = CATEGORY_META[seller.acceptanceCategory];
  const positiveFactors = seller.factors.filter(f => f.impact === "positive").length;
  const negativeFactors = seller.factors.filter(f => f.impact === "negative").length;

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      className="flex flex-col bg-[#0a0c10] border-l border-white/6 overflow-hidden"
      style={{ width: 420, flexShrink: 0 }}
    >
      <div className="p-5 border-b border-white/6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">{seller.address}</h3>
            <p className="text-xs text-white/40">{seller.neighborhood}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <ScoreGauge score={seller.acceptanceScore} />
          <div>
            <div className={cn("px-2 py-1 rounded border text-xs font-semibold", meta.bg, meta.color)}>{meta.label}</div>
            <p className="text-[10px] text-white/40 mt-1 max-w-[200px]">{meta.description}</p>
          </div>
        </div>
      </div>

      <div className="p-5 border-b border-white/6">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">AI Motivation Analysis</p>
        <p className="text-xs text-white/60 leading-relaxed">{seller.aiInsight}</p>
      </div>

      <div className="p-5 border-b border-white/6">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Debt Load", value: formatCurrency(seller.debtLoad), color: "text-white/80" },
            { label: "Est. Equity", value: formatCurrency(seller.estimatedEquity), color: "text-white/80" },
            { label: "Days in Distress", value: `${seller.daysInDistress}d`, color: "text-amber-400" },
            { label: "Prior Offers", value: seller.priorOffers.toString(), color: "text-white/80" },
            { label: "Suggested Discount", value: `−${seller.suggestedDiscount}%`, color: "text-[#40856a]" },
            { label: "Comp Acceptances", value: `${seller.comparableAcceptances} similar deals`, color: "text-sky-400" },
          ].map(m => (
            <div key={m.label} className="bg-white/3 border border-white/5 rounded-lg p-2.5">
              <p className="text-[9px] text-white/30">{m.label}</p>
              <p className={cn("text-sm font-bold mt-0.5", m.color)}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Factor Model</p>
          <div className="flex gap-3 text-[9px]">
            <span className="text-emerald-400">{positiveFactors} bullish</span>
            <span className="text-red-400">{negativeFactors} bearish</span>
          </div>
        </div>
        <div className="space-y-4">
          {seller.factors.sort((a, b) => b.weight - a.weight).map(f => (
            <FactorBar key={f.factor} factor={f} />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/6 space-y-2">
        <button className="w-full py-2.5 rounded-lg bg-[#40856a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" />
          Generate Offer Strategy
        </button>
        <button className="w-full py-2 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors">
          Launch Deal Autopilot
        </button>
      </div>
    </motion.div>
  );
}

export default function SellerMotivation() {
  const [selected, setSelected] = useState<SellerProfile | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<AcceptanceCategory | "all">("all");

  const filtered = useMemo(() => {
    return SELLERS
      .filter(s => categoryFilter === "all" || s.acceptanceCategory === categoryFilter)
      .sort((a, b) => b.acceptanceScore - a.acceptanceScore);
  }, [categoryFilter]);

  const stats = {
    veryLikely: SELLERS.filter(s => s.acceptanceCategory === "very-likely").length,
    likely: SELLERS.filter(s => s.acceptanceCategory === "likely").length,
    avgDiscount: Math.round(SELLERS.reduce((s, p) => s + p.suggestedDiscount, 0) / SELLERS.length),
    avgScore: Math.round(SELLERS.reduce((s, p) => s + p.acceptanceScore, 0) / SELLERS.length),
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b border-white/6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#40856a]" />
                Seller Motivation Predictor
              </h1>
              <p className="text-xs text-white/40 mt-1">AI scoring of below-market acceptance probability based on debt load, distress depth, and comparable transaction patterns</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: "Very Likely Sellers", value: stats.veryLikely.toString(), color: "text-emerald-400", sub: "score ≥ 80" },
              { label: "Likely Sellers", value: stats.likely.toString(), color: "text-sky-400", sub: "score 60-79" },
              { label: "Avg Acceptance Score", value: stats.avgScore.toString(), color: "text-white", sub: "across pipeline" },
              { label: "Avg Target Discount", value: `−${stats.avgDiscount}%`, color: "text-[#40856a]", sub: "below market" },
            ].map(m => (
              <div key={m.label} className="bg-white/2 border border-white/5 rounded-xl p-3">
                <p className="text-[9px] text-white/30 uppercase tracking-wider">{m.label}</p>
                <p className={cn("text-xl font-bold mt-1", m.color)}>{m.value}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-3 border-b border-white/6 flex items-center gap-2">
          {(["all", "very-likely", "likely", "possible", "unlikely"] as const).map(c => {
            const meta = c !== "all" ? CATEGORY_META[c] : null;
            return (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs border transition-colors font-medium",
                  categoryFilter === c
                    ? meta ? `${meta.bg} ${meta.color}` : "bg-white/8 text-white border-white/20"
                    : "text-white/30 border-white/8 hover:border-white/15 hover:text-white/50"
                )}
              >
                {c === "all" ? "All Sellers" : CATEGORY_META[c].label}
              </button>
            );
          })}
          <span className="ml-auto text-xs text-white/30">{filtered.length} profiles</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {filtered.map(s => (
            <SellerCard key={s.id} seller={s} selected={selected?.id === s.id} onClick={() => setSelected(s)} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <DetailPanel key={selected.id} seller={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
