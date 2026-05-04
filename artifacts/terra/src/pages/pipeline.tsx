import { useStandardQuery } from '@szl-holdings/api-client-react';
import { cn } from '@szl-holdings/shared-ui/utils';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Clock, MapPin, TrendingUp, User, Zap } from 'lucide-react';
import { A11oySignalMesh } from '@/components/a11oy-signal-mesh';
import { deals as staticDeals } from '@/data/portfolio';
import { api } from '@/lib/api';

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

interface PipelineDeal {
  id: string;
  name: string;
  type: 'acquisition' | 'disposition';
  stage: string;
  value: number;
  capRate: number;
  property_type: string;
  city: string;
  state: string;
  contact: string;
  daysInStage: number;
  probability: number;
}

const CRM_TO_PIPELINE_STAGE: Record<string, string> = {
  lead: 'sourcing',
  qualified: 'sourcing',
  showing: 'sourcing',
  offer: 'underwriting',
  negotiation: 'underwriting',
  accepted: 'due-diligence',
  inspection: 'due-diligence',
  financing: 'due-diligence',
  'under-contract': 'closing',
  'clear-to-close': 'closing',
  closed: 'closed',
};

function normalizeStageToPipeline(raw: string): string {
  const key = raw.toLowerCase().trim();
  return CRM_TO_PIPELINE_STAGE[key] ?? key;
}

function mapApiDealToLocal(d: Record<string, unknown>): PipelineDeal {
  const price = typeof d.price === 'number' ? d.price : (typeof d.askingPrice === 'number' ? d.askingPrice : 0);
  return {
    id: String(d.id ?? ''),
    name: String(d.address ?? 'Unknown Property'),
    type: (String(d.type ?? 'acquisition') as 'acquisition' | 'disposition'),
    stage: normalizeStageToPipeline(String(d.stage ?? 'sourcing')),
    value: price,
    capRate: 5.5,
    property_type: String(d.type ?? 'Mixed-Use'),
    city: String(d.borough ?? d.county ?? ''),
    state: d.zipCode ? 'NY' : '',
    contact: String(d.clientName ?? d.ownerName ?? '—'),
    daysInStage: typeof d.daysInStage === 'number' ? d.daysInStage : 0,
    probability: typeof d.probability === 'number' ? d.probability : 50,
  };
}

