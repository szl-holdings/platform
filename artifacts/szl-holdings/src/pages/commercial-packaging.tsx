import { useState } from "react";
import { m } from "framer-motion";
import {
  CheckCircle2, ArrowRight, Shield, Zap, BarChart3,
  GitBranch, Building2, Star, ChevronRight, Lock, Globe, Layers
} from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),
};

const RELIEF_TIERS = [
  {
    id: "clarity",
    name: "Clarity",
    tagline: "You stop flying blind.",
    price: "Contact us",
    priceNote: "Design partner pricing available",
    color: "hsl(192,72%,48%)",
    icon: BarChart3,
    reliefStatement: "Every approval queue, workflow bottleneck, and ownership gap becomes visible before it compounds into a crisis.",
    what: "Your ops surface — instrumented and legible.",
    apps: ["Lyte Command Center"],
    includes: [
      "PRISM signal ingestion on your live systems",
      "Approval latency tracking & owner attribution",
      "Workflow friction feed — stuck items ranked by risk",
      "Executive readout dashboard",
      "90-day baseline report",
    ],
    highlight: false,
  },
  {
    id: "triage",
    name: "Triage",
    tagline: "The right thing gets addressed first.",
    price: "Contact us",
    priceNote: "Bundled with Clarity",
    color: "hsl(38,90%,52%)",
    icon: Zap,
    reliefStatement: "Signals are ranked by severity and routed to the right owner with context. No more triage-by-Slack.",
    what: "Signal intelligence → ownership routing.",
    apps: ["Lyte", "Aegis", "Vessels"],
    includes: [
      "Everything in Clarity",
      "Cross-domain signal correlation (PRISM BUS)",
      "Automated owner routing (Alloy)",
      "Priority inbox per role",
      "Escalation path configuration",
      "COVENANT policy enforcement for routing rules",
    ],
    highlight: false,
  },
  {
    id: "readiness",
    name: "Readiness",
    tagline: "You know what's coming before it arrives.",
    price: "Contact us",
    priceNote: "Enterprise engagement",
    color: "hsl(142,52%,48%)",
    icon: Shield,
    reliefStatement: "Forecast models surface what's at risk, why it's at risk, and what happens if nothing changes — explained in plain language.",
    what: "Explainable operational forecasting.",
    apps: ["Lyte", "Terra", "Vessels", "Aegis"],
    includes: [
      "Everything in Triage",
      "PRISM risk scoring with source attribution",
      "Explainability panel on every signal",
      "Intervention workspace (what-if modeling)",
      "Readiness module (threshold tracking)",
      "PULSE EVALS integration for model quality",
    ],
    highlight: true,
  },
  {
    id: "governed_execution",
    name: "Governed Execution",
    tagline: "Action happens — accountably.",
    price: "Contact us",
    priceNote: "Platform tier",
    color: "hsl(280,52%,62%)",
    icon: GitBranch,
    reliefStatement: "Every consequential action is approved, traced, and linked to the signal that triggered it. Defensible at any audit.",
    what: "Human-in-the-loop action with full proof chain.",
    apps: ["Lyte", "Aegis", "Vessels", "Terra", "Holdings"],
    includes: [
      "Everything in Readiness",
      "FORGE RUNTIME governed workflow execution",
      "Approval gates on every consequential action",
      "RECEIPT GRAPH — immutable audit provenance",
      "OUTCOME GRAPH — memory persistence across sessions",
      "Cross-app handoff contracts (5 active flows)",
      "ATLAS artifact generation on demand",
    ],
    highlight: false,
  },
  {
    id: "white_glove",
    name: "White-Glove Orchestration",
    tagline: "Your ops team operates at a different level.",
    price: "Bespoke",
    priceNote: "Named account engagement",
    color: "hsl(38,90%,52%)",
    icon: Star,
    reliefStatement: "A dedicated SZL team embeds with your operations, tunes every signal path, and manages execution accountability end-to-end.",
    what: "Embedded operational intelligence partnership.",
    apps: ["Full platform — all apps"],
    includes: [
      "Full Governed Execution platform",
      "Dedicated onboarding engineer",
      "Custom signal detection for your domain",
      "Weekly operational review with SZL team",
      "Custom COVENANT policy authoring",
      "HELM CONSOLE family dashboard — live",
      "Priority support SLA (4h response)",
    ],
    highlight: false,
  },
];

