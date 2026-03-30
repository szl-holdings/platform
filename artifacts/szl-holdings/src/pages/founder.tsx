import { useEffect } from "react";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeader } from "@/components/SectionHeader";
import { CaseStudyBlock } from "@/components/CaseStudyBlock";
import { analytics, initScrollDepthTracking } from "@/lib/analytics";

const OPERATING_THESIS = [
  {
    title: "Systems, not features",
    body: "Features are copied. Systems — the interconnected logic of how an organization actually works — are not. Every platform is designed around the operational system, not the feature request.",
  },
  {
    title: "Observability before optimization",
    body: "You cannot improve what you cannot see. The first step in every engagement is instrumenting the reality of how the system behaves — not how leadership assumes it behaves.",
  },
  {
    title: "Operators, not consultants",
    body: "SZL Holdings does not drop recommendations. It builds systems, operates them, and owns the outcomes. Skin in the game is a design constraint, not a philosophy.",
  },
  {
    title: "Ship to learn",
    body: "Production is the only true test environment. Release early, measure relentlessly, and let real operational context drive the next iteration.",
  },
];

const FOCUS_AREAS = [
  {
    title: "Business Observability",
    desc: "Designing systems that surface risk, latency, and workflow friction before they hit execution — not after.",
  },
  {
    title: "Maritime Intelligence",
    desc: "Multi-source signal fusion for fleet operations, sanctions compliance, and voyage economics at institutional scale.",
  },
  {
    title: "Operational Service Design",
    desc: "High-trust, high-discretion operational support for principals and organizations with complex environments.",
  },
  {
    title: "AI Infrastructure & Governance",
    desc: "Orchestration layers that make AI systems deployable, explainable, and auditable in regulated contexts.",
  },
  {
    title: "Venture Portfolio Operations",
    desc: "Building and operating multiple platforms under one holding structure with shared intelligence and shared standards.",
  },
  {
    title: "Enterprise Systems Architecture",
    desc: "Designing the operational backbone that enterprise organizations actually run on — not the surface layer they show.",
  },
];

const SELECTED_WORK = [
  {
    title: "Approval Latency Detection",
    problem: "A logistics operator had approval queues stalling at 48–72 hours — invisible to leadership.",
    solution: "Built a severity-ranked observability layer that compressed 240 operational signals into a prioritized queue with explainable root cause context.",
    result: "Approval cycle reduced from 48 hours to 11 hours. Revenue leakage recovered: $340K/quarter.",
  },
  {
    title: "Pre-Designation Dark Vessel Detection",
    problem: "A commodity trader needed to identify sanctions exposure before regulatory designation — not after.",
    solution: "Implemented behavioral fingerprinting across 52K vessels to detect AIS anomalies and pattern laundering 30+ days before formal designation.",
    result: "Client avoided $12M in exposure on two contracts. Became the foundation for the Vessels platform.",
  },
  {
    title: "Security Posture Transformation",
    problem: "A Fortune 500 CISO needed board-level visibility into security posture improvement — not CVE counts.",
    solution: "Replaced annual penetration testing with continuous adversarial simulation, delivering quarterly posture scores with full executive context.",
    result: "Security score improved 26 points over 6 months. Board approved expanded security infrastructure investment.",
  },
];

