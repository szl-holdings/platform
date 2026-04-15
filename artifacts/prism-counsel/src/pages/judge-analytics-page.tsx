import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gavel, Clock, BarChart3, TrendingUp, Star, User, Target, AlertTriangle, ChevronRight, Search, Wifi, WifiOff } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const PRISM_GOLD = "#c8a96e";

interface JudgeProfile {
  id: string;
  name: string;
  court: string;
  district: string;
  appointedYear: number;
  appointedBy: string;
  avgDaysToRuling: number;
  avgDaysToTrial: number;
  motionGrantRate: number;
  summaryJudgmentGrantRate: number;
  settlementPressureScore: number;
  plaintiffVerdictRate: number;
  avgAwardMultiple: number;
  tendencies: string[];
  philosophy: string;
  recentTrend: "plaintiff" | "defense" | "neutral";
  dangerRating: number;
}

const JUDGES: JudgeProfile[] = [
  {
    id: "j1",
    name: "Hon. Sandra M. Castellano",
    court: "SDNY",
    district: "Southern District of New York",
    appointedYear: 2014,
    appointedBy: "Obama",
    avgDaysToRuling: 42,
    avgDaysToTrial: 380,
    motionGrantRate: 54,
    summaryJudgmentGrantRate: 38,
    settlementPressureScore: 82,
    plaintiffVerdictRate: 61,
    avgAwardMultiple: 1.24,
    tendencies: ["Active settlement pressure", "Strict scheduling orders", "Punishes discovery abuses", "Favors Daubert challenges"],
    philosophy: "Pragmatic — strongly encourages early resolution, skeptical of speculative damages",
    recentTrend: "plaintiff",
    dangerRating: 72,
  },
  {
    id: "j2",
    name: "Hon. Marcus T. Brennan",
    court: "EDNY",
    district: "Eastern District of New York",
    appointedYear: 2008,
    appointedBy: "Bush",
    avgDaysToRuling: 68,
    avgDaysToTrial: 520,
    motionGrantRate: 47,
    summaryJudgmentGrantRate: 52,
    settlementPressureScore: 41,
    plaintiffVerdictRate: 43,
    avgAwardMultiple: 0.88,
    tendencies: ["High summary judgment grant rate", "Slow docket velocity", "Skeptical of emotional distress claims", "Favors defense on pre-trial motions"],
    philosophy: "Textualist — demands rigorous evidentiary foundation, hostile to plaintiff speculation",
    recentTrend: "defense",
    dangerRating: 35,
  },
  {
    id: "j3",
    name: "Hon. Yolanda A. Pierce",
    court: "SDNY",
    district: "Southern District of New York",
    appointedYear: 2019,
    appointedBy: "Trump",
    avgDaysToRuling: 31,
    avgDaysToTrial: 290,
    motionGrantRate: 51,
    summaryJudgmentGrantRate: 44,
    settlementPressureScore: 66,
    plaintiffVerdictRate: 54,
    avgAwardMultiple: 1.08,
    tendencies: ["Fast docket — aggressive scheduling", "Strong on discovery compliance", "Receptive to MIL motions", "Bifurcates damages frequently"],
    philosophy: "Efficiency-focused — rewards prepared counsel, penalizes delay tactics",
    recentTrend: "neutral",
    dangerRating: 58,
  },
  {
    id: "j4",
    name: "Hon. David L. Kwan",
    court: "EDNY",
    district: "Eastern District of New York",
    appointedYear: 2011,
    appointedBy: "Obama",
    avgDaysToRuling: 55,
    avgDaysToTrial: 440,
    motionGrantRate: 58,
    summaryJudgmentGrantRate: 29,
    settlementPressureScore: 74,
    plaintiffVerdictRate: 67,
    avgAwardMultiple: 1.42,
    tendencies: ["Very low summary judgment rate", "High plaintiff verdict rate", "Generous punitive damages", "Strong bias against early settlement pressure"],
    philosophy: "Rights-oriented — believes juries should decide, rarely dismisses on procedural grounds",
    recentTrend: "plaintiff",
    dangerRating: 85,
  },
];

const TREND_COLORS: Record<string, string> = {
  plaintiff: "#c45a4a",
  defense: "#4a90b8",
  neutral: "#d4a054",
};

function RatingBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  );
}

