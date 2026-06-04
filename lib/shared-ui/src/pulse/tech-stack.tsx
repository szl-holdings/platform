import { motion as m } from 'framer-motion';
import { Lock } from 'lucide-react';

interface TechItem {
  label: string;
  value: string;
  color: string;
}

export function PulseTechStack({
  items,
  title = 'Platform Architecture',
}: {
  items: TechItem[];
  title?: string;
}) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="rounded-lg p-4"
      style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
        <span
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {title}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {items.map((tech) => (
          <div
            key={tech.label}
            className="text-center py-2 rounded-md"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="text-sm font-bold tabular-nums" style={{ color: tech.color }}>
              {tech.value}
            </div>
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {tech.label}
            </div>
          </div>
        ))}
      </div>
    </m.div>
  );
}
