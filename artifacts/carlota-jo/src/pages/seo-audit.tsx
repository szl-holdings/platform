import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe,
  Loader,
  Search,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';

interface KeywordGap {
  keyword: string;
  volume: number;
  difficulty: number;
  current_rank: number | null;
  opportunity: 'high' | 'medium' | 'low';
}

interface OnPageFinding {
  issue: string;
  severity: 'critical' | 'warning' | 'info';
  fix: string;
}

interface SeoResult {
  audit_id: string;
  url: string;
  overall_score: number;
  on_page: { score: number; findings: OnPageFinding[] };
  keyword_coverage: { score: number; top_gaps: KeywordGap[] };
  backlinks: { score: number; domain_authority: number; referring_domains: number };
  serp_features: { score: number; opportunities: string[] };
  core_web_vitals: { score: number; lcp_ms: number; fid_ms: number; cls: number; status: string };
  recommendations: { priority: number; impact: 'high' | 'medium' | 'low'; action: string }[];
  skill_pack: string;
  trace_id: string;
  duration_ms: number;
}

const SAMPLE_URLS = [
  'https://szlholdings.com/carlota-jo/',
  'https://szlholdings.com/carlota-jo/services',
  'https://szlholdings.com/carlota-jo/methodology',
];

const SAMPLE_KEYWORDS = ['fractional cmo services', 'b2b marketing consultant', 'brand strategy agency'];

const impactColors = {
  high: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-muted-foreground bg-muted/20 border-border',
};

const opportunityColors = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-muted-foreground',
};

const severityConfig = {
  critical: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/8 border-red-500/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/8 border-amber-500/20' },
  info: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/8 border-blue-500/20' },
};

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex flex-col items-center gap-1">
      <p className={`text-2xl font-bold ${color}`}>{score}</p>
      <p className="text-[10px] text-muted-foreground text-center">{label}</p>
    </div>
  );
}

