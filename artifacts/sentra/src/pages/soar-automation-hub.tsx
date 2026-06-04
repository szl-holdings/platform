import { cn } from '@szl-holdings/shared-ui/utils';
import {
  BookOpen,
  Download,
  GitBranch,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Upload,
  Workflow,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  type SoarAutomationResponse,
  getSoarAutomationPage,
} from '../lib/sentra-api';

const STAGE_COLORS: Record<string, string> = {
  build: '#8a8a8a',
  test: '#c9b787',
  staging: '#c9b787',
  production: '#c9b787',
};

const PIPELINE_STATUS_COLORS: Record<string, string> = {
  success: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  running: 'text-[#8a8a8a] border-[#8a8a8a]/30 bg-[#8a8a8a]/10',
  failed: 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Email Security': '#c9b787',
  'Incident Response': '#f5f5f5',
  'Threat Analysis': '#8a8a8a',
  'Identity Protection': '#c9b787',
  'Vulnerability Management': '#c9b787',
  'Cloud Security': '#8a8a8a',
  'Data Protection': '#c9b787',
  'Insider Risk': '#f5f5f5',
  'Threat Intelligence': '#8a8a8a',
};

export default function SOARAutomationHub() {
  const [data, setData] = useState<SoarAutomationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getSoarAutomationPage()
      .then((res) => {
        if (!active) return;
        if (!res) {
          setError('Unable to load SOAR Automation data.');
        } else {
          setData(res);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-xs text-zinc-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading SOAR Automation data…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[#f5f5f5]/30 bg-[#f5f5f5]/5 p-4 text-xs text-[#f5f5f5]">
          {error ?? 'SOAR Automation data unavailable.'}
        </div>
      </div>
    );
  }

  const { totalTemplates, playbookTemplates, xdrSyncItems, pipelineStatus } = data;
  const categories = [...new Set(playbookTemplates.map((p) => p.category))];

  const filtered = playbookTemplates.filter((p) => {
    const matchesSearch = !searchFilter || p.name.toLowerCase().includes(searchFilter.toLowerCase()) || p.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Workflow className="w-5 h-5 text-[#c9b787]" />
            <h1 className="text-lg font-semibold text-white">SOAR Automation Hub</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#c9b787]/30 bg-[#c9b787]/10 text-[#c9b787] font-mono uppercase">
              XSOAR-Inspired
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Visual playbook library, COPS-format import/export, bi-directional XDR sync, and CI/CD pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-zinc-400 hover:text-white transition-colors">
            <Upload className="w-3 h-3" /> Import COPS
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-zinc-400 hover:text-white transition-colors">
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Playbook Templates', value: totalTemplates.toString(), sub: `${playbookTemplates.length} shown`, color: '#c9b787', icon: BookOpen },
          { label: 'Total Executions', value: playbookTemplates.reduce((s, p) => s + p.uses, 0).toLocaleString(), sub: 'across all playbooks', color: '#8a8a8a', icon: Play },
          { label: 'XDR Incidents Synced', value: xdrSyncItems.filter(x => x.status === 'synced').length.toString(), sub: `${xdrSyncItems.length} total`, color: '#c9b787', icon: RefreshCw },
          { label: 'CI/CD Pipeline Health', value: `${pipelineStatus.filter(p => p.status === 'success').length}/${pipelineStatus.length}`, sub: 'deployments passing', color: '#c9b787', icon: GitBranch },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-xl font-bold text-white font-mono">{m.value}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#c9b787]" />
            Visual Playbook Library ({totalTemplates} templates)
          </h2>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2 w-3 h-3 text-zinc-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search playbooks..."
              className="w-full bg-white/3 border border-white/8 rounded-lg pl-7 pr-3 py-1.5 text-[10px] text-white placeholder:text-zinc-600 outline-none focus:border-white/20"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
          <button onClick={() => setCategoryFilter(null)} className={cn(
            'text-[10px] px-2 py-1 rounded border transition-colors shrink-0',
            !categoryFilter ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-zinc-500 hover:text-zinc-300',
          )}>
            All
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)} className={cn(
              'text-[10px] px-2 py-1 rounded border transition-colors shrink-0',
              categoryFilter === cat ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-zinc-500 hover:text-zinc-300',
            )}>
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {filtered.map((pb) => (
            <div key={pb.id} className="rounded-xl border border-white/8 bg-white/3 p-4 hover:border-white/15 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[11px] font-medium text-white block mb-0.5">{pb.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border" style={{
                    color: CATEGORY_COLORS[pb.category] ?? '#8a8a8a',
                    borderColor: `${CATEGORY_COLORS[pb.category] ?? '#8a8a8a'}30`,
                    background: `${CATEGORY_COLORS[pb.category] ?? '#8a8a8a'}10`,
                  }}>
                    {pb.category}
                  </span>
                </div>
                {pb.copsFormat && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8a8a8a]/10 text-[#8a8a8a] border border-[#8a8a8a]/20 font-mono">COPS</span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 mb-2 leading-relaxed line-clamp-2">{pb.description}</p>
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {pb.integrations.map((int) => (
                  <span key={int} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">{int}</span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                <span>{pb.steps} steps</span>
                <span>{pb.uses.toLocaleString()} runs</span>
                <span>Updated {pb.lastUpdated}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-[#c9b787]" />
            Bi-Directional XDR Incident Sync
          </h2>
          <div className="space-y-2">
            {xdrSyncItems.map((item) => (
              <div key={item.id} className={cn(
                'rounded-xl border p-3',
                item.status === 'conflict' ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/3' : 'border-white/8 bg-white/3',
              )}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-white">{item.source}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">{item.incidentId}</span>
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded border',
                      item.direction === 'inbound' ? 'text-[#8a8a8a] border-[#8a8a8a]/30 bg-[#8a8a8a]/10' : 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
                    )}>
                      {item.direction === 'inbound' ? '← Inbound' : '→ Outbound'}
                    </span>
                  </div>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded border',
                    item.status === 'synced' ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10' :
                    item.status === 'conflict' ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10' :
                    'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
                  )}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span>{item.severity}</span>
                  <span>Last sync: {item.lastSync}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-[#c9b787]" />
            Playbook CI/CD Pipeline
          </h2>
          <div className="space-y-2">
            {pipelineStatus.map((pipeline) => {
              const stageOrder = ['build', 'test', 'staging', 'production'];
              const currentIdx = stageOrder.indexOf(pipeline.stage);
              return (
                <div key={pipeline.id} className={cn(
                  'rounded-xl border p-3',
                  pipeline.status === 'failed' ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/3' : 'border-white/8 bg-white/3',
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-white">{pipeline.playbook}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">{pipeline.version}</span>
                    </div>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded border', PIPELINE_STATUS_COLORS[pipeline.status])}>
                      {pipeline.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {stageOrder.map((stage, i) => {
                      const isComplete = i < currentIdx;
                      const isCurrent = i === currentIdx;
                      return (
                        <div key={stage} className="flex items-center gap-1 flex-1">
                          <div className={cn(
                            'flex-1 h-1.5 rounded-full transition-all',
                            isComplete ? 'bg-[#c9b787]/60' :
                            isCurrent && pipeline.status === 'success' ? 'bg-[#c9b787]/60' :
                            isCurrent && pipeline.status === 'running' ? 'bg-[#8a8a8a]/60 animate-pulse' :
                            isCurrent && pipeline.status === 'failed' ? 'bg-[#f5f5f5]/60' :
                            'bg-white/5',
                          )} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[9px] text-zinc-500">
                    <span className="capitalize" style={{ color: STAGE_COLORS[pipeline.stage] }}>{pipeline.stage}</span>
                    <span>{pipeline.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
