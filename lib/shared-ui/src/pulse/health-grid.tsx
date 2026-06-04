import { motion as m } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HealthItem {
  name: string;
  load: number;
  color: string;
}

export function PulseHealthGrid({ items }: { items: HealthItem[] }) {
  const [loads, setLoads] = useState(items.map((d) => d.load));
  useEffect(() => {
    const timer = setInterval(() => {
      setLoads((prev) => prev.map((l) => Math.max(5, Math.min(95, l + (Math.random() - 0.5) * 8))));
    }, 2500);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map((item, i) => (
        <m.div
          key={item.name}
          className="rounded-md px-3 py-2.5"
          whileHover={{ scale: 1.02 }}
          style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.035)',
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
            <span
              className="text-[10px] font-medium truncate"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              {item.name}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <m.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${item.color}80, ${item.color})` }}
              animate={{ width: `${loads[i]}%` }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Load
            </span>
            <span
              className="text-[9px] tabular-nums font-medium"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {Math.round(loads[i]!)}%
            </span>
          </div>
        </m.div>
      ))}
    </div>
  );
}
