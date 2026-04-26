import { useMemo, useState } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, BarChart2, FileCode2, Clock } from 'lucide-react';
import report from '@/data/design-tokens-drift.generated.json';
import historyJson from '@/data/design-tokens-drift-history.generated.json';

interface FileFinding {
  file: string;
  count: number;
  examples: string[];
}

interface ArtifactReport {
  id: string;
  dir: string;
  title: string;
  kind: string;
  lines: number;
  files: number;
  violations: number;
  score: number;
  top: FileFinding[];
}

interface DriftReport {
  generatedAt: string;
  threshold: number;
  averageScore: number;
  totalArtifacts: number;
  artifacts: ArtifactReport[];
}

interface HistoryEntry {
  ts: string;
  averageScore: number;
  perArtifact: Record<string, number>;
}

const TYPED_REPORT = report as DriftReport;
const HISTORY = historyJson as HistoryEntry[];

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--gi-state-allowed)';
  if (score >= 60) return 'var(--gi-accent-teal)';
  if (score >= 40) return 'var(--gi-state-requires-approval)';
  return 'var(--gi-state-blocked)';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'COMPLIANT';
  if (score >= 60) return 'WATCH';
  if (score >= 40) return 'AT-RISK';
  return 'NON-COMPLIANT';
}

function ScoreIcon({ score }: { score: number }) {
  if (score >= 80) return <CheckCircle2 size={16} style={{ color: 'var(--gi-state-allowed)' }} />;
  if (score >= 60) return <TrendingUp size={16} style={{ color: 'var(--gi-accent-teal)' }} />;
  if (score >= 40) return <AlertTriangle size={16} style={{ color: 'var(--gi-state-requires-approval)' }} />;
  return <XCircle size={16} style={{ color: 'var(--gi-state-blocked)' }} />;
}

function MiniSparkline({ id }: { id: string }) {
  const points = useMemo(() => {
    const recent = HISTORY.slice(-12);
    return recent.map((h) => h.perArtifact[id] ?? 0);
  }, [id]);

  if (points.length < 2) return null;
  const max = 100;
  const min = 0;
  const w = 80;
  const h = 24;
  const pts = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / (max - min)) * h;
      return `${x},${y}`;
    })
    .join(' ');

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const trend = last - prev;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        <polyline
          points={pts}
          fill="none"
          stroke={scoreColor(last)}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
      <span style={{ fontSize: '10px', color: trend >= 0 ? 'var(--gi-state-allowed)' : 'var(--gi-state-blocked)' }}>
        {trend >= 0 ? '+' : ''}{trend.toFixed(0)}
      </span>
    </div>
  );
}

