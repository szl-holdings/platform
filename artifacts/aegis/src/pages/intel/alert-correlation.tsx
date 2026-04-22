import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  Brain,
  Clock,
  Link2,
  Zap,
} from 'lucide-react';

const correlationGroups = [
  {
    id: 'CG-001',
    title: 'Revenue Forecast Chain Reaction',
    rootCause: 'Upstream data schema change',
    severity: 'high',
    timestamp: '45 min ago',
    alerts: [
      { id: 'ALT-001', title: 'Model Drift - DeepForecaster v3.2', type: 'drift', delay: '0 min' },
      {
        id: 'ALT-004',
        title: 'Accuracy Drop - CausalInference v1.3',
        type: 'accuracy',
        delay: '+3 min',
      },
      { id: 'ANO-008', title: 'Feature Correlation Breakdown', type: 'anomaly', delay: '+5 min' },
      { id: 'ALT-005', title: 'Ensemble Disagreement', type: 'ensemble', delay: '+8 min' },
    ],
    impact: 'Revenue predictions may be unreliable until data pipeline is corrected',
    recommendation:
      'Investigate upstream data source for schema changes; revalidate feature engineering pipeline',
  },
  {
    id: 'CG-002',
    title: 'Infrastructure Cascade',
    rootCause: 'GPU cluster memory pressure',
    severity: 'critical',
    timestamp: '2 hr ago',
    alerts: [
      { id: 'ALT-002', title: 'GPU Memory Overflow', type: 'infrastructure', delay: '0 min' },
      { id: 'ANO-007', title: 'GPU Utilization Anomaly', type: 'anomaly', delay: '+2 min' },
      { id: 'ALT-003', title: 'Training Pipeline Failure', type: 'pipeline', delay: '+4 min' },
    ],
    impact: 'Training jobs delayed; model updates postponed by approximately 2 hours',
    recommendation: 'Scale GPU cluster or redistribute workloads; implement memory quotas per job',
  },
  {
    id: 'CG-003',
    title: 'Data Quality Propagation',
    rootCause: 'Batch ingestion corruption',
    severity: 'medium',
    timestamp: '5 hr ago',
    alerts: [
      { id: 'ANO-004', title: 'Data Quality Anomaly', type: 'data', delay: '0 min' },
      { id: 'ALT-003', title: 'Missing Feature Values', type: 'data', delay: '+12 min' },
    ],
    impact: 'Affected 2 downstream models; predictions held pending data revalidation',
    recommendation: 'Implement stricter schema validation at ingestion point; add data checksums',
  },
];

export default function AlertCorrelation() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <Link2 className="w-6 h-6 text-primary" />
          Alert Correlation Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alert grouping to identify root causes and cascading failures
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Correlation Groups
          </p>
          <p className="text-2xl font-bold text-foreground">{correlationGroups.length}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Total Correlated Alerts
          </p>
          <p className="text-2xl font-bold text-foreground">
            {correlationGroups.reduce((s, g) => s + g.alerts.length, 0)}
          </p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Root Causes Identified
          </p>
          <p className="text-2xl font-bold text-foreground">{correlationGroups.length}</p>
        </div>
      </div>

      <div className="space-y-4">
        {correlationGroups.map((group) => (
          <div key={group.id} className="bg-card/60 border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{group.id}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider',
                      group.severity === 'critical'
                        ? 'bg-red-400/10 text-red-400'
                        : group.severity === 'high'
                          ? 'bg-orange-400/10 text-orange-400'
                          : 'bg-amber-400/10 text-amber-400',
                    )}
                  >
                    {group.severity}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{group.title}</h3>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {group.timestamp}
              </span>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Root Cause
              </p>
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> {group.rootCause}
              </p>
            </div>

            <div className="relative ml-4 mb-4">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
              {group.alerts.map((alert, _i) => (
                <div key={alert.id} className="relative pl-8 py-2">
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-16">
                      {alert.delay}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{alert.id}</span>
                    <span className="text-sm text-foreground">{alert.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                      {alert.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-400/5 border border-red-400/10 rounded-lg p-3">
                <p className="text-xs text-red-400 font-medium mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Impact
                </p>
                <p className="text-xs text-muted-foreground">{group.impact}</p>
              </div>
              <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-lg p-3">
                <p className="text-xs text-emerald-400 font-medium mb-1 flex items-center gap-1">
                  <Brain className="w-3 h-3" /> Recommendation
                </p>
                <p className="text-xs text-muted-foreground">{group.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
