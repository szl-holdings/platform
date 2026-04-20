import { AnimatePresence, m } from 'framer-motion';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  Image,
  Lightbulb,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { DistributionOsLayout } from './admin-dashboard';

const API = import.meta.env.VITE_API_URL || '';

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function writeHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() };
}

interface Pillar {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  isFavorite: boolean;
}

interface Slide {
  slideType: 'intro' | 'content' | 'outro';
  slideNumber: number;
  tagline?: string;
  title?: string;
  paragraph?: string;
  callToAction?: string;
}

interface CarouselProject {
  id: number;
  title: string;
  slug: string;
  topic: string | null;
  hook: string | null;
  pillarId: number | null;
  linkedinShortCaption: string | null;
  linkedinLongCaption: string | null;
  xThreadAdaptation: string | null;
  instagramCaption: string | null;
  visualDirectionNotes: string | null;
  aiCarouselsImportBlock: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  status: string;
  createdAt: string;
}

const CAROUSEL_TEMPLATES = [
  {
    id: 'educational-explainer',
    name: 'Educational Explainer',
    desc: 'Break down a complex concept into clear, digestible steps.',
    hook: "Most people don't understand [TOPIC]. Here's the full breakdown.",
    slidePattern: ['intro', 'problem', 'concept', 'step1', 'step2', 'step3', 'takeaway', 'outro'],
    cta: 'Save this for your next [TOPIC] conversation.',
    hashtags: ['#Leadership', '#Strategy', '#Business', '#Learning'],
    destinationUrl: '/insights',
  },
  {
    id: 'contrarian-pov',
    name: 'Contrarian POV',
    desc: 'Challenge conventional thinking with a bold counterpoint.',
    hook: "Everyone says [X]. They're wrong. Here's why.",
    slidePattern: [
      'intro',
      'mainstream-view',
      'why-wrong',
      'evidence',
      'alternative',
      'nuance',
      'outro',
    ],
    cta: 'Agree or disagree? Reply below.',
    hashtags: ['#Contrarian', '#FounderMindset', '#RealTalk', '#Strategy'],
    destinationUrl: '/insights',
  },
  {
    id: 'operator-checklist',
    name: 'Operator Checklist',
    desc: 'Actionable checklist for operators and executives.',
    hook: '[N] things every operator should check before [ACTION].',
    slidePattern: ['intro', 'check1', 'check2', 'check3', 'check4', 'check5', 'outro'],
    cta: 'Use this checklist with your team today.',
    hashtags: ['#Operations', '#Checklist', '#Execution', '#Leadership'],
    destinationUrl: '/contact',
  },
  {
    id: 'before-after',
    name: 'Before / After Transformation',
    desc: 'Show the contrast between old and new approaches.',
    hook: "Before SZL: chaos. After SZL: clarity. Here's what changed.",
    slidePattern: [
      'intro',
      'before-state',
      'pain-points',
      'turning-point',
      'after-state',
      'results',
      'outro',
    ],
    cta: "Ready for your transformation? Let's talk.",
    hashtags: ['#Transformation', '#Results', '#BeforeAfter', '#Growth'],
    destinationUrl: '/contact',
  },
  {
    id: 'founder-story',
    name: 'Founder Story',
    desc: 'Personal narrative arc from problem to breakthrough.',
    hook: 'I almost quit. Then everything changed.',
    slidePattern: ['intro', 'origin', 'struggle', 'pivot', 'breakthrough', 'lesson', 'outro'],
    cta: "Follow for more from the founder's desk.",
    hashtags: ['#FounderStory', '#Entrepreneur', '#Startup', '#BuildInPublic'],
    destinationUrl: '/founder',
  },
  {
    id: 'mistakes-to-avoid',
    name: 'Mistakes to Avoid',
    desc: 'Common traps and how to sidestep them.',
    hook: '[N] mistakes that are quietly killing your [GOAL].',
    slidePattern: [
      'intro',
      'mistake1',
      'mistake2',
      'mistake3',
      'mistake4',
      'how-to-avoid',
      'outro',
    ],
    cta: "Don't make these mistakes. Start here.",
    hashtags: ['#Mistakes', '#Lessons', '#Strategy', '#Leadership'],
    destinationUrl: '/contact',
  },
  {
    id: 'buyer-guide',
    name: 'Buyer Guide',
    desc: 'Help prospects make a confident, informed decision.',
    hook: 'Before you buy [CATEGORY], read this.',
    slidePattern: [
      'intro',
      'who-its-for',
      'key-criteria',
      'red-flags',
      'green-flags',
      'questions-to-ask',
      'outro',
    ],
    cta: 'Download the full buyer guide.',
    hashtags: ['#BuyerGuide', '#DecisionMaking', '#B2B', '#Procurement'],
    destinationUrl: '/resources',
  },
  {
    id: 'enterprise-readiness',
    name: 'Enterprise Readiness Checklist',
    desc: 'Assess organizational readiness for enterprise adoption.',
    hook: 'Is your organization ready for enterprise-grade [SOLUTION]?',
    slidePattern: [
      'intro',
      'security',
      'compliance',
      'integration',
      'scalability',
      'team-readiness',
      'outro',
    ],
    cta: 'Get your enterprise readiness assessment.',
    hashtags: ['#Enterprise', '#Readiness', '#ITLeadership', '#Digital'],
    destinationUrl: '/contact',
  },
  {
    id: 'trend-reaction',
    name: 'Trend Reaction',
    desc: 'React to an industry trend with expert commentary.',
    hook: "[TREND] is reshaping [INDUSTRY]. Here's what you need to know.",
    slidePattern: [
      'intro',
      'what-is-it',
      'why-now',
      'who-it-affects',
      'opportunity',
      'risk',
      'outro',
    ],
    cta: 'Stay ahead of the curve. Subscribe to our weekly briefing.',
    hashtags: ['#Trends', '#Industry', '#FutureOfWork', '#Innovation'],
    destinationUrl: '/newsletter-landing',
  },
  {
    id: 'myth-vs-reality',
    name: 'Myth vs. Reality',
    desc: 'Debunk persistent myths with evidence-backed facts.',
    hook: 'The biggest myths about [TOPIC] — debunked.',
    slidePattern: ['intro', 'myth1', 'myth2', 'myth3', 'myth4', 'reality', 'outro'],
    cta: 'Share this with someone who still believes the myths.',
    hashtags: ['#Myths', '#Facts', '#RealTalk', '#Education'],
    destinationUrl: '/insights',
  },
] as const;

