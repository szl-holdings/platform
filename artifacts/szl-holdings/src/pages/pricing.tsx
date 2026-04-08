import { m } from "framer-motion";
import { ArrowRight, CheckCircle, Building2, Users, Zap, BarChart3, GitBranch, Shield, Scale } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PILOT_DELIVERABLES = [
  { icon: BarChart3, label: "Lyte instrumented against your data", desc: "PRISM signal detection running on your actual operational surface — approval queues, workflow health, risk signals — within the first two weeks." },
  { icon: GitBranch, label: "Alloy routing live", desc: "Action routing and audit trail configured for your org structure. Every signal gets an owner. Every action gets a record." },
  { icon: Shield, label: "Playbook for your three highest-risk signal categories", desc: "Custom detection logic, routing rules, and escalation paths for the operational risks that matter most in your environment." },
  { icon: Zap, label: "Executive readout at week 12", desc: "Full operational summary: signals detected, actions routed, outcomes verified, and a roadmap for expansion." },
];

const QUALIFICATION = [
  { heading: "Teams running at scale", body: "50–5,000 person organizations where operational drift is a real cost — approval latency compounds, ownership gaps accumulate, and problems surface too late." },
  { heading: "Operators, not just observers", body: "You're not looking for another dashboard. You want a system that closes the loop — signal to action to audit — automatically." },
  { heading: "Enterprise systems already in place", body: "You have Salesforce, Jira, ServiceNow, Slack, or similar. Lyte connects to your existing systems. You don't start over." },
  { heading: "Accountability as a design requirement", body: "Legal, compliance, or board-level accountability requirements that make traceable execution a business necessity, not a feature request." },
];

const ENGAGEMENT_TIMELINE = [
  { week: "Week 1–2", label: "Instrumentation", desc: "Connect Lyte to your existing systems. Configure PRISM signal categories for your environment." },
  { week: "Week 3–4", label: "Baseline", desc: "Establish signal baselines. Identify the first three high-value detection patterns." },
  { week: "Week 5–8", label: "Routing + Audit", desc: "Alloy routing live. Human-in-the-loop gates configured. Audit trail active." },
  { week: "Week 9–12", label: "Verification + Readout", desc: "Outcomes verified against baseline. Executive summary. Expansion roadmap delivered." },
];

const DOMAIN_PACKS = [
  { name: "PRISM Counsel", desc: "Legal matter signals, deadline compliance, demand packet generation", color: "hsl(38,72%,58%)", icon: Scale },
  { name: "Aegis", desc: "SOC operations, threat intelligence, incident response", color: "hsl(222,60%,62%)", icon: Shield },
  { name: "Vessels", desc: "Fleet tracking, route risk, sanctions compliance", color: "hsl(206,72%,52%)", icon: Building2 },
  { name: "Terra", desc: "Property intelligence, distress detection, deal pipeline", color: "hsl(140,50%,48%)", icon: Building2 },
];

