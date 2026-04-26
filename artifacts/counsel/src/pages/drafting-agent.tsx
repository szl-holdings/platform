import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  Scale,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

const ACCENT = '#8b5cf6';

interface TaxonomyEntry {
  id: string;
  label: string;
  description: string;
  clauseCount: number;
}

interface Citation {
  matterId: string;
  matterName: string;
  documentRef: string;
  riskScore: number;
  jurisdiction: string;
  excerpt: string;
}

interface ProvenanceEnvelope {
  generatedAt: string;
  model: string;
  retrievalMethod: string;
  corpusSize: number;
  clauseType: string;
  citationCount: number;
  policyVerdict: string;
  confidenceNote: string;
}

interface ConfidenceBand {
  lower: number;
  point: number;
  upper: number;
  label: string;
}

interface RiskDiff {
  overallCompliance: string;
  flaggedCount: number;
  totalRulesChecked: number;
  findings: {
    ruleId: string;
    ruleName: string;
    severity: string;
    finding: string;
    flagged: boolean;
  }[];
}

interface DraftResult {
  clauseType: string;
  category: string;
  text: string;
  citations: Citation[];
  provenanceEnvelope: ProvenanceEnvelope;
  confidenceBand: ConfidenceBand;
  riskDiff: RiskDiff;
  generatedAt: string;
  policyVerdict: string;
}

interface TaxonomyResponse {
  taxonomy: TaxonomyEntry[];
}

const MATTERS = [
  { id: 'matter-001', name: 'Greenfield v. Apex' },
  { id: 'matter-002', name: 'TechCo IP Dispute' },
  { id: 'matter-003', name: '2024-SEC-441 (Securities Investigation)' },
  { id: 'matter-004', name: 'Apex Acquisition' },
];

function complianceBadge(compliance: string) {
  if (compliance === 'compliant')
    return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
  if (compliance === 'critical_drift')
    return 'bg-red-500/10 border-red-500/25 text-red-400';
  return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
}

function complianceLabel(compliance: string) {
  if (compliance === 'compliant') return 'Playbook Compliant';
  if (compliance === 'critical_drift') return 'Critical Drift';
  if (compliance === 'no_rules') return 'No Rules Configured';
  return 'Drift Detected';
}

function severityColor(severity: string) {
  const map: Record<string, string> = {
    critical: 'text-red-400',
    high: 'text-amber-400',
    medium: 'text-yellow-400',
    low: 'text-emerald-400',
  };
  return map[severity] ?? 'text-white/40';
}

