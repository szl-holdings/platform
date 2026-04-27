import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useMutation } from '@tanstack/react-query';
import {
  AlertTriangle,
  Brain,
  ChevronRight,
  Loader2,
  Radio,
  Ship,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#4d8fcc';

interface BehaviourClass {
  behaviour: string;
  score: number;
}

interface AnomalyFlag {
  label: string;
  score: number;
}

interface AisDecodeResult {
  input: { rawMessage?: string; mmsi?: string; vesselName?: string };
  decoded: Record<string, unknown> | null;
  behaviourClassification: BehaviourClass[];
  anomalyFlags: AnomalyFlag[];
  riskLevel: 'critical' | 'elevated' | 'normal';
  latencyMs: number;
  model: string;
}

const RISK_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', label: 'CRITICAL' },
  elevated: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)', label: 'ELEVATED' },
  normal: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', label: 'NORMAL' },
};

const SAMPLE_NMEA = '!AIVDM,1,1,,A,15N4cJ`P00G?Uf6E`FepT@3n00Sa,0*73';

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct > 55 ? '#ef4444' : pct > 30 ? '#f97316' : '#4d8fcc';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-white/40 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function AisDecodePage() {
  const [decodeForm, setDecodeForm] = useState({ rawMessage: SAMPLE_NMEA, mmsi: '', vesselName: '', context: '' });

  const mutation = useMutation<AisDecodeResult, Error, object>({
    mutationFn: async (payload) => {
      const data = await apiFetch('/api/hf-intelligence/vessels/decode-ais', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data as AisDecodeResult;
    },
  });

  const result = mutation.data;

  function handleSubmit() {
    const payload: Record<string, unknown> = {};
    if (decodeForm.rawMessage.trim()) payload.rawMessage = decodeForm.rawMessage.trim();
    if (decodeForm.mmsi.trim()) payload.mmsi = decodeForm.mmsi.trim();
    if (decodeForm.vesselName.trim()) payload.vesselName = decodeForm.vesselName.trim();
    if (decodeForm.context.trim()) payload.context = decodeForm.context.trim();
    mutation.mutate(payload);
  }

  return (
    <div className="min-h-screen text-white p-6 max-w-5xl mx-auto space-y-6" style={{ background: '#0a0a12' }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}
        >
          <Radio className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">AIS Decode &amp; ML Classification</h1>
          <p className="text-sm text-white/40 mt-0.5">
            NMEA sentence decoding + HuggingFace zero-shot vessel behaviour classification
          </p>
        </div>
        <div
          className="ml-auto px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest"
          style={{ background: 'rgba(14,165,233,0.08)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.15)' }}
        >
          HF Powered
        </div>
      </div>

      {/* Input form */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="space-y-1">
          <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
            NMEA AIS Sentence
          </label>
          <input
            className="w-full text-sm rounded-lg px-3 py-2.5 font-mono focus:outline-none focus:ring-1"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#7dd3fc',
            }}
            placeholder="!AIVDM,1,1,,A,…"
            value={decodeForm.rawMessage}
            onChange={(e) => setDecodeForm((f) => ({ ...f, rawMessage: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/40 uppercase tracking-widest">MMSI</label>
            <input
              className="w-full text-sm rounded-lg px-3 py-2 font-mono focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#e2e8f0',
              }}
              placeholder="123456789"
              value={decodeForm.mmsi}
              onChange={(e) => setDecodeForm((f) => ({ ...f, mmsi: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/40 uppercase tracking-widest">Vessel Name</label>
            <input
              className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#e2e8f0',
              }}
              placeholder="PACIFIC MERIDIAN"
              value={decodeForm.vesselName}
              onChange={(e) => setDecodeForm((f) => ({ ...f, vesselName: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
            Intelligence Context (optional)
          </label>
          <input
            className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#e2e8f0',
            }}
            placeholder="Previous port calls, flag state, cargo type…"
            value={decodeForm.context}
            onChange={(e) => setDecodeForm((f) => ({ ...f, context: e.target.value }))}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending || (!decodeForm.rawMessage.trim() && !decodeForm.mmsi.trim() && !decodeForm.vesselName.trim())}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
          style={{ background: ACCENT, color: '#fff' }}
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {mutation.isPending ? 'Decoding &amp; classifying…' : 'Decode + Classify'}
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
          {/* Risk summary */}
          <div
            className="rounded-xl p-4 flex items-center gap-4"
            style={{
              background: RISK_CONFIG[result.riskLevel].bg,
              border: `1px solid ${RISK_CONFIG[result.riskLevel].border}`,
            }}
          >
            <ShieldAlert className="w-6 h-6" style={{ color: RISK_CONFIG[result.riskLevel].color }} />
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40 mb-0.5">Risk Level</div>
              <div className="text-lg font-bold" style={{ color: RISK_CONFIG[result.riskLevel].color }}>
                {RISK_CONFIG[result.riskLevel].label}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] text-white/30 font-mono">{result.latencyMs}ms</div>
              <div className="text-[10px] text-white/20 font-mono">{result.model}</div>
            </div>
          </div>

          {/* Decoded NMEA */}
          {result.decoded && (
            <div
              className="rounded-xl p-5 space-y-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/40">
                <Ship className="w-3.5 h-3.5" />
                Decoded NMEA Fields
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {Object.entries(result.decoded)
                  .filter(([k]) => k !== 'raw')
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs border-b border-white/5 pb-1">
                      <span className="text-white/40 font-mono">{k}</span>
                      <span className="text-sky-300 font-mono">{String(v)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Behaviour classification */}
          <div
            className="rounded-xl p-5 space-y-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/40">
              <Brain className="w-3.5 h-3.5" />
              ML Behaviour Classification
            </div>
            {result.behaviourClassification.map((b) => (
              <div key={b.behaviour} className="space-y-1.5">
                <span className="text-xs text-white/60">{b.behaviour}</span>
                <ScoreBar score={b.score} />
              </div>
            ))}
          </div>

          {/* Anomaly flags */}
          {result.anomalyFlags.length > 0 && (
            <div
              className="rounded-xl p-5 space-y-2"
              style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}
            >
              <div className="text-xs font-medium uppercase tracking-widest text-red-400/60 mb-3">
                Anomaly Flags
              </div>
              {result.anomalyFlags.map((flag, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
                >
                  <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="text-red-300 flex-1">{flag.label}</span>
                  <span className="text-red-400/50 font-mono text-[10px]">
                    {Math.round(flag.score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div
            className="rounded-xl p-3 flex items-center gap-3 text-[10px] text-white/25 font-mono"
            style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <ChevronRight className="w-3 h-3 shrink-0" />
            NMEA AIS decoder + {result.model}
          </div>
        </div>
      )}
    </div>
  );
}
