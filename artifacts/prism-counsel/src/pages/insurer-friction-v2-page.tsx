import { useState } from "react";
import {
  Building2, TrendingUp, TrendingDown, AlertTriangle, Activity,
  Target, BarChart3, Clock, DollarSign, ChevronRight, Zap, Eye
} from "lucide-react";

const ACCENT = "#c8a96e";
const BG = "#080c14";
const CARD = "#0c1220";
const BORDER = "rgba(255,255,255,0.06)";

interface CarrierPrediction {
  id: string;
  carrierName: string;
  frictionScore: number;
  frictionTrend: "tightening" | "loosening" | "stable";
  frictionChangePercent: number;
  reserveCycleStatus: "tightening" | "stable" | "loosening";
  avgOfferRatio: number;
  offerRatioTrend: number;
  settlementShift: "faster" | "slower" | "stable";
  medianDaysToSettle: number;
  predictedFrictionIn90: number;
  negotiationStrategy: string[];
  leveragePoints: string[];
  carrierPressures: string[];
  optimalDemandTiming: string;
  watchSignals: string[];
}

const CARRIERS: CarrierPrediction[] = [
  {
    id: "nationwide",
    carrierName: "Nationwide Insurance",
    frictionScore: 74,
    frictionTrend: "tightening",
    frictionChangePercent: +18,
    reserveCycleStatus: "tightening",
    avgOfferRatio: 0.52,
    offerRatioTrend: -0.16,
    settlementShift: "slower",
    medianDaysToSettle: 148,
    predictedFrictionIn90: 82,
    negotiationStrategy: [
      "Open demand above typical range — Nationwide's tightening cycle means initial offers are 15% below historical average. Open at $135,000+ to create room for meaningful negotiation.",
      "Emphasize medical continuity and no-gap treatment — Nationwide adjusters are currently scrutinizing any treatment gaps. Pre-empt with a medical narrative letter from the treating physician.",
      "Reference the Davis & Hayes settlement pattern — this firm has settled 78% of cases they handle. Use this in mediation to create internal pressure on the adjuster.",
      "Apply pressure around 6-month mark — Nationwide's reserve review cycle happens quarterly. A demand letter timed just before Q3 reserve review (late June) captures the highest internal settlement incentive.",
    ],
    leveragePoints: [
      "Nationwide currently under DOI scrutiny in 3 states for bad faith practices",
      "Their litigation costs in S.D. Fla. have increased 34% YoY — settling is increasingly preferred",
      "Upcoming Q3 reserve review creates internal pressure to close files",
    ],
    carrierPressures: [
      "Combined ratio pressure from Q1 catastrophe losses",
      "DOI market conduct examination in progress in FL, TX, CA",
      "Executive mandate to reduce pending litigation count by 20% by year-end",
    ],
    optimalDemandTiming: "Late June 2026 (before Q3 reserve review, after mandatory mediation order)",
    watchSignals: [
      "Monitor for new defense counsel firm changes — signals shift in settlement posture",
      "Track Nationwide Q2 earnings report — loss ratio above 68% historically triggers settlement pressure",
    ],
  },
  {
    id: "allstate",
    carrierName: "Allstate Property & Casualty",
    frictionScore: 61,
    frictionTrend: "stable",
    frictionChangePercent: +3,
    reserveCycleStatus: "stable",
    avgOfferRatio: 0.64,
    offerRatioTrend: -0.04,
    settlementShift: "stable",
    medianDaysToSettle: 122,
    predictedFrictionIn90: 63,
    negotiationStrategy: [
      "Allstate responds well to fully documented demand packages — comprehensive medical chronologies with narrative reduce back-and-forth and speed up initial offer.",
      "Request a mediation date early — Allstate adjusters have higher settlement authority when a mediation is already scheduled. The formality increases their motivation.",
      "Avoid excessive litigation discovery threats — Allstate's legal team has a strong SJ success rate locally. Over-litigating signals desperation and may trigger a full SJ motion.",
    ],
    leveragePoints: [
      "Allstate's trial loss rate in this district is 52% — higher than their national average",
      "Current focus on reducing litigation expenses — first-party bad faith cases are priority closures",
    ],
    carrierPressures: [
      "Post-hurricane reserve replenishment underway — short-term liquidity optimization",
      "New claims leadership team focused on litigation expense reduction",
    ],
    optimalDemandTiming: "Within 30 days of mediation scheduling — Allstate adjusters have higher authority when mediation is concrete",
    watchSignals: [
      "Allstate promoted new claims director in FL — watch for any shifts in settlement authority levels",
    ],
  },
  {
    id: "progressive",
    carrierName: "Progressive Commercial",
    frictionScore: 42,
    frictionTrend: "loosening",
    frictionChangePercent: -11,
    reserveCycleStatus: "loosening",
    avgOfferRatio: 0.72,
    offerRatioTrend: +0.08,
    settlementShift: "faster",
    medianDaysToSettle: 89,
    predictedFrictionIn90: 38,
    negotiationStrategy: [
      "Strike early — Progressive is currently in a settlement-favorable cycle. Their offer/demand ratio has improved 8 points in 6 months. File a strong demand package within 45 days of treatment completion.",
      "Reference Progressive's telematics data — if your client had a Progressive-insured vehicle, their own data may support your liability argument. Request it in discovery immediately.",
      "Avoid prolonged discovery — Progressive settles faster when they perceive trial risk. Maintaining a credible trial posture without excessive delay maximizes settlement value.",
    ],
    leveragePoints: [
      "Progressive in a favorable earnings quarter — settling now aligns with their financial narrative",
      "Recent jury verdicts against Progressive in FL have been large — trial risk is elevated for them",
    ],
    carrierPressures: [
      "Growth goals require reducing open claim counts",
      "Florida DUI/commercial vehicle verdicts are unpredictable — they prefer settlement",
    ],
    optimalDemandTiming: "Immediately upon treatment completion — Progressive's current cycle rewards speed",
    watchSignals: [
      "Monitor for any policy changes on commercial vehicle claims — tends to pre-cede tightening cycles",
    ],
  },
];

