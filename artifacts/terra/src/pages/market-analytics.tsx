import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, Building2, MapPin, Filter, Activity, ArrowRight, RefreshCw, Globe, Layers, DollarSign } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ReferenceLine } from "recharts";

type PropertyClass = "all" | "multifamily" | "office" | "retail" | "industrial" | "mixed_use";
type TimeRange = "3m" | "6m" | "1y" | "3y" | "5y";

interface SubmarketMetric {
  submarket: string;
  borough: string;
  cap_rate_pct: number;
  cap_rate_chg: number;
  vacancy_rate_pct: number;
  vacancy_rate_chg: number;
  avg_rent_psf: number;
  rent_chg: number;
  absorption_units: number;
  new_construction_units: number;
  transaction_volume_m: number;
  market_score: number;
}

const SUBMARKET_METRICS: SubmarketMetric[] = [
  { submarket: "Midtown Manhattan", borough: "Manhattan", cap_rate_pct: 4.2, cap_rate_chg: 0.15, vacancy_rate_pct: 18.4, vacancy_rate_chg: 1.2, avg_rent_psf: 98, rent_chg: -3.2, absorption_units: -840, new_construction_units: 120, transaction_volume_m: 1240, market_score: 58 },
  { submarket: "Downtown Manhattan", borough: "Manhattan", cap_rate_pct: 4.8, cap_rate_chg: 0.28, vacancy_rate_pct: 22.1, vacancy_rate_chg: 2.4, avg_rent_psf: 74, rent_chg: -6.1, absorption_units: -1240, new_construction_units: 0, transaction_volume_m: 820, market_score: 42 },
  { submarket: "Williamsburg", borough: "Brooklyn", cap_rate_pct: 5.4, cap_rate_chg: -0.1, vacancy_rate_pct: 4.8, vacancy_rate_chg: -0.3, avg_rent_psf: 62, rent_chg: 4.8, absorption_units: 340, new_construction_units: 890, transaction_volume_m: 480, market_score: 78 },
  { submarket: "DUMBO", borough: "Brooklyn", cap_rate_pct: 5.1, cap_rate_chg: 0.05, vacancy_rate_pct: 6.2, vacancy_rate_chg: 0.4, avg_rent_psf: 54, rent_chg: 2.4, absorption_units: 120, new_construction_units: 240, transaction_volume_m: 320, market_score: 72 },
  { submarket: "Long Island City", borough: "Queens", cap_rate_pct: 5.8, cap_rate_chg: -0.2, vacancy_rate_pct: 5.1, vacancy_rate_chg: -0.8, avg_rent_psf: 48, rent_chg: 6.2, absorption_units: 580, new_construction_units: 1240, transaction_volume_m: 380, market_score: 82 },
  { submarket: "Astoria", borough: "Queens", cap_rate_pct: 6.1, cap_rate_chg: -0.15, vacancy_rate_pct: 3.4, vacancy_rate_chg: -0.4, avg_rent_psf: 42, rent_chg: 5.4, absorption_units: 240, new_construction_units: 380, transaction_volume_m: 180, market_score: 79 },
  { submarket: "South Bronx", borough: "Bronx", cap_rate_pct: 6.8, cap_rate_chg: -0.4, vacancy_rate_pct: 4.2, vacancy_rate_chg: -1.2, avg_rent_psf: 34, rent_chg: 8.4, absorption_units: 480, new_construction_units: 720, transaction_volume_m: 240, market_score: 84 },
  { submarket: "Fordham", borough: "Bronx", cap_rate_pct: 7.1, cap_rate_chg: -0.3, vacancy_rate_pct: 5.8, vacancy_rate_chg: -0.6, avg_rent_psf: 29, rent_chg: 7.2, absorption_units: 280, new_construction_units: 420, transaction_volume_m: 120, market_score: 77 },
];

const RENT_TREND_DATA = [
  { period: "Q1 '23", midtown: 102, brooklyn: 56, queens: 41, bronx: 28 },
  { period: "Q2 '23", midtown: 100, brooklyn: 57, queens: 43, bronx: 29 },
  { period: "Q3 '23", midtown: 99, brooklyn: 59, queens: 44, bronx: 30 },
  { period: "Q4 '23", midtown: 97, brooklyn: 60, queens: 46, bronx: 31 },
  { period: "Q1 '24", midtown: 96, brooklyn: 61, queens: 47, bronx: 32 },
  { period: "Q2 '24", midtown: 95, brooklyn: 62, queens: 48, bronx: 33 },
  { period: "Q3 '24", midtown: 98, brooklyn: 62, queens: 46, bronx: 34 },
  { period: "Q4 '24", midtown: 98, brooklyn: 63, queens: 48, bronx: 34 },
];

