import { useState } from "react";
import { OpsLayout } from "../components/ops-layout";
import { ServiceStatusPanel } from "../components/service-status-panel";
import { BarChart2, Shield, Activity, DollarSign, CheckCircle2, TrendingUp, TrendingDown, AlertTriangle, Info } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { useEcosystemData } from "../hooks/use-ecosystem-data";

interface DimensionScore {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  score: number;
  weight: number;
  signals: { label: string; value: string; status: "good" | "warn" | "bad" }[];
  trend: number[];
}

const DIMENSIONS: DimensionScore[] = [
  {
    key: "security", label: "Security", icon: Shield, color: "#ef4444", score: 82, weight: 0.30,
    signals: [
      { label: "Active threats", value: "2 medium", status: "warn" },
      { label: "Patch compliance", value: "96.4%", status: "good" },
      { label: "MTTR", value: "11 min", status: "good" },
      { label: "Vuln exposure", value: "3 open CVEs", status: "warn" },
    ],
    trend: [74, 77, 79, 76, 80, 82, 81, 84, 82, 83, 81, 82],
  },
  {
    key: "operational", label: "Operational", icon: Activity, color: "#0ea5e9", score: 74, weight: 0.30,
    signals: [
      { label: "SLA compliance", value: "81.5% (Lyte breach)", status: "bad" },
      { label: "Fleet uptime", value: "99.8%", status: "good" },
      { label: "API latency P95", value: "2.4s", status: "bad" },
      { label: "Active incidents", value: "2 high", status: "warn" },
    ],
    trend: [81, 78, 76, 79, 73, 72, 75, 74, 73, 76, 74, 74],
  },
  {
    key: "financial", label: "Financial", icon: DollarSign, color: "#22c55e", score: 71, weight: 0.25,
    signals: [
      { label: "Budget utilization", value: "92% MTD", status: "warn" },
      { label: "Over-budget domains", value: "2 of 7", status: "warn" },
      { label: "Cost trend", value: "+3.5% MoM", status: "warn" },
      { label: "Forecast accuracy", value: "88.2%", status: "good" },
    ],
    trend: [75, 72, 74, 71, 69, 70, 72, 71, 70, 72, 71, 71],
  },
  {
    key: "compliance", label: "Compliance", icon: CheckCircle2, color: "#a855f7", score: 89, weight: 0.15,
    signals: [
      { label: "Active policies", value: "4 of 5", status: "good" },
      { label: "Pending approvals", value: "1 policy", status: "warn" },
      { label: "Audit trail", value: "Complete", status: "good" },
      { label: "Data retention", value: "Compliant", status: "good" },
    ],
    trend: [84, 86, 87, 88, 87, 89, 90, 89, 88, 90, 89, 89],
  },
];

const HISTORY = Array.from({ length: 30 }, (_, i) => {
  const base = 76;
  const noise = Math.sin(i * 0.4) * 4 + Math.random() * 3;
  return { day: `Apr ${i + 1}`, score: Math.round(Math.max(60, Math.min(95, base + noise))) };
}).slice(0, 15);

function scoreColor(score: number) {
  if (score >= 85) return "var(--color-low)";
  if (score >= 70) return "var(--color-medium)";
  return "var(--color-critical)";
}

function scoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Moderate";
  if (score >= 60) return "At Risk";
  return "Critical";
}

