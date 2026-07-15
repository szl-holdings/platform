import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { VERTICALS, ROADMAP_PHASES, FABRIC_AGENTS, type VerticalId } from '../../data/fabric';

const TEXT = '#f5f5f5';
const GHOST = '#5e5e5e';
const SUB = '#8a8a8a';
const GOLD = '#c9b787';
const SURFACE = 'rgba(255,255,255,0.018)';
const BORDER = 'rgba(255,255,255,0.08)';

const STATUS_COLORS: Record<string, string> = {
  complete: '#22c55e',
  active: '#f59e0b',
  planned: '#8a8a8a',
};

export function EcosystemRoadmap() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>('phase-1');
  const [verticalFilter, setVerticalFilter] = useState<VerticalId | 'all'>('all');

  const filtered =
    verticalFilter === 'all'
      ? ROADMAP_PHASES
      : ROADMAP_PHASES.filter((p) => p.verticalImpact.includes(verticalFilter));

  return (
    <Layout>
      <PageHeader
        label="COMMAND FABRIC · ROADMAP"
        title="Ecosystem Evolution"
        subtitle="How A11oy evolves every vertical through six phases — from visual command fabric to enterprise trust layer."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="PHASES" value={ROADMAP_PHASES.length} sub="total" accent={GOLD} />
        <KpiCard
          label="COMPLETE"
          value={ROADMAP_PHASES.filter((p) => p.status === 'complete').length}
          sub="phases"
          accent="#22c55e"
        />
        <KpiCard
          label="ACTIVE"
          value={ROADMAP_PHASES.filter((p) => p.status === 'active').length}
          sub="in progress"
          accent="#f59e0b"
        />
        <KpiCard label="AGENTS" value={FABRIC_AGENTS.length} sub="command agents" accent={GOLD} />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-[10px] font-mono" style={{ color: GHOST }}>
          VERTICAL IMPACT
        </span>
        <button
          onClick={() => setVerticalFilter('all')}
          className="text-[10px] font-mono px-2 py-1 rounded"
          style={{
            backgroundColor: verticalFilter === 'all' ? `${GOLD}18` : 'transparent',
            color: verticalFilter === 'all' ? GOLD : GHOST,
            border: `1px solid ${verticalFilter === 'all' ? `${GOLD}40` : 'transparent'}`,
          }}
        >
          ALL
        </button>
        {VERTICALS.map((v) => (
          <button
            key={v.id}
            onClick={() => setVerticalFilter(v.id)}
            className="text-[10px] font-mono px-2 py-1 rounded"
            style={{
              backgroundColor: verticalFilter === v.id ? `${GOLD}18` : 'transparent',
              color: verticalFilter === v.id ? GOLD : GHOST,
              border: `1px solid ${verticalFilter === v.id ? `${GOLD}40` : 'transparent'}`,
            }}
          >
            {v.icon}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {filtered.map((phase) => {
          const isExpanded = expandedPhase === phase.id;
          return (
            <div
              key={phase.id}
              className="rounded-lg border overflow-hidden"
              style={{ backgroundColor: SURFACE, borderColor: isExpanded ? GOLD : BORDER }}
            >
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center font-mono text-sm font-bold"
                    style={{
                      backgroundColor: `${STATUS_COLORS[phase.status]}18`,
                      color: STATUS_COLORS[phase.status],
                    }}
                  >
                    {phase.phase}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: TEXT }}>
                      {phase.title}
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                      {phase.items.length} deliverables
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${STATUS_COLORS[phase.status]}18`,
                      color: STATUS_COLORS[phase.status],
                    }}
                  >
                    {phase.status.toUpperCase()}
                  </span>
                  <span className="text-sm" style={{ color: GHOST }}>
                    {isExpanded ? '−' : '+'}
                  </span>
                </div>
              </div>
              {isExpanded && (
                <div
                  className="px-4 pb-4 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <p className="text-xs mt-3 mb-3" style={{ color: SUB }}>
                    {phase.description}
                  </p>
                  <div className="flex flex-col gap-1.5 mb-3">
                    {phase.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs"
                        style={{ color: TEXT }}
                      >
                        <span style={{ color: STATUS_COLORS[phase.status] }}>
                          {phase.status === 'complete'
                            ? '✓'
                            : phase.status === 'active'
                              ? '→'
                              : '○'}
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono" style={{ color: GHOST }}>
                      Vertical impact:
                    </span>
                    {phase.verticalImpact.map((vid) => {
                      const v = VERTICALS.find((vt) => vt.id === vid);
                      return (
                        <span key={vid} className="text-sm" title={v?.name}>
                          {v?.icon}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SectionTitle>Command Agents</SectionTitle>
      <p className="text-xs mb-4" style={{ color: SUB }}>
        These agents operate within the Command Fabric. They do not have autonomous authority —
        every high-impact action requires human approval through TENAX.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {FABRIC_AGENTS.map((agent) => (
          <Card key={agent.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold" style={{ color: TEXT }}>
                {agent.name}
              </span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${GOLD}18`, color: GOLD }}
              >
                {agent.verticalCoverage.length === 7
                  ? 'ALL VERTICALS'
                  : agent.verticalCoverage.join(', ')}
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: SUB }}>
              {agent.role}
            </p>
            <div className="flex flex-wrap gap-1 mb-2">
              {agent.inputTypes.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: GHOST }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {agent.outputTypes.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${GOLD}10`, color: GOLD }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="text-[10px] font-mono" style={{ color: GHOST }}>
              Limits: {agent.governanceLimits.join(' · ')}
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
