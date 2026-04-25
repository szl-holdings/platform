import React, { useState, useEffect, useRef } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Shield, Brain, GitBranch, FileText, Network,
  Layers, Download, CheckCircle, XCircle, Minus, ChevronRight,
  Lock, Eye, Cpu, Activity
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  generatePhilosophyPDF,
  generateCompetitiveBriefPDF,
  getPhilosophyPDFBlobUrl,
  getCompetitiveBriefPDFBlobUrl,
} from "@/lib/a11oy-pdf";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const ELEMENTS = [
  {
    icon: Brain,
    label: "Human Judgment",
    tagline: "The irreducible core",
    body: "Machines classify. Machines rank. Machines recommend. But consequential decisions — the ones with real stakes, real accountability, real exposure — require a human to own them. A11OY doesn't try to remove human judgment. It makes human judgment sharper, faster, and traceable.",
    color: "var(--color-lyte)",
    muted: "var(--color-lyte-muted)",
    border: "var(--color-lyte-border)",
  },
  {
    icon: Cpu,
    label: "Machine Intelligence",
    tagline: "Signal at scale",
    body: "Enterprise environments produce more signal than any human team can process manually. Machine intelligence — pattern recognition, correlation, anomaly detection, probabilistic modeling — handles the scale problem. The machine doesn't decide. It surfaces, ranks, and prepares the decision for the human who does.",
    color: "var(--color-alloy-light)",
    muted: "var(--color-alloy-muted)",
    border: "var(--color-alloy-border)",
  },
  {
    icon: Shield,
    label: "Structural Governance",
    tagline: "The architecture of trust",
    body: "Governance that lives in documentation is theater. Governance that lives in the architecture is structural. A11OY builds governance into the execution layer — not as a UI overlay, not as a configurable feature, but as the actual execution fabric. The approval gate is in the code. The policy is enforced before execution, not reviewed after.",
    color: "#9b7cc8",
    muted: "rgba(155, 124, 200, 0.09)",
    border: "rgba(155, 124, 200, 0.18)",
  },
  {
    icon: FileText,
    label: "Provable Accountability",
    tagline: "Show your work",
    body: "In the age of AI-assisted decisions, accountability requires evidence. Who approved this? On what basis? With what confidence? A11OY's Proof Chain answers every question: a SHA-256 hashed, tamper-evident, actor-attributed record of every consequential action in the system. Not logging. Proof.",
    color: "var(--color-terra)",
    muted: "var(--color-terra-muted)",
    border: "rgba(91, 170, 138, 0.18)",
  },
];

const PRIMITIVES = [
  {
    number: "01",
    icon: FileText,
    name: "Proof Chain",
    a11oy: "Provable Accountability realized as architecture. Every decision attributed, timestamped, and hashed. Not log files — proof.",
    color: "var(--color-terra)",
  },
  {
    number: "02",
    icon: Shield,
    name: "Covenant Policy",
    a11oy: "Structural Governance made executable. Policy that lives in the execution layer, not the documentation layer. Human-in-the-loop is structural, not optional.",
    color: "#9b7cc8",
  },
  {
    number: "03",
    icon: Activity,
    name: "Outcome Graph",
    a11oy: "Human Judgment made cumulative. Every decision feeds the graph — acceptance rates, outcome deviations, calibration data. Judgment improves with use.",
    color: "var(--color-lyte)",
  },
  {
    number: "04",
    icon: GitBranch,
    name: "Monte Carlo Engine",
    a11oy: "Machine Intelligence given honest uncertainty. Not a confident answer — a probability distribution. Operators see the range of consequences before they decide.",
    color: "var(--color-alloy-light)",
  },
  {
    number: "05",
    icon: Network,
    name: "Event Fabric",
    a11oy: "Machine Intelligence operating at platform scale. Cross-domain signal correlation that no single-domain tool can produce. Each new domain multiplies the insight.",
    color: "var(--color-vessels)",
  },
  {
    number: "06",
    icon: Layers,
    name: "Domain-Pack Architecture",
    a11oy: "Structural Governance without structural tax. New domains inherit the full governance stack from day one — Proof Chain, Covenant Policy, approval gates, audit trail — at zero marginal governance cost.",
    color: "var(--color-szl-accent)",
  },
];

const LOOP = [
  { step: "Signal", desc: "Machine intelligence acquires and normalizes cross-domain signals at scale.", icon: Activity },
  { step: "Surface", desc: "Evaluated, ranked, and contextualized — the right signal at the right moment.", icon: Eye },
  { step: "Recommend", desc: "AI proposes, with evidence, confidence intervals, and consequence modeling.", icon: Cpu },
  { step: "Gate", desc: "Structural Governance intercepts every consequential action before execution.", icon: Lock },
  { step: "Decide", desc: "Human Judgment owns the consequential decision. Ownership is clear and non-delegable.", icon: Brain },
  { step: "Prove", desc: "Provable Accountability records the full chain — who, what, why, when, with what authority.", icon: FileText },
];

