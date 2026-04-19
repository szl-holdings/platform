import React, { useState, useMemo, useEffect } from "react";

import { CognitiveLayout } from "./cognitive-layout";
import { useStandardQuery } from "@szl-holdings/api-client-react";

const ACCENT = "#8b7ac8";

type ReflectionType = "post-incident" | "performance-review" | "strategy-update" | "skill-discovery" | "failure-analysis";
type OutcomeClass = "success" | "partial" | "failure";
type CandidateSkillStatus = "proposed" | "under-review" | "adopted" | "rejected";

interface CandidateSkill {
  name: string;
  description: string;
  status: CandidateSkillStatus;
  estimatedImpact: "low" | "medium" | "high";
}

interface StrategyUpdate {
  area: string;
  current: string;
  proposed: string;
  rationale: string;
}

interface Reflection {
  id: string;
  type: ReflectionType;
  domain: string;
  agentName: string;
  traceId: string;
  timestamp: string;
  outcomeClass: OutcomeClass;
  title: string;
  context: string;
  whatWorked: string[];
  whatFailed: string[];
  lesson: string;
  candidateSkills: CandidateSkill[];
  strategyUpdates: StrategyUpdate[];
  tags: string[];
  linkedReflections?: string[];
}

const SEEDED_REFLECTIONS: Reflection[] = [
  {
    id: "ref-001",
    type: "post-incident",
    domain: "aegis",
    agentName: "SOC Triage Agent v3.2",
    traceId: "tr-9f3a2b1c",
    timestamp: "2026-04-17T10:30:00Z",
    outcomeClass: "partial",
    title: "Ransomware Containment — OT Host Dependency Not Pre-Identified",
    context: "Incident #1182: LockBit 3.0 lateral movement across 14 endpoints. Agent successfully classified threat and coordinated containment but did not pre-identify OT gateway dependency before issuing isolation order.",
    whatWorked: [
      "Threat classification completed accurately in 312ms using endpoint telemetry and VirusTotal correlation.",
      "C2 block rule deployed within 2 minutes of initial detection — within SLA.",
      "Escalation routing to CISO and on-call lead executed correctly within policy window.",
      "Credential rotation initiated without human escalation for non-OT hosts.",
    ],
    whatFailed: [
      "Agent did not query the OT asset register before issuing bulk isolation order.",
      "Two OT-adjacent endpoints flagged by operator after isolation — required manual override.",
      "Delay of 8 minutes introduced while OT dependency check was performed retroactively.",
    ],
    lesson: "Before bulk endpoint isolation actions, the agent must query the CMDB/OT asset register to identify OT-adjacent hosts and route those to a separate, slower approval flow. The isolation step should be decomposed into OT-safe and OT-risk subgroups.",
    candidateSkills: [
      {
        name: "ot-dependency-preflight",
        description: "Query the OT asset register and CMDB before any bulk isolation or network policy action to identify OT-adjacent endpoints and apply a slower approval path.",
        status: "under-review",
        estimatedImpact: "high",
      },
      {
        name: "isolation-subgroup-routing",
        description: "Split endpoint isolation plans into OT-safe and OT-risk subgroups with different approval gates and latency budgets.",
        status: "proposed",
        estimatedImpact: "high",
      },
    ],
    strategyUpdates: [
      {
        area: "Isolation Decision Logic",
        current: "Single bulk isolation order for all hosts in blast radius.",
        proposed: "Two-track isolation: OT-safe hosts isolated immediately; OT-risk hosts routed to manual approval.",
        rationale: "Prevents unacceptable OT operational disruption while maintaining fast response on non-OT hosts.",
      },
    ],
    tags: ["ransomware", "ot-risk", "isolation", "lateral-movement", "soc"],
  },
  {
    id: "ref-002",
    type: "performance-review",
    domain: "vessels",
    agentName: "Voyage Planner Agent v2.1",
    traceId: "tr-4d8e1f09",
    timestamp: "2026-04-17T07:00:00Z",
    outcomeClass: "success",
    title: "Cyclone Avoidance Reroute — High Accuracy, Operator Approval Latency High",
    context: "Voyage reroute for MV Aurora Constellation around Cyclone Halia. Overall outcome successful: vessel safe, cargo delivered 28h late. Reflects on what can be improved for similar future events.",
    whatWorked: [
      "Weather data ingestion and cyclone track modelling executed with high accuracy (ECMWF + NHC fusion).",
      "Route optimisation correctly identified Colombo as the optimal diversion — 312nm safety margin maintained.",
      "Fuel budget compliance check passed: +12.3% vs 15% threshold.",
      "Port berth availability confirmed in real-time via PCS API without manual intervention.",
      "Charterer notification triggered automatically and confirmed within SLA.",
    ],
    whatFailed: [
      "Operator approval for the reroute took 3.8 hours — 90% of total plan time. Agent was idle waiting.",
      "Agent did not pro-actively surface the charter party clause 14 obligation until verifier flagged it.",
      "Alternative route (Cape of Good Hope) was presented but not fully costed — charterer asked for this.",
    ],
    lesson: "Operator approval latency dominates voyage planning plan time. The agent should initiate approval requests earlier (pre-emptively, before data is 100% complete) and provide the full economic comparison of all alternatives at first presentation to reduce round-trips.",
    candidateSkills: [
      {
        name: "pre-emptive-approval-initiation",
        description: "Send a preliminary approval request with high-confidence partial data when confidence >85%, rather than waiting for full data collection to complete.",
        status: "proposed",
        estimatedImpact: "medium",
      },
      {
        name: "full-alternative-costing",
        description: "Always compute and present full economic comparison for all viable alternatives (cost, ETA delta, CII impact, berth availability) in a single output to reduce operator round-trips.",
        status: "adopted",
        estimatedImpact: "medium",
      },
    ],
    strategyUpdates: [
      {
        area: "Approval Timing",
        current: "Approval request sent after all data is fully collected and route is finalised.",
        proposed: "Preliminary approval request sent when confidence >85% with clear uncertainty markers; updated automatically when data is complete.",
        rationale: "Reduces operator idle wait time by an estimated 40–60% while preserving operator autonomy.",
      },
    ],
    tags: ["voyage", "cyclone", "reroute", "approval-latency", "maritime"],
  },
  {
    id: "ref-003",
    type: "failure-analysis",
    domain: "terra",
    agentName: "Portfolio Valuation Agent v1.8",
    traceId: "tr-7c2a0e55",
    timestamp: "2026-04-16T12:00:00Z",
    outcomeClass: "failure",
    title: "Industrial Asset Valuation Used Stale Comps — Verifier Failed",
    context: "Interest rate stress analysis for NYC mid-market portfolio. Verifier check COMP-002 failed because industrial asset cap rate model used 2024 benchmark data instead of current 2026 comps. Plan paused pending remediation.",
    whatWorked: [
      "Office and retail asset shock modelling completed accurately using current 2026 comparable transactions.",
      "Distress asset identification (8 assets with post-shock DSCR <1.0) was correct and matched analyst manual estimate.",
      "IFRS 13 Level 3 sensitivity disclosure was generated correctly without prompting.",
      "Tenant isolation and regulatory compliance checks passed.",
    ],
    whatFailed: [
      "Industrial asset comps (12 assets) sourced from 2024 dataset without staleness check — 24-month lag.",
      "Agent did not surface data age as a risk flag in the output — relied on verifier to catch it.",
      "Plan paused; requires analyst time to source 2026 industrial comps and re-run.",
    ],
    lesson: "The agent must perform a data staleness check on all comparable sets before invoking the rate shock model. Any comp set older than 12 months for a primary asset class should block execution and surface a data quality alert rather than silently proceeding.",
    candidateSkills: [
      {
        name: "comp-set-staleness-gate",
        description: "Check the age of all comparable transaction datasets before model invocation. Block execution and raise a data quality alert if any primary asset class comp set is older than 12 months.",
        status: "under-review",
        estimatedImpact: "high",
      },
    ],
    strategyUpdates: [
      {
        area: "Data Quality Gating",
        current: "Comparable set age not checked; model proceeds with whatever data is available.",
        proposed: "Pre-model staleness gate: fail fast if any primary comp set >12 months old. Surface as explicit blocker requiring analyst resolution.",
        rationale: "Prevents silent use of stale data that passes all downstream checks except a dedicated verifier rule.",
      },
      {
        area: "Risk Flagging",
        current: "Data quality risks surfaced only if verifier detects them.",
        proposed: "Agent proactively flags data quality risks in its own output before verifier runs.",
        rationale: "Reduces reliance on verifier as the primary data quality control — defence in depth.",
      },
    ],
    tags: ["valuation", "industrial", "stale-data", "verifier-fail", "real-estate"],
    linkedReflections: ["ref-005"],
  },
  {
    id: "ref-004",
    type: "skill-discovery",
    domain: "prism",
    agentName: "Prism Compliance Agent v4.0",
    traceId: "tr-1b9f4c82",
    timestamp: "2026-04-10T16:00:00Z",
    outcomeClass: "success",
    title: "GDPR Breach Notification — Novel Regulator Contact Resolution Pattern Discovered",
    context: "GDPR breach notification workflow for a data subject access incident. Agent discovered a re-usable contact resolution pattern for regional DPA offices not in the standard lookup table, now proposed as a candidate skill.",
    whatWorked: [
      "Full 72-hour DPA notification window met with 18 hours to spare.",
      "Data subject notification letters generated in correct language (German, French, English) for affected jurisdictions.",
      "Board briefing document automatically populated using incident metadata.",
      "Novel pattern for resolving non-standard DPA contact details discovered using web research + legal DB lookup chain.",
    ],
    whatFailed: [
      "Initial DPA contact lookup returned no result for Liechtenstein — required a 2-step fallback not in the original procedure.",
      "Fallback added latency of 4m 12s — acceptable, but not pre-planned.",
    ],
    lesson: "The 2-step DPA contact resolution fallback (web research → legal DB verification) proved robust for non-standard jurisdictions. This pattern should be codified as a reusable skill and made available to all compliance-domain agents.",
    candidateSkills: [
      {
        name: "dpa-contact-resolution-v2",
        description: "Two-step fallback for DPA contact resolution: (1) structured lookup in legal DB; (2) web research with source verification. Handles 50+ EU/EEA jurisdictions including non-standard cases (Liechtenstein, San Marino, etc.).",
        status: "adopted",
        estimatedImpact: "medium",
      },
    ],
    strategyUpdates: [],
    tags: ["gdpr", "dpa", "compliance", "skill-discovery", "contact-resolution"],
  },
  {
    id: "ref-005",
    type: "strategy-update",
    domain: "terra",
    agentName: "Portfolio Valuation Agent v1.8",
    traceId: "tr-9a1c3d88",
    timestamp: "2026-04-15T14:00:00Z",
    outcomeClass: "partial",
    title: "Quarterly Portfolio Review — Model Confidence Overstatement Pattern Identified",
    context: "Routine quarterly portfolio review across 42 NYC mid-market assets. Revealed a pattern of confidence overstatement when the model operates outside its historical training distribution.",
    whatWorked: [
      "All 42 asset valuations completed within 4-hour window — first time without analyst intervention.",
      "DSCR calculations and LTV band classifications aligned with analyst manual spot-checks on 5 sampled assets.",
      "Comparable transaction sourcing automated end-to-end for first time.",
    ],
    whatFailed: [
      "Model reported 0.87 confidence on 3 assets outside training distribution — analyst estimated true confidence ~0.65.",
      "No automatic flag triggered for out-of-distribution inputs — confidence calibration not domain-aware.",
    ],
    lesson: "The valuation model's confidence estimator was trained on 2021–2024 market conditions. Post-2025 rate environment is outside distribution; confidence scores must be down-calibrated by an estimated 0.15–0.20 for affected asset classes until recalibration data is available.",
    candidateSkills: [
      {
        name: "ood-confidence-calibration",
        description: "Detect when model inputs fall outside training distribution and apply automatic confidence down-calibration, with explicit OOD flag surfaced in model output.",
        status: "under-review",
        estimatedImpact: "high",
      },
    ],
    strategyUpdates: [
      {
        area: "Confidence Reporting",
        current: "Raw model confidence reported without OOD detection.",
        proposed: "Apply OOD detection gate; down-calibrate confidence for out-of-distribution inputs and add explicit OOD flag to output.",
        rationale: "Prevents operators from over-relying on confidence scores that do not reflect true model uncertainty in novel market conditions.",
      },
    ],
    tags: ["valuation", "confidence", "ood", "calibration", "strategy"],
    linkedReflections: ["ref-003"],
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  aegis: "#ef4444",
  vessels: "#0ea5e9",
  terra: "#22c55e",
  prism: "#a855f7",
  default: "#8b7ac8",
};

const TYPE_COLORS: Record<ReflectionType, string> = {
  "post-incident": "#ef4444",
  "performance-review": "#22c55e",
  "strategy-update": "#8b7ac8",
  "skill-discovery": "#f59e0b",
  "failure-analysis": "#f97316",
};

const OUTCOME_COLORS: Record<OutcomeClass, string> = {
  success: "#22c55e",
  partial: "#f59e0b",
  failure: "#ef4444",
};

const SKILL_STATUS_COLORS: Record<CandidateSkillStatus, string> = {
  proposed: "#64748b",
  "under-review": "#f59e0b",
  adopted: "#22c55e",
  rejected: "#ef4444",
};

const IMPACT_COLORS: Record<string, string> = {
  low: "#64748b",
  medium: "#0ea5e9",
  high: "#22c55e",
};

export default function ReflectionConsole() {
  const { data: apiReflections } = useStandardQuery<Reflection[]>({
    queryKey: ["cognitive", "reflections"],
    queryFn: async () => {
      const res = await fetch("/reflections", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<Reflection[]>;
    },
    retry: 0,
    staleTime: 30_000,
  });

  const reflections = apiReflections ?? SEEDED_REFLECTIONS;

  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<ReflectionType | "all">("all");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeClass | "all">("all");
  const [selected, setSelected] = useState<Reflection>(SEEDED_REFLECTIONS[0]!);
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "strategy">("overview");

  useEffect(() => {
    if (reflections.length > 0) {
      const stillSelected = reflections.find((r) => r.id === selected.id);
      setSelected(stillSelected ?? reflections[0]!);
    }
  }, [reflections]);

  const domains = ["all", ...Array.from(new Set(reflections.map((r) => r.domain)))];
  const types: Array<ReflectionType | "all"> = ["all", "post-incident", "performance-review", "strategy-update", "skill-discovery", "failure-analysis"];

  const filtered = useMemo(() => {
    return reflections.filter((r) => {
      if (domainFilter !== "all" && r.domain !== domainFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (outcomeFilter !== "all" && r.outcomeClass !== outcomeFilter) return false;
      return true;
    });
  }, [reflections, domainFilter, typeFilter, outcomeFilter]);

  const allCandidateSkills = reflections.flatMap((r) => r.candidateSkills);
  const adoptedSkills = allCandidateSkills.filter((s) => s.status === "adopted").length;
  const proposedSkills = allCandidateSkills.filter((s) => s.status === "proposed" || s.status === "under-review").length;

  return (
    <CognitiveLayout title="Reflection Console" subtitle="Agent reflections: what worked, what failed, lessons learned, candidate skills, and strategy updates — each linked to a source trace.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Reflections", value: reflections.length, color: ACCENT },
            { label: "Candidate Skills", value: allCandidateSkills.length, color: "#f59e0b" },
            { label: "Skills Adopted", value: adoptedSkills, color: "#22c55e" },
            { label: "Under Review", value: proposedSkills, color: "#0ea5e9" },
          ].map((m) => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#94a3b8", fontSize: 11 }}>
            {domains.map((d) => <option key={d} value={d}>{d === "all" ? "All Domains" : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ReflectionType | "all")} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#94a3b8", fontSize: 11 }}>
            {types.map((t) => <option key={t} value={t}>{t === "all" ? "All Types" : t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
          </select>
          <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value as OutcomeClass | "all")} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#94a3b8", fontSize: 11 }}>
            <option value="all">All Outcomes</option>
            <option value="success">Success</option>
            <option value="partial">Partial</option>
            <option value="failure">Failure</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 10 }}>{filtered.length} reflection{filtered.length !== 1 ? "s" : ""}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((ref) => (
                <div
                  key={ref.id}
                  onClick={() => { setSelected(ref); setActiveTab("overview"); }}
                  style={{
                    background: selected.id === ref.id ? `${ACCENT}10` : "rgba(255,255,255,0.03)",
                    border: selected.id === ref.id ? `1px solid ${ACCENT}55` : "1px solid rgba(255,255,255,0.07)",
                    borderLeft: `3px solid ${OUTCOME_COLORS[ref.outcomeClass]}`,
                    borderRadius: 10,
                    padding: "14px",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: DOMAIN_COLORS[ref.domain] ?? DOMAIN_COLORS.default, background: `${DOMAIN_COLORS[ref.domain] ?? DOMAIN_COLORS.default}15`, padding: "1px 6px", borderRadius: 3 }}>{ref.domain}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: TYPE_COLORS[ref.type], background: `${TYPE_COLORS[ref.type]}15`, padding: "1px 6px", borderRadius: 3 }}>{ref.type.replace(/-/g, " ")}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: OUTCOME_COLORS[ref.outcomeClass], background: `${OUTCOME_COLORS[ref.outcomeClass]}15`, padding: "1px 6px", borderRadius: 3, marginLeft: "auto" }}>{ref.outcomeClass}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 4, lineHeight: 1.3 }}>{ref.title}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{ref.agentName}</div>
                  <div style={{ display: "flex", gap: 8, fontSize: 10, color: "#334155" }}>
                    <a
                      href={`/operations/alloy/traces?traceId=${ref.traceId}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: ACCENT, fontFamily: "monospace", textDecoration: "none", borderBottom: `1px solid ${ACCENT}40` }}
                    >
                      tr: {ref.traceId} ↗
                    </a>
                    <span style={{ marginLeft: "auto" }}>{new Date(ref.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </div>
                  {ref.candidateSkills.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                      {ref.candidateSkills.map((skill) => (
                        <span key={skill.name} style={{ fontSize: 9, color: SKILL_STATUS_COLORS[skill.status], background: `${SKILL_STATUS_COLORS[skill.status]}15`, padding: "1px 6px", borderRadius: 3, border: `1px solid ${SKILL_STATUS_COLORS[skill.status]}30` }}>⊕ {skill.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", color: "#475569", fontSize: 13, padding: "40px 0" }}>No reflections match the current filters</div>
              )}
            </div>
          </div>

          <div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${OUTCOME_COLORS[selected.outcomeClass]}30`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: DOMAIN_COLORS[selected.domain] ?? DOMAIN_COLORS.default, background: `${DOMAIN_COLORS[selected.domain] ?? DOMAIN_COLORS.default}15`, padding: "2px 8px", borderRadius: 4 }}>{selected.domain.toUpperCase()}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLORS[selected.type], background: `${TYPE_COLORS[selected.type]}15`, padding: "2px 8px", borderRadius: 4, textTransform: "capitalize" }}>{selected.type.replace(/-/g, " ")}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: OUTCOME_COLORS[selected.outcomeClass], background: `${OUTCOME_COLORS[selected.outcomeClass]}15`, padding: "2px 8px", borderRadius: 4, textTransform: "capitalize" }}>{selected.outcomeClass}</span>
                <a
                  href={`/operations/alloy/traces?traceId=${selected.traceId}`}
                  style={{ fontSize: 10, color: ACCENT, fontFamily: "monospace", marginLeft: "auto", textDecoration: "none", borderBottom: `1px solid ${ACCENT}40` }}
                >
                  Trace: {selected.traceId} ↗
                </a>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{selected.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 12 }}>
                <span>{selected.agentName}</span>
                <span>{new Date(selected.timestamp).toLocaleString()}</span>
              </div>
              {selected.linkedReflections && selected.linkedReflections.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 10, color: "#475569" }}>
                  Linked reflections: {selected.linkedReflections.join(", ")}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 4, width: "fit-content" }}>
              {(["overview", "skills", "strategy"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? ACCENT : "transparent", color: activeTab === tab ? "#fff" : "#64748b", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", transition: "all 0.12s" }}>
                  {tab === "skills" ? `Skills (${selected.candidateSkills.length})` : tab === "strategy" ? `Strategy (${selected.strategyUpdates.length})` : "Overview"}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Context</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{selected.context}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: "#22c55e08", border: "1px solid #22c55e25", borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>✓ What Worked</div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                      {selected.whatWorked.map((item, i) => (
                        <li key={i} style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, display: "flex", gap: 8 }}>
                          <span style={{ color: "#22c55e", flexShrink: 0, marginTop: 1 }}>+</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: "#ef444408", border: "1px solid #ef444425", borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>✕ What Failed</div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                      {selected.whatFailed.map((item, i) => (
                        <li key={i} style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, display: "flex", gap: 8 }}>
                          <span style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }}>−</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}30`, borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>◈ Core Lesson</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.7 }}>{selected.lesson}</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Tags</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {selected.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: 10, color: "#64748b", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 4 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "skills" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {selected.candidateSkills.length === 0 && (
                  <div style={{ textAlign: "center", color: "#475569", fontSize: 13, padding: "40px 0" }}>No candidate skills for this reflection</div>
                )}
                {selected.candidateSkills.map((skill) => (
                  <div key={skill.name} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${SKILL_STATUS_COLORS[skill.status]}30`, borderRadius: 10, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: SKILL_STATUS_COLORS[skill.status], background: `${SKILL_STATUS_COLORS[skill.status]}18`, padding: "2px 8px", borderRadius: 4, textTransform: "capitalize" }}>{skill.status.replace(/-/g, " ")}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: IMPACT_COLORS[skill.estimatedImpact], background: `${IMPACT_COLORS[skill.estimatedImpact]}15`, padding: "2px 8px", borderRadius: 4 }}>Impact: {skill.estimatedImpact}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", fontFamily: "monospace", marginBottom: 8 }}>⊕ {skill.name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{skill.description}</div>
                      </div>
                    </div>
                    {skill.status === "proposed" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Accept for Review</button>
                        <button style={{ background: "rgba(255,255,255,0.05)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "7px 16px", fontSize: 11, cursor: "pointer" }}>Reject</button>
                      </div>
                    )}
                    {skill.status === "under-review" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Adopt Skill</button>
                        <button style={{ background: "rgba(255,255,255,0.05)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "7px 16px", fontSize: 11, cursor: "pointer" }}>Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "strategy" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {selected.strategyUpdates.length === 0 && (
                  <div style={{ textAlign: "center", color: "#475569", fontSize: 13, padding: "40px 0" }}>No strategy updates for this reflection</div>
                )}
                {selected.strategyUpdates.map((update, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${ACCENT}25`, borderRadius: 10, padding: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>Strategy Update: {update.area}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div style={{ background: "#ef444408", border: "1px solid #ef444425", borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Current</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{update.current}</div>
                      </div>
                      <div style={{ background: "#22c55e08", border: "1px solid #22c55e25", borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Proposed</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{update.proposed}</div>
                      </div>
                    </div>
                    <div style={{ background: `${ACCENT}08`, borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 9, color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Rationale</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{update.rationale}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Apply Update</button>
                      <button style={{ background: "rgba(255,255,255,0.05)", color: "#64748b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "7px 16px", fontSize: 11, cursor: "pointer" }}>Defer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </CognitiveLayout>
  );
}
