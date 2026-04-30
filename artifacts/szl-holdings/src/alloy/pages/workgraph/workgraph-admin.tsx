import { useState } from 'react';
import { Settings, Shield, Database, Users, AlertTriangle, CheckCircle, ToggleLeft, ToggleRight, Eye, Lock, Zap } from 'lucide-react';
import { WORKSPACE_CONNECTORS, DEMO_POLICIES, DATA_CLASS_CONFIG, RISK_CONFIG, SOURCE_LABELS, formatRelativeWG } from '@/alloy/data/workgraph';

const ACCENT = '#4B8BDB';

const TABS = ['Connectors', 'DLP Policies', 'Data Classes', 'Audit Log'];

const MOCK_AUDIT_LOG = [
  { id: 'al001', actor: 'Sarah Chen (VP Revenue Ops)', action: 'Ran WorkGraph Answer Engine', detail: 'Query: What changed on Q2 revenue review?', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), dataClass: 'confidential', riskLevel: 'medium' as const },
  { id: 'al002', actor: 'A11oy Skill: Approval Chase', action: 'Created Proof Packet', detail: 'PP: Acme Corp Renewal — CFO Approval Chase', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), dataClass: 'confidential', riskLevel: 'high' as const },
  { id: 'al003', actor: 'Dev Patel (CISO)', action: 'Viewed Security Proof Packet', detail: 'PP: Security Incident SEC-2026-047', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), dataClass: 'security', riskLevel: 'critical' as const },
  { id: 'al004', actor: 'A11oy Skill: Board Packet from Workspace', action: 'DLP policy triggered — restricted content masked', detail: 'Q2 Revenue Board Report restricted. Proof reference only.', timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), dataClass: 'restricted', riskLevel: 'high' as const },
  { id: 'al005', actor: 'Marcus Webb (CFO)', action: 'Exported Proof Packet', detail: 'PP: Invoice Discrepancy — CloudOps', timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), dataClass: 'finance', riskLevel: 'medium' as const },
  { id: 'al006', actor: 'A11oy Skill: Meeting to Execution', action: 'Workcell created from meeting summary', detail: 'Meeting: Q2 Revenue Operations Review', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), dataClass: 'confidential', riskLevel: 'medium' as const },
  { id: 'al007', actor: 'Ana Torres (GC)', action: 'Approved escalation draft', detail: 'Skill: Legal Deadline Proof Review', timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), dataClass: 'legal', riskLevel: 'high' as const },
  { id: 'al008', actor: 'Admin System', action: 'Connector health check — all connectors demo mode', detail: 'Demo Workspace Connector active — no real credentials', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), dataClass: 'internal', riskLevel: 'low' as const },
];

function ConnectorRow({ connector }: { connector: typeof WORKSPACE_CONNECTORS[0] }) {
  const [enabled, setEnabled] = useState(connector.enabled);
  const healthColors: Record<string, string> = {
    healthy: '#10b981',
    demo: '#f59e0b',
    degraded: '#f97316',
    error: '#ef4444',
  };
  const hc = healthColors[connector.health] ?? '#6b7280';
  const risk = RISK_CONFIG[connector.riskLevel];

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border"
      style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.9)' }}>
      <div className="w-7 h-7 rounded shrink-0 flex items-center justify-center"
        style={{ background: `${hc}12`, border: `1px solid ${hc}20` }}>
        <Database className="w-3.5 h-3.5" style={{ color: hc }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-semibold text-white">{connector.name}</span>
          <span className="text-[8px] px-1 py-0.5 rounded" style={{ color: hc, background: `${hc}10` }}>
            {connector.health}
          </span>
          <span className="text-[8px] px-1 py-0.5 rounded" style={{ color: risk.color, background: risk.bg }}>
            {risk.label} risk
          </span>
        </div>
        <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {connector.syncCount} syncs · Last: {formatRelativeWG(connector.lastSyncAt)} · Scopes: {connector.requiredScopes.join(', ')}
        </div>
      </div>
      <button onClick={() => setEnabled(x => !x)}
        className="flex items-center gap-1 transition-all shrink-0"
        title={enabled ? 'Disable connector' : 'Enable connector'}>
        {enabled
          ? <ToggleRight className="w-5 h-5" style={{ color: ACCENT }} />
          : <ToggleLeft className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.2)' }} />
        }
      </button>
    </div>
  );
}

function PolicyRow({ policy }: { policy: typeof DEMO_POLICIES[0] }) {
  const dc = DATA_CLASS_CONFIG[policy.dataClass];
  return (
    <div className="p-3 rounded-xl border" style={{ borderColor: `${dc.color}20`, background: 'rgba(12,18,30,0.9)' }}>
      <div className="flex items-start gap-2 mb-1.5">
        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: dc.color }} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-semibold text-white">{policy.name}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ color: dc.color, background: dc.bg }}>
              {dc.label}
            </span>
            {policy.enforced && (
              <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)' }}>
                Enforced
              </span>
            )}
          </div>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{policy.rule}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {policy.blockedActions.map(a => (
          <span key={a} className="text-[8px] px-1.5 py-0.5 rounded font-mono"
            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            Blocks: {a}
          </span>
        ))}
      </div>
    </div>
  );
}

