import { m } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Users, CheckCircle2, Shield, FileText, Eye, Lock, Star,
  Heart, MessageSquare, Zap, Clock, Layers, Briefcase
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { AlloyOperatingLoopDiagram } from "@/components/diagrams/AlloyOperatingLoopDiagram";

const WORKFLOW_STEPS = [
  {
    step: "01",
    label: "Secure Intake",
    body: "Client onboarding through a governed intake flow — identity verification, scope definition, service agreement confirmation, and access provisioning. Every intake step logged with attribution and client consent recorded.",
  },
  {
    step: "02",
    label: "Service Flow",
    body: "Active engagement tracked through structured milestones — deliverable status, communication cadence, and service health — with controlled visibility for both client and operator. No ambiguity on where things stand.",
  },
  {
    step: "03",
    label: "Communication Log",
    body: "All client communications logged with attribution, context, and retrieval-ready organization. Discreet by design — no cross-client exposure, no data bleed between engagements.",
  },
  {
    step: "04",
    label: "Discreet Delivery",
    body: "Deliverables packaged and delivered through controlled channels with confirmation tracking. Every delivery has a record of who authorized it, when, and to which client — with access controls enforced throughout.",
  },
];

const SERVICE_QUALITIES = [
  {
    icon: Lock,
    title: "Discreet by Design",
    body: "End-to-end access control — clients see only their record, operators see only their scope. No cross-client data exposure. No accidental visibility into other engagements. Discretion is architectural, not policy.",
  },
  {
    icon: Shield,
    title: "Governed Operations",
    body: "Every service action — intake, milestone update, communication, delivery — is logged with operator attribution. The platform enforces accountability even in a high-trust, personal service context.",
  },
  {
    icon: Star,
    title: "Premium Service Experience",
    body: "Structured engagement milestones, clear communication cadence, and proactive status visibility. Clients experience operational precision — not administrative chaos. The platform makes excellence consistent.",
  },
  {
    icon: Heart,
    title: "Client-First Architecture",
    body: "Everything in the client record belongs to the client engagement. Intake history, communication archive, service deliverables, and billing record — organized, accessible, and under the client's account context.",
  },
  {
    icon: MessageSquare,
    title: "Communication Intelligence",
    body: "Communication log that is retrievable, organized, and attributed — not scattered across email threads. Context for every conversation is available in seconds, not minutes of searching.",
  },
  {
    icon: Zap,
    title: "Alloy-Powered Execution",
    body: "Service workflows routed through Alloy — intake approvals, milestone confirmations, delivery authorizations — with human-in-the-loop gates and a complete audit trail behind every engagement.",
  },
];

const TRUST_CONTROLS = [
  "Client record isolation — no cross-engagement data exposure by design",
  "Operator attribution on every service action and communication",
  "Governed intake with identity verification and client consent recording",
  "Delivery authorization controls — nothing delivered without explicit confirmation",
  "Complete engagement audit trail — intake to close, every step logged",
  "Role-based access — client visibility limited to their engagement record only",
];

const ALLOY_INHERITED = [
  {
    capability: "Approval Gates",
    description: "Intake authorizations, service scope changes, and delivery confirmations require explicit human approval through Alloy's HITL gate — even in a high-trust service context.",
  },
  {
    capability: "Signal Normalization",
    description: "Client intake data, service milestones, and communication events normalized into a consistent record schema — organized for retrieval and attribution rather than raw data storage.",
  },
  {
    capability: "Workflow Routing",
    description: "Service tasks, milestone confirmations, and escalations routed to the right operator with client context, deadline, and authorization scope structured for immediate action.",
  },
  {
    capability: "Immutable Audit Trail",
    description: "Every service action — from intake confirmation to final delivery — logged with operator attribution and authorization basis. The engagement record is complete from first contact to close.",
  },
  {
    capability: "Access Controls",
    description: "Alloy's role-based access infrastructure ensures client records are isolated. No cross-client data exposure. No operator sees beyond their assigned engagement scope.",
  },
  {
    capability: "Export Governance",
    description: "Deliverables exit the platform through Alloy's controlled export layer — with authorization tracking, recipient confirmation, and delivery record intact.",
  },
];

const UNIQUE_TO_CARLOTA_JO = [
  "Discreet client record architecture — structural isolation between all engagement records",
  "Secure intake flow with identity verification and client consent recording",
  "Structured service milestone management with client-visible status tracking",
  "Communication archive that is organized, attributed, and retrievable — not email-dependent",
  "Controlled delivery channels with authorization confirmation and receipt tracking",
  "Premium service experience design — consistent excellence through platform structure",
];

