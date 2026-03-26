import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Brain, Activity, AlertTriangle, Radio, Loader2, Zap, TrendingUp, FileText } from "lucide-react";
import { AnomalySparkline, SeverityMeter, TypewriterText, AnimatedGauge } from "@workspace/shared-ui/ai-components";

const API_BASE = "/api";
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function AIOps() {
  const { data: anomalies = [] } = useQuery({ queryKey: ["lyte-anomalies"], queryFn: () => apiFetch<any[]>("/intelligence/anomalies") });
  const { data: stats } = useQuery({ queryKey: ["lyte-stats"], queryFn: () => apiFetch<any>("/intelligence/platform-stats") });

  const [sitrepText, setSitrepText] = useState("");
  const [sitrepDone, setSitrepDone] = useState(false);

  const generateSitrep = async () => {
    setSitrepText("");
    setSitrepDone(false);
    try {
      const result = await apiFetch<any>("/intelligence/ai/situation-report", { method: "POST" });
      setSitrepText(result.report || result.content || "Situation report generated.");
    } catch {
      setSitrepText("Unable to generate situation report at this time.");
    }
    setSitrepDone(true);
  };

  const forecastData = [
    { label: "P1 Incidents (7d)", value: 2, trend: "stable", confidence: 87 },
    { label: "P2 Incidents (7d)", value: 5, trend: "increasing", confidence: 72 },
    { label: "System Alerts (7d)", value: 18, trend: "decreasing", confidence: 81 },
    { label: "SLA Breach Risk", value: 12, trend: "stable", confidence: 90 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-cyan-400" /> AI Operations Center
          </h2>
          <p className="text-sm text-slate-400 mt-1">Streaming situation reports, anomaly detection, and predictive incident forecasting</p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full border border-cyan-400/20">
          <Radio className="w-3 h-3 animate-pulse" /> Ops Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" /> AI Situation Report
            </h3>
            <button
              onClick={generateSitrep}
              className="text-xs px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-2"
            >
              <Zap className="w-3 h-3" /> Generate SITREP
            </button>
          </div>
          <div className="bg-black/30 rounded-xl p-5 border border-white/5 min-h-[200px]">
            {sitrepText ? (
              sitrepDone ? (
                <TypewriterText text={sitrepText} speed={12} className="text-sm text-slate-300 leading-relaxed" />
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Compiling situation report...
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] text-slate-500">
                <FileText className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Generate a real-time AI situation report</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Incident Forecast
          </h3>
          <div className="space-y-4">
            {forecastData.map((f, i) => (
              <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">{f.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    f.trend === "increasing" ? "bg-red-500/10 text-red-400" :
                    f.trend === "decreasing" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-slate-500/10 text-slate-400"
                  }`}>{f.trend}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">{f.value}</span>
                  <span className="text-xs text-slate-500">{f.confidence}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-400" /> AI Anomaly Detection
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anomalies.slice(0, 6).map((a: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{a.type || a.name || `Anomaly ${i + 1}`}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  a.severity === "critical" ? "bg-red-500/10 text-red-400" :
                  a.severity === "high" ? "bg-orange-500/10 text-orange-400" :
                  "bg-amber-500/10 text-amber-400"
                }`}>{a.severity}</span>
              </div>
              <AnomalySparkline
                data={Array.from({ length: 24 }, () => Math.random() * 100)}
                anomalyIndices={[Math.floor(Math.random() * 8) + 16]}
                width={220}
                height={35}
                color={a.severity === "critical" ? "#ef4444" : a.severity === "high" ? "#f97316" : "#eab308"}
              />
              <p className="text-xs text-slate-500 mt-2">{a.description || "Pattern deviation detected"}</p>
            </div>
          ))}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "System Load", value: 67, color: "cyan" as const },
            { label: "Error Rate", value: 3, color: "emerald" as const },
            { label: "API Latency", value: 42, color: "blue" as const },
            { label: "Queue Depth", value: 28, color: "violet" as const },
          ].map((g) => (
            <div key={g.label} className="bg-glass rounded-xl p-4 flex flex-col items-center">
              <AnimatedGauge value={g.value} label={g.label} color={g.color} size={90} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
