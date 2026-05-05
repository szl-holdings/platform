import { useState } from 'react';
import { Layout } from '../../../components/layout';
import { PageHeader, Card, KpiCard } from '../../../components/ui';

const GOLD = '#c9b787';

const SIGNAL_SOURCES = [
  { id: 'src-1', name: 'AIS Fleet Monitor', domain: 'Maritime', type: 'Realtime stream', status: 'connected', signalsToday: 4821 },
  { id: 'src-2', name: 'OFAC API', domain: 'Compliance', type: 'Pull (every 1h)', status: 'connected', signalsToday: 3 },
  { id: 'src-3', name: 'Reuters News Wire', domain: 'Strategy', type: 'RSS + NLP', status: 'connected', signalsToday: 142 },
  { id: 'src-4', name: 'Counsel Sentinel Decisions', domain: 'Legal', type: 'Agent events', status: 'connected', signalsToday: 18 },
  { id: 'src-5', name: 'Guardian NOC Alerts', domain: 'Security', type: 'Webhook', status: 'connected', signalsToday: 42 },
  { id: 'src-6', name: 'Bloomberg Terminal', domain: 'Finance', type: 'Pull (every 15min)', status: 'configured', signalsToday: 0 },
  { id: 'src-7', name: 'Port Authority RSS', domain: 'Maritime', type: 'RSS', status: 'connected', signalsToday: 28 },
];

const SCHEDULES = [
  { id: 'sch-1', name: 'Daily Maritime Digest', domains: ['Maritime', 'Compliance'], cadence: 'Daily 06:00 UTC', recipients: 3, lastRun: '06:00 UTC today', status: 'active' },
  { id: 'sch-2', name: 'Legal Matter Digest', domains: ['Legal'], cadence: 'Daily 06:30 UTC', recipients: 2, lastRun: '06:30 UTC today', status: 'active' },
  { id: 'sch-3', name: 'Weekly Strategic Review', domains: ['Strategy', 'Finance'], cadence: 'Weekly Monday 18:00 UTC', recipients: 8, lastRun: 'May 4 18:00 UTC', status: 'active' },
  { id: 'sch-4', name: 'Security NOC Brief', domains: ['Security'], cadence: 'Every 4h', recipients: 4, lastRun: '08:00 UTC today', status: 'active' },
];

type Tab = 'sources' | 'schedules' | 'synthesis';

export function BriefingEngine() {
  const [tab, setTab] = useState<Tab>('sources');
  const [minConfidence, setMinConfidence] = useState(80);
  const [citationRequired, setCitationRequired] = useState(true);
  const [hallucCheck, setHallucCheck] = useState(true);

  return (
    <Layout>
      <PageHeader
        label="STRATEGY / BRIEFINGS / ENGINE"
        title="Briefing Engine"
        subtitle="Configure the automated brief generation pipeline: signal sources, synthesis parameters, citation requirements, and delivery schedules. Every brief output passes through a hallucination gate."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="SOURCES CONNECTED" value={String(SIGNAL_SOURCES.filter(s => s.status === 'connected').length)} sub="of 7 total" accent={GOLD} />
        <KpiCard label="SIGNALS TODAY" value={String(SIGNAL_SOURCES.reduce((s, src) => s + src.signalsToday, 0).toLocaleString())} sub="ingested" accent={GOLD} />
        <KpiCard label="ACTIVE SCHEDULES" value={String(SCHEDULES.filter(s => s.status === 'active').length)} sub="running" accent={GOLD} />
        <KpiCard label="HALLUCINATION GATE" value="Enabled" sub="all synths" accent="#22c55e" />
      </div>

      <div className="flex gap-1 mb-6">
        {(['sources', 'schedules', 'synthesis'] as Tab[]).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-xs font-mono transition-colors capitalize"
            style={{ background: tab === t ? 'rgba(201,183,135,0.12)' : 'transparent', color: tab === t ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${tab === t ? 'rgba(201,183,135,0.3)' : 'transparent'}`, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'sources' && (
        <div className="space-y-3">
          {SIGNAL_SOURCES.map(src => (
            <div key={src.id} className="rounded-lg border p-4"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{src.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{src.domain} · {src.type}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-right">
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{src.signalsToday.toLocaleString()} signals today</div>
                  </div>
                  <span className="text-xs font-mono" style={{ color: src.status === 'connected' ? '#22c55e' : GOLD }}>
                    {src.status === 'connected' ? '● connected' : '○ configured'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'schedules' && (
        <div className="space-y-3">
          {SCHEDULES.map(sch => (
            <div key={sch.id} className="rounded-lg border p-4"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{sch.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sch.cadence}</div>
                </div>
                <span className="text-xs font-mono" style={{ color: '#22c55e' }}>● {sch.status}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {sch.domains.map(d => (
                  <span key={d} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: GOLD }}>{d}</span>
                ))}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                {sch.recipients} recipient{sch.recipients !== 1 ? 's' : ''} · Last run: {sch.lastRun}
              </div>
            </div>
          ))}
          <button type="button" className="w-full py-3 rounded-lg border text-xs font-mono transition-colors"
            style={{ backgroundColor: 'transparent', borderColor: 'rgba(201,183,135,0.2)', color: GOLD, cursor: 'pointer' }}>
            + New Schedule
          </button>
        </div>
      )}

      {tab === 'synthesis' && (
        <Card>
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>AI Synthesis Parameters</div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>MINIMUM SIGNAL CONFIDENCE</label>
                <span className="text-xs font-mono" style={{ color: GOLD }}>{minConfidence}%</span>
              </div>
              <input type="range" min={50} max={99} value={minConfidence} onChange={e => setMinConfidence(Number(e.target.value))}
                className="w-full" style={{ accentColor: GOLD }} />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                <span>50% (permissive)</span><span>99% (conservative)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>REQUIRE CITATIONS</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>Every claim must cite a verified source</div>
              </div>
              <button type="button" onClick={() => setCitationRequired(!citationRequired)}
                className="px-3 py-1.5 rounded text-xs font-mono"
                style={{ background: citationRequired ? 'rgba(34,197,94,0.12)' : 'rgba(94,94,94,0.12)', color: citationRequired ? '#22c55e' : '#8a8a8a', border: `1px solid ${citationRequired ? 'rgba(34,197,94,0.2)' : 'rgba(94,94,94,0.2)'}`, cursor: 'pointer' }}>
                {citationRequired ? '✓ ENABLED' : '○ DISABLED'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>HALLUCINATION GATE</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>Block briefs with unverifiable claims above threshold</div>
              </div>
              <button type="button" onClick={() => setHallucCheck(!hallucCheck)}
                className="px-3 py-1.5 rounded text-xs font-mono"
                style={{ background: hallucCheck ? 'rgba(34,197,94,0.12)' : 'rgba(94,94,94,0.12)', color: hallucCheck ? '#22c55e' : '#8a8a8a', border: `1px solid ${hallucCheck ? 'rgba(34,197,94,0.2)' : 'rgba(94,94,94,0.2)'}`, cursor: 'pointer' }}>
                {hallucCheck ? '✓ ENABLED' : '○ DISABLED'}
              </button>
            </div>

            <div className="p-3 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
              <div className="font-mono mb-1" style={{ color: GOLD }}>Active Configuration</div>
              <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                min_confidence: {minConfidence}%{'\n'}
                citation_required: {String(citationRequired)}{'\n'}
                hallucination_gate: {String(hallucCheck)}{'\n'}
                synthesis_model: Claude 4 Sonnet
              </div>
            </div>
          </div>
        </Card>
      )}
    </Layout>
  );
}
