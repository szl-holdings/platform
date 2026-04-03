import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Scale, Building2, Ship, ShieldCheck, BarChart3, Users, Zap, Shield, Eye, Clock, FileText, Lock, Database, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DataStateBadge } from "@/components/DataStateBadge";
import { usePageMeta } from "@/hooks/usePageMeta";
import { toast } from "sonner";

const API_BASE = "/api";

interface WorkflowStep {
  label: string;
  detail: string;
}

interface Pack {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: typeof Scale;
  accentColor: string;
  accentRgb: string;
  twin: string;
  twinDescription: string;
  workflow: WorkflowStep[];
  outputs: string[];
  signals: string[];
  trust: string[];
  ctaLabel: string;
  ctaHref: string;
}

const PACKS: Pack[] = [
  {
    id: "prism-counsel",
    name: "PRISM Counsel",
    tagline: "Legal matter intelligence and governed execution",
    description: "A command layer for plaintiff-side litigation teams. Every matter scored, every deadline tracked, every action governed — with a proof chain for everything that moves.",
    icon: Scale,
    accentColor: "hsl(38,72%,58%)",
    accentRgb: "212,160,84",
    twin: "Matter Twin",
    twinDescription: "A live structured model of each matter — claims, parties, deadlines, documents, correspondence, and insurer behavior — updated as signals arrive.",
    workflow: [
      { label: "Matter Twin", detail: "Claim signals, deadlines, and party behavior assembled into a structured matter model" },
      { label: "What Changed", detail: "Signal delta surfaced — new correspondence, clock violations, insurer pattern shifts" },
      { label: "Review Before Send", detail: "Demand packet reviewed against completeness checklist with privilege controls" },
      { label: "Approval Gate", detail: "Partner or supervisor approves before consequential action — HITL enforced" },
      { label: "Word Export", detail: "Demand letter exported to Word with source citations and metadata intact" },
      { label: "Proof Chain", detail: "Immutable audit record of every action, approval, and AI use — defensible in litigation" },
    ],
    outputs: ["Demand readiness scoring", "Settlement band forecast", "Deadline compliance queue", "Insurer behavior profiles", "Proof chain export"],
    signals: ["NY DFS Insurance Regulation 68", "NWS (weather/incident context)", "US Census (demographics)", "CMS MSPRP (Medicare liens)", "Court scheduling feeds"],
    trust: ["Human approval on every consequential action", "Privilege-aware architecture", "Source-grounded AI with defensibility scoring", "Immutable audit trail"],
    ctaLabel: "See PRISM Counsel",
    ctaHref: "/prism-counsel-public",
  },
  {
    id: "terra",
    name: "Terra",
    tagline: "Property intelligence and deal execution",
    description: "Real estate operators and investors finally get a command layer. Property Twin tracks every asset signal. Alloy routes action through governed workflows.",
    icon: Building2,
    accentColor: "hsl(140,50%,46%)",
    accentRgb: "58,168,90",
    twin: "Property Twin",
    twinDescription: "A live structured model of each property — ownership, liens, permits, distress signals, flood risk, market context — continuously updated from public and proprietary data.",
    workflow: [
      { label: "Property Twin", detail: "PLUTO records, FEMA flood maps, and permit data assembled into a structured asset model" },
      { label: "Distress & Diligence", detail: "Distress signals, ownership gaps, and diligence items surfaced with priority scoring" },
      { label: "Local Friction", detail: "Zoning, environmental, and census context layered onto the property profile" },
      { label: "Review & Approval", detail: "Deal team reviews findings and approves next actions through governed workflow" },
      { label: "Export & Write-Back", detail: "Diligence package exported for LP review or written back to deal platform" },
    ],
    outputs: ["Property Twin dashboard", "Distress detection feed", "Diligence readiness score", "Deal approval workflow", "LP-ready export packet"],
    signals: ["NYC PLUTO (property data)", "FEMA NFHL (flood hazard)", "US Census (demographics/economics)", "Public lien and permit records"],
    trust: ["Human approval on consequential deal decisions", "Attribution on every recommendation", "Source-grounded signals — no hallucinated data", "Audit trail for LP and compliance review"],
    ctaLabel: "See Terra",
    ctaHref: "/terra-public",
  },
  {
    id: "vessels",
    name: "Vessels",
    tagline: "Fleet intelligence and maritime operations command",
    description: "Command-grade observability for maritime operations. Voyage and fleet twins surface risk before it becomes a commercial incident. Alloy routes action with full traceability.",
    icon: Ship,
    accentColor: "hsl(206,72%,52%)",
    accentRgb: "46,134,193",
    twin: "Voyage Twin",
    twinDescription: "A live structured model of each voyage — vessel position, cargo status, port schedule, weather exposure, crew, and compliance flags — updated as conditions change.",
    workflow: [
      { label: "Voyage Twin", detail: "AIS position, cargo manifest, and port schedule assembled into a structured voyage model" },
      { label: "Weather & Port Context", detail: "NWS marine forecasts and BTS port data layered onto route profile" },
      { label: "Route Risk", detail: "Weather deviations, OFAC flags, and port delay signals surfaced with severity scoring" },
      { label: "Readiness Assessment", detail: "Crew certification, cargo compliance, and pre-arrival checklist status reviewed" },
      { label: "Action & Export", detail: "Rerouting or escalation routed through Alloy with approval gate and audit record" },
    ],
    outputs: ["Fleet command dashboard", "Voyage risk feed", "Port operations checklist", "Compliance audit trail", "Commercial exception report"],
    signals: ["NWS marine forecasts", "USCG AIS (vessel tracking)", "BTS port statistics", "OFAC sanctions screening"],
    trust: ["Human approval on rerouting and compliance exceptions", "Full crew and cargo attribution", "Regulatory footprint captured automatically", "Immutable voyage audit record"],
    ctaLabel: "See Vessels",
    ctaHref: "/vessels-public",
  },
  {
    id: "aegis",
    name: "Aegis",
    tagline: "Threat intelligence and security operations command",
    description: "SOC command built for environments where every decision has consequence. Threat Twin tracks your exposure surface. Alloy routes response through governed playbooks.",
    icon: ShieldCheck,
    accentColor: "hsl(222,60%,60%)",
    accentRgb: "86,112,214",
    twin: "Threat Twin",
    twinDescription: "A live structured model of your threat exposure — CVEs mapped to your stack, identity anomalies, misconfiguration drift, and active incidents — continuously updated.",
    workflow: [
      { label: "Threat Twin", detail: "CVE feeds, identity signals, and endpoint telemetry assembled into a structured exposure model" },
      { label: "Exposure & Readiness", detail: "CISA KEV urgency, patch gaps, and privilege anomalies surfaced with blast radius scoring" },
      { label: "Governance Review", detail: "Analyst reviews finding with NIST NVD context and playbook recommendation" },
      { label: "Response Action Queue", detail: "Remediation steps routed to the right analyst through Alloy with SLA tracking" },
      { label: "Traceability", detail: "Every investigation step, decision, and action logged with full attribution for compliance" },
    ],
    outputs: ["SOC command surface", "Threat exposure dashboard", "Incident response queue", "Compliance audit trail", "Vulnerability remediation tracker"],
    signals: ["CISA KEV (known exploited vulns)", "NIST NVD (vulnerability database)", "Microsoft Security feeds", "Identity and endpoint telemetry"],
    trust: ["Human-in-the-loop on all remediation actions", "Analyst attribution on every decision", "Compliance-ready audit trail (SOC 2, ISO 27001)", "No autonomous execution without approval"],
    ctaLabel: "See Aegis",
    ctaHref: "/aegis-public",
  },
  {
    id: "lyte",
    name: "Lyte",
    tagline: "Cross-pack executive command and portfolio intelligence",
    description: "The executive command layer above all packs. Lyte surfaces cross-portfolio pressure, movement, blockers, and action routing — so leadership sees the whole operational picture.",
    icon: BarChart3,
    accentColor: "hsl(192,80%,48%)",
    accentRgb: "6,182,212",
    twin: "Portfolio Command Surface",
    twinDescription: "A unified view across every pack — PRISM Counsel, Terra, Vessels, Aegis, Carlota Jo — showing portfolio pressure, open blockers, pending approvals, and escalation status.",
    workflow: [
      { label: "Portfolio Pressure", detail: "Cross-pack signals aggregated — what's stuck, what's at risk, what needs leadership attention" },
      { label: "Movement Tracking", detail: "Progress across all active workflows surfaced with velocity and delay scoring" },
      { label: "Blocker Detection", detail: "Approval bottlenecks, ownership gaps, and SLA breaches surfaced before they compound" },
      { label: "Action Routing", detail: "High-priority items escalated into Alloy with context and recommended action" },
    ],
    outputs: ["Executive portfolio dashboard", "Cross-pack pressure feed", "Blocker and escalation queue", "Approval pipeline view", "Portfolio health summary"],
    signals: ["All connected pack signals", "Approval queue telemetry", "Workflow velocity metrics", "Exception and escalation feeds"],
    trust: ["Role-based views by pack and permission", "No raw data exposure at executive level", "Attribution on every escalation", "Audit trail for governance review"],
    ctaLabel: "See Lyte",
    ctaHref: "/lyte",
  },
  {
    id: "carlota-jo",
    name: "Carlota Jo",
    tagline: "Premium service experience and discreet operations",
    description: "A premium advisory and client service platform designed for discretion, trust, and operational precision. Secure intake, managed service flows, and discreet delivery.",
    icon: Users,
    accentColor: "hsl(280,50%,62%)",
    accentRgb: "152,100,188",
    twin: "Client Service Record",
    twinDescription: "A live structured record of each client engagement — intake details, service scope, active workflows, communication log, and delivery status — with full access control.",
    workflow: [
      { label: "Secure Intake", detail: "Client onboarding through a governed intake flow with identity verification and scope definition" },
      { label: "Service Flow", detail: "Active engagement tracked through structured milestones with status visibility for both sides" },
      { label: "Communication Log", detail: "All client communications logged with attribution, context, and retrieval-ready organization" },
      { label: "Discreet Delivery", detail: "Deliverables packaged and delivered through controlled channels with confirmation tracking" },
    ],
    outputs: ["Client engagement dashboard", "Intake and onboarding workflow", "Service milestone tracker", "Communication archive", "Delivery confirmation record"],
    signals: ["Client intake submissions", "Service delivery milestones", "Communication timeline", "Internal team workflows"],
    trust: ["End-to-end access control — client sees only their record", "Discreet by design — no cross-client data exposure", "Operator attribution on every action", "Complete engagement audit trail"],
    ctaLabel: "See Carlota Jo",
    ctaHref: "/carlota-jo-public",
  },
];

