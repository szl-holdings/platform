import { useState } from 'react';
import { Layers, Mail, FileText, MessageSquare, Calendar, CheckSquare, Play, Zap, TrendingUp, AlertTriangle, Clock, Shield } from 'lucide-react';
import { WORKSPACE_CONNECTORS, MOCK_NODES, PROJECT_MEMORY, PROOF_PACKETS, DATA_CLASS_CONFIG, RISK_CONFIG, SOURCE_LABELS, formatRelativeWG } from '@/alloy/data/workgraph';
import { useLocation } from 'wouter';

const ACCENT = '#4B8BDB';

const DOMAIN_TILES = [
  { label: 'Email', icon: Mail, source: 'email_provider', count: 40, badge: '2 unread flagged', color: '#4B8BDB' },
  { label: 'Docs & Drive', icon: FileText, source: 'document_editor', count: 23, badge: '1 restricted', color: '#8b5cf6' },
  { label: 'Chat', icon: MessageSquare, source: 'chat_platform', count: 18, badge: '1 critical thread', color: '#f59e0b' },
  { label: 'Calendar', icon: Calendar, source: 'calendar_app', count: 12, badge: 'Weekly review today', color: '#10b981' },
  { label: 'Tasks', icon: CheckSquare, source: 'task_manager', count: 35, badge: '3 overdue', color: '#ef4444' },
  { label: 'Meetings', icon: Play, source: 'video_meetings', count: 8, badge: '2 summaries pending', color: '#06b6d4' },
];

function StatCard({ label, value, sublabel, color, icon: Icon, risk }: { label: string; value: string | number; sublabel?: string; color?: string; icon?: any; risk?: string }) {
  const c = color ?? ACCENT;
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.95)' }}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[9px] uppercase tracking-widest font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</div>
        {Icon && <Icon className="w-3.5 h-3.5" style={{ color: c }} />}
      </div>
      <div className="text-xl font-bold" style={{ color: c }}>{value}</div>
      {sublabel && <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{sublabel}</div>}
      {risk && <div className="text-[9px] mt-1 px-1.5 py-0.5 rounded inline-block font-medium" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>{risk}</div>}
    </div>
  );
}

function ConnectorPill({ name, health, demoMode }: { name: string; health: string; demoMode: boolean }) {
  const colors: Record<string, string> = {
    healthy: '#10b981',
    demo: '#f59e0b',
    degraded: '#f97316',
    error: '#ef4444',
  };
  const c = colors[health] ?? '#6b7280';
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border"
      style={{ borderColor: `${c}25`, background: `${c}08`, color: c }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
      {name}
      {demoMode && <span className="text-[8px] opacity-50">demo</span>}
    </div>
  );
}

