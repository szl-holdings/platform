import { Link } from "wouter";
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
  type LucideIcon,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useInvestorContent } from "@/hooks/useInvestorContent";

const ICONS: Record<string, LucideIcon> = {
  Building2, Layers, Shield, Target, TrendingUp, Users, Cpu, GitMerge,
};

function resolveIcon(name: unknown, fallback: LucideIcon): LucideIcon {
  if (typeof name === "function") return name as LucideIcon;
  if (typeof name === "string" && ICONS[name]) return ICONS[name];
  return fallback;
}

type IconRef = LucideIcon | string;

type PlatformItem = { name: string; role: string; color: string; href: string };
type WhyNowItem = { icon: IconRef; title: string; body: string };
type PrimitiveItem = { name: string; desc: string };
type CaseItem = { n: string; title: string; body: string };

type OverviewContent = {
  hero: { eyebrow: string; title: string; lede: string };
  platformMap: PlatformItem[];
  whyNow: WhyNowItem[];
  primitives: PrimitiveItem[];
  investorCase: CaseItem[];
};

const FALLBACK_CONTENT: OverviewContent = {
  hero: {
    eyebrow: "Investor Overview",
    title: "The governed decision operating system.",
    lede:
      "SZL Holdings builds the platform layer between signal detection and action execution — enforcing governance, attribution, and outcome tracking on every consequential enterprise decision. The governance is the OS. Domain packs are the applications.",
  },
  platformMap: [
    { name: "KORA", role: "Flagship command surface — PRAXIS framework, signal-to-action loop, five-pillar intelligence", color: "#d4a054", href: "/lyte" },
    { name: "Counsel", role: "Execution fabric — workflow orchestration, approval gates, immutable audit trail", color: "#8b7ac8", href: "/continuum-fabric" },
    { name: "APEX", role: "Unified mobile command — all domain workspaces, biometric auth, offline sync", color: "#4a90b8", href: "/cortex" },
    { name: "PARAGON", role: "Domain pack — Security & defense intelligence, SOC command, threat governance", color: "#c45a4a", href: "/solutions/aegis" },
    { name: "SEXTANT", role: "Domain pack — Maritime intelligence, voyage twins, route risk, sanctions compliance", color: "#4a90b8", href: "/solutions/vessels" },
    { name: "DOMAINE", role: "Domain pack — Real estate intelligence, distress pipeline, ownership graph, deal workflow", color: "#c8953c", href: "/solutions/terra" },
    { name: "Counsel", role: "Domain pack — Legal matter command, deadlines, proof chain, export safety", color: "#6aaa72", href: "/counsel" },
    { name: "Carlota Jo", role: "Domain pack — Premium advisory, client portal, structured delivery model", color: "#a0a0c0", href: "/carlota-jo" },
  ],
  whyNow: [
    {
      icon: Cpu,
      title: "AI capability has crossed the inference threshold",
      body: "Modern LLMs can reason across complex, multi-domain operational data with sufficient reliability for enterprise action — accurately enough that operators would act on recommendations if they were governed. The problem is not AI capability. The problem is the absence of infrastructure to govern what AI recommends.",
    },
    {
      icon: Shield,
      title: "Enterprise tolerance for AI black boxes is collapsing",
      body: "The EU AI Act, SEC AI governance guidelines, and financial services regulators in multiple jurisdictions are converging on explainable, auditable, human-in-the-loop AI. Every major enterprise deploying AI copilots today faces the same governance gap: recommendations without attribution, actions without approval gates, decisions without audit trails.",
    },
    {
      icon: TrendingUp,
      title: "The observability category proved the market exists",
      body: "Datadog reached $1B ARR by making infrastructure observable. The question SZL Holdings answers is whether that model extends to the operational decision layer. Every signal says it does — at significantly higher stakes, with significantly stronger moats.",
    },
  ],
  primitives: [
    { name: "Outcome Graph", desc: "Tracks recommendation → decision → outcome. Closed-loop AI calibration." },
    { name: "Proof Chain", desc: "Immutable audit trail with full AI output provenance. Cryptographically verifiable." },
    { name: "Covenant Policy", desc: "Human-in-the-loop enforcement at the policy layer — agents cannot bypass it." },
    { name: "Decision Simulation", desc: "Monte Carlo risk modeling before action. Calibrated against real outcome data." },
    { name: "Workflow Engine", desc: "Durable multi-step process orchestration with approval gates built in." },
    { name: "Event Fabric", desc: "Cross-domain signal backbone. Correlation value compounds with each domain pack." },
  ],
  investorCase: [
    { n: "1", title: "The category is real and undefended.", body: "Enterprise AI governance is a regulatory and operational requirement. The tools that come closest (Palantir, ServiceNow, Datadog) serve adjacent problems without the cross-domain, governed decision architecture." },
    { n: "2", title: "The architecture compounds.", body: "Eight structural moats grow stronger with every decision made on the platform. Decision memory, proof history, calibrated simulations, cross-domain correlation, and enterprise trust all compound over time in ways that a faster competitor cannot shortcut." },
    { n: "3", title: "The domain-pack model scales efficiently.", body: "Governance infrastructure is amortized across all domain packs. Each new pack expands ACV per customer, reduces procurement friction (trust review already done), and adds cross-domain signal value to all existing packs." },
    { n: "4", title: "The technical foundation is production-grade.", body: "450,000+ lines of TypeScript, 2,331 endpoints, 700+ database tables, 37 shared packages, multi-tenant isolation, OIDC auth, SCIM 2.0, Azure Bicep IaC. This is not a prototype — it is an enterprise platform at Functional Alpha." },
    { n: "5", title: "The timing is right.", body: "AI capability has crossed the inference threshold. Regulatory pressure is forcing governance. The observability category has proven enterprise willingness to pay for operational clarity. The category of governed decision operating system is being created now." },
  ],
};

