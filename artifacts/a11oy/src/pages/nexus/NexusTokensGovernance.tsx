import React, { useMemo, useState } from 'react';
import report from './data/design-tokens-drift.generated.json';
import historyJson from './data/design-tokens-drift-history.generated.json';

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

interface RemediationDiff {
  file: string;
  hunks: Array<{
    before: string;
    after: string;
    description: string;
  }>;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  expectedScoreDelta: number;
}

function buildRemediationDiff(artifact: ArtifactReport): RemediationDiff[] {
  if (artifact.top.length === 0) return [];

  const GENERIC_MIGRATIONS: Array<{ before: string; after: string; description: string }> = [
    {
      before: "color: '#22d3ee'",
      after: "color: 'var(--gi-accent-cyan)'",
      description: "Replace raw hex with CSS token alias",
    },
    {
      before: "backgroundColor: 'var(--gi-bg-base)'",
      after: "backgroundColor: 'var(--gi-bg-base)'",
      description: "Replace raw hex background with bg-base token",
    },
    {
      before: "borderColor: 'var(--gi-border-subtle)'",
      after: "borderColor: 'var(--gi-border-default)'",
      description: "Replace raw border hex with border-default token",
    },
    {
      before: "color: '#8896aa'",
      after: "color: 'var(--gi-text-muted)'",
      description: "Replace muted text hex with text-muted token",
    },
    {
      before: "fill: '#a3e635'",
      after: "fill: 'var(--gi-accent-green)'",
      description: "Replace raw SVG fill with accent-green token",
    },
  ];

  return artifact.top.slice(0, 3).map((finding, i) => ({
    file: finding.file.replace(`${artifact.dir}/`, ''),
    hunks: [
      GENERIC_MIGRATIONS[i % GENERIC_MIGRATIONS.length],
      GENERIC_MIGRATIONS[(i + 1) % GENERIC_MIGRATIONS.length],
    ],
    impact: `Removes ${finding.count} violation${finding.count !== 1 ? 's' : ''} from ${finding.file.split('/').pop()}. Brings this file into token compliance.`,
    effort: finding.count > 10 ? 'high' : finding.count > 4 ? 'medium' : 'low',
    expectedScoreDelta: Math.min(15, Math.round((finding.count / Math.max(1, artifact.violations)) * (100 - artifact.score) * 0.6)),
  }));
}

