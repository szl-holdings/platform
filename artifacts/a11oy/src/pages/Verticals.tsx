import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, SeverityBadge } from '../components/ui';
import { SEED_SIGNALS, SEED_WORKCELLS, SEED_OUTCOMES } from '@workspace/a11oy-fabric';

const VERTICALS = [
  { id: 'vessels-maritime', label: 'SEXTANT Maritime', color: '#8a8a8a', icon: '⚓', description: 'Fleet operations, port scheduling, ETA monitoring, demurrage risk and maritime signal mesh.' },
  { id: 'lyte-revenue', label: 'KORA Revenue', color: '#c9b787', icon: '◆', description: 'Enterprise pipeline velocity, deal health, forecast modeling, and revenue signal patterns.' },
  { id: 'prism-counsel', label: 'Counsel', color: '#8a8a8a', icon: '⚖', description: 'Legal matter tracking, discovery deadlines, document status, and litigation risk scoring.' },
  { id: 'terra-real-estate', label: 'DOMAINE Real Estate', color: '#c9b787', icon: '▣', description: 'Portfolio cap rate monitoring, valuation modeling, and real estate market signal analysis.' },
  { id: 'aegis-defense', label: 'PARAGON Defense', color: '#f5f5f5', icon: '⬡', description: 'Threat intelligence, posture assessment, SIGINT correlation, and defense operational monitoring.' },
  { id: 'carlota-jo', label: 'Carlota Jo', color: '#c9b787', icon: '◎', description: 'Consulting matter management, client follow-ups, advisory brief generation, and engagement signals.' },
  { id: 'alloy-core', label: 'Alloy Core', color: '#8a8a8a', icon: '⬟', description: 'Internal fabric health — signal mesh, proof ledger integrity, layer latency, and operator performance.' },
];

export function Verticals() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Layout>
      <PageHeader
        label="ENTERPRISE VERTICALS"
        title="Vertical Coverage Map"
        subtitle="A11oy operates across 7 enterprise verticals. Each vertical has dedicated agent operators, signal schemas, governance policies, proof coverage, Mythos Doctrine alignment governance, Glasswing transparency, and Compliance Fabric mapping to EU AI Act, NIST AI RMF, ISO 42001, and CSA Agentic Profile — including per-agent CAVD disclosure, adversarial robustness scoring, Agent-BOM, and constitution-as-code enforcement."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="VERTICALS" value={7} sub="fully configured" accent="#c9b787" />
        <KpiCard label="TOTAL SIGNALS" value={SEED_SIGNALS.length} sub="in registry" accent="#c9b787" />
        <KpiCard label="ACTIVE WORKCELLS" value={SEED_WORKCELLS.filter(w => w.status === 'running').length} sub="across verticals" accent="#c9b787" />
        <KpiCard label="OUTCOMES TRACKED" value={SEED_OUTCOMES.length} sub="in board" accent="#c9b787" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {VERTICALS.map(v => {
          const sigs = SEED_SIGNALS.filter(s => s.vertical === v.id);
          const wcs = SEED_WORKCELLS.filter(w => w.vertical === v.id);
          const ocs = SEED_OUTCOMES.filter(o => o.vertical === v.id);
          const critical = sigs.filter(s => s.severity === 'critical').length;
          const high = sigs.filter(s => s.severity === 'high').length;
          const isSelected = selected === v.id;

          return (
            <div
              key={v.id}
              className="rounded-lg border cursor-pointer transition-all p-4"
              onClick={() => setSelected(isSelected ? null : v.id)}
              style={{
                backgroundColor: isSelected ? `${v.color}08` : 'var(--color-a11oy-card)',
                borderColor: isSelected ? v.color : 'var(--color-a11oy-border)',
                borderTop: `3px solid ${v.color}`,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-lg" style={{ color: v.color }}>{v.icon}</div>
                <div className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${v.color}18`, color: v.color }}>
                  {sigs.length} sigs
                </div>
              </div>
              <div className="font-semibold text-sm mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{v.label}</div>
              <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{v.description}</p>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Workcells</div>
                  <div className="font-mono" style={{ color: v.color }}>{wcs.length}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Outcomes</div>
                  <div className="font-mono" style={{ color: v.color }}>{ocs.length}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Critical</div>
                  <div className="font-mono" style={{ color: critical > 0 ? '#f5f5f5' : '#c9b787' }}>{critical}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed view for selected vertical */}
      {selected && (() => {
        const v = VERTICALS.find(vv => vv.id === selected)!;
        const sigs = SEED_SIGNALS.filter(s => s.vertical === selected);
        const wcs = SEED_WORKCELLS.filter(w => w.vertical === selected);
        const ocs = SEED_OUTCOMES.filter(o => o.vertical === selected);
        return (
          <div>
            <SectionTitle>{v.label} — Signal Detail</SectionTitle>
            <div className="grid lg:grid-cols-3 gap-6">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  SIGNALS ({sigs.length})
                </div>
                <div className="flex flex-col gap-2">
                  {sigs.slice(0, 10).map(s => (
                    <Card key={s.id} className="text-xs">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-medium truncate" style={{ color: 'var(--color-a11oy-text)' }}>{s.title}</div>
                        <SeverityBadge severity={s.severity} />
                      </div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.businessImpact.slice(0, 60)}…</div>
                    </Card>
                  ))}
                  {sigs.length > 10 && <div className="text-xs text-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>…and {sigs.length - 10} more</div>}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  WORKCELLS ({wcs.length})
                </div>
                <div className="flex flex-col gap-2">
                  {wcs.map(w => (
                    <Card key={w.id} className="text-xs">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{w.name}</span>
                        <span className="font-mono" style={{ color: { running: '#c9b787', completed: '#c9b787', error: '#f5f5f5', paused: '#5e5e5e', idle: '#5e5e5e' }[w.status] }}>{w.status}</span>
                      </div>
                      <div className="truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{w.objective}</div>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  OUTCOMES ({ocs.length})
                </div>
                <div className="flex flex-col gap-2">
                  {ocs.map(o => {
                    const statusColor = o.status === 'achieved' ? '#c9b787' : o.status === 'missed' ? '#f5f5f5' : o.status === 'blocked' ? '#c9b787' : '#5e5e5e';
                    return (
                      <Card key={o.id} className="text-xs">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{o.title}</span>
                          <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${statusColor}18`, color: statusColor }}>{o.status}</span>
                        </div>
                        <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{o.successMetric}</div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </Layout>
  );
}
