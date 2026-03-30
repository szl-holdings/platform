import { KPI_METRICS, formatCurrency } from "@workspace/shared-ui/core-observability-data";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const FORECAST_DATA = {
  arr_trend: [
    { month: "Oct", actual: 8200000, forecast: null },
    { month: "Nov", actual: 8650000, forecast: null },
    { month: "Dec", actual: 9100000, forecast: null },
    { month: "Jan", actual: 9400000, forecast: null },
    { month: "Feb", actual: 9750000, forecast: null },
    { month: "Mar", actual: 10200000, forecast: null },
    { month: "Apr", actual: null, forecast: 10600000 },
    { month: "May", actual: null, forecast: 10950000 },
    { month: "Jun", actual: null, forecast: 11400000 },
  ],
  win_rate: [
    { month: "Oct", actual: 64, forecast: null },
    { month: "Nov", actual: 68, forecast: null },
    { month: "Dec", actual: 71, forecast: null },
    { month: "Jan", actual: 69, forecast: null },
    { month: "Feb", actual: 73, forecast: null },
    { month: "Mar", actual: 74, forecast: null },
    { month: "Apr", actual: null, forecast: 72 },
    { month: "May", actual: null, forecast: 75 },
    { month: "Jun", actual: null, forecast: 77 },
  ],
};

const FORECAST_SCENARIOS = [
  {
    id: "bull",
    label: "Bull Case",
    q2_arr: 11800000,
    probability: 25,
    key_assumption: "All pending contracts close on time, churn interventions succeed, hiring plan met",
    color: "#10b981",
  },
  {
    id: "base",
    label: "Base Case",
    q2_arr: 11400000,
    probability: 55,
    key_assumption: "Northgate closes in 6 days, TechCorp retained, vendor onboarding unblocked",
    color: "#8b5cf6",
  },
  {
    id: "bear",
    label: "Bear Case",
    q2_arr: 10200000,
    probability: 20,
    key_assumption: "Northgate misses Q1, TechCorp churns, procurement gap persists 30+ days",
    color: "#ef4444",
  },
];

export default function ForecastingCenter() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4" style={{ color: "#8b5cf6" }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#6366f1" }}>Alloy · Forecasting Center</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Forecasting Center</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Scenario-adjusted revenue forecasts powered by Alloy models and Beacon signal inputs.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {FORECAST_SCENARIOS.map(sc => (
          <div key={sc.id} className="rounded-xl border p-5" style={{ borderColor: `${sc.color}25`, background: `${sc.color}04` }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: sc.color, background: `${sc.color}15`, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                <div className="text-2xl font-bold mt-2" style={{ color: sc.color }}>{formatCurrency(sc.q2_arr)}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Q2 ARR Forecast</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: sc.color }}>{sc.probability}%</div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>probability</div>
              </div>
            </div>
            <div className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{sc.key_assumption}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-5" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          <div className="text-sm font-semibold text-white mb-4">ARR Trend + Forecast</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={FORECAST_DATA.arr_trend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="arrActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="arrForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [formatCurrency(v), ""]}
                />
                <Area type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={2} fill="url(#arrActual)" connectNulls={false} />
                <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 2" fill="url(#arrForecast)" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border p-5" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          <div className="text-sm font-semibold text-white mb-4">Win Rate Trend + Forecast</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={FORECAST_DATA.win_rate} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="winActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [`${v}%`, ""]}
                />
                <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fill="url(#winActual)" connectNulls={false} />
                <Area type="monotone" dataKey="forecast" stroke="#10b981" strokeWidth={2} strokeDasharray="4 2" fill="url(#winActual)" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-5" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
        <div className="text-sm font-semibold text-white mb-4">KPI Forecast Summary</div>
        <div className="grid grid-cols-3 gap-4">
          {KPI_METRICS.map(kpi => (
            <div key={kpi.id} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{kpi.label}</div>
              <div className="text-lg font-bold mb-1" style={{ color: kpi.status === "at_risk" ? "#ef4444" : kpi.status === "warning" ? "#f59e0b" : "#10b981" }}>
                {typeof kpi.value === "number" && kpi.unit === "$" ? formatCurrency(kpi.value) : `${kpi.value}${kpi.unit || ""}`}
              </div>
              <div className="text-[9px] flex items-center gap-1" style={{ color: kpi.trend_direction === "down" ? "#ef4444" : "#10b981" }}>
                {kpi.trend_direction === "down" ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {kpi.trend >= 0 ? "+" : ""}{kpi.trend}% vs prev period
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
