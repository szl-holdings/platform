import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader,
  Megaphone,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';

interface AuditFinding {
  check_id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  issue: string;
  recommendation: string;
  evidence: string;
}

interface AuditResult {
  audit_id: string;
  platform: string;
  total_checks: number;
  checks_run: number;
  summary: { critical: number; warning: number; info: number; passed: number };
  findings: AuditFinding[];
  skill_pack: string;
  trace_id: string;
  duration_ms: number;
}

const SAMPLE_INPUTS = [
  {
    label: 'Google Ads — SaaS lead gen',
    platform: 'google_ads',
    input:
      'Headline: Comprehensive Marketing Solutions for Growing Teams\nDescription: Our platform provides complete marketing automation and analytics. Learn more about our comprehensive suite of tools designed to help your team succeed.\nCTA: Learn More',
  },
  {
    label: 'LinkedIn — B2B consulting',
    platform: 'linkedin',
    input:
      'Our consulting firm offers world-class advisory services. We help businesses achieve their goals through strategic planning and execution. Contact us to discuss your needs.',
  },
  {
    label: 'Meta — e-commerce brand (optimised)',
    platform: 'meta',
    input:
      "Stop losing sales to slow shipping. Our premium collection ships free in 24h on orders over $50. Join 12,000+ customers who switched. Shop the drop — limited stock.",
  },
];

const severityConfig = {
  critical: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    badge: 'text-red-400 bg-red-500/10 border-red-500/20',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    label: 'Warning',
  },
  info: {
    icon: Sparkles,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    label: 'Info',
  },
};

function FindingCard({ finding }: { finding: AuditFinding }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = severityConfig[finding.severity];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${cfg.badge}`}>
              {cfg.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground font-mono">{finding.check_id}</span>
            <span className="text-[10px] text-muted-foreground">{finding.category}</span>
          </div>
          <p className="text-sm font-medium text-foreground leading-snug">{finding.issue}</p>
        </div>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
              Recommendation
            </p>
            <p className="text-sm text-foreground leading-relaxed">{finding.recommendation}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
              Evidence
            </p>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed bg-black/20 rounded-lg px-3 py-2">
              {finding.evidence}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdsAudit() {
  usePageMeta({
    title: 'Ads Audit | Carlota Jo Consulting — Paid-Ads Creative Audit',
    description:
      'Run a 250+ check paid-ads audit via the claude-ads skill pack. Get structured findings on CTA effectiveness, brand alignment, emotional resonance, and platform compliance.',
    canonical: 'https://szlholdings.com/carlota-jo/ads-audit',
  });

  const [input, setInput] = useState('');
  const [platform, setPlatform] = useState<string>('generic');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  async function handleRun() {
    if (!input.trim() || running) return;
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      const resp = await fetch('/api/praxis-tools/marketing-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creative: input, platform }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error ?? `Server returned ${resp.status}`);
      }

      const data = await resp.json() as AuditResult;
      setResult(data);
      setActiveFilter('all');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit failed — please try again.');
    } finally {
      setRunning(false);
    }
  }

  function loadSample(sample: (typeof SAMPLE_INPUTS)[0]) {
    setInput(sample.input);
    setPlatform(sample.platform);
    setResult(null);
    setError(null);
  }

  const visibleFindings = result
    ? activeFilter === 'all'
      ? result.findings
      : result.findings.filter((f) => f.severity === activeFilter)
    : [];

  const platforms = ['generic', 'google_ads', 'meta', 'linkedin', 'tiktok'] as const;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
            <Megaphone className="w-7 h-7 text-primary" />
            Paid-Ads Audit
          </h1>
          <p className="text-muted-foreground mt-2">
            250+ checks across CTA effectiveness, brand alignment, emotional resonance, platform
            format compliance, and social proof — powered by the{' '}
            <a
              href="https://github.com/AgriciDaniel/claude-ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              claude-ads
              <ExternalLink className="w-3 h-3" />
            </a>{' '}
            skill pack (MIT).
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Ad Creative Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
                Sample inputs
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_INPUTS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => loadSample(s)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your ad headline, description, and CTA here. Or include a campaign JSON export…"
              rows={6}
              className="w-full rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/40 font-mono"
            />

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="text-xs rounded-lg border border-border bg-muted/20 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                >
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p === 'generic' ? 'Generic' : p === 'google_ads' ? 'Google Ads' : p === 'meta' ? 'Meta (Facebook/Instagram)' : p === 'linkedin' ? 'LinkedIn' : 'TikTok'}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRun}
                disabled={running || !input.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity ml-auto"
              >
                {running ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Running 254 checks…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Run Ads Audit
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(
                [
                  { key: 'critical', label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                  { key: 'warning', label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                  { key: 'info', label: 'Info', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                  { key: 'passed', label: 'Passed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                ] as const
              ).map(({ key, label, color, bg }) => (
                <Card key={key} className={`border ${bg}`}>
                  <CardContent className="p-4 text-center">
                    <p className={`text-3xl font-bold ${color}`}>
                      {result.summary[key as keyof typeof result.summary]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                      activeFilter === f
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f} {f !== 'all' && `(${result.summary[f]})`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                <span>{result.skill_pack}</span>
                <span>·</span>
                <span>{result.duration_ms}ms</span>
                <span>·</span>
                <span>{result.checks_run}/{result.total_checks} checks</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-3">
              {visibleFindings.map((f) => (
                <FindingCard key={f.check_id} finding={f} />
              ))}
              {visibleFindings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground/40">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No findings at this severity level.</p>
                </div>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/40 font-mono text-center">
              Audit ID: {result.audit_id} · Trace: {result.trace_id} · {result.skill_pack} · Platform: {result.platform} · via /api/praxis-tools/marketing-audit
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
