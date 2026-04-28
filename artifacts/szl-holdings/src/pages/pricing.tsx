import { useEffect } from "react";
import { m } from "framer-motion";
import { ArrowRight, CheckCircle, Building2, Users, Zap, BarChart3, GitBranch, Shield } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { analytics } from "@/lib/analytics";

const PILOT_DELIVERABLES = [
  { icon: BarChart3, label: "KORA instrumented against your data", desc: "PRAXIS signal detection running on your actual operational surface — approval queues, workflow health, risk signals — within the first two weeks." },
  { icon: GitBranch, label: "Counsel routing live", desc: "Action routing and audit trail configured for your org structure. Every signal gets an owner. Every action gets a record." },
  { icon: Shield, label: "Playbook for your three highest-risk signal categories", desc: "Custom detection logic, routing rules, and escalation paths for the operational risks that matter most in your environment." },
  { icon: Zap, label: "Executive readout at week 12", desc: "Full operational summary: signals detected, actions routed, outcomes verified, and a roadmap for expansion." },
];

const QUALIFICATION = [
  { heading: "Teams running at scale", body: "50–5,000 person organizations where operational drift is a real cost — approval latency compounds, ownership gaps accumulate, and problems surface too late." },
  { heading: "Operators, not just observers", body: "You're not looking for another dashboard. You want a system that closes the loop — signal to action to audit — automatically." },
  { heading: "Enterprise systems already in place", body: "You have Salesforce, Jira, ServiceNow, Slack, or similar. KORA connects to your existing systems. You don't start over." },
  { heading: "Accountability as a design requirement", body: "Legal, compliance, or board-level accountability requirements that make traceable execution a business necessity, not a feature request." },
];

const ENGAGEMENT_TIMELINE = [
  { week: "Week 1–2", label: "Instrumentation", desc: "Connect KORA to your existing systems. Configure PRAXIS signal categories for your environment." },
  { week: "Week 3–4", label: "Baseline", desc: "Establish signal baselines. Identify the first three high-value detection patterns." },
  { week: "Week 5–8", label: "Routing + Audit", desc: "Counsel routing live. Human-in-the-loop gates configured. Audit trail active." },
  { week: "Week 9–12", label: "Verification + Readout", desc: "Outcomes verified against baseline. Executive summary. Expansion roadmap delivered." },
];

