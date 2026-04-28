import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { DiligenceStatus } from './shared';

interface DiligenceItem {
  item: string;
  status: 'complete' | 'in-progress' | 'pending' | 'flagged';
  assignee: string;
  due?: string;
  note?: string;
}

interface Props {
  diligence: DiligenceItem[];
}

export function DiligenceTab({ diligence }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {diligence.length > 0 ? (
        <div className="rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: '#3b82f6' }} />
              <h3 className="font-bold text-white text-sm">Diligence Checklist</h3>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span>{diligence.filter((d) => d.status === 'complete').length}/{diligence.length} complete</span>
              {diligence.filter((d) => d.status === 'flagged').length > 0 && (
                <span className="font-semibold" style={{ color: '#ef4444' }}>
                  {diligence.filter((d) => d.status === 'flagged').length} flagged
                </span>
              )}
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {diligence.map((item, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                <DiligenceStatus status={item.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{item.item}</p>
                  {item.note && (
                    <p className="text-[10px] mt-0.5" style={{ color: item.status === 'flagged' ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.3)' }}>
                      {item.note}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.assignee}</p>
                  {item.due && (
                    <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      Due {new Date(item.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No active diligence process for this asset</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Diligence checklists are created when an asset enters underwriting</p>
        </div>
      )}
    </motion.div>
  );
}