export default function InvestorsOverviewPage() {
  const __pageMeta = usePageMeta({
    title: "Investor Overview — SZL Holdings",
    description: "SZL Holdings builds the governed decision operating system — the platform layer between signal detection and action execution that enforces governance, attribution, and outcome tracking on every consequential enterprise decision.",
    canonical: "https://szlholdings.com/investors/overview",
  });

  const { content, isSeeded } = useInvestorContent<OverviewContent>("overview", FALLBACK_CONTENT);
  const { hero, platformMap, whyNow, primitives, investorCase } = content;

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
                <Link href="/demo" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                  See the live product <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/investors/architecture" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                  Architecture deep dive
                </Link>
              </div>
            </div>
          </section>

          {/* Why Now */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Why now</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Three forces have converged.</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {whyNow.map((item) => {
                  const Icon = resolveIcon(item.icon, Cpu);
                  return (
                    <div key={item.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Category</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">A new category, not an adjacent feature.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                The governed decision operating system sits at the intersection of operational signal detection,
                AI-assisted reasoning, and structured action execution under governance. It is distinct from
                every existing category: BI shows what happened; AI copilots generate recommendations without
                approval gates; workflow tools automate without policy enforcement; AIOps is domain-specific
                without cross-domain governance. The market does not yet have a dominant platform in this
                category. SZL Holdings is building it from first principles.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {primitives.map((p) => (
                  <div key={p.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="text-sm font-semibold text-[#d4a054]">{p.name}</div>
                    <div className="mt-1.5 text-xs leading-5 text-white/55">{p.desc}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-white/35">Six shared governance primitives — not features. The structural abstractions that separate the platform from dashboards, copilots, and workflow tools.</p>
            </div>
          </section>

          {/* Platform map */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Platform map</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">One OS. Six domain packs. Shared governance.</h2>
              <div className="mt-8 space-y-3">
                {platformMap.map((p) => (
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Stage and status</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Functional Alpha. Pre-commercial. Design partner ready.</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <Target className="h-5 w-5 text-[#d4a054]" />
                  <h3 className="mt-4 text-base font-semibold text-white">Current stage</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Functional Alpha — full feature sets across all platforms with seeded and demo data. Carlota
                    Jo is live. The platform is pre-commercial; no paying customers as of April 2026.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <Users className="h-5 w-5 text-[#8b7ac8]" />
                  <h3 className="mt-4 text-base font-semibold text-white">Entry motion</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Design partner program — 3–6 partners per domain, co-designing the product in exchange for
                    early access and preferred pricing. Primary domains: maritime (SEXTANT), security (PARAGON),
                    real estate (DOMAINE).
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <GitMerge className="h-5 w-5 text-[#4a90b8]" />
                  <h3 className="mt-4 text-base font-semibold text-white">Expansion model</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Single-domain → multi-domain → platform-wide. Each domain pack added increases ACV without
                    proportional CAC increase. Governance infrastructure is amortized across all packs.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Investor case */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">The investor case</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Five points. Eight moats.</h2>
              <div className="mt-8 space-y-4">
                {investorCase.map((item) => (
                  <div key={item.n} className="flex items-start gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d4a054]/30 bg-[#d4a054]/10 text-xs font-bold text-[#d4a054]">{item.n}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-white/60">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Explore further */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <h2 className="text-2xl font-semibold text-white">Explore further</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Architecture", href: "/investors/architecture", icon: Layers },
                  { label: "Moat & Defensibility", href: "/investors/moat", icon: Shield },
                  { label: "Roadmap", href: "/investors/roadmap", icon: TrendingUp },
                  { label: "Founder", href: "/investors/founder", icon: Users },
                ].map((item) => (
                  <Link key={item.label} href={item.href}>
                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04] cursor-pointer">
                      <item.icon className="h-4 w-4 text-[#d4a054]" />
                      <span className="text-sm font-medium text-white/80">{item.label}</span>
                    </div>
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
