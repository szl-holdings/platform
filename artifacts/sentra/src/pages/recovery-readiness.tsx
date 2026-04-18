import { RotateCcw, ShieldCheck, AlertTriangle, Activity, Database, Clock } from "lucide-react";
import { sentraTwin } from "@/data/sentra-twin";
import { cn } from "@szl-holdings/shared-ui/utils";

export default function RecoveryReadiness() {
  const posture = sentraTwin.recoveryPosture;

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-100">Recovery Readiness</h1>
        <p className="text-slate-400 mt-1">Verification of backup integrity and RTO/RPO targets</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="sentra-panel p-8 text-center flex flex-col items-center justify-center space-y-4">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={552}
                strokeDashoffset={552 - (552 * posture) / 100}
                className={cn(
                  "transition-all duration-1000",
                  posture < 50 ? "text-red-500" : posture < 80 ? "text-amber-500" : "text-emerald-500"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-display font-bold">{posture}%</span>
              <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">Posture Score</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 px-4">
            Current recovery posture is degraded due to stale backups on {sentraTwin.assets.filter(a => a.backupStatus === 'stale').length} critical servers.
          </p>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="sentra-panel p-6">
            <h2 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-red-500" />
              Backup Staleness Indicators
            </h2>
            <div className="space-y-4">
              {sentraTwin.assets.filter(a => a.backupStatus !== 'current').map(asset => (
                <div key={asset.id} className="sentra-card p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center">
                      <Database className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">{asset.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{asset.id}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-xs font-bold font-mono",
                      asset.backupStatus === 'stale' ? "text-amber-500" : "text-red-500"
                    )}>
                      {asset.backupStatus.toUpperCase()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {asset.lastBackupAt ? `${Math.floor((Date.now() - new Date(asset.lastBackupAt).getTime()) / 3600000)}h ago` : 'NEVER'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="sentra-panel p-6">
              <div className="text-xs text-slate-500 font-mono uppercase mb-2">Avg RTO Target</div>
              <div className="text-3xl font-display font-bold">4.2h</div>
              <div className="text-[10px] text-emerald-400 mt-1 font-mono">ON TARGET</div>
            </div>
            <div className="sentra-panel p-6">
              <div className="text-xs text-slate-500 font-mono uppercase mb-2">Avg RPO Actual</div>
              <div className="text-3xl font-display font-bold">18.5h</div>
              <div className="text-[10px] text-red-400 mt-1 font-mono">+14.5H VARIANCE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