export default function SeoAudit() {
  usePageMeta({
    title: 'SEO Audit | Carlota Jo Consulting — Toprank-Style SEO Analysis',
    description:
      'Run a Toprank-style SEO audit: keyword gaps, SERP feature detection, backlink scoring, and AI on-page recommendations for your web pages.',
    canonical: 'https://szlholdings.com/carlota-jo/seo-audit',
  });

  const [url, setUrl] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'on_page' | 'keywords' | 'backlinks' | 'serp' | 'recommendations'>('on_page');
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);

  async function handleRun() {
    if (!url.trim() || running) return;
    setRunning(true);
    setResult(null);
    setError(null);

    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 10);

    try {
      const resp = await fetch('/api/praxis-tools/seo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), keywords }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error ?? `Server returned ${resp.status}`);
      }

      const data = await resp.json() as SeoResult;
      setResult(data);
      setActiveTab('on_page');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit failed — please try again.');
    } finally {
      setRunning(false);
    }
  }

  const tabs = [
    { key: 'on_page', label: 'On-Page', score: result?.on_page.score },
    { key: 'keywords', label: 'Keywords', score: result?.keyword_coverage.score },
    { key: 'backlinks', label: 'Backlinks', score: result?.backlinks.score },
    { key: 'serp', label: 'SERP Features', score: result?.serp_features.score },
    { key: 'recommendations', label: 'Recommendations', score: undefined },
  ] as const;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
            <Search className="w-7 h-7 text-primary" />
            SEO Audit
          </h1>
          <p className="text-muted-foreground mt-2">
            Keyword gap analysis, SERP feature detection, backlink scoring, and AI on-page
            recommendations — powered by the{' '}
            <a
              href="https://github.com/nowork-studio/toprank"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Toprank
              <ExternalLink className="w-3 h-3" />
            </a>{' '}
            skill pack (MIT).
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Audit Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Page URL</label>
              <div className="flex gap-2 flex-wrap">
                {SAMPLE_URLS.map((u) => (
                  <button
                    key={u}
                    onClick={() => { setUrl(u); setResult(null); setError(null); }}
                    className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                  >
                    {u.replace('https://szlholdings.com', '')}
                  </button>
                ))}
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-domain.com/page-to-audit"
                className="w-full mt-2 rounded-xl border border-border bg-muted/20 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Target Keywords{' '}
                <span className="text-muted-foreground/50">(comma-separated, optional)</span>
              </label>
              <div className="flex gap-2 flex-wrap mb-2">
                {SAMPLE_KEYWORDS.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => setKeywordsInput((prev) => prev ? `${prev}, ${kw}` : kw)}
                    className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                  >
                    + {kw}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="fractional cmo, b2b marketing consultant, brand strategy…"
                className="w-full rounded-xl border border-border bg-muted/20 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
              />
            </div>

            <button
              onClick={handleRun}
              disabled={running || !url.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity w-full justify-center"
            >
              {running ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Running Toprank audit via API…
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Run SEO Audit
                </>
              )}
            </button>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
              <Card className="sm:col-span-1 flex flex-col items-center justify-center p-4 border-primary/20 bg-primary/5">
                <ScoreRing score={result.overall_score} label="Overall" />
              </Card>
              <Card className="sm:col-span-1 flex items-center justify-center p-4">
                <ScoreRing score={result.on_page.score} label="On-Page" />
              </Card>
              <Card className="sm:col-span-1 flex items-center justify-center p-4">
                <ScoreRing score={result.keyword_coverage.score} label="Keywords" />
              </Card>
              <Card className="sm:col-span-1 flex items-center justify-center p-4">
                <ScoreRing score={result.backlinks.score} label="Backlinks" />
              </Card>
              <Card className="sm:col-span-1 flex items-center justify-center p-4">
                <ScoreRing score={result.core_web_vitals.score} label="Core Web Vitals" />
              </Card>
            </div>

            <div className="flex gap-1 border-b border-border overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {tab.score !== undefined && (
                    <span
                      className={`ml-1.5 text-[10px] font-mono ${tab.score >= 80 ? 'text-emerald-400' : tab.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}
                    >
                      {tab.score}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'on_page' && (
              <div className="space-y-3">
                {result.on_page.findings.map((f, i) => {
                  const cfg = severityConfig[f.severity];
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className={`rounded-xl border ${cfg.bg} overflow-hidden`}>
                      <button
                        onClick={() => setExpandedFinding((e) => (e === i ? null : i))}
                        className="w-full flex items-start gap-3 p-4 text-left"
                      >
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground leading-snug">{f.issue}</p>
                        </div>
                        {expandedFinding === i ? (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                      </button>
                      {expandedFinding === i && (
                        <div className="px-4 pb-4 border-t border-white/5 pt-3">
                          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Fix</p>
                          <p className="text-sm text-foreground leading-relaxed">{f.fix}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'keywords' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="text-xs text-muted-foreground font-medium pb-2 pr-4">Keyword</th>
                      <th className="text-xs text-muted-foreground font-medium pb-2 pr-4 text-right">Volume</th>
                      <th className="text-xs text-muted-foreground font-medium pb-2 pr-4 text-right">Difficulty</th>
                      <th className="text-xs text-muted-foreground font-medium pb-2 pr-4 text-right">Current Rank</th>
                      <th className="text-xs text-muted-foreground font-medium pb-2">Opportunity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.keyword_coverage.top_gaps.map((kw) => (
                      <tr key={kw.keyword} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 pr-4 font-mono text-xs">{kw.keyword}</td>
                        <td className="py-2.5 pr-4 text-right text-xs">{kw.volume.toLocaleString()}</td>
                        <td className="py-2.5 pr-4 text-right text-xs">{kw.difficulty}/100</td>
                        <td className="py-2.5 pr-4 text-right text-xs">
                          {kw.current_rank ? `#${kw.current_rank}` : <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="py-2.5">
                          <span className={`text-[10px] font-semibold uppercase ${opportunityColors[kw.opportunity]}`}>
                            {kw.opportunity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'backlinks' && (
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-foreground">{result.backlinks.domain_authority}</p><p className="text-xs text-muted-foreground mt-1">Domain Authority</p></CardContent></Card>
                <Card><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-foreground">{result.backlinks.referring_domains}</p><p className="text-xs text-muted-foreground mt-1">Referring Domains</p></CardContent></Card>
                <Card className="border-amber-500/20 bg-amber-500/5"><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-amber-400">{result.backlinks.score}</p><p className="text-xs text-muted-foreground mt-1">Backlink Score</p></CardContent></Card>
              </div>
            )}

            {activeTab === 'serp' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{result.serp_features.opportunities.length} SERP feature opportunities detected for target queries.</p>
                <div className="flex flex-wrap gap-2">
                  {result.serp_features.opportunities.map((opp) => (
                    <Badge key={opp} variant="outline" className="text-sm border-primary/30 text-primary bg-primary/5 px-3 py-1">
                      {opp.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-4">
                    <p className="text-sm text-emerald-400 font-medium">Recommendation</p>
                    <p className="text-sm text-foreground mt-1">Add FAQ schema to your top 3 pages to capture People Also Ask features. Estimated +15% click-through rate from SERP feature capture.</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-3">
                {result.recommendations.map((rec) => (
                  <div
                    key={rec.priority}
                    className={`rounded-xl border p-4 flex items-start gap-3 ${
                      rec.impact === 'high'
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : rec.impact === 'medium'
                          ? 'border-amber-500/20 bg-amber-500/5'
                          : 'border-border bg-muted/10'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">{rec.priority}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground leading-snug">{rec.action}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${impactColors[rec.impact]}`}>
                      {rec.impact} impact
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/40 font-mono text-center">
              Audit ID: {result.audit_id} · Trace: {result.trace_id} · {result.skill_pack} · URL: {result.url} · via /api/praxis-tools/seo-audit
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
