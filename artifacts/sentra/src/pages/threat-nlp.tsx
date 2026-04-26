import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useMutation } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Brain,
  ChevronRight,
  Loader2,
  Plus,
  Shield,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#ef4444';

interface Correlation {
  threatType: string;
  score: number;
  mitreTactic: string;
}

interface ThreatActor {
  name: string;
  type: string;
  confidence: number;
}

interface CorrelateResult {
  indicators: string[];
  correlations: Correlation[];
  threatActors: ThreatActor[];
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  latencyMs: number;
  models: string[];
}

const RISK_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
  high: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  low: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
};

const SAMPLE_INDICATORS = [
  '185.220.101.45',
  'invoke-mimikatz.ps1',
  'C2 beacon: api.darkpool.cc',
];

const SAMPLE_CONTEXT =
  'Lateral movement detected across 3 endpoints. Memory dumps indicate credential access attempt.';

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct > 60 ? '#ef4444' : pct > 35 ? '#f97316' : '#64748b';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-white/40 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function ThreatNlpPage() {
  const [indicators, setIndicators] = useState<string[]>(SAMPLE_INDICATORS);
  const [newIndicator, setNewIndicator] = useState('');
  const [context, setContext] = useState(SAMPLE_CONTEXT);

  const mutation = useMutation<CorrelateResult, Error, { indicators: string[]; context: string }>({
    mutationFn: async (payload) => {
      const data = await apiFetch('/api/hf-intelligence/threat/correlate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data as CorrelateResult;
    },
  });

  const result = mutation.data;

  function addIndicator() {
    const val = newIndicator.trim();
    if (val && !indicators.includes(val)) {
      setIndicators((prev) => [...prev, val]);
      setNewIndicator('');
    }
  }

  function removeIndicator(idx: number) {
    setIndicators((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="min-h-screen text-white p-6 max-w-5xl mx-auto space-y-6" style={{ background: '#0a0a12' }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <Brain className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Threat Indicator Correlation</h1>
          <p className="text-sm text-white/40 mt-0.5">
            ML-powered threat classification and MITRE ATT&amp;CK mapping via HuggingFace
          </p>
        </div>
        <div
          className="ml-auto px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          HF Powered
        </div>
      </div>

      {/* Indicators input */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-xs font-medium text-white/50 uppercase tracking-widest">IOCs / Threat Indicators</div>
        <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
          {indicators.map((ind, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#fca5a5' }}
            >
              {ind}
              <button onClick={() => removeIndicator(i)} className="text-red-400/60 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e2e8f0',
            }}
            placeholder="IP, domain, hash, file, command…"
            value={newIndicator}
            onChange={(e) => setNewIndicator(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addIndicator()}
          />
          <button
            onClick={addIndicator}
            className="px-3 py-2 rounded-lg text-sm transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div>
          <label className="text-xs font-medium text-white/40 uppercase tracking-widest block mb-2">
            Incident Context
          </label>
          <textarea
            className="w-full h-20 text-sm rounded-lg p-3 resize-none focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#cbd5e1',
            }}
            placeholder="Describe the incident context, behavior observed, affected systems…"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>
        <button
          onClick={() => mutation.mutate({ indicators, context })}
          disabled={mutation.isPending || indicators.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
          style={{ background: ACCENT, color: '#fff' }}
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {mutation.isPending ? 'Correlating…' : 'Correlate with HuggingFace ML'}
        </button>
      </div>

      {mutation.isError && (
        <div
          className="rounded-xl p-4 flex items-center gap-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-red-300">{mutation.error.message}</span>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Risk badge */}
          <div
            className="rounded-xl p-4 flex items-center gap-4"
            style={{
              background: RISK_CONFIG[result.overallRisk].bg,
              border: `1px solid ${RISK_CONFIG[result.overallRisk].border}`,
            }}
          >
            <Shield className="w-6 h-6" style={{ color: RISK_CONFIG[result.overallRisk].color }} />
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40 mb-0.5">Overall Risk</div>
              <div
                className="text-lg font-bold uppercase tracking-wide"
                style={{ color: RISK_CONFIG[result.overallRisk].color }}
              >
                {result.overallRisk}
              </div>
            </div>
            <span className="ml-auto text-[10px] text-white/30 font-mono">{result.latencyMs}ms</span>
          </div>

          {/* Correlations */}
          <div
            className="rounded-xl p-5 space-y-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-xs font-medium uppercase tracking-widest text-white/40">
              Threat Type Correlations
            </div>
            {result.correlations.map((c) => (
              <div key={c.threatType} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/70 font-medium">{c.threatType}</span>
                  <span className="text-white/30 text-[10px] font-mono">{c.mitreTactic}</span>
                </div>
                <ScoreBar score={c.score} />
              </div>
            ))}
          </div>

          {/* Threat actors */}
          {result.threatActors.length > 0 && (
            <div
              className="rounded-xl p-5 space-y-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-xs font-medium uppercase tracking-widest text-white/40">
                <Activity className="w-3.5 h-3.5 inline mr-1.5" />
                Attributed Entities (NER)
              </div>
              <div className="flex flex-wrap gap-2">
                {result.threatActors.map((actor, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-xs"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#fca5a5' }}
                  >
                    <span className="text-red-400/50 mr-1 text-[10px]">[{actor.type}]</span>
                    {actor.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Model footer */}
          <div
            className="rounded-xl p-3 flex items-center gap-3 text-[10px] text-white/25 font-mono"
            style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <ChevronRight className="w-3 h-3 shrink-0" />
            {result.models.join(' · ')}
          </div>
        </div>
      )}
    </div>
  );
}
