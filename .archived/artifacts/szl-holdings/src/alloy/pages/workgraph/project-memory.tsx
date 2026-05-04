import { useState } from 'react';
import { BookOpen, TrendingUp, AlertTriangle, CheckCircle, Clock, Shield, Zap, ChevronRight } from 'lucide-react';
import { PROJECT_MEMORY, RISK_CONFIG, formatRelativeWG } from '@/alloy/data/workgraph';

const ACCENT = '#4B8BDB';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    active: { color: '#10b981', label: 'Active' },
    at_risk: { color: '#f59e0b', label: 'At Risk' },
    blocked: { color: '#ef4444', label: 'Blocked' },
    completed: { color: '#4B8BDB', label: 'Completed' },
  };
  const c = cfg[status] ?? { color: '#6b7280', label: status };
  return (
    <span className="text-[8px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
      style={{ color: c.color, background: `${c.color}12` }}>
      {c.label}
    </span>
  );
}

function ProofMeter({ value }: { value: number }) {
  const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: typeof PROJECT_MEMORY[0]; onClick: () => void }) {
  const risk = RISK_CONFIG[project.riskLevel];
  return (
    <div onClick={onClick}
      className="rounded-xl border p-4 cursor-pointer transition-all hover:border-opacity-60"
      style={{ borderColor: `${risk.color}20`, background: 'rgba(12,18,30,0.95)' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="text-xs font-bold text-white mb-0.5">{project.name}</div>
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            <span className="text-[8px] font-medium px-1 py-0.5 rounded" style={{ color: risk.color, background: risk.bg }}>
              {risk.label} risk
            </span>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
      </div>

      <div className="text-[10px] mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {project.summary}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Nodes', value: project.linkedNodeCount },
          { label: 'Workcells', value: project.workcellCount },
          { label: 'Outcomes', value: project.outcomeCount },
        ].map(stat => (
          <div key={stat.label} className="text-center p-1.5 rounded"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-sm font-bold text-white">{stat.value}</div>
            <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-[9px]">
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>Proof coverage</span>
          <ProofMeter value={project.proofCoverage} />
        </div>
        <div className="flex items-center justify-between text-[9px]">
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>Decision latency</span>
          <span className="font-mono" style={{ color: project.decisionLatencyDays > 3 ? '#ef4444' : '#10b981' }}>
            {project.decisionLatencyDays}d
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px]">
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>Last change</span>
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>{formatRelativeWG(project.lastMeaningfulChange)}</span>
        </div>
      </div>

      <div className="flex items-start gap-1.5 p-2 rounded-lg"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <AlertTriangle className="w-2.5 h-2.5 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
        <div className="text-[9px]" style={{ color: '#f59e0b' }}>{project.recommendedAction}</div>
      </div>
    </div>
  );
}

export default function ProjectMemoryPage() {
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = PROJECT_MEMORY.filter(p =>
    filter === 'all' || p.status === filter || p.riskLevel === filter
  );

  const statuses = ['all', 'at_risk', 'blocked', 'active', 'completed'];

  const stats = {
    total: PROJECT_MEMORY.length,
    atRisk: PROJECT_MEMORY.filter(p => p.status === 'at_risk').length,
    blocked: PROJECT_MEMORY.filter(p => p.status === 'blocked').length,
    avgProof: Math.round(PROJECT_MEMORY.reduce((a, p) => a + p.proofCoverage, 0) / PROJECT_MEMORY.length),
    avgLatency: (PROJECT_MEMORY.reduce((a, p) => a + p.decisionLatencyDays, 0) / PROJECT_MEMORY.length).toFixed(1),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
              Alloy WorkGraph · Project Memory
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Project Memory</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Every project tracked by WorkGraph — decisions, signals, Workcells, and proof coverage.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border"
          style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
          <Zap className="w-2.5 h-2.5" /> Demo Mode
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Projects', value: stats.total, color: ACCENT },
          { label: 'At Risk', value: stats.atRisk, color: '#f59e0b' },
          { label: 'Blocked', value: stats.blocked, color: '#ef4444' },
          { label: 'Avg Proof', value: `${stats.avgProof}%`, color: '#10b981' },
          { label: 'Avg Latency', value: `${stats.avgLatency}d`, color: '#f97316' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.95)' }}>
            <div className="text-[9px] uppercase tracking-widest font-mono mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-2.5 py-1 rounded text-[9px] font-medium border transition-all capitalize"
            style={{
              background: filter === s ? 'rgba(75,139,219,0.1)' : 'transparent',
              borderColor: filter === s ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.06)',
              color: filter === s ? ACCENT : 'rgba(255,255,255,0.35)',
            }}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map(p => (
          <ProjectCard key={p.id} project={p} onClick={() => setSelected(p.id === selected ? null : p.id)} />
        ))}
      </div>

      <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(75,139,219,0.15)', background: 'rgba(75,139,219,0.04)' }}>
        <div className="flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'rgba(75,139,219,0.6)' }} />
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <strong className="text-white">Project Memory governance:</strong> Projects are inferred from workspace signals — no manual tagging required. Decision latency, proof coverage, and risk levels are computed from WorkGraph node relationships. Proof Packets cover every actionable outcome.
          </div>
        </div>
      </div>
    </div>
  );
}