export default function PipelinePage() {
  const { data: apiData, isLoading, isError } = useStandardQuery({
    queryKey: ['terra-pipeline-deals'],
    queryFn: () => api.deals.list(),
    staleTime: 30_000,
  });

  const apiReachable = !isLoading && !isError && apiData;
  const apiDeals = apiReachable ? (apiData.deals ?? []).map(mapApiDealToLocal) : null;
  const deals: PipelineDeal[] = apiDeals ?? staticDeals;

  const activeDeals = deals.filter((d) => d.stage !== 'closed');
  const totalPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = activeDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
  const avgDaysInStage = activeDeals.length
    ? Math.round(activeDeals.reduce((s, d) => s + d.daysInStage, 0) / activeDeals.length)
    : 0;
  const avgProbability = activeDeals.length
    ? Math.round(activeDeals.reduce((s, d) => s + d.probability, 0) / activeDeals.length)
    : 0;

  const stageVelocity = stages.map((s) => {
    const sd = deals.filter((d) => d.stage === s.key);
    const avg = sd.length ? Math.round(sd.reduce((a, d) => a + d.daysInStage, 0) / sd.length) : 0;
    const val = sd.reduce((a, d) => a + d.value, 0);
    return { ...s, count: sd.length, avgDays: avg, totalValue: val };
  });

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-display font-bold text-terra-text">Deal Pipeline</h1>
          <span
            className="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold"
            style={{
              color: '#b8943c',
              background: 'rgba(184,148,60,0.08)',
              border: '1px solid rgba(184,148,60,0.15)',
            }}
          >
            {apiReachable ? 'Live Data' : 'CoStar-Grade Analytics'}
          </span>
        </div>
        <p className="text-sm text-terra-text-secondary mt-1">
          Track acquisitions and dispositions through every stage with velocity metrics
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-terra-border bg-terra-surface/50"
        >
          <p className="text-[9px] text-terra-text-muted font-medium uppercase tracking-wider mb-1">
            Active Deals
          </p>
          <p className="text-2xl font-display font-bold text-terra-text">{activeDeals.length}</p>
          <p className="text-[10px] text-terra-text-secondary mt-1">
            {deals.filter((d) => d.type === 'acquisition').length} acq ·{' '}
            {deals.filter((d) => d.type === 'disposition').length} disp
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="p-4 rounded-xl border border-terra-border bg-terra-surface/50"
        >
          <p className="text-[9px] text-terra-text-muted font-medium uppercase tracking-wider mb-1">
            Pipeline Value
          </p>
          <p className="text-2xl font-display font-bold text-terra-primary">
            {formatCurrency(totalPipelineValue)}
          </p>
          <p className="text-[10px] text-terra-text-secondary mt-1">Gross active value</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="p-4 rounded-xl border border-terra-border bg-terra-surface/50"
        >
          <p className="text-[9px] text-terra-text-muted font-medium uppercase tracking-wider mb-1">
            Weighted Value
          </p>
          <p className="text-2xl font-display font-bold text-terra-emerald">
            {formatCurrency(weightedValue)}
          </p>
          <p className="text-[10px] text-terra-text-secondary mt-1">Probability-adjusted</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="p-4 rounded-xl border border-terra-border bg-terra-surface/50"
        >
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-terra-text-muted" />
            <p className="text-[9px] text-terra-text-muted font-medium uppercase tracking-wider">
              Avg Days in Stage
            </p>
          </div>
          <p className="text-2xl font-display font-bold text-terra-text">{avgDaysInStage}d</p>
          <p className="text-[10px] text-terra-text-secondary mt-1">
            {avgDaysInStage > 30 ? 'Above target' : 'Within target'}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="p-4 rounded-xl border border-terra-border bg-terra-surface/50"
        >
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-terra-text-muted" />
            <p className="text-[9px] text-terra-text-muted font-medium uppercase tracking-wider">
              Avg Probability
            </p>
          </div>
          <p className={cn(
            'text-2xl font-display font-bold',
            avgProbability >= 60 ? 'text-terra-emerald' : 'text-terra-amber',
          )}>
            {avgProbability}%
          </p>
          <p className="text-[10px] text-terra-text-secondary mt-1">Pipeline confidence</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl border border-terra-border bg-terra-surface/50"
        >
          <div className="flex items-center gap-1 mb-1">
            <Zap className="w-3 h-3 text-terra-text-muted" />
            <p className="text-[9px] text-terra-text-muted font-medium uppercase tracking-wider">
              Velocity Score
            </p>
          </div>
          <p className="text-2xl font-display font-bold text-terra-text">
            {Math.round(100 - avgDaysInStage * 1.5)}
          </p>
          <p className="text-[10px] text-terra-text-secondary mt-1">Deal movement rate</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-terra-border bg-terra-surface/50 p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold text-terra-text-muted uppercase tracking-wider">
            Stage Velocity Breakdown
          </span>
          <span
            className="text-[8px] font-mono px-1.5 py-0.5 rounded"
            style={{
              color: 'rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {apiReachable ? 'live' : 'CoStar-grade'}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {stageVelocity.map((sv) => (
            <div
              key={sv.key}
              className="text-center rounded-lg p-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <p className="text-[10px] font-semibold text-terra-text mb-1">{sv.label}</p>
              <p className="text-lg font-bold font-mono text-terra-text">{sv.count}</p>
              <p className="text-[9px] text-terra-text-muted mt-1">{sv.avgDays}d avg</p>
              <p className="text-[9px] font-mono text-terra-text-secondary">
                {formatCurrency(sv.totalValue)}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

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
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-2.5 h-2.5 text-terra-text-muted" />
                        <span className={cn(
                          'text-[10px] font-mono font-semibold',
                          deal.daysInStage > 45
                            ? 'text-red-400'
                            : deal.daysInStage > 20
                              ? 'text-amber-400'
                              : 'text-terra-text-muted',
                        )}>
                          {deal.daysInStage}d
                        </span>
                      </div>
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
                        {deal.city}{deal.state ? `, ${deal.state}` : ''}
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
                      <div className="text-center">
                        <p className="text-[10px] text-terra-text-muted">Weighted</p>
                        <p className="text-[11px] font-semibold font-mono text-terra-text-secondary">
                          {formatCurrency(deal.value * deal.probability / 100)}
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

                    <div
                      className="mt-2 pt-2 border-t flex items-center gap-2 text-[9px] font-mono"
                      style={{ borderColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}
                    >
                      <span>Cap: {deal.capRate}%</span>
                      <span>·</span>
                      <span>
                        Velocity: {deal.daysInStage <= 15 ? 'Fast' : deal.daysInStage <= 30 ? 'Normal' : 'Slow'}
                      </span>
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

      <A11oySignalMesh />
    </div>
  );
}
