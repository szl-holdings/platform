import { AlertTriangle, ArrowLeft, Clock, Shield, } from 'lucide-react';
import { useLocation } from 'wouter';
import { useEcosystemData } from '../hooks/use-ecosystem-data';
import { getDomainColor, getSeverityColor } from '../lib/utils';

export function ExecutiveBriefing() {
  const [, navigate] = useLocation();
  const { data, sseConnected } = useEcosystemData();

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-fg-muted)' }}
      >
        <div className="text-xs font-mono uppercase tracking-widest animate-pulse">
          Generating briefing...
        </div>
      </div>
    );
  }

  const criticalDomains = data.domains.filter((d) => d.score < 65);
  const warningDomains = data.domains.filter((d) => d.score >= 65 && d.score < 80);
  const nominalDomains = data.domains.filter((d) => d.score >= 80);
  const criticalEvents = data.timeline
    .filter((e) => e.severity === 'critical' || e.severity === 'high')
    .slice(0, 5);
  const pendingApprovals = data.actions.filter(
    (a) => a.priority === 'critical' || a.priority === 'high',
  );
  const criticalIntel = data.intelligence.filter(
    (c) => c.severity === 'critical' || c.severity === 'high',
  );

  const scoreColor = (score: number) =>
    score >= 80
      ? 'var(--color-low)'
      : score >= 65
        ? 'var(--color-medium)'
        : 'var(--color-critical)';

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
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider"
            style={{ color: 'var(--color-fg-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="h-4 w-px" style={{ backgroundColor: 'var(--color-surface-border)' }} />
          <span
            className="text-sm font-bold tracking-[0.15em]"
            style={{ color: 'var(--color-fg-primary)' }}
          >
            EXECUTIVE BRIEFING
          </span>
        </div>
        {sseConnected && (
          <div
            className="flex items-center gap-1.5 text-xs font-mono"
            style={{ color: 'var(--color-low)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-low)', boxShadow: '0 0 6px var(--color-low)' }}
            />
            LIVE
          </div>
        )}
      </div>

      <main className="flex-1 p-6 lg:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-fg-primary)' }}>
            Morning Briefing
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>
            {dateStr}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-5 rounded-xl flex flex-col gap-2"
            style={{
              backgroundColor: 'var(--color-surface-base)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: 'var(--color-fg-muted)' }} />
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                Ecosystem Health
              </span>
            </div>
            <div
              className="text-4xl font-bold font-mono"
              style={{ color: scoreColor(data.compositeScore) }}
            >
              {data.compositeScore}
            </div>
            <div
              className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border w-fit"
              style={{
                color: scoreColor(data.compositeScore),
                borderColor: scoreColor(data.compositeScore),
                backgroundColor: `color-mix(in srgb, ${scoreColor(data.compositeScore)} 10%, transparent)`,
              }}
            >
              {data.compositeStatus}
            </div>
          </div>

          <div
            className="p-5 rounded-xl flex flex-col gap-2"
            style={{
              backgroundColor: 'var(--color-surface-base)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-critical)' }} />
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                Needs Attention
              </span>
            </div>
            <div
              className="text-4xl font-bold font-mono"
              style={{ color: 'var(--color-critical)' }}
            >
              {criticalDomains.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
              {criticalDomains.length === 0
                ? 'All domains nominal'
                : `Domain${criticalDomains.length > 1 ? 's' : ''} below threshold`}
            </div>
          </div>

          <div
            className="p-5 rounded-xl flex flex-col gap-2"
            style={{
              backgroundColor: 'var(--color-surface-base)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--color-high)' }} />
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                Pending Approvals
              </span>
            </div>
            <div
              className="text-4xl font-bold font-mono"
              style={{
                color: pendingApprovals.length > 0 ? 'var(--color-high)' : 'var(--color-low)',
              }}
            >
              {pendingApprovals.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
              {pendingApprovals.length === 0 ? 'All clear' : 'Require executive sign-off'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <h2
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: 'var(--color-fg-muted)' }}
            >
              Domain Status Overview
            </h2>
            <div className="flex flex-col gap-2">
              {[...criticalDomains, ...warningDomains, ...nominalDomains].map((domain) => (
                <a
                  key={domain.id}
                  href={`/command/domain/${domain.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--color-surface-base)',
                    borderColor: 'var(--color-surface-border)',
                  }}
                >
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-sm font-semibold" style={{ color: domain.color }}>
                      {domain.name}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                      {domain.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {domain.alerts.count > 0 && (
                      <div
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border"
                        style={{
                          color: `var(--color-${domain.alerts.severity})`,
                          borderColor: `var(--color-${domain.alerts.severity})`,
                          backgroundColor: `color-mix(in srgb, var(--color-${domain.alerts.severity}) 10%, transparent)`,
                        }}
                      >
                        {domain.alerts.count} alert{domain.alerts.count > 1 ? 's' : ''}
                      </div>
                    )}
                    <div
                      className="text-lg font-bold font-mono w-10 text-right"
                      style={{ color: scoreColor(domain.score) }}
                    >
                      {domain.score}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {criticalEvents.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  Critical & High Priority Events
                </h2>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-surface-base)',
                    border: '1px solid var(--color-surface-border)',
                  }}
                >
                  {criticalEvents.map((event, i) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-1 p-4"
                      style={{
                        borderBottom:
                          i < criticalEvents.length - 1
                            ? '1px solid var(--color-surface-border)'
                            : 'none',
                      }}
                    >
                      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
                        <span style={{ color: getDomainColor(event.domain) }}>{event.domain}</span>
                        <span style={{ color: 'var(--color-fg-muted)', opacity: 0.5 }}>/</span>
                        <span style={{ color: getSeverityColor(event.severity) }}>
                          {event.severity}
                        </span>
                        <span style={{ color: 'var(--color-fg-muted)', marginLeft: 'auto' }}>
                          {event.time}
                        </span>
                      </div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--color-fg-primary)' }}
                      >
                        {event.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingApprovals.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  Required Executive Actions
                </h2>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-surface-base)',
                    border: '1px solid var(--color-surface-border)',
                  }}
                >
                  {pendingApprovals.map((action, i) => {
                    const sColor = getSeverityColor(action.priority);
                    return (
                      <div
                        key={action.id}
                        className="flex items-center gap-3 p-4"
                        style={{
                          borderBottom:
                            i < pendingApprovals.length - 1
                              ? '1px solid var(--color-surface-border)'
                              : 'none',
                        }}
                      >
                        <div
                          className="w-1 h-8 rounded-full shrink-0"
                          style={{ backgroundColor: sColor }}
                        />
                        <div className="flex-1 flex flex-col gap-0.5">
                          <span
                            className="text-[10px] font-mono uppercase tracking-wider"
                            style={{ color: getDomainColor(action.domain) }}
                          >
                            {action.domain} / {action.priority}
                          </span>
                          <span className="text-sm" style={{ color: 'var(--color-fg-primary)' }}>
                            {action.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {criticalIntel.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  Key Intelligence
                </h2>
                {criticalIntel.slice(0, 2).map((card) => {
                  const sColor = getSeverityColor(card.severity);
                  return (
                    <div
                      key={card.id}
                      className="rounded-xl p-4 flex flex-col gap-2"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-surface-border)',
                        borderLeftWidth: '3px',
                        borderLeftColor: sColor,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="font-bold text-sm leading-tight"
                          style={{ color: 'var(--color-fg-primary)' }}
                        >
                          {card.title}
                        </h3>
                        <span
                          className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                          style={{
                            color: sColor,
                            backgroundColor: `color-mix(in srgb, ${sColor} 12%, transparent)`,
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
                      <div className="text-xs font-medium" style={{ color: sColor }}>
                        → {card.action}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ExecutiveBriefing;
