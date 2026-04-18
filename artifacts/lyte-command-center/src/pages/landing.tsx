import { Link } from "wouter";
import { ArrowRight, GitBranch, Thermometer, Layers, Activity, LayoutDashboard, Shield, Brain, Zap, CheckCircle2, ChevronRight } from "lucide-react";
import {
  getProduct,
  getProductOneLiner,
  getProductTagline,
  registry,
} from "@szl-holdings/brand-registry";

const lyteProduct = getProduct("lyte");
const lyteTagline = getProductTagline("lyte");
const lyteOneLiner = getProductOneLiner("lyte");

const PAIN_POINTS = [
  { icon: GitBranch, label: "Work stalls because nobody knows who owns it", surface: "Ownership Drift" },
  { icon: Thermometer, label: "Teams hit capacity before leadership notices", surface: "Pressure Map" },
  { icon: Layers, label: "The same tasks keep escalating with no resolution", surface: "Action Debt Index" },
  { icon: Activity, label: "Post-mortems can't reconstruct what leadership actually knew", surface: "Decision Replay" },
];

const SURFACES = [
  {
    href: "/ownership-drift",
    title: "Ownership Drift",
    icon: GitBranch,
    tagline: "Find the work nobody owns",
    description: "Surfaces every piece of work where responsibility is unclear or contested — with a full evidence trail of who said what and when.",
  },
  {
    href: "/pressure-map",
    title: "Pressure Map",
    icon: Thermometer,
    tagline: "See where teams are breaking",
    description: "A live heatmap across every team, account, workflow, and program — showing open load, overdue items, blocked work, and escalation density.",
  },
  {
    href: "/action-debt",
    title: "Action Debt Index",
    icon: Layers,
    tagline: "Measure the cost of inaction",
    description: "A scored backlog of every overdue, blocked, looping, or repeatedly-escalated work item — with compounding risk as the score rises.",
  },
  {
    href: "/decision-replay",
    title: "Decision Replay",
    icon: Activity,
    tagline: "Reconstruct any decision",
    description: "Step-by-step reconstruction of who knew what, when — surfacing every signal, memo, and actor confirmation anchored to the Alloy ledger.",
  },
  {
    href: "/board",
    title: "Board View",
    icon: LayoutDashboard,
    tagline: "Evidence-backed executive narrative",
    description: "A board-ready summary of top risks, intervention priorities, and operational health — each recommendation carrying its full proof envelope.",
  },
];

const ROI_POINTS = [
  "Catch ownership gaps before they become revenue loss",
  "Reduce mean time to decision on critical cross-functional blockers",
  "Eliminate repeated escalation cycles with a compounding debt score",
  "Give the board a single, evidence-backed view of operational risk",
  "Every recommendation visibly carries its proof envelope",
];

