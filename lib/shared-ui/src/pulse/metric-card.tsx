import { motion as m } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PulseMetricCard({
  label,
  value,
  suffix,
  icon: Icon,
  color,
  trend,
  delay = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  trend?: string;
  delay?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const step = Math.ceil(value / 45);
      const timer = setInterval(() => {
        start += step;
        if (start >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else setDisplayValue(start);
      }, 20);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay / 1000, type: 'spring', stiffness: 200 }}
      className="relative overflow-hidden rounded-lg p-4 group"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-0 group-hover:h-full transition-all duration-500"
        style={{ background: `${color}08` }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span
            className="text-[10px] uppercase tracking-wider font-medium"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {label}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: 'rgba(255,255,255,0.88)' }}
          >
            {displayValue.toLocaleString()}
          </span>
          {suffix && (
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {suffix}
            </span>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-1.5">
            <TrendingUp className="w-3 h-3" style={{ color }} />
            <span className="text-[10px]" style={{ color }}>
              {trend}
            </span>
          </div>
        )}
      </div>
    </m.div>
  );
}