function WorkflowVisualizer({ pack }: { pack: Pack }) {
  const [activeStep, setActiveStep] = useState(0);
  const step = pack.workflow[activeStep];

  return (
    <div>
      <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.875rem" }}>
        Flagship Workflow
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "1rem" }}>
        {pack.workflow.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 600,
              cursor: "pointer",
              background: i === activeStep ? `rgba(${pack.accentRgb}, 0.15)` : "transparent",
              border: i === activeStep ? `1px solid rgba(${pack.accentRgb}, 0.4)` : "1px solid hsla(0,0%,100%,0.07)",
              color: i === activeStep ? pack.accentColor : "hsl(210,5%,42%)",
              transition: "all 0.18s",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {i < activeStep && <CheckCircle size={8} style={{ color: pack.accentColor, opacity: 0.7 }} />}
            {i === activeStep && <ChevronRight size={8} style={{ color: pack.accentColor }} />}
            {s.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <m.div
          key={activeStep}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          style={{
            padding: "1rem",
            borderRadius: "8px",
            background: `rgba(${pack.accentRgb}, 0.04)`,
            border: `1px solid rgba(${pack.accentRgb}, 0.14)`,
            marginBottom: "0.875rem",
          }}
        >
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: pack.accentColor, marginBottom: "0.375rem" }}>
            Step {activeStep + 1} of {pack.workflow.length} — {step.label}
          </p>
          <p style={{ fontSize: "13px", lineHeight: 1.65, color: "hsl(210,5%,62%)" }}>{step.detail}</p>
        </m.div>
      </AnimatePresence>
      <div style={{ display: "flex", gap: "0.375rem" }}>
        <button
          onClick={() => setActiveStep(s => Math.max(0, s - 1))}
          disabled={activeStep === 0}
          style={{ padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, cursor: activeStep === 0 ? "not-allowed" : "pointer", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", color: activeStep === 0 ? "hsl(210,5%,28%)" : "hsl(210,5%,50%)", display: "flex", alignItems: "center", gap: "4px", transition: "all 0.15s" }}
        >
          <ArrowLeft size={10} /> Back
        </button>
        {activeStep < pack.workflow.length - 1 ? (
          <button
            onClick={() => setActiveStep(s => s + 1)}
            style={{ padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: `rgba(${pack.accentRgb}, 0.10)`, border: `1px solid rgba(${pack.accentRgb}, 0.25)`, color: pack.accentColor, display: "flex", alignItems: "center", gap: "4px", transition: "all 0.15s" }}
          >
            Next <ArrowRight size={10} />
          </button>
        ) : (
          <div style={{ padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, background: "hsla(142,62%,46%,0.08)", border: "1px solid hsla(142,62%,46%,0.22)", color: "hsl(142,55%,60%)", display: "flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle size={10} /> Complete
          </div>
        )}
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [selectedPack, setSelectedPack] = useState(0);
  const [accessForm, setAccessForm] = useState({ name: "", email: "", company: "", pack: "" });
  const [accessErrors, setAccessErrors] = useState<Record<string, string>>({});
  const [accessSubmitting, setAccessSubmitting] = useState(false);
  const [accessSent, setAccessSent] = useState(false);

  const pack = PACKS[selectedPack];

  usePageMeta({
    title: "Demo — Product Overview | SZL Holdings",
    description: "Explore each SZL Holdings product: PRISM Counsel, Terra, Vessels, Aegis, Lyte, and Carlota Jo. See the flagship workflow for each pack and request controlled access.",
    canonical: "https://szlholdings.com/demo",
  });

  const validateAccess = () => {
    const e: Record<string, string> = {};
    if (!accessForm.name.trim()) e.name = "Name is required";
    if (!accessForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accessForm.email)) e.email = "Valid work email required";
    if (!accessForm.company.trim()) e.company = "Company is required";
    return e;
  };

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateAccess();
    if (Object.keys(errs).length > 0) { setAccessErrors(errs); return; }
    setAccessErrors({});
    setAccessSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/holdings/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: accessForm.name.trim(),
          email: accessForm.email.trim(),
          company: accessForm.company.trim(),
          subject: `Demo Access Request — ${pack.name}`,
          message: `Demo access request from ${accessForm.name.trim()} at ${accessForm.company.trim()} for ${pack.name}. Email: ${accessForm.email.trim()}`,
        }),
      });
      if (response.status === 201 || response.ok) {
        setAccessSent(true);
        toast.success("Request received. We'll follow up within 24 hours.");
      } else {
        setAccessErrors({ general: "Submission failed. Please try again or email inquiries@szlholdings.com." });
      }
    } catch {
      setAccessErrors({ general: "Network error. Please check your connection and try again." });
    } finally {
      setAccessSubmitting(false);
    }
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: "hsla(0,0%,100%,0.04)",
    border: `1px solid ${hasError ? "hsla(0,72%,55%,0.5)" : "hsla(0,0%,100%,0.09)"}`,
    borderRadius: "6px",
    color: "hsl(38,12%,88%)",
    fontSize: "13.5px",
    outline: "none",
    transition: "border-color 0.18s",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  });

  const PackIcon = pack.icon;

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main className="pt-24">

        {/* Hero */}
        <section style={{ padding: "3rem 0 2rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Eye size={12} style={{ color: "hsl(192,80%,48%)" }} />
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)" }}>
                  Product Demo — Controlled Access Preview
                </p>
              </div>
              <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.1, marginBottom: "0.875rem" }}>
                Choose a product. See how it works.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(210,5%,58%)", maxWidth: "44rem" }}>
                Each SZL Holdings product has a twin at its core, a signal layer feeding it, and a governed workflow above it. Select a pack to see the flagship workflow, the data sources powering it, and the trust controls governing it.
              </p>
            </m.div>
          </div>
        </section>

        {/* Pack selector */}
        <section style={{ padding: "0 0 1.5rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
              {PACKS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPack(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: i === selectedPack ? `rgba(${p.accentRgb}, 0.10)` : "hsla(0,0%,100%,0.03)",
                      border: i === selectedPack ? `1px solid rgba(${p.accentRgb}, 0.35)` : "1px solid hsla(0,0%,100%,0.07)",
                      color: i === selectedPack ? p.accentColor : "hsl(210,5%,52%)",
                      transition: "all 0.2s",
                    }}
                  >
                    <Icon size={13} />
                    {p.name}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <m.div
                key={pack.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Pack header */}
                <div style={{ marginBottom: "1.5rem", padding: "1.5rem 2rem", borderRadius: "12px", background: `rgba(${pack.accentRgb}, 0.04)`, border: `1px solid rgba(${pack.accentRgb}, 0.14)`, position: "relative" }}>
                  <DataStateBadge state="DEMO DATA" position="top-right" />
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${pack.accentRgb}, 0.12)`, border: `1px solid rgba(${pack.accentRgb}, 0.25)`, flexShrink: 0 }}>
                      <PackIcon size={18} style={{ color: pack.accentColor }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.375rem" }}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,92%)" }}>{pack.name}</h2>
                        <span style={{ fontSize: "11px", color: pack.accentColor, fontWeight: 600, letterSpacing: "0.05em" }}>{pack.tagline}</span>
                      </div>
                      <p style={{ fontSize: "14px", lineHeight: 1.65, color: "hsl(210,5%,58%)", maxWidth: "56rem" }}>{pack.description}</p>
                    </div>
                  </div>
                </div>

                {/* Main content grid */}
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  {/* Left: Workflow */}
                  <div style={{ padding: "1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                    <WorkflowVisualizer pack={pack} />
                  </div>

                  {/* Right: Twin + Signals + Trust */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    <div style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                        <Database size={12} style={{ color: pack.accentColor }} />
                        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: pack.accentColor }}>
                          {pack.twin}
                        </p>
                      </div>
                      <p style={{ fontSize: "13px", lineHeight: 1.6, color: "hsl(210,5%,58%)" }}>{pack.twinDescription}</p>
                    </div>

                    <div style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.625rem" }}>
                        Signal Sources
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {pack.signals.map((s, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: pack.accentColor, flexShrink: 0, opacity: 0.7 }} />
                            <span style={{ fontSize: "12.5px", color: "hsl(210,5%,60%)" }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                        <Lock size={12} style={{ color: "hsl(210,5%,45%)" }} />
                        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)" }}>
                          Trust Controls
                        </p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {pack.trust.map((t, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                            <Shield size={11} style={{ color: "hsl(210,5%,42%)", marginTop: "2px", flexShrink: 0 }} />
                            <span style={{ fontSize: "12.5px", lineHeight: 1.5, color: "hsl(210,5%,60%)" }}>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outputs row */}
                <div style={{ padding: "1.25rem 1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.75rem" }}>
                    Output Types
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {pack.outputs.map((o, i) => (
                      <span key={i} style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "11.5px", fontWeight: 500, background: `rgba(${pack.accentRgb}, 0.07)`, border: `1px solid rgba(${pack.accentRgb}, 0.18)`, color: "hsl(210,5%,65%)" }}>
                        {o}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pack CTA */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Link
                    href={pack.ctaHref}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.625rem 1.25rem", borderRadius: "8px", fontSize: "13px", fontWeight: 700, background: `rgba(${pack.accentRgb}, 0.10)`, border: `1px solid rgba(${pack.accentRgb}, 0.28)`, color: pack.accentColor, textDecoration: "none", transition: "all 0.18s" }}
                  >
                    {pack.ctaLabel} <ArrowRight size={13} />
                  </Link>
                  <span style={{ fontSize: "12px", color: "hsl(210,5%,38%)" }}>or scroll down to request controlled access</span>
                </div>
              </m.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Trust governance overlay */}
        <section style={{ padding: "2rem 0 2.5rem", borderTop: "1px solid hsla(0,0%,100%,0.05)", borderBottom: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,4%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,5%,38%)", marginBottom: "1.25rem" }}>
                Trust & Governance — Across All Packs
              </p>
              <div className="grid lg:grid-cols-4 gap-4">
                {[
                  { icon: Shield, label: "Human Approval Gates", body: "Every consequential action requires explicit human approval. No autonomous execution." },
                  { icon: Lock, label: "Privilege & Access Control", body: "Role-based access, pack-level isolation, and no cross-tenant data exposure." },
                  { icon: FileText, label: "Immutable Audit Trail", body: "Every action, approval, and AI use is logged with full attribution and exportable." },
                  { icon: Eye, label: "Source-Grounded AI", body: "No hallucinated recommendations. Every AI output is tied to a source citation." },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.07 }}
                      style={{ padding: "1.125rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <Icon size={13} style={{ color: "hsl(210,5%,48%)" }} />
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,80%)" }}>{item.label}</p>
                      </div>
                      <p style={{ fontSize: "12px", lineHeight: 1.6, color: "hsl(210,5%,52%)" }}>{item.body}</p>
                    </m.div>
                  );
                })}
              </div>
            </m.div>
          </div>
        </section>

        {/* Request access */}
        <section style={{ padding: "3rem 0 5rem", background: "hsl(210,12%,5%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                  Request Controlled Access
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 700, letterSpacing: "-0.022em", color: "hsl(38,12%,92%)", marginBottom: "0.875rem" }}>
                  Ready to see it in your environment?
                </h2>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "hsl(210,5%,55%)", maxWidth: "30rem", marginBottom: "1.5rem" }}>
                  We run focused design partner engagements — each product instrumented against your actual operational data. You see real signals, real routing, and a real audit trail against your environment.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[
                    "3-month design partner engagement",
                    "Real data, not a sandbox",
                    "Human approval gates from day one",
                    "Full audit trail and governance controls",
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <CheckCircle size={12} style={{ color: "hsl(142,55%,52%)" }} />
                      <span style={{ fontSize: "13px", color: "hsl(210,5%,58%)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </m.div>

              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }} style={{ padding: "1.75rem", borderRadius: "12px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                {accessSent ? (
                  <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                    <CheckCircle size={28} style={{ color: "hsl(142,62%,50%)", margin: "0 auto 0.875rem" }} />
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: "0.375rem" }}>Request received.</p>
                    <p style={{ fontSize: "13px", color: "hsl(210,5%,52%)" }}>We'll follow up within 24 hours to schedule a conversation.</p>
                  </div>
                ) : (
                  <form onSubmit={handleAccessRequest} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,72%)", marginBottom: "0.25rem" }}>
                      Requesting access for: <span style={{ color: pack.accentColor }}>{pack.name}</span>
                    </p>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "hsl(210,5%,50%)", marginBottom: "0.3rem" }}>Name *</label>
                      <input type="text" placeholder="Your name" value={accessForm.name} onChange={(e) => { setAccessForm(p => ({ ...p, name: e.target.value })); if (accessErrors.name) setAccessErrors(p => { const n = { ...p }; delete n.name; return n; }); }} style={inputStyle(!!accessErrors.name)} />
                      {accessErrors.name && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.2rem" }}>{accessErrors.name}</p>}
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "hsl(210,5%,50%)", marginBottom: "0.3rem" }}>Work Email *</label>
                      <input type="email" placeholder="you@company.com" value={accessForm.email} onChange={(e) => { setAccessForm(p => ({ ...p, email: e.target.value })); if (accessErrors.email) setAccessErrors(p => { const n = { ...p }; delete n.email; return n; }); }} style={inputStyle(!!accessErrors.email)} />
                      {accessErrors.email && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.2rem" }}>{accessErrors.email}</p>}
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "hsl(210,5%,50%)", marginBottom: "0.3rem" }}>Company *</label>
                      <input type="text" placeholder="Organization" value={accessForm.company} onChange={(e) => { setAccessForm(p => ({ ...p, company: e.target.value })); if (accessErrors.company) setAccessErrors(p => { const n = { ...p }; delete n.company; return n; }); }} style={inputStyle(!!accessErrors.company)} />
                      {accessErrors.company && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.2rem" }}>{accessErrors.company}</p>}
                    </div>
                    {accessErrors.general && <p style={{ fontSize: "12px", color: "hsl(0,72%,65%)" }}>{accessErrors.general}</p>}
                    <button
                      type="submit"
                      disabled={accessSubmitting}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "0.75rem 1.25rem", background: "hsl(38,12%,86%)", border: "none", borderRadius: "6px", color: "hsl(210,12%,6%)", fontSize: "13px", fontWeight: 700, cursor: accessSubmitting ? "not-allowed" : "pointer", opacity: accessSubmitting ? 0.7 : 1, transition: "all 0.18s", fontFamily: "inherit" }}
                    >
                      {accessSubmitting ? "Sending…" : "Request Controlled Access"} {!accessSubmitting && <ArrowRight size={13} strokeWidth={2.5} />}
                    </button>
                    <p style={{ fontSize: "11px", color: "hsl(210,5%,38%)", lineHeight: 1.5 }}>
                      We respond within 24 hours. No commitment required to start the conversation.
                    </p>
                  </form>
                )}
              </m.div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
