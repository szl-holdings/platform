import { m } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TimelineEntry {
  date: string;
  event: string;
  outcome?: string;
  category?: string;
}

interface TimelineBlockProps {
  entries: TimelineEntry[];
  accentColor?: string;
  className?: string;
}

export function TimelineBlock({ entries, accentColor = '#2563eb', className }: TimelineBlockProps) {
  return (
    <div className={cn('relative', className)}>
      <div
        className="absolute left-[7px] top-2 bottom-2 w-px"
        style={{ background: `linear-gradient(to bottom, ${accentColor}40, ${accentColor}10)` }}
      />
      <div className="space-y-6">
        {entries.map((entry, i) => (
          <m.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="relative pl-8"
          >
            <div
              className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{
                backgroundColor: i === 0 ? accentColor : `${accentColor}60`,
                boxShadow: i === 0 ? `0 0 0 3px ${accentColor}20` : 'none',
              }}
            />
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
              <span className="text-[11px] font-bold text-szl-text-muted uppercase tracking-wider shrink-0 mb-1 sm:mb-0 sm:w-20 sm:pt-0.5">
                {entry.date}
              </span>
              <div>
                <p className="text-sm font-semibold text-szl-text">{entry.event}</p>
                {entry.outcome && (
                  <p className="text-xs text-szl-text-secondary mt-0.5">{entry.outcome}</p>
                )}
              </div>
            </div>
          </m.div>
        ))}
      </div>
    </div>
  );
}
