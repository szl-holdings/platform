import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge } from '../components/ui';
import { CAPABILITY_COMPARTMENTS, DARPA_PROGRAMS, fmtPct, DARPA_VERSION } from '../data/darpaResilience';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const LEVEL_COLORS: Record<string, string> = {
  sovereign: '#ef4444', classified: '#f59e0b', confidential: '#3b82f6', internal: '#10b981', public: '#8a8a8a',
};

const NETWORK_LABELS: Record<string, string> = {
  'air-gapped': 'AIR-GAPPED', 'egress-filtered': 'EGRESS FILTERED', 'full-mesh': 'FULL MESH', 'read-only-external': 'READ-ONLY EXT',
};

export function CapabilityCompartments() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const filtered = selectedLevel ? CAPABILITY_COMPARTMENTS.filter(c => c.securityLevel === selectedLevel) : CAPABILITY_COMPARTMENTS;

  const activeEnclaves = CAPABILITY_COMPARTMENTS.filter(c => c.enclaveStatus === 'active').length;
  const avgIsolation = CAPABILITY_COMPARTMENTS.reduce((a, c) => a + c.isolationScore, 0) / CAPABILITY_COMPARTMENTS.length;
  const totalAgents = new Set(CAPABILITY_COMPARTMENTS.flatMap(c => c.agents)).size;
  const ssith = DARPA_PROGRAMS.find(p => p.id === 'ssith')!;

  return (
    <Layout>
      <PageHeader
        label={`DARPA RESILIENCE · v${DARPA_VERSION}`}
        title="Capability Compartments"
        subtitle="SSITH/CHERI-inspired — capability-based isolation with memory-safe bounds, zero-trust compartmentalization, and enclave security."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="ACTIVE ENCLAVES" value={`${activeEnclaves}/${CAPABILITY_COMPARTMENTS.length}`} sub="compartments live" accent={T.accent} />
        <KpiCard label="ISOLATION SCORE" value={fmtPct(avgIsolation)} sub="mean enclave isolation" accent={T.accent} />
        <KpiCard label="AGENTS GOVERNED" value={totalAgents.toString()} sub="across all compartments" accent={T.accent} />
        <KpiCard label="SECURITY LEVELS" value="5" sub="sovereign → public" accent={T.accent} />
      </div>

      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: T.accent }} />
          <span className="text-xs font-mono" style={{ color: T.dim }}>DARPA PROGRAM REFERENCE</span>
        </div>
        <div className="text-sm mb-1" style={{ color: T.text }}>{ssith.fullName}</div>
        <div className="text-xs" style={{ color: T.dim }}>Office: {ssith.office} · GitHub: <span style={{ color: T.accent }}>{ssith.github}</span></div>
        <div className="text-xs mt-2" style={{ color: T.muted }}>{ssith.innovation}</div>
      </Card>

      <SectionTitle>Security Levels</SectionTitle>
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(LEVEL_COLORS).map(([level, color]) => {
          const count = CAPABILITY_COMPARTMENTS.filter(c => c.securityLevel === level).length;
          return (
            <button
              key={level}
              onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
              className="px-3 py-1.5 rounded text-xs font-mono uppercase transition-all"
              style={{
                backgroundColor: selectedLevel === level ? color + '22' : T.surface,
                border: `1px solid ${selectedLevel === level ? color : T.border}`,
                color: selectedLevel === level ? color : T.dim,
              }}
            >
              {level} ({count})
            </button>
          );
        })}
      </div>

      <SectionTitle>Enclave Registry</SectionTitle>
      <div className="space-y-4 mb-8">
        {filtered.map(compartment => (
          <Card key={compartment.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono" style={{ color: T.dim }}>{compartment.id}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: LEVEL_COLORS[compartment.securityLevel] + '15', color: LEVEL_COLORS[compartment.securityLevel] }}>
                    {compartment.securityLevel.toUpperCase()}
                  </span>
                  <StatusBadge status={compartment.enclaveStatus === 'active' ? 'ok' : 'info'} label={compartment.enclaveStatus.toUpperCase()} />
                </div>
                <div className="text-sm font-medium" style={{ color: T.text }}>{compartment.name}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold" style={{ color: T.accent }}>{fmtPct(compartment.isolationScore)}</div>
                <div className="text-xs" style={{ color: T.dim }}>isolation</div>
              </div>
            </div>

            <div className="p-3 rounded mb-3" style={{ backgroundColor: 'rgba(201,183,135,0.05)', border: `1px solid ${T.border}` }}>
              <div className="text-xs font-mono mb-2" style={{ color: T.dim }}>CHERI CAPABILITY BOUNDS</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs" style={{ color: T.dim }}>Base</div>
                  <div className="text-xs font-mono" style={{ color: T.accent }}>{compartment.cheriBounds.base}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: T.dim }}>Length</div>
                  <div className="text-xs font-mono" style={{ color: T.text }}>{compartment.cheriBounds.length}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: T.dim }}>Permissions</div>
                  <div className="flex gap-1 flex-wrap">
                    {compartment.cheriBounds.permissions.map(p => (
                      <span key={p} className="text-xs font-mono px-1 py-0.5 rounded" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.accent, fontSize: '10px' }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="text-xs mb-1" style={{ color: T.dim }}>Agents</div>
                <div className="flex gap-1 flex-wrap">
                  {compartment.agents.map(a => <span key={a} className="text-xs font-mono px-1 py-0.5 rounded" style={{ backgroundColor: T.surface, color: T.text, fontSize: '10px' }}>{a}</span>)}
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: T.dim }}>Tools</div>
                <div className="flex gap-1 flex-wrap">
                  {compartment.tools.map(t => <span key={t} className="text-xs font-mono px-1 py-0.5 rounded" style={{ backgroundColor: T.surface, color: T.text, fontSize: '10px' }}>{t}</span>)}
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Network Policy</div>
                <div className="text-xs font-mono mt-1" style={{ color: compartment.networkPolicy === 'air-gapped' ? '#ef4444' : T.accent }}>
                  {NETWORK_LABELS[compartment.networkPolicy]}
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Last Pen Test</div>
                <div className="text-sm font-mono" style={{ color: T.text }}>{compartment.lastPenTest}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
