import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  Layers,
  Shield,
  Map,
  Lock,
  User,
  FileText,
  ChevronRight,
  BarChart3,
  Clock,
  CheckCircle2,
  RefreshCw,
  Mail,
} from "lucide-react";
import { m } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { InlineSegmentedCTA } from "@/components/SegmentedCTA";

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function InlineRoiWidget() {
  const [portfolioSize, setPortfolioSize] = useState(500);
  const [assetCount, setAssetCount] = useState(120);
  const [currentSpendK, setCurrentSpendK] = useState(800);

  const roi = useMemo(() => {
    const savings = currentSpendK * 1000 * 0.42;
    const visibilityMultiplier = Math.min(3.2, 1 + (assetCount / 60));
    const insightDays = Math.max(1, Math.round(14 - (portfolioSize / 100)));
    const szlCost = 80_000 + (assetCount * 200);
    const netSavings = savings - szlCost;
    const paybackMonths = netSavings > 0 ? Math.max(1, Math.round((szlCost / netSavings) * 12)) : null;
    return { savings, visibilityMultiplier, insightDays, paybackMonths };
  }, [portfolioSize, assetCount, currentSpendK]);

  const barMax = currentSpendK * 1000;
  const savedWidth = barMax > 0 ? Math.min(100, (roi.savings / barMax) * 100) : 0;

  const sliderStyle: React.CSSProperties = { width: "100%", accentColor: "hsl(38,90%,52%)", height: "4px" };

  return (
    <div style={{ display: "grid", gap: "1.5rem" }} className="md:grid-cols-2">
      <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "0.875rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>Your portfolio</span>
          <button onClick={() => { setPortfolioSize(500); setAssetCount(120); setCurrentSpendK(800); }} style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "transparent", border: "none", color: "hsla(0,0%,100%,0.35)", fontSize: "0.75rem", cursor: "pointer" }}>
            <RefreshCw size={10} /> Reset
          </button>
        </div>
        {[
          { label: "Portfolio size ($M AUM)", value: portfolioSize, min: 50, max: 5000, step: 50, onChange: setPortfolioSize, format: (v: number) => `$${v}M` },
          { label: "Number of assets monitored", value: assetCount, min: 10, max: 1000, step: 10, onChange: setAssetCount, format: (v: number) => `${v} assets` },
          { label: "Current annual tool spend", value: currentSpendK, min: 100, max: 5000, step: 50, onChange: setCurrentSpendK, format: (v: number) => `$${v}K` },
        ].map((s) => (
          <div key={s.label} style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
              <label style={{ fontSize: "0.75rem", color: "hsla(0,0%,100%,0.5)" }}>{s.label}</label>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "hsl(38,90%,52%)" }}>{s.format(s.value)}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} onChange={(e) => s.onChange(Number(e.target.value))} style={sliderStyle} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <m.div
          key={roi.savings}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(38,90%,52%,0.25)", borderRadius: "0.875rem", padding: "1.5rem" }}
        >
          <p style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsla(0,0%,100%,0.35)", fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>Projected Annual Savings</p>
          <p style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "hsl(38,90%,52%)", letterSpacing: "-0.04em", lineHeight: 1 }}>{formatCurrency(roi.savings)}</p>
          <p style={{ fontSize: "0.75rem", color: "hsla(0,0%,100%,0.4)", marginTop: "0.375rem" }}>from tool consolidation and signal automation</p>
          <div style={{ marginTop: "1rem", height: "8px", borderRadius: "4px", background: "hsla(0,0%,100%,0.06)", overflow: "hidden" }}>
            <m.div
              initial={{ width: 0 }}
              animate={{ width: `${savedWidth}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg, hsl(38,90%,52%), hsl(145,60%,48%))" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.375rem" }}>
            <span style={{ fontSize: "0.625rem", color: "hsla(0,0%,100%,0.3)" }}>$0</span>
            <span style={{ fontSize: "0.625rem", color: "hsla(0,0%,100%,0.3)" }}>Current spend: ${currentSpendK}K</span>
          </div>
          {roi.paybackMonths && (
            <div style={{ marginTop: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", background: "hsla(145,60%,48%,0.1)", border: "1px solid hsla(145,60%,48%,0.25)" }}>
              <CheckCircle2 size={12} style={{ color: "hsl(145,60%,52%)" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(145,60%,52%)" }}>Est. payback: {roi.paybackMonths} months</span>
            </div>
          )}
        </m.div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.07)", borderRadius: "0.75rem", padding: "1.125rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
              <BarChart3 size={12} style={{ color: "hsl(140,50%,48%)" }} />
              <span style={{ fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsla(0,0%,100%,0.35)" }}>Visibility improvement</span>
            </div>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(140,50%,48%)", letterSpacing: "-0.02em" }}>{roi.visibilityMultiplier.toFixed(1)}×</p>
          </div>
          <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.07)", borderRadius: "0.75rem", padding: "1.125rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
              <Clock size={12} style={{ color: "hsl(192,72%,48%)" }} />
              <span style={{ fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsla(0,0%,100%,0.35)" }}>Time-to-insight</span>
            </div>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(192,72%,48%)", letterSpacing: "-0.02em" }}>{roi.insightDays}d</p>
          </div>
        </div>
        <Link href="/roi" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", background: "hsl(38,90%,52%)", color: "hsl(214,18%,4%)", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 700, textDecoration: "none" }}>
          Full ROI Calculator <ArrowRight size={14} />
        </Link>
        <p style={{ fontSize: "0.6875rem", color: "hsla(0,0%,100%,0.25)", textAlign: "center", lineHeight: 1.45 }}>
          Based on PULSE EVALS benchmarks. Individual results vary.
        </p>
      </div>
    </div>
  );
}

function HubNewsletterCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "newsletter",
          name: email.split("@")[0],
          email,
          app: "szl-holdings",
          message: "Monthly Investor Update signup from investor hub",
          metadata: { source: "investor-hub-newsletter" },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{ padding: "1.5rem 2rem", borderRadius: "0.875rem", background: "hsla(38,72%,58%,0.04)", border: "1px solid hsla(38,72%,58%,0.15)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1.5rem" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Mail size={14} style={{ color: "hsl(38,72%,58%)" }} />
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,72%,58%)", fontFamily: "var(--font-mono)" }}>
            Monthly Investor Update
          </p>
        </div>
        <p style={{ fontSize: "0.875rem", color: "hsla(0,0%,100%,0.6)", lineHeight: 1.5 }}>
          Design-partner milestones, platform progress, and the honest view on where we stand.
        </p>
      </div>
      <div style={{ minWidth: "260px", flex: "1 1 260px", maxWidth: "380px" }}>
        {status === "success" ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "hsla(145,60%,46%,0.12)", border: "1px solid hsla(145,60%,46%,0.25)" }}>
            <CheckCircle2 size={14} style={{ color: "hsl(145,60%,72%)" }} />
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(145,60%,72%)" }}>You're on the investor update list.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" disabled={status === "submitting"} style={{ flex: 1, padding: "0.5rem 0.875rem", background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.12)", borderRadius: "0.375rem", color: "hsl(38,8%,92%)", fontSize: "0.8125rem", outline: "none" }} />
            <button type="submit" disabled={status === "submitting"} style={{ padding: "0.5rem 1rem", background: "hsl(38,72%,58%)", color: "hsl(214,18%,4%)", border: "none", borderRadius: "0.375rem", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              {status === "submitting" ? "…" : "Subscribe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const hubPages = [
  {
    href: "/investors/overview",
    icon: Building2,
    color: "#d4a054",
    label: "Overview",
    title: "Company & Category",
    description:
      "Why now, why this architecture, why these verticals, and why the demo matters more than the pitch.",
  },
  {
    href: "/investors/architecture",
    icon: Layers,
    color: "#8b7ac8",
    label: "Architecture",
    title: "Technical Defensibility",
    description:
      "The six-layer stack that every vertical inherits — and why rebuilding it from scratch is the wrong competitive strategy.",
  },
  {
    href: "/investors/moat",
    icon: Shield,
    color: "#4a90b8",
    label: "Moat",
    title: "Why It's Hard to Copy",
    description:
      "Shared spine, pack twins, worldline, proof chain, Model Mesh, GraphQL control plane, Microsoft-native distribution.",
  },
  {
    href: "/investors/roadmap",
    icon: Map,
    color: "#6aaa72",
    label: "Roadmap",
    title: "Phased Rollout",
    description:
      "Flagship pack → expansion lanes → portfolio maturity. Design-partner milestones. Operational proof checkpoints.",
  },
  {
    href: "/investors/trust",
    icon: Lock,
    color: "#c8953c",
    label: "Trust",
    title: "Governance & Enterprise Readiness",
    description:
      "How the governance model connects to enterprise buyer requirements — and why trust is the product boundary, not a feature.",
  },
  {
    href: "/investors/data-room",
    icon: FileText,
    color: "#5a9a8a",
    label: "Data Room",
    title: "Request Access",
    description:
      "Structured materials for qualified investors. Company overview, product architecture, commercial strategy, and operating plan.",
  },
  {
    href: "/investors/founder",
    icon: User,
    color: "#a07a5a",
    label: "Founder",
    title: "Stephen Lutar",
    description:
      "Builder, operator, systems thinker. Why the founder matters for a company at this stage — and what the operating thesis is.",
  },
];

const fundamentals = [
  {
    label: "Stage",
    value: "Design-partner / pre-commercial",
    note: "Working directly with early teams before scaling",
  },
  {
    label: "Category",
    value: "Business observability",
    note: "Signal detection → action routing → outcome verification",
  },
  {
    label: "Architecture",
    value: "Shared spine, vertical packs",
    note: "One platform, multiple domain-specific products",
  },
  {
    label: "Wedge",
    value: "Lyte + Alloy → PRISM Counsel",
    note: "Legal operations is the first commercial vertical",
  },
  {
    label: "Expansion logic",
    value: "Vessels, Aegis, Terra",
    note: "Same architecture, new operating domains",
  },
  {
    label: "Edge",
    value: "Demo > pitch > architecture > GitHub",
    note: "Live product is the primary proof vehicle",
  },
];

export default function InvestorsHubPage() {
  usePageMeta({
    title: "Investor Hub — SZL Holdings",
    description:
      "The full investor surface for SZL Holdings — overview, architecture, moat, roadmap, trust, data room, and founder.",
    canonical: "https://szlholdings.com/investors",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/25 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
              <Building2 className="h-3.5 w-3.5" />
              Investor Relations
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              SZL Holdings.
              <br />
              Investor Hub.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
              Business observability infrastructure for organizations that need to see execution risk,
              workflow latency, and ownership gaps — and close them. One architecture. Multiple
              domain-specific packs. Operational proof first.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                See the live product
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/investors/data-room"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/[0.04]"
              >
                Request data room access
              </Link>
            </div>
          </div>
        </section>

        {/* Fundamentals */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Company fundamentals
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fundamentals.map((f) => (
                <div
                  key={f.label}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                    {f.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{f.value}</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">{f.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hub navigation */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Explore the investor surface
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {hubPages.map((page) => {
                const Icon = page.icon;
                return (
                  <Link key={page.href} href={page.href}>
                    <div className="group flex cursor-pointer items-start gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/10 hover:bg-white/[0.04]">
                      <div
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/25"
                        style={{ color: page.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-xs font-semibold uppercase tracking-[0.18em]"
                            style={{ color: page.color }}
                          >
                            {page.label}
                          </p>
                        </div>
                        <p className="mt-1 text-base font-semibold text-white">{page.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/55">{page.description}</p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/25 transition group-hover:text-white/45" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                Start the conversation
              </p>
              <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white">
                The clearest way to understand SZL is to see it running.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
                Every investor conversation starts with the live product, not a slide deck. If you
                want structured materials, request data room access and we will route the right
                package.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  See the live demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/[0.04]"
                >
                  Send a note
                </Link>
              </div>
            </div>
          </div>
        </section>
        {/* Trust Route cross-link */}
        <section style={{ borderTop: "1px solid hsla(0,0%,100%,0.07)", padding: "clamp(2.5rem,5vw,3.5rem) 0" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsla(0,0%,100%,0.3)", fontFamily: "var(--font-mono)", marginBottom: "0.375rem" }}>
                  Governance evidence
                </p>
                <p style={{ fontSize: "0.875rem", color: "hsla(0,0%,100%,0.5)", lineHeight: 1.55 }}>
                  Walk the full Trust Route — governance proof with receipts at every stage.
                </p>
              </div>
              <Link href="/trust-route" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "hsla(38,72%,58%,0.10)", border: "1px solid hsla(38,72%,58%,0.22)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,72%,58%)", textDecoration: "none" }}>
                Walk the Trust Route <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* ROI Calculator Widget */}
        <section style={{ borderTop: "1px solid hsla(0,0%,100%,0.07)" }}>
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsla(0,0%,100%,0.35)", fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>
              Investor ROI Calculator
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem" }}>
              <div>
                <h2 style={{ fontSize: "clamp(1.25rem,2vw,1.75rem)", fontWeight: 600, letterSpacing: "-0.02em", color: "hsl(38,8%,94%)", marginBottom: "0.5rem" }}>
                  What does platform consolidation save?
                </h2>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsla(0,0%,100%,0.5)", maxWidth: "40ch" }}>
                  Adjust portfolio size, asset count, and current tool spend — see projected savings, visibility improvement, and time-to-insight reduction.
                </p>
              </div>
              <Link href="/roi" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "hsla(38,90%,52%,0.12)", border: "1px solid hsla(38,90%,52%,0.3)", borderRadius: "0.375rem", color: "hsl(38,90%,52%)", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
                Full Calculator <ArrowRight size={13} />
              </Link>
            </div>
            <InlineRoiWidget />
          </div>
        </section>

        {/* Competitive Positioning teaser */}
        <section style={{ borderTop: "1px solid hsla(0,0%,100%,0.07)" }}>
          <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1.5rem 2rem", borderRadius: "0.875rem", background: "hsla(192,72%,48%,0.04)", border: "1px solid hsla(192,72%,48%,0.18)" }}>
              <div>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)", marginBottom: "0.375rem" }}>
                  Competitive positioning
                </p>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.25rem" }}>SZL vs. Palantir, CoStar, CrowdStrike, and Clio</p>
                <p style={{ fontSize: "0.8125rem", color: "hsla(0,0%,100%,0.5)", lineHeight: 1.5 }}>The cross-domain compound advantage that point solutions cannot replicate.</p>
              </div>
              <Link href="/investors/competitive" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "hsl(192,72%,48%)", color: "hsl(214,18%,4%)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                See the matrix <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* Investor Newsletter Capture */}
        <section style={{ borderTop: "1px solid hsla(0,0%,100%,0.07)" }}>
          <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
            <HubNewsletterCapture />
          </div>
        </section>

        {/* Demo mode promo */}
        <section style={{ borderTop: "1px solid hsla(0,0%,100%,0.07)" }}>
          <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsla(0,0%,100%,0.3)", fontFamily: "var(--font-mono)", marginBottom: "0.375rem" }}>
                  No login required
                </p>
                <p style={{ fontSize: "0.875rem", color: "hsla(0,0%,100%,0.5)", lineHeight: 1.55 }}>
                  Explore Vessels, Terra, and Aegis with realistic sample data — interactive demo mode.
                </p>
              </div>
              <Link href="/investors/demo" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.14)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 600, color: "hsla(0,0%,100%,0.7)", textDecoration: "none" }}>
                Explore Demo Mode <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* Non-investor cross-navigation */}
        <section style={{ borderTop: "1px solid hsla(0,0%,100%,0.05)", padding: "clamp(2rem,4vw,3rem) 0" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsla(0,0%,100%,0.22)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
              Not an investor?
            </p>
            <InlineSegmentedCTA visitorType="unknown" />
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
