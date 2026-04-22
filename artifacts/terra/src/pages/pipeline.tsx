import { cn } from '@szl-holdings/shared-ui/utils';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, MapPin, User } from 'lucide-react';
import { deals } from '@/data/portfolio';

const stages = [
  {
    key: 'sourcing',
    label: 'Sourcing',
    color: 'border-terra-text-muted',
    bg: 'bg-terra-text-muted/10',
  },
  {
    key: 'underwriting',
    label: 'Underwriting',
    color: 'border-terra-violet',
    bg: 'bg-terra-violet/10',
  },
  {
    key: 'due-diligence',
    label: 'Due Diligence',
    color: 'border-terra-amber',
    bg: 'bg-terra-amber/10',
  },
  { key: 'closing', label: 'Closing', color: 'border-terra-emerald', bg: 'bg-terra-emerald/10' },
  { key: 'closed', label: 'Closed', color: 'border-terra-primary', bg: 'bg-terra-primary/10' },
] as const;

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
}

const totalPipelineValue = deals
  .filter((d) => d.stage !== 'closed')
  .reduce((sum, d) => sum + d.value, 0);
const weightedValue = deals
  .filter((d) => d.stage !== 'closed')
  .reduce((sum, d) => sum + d.value * (d.probability / 100), 0);

export default function PipelinePage() {
  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-terra-text">Deal Pipeline</h1>
        <p className="text-sm text-terra-text-secondary mt-1">
          Track acquisitions and dispositions through every stage
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl border border-terra-border bg-terra-surface/50"
        >
          <p className="text-xs text-terra-text-muted font-medium uppercase tracking-wider mb-1">
            Active Deals
          </p>
          <p className="text-3xl font-display font-bold text-terra-text">
            {deals.filter((d) => d.stage !== 'closed').length}
          </p>
          <p className="text-xs text-terra-text-secondary mt-1">
            {deals.filter((d) => d.type === 'acquisition').length} acquisitions ·{' '}
            {deals.filter((d) => d.type === 'disposition').length} dispositions
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 rounded-xl border border-terra-border bg-terra-surface/50"
        >
          <p className="text-xs text-terra-text-muted font-medium uppercase tracking-wider mb-1">
            Total Pipeline Value
          </p>
          <p className="text-3xl font-display font-bold text-terra-primary">
            {formatCurrency(totalPipelineValue)}
          </p>
          <p className="text-xs text-terra-text-secondary mt-1">Across all active stages</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-xl border border-terra-border bg-terra-surface/50"
        >
          <p className="text-xs text-terra-text-muted font-medium uppercase tracking-wider mb-1">
            Weighted Value
          </p>
          <p className="text-3xl font-display font-bold text-terra-emerald">
            {formatCurrency(weightedValue)}
          </p>
          <p className="text-xs text-terra-text-secondary mt-1">Probability-adjusted</p>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-2 flex-shrink-0">
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border',
                stage.color,
                stage.bg,
              )}
            >
              {stage.label}
              <span className="text-terra-text-muted">
                ({deals.filter((d) => d.stage === stage.key).length})
              </span>
            </div>
            {i < stages.length - 1 && (
              <ArrowRight className="w-3 h-3 text-terra-text-muted flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          return (
            <div key={stage.key}>
              <div className={cn('flex items-center gap-2 mb-3 pb-2 border-b-2', stage.color)}>
                <h3 className="text-sm font-display font-bold text-terra-text">{stage.label}</h3>
                <span className="text-xs text-terra-text-muted">({stageDeals.length})</span>
              </div>
              <div className="space-y-3">
                {stageDeals.map((deal, i) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl border border-terra-border bg-terra-surface/50 hover:border-terra-border-hover hover:shadow-lg hover:shadow-terra-primary/5 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider',
                          deal.type === 'acquisition'
                            ? 'bg-terra-primary/10 text-terra-primary'
                            : 'bg-terra-amber/10 text-terra-amber',
                        )}
                      >
                        {deal.type}
                      </span>
                      <span className="text-[10px] text-terra-text-muted">{deal.daysInStage}d</span>
                    </div>

                    <h4 className="font-display font-bold text-sm text-terra-text group-hover:text-terra-primary transition-colors mb-2">
                      {deal.name}
                    </h4>

                    <div className="space-y-1.5 text-xs text-terra-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-terra-text-muted" />
                        {deal.property_type}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-terra-text-muted" />
                        {deal.city}, {deal.state}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-terra-text-muted" />
                        {deal.contact}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-terra-border flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-terra-text-muted">Value</p>
                        <p className="text-sm font-bold text-terra-text">
                          {formatCurrency(deal.value)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-terra-text-muted">Probability</p>
                        <p
                          className={cn(
                            'text-sm font-bold',
                            deal.probability >= 70
                              ? 'text-terra-emerald'
                              : deal.probability >= 40
                                ? 'text-terra-amber'
                                : 'text-terra-text-muted',
                          )}
                        >
                          {deal.probability}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="w-full bg-terra-bg-tertiary rounded-full h-1">
                        <div
                          className={cn(
                            'h-1 rounded-full transition-all',
                            deal.probability >= 70
                              ? 'bg-terra-emerald'
                              : deal.probability >= 40
                                ? 'bg-terra-amber'
                                : 'bg-terra-text-muted',
                          )}
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
                {stageDeals.length === 0 && (
                  <div className="p-4 rounded-xl border border-dashed border-terra-border text-center">
                    <p className="text-xs text-terra-text-muted">No deals</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
