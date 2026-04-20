import { cn } from '@szl-holdings/shared-ui/utils';
import { Activity, Cpu, Database, RefreshCcw, ShieldAlert } from 'lucide-react';
import { sentraTwin } from '@/data/sentra-twin';

export default function AssetRiskGraph() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100">Asset Risk Graph</h1>
          <p className="text-slate-400 mt-1">
            Critical infrastructure exposure and protection status
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono">
            <Database className="w-3 h-3" />
            TOTAL: {sentraTwin.assets.length}
          </div>
        </div>
      </header>

      <div className="sentra-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-red-500/10 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              <th className="px-6 py-4 font-medium">Asset Name</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Criticality</th>
              <th className="px-6 py-4 font-medium">Exposure</th>
              <th className="px-6 py-4 font-medium">Backup</th>
              <th className="px-6 py-4 font-medium">Control Gaps</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sentraTwin.assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-200">{asset.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase">{asset.id}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-mono',
                      asset.type === 'OT'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
                    )}
                  >
                    {asset.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">
                  {asset.criticality}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          asset.exposureScore > 80
                            ? 'bg-red-500'
                            : asset.exposureScore > 50
                              ? 'bg-amber-500'
                              : 'bg-emerald-500',
                        )}
                        style={{ width: `${asset.exposureScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-300">{asset.exposureScore}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs">
                  <div
                    className={cn(
                      'flex items-center gap-2',
                      asset.backupStatus === 'current'
                        ? 'text-emerald-400'
                        : asset.backupStatus === 'stale'
                          ? 'text-amber-400'
                          : 'text-red-400',
                    )}
                  >
                    <RefreshCcw className="w-3 h-3" />
                    {asset.backupStatus.toUpperCase()}
                  </div>
                  {asset.lastBackupAt && (
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      {new Date(asset.lastBackupAt).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-red-400/80 font-mono">
                    {asset.controlGaps.length} GAPS
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-[10px] font-bold border',
                      asset.status === 'compromised'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : asset.status === 'isolated'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    )}
                  >
                    {asset.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
