import { ProofEnvelope } from '@szl-holdings/design-system';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  Anchor,
  ArrowRight,
  Navigation,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { portTwins, regulatoryZones, routeTwins, vesselTwins } from '@/data/fleet-twin';

export default function GeoDecisionCenter() {
  const [isDisrupted, setIsDisrupted] = useState(false);

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#f5f5f5] uppercase tracking-tight">
            Geo Decision Center
          </h1>
          <p className="text-sm text-[#9a9a9a] font-medium">
            Fleet routing, port congestion, and regulatory zone risk analysis
          </p>
        </div>
        <button
          onClick={() => setIsDisrupted(!isDisrupted)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-medium text-sm',
            isDisrupted
              ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
              : 'bg-[#c9b787]/10 border-[#c9b787]/40 text-[#c9b787] hover:bg-[#c9b787]/16 shadow-[0_0_15px_rgba(77,143,204,0.1)]',
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isDisrupted && 'animate-spin')} />
          {isDisrupted ? 'Reset Simulation' : 'Simulate Route Disruption'}
        </button>
      </div>

      <div className="space-y-6">
        {isDisrupted && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="lg:col-span-2">
              <ProofEnvelope
                title="Reroute MV Avalon Spirit via Cape of Good Hope"
                confidence={0.87}
                timestamp={new Date()}
                evidence={[
                  { id: 'e1', label: 'Suez Congestion Sensor', type: 'signal' },
                  { id: 'e2', label: 'Gulf of Aden Risk API', type: 'api' },
                ]}
                policyState="requires-approval"
                autonomyMode="recommend"
                accentColor="#38bdf8"
              >
                <div className="space-y-4">
                  <p className="text-sm text-[#e0e0e0]/80 leading-relaxed">
                    Suez Canal congestion and elevated risk in the Gulf of Aden have reached
                    critical thresholds. AI recommending rerouting via Cape of Good Hope to ensure
                    cargo integrity and avoid cascading delays.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-[#c9b787]/8 border border-white/[0.06]">
                      <p className="text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-1">
                        Additional Cost
                      </p>
                      <p className="text-lg font-semibold text-[#f5f5f5]">$82K</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                      <p className="text-[10px] uppercase tracking-wider text-red-400/50 mb-1">
                        Cost Avoidance
                      </p>
                      <p className="text-lg font-semibold text-red-400">$185K</p>
                    </div>
                  </div>
                </div>
              </ProofEnvelope>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0e0e0e] border border-red-500/20">
                <div className="flex items-center gap-2 text-red-400 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase tracking-wider">
                    Critical Disruption
                  </span>
                </div>
                <p className="text-xs text-[#a0a08a] mb-4">
                  Multiple vessels impacted by zone closure. Recommendation engine calculating
                  optimal diversion vectors.
                </p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8a8a8a]">Impacted Assets</span>
                  <span className="text-red-400 font-mono">3 Vessels</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-white/[0.06] bg-[#0e0e0e] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#c9b787]/8 border-b border-white/[0.06]">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
                  Vessel
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
                  Status
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
                  Current Zone
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
                  Port Status
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
                  Route Risk
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
                  Exceptions
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
                  Regulatory Alert
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-500/10">
              {vesselTwins.map((vessel) => {
                const zone = regulatoryZones[Math.floor(Math.random() * regulatoryZones.length)];
                const port = portTwins[Math.floor(Math.random() * portTwins.length)];

                return (
                  <tr key={vessel.id} className="hover:bg-[#c9b787]/8 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#f5f5f5]">{vessel.name}</span>
                        <span className="text-[10px] text-[#8a8a8a] font-mono">{vessel.imo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            vessel.currentStatus === 'underway'
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-[#c9b787]',
                          )}
                        />
                        <span className="text-xs text-[#e0e0e0] capitalize">
                          {vessel.currentStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-[#d4c598]">
                        <Navigation className="w-3.5 h-3.5 text-[#8a8a8a]" />
                        <span className="text-xs">{zone.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Anchor className="w-3.5 h-3.5 text-[#8a8a8a]" />
                        <div className="flex flex-col">
                          <span className="text-xs text-[#e0e0e0]">{port.name}</span>
                          <span
                            className={cn(
                              'text-[10px]',
                              port.congestionLevel === 'high' ? 'text-red-400' : 'text-amber-400',
                            )}
                          >
                            {port.waitHours}h wait
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1 bg-[#c9b787]/10 rounded-full overflow-hidden max-w-[60px]">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              vessel.readinessScore > 90 ? 'bg-emerald-500' : 'bg-amber-500',
                            )}
                            style={{ width: `${vessel.readinessScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[#c9b787]">
                          {vessel.readinessScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {vessel.anomalyFlags.length > 0 ? (
                          vessel.anomalyFlags.map((flag) => (
                            <span
                              key={flag}
                              className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 uppercase tracking-tighter"
                            >
                              {flag.replace('_', ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-emerald-400/50">NONE</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] w-fit',
                          zone.riskLevel === 'critical'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-[#c9b787]/10 border-white/[0.08] text-[#c9b787]',
                        )}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        {zone.alertType}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl border border-white/[0.06] bg-[#0e0e0e] space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">
              Regulatory Zones
            </h3>
            <div className="space-y-3">
              {regulatoryZones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between p-2 rounded bg-[#c9b787]/8 border border-white/[0.08]"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-[#f5f5f5]">{zone.name}</span>
                    <span className="text-[10px] text-[#8a8a8a]">{zone.alertType}</span>
                  </div>
                  <div
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase',
                      zone.riskLevel === 'critical'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-400',
                    )}
                  >
                    {zone.riskLevel}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.06] bg-[#0e0e0e] space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">
              Port Congestion
            </h3>
            <div className="space-y-3">
              {portTwins.map((port) => (
                <div key={port.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#f5f5f5]">{port.name}</span>
                    <span className="text-[10px] font-mono text-[#c9b787]">
                      {port.waitHours}h WAIT
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#c9b787]/10 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        port.congestionLevel === 'high' ? 'bg-red-500' : 'bg-amber-500',
                      )}
                      style={{ width: `${(port.waitHours / 48) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.06] bg-[#0e0e0e] space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">
              Route Corridor Status
            </h3>
            <div className="space-y-3">
              {routeTwins.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-2 rounded bg-[#c9b787]/8"
                >
                  <span className="text-xs text-[#e0e0e0]">{route.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-tighter">
                      Active
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#5a5a5a]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