export default function DesignTokenGovernance() {
  usePageMeta({ title: 'Design Token Governance — SZL Holdings', description: 'Per-artifact compliance scores and drift tracking for the @workspace/tokens contract.' });

  const [sortBy, setSortBy] = useState<'score' | 'violations' | 'title'>('score');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...TYPED_REPORT.artifacts].sort((a, b) => {
      if (sortBy === 'score') return a.score - b.score;
      if (sortBy === 'violations') return b.violations - a.violations;
      return a.title.localeCompare(b.title);
    });
  }, [sortBy]);

  const passing = TYPED_REPORT.artifacts.filter((a) => a.score >= 80).length;
  const watch = TYPED_REPORT.artifacts.filter((a) => a.score >= 60 && a.score < 80).length;
  const atRisk = TYPED_REPORT.artifacts.filter((a) => a.score >= 40 && a.score < 60).length;
  const failing = TYPED_REPORT.artifacts.filter((a) => a.score < 40).length;

  const generatedDate = new Date(TYPED_REPORT.generatedAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gi-bg-base)', color: 'var(--gi-text-primary)', fontFamily: 'var(--gi-font-sans, Inter, sans-serif)' }}>
      <SiteNav />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <BarChart2 size={22} style={{ color: 'var(--gi-accent-blue)' }} />
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--gi-text-primary)', margin: 0 }}>
              Design Token Governance
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--gi-text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
            Per-artifact compliance scores for the <code style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--gi-accent-blue)', background: 'var(--gi-bg-overlay)', padding: '1px 5px', borderRadius: '3px' }}>@workspace/tokens</code> contract.
            Violations = raw hex literals, inline rgb/hsl, or non-aliased design-system imports.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gi-text-muted)', fontSize: '11px' }}>
            <Clock size={12} />
            <span>Last scan: {generatedDate} · Threshold: {TYPED_REPORT.threshold}/100</span>
          </div>
        </div>

        {/* Summary KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Average Score', value: `${TYPED_REPORT.averageScore}`, sub: 'across all artifacts', color: scoreColor(TYPED_REPORT.averageScore) },
            { label: 'Compliant (≥80)', value: `${passing}`, sub: `of ${TYPED_REPORT.totalArtifacts} artifacts`, color: 'var(--gi-state-allowed)' },
            { label: 'Watch (60–79)', value: `${watch}`, sub: 'need attention', color: 'var(--gi-accent-teal)' },
            { label: 'At-Risk (<60)', value: `${atRisk + failing}`, sub: `${failing} non-compliant`, color: 'var(--gi-state-blocked)' },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: 'var(--gi-bg-surface)', border: '1px solid var(--gi-border-subtle)', borderRadius: '6px', padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--gi-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{kpi.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 600, color: kpi.color, lineHeight: 1.1, marginBottom: '4px' }}>{kpi.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--gi-text-secondary)' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Sort controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--gi-text-muted)' }}>Sort by:</span>
          {(['score', 'violations', 'title'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              style={{
                fontSize: '12px', padding: '4px 10px', borderRadius: '4px', border: '1px solid',
                cursor: 'pointer',
                borderColor: sortBy === key ? 'var(--gi-accent-blue)' : 'var(--gi-border-subtle)',
                background: sortBy === key ? 'rgba(77,143,204,0.12)' : 'transparent',
                color: sortBy === key ? 'var(--gi-accent-blue)' : 'var(--gi-text-secondary)',
              }}
            >
              {key === 'score' ? 'Score (asc)' : key === 'violations' ? 'Violations (desc)' : 'Name'}
            </button>
          ))}
        </div>

        {/* Artifact table */}
        <div style={{ border: '1px solid var(--gi-border-subtle)', borderRadius: '6px', overflow: 'hidden', marginBottom: '32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--gi-bg-overlay)', borderBottom: '1px solid var(--gi-border-subtle)' }}>
                {['Artifact', 'Score', 'Status', 'Violations', 'Lines', 'Trend', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--gi-text-muted)', fontSize: '11px', letterSpacing: '0.03em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((art, i) => (
                <>
                  <tr
                    key={art.id}
                    onClick={() => setExpandedId(expandedId === art.id ? null : art.id)}
                    style={{
                      background: i % 2 === 0 ? 'var(--gi-bg-surface)' : 'var(--gi-bg-overlay)',
                      borderBottom: '1px solid var(--gi-border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--gi-text-primary)', marginBottom: '1px' }}>{art.title.split(' — ')[0]}</div>
                      <div style={{ fontSize: '10px', color: 'var(--gi-text-muted)', fontFamily: 'monospace' }}>{art.dir}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '60px', height: '4px', background: 'var(--gi-border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${art.score}%`, height: '100%', background: scoreColor(art.score), borderRadius: '2px', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontWeight: 600, color: scoreColor(art.score), minWidth: '28px' }}>{art.score}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ScoreIcon score={art.score} />
                        <span style={{ color: scoreColor(art.score), fontWeight: 500, fontSize: '11px' }}>{scoreLabel(art.score)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: art.violations > 0 ? 'var(--gi-state-requires-approval)' : 'var(--gi-state-allowed)', fontWeight: 500 }}>
                      {art.violations.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--gi-text-secondary)' }}>
                      {art.lines.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <MiniSparkline id={art.id} />
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--gi-text-muted)', fontSize: '11px' }}>
                      {expandedId === art.id ? '▲' : '▼'}
                    </td>
                  </tr>
                  {expandedId === art.id && art.top.length > 0 && (
                    <tr key={`${art.id}-expanded`}>
                      <td colSpan={7} style={{ padding: 0, background: 'var(--gi-bg-base)', borderBottom: '1px solid var(--gi-border-subtle)' }}>
                        <div style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gi-text-muted)', marginBottom: '10px', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileCode2 size={12} />
                            Top Offending Files
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {art.top.slice(0, 5).map((f) => (
                              <div key={f.file} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'var(--gi-bg-surface)', borderRadius: '4px', padding: '8px 12px', border: '1px solid var(--gi-border-subtle)' }}>
                                <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '11px', color: 'var(--gi-text-secondary)', wordBreak: 'break-all' }}>{f.file}</div>
                                <div style={{ flexShrink: 0, fontWeight: 600, color: 'var(--gi-state-requires-approval)', fontSize: '11px', minWidth: '40px', textAlign: 'right' }}>{f.count} hits</div>
                                <div style={{ flexShrink: 0, fontSize: '10px', color: 'var(--gi-text-muted)', fontFamily: 'monospace', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {f.examples.slice(0, 2).join(', ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Score trend over time */}
        {HISTORY.length > 1 && (
          <div style={{ background: 'var(--gi-bg-surface)', border: '1px solid var(--gi-border-subtle)', borderRadius: '6px', padding: '20px', marginBottom: '32px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gi-text-primary)', marginBottom: '4px' }}>Average Score Trend</div>
            <div style={{ fontSize: '11px', color: 'var(--gi-text-muted)', marginBottom: '16px' }}>Rolling portfolio-wide compliance over the last {HISTORY.length} detector runs</div>
            <div style={{ position: 'relative', height: '80px' }}>
              <svg width="100%" height="80" viewBox={`0 0 ${HISTORY.length * 40} 80`} preserveAspectRatio="none">
                {/* Grid lines at 60 and 80 */}
                {[60, 80].map((val) => {
                  const y = 80 - (val / 100) * 80;
                  return (
                    <line key={val} x1="0" y1={y} x2={HISTORY.length * 40} y2={y} stroke="var(--gi-border-subtle)" strokeWidth="1" strokeDasharray="4 4" />
                  );
                })}
                <polyline
                  points={HISTORY.map((h, i) => `${i * 40 + 20},${80 - (h.averageScore / 100) * 80}`).join(' ')}
                  fill="none"
                  stroke="var(--gi-accent-blue)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {HISTORY.map((h, i) => (
                  <circle key={h.ts} cx={i * 40 + 20} cy={80 - (h.averageScore / 100) * 80} r="3" fill="var(--gi-accent-blue)" />
                ))}
              </svg>
              <div style={{ position: 'absolute', right: 0, top: 80 - (80 / 100) * 80 - 8, fontSize: '10px', color: 'var(--gi-text-muted)' }}>threshold 80</div>
            </div>
          </div>
        )}

        {/* About */}
        <div style={{ background: 'var(--gi-bg-overlay)', border: '1px solid var(--gi-border-subtle)', borderRadius: '6px', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gi-text-primary)', marginBottom: '8px' }}>About this dashboard</div>
          <p style={{ fontSize: '12px', color: 'var(--gi-text-secondary)', margin: 0, lineHeight: 1.6 }}>
            Data is generated by <code style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--gi-accent-blue)' }}>scripts/check-design-tokens-drift.ts</code> and committed to{' '}
            <code style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--gi-accent-blue)' }}>audit/design-token-history.jsonl</code> on every CI run.
            Run <code style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--gi-accent-blue)' }}>pnpm tokens:drift</code> locally to regenerate.
            The CI gate uses <code style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--gi-accent-blue)' }}>pnpm tokens:drift:check</code> with a threshold of{' '}
            {TYPED_REPORT.threshold}/100 — PRs that regress the average score below this fail the build.
          </p>
        </div>

      </div>
      <SiteFooter />
    </div>
  );
}
