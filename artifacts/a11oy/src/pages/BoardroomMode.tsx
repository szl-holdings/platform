import { Layout } from '../components/layout';
import { DemoBadge } from '../components/ui';

const KPIs = [
  { label: 'ACTIVE SIGNALS', value: '32', sub: '6 critical · 6 high', color: '#ef4444' },
  { label: 'ACTIONS PENDING', value: '2', sub: 'Human approval required', color: '#f59e0b' },
  { label: 'RESOLVED TODAY', value: '3', sub: 'With cryptographic proof', color: '#10b981' },
  { label: 'FABRIC HEALTH', value: '99.2%', sub: 'All 7 layers operational', color: '#3b82f6' },
  { label: 'APPROVALS TODAY', value: '12', sub: 'Zero silent executions', color: '#b08d52' },
  { label: 'PROOF ENTRIES', value: '5', sub: 'Immutable audit chain', color: '#8b5cf6' },
];

const DOMAIN_STATUS = [
  { domain: 'Maritime', status: 'ACTIVE', signal: 'MV Cascade — delay T+38h', color: '#3b82f6' },
  { domain: 'Legal', status: 'ACTIVE', signal: 'Talbot — T-48h discovery', color: '#6366f1' },
  { domain: 'Revenue', status: 'ACTIVE', signal: 'Pipeline velocity −22%', color: '#f59e0b' },
  { domain: 'Real Estate', status: 'MONITORING', signal: 'Cap rate +18bps', color: '#10b981' },
  { domain: 'Defense', status: 'MONITORING', signal: 'TG-Ember → ORANGE', color: '#8b5cf6' },
  { domain: 'Consulting', status: 'NOMINAL', signal: 'No active signals', color: '#ec4899' },
  { domain: 'Fabric Core', status: 'NOMINAL', signal: 'All layers healthy', color: '#b08d52' },
];

export function BoardroomMode() {
  return (
    <Layout fullscreen>
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: '#050810', color: '#f0f4fc' }}
      >
        <div
          className="flex items-center justify-between px-4 sm:px-10 py-4 sm:py-6 border-b flex-wrap gap-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-sm"
              style={{ backgroundColor: '#3b82f6', color: 'white' }}
            >
              A
            </div>
            <div>
              <div className="text-xl font-display font-semibold tracking-tight">A11oy</div>
              <div className="text-xs font-mono" style={{ color: '#4d607a' }}>LIVE ENTERPRISE EXECUTION FABRIC</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
              <span style={{ color: '#10b981' }}>Fabric operational</span>
            </div>
            <DemoBadge />
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-10 py-6 sm:py-10 overflow-x-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            {KPIs.map(kpi => (
              <div key={kpi.label} className="flex flex-col gap-1 p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs font-mono tracking-wider" style={{ color: '#4d607a', fontSize: '10px' }}>{kpi.label}</div>
                <div className="text-2xl sm:text-3xl font-display font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-xs" style={{ color: '#9bacc4' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <div className="text-xs font-mono tracking-widest mb-3" style={{ color: '#4d607a' }}>DOMAIN STATUS</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
              {DOMAIN_STATUS.map(d => (
                <div
                  key={d.domain}
                  className="p-3 sm:p-4 rounded-lg"
                  style={{ backgroundColor: `${d.color}08`, border: `1px solid ${d.color}20` }}
                >
                  <div className="text-xs font-mono mb-1.5" style={{ color: d.color }}>{d.domain}</div>
                  <div
                    className="text-xs font-bold mb-1.5"
                    style={{ color: d.status === 'ACTIVE' ? '#ef4444' : d.status === 'MONITORING' ? '#f59e0b' : '#10b981' }}
                  >
                    {d.status}
                  </div>
                  <div className="text-xs leading-snug" style={{ color: '#9bacc4' }}>{d.signal}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="md:col-span-2 p-4 sm:p-6 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xs font-mono tracking-widest mb-4" style={{ color: '#4d607a' }}>PIPELINE</div>
              <div className="flex items-center gap-0 overflow-x-auto">
                {['SENSE', 'STRUCTURE', 'CORRELATE', 'EXPLAIN', 'RECOMMEND', 'APPROVE', 'EXECUTE', 'VERIFY', 'PROVE'].map((stage, i, arr) => (
                  <div key={stage} className="flex items-center">
                    <div
                      className="px-3 py-2 rounded text-xs font-mono text-center whitespace-nowrap"
                      style={{
                        backgroundColor: i < 5 ? 'rgba(59,130,246,0.15)' : i === 5 ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.12)',
                        color: i < 5 ? '#3b82f6' : i === 5 ? '#8b5cf6' : '#10b981',
                        border: `1px solid ${i < 5 ? 'rgba(59,130,246,0.25)' : i === 5 ? 'rgba(139,92,246,0.35)' : 'rgba(16,185,129,0.2)'}`,
                      }}
                    >
                      {stage}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="px-1 text-xs" style={{ color: '#4d607a' }}>→</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs" style={{ color: '#4d607a' }}>
                No material action executes without human approval — APPROVE stage is non-bypassable.
              </div>
            </div>

            <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(176,141,82,0.06)', border: '1px solid rgba(176,141,82,0.15)' }}>
              <div className="text-xs font-mono tracking-widest mb-4" style={{ color: '#b08d52' }}>PROOF LEDGER</div>
              <div className="space-y-2">
                {[
                  { hash: 'sha256:c9f2e5b8...', domain: 'Maritime', ts: '04:32 UTC' },
                  { hash: 'sha256:e3a1d4f7...', domain: 'Finance', ts: '01:12 UTC' },
                  { hash: 'sha256:b8c3f9e2...', domain: 'Defense', ts: 'yesterday' },
                ].map(e => (
                  <div key={e.hash} className="text-xs">
                    <div className="font-mono" style={{ color: '#b08d52' }}>{e.hash}</div>
                    <div style={{ color: '#9bacc4' }}>{e.domain} · {e.ts}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-10 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: '#4d607a' }}>
            <span>A11oy — Live Enterprise Execution Fabric (pronounced "Alloy")</span>
            <DemoBadge />
          </div>
        </div>
      </div>
    </Layout>
  );
}