export default function DraftingAgentPage() {
  const [clauseType, setClauseType] = useState('');
  const [matterId, setMatterId] = useState('');
  const [context, setContext] = useState('');
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(true);
  const [showDiff, setShowDiff] = useState(true);

  const { data: taxData } = useQuery<TaxonomyResponse>({
    queryKey: ['counsel-taxonomy'],
    queryFn: () => apiFetch<TaxonomyResponse>('/counsel/clauses/taxonomy'),
  });
  const taxonomy = taxData?.taxonomy ?? [];

  const mutation = useMutation({
    mutationFn: async () => {
      const data = await apiFetch<{ draft: DraftResult }>('/counsel/clauses/draft', {
        method: 'POST',
        body: JSON.stringify({ clauseType, matterId: matterId || undefined, context: context || undefined }),
      });
      return data.draft;
    },
    onSuccess: (data) => setDraft(data),
  });

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidence = draft?.confidenceBand;
  const pct = confidence ? Math.round(confidence.point * 100) : 0;
  const confColor =
    confidence?.label === 'High' ? '#10b981' : confidence?.label === 'Moderate' ? '#f59e0b' : '#ef4444';

  return (
    <div className="h-full flex flex-col" style={{ background: '#0a0614' }}>
      <div
        className="px-6 py-4 border-b flex items-center justify-between gap-4"
        style={{ borderColor: 'rgba(139,92,246,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}20` }}
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-white/90">Drafting Agent</h1>
            <p className="text-[10px] text-violet-400/40 font-mono uppercase tracking-wider">
              Precedent-Aware · Provenance-Anchored
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/clause-genome">
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium border border-white/8 text-white/40 hover:border-white/15 transition-all">
              <BookOpen className="w-3 h-3" />
              Clause Library
            </button>
          </Link>
          <Link href="/risk-diff">
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium border border-white/8 text-white/40 hover:border-white/15 transition-all">
              <Shield className="w-3 h-3" />
              Risk Diff
            </button>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className="w-72 shrink-0 border-r overflow-y-auto p-5 space-y-5"
          style={{ borderColor: 'rgba(139,92,246,0.08)' }}
        >
          <div>
            <div className="text-[9px] uppercase tracking-widest text-violet-400/40 mb-2">Clause Type</div>
            <div className="relative">
              <select
                value={clauseType}
                onChange={(e) => setClauseType(e.target.value)}
                className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2.5 text-[12px] text-white/70 focus:outline-none focus:border-violet-500/30 appearance-none pr-8"
              >
                <option value="">Select clause type…</option>
                {taxonomy.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            </div>
            {clauseType && taxonomy.find((t) => t.id === clauseType) && (
              <p className="text-[10px] text-white/30 mt-1.5 leading-relaxed">
                {taxonomy.find((t) => t.id === clauseType)?.description}
              </p>
            )}
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-widest text-violet-400/40 mb-2">Link to Matter</div>
            <div className="relative">
              <select
                value={matterId}
                onChange={(e) => setMatterId(e.target.value)}
                className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2.5 text-[12px] text-white/70 focus:outline-none focus:border-violet-500/30 appearance-none pr-8"
              >
                <option value="">No matter (standalone)</option>
                {MATTERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-widest text-violet-400/40 mb-2">
              Context / Instructions
            </div>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. 'High-value M&A deal with Delaware target, include knowledge qualifier for seller reps…'"
              className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2.5 text-[12px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-violet-500/30 resize-none"
              rows={5}
            />
          </div>

          <button
            disabled={!clauseType || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}cc, #6d28d9cc)`,
              border: `1px solid ${ACCENT}40`,
              color: '#fff',
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Drafting…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Draft
              </>
            )}
          </button>

          {mutation.isError && (
            <div className="rounded-lg p-3 bg-red-500/8 border border-red-500/20 text-[11px] text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
              {(mutation.error as Error).message}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!draft && !mutation.isPending && (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
              <Sparkles className="w-10 h-10 text-violet-400" />
              <p className="text-[13px] text-white/50 text-center max-w-xs leading-relaxed">
                Select a clause type and generate a precedent-anchored draft from your firm's corpus
              </p>
            </div>
          )}

          {mutation.isPending && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
              <p className="text-[12px] text-violet-400/60">Retrieving precedent and drafting…</p>
            </div>
          )}

          {draft && (
            <>
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ background: 'rgba(20,12,40,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${complianceBadge(
                          draft.riskDiff.overallCompliance,
                        )}`}
                      >
                        {complianceLabel(draft.riskDiff.overallCompliance)}
                      </span>
                      <span className="text-[10px] font-mono text-violet-400/40">{draft.category}</span>
                    </div>
                    <h2 className="text-[14px] font-semibold text-white/90">
                      {taxonomy.find((t) => t.id === draft.clauseType)?.label ?? draft.clauseType} Draft
                    </h2>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      Generated {new Date(draft.generatedAt).toLocaleString()} · {draft.citations.length} precedent
                      {draft.citations.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[18px] font-bold font-mono" style={{ color: confColor }}>
                      {pct}%
                    </div>
                    <div className="text-[8px] text-white/25 uppercase tracking-wider">confidence</div>
                    <div className="w-16 h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: confColor }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] uppercase tracking-widest text-violet-400/40">Draft Text</div>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[10px] text-violet-400/50 hover:text-violet-400 transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div
                    className="text-[11px] text-white/65 leading-relaxed rounded-lg p-4 border font-mono whitespace-pre-wrap"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {draft.text}
                  </div>
                </div>

                <div
                  className="rounded-lg p-3 space-y-1.5"
                  style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.08)' }}
                >
                  <div className="text-[9px] uppercase tracking-widest text-violet-400/40 mb-2">
                    Provenance Envelope
                  </div>
                  {[
                    ['Model', draft.provenanceEnvelope.model],
                    ['Retrieval', draft.provenanceEnvelope.retrievalMethod],
                    ['Corpus', `${draft.provenanceEnvelope.corpusSize} clauses indexed`],
                    ['Citations', `${draft.provenanceEnvelope.citationCount} precedent(s) used`],
                    ['Policy', draft.provenanceEnvelope.policyVerdict],
                  ].map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[10px] text-white/30">{label}</span>
                      <span className="text-[10px] font-mono text-violet-300/70">{val as string}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-amber-400/60 mt-2 pt-2 border-t border-white/5">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    {draft.provenanceEnvelope.confidenceNote}
                  </p>
                </div>
              </div>

              {draft.citations.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(139,92,246,0.12)' }}
                >
                  <button
                    onClick={() => setShowCitations((p) => !p)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/2 transition-colors"
                    style={{ background: 'rgba(20,12,40,0.6)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Scale className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[12px] font-medium text-white/70">
                        Precedent Citations
                      </span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: `${ACCENT}18`, color: ACCENT }}
                      >
                        {draft.citations.length}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-white/25 transition-transform ${showCitations ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {showCitations && (
                    <div className="p-4 space-y-3" style={{ background: 'rgba(14,8,30,0.5)' }}>
                      {draft.citations.map((cit, i) => (
                        <div
                          key={i}
                          className="rounded-lg p-3 border"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <p className="text-[12px] font-medium text-white/80">{cit.matterName}</p>
                              <p className="text-[10px] font-mono text-white/30">{cit.documentRef}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                  cit.riskScore >= 0.7
                                    ? 'bg-red-500/10 border-red-500/25 text-red-400'
                                    : cit.riskScore >= 0.5
                                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                }`}
                              >
                                Risk {Math.round(cit.riskScore * 100)}
                              </span>
                              <span className="text-[9px] text-white/25">{cit.jurisdiction}</span>
                            </div>
                          </div>
                          <p className="text-[10px] font-mono text-white/35 leading-relaxed line-clamp-2">
                            {cit.excerpt}
                          </p>
                          <Link href="/clause-genome">
                            <button className="mt-2 flex items-center gap-1 text-[10px] text-violet-400/50 hover:text-violet-400 transition-colors">
                              <ChevronRight className="w-3 h-3" />
                              View in Clause Library
                            </button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {draft.riskDiff && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(139,92,246,0.12)' }}
                >
                  <button
                    onClick={() => setShowDiff((p) => !p)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/2 transition-colors"
                    style={{ background: 'rgba(20,12,40,0.6)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[12px] font-medium text-white/70">Playbook Risk Diff</span>
                      {draft.riskDiff.flaggedCount > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-amber-400">
                          {draft.riskDiff.flaggedCount} flagged
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-white/25 transition-transform ${showDiff ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {showDiff && (
                    <div className="p-4 space-y-2" style={{ background: 'rgba(14,8,30,0.5)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-1 rounded border ${complianceBadge(
                            draft.riskDiff.overallCompliance,
                          )}`}
                        >
                          {complianceLabel(draft.riskDiff.overallCompliance)}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {draft.riskDiff.totalRulesChecked} rules checked
                        </span>
                      </div>
                      {draft.riskDiff.findings.map((f, i) => (
                        <div
                          key={i}
                          className={`rounded-lg p-3 border flex items-start gap-2.5 ${
                            f.flagged
                              ? 'bg-amber-500/5 border-amber-500/15'
                              : 'bg-white/2 border-white/5'
                          }`}
                        >
                          {f.flagged ? (
                            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${severityColor(f.severity)}`} />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                          )}
                          <div>
                            <p className="text-[11px] font-medium text-white/70">{f.ruleName}</p>
                            <p className={`text-[10px] mt-0.5 ${f.flagged ? 'text-amber-400/70' : 'text-white/30'}`}>
                              {f.finding}
                            </p>
                          </div>
                          {f.flagged && (
                            <span
                              className={`ml-auto shrink-0 text-[9px] font-mono uppercase ${severityColor(f.severity)}`}
                            >
                              {f.severity}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
