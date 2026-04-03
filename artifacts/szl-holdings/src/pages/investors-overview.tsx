import { Link } from "wouter";
import { Building2, ArrowRight, Layers, Shield, Target, Globe, TrendingUp, Users } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const packs = [
  { name: "Lyte", role: "Business observability — surfaces signals, routes action, verifies follow-through", color: "#4a90b8", href: "/lyte" },
  { name: "Alloy", role: "Execution fabric — workflow orchestration, connector mesh, governance layer", color: "#8b7ac8", href: "/alloy-fabric" },
  { name: "PRISM Counsel", role: "Legal matter observability — deadlines, pressure, proof chain, export safety", color: "#d4a054", href: "/solutions/prism-counsel" },
  { name: "Terra", role: "Real estate intelligence — property twins, diligence, distress, readiness scoring", color: "#c8953c", href: "/solutions/terra" },
  { name: "Vessels", role: "Maritime intelligence — voyage twins, route risk, port congestion, compliance", color: "#4a90b8", href: "/solutions/vessels" },
  { name: "Aegis", role: "Security & defense — threat twins, exposure prioritization, governance response", color: "#c45a4a", href: "/solutions/aegis" },
];

export default function InvestorsOverviewPage() {
  usePageMeta({
    title: "Investor Overview — SZL Holdings",
    description: "SZL Holdings company overview for investors and capital partners.",
    canonical: "https://szlholdings.com/investors/overview",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
              <Building2 className="h-3.5 w-3.5" />
              Investor Overview
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              One architecture. Six verticals. Operational proof first.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              SZL Holdings is building the business observability category — software that connects
              signal detection, action routing, and outcome verification into a single accountable
              workflow. Lyte is the product. Alloy is the engine. Vertical packs extend the same
              architecture into specific operating domains.
            </p>
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

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">The thesis</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <Target className="h-5 w-5 text-[#d4a054]" />
                <h3 className="mt-4 text-base font-semibold text-white">Category creation</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Business observability is an emerging category. Dashboards show what happened.
                  Observability shows what needs to happen next — and verifies that it did.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <Layers className="h-5 w-5 text-[#8b7ac8]" />
                <h3 className="mt-4 text-base font-semibold text-white">Shared architecture</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Every vertical pack shares the same Alloy execution fabric, Model Mesh, GraphQL
                  control plane, and audit infrastructure. Build once, deploy into any operating domain.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <Shield className="h-5 w-5 text-[#4a90b8]" />
                <h3 className="mt-4 text-base font-semibold text-white">Trust as moat</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Trust is not a feature — it is the product boundary. Source grounding, approval
                  governance, proof chains, and export safety create defensible differentiation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Portfolio map</h2>
            <p className="mt-2 text-sm text-white/56">Six products, one shared execution fabric, one governance model.</p>
            <div className="mt-8 space-y-3">
              {packs.map((p) => (
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

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Stage and status</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-white">Current stage</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Design-partner stage. Working directly with early teams to prove the workflow
                  instrumentation thesis in real operating environments before scaling.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-white">GTM approach</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Founder-led sales into one vertical (legal operations via PRISM Counsel), then
                  expand horizontally through the shared architecture into adjacent verticals.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Explore further</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Architecture", href: "/investors/architecture", icon: Layers },
                { label: "Moat & Defensibility", href: "/investors/moat", icon: Shield },
                { label: "Trust Center", href: "/trust", icon: Shield },
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
  );
}
