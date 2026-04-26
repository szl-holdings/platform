import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useMutation } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  ChevronRight,
  FileSearch,
  Loader2,
  Scale,
  Sparkles,
  Tag,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#8b5cf6';

type AnalyzeTask = 'classify' | 'summarize' | 'ner';

interface ClassifyResult {
  task: 'classify';
  topCategory: string;
  confidence: number;
  allCategories: Array<{ label: string; score: number }>;
  riskFlags: string[];
  latencyMs: number;
  model: string;
}

interface SummarizeResult {
  task: 'summarize';
  summary: string;
  latencyMs: number;
  model: string;
}

interface NerEntity {
  word: string;
  entity: string;
  score: number;
}

interface NerResult {
  task: 'ner';
  entities: NerEntity[];
  latencyMs: number;
  model: string;
}

type AnalyzeResult = ClassifyResult | SummarizeResult | NerResult;

const SAMPLE_CLAUSE =
  'The Party A shall indemnify and hold harmless Party B from any and all claims, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or related to any breach of this Agreement by Party A or any act or omission of Party A\'s employees, agents, or subcontractors.';

const TASKS: Array<{ id: AnalyzeTask; label: string; desc: string; icon: typeof Brain }> = [
  { id: 'classify', label: 'Clause Classification', desc: 'Zero-shot legal category detection', icon: Tag },
  { id: 'summarize', label: 'Summarization', desc: 'Abstractive clause summary', icon: BookOpen },
  { id: 'ner', label: 'Legal NER', desc: 'Named entity recognition', icon: FileSearch },
];

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct > 60 ? '#8b5cf6' : pct > 35 ? '#f59e0b' : '#64748b';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-white/50 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function LegalNlpPage() {
  const [text, setText] = useState(SAMPLE_CLAUSE);
  const [task, setTask] = useState<AnalyzeTask>('classify');

  const mutation = useMutation<AnalyzeResult, Error, { text: string; task: AnalyzeTask }>({
    mutationFn: async (payload) => {
      const data = await apiFetch('/api/hf-intelligence/legal/analyze', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data as AnalyzeResult;
    },
  });

  const result = mutation.data;

  return (
    <div className="min-h-screen text-white p-6 max-w-5xl mx-auto space-y-6" style={{ background: '#0a0a12' }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          <Brain className="w-5 h-5" style={{ color: ACCENT }} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Legal NLP Intelligence</h1>
          <p className="text-sm text-white/40 mt-0.5">
            HuggingFace ML models for clause classification, summarization, and entity recognition
          </p>
        </div>
        <div
          className="ml-auto px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest"
          style={{ background: 'rgba(139,92,246,0.08)', color: ACCENT, border: '1px solid rgba(139,92,246,0.15)' }}
        >
          HF Powered
        </div>
      </div>

      {/* Task selector */}
      <div className="grid grid-cols-3 gap-3">
        {TASKS.map((t) => {
          const Icon = t.icon;
          const active = task === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTask(t.id)}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                background: active ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <Icon className="w-4 h-4 mb-2" style={{ color: active ? ACCENT : '#64748b' }} />
              <div className="text-sm font-medium" style={{ color: active ? '#d4b8ff' : '#94a3b8' }}>
                {t.label}
              </div>
              <div className="text-[10px] text-white/30 mt-0.5">{t.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Input */}
      <div
        className="rounded-xl p-5 space-y-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <label className="text-xs font-medium text-white/50 uppercase tracking-widest">Clause / Document Text</label>
        <textarea
          className="w-full h-36 text-sm rounded-lg p-3 resize-none focus:outline-none focus:ring-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#e2e8f0',
          }}
          placeholder="Paste a contract clause or document excerpt…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={() => mutation.mutate({ text, task })}
          disabled={mutation.isPending || text.trim().length < 10}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
          style={{ background: ACCENT, color: '#fff' }}
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {mutation.isPending ? 'Analyzing…' : 'Analyze with HuggingFace'}
        </button>
      </div>

      {/* Error */}
      {mutation.isError && (
        <div
          className="rounded-xl p-4 flex items-center gap-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-red-300">{mutation.error.message}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div
          className="rounded-xl p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold text-white/80">
                {result.task === 'classify' ? 'Classification' : result.task === 'summarize' ? 'Summary' : 'Entities'}
              </span>
            </div>
            <span className="text-[10px] text-white/30 font-mono">{result.latencyMs}ms · {result.model}</span>
          </div>

          {result.task === 'classify' && (
            <div className="space-y-4">
              <div
                className="rounded-lg p-4"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
              >
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Top Category</div>
                <div className="text-xl font-bold capitalize" style={{ color: ACCENT }}>
                  {result.topCategory}
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                  Confidence: {Math.round(result.confidence * 100)}%
                </div>
              </div>
              {result.riskFlags.length > 0 && (
                <div className="space-y-1.5">
                  {result.riskFlags.map((flag, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                      style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-amber-300">{flag}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-white/30">All Categories</div>
                {result.allCategories.map((cat) => (
                  <div key={cat.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60 capitalize">{cat.label}</span>
                    </div>
                    <ScoreBar score={cat.score} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.task === 'summarize' && (
            <div
              className="rounded-lg p-4 text-sm leading-relaxed"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#cbd5e1',
              }}
            >
              {result.summary}
            </div>
          )}

          {result.task === 'ner' && (
            <div className="space-y-2">
              {result.entities.length === 0 ? (
                <p className="text-sm text-white/40 italic">No named entities detected.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.entities.map((e, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-xs font-mono"
                      style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#d4b8ff' }}
                    >
                      <span className="text-white/40 mr-1">[{e.entity}]</span>
                      {e.word}
                      <span className="ml-1 text-white/30">({Math.round(e.score * 100)}%)</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Model info footer */}
      <div
        className="rounded-xl p-4 flex items-center gap-4 text-xs text-white/30"
        style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}
      >
        <Scale className="w-3.5 h-3.5 shrink-0" />
        <span>
          Powered by open-source HuggingFace models:{' '}
          <span className="font-mono text-white/40">facebook/bart-large-mnli</span> (classification),{' '}
          <span className="font-mono text-white/40">facebook/bart-large-cnn</span> (summarization),{' '}
          <span className="font-mono text-white/40">dslim/bert-base-NER</span> (entities).
        </span>
        <ChevronRight className="w-3 h-3 shrink-0 ml-auto" />
      </div>
    </div>
  );
}