type CompetitorRating = "strong" | "partial" | "gap";

interface Competitor {
  name: string;
  category: string;
  strength: string;
  gap: string;
  ratings: {
    aiIntelligence: CompetitorRating;
    workflowOrchestration: CompetitorRating;
    humanInTheLoop: CompetitorRating;
    auditTrail: CompetitorRating;
    crossDomain: CompetitorRating;
    decisionAccountability: CompetitorRating;
  };
}

const COMPETITORS: Competitor[] = [
  {
    name: "Palantir AIP / Foundry",
    category: "Intelligence Platform",
    strength: "World-class data integration and intelligence layer. Exceptional at making sense of complex, heterogeneous enterprise data at scale.",
    gap: "Intelligence without governed execution. Foundry surfaces insight — but the translation from insight to governed, auditable action falls outside the platform. Accountability for what the human did with the intelligence is not structurally enforced.",
    ratings: {
      aiIntelligence: "strong",
      workflowOrchestration: "partial",
      humanInTheLoop: "partial",
      auditTrail: "partial",
      crossDomain: "strong",
      decisionAccountability: "gap",
    },
  },
  {
    name: "ServiceNow",
    category: "Workflow Platform",
    strength: "The enterprise standard for IT workflow, ticketing, and service management. Deep integrations with existing enterprise systems and strong ITSM governance.",
    gap: "Workflow without AI governance. ServiceNow orchestrates process well, but its AI layer (Now Assist) operates as a productivity overlay — not as a governed decision engine with traceable reasoning, approval gates, and decision accountability.",
    ratings: {
      aiIntelligence: "partial",
      workflowOrchestration: "strong",
      humanInTheLoop: "partial",
      auditTrail: "partial",
      crossDomain: "partial",
      decisionAccountability: "gap",
    },
  },
  {
    name: "C3.ai",
    category: "Enterprise AI Platform",
    strength: "Strong predictive analytics and industry-specific AI applications. Serious depth in asset-intensive industries — energy, manufacturing, defense.",
    gap: "Analytics without decision accountability. C3.ai surfaces predictions and anomalies effectively, but the decision layer — who acted on this, what they approved, what actually happened — is not governed or audited at the platform level.",
    ratings: {
      aiIntelligence: "strong",
      workflowOrchestration: "partial",
      humanInTheLoop: "gap",
      auditTrail: "partial",
      crossDomain: "partial",
      decisionAccountability: "gap",
    },
  },
  {
    name: "UiPath / Automation Anywhere",
    category: "RPA & Automation",
    strength: "Market leaders in robotic process automation. Exceptional at automating repetitive, rule-based workflows across enterprise systems without code changes.",
    gap: "Task automation without decision governance. RPA automates execution — but consequential decisions (approvals, exceptions, judgment calls) are handled by humans outside the platform, without structural accountability or audit trail integration.",
    ratings: {
      aiIntelligence: "partial",
      workflowOrchestration: "strong",
      humanInTheLoop: "gap",
      auditTrail: "partial",
      crossDomain: "partial",
      decisionAccountability: "gap",
    },
  },
  {
    name: "Microsoft Copilot Studio",
    category: "AI Agent Platform",
    strength: "Deeply embedded in the Microsoft ecosystem. Fast deployment of AI agents across Teams, SharePoint, and M365 with strong low-code tooling.",
    gap: "AI agents without structural human-in-the-loop. Copilot Studio offers human escalation as a configurable option — not as a structural governance layer. Enterprise trust requires that consequential actions cannot be bypassed even by configuration. That guarantee doesn't exist here.",
    ratings: {
      aiIntelligence: "partial",
      workflowOrchestration: "partial",
      humanInTheLoop: "partial",
      auditTrail: "partial",
      crossDomain: "partial",
      decisionAccountability: "partial",
    },
  },
  {
    name: "LangChain / CrewAI",
    category: "Agent Framework",
    strength: "The fastest path to building multi-agent workflows. Rich tooling for agent orchestration, tool use, and reasoning chains. Strong open-source community.",
    gap: "Agent frameworks without enterprise trust infrastructure. LangChain and CrewAI are excellent engineering primitives — but they provide no Proof Chain, no Covenant Policy, no structural approval gates, no tenant isolation, and no decision accountability. Building enterprise-grade governance on top of them requires rebuilding what A11OY already is.",
    ratings: {
      aiIntelligence: "strong",
      workflowOrchestration: "partial",
      humanInTheLoop: "gap",
      auditTrail: "gap",
      crossDomain: "partial",
      decisionAccountability: "gap",
    },
  },
];