export default function CarlotaJoPublicPage() {
  const __pageMeta = usePageMeta({
    title: "Carlota Jo — Premium Advisory & Client Service | SZL Holdings",
    description: "Carlota Jo is a premium advisory and client service platform built for discretion, trust, and operational precision. Secure intake, managed service flows, governed delivery.",
    canonical: "https://szlholdings.com/services/carlota-jo",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" role="main">
  
          {/* Maturity banner */}
          <div style={{ background: "hsla(280,50%,50%,0.07)", borderBottom: "1px solid hsla(280,50%,50%,0.18)", padding: "0.75rem var(--space-content-x)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={13} color="hsl(280,50%,65%)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(280,50%,65%)" }}>
                  Selective Engagements
                </span>
              </div>
              <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,60%)", lineHeight: 1.5 }}>
                Carlota Jo operates through selective client engagements. This is not a self-serve product. Engagements begin with a confidential conversation. Capacity is limited by design.
              </span>
            </div>
          </div>
  
          {/* Hero */}
          <section
            className="szl-grid-texture"
            style={{
              paddingTop: "var(--space-hero-pt)",
              paddingBottom: "clamp(5rem,9vw,7rem)",
              borderBottom: "1px solid var(--color-szl-border)",
              background: "radial-gradient(ellipse at 50% 0%, hsla(280,50%,50%,0.06) 0%, transparent 62%)",
            }}
          >
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.75rem" }}>
                  <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(280,50%,50%,0.10)", border: "1px solid hsla(280,50%,50%,0.22)", borderRadius: "8px" }}>
                    <Users size={16} color="hsl(280,50%,65%)" />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(280,50%,65%)" }}>
                    Carlota Jo · Premium Advisory & Client Service
                  </span>
                </div>
              </m.div>
  
              <div style={{ display: "grid", gap: "clamp(2.5rem,5vw,4rem)", alignItems: "start" }} className="lg:grid-cols-[1.2fr_0.8fr]">
                <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
                  <h1 style={{ fontSize: "clamp(2.5rem,5.5vw,4.25rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: "1.5rem", maxWidth: "22ch" }}>
                    Discretion, precision, and trust — built into the platform.
                  </h1>
                  <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "50ch", marginBottom: "0.875rem" }}>
                    Carlota Jo is a premium advisory and client service platform for engagements where trust, discretion, and operational precision are non-negotiable. Governed intake. Structured service flows. Discreet, authorized delivery.
                  </p>
                  <p style={{ fontSize: "clamp(0.9375rem,1.6vw,1rem)", lineHeight: 1.72, color: "hsl(214,7%,52%)", maxWidth: "50ch", marginBottom: "2.25rem" }}>
                    Powered by FORGE for governed execution — every service action logged, attributed, and auditable. Excellence is consistent because the platform makes it structural.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                    <Link href="/contact" className="szl-btn-primary">Inquire confidentially <ArrowRight size={15} /></Link>
                    <Link href="/demo" className="szl-btn-secondary">See how it works</Link>
                  </div>
                </m.div>
  
                <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }} style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.75rem)", background: "hsla(280,50%,50%,0.04)", border: "1px solid hsla(280,50%,50%,0.15)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                    What clients experience
                  </p>
                  {[
                    "A secure, structured intake — no ambiguous onboarding",
                    "Clear service milestones with real-time status visibility",
                    "Communications organized and retrievable — not buried in email",
                    "Deliverables confirmed and delivered through controlled channels",
                    "Complete record of the engagement from intake to close",
                    "Access to their record only — full discretion guaranteed",
                  ].map((q, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.75rem" }}>
                      <CheckCircle2 size={14} color="hsl(280,50%,65%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,72%)" }}>{q}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-szl-border)" }}>
                    <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,48%)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                      Premium advisory · Discreet operations · Governed service
                    </p>
                  </div>
                </m.div>
              </div>
            </div>
          </section>
  
          {/* Lane definition */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "start" }} className="lg:grid-cols-2">
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(280,50%,65%)", marginBottom: "1rem" }}>Lane Definition</p>
                  <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>
                    A consulting and services lane — not a product vertical.
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch", marginBottom: "1.25rem" }}>
                    Carlota Jo is the consulting and professional services lane within SZL Holdings. Where the product lanes (Lyte, Counsel, Terra, Vessels, Aegis) deliver software platforms, Carlota Jo delivers advisory services — with the same Alloy operating infrastructure ensuring that service delivery is governed, attributable, and auditable.
                  </p>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,54%)", maxWidth: "46ch" }}>
                    The client service context demands a different user experience — premium, discreet, personally attentive. The operational infrastructure beneath it is the same: Alloy's approval gates, workflow routing, audit trail, and access controls applied to every engagement action.
                  </p>
                </m.div>
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(280,50%,65%)", marginBottom: "1rem" }}>Engagement Contexts</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {[
                      { context: "Advisory Engagements", desc: "Strategic advisory services with structured milestone management and confidential communication handling" },
                      { context: "High-Trust Operations", desc: "Service contexts where discretion is the primary requirement and operational precision is non-negotiable" },
                      { context: "Discreet Client Management", desc: "Engagements requiring strict client record isolation, controlled communication, and authorized delivery" },
                      { context: "Operational Support", desc: "Structured operational support services with governed delivery, milestone tracking, and full audit trail" },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: "0.875rem 1rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <Briefcase size={11} color="hsl(280,50%,65%)" />
                          <p style={{ fontSize: "12px", fontWeight: 700, color: "hsl(38,12%,82%)" }}>{item.context}</p>
                        </div>
                        <p style={{ fontSize: "11px", lineHeight: 1.55, color: "hsl(214,7%,50%)" }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </m.div>
              </div>
            </div>
          </section>
  
          {/* Service workflow */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(280,50%,65%)", marginBottom: "1rem" }}>
                  Service Flow
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                  From secure intake to discreet delivery — every step governed.
                </h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {WORKFLOW_STEPS.map((s, i) => (
                  <m.div key={s.step} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.07 }} style={{ display: "flex", gap: "1.5rem", padding: "1.25rem 1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)", alignItems: "flex-start" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "hsl(280,50%,65%)", letterSpacing: "0.06em", flexShrink: 0, marginTop: "2px" }}>{s.step}</div>
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.375rem", color: "hsl(38,8%,90%)" }}>{s.label}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,60%)" }}>{s.body}</p>
                    </div>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Service qualities */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(280,50%,65%)", marginBottom: "1rem" }}>Platform Qualities</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>Built for the highest standard of client service.</h2>
              </m.div>
              <div className="szl-grid-3">
                {SERVICE_QUALITIES.map((qual, i) => {
                  const Icon = qual.icon;
                  return (
                    <m.div key={qual.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(280,50%,50%,0.09)", border: "1px solid hsla(280,50%,50%,0.18)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                        <Icon size={16} color="hsl(280,50%,65%)" />
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{qual.title}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{qual.body}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Alloy inheritance */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(280,50%,65%)", marginBottom: "1rem" }}>
                  What Carlota Jo Inherits from Alloy
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "32ch", marginBottom: "1.25rem" }}>
                  The execution fabric is inherited. Carlota Jo brings the service layer on top.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                  Even in a high-trust consulting context, every service action passes through Alloy's governed pipeline. The same infrastructure managing legal approvals, maritime decisions, and security remediations governs client intake, service delivery, and engagement close.
                </p>
              </m.div>
              <div style={{ display: "grid", gap: "1rem", marginBottom: "2.5rem" }} className="lg:grid-cols-3 md:grid-cols-2">
                {ALLOY_INHERITED.map((item, i) => (
                  <m.div
                    key={item.capability}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.06 }}
                    style={{ padding: "1.25rem", borderRadius: "0.75rem", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                      <Layers size={13} color="hsl(280,50%,65%)" style={{ flexShrink: 0 }} />
                      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, letterSpacing: "-0.010em", color: "hsl(38,8%,88%)" }}>{item.capability}</h3>
                    </div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>{item.description}</p>
                  </m.div>
                ))}
              </div>
              <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <AlloyOperatingLoopDiagram compact />
              </m.div>
            </div>
          </section>
  
          {/* What's unique to Carlota Jo */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(280,50%,65%)", marginBottom: "1rem" }}>
                  What's Unique to Carlota Jo
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2.5rem" }}>
                  Service-specific design on a shared governance foundation.
                </h2>
              </m.div>
              <div style={{ display: "grid", gap: "0.75rem" }} className="lg:grid-cols-2">
                {UNIQUE_TO_CARLOTA_JO.map((item, i) => (
                  <m.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                    <Star size={13} color="hsl(280,50%,65%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,64%)" }}>{item}</span>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Trust */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(280,50%,65%)", marginBottom: "1rem" }}>Trust Controls</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2.5rem" }}>Discretion is structural, not a promise.</h2>
              </m.div>
              <div style={{ display: "grid", gap: "0.75rem" }} className="lg:grid-cols-2">
                {TRUST_CONTROLS.map((control, i) => (
                  <m.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                    <Lock size={13} color="hsl(280,50%,65%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,64%)" }}>{control}</span>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* CTA */}
          <section style={{ padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center", background: "hsla(280,50%,50%,0.05)", border: "1px solid hsla(280,50%,50%,0.16)" }} className="szl-grid-cta">
                <div>
                  <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "0.875rem" }}>Ready to start a conversation?</h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                    Carlota Jo engagements begin with a confidential conversation. No commitment required to start. We respond within 24 hours through your preferred channel. Capacity is limited — we take on a small number of engagements at a time.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                  <Link href="/contact" className="szl-btn-primary">Inquire confidentially <ArrowRight size={14} /></Link>
                  <Link href="/demo" className="szl-btn-secondary" style={{ textAlign: "center" }}>See how the platform works</Link>
                </div>
              </m.div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