export default function PricingPage() {
  const __pageMeta = usePageMeta({
    title: "Pilot Program — KORA + Counsel | SZL Holdings",
    description: "3-month design partner engagement: KORA + Counsel instrumented against your operational data. Governed decision intelligence and execution accountability, live in your environment.",
    canonical: "https://szlholdings.com/pricing",
    ogImage: "https://szlholdings.com/og/og-pricing.jpg",
  });

  useEffect(() => {
    // Session recording is started by PageViewTracker at the router level.
    analytics.pricingView("/pricing");
  }, []);

  return (
    <>
      {__pageMeta}
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main className="pt-24">

        <section style={{ padding: "4rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                Design Partner Program
              </p>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.08, marginBottom: "1.25rem" }}>
                KORA + Counsel, live in<br />your environment.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(210,5%,58%)", maxWidth: "38rem", marginBottom: "2rem" }}>
                We run a focused 3-month design partner engagement. KORA instrumented against your operational data. Counsel routing action. Real signals, real execution, real audit trail — in your environment, against your systems, for your team.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link
                  href="/contact"
                  onClick={() => analytics.ctaClick("start-a-conversation", "pricing", "hero")}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.375rem", borderRadius: "6px", fontSize: "13.5px", fontWeight: 700, color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", textDecoration: "none", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,88%)"; }}
                >
                  Start a Conversation <ArrowRight size={13} strokeWidth={2.5} />
                </Link>
                <Link
                  href="/demo"
                  onClick={() => analytics.ctaClick("see-the-demo-first", "pricing", "hero")}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: "hsl(210,5%,56%)", border: "1px solid hsla(0,0%,100%,0.09)", textDecoration: "none", background: "transparent", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,88%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.18)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,56%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.09)"; }}
                >
                  See the Demo First
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div style={{ padding: "2rem", borderRadius: "12px", background: "hsla(192,80%,48%,0.04)", border: "1px solid hsla(192,80%,48%,0.16)", marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "240px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(192,80%,48%)", marginBottom: "0.5rem" }}>
                    3-Month Design Partner Engagement
                  </p>
                  <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.02em", marginBottom: "0.375rem" }}>
                    Enterprise Pricing
                  </p>
                  <p style={{ fontSize: "13px", color: "hsl(210,5%,55%)", lineHeight: 1.6 }}>
                    Contact us to discuss scope, timeline, and pricing based on your environment and team size. Engagements start at a fixed-scope pilot and expand based on demonstrated value.
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <a
                    href="mailto:inquiries@szlholdings.com?subject=Design Partner Inquiry — KORA + Counsel"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "hsl(192,80%,55%)", border: "1px solid hsla(192,80%,48%,0.3)", textDecoration: "none", background: "hsla(192,80%,48%,0.08)", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(192,80%,48%,0.14)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(192,80%,48%,0.08)"; }}
                  >
                    inquiries@szlholdings.com <ArrowRight size={12} strokeWidth={2.5} />
                  </a>
                </div>
              </div>
            </div>

            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
              What you get
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {PILOT_DELIVERABLES.map((item, i) => {
                const Icon = item.icon;
                return (
                  <m.div
                    key={item.label}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    style={{ padding: "1.375rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem" }}>
                      <div style={{ width: "26px", height: "26px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(192,80%,48%,0.10)", border: "1px solid hsla(192,80%,48%,0.2)" }}>
                        <Icon size={13} style={{ color: "hsl(192,80%,52%)" }} />
                      </div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,88%)", letterSpacing: "-0.005em" }}>{item.label}</p>
                    </div>
                    <p style={{ fontSize: "12.5px", lineHeight: 1.65, color: "hsl(210,5%,55%)" }}>{item.desc}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,6%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
              12-Week Timeline
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {ENGAGEMENT_TIMELINE.map((phase, i) => (
                <m.div
                  key={phase.week}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)" }}
                >
                  <p style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(192,80%,48%)", marginBottom: "0.375rem" }}>{phase.week}</p>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: "0.375rem" }}>{phase.label}</p>
                  <p style={{ fontSize: "12px", lineHeight: 1.6, color: "hsl(210,5%,52%)" }}>{phase.desc}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
                  Who this is for
                </p>
                <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.08, marginBottom: "1.25rem" }}>
                  KORA + Counsel, live in<br />your environment.
                </h1>
                <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(210,5%,58%)", maxWidth: "38rem", marginBottom: "2rem" }}>
                  We run a focused 3-month design partner engagement. KORA instrumented against your operational data. Counsel routing action. Real signals, real execution, real audit trail — in your environment, against your systems, for your team.
                </p>
                <div style={{ padding: "1.5rem", borderRadius: "12px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <Building2 size={14} style={{ color: "hsl(210,5%,46%)" }} />
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,84%)" }}>Connected systems (KORA)</p>
                  </div>
                  {["Salesforce (CRM, pipeline, approvals)", "Jira / Linear (engineering workflows)", "Slack / Teams (communication signals)", "ServiceNow / PagerDuty (incident data)", "HubSpot, Zendesk, or similar", "Custom APIs and internal systems via webhook"].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(192,80%,48%)", flexShrink: 0 }} />
                      <p style={{ fontSize: "12px", color: "hsl(210,5%,52%)" }}>{item}</p>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "1.5rem", borderRadius: "12px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <Users size={14} style={{ color: "hsl(210,5%,46%)" }} />
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,84%)" }}>Org structure (Counsel)</p>
                  </div>
                  {["Role-based routing rules", "Approval chains and escalation paths", "SLA thresholds per signal category", "Exception and override audit logging"].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(222,68%,60%)", flexShrink: 0 }} />
                      <p style={{ fontSize: "12px", color: "hsl(210,5%,52%)" }}>{item}</p>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                  <Link href="/contact" onClick={() => analytics.ctaClick("start-the-conversation", "pricing", "qualification")} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 700, color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", textDecoration: "none", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,88%)"; }}
                  >
                    Start a Conversation <ArrowRight size={13} strokeWidth={2.5} />
                  </Link>
                  <Link href="/demo" onClick={() => analytics.ctaClick("watch-the-demo", "pricing", "qualification")} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1rem", borderRadius: "6px", fontSize: "12px", fontWeight: 500, color: "hsl(210,5%,56%)", border: "1px solid hsla(0,0%,100%,0.09)", textDecoration: "none", background: "transparent", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,88%)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,56%)"; }}
                  >
                    See the Demo First
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div style={{ padding: "2rem", borderRadius: "12px", background: "hsla(192,80%,48%,0.04)", border: "1px solid hsla(192,80%,48%,0.16)", marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(192,80%,48%)", marginBottom: "0.5rem" }}>
                      3-Month Design Partner Engagement
                    </p>
                    <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.02em", marginBottom: "0.375rem" }}>
                      Enterprise Pricing
                    </p>
                    <p style={{ fontSize: "13px", color: "hsl(210,5%,55%)", lineHeight: 1.6 }}>
                      Contact us to discuss scope, timeline, and pricing based on your environment and team size. Engagements start at a fixed-scope pilot and expand based on demonstrated value.
                    </p>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <a
                      href="mailto:inquiries@szlholdings.com?subject=Design Partner Inquiry — KORA + Counsel"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "hsl(192,80%,55%)", border: "1px solid hsla(192,80%,48%,0.3)", textDecoration: "none", background: "hsla(192,80%,48%,0.08)", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(192,80%,48%,0.14)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(192,80%,48%,0.08)"; }}
                    >
                      inquiries@szlholdings.com <ArrowRight size={12} strokeWidth={2.5} />
                    </a>
                  </div>
                </div>
              </div>
  
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
                What you get
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {PILOT_DELIVERABLES.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <m.div
                      key={item.label}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      style={{ padding: "1.375rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem" }}>
                        <div style={{ width: "26px", height: "26px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(192,80%,48%,0.10)", border: "1px solid hsla(192,80%,48%,0.2)" }}>
                          <Icon size={13} style={{ color: "hsl(192,80%,52%)" }} />
                        </div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,88%)", letterSpacing: "-0.005em" }}>{item.label}</p>
                      </div>
                      <p style={{ fontSize: "12.5px", lineHeight: 1.65, color: "hsl(210,5%,55%)" }}>{item.desc}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,6%)" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
                12-Week Timeline
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {ENGAGEMENT_TIMELINE.map((phase, i) => (
                  <m.div
                    key={phase.week}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.07 }}
                    style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)" }}
                  >
                    <p style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(192,80%,48%)", marginBottom: "0.375rem" }}>{phase.week}</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: "0.375rem" }}>{phase.label}</p>
                    <p style={{ fontSize: "12px", lineHeight: 1.6, color: "hsl(210,5%,52%)" }}>{phase.desc}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
                    Who this is for
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {QUALIFICATION.map((item, i) => (
                      <m.div
                        key={item.heading}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.07 }}
                        style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "1.125rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)" }}
                      >
                        <CheckCircle size={14} style={{ color: "hsl(192,80%,48%)", flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,86%)", marginBottom: "0.25rem" }}>{item.heading}</p>
                          <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "hsl(210,5%,52%)" }}>{item.body}</p>
                        </div>
                      </m.div>
                    ))}
                  </div>
                </div>
  
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
                    What we instrument
                  </p>
                  <div style={{ padding: "1.5rem", borderRadius: "12px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                      <Building2 size={14} style={{ color: "hsl(210,5%,46%)" }} />
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,84%)" }}>Connected systems (KORA)</p>
                    </div>
                    {["Salesforce (CRM, pipeline, approvals)", "Jira / Linear (engineering workflows)", "Slack / Teams (communication signals)", "ServiceNow / PagerDuty (incident data)", "HubSpot, Zendesk, or similar", "Custom APIs and internal systems via webhook"].map((item) => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                        <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(192,80%,48%)", flexShrink: 0 }} />
                        <p style={{ fontSize: "12px", color: "hsl(210,5%,52%)" }}>{item}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "1.5rem", borderRadius: "12px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                      <Users size={14} style={{ color: "hsl(210,5%,46%)" }} />
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,84%)" }}>Org structure (Counsel)</p>
                    </div>
                    {["Role-based routing rules", "Approval chains and escalation paths", "SLA thresholds per signal category", "Exception and override audit logging"].map((item) => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                        <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(222,68%,60%)", flexShrink: 0 }} />
                        <p style={{ fontSize: "12px", color: "hsl(210,5%,52%)" }}>{item}</p>
                      </div>
                    ))}
                  </div>
  
                  <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                    <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 700, color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", textDecoration: "none", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,88%)"; }}
                    >
                      Start the Conversation <ArrowRight size={13} strokeWidth={2.5} />
                    </Link>
                    <Link href="/demo" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1rem", borderRadius: "6px", fontSize: "12px", fontWeight: 500, color: "hsl(210,5%,56%)", border: "1px solid hsla(0,0%,100%,0.09)", textDecoration: "none", background: "transparent", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,88%)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,56%)"; }}
                    >
                      Watch the Demo
                    </Link>
                  </div>
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
