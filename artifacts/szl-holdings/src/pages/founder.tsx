import { useEffect } from "react";
import { m } from "framer-motion";
import { Download, ArrowRight, Building2, Ship, Shield, Zap, BarChart3, Palette } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeader } from "@/components/SectionHeader";
import { CaseStudyBlock } from "@/components/CaseStudyBlock";
import { TimelineBlock } from "@/components/TimelineBlock";
import { analytics, initScrollDepthTracking } from "@/lib/analytics";

const PHILOSOPHY_ITEMS = [
  {
    title: "Systems, not features",
    body: "Features are easy to copy. Systems — the interconnected logic of how an organization actually works — are not. Every platform Stephen builds is designed around the operational system, not the feature request.",
  },
  {
    title: "Observability before optimization",
    body: "You can't improve what you can't see. The first step in every engagement is instrumenting the reality of how the system behaves — not how leadership assumes it behaves.",
  },
  {
    title: "Ship to learn",
    body: "Production is the only true test environment. Release early, measure relentlessly, and let real operational context drive the next iteration.",
  },
  {
    title: "Operators, not consultants",
    body: "SZL Holdings doesn't drop recommendations. It builds systems, operates them, and owns the outcomes. Skin in the game is a design constraint, not a philosophy.",
  },
];

const CAPABILITIES = [
  "Business observability systems architecture",
  "AI/ML platform design and deployment",
  "Maritime intelligence and risk frameworks",
  "Cybersecurity simulation and red team programs",
  "Enterprise digital transformation leadership",
  "Venture portfolio operations",
  "Executive team building and leadership development",
  "Real estate technology and investment analytics",
];

const FOUNDER_TIMELINE = [
  {
    date: "2021",
    event: "Founded SZL Holdings",
    outcome: "Operating thesis: vertical AI integration across critical infrastructure",
  },
  {
    date: "2022",
    event: "First two ventures operational — Vessels and Evolve MSP",
    outcome: "Maritime intelligence and managed services platforms live",
  },
  {
    date: "2023",
    event: "Firestorm and INCA enter private alpha",
    outcome: "Cybersecurity and AI research command center development",
  },
  {
    date: "2024",
    event: "Portfolio crosses $20M combined ARR milestone",
    outcome: "142% YoY aggregate revenue growth",
  },
  {
    date: "2025",
    event: "$14M Series A for INCA AI Research",
    outcome: "Three Fortune 500 clients for Firestorm Security",
  },
  {
    date: "2026",
    event: "Eight-venture ecosystem live",
    outcome: "Full intelligence fabric operational across all platforms",
  },
];

const CASE_STUDIES = [
  {
    title: "Turning Signal Noise into Executive Clarity",
    problem: "A logistics company with 240+ operational signals had no consistent way to know what mattered — or when.",
    solution: "Built a severity-ranked observability layer that compressed 240 signals into a prioritized queue with explainable root cause context.",
    result: "Executive team went from daily data review meetings to weekly exception-only reviews. Ops issues caught 8 days faster on average.",
  },
  {
    title: "Maritime Intelligence Pre-Designation Detection",
    problem: "A commodity trader needed to stay ahead of sanctions risk before regulatory announcements — not after.",
    solution: "Implemented behavioral fingerprinting across 52K vessels to detect AIS anomalies and pattern laundering 30+ days before formal designation.",
    result: "Client avoided $12M in exposure on two contracts. Became the foundation for the Vessels platform.",
  },
  {
    title: "Security Posture Transformation for Fortune 500 CISO",
    problem: "A CISO needed board-level visibility into security posture improvement — not CVE counts.",
    solution: "Replaced annual penetration testing with continuous adversarial simulation, delivering quarterly posture scores with full executive context.",
    result: "Security score improved 26 points over 6 months. Board approved expanded security infrastructure investment.",
  },
];

