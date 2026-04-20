import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  ExternalLink,
  Scale,
  ShieldAlert,
  Ship,
  User,
  Users,
} from 'lucide-react';
import type { ElementType } from 'react';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import { useLocation, useParams } from 'wouter';
import { Timeline } from '../components/timeline';
import { useEcosystemData } from '../hooks/use-ecosystem-data';
import { getDomainColor, getSeverityColor } from '../lib/utils';
import type { DomainData, TimelineEvent } from '../types';

const DOMAIN_ICONS: Record<string, ElementType> = {
  ShieldAlert,
  Ship,
  Briefcase,
  Activity,
  Scale,
  Building2,
  Users,
  User,
};

export function DomainDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data, sseConnected } = useEcosystemData();

  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-fg-muted)' }}
      >
        <div className="text-xs font-mono uppercase tracking-widest animate-pulse">
          Loading domain data...
        </div>
      </div>
    );
  }

  const domain = data.domains.find((d) => d.id === id);
  if (!domain) {
    return (
      <div
        className="min-h-screen flex items-center justify-center flex-col gap-4"
        style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-fg-muted)' }}
      >
        <span className="text-xs font-mono uppercase tracking-widest">Domain not found: {id}</span>
        <button
          onClick={() => navigate('/')}
          className="text-xs underline"
          style={{ color: 'var(--color-fg-secondary)' }}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const Icon = DOMAIN_ICONS[domain.icon] ?? Activity;
  const domainEvents: TimelineEvent[] = data.timeline.filter((e) => e.domain === id);
  const allEvents: TimelineEvent[] = data.timeline;

  const alertColors: Record<string, string> = {
    critical: 'var(--color-critical)',
    high: 'var(--color-high)',
    medium: 'var(--color-medium)',
    low: 'var(--color-low)',
    info: 'var(--color-info)',
  };
  const alertColor = alertColors[domain.alerts.severity] ?? 'var(--color-fg-muted)';
  const scoreColor =
    domain.score >= 80
      ? 'var(--color-low)'
      : domain.score >= 65
        ? 'var(--color-medium)'
        : 'var(--color-critical)';

  const chartData = domain.sparkline.map((val, i) => ({ value: val, index: i }));
  const min = Math.min(...domain.sparkline);
  const max = Math.max(...domain.sparkline);

  const domainActions = data.actions.filter((a) => a.domain === id);
  const relatedIntel = data.intelligence.filter((card) =>
    card.entities.some(
      (e) =>
        e.toLowerCase().includes(domain.name.toLowerCase()) ||
        domain.name.toLowerCase().includes(e.toLowerCase()),
    ),
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-fg-primary)' }}
    >
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderBottom: '1px solid var(--color-surface-border)',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider transition-colors"
            style={{ color: 'var(--color-fg-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="h-4 w-px" style={{ backgroundColor: 'var(--color-surface-border)' }} />
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: domain.color }} />
            <span className="text-sm font-bold" style={{ color: domain.color }}>
              {domain.name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sseConnected && (
            <div
              className="flex items-center gap-1.5 text-xs font-mono"
              style={{ color: 'var(--color-low)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: 'var(--color-low)',
                  boxShadow: '0 0 6px var(--color-low)',
                }}
              />
              LIVE
            </div>
          )}
          <a
            href={domain.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors"
            style={{
              backgroundColor: 'var(--color-surface-base)',
              border: '1px solid var(--color-surface-border)',
              color: 'var(--color-fg-secondary)',
            }}
          >
            Open {domain.name}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
        <div
          className="rounded-xl p-6 flex flex-col md:flex-row gap-8"
          style={{
            backgroundColor: 'var(--color-surface-base)',
            border: '1px solid var(--color-surface-border)',
          }}
        >
          <div className="flex flex-col gap-4 md:w-48">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `color-mix(in srgb, ${domain.color} 12%, transparent)`,
                  border: `2px solid ${domain.color}`,
                }}
              >
                <Icon className="w-8 h-8" style={{ color: domain.color }} />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold font-mono" style={{ color: scoreColor }}>
                  {domain.score}
                </div>
                <div
                  className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  Health Score
                </div>
              </div>
              <div
                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border"
                style={{
                  color: alertColor,
                  borderColor: alertColor,
                  backgroundColor: `color-mix(in srgb, ${alertColor} 10%, transparent)`,
                }}
              >
                {domain.alerts.count > 0
                  ? `${domain.alerts.count} Alert${domain.alerts.count > 1 ? 's' : ''}`
                  : 'No Alerts'}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-fg-secondary)' }}>
                {domain.status}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {domain.kpis.map((kpi, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg flex flex-col gap-1"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-surface-border)',
                  }}
                >
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: 'var(--color-fg-muted)' }}
                  >
                    {kpi.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xl font-bold font-mono"
                      style={{ color: 'var(--color-fg-primary)' }}
                    >
                      {kpi.value}
                    </span>
                    {kpi.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--color-low)' }} />
                    ) : kpi.trend === 'down' ? (
                      <ArrowDownRight
                        className="w-4 h-4"
                        style={{ color: 'var(--color-critical)' }}
                      />
                    ) : (
                      <ArrowRight
                        className="w-4 h-4"
                        style={{ color: 'var(--color-fg-muted)', opacity: 0.5 }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="h-24">
              <p
                className="text-[10px] font-mono uppercase tracking-wider mb-1"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                Health Trend (24h)
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                  <YAxis domain={[min - 2, max + 2]} hide />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={domain.color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {domainActions.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  Required Actions
                </h2>
                {domainActions.map((action) => {
                  const severityColor = getSeverityColor(action.priority);
                  return (
                    <div
                      key={action.id}
                      className="rounded-lg border p-3 flex items-center gap-3"
                      style={{
                        backgroundColor: 'var(--color-surface-base)',
                        borderColor: 'var(--color-surface-border)',
                      }}
                    >
                      <div
                        className="w-1 h-8 rounded-full shrink-0"
                        style={{ backgroundColor: severityColor }}
                      />
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span
                          className="text-[10px] font-mono uppercase tracking-wider"
                          style={{ color: severityColor }}
                        >
                          {action.priority}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--color-fg-primary)' }}>
                          {action.text}
                        </span>
                      </div>
                      <a
                        href="/"
                        className="shrink-0 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-md"
                        style={{
                          backgroundColor: 'var(--color-fg-primary)',
                          color: 'var(--color-bg-primary)',
                        }}
                      >
                        {action.buttonText}
                      </a>
                    </div>
                  );
                })}
              </div>
            )}

            {relatedIntel.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  Intelligence Correlations
                </h2>
                {relatedIntel.map((card) => {
                  const severityColor = getSeverityColor(card.severity);
                  return (
                    <div
                      key={card.id}
                      className="rounded-xl p-5 flex flex-col gap-3"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-surface-border)',
                        borderLeftWidth: '3px',
                        borderLeftColor: severityColor,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className="font-bold text-sm"
                          style={{ color: 'var(--color-fg-primary)' }}
                        >
                          {card.title}
                        </h3>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                          style={{
                            color: severityColor,
                            backgroundColor: `color-mix(in srgb, ${severityColor} 12%, transparent)`,
                          }}
                        >
                          {card.severity}
                        </span>
                      </div>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: 'var(--color-fg-muted)' }}
                      >
                        {card.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {card.entities.map((entity) => (
                          <span
                            key={entity}
                            className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: 'var(--color-surface-base)',
                              border: '1px solid var(--color-surface-border)',
                              color: 'var(--color-fg-secondary)',
                            }}
                          >
                            {entity}
                          </span>
                        ))}
                      </div>
                      <div
                        className="pt-2 flex items-center gap-2"
                        style={{ borderTop: '1px solid var(--color-surface-border)' }}
                      >
                        <ArrowRight className="w-3 h-3" style={{ color: severityColor }} />
                        <span className="text-xs font-medium" style={{ color: severityColor }}>
                          {card.action}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {domainActions.length === 0 && relatedIntel.length === 0 && (
              <div
                className="p-8 rounded-xl text-center text-sm"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  border: '1px solid var(--color-surface-border)',
                  color: 'var(--color-fg-muted)',
                }}
              >
                No pending actions or intelligence alerts for this domain.
              </div>
            )}
          </div>

          <div className="lg:col-span-1 flex flex-col gap-4">
            <h2
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: 'var(--color-fg-muted)' }}
            >
              Recent Events {domainEvents.length > 0 ? `(${domainEvents.length})` : ''}
            </h2>
            <div
              className="rounded-xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-surface-border)',
              }}
            >
              {domainEvents.length === 0 ? (
                <div className="p-4 text-xs text-center" style={{ color: 'var(--color-fg-muted)' }}>
                  No recent events for {domain.name}
                </div>
              ) : (
                <div className="overflow-y-auto p-4 flex flex-col gap-4 max-h-[500px]">
                  {domainEvents.map((event) => (
                    <div
                      key={event.id}
                      className="relative pl-4 pb-4 last:pb-0"
                      style={{ borderLeft: '1px solid var(--color-surface-border)' }}
                    >
                      <div
                        className="absolute w-2 h-2 rounded-full top-1.5"
                        style={{
                          backgroundColor: getSeverityColor(event.severity),
                          left: '-4.5px',
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <div
                          className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider"
                          style={{ color: 'var(--color-fg-muted)' }}
                        >
                          <span>{event.time}</span>
                          <span style={{ opacity: 0.5 }}>/</span>
                          <span style={{ color: getSeverityColor(event.severity) }}>
                            {event.severity}
                          </span>
                        </div>
                        <h4
                          className="text-sm font-semibold"
                          style={{ color: 'var(--color-fg-primary)' }}
                        >
                          {event.title}
                        </h4>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: 'var(--color-fg-muted)' }}
                        >
                          {event.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {domainEvents.length === 0 && (
              <div className="flex flex-col gap-2">
                <p
                  className="text-[10px] font-mono uppercase tracking-wider"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  Cross-domain feed
                </p>
                <Timeline events={allEvents.slice(0, 5)} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DomainDetail;
