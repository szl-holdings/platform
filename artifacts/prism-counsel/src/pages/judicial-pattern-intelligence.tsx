import { useState } from "react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { AmbientBar, type AmbientSignal } from "@szl-holdings/shared-ui/ambient-intelligence";
import { EnergyPulse, type EnergyMetrics } from "@szl-holdings/shared-ui/energy-heartbeat";
import { CorrelationFeed, type CrossDomainCorrelation } from "@szl-holdings/shared-ui/cross-domain-correlation";

interface JudicialProfile {
  id: string;
  name: string;
  court: string;
  type: "judge" | "court" | "opposing_counsel";
  avgRulingTimeDays: number;
  motionSuccessRate: number;
  settlementTendency: number;
  avgSettlementMultiplier: number;
  proceduralPreferences: string[];
  recentPatterns: string[];
  caseVolumeLast12m: number;
  favorableRulingRate: number;
}

const DEMO_PROFILES: JudicialProfile[] = [
  {
    id: "jp-001", name: "Hon. Maria Torres", court: "NY Supreme — Kings County", type: "judge",
    avgRulingTimeDays: 42, motionSuccessRate: 0.68, settlementTendency: 0.73,
    avgSettlementMultiplier: 2.1, caseVolumeLast12m: 234, favorableRulingRate: 0.61,
    proceduralPreferences: ["Prefers letter motions under 5 pages", "Strict on discovery deadlines", "Favors early mediation", "Rarely grants adjournments"],
    recentPatterns: ["Increasingly ruling in favor of plaintiff in premises liability", "Settlement conferences averaging 3.2 sessions before resolution", "Motion for summary judgment denial rate up 15% this quarter"],
  },
  {
    id: "jp-002", name: "Hon. David Chen", court: "NY Supreme — New York County", type: "judge",
    avgRulingTimeDays: 28, motionSuccessRate: 0.54, settlementTendency: 0.45,
    avgSettlementMultiplier: 1.8, caseVolumeLast12m: 312, favorableRulingRate: 0.48,
    proceduralPreferences: ["Requires full formal motions", "Tech-savvy — accepts e-filings promptly", "Strict page limits", "Holds frequent oral arguments"],
    recentPatterns: ["Trial-oriented — only 45% settle pre-trial", "Granting more Frye motions this year", "Average trial duration: 6.2 days"],
  },
  {
    id: "jp-003", name: "Stern & Associates", court: "NY Supreme — Multiple", type: "opposing_counsel",
    avgRulingTimeDays: 0, motionSuccessRate: 0.72, settlementTendency: 0.82,
    avgSettlementMultiplier: 2.4, caseVolumeLast12m: 156, favorableRulingRate: 0.55,
    proceduralPreferences: ["Aggressive discovery tactics", "Heavy use of expert witnesses", "Typically seeks early MSJ", "Known for high opening demands"],
    recentPatterns: ["Win rate declining in med-mal cases (down 8%)", "Increasingly using AI-generated case research", "Average case duration: 18 months", "Settlement negotiation pattern: starts 5x policy, settles at 1.8x"],
  },
  {
    id: "jp-004", name: "Eastern District — Commercial Division", court: "EDNY", type: "court",
    avgRulingTimeDays: 56, motionSuccessRate: 0.62, settlementTendency: 0.65,
    avgSettlementMultiplier: 1.6, caseVolumeLast12m: 1840, favorableRulingRate: 0.52,
    proceduralPreferences: ["Mandatory initial conference within 30 days", "E-filing required", "Strict Rule 26 compliance", "Mediation referral standard"],
    recentPatterns: ["Case backlog reduced 12% with new magistrate appointments", "Summary judgment grant rate: 34%", "Average time to trial: 22 months"],
  },
];

const TYPE_COLORS: Record<string, string> = { judge: "#8b5cf6", court: "#3b82f6", opposing_counsel: "#f59e0b" };
const TYPE_LABELS: Record<string, string> = { judge: "Judge", court: "Court", opposing_counsel: "Opposing Counsel" };

