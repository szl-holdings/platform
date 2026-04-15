import { useState } from "react";
import { Wrench, Activity, AlertTriangle, CheckCircle2, Clock, TrendingUp, BarChart3, Cpu, Thermometer, Zap, Calendar } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

const PREDICTIONS = [
  {
    id: "PM-001",
    vessel: "Pacific Navigator",
    component: "Main Engine — Cylinder #3",
    system: "Propulsion",
    failureProbability: 0.87,
    daysToFailure: 28,
    severity: "critical",
    recommendedAction: "Cylinder liner inspection and replacement",
    estimatedDowntime: "2.5 days",
    maintenanceCost: 84_000,
    avoidedCost: 680_000,
    signals: [
      { label: "Exhaust Temp", trend: "+14°C / 30d", anomaly: true },
      { label: "Cylinder Pressure", trend: "-4.2 bar / 7d", anomaly: true },
      { label: "Lube Oil Consumption", trend: "+22% / 14d", anomaly: true },
    ],
    nextPortWindow: "Rotterdam — Apr 20",
  },
  {
    id: "PM-002",
    vessel: "Arctic Breeze",
    component: "Cargo Pump #2",
    system: "Cargo Handling",
    failureProbability: 0.64,
    daysToFailure: 55,
    severity: "high",
    recommendedAction: "Seal replacement and bearing inspection",
    estimatedDowntime: "1 day",
    maintenanceCost: 22_000,
    avoidedCost: 210_000,
    signals: [
      { label: "Vibration RMS", trend: "+0.8 mm/s / 21d", anomaly: true },
      { label: "Bearing Temp", trend: "+8°C / 14d", anomaly: true },
      { label: "Flow Rate", trend: "-3.2% / 7d", anomaly: false },
    ],
    nextPortWindow: "Singapore — May 12",
  },
  {
    id: "PM-003",
    vessel: "Meridian Bulk",
    component: "Auxiliary Generator #1",
    system: "Power Generation",
    failureProbability: 0.42,
    daysToFailure: 67,
    severity: "medium",
    recommendedAction: "Governor calibration and filter replacement",
    estimatedDowntime: "0.5 days",
    maintenanceCost: 8_500,
    avoidedCost: 95_000,
    signals: [
      { label: "Fuel Rack Position", trend: "+5% variance", anomaly: false },
      { label: "Coolant Temp", trend: "+3°C trending", anomaly: false },
      { label: "Load Sharing", trend: "Imbalance detected", anomaly: true },
    ],
    nextPortWindow: "Cape Town — May 28",
  },
  {
    id: "PM-004",
    vessel: "Cape Resolute",
    component: "Bow Thruster Motor",
    system: "Maneuvering",
    failureProbability: 0.31,
    daysToFailure: 90,
    severity: "watch",
    recommendedAction: "Electrical insulation test and cooling check",
    estimatedDowntime: "0.5 days",
    maintenanceCost: 12_000,
    avoidedCost: 45_000,
    signals: [
      { label: "Motor Current Draw", trend: "+6% / 30d", anomaly: false },
      { label: "Winding Temp", trend: "+5°C", anomaly: false },
      { label: "Brush Wear", trend: "62% consumed", anomaly: false },
    ],
    nextPortWindow: "Port Said — Jun 02",
  },
];

const SCHEDULE = [
  { vessel: "Pacific Navigator", component: "Cylinder #3", date: "Apr 20", port: "Rotterdam", status: "scheduled", priority: "critical" },
  { vessel: "Arctic Breeze", component: "Cargo Pump Seals", date: "May 12", port: "Singapore", status: "planned", priority: "high" },
  { vessel: "Pacific Navigator", component: "Annual Dry Dock", date: "Jun 15", port: "Antwerp", status: "booked", priority: "routine" },
  { vessel: "Meridian Bulk", component: "Generator Service", date: "May 28", port: "Cape Town", status: "planned", priority: "medium" },
  { vessel: "Cape Resolute", component: "Bow Thruster Check", date: "Jun 02", port: "Port Said", status: "tentative", priority: "watch" },
];