const MATRIX_COLS = [
  { key: "aiIntelligence", label: "AI Intelligence" },
  { key: "workflowOrchestration", label: "Workflow" },
  { key: "humanInTheLoop", label: "Human-in-Loop" },
  { key: "auditTrail", label: "Audit Trail" },
  { key: "crossDomain", label: "Cross-Domain" },
  { key: "decisionAccountability", label: "Decision Accountability" },
] as const;

const ONLY_A11OY = [
  "Structural human-in-the-loop governance that cannot be configured away — enforced at the execution layer, not the UI layer.",
  "A cryptographically verifiable, SHA-256 hashed Proof Chain that records every consequential action with actor attribution, reasoning, and authorization basis.",
  "Monte Carlo probabilistic simulation before action — operators see the probability distribution of consequences before they decide, not just a recommendation.",
  "Cross-domain signal correlation that grows in value with every domain pack added — intelligence no single-domain tool can produce.",
  "A domain-pack architecture where every new vertical inherits the full governance stack at zero marginal governance cost.",
  "An enterprise MCP gateway with 23+ governed tools, role enforcement, tenant isolation, and immutable audit logging for AI agent operations.",
];

function RatingIcon({ rating }: { rating: CompetitorRating }) {
  if (rating === "strong") return <CheckCircle size={14} style={{ color: "var(--color-szl-success)", flexShrink: 0 }} />;
  if (rating === "partial") return <Minus size={14} style={{ color: "var(--color-szl-warning)", flexShrink: 0 }} />;
  return <XCircle size={14} style={{ color: "var(--color-szl-danger)", flexShrink: 0 }} />;
}

function RatingCell({ rating }: { rating: CompetitorRating }) {
  const colors = {
    strong: { bg: "rgba(91,170,138,0.08)", border: "rgba(91,170,138,0.16)", text: "var(--color-szl-success)", label: "Strong" },
    partial: { bg: "rgba(201,168,92,0.08)", border: "rgba(201,168,92,0.16)", text: "var(--color-szl-warning)", label: "Partial" },
    gap: { bg: "rgba(201,96,112,0.08)", border: "rgba(201,96,112,0.16)", text: "var(--color-szl-danger)", label: "Gap" },
  };
  const c = colors[rating];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.375rem",
      padding: "0.25rem 0.5rem", borderRadius: "4px",
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: "0.6875rem", fontWeight: 600, color: c.text,
      fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      <RatingIcon rating={rating} />
      {c.label}
    </div>
  );
}

