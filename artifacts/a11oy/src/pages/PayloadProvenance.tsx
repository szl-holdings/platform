import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, StatusBadge } from '../components/ui';
import {
  DOCTRINE_V6,
  DOI_LEDGER,
  REPOS,
  ORG_SUMMARY,
  PUSH_QUEUE_READY,
  PUSH_QUEUE_BLOCKED,
  LAMBDA_AXES,
  A11OY_AXIOMS,
  A11OY_THEOREMS,
  A11OY_DERIVATIONS,
  A11OY_CONSTANTS,
  FORECAST_GAUGES,
  type NamedItem,
} from '../data/payloadProvenance';

const GOLD = '#c9b787';
const MUTED = '#888';
const TEXT = 'var(--color-a11oy-text)';
const SUB = 'var(--color-a11oy-text-sub)';
const GHOST = 'var(--color-a11oy-text-ghost)';
const BORDER = 'var(--color-a11oy-border)';

function Row({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b" style={{ borderColor: BORDER }}>
      <span className="text-xs w-44 flex-shrink-0" style={{ color: GHOST }}>{label}</span>
      <span
        className={`text-xs flex-1 break-all ${mono ? 'font-mono' : ''}`}
        style={{ color: TEXT, fontFamily: mono ? 'JetBrains Mono, ui-monospace, Menlo, monospace' : undefined }}
      >
        {value}
      </span>
    </div>
  );
}

function Chip({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'gold' | 'muted' | 'ready' | 'blocked' }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    neutral: { bg: 'rgba(245,245,245,0.04)', color: TEXT as string, border: 'rgba(245,245,245,0.12)' },
    gold:    { bg: 'rgba(201,183,135,0.12)', color: GOLD,           border: 'rgba(201,183,135,0.30)' },
    muted:   { bg: 'rgba(136,136,136,0.10)', color: MUTED,          border: 'rgba(136,136,136,0.25)' },
    ready:   { bg: 'rgba(201,183,135,0.10)', color: GOLD,           border: 'rgba(201,183,135,0.28)' },
    blocked: { bg: 'rgba(201,183,135,0.04)', color: '#bfa66a',      border: 'rgba(201,183,135,0.18)' },
  };
  const s = styles[tone];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {children}
    </span>
  );
}

function CopyHint({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      });
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="ml-2 text-xs font-mono"
      style={{ color: copied ? GOLD : GHOST as string, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      {copied ? 'copied' : 'copy'}
    </button>
  );
}

function ArtifactList({ items }: { items: NamedItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map(it => (
        <div
          key={it.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded"
          style={{ backgroundColor: 'rgba(245,245,245,0.02)', border: `1px solid ${BORDER}` }}
        >
          <span className="text-xs font-mono" style={{ color: GOLD }}>{it.id}</span>
          <span className="text-xs truncate" style={{ color: SUB }}>{it.name}</span>
        </div>
      ))}
    </div>
  );
}

type ArtifactTab = 'axioms' | 'theorems' | 'derivations' | 'constants';

