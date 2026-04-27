import { Clock, RefreshCw, Users } from 'lucide-react';
import type { BriefingPublication } from '../lib/api';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatusPill({ status }: { status: BriefingPublication['status'] }) {
  const styles: Record<string, React.CSSProperties> = {
    published: { color: '#4eca8b', background: 'rgba(78,202,139,0.12)', borderColor: 'rgba(78,202,139,0.3)' },
    publishing: { color: '#c8a84b', background: 'rgba(200,168,75,0.12)', borderColor: 'rgba(200,168,75,0.3)' },
    failed: { color: '#ef4444', background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  };
  return (
    <span
      style={{
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        padding: '2px 7px',
        borderRadius: 4,
        border: '1px solid',
        fontFamily: 'JetBrains Mono, monospace',
        ...styles[status],
      }}
    >
      {status}
    </span>
  );
}

interface PublicationHistoryProps {
  publications: BriefingPublication[];
  loading?: boolean;
  onRepublish?: (pub: BriefingPublication) => void;
}

export function PublicationHistory({
  publications,
  loading,
  onRepublish,
}: PublicationHistoryProps) {
  if (loading) {
    return (
      <div style={wrapStyle}>
        <div style={headerStyle}>Publication History</div>
        <div style={{ color: 'var(--pulse-text-muted)', fontSize: '0.82rem', padding: '12px 0' }}>
          Loading…
        </div>
      </div>
    );
  }

  if (publications.length === 0) {
    return (
      <div style={wrapStyle}>
        <div style={headerStyle}>Publication History</div>
        <div style={{ color: 'var(--pulse-text-muted)', fontSize: '0.82rem', padding: '12px 0' }}>
          This briefing has not been published to the organization yet.
        </div>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <div style={headerStyle}>Publication History</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {publications.map((pub) => (
          <div key={pub.publicationId} style={rowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <StatusPill status={pub.status} />
              <span style={{ fontSize: '0.72rem', color: 'var(--pulse-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                {formatDate(pub.publishedAt)}
              </span>
              {pub.publisherName && (
                <span style={{ fontSize: '0.72rem', color: 'var(--pulse-text-muted)' }}>
                  by <span style={{ color: 'var(--pulse-text)' }}>{pub.publisherName}</span>
                </span>
              )}
              <span style={{ fontSize: '0.72rem', color: 'var(--pulse-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={11} />
                {pub.totalRecipients} recipient{pub.totalRecipients !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.75rem', color: 'var(--pulse-text-muted)' }}>
              <span>
                Audience:{' '}
                <span style={{ color: 'var(--pulse-text)' }}>
                  {pub.audienceType === 'all'
                    ? 'Everyone in org'
                    : `Roles: ${(pub.audienceRoles ?? []).join(', ') || 'none'}`}
                </span>
              </span>
              <span>·</span>
              <span>
                Channels:{' '}
                <span style={{ color: 'var(--pulse-text)' }}>{pub.channels.join(', ')}</span>
              </span>
            </div>

            {pub.status === 'published' && (
              <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace' }}>
                <span style={{ color: '#4eca8b' }}>✓ {pub.inAppDelivered} in-app</span>
                {pub.channels.includes('push') && (
                  <>
                    <span style={{ color: '#4eca8b' }}>✓ {pub.pushSent} push sent</span>
                    {pub.pushFailed > 0 && (
                      <span style={{ color: '#f59e0b' }}>⚠ {pub.pushFailed} push failed</span>
                    )}
                  </>
                )}
              </div>
            )}

            {pub.headlineOverride && (
              <div style={{ marginTop: 5, fontSize: '0.75rem', color: 'var(--pulse-text-muted)' }}>
                Headline: <em style={{ color: 'var(--pulse-text)' }}>{pub.headlineOverride}</em>
              </div>
            )}

            {onRepublish && pub.status === 'published' && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => onRepublish(pub)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 5,
                    border: '1px solid var(--pulse-border)',
                    background: 'transparent',
                    color: 'var(--pulse-text-muted)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={11} />
                  Republish
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  marginTop: 24,
  padding: '16px 20px',
  borderRadius: 8,
  border: '1px solid var(--pulse-border)',
  background: 'rgba(255,255,255,0.02)',
};

const headerStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--pulse-text-muted)',
  fontFamily: 'JetBrains Mono, monospace',
  marginBottom: 12,
};

const rowStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid var(--pulse-border)',
  background: 'rgba(255,255,255,0.025)',
};
