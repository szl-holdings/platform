import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useMutation } from '@tanstack/react-query';
import {
  AlertTriangle,
  Brain,
  Building2,
  ChevronRight,
  DollarSign,
  Loader2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#10b981';

interface ValuationResult {
  property: {
    address?: string;
    sqft?: number;
    beds?: number;
    baths?: number;
    yearBuilt?: number;
    propertyType?: string;
  };
  valuation: {
    estimatedValue: number;
    range: { low: number; high: number };
    currency: string;
    confidence: number;
    methodology: string;
  };
  marketSentiment: {
    label: string;
    score: number;
    allSignals: Array<{ signal: string; score: number }>;
  };
  latencyMs: number;
  model: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const PROPERTY_TYPES = ['residential', 'commercial', 'multifamily', 'industrial', 'land'];

function ScoreBar({ score, color = ACCENT }: { score: number; color?: string }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-white/40 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function PropertyValuationAiPage() {
  const [address, setAddress] = useState('123 Market Street, San Francisco, CA 94105');
  const [sqft, setSqft] = useState('2400');
  const [beds, setBeds] = useState('3');
  const [baths, setBaths] = useState('2');
  const [yearBuilt, setYearBuilt] = useState('1998');
  const [propertyType, setPropertyType] = useState('residential');
  const [marketContext, setMarketContext] = useState('Tech sector layoffs dampening luxury demand. Interest rate at 6.8%.');

  const mutation = useMutation<ValuationResult, Error, object>({
    mutationFn: async (payload) => {
      const data = await apiFetch('/api/hf-intelligence/property/value', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data as ValuationResult;
    },
  });

  const result = mutation.data;

  function handleSubmit() {
    mutation.mutate({
      address: address.trim() || undefined,
      sqft: sqft ? parseInt(sqft, 10) : undefined,
      beds: beds ? parseInt(beds, 10) : undefined,
      baths: baths ? parseInt(baths, 10) : undefined,
      yearBuilt: yearBuilt ? parseInt(yearBuilt, 10) : undefined,
      propertyType: propertyType || undefined,
      marketContext: marketContext.trim() || undefined,
    });
  }

  const sentimentIcon =
    result?.marketSentiment.label === 'bullish market' ? TrendingUp :
    result?.marketSentiment.label === 'bearish market' ? TrendingDown : Brain;
  const SentimentIcon = sentimentIcon;

  return (
    <div className="min-h-screen text-white p-6 max-w-5xl mx-auto space-y-6" style={{ background: '#0a0a12' }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <Brain className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI Property Valuation</h1>
          <p className="text-sm text-white/40 mt-0.5">
            HuggingFace ML sentiment analysis + structured AVM for real-time valuation
          </p>
        </div>
        <div
          className="ml-auto px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest"
          style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.15)' }}
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
          <label className="text-xs font-medium text-white/40 uppercase tracking-widest">Address</label>
          <input
            className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e2e8f0',
            }}
            placeholder="123 Main St, City, State ZIP"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Sq Ft', value: sqft, setter: setSqft, placeholder: '2000' },
            { label: 'Beds', value: beds, setter: setBeds, placeholder: '3' },
            { label: 'Baths', value: baths, setter: setBaths, placeholder: '2' },
            { label: 'Year Built', value: yearBuilt, setter: setYearBuilt, placeholder: '2000' },
          ].map((f) => (
            <div key={f.label} className="space-y-1">
              <label className="text-xs font-medium text-white/40 uppercase tracking-widest">{f.label}</label>
              <input
                type="number"
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none font-mono"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#e2e8f0',
                }}
                placeholder={f.placeholder}
                value={f.value}
                onChange={(e) => f.setter(e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-white/40 uppercase tracking-widest">Property Type</label>
          <select
            className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#e2e8f0',
            }}
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t} style={{ background: '#0f172a' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
            Market Context (for ML sentiment)
          </label>
          <textarea
            className="w-full h-20 text-sm rounded-lg p-3 resize-none focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#cbd5e1',
            }}
            placeholder="Describe current market conditions, macro environment…"
            value={marketContext}
            onChange={(e) => setMarketContext(e.target.value)}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending || (!address.trim() && !sqft)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
          style={{ background: ACCENT, color: '#fff' }}
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {mutation.isPending ? 'Valuing…' : 'Run AI Valuation'}
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
          {/* Estimated value */}
          <div
            className="rounded-xl p-5 flex items-center gap-6"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <DollarSign className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest text-white/30 mb-0.5">AI Estimated Value</div>
              <div className="text-3xl font-bold text-emerald-300">
                {formatCurrency(result.valuation.estimatedValue)}
              </div>
              <div className="text-xs text-white/40 mt-1">
                Range: {formatCurrency(result.valuation.range.low)} — {formatCurrency(result.valuation.range.high)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/30">Confidence</div>
              <div className="text-lg font-bold text-emerald-400">
                {Math.round(result.valuation.confidence * 100)}%
              </div>
              <div className="text-[10px] text-white/25 font-mono mt-1">{result.latencyMs}ms</div>
            </div>
          </div>

          {/* Market sentiment */}
          <div
            className="rounded-xl p-5 space-y-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/40">
              <SentimentIcon className="w-3.5 h-3.5" />
              Market Sentiment (ML)
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="px-2.5 py-1 rounded-md text-xs font-medium capitalize"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: '#34d399',
                }}
              >
                {result.marketSentiment.label}
              </span>
              <span className="text-sm text-white/50">
                {Math.round(result.marketSentiment.score * 100)}% confidence
              </span>
            </div>
            {result.marketSentiment.allSignals.map((s) => (
              <div key={s.signal} className="space-y-1">
                <span className="text-xs text-white/50 capitalize">{s.signal}</span>
                <ScoreBar score={s.score} />
              </div>
            ))}
          </div>

          {/* Methodology */}
          <div
            className="rounded-xl p-4 flex items-start gap-3 text-xs text-white/35"
            style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-white/50 mb-0.5">Methodology</div>
              {result.valuation.methodology}
            </div>
            <ChevronRight className="w-3 h-3 shrink-0 ml-auto mt-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}
