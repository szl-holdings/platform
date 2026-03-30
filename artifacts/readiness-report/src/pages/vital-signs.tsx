import { Heart, Activity, Thermometer, Zap, TrendingUp, ArrowUp, ArrowDown, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const vitalSigns = [
  { name: "Infrastructure Health", value: 94, target: 95, trend: "up", change: "+2.1%", status: "healthy", icon: Heart, history: [88, 90, 91, 93, 92, 94] },
  { name: "Deployment Velocity", value: 87, target: 85, trend: "up", change: "+5.4%", status: "exceeding", icon: Zap, history: [78, 80, 82, 84, 85, 87] },
  { name: "Error Rate", value: 0.12, target: 0.5, trend: "down", change: "-0.08%", status: "healthy", icon: AlertTriangle, history: [0.4, 0.35, 0.28, 0.2, 0.15, 0.12] },
  { name: "Team Readiness", value: 91, target: 90, trend: "up", change: "+1.8%", status: "exceeding", icon: Activity, history: [85, 86, 88, 89, 90, 91] },
];

const heartbeatMonitors = [
  { dimension: "Security Posture", heartbeat: "stable", bpm: 72, lastCheck: "30s ago", score: 88, alerts: 2 },
  { dimension: "Performance", heartbeat: "elevated", bpm: 95, lastCheck: "15s ago", score: 76, alerts: 5 },
  { dimension: "Compliance", heartbeat: "stable", bpm: 60, lastCheck: "1m ago", score: 94, alerts: 0 },
  { dimension: "Team Capacity", heartbeat: "stable", bpm: 68, lastCheck: "45s ago", score: 82, alerts: 1 },
  { dimension: "Budget Health", heartbeat: "elevated", bpm: 88, lastCheck: "2m ago", score: 71, alerts: 3 },
  { dimension: "Customer Satisfaction", heartbeat: "stable", bpm: 65, lastCheck: "30s ago", score: 92, alerts: 0 },
];

const predictions = [
  { metric: "Overall Readiness", current: 89, predicted30d: 92, predicted90d: 95, confidence: 87 },
  { metric: "Infrastructure Score", current: 94, predicted30d: 95, predicted90d: 97, confidence: 92 },
  { metric: "Security Score", current: 88, predicted30d: 90, predicted90d: 93, confidence: 78 },
  { metric: "Team Velocity", current: 87, predicted30d: 89, predicted90d: 91, confidence: 84 },
];

export default function VitalSigns() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-400" /> Vital Signs Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Health pulse metrics and heartbeat monitoring for every dimension</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {vitalSigns.map((vs) => (
          <div key={vs.name} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <vs.icon className={`w-5 h-5 ${vs.status === "exceeding" ? "text-emerald-400" : vs.status === "healthy" ? "text-blue-400" : "text-amber-400"}`} />
              <span className={`flex items-center gap-1 text-xs ${vs.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                {vs.trend === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {vs.change}
              </span>
            </div>
            <div className="text-2xl font-display font-bold">{vs.value}{typeof vs.value === "number" && vs.value > 1 ? "%" : "%"}</div>
            <div className="text-xs text-muted-foreground mt-1">{vs.name}</div>
            <div className="mt-3 flex items-end gap-0.5 h-8">
              {vs.history.map((v, i) => (
                <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${(v / Math.max(...vs.history.map(h => typeof h === "number" ? h : 1))) * 100}%` }}>
                  <div className="w-full h-full bg-primary/40 rounded-t" />
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">Target: {vs.target}{typeof vs.target === "number" && vs.target > 1 ? "%" : "%"}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400" /> Heartbeat Monitoring
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {heartbeatMonitors.map((hb) => (
            <div key={hb.dimension} className="rounded-lg border border-border p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{hb.dimension}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  hb.heartbeat === "stable" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                }`}>{hb.heartbeat}</span>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <div className="text-2xl font-display font-bold">{hb.score}</div>
                  <div className="text-[10px] text-muted-foreground">Score</div>
                </div>
                <div>
                  <div className="text-lg font-mono text-red-400">{hb.bpm}</div>
                  <div className="text-[10px] text-muted-foreground">BPM</div>
                </div>
                <div>
                  <div className="text-lg font-mono">{hb.alerts}</div>
                  <div className="text-[10px] text-muted-foreground">Alerts</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" /> Last check: {hb.lastCheck}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" /> Trend Prediction
        </h2>
        <div className="space-y-4">
          {predictions.map((p) => (
            <div key={p.metric} className="flex items-center gap-4 p-3 rounded-lg border border-border">
              <span className="text-sm font-medium w-40">{p.metric}</span>
              <div className="flex items-center gap-6 flex-1">
                <div className="text-center">
                  <div className="text-lg font-bold">{p.current}</div>
                  <div className="text-[10px] text-muted-foreground">Current</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{p.predicted30d}</div>
                  <div className="text-[10px] text-muted-foreground">30 Days</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">{p.predicted90d}</div>
                  <div className="text-[10px] text-muted-foreground">90 Days</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{p.confidence}% confidence</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArrowRight(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