function DangerMeter({ score }: { score: number }) {
  const color = score >= 75 ? "#c45a4a" : score >= 50 ? "#d4a054" : "#4a90b8";
  const label = score >= 75 ? "HIGH RISK" : score >= 50 ? "MODERATE" : "DEFENSE-FAVORABLE";
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: i <= Math.round(score/20) ? color : "#ffffff10" }} />
        ))}
      </div>
      <span className="text-[9px] font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function LiveJudgeSearch() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data, isFetching, isError } = useQuery({
    queryKey: ["cl-judges", submittedQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ q: submittedQuery, limit: "8" });
      const res = await fetch(`${BASE}/api/prism-counsel/court/judges/search?${params}`, {
        headers: { "x-requested-with": "XMLHttpRequest" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Judge search failed");
      const json = await res.json();
      return json.data ?? json;
    },
    enabled: submittedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  interface JudgeSearchResult {
    id?: number;
    resource_uri?: string;
    name_full?: string;
    name?: string;
    court?: string;
    date_dob?: string;
    political_affiliation_str?: string;
    aba_rating?: string;
    absolute_url?: string;
  }
  const results: JudgeSearchResult[] = (data?.results ?? []) as JudgeSearchResult[];
  const source: string = data?.source ?? "unknown";

  return (
    <div className="rounded-lg border border-white/[0.06] p-4 space-y-3" style={{ background: "#0c1220" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#4a90b8]" />
          <span className="text-[11px] font-semibold text-slate-300">Live Federal Judge Search</span>
          {submittedQuery && (
            source === "live" ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#5aa87a]/10 text-[#5aa87a] border border-[#5aa87a]/20">
                <Wifi className="w-2.5 h-2.5" /> CourtListener LIVE
              </span>
            ) : source === "error" ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">
                <WifiOff className="w-2.5 h-2.5" /> UNAVAILABLE
              </span>
            ) : null
          )}
        </div>
        <span className="text-[9px] text-slate-600">Powered by CourtListener — federal judicial profiles</span>
      </div>
      <form
        className="flex gap-2"
        onSubmit={e => { e.preventDefault(); if (query.trim().length >= 2) setSubmittedQuery(query.trim()); }}
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search judge name, court, or district..."
          className="flex-1 px-3 py-1.5 rounded text-xs bg-white/[0.04] border border-white/[0.08] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-[#4a90b8]/40"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded text-[11px] font-medium bg-[#4a90b8]/10 border border-[#4a90b8]/20 text-[#4a90b8] hover:bg-[#4a90b8]/20 transition-colors"
        >
          {isFetching ? "Searching…" : "Search"}
        </button>
      </form>
      {isError && (
        <p className="text-[10px] text-[#c45a4a]">CourtListener unavailable — live search temporarily offline.</p>
      )}
      {results.length > 0 && (
        <div className="grid gap-2">
          {results.map((judge) => (
            <div key={judge.id ?? judge.resource_uri} className="flex items-start justify-between rounded-md border border-white/[0.04] px-3 py-2 bg-white/[0.02]">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-slate-200 truncate">{judge.name_full ?? judge.name ?? "Unknown"}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  {[judge.court, judge.date_dob ? `b. ${new Date(judge.date_dob).getFullYear()}` : null].filter(Boolean).join(" · ")}
                </div>
                {(judge.political_affiliation_str || judge.aba_rating) && (
                  <div className="flex gap-2 mt-1">
                    {judge.political_affiliation_str && (
                      <span className="text-[9px] px-1 rounded bg-white/[0.04] text-slate-500">{judge.political_affiliation_str}</span>
                    )}
                    {judge.aba_rating && (
                      <span className="text-[9px] px-1 rounded bg-white/[0.04] text-slate-500">ABA: {judge.aba_rating}</span>
                    )}
                  </div>
                )}
              </div>
              {judge.absolute_url && (
                <a
                  href={judge.absolute_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-[#4a90b8] hover:text-[#5aa8d8] ml-2 mt-0.5"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {submittedQuery && !isFetching && results.length === 0 && !isError && (
        <p className="text-[10px] text-slate-600 text-center py-2">No judges found for "{submittedQuery}"</p>
      )}
    </div>
  );
}

export default function JudgeAnalyticsPage() {
  const [selected, setSelected] = useState<JudgeProfile | null>(null);

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Gavel className="w-5 h-5" style={{ color: PRISM_GOLD }} />
          <h1 className="text-lg font-semibold text-slate-100">Judge Analytics</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium border" style={{ background: `${PRISM_GOLD}15`, color: PRISM_GOLD, borderColor: `${PRISM_GOLD}30` }}>
            {JUDGES.length} PROFILES
          </span>
        </div>
        <p className="text-xs text-slate-500">AI-modeled judge tendencies: ruling speed, motion grant rates, settlement pressure behavior, damage award patterns, and strategic orientation — the intelligence edge in venue selection</p>
      </div>

      <LiveJudgeSearch />

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Avg Days to Ruling", value: `${Math.round(JUDGES.reduce((s,j) => s+j.avgDaysToRuling,0)/JUDGES.length)}d`, sub: "Across tracked judges", color: "#4a90b8" },
          { label: "Avg SJ Grant Rate", value: `${Math.round(JUDGES.reduce((s,j) => s+j.summaryJudgmentGrantRate,0)/JUDGES.length)}%`, sub: "Summary judgment success", color: PRISM_GOLD },
          { label: "Plaintiff Verdict Rate", value: `${Math.round(JUDGES.reduce((s,j) => s+j.plaintiffVerdictRate,0)/JUDGES.length)}%`, sub: "Average plaintiff wins", color: "#c45a4a" },
          { label: "High-Risk Judges", value: `${JUDGES.filter(j=>j.dangerRating>=75).length}`, sub: "Danger rating ≥75", color: "#c45a4a" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="text-xl font-semibold font-mono text-slate-100" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Judge List */}
        <div className="col-span-2 space-y-2">
          <div className="text-[9px] font-medium text-slate-600 uppercase tracking-wider px-1">Judge Roster</div>
          {JUDGES.map((judge) => (
            <button
              key={judge.id}
              onClick={() => setSelected(judge)}
              className={`w-full text-left rounded-lg border p-3 transition-all ${
                selected?.id === judge.id
                  ? "border-[#c8a96e]/40 bg-[#c8a96e]/5"
                  : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-medium text-slate-200">{judge.name}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{judge.court} · Appointed {judge.appointedYear}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 mt-0.5" />
              </div>
              <div className="mt-2">
                <DangerMeter score={judge.dangerRating} />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded border" style={{
                  background: `${TREND_COLORS[judge.recentTrend]}15`,
                  color: TREND_COLORS[judge.recentTrend],
                  borderColor: `${TREND_COLORS[judge.recentTrend]}30`,
                }}>
                  {judge.recentTrend === "plaintiff" ? "↑ PLAINTIFF TREND" : judge.recentTrend === "defense" ? "↓ DEFENSE TREND" : "→ NEUTRAL"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Judge Detail */}
        <div className="col-span-3">
          {selected ? (
            <div className="rounded-lg border border-white/[0.06] p-5 space-y-5" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-100">{selected.name}</h2>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{selected.district} · Appointed {selected.appointedYear} by {selected.appointedBy}</div>
                </div>
                <DangerMeter score={selected.dangerRating} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Avg Days to Ruling", value: `${selected.avgDaysToRuling}d`, icon: Clock, color: "#4a90b8" },
                  { label: "Avg Days to Trial", value: `${selected.avgDaysToTrial}d`, icon: Target, color: PRISM_GOLD },
                  { label: "Motion Grant Rate", value: `${selected.motionGrantRate}%`, icon: BarChart3, color: "#d4a054" },
                  { label: "SJ Grant Rate", value: `${selected.summaryJudgmentGrantRate}%`, icon: Gavel, color: selected.summaryJudgmentGrantRate > 45 ? "#4a90b8" : "#c45a4a" },
                  { label: "Settlement Pressure", value: `${selected.settlementPressureScore}/100`, icon: TrendingUp, color: selected.settlementPressureScore > 60 ? "#c45a4a" : "#4a90b8" },
                  { label: "Plaintiff Verdict Rate", value: `${selected.plaintiffVerdictRate}%`, icon: Star, color: selected.plaintiffVerdictRate > 55 ? "#c45a4a" : "#4a90b8" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <stat.icon className="w-3 h-3" style={{ color: stat.color }} />
                      <span className="text-[9px] text-slate-500">{stat.label}</span>
                    </div>
                    <div className="text-sm font-mono font-semibold" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-2">Judicial Tendencies</div>
                <div className="space-y-1.5">
                  {selected.tendencies.map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: PRISM_GOLD }} />
                      <span className="text-[10px] text-slate-300">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3 h-3 text-[#d4a054]" />
                  <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Judicial Philosophy</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">{selected.philosophy}</p>
              </div>

              <div>
                <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-2">Avg Award Multiple vs. Damages Claimed</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(100, selected.avgAwardMultiple * 60)}%`,
                      background: selected.avgAwardMultiple > 1.1 ? "#c45a4a" : selected.avgAwardMultiple > 0.9 ? "#d4a054" : "#4a90b8",
                    }} />
                  </div>
                  <div className="text-sm font-mono font-semibold text-slate-200">{selected.avgAwardMultiple.toFixed(2)}×</div>
                  <span className="text-[9px] text-slate-500">of damages claimed</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/[0.06] p-8 flex flex-col items-center justify-center text-center" style={{ background: "#0c1220" }}>
              <Gavel className="w-8 h-8 text-slate-700 mb-3" />
              <div className="text-xs text-slate-500">Select a judge to view detailed analytics</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
