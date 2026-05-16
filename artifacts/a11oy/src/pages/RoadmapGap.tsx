import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle } from '../components/ui';

const GOLD = '#c9b787';
const MUTED = '#888';
const TEXT = 'var(--color-a11oy-text)';
const SUB = 'var(--color-a11oy-text-sub)';
const GHOST = 'var(--color-a11oy-text-ghost)';
const BORDER = 'var(--color-a11oy-border)';
const MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

const SEV_BORDER: Record<Severity, string> = {
  critical: '#f5f5f5',
  high:     '#c9b787',
  medium:   '#bfa66a',
  low:      '#8a8a8a',
  info:     '#5e5e5e',
};

function severityOf(s?: string): Severity {
  const v = (s ?? '').toLowerCase();
  if (v.startsWith('crit')) return 'critical';
  if (v.startsWith('high')) return 'high';
  if (v.startsWith('med'))  return 'medium';
  if (v.startsWith('low'))  return 'low';
  return 'info';
}

type Tone = 'gold' | 'muted' | 'warn' | 'neutral' | 'ok';
function Chip({ children, tone = 'neutral', title }: { children: React.ReactNode; tone?: Tone; title?: string }) {
  const styles: Record<Tone, { bg: string; color: string; border: string }> = {
    neutral: { bg: 'rgba(245,245,245,0.04)', color: '#ededed', border: 'rgba(245,245,245,0.12)' },
    gold:    { bg: 'rgba(201,183,135,0.12)', color: GOLD,      border: 'rgba(201,183,135,0.30)' },
    muted:   { bg: 'rgba(136,136,136,0.10)', color: MUTED,     border: 'rgba(136,136,136,0.25)' },
    warn:    { bg: 'rgba(245,170,90,0.10)',  color: '#e0a868', border: 'rgba(245,170,90,0.28)' },
    ok:      { bg: 'rgba(120,200,140,0.08)', color: '#9ec7a4', border: 'rgba(120,200,140,0.22)' },
  };
  const s = styles[tone];
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, fontFamily: MONO }}
    >
      {children}
    </span>
  );
}

interface Violation { id?: string; what?: string; where?: string; severity?: string; remediation?: string }
interface PushItem { id: string; artifact?: string; targetVersion?: string; sha256?: string; blocker?: string; recommendedAction?: string; owner?: string }
interface HygieneGap { repo: string; evidence?: string; issues?: string[]; recommendedActions?: string[] }
interface ThesisPubGap { id: string; missing?: string; blocking?: string }
interface AgiV5 { vspOtelStatus?: string; forecastGaugeStatus?: string; missingComponents?: string[] }
interface OrgDelta { payload?: Record<string, any>; live?: Record<string, any> }
interface GapPayload {
  generatedAt?: string;
  doctrineCompliance?: {
    lambdaFloorMet?: boolean;
    moralGroundingMet?: boolean;
    measurabilityHonestyMet?: boolean;
    byteIdenticalReplaysObserved?: number;
    byteIdenticalReplaysRequired?: number;
    ingestionPolicyEnforced?: boolean;
    licenseAllowlistEnforced?: boolean;
    violations?: Violation[];
  };
  pushQueue?: { ready?: PushItem[]; blocked?: PushItem[] };
  hygieneGaps?: HygieneGap[];
  orgSummaryDelta?: OrgDelta;
  thesisPublicationGaps?: ThesisPubGap[];
  agiV5Gaps?: AgiV5;
  monorepoOrphans?: Array<{ package: string; reason: string }>;
  summary?: { criticalCount?: number; highCount?: number; mediumCount?: number; lowCount?: number; notes?: string };
}
interface BacklogItem {
  id: string; title?: string; rationale?: string; category?: string; severity?: string;
  estimateHours?: number; owner?: string;
  preconditions?: string[]; acceptanceCriteria?: string[]; filesLikelyTouched?: string[];
}
interface BacklogTopTen { topTen: string[]; items: BacklogItem[] }