type TemplateId = (typeof CAROUSEL_TEMPLATES)[number]['id'];

function generateSlides(templateId: TemplateId, topic: string, pillarName: string): Slide[] {
  const t = CAROUSEL_TEMPLATES.find((t) => t.id === templateId);
  if (!t) return [];
  const topicLabel = topic || '[TOPIC]';
  const pillar = pillarName || 'Business';

  const slideMap: Record<string, Slide> = {
    intro: {
      slideType: 'intro',
      slideNumber: 1,
      tagline: pillar,
      title: t.hook
        .replace('[TOPIC]', topicLabel)
        .replace('[N]', '5')
        .replace('[X]', topicLabel)
        .replace('[ACTION]', topicLabel)
        .replace('[GOAL]', topicLabel)
        .replace('[CATEGORY]', topicLabel)
        .replace('[SOLUTION]', topicLabel)
        .replace('[TREND]', topicLabel)
        .replace('[INDUSTRY]', pillar),
      paragraph: `A breakdown for operators, executives, and founders who care about ${topicLabel}.`,
    },
    problem: {
      slideType: 'content',
      slideNumber: 2,
      title: 'The Problem',
      paragraph: `Most leaders approach ${topicLabel} the wrong way. They focus on symptoms rather than root causes, which leads to recurring issues and wasted resources.`,
    },
    concept: {
      slideType: 'content',
      slideNumber: 3,
      title: `What ${topicLabel} Actually Means`,
      paragraph: `At its core, ${topicLabel} is about creating systems that deliver consistent outcomes — not just quick wins. Here's the framework that separates amateurs from operators.`,
    },
    step1: {
      slideType: 'content',
      slideNumber: 4,
      title: 'Step 1: Diagnose Before You Prescribe',
      paragraph: `Before any intervention, map the current state of ${topicLabel} in your organization. Document inputs, outputs, and failure points.`,
    },
    step2: {
      slideType: 'content',
      slideNumber: 5,
      title: 'Step 2: Build the Right Infrastructure',
      paragraph: `Implement systems that can scale. Don't solve for today's volume — solve for 10x today's volume. This is where most operators fail.`,
    },
    step3: {
      slideType: 'content',
      slideNumber: 6,
      title: 'Step 3: Measure What Matters',
      paragraph: `Define 3-5 leading indicators that predict success. Lagging indicators tell you what happened. Leading indicators tell you what's coming.`,
    },
    takeaway: {
      slideType: 'content',
      slideNumber: 7,
      title: 'The Core Insight',
      paragraph: `${topicLabel} is not a one-time fix. It's a discipline. The organizations that win are the ones that build feedback loops and iterate relentlessly.`,
    },
    'mainstream-view': {
      slideType: 'content',
      slideNumber: 2,
      title: 'The Mainstream View',
      paragraph: `The industry consensus says: [conventional wisdom about ${topicLabel}]. This view is repeated everywhere — in playbooks, podcasts, and boardrooms.`,
    },
    'why-wrong': {
      slideType: 'content',
      slideNumber: 3,
      title: "Why That's Wrong",
      paragraph: `The data tells a different story. Organizations that follow conventional wisdom on ${topicLabel} consistently underperform those that challenge it.`,
    },
    evidence: {
      slideType: 'content',
      slideNumber: 4,
      title: 'The Evidence',
      paragraph: `Across our portfolio, we've seen [specific outcome] when organizations rejected the mainstream view. The pattern is unmistakable.`,
    },
    alternative: {
      slideType: 'content',
      slideNumber: 5,
      title: 'The Alternative Approach',
      paragraph: `Instead of [conventional approach], leading operators are doing [alternative]. This shifts the model from [old frame] to [new frame].`,
    },
    nuance: {
      slideType: 'content',
      slideNumber: 6,
      title: 'The Nuance',
      paragraph: `This isn't blanket advice. Context matters. The contrarian approach to ${topicLabel} works when [specific condition]. Know your situation.`,
    },
    check1: {
      slideType: 'content',
      slideNumber: 2,
      title: 'Check 1: Data Integrity',
      paragraph: `Are your inputs clean? Garbage in, garbage out. Before any decision on ${topicLabel}, verify your data sources are reliable and up to date.`,
    },
    check2: {
      slideType: 'content',
      slideNumber: 3,
      title: 'Check 2: Stakeholder Alignment',
      paragraph: `Do the right people know what's happening? Alignment across functions prevents expensive course corrections later. Verify before proceeding.`,
    },
    check3: {
      slideType: 'content',
      slideNumber: 4,
      title: 'Check 3: Risk Coverage',
      paragraph: `Have you mapped the downside scenarios? For every initiative, there should be a documented mitigation plan for the top 3 risks.`,
    },
    check4: {
      slideType: 'content',
      slideNumber: 5,
      title: 'Check 4: Execution Capacity',
      paragraph: `Does your team have the bandwidth? A great strategy dies in execution when teams are spread too thin. Be honest about capacity.`,
    },
    check5: {
      slideType: 'content',
      slideNumber: 6,
      title: 'Check 5: Success Criteria',
      paragraph: `How will you know it worked? Define your success metrics before you start — not after. This is the discipline that separates good operators from great ones.`,
    },
    'before-state': {
      slideType: 'content',
      slideNumber: 2,
      title: 'Before: The Old Reality',
      paragraph: `Manual processes. Fragmented data. Decisions made on gut feel. The old way of managing ${topicLabel} was slow, costly, and unreliable.`,
    },
    'pain-points': {
      slideType: 'content',
      slideNumber: 3,
      title: 'The Pain Points',
      paragraph: `Teams were spending 60% of their time on administration. Leadership had no real-time visibility. Every reporting cycle felt like archaeology.`,
    },
    'turning-point': {
      slideType: 'content',
      slideNumber: 4,
      title: 'The Turning Point',
      paragraph: `The decision to rethink ${topicLabel} from the ground up wasn't easy. It required challenging assumptions that had been in place for years.`,
    },
    'after-state': {
      slideType: 'content',
      slideNumber: 5,
      title: 'After: The New Reality',
      paragraph: `Real-time dashboards. Automated workflows. Leadership aligned around a single source of truth. ${topicLabel} went from a liability to a competitive advantage.`,
    },
    results: {
      slideType: 'content',
      slideNumber: 6,
      title: 'The Results',
      paragraph: `40% reduction in operational overhead. 3x faster decision cycles. The ROI was evident within the first quarter.`,
    },
    origin: {
      slideType: 'content',
      slideNumber: 2,
      title: 'Where It Started',
      paragraph: `I didn't plan to build a company around ${topicLabel}. It started with a problem I kept seeing — one that existing solutions weren't solving.`,
    },
    struggle: {
      slideType: 'content',
      slideNumber: 3,
      title: 'The Struggle',
      paragraph: `The first 18 months were brutal. No playbook. No roadmap. Just relentless iteration and a conviction that the problem was worth solving.`,
    },
    pivot: {
      slideType: 'content',
      slideNumber: 4,
      title: 'The Pivot',
      paragraph: `We had to kill our original approach. It hurt. But it unlocked something we hadn't anticipated — a fundamentally better path.`,
    },
    breakthrough: {
      slideType: 'content',
      slideNumber: 5,
      title: 'The Breakthrough',
      paragraph: `When [key insight] clicked, everything changed. We went from struggling to close deals to having a waiting list.`,
    },
    lesson: {
      slideType: 'content',
      slideNumber: 6,
      title: 'The Lesson',
      paragraph: `The hardest problems are worth solving. The bigger the friction, the bigger the opportunity. Don't run from complexity — run toward it.`,
    },
    mistake1: {
      slideType: 'content',
      slideNumber: 2,
      title: 'Mistake 1: Optimizing the Wrong Metric',
      paragraph: `Most teams measure activity, not outcomes. They celebrate busy work instead of meaningful progress. Stop tracking inputs. Track results.`,
    },
    mistake2: {
      slideType: 'content',
      slideNumber: 3,
      title: 'Mistake 2: Skipping the Foundation',
      paragraph: `Jumping to solutions before diagnosing the root cause. This is the #1 reason ${topicLabel} initiatives fail — they treat symptoms, not causes.`,
    },
    mistake3: {
      slideType: 'content',
      slideNumber: 4,
      title: 'Mistake 3: Under-investing in Change Management',
      paragraph: `A perfect strategy implemented without buy-in is dead on arrival. People, not systems, are the bottleneck. Plan for adoption, not just deployment.`,
    },
    mistake4: {
      slideType: 'content',
      slideNumber: 5,
      title: 'Mistake 4: No Feedback Loop',
      paragraph: `Launch and forget is not a strategy. Without a mechanism to measure, learn, and adjust, you're flying blind. Build in regular retrospectives.`,
    },
    'how-to-avoid': {
      slideType: 'content',
      slideNumber: 6,
      title: 'How to Avoid Them All',
      paragraph: `Slow down before you speed up. Diagnose thoroughly. Align stakeholders. Measure leading indicators. Build feedback loops. Repeat.`,
    },
    'who-its-for': {
      slideType: 'content',
      slideNumber: 2,
      title: 'Who This Is For',
      paragraph: `This guide is for decision-makers evaluating ${topicLabel} solutions — executives, procurement leads, and operators who want to buy right the first time.`,
    },
    'key-criteria': {
      slideType: 'content',
      slideNumber: 3,
      title: 'Key Evaluation Criteria',
      paragraph: `Scalability, integration capability, vendor support, security posture, and total cost of ownership. Weight these against your specific context.`,
    },
    'red-flags': {
      slideType: 'content',
      slideNumber: 4,
      title: 'Red Flags to Watch For',
      paragraph: `Vague pricing. No reference customers. Poor documentation. Resistant to security audits. Overpromising on timelines. Walk away from these.`,
    },
    'green-flags': {
      slideType: 'content',
      slideNumber: 5,
      title: 'Green Flags That Signal Quality',
      paragraph: `Clear implementation timeline. Strong customer success function. Transparent roadmap. Proactive about limitations. References they're proud to share.`,
    },
    'questions-to-ask': {
      slideType: 'content',
      slideNumber: 6,
      title: 'Questions to Ask Every Vendor',
      paragraph: `'What does a failed implementation look like?' 'Who is our day-to-day contact post-sale?' 'What does your SLA actually cover?' Get the honest answers.`,
    },
    security: {
      slideType: 'content',
      slideNumber: 2,
      title: 'Security Posture',
      paragraph: `Do you have SOC 2 Type II, ISO 27001, or equivalent certifications? Enterprise adoption requires documented security controls and audit trails.`,
    },
    compliance: {
      slideType: 'content',
      slideNumber: 3,
      title: 'Compliance Requirements',
      paragraph: `Map your regulatory obligations (GDPR, HIPAA, FedRAMP, etc.) to the vendor's compliance coverage. Gaps here kill deals — and organizations.`,
    },
    integration: {
      slideType: 'content',
      slideNumber: 4,
      title: 'Integration Readiness',
      paragraph: `Native connectors or custom APIs? How does this system talk to your ERP, CRM, and identity provider? Integration complexity is where projects die.`,
    },
    scalability: {
      slideType: 'content',
      slideNumber: 5,
      title: 'Scalability Assessment',
      paragraph: `Can this solution handle 10x your current volume? Multi-tenant architecture? Global deployment? Get specifics, not marketing language.`,
    },
    'team-readiness': {
      slideType: 'content',
      slideNumber: 6,
      title: 'Team Readiness',
      paragraph: `Do your people have the skills to operate and maintain this system? Change management and training investment are often underestimated.`,
    },
    'what-is-it': {
      slideType: 'content',
      slideNumber: 2,
      title: `What Is ${topicLabel}?`,
      paragraph: `${topicLabel} is reshaping how [industry] operates. Here's the plain-language definition — no jargon, no fluff.`,
    },
    'why-now': {
      slideType: 'content',
      slideNumber: 3,
      title: 'Why Now?',
      paragraph: `Three forces are converging: [Force 1], [Force 2], and [Force 3]. This is the window — organizations that move now will have a durable advantage.`,
    },
    'who-it-affects': {
      slideType: 'content',
      slideNumber: 4,
      title: 'Who It Affects',
      paragraph: `This trend impacts ${pillar} leaders first, then operations, then customer-facing teams. The ripple effect will reach every function within 18 months.`,
    },
    opportunity: {
      slideType: 'content',
      slideNumber: 5,
      title: 'The Opportunity',
      paragraph: `Early movers are capturing [specific opportunity]. This is not a theoretical advantage — it's showing up in revenue, retention, and talent acquisition.`,
    },
    risk: {
      slideType: 'content',
      slideNumber: 6,
      title: 'The Risk of Waiting',
      paragraph: `Organizations that delay face a compounding disadvantage. The cost of inaction now is higher than the cost of early adoption.`,
    },
    myth1: {
      slideType: 'content',
      slideNumber: 2,
      title: `Myth 1: "${topicLabel} Is Too Expensive"`,
      paragraph: `Reality: The cost of *not* addressing ${topicLabel} is consistently higher than the cost of doing it right. ROI timelines average 6-12 months.`,
    },
    myth2: {
      slideType: 'content',
      slideNumber: 3,
      title: 'Myth 2: "We Can DIY This"',
      paragraph: `Reality: Organizations that attempt to build versus buy in this space spend 3x more and take 2x longer. Specialized solutions exist for a reason.`,
    },
    myth3: {
      slideType: 'content',
      slideNumber: 4,
      title: 'Myth 3: "This Only Works for Large Enterprises"',
      paragraph: `Reality: Mid-market organizations see disproportionate gains because they move faster and have less legacy debt. Scale is not a prerequisite.`,
    },
    myth4: {
      slideType: 'content',
      slideNumber: 5,
      title: 'Myth 4: "Our Industry Is Different"',
      paragraph: `Reality: The principles transfer. The implementation adapts. Every industry has said this — and every industry has eventually adopted the approach.`,
    },
    reality: {
      slideType: 'content',
      slideNumber: 6,
      title: 'The Reality',
      paragraph: `${topicLabel} is accessible, ROI-positive, and industry-agnostic. The only variable is leadership willingness to challenge the status quo.`,
    },
    outro: {
      slideType: 'outro',
      slideNumber: 99,
      tagline: 'SZL Holdings',
      title: t.cta,
      paragraph: `Explore how SZL Holdings can help your organization achieve this transformation.`,
      callToAction: 'DM us or visit szlholdings.com',
    },
  };

  const slides: Slide[] = [];
  t.slidePattern.forEach((key, index) => {
    const slide = slideMap[key] || {
      slideType: 'content' as const,
      slideNumber: index + 1,
      title: key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      paragraph: `Content for ${key} slide about ${topicLabel}.`,
    };
    slide.slideNumber = index + 1;
    slides.push(slide);
  });
  return slides;
}