const ADD_ONS = [
  {
    name: "Enterprise Governance",
    icon: Lock,
    desc: "SCIM provisioning, SSO, role isolation, tenant branding, advanced audit exports, SOC 2 evidence package.",
    tag: "Compliance teams",
    color: "hsl(0,72%,58%)",
  },
  {
    name: "Artifact & Export",
    icon: Layers,
    desc: "ATLAS document engine: auto-generated decks, data room packages, proof chain exports, PDF audit trails.",
    tag: "Executive & investor ops",
    color: "hsl(192,72%,48%)",
  },
  {
    name: "Integration & API",
    icon: Globe,
    desc: "Full REST + GraphQL access, webhook delivery, PRISM BUS API, custom connector authoring, MCP endpoint.",
    tag: "Engineering teams",
    color: "hsl(142,52%,48%)",
  },
  {
    name: "Pilot Bundle",
    icon: Building2,
    desc: "12-week design partner program: instrumentation, baseline, routing live, executive readout. Fixed-scope, fixed-price.",
    tag: "First engagement",
    color: "hsl(38,90%,52%)",
  },
];

export default function CommercialPackagingPage() {
  usePageMeta({
    title: "Platform Packages — SZL Holdings",
    description: "Intelligence platform packages organized by what they relieve — clarity, triage, readiness, governed execution, white-glove orchestration.",
    canonical: "https://szlholdings.com/packages",
  });

  const [activeTier, setActiveTier] = useState("readiness");

  const selectedTier = RELIEF_TIERS.find(t => t.id === activeTier) ?? RELIEF_TIERS[2];

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main className="pt-24">

        <section style={{ padding: "5rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(38,90%,52%)", marginBottom: "0.75rem" }}>
                Platform Packages
              </p>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.08, marginBottom: "1.25rem" }}>
                What does your team<br />need to stop doing?
              </h1>
              <p style={{ fontSize: "1.0625rem", lineHeight: 1.7, color: "hsl(210,5%,58%)", maxWidth: "42rem", marginBottom: "0.5rem" }}>
                Every SZL package is organized around a specific operational pain — not a feature list. 
                Pick the relief your team needs. Add what else makes sense.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "1rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
              {RELIEF_TIERS.map(tier => (
                <button
                  key={tier.id}
                  onClick={() => setActiveTier(tier.id)}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "6px",
                    border: `1px solid ${activeTier === tier.id ? tier.color : "hsl(210,12%,18%)"}`,
                    background: activeTier === tier.id ? `${tier.color}18` : "transparent",
                    color: activeTier === tier.id ? tier.color : "hsl(210,5%,58%)",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {tier.name}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
              <m.div
                key={selectedTier.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                style={{ background: "hsl(210,12%,8%)", border: `1px solid ${selectedTier.color}30`, borderRadius: "16px", padding: "2.5rem" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${selectedTier.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <selectedTier.icon size={20} style={{ color: selectedTier.color }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "22px", color: "hsl(38,12%,94%)", letterSpacing: "-0.02em" }}>{selectedTier.name}</div>
                    <div style={{ fontSize: "14px", color: selectedTier.color, fontWeight: 600 }}>{selectedTier.tagline}</div>
                  </div>
                </div>

                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "hsl(210,5%,68%)", marginBottom: "1.5rem" }}>
                  {selectedTier.reliefStatement}
                </p>

                <div style={{ background: `${selectedTier.color}12`, borderRadius: "8px", padding: "0.875rem 1rem", marginBottom: "1.5rem", borderLeft: `3px solid ${selectedTier.color}` }}>
                  <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)", marginBottom: "0.25rem", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>In plain terms</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "hsl(38,12%,94%)" }}>{selectedTier.what}</div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)", marginBottom: "0.75rem", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Apps Included</div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {selectedTier.apps.map(app => (
                      <span key={app} style={{ padding: "3px 10px", borderRadius: "100px", background: `${selectedTier.color}18`, color: selectedTier.color, fontSize: "12px", fontWeight: 600 }}>{app}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)", marginBottom: "0.75rem", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>What's Included</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {selectedTier.includes.map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <CheckCircle2 size={14} style={{ color: selectedTier.color, marginTop: "3px", flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", color: "hsl(210,5%,68%)", lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </m.div>

              <m.div
                key={`cta-${selectedTier.id}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
              >
                <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsl(210,12%,14%)", borderRadius: "16px", padding: "2rem" }}>
                  <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)", marginBottom: "0.5rem", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Pricing</div>
                  <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "hsl(38,12%,94%)", letterSpacing: "-0.03em", marginBottom: "0.25rem" }}>{selectedTier.price}</div>
                  <div style={{ fontSize: "13px", color: "hsl(210,5%,42%)", marginBottom: "1.5rem" }}>{selectedTier.priceNote}</div>
                  <Link href="/contact" style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: selectedTier.color, color: "hsl(210,12%,5%)", fontWeight: 700, fontSize: "14px", padding: "0.75rem 1.5rem", borderRadius: "8px", textDecoration: "none", width: "fit-content" }}>
                    Start a conversation
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsl(210,12%,14%)", borderRadius: "16px", padding: "1.5rem" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,94%)", marginBottom: "1rem" }}>Compare tiers</div>
                  {RELIEF_TIERS.map((tier, i) => (
                    <button
                      key={tier.id}
                      onClick={() => setActiveTier(tier.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem", width: "100%",
                        padding: "0.625rem 0.75rem", borderRadius: "6px", border: "none",
                        background: activeTier === tier.id ? `${tier.color}18` : "transparent",
                        cursor: "pointer", marginBottom: i < RELIEF_TIERS.length - 1 ? "2px" : 0,
                        textAlign: "left",
                      }}
                    >
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: tier.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: activeTier === tier.id ? 700 : 500, color: activeTier === tier.id ? tier.color : "hsl(210,5%,68%)" }}>{tier.name}</div>
                        <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)" }}>{tier.tagline}</div>
                      </div>
                      {activeTier === tier.id && <ChevronRight size={14} style={{ color: tier.color }} />}
                    </button>
                  ))}
                </div>
              </m.div>
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0 4rem", borderTop: "1px solid hsl(210,12%,10%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                Add-ons
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,94%)", marginBottom: "2rem" }}>
                Extend what you have.
              </h2>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
              {ADD_ONS.map((addon, i) => (
                <m.div
                  key={addon.name}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  style={{ background: "hsl(210,12%,8%)", border: "1px solid hsl(210,12%,14%)", borderRadius: "12px", padding: "1.5rem" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "7px", background: `${addon.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <addon.icon size={16} style={{ color: addon.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,94%)" }}>{addon.name}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", lineHeight: 1.6, color: "hsl(210,5%,58%)", marginBottom: "1rem" }}>{addon.desc}</p>
                  <span style={{ padding: "2px 8px", borderRadius: "4px", background: `${addon.color}18`, color: addon.color, fontSize: "11px", fontWeight: 600 }}>{addon.tag}</span>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0 5rem", borderTop: "1px solid hsl(210,12%,10%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem" }}>
              <div>
                <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,94%)", marginBottom: "0.75rem" }}>
                  Not sure where you fit?
                </h2>
                <p style={{ fontSize: "15px", color: "hsl(210,5%,58%)", lineHeight: 1.6 }}>
                  Use the ROI calculator to see what your team would recover. Or just talk to us.
                </p>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <Link href="/roi" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", borderRadius: "8px", border: "1px solid hsl(210,12%,22%)", color: "hsl(38,12%,84%)", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>
                  ROI Calculator
                  <BarChart3 size={15} />
                </Link>
                <Link href="/contact" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", borderRadius: "8px", background: "hsl(38,90%,52%)", color: "hsl(210,12%,5%)", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>
                  Talk to us
                  <ArrowRight size={15} />
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
