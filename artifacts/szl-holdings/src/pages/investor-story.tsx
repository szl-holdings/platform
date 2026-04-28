import { Link } from "wouter";
import {
  ArrowRight,
  Radar,
  Workflow,
  Layers3,
  Ship,
  ShieldCheck,
  Building2,
  BriefcaseBusiness,
  CheckCircle2,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

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