function buildImportBlock(slides: Slide[], title: string): string {
  const lines: string[] = [];
  for (const s of slides) {
    if (s.slideType === 'intro') {
      lines.push(`[Intro] ${s.tagline || ''}/${s.title || title}/${s.paragraph || ''}`);
    } else if (s.slideType === 'outro') {
      lines.push(
        `[Outro] ${s.tagline || 'SZL Holdings'}/${s.title || ''}/${s.paragraph || ''}/${s.callToAction || ''}`,
      );
    } else {
      lines.push(`[Slide ${s.slideNumber}] ${s.title || ''}/${s.paragraph || ''}`);
    }
  }
  return lines.join('\n');
}

function buildLinkedInShortCaption(topic: string, hook: string, cta: string): string {
  return `${hook}\n\n${topic} — a thread most executives need but rarely get.\n\n↓ Swipe through the carousel ↓\n\n${cta}`;
}

function buildLinkedInLongCaption(
  topic: string,
  pillarName: string,
  hook: string,
  cta: string,
): string {
  return `${hook}\n\nMost ${pillarName} leaders I speak with are dealing with the same challenge: ${topic} feels urgent but there's no clear playbook.\n\nI built this carousel to cut through the noise.\n\nHere's what you'll find inside:\n→ The root cause most people miss\n→ A practical framework you can deploy this week\n→ The questions to ask your team before the next quarterly review\n\nSave it for your next leadership session.\n\n${cta}\n\n#${pillarName.replace(/\s+/g, '')} #Leadership #Strategy #SZLHoldings`;
}