export default function FounderPage() {
  useEffect(() => {
    document.title = "Founder — Stephen Lutar · SZL Holdings";
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
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-4">Founder</p>
                <h1 className="font-[var(--font-display)] text-4xl sm:text-5xl font-extrabold text-szl-text leading-tight mb-5">
                  Stephen Lutar
                </h1>
                <p className="text-szl-accent text-base font-semibold mb-6">
                  Founder & Managing Partner, SZL Holdings
                </p>
                <p className="text-szl-text-secondary text-base leading-relaxed mb-6">
                  Operator, builder, and systems thinker. Stephen founded SZL Holdings in 2021 with a specific conviction: that the most defensible enterprise software positions aren't won by building better features — they're won by understanding the operational reality of an industry deeply enough to build the systems it actually needs.
                </p>
                <p className="text-szl-text-secondary text-base leading-relaxed mb-8">
                  Eight ventures later, across maritime intelligence, AI infrastructure, cybersecurity, real estate tech, and creative production, that conviction has compounded into a portfolio generating 142% aggregate YoY revenue growth — with 91% talent retention across every platform.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => analytics.resumeDownloadClick()}
                    className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-szl-border text-szl-text-secondary text-sm font-semibold hover:text-szl-text hover:border-szl-border-hover hover:bg-szl-bg-secondary transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Resume
                  </button>
                  <Link
                    href="/contact?type=general"
                    className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-szl-primary text-white text-sm font-semibold hover:bg-szl-primary-light transition-colors shadow-sm"
                  >
                    Start a conversation
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { label: "Ventures Built", value: "8", note: "From zero to live" },
                  { label: "Capital Deployed", value: "$180M+", note: "Across the ecosystem" },
                  { label: "Combined TAM", value: "$2.4B+", note: "Across active ventures" },
                  { label: "Years Operating", value: "5+", note: "Enterprise systems" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-szl-border bg-szl-bg-secondary p-5 text-center">
                    <p className="font-[var(--font-display)] font-bold text-2xl text-szl-text mb-0.5">{stat.value}</p>
                    <p className="text-xs font-semibold text-szl-text-secondary">{stat.label}</p>
                    <p className="text-[10px] text-szl-text-muted mt-0.5">{stat.note}</p>
                  </div>
                ))}
              </m.div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-szl-bg-secondary border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeader
              eyebrow="Operating Philosophy"
              title="How Stephen builds."
            />
            <div className="grid sm:grid-cols-2 gap-4">
              {PHILOSOPHY_ITEMS.map((item, i) => (
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
              eyebrow="Case Studies"
              title="Selected operational outcomes."
              subtitle="Real problems, built solutions, measurable results."
            />
            <CaseStudyBlock studies={CASE_STUDIES} accentColor="#2563eb" />
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-szl-bg-secondary border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <SectionHeader
                  eyebrow="Capabilities"
                  title="What Stephen brings."
                />
                <div className="space-y-2">
                  {CAPABILITIES.map((cap, i) => (
                    <m.div
                      key={cap}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      className="flex items-center gap-3 py-2.5 border-b border-szl-border last:border-0"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-szl-accent shrink-0" />
                      <span className="text-sm text-szl-text-secondary">{cap}</span>
                    </m.div>
                  ))}
                </div>
              </div>

              <div>
                <SectionHeader
                  eyebrow="Timeline"
                  title="Building the ecosystem."
                />
                <TimelineBlock entries={FOUNDER_TIMELINE} accentColor="#2563eb" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-white border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeader
              eyebrow="Thought Leadership"
              title="Selected insights."
              subtitle="Writing on AI deployment, maritime intelligence, cybersecurity, and operating systems thinking."
            />
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  title: "State of the Ecosystem: 2026 Annual Letter",
                  date: "March 30, 2026",
                  category: "Annual Letter",
                  href: "/insights/state-of-the-ecosystem-2026",
                },
                {
                  title: "Dark Vessel Activity Is Up 340% — Here's What AI Can See",
                  date: "March 12, 2026",
                  category: "Maritime Intelligence",
                  href: "/insights/dark-vessel-activity-maritime-ai",
                },
                {
                  title: "Why Continuous Adversarial Simulation Is the New Baseline",
                  date: "February 28, 2026",
                  category: "Cybersecurity",
                  href: "/insights/continuous-red-team-the-new-baseline",
                },
              ].map((article, i) => (
                <m.div
                  key={article.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                >
                  <Link
                    href={article.href}
                    onClick={() => analytics.insightsArticleClick(article.href, article.title)}
                    className="group block rounded-2xl border border-szl-border bg-white p-6 hover:border-szl-border-hover hover:shadow-sm transition-all duration-200 h-full"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-szl-text-muted mb-3">{article.category}</p>
                    <h3 className="font-[var(--font-display)] text-sm font-bold text-szl-text mb-3 group-hover:text-szl-accent transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-szl-text-muted">{article.date}</p>
                  </Link>
                </m.div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/insights"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-szl-text-secondary hover:text-szl-accent transition-colors"
              >
                View all insights <ArrowRight className="w-4 h-4" />
              </Link>
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
              <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-3">Contact</p>
              <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-szl-text mb-4">
                Open to the right conversations.
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
                  href="/contact?type=client"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-szl-border text-szl-text-secondary text-sm font-semibold hover:text-szl-text hover:border-szl-border-hover hover:bg-white transition-all"
                >
                  Consulting Inquiries <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/contact?type=general"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-szl-primary text-white text-sm font-semibold hover:bg-szl-primary-light transition-colors shadow-sm"
                >
                  Strategic Discussions <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
