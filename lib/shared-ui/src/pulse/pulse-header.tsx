import { motion as m } from 'framer-motion';
import { useEffect, useState } from 'react';

export function PulseHeader({
  title,
  subtitle,
  accentColor = '#d4a054',
}: {
  title: string;
  subtitle: string;
  accentColor?: string;
}) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4"
    >
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
            <div
              className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping"
              style={{ background: '#10b981', opacity: 0.4 }}
            />
          </div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            {title}
          </h1>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider"
            style={{
              background: `${accentColor}20`,
              color: accentColor,
              border: `1px solid ${accentColor}30`,
            }}
          >
            LIVE
          </span>
        </div>
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {subtitle}
        </p>
      </div>
      <div className="flex items-center gap-5">
        <div className="text-right">
          <div
            className="text-[9px] uppercase tracking-[0.15em] font-medium"
            style={{ color: 'rgba(255,255,255,0.18)' }}
          >
            Uptime
          </div>
          <div className="text-lg font-bold tabular-nums" style={{ color: '#10b981' }}>
            99.97%
          </div>
        </div>
        <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="text-right">
          <div
            className="text-[9px] uppercase tracking-[0.15em] font-medium"
            style={{ color: 'rgba(255,255,255,0.18)' }}
          >
            UTC
          </div>
          <div
            className="text-lg font-bold tabular-nums"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {time.toUTCString().slice(17, 25)}
          </div>
        </div>
      </div>
    </m.div>
  );
}
