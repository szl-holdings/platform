import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { apiRequest } from "@/lib/api";
import {Shield, Ship, Building2, Briefcase, Users, 
  ArrowRight, ChevronRight, Play, GitBranch, BarChart3, Lock,
  Radio, Layers, ArrowUpRight, 
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const BG = "hsl(214,16%,4%)";
const BORDER = "hsla(0,0%,100%,0.07)";
const SURFACE = "hsla(0,0%,100%,0.035)";
const TEXT = "hsl(38,8%,94%)";
const TEXT_SEC = "hsl(214,7%,60%)";
const TEXT_FAINT = "hsl(214,7%,38%)";
const LYTE = "hsl(192,72%,48%)";
const MONO = "var(--font-mono)";

interface SchemaStep {
  stage: string;
  action: string;
  owner: string;
  gate?: string;
  timeout?: string;
}

interface DecisionSchema {
  id: string;
  name: string;
  category: string;
  domain: string;
  color: string;
  icon: typeof Shield;
  description: string;
  triggerPatterns: string[];
  actionSequence: SchemaStep[];
  policyGates: string[];
  expectedOutcome: string;
  avgDurationH: number;
  timesUsed: number;
  successRate: number;
  lastUsed: string;
  tags: string[];
  complexity: "low" | "medium" | "high";
}

const STAGE_COLORS: Record<string, string> = {
  Signal: "#0ea5e9",
  Context: "#8b5cf6",
  Recommendation: "#ec4899",
  Simulation: "#f59e0b",
  Policy: "#10b981",
  Execution: "#6366f1",
  Proof: "#14b8a6",
  Outcome: "#ef4444",
};

const SCHEMAS_FALLBACK: DecisionSchema[] = [
  {
    id: "sch1",
    name: "Cyber Incident Response",
    category: "Security Operations",
    domain: "PARAGON",
    color: "hsl(222,60%,60%)",
    icon: Shield,
    description: "Structured response protocol for confirmed cyber incidents — from initial signal triage through containment, eradication, and proof-chain recording.",
    triggerPatterns: [
      "KEV exploitation confirmed on production asset",
      "MITRE ATT&CK technique detected (T1071, T1566)",
      "Identity anomaly score exceeds threshold 0.82",
      "Critical vulnerability + active threat actor correlation",
    ],
    actionSequence: [
      { stage: "Signal", action: "Ingest threat signal from PARAGON SOC feed", owner: "SOC Analyst", timeout: "5m" },
      { stage: "Context", action: "Enrich via MITRE ATT&CK and asset ownership graph", owner: "System", timeout: "2m" },
      { stage: "Recommendation", action: "AI generates containment options with evidence lineage", owner: "AI Agent", gate: "Confidence ≥ 0.80" },
      { stage: "Simulation", action: "Model impact of containment on service availability", owner: "System", timeout: "3m" },
      { stage: "Policy", action: "Covenant Policy checks approver eligibility for isolation action", owner: "System" },
      { stage: "Execution", action: "FORGE orchestrates isolation workflow with checkpoint recovery", owner: "SOC Lead", gate: "Approver: security_lead" },
      { stage: "Proof", action: "Proof Chain records full chain: detection → action → isolation", owner: "System" },
      { stage: "Outcome", action: "Outcome Graph measures time-to-containment vs simulation", owner: "System", timeout: "24h" },
    ],
    policyGates: ["security_lead approval required", "service_owner notification mandatory", "exec_briefing if severity=critical", "post-incident review within 72h"],
    expectedOutcome: "Asset isolated within SLA, evidence chain preserved, root cause identified, recurrence prevented",
    avgDurationH: 4.2,
    timesUsed: 34,
    successRate: 0.94,
    lastUsed: "3 days ago",
    tags: ["incident-response", "containment", "mitre", "soc"],
    complexity: "high",
  },
  {
    id: "sch2",
    name: "Maritime Anomaly Investigation",
    category: "Fleet Operations",
    domain: "SEXTANT",
    color: "hsl(206,72%,54%)",
    icon: Ship,
    description: "Systematic investigation of dark vessel events, AIS signal gaps, and sanctions exposure — with OFAC screening integrated into the governed approval flow.",
    triggerPatterns: [
      "AIS signal gap exceeds 4 hours for flagged route",
      "Vessel proximity to OFAC-designated entity",
      "Dark vessel detection from satellite imagery correlation",
      "Sanctions list match score exceeds 0.75",
    ],
    actionSequence: [
      { stage: "Signal", action: "Ingest AIS gap signal from SEXTANT telemetry feed", owner: "System" },
      { stage: "Context", action: "Correlate last known position, cargo manifest, port schedule", owner: "System", timeout: "5m" },
      { stage: "Recommendation", action: "AI risk assessment with OFAC screening results", owner: "AI Agent", gate: "OFAC API response received" },
      { stage: "Simulation", action: "Model cargo and voyage P&L impact scenarios", owner: "System" },
      { stage: "Policy", action: "Policy check for compliance officer notification trigger", owner: "System" },
      { stage: "Execution", action: "Flag voyage twin, alert fleet manager, initiate OFAC report", owner: "Compliance Officer", gate: "Approver: compliance_officer" },
      { stage: "Proof", action: "Record investigation chain with timestamp and decision attribution", owner: "System" },
      { stage: "Outcome", action: "Track vessel re-emergence and compliance clearance", owner: "System" },
    ],
    policyGates: ["compliance_officer approval on OFAC match", "legal review if sanctions exposure confirmed", "regulatory filing if threshold exceeded"],
    expectedOutcome: "Vessel status resolved, sanctions exposure documented, regulatory filings submitted if required",
    avgDurationH: 8.5,
    timesUsed: 22,
    successRate: 0.91,
    lastUsed: "11 days ago",
    tags: ["maritime", "sanctions", "ofac", "ais", "compliance"],
    complexity: "medium",
  },
  {
    id: "sch3",
    name: "Distressed Asset Acquisition Review",
    category: "Investment Operations",
    domain: "DOMAINE",
    color: "hsl(142,52%,48%)",
    icon: Building2,
    description: "End-to-end acquisition workflow for distressed real estate — from initial distress signal through underwriting, LP approval, and post-acquisition outcome tracking.",
    triggerPatterns: [
      "Distress signal threshold breached (≥3 indicators)",
      "Ownership transfer filing detected on target property",
      "Tax lien accumulation above $500K on monitored asset",
      "Broker network signal: off-market interest confirmed",
    ],
    actionSequence: [
      { stage: "Signal", action: "Ingest distress signal composite from DOMAINE intelligence feed", owner: "System" },
      { stage: "Context", action: "Build ownership entity graph, debt stack, lien history", owner: "System" },
      { stage: "Recommendation", action: "AI generates acquisition thesis with comparable analysis", owner: "AI Agent", gate: "Diligence checklist ≥60% complete" },
      { stage: "Simulation", action: "Model IRR scenarios: base/bull/bear with sensitivity analysis", owner: "System" },
      { stage: "Policy", action: "Investment committee approval threshold check", owner: "System" },
      { stage: "Execution", action: "Route to LP approval workflow via FORGE with deal memorandum", owner: "Investment Lead", gate: "Approver: investment_committee" },
      { stage: "Proof", action: "Record complete underwriting chain for LP reporting", owner: "System" },
      { stage: "Outcome", action: "Track against projected IRR and acquisition thesis at 12/24/36m", owner: "Investment Lead" },
    ],
    policyGates: ["investment_committee quorum required", "LP notification on deals >$10M", "legal review of title chain mandatory", "environmental review if applicable"],
    expectedOutcome: "Acquisition completed within modeled parameters, LP reporting satisfied, outcome tracked against thesis",
    avgDurationH: 168,
    timesUsed: 12,
    successRate: 0.88,
    lastUsed: "21 days ago",
    tags: ["real-estate", "acquisition", "underwriting", "lp-approval"],
    complexity: "high",
  },
  {
    id: "sch4",
    name: "Legal Deadline Response Protocol",
    category: "Legal Operations",
    domain: "Counsel",
    color: "hsl(260,60%,65%)",
    icon: Briefcase,
    description: "Automated detection and governed response for approaching legal deadlines — from motion filings through court-mandated responses.",
    triggerPatterns: [
      "Motion deadline within 72h, no filing draft confirmed",
      "Discovery deadline approach without production status",
      "Court order deadline detected without acknowledgment",
      "Settlement demand deadline approaching without response status",
    ],
    actionSequence: [
      { stage: "Signal", action: "Deadline proximity signal from Counsel matter twin", owner: "System" },
      { stage: "Context", action: "Pull matter status, pending docs, assigned counsel, opposing counsel", owner: "System" },
      { stage: "Recommendation", action: "AI drafts filing response options with relevant precedent", owner: "AI Agent", gate: "Attorney review required" },
      { stage: "Simulation", action: "Model outcome scenarios: file, extension request, consequence", owner: "System" },
      { stage: "Policy", action: "Check approval routing: associate vs partner vs external counsel", owner: "System" },
      { stage: "Execution", action: "Route filing workflow with approval gates and court system sync", owner: "Lead Attorney", gate: "Approver: supervising_attorney" },
      { stage: "Proof", action: "Record filing chain: recommendation → review → approval → submission", owner: "System" },
      { stage: "Outcome", action: "Track court acknowledgment and downstream matter impact", owner: "System" },
    ],
    policyGates: ["supervising_attorney approval mandatory", "client notification if billing impact", "malpractice review if deadline missed", "bar compliance check on all filings"],
    expectedOutcome: "Filing completed before deadline, court acknowledgment received, matter record updated",
    avgDurationH: 36,
    timesUsed: 18,
    successRate: 0.97,
    lastUsed: "5 days ago",
    tags: ["legal", "filing", "deadline", "matter-management"],
    complexity: "medium",
  },
  {
    id: "sch5",
    name: "Client Engagement Delivery Protocol",
    category: "Advisory Operations",
    domain: "Carlota Jo",
    color: "hsl(340,52%,60%)",
    icon: Users,
    description: "Governed delivery workflow for advisory engagements — milestone confirmation, document delivery, and client sign-off with full audit trail.",
    triggerPatterns: [
      "Engagement milestone completion signal from delivery tracker",
      "Client communication gap exceeds SLA threshold",
      "Deliverable review deadline approaching without sign-off",
      "Service agreement renewal window within 30 days",
    ],
    actionSequence: [
      { stage: "Signal", action: "Milestone completion signal from engagement tracker", owner: "System" },
      { stage: "Context", action: "Pull engagement record, prior deliverables, client preferences", owner: "System" },
      { stage: "Recommendation", action: "AI generates delivery memo with key milestones and context", owner: "AI Agent" },
      { stage: "Simulation", action: "Model client relationship impact scenarios", owner: "System" },
      { stage: "Policy", action: "Check NDA compliance and document export safety state", owner: "System" },
      { stage: "Execution", action: "Route secure delivery workflow with client confirmation gate", owner: "Engagement Manager", gate: "Approver: engagement_manager" },
      { stage: "Proof", action: "Record delivery chain: preparation → approval → delivery → confirmation", owner: "System" },
      { stage: "Outcome", action: "Track client satisfaction signal and next engagement stage", owner: "Engagement Manager" },
    ],
    policyGates: ["engagement_manager approval on all deliverables", "NDA compliance check before delivery", "client principal sign-off for milestone gates"],
    expectedOutcome: "Deliverable confirmed by client, engagement milestone closed, relationship health maintained",
    avgDurationH: 48,
    timesUsed: 28,
    successRate: 0.96,
    lastUsed: "2 days ago",
    tags: ["advisory", "delivery", "client-management", "engagement"],
    complexity: "low",
  },
  {
    id: "sch6",
    name: "Cloud Policy Violation Remediation",
    category: "Infrastructure Governance",
    domain: "IMPERIUM",
    color: "hsl(25,72%,54%)",
    icon: Layers,
    description: "Automated detection and governed remediation of cloud infrastructure policy violations — configuration drift, unauthorized access changes, and compliance gaps.",
    triggerPatterns: [
      "Security group policy violation detected (unrestricted ingress/egress)",
      "Configuration drift from approved baseline",
      "Unauthorized IAM permission escalation",
      "Compliance benchmark failure (CIS, SOC 2, ISO 27001)",
    ],
    actionSequence: [
      { stage: "Signal", action: "Policy violation signal from IMPERIUM cloud scanner", owner: "System" },
      { stage: "Context", action: "Map asset ownership, blast radius, policy lineage", owner: "System" },
      { stage: "Recommendation", action: "AI generates remediation options ranked by risk reduction", owner: "AI Agent", gate: "Confidence ≥ 0.85" },
      { stage: "Simulation", action: "Model service impact of remediation options", owner: "System" },
      { stage: "Policy", action: "Check approval chain based on asset criticality tier", owner: "System" },
      { stage: "Execution", action: "Apply remediation via FORGE with automatic rollback gate", owner: "Cloud Ops", gate: "Approver: cloud_ops_lead" },
      { stage: "Proof", action: "Record violation → detection → remediation → verification chain", owner: "System" },
      { stage: "Outcome", action: "Verify policy compliance restoration and track recurrence", owner: "System" },
    ],
    policyGates: ["cloud_ops_lead approval for production changes", "change_advisory_board for tier-1 assets", "security approval for IAM changes"],
    expectedOutcome: "Policy violation remediated, compliance restored, no service disruption, evidence chain preserved",
    avgDurationH: 2.5,
    timesUsed: 47,
    successRate: 0.99,
    lastUsed: "1 day ago",
    tags: ["cloud", "compliance", "remediation", "infrastructure"],
    complexity: "medium",
  },
];

const ICON_MAP: Record<string, typeof Shield> = { Shield, Ship, Building2, Briefcase, Users, Layers };

function ComplexityBadge({ complexity }: { complexity: string }) {
  const colors: Record<string, string> = { low: "hsl(142,60%,48%)", medium: "hsl(48,90%,52%)", high: "hsl(0,72%,54%)" };
  const c = colors[complexity] ?? LYTE;
  return (
    <span style={{
      fontSize: "0.575rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: MONO,
      padding: "2px 6px", borderRadius: 3, background: `${c}15`, border: `1px solid ${c}25`, color: c,
    }}>
      {complexity}
    </span>
  );
}

function StepRow({ step, index }: { step: SchemaStep; index: number }) {
  const sc = STAGE_COLORS[step.stage] ?? LYTE;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr", gap: "0.75rem", alignItems: "start", padding: "0.625rem 0", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${sc}18`, border: `1px solid ${sc}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
        <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, color: sc }}>{index + 1}</span>
      </div>
      <div>
        <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.575rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "1px 5px", borderRadius: 3, background: `${sc}15`, border: `1px solid ${sc}25`, color: sc }}>
            {step.stage}
          </span>
          {step.gate && (
            <span style={{ fontSize: "0.575rem", fontFamily: MONO, color: "hsl(48,90%,52%)", background: "hsla(48,90%,52%,0.1)", border: "1px solid hsla(48,90%,52%,0.2)", padding: "1px 5px", borderRadius: 3 }}>
              Gate: {step.gate}
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.75rem", color: TEXT_SEC, margin: 0, lineHeight: 1.4 }}>{step.action}</p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: "0.6875rem", color: TEXT_FAINT, margin: 0 }}>{step.owner}</p>
        {step.timeout && <p style={{ fontSize: "0.6rem", fontFamily: MONO, color: TEXT_FAINT, margin: 0 }}>↻ {step.timeout}</p>}
      </div>
    </div>
  );
}