export function RoadmapGap() {
  const [gap, setGap] = useState<GapPayload | null>(null);
  const [bl, setBl] = useState<BacklogTopTen | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch('/api/szl/atlas/gap-report').then(r => { if (!r.ok) throw new Error(`gap-report HTTP ${r.status}`); return r.json(); }),
      fetch('/api/szl/atlas/backlog/top-ten').then(r => { if (!r.ok) throw new Error(`backlog HTTP ${r.status}`); return r.json(); }),
    ])
      .then(([g, b]) => { if (alive) { setGap(g as GapPayload); setBl(b as BacklogTopTen); } })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : String(e)); });
    return () => { alive = false; };
  }, []);

  return (
    <Layout>
      <PageHeader
        label="ATLAS · ROADMAP"
        title="Roadmap & Gap Report"
        subtitle="Doctrine compliance, push queue, hygiene gaps, AGI V5 deltas, and the prioritised backlog."
      />

      {error && (
        <Card>
          <div className="text-xs" style={{ color: '#e0a868', fontFamily: MONO }}>Could not load gap report — {error}</div>
        </Card>
      )}
      {!error && (!gap || !bl) && (
        <Card>
          <div className="text-xs" style={{ color: GHOST as string, fontFamily: MONO }}>Loading roadmap…</div>
        </Card>
      )}

      {gap && bl && (
        <>
          {/* Severity strip */}
          <div className="mb-6 flex flex-wrap gap-2">
            <Chip tone={(gap.summary?.criticalCount ?? 0) > 0 ? 'warn' : 'ok'}>critical · {gap.summary?.criticalCount ?? 0}</Chip>
            <Chip tone={(gap.summary?.highCount ?? 0) > 0 ? 'warn' : 'muted'}>high · {gap.summary?.highCount ?? 0}</Chip>
            <Chip tone="muted">medium · {gap.summary?.mediumCount ?? 0}</Chip>
            <Chip tone="muted">low · {gap.summary?.lowCount ?? 0}</Chip>
          </div>
          {gap.summary?.notes && (
            <Card>
              <div className="text-xs" style={{ color: SUB }}>{gap.summary.notes}</div>
            </Card>
          )}

          {/* Doctrine compliance */}
          <SectionTitle className="mt-8">Doctrine compliance</SectionTitle>
          <div className="mb-3 flex flex-wrap gap-2">
            <Chip tone={gap.doctrineCompliance?.lambdaFloorMet ? 'ok' : 'warn'}>Λ floor {gap.doctrineCompliance?.lambdaFloorMet ? 'met' : 'unmet'}</Chip>
            <Chip tone={gap.doctrineCompliance?.moralGroundingMet ? 'ok' : 'warn'}>moral grounding {gap.doctrineCompliance?.moralGroundingMet ? 'met' : 'unmet'}</Chip>
            <Chip tone={gap.doctrineCompliance?.measurabilityHonestyMet ? 'ok' : 'warn'}>measurability {gap.doctrineCompliance?.measurabilityHonestyMet ? 'met' : 'unmet'}</Chip>
            <Chip tone="muted">replays {gap.doctrineCompliance?.byteIdenticalReplaysObserved}/{gap.doctrineCompliance?.byteIdenticalReplaysRequired}</Chip>
            <Chip tone={gap.doctrineCompliance?.ingestionPolicyEnforced ? 'ok' : 'warn'}>ingestion {gap.doctrineCompliance?.ingestionPolicyEnforced ? 'enforced' : 'gap'}</Chip>
            <Chip tone={gap.doctrineCompliance?.licenseAllowlistEnforced ? 'ok' : 'warn'}>license allowlist {gap.doctrineCompliance?.licenseAllowlistEnforced ? 'enforced' : 'gap'}</Chip>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {(gap.doctrineCompliance?.violations ?? []).map(v => {
              const sev = severityOf(v.severity);
              return (
                <Card key={v.id} style={{ borderLeft: `3px solid ${SEV_BORDER[sev]}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs" style={{ color: GOLD, fontFamily: MONO }}>{v.id}</span>
                    <Chip tone={sev === 'critical' || sev === 'high' ? 'warn' : 'muted'}>{sev}</Chip>
                  </div>
                  <div className="text-xs" style={{ color: TEXT }}>{v.what ?? '—'}</div>
                  {v.where && (
                    <div className="text-xs mt-1" style={{ color: GHOST as string, fontFamily: MONO, wordBreak: 'break-all' }}>{v.where}</div>
                  )}
                  {v.remediation && (
                    <div className="text-xs mt-2" style={{ color: SUB }}>{v.remediation}</div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Push queue */}
          <SectionTitle>Push queue</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <div>
              <div className="text-xs mb-2" style={{ color: GOLD, fontFamily: MONO }}>READY</div>
              <div className="space-y-2">
                {(gap.pushQueue?.ready ?? []).map(p => (
                  <Card key={p.id}>
                    <div className="text-xs mb-1" style={{ color: TEXT, fontFamily: MONO }}>{p.id}</div>
                    {p.artifact && <div className="text-xs" style={{ color: SUB, wordBreak: 'break-all' }}>{p.artifact}</div>}
                    {p.recommendedAction && <div className="text-xs mt-2" style={{ color: SUB }}>{p.recommendedAction}</div>}
                    {(p.targetVersion || p.owner) && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {p.targetVersion && <Chip tone="gold">{p.targetVersion}</Chip>}
                        {p.owner && <Chip tone="muted">owner · {p.owner}</Chip>}
                      </div>
                    )}
                  </Card>
                ))}
                {(gap.pushQueue?.ready ?? []).length === 0 && <div className="text-xs" style={{ color: MUTED }}>none</div>}
              </div>
            </div>
            <div>
              <div className="text-xs mb-2" style={{ color: GOLD, fontFamily: MONO }}>BLOCKED</div>
              <div className="space-y-2">
                {(gap.pushQueue?.blocked ?? []).map(p => (
                  <Card key={p.id}>
                    <div className="text-xs mb-1" style={{ color: TEXT, fontFamily: MONO }}>{p.id}</div>
                    {p.artifact && <div className="text-xs" style={{ color: SUB, wordBreak: 'break-all' }}>{p.artifact}</div>}
                    {p.blocker && (
                      <div className="text-xs mt-2" style={{ color: '#e0a868' }}>blocker · {p.blocker}</div>
                    )}
                    {p.recommendedAction && <div className="text-xs mt-2" style={{ color: SUB }}>{p.recommendedAction}</div>}
                    {(p.targetVersion || p.owner) && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {p.targetVersion && <Chip tone="gold">{p.targetVersion}</Chip>}
                        {p.owner && <Chip tone="muted">owner · {p.owner}</Chip>}
                      </div>
                    )}
                  </Card>
                ))}
                {(gap.pushQueue?.blocked ?? []).length === 0 && <div className="text-xs" style={{ color: MUTED }}>none</div>}
              </div>
            </div>
          </div>

          {/* Hygiene gaps */}
          <SectionTitle>Hygiene gaps ({(gap.hygieneGaps ?? []).length})</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {(gap.hygieneGaps ?? []).map(h => (
              <Card key={h.repo}>
                <div className="text-sm mb-1" style={{ color: GOLD, fontFamily: MONO }}>{h.repo}</div>
                {h.evidence && <div className="text-xs mb-2" style={{ color: SUB }}>{h.evidence}</div>}
                {h.issues && h.issues.length > 0 && (
                  <ul className="text-xs space-y-1 mb-2 list-disc pl-5" style={{ color: TEXT }}>
                    {h.issues.map((i, idx) => <li key={idx}>{i}</li>)}
                  </ul>
                )}
                {h.recommendedActions && h.recommendedActions.length > 0 && (
                  <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <div className="text-xs mb-1" style={{ color: GHOST as string, fontFamily: MONO }}>recommended actions</div>
                    <ul className="text-xs space-y-1 list-disc pl-5" style={{ color: SUB }}>
                      {h.recommendedActions.map((a, idx) => <li key={idx}>{a}</li>)}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Thesis pub gaps */}
          <SectionTitle>Thesis publication gaps</SectionTitle>
          <Card className="mb-8">
            <div className="space-y-3 text-xs">
              {(gap.thesisPublicationGaps ?? []).map(p => (
                <div key={p.id} className="flex items-start gap-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ color: GOLD, fontFamily: MONO, width: 96, flexShrink: 0 }}>{p.id}</span>
                  <div className="flex-1">
                    <div style={{ color: TEXT }}>{p.missing ?? '—'}</div>
                    {p.blocking && <div className="mt-1" style={{ color: SUB }}>blocking · {p.blocking}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AGI V5 panel */}
          <SectionTitle>AGI V5 gaps</SectionTitle>
          <Card className="mb-8">
            <div className="flex flex-wrap gap-2 mb-3">
              <Chip tone={gap.agiV5Gaps?.vspOtelStatus === 'missing' ? 'warn' : 'ok'}>
                VSP OTel · {gap.agiV5Gaps?.vspOtelStatus ?? '—'}
              </Chip>
              <Chip tone={gap.agiV5Gaps?.forecastGaugeStatus === 'missing' ? 'warn' : 'ok'}>
                Forecast gauge · {gap.agiV5Gaps?.forecastGaugeStatus ?? '—'}
              </Chip>
            </div>
            {gap.agiV5Gaps?.missingComponents && gap.agiV5Gaps.missingComponents.length > 0 && (
              <>
                <div className="text-xs mb-1" style={{ color: GHOST as string, fontFamily: MONO }}>missing components</div>
                <ul className="text-xs space-y-1 list-disc pl-5" style={{ color: SUB }}>
                  {gap.agiV5Gaps.missingComponents.map((c, i) => <li key={i} style={{ fontFamily: MONO }}>{c}</li>)}
                </ul>
              </>
            )}
          </Card>

          {/* OrgSummaryDelta */}
          <SectionTitle>Org summary delta (payload vs live)</SectionTitle>
          <Card className="mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}`, color: GHOST as string, fontFamily: MONO }}>
                    <th className="text-left py-2 pr-3">field</th>
                    <th className="text-left py-2 pr-3">payload</th>
                    <th className="text-left py-2 pr-3">live</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const p = gap.orgSummaryDelta?.payload ?? {};
                    const l = gap.orgSummaryDelta?.live ?? {};
                    const keys = Array.from(new Set([...Object.keys(p), ...Object.keys(l)])).sort();
                    return keys.map(k => {
                      const pv = p[k];
                      const lv = l[k];
                      const drift = JSON.stringify(pv) !== JSON.stringify(lv);
                      return (
                        <tr key={k} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td className="py-2 pr-3" style={{ color: TEXT, fontFamily: MONO }}>{k}</td>
                          <td className="py-2 pr-3" style={{ color: drift ? '#e0a868' : SUB, fontFamily: MONO, wordBreak: 'break-all' }}>
                            {pv == null ? '—' : typeof pv === 'object' ? JSON.stringify(pv) : String(pv)}
                          </td>
                          <td className="py-2 pr-3" style={{ color: drift ? '#e0a868' : SUB, fontFamily: MONO, wordBreak: 'break-all' }}>
                            {lv == null ? '—' : typeof lv === 'object' ? JSON.stringify(lv) : String(lv)}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Backlog top-ten */}
          <SectionTitle>Backlog · top ten ({bl.items.length})</SectionTitle>
          <div className="space-y-2 mb-6">
            {bl.items.map((it, idx) => {
              const sev = severityOf(it.severity);
              return (
                <Card key={it.id} style={{ borderLeft: `3px solid ${SEV_BORDER[sev]}` }}>
                  <div className="flex items-start gap-3 flex-wrap">
                    <span className="text-xs" style={{ color: MUTED, fontFamily: MONO, width: 24 }}>#{idx + 1}</span>
                    <Chip tone="gold">{it.id}</Chip>
                    <span className="text-xs flex-1" style={{ color: TEXT }}>{it.title ?? '—'}</span>
                    <Chip tone={sev === 'critical' || sev === 'high' ? 'warn' : 'muted'}>{sev}</Chip>
                    <Chip tone="muted">{it.estimateHours ?? '—'}h</Chip>
                    {it.category && <Chip tone="muted">{it.category}</Chip>}
                    {it.owner && <Chip tone="neutral">{it.owner}</Chip>}
                  </div>
                  {it.rationale && (
                    <div className="text-xs mt-2" style={{ color: SUB }}>{it.rationale}</div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="mt-6 text-xs" style={{ color: GHOST as string, fontFamily: MONO }}>
            generated · {gap.generatedAt ?? '—'}
          </div>
        </>
      )}
    </Layout>
  );
}