export default function FounderPage() {
  useEffect(() => {
    document.title = "Stephen Lutar — Founder · SZL Holdings";
    analytics.founderPageView();
    const cleanup = initScrollDepthTracking("founder");
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="pt-24">
        <section className="bg-white border-b border-szl-border py-20">
          <div className="max-w-6xl mx-auto px-6">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-4">Founder</p>
              <h1 className="font-[var(--font-display)] text-4xl sm:text-5xl font-extrabold text-szl-text leading-tight mb-4">
                Builder. Operator. Systems thinker.
              </h1>
              <p className="text-szl-accent text-base font-semibold mb-6">
                Stephen Lutar — Founder, SZL Holdings
              </p>
              <p className="text-szl-text-secondary text-base leading-relaxed mb-6 max-w-2xl">
                Stephen founded SZL Holdings with a specific conviction: the most defensible enterprise software positions are not won by building better features — they are won by understanding the operational reality of an industry deeply enough to build the systems it actually needs.
              </p>
              <p className="text-szl-text-secondary text-base leading-relaxed mb-8 max-w-2xl">
                Alloy, Lyte, Vessels, and Carlota Jo are the result. Each platform was designed around operational problems Stephen has personally encountered — not market research, not feature prioritization frameworks. Real problems, built into real systems, producing real outcomes.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contact?type=general"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-szl-primary text-white text-sm font-semibold hover:bg-szl-primary-light transition-colors shadow-sm"
                >
                  Start a Conversation
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/contact?type=recruiter"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-szl-border text-szl-text-secondary text-sm font-semibold hover:text-szl-text hover:border-szl-border-hover hover:bg-szl-bg-secondary transition-all"
                >
                  Roles & Engagements
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-szl-bg-secondary border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeader
              eyebrow="Operating Thesis"
              title="How Stephen builds."
            />
            <div className="grid sm:grid-cols-2 gap-4">
              {OPERATING_THESIS.map((item, i) => (
                <m.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="rounded-2xl border border-szl-border bg-white p-6"
                >
                  <h3 className="font-[var(--font-display)] text-base font-bold text-szl-text mb-2">{item.title}</h3>
                  <p className="text-sm text-szl-text-secondary leading-relaxed">{item.body}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-white border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeader
              eyebrow="Areas of Focus"
              title="The work that matters."
              subtitle="Six domains where Stephen has built systems, not just advised on them."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
              {FOCUS_AREAS.map((area, i) => (
                <m.div
                  key={area.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="rounded-2xl border border-szl-border bg-white p-5 hover:border-szl-border-hover hover:shadow-sm transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-szl-primary flex items-center justify-center mb-3">
                    <span className="text-white text-[10px] font-bold font-[var(--font-display)]">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="font-[var(--font-display)] text-sm font-bold text-szl-text mb-1.5">{area.title}</h3>
                  <p className="text-xs text-szl-text-secondary leading-relaxed">{area.desc}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-szl-bg-secondary border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeader
              eyebrow="Selected Work"
              title="Operational outcomes, not slides."
              subtitle="Real problems. Built solutions. Measurable results."
            />
            <CaseStudyBlock studies={SELECTED_WORK} accentColor="#2563eb" />
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-white border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeader
              eyebrow="Why This Work Matters"
              title="The ecosystem is the proof."
            />
            <div className="grid lg:grid-cols-2 gap-12 mt-10">
              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-szl-border bg-szl-bg-secondary p-8 sm:p-10"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-6">The thesis</p>
                <blockquote className="font-[var(--font-display)] text-lg sm:text-xl text-szl-text leading-relaxed mb-6">
                  "The next generation of enterprise software will not be built on better dashboards. It will be built on command systems — platforms that see what is happening, understand why it matters, and surface what to do next. That is not a design principle. It is an engineering constraint. And it is the only thing SZL builds."
                </blockquote>
                <p className="text-szl-text-secondary text-sm font-semibold">
                  — Stephen Lutar, Founder, SZL Holdings
                </p>
              </m.div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "5+", label: "Years Operating", note: "Across enterprise verticals" },
                  { value: "4", label: "Platforms Live", note: "Alloy · Lyte · Vessels · Carlota Jo" },
                  { value: "34 days", label: "Maritime Lead Time", note: "Before sanctions designation" },
                  { value: "100%", label: "Client Retention", note: "Carlota Jo pilot cohort" },
                ].map((stat) => (
                  <m.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="rounded-2xl border border-szl-border bg-white p-5 text-center"
                  >
                    <p className="font-[var(--font-display)] font-bold text-2xl text-szl-text mb-0.5">{stat.value}</p>
                    <p className="text-xs font-semibold text-szl-text-secondary">{stat.label}</p>
                    <p className="text-[10px] text-szl-text-muted mt-0.5">{stat.note}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-szl-bg-secondary border-b border-szl-border">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-3">Connect</p>
              <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-szl-text mb-4">
                The right conversation starts here.
              </h2>
              <p className="text-szl-text-secondary text-sm leading-relaxed mb-8 max-w-lg mx-auto">
                Strategic discussions, executive roles, advisory engagements, and consulting inquiries. Not every conversation leads somewhere — but the right ones do.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contact?type=recruiter"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-szl-border text-szl-text-secondary text-sm font-semibold hover:text-szl-text hover:border-szl-border-hover hover:bg-white transition-all"
                >
                  Roles & Engagements <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/contact?type=general"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-szl-primary text-white text-sm font-semibold hover:bg-szl-primary-light transition-colors shadow-sm"
                >
                  Start a Conversation <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </m.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