const CAP_RATE_DATA = [
  { period: "2020", multifamily: 4.8, office: 5.4, retail: 6.2, industrial: 4.2 },
  { period: "2021", multifamily: 4.5, office: 5.8, retail: 6.8, industrial: 3.9 },
  { period: "2022", multifamily: 4.2, office: 5.6, retail: 7.1, industrial: 3.5 },
  { period: "2023", multifamily: 5.1, office: 6.2, retail: 7.4, industrial: 4.0 },
  { period: "2024", multifamily: 5.3, office: 6.8, retail: 7.2, industrial: 4.3 },
];

const SUPPLY_DATA = [
  { quarter: "Q1", completions: 1240, underConstruction: 8400, planned: 12000 },
  { quarter: "Q2", completions: 1680, underConstruction: 8200, planned: 11800 },
  { quarter: "Q3", completions: 920, underConstruction: 9100, planned: 13200 },
  { quarter: "Q4", completions: 2100, underConstruction: 8900, planned: 12800 },
];

const SCORE_COLOR = (score: number) =>
  score >= 80 ? "#34d399" : score >= 65 ? "#d4a054" : score >= 50 ? "#f97316" : "#ef4444";

export default function MarketAnalyticsPage() {
  const [propertyClass, setPropertyClass] = useState<PropertyClass>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("1y");
  const [sortBy, setSortBy] = useState<"market_score" | "cap_rate" | "rent_chg" | "vacancy">("market_score");
  const [selectedSubmarket, setSelectedSubmarket] = useState<SubmarketMetric | null>(SUBMARKET_METRICS[2]);

  const sorted = [...SUBMARKET_METRICS].sort((a, b) => {
    if (sortBy === "market_score") return b.market_score - a.market_score;
    if (sortBy === "cap_rate") return b.cap_rate_pct - a.cap_rate_pct;
    if (sortBy === "rent_chg") return b.rent_chg - a.rent_chg;
    if (sortBy === "vacancy") return a.vacancy_rate_pct - b.vacancy_rate_pct;
    return 0;
  });

  const avgCapRate = (SUBMARKET_METRICS.reduce((s, m) => s + m.cap_rate_pct, 0) / SUBMARKET_METRICS.length).toFixed(2);
  const avgVacancy = (SUBMARKET_METRICS.reduce((s, m) => s + m.vacancy_rate_pct, 0) / SUBMARKET_METRICS.length).toFixed(1);
  const totalVolume = (SUBMARKET_METRICS.reduce((s, m) => s + m.transaction_volume_m, 0) / 1000).toFixed(1);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "#060c12" }}>
      {/* Header */}
      <div className="px-5 py-3.5 border-b flex items-center justify-between shrink-0" style={{ borderColor: "rgba(200,160,96,0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(200,160,96,0.1)" }}>
            <BarChart3 className="w-3.5 h-3.5" style={{ color: "#c8a060" }} />
          </div>
          <div>
            <h1 className="text-sm font-bold" style={{ color: "#f4e8d0" }}>Market Analytics</h1>
            <p className="text-[9px]" style={{ color: "rgba(200,160,96,0.4)" }}>Submarket-level cap rates · vacancy · rent trends · absorption · new construction pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(["3m", "6m", "1y", "3y", "5y"] as TimeRange[]).map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className="px-2 py-1 rounded text-[9px] font-medium border transition-all"
              style={{
                borderColor: timeRange === t ? "rgba(200,160,96,0.3)" : "rgba(255,255,255,0.08)",
                color: timeRange === t ? "#c8a060" : "rgba(255,255,255,0.3)",
                background: timeRange === t ? "rgba(200,160,96,0.08)" : "transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="px-5 py-3 border-b grid grid-cols-4 gap-3 shrink-0" style={{ borderColor: "rgba(200,160,96,0.06)" }}>
        {[
          { label: "Avg Cap Rate (NYC)", value: `${avgCapRate}%`, change: "+0.32% YoY", up: false, color: "#f97316" },
          { label: "Avg Vacancy Rate", value: `${avgVacancy}%`, change: "+0.8pp YoY", up: false, color: "#ef4444" },
          { label: "Transaction Volume", value: `$${totalVolume}B`, change: "-12% YoY", up: false, color: "#c8a060" },
          { label: "Net Absorption", value: "-440 units", change: "Negative for 3Q", up: false, color: "#f97316" },
        ].map(({ label, value, change, up, color }) => (
          <div key={label} className="rounded-xl p-3 border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[9px] mb-1" style={{ color: "rgba(200,160,96,0.4)" }}>{label}</p>
            <p className="text-lg font-bold font-mono" style={{ color: "#f4e8d0" }}>{value}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {up ? <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> : <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
              <span className="text-[9px]" style={{ color }}>{change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Submarket Table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="px-5 py-2 border-b flex items-center gap-2 shrink-0" style={{ borderColor: "rgba(200,160,96,0.06)" }}>
            <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(200,160,96,0.4)" }}>Sort by:</p>
            {(["market_score", "cap_rate", "rent_chg", "vacancy"] as const).map((id, i) => {
              const label = ["Market Score", "Cap Rate", "Rent Change", "Vacancy"][i];
              return (
                <button
                  key={id}
                  onClick={() => setSortBy(id)}
                  className="px-2 py-0.5 rounded text-[9px] border transition-all"
                  style={{
                    borderColor: sortBy === id ? "rgba(200,160,96,0.3)" : "rgba(255,255,255,0.06)",
                    color: sortBy === id ? "#c8a060" : "rgba(255,255,255,0.3)",
                    background: sortBy === id ? "rgba(200,160,96,0.07)" : "transparent",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Submarket rows */}
          <div className="flex-1 overflow-y-auto">
            {/* Column headers */}
            <div className="grid grid-cols-8 gap-2 px-4 py-2 text-[8px] font-medium uppercase tracking-wider border-b" style={{ color: "rgba(200,160,96,0.3)", borderColor: "rgba(200,160,96,0.06)" }}>
              <div className="col-span-2">Submarket</div>
              <div>Score</div>
              <div>Cap Rate</div>
              <div>Vacancy</div>
              <div>Rent/SF</div>
              <div>Absorption</div>
              <div>Volume</div>
            </div>
            {sorted.map(m => {
              const isSelected = selectedSubmarket?.submarket === m.submarket;
              const sc = SCORE_COLOR(m.market_score);
              return (
                <button
                  key={m.submarket}
                  onClick={() => setSelectedSubmarket(isSelected ? null : m)}
                  className="w-full grid grid-cols-8 gap-2 px-4 py-3 border-b text-left transition-all"
                  style={{
                    borderColor: "rgba(255,255,255,0.04)",
                    background: isSelected ? "rgba(200,160,96,0.06)" : "transparent",
                    borderLeft: isSelected ? "2px solid rgba(200,160,96,0.4)" : "2px solid transparent",
                  }}
                >
                  <div className="col-span-2 min-w-0">
                    <p className="text-[11px] font-medium text-right truncate" style={{ color: "#f4e8d0", textAlign: "left" }}>{m.submarket}</p>
                    <p className="text-[9px]" style={{ color: "rgba(200,160,96,0.4)" }}>{m.borough}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold" style={{ background: `${sc}15`, color: sc }}>{m.market_score}</div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono" style={{ color: "#f4e8d0" }}>{m.cap_rate_pct}%</p>
                    <p className="text-[8px]" style={{ color: m.cap_rate_chg > 0 ? "#ef4444" : "#34d399" }}>
                      {m.cap_rate_chg > 0 ? "+" : ""}{m.cap_rate_chg}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono" style={{ color: m.vacancy_rate_pct > 10 ? "#ef4444" : "#f4e8d0" }}>{m.vacancy_rate_pct}%</p>
                    <p className="text-[8px]" style={{ color: m.vacancy_rate_chg > 0 ? "#ef4444" : "#34d399" }}>
                      {m.vacancy_rate_chg > 0 ? "+" : ""}{m.vacancy_rate_chg}pp
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono" style={{ color: "#f4e8d0" }}>${m.avg_rent_psf}</p>
                    <p className="text-[8px]" style={{ color: m.rent_chg >= 0 ? "#34d399" : "#ef4444" }}>
                      {m.rent_chg >= 0 ? "+" : ""}{m.rent_chg}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono" style={{ color: m.absorption_units >= 0 ? "#34d399" : "#ef4444" }}>
                      {m.absorption_units >= 0 ? "+" : ""}{m.absorption_units.toLocaleString()}
                    </p>
                    <p className="text-[8px]" style={{ color: "rgba(200,160,96,0.3)" }}>units</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono" style={{ color: "#f4e8d0" }}>${m.transaction_volume_m}M</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel — Charts */}
        <div className="w-[340px] shrink-0 border-l overflow-y-auto p-4 space-y-4" style={{ borderColor: "rgba(200,160,96,0.08)" }}>
          {/* Rent Trend Chart */}
          <div className="rounded-xl border p-3" style={{ borderColor: "rgba(200,160,96,0.1)", background: "rgba(200,160,96,0.02)" }}>
            <h3 className="text-[10px] font-bold mb-2" style={{ color: "#f4e8d0" }}>Avg Rent PSF — By Borough</h3>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={RENT_TREND_DATA} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="period" tick={{ fontSize: 8, fill: "rgba(200,160,96,0.4)" }} />
                <YAxis tick={{ fontSize: 8, fill: "rgba(200,160,96,0.4)" }} />
                <Tooltip contentStyle={{ background: "#0a1410", border: "1px solid rgba(200,160,96,0.2)", borderRadius: 8, fontSize: 10, color: "#f4e8d0" }} />
                <Line type="monotone" dataKey="midtown" name="Manhattan" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="brooklyn" name="Brooklyn" stroke="#c8a060" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="queens" name="Queens" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="bronx" name="Bronx" stroke="#34d399" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-3 mt-2">
              {[["Manhattan", "#ef4444"], ["Brooklyn", "#c8a060"], ["Queens", "#60a5fa"], ["Bronx", "#34d399"]].map(([name, color]) => (
                <div key={name} className="flex items-center gap-1">
                  <div className="w-2 h-1 rounded-full" style={{ background: color }} />
                  <span className="text-[8px]" style={{ color: "rgba(200,160,96,0.4)" }}>{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cap Rate by Property Type */}
          <div className="rounded-xl border p-3" style={{ borderColor: "rgba(200,160,96,0.1)", background: "rgba(200,160,96,0.02)" }}>
            <h3 className="text-[10px] font-bold mb-2" style={{ color: "#f4e8d0" }}>Cap Rate by Property Type</h3>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={CAP_RATE_DATA} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="period" tick={{ fontSize: 8, fill: "rgba(200,160,96,0.4)" }} />
                <YAxis tick={{ fontSize: 8, fill: "rgba(200,160,96,0.4)" }} />
                <Tooltip contentStyle={{ background: "#0a1410", border: "1px solid rgba(200,160,96,0.2)", borderRadius: 8, fontSize: 10, color: "#f4e8d0" }} />
                <Line type="monotone" dataKey="multifamily" name="Multifamily" stroke="#c8a060" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="office" name="Office" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="industrial" name="Industrial" stroke="#34d399" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Supply Pipeline */}
          <div className="rounded-xl border p-3" style={{ borderColor: "rgba(200,160,96,0.1)", background: "rgba(200,160,96,0.02)" }}>
            <h3 className="text-[10px] font-bold mb-2" style={{ color: "#f4e8d0" }}>New Supply Pipeline (2024)</h3>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={SUPPLY_DATA} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="quarter" tick={{ fontSize: 8, fill: "rgba(200,160,96,0.4)" }} />
                <YAxis tick={{ fontSize: 8, fill: "rgba(200,160,96,0.4)" }} />
                <Tooltip contentStyle={{ background: "#0a1410", border: "1px solid rgba(200,160,96,0.2)", borderRadius: 8, fontSize: 10, color: "#f4e8d0" }} />
                <Bar dataKey="completions" name="Completed" fill="#c8a060" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
                <Bar dataKey="underConstruction" name="Under Constr." fill="#60a5fa" fillOpacity={0.4} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Selected submarket detail */}
          {selectedSubmarket && (
            <div className="rounded-xl border p-3" style={{ borderColor: "rgba(200,160,96,0.15)", background: "rgba(200,160,96,0.05)" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-bold" style={{ color: "#f4e8d0" }}>{selectedSubmarket.submarket}</h3>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: `${SCORE_COLOR(selectedSubmarket.market_score)}15`, color: SCORE_COLOR(selectedSubmarket.market_score) }}>
                  {selectedSubmarket.market_score}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Cap Rate", value: `${selectedSubmarket.cap_rate_pct}%` },
                  { label: "Vacancy", value: `${selectedSubmarket.vacancy_rate_pct}%` },
                  { label: "Avg Rent/SF", value: `$${selectedSubmarket.avg_rent_psf}` },
                  { label: "Rent Change", value: `${selectedSubmarket.rent_chg >= 0 ? "+" : ""}${selectedSubmarket.rent_chg}%` },
                  { label: "New Supply", value: `${selectedSubmarket.new_construction_units.toLocaleString()} units` },
                  { label: "Trade Volume", value: `$${selectedSubmarket.transaction_volume_m}M` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[8px]" style={{ color: "rgba(200,160,96,0.35)" }}>{label}</p>
                    <p className="text-[11px] font-medium" style={{ color: "#f4e8d0" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