export default function HealthPage() {
  const { data } = useEcosystemData();
  const compositeScore = data?.compositeScore ?? Math.round(DIMENSIONS.reduce((s, d) => s + d.score * d.weight, 0));
  const [selected, setSelected] = useState<string | null>(null);

  const selectedDimension = DIMENSIONS.find((d) => d.key === selected);
  const radarData = DIMENSIONS.map((d) => ({ subject: d.label, score: d.score }));

  return (
    <OpsLayout title="Health Score">
      <div className="flex flex-col gap-6">
        {/* Hero Score */}
        <div
          className="rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8"
          style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
        >
          {/* Big Number */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-36 h-36 rounded-full flex flex-col items-center justify-center"
              style={{
                background: `conic-gradient(${scoreColor(compositeScore)} ${compositeScore * 3.6}deg, var(--color-bg-elevated) 0)`,
                padding: "4px",
              }}
            >
              <div
                className="w-full h-full rounded-full flex flex-col items-center justify-center"
                style={{ backgroundColor: "var(--color-bg-primary)" }}
              >
                <div className="text-5xl font-black font-mono" style={{ color: scoreColor(compositeScore) }}>{compositeScore}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--color-fg-muted)" }}>/ 100</div>
              </div>
            </div>
            <div className="text-lg font-bold" style={{ color: scoreColor(compositeScore) }}>{scoreLabel(compositeScore)}</div>
          </div>

          {/* Dimension Bars */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {DIMENSIONS.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.key} className="flex items-center gap-4 cursor-pointer" onClick={() => setSelected(selected === d.key ? null : d.key)}>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${d.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${d.color} 25%, transparent)` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                  </div>
                  <div className="w-24 text-xs font-semibold" style={{ color: "var(--color-fg-secondary)" }}>{d.label}</div>
                  <div className="flex-1 h-3 rounded-full relative" style={{ backgroundColor: "var(--color-bg-elevated)" }}>
                    <div className="h-full rounded-full" style={{ width: `${d.score}%`, backgroundColor: d.color }} />
                  </div>
                  <div className="w-8 text-right text-sm font-bold font-mono" style={{ color: scoreColor(d.score) }}>{d.score}</div>
                  <div className="text-[10px] font-mono w-10 text-right" style={{ color: "var(--color-fg-muted)" }}>×{d.weight}</div>
                </div>
              );
            })}
            <div className="flex items-center gap-4 pt-2" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
              <div className="w-7" />
              <div className="w-24 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-fg-muted)" }}>Composite</div>
              <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: "var(--color-bg-elevated)" }}>
                <div className="h-full rounded-full" style={{ width: `${compositeScore}%`, backgroundColor: scoreColor(compositeScore) }} />
              </div>
              <div className="w-8 text-right text-sm font-bold font-mono" style={{ color: scoreColor(compositeScore) }}>{compositeScore}</div>
              <div className="w-10" />
            </div>
          </div>

          {/* Radar */}
          <div className="hidden lg:block w-52 h-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }} />
                <Radar dataKey="score" stroke="#8b7ac8" fill="#8b7ac8" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend + Domain Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <div className="lg:col-span-2 rounded-xl p-5" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-fg-muted)" }}>Health Score Trend (15 days)</span>
              <div className="flex items-center gap-2">
                {compositeScore > HISTORY[HISTORY.length - 2]?.score ? (
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--color-low)" }} />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" style={{ color: "var(--color-high)" }} />
                )}
                <span className="text-xs font-mono" style={{ color: compositeScore > 75 ? "var(--color-low)" : "var(--color-high)" }}>
                  {compositeScore > 75 ? "+" : ""}{compositeScore - (HISTORY[0]?.score ?? compositeScore)} pts vs 15d ago
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={HISTORY}>
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis domain={[60, 95]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1d2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "10px" }} formatter={(v: number) => [v, "Health Score"]} />
                <Line type="monotone" dataKey="score" stroke="#8b7ac8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Domain Scores */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-fg-muted)" }}>Domain Scores</div>
            {(data?.domains ?? []).map((domain) => (
              <div key={domain.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: domain.color }} />
                <span className="text-xs font-semibold flex-1" style={{ color: domain.color }}>{domain.name}</span>
                <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-bg-elevated)" }}>
                  <div className="h-full rounded-full" style={{ width: `${domain.score}%`, backgroundColor: scoreColor(domain.score) }} />
                </div>
                <span className="text-xs font-bold font-mono w-6 text-right" style={{ color: scoreColor(domain.score) }}>{domain.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Service Status */}
        <ServiceStatusPanel />

        {/* Dimension Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIMENSIONS.map((d) => {
            const Icon = d.icon;
            const isSelected = selected === d.key;
            return (
              <div
                key={d.key}
                onClick={() => setSelected(isSelected ? null : d.key)}
                className="rounded-xl p-5 cursor-pointer transition-all"
                style={{
                  backgroundColor: isSelected ? "var(--color-bg-elevated)" : "var(--color-surface-base)",
                  border: `1px solid ${isSelected ? d.color : "var(--color-surface-border)"}`,
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${d.color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${d.color} 30%, transparent)` }}>
                    <Icon className="w-4 h-4" style={{ color: d.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold mb-0.5" style={{ color: d.color }}>{d.label}</div>
                    <div className="text-xs" style={{ color: "var(--color-fg-muted)" }}>Weight: {Math.round(d.weight * 100)}% of composite</div>
                  </div>
                  <div className="text-2xl font-black font-mono" style={{ color: scoreColor(d.score) }}>{d.score}</div>
                </div>
                <div className="flex flex-col gap-2">
                  {d.signals.map((sig) => {
                    const sigColor = sig.status === "good" ? "var(--color-low)" : sig.status === "warn" ? "var(--color-medium)" : "var(--color-critical)";
                    return (
                      <div key={sig.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--color-surface-border)" }}>
                        <span className="text-xs" style={{ color: "var(--color-fg-muted)" }}>{sig.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold" style={{ color: sigColor }}>{sig.value}</span>
                          {sig.status === "good" ? <CheckCircle2 className="w-3 h-3" style={{ color: sigColor }} /> : sig.status === "warn" ? <AlertTriangle className="w-3 h-3" style={{ color: sigColor }} /> : <AlertTriangle className="w-3 h-3" style={{ color: sigColor }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Mini trend */}
                <div className="flex items-end gap-px h-8 mt-3">
                  {d.trend.map((v, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ height: `${((v - 60) / 35) * 100}%`, backgroundColor: i === d.trend.length - 1 ? d.color : `color-mix(in srgb, ${d.color} 30%, transparent)` }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </OpsLayout>
  );
}
