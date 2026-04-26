import { Link } from 'wouter';
import {
  Building2,
  ArrowRight,
  Layers,
  Shield,
  Target,
  TrendingUp,
  Users,
  Cpu,
  GitMerge,
  Map,
  CheckCircle,
  Clock,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useCapabilityManifest } from '@/hooks/useCapabilityManifest';
import { useInvestorContent } from '@/hooks/useInvestorContent';

const ICONS: Record<string, LucideIcon> = {
  Building2,
  Layers,
  Shield,
  Target,
  TrendingUp,
  Users,
  Cpu,
  GitMerge,
  Map,
};

function resolveIcon(name: unknown, fallback: LucideIcon): LucideIcon {
  if (typeof name === 'function') return name as LucideIcon;
  if (typeof name === 'string' && ICONS[name]) return ICONS[name];
  return fallback;
}

type IconRef = LucideIcon | string;
type PlatformItem = { name: string; role: string; color: string; href: string };
type WhyNowItem = { icon: IconRef; title: string; body: string };
type PrimitiveItem = { name: string; desc: string };
type ClaimItem = {
  claim: string;
  manifestStatus: 'live' | 'working_demo' | 'partial';
  evidence: string;
  capId: string;
};

type OverviewContent = {
  hero: { eyebrow: string; title: string; lede: string };
  platformMap: PlatformItem[];
  whyNow: WhyNowItem[];
  primitives: PrimitiveItem[];
  investorClaims: ClaimItem[];
};

const platformMap = [
  {
    name: 'A11oy',
    role: 'Governed execution fabric: ingest, normalize, analyze, recommend, approve, execute, verify, audit, deliver',
    color: '#6f8cff',
    href: '/a11oy',
  },
  {
    name: 'KORA',
    role: 'Flagship command surface: signal-to-action loop, operator queue, boardroom-ready intelligence',
    color: '#d4a054',
    href: '/lyte',
  },
  {
    name: 'FORGE',
    role: 'Unified command portal: cross-domain coordination, approval workflows, operational control',
    color: '#8b7ac8',
    href: '/command',
  },
  {
    name: 'APEX',
    role: 'Mobile command artifact: prototype-stage access to governed workspaces',
    color: '#4a90b8',
    href: '/mobile',
  },
  {
    name: 'PARAGON',
    role: 'Domain pack: defense and intelligence command workflows',
    color: '#c45a4a',
    href: '/solutions/aegis',
  },
  {
    name: 'SEXTANT',
    role: 'Domain pack: maritime intelligence, fleet workflow, voyage risk views',
    color: '#4a90b8',
    href: '/solutions/vessels',
  },
  {
    name: 'DOMAINE',
    role: 'Domain pack: real estate intelligence, pipeline workflow, ownership context',
    color: '#c8953c',
    href: '/solutions/terra',
  },
  {
    name: 'Counsel',
    role: 'Domain pack: legal matter command, deadlines, proof chain, export safety',
    color: '#6aaa72',
    href: '/counsel',
  },
  {
    name: 'Carlota Jo',
    role: 'Domain pack: premium advisory, client portal, structured delivery model',
    color: '#a0a0c0',
    href: '/carlota-jo',
  },
  {
    name: 'LUMINA',
    role: 'Domain pack: executive briefing and AI summary surface',
    color: '#e0709a',
    href: '/pulse',
  },
];

const whyNow = [
  {
    icon: Cpu,
    title: 'AI capability has crossed the inference threshold',
    body: 'Modern LLMs can reason across complex, multi-domain operational data with sufficient reliability for enterprise action — accurately enough that operators would act on recommendations if they were governed. The problem is not AI capability. The problem is the absence of infrastructure to govern what AI recommends.',
  },
  {
    icon: Shield,
    title: 'Enterprise tolerance for AI black boxes is collapsing',
    body: 'The EU AI Act, SEC AI governance guidelines, and financial services regulators in multiple jurisdictions are converging on explainable, auditable, human-in-the-loop AI. Every major enterprise deploying AI copilots today faces the same governance gap: recommendations without attribution, actions without approval gates, decisions without audit trails.',
  },
  {
    icon: TrendingUp,
    title: 'The observability category proved the market exists',
    body: 'Datadog reached $1B ARR by making infrastructure observable. The question SZL Holdings answers is whether that model extends to the operational decision layer. Every signal says it does — at significantly higher stakes, with significantly stronger structural moats.',
  },
];

