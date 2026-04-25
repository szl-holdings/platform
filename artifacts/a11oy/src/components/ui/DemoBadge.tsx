import { AlertCircle } from 'lucide-react';
import { cn } from '@szl-holdings/design-system';

export function DemoBadge({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-a11oy-warn)]/10 border border-[var(--color-a11oy-warn)]/20 text-[var(--color-a11oy-warn)] text-[10px] font-mono tracking-tight uppercase", className)}>
      <AlertCircle className="w-3 h-3" />
      DEMO CONTENT — scripted, not generated
    </div>
  );
}