function DocumentPreview({
  title,
  subtitle,
  pages,
  description,
  accentColor,
  onDownload,
  downloading,
  pdfBlobUrl,
}: {
  title: string;
  subtitle: string;
  pages: string;
  description: string;
  accentColor: string;
  onDownload: () => void;
  downloading: boolean;
  pdfBlobUrl?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Embedded PDF preview */}
      <div style={{
        position: "relative",
        borderRadius: "0.5rem",
        overflow: "hidden",
        border: `1px solid ${accentColor}30`,
        background: "hsla(214,14%,7%,0.8)",
      }}>
        {/* Label bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.5rem 0.875rem",
          borderBottom: `1px solid ${accentColor}20`,
          background: `${accentColor}08`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={12} color={accentColor} />
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "0.5625rem",
              fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase",
              color: accentColor,
            }}>Document Preview</span>
          </div>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "0.5rem",
            color: "hsl(214,7%,45%)", letterSpacing: "0.06em",
          }}>PDF · {pages}</span>
        </div>

        {/* iframe embed or placeholder */}
        {pdfBlobUrl ? (
          <iframe
            src={pdfBlobUrl}
            title={title}
            style={{
              display: "block",
              width: "100%",
              height: "520px",
              border: "none",
              background: "#0d1117",
            }}
          />
        ) : (
          /* Cover art while loading */
          <div style={{
            height: "520px",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "1rem",
            backgroundImage: `linear-gradient(${accentColor}06 1px, transparent 1px), linear-gradient(to right, ${accentColor}06 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}>
            <div style={{
              width: "80px", height: "104px",
              background: "hsla(214,14%,10%,1)",
              border: `2px solid ${accentColor}40`,
              borderRadius: "4px",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "8px",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: "3px", background: accentColor, borderRadius: "4px 4px 0 0",
              }} />
              <FileText size={24} color={accentColor} style={{ opacity: 0.7 }} />
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "0.4rem",
                color: "hsl(214,7%,50%)", textAlign: "center",
                letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "0 8px",
              }}>Rendering…</div>
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "0.625rem",
              color: "hsl(214,7%,40%)", letterSpacing: "0.06em",
            }}>Building PDF preview…</div>
          </div>
        )}
      </div>

      {/* Description and download */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "0.5625rem",
            fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase",
            color: accentColor, marginBottom: "0.375rem",
          }}>SZL Holdings · 2026</div>
          <h3 style={{
            fontSize: "clamp(1rem,2vw,1.125rem)", fontWeight: 700,
            letterSpacing: "-0.02em", lineHeight: 1.2,
            color: "hsl(38,8%,92%)", marginBottom: "0.5rem",
          }}>{title}</h3>
          <p style={{
            fontSize: "0.8125rem", lineHeight: 1.7,
            color: "hsl(214,7%,60%)", maxWidth: "64ch",
          }}>{description}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={onDownload}
            disabled={downloading}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              background: downloading ? "hsla(0,0%,100%,0.04)" : `${accentColor}12`,
              border: `1px solid ${accentColor}${downloading ? "20" : "35"}`,
              color: downloading ? "hsl(214,7%,50%)" : accentColor,
              borderRadius: "0.375rem",
              fontSize: "0.8125rem", fontWeight: 600,
              cursor: downloading ? "not-allowed" : "pointer",
              transition: "all 0.18s ease",
              fontFamily: "var(--font-display)",
            }}
          >
            <Download size={13} />
            {downloading ? "Generating PDF…" : "Download PDF"}
          </button>
          <span style={{
            fontSize: "0.6875rem", color: "hsl(214,7%,35%)",
            fontFamily: "var(--font-mono)",
          }}>
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function A11oyPhilosophyPage() {
  const __pageMeta = usePageMeta({
    title: "A11OY Philosophy & Competitive Positioning | SZL Holdings",
    description: "A11OY is the governing philosophy behind Counsel: human judgment, machine intelligence, structural governance, and provable accountability — fused into something stronger than any single part. How it positions against Palantir, ServiceNow, C3.ai, UiPath, Microsoft Copilot Studio, and LangChain.",
    canonical: "https://szlholdings.com/a11oy",
  });

  const [downloadingWhitepaper, setDownloadingWhitepaper] = useState(false);
  const [downloadingBrief, setDownloadingBrief] = useState(false);
  const [whitepaperBlobUrl, setWhitepaperBlobUrl] = useState<string | undefined>();
  const [briefBlobUrl, setBriefBlobUrl] = useState<string | undefined>();
  const blobUrlsGeneratedRef = useRef(false);

  const whitepaperBlobUrlRef = useRef<string | undefined>(undefined);
  const briefBlobUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (blobUrlsGeneratedRef.current) return;
    blobUrlsGeneratedRef.current = true;
    const timer = setTimeout(() => {
      try {
        const url = getPhilosophyPDFBlobUrl();
        whitepaperBlobUrlRef.current = url;
        setWhitepaperBlobUrl(url);
      } catch (err) {
        console.error("[A11OY] Failed to generate philosophy PDF preview:", err);
      }
      try {
        const url = getCompetitiveBriefPDFBlobUrl();
        briefBlobUrlRef.current = url;
        setBriefBlobUrl(url);
      } catch (err) {
        console.error("[A11OY] Failed to generate competitive brief PDF preview:", err);
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      if (whitepaperBlobUrlRef.current) URL.revokeObjectURL(whitepaperBlobUrlRef.current);
      if (briefBlobUrlRef.current) URL.revokeObjectURL(briefBlobUrlRef.current);
    };
  }, []);

  const handleDownloadWhitepaper = () => {
    setDownloadingWhitepaper(true);
    try {
      generatePhilosophyPDF();
    } finally {
      setDownloadingWhitepaper(false);
    }
  };

  const handleDownloadBrief = () => {
    setDownloadingBrief(true);
    try {
      generateCompetitiveBriefPDF();
    } finally {
      setDownloadingBrief(false);
    }
  };

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >

          {/* ── Hero ── */}
          <section
            className="szl-grid-texture"
            style={{
              paddingTop: "var(--space-hero-pt)",
              paddingBottom: "clamp(5rem,9vw,7rem)",
              borderBottom: "1px solid var(--color-szl-border)",
              background: "radial-gradient(ellipse 70% 60% at 50% -5%, rgba(212,160,84,0.05) 0%, transparent 65%)",
            }}
          >
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="szl-badge" style={{ borderRadius: "9999px", marginBottom: "1.75rem", display: "inline-block" }}>
                  A11OY · The Governing Philosophy
                </span>
              </m.div>
              <div style={{ maxWidth: "800px" }}>
                <m.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  style={{
                    fontSize: "clamp(2.75rem,6vw,4.5rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.035em",
                    lineHeight: 1.03,
                    marginBottom: "1.5rem",
                  }}
                >
                  Autonomy without governance is reckless.
                  <span style={{ color: "var(--color-szl-accent)" }}> Governance without autonomy is paralysis.</span>
                </m.h1>
                <m.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.12 }}
                  style={{
                    fontSize: "clamp(1rem,1.9vw,1.1875rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,62%)",
                    maxWidth: "58ch",
                    marginBottom: "0.875rem",
                  }}
                >
                  A11OY is the fusion. The name is not a product. It is a philosophy — the idea that great enterprise systems are alloys: multiple elements combined under pressure into something stronger than any single part.
                </m.p>
                <m.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.18 }}
                  style={{
                    fontSize: "clamp(0.9375rem,1.6vw,1rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,50%)",
                    maxWidth: "54ch",
                    marginBottom: "2.25rem",
                  }}
                >
                  Counsel is the platform. A11OY is what it's built on. Every primitive — Proof Chain, Covenant Policy, Outcome Graph, Monte Carlo, Event Fabric, Domain Packs — is an expression of this philosophy made architectural.
                </m.p>
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.22 }}
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}
                >
                  <a href="#competitive" className="szl-btn-primary">
                    Competitive Positioning <ArrowRight size={15} />
                  </a>
                  <a href="#downloads" className="szl-btn-secondary">
                    Download Whitepapers
                  </a>
                </m.div>
              </div>
            </div>
          </section>

          {/* ── The Alloy Metaphor ── */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: "3.5rem" }}
              >
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--color-szl-accent)", marginBottom: "1rem",
                }}>
                  The Alloy Metaphor
                </p>
                <h2 style={{
                  fontSize: "clamp(1.5rem,3.5vw,2.5rem)", fontWeight: 600,
                  letterSpacing: "-0.025em", lineHeight: 1.15, maxWidth: "28ch",
                  marginBottom: "1.25rem",
                }}>
                  Steel is stronger than iron. Not by subtraction — by fusion.
                </h2>
                <p style={{
                  fontSize: "0.9375rem", lineHeight: 1.75,
                  color: "hsl(214,7%,60%)", maxWidth: "58ch",
                }}>
                  Metallurgists discovered centuries ago that combining elements creates properties that neither possesses alone. Steel — iron and carbon — doesn't just add hardness. It creates a new material category. The same principle applies to enterprise AI systems. Human judgment and machine intelligence are not opponents. Structural governance and operational autonomy are not contradictions. They are elements. Combined correctly, under pressure, with precision — they form an alloy that no single element can replicate.
                </p>
              </m.div>

              {/* Four elements */}
              <div style={{ display: "grid", gap: "1.25rem" }} className="md:grid-cols-2 lg:grid-cols-4">
                {ELEMENTS.map((el, i) => {
                  const Icon = el.icon;
                  return (
                    <m.div
                      key={el.label}
                      custom={i}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      className="szl-card"
                      style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}
                    >
                      <div style={{
                        width: "38px", height: "38px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: el.muted, border: `1px solid ${el.border}`,
                        borderRadius: "0.5rem", marginBottom: "1.125rem",
                      }}>
                        <Icon size={17} color={el.color} />
                      </div>
                      <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "0.5625rem",
                        fontWeight: 600, color: el.color,
                        letterSpacing: "0.08em", textTransform: "uppercase",
                        marginBottom: "0.25rem",
                      }}>{el.tagline}</div>
                      <h3 style={{
                        fontSize: "1.0625rem", fontWeight: 700,
                        letterSpacing: "-0.015em", color: "hsl(38,8%,90%)",
                        marginBottom: "0.75rem",
                      }}>{el.label}</h3>
                      <p style={{
                        fontSize: "0.875rem", lineHeight: 1.70,
                        color: "hsl(214,7%,60%)",
                      }}>{el.body}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── The Six Primitives ── */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: "3rem" }}
              >
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--color-szl-accent)", marginBottom: "1rem",
                }}>
                  The Six Primitives
                </p>
                <h2 style={{
                  fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600,
                  letterSpacing: "-0.022em", lineHeight: 1.15, maxWidth: "32ch",
                  marginBottom: "1.125rem",
                }}>
                  Each primitive is A11OY in code — one element of the philosophy made executable.
                </h2>
                <p style={{
                  fontSize: "0.9375rem", lineHeight: 1.72,
                  color: "hsl(214,7%,60%)", maxWidth: "56ch",
                }}>
                  A11OY is not metaphor for its own sake. Every principle has a structural implementation. You can inspect the code. You can read the audit log. You can trace the approval. The philosophy is the architecture.
                </p>
              </m.div>

              <div className="szl-grid-3" style={{ gap: "1rem" }}>
                {PRIMITIVES.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <m.div
                      key={p.name}
                      custom={i}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      style={{
                        background: "hsla(214,12%,8%,0.6)",
                        border: "1px solid var(--color-szl-border)",
                        borderRadius: "0.875rem",
                        padding: "var(--space-card-pad)",
                        transition: "border-color 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                        <div style={{
                          width: "32px", height: "32px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(201,168,92,0.07)",
                          border: "1px solid rgba(201,168,92,0.14)",
                          borderRadius: "6px", flexShrink: 0,
                        }}>
                          <Icon size={14} color={p.color} />
                        </div>
                        <div>
                          <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "0.5rem",
                            fontWeight: 700, color: p.color,
                            letterSpacing: "0.1em", textTransform: "uppercase",
                          }}>{p.number}</div>
                          <h3 style={{
                            fontSize: "0.9375rem", fontWeight: 700,
                            letterSpacing: "-0.012em", color: "hsl(38,8%,88%)",
                          }}>{p.name}</h3>
                        </div>
                      </div>
                      <p style={{
                        fontSize: "0.875rem", lineHeight: 1.70,
                        color: "hsl(214,7%,60%)",
                      }}>{p.a11oy}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Governed Decision Loop ── */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: "3rem" }}
              >
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--color-szl-accent)", marginBottom: "1rem",
                }}>
                  A11OY's Operating Model
                </p>
                <h2 style={{
                  fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600,
                  letterSpacing: "-0.022em", lineHeight: 1.15, maxWidth: "32ch",
                  marginBottom: "1.125rem",
                }}>
                  The Governed Decision Loop: six stages, no shortcuts.
                </h2>
                <p style={{
                  fontSize: "0.9375rem", lineHeight: 1.72,
                  color: "hsl(214,7%,60%)", maxWidth: "52ch",
                }}>
                  Every consequential decision in an A11OY-built system follows the same arc. The elements don't take turns — they operate together, at each stage, as a unified system.
                </p>
              </m.div>

              <div style={{ display: "grid", gap: "1rem" }} className="md:grid-cols-2 lg:grid-cols-3">
                {LOOP.map((node, i) => {
                  const Icon = node.icon;
                  return (
                    <m.div
                      key={node.step}
                      custom={i}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      style={{
                        background: "hsla(214,12%,7%,0.7)",
                        border: "1px solid var(--color-szl-border)",
                        borderRadius: "0.875rem",
                        padding: "1.5rem",
                        position: "relative",
                      }}
                    >
                      <div style={{
                        display: "flex", alignItems: "flex-start",
                        gap: "0.875rem", marginBottom: "0.875rem",
                      }}>
                        <div style={{
                          width: "36px", height: "36px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "var(--color-szl-accent-muted)",
                          border: "1px solid rgba(201,168,92,0.18)",
                          borderRadius: "0.5rem", flexShrink: 0,
                        }}>
                          <Icon size={16} color="var(--color-szl-accent)" />
                        </div>
                        <div>
                          <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "0.5rem",
                            fontWeight: 700, letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "var(--color-szl-accent)", marginBottom: "0.2rem",
                          }}>Stage {String(i + 1).padStart(2, "0")}</div>
                          <h3 style={{
                            fontSize: "1.0625rem", fontWeight: 700,
                            letterSpacing: "-0.015em", color: "hsl(38,8%,90%)",
                          }}>{node.step}</h3>
                        </div>
                      </div>
                      <p style={{
                        fontSize: "0.875rem", lineHeight: 1.70,
                        color: "hsl(214,7%,62%)",
                      }}>{node.desc}</p>
                      {i < LOOP.length - 1 && (
                        <ChevronRight
                          size={16}
                          style={{
                            position: "absolute", right: "-0.625rem", top: "50%",
                            transform: "translateY(-50%)",
                            color: "hsl(214,7%,25%)",
                            display: "none",
                          }}
                          className="lg:block"
                        />
                      )}
                    </m.div>
                  );
                })}
              </div>

              {/* Synthesis bar */}
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.2 }}
                style={{
                  marginTop: "2rem",
                  padding: "1.5rem 2rem",
                  background: "rgba(201,168,92,0.05)",
                  border: "1px solid rgba(201,168,92,0.12)",
                  borderRadius: "0.75rem",
                  display: "flex", alignItems: "flex-start", gap: "1.25rem",
                }}
              >
                <div style={{
                  width: "3px", height: "100%", minHeight: "40px",
                  background: "var(--color-szl-accent)",
                  borderRadius: "2px", flexShrink: 0,
                }} />
                <div>
                  <p style={{
                    fontSize: "0.9375rem", fontWeight: 600,
                    color: "hsl(38,8%,88%)", marginBottom: "0.375rem",
                    letterSpacing: "-0.01em",
                  }}>
                    The loop is the same for every consequential decision in the system.
                  </p>
                  <p style={{
                    fontSize: "0.875rem", lineHeight: 1.70,
                    color: "hsl(214,7%,56%)",
                  }}>
                    Whether the decision is a security incident response, a real estate acquisition approval, a maritime rerouting call, or a legal settlement range — the arc is identical. Signal. Surface. Recommend. Gate. Decide. Prove. A11OY is the invariant beneath every domain.
                  </p>
                </div>
              </m.div>
            </div>
          </section>

          {/* ── Competitive Landscape ── */}
          <section id="competitive" style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: "3.5rem" }}
              >
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--color-szl-accent)", marginBottom: "1rem",
                }}>
                  Competitive Landscape
                </p>
                <h2 style={{
                  fontSize: "clamp(1.5rem,3.5vw,2.5rem)", fontWeight: 600,
                  letterSpacing: "-0.025em", lineHeight: 1.15, maxWidth: "32ch",
                  marginBottom: "1.25rem",
                }}>
                  Every category has a leader. None of them have fused all four elements.
                </h2>
                <p style={{
                  fontSize: "0.9375rem", lineHeight: 1.75,
                  color: "hsl(214,7%,60%)", maxWidth: "58ch",
                }}>
                  The A11OY positioning is not a claim that competitors are weak. Many of them are exceptional at what they do. The gap is structural: no category leader has combined AI intelligence, governed execution, structural human-in-the-loop, and provable decision accountability into a unified platform. That gap is A11OY's entire reason for existing.
                </p>
              </m.div>

              {/* Competitor cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "3rem" }}>
                {COMPETITORS.map((comp, i) => (
                  <m.div
                    key={comp.name}
                    custom={i}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="szl-card"
                    style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}
                  >
                    <div style={{
                      display: "grid", gap: "1.5rem", alignItems: "start",
                    }} className="lg:grid-cols-[1fr_1fr]">
                      {/* Left: identity + narrative */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
                          <span style={{
                            fontFamily: "var(--font-mono)", fontSize: "0.5rem",
                            fontWeight: 700, letterSpacing: "0.12em",
                            textTransform: "uppercase", color: "hsl(214,7%,40%)",
                            marginRight: "0.125rem",
                          }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <h3 style={{
                            fontSize: "1rem", fontWeight: 700,
                            letterSpacing: "-0.015em", color: "hsl(38,8%,90%)",
                          }}>{comp.name}</h3>
                          <span style={{
                            fontSize: "0.6875rem", fontFamily: "var(--font-mono)",
                            color: "hsl(214,7%,45%)",
                            padding: "0.1rem 0.5rem",
                            background: "hsla(0,0%,100%,0.04)",
                            border: "1px solid hsla(0,0%,100%,0.07)",
                            borderRadius: "4px",
                          }}>{comp.category}</span>
                        </div>
                        <div style={{ marginBottom: "0.75rem" }}>
                          <p style={{
                            fontSize: "0.6875rem", fontFamily: "var(--font-mono)",
                            fontWeight: 600, letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--color-szl-success)", marginBottom: "0.375rem",
                          }}>What they do well</p>
                          <p style={{
                            fontSize: "0.875rem", lineHeight: 1.68,
                            color: "hsl(214,7%,65%)",
                          }}>{comp.strength}</p>
                        </div>
                        <div>
                          <p style={{
                            fontSize: "0.6875rem", fontFamily: "var(--font-mono)",
                            fontWeight: 600, letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--color-szl-accent)", marginBottom: "0.375rem",
                          }}>The structural gap A11OY fills</p>
                          <p style={{
                            fontSize: "0.875rem", lineHeight: 1.68,
                            color: "hsl(214,7%,58%)",
                          }}>{comp.gap}</p>
                        </div>
                      </div>

                      {/* Right: capability matrix */}
                      <div>
                        <p style={{
                          fontFamily: "var(--font-mono)", fontSize: "0.5625rem",
                          fontWeight: 600, letterSpacing: "0.10em",
                          textTransform: "uppercase",
                          color: "hsl(214,7%,40%)", marginBottom: "0.875rem",
                        }}>Capability Assessment</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {MATRIX_COLS.map((col) => (
                            <div key={col.key} style={{
                              display: "flex", alignItems: "center",
                              justifyContent: "space-between", gap: "0.75rem",
                              padding: "0.5rem 0.75rem",
                              background: "hsla(0,0%,100%,0.02)",
                              border: "1px solid hsla(0,0%,100%,0.05)",
                              borderRadius: "5px",
                            }}>
                              <span style={{
                                fontSize: "0.8125rem", color: "hsl(214,7%,65%)",
                              }}>{col.label}</span>
                              <RatingCell rating={comp.ratings[col.key] as CompetitorRating} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </m.div>
                ))}
              </div>

              {/* What Only A11OY Does */}
              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{
                  background: "rgba(201,168,92,0.04)",
                  border: "1px solid rgba(201,168,92,0.14)",
                  borderRadius: "0.875rem",
                  padding: "clamp(1.5rem,3vw,2.5rem)",
                }}
              >
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.6875rem",
                  fontWeight: 600, letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--color-szl-accent)", marginBottom: "0.875rem",
                }}>What Only A11OY Does</p>
                <h3 style={{
                  fontSize: "clamp(1.125rem,2.5vw,1.5rem)", fontWeight: 700,
                  letterSpacing: "-0.02em", color: "hsl(38,8%,92%)",
                  marginBottom: "1.5rem", maxWidth: "36ch",
                }}>Six structural capabilities no competitor in any category currently combines.</h3>
                <div style={{ display: "grid", gap: "0.75rem" }} className="md:grid-cols-2">
                  {ONLY_A11OY.map((item, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: "0.875rem",
                    }}>
                      <div style={{
                        width: "20px", height: "20px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(201,168,92,0.09)",
                        border: "1px solid rgba(201,168,92,0.18)",
                        borderRadius: "50%", flexShrink: 0, marginTop: "0.125rem",
                      }}>
                        <CheckCircle size={11} color="var(--color-szl-accent)" />
                      </div>
                      <p style={{
                        fontSize: "0.875rem", lineHeight: 1.68,
                        color: "hsl(214,7%,65%)",
                      }}>{item}</p>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </section>

          {/* ── PDF Downloads ── */}
          <section id="downloads" style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: "3rem" }}
              >
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--color-szl-accent)", marginBottom: "1rem",
                }}>
                  Documents
                </p>
                <h2 style={{
                  fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600,
                  letterSpacing: "-0.022em", lineHeight: 1.15, maxWidth: "32ch",
                  marginBottom: "1rem",
                }}>
                  Downloadable thought-leadership materials.
                </h2>
                <p style={{
                  fontSize: "0.9375rem", lineHeight: 1.72,
                  color: "hsl(214,7%,60%)", maxWidth: "52ch",
                }}>
                  Formatted for sharing on Medium, Substack, LinkedIn, and in enterprise conversations. Download, read, distribute.
                </p>
              </m.div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                <m.div
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45 }}
                  style={{
                    background: "hsla(214,12%,8%,0.6)",
                    border: "1px solid var(--color-szl-border)",
                    borderRadius: "0.875rem",
                    padding: "clamp(1.5rem,3vw,2.5rem)",
                  }}
                >
                  <DocumentPreview
                    title="A11OY Philosophy Whitepaper"
                    subtitle="The Governing Philosophy"
                    pages="6 pages"
                    description="The complete A11OY philosophy: why enterprise AI systems need to be alloys, not point solutions. Covers the four elements, the six primitives, the governed decision loop, and the architectural implications. Written for distribution in enterprise sales conversations."
                    accentColor="var(--color-szl-accent)"
                    onDownload={handleDownloadWhitepaper}
                    downloading={downloadingWhitepaper}
                    pdfBlobUrl={whitepaperBlobUrl}
                  />
                </m.div>

                <m.div
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.08 }}
                  style={{
                    background: "hsla(214,12%,8%,0.6)",
                    border: "1px solid var(--color-szl-border)",
                    borderRadius: "0.875rem",
                    padding: "clamp(1.5rem,3vw,2.5rem)",
                  }}
                >
                  <DocumentPreview
                    title="A11OY Competitive Brief"
                    subtitle="Market Positioning & Landscape"
                    pages="5 pages"
                    description="A detailed competitive landscape analysis: how A11OY/Counsel stacks up against Palantir AIP/Foundry, ServiceNow, C3.ai, UiPath/Automation Anywhere, Microsoft Copilot Studio, and LangChain/CrewAI. Includes the capability matrix, competitor assessments, and the six structural advantages that no competitor in any category currently combines."
                    accentColor="var(--color-alloy-light)"
                    onDownload={handleDownloadBrief}
                    downloading={downloadingBrief}
                    pdfBlobUrl={briefBlobUrl}
                  />
                </m.div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section style={{ padding: "var(--space-section-sm) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                style={{
                  display: "flex", flexWrap: "wrap",
                  alignItems: "flex-start", justifyContent: "space-between",
                  gap: "1.5rem",
                }}
              >
                <div style={{ maxWidth: "44ch" }}>
                  <h2 style={{
                    fontSize: "clamp(1.25rem,2.5vw,1.625rem)", fontWeight: 600,
                    letterSpacing: "-0.02em", marginBottom: "0.625rem",
                  }}>Ready to see A11OY in practice?</h2>
                  <p style={{
                    fontSize: "0.9375rem", lineHeight: 1.70,
                    color: "hsl(214,7%,58%)",
                  }}>
                    Counsel is the platform. A11OY is what it's built on. Explore the platform or see the execution fabric in detail.
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
                  <Link href="/alloy-fabric" className="szl-btn-primary">
                    Explore Counsel <ArrowRight size={15} />
                  </Link>
                  <Link href="/platform" className="szl-btn-secondary">
                    Platform overview
                  </Link>
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