function DataClassRow({ dc, cfg }: { dc: string; cfg: typeof DATA_CLASS_CONFIG[keyof typeof DATA_CLASS_CONFIG] }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border"
      style={{ borderColor: `${cfg.color}15`, background: 'rgba(12,18,30,0.9)' }}>
      <span className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-[10px] font-bold"
        style={{ color: cfg.color, background: cfg.bg }}>
        {cfg.label.slice(0, 2).toUpperCase()}
      </span>
      <div className="flex-1">
        <div className="text-[10px] font-semibold text-white capitalize">{dc}</div>
        <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{cfg.label} classification</div>
      </div>
      <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
    </div>
  );
}

function AuditRow({ entry }: { entry: typeof MOCK_AUDIT_LOG[0] }) {
  const dc = DATA_CLASS_CONFIG[entry.dataClass as keyof typeof DATA_CLASS_CONFIG];
  const risk = RISK_CONFIG[entry.riskLevel];
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg border"
      style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
      <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: risk.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[9px] font-semibold text-white">{entry.action}</span>
          <span className="text-[8px] px-1 py-0.5 rounded" style={{ color: dc.color, background: dc.bg }}>
            {dc.label}
          </span>
        </div>
        <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{entry.detail}</div>
        <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {entry.actor} · {formatRelativeWG(entry.timestamp)}
        </div>
      </div>
    </div>
  );
}

export default function WorkGraphAdmin() {
  const [tab, setTab] = useState('Connectors');

  const activeConnectors = WORKSPACE_CONNECTORS.filter(c => c.enabled).length;
  const demoConnectors = WORKSPACE_CONNECTORS.filter(c => c.demoMode).length;
  const enforcedPolicies = DEMO_POLICIES.filter(p => p.enforced).length;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
              Alloy WorkGraph · Admin Control Center
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Control Center</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Connector configuration, DLP policies, data class governance, and full audit log.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border"
          style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
          <Zap className="w-2.5 h-2.5" /> Demo Mode
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Connectors', value: activeConnectors, color: '#10b981', sublabel: `${demoConnectors} demo` },
          { label: 'Enforced Policies', value: enforcedPolicies, color: ACCENT, sublabel: `of ${DEMO_POLICIES.length} total` },
          { label: 'Data Classes', value: Object.keys(DATA_CLASS_CONFIG).length, color: '#8b5cf6', sublabel: 'governance tiers' },
          { label: 'Audit Events', value: MOCK_AUDIT_LOG.length, color: '#f59e0b', sublabel: 'last 30 days' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.95)' }}>
            <div className="text-[9px] uppercase tracking-widest font-mono mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.sublabel}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-3 py-2 text-xs font-medium border-b-2 transition-all"
            style={{
              borderBottomColor: tab === t ? ACCENT : 'transparent',
              color: tab === t ? ACCENT : 'rgba(255,255,255,0.35)',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Connectors' && (
        <div>
          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-xl border"
            style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.06)' }}>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} />
            <div className="text-[10px]" style={{ color: '#f59e0b' }}>
              All connectors running in Demo Mode. Connect real credentials to go live. Scopes declared for governance transparency.
            </div>
          </div>
          <div className="space-y-2">
            {WORKSPACE_CONNECTORS.map(c => (
              <ConnectorRow key={c.id} connector={c} />
            ))}
          </div>
        </div>
      )}

      {tab === 'DLP Policies' && (
        <div className="space-y-3">
          {DEMO_POLICIES.map(policy => (
            <PolicyRow key={policy.id} policy={policy} />
          ))}
        </div>
      )}

      {tab === 'Data Classes' && (
        <div className="grid md:grid-cols-2 gap-2">
          {Object.entries(DATA_CLASS_CONFIG).map(([dc, cfg]) => (
            <DataClassRow key={dc} dc={dc} cfg={cfg} />
          ))}
        </div>
      )}

      {tab === 'Audit Log' && (
        <div className="space-y-2">
          {MOCK_AUDIT_LOG.map(entry => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(75,139,219,0.15)', background: 'rgba(75,139,219,0.04)' }}>
        <div className="flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'rgba(75,139,219,0.6)' }} />
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <strong className="text-white">Admin governance:</strong> Connector access is admin-controlled. DLP policies are enforced at the skill layer — no skill can bypass declared policies. All admin actions are logged in the tamper-evident Audit Log. Data class changes require admin approval.
          </div>
        </div>
      </div>
    </div>
  );
}
