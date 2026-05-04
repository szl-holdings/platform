import { useState } from 'react';
import { Search, Network, Filter, ChevronRight, GitBranch, Lock, Shield, Eye, Zap, Plus } from 'lucide-react';
import { MOCK_NODES, WORKGRAPH_ANSWERS, DATA_CLASS_CONFIG, RISK_CONFIG, SOURCE_LABELS, formatRelativeWG, type DataClass } from '@/alloy/data/workgraph';
import { useLocation } from 'wouter';

const ACCENT = '#4B8BDB';

function DemoModeBadge() {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border"
      style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
      <Zap className="w-2.5 h-2.5" />
      Demo Workspace Connector
    </div>
  );
}

function PermissionBadge({ state }: { state: string }) {
  const cfg = {
    accessible: { color: '#10b981', label: 'Access inherited' },
    inherited: { color: '#4B8BDB', label: 'Access inherited' },
    restricted: { color: '#ef4444', label: 'Restricted source' },
    blocked: { color: '#6b7280', label: 'Proof reference only' },
  }[state] ?? { color: '#6b7280', label: state };
  return (
    <span className="text-[8px] px-1 py-0.5 rounded font-medium"
      style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
      {cfg.label}
    </span>
  );
}

function DataClassBadge({ dc }: { dc: DataClass }) {
  const cfg = DATA_CLASS_CONFIG[dc];
  return (
    <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest"
      style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function NodeCard({ node, onClick }: { node: typeof MOCK_NODES[0]; onClick: () => void }) {
  const dc = DATA_CLASS_CONFIG[node.dataClass];
  const risk = RISK_CONFIG[node.riskLevel];
  const isRestricted = node.dataClass === 'restricted' || node.sourcePermissionState === 'restricted';
  return (
    <div onClick={onClick} className="rounded-xl border p-3 cursor-pointer transition-all hover:border-opacity-50"
      style={{ borderColor: `${dc.color}30`, background: 'rgba(12,18,30,0.95)' }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <DataClassBadge dc={node.dataClass} />
          <span className="text-[8px] px-1.5 py-0.5 rounded font-medium"
            style={{ color: risk.color, background: risk.bg }}>
            {risk.label}
          </span>
          <PermissionBadge state={node.sourcePermissionState} />
        </div>
        <span className="text-[9px] shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {formatRelativeWG(node.updatedAt)}
        </span>
      </div>
      <div className="text-xs font-semibold text-white mb-0.5 truncate">{node.title}</div>
      <div className="text-[10px] mb-1.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {isRestricted ? <span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5" />Content masked — DLP policy active</span> : node.summary}
      </div>
      <div className="flex items-center gap-3 text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <span>{SOURCE_LABELS[node.sourceSystem] ?? node.sourceSystem}</span>
        <span>·</span>
        <span>{node.owner}</span>
        <span>·</span>
        <span style={{ color: node.freshness === 'fresh' ? '#10b981' : node.freshness === 'stale' ? '#f59e0b' : '#ef4444' }}>
          {node.freshness}
        </span>
      </div>
    </div>
  );
}

function AnswerCard({ qa, onWorkcell }: { qa: typeof WORKGRAPH_ANSWERS[0]; onWorkcell: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(75,139,219,0.2)', background: 'rgba(12,18,30,0.95)' }}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start gap-2 mb-2">
          <Search className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
          <div className="text-xs font-semibold text-white">{qa.question}</div>
        </div>
        <div className="text-[11px] leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {expanded ? qa.answer : qa.answer.slice(0, 160) + '...'}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[9px] font-mono" style={{ color: '#10b981' }}>
            Confidence: {Math.round(qa.confidence * 100)}%
          </span>
          {qa.proofReady && (
            <span className="text-[9px] px-1.5 py-0.5 rounded"
              style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)' }}>
              Proof ready
            </span>
          )}
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {qa.evidenceSources.length} sources
          </span>
          <span className="text-[9px]" style={{ color: ACCENT, cursor: 'pointer' }}
            onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}>
            {expanded ? 'Show less' : 'Show full answer'}
          </span>
        </div>
      </div>
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div>
            <div className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Evidence Sources
            </div>
            <div className="space-y-1">
              {qa.evidenceSources.map((ev, i) => {
                const dc = DATA_CLASS_CONFIG[ev.dataClass];
                return (
                  <div key={i} className="flex items-center gap-2 text-[10px] p-2 rounded"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-[8px] px-1 py-0.5 rounded" style={{ color: dc.color, background: dc.bg }}>
                      {dc.label}
                    </span>
                    <span className="text-white truncate flex-1">{ev.title}</span>
                    <span className="text-[9px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {SOURCE_LABELS[ev.sourceSystem]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {qa.missingContext.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#f59e0b' }}>
                Missing Context
              </div>
              {qa.missingContext.map((m, i) => (
                <div key={i} className="text-[10px] flex items-center gap-1.5 mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <span style={{ color: '#f59e0b' }}>·</span> {m}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(75,139,219,0.06)', border: '1px solid rgba(75,139,219,0.15)' }}>
            <Shield className="w-3 h-3 shrink-0" style={{ color: 'rgba(75,139,219,0.7)' }} />
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{qa.permissionNotes}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-[10px] p-2 rounded" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', color: '#10b981' }}>
              Recommended: {qa.recommendedAction}
            </div>
            <button onClick={e => { e.stopPropagation(); onWorkcell(); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all hover:opacity-80 shrink-0"
              style={{ color: ACCENT, background: 'rgba(75,139,219,0.08)', borderColor: 'rgba(75,139,219,0.25)' }}>
              <Plus className="w-2.5 h-2.5" /> Create Workcell
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkGraphExplorer() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<'explorer' | 'answers'>('answers');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [workcellToast, setWorkcellToast] = useState<string | null>(null);

  const filtered = MOCK_NODES.filter(n => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.summary.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || n.type === typeFilter;
    return matchSearch && matchType;
  });

  const types = Array.from(new Set(MOCK_NODES.map(n => n.type)));

  function handleWorkcell(action: string) {
    setWorkcellToast(action);
    setTimeout(() => setWorkcellToast(null), 3000);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {workcellToast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xl"
          style={{ background: 'rgba(75,139,219,0.95)', border: '1px solid rgba(75,139,219,0.5)' }}>
          ✓ Workcell created: {workcellToast}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
              WorkGraph · Semantic Layer
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">WorkGraph Explorer & Answer Engine</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Query workspace data semantically. Every answer is permission-scoped, evidence-linked, and proof-ready.
          </p>
        </div>
        <DemoModeBadge />
      </div>

      <div className="flex gap-2 mb-1">
        {(['answers', 'explorer'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={{
              background: view === v ? 'rgba(75,139,219,0.12)' : 'transparent',
              borderColor: view === v ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.08)',
              color: view === v ? ACCENT : 'rgba(255,255,255,0.4)',
            }}>
            {v === 'answers' ? 'Answer Engine' : 'Graph Explorer'}
          </button>
        ))}
      </div>

      {view === 'answers' && (
        <div className="space-y-3">
          <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(12,18,30,0.8)' }}>
            <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Ask a question about your workspace data
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="e.g. What changed on the Q2 revenue review?"
                className="flex-1 bg-transparent text-xs text-white outline-none placeholder-gray-500"
              />
            </div>
          </div>
          <div className="space-y-3">
            {WORKGRAPH_ANSWERS
              .filter(qa => !search || qa.question.toLowerCase().includes(search.toLowerCase()))
              .map(qa => (
                <AnswerCard key={qa.id} qa={qa} onWorkcell={() => handleWorkcell(qa.workcellAction)} />
              ))}
          </div>
        </div>
      )}

      {view === 'explorer' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-2 rounded-lg border"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(12,18,30,0.8)' }}>
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search nodes by title or content..."
                className="flex-1 bg-transparent text-xs text-white outline-none placeholder-gray-500" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
              {['all', ...types].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className="px-2 py-1 rounded text-[9px] font-medium border transition-all capitalize"
                  style={{
                    background: typeFilter === t ? 'rgba(75,139,219,0.1)' : 'transparent',
                    borderColor: typeFilter === t ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.06)',
                    color: typeFilter === t ? ACCENT : 'rgba(255,255,255,0.35)',
                  }}>
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map(node => (
              <NodeCard key={node.id} node={node} onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No nodes match your search
            </div>
          )}
        </div>
      )}

      <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(75,139,219,0.15)', background: 'rgba(75,139,219,0.04)' }}>
        <div className="flex items-start gap-2">
          <Eye className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'rgba(75,139,219,0.6)' }} />
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <strong className="text-white">WorkGraph governance:</strong> Every answer is scoped to your permissions. Restricted sources are masked per DLP policy. Proof Packets reference evidence without exposing restricted content. All queries are traced.
          </div>
        </div>
      </div>
    </div>
  );
}
