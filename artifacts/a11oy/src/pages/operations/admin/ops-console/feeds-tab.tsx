import { AlertTriangle, CheckCircle, Rss, TrendingUp, X } from 'lucide-react';
import { BG, BORDER, MetricCard, SectionHeader, Sparkline, StatusBadge, TEXT } from './shared';
import { formatTime, relativeTime } from './utils';
import type { FeedHealth } from './types';

interface Props {
  feedHealth: { data?: FeedHealth; isLoading: boolean; error?: unknown };
}

export function FeedsTab({ feedHealth }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {feedHealth.data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
          <MetricCard icon={Rss} label="Feeds" value={feedHealth.data.summary.totalFeeds} color="#d4a054" />
          <MetricCard icon={CheckCircle} label="Healthy" value={feedHealth.data.summary.healthy} color="#6b8f71" />
          <MetricCard icon={AlertTriangle} label="Degraded" value={feedHealth.data.summary.degraded} color="#d4a054" />
          <MetricCard icon={X} label="Down" value={feedHealth.data.summary.down} color="#c45a4a" />
          <MetricCard icon={TrendingUp} label="Created / Merged" value={`${feedHealth.data.summary.totalEntitiesCreated} / ${feedHealth.data.summary.totalEntitiesMerged}`} sub="since startup" color="#4a90b8" />
        </div>
      )}
      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={Rss} title="Sanctions & Intelligence Feed Activity" subtitle="Per-feed entity churn (created vs. merged) across recent polls — totals reset on API restart"
          action={feedHealth.data && <span style={{ fontSize: '10px', color: TEXT.muted, fontFamily: 'var(--font-mono)' }}>Updated {formatTime(feedHealth.data.timestamp)}</span>}
        />
        {feedHealth.isLoading && !feedHealth.data && <div style={{ color: TEXT.muted, fontSize: '12px', textAlign: 'center', padding: '2rem 0' }}>Loading feed activity…</div>}
        {feedHealth.data && feedHealth.data.feeds.length === 0 && (
          <div style={{ color: TEXT.muted, fontSize: '12px', textAlign: 'center', padding: '2rem 0' }}>
            No intelligence feeds registered. Enable feeds via env flags (e.g. <span style={{ fontFamily: 'var(--font-mono)' }}>SANCTIONS_FEED_ENABLED</span>) and restart the API server.
          </div>
        )}
        {feedHealth.data && feedHealth.data.feeds.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.9fr 0.9fr 1.1fr 1.1fr', gap: '10px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: TEXT.muted, fontFamily: 'var(--font-mono)', padding: '4px 8px' }}>
              <span>Feed</span><span>Status</span><span style={{ textAlign: 'right' }}>Created</span><span style={{ textAlign: 'right' }}>Merged</span><span>Last ingest</span><span style={{ textAlign: 'right' }}>Churn (recent polls)</span>
            </div>
            {feedHealth.data.feeds.map((f) => {
              const sparkSeries = f.recentPolls.map((p) => p.entitiesCreated + p.entitiesMerged);
              const stalled = f.recentPolls.length === 0 || (f.lastIngestedAt !== null && Date.now() - new Date(f.lastIngestedAt).getTime() > 30 * 60 * 1000);
              return (
                <div key={f.feedId} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.9fr 0.9fr 1.1fr 1.1fr', gap: '10px', alignItems: 'center', padding: '8px', borderRadius: '6px', background: BG.section, border: `1px solid ${stalled ? 'rgba(212,160,84,0.18)' : BORDER.muted}` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.feedName}</div>
                    <div style={{ fontSize: '10px', color: TEXT.muted, fontFamily: 'var(--font-mono)' }}>{f.feedId} · avg {f.avgPollDurationMs}ms{f.consecutiveFailures > 0 ? ` · ${f.consecutiveFailures} fails` : ''}</div>
                  </div>
                  <StatusBadge status={f.status === 'healthy' ? 'healthy' : f.status === 'down' ? 'down' : 'degraded'} />
                  <span style={{ textAlign: 'right', color: '#6b8f71', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>{f.totalEntitiesCreated}</span>
                  <span style={{ textAlign: 'right', color: '#4a90b8', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>{f.totalEntitiesMerged}</span>
                  <span style={{ fontSize: '11px', color: stalled ? '#d4a054' : TEXT.secondary, fontFamily: 'var(--font-mono)' }}>{relativeTime(f.lastIngestedAt)}</span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                    <Sparkline values={sparkSeries} color="#6b8f71" />
                    <span style={{ fontSize: '9px', color: TEXT.muted, fontFamily: 'var(--font-mono)', minWidth: '30px', textAlign: 'right' }}>{f.recentPolls.length} polls</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {feedHealth.error && <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(196,90,74,0.06)', border: '1px solid rgba(196,90,74,0.2)', color: '#c45a4a', fontSize: '11px' }}>Feed activity unavailable — admin endpoint not reachable.</div>}
      </div>
    </div>
  );
}
