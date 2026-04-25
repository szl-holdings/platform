import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

interface FrontierProposal {
  id: string;
  title: string;
  targetAgent: string;
  priority: string;
  status: string;
  estimatedEffort?: string;
}

interface RecalibrationMemo {
  id: string;
  weekOf: string;
  title: string;
  audit: string;
  signalCount: number;
  proposalCount: number;
  createdAt: string;
}

interface FrontierBriefingResponse {
  memo: RecalibrationMemo;
  topProposals: FrontierProposal[];
}

async function fetchFrontierBriefing(): Promise<FrontierBriefingResponse> {
  const res = await fetch('/api/helios/frontier-briefing');
  if (!res.ok) throw new Error('Failed to fetch frontier briefing');
  return res.json();
}

const PRIORITY_COLOR: Record<string, string> = {
  P0: '#ef4444',
  P1: '#f59e0b',
  P2: '#3b82f6',
  P3: '#6b7280',
};

function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

export function HeliosFrontierBriefing() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['helios-frontier-briefing'],
    queryFn: fetchFrontierBriefing,
    staleTime: 120_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 6,
          background: 'var(--pulse-card)',
          border: '1px solid var(--pulse-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={13} style={{ color: '#f59e0b' }} />
          <span
            style={{
              fontSize: '0.63rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: 'var(--pulse-text-muted)',
            }}
          >
            HELIOS Frontier Briefing
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 40,
                borderRadius: 4,
                background: 'var(--pulse-border)',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) return null;

  const { memo, topProposals } = data;
  const memoDate = memo?.weekOf
    ? new Date(memo.weekOf).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 6,
        background: 'var(--pulse-card)',
        border: '1px solid var(--pulse-border)',
        borderLeftWidth: '3px',
        borderLeftColor: '#f59e0b',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={13} style={{ color: '#f59e0b' }} />
          <span
            style={{
              fontSize: '0.63rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: '#f59e0b',
            }}
          >
            HELIOS Frontier Briefing
          </span>
        </div>
        <a
          href="/helios/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: '#f59e0b',
            textDecoration: 'none',
            opacity: 0.85,
          }}
        >
          Open Engine <ArrowRight size={10} />
        </a>
      </div>

      {memo && (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 4,
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <p
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--pulse-text-dim)',
              marginBottom: 4,
            }}
          >
            {memo.title}
          </p>
          <p
            style={{
              fontSize: '0.65rem',
              color: 'var(--pulse-text-muted)',
              lineHeight: 1.5,
            }}
          >
            {truncate(memo.audit, 220)}
          </p>
          <p
            style={{
              fontSize: '0.6rem',
              color: 'var(--pulse-text-muted)',
              marginTop: 6,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            Week of {memoDate} · {memo.signalCount} signals · {memo.proposalCount} proposals
          </p>
        </div>
      )}

      {topProposals && topProposals.length > 0 && (
        <div>
          <p
            style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: 'var(--pulse-text-muted)',
              marginBottom: 6,
            }}
          >
            Top Capability Proposals
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topProposals.map((p) => {
              const color = PRIORITY_COLOR[p.priority] ?? '#6b7280';
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 10px',
                    borderRadius: 4,
                    background: 'var(--pulse-bg)',
                    border: '1px solid var(--pulse-border)',
                    borderLeftWidth: '3px',
                    borderLeftColor: color,
                  }}
                >
                  <TrendingUp size={12} style={{ color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 600,
                        color: 'var(--pulse-text-dim)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.title}
                    </p>
                    <p
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--pulse-text-muted)',
                        marginTop: 1,
                      }}
                    >
                      {p.targetAgent}
                      {p.estimatedEffort ? ` · ${p.estimatedEffort}` : ''}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace',
                      color,
                      flexShrink: 0,
                    }}
                  >
                    {p.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