export default function DecisionSchemaLibraryPage() {
  const __pageMeta = usePageMeta({
    title: "Decision Schema Library — KORA | SZL Holdings",
    description: "Reusable decision templates that encode institutional knowledge — trigger patterns, action sequences, policy gates, and expected outcomes. Inspired by DARPA KAIROS schema-based event reasoning.",
    canonical: "https://szlholdings.com/lyte/decision-schemas",
  });

  const [activeSchema, setActiveSchema] = useState<string>("sch1");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterComp, setFilterComp] = useState<string>("all");

  interface SchemaApiRow extends Omit<DecisionSchema, "icon"> { iconKey: string; }
  interface SchemaApiResponse { schemas: SchemaApiRow[]; categories: string[]; dataAvailable: boolean; }
  const schemaQuery = useStandardQuery<SchemaApiResponse>({
    queryKey: ["lyte", "decision-schemas"],
    queryFn: async () => {
      const res = await apiRequest<SchemaApiResponse>("GET", "/api/lyte/decision-schemas");
      return res;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const SCHEMAS: DecisionSchema[] = useMemo(() => {
    if (schemaQuery.data?.schemas) {
      return schemaQuery.data.schemas.map(s => ({ ...s, icon: ICON_MAP[s.iconKey] ?? Shield }));
    }
    return SCHEMAS_FALLBACK;
  }, [schemaQuery.data]);
  const CATEGORIES = useMemo(() => schemaQuery.data?.categories ?? [...new Set(SCHEMAS.map(s => s.category))], [schemaQuery.data, SCHEMAS]);

  const schema = SCHEMAS.find(s => s.id === activeSchema) ?? SCHEMAS[0]!;
  const Icon = schema.icon;

  const filteredSchemas = SCHEMAS.filter(s =>
    (filterCat === "all" || s.category === filterCat) &&
    (filterComp === "all" || s.complexity === filterComp)
  );

  const totalUses = SCHEMAS.reduce((a, s) => a + s.timesUsed, 0);
  const avgSuccess = SCHEMAS.length > 0 ? SCHEMAS.reduce((a, s) => a + s.successRate, 0) / SCHEMAS.length : 0;

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: BG, color: TEXT }}>
        <SiteNav />
        <main id="main-content">
  
          {/* Header */}
          <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(5.5rem,10vw,7rem) 0 2rem" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                  <Link href="/lyte" style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, textDecoration: "none" }}>KORA</Link>
                  <ChevronRight size={10} style={{ color: TEXT_FAINT }} />
                  <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE }}>Decision Schema Library</span>
                </div>
                <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 700, letterSpacing: "-0.028em", lineHeight: 1.08, maxWidth: "28ch", marginBottom: "1rem", color: TEXT }}>
                  Institutional knowledge encoded as executable decision schemas.
                </h1>
                <p style={{ fontSize: "0.6875rem", fontFamily: MONO, letterSpacing: "0.04em", color: LYTE, marginBottom: "0.875rem" }}>
                  Trigger patterns → Action sequence → Policy gates → Expected outcome
                </p>
                <p style={{ fontSize: "clamp(0.9375rem,1.6vw,1.0625rem)", lineHeight: 1.72, color: TEXT_SEC, maxWidth: "54ch", marginBottom: "2rem" }}>
                  Reusable decision templates that recognize when a known situation is developing, activate the right action sequence, and enforce governance gates at every step. Inspired by DARPA KAIROS's schema-based event reasoning and temporal pattern matching.
                </p>
  
                {/* Stats */}
                <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                  {[
                    { label: "Schemas", value: SCHEMAS.length.toString(), color: LYTE },
                    { label: "Total executions", value: totalUses.toString(), color: "hsl(260,60%,65%)" },
                    { label: "Avg success rate", value: `${(avgSuccess * 100).toFixed(0)}%`, color: "hsl(142,60%,48%)" },
                    { label: "Domains covered", value: new Set(SCHEMAS.map(s => s.domain)).size.toString(), color: "hsl(206,72%,54%)" },
                  ].map((stat, i) => (
                    <div key={i}>
                      <p style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: MONO, color: stat.color, margin: 0 }}>{stat.value}</p>
                      <p style={{ fontSize: "0.6875rem", color: TEXT_FAINT, margin: 0 }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </section>
  
          {/* Main */}
          <section style={{ padding: "2rem 0" }}>
            <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
  
              {/* Filters */}
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.6875rem", color: TEXT_FAINT }}>Category:</span>
                  {["all", ...CATEGORIES].map(c => (
                    <button key={c} onClick={() => setFilterCat(c)} style={{ padding: "0.25rem 0.625rem", borderRadius: 4, fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 500, border: `1px solid ${filterCat === c ? `${LYTE}40` : BORDER}`, background: filterCat === c ? `${LYTE}12` : "transparent", color: filterCat === c ? LYTE : TEXT_FAINT, cursor: "pointer" }}>
                      {c === "all" ? "All" : c}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.6875rem", color: TEXT_FAINT }}>Complexity:</span>
                  {["all", "low", "medium", "high"].map(c => {
                    const colors: Record<string, string> = { low: "hsl(142,60%,48%)", medium: "hsl(48,90%,52%)", high: "hsl(0,72%,54%)" };
                    const cc = filterComp === c ? (colors[c] ?? LYTE) : TEXT_FAINT;
                    return (
                      <button key={c} onClick={() => setFilterComp(c)} style={{ padding: "0.25rem 0.625rem", borderRadius: 4, fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 500, border: `1px solid ${filterComp === c ? `${cc}40` : BORDER}`, background: filterComp === c ? `${cc}12` : "transparent", color: cc, cursor: "pointer" }}>
                        {c === "all" ? "All" : c}
                      </button>
                    );
                  })}
                </div>
              </div>
  
              <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.25rem" }}>
  
                {/* Schema list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {filteredSchemas.map(s => {
                    const SIcon = s.icon;
                    return (
                      <m.button
                        key={s.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setActiveSchema(s.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "1rem 1.125rem",
                          borderRadius: "8px",
                          background: activeSchema === s.id ? `${s.color}08` : SURFACE,
                          border: `1px solid ${activeSchema === s.id ? `${s.color}30` : BORDER}`,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: `${s.color}18`, border: `1px solid ${s.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                            <SIcon size={13} style={{ color: s.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.3rem", flexWrap: "wrap", alignItems: "center" }}>
                              <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: s.color }}>{s.domain}</span>
                              <ComplexityBadge complexity={s.complexity} />
                            </div>
                            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: TEXT, lineHeight: 1.3, margin: "0 0 0.375rem" }}>{s.name}</p>
                            <div style={{ display: "flex", gap: "1rem", fontSize: "0.6875rem", color: TEXT_FAINT }}>
                              <span>Used {s.timesUsed}×</span>
                              <span style={{ color: "hsl(142,60%,48%)" }}>{(s.successRate * 100).toFixed(0)}% success</span>
                              <span>{s.avgDurationH}h avg</span>
                            </div>
                          </div>
                        </div>
                      </m.button>
                    );
                  })}
                </div>
  
                {/* Schema detail */}
                <AnimatePresence mode="wait">
                  <m.div
                    key={schema.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: "flex", flexDirection: "column", gap: "1px", background: BORDER, borderRadius: "10px", overflow: "hidden", border: `1px solid ${BORDER}` }}
                  >
                    {/* Schema header */}
                    <div style={{ background: BG, padding: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${schema.color}18`, border: `1px solid ${schema.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={16} style={{ color: schema.color }} />
                        </div>
                        <div>
                          <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: schema.color, margin: 0 }}>{schema.domain} · {schema.category}</p>
                          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: TEXT, letterSpacing: "-0.016em", margin: 0 }}>{schema.name}</h3>
                        </div>
                        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                          <ComplexityBadge complexity={schema.complexity} />
                        </div>
                      </div>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: TEXT_SEC, margin: "0 0 1rem" }}>{schema.description}</p>
                      <div style={{ display: "flex", gap: "2rem" }}>
                        <div>
                          <p style={{ fontSize: "0.6rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_FAINT, margin: "0 0 0.2rem" }}>Used</p>
                          <p style={{ fontSize: "0.9375rem", fontWeight: 700, fontFamily: MONO, color: LYTE, margin: 0 }}>{schema.timesUsed}×</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "0.6rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_FAINT, margin: "0 0 0.2rem" }}>Success rate</p>
                          <p style={{ fontSize: "0.9375rem", fontWeight: 700, fontFamily: MONO, color: "hsl(142,60%,48%)", margin: 0 }}>{(schema.successRate * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "0.6rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_FAINT, margin: "0 0 0.2rem" }}>Avg duration</p>
                          <p style={{ fontSize: "0.9375rem", fontWeight: 700, fontFamily: MONO, color: TEXT_SEC, margin: 0 }}>{schema.avgDurationH}h</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "0.6rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_FAINT, margin: "0 0 0.2rem" }}>Last used</p>
                          <p style={{ fontSize: "0.9375rem", fontWeight: 700, fontFamily: MONO, color: TEXT_SEC, margin: 0 }}>{schema.lastUsed}</p>
                        </div>
                      </div>
                    </div>
  
                    {/* Trigger patterns */}
                    <div style={{ background: BG, padding: "1.25rem 1.5rem" }}>
                      <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                        Trigger Patterns — KAIROS-inspired temporal signal detection
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {schema.triggerPatterns.map((p, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: 5, background: `${schema.color}08`, border: `1px solid ${schema.color}15` }}>
                            <Radio size={10} style={{ color: schema.color, flexShrink: 0, marginTop: "2px" }} />
                            <span style={{ fontSize: "0.8125rem", color: TEXT_SEC, lineHeight: 1.4 }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
  
                    {/* Action sequence */}
                    <div style={{ background: BG, padding: "1.25rem 1.5rem" }}>
                      <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                        Action Sequence — {schema.actionSequence.length} stages · FORGE-orchestrated
                      </p>
                      <div>
                        {schema.actionSequence.map((step, i) => (
                          <StepRow key={i} step={step} index={i} />
                        ))}
                      </div>
                    </div>
  
                    {/* Policy gates + outcome */}
                    <div style={{ background: BG, padding: "1.25rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                      <div>
                        <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                          Policy Gates — Covenant Policy enforced
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {schema.policyGates.map((g, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                              <Lock size={10} style={{ color: "hsl(142,60%,48%)", flexShrink: 0, marginTop: "2px" }} />
                              <span style={{ fontSize: "0.8125rem", color: TEXT_SEC, lineHeight: 1.4 }}>{g}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                          Expected Outcome — Outcome Graph tracking
                        </p>
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: TEXT_SEC }}>{schema.expectedOutcome}</p>
                        <div style={{ marginTop: "1rem", display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                          {schema.tags.map(tag => (
                            <span key={tag} style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 600, color: TEXT_FAINT, background: "hsla(0,0%,100%,0.04)", border: `1px solid ${BORDER}`, padding: "2px 6px", borderRadius: 3 }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
  
                    {/* Actions */}
                    <div style={{ background: BG, padding: "1rem 1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button style={{ padding: "0.5rem 1rem", borderRadius: 6, background: `${LYTE}15`, border: `1px solid ${LYTE}30`, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, color: LYTE, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <Play size={12} /> Activate schema
                      </button>
                      <button style={{ padding: "0.5rem 1rem", borderRadius: 6, background: "transparent", border: `1px solid ${BORDER}`, cursor: "pointer", fontSize: "0.8125rem", color: TEXT_SEC, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <GitBranch size={12} /> Clone & customize
                      </button>
                      <button style={{ padding: "0.5rem 1rem", borderRadius: 6, background: "transparent", border: `1px solid ${BORDER}`, cursor: "pointer", fontSize: "0.8125rem", color: TEXT_SEC, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <BarChart3 size={12} /> View execution history
                      </button>
                    </div>
                  </m.div>
                </AnimatePresence>
              </div>
            </div>
          </section>
  
          {/* KAIROS lineage */}
          <section style={{ borderTop: `1px solid ${BORDER}`, padding: "clamp(4rem,8vw,5rem) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}
              >
                <div>
                  <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE, marginBottom: "0.75rem" }}>
                    Architectural Inspiration
                  </p>
                  <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.125rem)", fontWeight: 700, letterSpacing: "-0.022em", color: TEXT, marginBottom: "1rem" }}>
                    Decision schemas grounded in DARPA KAIROS.
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: TEXT_SEC, marginBottom: "1.5rem" }}>
                    DARPA KAIROS developed schema-based AI for recognizing complex events from disparate signals — matching temporal patterns to institutional schemas. The SZL Decision Schema Library applies this to enterprise operations: recognizing when a known situation is developing, activating the matching governance-aware response, and measuring whether the outcome matched the prediction.
                  </p>
                  <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                    <Link href="/lyte" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.125rem", background: LYTE, color: "hsl(214,18%,4%)", borderRadius: 6, fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none" }}>
                      Back to KORA <ArrowRight size={13} />
                    </Link>
                    <Link href="/lyte/governance-posture" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.125rem", background: "transparent", color: TEXT_SEC, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: "0.8125rem", fontWeight: 500, textDecoration: "none" }}>
                      Governance Posture <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[
                    { src: "DARPA KAIROS", principle: "Schema-based event identification", map: "Decision schemas that recognize when a known situation is developing" },
                    { src: "KAIROS temporal reasoning", principle: "Timeline-aware event memory", map: "Trigger patterns track evolving signal sequences, not single events" },
                    { src: "KAIROS narrative extraction", principle: "Event chain citation", map: "AI recommendations cite the trigger pattern sequence, not just the conclusion" },
                    { src: "Shield AI Hivemind", principle: "Mission vs platform autonomy", map: "Schema activations route through policy gates, not autonomous execution" },
                  ].map((item, i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.07 }}
                      style={{ padding: "0.875rem 1.125rem", borderRadius: "7px", background: SURFACE, border: `1px solid ${BORDER}` }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: LYTE }}>{item.src}</span>
                        <span style={{ fontSize: "0.625rem", fontFamily: MONO, color: TEXT_FAINT }}>{item.principle}</span>
                      </div>
                      <p style={{ fontSize: "0.8125rem", color: TEXT_SEC, margin: 0, lineHeight: 1.5 }}>{item.map}</p>
                    </m.div>
                  ))}
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
