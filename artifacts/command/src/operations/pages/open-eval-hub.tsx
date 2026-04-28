import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  Award,
  BarChart3,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  FlaskConical,
  GitBranch,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';

const BG = 'var(--gi-bg-base)';
const CARD = 'rgba(255,255,255,0.03)';
const CARD_HOVER = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.07)';
const BORDER_STRONG = 'rgba(255,255,255,0.12)';
const FG = 'var(--gi-text-primary)';
const FG_MUT = 'var(--gi-text-muted)';
const FG_DIM = 'rgba(255,255,255,0.4)';
const ACCENT = '#c9b787';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const BASE = (import.meta.env.BASE_URL ?? '/command/').replace(/\/$/, '');
const apiUrl = (path: string) => `${BASE}/api${path}`;

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url, { credentials: 'include' }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<T>;
  });
}

type Benchmark = {
  id: string;
  name: string;
  description?: string | null;
  domain?: string | null;
  taskCount?: number;
  resultCount?: number;
  verifiedCount?: number;
  updatedAt?: string;
};

type LeaderboardRow = {
  entityId: string;
  entityName: string;
  entityKind?: string;
  score: number;
  scoreUnit?: string;
  verifiedAt?: string | null;
  rank: number;
};

type BenchmarksResponse = { benchmarks?: Benchmark[] };
type LeaderboardResponse = { rows?: LeaderboardRow[]; benchmarkName?: string };

const QUICK_LINKS: Array<{
  href: string;
  label: string;
  desc: string;
  icon: typeof FlaskConical;
}> = [
  {
    href: '/agents/evals',
    label: 'MirrorEval',
    desc: 'Per-agent evaluation runs across the A11oy runtime',
    icon: Brain,
  },
  {
    href: '/operations/eval-studio',
    label: 'Eval Studio',
    desc: 'Author and govern Counsel evaluation suites',
    icon: Layers,
  },
  {
    href: '/evolution/evaluation',
    label: 'Evolution Evaluation Console',
    desc: 'Precision Evolution runtime — model promotion gates',
    icon: GitBranch,
  },
  {
    href: '/cognitive/evals',
    label: 'Cognitive Eval Console',
    desc: 'Cognitive consoles — regression detection & traces',
    icon: Cpu,
  },
];

function formatRelative(iso?: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '—';
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 6,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: FG_MUT }}>
        <Icon size={14} />
        <span
          style={{
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ color: FG, fontSize: 22, fontFamily: MONO, fontWeight: 500 }}>{value}</div>
      {hint ? <div style={{ color: FG_DIM, fontSize: 11 }}>{hint}</div> : null}
    </div>
  );
}

