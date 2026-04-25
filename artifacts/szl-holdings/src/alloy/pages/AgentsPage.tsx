import { useState } from 'react';
import { ALLOY_AGENTS } from '../data/agents';
import { trackEvent } from '../lib/track-event';

const CATEGORY_ACCENT: Record<string, string> = {
  Processing: '#4B8BDB',
  Observability: '#f59e0b',
  Orchestration: '#a78bfa',
  Output: '#10b981',
  Control: '#ef4444',
  Assessment: '#3b82f6',
  Governance: '#f59e0b',
  Intelligence: '#6366f1',
};

const ESCALATION_LABELS: Record<string, string> = {
  auto: 'Auto-escalates',
  threshold: 'Threshold-based',
  always: 'Always escalates',
  never: 'Never escalates',
};

const ESCALATION_COLORS: Record<string, string> = {
  auto: '#4B8BDB',
  threshold: '#f59e0b',
  always: '#ef4444',
  never: '#10b981',
};

export default function AgentsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(ALLOY_AGENTS.map((a) => a.category)))];
  const filtered =
    filter === 'All' ? ALLOY_AGENTS : ALLOY_AGENTS.filter((a) => a.category === filter);

  const selectedAgent = ALLOY_AGENTS.find((a) => a.id === selected);

  return (
    <div className="min-h-screen text-white px-6 py-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div
          className="text-xs font-medium uppercase tracking-widest mb-3"
          style={{ color: '#4B8BDB' }}
        >
          Agents
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Agent workflow gallery</h1>
        <p className="text-white/50 max-w-2xl leading-relaxed">
          Counsel's agent library is the modular workforce behind every workflow. Each agent has a
          defined role, specific inputs and outputs, and clear escalation behaviour.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => {
          const accent = cat === 'All' ? '#4B8BDB' : (CATEGORY_ACCENT[cat] ?? '#4B8BDB');
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                borderColor: filter === cat ? `${accent}40` : 'rgba(255,255,255,0.1)',
                background: filter === cat ? `${accent}12` : 'transparent',
                color: filter === cat ? accent : 'rgba(255,255,255,0.45)',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="lg:flex lg:gap-8">
        {/* Agent Grid */}
        <div className="lg:flex-1">
          <div className="grid md:grid-cols-2 gap-3 mb-6">
            {filtered.map((agent) => {
              const accent = CATEGORY_ACCENT[agent.category] ?? '#4B8BDB';
              const isSelected = selected === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    if (!isSelected)
                      trackEvent('agent_card_open', {
                        agent_id: agent.id,
                        agent_name: agent.name,
                        category: agent.category,
                      });
                    setSelected(isSelected ? null : agent.id);
                  }}
                  className="text-left p-5 rounded-xl border transition-all"
                  style={{
                    borderColor: isSelected ? `${accent}40` : 'rgba(255,255,255,0.08)',
                    background: isSelected ? `${accent}08` : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{agent.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white/90 mb-0.5">{agent.name}</div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: `${accent}15`, color: accent }}
                        >
                          {agent.category}
                        </span>
                        <div
                          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            background: `${ESCALATION_COLORS[agent.escalationMode]}10`,
                            color: ESCALATION_COLORS[agent.escalationMode],
                          }}
                        >
                          <span
                            className="w-1 h-1 rounded-full"
                            style={{ background: ESCALATION_COLORS[agent.escalationMode] }}
                          />
                          {ESCALATION_LABELS[agent.escalationMode]}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-white/45 leading-relaxed">{agent.purpose}</p>

                  <div className="flex items-center gap-3 mt-3">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${agent.status === 'active' ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/30 bg-white/5'}`}
                    >
                      {agent.status}
                    </span>
                    {agent.approvalRequired && (
                      <span className="text-[10px] text-amber-400">Approval required</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Agent Detail Drawer */}
        {selectedAgent && (
          <div className="lg:w-80 shrink-0">
            <AgentDetail agent={selectedAgent} />
          </div>
        )}
      </div>
    </div>
  );
}

function AgentDetail({ agent }: { agent: (typeof ALLOY_AGENTS)[number] }) {
  const accent = CATEGORY_ACCENT[agent.category] ?? '#4B8BDB';

  return (
    <div
      className="sticky top-6 rounded-xl border p-6"
      style={{ borderColor: `${accent}25`, background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-start gap-3 mb-5">
        <span className="text-3xl">{agent.icon}</span>
        <div>
          <h3 className="text-base font-bold mb-0.5">{agent.name}</h3>
          <span
            className="text-[11px] px-1.5 py-0.5 rounded font-medium"
            style={{ background: `${accent}15`, color: accent }}
          >
            {agent.category}
          </span>
        </div>
      </div>

      <p className="text-xs text-white/55 leading-relaxed mb-6">{agent.purpose}</p>

      <div className="space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Inputs</div>
          <div className="space-y-1">
            {agent.inputs.map((i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-white/55">
                <div
                  className="w-1 h-1 rounded-full shrink-0 opacity-60"
                  style={{ background: accent }}
                />
                {i}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Outputs</div>
          <div className="space-y-1">
            {agent.outputs.map((o) => (
              <div key={o} className="flex items-center gap-2 text-xs text-white/55">
                <div
                  className="w-1 h-1 rounded-full shrink-0 opacity-60"
                  style={{ background: '#10b981' }}
                />
                {o}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
            Connected Systems
          </div>
          <div className="flex flex-wrap gap-1.5">
            {agent.systemsConnected.map((s) => (
              <span
                key={s}
                className="text-[11px] px-2 py-0.5 rounded border"
                style={{
                  borderColor: 'rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t space-y-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/35">Escalation</span>
            <span style={{ color: ESCALATION_COLORS[agent.escalationMode] }}>
              {ESCALATION_LABELS[agent.escalationMode]}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/35">Approval Required</span>
            <span className={agent.approvalRequired ? 'text-amber-400' : 'text-emerald-400'}>
              {agent.approvalRequired ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/35">Status</span>
            <span className={agent.status === 'active' ? 'text-emerald-400' : 'text-white/40'}>
              {agent.status}
            </span>
          </div>
          {agent.confidenceThreshold && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/35">Confidence Threshold</span>
              <span className="text-white/55">{Math.round(agent.confidenceThreshold * 100)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
