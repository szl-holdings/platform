import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  ExternalLink,
  Radar,
  Workflow,
  Layers3,
  Ship,
  ShieldCheck,
  Building2,
  BriefcaseBusiness,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const EVAL_API_BASE = `${import.meta.env.BASE_URL}api/eval-registry/public/benchmarks`;
const EVAL_TRACE_BASE = 'https://github.com/szlholdings/eval-results/blob/main/.eval_results';

const STATIC_VERIFIED_SCORES: VerifiedScore[] = [
  { entity: 'Counsel', label: 'Contract Risk Detection', score: '94.2%', unit: 'accuracy', note: 'Clause classification, 4,200 contracts', sourceUrl: `${EVAL_TRACE_BASE}/counsel-v2-2026-04-10.yaml`, badgeState: 'verified' },
  { entity: 'Pulse', label: 'Executive Brief Quality', score: '4.6/5', unit: 'expert relevance', note: 'Domain-expert panel, 90-day window', sourceUrl: `${EVAL_TRACE_BASE}/pulse-v3-2026-04-14.yaml`, badgeState: 'verified' },
  { entity: 'SEXTANT', label: 'Vessel ETA Accuracy', score: '3.1%', unit: 'MAPE', note: 'Live fleet data, 12-month sample', sourceUrl: `${EVAL_TRACE_BASE}/sextant-v2-2026-04-08.yaml`, badgeState: 'verified' },
];

type BadgeState = 'verified' | 'community' | 'leaderboard' | 'source';
type VerifiedScore = { entity: string; label: string; score: string; unit: string; note: string; sourceUrl: string; badgeState?: BadgeState };

const problemFrames = [
  "Leadership teams can see metrics, but not always operational causality.",
  "AI recommendations are often detached from governed execution.",
  "Approvals, owners, and next actions drift across inboxes, meetings, and spreadsheets.",
];

const differentiators = [
  {
    title: "One wedge, one engine",
    body: "KORA is the product narrative. Counsel is the execution and audit layer underneath. That separation makes the software easier to understand and harder to dismiss as surface-level UI.",
  },
  {
    title: "Category clarity",
    body: "The company is not pitching five simultaneous products. It is pitching governed decision infrastructure — a new category, not an adjacent feature — with a visible domain-pack expansion path.",
  },
  {
    title: "Compounding expansion logic",
    body: "Once the command and audit spine exists, new vertical applications can be built on top of it without starting from zero each time.",
  },
  {
    title: "Trust by design",
    body: "Signals, routing, workflow state, and audit trails are part of the core architecture instead of an afterthought added later.",
  },
];

const nowThen = [
  {
    label: "Now",
    title: "Design-partner phase",
    body: "Work with 3–6 design partners per domain — maritime, security, real estate — on governed decision infrastructure in their actual operating environment. Proof before scale.",
  },
  {
    label: "Next",
    title: "Prove repeatability",
    body: "Use design partners, pilot evidence, and operator feedback to validate the command model and sharpen the ICP.",
  },
  {
    label: "Later",
    title: "Open the vertical lanes",
    body: "Extend the same operating spine into maritime, security, real estate, and advisory where the same observability-to-action model applies.",
  },
];

const expansionLanes = [
  {
    icon: Ship,
    name: "SEXTANT",
    body: "Maritime intelligence for fleet and voyage operations once the core narrative is commercially anchored.",
  },
  {
    icon: ShieldCheck,
    name: "PARAGON",
    body: "A security and command environment for incident, threat, and managed operations workflows.",
  },
  {
    icon: Building2,
    name: "DOMAINE",
    body: "Real-estate intelligence where fragmented signal, process latency, and ownership ambiguity create opportunity.",
  },
  {
    icon: BriefcaseBusiness,
    name: "Carlota Jo",
    body: "A premium services and advisory lane that can create near-term revenue and high-trust relationships.",
  },
];

