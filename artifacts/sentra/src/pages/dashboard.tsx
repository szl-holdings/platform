import { ShieldAlert, Activity, Cpu, RotateCcw, ShieldCheck, BarChart3, AlertTriangle, Zap } from "lucide-react";
import { sentraTwin } from "@/data/sentra-twin";

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-100">Cyber Resilience Command</h1>
        <p className="text-slate-400 mt-1">Operational status and posture overview</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-red-400 mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-sm font-medium">Active Incidents</span>
          </div>
          <div className="text-4xl font-display font-bold">{sentraTwin.incidents.length}</div>
          <div className="text-xs text-red-400/60 mt-2 font-mono">CRITICAL STATUS</div>
        </div>

        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-amber-400 mb-2">
            <Cpu className="w-5 h-5" />
            <span className="text-sm font-medium">Assets at Risk</span>
          </div>
          <div className="text-4xl font-display font-bold">
            {sentraTwin.assets.filter(a => a.exposureScore > 70).length}
          </div>
          <div className="text-xs text-amber-400/60 mt-2 font-mono">EXPOSURE &gt; 70</div>
        </div>

        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-sky-400 mb-2">
            <RotateCcw className="w-5 h-5" />
            <span className="text-sm font-medium">Recovery Posture</span>
          </div>
          <div className="text-4xl font-display font-bold">{sentraTwin.recoveryPosture}%</div>
          <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
            <div 
              className="bg-sky-500 h-full transition-all duration-1000" 
              style={{ width: `${sentraTwin.recoveryPosture}%` }} 
            />
          </div>
        </div>

        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-purple-400 mb-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-medium">Control Drift</span>
          </div>
          <div className="text-4xl font-display font-bold">
            {sentraTwin.controlDrifts.filter(d => d.status === "drift_detected").length}
          </div>
          <div className="text-xs text-purple-400/60 mt-2 font-mono">RESPOND / RECOVER FAMILY</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 sentra-panel p-6">
          <h2 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Critical Incident Timeline
          </h2>
          <div className="space-y-6">
            {sentraTwin.incidents.map(incident => (
              <div key={incident.id} className="sentra-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-red-400">{incident.title}</h3>
                  <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-mono">
                    {incident.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">{incident.description}</p>
                <div className="flex items-center gap-6 text-[11px] font-mono text-slate-500">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    STAGE: {incident.mitreStage}
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    ID: {incident.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sentra-panel p-6">
          <h2 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="text-red-500 w-5 h-5" />
            Financial Exposure
          </h2>
          <div className="space-y-6">
            <div className="text-5xl font-display font-bold text-slate-100">
              ${(sentraTwin.financialExposure / 1000000).toFixed(1)}M
            </div>
            <p className="text-sm text-slate-400">Estimated cost avoidance via recommended isolation and recovery actions.</p>
            
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Ransomware Impact</span>
                <span className="text-slate-300">$1.8M</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Operational Downtime</span>
                <span className="text-slate-300">$850K</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Data Recovery Costs</span>
                <span className="text-slate-300">$150K</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