function FrictionMeter({ score, trend }: { score: number; trend: "tightening" | "loosening" | "stable" }) {
  const color = score >= 70 ? "#ef4444" : score >= 50 ? "#f59e0b" : "#22c55e";
  const TrendIcon = trend === "tightening" ? TrendingUp : trend === "loosening" ? TrendingDown : Activity;
  const trendColor = trend === "tightening" ? "#ef4444" : trend === "loosening" ? "#22c55e" : "#64748b";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-base font-bold font-mono" style={{ color }}>{score}</span>
      <TrendIcon className="w-3.5 h-3.5 shrink-0" style={{ color: trendColor }} />
    </div>
  );
}

export default function InsurerFrictionV2Page() {
  const [selected, setSelected] = useState("nationwide");

  const carrier = CARRIERS.find((c) => c.id === selected) ?? CARRIERS[0];
  const trendColor = carrier.frictionTrend === "tightening" ? "#ef4444" : carrier.frictionTrend === "loosening" ? "#22c55e" : ACCENT;

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-5 h-5" style={{ color: ACCENT }} />
          <h1 className="text-lg font-semibold text-slate-100">Insurer Friction Score 2.0</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium ml-1" style={{ background: "rgba(139,92,246,0.12)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.2)" }}>
            PREDICTIVE ANALYTICS
          </span>
        </div>
        <p className="text-xs text-slate-500">Predictive friction trends, settlement shift analysis, and per-carrier negotiation strategy recommendations</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {CARRIERS.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className="rounded-lg border p-4 text-left transition-all"
            style={{
              background: selected === c.id ? `${ACCENT}08` : CARD,
              border: selected === c.id ? `1px solid ${ACCENT}30` : `1px solid ${BORDER}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-200">{c.carrierName}</span>
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  color: c.frictionTrend === "tightening" ? "#ef4444" : c.frictionTrend === "loosening" ? "#22c55e" : ACCENT,
                  background: c.frictionTrend === "tightening" ? "rgba(239,68,68,0.1)" : c.frictionTrend === "loosening" ? "rgba(34,197,94,0.1)" : `${ACCENT}15`,
                }}
              >
                {c.frictionTrend.toUpperCase()}
              </span>
            </div>
            <FrictionMeter score={c.frictionScore} trend={c.frictionTrend} />
            <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500">
              <span>Offer ratio: {(c.avgOfferRatio * 100).toFixed(0)}%</span>
              <span>{c.medianDaysToSettle}d avg</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Current Friction</div>
          <div className="text-2xl font-bold font-mono" style={{ color: carrier.frictionScore >= 70 ? "#ef4444" : carrier.frictionScore >= 50 ? "#f59e0b" : "#22c55e" }}>{carrier.frictionScore}/100</div>
          <div className="text-[9px] mt-0.5" style={{ color: trendColor }}>
            {carrier.frictionChangePercent > 0 ? "+" : ""}{carrier.frictionChangePercent}% from 90 days ago
          </div>
        </div>
        <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">90-Day Forecast</div>
          <div className="text-2xl font-bold font-mono" style={{ color: carrier.predictedFrictionIn90 >= 70 ? "#ef4444" : "#f59e0b" }}>{carrier.predictedFrictionIn90}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Predicted friction score</div>
        </div>
        <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Offer/Demand Ratio</div>
          <div className="text-2xl font-bold font-mono" style={{ color: carrier.avgOfferRatio >= 0.65 ? "#22c55e" : "#f97316" }}>{(carrier.avgOfferRatio * 100).toFixed(0)}%</div>
          <div className="text-[9px] mt-0.5" style={{ color: carrier.offerRatioTrend > 0 ? "#22c55e" : "#ef4444" }}>
            {carrier.offerRatioTrend > 0 ? "+" : ""}{(carrier.offerRatioTrend * 100).toFixed(0)}pts trend
          </div>
        </div>
        <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Settlement Speed</div>
          <div className="text-2xl font-bold font-mono text-slate-200">{carrier.medianDaysToSettle}d</div>
          <div className="text-[9px] mt-0.5" style={{ color: carrier.settlementShift === "faster" ? "#22c55e" : carrier.settlementShift === "slower" ? "#ef4444" : ACCENT }}>
            {carrier.settlementShift.charAt(0).toUpperCase() + carrier.settlementShift.slice(1)} than 6mo avg
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-slate-100">Negotiation Strategy — {carrier.carrierName}</span>
        </div>
        <div className="space-y-3">
          {carrier.negotiationStrategy.map((s, idx) => (
            <div key={idx} className="flex gap-3 p-3 rounded-md" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.12)" }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold" style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd" }}>{idx + 1}</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-sm font-semibold text-slate-100">Leverage Points</span>
          </div>
          <div className="space-y-2">
            {carrier.leveragePoints.map((l, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" style={{ color: ACCENT }} />
                <span className="text-[10px] text-slate-300">{l}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-md" style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20` }}>
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Optimal Demand Timing</div>
            <div className="text-[10px] text-slate-300">{carrier.optimalDemandTiming}</div>
          </div>
        </div>
        <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-slate-100">Carrier Pressures</span>
          </div>
          <div className="space-y-2 mb-4">
            {carrier.carrierPressures.map((p, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span className="text-[10px] text-slate-300">{p}</span>
              </div>
            ))}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-2">Watch Signals</div>
          <div className="space-y-1.5">
            {carrier.watchSignals.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Eye className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-[10px] text-slate-400">{w}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
