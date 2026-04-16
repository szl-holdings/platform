import React, { useState } from "react";
import { Anchor, Shield, FileSearch, Clock, Activity } from "lucide-react";
import { ProofPanel, PolicyResult, AdminAuditTrail, SimulationCockpit } from "@szl-holdings/shared-ui";
import type { ProofPanelData, PolicyDecisionRecord, AuditTrailEntry, SimulationScenario } from "@szl-holdings/shared-ui";

const ACCENT = "#0ea5e9";

const DEMO_PROOFS: ProofPanelData[] = [
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
    reviewedAt: new Date(Date.now() - 1800000).toISOString(),
    reviewNote: "Confirmed AIS manipulation pattern. Recommend freezing trade activity pending OFAC verification.",
    generatedAt: new Date(Date.now() - 3600000).toISOString(),
    serviceAttribution: "Vessels Sanctions Engine v3",
    actorAttribution: "CORTEX-Maritime Sentinel",
    inputSources: [
      { type: "ais_feed", id: "ais-live-001", label: "AIS Live Feed — Position dark for 42h" },
      { type: "sanctions_list", id: "ofac-sdn-2026", label: "OFAC SDN List — Q2 2026" },
      { type: "ownership_graph", id: "ihs-ownership-01", label: "IHS Ownership Graph — MV Poseidon" },
      { type: "port_call_history", id: "portcall-poseidon", label: "Port Call History — 18 months" },
    ],
    lineage: [
      { label: "AIS dark event detected", sourceClass: "sensor_data", at: new Date(Date.now() - 48 * 3600000).toISOString() },
      { label: "Ownership chain analyzed", sourceClass: "system_computed", at: new Date(Date.now() - 24 * 3600000).toISOString() },
      { label: "Sanctions proximity scored", sourceClass: "system_computed", at: new Date(Date.now() - 6 * 3600000).toISOString() },
      { label: "Risk narrative generated", sourceClass: "llm_generated", at: new Date(Date.now() - 3600000).toISOString() },
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
    generatedAt: new Date(Date.now() - 900000).toISOString(),
    serviceAttribution: "Voyage P&L Engine v2",
    inputSources: [
      { type: "bunker_prices", id: "bunker-api-live", label: "Live Bunker Prices — Rotterdam" },
      { type: "port_dues", id: "port-dues-singapore", label: "Port Dues — Singapore" },
      { type: "freight_rate", id: "baltic-dry-index", label: "Baltic Dry Index — Spot" },
    ],
  },
];