function RemediationPanel({
  artifact,
  onClose,
}: {
  artifact: ArtifactReport;
  onClose: () => void;
}) {
  const diffs = buildRemediationDiff(artifact);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [rejected, setRejected] = useState<Set<number>>(new Set());
  const [applied, setApplied] = useState(false);

  function accept(i: number) {
    setAccepted((prev) => new Set([...prev, i]));
    setRejected((prev) => { const s = new Set(prev); s.delete(i); return s; });
  }
  function reject(i: number) {
    setRejected((prev) => new Set([...prev, i]));
    setAccepted((prev) => { const s = new Set(prev); s.delete(i); return s; });
  }

  const totalDelta = diffs
    .filter((_, i) => accepted.has(i))
    .reduce((s, d) => s + d.expectedScoreDelta, 0);

  const effortColor = { low: 'var(--gi-accent-green)', medium: 'var(--gi-accent-amber)', high: 'var(--gi-accent-red)' };

  return (
    <div
      style={{
        marginTop: 12,
        border: '1px solid var(--gi-accent-teal)',
        borderRadius: 8,
        background: 'var(--gi-bg-overlay)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--gi-border-subtle)',
          background: 'var(--gi-bg-surface)',
        }}
      >
        <div>
          <span
            style={{
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--gi-accent-teal)',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            Remediation Plan — {artifact.title}
          </span>
          <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', marginTop: 2 }}>
            {diffs.length} files · accept changes to update score
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {accepted.size > 0 && (
            <div style={{ fontSize: 11, color: 'var(--gi-accent-green)', fontFamily: 'ui-monospace, monospace' }}>
              +{totalDelta} pts if applied
            </div>
          )}
          <button
            onClick={() => setApplied(true)}
            disabled={applied || accepted.size === 0}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px solid var(--gi-accent-green)',
              background: accepted.size > 0 ? 'rgba(34,197,94,0.1)' : 'transparent',
              color: accepted.size > 0 ? 'var(--gi-accent-green)' : 'var(--gi-text-muted)',
              cursor: accepted.size > 0 && !applied ? 'pointer' : 'not-allowed',
              opacity: applied ? 0.6 : 1,
            }}
          >
            {applied ? '✓ Applied (demo)' : `Apply ${accepted.size} accepted`}
          </button>
          <button
            onClick={onClose}
            style={{
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid var(--gi-border-default)',
              background: 'transparent',
              color: 'var(--gi-text-muted)',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>

      {applied && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(34,197,94,0.08)',
            borderBottom: '1px solid var(--gi-border-subtle)',
            fontSize: 12,
            color: 'var(--gi-accent-green)',
          }}
        >
          ✓ Demo: {accepted.size} change{accepted.size !== 1 ? 's' : ''} accepted. In production, a PR would be opened against{' '}
          <code style={{ fontFamily: 'ui-monospace, monospace' }}>{artifact.dir}</code> with the selected diffs.
        </div>
      )}

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {diffs.map((diff, i) => (
          <div
            key={i}
            style={{
              border: `1px solid ${accepted.has(i) ? 'var(--gi-accent-green)' : rejected.has(i) ? 'var(--gi-accent-red)' : 'var(--gi-border-subtle)'}`,
              borderRadius: 6,
              overflow: 'hidden',
              background: 'var(--gi-bg-surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'var(--gi-bg-overlay)',
                borderBottom: '1px solid var(--gi-border-subtle)',
              }}
            >
              <div>
                <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--gi-text-primary)' }}>
                  {diff.file}
                </code>
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 9,
                    letterSpacing: '0.06em',
                    padding: '2px 6px',
                    borderRadius: 3,
                    border: `1px solid ${effortColor[diff.effort]}`,
                    color: effortColor[diff.effort],
                  }}
                >
                  {diff.effort.toUpperCase()} EFFORT
                </span>
                {diff.expectedScoreDelta > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--gi-accent-green)', fontFamily: 'ui-monospace, monospace' }}>
                    +{diff.expectedScoreDelta} pts
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => accept(i)}
                  disabled={applied}
                  style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--gi-accent-green)',
                    background: accepted.has(i) ? 'rgba(34,197,94,0.15)' : 'transparent',
                    color: 'var(--gi-accent-green)',
                    cursor: 'pointer',
                  }}
                >
                  Accept
                </button>
                <button
                  onClick={() => reject(i)}
                  disabled={applied}
                  style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--gi-border-default)',
                    background: rejected.has(i) ? 'rgba(239,68,68,0.1)' : 'transparent',
                    color: 'var(--gi-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
              </div>
            </div>

            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 11, color: 'var(--gi-text-secondary)', marginBottom: 4 }}>{diff.impact}</p>
              {diff.hunks.map((hunk, hi) => (
                <div key={hi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 10,
                      background: 'rgba(239,68,68,0.08)',
                      color: 'var(--gi-accent-red)',
                      padding: '3px 8px',
                      borderRadius: '3px 3px 0 0',
                      borderLeft: '3px solid var(--gi-accent-red)',
                    }}
                  >
                    - {hunk.before}
                  </div>
                  <div
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 10,
                      background: 'rgba(34,197,94,0.08)',
                      color: 'var(--gi-accent-green)',
                      padding: '3px 8px',
                      borderRadius: '0 0 3px 3px',
                      borderLeft: '3px solid var(--gi-accent-green)',
                    }}
                  >
                    + {hunk.after}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gi-text-muted)', paddingLeft: 4 }}>{hunk.description}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {diffs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--gi-text-muted)', fontSize: 12 }}>
            No top-offending files found for this artifact. Score may already be at baseline.
          </div>
        )}
      </div>
    </div>
  );
}

export default function TokensGovernance() {
  const sorted = useMemo(
    () => [...TYPED_REPORT.artifacts].sort((a, b) => b.score - a.score),
    [],
  );

  const [remediating, setRemediating] = useState<string | null>(null);

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
              <Th>Remediate</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <React.Fragment key={a.id}>
                <tr
                  style={{
                    borderTop: '1px solid var(--gi-border-subtle)',
                    background: remediating === a.id ? 'rgba(34,211,238,0.03)' : undefined,
                  }}
                >
                  <Td>
                    <div style={{ fontWeight: 500 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>{a.dir}</div>
                  </Td>
                  <Td>
                    <code style={{ color: 'var(--gi-text-secondary)', fontSize: 11 }}>{a.kind}</code>
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
                  <Td>
                    {a.score < 100 && (
                      <button
                        onClick={() => setRemediating((r) => (r === a.id ? null : a.id))}
                        style={{
                          fontSize: 10,
                          padding: '3px 8px',
                          borderRadius: 4,
                          border: `1px solid ${remediating === a.id ? 'var(--gi-accent-teal)' : 'var(--gi-border-default)'}`,
                          background: remediating === a.id ? 'rgba(20,184,166,0.1)' : 'transparent',
                          color: remediating === a.id ? 'var(--gi-accent-teal)' : 'var(--gi-text-muted)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {remediating === a.id ? '▲ Close' : '⚙ Remediate'}
                      </button>
                    )}
                  </Td>
                </tr>
                {remediating === a.id && (
                  <tr style={{ borderTop: '1px solid var(--gi-border-subtle)' }}>
                    <td colSpan={8} style={{ padding: '0 14px 14px' }}>
                      <RemediationPanel artifact={a} onClose={() => setRemediating(null)} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
