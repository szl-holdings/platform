import { useState } from "react";
import { Link } from "wouter";
import { Search, Filter, ArrowRight, Wifi, WifiOff, Loader2 } from "lucide-react";
import { usePrismMatters } from "../hooks/use-prism-api";

const STATUS_COLORS: Record<string, string> = {
  intake: "bg-slate-500/10 text-slate-400",
  investigation: "bg-[#8b7ac8]/10 text-[#8b7ac8]",
  discovery: "bg-[#4a90b8]/10 text-[#4a90b8]",
  pre_trial: "bg-[#d4a054]/10 text-[#d4a054]",
  trial: "bg-[#c45a4a]/10 text-[#c45a4a]",
  settlement: "bg-[#c8953c]/10 text-[#c8953c]",
  closed: "bg-slate-600/10 text-slate-500",
};

export default function MattersListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const mattersQ = usePrismMatters();

  const isLive = Array.isArray(mattersQ.data) && mattersQ.data.length > 0;
  const isLoading = mattersQ.isLoading;

  const allMatters = isLive
    ? mattersQ.data!.map(m => ({
        id: m.id,
        title: m.title,
        caseNumber: m.caseNumber,
        matterType: m.matterType,
        status: m.status,
        stage: m.status,
        jurisdiction: m.jurisdiction ?? "",
        courtName: m.courtName ?? "",
        healthScore: m.healthScore ?? 0,
        settlementLow: Number(m.settlementLow ?? 0),
        settlementMid: Number(m.settlementMid ?? 0),
        settlementHigh: Number(m.settlementHigh ?? 0),
        totalDamages: 0,
        totalLiens: 0,
        assignedAttorney: m.assignedAttorney ?? "",
        assignedParalegal: m.assignedParalegal ?? "",
        filingDate: m.filingDate ?? "",
        statOfLimitations: "",
        parties: [] as any[],
        claims: [] as any[],
        offers: [] as any[],
        medicalTimeline: [] as any[],
        damages: [] as any[],
        liens: [] as any[],
        deadlines: [] as any[],
        readinessScores: {} as Record<string, number>,
        recommendations: [] as any[],
      }))
    : [];

  const filtered = allMatters.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.caseNumber?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Matters</h1>
          <p className="text-xs text-slate-500 mt-0.5">{allMatters.length} active matters across all practice areas</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
          isLive ? "bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20" : "bg-slate-500/10 text-slate-500 border border-white/[0.06]"
        }`}>
          {isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
          {isLoading ? "LOADING" : isLive ? "LIVE" : "DEMO"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search matters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-white/[0.04] border border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#d4a054]/40"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          {["all", "discovery", "pre_trial", "intake"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                statusFilter === s ? "bg-white/[0.10] text-slate-200" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(m => (
          <Link key={m.id} href={`/prism-counsel/matters/${m.id}`}>
            <div className="rounded-lg border border-white/[0.06] p-4 hover:border-white/[0.12] transition-colors cursor-pointer" style={{ background: "#0c1220" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{
                      background: m.healthScore >= 70 ? "#4a90b815" : m.healthScore >= 50 ? "#d4a05415" : "#c45a4a15",
                      color: m.healthScore >= 70 ? "#4a90b8" : m.healthScore >= 50 ? "#d4a054" : "#c45a4a",
                    }}
                  >
                    {m.healthScore}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">{m.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-mono">{m.caseNumber}</span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-[10px] text-slate-500">{m.jurisdiction}</span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-[10px] text-slate-500">{m.matterType.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {m.settlementMid > 0 && (
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-300">
                        ${(m.settlementMid / 1000).toFixed(0)}K
                      </div>
                      <div className="text-[10px] text-slate-500">mid forecast</div>
                    </div>
                  )}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[m.status] || "bg-slate-500/10 text-slate-400"}`}>
                    {m.status.replace("_", " ").toUpperCase()}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                <div className="text-[10px] text-slate-500">
                  {m.assignedAttorney && <><span className="text-slate-400">{m.assignedAttorney}</span> · </>}
                  {m.damages.length} damages items · {m.liens.length} liens
                </div>
                <div className="flex-1" />
                {Object.keys(m.readinessScores).length > 0 && (
                  <div className="flex items-center gap-2">
                    {Object.entries(m.readinessScores).slice(0, 6).map(([k, v]) => {
                      const color = v >= 75 ? "#4a90b8" : v >= 50 ? "#d4a054" : "#c45a4a";
                      return (
                        <div key={k} className="flex items-center gap-1">
                          <div className="w-1 h-3 rounded-full" style={{ background: color }} />
                          <span className="text-[9px] font-mono" style={{ color }}>{v}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
