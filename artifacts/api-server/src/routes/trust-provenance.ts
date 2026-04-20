import { Router, type IRouter, type Request, type Response } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { randomUUID } from "crypto";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";

const router = Router();

type Domain = "aegis" | "terra" | "vessels";

function normalizeDomain(raw: unknown): Domain {
  if (raw === "terra") return "terra";
  if (raw === "vessels") return "vessels";
  return "aegis";
}

function now(offsetMs = 0): string {
  return new Date(Date.now() - offsetMs).toISOString();
}

function proofChain(domain: Domain) {
  if (domain === "terra") {
    return [
      {
        proofId: 2001,
        contentId: "market-valuation-v7",
        contentType: "property_valuation",
        sourceClass: "llm_generated",
        confidenceScore: 0.82,
        modelId: "gpt-4o",
        modelProvider: "OpenAI",
        modelLane: "real-estate-analysis",
        reviewState: "approved",
        exportSafetyState: "safe",
        reviewedBy: "Dana P. — Senior Analyst",
        reviewedAt: now(7200000),
        reviewNote: "Validated against 12 comparable sales. Margin of error ±3.2% at 95% CI.",
        generatedAt: now(14400000),
        serviceAttribution: "Terra Valuation Engine v4",
        actorAttribution: "AI Market Intelligence Agent",
        inputSources: [
          { type: "comparable_sale", id: "comp-0041", label: "14 Elm St — sold $4.2M (Mar 2026)" },
          { type: "comparable_sale", id: "comp-0038", label: "22 Oak Ave — sold $3.8M (Feb 2026)" },
          { type: "market_data", id: "mls-q2-26", label: "MLS Q2 2026 Market Report" },
          { type: "zoning_data", id: "zone-r2b", label: "R-2B Zoning Classification" },
        ],
        lineage: [
          { label: "Raw MLS data ingested", sourceClass: "external_feed", at: now(21600000) },
          { label: "Comparable selection algorithm run", sourceClass: "system_computed", at: now(18000000) },
          { label: "Valuation narrative generated", sourceClass: "llm_generated", at: now(14400000) },
        ],
      },
      {
        proofId: 2002,
        contentId: "distress-score-prop-1124",
        contentType: "distress_score",
        sourceClass: "system_computed",
        confidenceScore: 0.91,
        reviewState: "approved",
        exportSafetyState: "safe",
        generatedAt: now(3600000),
        serviceAttribution: "Distress Engine v2.1",
        inputSources: [
          { type: "public_record", id: "lien-889", label: "Lien record — $127K outstanding" },
          { type: "payment_history", id: "pay-hist-1124", label: "Payment delinquency pattern (6 months)" },
          { type: "market_trend", id: "trend-q2", label: "Local market trend — 8.2% appreciation" },
        ],
      },
      {
        proofId: 2003,
        contentId: "investment-memo-prop-2245",
        contentType: "investment_memo",
        sourceClass: "llm_summarized",
        confidenceScore: 0.68,
        modelId: "claude-3-5-sonnet",
        modelProvider: "Anthropic",
        reviewState: "unreviewed",
        exportSafetyState: "pending_review",
        generatedAt: now(900000),
        serviceAttribution: "Terra Copilot v1.5",
        contradictionMarkers: [
          "Projected rental income conflicts with local vacancy rate data — difference $340/mo",
          "Cap rate assumption (6.2%) above market median (5.4%) — requires justification",
        ],
        inputSources: [
          { type: "deal_data", id: "deal-2245", label: "Deal file — 2245 Harbor Blvd" },
          { type: "market_analysis", id: "terra-ai-analysis", label: "AI Market Analysis" },
        ],
      },
    ];
  }

  if (domain === "vessels") {
    return [
      {
        proofId: 3001,
        contentId: "sanctions-risk-mv-poseidon",
        contentType: "sanctions_assessment",
        sourceClass: "llm_generated",
        confidenceScore: 0.89,
        modelId: "gpt-4o",
        modelProvider: "OpenAI",
        modelLane: "sanctions-compliance",
        reviewState: "approved",
        exportSafetyState: "safe",
        reviewedBy: "Chen L. — Compliance Officer",
        reviewedAt: now(1800000),
        reviewNote: "Confirmed AIS manipulation pattern. Recommend freezing trade activity pending OFAC verification.",
        generatedAt: now(3600000),
        serviceAttribution: "Vessels Sanctions Engine v3",
        actorAttribution: "CORTEX-Maritime Sentinel",
        inputSources: [
          { type: "ais_feed", id: "ais-live-001", label: "AIS Live Feed — Position dark for 42h" },
          { type: "sanctions_list", id: "ofac-sdn-2026", label: "OFAC SDN List — Q2 2026" },
          { type: "ownership_graph", id: "ihs-ownership-01", label: "IHS Ownership Graph — MV Poseidon" },
          { type: "port_call_history", id: "portcall-poseidon", label: "Port Call History — 18 months" },
        ],
        lineage: [
          { label: "AIS dark event detected", sourceClass: "sensor_data", at: now(48 * 3600000) },
          { label: "Ownership chain analyzed", sourceClass: "system_computed", at: now(24 * 3600000) },
          { label: "Sanctions proximity scored", sourceClass: "system_computed", at: now(6 * 3600000) },
          { label: "Risk narrative generated", sourceClass: "llm_generated", at: now(3600000) },
        ],
      },
      {
        proofId: 3002,
        contentId: "voyage-pnl-voy-2026-044",
        contentType: "voyage_pnl",
        sourceClass: "system_computed",
        confidenceScore: 0.96,
        reviewState: "approved",
        exportSafetyState: "safe",
        generatedAt: now(900000),
        serviceAttribution: "Voyage P&L Engine v2",
        inputSources: [
          { type: "bunker_prices", id: "bunker-api-live", label: "Live Bunker Prices — Rotterdam" },
          { type: "port_dues", id: "port-dues-singapore", label: "Port Dues — Singapore" },
          { type: "freight_rate", id: "baltic-dry-index", label: "Baltic Dry Index — Spot" },
        ],
      },
    ];
  }

  return [
    {
      proofId: 1001,
      contentId: "threat-summary-v4",
      contentType: "threat_assessment",
      sourceClass: "llm_generated",
      confidenceScore: 0.87,
      modelId: "gpt-4o",
      modelProvider: "OpenAI",
      modelVersion: "2024-11",
      modelLane: "threat-intelligence",
      reviewState: "approved",
      exportSafetyState: "safe",
      reviewedBy: "Sarah K. — SOC Lead",
      reviewedAt: now(3600000),
      reviewNote: "Verified against MITRE ATT&CK framework. Recommend immediate action.",
      generatedAt: now(7200000),
      serviceAttribution: "CORTEX-Sentinel v2.1",
      actorAttribution: "Autonomous Threat Engine",
      inputSources: [
        { type: "threat_feed", id: "feed-001", label: "CISA Advisory AA24-193A" },
        { type: "internal_log", id: "siem-4421", label: "SIEM Event Cluster #4421" },
        { type: "osint", id: "osint-9982", label: "Shodan Scan Results" },
      ],
      lineage: [
        { label: "Raw SIEM logs ingested", sourceClass: "sensor_data", at: now(10800000) },
        { label: "Pattern correlation run", sourceClass: "system_computed", at: now(9000000) },
        { label: "Threat narrative generated", sourceClass: "llm_generated", at: now(7200000) },
      ],
    },
    {
      proofId: 1002,
      contentId: "incident-report-ir-2026-044",
      contentType: "incident_report",
      sourceClass: "hybrid",
      confidenceScore: 0.72,
      modelId: "claude-3-5-sonnet",
      modelProvider: "Anthropic",
      modelLane: "incident-response",
      reviewState: "unreviewed",
      exportSafetyState: "pending_review",
      generatedAt: now(1800000),
      serviceAttribution: "CORTEX-IR v1.8",
      inputSources: [
        { type: "incident_ticket", id: "ir-044", label: "Incident IR-2026-044" },
        { type: "forensic_log", id: "forlog-221", label: "Endpoint Forensic Data" },
      ],
      contradictionMarkers: [
        "Timeline inconsistency between endpoint log and SIEM — delta 4 min",
        "Threat actor TTPs partially overlap with known APT29 but attribution uncertain",
      ],
    },
    {
      proofId: 1003,
      contentId: "vuln-assessment-2026-q2",
      contentType: "vulnerability_assessment",
      sourceClass: "system_computed",
      confidenceScore: 0.95,
      reviewState: "approved",
      exportSafetyState: "safe",
      reviewedBy: "James M. — CISO",
      reviewedAt: now(86400000),
      generatedAt: now(172800000),
      serviceAttribution: "AVM Engine v3",
      inputSources: [
        { type: "scan_result", id: "scan-q2-01", label: "Nessus Q2 Scan" },
        { type: "cve_database", id: "nvd-2026", label: "NVD CVE Database" },
      ],
    },
  ];
}

