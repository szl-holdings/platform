import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileText,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

const ACCENT = '#8b5cf6';

interface PlaybookRule {
  id: string;
  clauseType: string;
  ruleName: string;
  description: string;
  requiredLanguage?: string;
  prohibitedTerms: string[];
  riskThreshold: number;
  severity: string;
}

interface Finding {
  ruleId: string;
  ruleName: string;
  severity: string;
  finding: string;
  flagged: boolean;
}

interface RiskDiff {
  overallCompliance: string;
  flaggedCount: number;
  totalRulesChecked: number;
  findings: Finding[];
}

interface PlaybookResponse {
  playbook: PlaybookRule[];
  total: number;
  version: string;
}

interface TaxonomyEntry {
  id: string;
  label: string;
}

interface TaxonomyResponse {
  taxonomy: TaxonomyEntry[];
}

function severityBadge(severity: string) {
  const map: Record<string, string> = {
    critical: 'bg-red-500/12 border-red-500/25 text-red-400',
    high: 'bg-amber-500/12 border-amber-500/25 text-amber-400',
    medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    low: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  };
  return map[severity] ?? 'bg-white/5 border-white/10 text-white/40';
}

function complianceBadge(compliance: string) {
  if (compliance === 'compliant') return 'bg-emerald-500/12 border-emerald-500/30 text-emerald-400';
  if (compliance === 'critical_drift') return 'bg-red-500/12 border-red-500/30 text-red-400';
  if (compliance === 'no_rules') return 'bg-white/6 border-white/12 text-white/40';
  return 'bg-amber-500/12 border-amber-500/30 text-amber-400';
}

function complianceLabel(compliance: string) {
  if (compliance === 'compliant') return 'Playbook Compliant';
  if (compliance === 'critical_drift') return 'Critical Drift Detected';
  if (compliance === 'no_rules') return 'No Rules Configured';
  return 'Drift Detected';
}

function complianceIcon(compliance: string) {
  if (compliance === 'compliant') return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  return <AlertTriangle className="w-5 h-5 text-amber-400" />;
}

