import { doctrineEventBus } from '@szl-holdings/observability';
import { DoctrineLayerBadge } from '@szl-holdings/shared-ui/doctrine-layer-badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const alerts = [
  {
    id: 'ALT-001',
    title: 'Model Drift Detected - DeepForecaster v3.2',
    severity: 'high',
    source: 'PredictionDrift Monitor',
    timestamp: '2 min ago',
    status: 'open',
    category: 'drift',
    description: 'Prediction drift exceeded 5% threshold for Revenue Q3 forecast',
  },
  {
    id: 'ALT-002',
    title: 'Anomaly in Training Pipeline',
    severity: 'critical',
    source: 'Pipeline Monitor',
    timestamp: '8 min ago',
    status: 'escalated',
    category: 'pipeline',
    description: 'GPU memory overflow during batch processing of NeuralSentiment training job',
  },
  {
    id: 'ALT-003',
    title: 'Data Quality Alert',
    severity: 'medium',
    source: 'Data Validator',
    timestamp: '15 min ago',
    status: 'acknowledged',
    category: 'data',
    description: 'Missing values detected in 3.2% of incoming feature vectors',
  },
  {
    id: 'ALT-004',
    title: 'Model Accuracy Below Threshold',
    severity: 'high',
    source: 'Accuracy Monitor',
    timestamp: '32 min ago',
    status: 'acknowledged',
    category: 'accuracy',
    description: 'CausalInference v1.3 accuracy dropped to 78% (threshold: 85%)',
  },
  {
    id: 'ALT-005',
    title: 'Ensemble Disagreement',
    severity: 'medium',
    source: 'EnsembleStudio',
    timestamp: '1 hr ago',
    status: 'resolved',
    category: 'ensemble',
    description: 'Models in Revenue Ensemble showing >15% prediction variance',
  },
  {
    id: 'ALT-006',
    title: 'Training Job Completed',
    severity: 'info',
    source: 'Job Scheduler',
    timestamp: '1.5 hr ago',
    status: 'resolved',
    category: 'pipeline',
    description: 'AnomalyDetector v2.6 training completed with 96.2% validation accuracy',
  },
  {
    id: 'ALT-007',
    title: 'Feature Store Sync Delayed',
    severity: 'low',
    source: 'Feature Store',
    timestamp: '2 hr ago',
    status: 'resolved',
    category: 'data',
    description: 'Feature store sync delayed by 12 minutes due to upstream API throttling',
  },
  {
    id: 'ALT-008',
    title: 'New Model Version Available',
    severity: 'info',
    source: 'Model Registry',
    timestamp: '3 hr ago',
    status: 'resolved',
    category: 'registry',
    description: 'TimeSeriesNet v4.1 passed all validation gates and is ready for deployment',
  },
];

const severityConfig: Record<string, { color: string; icon: any }> = {
  critical: { color: 'text-[#f5f5f5] bg-[#f5f5f5]/10 border-[#f5f5f5]/20', icon: XCircle },
  high: { color: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/20', icon: AlertTriangle },
  medium: { color: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/20', icon: Bell },
  low: { color: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/20', icon: Shield },
  info: { color: 'text-[#8a8a8a] bg-[#8a8a8a]/10 border-[#8a8a8a]/20', icon: CheckCircle2 },
};

export default function AlertsManagement() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filtered = alerts.filter(
    (a) =>
      (statusFilter === 'all' || a.status === statusFilter) &&
      (severityFilter === 'all' || a.severity === severityFilter),
  );

  const openCount = alerts.filter((a) => a.status === 'open').length;
  const criticalCount = alerts.filter(
    (a) => a.severity === 'critical' && a.status !== 'resolved',
  ).length;

  useEffect(() => {
    if (openCount > 0) {
      doctrineEventBus.emit({
        type: 'alert',
        sourceApp: 'inca',
        layer: 'UNDERSTAND',
        severity: criticalCount > 0 ? 'critical' : 'warning',
        title: `${openCount} open AI system alert${openCount > 1 ? 's' : ''}`,
        description: `AI intelligence platform: ${openCount} open alert(s) including model drift, pipeline anomalies, and accuracy thresholds.`,
        entitiesInvolved: alerts
          .filter((a) => a.status === 'open')
          .slice(0, 3)
          .map((a) => a.source),
        context: {
          source: 'alerts-management',
          sourceApp: 'inca',
          severity: criticalCount > 0 ? 'critical' : 'high',
          confidence: 0.88,
          impactedEntities: alerts
            .filter((a) => a.status === 'open')
            .slice(0, 5)
            .map((a) => a.source),
          causalFactors: ['model drift', 'pipeline anomaly', 'accuracy threshold breach'],
          suggestedNextAction:
            'Review and acknowledge open alerts, escalate critical items to ML engineering',
          businessImpact: `${openCount} AI model(s) at risk — prediction reliability may be degraded`,
          operationalImpact:
            'Active model monitoring underway; consider fallback model activation for critical issues',
          layer: 'UNDERSTAND',
          timestamp: Date.now(),
        },
        metadata: { openCount, criticalCount, source: 'alerts-management' },
      });
    }
  }, [openCount, criticalCount]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <BellRing className="w-6 h-6 text-primary" />
              Alerts Management
            </h1>
            <DoctrineLayerBadge appId="inca" variant="compact" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Drift alerts, pipeline failures, and threshold-triggered events across active models
          </p>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f5f5]/10 text-[#f5f5f5] text-xs font-medium animate-pulse">
              <XCircle className="w-3 h-3" /> {criticalCount} Critical
            </span>
          )}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Bell className="w-3 h-3" /> {openCount} Open
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'open', label: 'Requires triage' },
          { value: 'escalated', label: 'Escalated' },
          { value: 'acknowledged', label: 'Under review' },
          { value: 'resolved', label: 'Resolved' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              statusFilter === value
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-muted/50',
            )}
          >
            {label}
          </button>
        ))}
        <div className="w-px bg-border mx-2" />
        {['all', 'critical', 'high', 'medium', 'low', 'info'].map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
              severityFilter === s
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-muted/50',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-card/40 border border-border/50 rounded-xl p-12 text-center">
            <p className="text-muted-foreground text-sm font-medium">
              No findings match this view.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              This section will update as new material is added.
            </p>
          </div>
        )}
        {filtered.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.info;
          const SeverityIcon = config.icon;
          return (
            <div
              key={alert.id}
              className={cn(
                'bg-card/60 border rounded-xl p-4 transition-all hover:border-primary/20',
                alert.status === 'open' ? 'border-border' : 'border-border/50 opacity-80',
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    config.color,
                  )}
                >
                  <SeverityIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{alert.id}</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
                        config.color,
                      )}
                    >
                      {alert.severity}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium capitalize',
                        alert.status === 'open'
                          ? 'bg-[#8a8a8a]/10 text-[#8a8a8a]'
                          : alert.status === 'escalated'
                            ? 'bg-[#f5f5f5]/10 text-[#f5f5f5]'
                            : alert.status === 'acknowledged'
                              ? 'bg-[#c9b787]/10 text-[#c9b787]'
                              : 'bg-[#c9b787]/10 text-[#c9b787]',
                      )}
                    >
                      {alert.status === 'open'
                        ? 'Requires triage'
                        : alert.status === 'escalated'
                          ? 'Escalated'
                          : alert.status === 'acknowledged'
                            ? 'Under review'
                            : 'Resolved'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {alert.source}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