function auditLog(domain: Domain) {
  if (domain === "terra") {
    return [
      { id: "t-001", timestamp: Date.now() - 200000, actionType: "ai_decision", actor: "Terra AI Engine", actorType: "ai_model", domain: "Terra", action: "Property valuation generated — 47 Maple St ($3.95M ± 3.2%)", confidence: 0.82, modelUsed: "gpt-4o", proofId: 2001, riskLevel: "medium", immutableHash: "a1b2c3d4e5f6a7b8" },
      { id: "t-002", timestamp: Date.now() - 700000, actionType: "human_approval", actor: "Dana P.", actorType: "human", domain: "Terra", action: "Valuation approved — 47 Maple St", approvedBy: "Dana P. — Senior Analyst", outcome: "Export safety state: Safe · Available for client distribution", riskLevel: "low", immutableHash: "b2c3d4e5f6a7b8c9" },
      { id: "t-003", timestamp: Date.now() - 1500000, actionType: "recommendation", actor: "Terra Distress Engine", actorType: "agent", domain: "Terra", action: "High-distress property flagged — 89 River Rd (distress score 91/100)", confidence: 0.91, outcome: "Added to acquisition target list", riskLevel: "high", immutableHash: "c3d4e5f6a7b8c9d0" },
      { id: "t-004", timestamp: Date.now() - 3600000, actionType: "policy_evaluation", actor: "Covenant Engine", actorType: "system", domain: "Terra", action: "Transaction approval policy evaluated — $4.8M deal", policyId: "high_value_transaction", outcome: "Escalated to Deal Manager", riskLevel: "medium", immutableHash: "d4e5f6a7b8c9d0e1" },
      { id: "t-005", timestamp: Date.now() - 7200000, actionType: "export", actor: "Marcus T.", actorType: "human", domain: "Terra", action: "Investment memo exported to investor deck — 2245 Harbor Blvd", proofId: 2003, outcome: "Awaiting proof review before export", riskLevel: "high", immutableHash: "e5f6a7b8c9d0e1f2" },
    ];
  }

  if (domain === "vessels") {
    return [
      { id: "v-001", timestamp: Date.now() - 180000, actionType: "ai_decision", actor: "CORTEX-Maritime", actorType: "ai_model", domain: "Vessels", action: "AIS dark vessel detected — MV Poseidon (42h gap)", confidence: 0.89, modelUsed: "gpt-4o", proofId: 3001, riskLevel: "critical", immutableHash: "a1f2e3d4c5b6a7b8" },
      { id: "v-002", timestamp: Date.now() - 600000, actionType: "escalation", actor: "Covenant Engine", actorType: "system", domain: "Vessels", action: "Trade freeze escalated to Compliance Officer — sanctions proximity score 0.89", policyId: "vessel_sanctions_response", outcome: "Compliance review queued", riskLevel: "critical", immutableHash: "b2f3e4d5c6b7a8c9" },
      { id: "v-003", timestamp: Date.now() - 3600000, actionType: "recommendation", actor: "Vessels AI Agent", actorType: "agent", domain: "Vessels", action: "Voyage re-routing recommended — avoid high-risk corridor (Gulf of Aden)", confidence: 0.78, outcome: "Alternative route proposed: +1.4 days, -$42K risk cost", riskLevel: "high", immutableHash: "c3f4e5d6c7b8a9d0" },
      { id: "v-004", timestamp: Date.now() - 7200000, actionType: "human_approval", actor: "Marcus O.", actorType: "human", domain: "Vessels", action: "Voyage P&L approved for VES-2026-044 — Rotterdam to Singapore", approvedBy: "Marcus O. — Commercial Director", outcome: "Voyage executed · Estimated profit $218K", riskLevel: "low", immutableHash: "d4f5e6d7c8b9a0e1" },
      { id: "v-005", timestamp: Date.now() - 14400000, actionType: "proof_review", actor: "Chen L.", actorType: "human", domain: "Vessels", action: "Voyage P&L proof reviewed and cleared for export", proofId: 3002, outcome: "Export safety: Safe", riskLevel: "info", immutableHash: "e5f6e7d8c9b0a1f2" },
    ];
  }

  return [
    { id: "aud-001", timestamp: Date.now() - 300000, actionType: "ai_decision", actor: "CORTEX-Sentinel", actorType: "ai_model", domain: "Aegis", action: "Threat assessment generated for APT-class activity", entityType: "threat", confidence: 0.87, modelUsed: "gpt-4o", proofId: 1001, outcome: "High-severity alert raised · Human review queued", riskLevel: "high", immutableHash: "a3f9d2c7e1b84fa6" },
    { id: "aud-002", timestamp: Date.now() - 900000, actionType: "human_approval", actor: "Sarah K.", actorType: "human", domain: "Aegis", action: "Approved threat assessment and escalated to incident response", entityType: "threat", approvedBy: "Sarah K. — SOC Lead", outcome: "IR-2026-044 opened", riskLevel: "high", immutableHash: "b7e4f1a9c3d25e08", chainLink: "aud-001" },
    { id: "aud-003", timestamp: Date.now() - 1800000, actionType: "policy_evaluation", actor: "Covenant Engine", actorType: "system", domain: "Aegis", action: "External notification policy evaluated — ESCALATE", policyId: "security_incident_response", outcome: "Escalation to Security Manager initiated", riskLevel: "medium", immutableHash: "c2a8f3b1d74e96f0" },
    { id: "aud-004", timestamp: Date.now() - 3600000, actionType: "agent_action", actor: "CORTEX-Graph", actorType: "agent", domain: "Multi-Domain", action: "Cross-domain correlation: Aegis threat linked to Vessels AIS anomaly", confidence: 0.74, outcome: "Correlation published to PRISM Bus", riskLevel: "high", immutableHash: "d5c1e9a2f3b74806" },
    { id: "aud-005", timestamp: Date.now() - 7200000, actionType: "human_denial", actor: "James M.", actorType: "human", domain: "Aegis", action: "Denied automated IP blocking rule — insufficient evidence", overrideReason: "Correlation score below threshold for automated action. Requires manual investigation first.", outcome: "Agent action blocked · Manual review assigned", riskLevel: "medium", immutableHash: "e8b6d0c4f2a31975" },
    { id: "aud-006", timestamp: Date.now() - 10800000, actionType: "proof_review", actor: "Sarah K.", actorType: "human", domain: "Aegis", action: "Proof chain reviewed and approved for Q2 vulnerability assessment", proofId: 1003, outcome: "Export safety state updated to 'safe'", riskLevel: "low", immutableHash: "f1a7c3e5b9d04268" },
    { id: "aud-007", timestamp: Date.now() - 14400000, actionType: "export", actor: "Michael T.", actorType: "human", domain: "Aegis", action: "Vulnerability assessment exported to board risk report", entityType: "document", proofId: 1003, outcome: "Export completed · 3 recipients", riskLevel: "low", immutableHash: "a9e2b5f8c0d31674" },
    { id: "aud-008", timestamp: Date.now() - 86400000, actionType: "config_change", actor: "System", actorType: "system", domain: "Aegis", action: "Threat intelligence feed rotation — CISA feeds updated", outcome: "4 feeds rotated · Coverage gap: none", riskLevel: "info", immutableHash: "b3f0a7d4c8e91502" },
  ];
}

