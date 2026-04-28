import { Link } from "wouter";
import { ArrowRight, Radar, Workflow, Ship, ShieldCheck, Building2, BriefcaseBusiness } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const core = [
  {
    name: "KORA",
    type: "Decision Intelligence Platform",
    stage: "Core now",
    href: "/command/operations/",
    body: "The market-facing software wedge: execution visibility, risk surfacing, ownership clarity, and next action in one command surface.",
  },
  {
    name: "Counsel",
    type: "Execution Fabric",
    stage: "Core now",
    href: "/continuum/",
    body: "The shared engine beneath the product: signals, workflow orchestration, routing, audit trail, and governed action.",
  },
];

const lanes = [
  {
    icon: Ship,
    name: "SEXTANT",
    type: "Expansion lane",
    href: "/vessels/",
    body: "A future vertical application for maritime intelligence once the core narrative has earned the right to expand.",
  },
  {
    icon: ShieldCheck,
    name: "PARAGON",
    type: "Expansion lane",
    href: "/aegis/",
    body: "A command surface for security, incident, and managed operations environments where observability and execution discipline matter.",
  },
  {
    icon: Building2,
    name: "DOMAINE",
    type: "Expansion lane",
    href: "/terra/",
    body: "A real-estate intelligence lane for markets where ownership complexity, signal fragmentation, and process delay create opportunity.",
  },
  {
    icon: BriefcaseBusiness,
    name: "Carlota Jo",
    type: "Services lane",
    href: "/carlota-jo/",
    body: "A premium advisory and service brand that can produce near-term revenue and high-trust relationships around the platform.",
  },
];

export default function VenturesPage() {
  const __pageMeta = usePageMeta({
    title: "Platform Map \u2014 SZL Holdings",
    description:
      "The focused platform map for SZL Holdings: KORA and Counsel as the commercial wedge, with additional lanes staged as expansion value.",
    canonical: "https://szlholdings.com/ventures",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#070a10] text-white">
        <SiteNav />
        <main>
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Platform map</p>
              <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white md:text-6xl">
                One core wedge.
                <br />
                Multiple future lanes.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
                The company should not be presented as several equal go-to-market motions at once.
                KORA + Counsel is the commercial center. The rest of the ecosystem remains visible as
                staged expansion value built on the same operating spine.
              </p>
            </div>
          </section>
  
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/25 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
                <Radar className="h-3.5 w-3.5" />
                Commercial focus
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {core.map((item) => {
                  const Icon = item.name === "KORA" ? Radar : Workflow;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-black/20 p-3">
                        <Icon className="h-5 w-5 text-white/80" />
                      </div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-white">{item.name}</h2>
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                          {item.stage}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/55">{item.type}</p>
                      <p className="mt-4 text-sm leading-7 text-white/72">{item.body}</p>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
  
          <section>
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Expansion value</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Lanes that stay visible without diluting the main story
                </h2>
              </div>
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {lanes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-black/20 p-3">
                        <Icon className="h-5 w-5 text-white/80" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                      <p className="mt-1 text-sm text-white/55">{item.type}</p>
                      <p className="mt-4 text-sm leading-7 text-white/72">{item.body}</p>
                    </a>
                  );
                })}
              </div>
  
              <div className="mt-12 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-8">
                <h3 className="text-2xl font-semibold tracking-tight text-white">
                  The discipline is sequencing.
                </h3>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">
                  Expansion only helps if it reads as earned. Keep the broader map visible, but filter
                  what becomes first-class by proof, buyer clarity, and commercial traction.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/investor-story"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                  >
                    See the investor story
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                  >
                    Talk to us
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