function ProjectRiskRow({ p, onClick }: { p: typeof PROJECT_MEMORY[0]; onClick: () => void }) {
  const risk = RISK_CONFIG[p.riskLevel];
  const statusColors: Record<string, string> = {
    active: '#10b981', at_risk: '#f59e0b', blocked: '#ef4444', completed: '#4B8BDB',
  };
  const sc = statusColors[p.status] ?? '#6b7280';
  return (
    <div onClick={onClick} className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-opacity-60"
      style={{ borderColor: `${risk.color}20`, background: 'rgba(12,18,30,0.9)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="text-xs font-semibold text-white truncate">{p.name}</div>
          <span className="text-[8px] px-1.5 py-0.5 rounded capitalize font-medium shrink-0"
            style={{ color: sc, background: `${sc}10` }}>
            {p.status.replace('_', ' ')}
          </span>
        </div>
        <div className="text-[10px] mb-1.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.summary}</div>
        <div className="text-[9px]" style={{ color: '#f59e0b' }}>{p.recommendedAction}</div>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <div className="text-[9px] font-mono" style={{ color: risk.color }}>{risk.label} risk</div>
        <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{p.proofCoverage}% proof</div>
        <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatRelativeWG(p.lastMeaningfulChange)}</div>
      </div>
    </div>
  );
}

function NodeSummaryRow({ node }: { node: typeof MOCK_NODES[0] }) {
  const dc = DATA_CLASS_CONFIG[node.dataClass];
  const risk = RISK_CONFIG[node.riskLevel];
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg border"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-medium text-white truncate">{node.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[8px]" style={{ color: dc.color }}>{dc.label}</span>
          <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{SOURCE_LABELS[node.sourceSystem]}</span>
          <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{node.owner}</span>
        </div>
      </div>
      <span className="text-[8px] font-medium shrink-0" style={{ color: risk.color }}>{risk.label}</span>
    </div>
  );
}

export default function WorkspaceIntelligence() {
  const [, navigate] = useLocation();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const criticalNodes = MOCK_NODES.filter(n => n.riskLevel === 'critical' || n.riskLevel === 'high').slice(0, 4);
  const atRiskProjects = PROJECT_MEMORY.filter(p => p.status !== 'completed').slice(0, 5);
  const recentProof = PROOF_PACKETS.slice(0, 5);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xl"
          style={{ background: 'rgba(75,139,219,0.95)', border: '1px solid rgba(75,139,219,0.5)' }}>
          ✓ {toastMsg}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
              Alloy WorkGraph · Workspace Intelligence
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Workspace Intelligence Home</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Emails, docs, meetings, chats, and approvals — normalized, governed, and ready for action.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border"
          style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
          <Zap className="w-2.5 h-2.5" /> Demo Workspace Connector
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {WORKSPACE_CONNECTORS.slice(0, 8).map(c => (
          <ConnectorPill key={c.id} name={c.name} health={c.health} demoMode={c.demoMode} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="WorkGraph Nodes" value={MOCK_NODES.length} sublabel="across all sources" icon={Layers} />
        <StatCard label="Projects Tracked" value={PROJECT_MEMORY.length} sublabel={`${PROJECT_MEMORY.filter(p => p.status === 'at_risk').length} at risk`} icon={TrendingUp} color="#f59e0b" />
        <StatCard label="Proof Packets" value={PROOF_PACKETS.length} sublabel={`${PROOF_PACKETS.filter(p => p.status === 'verified').length} verified`} icon={Shield} color="#10b981" />
        <StatCard label="Avg Decision Latency" value="4.2d" sublabel="vs. 2d target" icon={Clock} color="#ef4444" risk="Above target" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-[9px] uppercase tracking-widest mb-2 font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Projects Needing Attention
          </div>
          <div className="space-y-2">
            {atRiskProjects.map(p => (
              <ProjectRiskRow key={p.id} p={p} onClick={() => navigate('/alloy/workspace/projects')} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[9px] uppercase tracking-widest mb-2 font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              High-Risk WorkGraph Nodes
            </div>
            <div className="space-y-2">
              {criticalNodes.map(n => (
                <NodeSummaryRow key={n.id} node={n} />
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest mb-2 font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Recent Proof Packets
            </div>
            <div className="space-y-1.5">
              {recentProof.map(pp => {
                const dc = DATA_CLASS_CONFIG[pp.dataClass];
                const statusColors: Record<string, string> = { verified: '#10b981', pending_review: '#f59e0b', draft: '#6b7280' };
                const sc = statusColors[pp.status] ?? '#6b7280';
                return (
                  <div key={pp.id} className="flex items-center gap-2 p-2 rounded-lg border"
                    style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-medium" style={{ color: dc.color, background: dc.bg }}>
                      {dc.label}
                    </span>
                    <span className="text-[10px] text-white truncate flex-1">{pp.title}</span>
                    <span className="text-[8px] font-medium shrink-0" style={{ color: sc }}>{pp.status.replace('_', ' ')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[9px] uppercase tracking-widest mb-2 font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Workspace Source Coverage
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {DOMAIN_TILES.map(tile => {
            const Icon = tile.icon;
            return (
              <div key={tile.label} className="rounded-xl border p-3 flex items-start gap-3"
                style={{ borderColor: `${tile.color}20`, background: 'rgba(12,18,30,0.9)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${tile.color}15`, border: `1px solid ${tile.color}25` }}>
                  <Icon className="w-4 h-4" style={{ color: tile.color }} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{tile.label}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{tile.count} nodes synced</div>
                  <div className="text-[9px] mt-0.5" style={{ color: tile.color }}>{tile.badge}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(75,139,219,0.15)', background: 'rgba(75,139,219,0.04)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} />
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <strong className="text-white">Demo Mode:</strong> All data is synthetic. No real workspace credentials are stored or transmitted. Connector scopes are displayed for governance transparency only. Connect real credentials in Admin to go live.
          </div>
        </div>
      </div>
    </div>
  );
}
