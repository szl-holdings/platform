import { useState } from "react";
import { Link } from "wouter";
import { m } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  X,
  Minus,
  Layers,
  Building2,
  Shield,
  Scale,
  TrendingUp,
  Network,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const COMPETITORS = [
  {
    name: "Palantir",
    category: "Defense/Analytics",
    color: "hsl(222,60%,62%)",
    description: "Data analytics for defense and government. Broad platform, extremely high implementation cost.",
  },
  {
    name: "CoStar",
    category: "Real Estate Data",
    color: "hsl(38,72%,58%)",
    description: "Commercial real estate data and analytics. Deep in one vertical, no cross-domain intelligence.",
  },
  {
    name: "CrowdStrike",
    category: "Cybersecurity",
    color: "hsl(0,72%,58%)",
    description: "Cloud-native endpoint security. Best-in-class detection, single-domain focus.",
  },
  {
    name: "Clio",
    category: "Legal Practice",
    color: "hsl(280,50%,65%)",
    description: "Legal practice management for law firms. Workflow and billing — no intelligence layer.",
  },
];

const CAPABILITY_ROWS = [
  {
    capability: "Cross-domain intelligence mesh",
    icon: Network,
    szl: "full",
    palantir: "partial",
    costar: "none",
    crowdstrike: "none",
    clio: "none",
    note: "Intelligence compounds across 6 domains simultaneously",
  },
  {
    capability: "Explainable AI with source attribution",
    icon: CheckCircle2,
    szl: "full",
    palantir: "partial",
    costar: "none",
    crowdstrike: "partial",
    clio: "none",
    note: "Every inference linked to its source — no opaque model outputs",
  },
  {
    capability: "Governed action routing",
    icon: Shield,
    szl: "full",
    palantir: "partial",
    costar: "none",
    crowdstrike: "none",
    clio: "partial",
    note: "Signal → action with human-in-the-loop controls at every step",
  },
  {
    capability: "Immutable audit trail",
    icon: CheckCircle2,
    szl: "full",
    palantir: "partial",
    costar: "none",
    crowdstrike: "partial",
    clio: "partial",
    note: "Proof chain records every action, decision, and inference",
  },
  {
    capability: "Shared infrastructure across verticals",
    icon: Layers,
    szl: "full",
    palantir: "none",
    costar: "none",
    crowdstrike: "none",
    clio: "none",
    note: "One platform spine — each vertical inherits the full stack",
  },
  {
    capability: "Domain-specific behavioral AI",
    icon: TrendingUp,
    szl: "full",
    palantir: "partial",
    costar: "partial",
    crowdstrike: "full",
    clio: "none",
    note: "Models trained on domain-specific signals — not generic benchmarks",
  },
  {
    capability: "Pre-commercial / design-partner pricing",
    icon: CheckCircle2,
    szl: "full",
    palantir: "none",
    costar: "none",
    crowdstrike: "none",
    clio: "none",
    note: "Entry-level pricing for early design partners building proof",
  },
  {
    capability: "Real estate distress intelligence",
    icon: Building2,
    szl: "full",
    palantir: "none",
    costar: "partial",
    crowdstrike: "none",
    clio: "none",
    note: "19-day lead time before public filing — unique to Terra",
  },
  {
    capability: "Maritime behavioral anomaly detection",
    icon: CheckCircle2,
    szl: "full",
    palantir: "partial",
    costar: "none",
    crowdstrike: "none",
    clio: "none",
    note: "Pre-designation intelligence flagging 34 days ahead",
  },
  {
    capability: "Continuous adversarial simulation",
    icon: Shield,
    szl: "full",
    palantir: "none",
    costar: "none",
    crowdstrike: "partial",
    clio: "none",
    note: "847 attack paths tested per cycle — not annual pen tests",
  },
];

type StatusValue = "full" | "partial" | "none";

function StatusCell({ value }: { value: StatusValue }) {
  if (value === "full")
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <CheckCircle2 size={16} style={{ color: "hsl(145,60%,52%)" }} />
      </div>
    );
  if (value === "partial")
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Minus size={16} style={{ color: "hsl(38,72%,58%)" }} />
      </div>
    );
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <X size={14} style={{ color: "hsla(0,0%,100%,0.2)" }} />
    </div>
  );
}

const COMPOUND_ADVANTAGES = [
  {
    title: "Intelligence compounds across domains",
    body: "A Vessels anomaly enriches Aegis threat context. A Terra distress signal informs credit risk in Lyte. Point solutions cannot produce this — they're isolated by design.",
    color: "hsl(192,72%,48%)",
    icon: Network,
  },
  {
    title: "One infrastructure, 6× the ROI",
    body: "Every new domain costs a fraction of the first. Shared Model Mesh, Worldline, Proof Chain, and control plane are already built. Competitors must rebuild each element from scratch.",
    color: "hsl(38,72%,58%)",
    icon: Layers,
  },
  {
    title: "Moat deepens with every design partner",
    body: "Proprietary behavioral data from design partners feeds models that general competitors cannot replicate with off-the-shelf foundation models. The advantage compounds over time.",
    color: "hsl(142,52%,48%)",
    icon: TrendingUp,
  },
  {
    title: "Governance is the product boundary",
    body: "Trust and accountability are not features added at the end — they are the product primitive. This creates an enterprise buyer profile that point solutions actively avoid.",
    color: "hsl(280,50%,65%)",
    icon: Scale,
  },
];