export default function InvestorStoryPage() {
  const __pageMeta = usePageMeta({
    title: "Investor Story — SZL Holdings",
    description:
      "The focused capital narrative for SZL Holdings: KORA as the product, Counsel as the engine, and the rest of the ecosystem as expansion value.",
    canonical: "https://szlholdings.com/investor-story",
  });

  const [verifiedScores, setVerifiedScores] = useState<VerifiedScore[]>([...STATIC_VERIFIED_SCORES]);

  const fetchVerifiedScores = useCallback(async () => {
    try {
      const res = await fetch(EVAL_API_BASE, {
        credentials: 'include',
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return;
      const json = await res.json();
      const apiBenchmarks: Array<{
        benchmarkId: string;
        name: string;
        tasks?: Array<{ taskId: string; higherIsBetter: boolean }>;
      }> = json?.benchmarks ?? [];
      if (!apiBenchmarks.length) return;
      const liveScores: VerifiedScore[] = [];
      for (const bm of apiBenchmarks.slice(0, 3)) {
        const taskId = bm.tasks?.[0]?.taskId;
        if (!taskId) continue;
        const lb = await fetch(
          `${EVAL_API_BASE}/${bm.benchmarkId}/leaderboard?task_id=${taskId}&limit=1`,
          { credentials: 'include', signal: AbortSignal.timeout(5000) },
        ).catch(() => null);
        if (!lb?.ok) continue;
        const lbJson = await lb.json();
        const top = lbJson?.entries?.[0];
        if (!top) continue;
        const scoreStr = top.numericValue
          ? `${top.numericValue}${top.unit ?? ''}`
          : String(Math.round((top.value ?? 0) * 100) / 100);
        liveScores.push({
          entity: top.entityLabel ?? top.entityId ?? bm.name,
          label: bm.name,
          score: scoreStr,
          unit: top.unit ?? '',
          note: '',
          sourceUrl: top.sourceUrl
            ? top.sourceUrl
            : `${EVAL_TRACE_BASE}/${(top.entityId ?? 'entity').replace(/[^a-z0-9-]/gi, '-')}-${top.evalDate ?? 'latest'}.yaml`,
          badgeState: (top.badgeState as BadgeState) ?? 'community',
        });
      }
      if (liveScores.length > 0) setVerifiedScores(liveScores);
    } catch {
      // silently keep static seeds
    }
  }, []);

  useEffect(() => { fetchVerifiedScores(); }, [fetchVerifiedScores]);

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#070a10] text-white">
        <SiteNav />
        <main>
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#4a90b8]/30 bg-[#4a90b8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4a90b8]">
                <Layers3 className="h-3.5 w-3.5" />
                Investor narrative
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                A focused company now.
                <br />
                A broader platform later.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
                SZL Holdings should be financed as a governed decision infrastructure company with a
                clear domain-pack expansion logic. KORA is the command surface. Counsel is the governance
                execution fabric. The 9-step loop is the architecture. Domain packs are the expansion
                model — not the pitch.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/investor-relations"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Open investor relations
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                >
                  Request materials
                </Link>
              </div>
            </div>
          </section>
  
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Why this works</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Investors and lenders need a crisp answer to what this company is.
                </h2>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {problemFrames.map((frame) => (
                  <div key={frame} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/78">
                    {frame}
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-[#d4a054]/25 bg-[#d4a054]/10 p-6">
                  <div className="mb-4 inline-flex rounded-xl border border-[#d4a054]/20 bg-black/20 p-3">
                    <Radar className="h-5 w-5 text-[#d4a054]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">KORA</h3>
                  <p className="mt-3 text-sm leading-7 text-white/78">
                    The governed command surface — surfaces execution risk, approval latency, ownership gaps, and next-best action across the 9-step decision loop in one place.
                  </p>
                </div>
                <div className="rounded-3xl border border-[#4a90b8]/25 bg-[#4a90b8]/10 p-6">
                  <div className="mb-4 inline-flex rounded-xl border border-[#4a90b8]/20 bg-black/20 p-3">
                    <Workflow className="h-5 w-5 text-[#4a90b8]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Counsel</h3>
                  <p className="mt-3 text-sm leading-7 text-white/78">
                    Execution fabric for signal normalization, workflow orchestration, routing, and
                    auditability. It is the system layer that makes the product durable.
                  </p>
                </div>
              </div>
            </div>
          </section>
  
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Defensibility</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Four reasons the story improves when it gets narrower.
                </h2>
              </div>
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {differentiators.map((item) => (
                  <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/72">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Sequence</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Fund what is most legible first.
                </h2>
              </div>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {nowThen.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#4a90b8]">{item.label}</p>
                    <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/72">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Expansion value</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  The platform map still matters.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  The other lanes stay visible, but they no longer compete with the main story. They
                  serve as proof that the architecture can travel.
                </p>
              </div>
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {expansionLanes.map((lane) => {
                  const Icon = lane.icon;
                  return (
                    <div key={lane.name} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                      <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-black/20 p-3">
                        <Icon className="h-5 w-5 text-white/80" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{lane.name}</h3>
                      <p className="mt-3 text-sm leading-7 text-white/72">{lane.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
  
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="flex items-start gap-3 mb-8">
                <Trophy className="h-5 w-5 shrink-0 mt-0.5 text-[#d4a054]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">Open Evaluation</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                    Performance is public.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                    Every benchmark score across the SZL platform is independently verified and
                    publicly accessible. No black-box claims — every number links to a traceable
                    evaluation run. This is the standard we hold ourselves to.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {verifiedScores.map((item) => (
                  <a
                    key={item.entity}
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.055] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-widest text-[#d4a054]/70">{item.entity}</span>
                      {item.badgeState === 'verified' ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Verified</span>
                      ) : item.badgeState === 'community' ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">Community</span>
                      ) : item.badgeState === 'leaderboard' ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400">Leaderboard</span>
                      ) : item.badgeState ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-500/30 bg-slate-500/10 text-slate-400">{item.badgeState}</span>
                      ) : null}
                    </div>
                    <div className="text-2xl font-semibold text-white tabular-nums mb-1">{item.score}</div>
                    <div className="text-xs text-white/50">{item.label}</div>
                    {item.note && <div className="text-[11px] text-white/35 mt-1">{item.note}</div>}
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-white/25">
                      <ExternalLink className="h-2.5 w-2.5" />
                      View trace
                    </div>
                  </a>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2">
                <Link href="/carlota-jo/open-evaluation">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#4a90b8] hover:opacity-75 transition-opacity">
                    Browse all public benchmarks
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            </div>
          </section>

          <section>
            <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
              <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-8 lg:p-10">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Bottom line</p>
                <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white">
                  Keep the ambition. Tighten the narrative.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                  The right story is not that SZL is already several companies at once. It is that SZL
                  has already built a broader system, and is now commercializing the clearest wedge
                  first.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Lead with KORA + Counsel in every investor and lender conversation.",
                    "Describe SEXTANT, PARAGON, DOMAINE, and Carlota Jo as expansion lanes and option value.",
                    "Make proof, pilot readiness, and buyer clarity the standard for what becomes a first-class surface.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-white/80">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a054]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
