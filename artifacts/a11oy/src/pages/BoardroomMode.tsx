import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge } from '../components/ui';

const API = '/api/a11oy';

interface BoardSection {
  title: string;
  bullets: string[];
  metric?: string;
  metricLabel?: string;
}

interface BoardPacket {
  id: string; tenantId: string; tenantName: string; domain: string;
  generatedAt: string; period: string; approvedBy: string;
  executiveSummary: string; sections: BoardSection[];
  kpis: Array<{ label: string; value: string; trend: string; delta: string }>;
  approvalStatement: string; nextReviewDate: string;
  modelUsed: string; evalDisposition: string; evalComposite: number;
  proofRef: string;
}

interface BoardroomData {
  packets: BoardPacket[];
  summary: { totalPackets: number; tenantsServed: number; avgEvalComposite: number };
  capabilities: string[];
  generationLatencyMs: number;
}

const TREND_STYLE: Record<string, { color: string; symbol: string }> = {
  up: { color: '#c9b787', symbol: '▲' },
  down: { color: '#f5f5f5', symbol: '▼' },
  stable: { color: '#5e5e5e', symbol: '→' },
  mixed: { color: '#c9b787', symbol: '⟷' },
};

const DISP_STYLE: Record<string, string> = {
  pass: '#c9b787', pass_with_warning: '#c9b787', needs_more_evidence: '#c9b787',
  requires_human_review: '#f5f5f5', blocked: '#f5f5f5',
};

export function BoardroomMode() {
  const [data, setData] = useState<BoardroomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BoardPacket | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<BoardPacket | null>(null);

  useEffect(() => {
    fetch(`${API}/boardroom/sovereign`)
      .then(r => r.json())
      .then(d => { if (d.ok) { setData(d.data); setSelected(d.data.packets[0] ?? null); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function generatePacket() {
    setGenerating(true);
    setGenResult(null);
    fetch(`${API}/boardroom/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: 'DEMO_GEN', period: 'Q2 2026' }),
    })
      .then(r => r.json())
      .then(d => { if (d.ok) { setGenResult(d.data.packet); setSelected(d.data.packet); } })
      .catch(() => {})
      .finally(() => setGenerating(false));
  }

  return (
    <Layout>
      <PageHeader
        label="BOARDROOM MODE"
        title="Board Packet Generation"
        subtitle="Synthesize every running signal, Workcell, proof packet, and twin state into a single board-ready executive briefing — with MirrorEval 2.0 scoring and full proof chain."
        status="DEMO"
      />

      {loading ? (
        <div className="text-xs animate-pulse mb-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading boardroom data…</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KpiCard label="BOARD PACKETS" value={String(data.summary.totalPackets)} sub="Generated" accent="#c9b787" />
            <KpiCard label="TENANTS SERVED" value={String(data.summary.tenantsServed)} sub="Demo enterprises" accent="#8a8a8a" />
            <KpiCard label="AVG EVAL SCORE" value={`${Math.round(data.summary.avgEvalComposite * 100)}%`} sub="MirrorEval 2.0" accent="#c9b787" />
            <KpiCard label="GEN LATENCY" value={`${data.generationLatencyMs}ms`} sub="Estimated" accent="#b08d52" />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={generatePacket}
              disabled={generating}
              className="text-xs px-4 py-2 rounded font-medium"
              style={{ backgroundColor: 'rgba(201,183,135,0.15)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.3)', opacity: generating ? 0.6 : 1 }}
            >
              {generating ? 'Generating board packet…' : '+ Generate New Board Packet'}
            </button>
            {genResult && (
              <span className="text-xs" style={{ color: '#c9b787' }}>✓ Generated for {genResult.tenantName}</span>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div>
              <SectionTitle>Board Packets ({data.packets.length})</SectionTitle>
              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
                {data.packets.map(p => (
                  <Card key={p.id} className={`cursor-pointer hover:opacity-80 ${selected?.id === p.id ? 'ring-1 ring-pink-500/30' : ''}`} onClick={() => setSelected(p)}>
                    <div className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{p.tenantName}</div>
                    <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.domain} · {p.period}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span style={{ color: DISP_STYLE[p.evalDisposition] ?? '#5e5e5e' }}>{Math.round(p.evalComposite * 100)}% eval</span>
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.approvedBy}</span>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-4">
                <SectionTitle>Capabilities</SectionTitle>
                <div className="space-y-1">
                  {data.capabilities.map(c => (
                    <div key={c} className="flex items-start gap-2 text-xs">
                      <span style={{ color: '#c9b787', flexShrink: 0 }}>✓</span>
                      <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {selected ? (
                <>
                  <SectionTitle>Board Packet — {selected.tenantName}</SectionTitle>
                  <div className="flex flex-col gap-4">
                    <Card>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{selected.tenantName}</div>
                          <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selected.domain} · {selected.period}</div>
                        </div>
                        <div className="text-right text-xs">
                          <div style={{ color: DISP_STYLE[selected.evalDisposition] ?? '#5e5e5e' }}>
                            Eval: {Math.round(selected.evalComposite * 100)}%
                          </div>
                          <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selected.approvedBy}</div>
                        </div>
                      </div>
                      <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{selected.executiveSummary}</p>
                      <div className="text-xs p-2 rounded" style={{ backgroundColor: 'rgba(176,141,82,0.08)', color: '#b08d52', border: '1px solid rgba(176,141,82,0.2)' }}>
                        {selected.approvalStatement}
                      </div>
                    </Card>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {selected.kpis.map(kpi => {
                        const ts = TREND_STYLE[kpi.trend] ?? TREND_STYLE.stable;
                        return (
                          <Card key={kpi.label}>
                            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{kpi.label}</div>
                            <div className="font-semibold mt-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{kpi.value}</div>
                            <div className="text-xs" style={{ color: ts.color }}>{ts.symbol} {kpi.delta}</div>
                          </Card>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-3">
                      {selected.sections.map((sec, i) => (
                        <Card key={i}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{sec.title}</div>
                            {sec.metric && (
                              <div className="text-right">
                                <div className="text-lg font-bold font-mono" style={{ color: 'var(--color-a11oy-gold)' }}>{sec.metric}</div>
                                {sec.metricLabel && <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sec.metricLabel}</div>}
                              </div>
                            )}
                          </div>
                          <ul className="space-y-1">
                            {sec.bullets.map((b, bi) => (
                              <li key={bi} className="flex items-start gap-2 text-xs">
                                <span style={{ color: 'var(--color-a11oy-gold)', flexShrink: 0 }}>·</span>
                                <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </Card>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      <span>◇ {selected.proofRef}</span>
                      <span>model: {selected.modelUsed}</span>
                      <span>next review: {new Date(selected.nextReviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Select a board packet to view.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Boardroom data unavailable.</div>
      )}

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.2)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Board packets are seeded and deterministic. Generation uses real prompt synthesis in production — demo mode uses scripted output.
      </div>
    </Layout>
  );
}
