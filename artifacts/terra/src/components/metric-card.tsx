import { cn } from '@szl-holdings/shared-ui/utils';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  gradient?: string;
  subtitle?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  gradient = 'from-terra-primary to-terra-accent',
  subtitle,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-5 rounded-xl border border-terra-border bg-terra-surface backdrop-blur-sm hover:border-terra-border-hover transition-all duration-300 group overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity">
        <div className={cn('w-full h-full rounded-bl-full bg-gradient-to-br', gradient)} />
      </div>
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br',
            gradient,
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              changeType === 'positive' && 'bg-terra-emerald/10 text-terra-emerald',
              changeType === 'negative' && 'bg-terra-rose/10 text-terra-rose',
              changeType === 'neutral' && 'bg-terra-text-muted/10 text-terra-text-muted',
            )}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-xs text-terra-text-muted font-medium uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="text-2xl font-display font-bold text-terra-text">{value}</p>
      {subtitle && <p className="text-xs text-terra-text-secondary mt-1">{subtitle}</p>}
    </motion.div>
  );
}