function buildXThread(topic: string, slides: Slide[]): string {
  const contentSlides = slides.filter((s) => s.slideType === 'content').slice(0, 5);
  const thread = contentSlides
    .map((s, i) => `${i + 1}/ ${s.title}: ${(s.paragraph || '').substring(0, 200)}`)
    .join('\n\n');
  return `Thread: ${topic} — a breakdown for operators.\n\n${thread}\n\n→ Full carousel + resources at szlholdings.com`;
}

function buildInstagramCaption(topic: string, hook: string, hashtags: readonly string[]): string {
  return `${hook}\n\nSwipe through for the full breakdown on ${topic}.\n\nSave this post to reference later. ✦\n\n.\n.\n.\n${hashtags.join(' ')} #SZLHoldings`;
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        background: copied ? 'hsla(120,40%,40%,0.15)' : 'hsla(0,0%,100%,0.06)',
        color: copied ? '#5a9c5a' : '#8b8579',
        border: `1px solid ${copied ? 'hsla(120,40%,40%,0.3)' : 'hsla(0,0%,100%,0.08)'}`,
        borderRadius: '6px',
        fontSize: '0.6875rem',
        cursor: 'pointer',
        fontWeight: 500,
        transition: 'all 0.2s',
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

const STATUS_COLORS: Record<string, string> = {
  idea: '#8b8579',
  draft: '#4a90b8',
  ready: '#d4a054',
  exported: '#9c5adc',
  published: '#5a9c5a',
  archived: '#4a4540',
};

const PILLAR_TOPIC_IDEAS: Record<string, string[]> = {
  'maritime-supply-chain': [
    'supply chain risk signals every operator misses',
    'AIS vessel tracking for operations leaders',
    'port congestion and freight rate dynamics',
    'sanctions compliance in maritime logistics',
    'how to read a maritime intelligence report',
  ],
  'founder-executive': [
    'high-stakes decision-making frameworks for founders',
    'building a leadership operating rhythm',
    'the difference between operators and executives',
    'how to run a weekly leadership review',
    'founder communication during uncertain markets',
  ],
  'enterprise-tech': [
    'enterprise AI adoption for operations leaders',
    'enterprise software procurement best practices',
    'how to evaluate a technology vendor',
    'common integration failures in enterprise deployments',
    'the hidden costs of enterprise SaaS',
  ],
  'ai-intelligent-ops': [
    'AI use cases that actually deliver operational ROI',
    'building an AI-ready data foundation',
    'when not to use AI in operations',
    'AI governance for enterprise operators',
    'intelligent automation vs. RPA — the real difference',
  ],
  'capital-readiness': [
    'capital raise readiness for operators',
    'investor due diligence preparation checklist',
    'how to present your business model to sophisticated investors',
    'common mistakes founders make in the fundraising process',
    'building the financial narrative investors expect',
  ],
};

const DEFAULT_TOPIC_IDEAS = [
  'operational excellence frameworks for leaders',
  'building high-performance teams',
  'how to run an effective quarterly business review',
  'strategic planning in uncertain markets',
  'the cost of decision paralysis in organizations',
];

const CTA_OPTIONS = [
  {
    label: 'Schedule a call',
    text: 'Ready to apply this? Schedule a call with our team.',
    url: '/contact',
  },
  {
    label: 'Download guide',
    text: 'Download the full guide — free for operators.',
    url: '/resources',
  },
  {
    label: 'Subscribe for more',
    text: 'Get more frameworks like this. Subscribe to the weekly briefing.',
    url: '/newsletter-landing',
  },
  {
    label: 'See it in action',
    text: 'See how SZL helps teams implement this. Book a demo.',
    url: '/contact',
  },
  {
    label: 'Follow for more',
    text: "Follow for more frameworks from the operator's desk.",
    url: '/founder',
  },
  { label: 'Custom CTA', text: '', url: '' },
];

function GeneratorPanel({
  pillars,
  onSave,
}: {
  pillars: Pillar[];
  onSave: (c: CarouselProject) => void;
}) {
  const [step, setStep] = useState<'config' | 'preview'>('config');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('educational-explainer');
  const [topic, setTopic] = useState('');
  const [pillarId, setPillarId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<Slide[]>([]);
  const [importBlock, setImportBlock] = useState('');
  const [shortCaption, setShortCaption] = useState('');
  const [longCaption, setLongCaption] = useState('');
  const [xThread, setXThread] = useState('');
  const [instagramCaption, setInstagramCaption] = useState('');
  const [activeTab, setActiveTab] = useState<'slides' | 'captions' | 'import'>('slides');
  const [selectedCtaIndex, setSelectedCtaIndex] = useState(0);
  const [customCtaText, setCustomCtaText] = useState('');
  const [customCtaUrl, setCustomCtaUrl] = useState('');

  const template = CAROUSEL_TEMPLATES.find((t) => t.id === selectedTemplate)!;
  const pillar = pillars.find((p) => p.id === Number(pillarId));

  const topicIdeas = pillar
    ? PILLAR_TOPIC_IDEAS[pillar.slug] || DEFAULT_TOPIC_IDEAS
    : DEFAULT_TOPIC_IDEAS;

  const selectedCta = CTA_OPTIONS[selectedCtaIndex];
  const ctaText = selectedCta.label === 'Custom CTA' ? customCtaText : selectedCta.text;
  const ctaUrl = selectedCta.label === 'Custom CTA' ? customCtaUrl : selectedCta.url;

  function generate() {
    const slides = generateSlides(selectedTemplate, topic, pillar?.name || 'Business');
    setGeneratedSlides(slides);
    const hook = template.hook.replace(/\[.*?\]/g, topic || '[TOPIC]');
    setImportBlock(buildImportBlock(slides, topic));
    setShortCaption(buildLinkedInShortCaption(topic, hook, ctaText || template.cta));
    setLongCaption(
      buildLinkedInLongCaption(topic, pillar?.name || 'Business', hook, ctaText || template.cta),
    );
    setXThread(buildXThread(topic, slides));
    setInstagramCaption(buildInstagramCaption(topic, hook, template.hashtags));
    setStep('preview');
  }

  async function save() {
    if (!topic || !generatedSlides.length) return;
    setSaving(true);
    try {
      const slug = `${selectedTemplate}-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
      const hook = template.hook.replace(/\[.*?\]/g, topic);
      const payload = {
        title: `${topic} — ${template.name}`,
        slug,
        topic,
        hook,
        pillarId: pillarId || null,
        linkedinShortCaption: shortCaption,
        linkedinLongCaption: longCaption,
        xThreadAdaptation: xThread,
        instagramCaption,
        visualDirectionNotes: `Template: ${template.name}. Hashtags: ${template.hashtags.join(', ')}. Destination: ${ctaUrl || template.destinationUrl}. Use brand colors (gold #d4a054, dark #070a10). Clean layout, minimal text per slide. Recommended PDF title: "${topic} — ${template.name} by SZL Holdings".`,
        aiCarouselsImportBlock: importBlock,
        ctaText: ctaText || template.cta,
        ctaUrl: ctaUrl || template.destinationUrl,
        status: 'draft',
        slides: generatedSlides,
      };
      const res = await fetch(`${API}/api/distribution-os/carousels`, {
        method: 'POST',
        credentials: 'include',
        headers: writeHeaders(),
        body: JSON.stringify(payload),
      });
      const saved = await res.json();
      onSave(saved);
      setStep('config');
      setTopic('');
      setPillarId('');
      setGeneratedSlides([]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        background: 'hsla(0,0%,100%,0.025)',
        border: '1px solid hsla(0,0%,100%,0.08)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '1.5rem', borderBottom: '1px solid hsla(0,0%,100%,0.06)' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}
        >
          <Sparkles size={16} style={{ color: '#d4a054' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e8e4de' }}>
            Carousel Generator
          </h2>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#6b6560' }}>
          Select a template, enter your topic, and generate a full carousel ready for aiCarousels
          import.
        </p>
      </div>

      {step === 'config' && (
        <div style={{ padding: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: '#8b8579',
                  textTransform: 'uppercase',
                  marginBottom: '0.375rem',
                }}
              >
                Content Pillar
              </label>
              <select
                value={pillarId}
                onChange={(e) => {
                  setPillarId(Number(e.target.value) || '');
                  setTopic('');
                }}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  background: 'hsla(0,0%,100%,0.04)',
                  border: '1px solid hsla(0,0%,100%,0.1)',
                  borderRadius: '6px',
                  color: '#e8e4de',
                  fontSize: '0.8125rem',
                }}
              >
                <option value="">— Select pillar first —</option>
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.isFavorite ? '★ ' : ''}
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: '#8b8579',
                  textTransform: 'uppercase',
                  marginBottom: '0.375rem',
                }}
              >
                Topic / Angle
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. maritime supply chain risk management"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  background: 'hsla(0,0%,100%,0.04)',
                  border: '1px solid hsla(0,0%,100%,0.1)',
                  borderRadius: '6px',
                  color: '#e8e4de',
                  fontSize: '0.8125rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Topic idea suggestions from selected pillar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginBottom: '0.5rem',
              }}
            >
              <Lightbulb size={12} style={{ color: '#d4a054' }} />
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: '#8b8579',
                  textTransform: 'uppercase',
                }}
              >
                {pillar
                  ? `Topic Ideas — ${pillar.name}`
                  : 'Topic Ideas — Select a pillar to get personalized suggestions'}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {topicIdeas.map((idea) => (
                <button
                  key={idea}
                  onClick={() => setTopic(idea)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: topic === idea ? 'hsla(38,65%,58%,0.15)' : 'hsla(0,0%,100%,0.04)',
                    color: topic === idea ? '#d4a054' : '#8b8579',
                    border: `1px solid ${topic === idea ? 'hsla(38,65%,58%,0.3)' : 'hsla(0,0%,100%,0.08)'}`,
                    borderRadius: '20px',
                    fontSize: '0.6875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <label
            style={{
              display: 'block',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: '#8b8579',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            Template
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.625rem',
              marginBottom: '1.5rem',
            }}
          >
            {CAROUSEL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                style={{
                  padding: '0.875rem',
                  background:
                    selectedTemplate === t.id ? 'hsla(38,65%,58%,0.12)' : 'hsla(0,0%,100%,0.03)',
                  border: `1px solid ${selectedTemplate === t.id ? 'hsla(38,65%,58%,0.4)' : 'hsla(0,0%,100%,0.06)'}`,
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: selectedTemplate === t.id ? '#d4a054' : '#c8c2ba',
                    marginBottom: '0.25rem',
                  }}
                >
                  {t.name}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#6b6560', lineHeight: 1.4 }}>
                  {t.desc}
                </div>
              </button>
            ))}
          </div>

          <label
            style={{
              display: 'block',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: '#8b8579',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            CTA Option
          </label>
          <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}
          >
            {CTA_OPTIONS.map((cta, i) => (
              <button
                key={cta.label}
                onClick={() => setSelectedCtaIndex(i)}
                style={{
                  padding: '0.4375rem 0.875rem',
                  background:
                    selectedCtaIndex === i ? 'hsla(38,65%,58%,0.12)' : 'hsla(0,0%,100%,0.04)',
                  color: selectedCtaIndex === i ? '#d4a054' : '#8b8579',
                  border: `1px solid ${selectedCtaIndex === i ? 'hsla(38,65%,58%,0.4)' : 'hsla(0,0%,100%,0.08)'}`,
                  borderRadius: '20px',
                  fontSize: '0.6875rem',
                  fontWeight: selectedCtaIndex === i ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cta.label}
              </button>
            ))}
          </div>
          {selectedCta.label !== 'Custom CTA' ? (
            <div
              style={{
                padding: '0.75rem',
                background: 'hsla(0,0%,100%,0.02)',
                border: '1px solid hsla(0,0%,100%,0.05)',
                borderRadius: '6px',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontSize: '0.8125rem', color: '#c8c2ba' }}>{selectedCta.text}</div>
              <div style={{ fontSize: '0.6875rem', color: '#4a4540', marginTop: '0.25rem' }}>
                → {selectedCta.url}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <input
                value={customCtaText}
                onChange={(e) => setCustomCtaText(e.target.value)}
                placeholder="Custom CTA text…"
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'hsla(0,0%,100%,0.04)',
                  border: '1px solid hsla(0,0%,100%,0.1)',
                  borderRadius: '6px',
                  color: '#e8e4de',
                  fontSize: '0.8125rem',
                }}
              />
              <input
                value={customCtaUrl}
                onChange={(e) => setCustomCtaUrl(e.target.value)}
                placeholder="/destination-url"
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'hsla(0,0%,100%,0.04)',
                  border: '1px solid hsla(0,0%,100%,0.1)',
                  borderRadius: '6px',
                  color: '#e8e4de',
                  fontSize: '0.8125rem',
                }}
              />
            </div>
          )}

          <button
            onClick={generate}
            disabled={!topic}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: topic
                ? 'linear-gradient(135deg, #d4a054, #c8953c)'
                : 'hsla(0,0%,100%,0.06)',
              color: topic ? '#070a10' : '#4a4540',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: topic ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            <Sparkles size={16} /> Generate Carousel
          </button>
        </div>
      )}

      {step === 'preview' && (
        <div style={{ padding: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e8e4de' }}>
                {topic} — {template.name}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#6b6560', marginTop: '0.125rem' }}>
                {generatedSlides.length} slides generated
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setStep('config')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.875rem',
                  background: 'hsla(0,0%,100%,0.06)',
                  color: '#8b8579',
                  border: '1px solid hsla(0,0%,100%,0.08)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={12} /> Edit
              </button>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.875rem',
                  background: 'linear-gradient(135deg, #d4a054, #c8953c)',
                  color: '#070a10',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <Download size={12} /> {saving ? 'Saving…' : 'Save Carousel'}
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid hsla(0,0%,100%,0.06)',
              paddingBottom: '0',
            }}
          >
            {(['slides', 'captions', 'import'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab ? '#d4a054' : 'transparent'}`,
                  color: activeTab === tab ? '#d4a054' : '#6b6560',
                  fontSize: '0.8125rem',
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'slides'
                  ? 'Slides'
                  : tab === 'captions'
                    ? 'Captions'
                    : 'aiCarousels Import'}
              </button>
            ))}
          </div>

          {activeTab === 'slides' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {generatedSlides.map((slide, i) => (
                <div
                  key={i}
                  style={{
                    padding: '1rem 1.25rem',
                    background:
                      slide.slideType === 'intro'
                        ? 'hsla(38,65%,58%,0.08)'
                        : slide.slideType === 'outro'
                          ? 'hsla(260,60%,60%,0.08)'
                          : 'hsla(0,0%,100%,0.02)',
                    border: `1px solid ${slide.slideType === 'intro' ? 'hsla(38,65%,58%,0.2)' : slide.slideType === 'outro' ? 'hsla(260,60%,60%,0.2)' : 'hsla(0,0%,100%,0.05)'}`,
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color:
                          slide.slideType === 'intro'
                            ? '#d4a054'
                            : slide.slideType === 'outro'
                              ? '#9c5adc'
                              : '#8b8579',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {slide.slideType === 'intro'
                        ? 'Intro'
                        : slide.slideType === 'outro'
                          ? 'Outro'
                          : `Slide ${slide.slideNumber}`}
                    </span>
                    {slide.tagline && (
                      <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
                        · {slide.tagline}
                      </span>
                    )}
                  </div>
                  {slide.title && (
                    <div
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: '#e8e4de',
                        marginBottom: '0.375rem',
                      }}
                    >
                      {slide.title}
                    </div>
                  )}
                  {slide.paragraph && (
                    <div style={{ fontSize: '0.8125rem', color: '#8b8579', lineHeight: 1.6 }}>
                      {slide.paragraph}
                    </div>
                  )}
                  {slide.callToAction && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#d4a054',
                        marginTop: '0.5rem',
                        fontWeight: 600,
                      }}
                    >
                      CTA: {slide.callToAction}
                    </div>
                  )}
                </div>
              ))}

              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.05)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: '#8b8579',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}
                >
                  Visual Direction Notes
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#6b6560', lineHeight: 1.6 }}>
                  Template: {template.name}. Brand colors: gold (#d4a054) on dark (#070a10). Clean
                  minimal layout. Max 3 lines per slide. Use consistent typography. Cover slide:
                  bold hook centered. Outro: logo + CTA prominent. Recommended PDF title: &ldquo;
                  {topic} — {template.name} by SZL Holdings&rdquo;.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'captions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'LinkedIn — Short Caption', text: shortCaption, platform: 'LinkedIn' },
                { label: 'LinkedIn — Long Caption', text: longCaption, platform: 'LinkedIn' },
                { label: 'X / Threads Adaptation', text: xThread, platform: 'X' },
                { label: 'Instagram Caption', text: instagramCaption, platform: 'Instagram' },
              ].map(({ label, text, platform }) => (
                <div
                  key={label}
                  style={{
                    padding: '1rem',
                    background: 'hsla(0,0%,100%,0.02)',
                    border: '1px solid hsla(0,0%,100%,0.05)',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: '#8b8579',
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                    </span>
                    <CopyButton text={text} label={`Copy ${platform}`} />
                  </div>
                  <pre
                    style={{
                      fontSize: '0.8125rem',
                      color: '#c8c2ba',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      margin: 0,
                    }}
                  >
                    {text}
                  </pre>
                </div>
              ))}

              <div
                style={{
                  padding: '1rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.05)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: '#8b8579',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}
                >
                  Hashtags & Keywords
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {[
                    ...template.hashtags,
                    '#SZLHoldings',
                    `#${(pillar?.name || 'Business').replace(/\s+/g, '')}`,
                  ].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '0.25rem 0.625rem',
                        background: 'hsla(38,65%,58%,0.08)',
                        border: '1px solid hsla(38,65%,58%,0.15)',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        color: '#d4a054',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e8e4de' }}>
                    aiCarousels Import Block
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#6b6560', marginTop: '0.125rem' }}>
                    Copy this text and paste it into aiCarousels → Import → Text Import
                  </div>
                </div>
                <CopyButton text={importBlock} label="Copy Import Block" />
              </div>
              <div
                style={{
                  padding: '1.25rem',
                  background: '#050810',
                  border: '1px solid hsla(0,0%,100%,0.08)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                }}
              >
                <pre
                  style={{
                    fontSize: '0.8125rem',
                    color: '#8bdc9c',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                  }}
                >
                  {importBlock}
                </pre>
              </div>
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.875rem 1rem',
                  background: 'hsla(38,65%,58%,0.06)',
                  border: '1px solid hsla(38,65%,58%,0.15)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#d4a054',
                    fontWeight: 600,
                    marginBottom: '0.375rem',
                  }}
                >
                  Import Format Notes
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#8b8579', lineHeight: 1.6 }}>
                  Each line follows the format:{' '}
                  <code
                    style={{
                      background: 'hsla(0,0%,100%,0.06)',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '3px',
                    }}
                  >
                    [Intro] Tagline/Title/Paragraph
                  </code>
                  ,{' '}
                  <code
                    style={{
                      background: 'hsla(0,0%,100%,0.06)',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '3px',
                    }}
                  >
                    [Slide N] Title/Paragraph
                  </code>
                  ,{' '}
                  <code
                    style={{
                      background: 'hsla(0,0%,100%,0.06)',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '3px',
                    }}
                  >
                    [Outro] Tagline/Title/Paragraph/CTA
                  </code>
                  . Fields are separated by forward slashes.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CarouselCard({ carousel, pillars }: { carousel: CarouselProject; pillars: Pillar[] }) {
  const [expanded, setExpanded] = useState(false);
  const [publishingLinkedIn, setPublishingLinkedIn] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [statusLabel, setStatusLabel] = useState(carousel.status);

  const pillar = pillars.find((p) => p.id === carousel.pillarId);
  const templateMatch = CAROUSEL_TEMPLATES.find(
    (t) =>
      carousel.slug?.startsWith(t.id) ||
      carousel.title?.toLowerCase().includes(t.name.toLowerCase()),
  );
  const templateName = templateMatch?.name ?? 'Custom';
  const platforms = [
    carousel.linkedinShortCaption ? 'LinkedIn' : null,
    carousel.xThreadAdaptation ? 'X / Threads' : null,
    carousel.instagramCaption ? 'Instagram' : null,
  ].filter(Boolean);

  function exportImportBlock() {
    if (!carousel.aiCarouselsImportBlock) return;
    const blob = new Blob([carousel.aiCarouselsImportBlock], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${carousel.slug || 'carousel'}-aicarousels-import.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function publishToLinkedIn() {
    setPublishingLinkedIn(true);
    try {
      const res = await fetch(
        `${API}/api/distribution-os/carousels/${carousel.id}/publish-linkedin`,
        {
          method: 'POST',
          credentials: 'include',
          headers: writeHeaders(),
          body: JSON.stringify({}),
        },
      );
      const data = await res.json();
      if (data.carousel) setStatusLabel(data.carousel.status);
    } catch {}
    setPublishingLinkedIn(false);
  }

  async function downloadPdf() {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`${API}/api/distribution-os/carousels/${carousel.id}/export-pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${carousel.slug || 'carousel'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
    setDownloadingPdf(false);
  }

  return (
    <div
      style={{
        padding: '1.25rem',
        background: 'hsla(0,0%,100%,0.02)',
        border: '1px solid hsla(0,0%,100%,0.05)',
        borderRadius: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.375rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: STATUS_COLORS[statusLabel] || '#8b8579',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0.125rem 0.5rem',
                background: `${STATUS_COLORS[statusLabel] || '#8b8579'}18`,
                borderRadius: '3px',
              }}
            >
              {statusLabel}
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                color: '#6b6560',
                padding: '0.125rem 0.5rem',
                background: 'hsla(0,0%,100%,0.04)',
                borderRadius: '3px',
                border: '1px solid hsla(0,0%,100%,0.06)',
              }}
            >
              {templateName}
            </span>
            {pillar && (
              <span
                style={{
                  fontSize: '0.625rem',
                  color: pillar.color || '#d4a054',
                  padding: '0.125rem 0.5rem',
                  background: 'hsla(38,65%,58%,0.08)',
                  borderRadius: '3px',
                }}
              >
                {pillar.name}
              </span>
            )}
            {platforms.length > 0 && (
              <span style={{ fontSize: '0.625rem', color: '#4a90b8' }}>
                {platforms.join(' · ')}
              </span>
            )}
          </div>
          <h3
            style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#e8e4de',
              marginBottom: '0.25rem',
            }}
          >
            {carousel.title}
          </h3>
          {carousel.hook && (
            <p
              style={{
                fontSize: '0.8125rem',
                color: '#6b6560',
                lineHeight: 1.5,
                marginBottom: '0.375rem',
              }}
            >
              {carousel.hook}
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
              {new Date(carousel.createdAt).toLocaleDateString()}
            </span>
            {carousel.ctaText && (
              <span style={{ fontSize: '0.6875rem', color: '#d4a054' }}>
                CTA: {carousel.ctaText}
              </span>
            )}
            {carousel.ctaUrl && (
              <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>→ {carousel.ctaUrl}</span>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.375rem',
            flexShrink: 0,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={downloadPdf}
            disabled={downloadingPdf}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.375rem 0.625rem',
              background: 'hsla(0,0%,100%,0.06)',
              color: '#d4a054',
              border: '1px solid hsla(38,50%,52%,0.2)',
              borderRadius: '6px',
              fontSize: '0.6875rem',
              cursor: downloadingPdf ? 'default' : 'pointer',
              fontWeight: 600,
            }}
          >
            <Download size={12} /> {downloadingPdf ? '...' : 'PDF'}
          </button>
          {carousel.linkedinShortCaption && (
            <button
              onClick={publishToLinkedIn}
              disabled={publishingLinkedIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.375rem 0.625rem',
                background: publishingLinkedIn ? 'hsla(0,0%,100%,0.04)' : 'hsla(210,50%,50%,0.12)',
                color: '#4a90b8',
                border: '1px solid hsla(210,50%,50%,0.2)',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                cursor: publishingLinkedIn ? 'default' : 'pointer',
                fontWeight: 600,
              }}
            >
              LinkedIn
            </button>
          )}
          {carousel.aiCarouselsImportBlock && (
            <CopyButton text={carousel.aiCarouselsImportBlock} label="Copy Import" />
          )}
          {carousel.aiCarouselsImportBlock && (
            <button
              onClick={exportImportBlock}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.375rem 0.625rem',
                background: 'hsla(0,0%,100%,0.04)',
                color: '#8b8579',
                border: '1px solid hsla(0,0%,100%,0.06)',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                cursor: 'pointer',
              }}
            >
              <Download size={12} /> Export
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.375rem 0.625rem',
              background: 'hsla(0,0%,100%,0.04)',
              color: '#8b8579',
              border: '1px solid hsla(0,0%,100%,0.06)',
              borderRadius: '6px',
              fontSize: '0.6875rem',
              cursor: 'pointer',
            }}
          >
            <Eye size={12} /> {expanded ? 'Less' : 'Preview'}
          </button>
        </div>
      </div>

      {expanded && carousel.aiCarouselsImportBlock && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#050810',
            border: '1px solid hsla(0,0%,100%,0.06)',
            borderRadius: '6px',
          }}
        >
          <pre
            style={{
              fontSize: '0.75rem',
              color: '#8bdc9c',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              margin: 0,
            }}
          >
            {carousel.aiCarouselsImportBlock}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function CarouselLabPage() {
  const [location] = useLocation();
  const [carousels, setCarousels] = useState<CarouselProject[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/distribution-os/carousels`).then((r) => r.json()),
      fetch(`${API}/api/distribution-os/pillars`).then((r) => r.json()),
    ])
      .then(([carouselData, pillarData]) => {
        setCarousels(Array.isArray(carouselData) ? carouselData : []);
        setPillars(Array.isArray(pillarData) ? pillarData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleSave(c: CarouselProject) {
    setCarousels((prev) => [c, ...prev]);
    setShowGenerator(false);
  }

  const byStatus = carousels.reduce(
    (acc, c) => {
      (acc[c.status] = acc[c.status] || []).push(c);
      return acc;
    },
    {} as Record<string, CarouselProject[]>,
  );

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8e4de' }}>Carousel Lab</h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b6560', marginTop: '0.25rem' }}>
              Generate, format, and export LinkedIn/Instagram carousels with aiCarousels-ready
              import blocks
            </p>
          </div>
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              background: showGenerator
                ? 'hsla(0,0%,100%,0.06)'
                : 'linear-gradient(135deg, #d4a054, #c8953c)',
              color: showGenerator ? '#8b8579' : '#070a10',
              border: showGenerator ? '1px solid hsla(0,0%,100%,0.08)' : 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            {showGenerator ? <ChevronDown size={16} /> : <Plus size={16} />}
            {showGenerator ? 'Hide Generator' : 'New Carousel'}
          </button>
        </div>

        <AnimatePresence>
          {showGenerator && (
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ marginBottom: '2rem' }}
            >
              <GeneratorPanel pillars={pillars} onSave={handleSave} />
            </m.div>
          )}
        </AnimatePresence>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.625rem',
            marginBottom: '2rem',
          }}
        >
          {[
            { label: 'Total Carousels', value: carousels.length, color: '#d4a054' },
            { label: 'Ready to Export', value: (byStatus['ready'] || []).length, color: '#5a9c5a' },
            { label: 'Published', value: (byStatus['published'] || []).length, color: '#9c5adc' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '1rem',
                background: 'hsla(0,0%,100%,0.02)',
                border: '1px solid hsla(0,0%,100%,0.05)',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#6b6560', marginTop: '0.25rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#4a4540' }}>
            Loading carousels…
          </div>
        ) : carousels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#4a4540' }}>
            <Image size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p style={{ fontSize: '0.9375rem', color: '#6b6560', marginBottom: '0.5rem' }}>
              No carousels yet
            </p>
            <p style={{ fontSize: '0.8125rem' }}>
              Click &ldquo;New Carousel&rdquo; to generate your first carousel.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {carousels.map((c) => (
              <CarouselCard key={c.id} carousel={c} pillars={pillars} />
            ))}
          </div>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