const DEMO_POLICY_DECISIONS: PolicyDecisionRecord[] = [
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
      { approver: "Chen L. — Compliance Officer", decision: "pending", at: new Date(Date.now() - 1800000).toISOString() },
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

const DEMO_AUDIT_ENTRIES: AuditTrailEntry[] = [
  { id: "v-001", timestamp: Date.now() - 180000, actionType: "ai_decision", actor: "CORTEX-Maritime", actorType: "ai_model", domain: "Vessels", action: "AIS dark vessel detected — MV Poseidon (42h gap)", confidence: 0.89, modelUsed: "gpt-4o", proofId: 3001, riskLevel: "critical", immutableHash: "a1f2e3d4c5b6a7b8" },
  { id: "v-002", timestamp: Date.now() - 600000, actionType: "escalation", actor: "Covenant Engine", actorType: "system", domain: "Vessels", action: "Trade freeze escalated to Compliance Officer — sanctions proximity score 0.89", policyId: "vessel_sanctions_response", outcome: "Compliance review queued", riskLevel: "critical", immutableHash: "b2f3e4d5c6b7a8c9" },
  { id: "v-003", timestamp: Date.now() - 3600000, actionType: "recommendation", actor: "Vessels AI Agent", actorType: "agent", domain: "Vessels", action: "Voyage re-routing recommended — avoid high-risk corridor (Gulf of Aden)", confidence: 0.78, outcome: "Alternative route proposed: +1.4 days, -$42K risk cost", riskLevel: "high", immutableHash: "c3f4e5d6c7b8a9d0" },
  { id: "v-004", timestamp: Date.now() - 7200000, actionType: "human_approval", actor: "Marcus O.", actorType: "human", domain: "Vessels", action: "Voyage P&L approved for VES-2026-044 — Rotterdam to Singapore", approvedBy: "Marcus O. — Commercial Director", outcome: "Voyage executed · Estimated profit $218K", riskLevel: "low", immutableHash: "d4f5e6d7c8b9a0e1" },
  { id: "v-005", timestamp: Date.now() - 14400000, actionType: "proof_review", actor: "Chen L.", actorType: "human", domain: "Vessels", action: "Voyage P&L proof reviewed and cleared for export", proofId: 3002, outcome: "Export safety: Safe", riskLevel: "info", immutableHash: "e5f6e7d8c9b0a1f2" },
];

const VOYAGE_SCENARIOS: SimulationScenario[] = [
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
];

type View = "proofs" | "policy" | "audit" | "simulation";

export default function TrustProvenancePage() {
  const [view, setView] = useState<View>("simulation");

  const tabs: Array<{ id: View; label: string }> = [
    { id: "simulation", label: "Voyage Cockpit" },
    { id: "proofs", label: "AI Proof Chains" },
    { id: "policy", label: "Policy Governance" },
    { id: "audit", label: "Audit Trail" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
          <Anchor className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-sky-50">Trust & Provenance Center</h1>
          <p className="text-xs text-sky-400/50">Voyage simulation · AI proof chains · Policy governance · Decision audit</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Proof Records", value: 1_204, icon: FileSearch, color: "text-sky-400" },
          { label: "Pending Reviews", value: 2, icon: Clock, color: "text-orange-400" },
          { label: "Policies Active", value: 21, icon: Shield, color: "text-purple-400" },
          { label: "Voyages Simulated", value: 87, icon: Activity, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900/80 border border-sky-500/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <div className="text-lg font-bold text-sky-50">{value.toLocaleString()}</div>
              <div className="text-[10px] text-sky-400/50">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-slate-900/60 border border-sky-500/10 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              view === tab.id
                ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                : "text-sky-400/50 hover:text-sky-400/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "simulation" && (
        <div className="space-y-4">
          <p className="text-xs text-sky-400/50 px-1">VES-2026-044 Rotterdam → Singapore — 3 routing scenarios with Monte Carlo P&L ranges</p>
          <SimulationCockpit
            title="Voyage P&L Decision Cockpit"
            description="MV Pacific Star — Rotterdam to Singapore · 10,000 Monte Carlo iterations"
            scenarios={VOYAGE_SCENARIOS}
            primaryMetricLabel="Net Voyage Profit"
            iterationsRun={10000}
            confidenceLevel={0.90}
            lastRunAt="45 minutes ago"
            accentColor={ACCENT}
            predictedVsActual={[
              { label: "VES-2026-038 — Rotterdam → Shanghai", predicted: 180000, actual: 204000, format: "currency", unit: "$", at: "March 2026", delta: 24000 },
              { label: "VES-2026-021 — Antwerp → Singapore", predicted: 250000, actual: 195000, format: "currency", unit: "$", at: "January 2026", delta: -55000 },
            ]}
          />
        </div>
      )}

      {view === "proofs" && (
        <div className="space-y-4">
          <p className="text-xs text-sky-400/50 px-1">AI-generated sanctions assessments, voyage P&L computations with full provenance metadata</p>
          {DEMO_PROOFS.map(proof => (
            <ProofPanel key={proof.proofId} proof={proof} variant="drawer" accentColor={ACCENT} showActions />
          ))}
        </div>
      )}

      {view === "policy" && (
        <div className="space-y-4">
          <p className="text-xs text-sky-400/50 px-1">Covenant policy evaluation results for sanctions alerts and trade freeze governance</p>
          {DEMO_POLICY_DECISIONS.map((d, i) => (
            <PolicyResult key={i} decision={d} accentColor={ACCENT} showDetails />
          ))}
        </div>
      )}

      {view === "audit" && (
        <AdminAuditTrail entries={DEMO_AUDIT_ENTRIES} title="Vessels Decision Audit Trail" accentColor={ACCENT} domainLabel="Maritime Intelligence" />
      )}
    </div>
  );
}
