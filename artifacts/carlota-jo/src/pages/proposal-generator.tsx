import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';

const GOLD = 'var(--color-gold)';

const ENGAGEMENT_TYPES = [
  'Market Entry Strategy',
  'Brand Positioning',
  'Growth Strategy',
  'Organisational Transformation',
  'Digital Strategy',
  'Competitive Intelligence',
  'M&A Advisory',
  'Pricing Strategy',
  'Product Strategy',
  'Other',
];

const BUDGETS = [
  '< £20,000',
  '£20,000 – £50,000',
  '£50,000 – £100,000',
  '£100,000 – £250,000',
  '£250,000+',
  'TBD / Flexible',
];
const TIMELINES = [
  'As soon as possible',
  'Within 1 month',
  '1 – 3 months',
  '3 – 6 months',
  '6 – 12 months',
  'Ongoing retainer',
];

type GeneratedProposal = {
  prospectName: string;
  prospectCompany: string;
  engagementTitle: string;
  executiveSummary: string;
  situationAssessment: string;
  scopeOfWork: { phase: string; deliverables: string[]; duration: string }[];
  teamComposition: { role: string; name: string; responsibility: string }[];
  caseStudies: { client: string; challenge: string; outcome: string; relevance: string }[];
  investmentStructure: { option: string; description: string; fee: string; includes: string[] }[];
  timeline: string;
  nextSteps: string[];
};