export default function JudicialPatternIntelligence() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = DEMO_PROFILES.find((p) => p.id === selectedId);

  const ambientSignals: AmbientSignal[] = [
    { id: "sig-1", domain: "prism", title: "Judicial Pattern Shift", summary: "Pattern shift detected in Southern District — brief strategy update recommended", severity: "high", score: 0.88, timestamp: Date.now() },
  ];
  const energyMetrics: EnergyMetrics = { apiCallsPerMinute: 64, wsMessagesPerMinute: 120, chartRendersPerMinute: 8, dataRefreshesPerMinute: 6, activeSubscriptions: 18, deferredUpdates: 2, totalBudget: 120, usedBudget: 42 };
  const correlations: CrossDomainCorrelation[] = [
    { id: "cor-3", title: "Litigation Reserves ↔ LP Sentiment", description: "Litigation reserve accuracy improves when LP sentiment data feeds judicial pattern models", domains: ["prism", "szl-holdings"], confidence: 0.78, timestamp: Date.now(), signals: [{ domain: "prism", event: "Reserve accuracy 91%", severity: "info" }, { domain: "szl-holdings", event: "LP confidence 87%", severity: "info" }], impact: "medium" },
  ];

  return (
    <div className="min-h-screen bg-[#060810] text-white p-6 space-y-6">
      <AmbientBar signals={ambientSignals} appDomain="prism" accentColor="#8b5cf6" compact />
      <div>
        <h1 className="text-2xl font-bold text-white/90">Judicial Pattern Intelligence</h1>
        <p className="text-sm text-white/40 mt-1">Historical patterns for courts, judges & opposing counsel — your litigation weather forecast</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-3">
          {DEMO_PROFILES.map((profile) => (
            <div
              key={profile.id}
              className={cn(
                "rounded-xl border p-4 cursor-pointer transition-all",
                selectedId === profile.id ? "bg-white/[0.06] border-white/15" : "bg-white/[0.02] border-white/5 hover:border-white/10",
              )}
              onClick={() => setSelectedId(profile.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `${TYPE_COLORS[profile.type]}30` }}>
                  {profile.type === "judge" ? "⚖️" : profile.type === "court" ? "🏛" : "📋"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white/85 truncate">{profile.name}</div>
                  <div className="text-[11px] text-white/40 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-full text-[9px]" style={{ background: `${TYPE_COLORS[profile.type]}20`, color: TYPE_COLORS[profile.type] }}>
                      {TYPE_LABELS[profile.type]}
                    </span>
                    <span>{profile.court}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-white/5 rounded px-2 py-1">
                  <div className="text-[9px] text-white/30">Motion Success</div>
                  <div className="text-xs font-mono text-white/70">{Math.round(profile.motionSuccessRate * 100)}%</div>
                </div>
                <div className="bg-white/5 rounded px-2 py-1">
                  <div className="text-[9px] text-white/30">Settlement</div>
                  <div className="text-xs font-mono text-white/70">{Math.round(profile.settlementTendency * 100)}%</div>
                </div>
                <div className="bg-white/5 rounded px-2 py-1">
                  <div className="text-[9px] text-white/30">Cases/12m</div>
                  <div className="text-xs font-mono text-white/70">{profile.caseVolumeLast12m}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-7">
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{selected.type === "judge" ? "⚖️" : selected.type === "court" ? "🏛" : "📋"}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-white/90">{selected.name}</h2>
                    <p className="text-xs text-white/40">{selected.court}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Avg Ruling Time", value: `${selected.avgRulingTimeDays} days`, show: selected.type !== "opposing_counsel" },
                    { label: "Motion Success Rate", value: `${Math.round(selected.motionSuccessRate * 100)}%`, show: true },
                    { label: "Settlement Tendency", value: `${Math.round(selected.settlementTendency * 100)}%`, show: true },
                    { label: "Avg Settlement Multiplier", value: `${selected.avgSettlementMultiplier}×`, show: true },
                    { label: "Favorable Ruling Rate", value: `${Math.round(selected.favorableRulingRate * 100)}%`, show: true },
                    { label: "Case Volume (12m)", value: selected.caseVolumeLast12m.toString(), show: true },
                  ].filter((i) => i.show).map((item) => (
                    <div key={item.label} className="bg-white/5 rounded-lg p-3">
                      <div className="text-[10px] text-white/30 uppercase">{item.label}</div>
                      <div className="text-lg font-bold text-white/80 mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <h3 className="text-sm font-semibold text-white/70 mb-3">Procedural Preferences</h3>
                <div className="space-y-2">
                  {selected.proceduralPreferences.map((pref, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-purple-400 mt-0.5">•</span>
                      <span className="text-white/60">{pref}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-5">
                <h3 className="text-sm font-semibold text-amber-400/80 mb-3">Recent Patterns & Trends</h3>
                <div className="space-y-2">
                  {selected.recentPatterns.map((pattern, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-amber-400/60 mt-0.5">→</span>
                      <span className="text-white/60">{pattern}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center h-full flex items-center justify-center">
              <p className="text-sm text-white/30">Select a judge, court, or opposing counsel to view patterns</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
        <div className="md:col-span-2">
          <CorrelationFeed correlations={correlations} currentDomain="prism" accentColor="#8b5cf6" />
        </div>
        <div className="flex items-start justify-center">
          <EnergyPulse metrics={energyMetrics} utilization={energyMetrics.usedBudget / energyMetrics.totalBudget} accentColor="#8b5cf6" />
        </div>
      </div>
    </div>
  );
}
