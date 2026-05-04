import { useState } from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, Zap, Filter, Link as LinkIcon, Shield } from 'lucide-react';
import { MOCK_EVENTS, SOURCE_LABELS, formatRelativeWG } from '@/alloy/data/workgraph';
import { useLocation } from 'wouter';

const ACCENT = '#4B8BDB';

function ProofBadge({ state }: { state: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    pending: { color: '#6b7280', label: 'Proof pending' },
    captured: { color: '#f59e0b', label: 'Captured' },
    verified: { color: '#10b981', label: 'Verified' },
  };
  const c = cfg[state] ?? cfg.pending;
  return (
    <span className="text-[8px] px-1.5 py-0.5 rounded font-medium"
      style={{ color: c.color, background: `${c.color}12` }}>
      {c.label}
    </span>
  );
}

function EventRow({ ev }: { ev: typeof MOCK_EVENTS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const sourceColor: Record<string, string> = {
    email_provider: '#4B8BDB',
    drive_storage: '#8b5cf6',
    document_editor: '#8b5cf6',
    spreadsheet_app: '#10b981',
    calendar_app: '#10b981',
    chat_platform: '#f59e0b',
    video_meetings: '#06b6d4',
    task_manager: '#ef4444',
    workspace_events: '#6b7280',
  };
  const c = sourceColor[ev.sourceApp] ?? '#4B8BDB';
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <div onClick={() => setExpanded(x => !x)} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/[0.02] transition-colors">
        <div className="w-6 h-6 rounded shrink-0 flex items-center justify-center mt-0.5"
          style={{ background: `${c}15`, border: `1px solid ${c}25` }}>
          <Activity className="w-3 h-3" style={{ color: c }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[10px] font-mono font-medium" style={{ color: c }}>{ev.eventType}</span>
            <ProofBadge state={ev.proofState} />
            {ev.normalized && (
              <span className="text-[8px] px-1 py-0.5 rounded" style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)' }}>
                Normalized
              </span>
            )}
            {ev.workcellUpdated && (
              <span className="text-[8px] px-1 py-0.5 rounded" style={{ color: '#4B8BDB', background: 'rgba(75,139,219,0.08)' }}>
                Workcell updated
              </span>
            )}
          </div>
          <div className="text-[10px] font-medium text-white">{ev.linkedObjectTitle}</div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Source: {SOURCE_LABELS[ev.sourceApp] ?? ev.sourceApp}
            </span>
            {ev.triggeredSkill && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span className="text-[9px]" style={{ color: '#f59e0b' }}>
                  Skill: {ev.triggeredSkill}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="text-[9px] shrink-0 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {formatRelativeWG(ev.occurredAt)}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-3 ml-9 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div className="p-2 rounded" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Object ID</div>
              <div className="font-mono text-white">{ev.linkedObjectId}</div>
            </div>
            <div className="p-2 rounded" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Trace Span</div>
              <div className="font-mono text-white">{ev.traceSpanId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded text-[10px]"
            style={{ background: 'rgba(75,139,219,0.05)', border: '1px solid rgba(75,139,219,0.1)' }}>
            <Shield className="w-3 h-3 shrink-0" style={{ color: 'rgba(75,139,219,0.6)' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              Event normalized and logged. Triggered skill chain: {ev.triggeredSkill ?? 'none'}.
              Proof state: <strong style={{ color: '#10b981' }}>{ev.proofState}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const EVENT_TYPES = Array.from(new Set(MOCK_EVENTS.map(e => e.sourceApp)));

export default function EventStream() {
  const [filter, setFilter] = useState('all');
  const [proof, setProof] = useState('all');

  const filtered = MOCK_EVENTS.filter(e => {
    const matchSource = filter === 'all' || e.sourceApp === filter;
    const matchProof = proof === 'all' || e.proofState === proof;
    return matchSource && matchProof;
  });

  const verified = MOCK_EVENTS.filter(e => e.proofState === 'verified').length;
  const captured = MOCK_EVENTS.filter(e => e.proofState === 'captured').length;
  const pending = MOCK_EVENTS.filter(e => e.proofState === 'pending').length;
  const withSkill = MOCK_EVENTS.filter(e => e.triggeredSkill).length;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
              WorkGraph · Event Fabric
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Workspace Event Stream</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Every workspace event, normalized and logged. Skills triggered, proof captured, Workcells updated.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border"
          style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
          <Zap className="w-2.5 h-2.5" /> Demo Mode
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Events Captured', value: MOCK_EVENTS.length, color: ACCENT, icon: Activity },
          { label: 'Proof Verified', value: verified, color: '#10b981', icon: CheckCircle },
          { label: 'Proof Captured', value: captured, color: '#f59e0b', icon: Clock },
          { label: 'Skills Triggered', value: withSkill, color: '#8b5cf6', icon: Zap },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.95)' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[9px] uppercase tracking-widest font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
            </div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
        <div className="flex flex-wrap gap-1">
          {['all', ...EVENT_TYPES].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-2 py-1 rounded text-[9px] font-medium border transition-all capitalize"
              style={{
                background: filter === t ? 'rgba(75,139,219,0.1)' : 'transparent',
                borderColor: filter === t ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.06)',
                color: filter === t ? ACCENT : 'rgba(255,255,255,0.35)',
              }}>
              {SOURCE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['all', 'verified', 'captured', 'pending'].map(p => (
            <button key={p} onClick={() => setProof(p)}
              className="px-2 py-1 rounded text-[9px] font-medium border transition-all capitalize"
              style={{
                background: proof === p ? 'rgba(75,139,219,0.1)' : 'transparent',
                borderColor: proof === p ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.06)',
                color: proof === p ? ACCENT : 'rgba(255,255,255,0.35)',
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.95)' }}>
        <div className="px-4 py-2.5 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
          <div className="text-[9px] uppercase tracking-widest font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Event log — {filtered.length} events
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px]" style={{ color: '#10b981' }}>Live feed (demo)</span>
          </div>
        </div>
        {filtered.map(ev => (
          <EventRow key={ev.id} ev={ev} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No events match current filters
          </div>
        )}
      </div>

      <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(75,139,219,0.15)', background: 'rgba(75,139,219,0.04)' }}>
        <div className="flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'rgba(75,139,219,0.6)' }} />
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <strong className="text-white">Event Fabric governance:</strong> Every workspace event is normalized via the MCP Workspace Bridge, de-duplicated, and logged with a trace span ID. Skill chains triggered by events are recorded in the Proof Chain. No event bypasses normalization.
          </div>
        </div>
      </div>
    </div>
  );
}