export default function InvestorsCompetitivePage() {
  usePageMeta({
    title: "Competitive Positioning — Investor Hub | SZL Holdings",
    description: "SZL Holdings vs. Palantir, CoStar, CrowdStrike, and Clio. The cross-domain compound advantage that point solutions cannot replicate.",
    canonical: "https://szlholdings.com/investors/competitive",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/25 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054] mb-6">
                <Network className="h-3.5 w-3.5" />
                Competitive Positioning
              </div>
              <h1 className="mt-2 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                The compound advantage<br />that can't be replicated.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
                Palantir owns defense analytics. CoStar owns real estate data. CrowdStrike owns endpoints. SZL Holdings owns the cross-domain intelligence layer that compounds across all of them — and that no single vertical player can build without rebuilding from scratch.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/investors" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                  Investor Hub
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/investors/data-room" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/[0.04]">
                  Request data room
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40 mb-3">Point solutions we compete alongside</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {COMPETITORS.map((c) => (
                <m.div
                  key={c.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: c.color }}>{c.category}</p>
                  <p className="text-base font-semibold text-white mb-2">{c.name}</p>
                  <p className="text-xs leading-5 text-white/45">{c.description}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40 mb-3">Capability matrix</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white mb-8">SZL vs. the field</h2>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "0.75rem 1rem", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsla(0,0%,100%,0.35)", fontFamily: "var(--font-mono)", borderBottom: "1px solid hsla(0,0%,100%,0.08)" }}>Capability</th>
                    <th style={{ textAlign: "center", padding: "0.75rem 1rem", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)", borderBottom: "1px solid hsla(0,0%,100%,0.08)" }}>SZL</th>
                    {COMPETITORS.map((c) => (
                      <th key={c.name} style={{ textAlign: "center", padding: "0.75rem 1rem", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsla(0,0%,100%,0.35)", fontFamily: "var(--font-mono)", borderBottom: "1px solid hsla(0,0%,100%,0.08)" }}>{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CAPABILITY_ROWS.map((row, i) => {
                    const values: Record<string, StatusValue> = {
                      szl: row.szl as StatusValue,
                      palantir: row.palantir as StatusValue,
                      costar: row.costar as StatusValue,
                      crowdstrike: row.crowdstrike as StatusValue,
                      clio: row.clio as StatusValue,
                    };
                    return (
                      <tr key={row.capability} style={{ borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(38,8%,88%)", marginBottom: "0.125rem" }}>{row.capability}</p>
                          <p style={{ fontSize: "0.6875rem", color: "hsla(0,0%,100%,0.35)", lineHeight: 1.4 }}>{row.note}</p>
                        </td>
                        <td style={{ padding: "0.875rem 1rem", background: "hsla(192,72%,48%,0.04)" }}>
                          <StatusCell value={values.szl} />
                        </td>
                        <td style={{ padding: "0.875rem 1rem" }}><StatusCell value={values.palantir} /></td>
                        <td style={{ padding: "0.875rem 1rem" }}><StatusCell value={values.costar} /></td>
                        <td style={{ padding: "0.875rem 1rem" }}><StatusCell value={values.crowdstrike} /></td>
                        <td style={{ padding: "0.875rem 1rem" }}><StatusCell value={values.clio} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "1.25rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {[
                { label: "Full capability", color: "hsl(145,60%,52%)", icon: CheckCircle2 },
                { label: "Partial capability", color: "hsl(38,72%,58%)", icon: Minus },
                { label: "Not available", color: "hsla(0,0%,100%,0.2)", icon: X },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Icon size={14} style={{ color: item.color }} />
                    <span style={{ fontSize: "0.75rem", color: "hsla(0,0%,100%,0.4)" }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40 mb-3">The compound advantage</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white mb-8">Why the moat deepens over time.</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {COMPOUND_ADVANTAGES.map((adv, i) => {
                const Icon = adv.icon;
                return (
                  <m.div
                    key={adv.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                  >
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20" style={{ color: adv.color }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-2">{adv.title}</h3>
                    <p className="text-xs leading-5 text-white/50">{adv.body}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <div style={{
              borderRadius: "1.25rem",
              background: "hsla(192,72%,48%,0.04)",
              border: "1px solid hsla(192,72%,48%,0.2)",
              padding: "2rem 2.5rem",
            }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                The key insight
              </p>
              <p style={{ fontSize: "clamp(1.1rem,2vw,1.5rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.35, color: "hsl(38,8%,94%)", maxWidth: "48ch", marginBottom: "1.25rem" }}>
                Point solutions optimize inside a domain. SZL compounds intelligence across domains — creating a value surface that grows with each new vertical.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsla(0,0%,100%,0.55)", maxWidth: "52ch", marginBottom: "1.75rem" }}>
                A maritime anomaly that informs a credit risk flag in Lyte. A threat detection pattern in Aegis that surfaces a corresponding supply chain exposure in Terra. This is not a feature — it is a structural advantage that competitors cannot purchase or copy.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link
                  href="/investors/architecture"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "hsl(192,72%,48%)", color: "hsl(214,18%,4%)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 700, textDecoration: "none" }}
                >
                  See the architecture <ArrowRight size={14} />
                </Link>
                <Link
                  href="/investors/moat"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "transparent", color: "hsla(0,0%,100%,0.6)", border: "1px solid hsla(0,0%,100%,0.15)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}
                >
                  Read the moat analysis
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
