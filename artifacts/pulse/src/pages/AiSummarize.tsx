import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useMutation } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  ChevronRight,
  Copy,
  FileText,
  Loader2,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#6366f1';

interface SummarizeResult {
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  latencyMs: number;
  model: string;
}

const SAMPLE_TEXT = `Q1 2026 performance exceeded expectations across three of our four primary verticals. The Intelligence
Infrastructure segment posted $142M in ARR, a 38% year-over-year increase, driven primarily by the expansion
of our Sovereign Execution Lab and uptake of the AI Gateway product among enterprise clients. Maritime
Intelligence (SEXTANT) returned to growth following the fleet-tracking platform overhaul, registering
$61M ARR (+22% YoY). Legal Matter Command (Counsel) grew modestly at +12% YoY to $48M ARR, constrained
by a slower-than-expected uptake of the Clause Genome feature among mid-market law firms. The Real Estate
Intelligence vertical (DOMAINE) was the lone underperformer at -4% YoY ($33M ARR), reflecting the ongoing
commercial real estate liquidity crunch and client budget freezes across the APAC region.
Gross margin improved 210 bps to 71.4%, reflecting operating leverage and a favourable cloud cost
renegotiation completed in January. Net Revenue Retention reached 118% driven by seat expansion and upsells
within existing enterprise accounts.`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all"
      style={{
        background: copied ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${copied ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)'}`,
        color: copied ? '#a5b4fc' : '#64748b',
      }}
    >
      <Copy className="w-3 h-3" />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function AiSummarizePage() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [maxLength, setMaxLength] = useState(200);

  const mutation = useMutation<SummarizeResult, Error, { text: string; maxLength: number }>({
    mutationFn: async (payload) => {
      const data = await apiFetch('/api/hf-intelligence/summarize', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data as SummarizeResult;
    },
  });

  const result = mutation.data;

  return (
    <div className="min-h-screen text-white p-6 max-w-4xl mx-auto space-y-6" style={{ background: '#0a0a12' }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <Brain className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI Summarization</h1>
          <p className="text-sm text-white/40 mt-0.5">
            HuggingFace BART-large-CNN for abstractive document summarization
          </p>
        </div>
        <div
          className="ml-auto px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest"
          style={{
            background: 'rgba(99,102,241,0.08)',
            color: '#a5b4fc',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          HF Powered
        </div>
      </div>

      {/* Input */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
            Document / Briefing Text
          </label>
          <span className="text-[10px] text-white/25 font-mono">{text.length} chars</span>
        </div>
        <textarea
          className="w-full h-48 text-sm rounded-lg p-3 resize-none focus:outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#e2e8f0',
            lineHeight: '1.6',
          }}
          placeholder="Paste any document, report, briefing, or memo…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs text-white/40 shrink-0">Max length:</label>
            <input
              type="range"
              min={80}
              max={400}
              step={20}
              value={maxLength}
              onChange={(e) => setMaxLength(parseInt(e.target.value, 10))}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-xs font-mono text-indigo-400 w-10 text-right">{maxLength}</span>
          </div>
          <button
            onClick={() => mutation.mutate({ text, maxLength })}
            disabled={mutation.isPending || text.trim().length < 50}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 shrink-0"
            style={{ background: ACCENT, color: '#fff' }}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {mutation.isPending ? 'Summarizing…' : 'Summarize'}
          </button>
        </div>
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
          {/* Summary card */}
          <div
            className="rounded-xl p-5 space-y-3"
            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-200">Summary</span>
              </div>
              <CopyButton text={result.summary} />
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: '#cbd5e1' }}
            >
              {result.summary}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Original', value: `${result.originalLength.toLocaleString()} chars` },
              { label: 'Summary', value: `${result.summaryLength.toLocaleString()} chars` },
              {
                label: 'Compression',
                value: `${Math.round((1 - result.compressionRatio) * 100)}%`,
                highlight: true,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="text-xs uppercase tracking-widest text-white/30 mb-1">{stat.label}</div>
                <div
                  className="text-lg font-bold font-mono"
                  style={{ color: stat.highlight ? '#a5b4fc' : '#94a3b8' }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Model footer */}
          <div
            className="rounded-xl p-3 flex items-center gap-3 text-[10px] text-white/25 font-mono"
            style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span>{result.model}</span>
            <span className="ml-auto">{result.latencyMs}ms</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}
