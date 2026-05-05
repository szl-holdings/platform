import { useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, Bell, CheckCircle2, ChevronDown, ChevronRight,
  Cloud, Cpu, Database, Eye, FileText, Globe, Lock, Mail, RefreshCw,
  Search, Settings, Shield, ShieldAlert, ShieldOff, Zap
} from 'lucide-react';
import { cn } from '@szl-holdings/shared-ui/utils';
import { ADAPTERS, ADAPTERS_BY_CATEGORY, type IntegrationAdapter, type AdapterCategory } from '@/lib/integration-adapters';
import { ALLOWED_ACTION_CLASSES, DENIED_ACTION_CLASSES_DOCUMENTATION_ONLY } from '@/lib/policy-engine';

const CATEGORY_ICON: Record<string, typeof Shield> = {
  EDR: ShieldAlert,
  SIEM: Eye,
  SOAR: Zap,
  Identity: Database,
  Cloud: Cloud,
  Network: Globe,
  Vulnerability: AlertTriangle,
  Ticketing: FileText,
  'Threat Intelligence': Shield,
  'Email Security': Mail,
  'OT/SCADA': Cpu,
  'Data Loss Prevention': Lock,
  Deception: Activity,
};

const STATUS_CONFIG = {
  configured: { color: '#4ade80', label: 'CONFIGURED', icon: CheckCircle2 },
  not_configured: { color: '#8a8a8a', label: 'NOT CONFIGURED', icon: ShieldOff },
  error: { color: '#e05252', label: 'ERROR', icon: AlertTriangle },
  disabled: { color: '#8a8a8a', label: 'DISABLED', icon: ShieldOff },
};

const VENDOR_ICON: Record<string, string> = {
  Microsoft: '🔵', CrowdStrike: '🦅', Splunk: '🔴', Amazon: '🟠', Google: '🟡',
  GitHub: '⚙️', Cloudflare: '🌐', PagerDuty: '🔔', Atlassian: '🔷', ServiceNow: '🔹',
  Dragos: '🛡️', Tenable: '🔍', Proofpoint: '📧',
};

