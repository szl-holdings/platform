import { useMemo } from 'react';
import report from '../data/design-tokens-drift.generated.json';
import historyJson from '../data/design-tokens-drift-history.generated.json';

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

const TYPED_REPORT = report as DriftReport;

interface HistoryEntry {
  ts: string;
  averageScore: number;
  perArtifact: Record<string, number>;
}
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

export default function TokensGovernance() {
  const sorted = useMemo(
    () => [...TYPED_REPORT.artifacts].sort((a, b) => b.score - a.score),
    [],
  );

  const compliant = sorted.filter((a) => a.score >= 80).length;
  const watch = sorted.filter((a) => a.score >= 60 && a.score < 80).length;
  const atRisk = sorted.filter((a) => a.score >= 40 && a.score < 60).length;
  const nonCompliant = sorted.filter((a) => a.score < 40).length;

  return (
    <div style={{ padding: '24px 32px', color: 'var(--gi-text-primary)' }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.12em',
            color: 'var(--gi-text-muted)',
            textTransform: 'uppercase',
          }}
        >
          NEXUS · Governance
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '4px 0 6px' }}>
          TOKENS-AS-CODE COMPLIANCE
        </h1>
        <div style={{ fontSize: 13, color: 'var(--gi-text-secondary)' }}>
          Per-artifact drift score against the{' '}
          <code style={{ color: 'var(--gi-text-link)' }}>@workspace/tokens</code> contract.
          Score = 100 − violations per 1,000 lines (raw hex, rgb()/hsl(), non-aliased token
          imports). Generated{' '}
          {new Date(TYPED_REPORT.generatedAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
          .
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <SummaryCard label="Average score" value={`${TYPED_REPORT.averageScore}/100`} accent="var(--gi-accent-blue)" />
        <SummaryCard label="Compliant ≥ 80" value={String(compliant)} accent="var(--gi-state-allowed)" />
        <SummaryCard label="Watch 60–79" value={String(watch)} accent="var(--gi-accent-teal)" />
        <SummaryCard label="At-risk 40–59" value={String(atRisk)} accent="var(--gi-state-requires-approval)" />
        <SummaryCard label="Non-compliant < 40" value={String(nonCompliant)} accent="var(--gi-state-blocked)" />
      </div>

      <TrendPanel history={HISTORY} />

      <div
        style={{
          border: '1px solid var(--gi-border-default)',
          borderRadius: 6,
          background: 'var(--gi-bg-surface)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gi-bg-overlay)' }}>
              <Th>Artifact</Th>
              <Th>Kind</Th>
              <Th align="right">Score</Th>
              <Th align="right">Violations</Th>
              <Th align="right">Lines</Th>
              <Th align="right">Files</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <tr
                key={a.id}
                style={{ borderTop: '1px solid var(--gi-border-subtle)' }}
              >
                <Td>
                  <div style={{ fontWeight: 500 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>{a.dir}</div>
                </Td>
                <Td>
                  <code style={{ color: 'var(--gi-text-secondary)', fontSize: 11 }}>
                    {a.kind}
                  </code>
                </Td>
                <Td align="right">
                  <span style={{ color: scoreColor(a.score), fontWeight: 600 }}>{a.score}</span>
                </Td>
                <Td align="right">{a.violations.toLocaleString()}</Td>
                <Td align="right">{a.lines.toLocaleString()}</Td>
                <Td align="right">{a.files.toLocaleString()}</Td>
                <Td>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      color: scoreColor(a.score),
                      border: `1px solid ${scoreColor(a.score)}`,
                      padding: '2px 6px',
                      borderRadius: 3,
                    }}
                  >
                    {scoreLabel(a.score)}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>
          TOP OFFENDING FILES
        </h2>
        <div style={{ fontSize: 12, color: 'var(--gi-text-secondary)', marginBottom: 12 }}>
          Files with the highest concentration of off-token color literals. Prioritize these
          for migration to <code style={{ color: 'var(--gi-text-link)' }}>@workspace/tokens</code>.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {sorted
            .filter((a) => a.top.length > 0)
            .slice(0, 6)
            .map((a) => (
              <div
                key={a.id}
                style={{
                  border: '1px solid var(--gi-border-default)',
                  borderRadius: 6,
                  background: 'var(--gi-bg-surface)',
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    color: 'var(--gi-text-muted)',
                    marginBottom: 8,
                  }}
                >
                  {a.title.toUpperCase()}
                </div>
                {a.top.slice(0, 5).map((f) => (
                  <div
                    key={f.file}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '4px 0',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: 'var(--gi-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.file.replace(`${a.dir}/`, '')}
                    </span>
                    <span style={{ color: scoreColor(100 - Math.min(100, f.count)), flexShrink: 0 }}>
                      {f.count}
                    </span>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: '12px 16px',
          border: '1px solid var(--gi-border-subtle)',
          borderRadius: 6,
          background: 'var(--gi-bg-overlay)',
          fontSize: 12,
          color: 'var(--gi-text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'var(--gi-text-primary)' }}>HOW TO REGENERATE:</strong>{' '}
        run <code style={{ color: 'var(--gi-text-link)' }}>tsx scripts/check-design-tokens-drift.ts</code>{' '}
        from the repo root. Use <code style={{ color: 'var(--gi-text-link)' }}>--check --threshold=70</code>{' '}
        in CI to fail on regression. Report sources are{' '}
        <code style={{ color: 'var(--gi-text-link)' }}>scripts/design-tokens-drift.report.json</code>{' '}
        and the published copy here in the NEXUS bundle.
      </div>
    </div>
  );
}

function TrendPanel({ history }: { history: HistoryEntry[] }) {
  if (history.length < 2) {
    return (
      <div
        style={{
          marginBottom: 24,
          padding: '12px 16px',
          border: '1px solid var(--gi-border-subtle)',
          borderRadius: 6,
          background: 'var(--gi-bg-overlay)',
          fontSize: 12,
          color: 'var(--gi-text-secondary)',
        }}
      >
        Trend baseline established ({history.length} snapshot
        {history.length === 1 ? '' : 's'}). Re-run the drift detector to start
        accumulating compliance history.
      </div>
    );
  }
  const W = 720;
  const H = 80;
  const PAD = 8;
  const xs = history.map((_, i) => PAD + (i * (W - PAD * 2)) / (history.length - 1));
  const ys = history.map((h) => H - PAD - (h.averageScore * (H - PAD * 2)) / 100);
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const delta = last.averageScore - prev.averageScore;
  const deltaColor = delta > 0
    ? 'var(--gi-state-allowed)'
    : delta < 0
    ? 'var(--gi-state-blocked)'
    : 'var(--gi-text-muted)';

  return (
    <div
      style={{
        marginBottom: 24,
        padding: '14px 16px',
        border: '1px solid var(--gi-border-default)',
        borderRadius: 6,
        background: 'var(--gi-bg-surface)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--gi-text-muted)', textTransform: 'uppercase' }}>
          Average score over time
        </div>
        <div style={{ fontSize: 12, color: 'var(--gi-text-secondary)' }}>
          {history.length} snapshot{history.length === 1 ? '' : 's'} ·{' '}
          <span style={{ color: deltaColor, fontWeight: 600 }}>
            {delta > 0 ? '+' : ''}
            {delta} pt
          </span>{' '}
          vs previous
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <path d={path} fill="none" stroke="var(--gi-accent-blue)" strokeWidth={1.5} />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r={2} fill="var(--gi-accent-blue)" />
        ))}
      </svg>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--gi-border-default)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 6,
        padding: '12px 14px',
        background: 'var(--gi-bg-surface)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          color: 'var(--gi-text-muted)',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--gi-text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '10px 14px',
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--gi-text-muted)',
        fontWeight: 500,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td style={{ textAlign: align, padding: '10px 14px', verticalAlign: 'top' }}>{children}</td>
  );
}
