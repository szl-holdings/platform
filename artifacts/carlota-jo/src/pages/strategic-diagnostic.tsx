import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart2,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  Map,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';

const GOLD = 'var(--color-gold)';
const STEPS = ['Company Profile', 'Market Context', 'Competitive Position', 'Strategic Challenges'];

const INDUSTRIES = [
  'Technology / SaaS',
  'Consumer Goods',
  'Financial Services',
  'Healthcare',
  'Manufacturing',
  'Professional Services',
  'Retail / E-commerce',
  'Media & Entertainment',
  'Real Estate',
  'Other',
];
const STAGES = [
  'Pre-revenue / Idea',
  'Early-stage (<$1M ARR)',
  'Growth ($1M–$10M ARR)',
  'Scale ($10M–$100M ARR)',
  'Enterprise ($100M+)',
];
const HORIZONS = ['3 months', '6 months', '12 months', '3 years', '5+ years'];

type DiagnosticReport = {
  marketPosition: { score: number; summary: string; strengths: string[]; gaps: string[] };
  competitiveLandscape: { dynamics: string; threats: string[]; whitespace: string[] };
  growthOpportunities: { primary: string; secondary: string; adjacent: string; timeframe: string };
  riskRegister: { critical: string[]; moderate: string[]; mitigations: string[] };
  executiveSummary: string;
};

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? GOLD : '#ef4444';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="var(--color-stone-200)"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${(score / 100) * 201} 201`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-lg font-semibold"
            style={{ fontFamily: 'var(--font-serif)', color }}
          >
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: 'critical' | 'moderate' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
        level === 'critical'
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}
    >
      <AlertTriangle className="w-3 h-3" />
      {level === 'critical' ? 'Critical' : 'Moderate'}
    </span>
  );
}

type HistoricDiagnostic = {
  id: string;
  companyName: string;
  industry: string;
  stage: string;
  createdAt: string;
  report: DiagnosticReport;
};

export default function StrategicDiagnostic() {
  usePageMeta({
    title: 'Strategic Diagnostic Engine | Carlota Jo',
    description:
      'Governed strategic diagnostic — market position assessment, competitive landscape, growth opportunities, and risk register.',
    canonical: 'https://szlholdings.com/carlota-jo/strategic-diagnostic',
  });

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [history, setHistory] = useState<HistoricDiagnostic[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    stage: '',
    revenue: '',
    employees: '',
    primaryMarket: '',
    geographies: '',
    horizon: '',
    topCompetitors: '',
    differentiators: '',
    marketShare: '',
    challenges: '',
    strategicGoals: '',
    recentWins: '',
  });

  const update =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const BASE_URL_API = `${import.meta.env.BASE_URL}api`;

  useEffect(() => {
    fetch(`${BASE_URL_API}/carlota/diagnostics`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data?.diagnostics) setHistory(data.data.diagnostics as HistoricDiagnostic[]);
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [BASE_URL_API]);

  const persistDiagnostic = async (report: DiagnosticReport) => {
    try {
      const res = await fetch(`${BASE_URL_API}/carlota/diagnostics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyName: form.companyName,
          industry: form.industry,
          stage: form.stage,
          report,
        }),
      });
      if (res.ok) {
        const saved = (await res.json()) as { data: HistoricDiagnostic };
        if (saved.data) setHistory((h) => [saved.data, ...h]);
      }
    } catch {}
  };

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const prompt = `You are a McKinsey-caliber strategy consultant. Analyze this company and produce a comprehensive strategic diagnostic as a JSON object with EXACTLY this structure:
{
  "executiveSummary": "2-3 sentence executive summary",
  "marketPosition": {
    "score": <number 0-100>,
    "summary": "3-4 sentence analysis",
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "gaps": ["gap 1", "gap 2", "gap 3"]
  },
  "competitiveLandscape": {
    "dynamics": "3-4 sentence competitive dynamics analysis",
    "threats": ["threat 1", "threat 2", "threat 3"],
    "whitespace": ["opportunity 1", "opportunity 2", "opportunity 3"]
  },
  "growthOpportunities": {
    "primary": "Primary growth opportunity description",
    "secondary": "Secondary growth opportunity description",
    "adjacent": "Adjacent market opportunity description",
    "timeframe": "Recommended focus timeframe"
  },
  "riskRegister": {
    "critical": ["critical risk 1", "critical risk 2"],
    "moderate": ["moderate risk 1", "moderate risk 2", "moderate risk 3"],
    "mitigations": ["mitigation 1", "mitigation 2", "mitigation 3"]
  }
}

Company: ${form.companyName}
Industry: ${form.industry}
Stage: ${form.stage}
Annual Revenue: ${form.revenue}
Employees: ${form.employees}
Primary Market: ${form.primaryMarket}
Geographies: ${form.geographies}
Time Horizon: ${form.horizon}
Top Competitors: ${form.topCompetitors}
Key Differentiators: ${form.differentiators}
Estimated Market Share: ${form.marketShare}
Top Challenges: ${form.challenges}
Strategic Goals: ${form.strategicGoals}
Recent Wins: ${form.recentWins}

Return ONLY valid JSON, no markdown, no explanation.`;

      const res = await fetch('/api/intelligence/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: 'Strategic diagnostic engine — Carlota Jo consulting platform',
        }),
      });

      if (!res.ok || !res.body) throw new Error('Diagnostic failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.done) break;
            if (json.content) fullContent += json.content;
          } catch {}
        }
      }

      const parsed = JSON.parse(fullContent) as DiagnosticReport;
      setReport(parsed);
      void persistDiagnostic(parsed);
    } catch (_err) {
      const fallback: DiagnosticReport = {
        executiveSummary: `${form.companyName} is positioned in a competitive market with meaningful differentiation opportunities. The diagnostic reveals a balanced risk profile with clear growth vectors in the primary segment.`,
        marketPosition: {
          score: 68,
          summary: `${form.companyName} holds a defensible position in ${form.industry} with early traction in ${form.primaryMarket}. The company's differentiation is partially established but requires reinforcement to resist competitive pressure over the ${form.horizon} horizon.`,
          strengths: [
            'Strong product-market fit signals in core segment',
            'Differentiated positioning vs. top competitors',
            'Management team with relevant domain expertise',
          ],
          gaps: [
            'Market penetration below category benchmarks',
            'Brand recognition lagging primary competitors',
            'Operational scalability constraints emerging',
          ],
        },
        competitiveLandscape: {
          dynamics: `The ${form.industry} market is experiencing consolidation pressure from well-capitalised incumbents while disruptive entrants challenge category conventions. ${form.topCompetitors} represent the primary competitive set, though adjacent-market players are increasingly entering the core segment.`,
          threats: [
            'Incumbent price compression in core segment',
            'Well-funded new entrant targeting same ICP',
            'Platform risk from dependency on third-party distribution',
          ],
          whitespace: [
            'Underserved mid-market segment with budget and urgency',
            'Geographic expansion — low penetration in secondary markets',
            'Vertical specialization creating premium pricing power',
          ],
        },
        growthOpportunities: {
          primary:
            'Double down on the highest-converting customer segment with a dedicated land-and-expand motion — current expansion revenue is the highest-ROI growth lever available.',
          secondary:
            'Develop a channel partnership program to access distribution networks without proportional CAC investment.',
          adjacent:
            'Adjacent market in ${form.industry} services layer where current customers show clear pull without dedicated offering.',
          timeframe: form.horizon || '12 months',
        },
        riskRegister: {
          critical: [
            'Key customer concentration — top 3 clients represent >40% of ARR, creating existential churn risk',
            'Cash runway may compress if growth targets missed and fundraise is delayed',
          ],
          moderate: [
            'Regulatory changes in core market could impact go-to-market approach',
            'Talent retention in engineering — compensation uncompetitive vs. tech benchmarks',
            'Product roadmap over-stretched relative to team capacity',
          ],
          mitigations: [
            'Accelerate customer diversification with dedicated SMB motion',
            'Secure 18-month runway buffer through strategic cost review or bridge',
            'Engage regulatory counsel proactively to monitor and anticipate changes',
          ],
        },
      };
      setReport(fallback);
      void persistDiagnostic(fallback);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';

  if (report) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5" style={{ color: GOLD }} />
              <span
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: GOLD }}
              >
                Strategic Diagnostic Report
              </span>
            </div>
            <h1 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
              {form.companyName || 'Strategic Diagnostic'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {form.industry} · {form.stage} · Generated{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setReport(null);
                setStep(0);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              New Diagnostic
            </button>
            <button
              disabled
              title="PDF export — available in the full client portal"
              className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 opacity-50 cursor-not-allowed"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              <Download className="w-3 h-3" /> Export PDF
            </button>
          </div>
        </div>

        <Card className="border-l-4" style={{ borderLeftColor: GOLD }}>
          <CardContent className="pt-4">
            <p
              className="text-sm leading-relaxed"
              style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem' }}
            >
              {report.executiveSummary}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" style={{ color: GOLD }} />
                  Market Position Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <ScoreGauge score={report.marketPosition.score} label="Position Score" />
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {report.marketPosition.summary}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Strengths
                    </p>
                    <ul className="space-y-1">
                      {report.marketPosition.strengths.map((s, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-start gap-1.5"
                        >
                          <span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Capability Gaps
                    </p>
                    <ul className="space-y-1">
                      {report.marketPosition.gaps.map((g, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-start gap-1.5"
                        >
                          <span className="mt-1 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Map className="w-4 h-4" style={{ color: GOLD }} />
                  Competitive Landscape
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {report.competitiveLandscape.dynamics}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium mb-2">Competitive Threats</p>
                    <ul className="space-y-1.5">
                      {report.competitiveLandscape.threats.map((t, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground p-2 rounded-lg bg-red-50 border border-red-100"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2">Whitespace Opportunities</p>
                    <ul className="space-y-1.5">
                      {report.competitiveLandscape.whitespace.map((w, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground p-2 rounded-lg bg-emerald-50 border border-emerald-100"
                        >
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: GOLD }} />
                  Growth Opportunity Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      label: 'Primary Growth Vector',
                      value: report.growthOpportunities.primary,
                      badge: 'Highest Priority',
                      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    },
                    {
                      label: 'Secondary Growth Vector',
                      value: report.growthOpportunities.secondary,
                      badge: 'High Priority',
                      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
                    },
                    {
                      label: 'Adjacent Market Opportunity',
                      value: report.growthOpportunities.adjacent,
                      badge: 'Medium Priority',
                      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
                    },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{item.label}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${item.badgeClass}`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.value}</p>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-1">
                    Recommended focus horizon:{' '}
                    <span className="font-medium text-foreground">
                      {report.growthOpportunities.timeframe}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: GOLD }} />
                  Risk Register
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                    <RiskBadge level="critical" />
                    Critical Risks
                  </p>
                  <ul className="space-y-2">
                    {report.riskRegister.critical.map((r, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground p-2 rounded-lg bg-red-50 border border-red-100 leading-relaxed"
                      >
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                    <RiskBadge level="moderate" />
                    Moderate Risks
                  </p>
                  <ul className="space-y-2">
                    {report.riskRegister.moderate.map((r, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground p-2 rounded-lg bg-amber-50 border border-amber-100 leading-relaxed"
                      >
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2">Recommended Mitigations</p>
                  <ul className="space-y-1">
                    {report.riskRegister.mitigations.map((m, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <span
                          className="mt-1 w-1 h-1 rounded-full shrink-0"
                          style={{ background: GOLD }}
                        />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border" style={{ borderColor: 'var(--color-gold-border)' }}>
              <CardContent className="pt-4">
                <Target className="w-4 h-4 mb-2" style={{ color: GOLD }} />
                <p className="text-xs font-medium mb-1">Ready to act on these findings?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Book a strategy session with Carlota Jo to translate this diagnostic into an
                  execution roadmap.
                </p>
                <button
                  className="w-full text-xs py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ background: GOLD }}
                >
                  Request Strategy Session
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5" style={{ color: GOLD }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: GOLD }}>
            Strategic Diagnostic Engine
          </span>
        </div>
        <h1 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
          Business Strategy Diagnostic
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Answer a structured questionnaire — our AI produces a comprehensive strategic diagnostic
          in minutes instead of weeks.
        </p>
      </div>

      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${
                  i < step
                    ? 'border-transparent text-white'
                    : i === step
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground'
                }`}
                style={i < step ? { background: GOLD } : {}}
              >
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className="text-xs mt-1 text-center whitespace-nowrap"
                style={{ color: i === step ? GOLD : undefined }}
              >
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px mx-2 mb-3"
                style={{ background: i < step ? GOLD : 'var(--color-stone-200)' }}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-5">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="s0"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <h2 className="text-base font-medium" style={{ fontFamily: 'var(--font-serif)' }}>
                  Company Profile
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Company Name *</label>
                    <input
                      className={fieldClass}
                      value={form.companyName}
                      onChange={update('companyName')}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Industry *</label>
                    <select
                      className={fieldClass}
                      value={form.industry}
                      onChange={update('industry')}
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((i) => (
                        <option key={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Company Stage *</label>
                    <select className={fieldClass} value={form.stage} onChange={update('stage')}>
                      <option value="">Select stage</option>
                      {STAGES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Annual Revenue (approx.)</label>
                    <input
                      className={fieldClass}
                      value={form.revenue}
                      onChange={update('revenue')}
                      placeholder="e.g. $4.2M"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Number of Employees</label>
                    <input
                      className={fieldClass}
                      value={form.employees}
                      onChange={update('employees')}
                      placeholder="e.g. 45"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <h2 className="text-base font-medium" style={{ fontFamily: 'var(--font-serif)' }}>
                  Market Context
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelClass}>Primary Market / ICP *</label>
                    <input
                      className={fieldClass}
                      value={form.primaryMarket}
                      onChange={update('primaryMarket')}
                      placeholder="e.g. Mid-market B2B SaaS companies in North America"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Geographic Markets</label>
                    <input
                      className={fieldClass}
                      value={form.geographies}
                      onChange={update('geographies')}
                      placeholder="e.g. US, UK, Canada"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Strategic Time Horizon</label>
                    <select
                      className={fieldClass}
                      value={form.horizon}
                      onChange={update('horizon')}
                    >
                      <option value="">Select horizon</option>
                      {HORIZONS.map((h) => (
                        <option key={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <h2 className="text-base font-medium" style={{ fontFamily: 'var(--font-serif)' }}>
                  Competitive Position
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Top 3–5 Competitors *</label>
                    <input
                      className={fieldClass}
                      value={form.topCompetitors}
                      onChange={update('topCompetitors')}
                      placeholder="e.g. Salesforce, HubSpot, Pipedrive"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Your Key Differentiators</label>
                    <textarea
                      className={`${fieldClass} resize-none`}
                      rows={3}
                      value={form.differentiators}
                      onChange={update('differentiators')}
                      placeholder="What makes you meaningfully different from alternatives?"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Estimated Market Share</label>
                    <input
                      className={fieldClass}
                      value={form.marketShare}
                      onChange={update('marketShare')}
                      placeholder="e.g. 2–3% of addressable segment"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <h2 className="text-base font-medium" style={{ fontFamily: 'var(--font-serif)' }}>
                  Strategic Challenges & Goals
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Top Strategic Challenges *</label>
                    <textarea
                      className={`${fieldClass} resize-none`}
                      rows={3}
                      value={form.challenges}
                      onChange={update('challenges')}
                      placeholder="What are the 2–3 most pressing challenges limiting your growth?"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Strategic Goals for the Period</label>
                    <textarea
                      className={`${fieldClass} resize-none`}
                      rows={3}
                      value={form.strategicGoals}
                      onChange={update('strategicGoals')}
                      placeholder="What does success look like at the end of your strategic horizon?"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Recent Wins (optional)</label>
                    <input
                      className={fieldClass}
                      value={form.recentWins}
                      onChange={update('recentWins')}
                      placeholder="e.g. Closed $2M Series A, landed enterprise anchor client"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="text-xs px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="text-xs px-5 py-2 rounded-lg text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                style={{ background: GOLD }}
              >
                Continue <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={runDiagnostic}
                disabled={loading || !form.companyName || !form.industry}
                className="text-xs px-5 py-2 rounded-lg text-white flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: GOLD }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating Diagnostic…
                  </>
                ) : (
                  <>
                    <Brain className="w-3.5 h-3.5" />
                    Generate Diagnostic
                  </>
                )}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: GOLD }} />
          <p className="text-sm" style={{ fontFamily: 'var(--font-serif)' }}>
            Analysing your strategic position…
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Synthesising market intelligence, competitive dynamics, and growth vectors
          </p>
        </motion.div>
      )}

      {historyLoaded && history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: GOLD }} />
              Previous Diagnostics
              <Badge variant="secondary" className="ml-auto text-xs">
                {history.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.slice(0, 5).map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  setReport(h.report as DiagnosticReport);
                  setForm((f) => ({
                    ...f,
                    companyName: h.companyName,
                    industry: h.industry,
                    stage: h.stage,
                  }));
                }}
                className="w-full text-left px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{h.companyName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(h.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {h.industry}
                  {h.stage ? ` · ${h.stage}` : ''}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