function covenantDecisions(domain: Domain) {
  if (domain === "terra") {
    return [
      {
        requestId: "terra-pol-001",
        effect: "allow",
        allowed: true,
        policyName: "Standard Deal Execution",
        reason: "Analyst with deal manager role — standard transaction within policy parameters",
        matchedPolicies: ["deal_execution_standard"],
        subject: { userId: "user-dana-p", roles: ["analyst", "deal_manager"] },
        resource: { type: "deal", domain: "terra" },
        action: "create_deal",
        evaluatedAt: Date.now() - 600000,
        durationMs: 2,
      },
      {
        requestId: "terra-pol-002",
        effect: "escalate",
        allowed: false,
        policyName: "High-Value Transaction Governance",
        reason: "Transaction value $4.8M exceeds analyst approval threshold ($2M) — requires senior approval",
        matchedPolicies: ["high_value_transaction", "deal_approval_chain"],
        subject: { userId: "user-dana-p", roles: ["analyst"] },
        resource: { type: "transaction", domain: "terra" },
        action: "approve_transaction",
        escalationPath: [
          "Analyst (initiator — Dana P.)",
          "Deal Manager — approval for $2M-$5M transactions",
          "Principal — approval for $5M+ transactions",
        ],
        approvalHistory: [
          { approver: "Dana P. — Analyst", decision: "approved", at: now(1200000), note: "Strong deal fundamentals — recommending approval" },
          { approver: "Mark R. — Deal Manager", decision: "pending" },
        ],
        whatNeedsToChange: [
          "Deal Manager approval required for transactions $2M-$5M",
          "Environmental assessment must be attached for properties above $3M",
          "Title report required to be less than 60 days old",
        ],
        evaluatedAt: Date.now() - 1800000,
        durationMs: 4,
      },
    ];
  }

  if (domain === "vessels") {
    return [
      {
        requestId: "vessels-pol-001",
        effect: "escalate",
        allowed: false,
        policyName: "Vessel Sanctions Response",
        reason: "Sanctions proximity alert on MV Poseidon — trade freeze requires compliance officer approval",
        matchedPolicies: ["vessel_sanctions_response", "trade_freeze_governance"],
        subject: { userId: "user-ops-001", roles: ["operator"] },
        resource: { type: "trade_freeze_action", domain: "vessels" },
        action: "freeze_trade_activity",
        escalationPath: [
          "Operations Operator (initiator)",
          "Compliance Officer — review within 2 hours",
          "CISO — if UN sanctions involvement confirmed",
          "Legal — if breach of sanctions law suspected",
        ],
        approvalHistory: [
          { approver: "Chen L. — Compliance Officer", decision: "pending", at: now(1800000) },
        ],
        whatNeedsToChange: [
          "Compliance Officer must verify OFAC SDN match before trade freeze",
          "Legal hold instruction must be issued simultaneously",
          "Counterparty notification protocol must be activated",
        ],
        evaluatedAt: Date.now() - 2400000,
        durationMs: 5,
      },
    ];
  }

  return [
    {
      requestId: "cov-req-001",
      effect: "escalate",
      allowed: false,
      policyName: "Security Incident Response",
      reason: "Critical incident response requires CISO approval before external notification",
      matchedPolicies: ["security_incident_response", "external_communication_review"],
      subject: { userId: "user-sarah-k", roles: ["analyst", "soc_lead"] },
      resource: { type: "incident_notification", domain: "aegis", actionClass: "external_communication" },
      action: "send_external_notification",
      escalationPath: [
        "SOC Lead (initiator)",
        "Security Manager — review within 1 hour",
        "CISO — final approval for external communications",
      ],
      approvalHistory: [
        { approver: "Sarah K. — SOC Lead", decision: "approved", at: now(900000), note: "Escalating per IR policy" },
        { approver: "Michael T. — Security Manager", decision: "pending", at: now(300000) },
      ],
      whatNeedsToChange: [
        "CISO role must approve external communications for critical incidents",
        "Notification draft must be reviewed for PII/sensitive data",
        "Legal review required if incident involves potential regulatory breach",
      ],
      evaluatedAt: Date.now() - 1200000,
      durationMs: 3,
    },
    {
      requestId: "cov-req-002",
      effect: "deny",
      allowed: false,
      policyName: "Audit Log Immutability Guard",
      reason: "Audit log modification is permanently prohibited — append-only enforcement",
      matchedPolicies: ["audit_immutability_policy"],
      deniedBy: "covenant:audit-immutability-guard",
      subject: { userId: "user-ops-001", roles: ["operator"] },
      resource: { type: "audit_log", domain: "aegis" },
      action: "modify_audit_log",
      whatNeedsToChange: [
        "This action is permanently blocked regardless of role",
        "Audit logs are immutable by design — no exception path exists",
        "If correction is needed, create an amendment record instead",
      ],
      evaluatedAt: Date.now() - 5400000,
      durationMs: 1,
    },
  ];
}