const HEALTH_SCORES = [
  { vessel: "Pacific Navigator", score: 71, trend: "down", components: 48 },
  { vessel: "Arctic Breeze", score: 84, trend: "stable", components: 62 },
  { vessel: "Meridian Bulk", score: 79, trend: "stable", components: 54 },
  { vessel: "Cape Resolute", score: 91, trend: "up", components: 41 },
];

const sevColor: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  watch: "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

const priorityColor: Record<string, string> = {
  critical: "text-red-400", high: "text-orange-400", medium: "text-amber-400", watch: "text-sky-400", routine: "text-emerald-400",
};

function ProbabilityRing({ prob }: { prob: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = prob * circ;
  const color = prob > 0.75 ? "#f87171" : prob > 0.5 ? "#fb923c" : prob > 0.3 ? "#fbbf24" : "#38bdf8";
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4} style={{ transition: "all 0.8s ease" }} />
      <text x="28" y="32" textAnchor="middle" fontSize="10" fontWeight="bold" fill={color} fontFamily="monospace">
        {Math.round(prob * 100)}%
      </text>
    </svg>
  );
}

export default function PredictiveMaintenancePage() {
  const [selectedPred, setSelectedPred] = useState(PREDICTIONS[0]);
  const [tab, setTab] = useState<"predictions" | "schedule" | "fleet">("predictions");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-4 h-4 text-sky-400" />
            <h1 className="font-display text-xl font-bold text-sky-50">Predictive Maintenance Neural Network</h1>
            <Badge variant="outline" className="text-[9px] text-violet-400 border-violet-500/30 bg-violet-500/5">ML MODEL v3.1</Badge>
          </div>
          <p className="text-xs text-sky-400/40">Failure prediction 30–90 days out · Vibration, temperature & operational data fusion</p>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="text-lg font-bold font-mono text-red-400">1</p>
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Critical</p>
          </div>
          <div>
            <p className="text-lg font-bold font-mono text-orange-400">1</p>
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">High</p>
          </div>
          <div>
            <p className="text-lg font-bold font-mono text-amber-400">2</p>
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Watch</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1">
        {(["predictions", "schedule", "fleet"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("text-xs px-4 py-1.5 rounded-lg capitalize transition-colors", tab === t ? "bg-sky-500/10 text-sky-300 border border-sky-500/20" : "text-sky-400/50 hover:text-sky-300")}>
            {t === "predictions" ? "Failure Predictions" : t === "schedule" ? "Maintenance Schedule" : "Fleet Health"}
          </button>
        ))}
      </div>

      {tab === "predictions" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-3">
            {PREDICTIONS.map(p => (
              <button key={p.id} onClick={() => setSelectedPred(p)} className={cn("w-full text-left bg-[#0a1628]/80 border rounded-xl p-4 transition-all hover:border-sky-500/20", selectedPred.id === p.id ? "border-sky-500/30" : "border-sky-500/10")}>
                <div className="flex items-start gap-4">
                  <ProbabilityRing prob={p.failureProbability} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-sky-100">{p.component}</p>
                      <Badge variant="outline" className={cn("text-[9px]", sevColor[p.severity])}>{p.severity}</Badge>
                    </div>
                    <p className="text-[10px] text-sky-400/40 mb-2">{p.vessel} · {p.system}</p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-1 text-[10px] text-red-400"><Clock className="w-3 h-3" />{p.daysToFailure} days to failure</div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 className="w-3 h-3" />Saves ${(p.avoidedCost / 1000).toFixed(0)}K if actioned</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.signals.map(s => (
                        <span key={s.label} className={cn("text-[9px] px-1.5 py-0.5 rounded border", s.anomaly ? "text-amber-400 border-amber-500/20 bg-amber-500/5" : "text-sky-400/40 border-sky-500/10 bg-sky-500/5")}>
                          {s.label}: {s.trend}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-sky-400/30 shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-[#0a1628]/80 border border-sky-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-400" />Failure Analysis</p>
              <p className="text-sm font-bold text-sky-100 mb-1">{selectedPred.component}</p>
              <p className="text-[10px] text-sky-400/40 mb-3">{selectedPred.vessel} · {selectedPred.system}</p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between"><span className="text-[10px] text-sky-400/50">Failure probability</span><span className="text-[10px] font-mono text-red-400">{Math.round(selectedPred.failureProbability * 100)}%</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-sky-400/50">Days to failure</span><span className="text-[10px] font-mono text-orange-400">{selectedPred.daysToFailure} days</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-sky-400/50">Est. downtime</span><span className="text-[10px] font-mono text-sky-300">{selectedPred.estimatedDowntime}</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-sky-400/50">Repair cost</span><span className="text-[10px] font-mono text-sky-300">${(selectedPred.maintenanceCost / 1000).toFixed(0)}K</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-sky-400/50">Avoidance value</span><span className="text-[10px] font-mono text-emerald-400">${(selectedPred.avoidedCost / 1000).toFixed(0)}K</span></div>
              </div>
              <div className="bg-sky-500/5 rounded-lg p-3 mb-3">
                <p className="text-[9px] text-sky-400/50 uppercase tracking-wider mb-1">Recommended Action</p>
                <p className="text-[11px] text-sky-200">{selectedPred.recommendedAction}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <Calendar className="w-3 h-3" />
                <span>Optimal window: {selectedPred.nextPortWindow}</span>
              </div>
            </div>

            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-violet-400" />ML Model Stats</p>
              {[
                { label: "Training samples", val: "4.2M data points" },
                { label: "Prediction accuracy", val: "91.4%" },
                { label: "False positive rate", val: "4.2%" },
                { label: "Lead time avg", val: "47 days" },
                { label: "Model updated", val: "Apr 14, 2026" },
              ].map(m => (
                <div key={m.label} className="flex justify-between py-1.5 border-b border-sky-500/5 last:border-0">
                  <span className="text-[10px] text-sky-400/50">{m.label}</span>
                  <span className="text-[10px] font-mono text-sky-300">{m.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "schedule" && (
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-sky-500/10">
            <p className="text-xs font-semibold text-sky-200">Optimized Maintenance Schedule</p>
            <p className="text-[10px] text-sky-400/40">Auto-synchronized with port calls and dry dock windows</p>
          </div>
          <div className="divide-y divide-sky-500/5">
            {SCHEDULE.map((s, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-4">
                <div className="w-20 shrink-0">
                  <p className="text-xs font-mono text-sky-300">{s.date}</p>
                  <p className="text-[9px] text-sky-400/40">{s.port}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-sky-100">{s.component}</p>
                  <p className="text-[10px] text-sky-400/40">{s.vessel}</p>
                </div>
                <Badge variant="outline" className={cn("text-[9px]", s.status === "scheduled" ? "text-sky-400 border-sky-500/20" : s.status === "booked" ? "text-emerald-400 border-emerald-500/20" : "text-sky-400/40 border-sky-500/10")}>{s.status}</Badge>
                <span className={cn("text-[10px] font-medium", priorityColor[s.priority])}>{s.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "fleet" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HEALTH_SCORES.map(h => (
            <div key={h.vessel} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-sky-100 mb-1">{h.vessel}</p>
              <p className="text-[10px] text-sky-400/40 mb-3">{h.components} components monitored</p>
              <div className="flex items-center gap-3">
                <p className={cn("text-3xl font-bold font-mono", h.score >= 85 ? "text-emerald-400" : h.score >= 70 ? "text-amber-400" : "text-red-400")}>{h.score}</p>
                <div>
                  <p className="text-[9px] text-sky-400/40">Health Score</p>
                  <Badge variant="outline" className={cn("text-[9px] mt-0.5", h.trend === "up" ? "text-emerald-400 border-emerald-500/20" : h.trend === "down" ? "text-red-400 border-red-500/20" : "text-sky-400/40 border-sky-500/10")}>{h.trend}</Badge>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-500/60 to-sky-400/20 transition-all" style={{ width: `${h.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
