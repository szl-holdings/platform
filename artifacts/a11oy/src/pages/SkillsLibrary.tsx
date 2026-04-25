import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill } from '../components/ui';

const API = '/api/a11oy';

interface Skill {
  id: string; name: string; category: string; domain: string; version: string; status: string;
  calls: number; successRate: number; avgLatencyMs: number; description: string;
  allowedTools: string[]; blockedTools: string[]; requiredPolicies: string[];
  evalRequired: boolean; sampleInput: Record<string, unknown>; sampleOutput: Record<string, unknown>;
}

interface SkillsData {
  skills: Skill[];
  summary: { total: number; live: number; demo: number; totalCallsToday: number };
}

const CAT_COLORS: Record<string, string> = {
  'Revenue Intelligence': '#3b82f6',
  'Advisory Intelligence': '#8b5cf6',
  'Boardroom Intelligence': '#ec4899',
  'Governance': '#b08d52',
  'Legal Intelligence': '#6366f1',
  'Maritime Intelligence': '#06b6d4',
  'Defense Intelligence': '#ef4444',
  'Procurement Intelligence': '#f59e0b',
  'Real Estate Intelligence': '#10b981',
  'Engineering Intelligence': '#9bacc4',
  'Data Intelligence': '#6366f1',
};

export function SkillsLibrary() {
  const [data, setData] = useState<SkillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Skill | null>(null);
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetch(`${API}/skills/sovereign`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function runSkill(skill: Skill) {
    setRunLoading(true);
    setRunResult(null);
    fetch(`${API}/skills/sovereign/${skill.id}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: skill.sampleInput }),
    })
      .then(r => r.json())
      .then(d => { if (d.ok) setRunResult(d.data); })
      .catch(() => {})
      .finally(() => setRunLoading(false));
  }

  const categories = data ? [...new Set(data.skills.map(s => s.category))] : [];
  const filtered = data?.skills.filter(s =>
    (filterCategory === 'all' || s.category === filterCategory) &&
    (filterStatus === 'all' || s.status === filterStatus)
  ) ?? [];

  return (
    <Layout>
      <PageHeader
        label="SKILL LIBRARY"
        title="A11oy Skill Registry"
        subtitle="15 named skills — each one detects, scores, classifies, or generates. Every skill output becomes a Workcell, Action Brief, or Proof Packet in the runtime."
        status="DEMO"
      />

      {loading ? (
        <div className="text-xs animate-pulse mb-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading skill registry…</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KpiCard label="TOTAL SKILLS" value={String(data.summary.total)} sub="Registry" accent="#8b5cf6" />
            <KpiCard label="LIVE" value={String(data.summary.live)} sub="Operational" accent="#10b981" />
            <KpiCard label="DEMO" value={String(data.summary.demo)} sub="Scripted output" accent="#f59e0b" />
            <KpiCard label="CALLS TODAY" value={String(data.summary.totalCallsToday)} sub="Estimated" accent="#3b82f6" />
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Status:</span>
            {['all', 'LIVE', 'DEMO'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterStatus === s ? 'rgba(59,130,246,0.2)' : 'var(--color-a11oy-muted)', color: filterStatus === s ? '#3b82f6' : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterStatus === s ? 'rgba(59,130,246,0.4)' : 'var(--color-a11oy-border)'}` }}>
                {s}
              </button>
            ))}
            <span className="text-xs ml-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Category:</span>
            <button onClick={() => setFilterCategory('all')} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterCategory === 'all' ? 'rgba(139,92,246,0.2)' : 'var(--color-a11oy-muted)', color: filterCategory === 'all' ? '#8b5cf6' : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterCategory === 'all' ? 'rgba(139,92,246,0.4)' : 'var(--color-a11oy-border)'}` }}>all</button>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SectionTitle>Skills ({filtered.length})</SectionTitle>
              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
                {filtered.map(skill => (
                  <Card key={skill.id} className={`cursor-pointer hover:opacity-80 ${selected?.id === skill.id ? 'ring-1 ring-blue-500/30' : ''}`} onClick={() => { setSelected(skill); setRunResult(null); }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--color-a11oy-text)' }}>{skill.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs px-1.5 py-0 rounded" style={{ backgroundColor: `${CAT_COLORS[skill.category] ?? '#9bacc4'}18`, color: CAT_COLORS[skill.category] ?? '#9bacc4' }}>{skill.category}</span>
                          <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{skill.domain}</span>
                        </div>
                      </div>
                      <StatusPill status={skill.status as 'LIVE' | 'DEMO' | 'ROADMAP'} />
                    </div>
                    <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{skill.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>calls</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{skill.calls.toLocaleString()}</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>success</div><div style={{ color: '#10b981' }}>{Math.round(skill.successRate * 100)}%</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>latency</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{skill.avgLatencyMs}ms</div></div>
                    </div>
                    {skill.evalRequired && (
                      <div className="mt-1.5 text-xs" style={{ color: '#8b5cf6' }}>◎ Eval required before action</div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            <div>
              {selected ? (
                <>
                  <SectionTitle>Skill Detail — {selected.name}</SectionTitle>
                  <Card>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-1.5 py-0 rounded" style={{ backgroundColor: `${CAT_COLORS[selected.category] ?? '#9bacc4'}18`, color: CAT_COLORS[selected.category] ?? '#9bacc4' }}>{selected.category}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>v{selected.version}</span>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Allowed Tools</div>
                      <div className="flex flex-wrap gap-1">
                        {selected.allowedTools.map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(16,185,129,0.08)', color: '#10b981' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Blocked Tools</div>
                      <div className="flex flex-wrap gap-1">
                        {selected.blockedTools.map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Required Policies</div>
                      <div className="flex flex-wrap gap-1">
                        {selected.requiredPolicies.map(p => (
                          <span key={p} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(176,141,82,0.1)', color: '#b08d52' }}>{p}</span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Sample Input</div>
                    <pre className="text-xs p-2 rounded mb-3 overflow-x-auto" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-sub)' }}>
                      {JSON.stringify(selected.sampleInput, null, 2)}
                    </pre>

                    <button
                      onClick={() => runSkill(selected)}
                      disabled={runLoading}
                      className="w-full text-xs py-2 rounded font-medium mb-3"
                      style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)', opacity: runLoading ? 0.6 : 1 }}
                    >
                      {runLoading ? 'Running demo…' : 'Run Demo'}
                    </button>

                    {runResult && (
                      <div>
                        <div className="text-xs font-medium mb-1" style={{ color: '#10b981' }}>Output</div>
                        <pre className="text-xs p-2 rounded overflow-x-auto" style={{ backgroundColor: 'rgba(16,185,129,0.06)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          {JSON.stringify(runResult.output, null, 2)}
                        </pre>
                        <div className="mt-1.5 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                          Workcell: {runResult.workcellId as string} · {runResult.latencyMs as number}ms
                        </div>
                      </div>
                    )}
                  </Card>
                </>
              ) : (
                <>
                  <SectionTitle>Category Distribution</SectionTitle>
                  <div className="flex flex-col gap-1">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className="flex items-center justify-between text-xs p-2 rounded hover:opacity-80"
                        style={{ backgroundColor: filterCategory === cat ? `${CAT_COLORS[cat] ?? '#9bacc4'}18` : 'transparent' }}
                      >
                        <span style={{ color: CAT_COLORS[cat] ?? '#9bacc4' }}>{cat}</span>
                        <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                          {data?.skills.filter(s => s.category === cat).length}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Select a skill to view details and run demo.</div>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Skill registry unavailable.</div>
      )}

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Demo mode — skill outputs are deterministic seed data. No real tool calls are made.
      </div>
    </Layout>
  );
}