function simulationResults(domain: Domain) {
  if (domain === "terra") {
    return {
      title: "Deal Decision Cockpit",
      description: "2245 Harbor Blvd — Acquisition analysis · 10,000 Monte Carlo iterations",
      primaryMetricLabel: "Projected Net Profit",
      iterationsRun: 10000,
      confidenceLevel: 0.95,
      lastRunAt: "30 minutes ago",
      predictedVsActual: [
        { label: "Harbor Point Portfolio — 2025 acquisition", predicted: 480000, actual: 520000, format: "currency", unit: "$", at: "Q4 2025", delta: 40000 },
        { label: "Riverside Deal — 2024 acquisition", predicted: 310000, actual: 260000, format: "currency", unit: "$", at: "Q2 2024", delta: -50000 },
      ],
      scenarios: [
        {
          id: "optimistic",
          label: "Optimistic",
          description: "Strong market, full occupancy, at-ask price",
          probability: 0.25,
          tag: "high-upside",
          primaryMetric: { best: 680000, base: 520000, worst: 320000, format: "currency", unit: "$" },
          metrics: {
            irr: { label: "IRR", best: 0.192, base: 0.148, worst: 0.089, format: "percent" },
            payback_years: { label: "Payback Period", best: 5.2, base: 6.8, worst: 9.1, format: "days", unit: "yrs" },
          },
          sensitivityDrivers: [
            { id: "occupancy", label: "Occupancy Rate", impact: 0.44, direction: "positive" },
            { id: "market_appreciation", label: "Market Appreciation", impact: 0.38, direction: "positive" },
            { id: "financing_rate", label: "Financing Rate", impact: -0.29, direction: "negative" },
            { id: "renovation_overrun", label: "Renovation Overrun", impact: -0.18, direction: "negative" },
          ],
          costOfWaiting: { perDay: 1200, description: "Daily opportunity cost vs current best-offer" },
          recommendation: "Strong return profile. Proceed if due diligence confirms occupancy assumptions.",
          recommendationStrength: "moderate",
        },
        {
          id: "base",
          label: "Base Case",
          description: "Market-median assumptions, 90% occupancy",
          probability: 0.5,
          tag: "baseline",
          primaryMetric: { best: 480000, base: 340000, worst: 160000, format: "currency", unit: "$" },
          metrics: {
            irr: { label: "IRR", best: 0.152, base: 0.112, worst: 0.058, format: "percent" },
            payback_years: { label: "Payback Period", best: 6.6, base: 8.9, worst: 13.2, format: "days", unit: "yrs" },
          },
          sensitivityDrivers: [
            { id: "occupancy", label: "Occupancy Rate", impact: 0.41, direction: "positive" },
            { id: "market_appreciation", label: "Market Appreciation", impact: 0.31, direction: "positive" },
            { id: "financing_rate", label: "Financing Rate", impact: -0.35, direction: "negative" },
          ],
          costOfWaiting: { perDay: 900 },
          recommendation: "Acceptable return at base case. Sensitivity to financing rate is the primary risk.",
          recommendationStrength: "moderate",
        },
        {
          id: "stressed",
          label: "Stressed",
          description: "Rate spike, soft market, 78% occupancy",
          probability: 0.25,
          tag: "low-risk",
          primaryMetric: { best: 180000, base: 60000, worst: -120000, format: "currency", unit: "$" },
          metrics: {
            irr: { label: "IRR", best: 0.082, base: 0.031, worst: -0.028, format: "percent" },
          },
          recommendation: "Negative outcome possible under severe stress scenario. Require interest rate cap before proceeding.",
          recommendationStrength: "strong",
        },
      ],
    };
  }

  if (domain === "vessels") {
    return {
      title: "Voyage P&L Decision Cockpit",
      description: "MV Pacific Star — Rotterdam to Singapore · 10,000 Monte Carlo iterations",
      primaryMetricLabel: "Net Voyage Profit",
      iterationsRun: 10000,
      confidenceLevel: 0.90,
      lastRunAt: "45 minutes ago",
      predictedVsActual: [
        { label: "VES-2026-038 — Rotterdam → Shanghai", predicted: 180000, actual: 204000, format: "currency", unit: "$", at: "March 2026", delta: 24000 },
        { label: "VES-2026-021 — Antwerp → Singapore", predicted: 250000, actual: 195000, format: "currency", unit: "$", at: "January 2026", delta: -55000 },
      ],
      scenarios: [
        {
          id: "direct-route",
          label: "Direct Route",
          description: "Fastest — via Suez Canal",
          probability: 0.45,
          tag: "preferred",
          primaryMetric: { best: 340000, base: 218000, worst: 82000, format: "currency", unit: "$" },
          metrics: {
            transit_days: { label: "Transit Days", best: 18, base: 21, worst: 26, format: "days", unit: "days" },
            bunker_cost: { label: "Bunker Cost", best: 88000, base: 112000, worst: 142000, format: "currency", unit: "$" },
          },
          sensitivityDrivers: [
            { id: "freight_rate", label: "Freight Rate (BDI)", impact: 0.55, direction: "positive" },
            { id: "bunker_price", label: "Bunker Price", impact: -0.38, direction: "negative" },
            { id: "canal_congestion", label: "Canal Congestion", impact: -0.24, direction: "negative" },
            { id: "port_delay", label: "Port Delay Risk", impact: -0.19, direction: "negative" },
          ],
          costOfWaiting: { perDay: 8500, description: "Daily demurrage + opportunity cost vs next available fixture" },
          recommendation: "Optimal under current freight rates. Proceed if sanctions clearance confirmed within 48h.",
          recommendationStrength: "strong",
        },
        {
          id: "cape-route",
          label: "Cape Route",
          description: "Longer — avoids Suez risk, higher bunker",
          probability: 0.35,
          tag: "low-risk",
          primaryMetric: { best: 280000, base: 145000, worst: -20000, format: "currency", unit: "$" },
          metrics: {
            transit_days: { label: "Transit Days", best: 28, base: 33, worst: 41, format: "days", unit: "days" },
            bunker_cost: { label: "Bunker Cost", best: 138000, base: 168000, worst: 210000, format: "currency", unit: "$" },
          },
          sensitivityDrivers: [
            { id: "freight_rate", label: "Freight Rate (BDI)", impact: 0.51, direction: "positive" },
            { id: "bunker_price", label: "Bunker Price", impact: -0.47, direction: "negative" },
          ],
          costOfWaiting: { perDay: 9200 },
          recommendation: "Valid if Suez risk is assessed as high. Bunker cost is the primary sensitivity driver.",
          recommendationStrength: "moderate",
        },
        {
          id: "wait-for-market",
          label: "Wait for Market",
          description: "Hold 7-10 days, renegotiate freight rate",
          probability: 0.2,
          tag: "high-upside",
          primaryMetric: { best: 420000, base: 180000, worst: -85000, format: "currency", unit: "$" },
          sensitivityDrivers: [
            { id: "bdi_movement", label: "BDI Movement", impact: 0.71, direction: "mixed" },
          ],
          costOfWaiting: { perDay: 12000, description: "Vessel idle cost during wait period" },
          recommendation: "High variance. Only viable if BDI is trending up. Requires 7-day hold cost coverage.",
          recommendationStrength: "weak",
        },
      ],
    };
  }

  return {
    title: "Incident Response Decision Cockpit",
    description: "APT-class threat — IR-2026-044 · Simulation based on 10,000 Monte Carlo iterations",
    primaryMetricLabel: "Time to Containment",
    iterationsRun: 10000,
    confidenceLevel: 0.95,
    lastRunAt: "2 hours ago",
    predictedVsActual: [
      { label: "IR-2026-038 — Ransomware containment", predicted: 6, actual: 5, format: "days", unit: "days", at: "March 2026", delta: -1 },
      { label: "IR-2026-021 — Supply chain compromise", predicted: 12, actual: 18, format: "days", unit: "days", at: "January 2026", delta: 6 },
    ],
    scenarios: [
      {
        id: "contain-fast",
        label: "Rapid Contain",
        description: "Immediate isolation and remediation",
        probability: 0.4,
        tag: "preferred",
        primaryMetric: { best: 2, base: 4, worst: 8, unit: "days", format: "days" },
        metrics: {
          exposure_cost: { label: "Exposure Cost", best: 85000, base: 150000, worst: 380000, format: "currency", unit: "$" },
          affected_systems: { label: "Affected Systems", best: 3, base: 7, worst: 18, format: "number" },
        },
        sensitivityDrivers: [
          { id: "isolation_speed", label: "Isolation Speed", impact: -0.52, direction: "positive" },
          { id: "lateral_movement", label: "Lateral Movement Risk", impact: 0.41, direction: "negative" },
          { id: "patch_coverage", label: "Patch Coverage", impact: -0.28, direction: "positive" },
        ],
        costOfWaiting: { perDay: 38000, perWeek: 210000, description: "Each day of delay increases blast radius and recovery cost" },
        recommendation: "Initiate containment protocol immediately. Isolate affected segments before threat actor achieves persistence.",
        recommendationStrength: "strong",
      },
      {
        id: "monitor-assess",
        label: "Monitor & Assess",
        description: "Observe before acting to gather intelligence",
        probability: 0.35,
        tag: "low-risk",
        primaryMetric: { best: 5, base: 9, worst: 21, unit: "days", format: "days" },
        metrics: {
          exposure_cost: { label: "Exposure Cost", best: 150000, base: 320000, worst: 850000, format: "currency", unit: "$" },
          affected_systems: { label: "Affected Systems", best: 6, base: 14, worst: 35, format: "number" },
        },
        sensitivityDrivers: [
          { id: "threat_actor_speed", label: "Threat Actor Speed", impact: 0.65, direction: "negative" },
          { id: "intelligence_gain", label: "Intelligence Gained", impact: -0.18, direction: "positive" },
        ],
        costOfWaiting: { perDay: 52000, description: "Higher daily cost vs rapid contain due to ongoing exposure window" },
        recommendation: "Only viable if threat actor is early-stage and intelligence value outweighs exposure risk.",
        recommendationStrength: "weak",
      },
      {
        id: "baseline",
        label: "No Action",
        description: "Current state baseline for comparison",
        probability: 0.25,
        tag: "baseline",
        primaryMetric: { best: 14, base: 30, worst: 90, unit: "days", format: "days" },
        metrics: {
          exposure_cost: { label: "Exposure Cost", best: 400000, base: 1200000, worst: 4500000, format: "currency", unit: "$" },
          affected_systems: { label: "Affected Systems", best: 20, base: 55, worst: 140, format: "number" },
        },
        costOfWaiting: { perDay: 40000, perWeek: 280000 },
        recommendation: "Not recommended. Without action, threat actor likely achieves full persistence.",
        recommendationStrength: "strong",
      },
    ],
  };
}

