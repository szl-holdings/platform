import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, AlertTriangle, Clock, DollarSign, RefreshCw, Tag, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const ACCENT = "#40856a";
const API = "/api";

function fetchLenderExposure() {
  return fetch(`${API}/terra/cognitive/lender-exposure`).then(r => r.json()).then(d => d.data ?? d);
}

const RISK_COLORS: Record<string, string> = {
  Low: "#40856a",
  "Low-Medium": "#4a7dc8",
  Medium: "#c8a060",
  High: "#c04a2a",
};

const TYPE_COLORS: Record<string, string> = {
  bridge: "#c04a2a",
  mezzanine: "#c8a060",
  life_co: "#40856a",
  cmbs: "#4a7dc8",
};

function ConfidencePill({ value }: { value: number }) {
  const color = value >= 0.85 ? "#40856a" : value >= 0.65 ? "#c8a060" : "#c04a2a";
  const label = value >= 0.85 ? "High" : value >= 0.65 ? "Medium" : "Low";
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
      {label} {(value * 100).toFixed(0)}%
    </span>
  );
}

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function LenderCard({ lender, selected, onSelect }: { lender: any; selected: boolean; onSelect: () => void }) {
  const riskColor = RISK_COLORS[lender.riskLabel] ?? "#64748b";
  const typeColor = TYPE_COLORS[lender.type] ?? "#64748b";
  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl p-4 transition-all"
      style={{
        background: selected ? `${riskColor}10` : "rgba(255,255,255,0.02)",
        border: `1px solid ${selected ? `${riskColor}40` : "rgba(255,255,255,0.06)"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="text-sm font-semibold" style={{ color: "#e8edf8" }}>{lender.name}</div>
          <div className="text-[10px] font-mono uppercase tracking-wider mt-0.5" style={{ color: typeColor }}>{lender.type.replace("_", " ")}</div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${riskColor}18`, color: riskColor }}>
          {lender.riskLabel}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Exposure", value: fmt(lender.totalExposure) },
          { label: "Avg LTV", value: `${(lender.avgLtv * 100).toFixed(0)}%` },
          { label: "Avg Rate", value: `${lender.avgRate}%` },
        ].map(m => (
          <div key={m.label} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-xs font-semibold font-mono" style={{ color: "#e8edf8" }}>{m.value}</div>
            <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{m.label}</div>
          </div>
        ))}
      </div>
      {(lender.covenantBreaches > 0 || lender.maturities.within90d > 0) && (
        <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {lender.covenantBreaches > 0 && (
            <span className="flex items-center gap-1 text-[9px]" style={{ color: "#c04a2a" }}>
              <AlertTriangle className="w-2.5 h-2.5" />
              {lender.covenantBreaches} breach{lender.covenantBreaches > 1 ? "es" : ""}
            </span>
          )}
          {lender.maturities.within90d > 0 && (
            <span className="flex items-center gap-1 text-[9px]" style={{ color: "#c8a060" }}>
              <Clock className="w-2.5 h-2.5" />
              {lender.maturities.within90d} maturing &lt;90d
            </span>
          )}
        </div>
      )}
    </button>
  );
}

export default function LenderExposureMapPage() {
  const [selectedLender, setSelectedLender] = useState<string | null>(null);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["terra-lender-exposure"],
    queryFn: fetchLenderExposure,
  });

  const lenders: any[] = data?.lenders ?? [];
  const summary = data?.summary;
  const maturityLadder: any[] = data?.maturityLadder ?? [];
  const prov = data?.provenance;
  const selLender = lenders.find(l => l.id === selectedLender);

  const pieData = Object.entries(summary?.byType ?? {}).map(([name, value]) => ({
    name: name.replace("_", " ").toUpperCase(),
    value: value as number,
    color: TYPE_COLORS[name] ?? "#64748b",
  }));

  const maturityBarData = maturityLadder.map(m => ({
    ...m,
    amountM: +(m.amount / 1e6).toFixed(1),
  }));

  return (
    <div style={{ padding: "28px 28px 40px", maxWidth: 1280, margin: "0 auto" }}>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4" style={{ color: ACCENT }} />
            <h1 className="text-xl font-semibold" style={{ color: "#e8edf8" }}>Lender Exposure Map</h1>
          </div>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Portfolio-level debt concentration, lender risk scoring, and maturity ladder — with covenant breach tracking.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }} />
        </div>
      ) : (
        <div className="space-y-4">
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Exposure", value: fmt(summary.totalExposure), icon: DollarSign, warn: false },
                { label: "Lenders", value: summary.lenderCount, icon: Shield, warn: false },
                { label: "Covenant Breaches", value: summary.covenantBreachCount, icon: AlertTriangle, warn: summary.covenantBreachCount > 0 },
                { label: "Maturities <90d", value: summary.nearTermMaturities, icon: Clock, warn: summary.nearTermMaturities > 0 },
              ].map(m => {
                const color = m.warn ? "#c04a2a" : ACCENT;
                const Icon = m.icon;
                return (
                  <div key={m.label} className="rounded-xl p-4" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                    <Icon className="w-3.5 h-3.5 mb-2" style={{ color }} />
                    <div className="text-xl font-bold font-mono" style={{ color: m.warn ? "#c04a2a" : "#e8edf8" }}>{m.value}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lenders.map(lender => (
                <LenderCard
                  key={lender.id}
                  lender={lender}
                  selected={selectedLender === lender.id}
                  onSelect={() => setSelectedLender(selectedLender === lender.id ? null : lender.id)}
                />
              ))}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                    By Type
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(v as number)} contentStyle={{ background: "#0a0c10", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5" style={{ color: "#c8a060" }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Maturity Ladder
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={maturityBarData} barSize={24}>
                    <XAxis dataKey="period" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
                    <Tooltip formatter={(v: any) => `$${v}M`} contentStyle={{ background: "#0a0c10", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="amountM" fill={ACCENT} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {selLender && (
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${RISK_COLORS[selLender.riskLabel] ?? "#64748b"}30` }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "#e8edf8" }}>Maturity Detail — {selLender.name}</div>
                  {[
                    { label: "Within 90 days", count: selLender.maturities.within90d },
                    { label: "91–180 days", count: selLender.maturities.within180d },
                    { label: "181–365 days", count: selLender.maturities.within365d },
                  ].map(m => (
                    <div key={m.label} className="flex justify-between text-xs py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
                      <span>{m.label}</span>
                      <span className="font-mono" style={{ color: m.count > 0 ? "#c8a060" : "#e8edf8" }}>{m.count} loan{m.count !== 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              )}

              {prov && (
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Provenance</span>
                    <ConfidencePill value={prov.confidence} />
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{prov.source}</div>
                  <div className="text-[9px] mt-1" style={{ color: "rgba(64,133,106,0.5)" }}>{prov.traceRef}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{prov.runtime}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