function AdapterCard({ adapter }: { adapter: IntegrationAdapter }) {
  const [expanded, setExpanded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latency_ms: number; message: string } | null>(null);
  const { meta } = adapter;
  const statusCfg = STATUS_CONFIG[meta.status];
  const StatusIcon = statusCfg.icon;
  const CatIcon = CATEGORY_ICON[meta.category] ?? Shield;

  async function handleTest() {
    setTesting(true);
    const result = await adapter.test();
    setTestResult(result);
    setTesting(false);
  }

  return (
    <div className={cn('rounded-lg border transition-all', expanded && 'border-[#c9b787]/20')}
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: expanded ? undefined : 'rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(x => !x)}>
        <div className="text-lg flex-shrink-0">{VENDOR_ICON[meta.vendor] ?? '🔌'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">{meta.name}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-500 border border-slate-700">{meta.category}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">{meta.description}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusIcon className="w-3.5 h-3.5" style={{ color: statusCfg.color }} />
          <span className="text-[9px] font-mono font-bold" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-4">
          {/* Safety notice */}
          <div className="p-3 rounded-md border text-[10px] font-mono leading-relaxed"
            style={{ background: 'rgba(201,183,135,0.04)', borderColor: 'rgba(201,183,135,0.12)', color: '#c9b787' }}>
            <strong>STUB ADAPTER — IN-APP ONLY.</strong> No real outbound calls are made. All action() calls return simulated responses.
            {meta.status === 'not_configured' && <><br /><strong>NOT CONFIGURED:</strong> action() returns "{'"Integration not configured. No action executed."'}"</>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supported actions */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Supported Defensive Actions</div>
              <div className="space-y-1">
                {meta.supported_actions.map(ac => (
                  <div key={ac} className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span className="font-mono text-slate-300">{ac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Connection fields */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Connection Fields</div>
              <div className="space-y-1">
                {meta.connection_fields.map(f => (
                  <div key={f.key} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: f.sensitive ? '#e05252' : '#8a8a8a' }} />
                    <span className="text-[11px] font-mono text-slate-400">{f.label}</span>
                    {f.sensitive && <span className="text-[9px] font-mono text-red-400">SENSITIVE</span>}
                    {f.optional && <span className="text-[9px] font-mono text-slate-600">OPTIONAL</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test connectivity */}
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Connectivity Test (Stub)</div>
            {meta.last_tested_at && (
              <div className="text-[10px] text-slate-600 font-mono mb-2">
                Last tested: {new Date(meta.last_tested_at).toLocaleString()} — {meta.test_result?.message}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button onClick={handleTest} disabled={testing}
                className="px-3 py-1.5 rounded text-[10px] font-mono border transition-all hover:border-[#c9b787]/40 disabled:opacity-50"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#c9b787' }}>
                {testing ? <><RefreshCw className="w-3 h-3 inline animate-spin mr-1" />Testing…</> : 'Run Connectivity Test'}
              </button>
              {testResult && (
                <span className="text-[10px] font-mono" style={{ color: testResult.ok ? '#4ade80' : '#e05252' }}>
                  {testResult.ok ? '✓' : '✗'} {testResult.message} ({testResult.latency_ms}ms)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-600">
            <span>Vendor: {meta.vendor}</span>
            <span>ID: {meta.id}</span>
            <a href={meta.documentation_url} target="_blank" rel="noreferrer"
              className="text-[#c9b787] hover:underline">Docs →</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntegrationsHub() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AdapterCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'configured' | 'not_configured'>('all');

  const categories = Object.keys(ADAPTERS_BY_CATEGORY) as AdapterCategory[];

  const filtered = ADAPTERS.filter(a => {
    if (categoryFilter !== 'all' && a.meta.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && a.meta.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.meta.name.toLowerCase().includes(q) || a.meta.vendor.toLowerCase().includes(q) || a.meta.category.toLowerCase().includes(q);
    }
    return true;
  });

  const configuredCount = ADAPTERS.filter(a => a.meta.status === 'configured').length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-[#c9b787]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Sentra — Integrations Hub</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-100">Integration Adapter Hub</h1>
        <p className="text-sm text-slate-500 mt-1">Stub adapters for defensive security integrations. All adapters enforce the Safety Gate — no offensive actions callable.</p>
      </div>

      {/* Safety gate doctrine */}
      <div className="rounded-lg border p-4 space-y-2" style={{ background: 'rgba(201,183,135,0.04)', borderColor: 'rgba(201,183,135,0.15)' }}>
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#c9b787]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9b787]">Safety Gate Enforcement</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-mono">
          <div>
            <div className="text-green-400 mb-1">✓ ALLOWED ACTION CLASSES ({ALLOWED_ACTION_CLASSES.length})</div>
            <div className="flex flex-wrap gap-1">
              {ALLOWED_ACTION_CLASSES.map(ac => (
                <span key={ac} className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">{ac}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-red-400 mb-1">✗ DENIED (DOCUMENTED ONLY — NO CODE PATH)</div>
            <div className="flex flex-wrap gap-1">
              {DENIED_ACTION_CLASSES_DOCUMENTATION_ONLY.slice(0, 8).map(ac => (
                <span key={ac} className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 line-through">{ac}</span>
              ))}
              <span className="text-slate-500">+{DENIED_ACTION_CLASSES_DOCUMENTATION_ONLY.length - 8} more…</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Adapters', value: ADAPTERS.length },
          { label: 'Configured', value: configuredCount, color: '#4ade80' },
          { label: 'Not Configured', value: ADAPTERS.length - configuredCount, color: '#8a8a8a' },
          { label: 'Categories', value: categories.length },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border p-4" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">{label}</div>
            <div className="text-2xl font-display font-bold" style={{ color: color ?? '#f5f5f5' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search integrations…"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#c9b787]/40" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as AdapterCategory | 'all')}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-400 outline-none">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | 'configured' | 'not_configured')}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-400 outline-none">
          <option value="all">All Status</option>
          <option value="configured">Configured</option>
          <option value="not_configured">Not Configured</option>
        </select>
        <span className="text-[10px] font-mono text-slate-600">{filtered.length} adapters</span>
      </div>

      {/* By category */}
      {categoryFilter === 'all' ? (
        categories.map(cat => {
          const catAdapters = filtered.filter(a => a.meta.category === cat);
          if (catAdapters.length === 0) return null;
          const CatIcon = CATEGORY_ICON[cat] ?? Shield;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <CatIcon className="w-3.5 h-3.5 text-[#c9b787]" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{cat}</span>
                <span className="text-[10px] font-mono text-slate-600">{catAdapters.length}</span>
              </div>
              <div className="space-y-2">
                {catAdapters.map(a => <AdapterCard key={a.meta.id} adapter={a} />)}
              </div>
            </div>
          );
        })
      ) : (
        <div className="space-y-2">
          {filtered.map(a => <AdapterCard key={a.meta.id} adapter={a} />)}
        </div>
      )}
    </div>
  );
}
