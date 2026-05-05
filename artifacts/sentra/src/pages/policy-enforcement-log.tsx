import { useEffect, useState } from 'react';
import { CheckCircle2, Filter, RefreshCw, Search, Shield, ShieldOff, XCircle } from 'lucide-react';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useSentraStore, ensureSeeded } from '@/lib/sentra-store';
import { SENTRA_DENIAL_MESSAGE } from '@/lib/policy-engine';

export default function PolicyEnforcementLog() {
  useEffect(() => { ensureSeeded(); }, []);
  const store = useSentraStore();

  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | 'allow' | 'deny'>('all');
  const [classFilter, setClassFilter] = useState('all');

  const logs = [...store.policyLogs].reverse();
  const filtered = logs.filter(l => {
    if (resultFilter !== 'all' && l.policy_result !== resultFilter) return false;
    if (classFilter !== 'all' && l.action_class !== classFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.target.toLowerCase().includes(q) || l.action_class.toLowerCase().includes(q) || l.requested_by.toLowerCase().includes(q);
    }
    return true;
  });

  const uniqueClasses = [...new Set(store.policyLogs.map(l => l.action_class))];
  const allowCount = store.policyLogs.filter(l => l.policy_result === 'allow').length;
  const denyCount = store.policyLogs.filter(l => l.policy_result === 'deny').length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-[#c9b787]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Sentra — Policy Enforcement Log</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-100">Policy Enforcement Log</h1>
        <p className="text-sm text-slate-500 mt-1">Every action evaluated by the Sentra Policy Gate is logged here with doctrine citations and denial messages.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Evaluations', value: store.policyLogs.length },
          { label: 'Allowed', value: allowCount, color: '#4ade80' },
          { label: 'Denied', value: denyCount, color: '#e05252' },
          { label: 'Deny Rate', value: store.policyLogs.length > 0 ? `${((denyCount / store.policyLogs.length) * 100).toFixed(1)}%` : '—', color: denyCount > 0 ? '#f59e0b' : '#8a8a8a' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border p-4" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">{label}</div>
            <div className="text-2xl font-display font-bold" style={{ color: color ?? '#f5f5f5' }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-3 text-[10px] font-mono text-slate-500 leading-relaxed"
        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <span className="text-[#c9b787] font-bold">DENIAL MESSAGE (exact): </span>
        {SENTRA_DENIAL_MESSAGE}
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs…"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#c9b787]/40" />
        </div>
        <select value={resultFilter} onChange={e => setResultFilter(e.target.value as 'all' | 'allow' | 'deny')}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-400 outline-none">
          <option value="all">All Results</option>
          <option value="allow">Allow</option>
          <option value="deny">Deny</option>
        </select>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-400 outline-none">
          <option value="all">All Action Classes</option>
          {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-[10px] font-mono text-slate-600">{filtered.length} records</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border p-8 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Shield className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <div className="text-sm text-slate-600">No policy log entries yet</div>
          <div className="text-[11px] text-slate-700 mt-1">Try running an action from the Containment Actions page</div>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700/50 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                {['Time', 'Result', 'Action Class', 'Target', 'Integration', 'Requested By', 'Reason'].map(h => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className={cn('border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors',
                  log.policy_result === 'deny' && 'bg-red-500/5')}>
                  <td className="px-4 py-3 text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    {log.policy_result === 'allow' ? (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-green-400">
                        <CheckCircle2 className="w-3 h-3" /> ALLOW
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-red-400">
                        <ShieldOff className="w-3 h-3" /> DENY
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[10px] font-mono text-[#c9b787] whitespace-nowrap">{log.action_class}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-slate-300 max-w-[160px] truncate">{log.target}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-slate-500">{log.integration ?? '—'}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-slate-500 whitespace-nowrap">{log.requested_by}</td>
                  <td className="px-4 py-3 text-[10px] text-slate-400 max-w-[200px] truncate" title={log.reason}>{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-800 text-[10px] text-slate-600 font-mono">
            {filtered.length} of {store.policyLogs.length} policy decisions
          </div>
        </div>
      )}
    </div>
  );
}
