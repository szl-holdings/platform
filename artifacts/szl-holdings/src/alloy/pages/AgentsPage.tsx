import { useState } from 'react';
import { ArrowRight, CheckCircle, Clock, Lock, Shield, Zap } from 'lucide-react';
import { ALLOY_AGENTS } from '../data/agents';
import { trackEvent } from '../lib/track-event';

// ─── Agent Exchange (A2A-style) mock data ─────────────────────────────────────

interface AgentExchangeMessage {
  id: string;
  sender: string;
  senderType: 'internal' | 'external';
  receiver: string;
  task: string;
  contextRefs: string[];
  allowedActions: string[];
  blockedActions: string[];
  requiredApproval: 'none' | 'owner' | 'executive' | 'security' | 'legal';
  evidenceRefs: string[];
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'complete' | 'rejected';
  mirrorEvalScore: number;
  createdAt: string;
  traceSpanId: string;
}

const MOCK_EXCHANGE_MESSAGES: AgentExchangeMessage[] = [
  {
    id: 'aem-001', sender: 'Alloy WorkGraph Agent', senderType: 'internal',
    receiver: 'Approval Chase Agent', task: 'Detect stuck approvals for Q2 revenue deals',
    contextRefs: ['wgn-em-014', 'wgn-appr-003'], allowedActions: ['read_approvals', 'draft_chase_email'],
    blockedActions: ['send_email', 'modify_crm'], requiredApproval: 'owner',
    evidenceRefs: ['pp-003'], status: 'awaiting_approval', mirrorEvalScore: 0.93,
    createdAt: '2026-04-28T08:12:00Z', traceSpanId: 'ts-001-a2a',
  },
  {
    id: 'aem-002', sender: 'Meeting Memory Agent', senderType: 'internal',
    receiver: 'Executive Brief Agent', task: 'Build executive brief from Q2 Revenue Ops meeting',
    contextRefs: ['wgn-meet-001', 'wgn-doc-001'], allowedActions: ['read_meeting_summary', 'draft_brief'],
    blockedActions: ['send_external', 'post_to_crm'], requiredApproval: 'executive',
    evidenceRefs: ['pp-001', 'pp-004'], status: 'awaiting_approval', mirrorEvalScore: 0.88,
    createdAt: '2026-04-28T07:45:00Z', traceSpanId: 'ts-002-a2a',
  },
  {
    id: 'aem-003', sender: 'Security Incident Agent', senderType: 'internal',
    receiver: 'Notification Agent', task: 'Draft incident follow-up for INC-2047',
    contextRefs: ['wgn-em-006', 'wgn-em-023'], allowedActions: ['draft_notification'],
    blockedActions: ['send_external', 'publish'], requiredApproval: 'security',
    evidenceRefs: ['pp-007'], status: 'complete', mirrorEvalScore: 0.95,
    createdAt: '2026-04-27T22:10:00Z', traceSpanId: 'ts-003-a2a',
  },
  {
    id: 'aem-004', sender: 'External: DataVault AI', senderType: 'external',
    receiver: 'Covenant Guard', task: 'Request: read customer PII for segmentation',
    contextRefs: [], allowedActions: [], blockedActions: ['read_pii', 'export_data'],
    requiredApproval: 'executive', evidenceRefs: [],
    status: 'rejected', mirrorEvalScore: 0.12,
    createdAt: '2026-04-28T06:30:00Z', traceSpanId: 'ts-004-a2a',
  },
  {
    id: 'aem-005', sender: 'Legal Deadline Agent', senderType: 'internal',
    receiver: 'Proof Ledger Agent', task: 'Create proof packet for Legal Matter #2089 deadline',
    contextRefs: ['wgn-em-008', 'wgn-doc-003'], allowedActions: ['create_proof_packet', 'link_evidence'],
    blockedActions: ['send_external'], requiredApproval: 'legal',
    evidenceRefs: ['pp-006'], status: 'in_progress', mirrorEvalScore: 0.90,
    createdAt: '2026-04-28T09:00:00Z', traceSpanId: 'ts-005-a2a',
  },
  {
    id: 'aem-006', sender: 'Finance Reconciliation Agent', senderType: 'internal',
    receiver: 'Invoice Review Agent', task: 'Flag Invoice #4821 discrepancy for finance review',
    contextRefs: ['wgn-em-004', 'wgn-doc-012'], allowedActions: ['read_invoice', 'draft_discrepancy_report'],
    blockedActions: ['approve_payment', 'modify_erp'], requiredApproval: 'owner',
    evidenceRefs: ['pp-005'], status: 'pending', mirrorEvalScore: 0.88,
    createdAt: '2026-04-28T10:15:00Z', traceSpanId: 'ts-006-a2a',
  },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', in_progress: '#4B8BDB', awaiting_approval: '#a78bfa',
  complete: '#10b981', rejected: '#ef4444',
};
const APPROVAL_COLORS: Record<string, string> = {
  none: '#10b981', owner: '#4B8BDB', executive: '#a78bfa',
  security: '#ef4444', legal: '#f59e0b',
};

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
  const [activeTab, setActiveTab] = useState<'gallery' | 'exchange'>('gallery');
  const [exchangeFilter, setExchangeFilter] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(ALLOY_AGENTS.map((a) => a.category)))];
  const filtered =
    filter === 'All' ? ALLOY_AGENTS : ALLOY_AGENTS.filter((a) => a.category === filter);

  const selectedAgent = ALLOY_AGENTS.find((a) => a.id === selected);

  const exchangeStatuses = ['All', 'pending', 'in_progress', 'awaiting_approval', 'complete', 'rejected'];
  const filteredExchange = exchangeFilter === 'All'
    ? MOCK_EXCHANGE_MESSAGES
    : MOCK_EXCHANGE_MESSAGES.filter((m) => m.status === exchangeFilter);

  return (
    <div className="min-h-screen text-white px-6 py-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div
          className="text-xs font-medium uppercase tracking-widest mb-3"
          style={{ color: '#4B8BDB' }}
        >
          Agents
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Agent Intelligence Layer</h1>
        <p className="text-white/50 max-w-2xl leading-relaxed">
          Browse the governed agent library or inspect the Agent Exchange — the A2A-style message bus where
          internal and external agents hand off tasks with declared scopes, trust rules, and proof trails.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {(['gallery', 'exchange'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px"
            style={{
              borderColor: activeTab === tab ? '#4B8BDB' : 'transparent',
              color: activeTab === tab ? '#4B8BDB' : 'rgba(255,255,255,0.45)',
            }}
          >
            {tab === 'gallery' ? 'Agent Gallery' : 'Agent Exchange'}
            {tab === 'exchange' && (
              <span
                className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: 'rgba(75,139,219,0.15)', color: '#4B8BDB' }}
              >
                A2A
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Agent Exchange Tab */}
      {activeTab === 'exchange' && (
        <div>
          <div className="mb-6 p-4 rounded-xl border" style={{ borderColor: 'rgba(75,139,219,0.2)', background: 'rgba(75,139,219,0.04)' }}>
            <div className="flex items-start gap-3">
              <Shield size={16} style={{ color: '#4B8BDB', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: '#4B8BDB' }}>Agent Exchange — Trust Rules</div>
                <div className="text-xs text-white/50 leading-relaxed">
                  External agents are untrusted by default. All output passes MirrorEval before use.
                  No external agent can bypass Covenant Guard. Write actions are draft-only unless approved.
                  Every exchange produces a trace span and a Proof Ledger entry.
                </div>
              </div>
            </div>
          </div>

          {/* Exchange stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Messages', value: MOCK_EXCHANGE_MESSAGES.length, color: '#4B8BDB' },
              { label: 'Awaiting Approval', value: MOCK_EXCHANGE_MESSAGES.filter(m => m.status === 'awaiting_approval').length, color: '#a78bfa' },
              { label: 'Rejected', value: MOCK_EXCHANGE_MESSAGES.filter(m => m.status === 'rejected').length, color: '#ef4444' },
              { label: 'Avg MirrorEval', value: `${Math.round(MOCK_EXCHANGE_MESSAGES.reduce((s, m) => s + m.mirrorEvalScore, 0) / MOCK_EXCHANGE_MESSAGES.length * 100)}%`, color: '#10b981' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-xs text-white/35 mb-1">{stat.label}</div>
                <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex flex-wrap gap-2 mb-5">
            {exchangeStatuses.map((s) => (
              <button
                key={s}
                onClick={() => setExchangeFilter(s)}
                className="px-3 py-1 rounded-lg text-xs font-medium border transition-all"
                style={{
                  borderColor: exchangeFilter === s ? 'rgba(75,139,219,0.4)' : 'rgba(255,255,255,0.1)',
                  background: exchangeFilter === s ? 'rgba(75,139,219,0.1)' : 'transparent',
                  color: exchangeFilter === s ? '#4B8BDB' : 'rgba(255,255,255,0.45)',
                }}
              >
                {s === 'All' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Message list */}
          <div className="space-y-3">
            {filteredExchange.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl border p-5"
                style={{
                  borderColor: msg.status === 'rejected' ? 'rgba(239,68,68,0.2)' : msg.status === 'awaiting_approval' ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.08)',
                  background: msg.status === 'rejected' ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-white/80">{msg.sender}</span>
                      {msg.senderType === 'external' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>EXTERNAL — UNTRUSTED</span>
                      )}
                      <ArrowRight size={10} className="text-white/30" />
                      <span className="text-xs text-white/55">{msg.receiver}</span>
                    </div>
                    <div className="text-sm font-medium text-white/90 mb-2">{msg.task}</div>
                  </div>
                  <span
                    className="text-[10px] px-2 py-1 rounded-lg font-medium whitespace-nowrap flex-shrink-0"
                    style={{ background: `${STATUS_COLORS[msg.status]}18`, color: STATUS_COLORS[msg.status] }}
                  >
                    {msg.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-white/30 mb-0.5">Approval Required</div>
                    <div className="font-medium" style={{ color: APPROVAL_COLORS[msg.requiredApproval] }}>
                      {msg.requiredApproval === 'none' ? 'None' : msg.requiredApproval}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/30 mb-0.5">MirrorEval</div>
                    <div className="font-medium" style={{ color: msg.mirrorEvalScore < 0.5 ? '#ef4444' : '#10b981' }}>
                      {Math.round(msg.mirrorEvalScore * 100)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-white/30 mb-0.5">Allowed Actions</div>
                    <div className="text-white/55">{msg.allowedActions.length > 0 ? msg.allowedActions.slice(0, 2).join(', ') : '—'}</div>
                  </div>
                  <div>
                    <div className="text-white/30 mb-0.5">Blocked Actions</div>
                    <div className="text-red-400/70">{msg.blockedActions.length > 0 ? msg.blockedActions.slice(0, 2).join(', ') : '—'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t text-[10px] text-white/30" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {msg.evidenceRefs.length > 0 && (
                    <span className="flex items-center gap-1" style={{ color: 'rgba(75,139,219,0.7)' }}>
                      <CheckCircle size={10} /> {msg.evidenceRefs.length} proof ref(s)
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Clock size={10} /> {new Date(msg.createdAt).toLocaleString()}</span>
                  <span className="ml-auto font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>Trace: {msg.traceSpanId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Gallery Tab */}
      {activeTab === 'gallery' && (
        <>
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
    </>
      )}
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
