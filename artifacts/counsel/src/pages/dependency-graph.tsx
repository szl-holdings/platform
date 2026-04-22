import { cn } from '@szl-holdings/shared-ui/utils';
import { Clock, Lock } from 'lucide-react';
import { obligationTwins } from '../data/counsel-twin';

export default function ObligationTimeline() {
  const sortedObligations = [...obligationTwins].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
  );

  const nextDeadline = sortedObligations.find((o) => new Date(o.deadline) > new Date());
  const daysToNext = nextDeadline
    ? Math.ceil((new Date(nextDeadline.deadline).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-violet-100">Obligation Timeline</h1>
          <p className="text-violet-400/60 text-sm">Chronological view of matter deliverables.</p>
        </div>
        {daysToNext !== null && (
          <div className="bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-xl">
            <div className="text-[10px] font-medium text-violet-400 uppercase tracking-wider">
              Next Deadline
            </div>
            <div className="text-xl font-bold text-violet-100">{daysToNext} Days</div>
          </div>
        )}
      </header>

      <div className="relative space-y-4">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-violet-500/10" />

        {sortedObligations.map((obl, _i) => (
          <div key={obl.id} className="relative pl-12">
            <div
              className={cn(
                'absolute left-[21px] top-4 w-2 h-2 rounded-full border-2 bg-[#060e1a] z-10',
                obl.status === 'overdue'
                  ? 'border-red-500'
                  : obl.status === 'blocked'
                    ? 'border-amber-500'
                    : obl.status === 'in_progress'
                      ? 'border-violet-500'
                      : 'border-violet-500/30',
              )}
            />

            <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-4 flex items-center justify-between hover:border-violet-500/30 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-violet-100">{obl.title}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider',
                      obl.status === 'overdue'
                        ? 'bg-red-500/10 text-red-400'
                        : obl.status === 'blocked'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-violet-500/10 text-violet-400',
                    )}
                  >
                    {obl.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-violet-400/60">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(obl.deadline).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Assigned: {obl.assignedTo}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-violet-200">
                  ${(obl.exposureUsd / 1000).toFixed(0)}K Risk
                </div>
                <div className="text-[10px] text-violet-400/50">Priority: {obl.riskLevel}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
