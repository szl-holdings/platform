import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, AlertTriangle, Brain, Radio, Ship, Loader2, Navigation } from "lucide-react";
import { NERHighlight, AnimatedGauge, SeverityMeter } from "@workspace/shared-ui/ai-components";

const API_BASE = "/api";
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function VesselsIntelligence() {
  const { data: sanctions } = useQuery({ queryKey: ["maritime-sanctions"], queryFn: () => apiFetch<any>("/intelligence/maritime/sanctions") });
  const { data: vessels = [] } = useQuery({ queryKey: ["maritime-vessels"], queryFn: () => apiFetch<any[]>("/intelligence/maritime/vessels") });
  const { data: chokepoints = [] } = useQuery({ queryKey: ["maritime-chokepoints"], queryFn: () => apiFetch<any[]>("/intelligence/maritime/chokepoints") });

  const routeAnalysis = useMutation({
    mutationFn: (route: string) => apiFetch<any>("/intelligence/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message: `Analyze this maritime route for safety risks, piracy threats, weather hazards, and sanctions compliance: ${route}. Provide a concise risk assessment with severity ratings.` }),
    }),
  });

  const [selectedRoute, setSelectedRoute] = useState("Singapore Strait → Suez Canal → Rotterdam");
  const routes = [
    "Singapore Strait → Suez Canal → Rotterdam",
    "Shanghai → Panama Canal → New York",
    "Dubai → Cape of Good Hope → Houston",
    "Tokyo → Bering Strait → London",
  ];

  const riskScores = [
    { label: "Piracy Index", value: 34, color: "emerald" as const },
    { label: "Sanctions Risk", value: 67, color: "orange" as const },
    { label: "Weather Hazard", value: 52, color: "cyan" as const },
    { label: "Chokepoint Risk", value: 78, color: "red" as const },
  ];

  const sanctionsArray: any[] = Array.isArray(sanctions) ? sanctions : [];
  const allEntities = sanctionsArray.flatMap((v: any) => v.entities || []);
  const sanctionText = sanctionsArray.length > 0
    ? sanctionsArray.map((v: any) => `${v.name} flagged under ${v.flag} for ${v.reason}`).join(". ")
    : "Loading sanctions data...";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-cyan-400" /> AI Maritime Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time risk analysis, NER-powered sanctions monitoring, and AI route safety</p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full border border-cyan-400/20">
          <Radio className="w-3 h-3 animate-pulse" /> Live Feed
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {riskScores.map((s) => (
          <div key={s.label} className="bg-white/[0.03] rounded-xl border border-white/5 p-4 flex flex-col items-center">
            <AnimatedGauge value={s.value} label={s.label} color={s.color} size={100} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" /> AI Sanctions Monitor
          </h3>
          <p className="text-xs text-slate-500 mb-3">NER-highlighted entities detected in sanctions data</p>
          <div className="bg-black/30 rounded-xl p-4 border border-white/5 max-h-[300px] overflow-y-auto">
            <NERHighlight text={sanctionText} entities={allEntities} className="text-sm text-slate-300" />
          </div>
          {allEntities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[10px] text-slate-500">Detected:</span>
              {["PER", "ORG", "LOC", "MISC"].map((type) => {
                const count = allEntities.filter((e: any) => e.entity === type).length;
                if (!count) return null;
                return (
                  <span key={type} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                    {type}: {count}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" /> AI Route Safety Analysis
          </h3>
          <div className="space-y-3 mb-4">
            {routes.map((r) => (
              <button
                key={r}
                onClick={() => { setSelectedRoute(r); routeAnalysis.mutate(r); }}
                className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                  selectedRoute === r
                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                    : "border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/5"
                }`}
              >
                <Ship className="w-3.5 h-3.5 inline mr-2" />{r}
              </button>
            ))}
          </div>
          <div className="bg-black/30 rounded-xl p-4 border border-white/5 min-h-[120px]">
            {routeAnalysis.isPending ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing route safety...
              </div>
            ) : routeAnalysis.data ? (
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{routeAnalysis.data.content}</p>
            ) : (
              <p className="text-sm text-slate-500">Select a route to generate AI safety analysis</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" /> Chokepoint Risk Assessment
        </h3>
        <div className="space-y-3">
          {chokepoints.map((cp: any, i: number) => (
            <SeverityMeter
              key={i}
              level={cp.riskLevel === "critical" ? "critical" : cp.riskLevel === "warning" ? "high" : cp.riskLevel === "elevated" ? "medium" : "low"}
              score={cp.riskLevel === "critical" ? 90 : cp.riskLevel === "warning" ? 70 : cp.riskLevel === "elevated" ? 50 : 25}
              label={cp.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