export default function PricingPage() {
  usePageMeta({
    title: "Pilot Program — Lyte + Alloy | SZL Holdings",
    description: "3-month design partner engagement: Lyte + Alloy instrumented against your operational data. Business observability and execution accountability, live in your environment. Wedge product: PRISM Counsel for legal operations.",
    canonical: "https://szlholdings.com/pricing",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section
          className="szl-grid-texture"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(4rem,8vw,6rem)",
            borderBottom: "1px solid var(--color-szl-border)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid hsla(191,92%,44%,0.22)", background: "hsla(191,92%,44%,0.08)", marginBottom: "1.75rem" }}>
                <BarChart3 size={13} color="hsl(191,92%,44%)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(191,92%,44%)" }}>Design Partner Program</span>
              </div>
            </m.div>
            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                Lyte + Alloy, live in your environment.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "55ch", marginBottom: "2rem" }}>
                We run a focused 3-month design partner engagement. Lyte instrumented against your operational data.
                Alloy routing action. Real signals, real execution, real audit trail — in your environment, against
                your systems, for your team.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link href="/contact" className="szl-btn-primary">
                  Start a Conversation <ArrowRight size={14} />
                </Link>
                <Link href="/demo" className="szl-btn-secondary">
                  See the Demo First
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="szl-card"
              style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)", marginBottom: "2.5rem", borderLeft: "3px solid hsl(191,92%,44%)" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "240px" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(191,92%,44%)", marginBottom: "0.5rem" }}>
                    3-Month Design Partner Engagement
                  </p>
                  <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "hsl(38,8%,92%)", letterSpacing: "-0.015em", marginBottom: "0.375rem" }}>
                    Enterprise Pricing
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,58%)", lineHeight: 1.65 }}>
                    Contact us to discuss scope, timeline, and pricing based on your environment and team size.
                    Engagements start at a fixed-scope pilot and expand based on demonstrated value.
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <a
                    href="mailto:inquiries@szlholdings.com?subject=Design Partner Inquiry — Lyte + Alloy"
                    className="szl-btn-primary"
                    style={{ textDecoration: "none" }}
                  >
                    inquiries@szlholdings.com <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </m.div>

            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.25rem" }}>
                What you get
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {PILOT_DELIVERABLES.map((item, i) => {
                const Icon = item.icon;
                return (
                  <m.div
                    key={item.label}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "1.375rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "0.375rem", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(191,92%,44%,0.10)", border: "1px solid hsla(191,92%,44%,0.20)" }}>
                        <Icon size={13} style={{ color: "hsl(191,92%,44%)" }} />
                      </div>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)", letterSpacing: "-0.005em" }}>{item.label}</p>
                    </div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.65, color: "hsl(214,7%,58%)" }}>{item.desc}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.25rem" }}>
                12-Week Timeline
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
              {ENGAGEMENT_TIMELINE.map((phase, i) => (
                <m.div
                  key={phase.week}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: "1.25rem" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(38,72%,58%,0.12)", fontSize: "0.625rem", fontWeight: 700, color: "hsl(38,72%,58%)" }}>
                      {i + 1}
                    </div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(38,72%,58%)" }}>{phase.week}</p>
                  </div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.375rem" }}>{phase.label}</p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,55%)" }}>{phase.desc}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "2.5rem" }}>
              <div>
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.25rem" }}>
                    Who this is for
                  </p>
                </m.div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {QUALIFICATION.map((item, i) => (
                    <m.div
                      key={item.heading}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                      className="szl-card"
                      style={{ borderRadius: "0.75rem", padding: "1.125rem", display: "flex", alignItems: "flex-start", gap: "0.875rem" }}
                    >
                      <CheckCircle size={14} style={{ color: "hsl(191,92%,44%)", flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,86%)", marginBottom: "0.25rem" }}>{item.heading}</p>
                        <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,55%)" }}>{item.body}</p>
                      </div>
                    </m.div>
                  ))}
                </div>
              </div>

              <div>
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.25rem" }}>
                    What we instrument
                  </p>
                </m.div>
                <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "1.5rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <Building2 size={14} style={{ color: "hsl(191,92%,44%)" }} />
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,84%)" }}>Connected systems (Lyte)</p>
                  </div>
                  {["Salesforce (CRM, pipeline, approvals)", "Jira / Linear (engineering workflows)", "Slack / Teams (communication signals)", "ServiceNow / PagerDuty (incident data)", "HubSpot, Zendesk, or similar", "Custom APIs and internal systems via webhook"].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(191,92%,44%)", flexShrink: 0 }} />
                      <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)" }}>{item}</p>
                    </div>
                  ))}
                </div>
                <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <Users size={14} style={{ color: "hsl(258,55%,68%)" }} />
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,84%)" }}>Org structure (Alloy)</p>
                  </div>
                  {["Role-based routing rules", "Approval chains and escalation paths", "SLA thresholds per signal category", "Exception and override audit logging"].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(258,55%,68%)", flexShrink: 0 }} />
                      <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)" }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Expand into domain packs
              </p>
              <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>
                Start with Lyte. Add domain intelligence.
              </h2>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {DOMAIN_PACKS.map((pack, i) => {
                const Icon = pack.icon;
                return (
                  <m.div
                    key={pack.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "1.25rem", borderLeft: `3px solid ${pack.color}` }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <Icon size={14} style={{ color: pack.color }} />
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,88%)" }}>{pack.name}</p>
                    </div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,55%)" }}>{pack.desc}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link href="/contact" className="szl-btn-primary">
                Start the Conversation <ArrowRight size={14} />
              </Link>
              <Link href="/demo" className="szl-btn-secondary">
                Watch the Demo
              </Link>
              <Link href="/design-partners" className="szl-btn-ghost">
                Design Partner Program
              </Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