const policyAppealLog: Array<{ id: string; requestId: string; action: string; justification?: string; recordedAt: string }> = [];

router.get("/proof-chain", validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const domain = normalizeDomain(req.query.domain);
    const records = proofChain(domain);
    sendSuccess(res, { domain, records, total: records.length, fetchedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "proof-chain");
  }
});

router.get("/audit-log", validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const domain = normalizeDomain(req.query.domain);
    const rawLimit = parseInt(String(req.query.limit ?? "50"), 10);
    const limit = Math.min(200, Number.isNaN(rawLimit) || rawLimit < 1 ? 50 : rawLimit);
    const entries = auditLog(domain).slice(0, limit);
    sendSuccess(res, { domain, entries, total: entries.length, fetchedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "audit-log");
  }
});

router.post("/audit-log/policy-appeal", validateBody(bodyShape({
      "action": z.unknown().optional(),
      "justification": z.unknown().optional(),
      "requestId": z.unknown().optional(),
    })), (req: Request, res: Response) => {
  try {
    const { requestId, action, justification } = req.body as {
      requestId?: string;
      action?: string;
      justification?: string;
    };
    if (!requestId || !action) {
      res.status(400).json({ error: "requestId and action are required" });
      return;
    }
    const record = {
      id: randomUUID(),
      requestId,
      action,
      justification,
      recordedAt: new Date().toISOString(),
    };
    policyAppealLog.unshift(record);
    if (policyAppealLog.length > 200) policyAppealLog.length = 200;
    sendSuccess(res, { recorded: true, appealId: record.id, recordedAt: record.recordedAt });
  } catch (err) {
    handleRouteError(res, err, "audit-log/policy-appeal");
  }
});

router.get("/covenant/decisions", validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const domain = normalizeDomain(req.query.domain);
    const decisions = covenantDecisions(domain);
    sendSuccess(res, { domain, decisions, total: decisions.length, fetchedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "covenant/decisions");
  }
});

router.get("/simulations/results", validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const domain = normalizeDomain(req.query.domain);
    const result = simulationResults(domain);
    sendSuccess(res, { domain, ...result, fetchedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "simulations/results");
  }
});

export default router;
export function register(r: IRouter): void { r.use(router); }