export default function OpenEvalHubPage() {
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | null>(null);

  const benchmarksQ = useQuery<BenchmarksResponse>({
    queryKey: ['open-eval-hub', 'benchmarks'],
    queryFn: () => fetchJson(apiUrl('/eval-registry/benchmarks')),
    staleTime: 60_000,
  });

  const benchmarks = benchmarksQ.data?.benchmarks ?? [];
  const activeBenchmarkId = selectedBenchmarkId ?? benchmarks[0]?.id ?? null;
  const activeBenchmark = benchmarks.find((b) => b.id === activeBenchmarkId) ?? null;

  const leaderboardQ = useQuery<LeaderboardResponse>({
    queryKey: ['open-eval-hub', 'leaderboard', activeBenchmarkId],
    queryFn: () =>
      fetchJson(apiUrl(`/eval-registry/benchmarks/${activeBenchmarkId}/leaderboard`)),
    enabled: Boolean(activeBenchmarkId),
    staleTime: 30_000,
  });

  const totals = useMemo(() => {
    const totalBenchmarks = benchmarks.length;
    const totalResults = benchmarks.reduce((acc, b) => acc + (b.resultCount ?? 0), 0);
    const verifiedResults = benchmarks.reduce((acc, b) => acc + (b.verifiedCount ?? 0), 0);
    const verificationRate =
      totalResults > 0 ? Math.round((verifiedResults / totalResults) * 100) : 0;
    return { totalBenchmarks, totalResults, verifiedResults, verificationRate };
  }, [benchmarks]);

  const leaderboardRows = leaderboardQ.data?.rows ?? [];

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '32px 40px', color: FG }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 32,
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: ACCENT,
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              <FlaskConical size={14} />
              Open Evaluation Layer
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 500, margin: 0, color: FG }}>
              Open Evaluation Hub
            </h1>
            <p style={{ color: FG_MUT, fontSize: 13, marginTop: 6, maxWidth: 720 }}>
              A unified entry point into every evaluation surface — benchmark registry,
              leaderboards, governance gates, and per-runtime eval consoles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              benchmarksQ.refetch();
              leaderboardQ.refetch();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              background: CARD,
              border: `1px solid ${BORDER_STRONG}`,
              borderRadius: 4,
              color: FG_MUT,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <StatTile
            icon={Database}
            label="Benchmarks"
            value={benchmarksQ.isLoading ? '—' : totals.totalBenchmarks}
            hint="Registered open benchmarks"
          />
          <StatTile
            icon={BarChart3}
            label="Results"
            value={benchmarksQ.isLoading ? '—' : totals.totalResults.toLocaleString()}
            hint="Aggregate runs across registry"
          />
          <StatTile
            icon={ShieldCheck}
            label="Verified"
            value={benchmarksQ.isLoading ? '—' : totals.verifiedResults.toLocaleString()}
            hint="Proof-chain verified results"
          />
          <StatTile
            icon={Target}
            label="Verification Rate"
            value={benchmarksQ.isLoading ? '—' : `${totals.verificationRate}%`}
            hint="Verified / total"
          />
        </div>

        {/* Two-column layout: benchmark list + leaderboard */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
          {/* Benchmarks list */}
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: FG_MUT,
                }}
              >
                Benchmarks
              </span>
              <span style={{ color: FG_DIM, fontSize: 11, fontFamily: MONO }}>
                {benchmarks.length}
              </span>
            </div>
            <div style={{ maxHeight: 540, overflowY: 'auto' }}>
              {benchmarksQ.isLoading ? (
                <div style={{ padding: 16, color: FG_DIM, fontSize: 12 }}>Loading…</div>
              ) : benchmarksQ.isError ? (
                <div style={{ padding: 16, color: '#f87171', fontSize: 12 }}>
                  Failed to load benchmarks.
                </div>
              ) : benchmarks.length === 0 ? (
                <div style={{ padding: 16, color: FG_DIM, fontSize: 12 }}>
                  No benchmarks registered yet.
                </div>
              ) : (
                benchmarks.map((b) => {
                  const isActive = b.id === activeBenchmarkId;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBenchmarkId(b.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 14px',
                        borderBottom: `1px solid ${BORDER}`,
                        background: isActive ? CARD_HOVER : 'transparent',
                        borderLeft: `2px solid ${isActive ? ACCENT : 'transparent'}`,
                        color: FG,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: FG,
                          fontWeight: 500,
                          marginBottom: 4,
                        }}
                      >
                        {b.name}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 12,
                          alignItems: 'center',
                          color: FG_DIM,
                          fontSize: 11,
                          fontFamily: MONO,
                        }}
                      >
                        {b.domain ? <span>{b.domain}</span> : null}
                        <span>{b.resultCount ?? 0} results</span>
                        {(b.verifiedCount ?? 0) > 0 ? (
                          <span style={{ color: ACCENT, display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                            <CheckCircle2 size={10} />
                            {b.verifiedCount}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Leaderboard panel */}
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              overflow: 'hidden',
              minHeight: 540,
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: FG_MUT,
                    marginBottom: 4,
                  }}
                >
                  Leaderboard
                </div>
                <div style={{ fontSize: 16, color: FG, fontWeight: 500 }}>
                  {activeBenchmark?.name ?? 'Select a benchmark'}
                </div>
                {activeBenchmark?.description ? (
                  <div style={{ color: FG_MUT, fontSize: 12, marginTop: 4, maxWidth: 720 }}>
                    {activeBenchmark.description}
                  </div>
                ) : null}
              </div>
              {activeBenchmark ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    color: FG_DIM,
                    fontSize: 11,
                    fontFamily: MONO,
                    alignItems: 'flex-end',
                  }}
                >
                  <span>{activeBenchmark.taskCount ?? 0} tasks</span>
                  <span>updated {formatRelative(activeBenchmark.updatedAt)}</span>
                </div>
              ) : null}
            </div>

            <div>
              {!activeBenchmarkId ? (
                <div style={{ padding: 24, color: FG_DIM, fontSize: 12 }}>
                  Pick a benchmark from the left to view its leaderboard.
                </div>
              ) : leaderboardQ.isLoading ? (
                <div style={{ padding: 24, color: FG_DIM, fontSize: 12 }}>Loading leaderboard…</div>
              ) : leaderboardQ.isError ? (
                <div style={{ padding: 24, color: '#f87171', fontSize: 12 }}>
                  Failed to load leaderboard.
                </div>
              ) : leaderboardRows.length === 0 ? (
                <div style={{ padding: 24, color: FG_DIM, fontSize: 12 }}>
                  No verified results yet for this benchmark.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: FG_MUT, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      <th style={{ padding: '10px 18px', textAlign: 'left', width: 50 }}>#</th>
                      <th style={{ padding: '10px 18px', textAlign: 'left' }}>Entity</th>
                      <th style={{ padding: '10px 18px', textAlign: 'right' }}>Score</th>
                      <th style={{ padding: '10px 18px', textAlign: 'right' }}>Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardRows.map((row) => (
                      <tr key={`${row.entityId}-${row.rank}`} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td
                          style={{
                            padding: '12px 18px',
                            color: row.rank <= 3 ? ACCENT : FG_DIM,
                            fontFamily: MONO,
                            fontSize: 13,
                          }}
                        >
                          {row.rank <= 3 ? (
                            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                              <Award size={12} />
                              {row.rank}
                            </span>
                          ) : (
                            row.rank
                          )}
                        </td>
                        <td style={{ padding: '12px 18px', color: FG, fontSize: 13 }}>
                          <div>{row.entityName}</div>
                          {row.entityKind ? (
                            <div style={{ color: FG_DIM, fontSize: 11, fontFamily: MONO }}>
                              {row.entityKind}
                            </div>
                          ) : null}
                        </td>
                        <td
                          style={{
                            padding: '12px 18px',
                            textAlign: 'right',
                            color: FG,
                            fontFamily: MONO,
                            fontSize: 13,
                          }}
                        >
                          {row.score.toFixed(3)}
                          {row.scoreUnit ? (
                            <span style={{ color: FG_DIM, marginLeft: 4 }}>{row.scoreUnit}</span>
                          ) : null}
                        </td>
                        <td
                          style={{
                            padding: '12px 18px',
                            textAlign: 'right',
                            color: FG_DIM,
                            fontFamily: MONO,
                            fontSize: 12,
                          }}
                        >
                          {formatRelative(row.verifiedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: FG_MUT,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            <Sparkles size={12} />
            Eval Consoles
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '14px 16px',
                    background: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 6,
                    color: FG,
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: ACCENT,
                      }}
                    >
                      <Icon size={14} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: FG }}>
                        {link.label}
                      </span>
                    </div>
                    <ArrowUpRight size={14} color={FG_DIM} />
                  </div>
                  <div style={{ color: FG_MUT, fontSize: 12, lineHeight: 1.5 }}>{link.desc}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: 24,
            padding: '12px 16px',
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            color: FG_DIM,
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <TrendingUp size={12} />
          Open Evaluation Layer aggregates results from every runtime — A11oy MirrorEval, Counsel
          Eval Studio, Precision Evolution, and Cognitive Consoles — onto a single, verifiable
          ledger.
        </div>
      </div>
    </div>
  );
}