const primitives = [
  {
    name: 'Outcome Graph',
    desc: 'Tracks recommendation → decision → outcome. Closed-loop AI calibration.',
  },
  {
    name: 'Proof Chain',
    desc: 'Immutable audit trail with full AI output provenance. Cryptographically verifiable.',
  },
  {
    name: 'Covenant Policy',
    desc: 'Human-in-the-loop enforcement at the policy layer — agents cannot bypass it.',
  },
  {
    name: 'Decision Simulation',
    desc: 'Monte Carlo risk modeling before action. Calibrated against real outcome data.',
  },
  {
    name: 'Workflow Engine',
    desc: 'Durable multi-step process orchestration with approval gates built in.',
  },
  {
    name: 'Event Fabric',
    desc: 'Cross-domain signal backbone. Correlation value compounds with each domain pack.',
  },
];

const INVESTOR_CLAIMS = [
  {
    claim: 'Governed A11oy workflow with approval gates',
    manifestStatus: 'working_demo' as const,
    evidence:
      'A11OY-001/A11OY-004: A11oy surfaces expose the governed workflow model and keep consequential actions behind policy and approval gates.',
    capId: 'A11OY-001',
  },
  {
    claim: 'Proof Chain audit record with source and policy context',
    manifestStatus: 'working_demo' as const,
    evidence:
      'A11OY-003: Proof ledger surfaces show source, confidence, policy result, approval state, and audit context for demo recommendations.',
    capId: 'A11OY-003',
  },
  {
    claim: 'Canonical platform counts are reproducible',
    manifestStatus: 'live' as const,
    evidence:
      'INFRA-002: audit/source-of-truth.json records 15 registered deployable artifacts, 146 packages/libraries, 385 API route files, and 730 provisioned PostgreSQL tables.',
    capId: 'INFRA-002',
  },
  {
    claim: 'GitHub quality and security gates are present',
    manifestStatus: 'live' as const,
    evidence:
      'INFRA-001: 24 GitHub Actions workflows cover CI, CodeQL, dependency review, security scans, build, E2E, Lighthouse, README QA, and one archived manual-only workflow.',
    capId: 'INFRA-001',
  },
  {
    claim: 'API route surface is inventoried',
    manifestStatus: 'live' as const,
    evidence:
      'API-001: canonical source-of-truth records 385 API route files as of 2026-04-26 with reproduction commands.',
    capId: 'API-001',
  },
  {
    claim: 'High-risk AI execution remains approval-gated',
    manifestStatus: 'working_demo' as const,
    evidence:
      'A11OY-004: finance and other high-risk execution paths remain advisory or blocked by default unless policy and human approval are present.',
    capId: 'A11OY-004',
  },
];

const FALLBACK_CONTENT: OverviewContent = {
  hero: {
    eyebrow: 'Investor Overview',
    title: 'The governed decision operating system.',
    lede: 'SZL Holdings builds the platform layer between signal detection and action execution — enforcing governance, attribution, and outcome tracking on every consequential enterprise decision. The governance is the OS. Domain packs are the applications.',
  },
  platformMap,
  whyNow,
  primitives,
  investorClaims: INVESTOR_CLAIMS,
};

