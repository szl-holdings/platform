import { cn } from '@szl-holdings/shared-ui/utils';
import { AlertTriangle, ArrowRight, Link2, } from 'lucide-react';
import { matterTwins, obligationTwins } from '../data/counsel-twin';

export default function DependencyGraph() {
  const blockedObligations = obligationTwins.filter((o) => o.status === 'blocked');
  const _overdueObligations = obligationTwins.filter((o) => o.status === 'overdue');

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-violet-100">Dependency Graph</h1>
        <p className="text-violet-400/60 text-sm">
          Mapping matter dependencies and blocking events.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-6 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg width="100%" height="100%">
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-violet-500"
                  />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative z-10 w-full max-w-lg space-y-6">
              {matterTwins.slice(0, 1).map((matter) => (
                <div key={matter.id} className="space-y-8">
                  <div className="flex justify-center">
                    <div className="px-4 py-2 bg-violet-500/20 border border-violet-500/40 rounded-lg text-xs font-bold text-violet-100">
                      {matter.name} (Goal)
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {obligationTwins
                      .filter((o) => o.matterId === matter.id && o.dependencies.length === 0)
                      .map((o) => (
                        <div key={o.id} className="relative">
                          <div
                            className={cn(
                              'p-3 rounded-lg border text-[10px] space-y-1',
                              o.status === 'overdue'
                                ? 'bg-red-500/10 border-red-500/40'
                                : 'bg-violet-500/5 border-violet-500/20',
                            )}
                          >
                            <div className="font-bold text-violet-100">{o.title}</div>
                            <div className="text-violet-400/60 uppercase">{o.status}</div>
                          </div>
                          <div className="absolute top-1/2 -right-6 text-violet-500/40">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))}

                    {obligationTwins
                      .filter((o) => o.matterId === matter.id && o.dependencies.length > 0)
                      .map((o) => (
                        <div
                          key={o.id}
                          className={cn(
                            'p-3 rounded-lg border text-[10px] space-y-1',
                            o.status === 'blocked'
                              ? 'bg-amber-500/10 border-amber-500/40'
                              : 'bg-violet-500/5 border-violet-500/20',
                          )}
                        >
                          <div className="font-bold text-violet-100">{o.title}</div>
                          <div className="text-violet-400/60 uppercase">{o.status}</div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-violet-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Blocking Events
            </h3>
            <div className="space-y-3">
              {blockedObligations.map((o) => (
                <div
                  key={o.id}
                  className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 space-y-1"
                >
                  <div className="text-xs font-medium text-amber-200">{o.title}</div>
                  <div className="text-[10px] text-amber-400/60">
                    Blocked by:{' '}
                    {obligationTwins.find((dep) => o.dependencies.includes(dep.id))?.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-violet-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-violet-400" />
              Dependency Map Stats
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-violet-400/60">Critical Path Confidence</span>
                  <span className="text-violet-100">64%</span>
                </div>
                <div className="h-1.5 w-full bg-violet-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 w-[64%]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                  <div className="text-[10px] text-violet-400/60 uppercase">Nodes</div>
                  <div className="text-lg font-bold text-violet-100">{obligationTwins.length}</div>
                </div>
                <div className="p-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                  <div className="text-[10px] text-violet-400/60 uppercase">Links</div>
                  <div className="text-lg font-bold text-violet-100">
                    {obligationTwins.reduce((acc, o) => acc + o.dependencies.length, 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
