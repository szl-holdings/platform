import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Activity, Globe, AlertTriangle, FileText, Radio, TrendingUp, Clock, Newspaper, Zap, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = "/api";
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let c = false;
    const s = performance.now();
    const step = (n: number) => { if (c) return; const p = Math.min((n - s) / 1000, 1); setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    return () => { c = true; };
  }, [value]);
  return <>{display}</>;
}

const severityColors: Record<string, string> = {
  critical: "text-red-400 bg-red-400/10 border-red-400/20",
  warning: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  info: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  active: "text-red-400",
  investigating: "text-orange-400",
  monitoring: "text-blue-400",
};

export default function IntelligencePage() {
  const { data: anomalies = [] } = useQuery({ queryKey: ["intel-anomalies"], queryFn: () => apiFetch<any[]>("/intelligence/anomalies"), refetchInterval: 30000 });
  const { data: opsHeatmap = [] } = useQuery({ queryKey: ["intel-ops-heatmap"], queryFn: () => apiFetch<any[]>("/intelligence/ops-heatmap"), refetchInterval: 60000 });
  const { data: news = [] } = useQuery({ queryKey: ["intel-news"], queryFn: () => apiFetch<any[]>("/intelligence/news"), refetchInterval: 120000 });
  const { data: sitRep } = useQuery({ queryKey: ["intel-sitrep"], queryFn: () => apiFetch<any>("/intelligence/ai/situation-report", { method: "POST", body: JSON.stringify({}) }), refetchInterval: 600000, retry: 1 });

  const criticalAnomalies = anomalies.filter((a: any) => a.severity === "critical").length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-cyan-400" /> Intelligence Center
          </h2>
          <p className="text-slate-400 text-lg">AI-powered anomaly detection, predictive analytics, and real-time intelligence feeds.</p>
        </div>
        <Badge className="bg-cyan-400/10 text-cyan-400 border-cyan-400/20 animate-pulse">
          <Radio className="w-3 h-3 mr-1" /> Live
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-glass rounded-2xl p-6 group hover:border-white/10 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl border text-cyan-400 bg-cyan-400/10 border-cyan-400/20"><Activity className="w-6 h-6" /></div>
          </div>
          <h4 className="text-slate-400 text-sm font-medium mb-1">Anomalies Detected</h4>
          <div className="text-3xl font-display font-bold text-white"><AnimatedCounter value={anomalies.length} /></div>
        </div>
        <div className="bg-glass rounded-2xl p-6 group hover:border-white/10 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl border text-red-400 bg-red-400/10 border-red-400/20 ${criticalAnomalies > 0 ? "animate-pulse" : ""}`}><AlertTriangle className="w-6 h-6" /></div>
          </div>
          <h4 className="text-slate-400 text-sm font-medium mb-1">Critical</h4>
          <div className="text-3xl font-display font-bold text-red-400"><AnimatedCounter value={criticalAnomalies} /></div>
        </div>
        <div className="bg-glass rounded-2xl p-6 group hover:border-white/10 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl border text-blue-400 bg-blue-400/10 border-blue-400/20"><Newspaper className="w-6 h-6" /></div>
          </div>
          <h4 className="text-slate-400 text-sm font-medium mb-1">News Items</h4>
          <div className="text-3xl font-display font-bold text-white"><AnimatedCounter value={news.length} /></div>
        </div>
        <div className="bg-glass rounded-2xl p-6 group hover:border-white/10 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl border text-emerald-400 bg-emerald-400/10 border-emerald-400/20"><Shield className="w-6 h-6" /></div>
          </div>
          <h4 className="text-slate-400 text-sm font-medium mb-1">Threats Tracked</h4>
          <div className="text-3xl font-display font-bold text-white"><AnimatedCounter value={sitRep?.stats?.totalThreats || 0} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-glass rounded-2xl p-6">
          <h3 className="text-xl font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" /> Global Operations Heatmap
          </h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-0.5 min-w-[600px]">
              <div className="text-xs text-slate-500 p-1" />
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="text-[10px] text-slate-500 text-center p-1">{i}h</div>
              ))}
              {["Americas", "Europe", "Asia", "Middle East"].map((region) => {
                const key = region.toLowerCase().replace(" ", "") as string;
                const regionKey = key === "americas" ? "americas" : key === "europe" ? "europe" : key === "asia" ? "asia" : "middleEast";
                return (
                  <div key={region} className="contents">
                    <div className="text-xs text-slate-400 p-1 pr-3 flex items-center">{region}</div>
                    {opsHeatmap.map((h: any, i: number) => {
                      const val = h[regionKey] || 0;
                      const intensity = Math.min(val / 100, 1);
                      return (
                        <div key={i} className="w-full aspect-square rounded-sm transition-colors" style={{ backgroundColor: `rgba(6, 182, 212, ${intensity * 0.8})` }} title={`${region} ${i}:00 - ${val}%`} />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-glass rounded-2xl p-6">
          <h3 className="text-xl font-display font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" /> AI Situation Report
          </h3>
          {sitRep ? (
            <div className="space-y-4">
              <div className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/10">
                <p className="text-xs text-purple-400 font-medium mb-2">Executive Summary</p>
                <p className="text-sm text-slate-300">{sitRep.summary?.summary || "Generating..."}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Threats</p>
                  <p className="text-xl font-bold text-white">{sitRep.stats?.totalThreats}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Critical CVEs</p>
                  <p className="text-xl font-bold text-red-400">{sitRep.stats?.criticalCves}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Anomalies</p>
                  <p className="text-xl font-bold text-orange-400">{sitRep.stats?.activeAnomalies}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Geo Events</p>
                  <p className="text-xl font-bold text-cyan-400">{sitRep.stats?.geoEvents}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-600">Generated {new Date(sitRep.generatedAt).toLocaleTimeString()}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-glass rounded-2xl p-6">
          <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-400" /> AI Anomaly Detection
          </h3>
          <div className="space-y-3">
            {anomalies.map((a: any) => (
              <div key={a.id} className={`p-4 rounded-xl border ${a.severity === "critical" ? "border-red-500/20 bg-red-500/5" : a.severity === "warning" ? "border-orange-500/20 bg-orange-500/5" : "border-white/5 bg-white/5"}`}>
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`text-xs ${severityColors[a.severity] || ""}`}>{a.severity}</Badge>
                  <Badge variant="outline" className={`text-xs ${severityColors[a.status] || "text-slate-400"}`}>{a.status}</Badge>
                </div>
                <p className="text-sm text-white">{a.description}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.detectedAt).toLocaleString()}</span>
                  <span>Confidence: {(a.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-glass rounded-2xl p-6">
          <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-400" /> Real-Time News Feed
          </h3>
          <div className="space-y-3">
            {news.map((n: any) => (
              <div key={n.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">{n.category}</Badge>
                  <Badge variant="outline" className={`text-xs ${n.sentiment === "negative" ? "text-red-400 bg-red-400/10 border-red-400/20" : n.sentiment === "positive" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-slate-400"}`}>
                    {n.sentiment} ({(n.sentimentScore * 100).toFixed(0)}%)
                  </Badge>
                </div>
                <p className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">{n.title}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>{n.source}</span>
                  <span>{new Date(n.publishedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