export default function LandingPage() {
  const pilotEmail = `mailto:${registry.company.email}?subject=Lyte Pilot Programme`;
  const governanceLine = registry.boilerplate.governancePhilosophy;
  const footerTagline = registry.boilerplate.footerTagline;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-6 pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/4 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-xs font-mono text-amber-400/60">
              {lyteProduct?.name ?? "LYTE"} · {lyteTagline.toUpperCase()}
            </span>
            <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/8 text-emerald-400">LIVE</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold text-amber-50 leading-tight mb-6">
            See what your org can't.<br />
            <span className="text-amber-400">Act before damage occurs.</span>
          </h1>

          <p className="text-lg text-amber-100/60 max-w-2xl mb-8 leading-relaxed">
            {lyteOneLiner} Built on Alloy. Every recommendation carries its evidence chain.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/board"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-amber-950 font-semibold text-sm hover:bg-amber-400 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Open Board View
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/ownership-drift"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-amber-500/25 text-amber-300 text-sm hover:bg-amber-500/8 transition-colors"
            >
              Explore Surfaces
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Proof badge strip */}
          <div className="mt-8 flex flex-wrap gap-2">
            {["ALLOY-PROOF", "PRISM-OBSERVE", "LEDGER-ANCHORED", "SOC2-READY"].map(b => (
              <span key={b} className="proof-badge">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="px-6 py-12 border-t border-amber-500/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-mono text-amber-400/40 uppercase tracking-widest mb-6">The problems Lyte solves</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PAIN_POINTS.map(({ icon: Icon, label, surface }) => (
              <div key={surface} className="cockpit-panel p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-amber-500/8 border border-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-amber-100/70 mb-1">{label}</p>
                  <span className="text-[10px] font-mono text-amber-400/50">→ {surface}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Five surfaces */}
      <section className="px-6 py-12 border-t border-amber-500/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-mono text-amber-400/40 uppercase tracking-widest mb-2">Five cockpit-grade surfaces</p>
          <h2 className="text-2xl font-display font-semibold text-amber-50 mb-8">
            Each surface tells a story no dashboard can
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SURFACES.map(({ href, title, icon: Icon, tagline, description }) => (
              <Link key={href} href={href}>
                <div className="cockpit-panel p-5 hover:border-amber-500/25 hover:bg-amber-500/4 transition-all cursor-pointer group">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-100 group-hover:text-amber-300 transition-colors">{title}</p>
                      <p className="text-[10px] font-mono text-amber-400/50">{tagline}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400/30 group-hover:text-amber-400 ml-auto transition-colors mt-0.5" />
                  </div>
                  <p className="text-xs text-amber-100/50 leading-relaxed">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ROI framing */}
      <section className="px-6 py-12 border-t border-amber-500/10">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-mono text-amber-400/40 uppercase tracking-widest mb-4">Why Lyte wins</p>
              <h2 className="text-2xl font-display font-semibold text-amber-50 mb-4">
                Operational risk is invisible until it isn't.
              </h2>
              <p className="text-sm text-amber-100/55 leading-relaxed mb-6">
                Most enterprises discover ownership failures in the post-mortem. Lyte surfaces them while you can still act — 
                with evidence your board can trust and interventions your operators can execute.
              </p>
              <ul className="space-y-2.5">
                {ROI_POINTS.map(p => (
                  <li key={p} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-amber-100/60">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="cockpit-panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400/50">CURRENT RISK SNAPSHOT</span>
                <span className="proof-badge"><Shield className="w-2.5 h-2.5" />ALLOY-PROOF</span>
              </div>
              {[
                { label: "Ownership Drift Items", value: "6", delta: "+2", bad: true },
                { label: "Action Debt Score", value: "43", delta: "+11", bad: true },
                { label: "Critical Items", value: "4", delta: "Act today", bad: true },
                { label: "At-Risk ARR", value: "$600K", delta: "Meridian + Launch", bad: true },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between py-2 border-b border-amber-500/8 last:border-0">
                  <span className="text-xs text-amber-100/60">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-amber-300">{m.value}</span>
                    <span className="text-[10px] font-mono text-red-400/70">{m.delta}</span>
                  </div>
                </div>
              ))}
              <Link href="/board">
                <button className="w-full mt-2 py-2 rounded border border-amber-500/25 text-xs text-amber-300 hover:bg-amber-500/8 transition-colors flex items-center justify-center gap-1.5">
                  View Board Brief <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot CTA */}
      <section className="px-6 py-14 border-t border-amber-500/10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 mb-6">
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-mono text-amber-400/70">PILOT PROGRAMME — Q2 2026</span>
          </div>
          <h2 className="text-2xl font-display font-semibold text-amber-50 mb-4">
            Ready to see your operational blind spots?
          </h2>
          <p className="text-sm text-amber-100/55 mb-8 leading-relaxed">
            Lyte onboards in 2 weeks with no integration required beyond a read-only Alloy connector. 
            Pilot customers see their first Ownership Drift report within 48 hours of activation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={pilotEmail}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 text-amber-950 font-semibold text-sm hover:bg-amber-400 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Request a Pilot
            </a>
            <Link
              href="/board"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-amber-500/25 text-amber-300 text-sm hover:bg-amber-500/8 transition-colors"
            >
              Explore the Demo
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-amber-400/35">
            {registry.company.name} · {registry.company.email} · {footerTagline}
          </p>
          <p className="mt-1 text-[10px] text-amber-400/25 italic">{governanceLine}</p>
        </div>
      </section>
    </div>
  );
}