export default function RiskDiffPage() {
  const [clauseType, setClauseType] = useState('');
  const [draftText, setDraftText] = useState('');
  const [result, setResult] = useState<RiskDiff | null>(null);
  const [showPlaybook, setShowPlaybook] = useState(false);

  const { data: taxData } = useQuery<TaxonomyResponse>({
    queryKey: ['counsel-taxonomy'],
    queryFn: () => apiFetch<TaxonomyResponse>('/counsel/clauses/taxonomy'),
  });

  const { data: playbookData, isLoading: playbookLoading } = useQuery<PlaybookResponse>({
    queryKey: ['counsel-playbook'],
    queryFn: () => apiFetch<PlaybookResponse>('/counsel/clauses/playbook'),
  });

  const taxonomy = taxData?.taxonomy ?? [];
  const playbook = playbookData?.playbook ?? [];
  const filteredPlaybook = clauseType
    ? playbook.filter((r) => r.clauseType === clauseType)
    : playbook;

  const mutation = useMutation({
    mutationFn: async () => {
      const data = await apiFetch<{ riskDiff: RiskDiff }>('/counsel/clauses/risk-diff', {
        method: 'POST',
        body: JSON.stringify({ draftText, clauseType }),
      });
      return data.riskDiff;
    },
    onSuccess: (data) => setResult(data),
  });

  const criticalCount = result?.findings.filter((f) => f.flagged && f.severity === 'critical').length ?? 0;
  const highCount = result?.findings.filter((f) => f.flagged && f.severity === 'high').length ?? 0;

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
            <Shield className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-white/90">Risk Diff</h1>
            <p className="text-[10px] text-violet-400/40 font-mono uppercase tracking-wider">
              Draft vs. Firm Playbook · {playbookData?.version ?? '–'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/drafting-agent">
            <button
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all"
              style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`, color: ACCENT }}
            >
              <Sparkles className="w-3 h-3" />
              Drafting Agent
            </button>
          </Link>
          <Link href="/clause-genome">
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium border border-white/8 text-white/40 hover:border-white/15 transition-all">
              <BookOpen className="w-3 h-3" />
              Clause Library
            </button>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className="w-80 shrink-0 border-r overflow-y-auto p-5 space-y-5"
          style={{ borderColor: 'rgba(139,92,246,0.08)' }}
        >
          <div>
            <div className="text-[9px] uppercase tracking-widest text-violet-400/40 mb-2">Clause Type</div>
            <div className="relative">
              <select
                value={clauseType}
                onChange={(e) => { setClauseType(e.target.value); setResult(null); }}
                className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2.5 text-[12px] text-white/70 focus:outline-none focus:border-violet-500/30 appearance-none pr-8"
              >
                <option value="">All types (no playbook filter)</option>
                {taxonomy.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-widest text-violet-400/40 mb-2">Draft Clause Text</div>
            <textarea
              value={draftText}
              onChange={(e) => { setDraftText(e.target.value); setResult(null); }}
              placeholder="Paste your clause draft here to check it against the firm playbook…"
              className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2.5 text-[11px] font-mono text-white/65 placeholder:text-white/20 focus:outline-none focus:border-violet-500/30 resize-none"
              rows={10}
            />
          </div>

          <button
            disabled={!draftText.trim() || mutation.isPending}
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
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Checking…
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Run Risk Diff
              </>
            )}
          </button>

          <div>
            <button
              onClick={() => setShowPlaybook((p) => !p)}
              className="w-full flex items-center justify-between text-[10px] text-violet-400/40 hover:text-violet-400/70 transition-colors py-1"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                {filteredPlaybook.length} Playbook Rule{filteredPlaybook.length !== 1 ? 's' : ''}
                {clauseType ? ` (${clauseType})` : ''}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPlaybook ? 'rotate-180' : ''}`} />
            </button>
            {showPlaybook && !playbookLoading && (
              <div className="mt-2 space-y-2">
                {filteredPlaybook.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-lg p-3 border"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${severityBadge(rule.severity)}`}>
                        {rule.severity}
                      </span>
                      <span className="text-[10px] font-medium text-white/70 truncate">{rule.ruleName}</span>
                    </div>
                    <p className="text-[10px] text-white/35 leading-relaxed">{rule.description}</p>
                    {rule.requiredLanguage && (
                      <p className="text-[9px] font-mono text-emerald-400/50 mt-1.5 pt-1.5 border-t border-white/5">
                        Required: "{rule.requiredLanguage}"
                      </p>
                    )}
                    {rule.prohibitedTerms.length > 0 && (
                      <p className="text-[9px] font-mono text-red-400/50 mt-1">
                        Prohibited: {(rule.prohibitedTerms as string[]).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!result && !mutation.isPending && (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
              <Shield className="w-10 h-10 text-violet-400" />
              <p className="text-[13px] text-white/50 text-center max-w-xs leading-relaxed">
                Paste a clause draft and select a type, then run Risk Diff to see how it measures against your firm's standard playbook
              </p>
            </div>
          )}

          {mutation.isPending && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
              <p className="text-[12px] text-violet-400/60">Comparing against firm playbook…</p>
            </div>
          )}

          {result && (
            <>
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ background: 'rgba(20,12,40,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}
              >
                <div className="flex items-center gap-3">
                  {complianceIcon(result.overallCompliance)}
                  <div>
                    <h2 className="text-[14px] font-semibold text-white/90">
                      {complianceLabel(result.overallCompliance)}
                    </h2>
                    <p className="text-[10px] text-white/30">
                      {result.totalRulesChecked} rules checked · {result.flaggedCount} flagged
                    </p>
                  </div>
                  <span
                    className={`ml-auto text-[10px] font-mono px-2 py-1 rounded border ${complianceBadge(result.overallCompliance)}`}
                  >
                    {complianceLabel(result.overallCompliance)}
                  </span>
                </div>

                {(criticalCount > 0 || highCount > 0) && (
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-red-500/5 border border-red-500/15">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-[11px] text-red-300/80">
                      {criticalCount > 0 && `${criticalCount} critical`}
                      {criticalCount > 0 && highCount > 0 && ' + '}
                      {highCount > 0 && `${highCount} high`}
                      {' '}issue{(criticalCount + highCount) !== 1 ? 's' : ''} — partner review required before execution
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Critical',
                      count: result.findings.filter((f) => f.flagged && f.severity === 'critical').length,
                      color: '#ef4444',
                    },
                    {
                      label: 'High',
                      count: result.findings.filter((f) => f.flagged && f.severity === 'high').length,
                      color: '#f59e0b',
                    },
                    {
                      label: 'Compliant',
                      count: result.findings.filter((f) => !f.flagged).length,
                      color: '#10b981',
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl p-3 text-center border"
                      style={{
                        background: `${stat.color}08`,
                        border: `1px solid ${stat.color}18`,
                      }}
                    >
                      <div
                        className="text-[22px] font-bold font-mono"
                        style={{ color: stat.color }}
                      >
                        {stat.count}
                      </div>
                      <div className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[9px] uppercase tracking-widest text-violet-400/40 px-1">
                  Findings
                </div>
                {result.findings.map((f, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-4 border flex items-start gap-3 transition-all ${
                      f.flagged
                        ? f.severity === 'critical'
                          ? 'bg-red-500/6 border-red-500/20'
                          : f.severity === 'high'
                            ? 'bg-amber-500/6 border-amber-500/20'
                            : 'bg-yellow-500/5 border-yellow-500/15'
                        : 'bg-white/2 border-white/5'
                    }`}
                  >
                    {f.flagged ? (
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          f.severity === 'critical'
                            ? 'text-red-400'
                            : f.severity === 'high'
                              ? 'text-amber-400'
                              : 'text-yellow-400'
                        }`}
                      />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[12px] font-medium text-white/80">{f.ruleName}</p>
                        {f.flagged && (
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${severityBadge(f.severity)}`}
                          >
                            {f.severity}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] leading-relaxed ${
                          f.flagged ? 'text-amber-300/70' : 'text-white/30'
                        }`}
                      >
                        {f.finding}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