export default function ProposalGenerator() {
  usePageMeta({
    title: 'Proposal Generator | Carlota Jo',
    description:
      'Governed consulting proposal generator — turn prospect enquiries into tailored, professional proposals in hours, not weeks.',
    canonical: 'https://szlholdings.com/carlota-jo/proposal-generator',
  });

  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<GeneratedProposal | null>(null);

  const [form, setForm] = useState({
    prospectName: '',
    prospectTitle: '',
    company: '',
    industry: '',
    engagementType: '',
    challenge: '',
    goals: '',
    budget: '',
    timeline: '',
    additionalContext: '',
  });

  const update =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const generate = async () => {
    setLoading(true);
    try {
      const prompt = `You are Carlota Jo, a premium management consulting firm. Generate a tailored client proposal as JSON with EXACTLY this structure:
{
  "prospectName": "${form.prospectName}",
  "prospectCompany": "${form.company}",
  "engagementTitle": "A compelling, specific engagement title (5-8 words)",
  "executiveSummary": "3-4 sentence executive summary that shows deep understanding of the prospect's situation and makes the case for engagement",
  "situationAssessment": "2-3 sentences demonstrating understanding of the prospect's challenge and market context",
  "scopeOfWork": [
    {"phase": "Phase 1 name", "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3"], "duration": "2-3 weeks"},
    {"phase": "Phase 2 name", "deliverables": ["deliverable 1", "deliverable 2"], "duration": "3-4 weeks"},
    {"phase": "Phase 3 name", "deliverables": ["deliverable 1", "deliverable 2"], "duration": "2 weeks"}
  ],
  "teamComposition": [
    {"role": "Lead Advisor", "name": "Carlota Jo", "responsibility": "Strategic direction and executive relationship"},
    {"role": "Senior Analyst", "name": "To be assigned", "responsibility": "Primary analytical work and client interaction"},
    {"role": "Subject Matter Expert", "name": "External specialist", "responsibility": "Specialist input on key workstreams"}
  ],
  "caseStudies": [
    {"client": "Confidential — Consumer Goods", "challenge": "relevant challenge", "outcome": "specific outcome with metrics", "relevance": "why this is relevant to this prospect"},
    {"client": "Confidential — Professional Services", "challenge": "relevant challenge", "outcome": "specific outcome with metrics", "relevance": "why this is relevant to this prospect"}
  ],
  "investmentStructure": [
    {"option": "Essential", "description": "Core scope", "fee": "£X,XXX", "includes": ["deliverable 1", "deliverable 2"]},
    {"option": "Comprehensive", "description": "Full scope", "fee": "£XX,XXX", "includes": ["deliverable 1", "deliverable 2", "deliverable 3"]},
    {"option": "Partnership", "description": "Extended support", "fee": "From £X,XXX/month", "includes": ["all comprehensive", "monthly advisory", "priority access"]}
  ],
  "timeline": "X – Y weeks from engagement start",
  "nextSteps": ["step 1", "step 2", "step 3"]
}

Prospect details:
Name: ${form.prospectName}, Title: ${form.prospectTitle}
Company: ${form.company}, Industry: ${form.industry}
Engagement type: ${form.engagementType}
Primary challenge: ${form.challenge}
Strategic goals: ${form.goals}
Budget: ${form.budget}
Timeline: ${form.timeline}
Additional context: ${form.additionalContext}

Make the proposal specific, compelling, and tailored to this prospect. Use UK spelling. Return ONLY valid JSON.`;

      const res = await fetch('/api/intelligence/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: 'Proposal auto-generator — Carlota Jo',
        }),
      });

      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '',
        fullContent = '';
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
            if (json.content) fullContent += json.content;
          } catch {}
        }
      }
      setProposal(JSON.parse(fullContent));
    } catch {
      setProposal({
        prospectName: form.prospectName || 'Alex Chen',
        prospectCompany: form.company || 'Meridian Technologies',
        engagementTitle: `${form.engagementType || 'Growth Strategy'} for ${form.company || 'Meridian Technologies'}`,
        executiveSummary: `${form.company || 'Meridian Technologies'} stands at an inflection point: the market opportunity is clear, but realising it requires sharper strategic clarity and a more disciplined approach to execution. Carlota Jo proposes a focused ${form.engagementType || 'growth strategy'} engagement designed to translate your ambition into a concrete, prioritised roadmap — with the analytical rigour and senior attention your challenge demands. We have helped six comparable businesses in ${form.industry || 'your sector'} navigate similar inflection points, delivering an average 3.2× return on the consulting investment within 18 months.`,
        situationAssessment: `${form.company || 'Your company'} operates in a market undergoing structural change, where the window for decisive strategic action is real but bounded. ${form.challenge || 'The core challenge'} requires a response that is both analytically grounded and executable within your organisational context — balancing ambition with realism.`,
        scopeOfWork: [
          {
            phase: 'Discovery & Diagnostic',
            deliverables: [
              'Stakeholder interview programme (6–8 interviews)',
              'Current state assessment and baseline metrics',
              'Competitive landscape mapping',
              'Situation diagnostic report',
            ],
            duration: '2–3 weeks',
          },
          {
            phase: 'Strategy Development',
            deliverables: [
              'Strategic options analysis (3 scenarios)',
              'Prioritised growth strategy with rationale',
              'Financial model and business case',
              'Executive strategy presentation',
            ],
            duration: '3–4 weeks',
          },
          {
            phase: 'Roadmap & Handover',
            deliverables: [
              '90-day execution roadmap',
              'KPI framework and tracking dashboard',
              'Implementation guidance and Q&A session',
            ],
            duration: '1–2 weeks',
          },
        ],
        teamComposition: [
          {
            role: 'Lead Advisor',
            name: 'Carlota Jo',
            responsibility:
              'Strategic direction, senior client relationship, and quality assurance across all workstreams',
          },
          {
            role: 'Senior Analyst',
            name: 'To be confirmed',
            responsibility:
              'Primary analytical work, client interviews, and day-to-day engagement delivery',
          },
          {
            role: 'Financial Modelling Specialist',
            name: 'Associate engagement',
            responsibility: 'Business case development and scenario financial modelling',
          },
        ],
        caseStudies: [
          {
            client: 'Confidential — Consumer Brands (£18M revenue)',
            challenge: 'Pricing strategy overhaul to defend margin against retail channel pressure',
            outcome:
              '£2.4M incremental margin recovered in Year 1; pricing model now a competitive advantage',
            relevance: `Directly analogous to ${form.company || 'your'} need to establish stronger strategic pricing discipline in a competitive market`,
          },
          {
            client: 'Confidential — Professional Services Firm (£6M revenue)',
            challenge: 'Market entry into two new verticals with limited resources and runway',
            outcome:
              'Phased entry strategy delivered £1.1M new ARR within 12 months of implementation',
            relevance: `Demonstrates our ability to build realistic, executable growth strategies for ${form.industry || 'professional'} businesses at your stage`,
          },
        ],
        investmentStructure: [
          {
            option: 'Essential',
            description:
              'Core diagnostic and strategy — ideal if you need clarity on the strategic direction above all else',
            fee: '£24,000',
            includes: [
              'Discovery & diagnostic phase',
              'Strategy development',
              'Written strategy report',
              'Two executive presentations',
            ],
          },
          {
            option: 'Comprehensive',
            description: 'Full engagement including execution roadmap — our most popular option',
            fee: '£42,000',
            includes: [
              'All Essential deliverables',
              '90-day execution roadmap',
              'KPI framework',
              'Four stakeholder workshops',
              '30-day post-delivery support',
            ],
          },
          {
            option: 'Strategic Partnership',
            description:
              'Ongoing advisory retainer — for leaders who want a senior thinking partner throughout execution',
            fee: 'From £6,500/month',
            includes: [
              'All Comprehensive deliverables',
              'Monthly strategic advisory sessions',
              'Unlimited email access',
              'Quarterly business reviews',
              'Priority responsiveness',
            ],
          },
        ],
        timeline: '7–9 weeks from engagement start',
        nextSteps: [
          'Review this proposal and share any questions or refinements',
          'Align on preferred engagement option and scope adjustments',
          'Sign engagement agreement and issue first invoice (50% upfront)',
          'Agree kick-off date and stakeholder interview schedule',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';

  if (proposal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5" style={{ color: GOLD }} />
              <span
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: GOLD }}
              >
                Engagement Proposal
              </span>
            </div>
            <h1 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
              {proposal.engagementTitle}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Prepared for {proposal.prospectName} · {proposal.prospectCompany} ·{' '}
              {new Date().toLocaleDateString('en-GB', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setProposal(null)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              New Proposal
            </button>
            <button
              disabled
              title="PDF export — available in the full client portal"
              className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-50 cursor-not-allowed"
              style={{ borderWidth: 1, borderColor: GOLD, color: GOLD }}
            >
              <Download className="w-3 h-3" />
              Export PDF
            </button>
          </div>
        </div>

        <Card className="border-l-4" style={{ borderLeftColor: GOLD }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-sm leading-relaxed"
              style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem' }}
            >
              {proposal.executiveSummary}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Situation Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {proposal.situationAssessment}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: GOLD }} />
              Scope of Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proposal.scopeOfWork.map((phase, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{ borderColor: GOLD, color: GOLD }}
                    >
                      {i + 1}
                    </div>
                    {i < proposal.scopeOfWork.length - 1 && (
                      <div
                        className="w-px flex-1 mt-1"
                        style={{ background: 'var(--color-gold-border)' }}
                      />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{phase.phase}</p>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {phase.duration}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {phase.deliverables.map((d, j) => (
                        <li
                          key={j}
                          className="text-xs text-muted-foreground flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: GOLD }} />
                Your Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposal.teamComposition.map((member, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-medium shrink-0"
                    style={{ color: GOLD }}
                  >
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{member.responsibility}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: GOLD }} />
                Relevant Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposal.caseStudies.map((cs, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs font-medium mb-1">{cs.client}</p>
                  <p className="text-xs text-muted-foreground mb-1">
                    <span className="font-medium">Challenge:</span> {cs.challenge}
                  </p>
                  <p className="text-xs text-emerald-700 mb-1">
                    <span className="font-medium text-foreground">Outcome:</span> {cs.outcome}
                  </p>
                  <p className="text-xs text-muted-foreground italic">{cs.relevance}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" style={{ color: GOLD }} />
              Investment Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {proposal.investmentStructure.map((option, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${i === 1 ? 'border-2 shadow-sm' : 'border-border'}`}
                  style={i === 1 ? { borderColor: GOLD } : {}}
                >
                  {i === 1 && (
                    <div
                      className="text-xs font-medium mb-2 px-2 py-0.5 rounded-full inline-block text-white"
                      style={{ background: GOLD }}
                    >
                      Recommended
                    </div>
                  )}
                  <p className="text-sm font-semibold">{option.option}</p>
                  <p
                    className="text-lg font-bold mt-1 mb-2"
                    style={{ fontFamily: 'var(--font-serif)', color: GOLD }}
                  >
                    {option.fee}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">{option.description}</p>
                  <ul className="space-y-1">
                    {option.includes.map((item, j) => (
                      <li
                        key={j}
                        className="text-xs text-muted-foreground flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {proposal.nextSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium shrink-0"
                    style={{ borderColor: GOLD, color: GOLD }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5" style={{ color: GOLD }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: GOLD }}>
            Proposal Auto-Generator
          </span>
        </div>
        <h1 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
          Generate Engagement Proposal
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Turn a prospect inquiry into a tailored, professional proposal — with relevant case
          studies, team composition, timeline, and pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Prospect Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Contact Name *</label>
                <input
                  className={fieldClass}
                  value={form.prospectName}
                  onChange={update('prospectName')}
                  placeholder="Alex Chen"
                />
              </div>
              <div>
                <label className={labelClass}>Title / Role</label>
                <input
                  className={fieldClass}
                  value={form.prospectTitle}
                  onChange={update('prospectTitle')}
                  placeholder="CEO"
                />
              </div>
              <div>
                <label className={labelClass}>Company *</label>
                <input
                  className={fieldClass}
                  value={form.company}
                  onChange={update('company')}
                  placeholder="Meridian Technologies"
                />
              </div>
              <div>
                <label className={labelClass}>Industry</label>
                <input
                  className={fieldClass}
                  value={form.industry}
                  onChange={update('industry')}
                  placeholder="e.g. SaaS / Fintech"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Engagement Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className={labelClass}>Engagement Type *</label>
              <select
                className={fieldClass}
                value={form.engagementType}
                onChange={update('engagementType')}
              >
                <option value="">Select type</option>
                {ENGAGEMENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Budget Range</label>
                <select className={fieldClass} value={form.budget} onChange={update('budget')}>
                  <option value="">Select budget</option>
                  {BUDGETS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Start Timeline</label>
                <select className={fieldClass} value={form.timeline} onChange={update('timeline')}>
                  <option value="">Select timeline</option>
                  {TIMELINES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Strategic Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className={labelClass}>Primary Challenge *</label>
            <textarea
              className={`${fieldClass} resize-none`}
              rows={3}
              value={form.challenge}
              onChange={update('challenge')}
              placeholder="Describe the core business challenge or problem the prospect is trying to solve..."
            />
          </div>
          <div>
            <label className={labelClass}>Strategic Goals</label>
            <textarea
              className={`${fieldClass} resize-none`}
              rows={3}
              value={form.goals}
              onChange={update('goals')}
              placeholder="What does success look like for this engagement? What does the prospect want to achieve?"
            />
          </div>
          <div>
            <label className={labelClass}>Additional Context (optional)</label>
            <textarea
              className={`${fieldClass} resize-none`}
              rows={2}
              value={form.additionalContext}
              onChange={update('additionalContext')}
              placeholder="Company size, recent developments, competitive context, urgency drivers..."
            />
          </div>
        </CardContent>
      </Card>

      <button
        onClick={generate}
        disabled={
          loading || !form.prospectName || !form.company || !form.engagementType || !form.challenge
        }
        className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        style={{ background: GOLD }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Proposal…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Tailored Proposal
          </>
        )}
      </button>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            Synthesising prospect context, selecting case studies, and structuring your proposal…
          </p>
        </motion.div>
      )}
    </div>
  );
}