export default function InvestorsOverviewPage() {
  const { totals } = useCapabilityManifest();

  const __pageMeta = usePageMeta({
    title: 'Investor Overview — SZL Holdings',
    description:
      'SZL Holdings builds the governed decision operating system — the platform layer between signal detection and action execution that enforces governance, attribution, and outcome tracking on every consequential enterprise decision.',
    canonical: 'https://szlholdings.com/investors/overview',
  });

  const { content, isSeeded } = useInvestorContent<OverviewContent>('overview', FALLBACK_CONTENT);
  const {
    hero,
    platformMap: pMap,
    whyNow: wn,
    primitives: prims,
    investorClaims: claims,
  } = content;

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#070a10] text-white">
        <SiteNav />
        <main>
          {/* Hero */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
                  <Building2 className="h-3.5 w-3.5" />
                  {hero.eyebrow}
                </div>
                {isSeeded ? (
                  <span
                    data-testid="investor-content-demo-badge"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Live DB
                  </span>
                ) : null}
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                {hero.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">{hero.lede}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  See the live product <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/investors/architecture"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
                >
                  Architecture deep dive
                </Link>
              </div>
            </div>
          </section>

          {/* Why Now */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                Why now
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Three forces have converged.
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {wn.map((item) => {
                  const Icon = resolveIcon(item.icon, Cpu);
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                    >
                      <Icon className="h-5 w-5 text-[#d4a054]" />
                      <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/60">{item.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Category positioning */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                Category
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                A new category, not an adjacent feature.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                The governed decision operating system sits at the intersection of operational
                signal detection, AI-assisted reasoning, and structured action execution under
                governance. It is distinct from every existing category: BI shows what happened; AI
                copilots generate recommendations without approval gates; workflow tools automate
                without policy enforcement; AIOps is domain-specific without cross-domain
                governance. The market does not yet have a dominant platform in this category. SZL
                Holdings is building it from first principles.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {prims.map((p) => (
                  <div
                    key={p.name}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
                  >
                    <div className="text-sm font-semibold text-[#d4a054]">{p.name}</div>
                    <div className="mt-1.5 text-xs leading-5 text-white/55">{p.desc}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-white/35">
                Six shared governance primitives — not features. The structural abstractions that
                separate the platform from dashboards, copilots, and workflow tools.
              </p>
            </div>
          </section>

          {/* Platform map */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                Platform map
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                One fabric. Active domain packs. Shared governance.
              </h2>
              <div className="mt-8 space-y-3">
                {pMap.map((p) => (
                  <Link key={p.name} href={p.href}>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-4 transition hover:bg-white/[0.04] cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                        <div>
                          <div className="text-sm font-semibold text-white">{p.name}</div>
                          <div className="text-xs text-white/56">{p.role}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-white/32" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Stage and status */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                Stage and status
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Active prototype. Pre-commercial. Design partner evaluation ready.
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <Target className="h-5 w-5 text-[#d4a054]" />
                  <h3 className="mt-4 text-base font-semibold text-white">Current stage</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Active prototype and investor demo platform with seeded and demo-safe data.
                    Production customer onboarding and compliance certification remain roadmap items
                    as of April 2026.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <Users className="h-5 w-5 text-[#8b7ac8]" />
                  <h3 className="mt-4 text-base font-semibold text-white">Entry motion</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Design partner program concept: 3-6 partners per domain, co-designing the
                    product in exchange for early access and preferred pricing. Primary domains:
                    maritime (SEXTANT), cyber/defense (TENAX/PARAGON), and real estate (DOMAINE).
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <GitMerge className="h-5 w-5 text-[#4a90b8]" />
                  <h3 className="mt-4 text-base font-semibold text-white">Expansion model</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Single-domain to multi-domain to platform-wide. Each domain pack can expand
                    account scope while reusing the same governance, audit, policy, and approval
                    infrastructure.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Investor case */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                The investor case
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Five points. Eight moats.</h2>
              <div className="mt-8 space-y-4">
                {[
                  {
                    n: '1',
                    title: 'The category is real and undefended.',
                    body: 'Enterprise AI governance is a regulatory and operational requirement. The tools that come closest (Palantir, ServiceNow, Datadog) serve adjacent problems without the cross-domain, governed decision architecture.',
                  },
                  {
                    n: '2',
                    title: 'The architecture compounds.',
                    body: 'Eight structural moats grow stronger with every decision made on the platform. Decision memory, proof history, calibrated simulations, cross-domain correlation, and enterprise trust all compound over time in ways that a faster competitor cannot shortcut.',
                  },
                  {
                    n: '3',
                    title: 'The domain-pack model scales efficiently.',
                    body: 'Governance infrastructure is amortized across all domain packs. Each new pack expands ACV per customer, reduces procurement friction (trust review already done), and adds cross-domain signal value to all existing packs.',
                  },
                  {
                    n: '4',
                    title: 'The technical foundation is substantial and audited.',
                    body: 'The current source-of-truth records 15 registered deployable artifacts, 146 packages/libraries, 385 API route files, and 730 provisioned PostgreSQL tables. Counts are reproduced from audit/source-of-truth.json, not estimates.',
                  },
                  {
                    n: '5',
                    title: 'The timing is right.',
                    body: 'AI capability has crossed the inference threshold. Regulatory pressure is forcing governance. The observability category has proven enterprise willingness to pay for operational clarity. The category of governed decision operating system is being created now.',
                  },
                ].map((item) => (
                  <div
                    key={item.n}
                    className="flex items-start gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d4a054]/30 bg-[#d4a054]/10 text-xs font-bold text-[#d4a054]">
                      {item.n}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-white/60">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Fact-checked proof — manifest-driven */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                    Fact-checked investor proof
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Every claim backed by a manifest entry.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/50 max-w-lg">
                    Derived from{' '}
                    <code className="text-[#3b82f6] text-xs">
                      artifacts/szl-holdings/src/data/capability-manifest.json
                    </code>{' '}
                    - audited 2026-04-26.
                    {totals.live} live, {totals.working_demo} working demo, {totals.partial} partial
                    across {totals.total} capabilities.
                  </p>
                </div>
                <Link
                  href="/product-readiness"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/[0.06]"
                >
                  Full readiness matrix <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {claims.map((item) => {
                  const isLive = item.manifestStatus === 'live';
                  const isDemo = item.manifestStatus === 'working_demo';
                  return (
                    <div
                      key={item.claim}
                      className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {isLive ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : isDemo ? (
                          <Clock className="h-4 w-4 text-blue-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{item.claim}</span>
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                              isLive
                                ? 'bg-emerald-400/10 text-emerald-400'
                                : isDemo
                                  ? 'bg-blue-400/10 text-blue-400'
                                  : 'bg-amber-400/10 text-amber-400'
                            }`}
                          >
                            {item.manifestStatus === 'working_demo'
                              ? 'Working Demo'
                              : item.manifestStatus}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-white/45">{item.evidence}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-5 text-xs text-white/30">
                No claim appears here that is not backed by a{' '}
                <code className="text-white/40">live</code> or{' '}
                <code className="text-white/40">working_demo</code> entry in the capability
                manifest. Partial, stub, broken, and undocumented capabilities are excluded from
                investor-facing proof.
              </p>
            </div>
          </section>

          {/* Explore further */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <h2 className="text-2xl font-semibold text-white">Explore further</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Architecture', href: '/investors/architecture', icon: Layers },
                  { label: 'Moat & Defensibility', href: '/investors/moat', icon: Shield },
                  { label: 'Roadmap', href: '/investors/roadmap', icon: Map },
                  { label: 'Founder', href: '/investors/founder', icon: Users },
                ].map((item) => (
                  <Link key={item.label} href={item.href}>
                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04] cursor-pointer">
                      <item.icon className="h-4 w-4 text-[#d4a054]" />
                      <span className="text-sm font-medium text-white/80">{item.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-white/[0.05]">
                {[
                  { label: 'Product Readiness Matrix', href: '/product-readiness' },
                  { label: 'Trust Center Status', href: '/trust-center/status' },
                  { label: 'Technical Proof', href: '/technical-proof' },
                  { label: 'Changelog', href: '/changelog-highlights' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs text-[#3b82f6] hover:underline flex items-center gap-1"
                  >
                    {link.label} <ArrowRight className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
