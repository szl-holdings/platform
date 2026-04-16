import React, { useState } from "react";
import { Building2, FileSearch, Shield, Clock, TrendingUp } from "lucide-react";
import { ProofPanel, PolicyResult, AdminAuditTrail, SimulationCockpit } from "@szl-holdings/shared-ui";
import type { ProofPanelData, PolicyDecisionRecord, AuditTrailEntry, SimulationScenario } from "@szl-holdings/shared-ui";

const ACCENT = "#f59e0b";

const DEMO_PROOFS: ProofPanelData[] = [
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
    reviewedAt: new Date(Date.now() - 7200000).toISOString(),
    reviewNote: "Validated against 12 comparable sales. Margin of error ±3.2% at 95% CI.",
    generatedAt: new Date(Date.now() - 14400000).toISOString(),
    serviceAttribution: "Terra Valuation Engine v4",
    actorAttribution: "AI Market Intelligence Agent",
    inputSources: [
      { type: "comparable_sale", id: "comp-0041", label: "14 Elm St — sold $4.2M (Mar 2026)" },
      { type: "comparable_sale", id: "comp-0038", label: "22 Oak Ave — sold $3.8M (Feb 2026)" },
      { type: "market_data", id: "mls-q2-26", label: "MLS Q2 2026 Market Report" },
      { type: "zoning_data", id: "zone-r2b", label: "R-2B Zoning Classification" },
    ],
    lineage: [
      { label: "Raw MLS data ingested", sourceClass: "external_feed", at: new Date(Date.now() - 21600000).toISOString() },
      { label: "Comparable selection algorithm run", sourceClass: "system_computed", at: new Date(Date.now() - 18000000).toISOString() },
      { label: "Valuation narrative generated", sourceClass: "llm_generated", at: new Date(Date.now() - 14400000).toISOString() },
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
    generatedAt: new Date(Date.now() - 3600000).toISOString(),
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
    generatedAt: new Date(Date.now() - 900000).toISOString(),
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

const DEMO_POLICY_DECISIONS: PolicyDecisionRecord[] = [
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
      { approver: "Dana P. — Analyst", decision: "approved", at: new Date(Date.now() - 1200000).toISOString(), note: "Strong deal fundamentals — recommending approval" },
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

const DEMO_AUDIT_ENTRIES: AuditTrailEntry[] = [
  { id: "t-001", timestamp: Date.now() - 200000, actionType: "ai_decision", actor: "Terra AI Engine", actorType: "ai_model", domain: "Terra", action: "Property valuation generated — 47 Maple St ($3.95M ± 3.2%)", confidence: 0.82, modelUsed: "gpt-4o", proofId: 2001, riskLevel: "medium", immutableHash: "a1b2c3d4e5f6a7b8" },
  { id: "t-002", timestamp: Date.now() - 700000, actionType: "human_approval", actor: "Dana P.", actorType: "human", domain: "Terra", action: "Valuation approved — 47 Maple St", approvedBy: "Dana P. — Senior Analyst", outcome: "Export safety state: Safe · Available for client distribution", riskLevel: "low", immutableHash: "b2c3d4e5f6a7b8c9" },
  { id: "t-003", timestamp: Date.now() - 1500000, actionType: "recommendation", actor: "Terra Distress Engine", actorType: "agent", domain: "Terra", action: "High-distress property flagged — 89 River Rd (distress score 91/100)", confidence: 0.91, outcome: "Added to acquisition target list", riskLevel: "high", immutableHash: "c3d4e5f6a7b8c9d0" },
  { id: "t-004", timestamp: Date.now() - 3600000, actionType: "policy_evaluation", actor: "Covenant Engine", actorType: "system", domain: "Terra", action: "Transaction approval policy evaluated — $4.8M deal", policyId: "high_value_transaction", outcome: "Escalated to Deal Manager", riskLevel: "medium", immutableHash: "d4e5f6a7b8c9d0e1" },
  { id: "t-005", timestamp: Date.now() - 7200000, actionType: "export", actor: "Marcus T.", actorType: "human", domain: "Terra", action: "Investment memo exported to investor deck — 2245 Harbor Blvd", proofId: 2003, outcome: "Awaiting proof review before export", riskLevel: "high", immutableHash: "e5f6a7b8c9d0e1f2" },
];

const DEAL_SCENARIOS: SimulationScenario[] = [
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
];

type View = "proofs" | "policy" | "audit" | "simulation";

export default function TrustProvenancePage() {
  const [view, setView] = useState<View>("proofs");

  const tabs: Array<{ id: View; label: string }> = [
    { id: "proofs", label: "AI Proof Chains" },
    { id: "policy", label: "Policy Governance" },
    { id: "audit", label: "Audit Trail" },
    { id: "simulation", label: "Deal Simulation" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Trust & Provenance Center</h1>
          <p className="text-xs text-muted-foreground">AI output provenance · Policy governance · Decision audit · Deal simulation cockpit</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Proof Records", value: 2_341, icon: FileSearch, color: "text-amber-400" },
          { label: "Pending Reviews", value: 7, icon: Clock, color: "text-orange-400" },
          { label: "Policies Active", value: 18, icon: Shield, color: "text-purple-400" },
          { label: "Deals Simulated", value: 43, icon: TrendingUp, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <div className="text-lg font-bold">{value.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/30 border border-border rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              view === tab.id
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "proofs" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground px-1">AI-generated valuations, distress scores, and investment memos with full provenance metadata</p>
          {DEMO_PROOFS.map(proof => (
            <ProofPanel key={proof.proofId} proof={proof} variant="drawer" accentColor={ACCENT} showActions />
          ))}
        </div>
      )}

      {view === "policy" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground px-1">Covenant policy evaluation results for deal approvals and transactions</p>
          {DEMO_POLICY_DECISIONS.map((d, i) => (
            <PolicyResult key={i} decision={d} accentColor={ACCENT} showDetails />
          ))}
        </div>
      )}

      {view === "audit" && (
        <AdminAuditTrail entries={DEMO_AUDIT_ENTRIES} title="Terra Decision Audit Trail" accentColor={ACCENT} domainLabel="Real Estate Intelligence" />
      )}

      {view === "simulation" && (
        <SimulationCockpit
          title="Deal Decision Cockpit"
          description="2245 Harbor Blvd — Acquisition analysis · 10,000 Monte Carlo iterations"
          scenarios={DEAL_SCENARIOS}
          primaryMetricLabel="Projected Net Profit"
          iterationsRun={10000}
          confidenceLevel={0.95}
          lastRunAt="30 minutes ago"
          accentColor={ACCENT}
          predictedVsActual={[
            { label: "Harbor Point Portfolio — 2025 acquisition", predicted: 480000, actual: 520000, format: "currency", unit: "$", at: "Q4 2025", delta: 40000 },
            { label: "Riverside Deal — 2024 acquisition", predicted: 310000, actual: 260000, format: "currency", unit: "$", at: "Q2 2024", delta: -50000 },
          ]}
        />
      )}
    </div>
  );
}