export function PayloadProvenance() {
  const [tab, setTab] = useState<ArtifactTab>('axioms');

  const tabs: Array<{ key: ArtifactTab; label: string; count: number }> = [
    { key: 'axioms',      label: 'Axioms (A1–A14)',     count: A11OY_AXIOMS.length },
    { key: 'theorems',    label: 'Theorems',            count: A11OY_THEOREMS.length },
    { key: 'derivations', label: 'Derivations (T1–T10)', count: A11OY_DERIVATIONS.length },
    { key: 'constants',   label: 'Constants (K01–K13)', count: A11OY_CONSTANTS.length },
  ];
  const tabItems: Record<ArtifactTab, NamedItem[]> = {
    axioms: A11OY_AXIOMS,
    theorems: A11OY_THEOREMS,
    derivations: A11OY_DERIVATIONS,
    constants: A11OY_CONSTANTS,
  };

  return (
    <Layout>
      <PageHeader
        label="A11OY · PROVENANCE"
        title="Payload Provenance"
        subtitle="Canonical SZL Holdings payload — Doctrine V6 manifest"
        status="LIVE"
      />

      {/* 2. Doctrine V6 */}
      <SectionTitle>Doctrine V6</SectionTitle>
      <Card className="mb-8">
        <div className="grid lg:grid-cols-2 gap-x-6">
          <div>
            <Row label="Version"               value={DOCTRINE_V6.version} mono />
            <Row label="Byline"                value={DOCTRINE_V6.byline} />
            <Row label="ORCID"                 value={DOCTRINE_V6.orcid} mono />
            <Row label="Affiliation"           value={DOCTRINE_V6.affiliation} />
            <Row label="Ingestion policy"      value={<Chip tone="gold">{DOCTRINE_V6.ingestionPolicy}</Chip>} />
            <Row label="License allowlist"     value={
              <span className="flex flex-wrap gap-1">
                {DOCTRINE_V6.licenseAllowlist.map(l => <Chip key={l} tone="muted">{l}</Chip>)}
              </span>
            } />
          </div>
          <div>
            <Row label="Λ axes"                value={`${DOCTRINE_V6.lambdaAxes} conjunctive axes`} />
            <Row label="Λ floor (conjunctive)" value={DOCTRINE_V6.lambdaFloor.toFixed(2)} mono />
            <Row label="moralGrounding floor"  value={DOCTRINE_V6.moralGroundingFloor.toFixed(2)} mono />
            <Row label="measurabilityHonesty floor" value={DOCTRINE_V6.measurabilityHonestyFloor.toFixed(2)} mono />
            <Row label="Byte-identical replays" value={`${DOCTRINE_V6.byteIdenticalReplays} required`} />
            <Row
              label="Replay root"
              value={
                <span className="flex items-center">
                  <span className="break-all" style={{ color: GOLD, fontFamily: 'JetBrains Mono, ui-monospace, Menlo, monospace' }}>
                    {DOCTRINE_V6.replayRoot}
                  </span>
                  <CopyHint text={DOCTRINE_V6.replayRoot} />
                </span>
              }
            />
          </div>
        </div>
      </Card>

      {/* 3. Push queue */}
      <SectionTitle>Push queue · one-way doors</SectionTitle>
      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        <Card style={{ borderColor: 'rgba(201,183,135,0.30)', backgroundColor: 'rgba(201,183,135,0.04)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold" style={{ color: TEXT }}>Ready</div>
            <Chip tone="ready">{PUSH_QUEUE_READY.length} awaiting confirm</Chip>
          </div>
          <div className="flex flex-col gap-3">
            {PUSH_QUEUE_READY.map(item => (
              <div key={item.id} className="rounded p-3" style={{ border: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.25)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono" style={{ color: GOLD }}>{item.id}</span>
                  {item.status && <Chip tone="ready">{item.status}</Chip>}
                </div>
                {item.targetVersion && <div className="text-xs" style={{ color: SUB }}>Target: <span style={{ color: TEXT }}>{item.targetVersion}</span></div>}
                {item.artifact && <div className="text-xs font-mono break-all" style={{ color: GHOST }}>{item.artifact}</div>}
                {item.sha256 && <div className="text-xs font-mono break-all mt-1" style={{ color: GHOST }}>sha256: {item.sha256}</div>}
                <div className="text-xs mt-1" style={{ color: MUTED }}>Blocker: {item.blocker}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ borderColor: 'rgba(201,183,135,0.18)', backgroundColor: 'rgba(201,183,135,0.02)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold" style={{ color: TEXT }}>Blocked</div>
            <Chip tone="blocked">{PUSH_QUEUE_BLOCKED.length} blocked</Chip>
          </div>
          <div className="flex flex-col gap-3">
            {PUSH_QUEUE_BLOCKED.map(item => (
              <div key={item.id} className="rounded p-3" style={{ border: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.25)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono" style={{ color: GOLD }}>{item.id}</span>
                  <Chip tone="blocked">BLOCKED</Chip>
                </div>
                <div className="text-xs" style={{ color: SUB }}>Blocker: <span style={{ color: TEXT }}>{item.blocker}</span></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 4. Full org-wide repo grid */}
      <SectionTitle>Org · {ORG_SUMMARY.reposTotal} repositories</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {REPOS.map(r => (
          <Card key={r.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-mono" style={{ color: GOLD }}>{r.name}</span>
              {r.latestTag && <Chip tone="muted">{r.latestTag}</Chip>}
            </div>
            <p className="text-xs mb-3 line-clamp-2" style={{ color: SUB, lineHeight: 1.55 }}>
              {r.description ?? '—'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Chip tone="gold">scorecard {r.scorecard?.toFixed(1) ?? '—'}</Chip>
              <Chip tone={r.branchProtectionStrict ? 'gold' : 'muted'}>
                BP {r.branchProtectionStrict ? 'strict' : 'weak'}
              </Chip>
              <Chip tone="muted">alerts {r.openCodeScanningAlerts ?? 0}</Chip>
              <Chip tone={r.openDependabotHighCritical > 0 ? 'gold' : 'muted'}>
                dependabot {r.openDependabotHighCritical}
              </Chip>
            </div>
          </Card>
        ))}
      </div>

      {/* 5. DOI ledger */}
      <div className="flex items-center justify-between mb-3">
        <SectionTitle>DOI ledger</SectionTitle>
        <Chip tone="gold">{DOI_LEDGER.length} / 13</Chip>
      </div>
      <Card className="mb-8" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.25)' }}>
              <th className="text-left font-mono px-3 py-2" style={{ color: GHOST, fontWeight: 500 }}>DOI</th>
              <th className="text-left font-mono px-3 py-2" style={{ color: GHOST, fontWeight: 500 }}>Title</th>
              <th className="text-left font-mono px-3 py-2" style={{ color: GHOST, fontWeight: 500 }}>Kind</th>
              <th className="text-left font-mono px-3 py-2" style={{ color: GHOST, fontWeight: 500 }}>Year</th>
            </tr>
          </thead>
          <tbody>
            {DOI_LEDGER.map(d => (
              <tr key={d.doi} style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td className="px-3 py-2 font-mono" style={{ color: GOLD, whiteSpace: 'nowrap' }}>
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: GOLD, textDecoration: 'none' }}>
                      {d.doi}
                    </a>
                  ) : d.doi}
                </td>
                <td className="px-3 py-2" style={{ color: TEXT }}>{d.title}</td>
                <td className="px-3 py-2 font-mono" style={{ color: SUB }}>{d.kind}</td>
                <td className="px-3 py-2 font-mono" style={{ color: SUB }}>{d.year ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 6. Λ axes */}
      <SectionTitle>Λ axes · 9-axis conjunctive gate</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {LAMBDA_AXES.map(a => (
          <Card key={a.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: GOLD }}>{a.id}</span>
                <span className="text-sm font-semibold font-mono" style={{ color: TEXT }}>{a.name}</span>
              </div>
              <Chip tone="gold">floor {a.floor.toFixed(2)}</Chip>
            </div>
            <p className="text-xs" style={{ color: SUB, lineHeight: 1.55 }}>{a.description}</p>
          </Card>
        ))}
      </div>

      {/* 7. A11oy artifacts (tabs) */}
      <SectionTitle>A11oy knowledge artifacts</SectionTitle>
      <Card className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {tabs.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="px-3 py-1.5 rounded text-xs font-mono"
                style={{
                  backgroundColor: active ? 'rgba(201,183,135,0.15)' : 'rgba(245,245,245,0.03)',
                  color: active ? GOLD : SUB as string,
                  border: `1px solid ${active ? 'rgba(201,183,135,0.35)' : BORDER as string}`,
                  cursor: 'pointer',
                }}
              >
                {t.label} <span style={{ opacity: 0.6 }}>· {t.count}</span>
              </button>
            );
          })}
        </div>
        <ArtifactList items={tabItems[tab]} />
        <div className="mt-3 text-xs" style={{ color: GHOST }}>
          Source: a11oy-knowledge v0.4.0 (A1–A14 axioms, TH1–TH3 + TH4/TH6/TH7, T1–T10 derivations, K01–K13 constants).
        </div>
      </Card>

      {/* 8. Forecast gauges */}
      <div className="flex items-center justify-between mb-3">
        <SectionTitle>Forecast gauges</SectionTitle>
        <Chip tone="gold">{FORECAST_GAUGES.length} gauges</Chip>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
        {FORECAST_GAUGES.map(g => (
          <Card key={g.id}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono" style={{ color: GOLD }}>#{String(g.id).padStart(2, '0')}</span>
              {g.unit && <Chip tone="muted">{g.unit}</Chip>}
            </div>
            <div className="text-xs font-mono mb-1" style={{ color: TEXT }}>{g.name}</div>
            {g.current !== undefined && (
              <div className="text-base font-display font-semibold" style={{ color: GOLD }}>
                {String(g.current)}
                {g.target !== undefined && <span className="text-xs ml-1" style={{ color: GHOST }}>/ {String(g.target)}</span>}
              </div>
            )}
            {g.description && <p className="text-xs mt-1" style={{ color: SUB, lineHeight: 1.5 }}>{g.description}</p>}
          </Card>
        ))}
      </div>

      {/* 9. Org summary footer */}
      <SectionTitle>Org summary</SectionTitle>
      <Card className="mb-2">
        <div className="flex flex-wrap gap-2 items-center">
          <Chip tone="gold">repos {ORG_SUMMARY.reposTotal}</Chip>
          <Chip tone="gold">CI failing {ORG_SUMMARY.ciFailing}</Chip>
          <Chip tone="muted">open PRs {ORG_SUMMARY.openPrs}</Chip>
          <Chip tone="gold">scorecard avg {ORG_SUMMARY.scorecardAvg.toFixed(2)}</Chip>
          <Chip tone="gold">BP compliant {ORG_SUMMARY.branchProtectionCompliant}/{ORG_SUMMARY.reposTotal}</Chip>
          <Chip tone="muted">BP weak {ORG_SUMMARY.branchProtectionWeak}</Chip>
          <Chip tone="muted">code-scan alerts {ORG_SUMMARY.openAlertsCodeScanning}</Chip>
          <Chip tone="gold">dependabot HC {ORG_SUMMARY.openDependabotHighCritical}</Chip>
          {ORG_SUMMARY.hygieneGaps.map(h => <Chip key={h} tone="blocked">hygiene gap · {h}</Chip>)}
          <StatusBadge status="ok" label="doctrine pass" />
        </div>
      </Card>
    </Layout>
  );
}
