import React, { useState, useCallback } from "react";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { ACCENT, BASE_URL, apiUrl } from "./cognitive/shared";

type AutonomyMode = "observe" | "recommend" | "draft" | "ask-to-act" | "approved-act";
type PolicyState = "unchecked" | "allowed" | "requires_approval" | "blocked";
type ApprovalMode = "none" | "pending" | "approved" | "rejected" | "escalated";
type Urgency = "routine" | "moderate" | "urgent" | "critical";

interface Evidence {
  id: string;
  kind: string;
  label: string;
  value: string;
  source: string;
  freshness: { capturedAt: string; isStale: boolean };
  confidence: number;
  weight: number;
}

interface PolicyDecision {
  allowed: boolean;
  policyState: PolicyState;
  requiresApproval: boolean;
  requiredApproverRole?: string;
  matchedPolicies: Array<{ policyId: string; ruleName: string; effect: string }>;
  violations: Array<{ policyId: string; policyName: string; reason: string }>;
  reasoning: string;
  evaluatedAt: number;
}

interface RecommendationResult {
  id: string;
  runId: string;
  traceId: string;
  title: string;
  summary: string;
  reasoning: string;
  domain: string;
  confidence: number;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  evidence: Evidence[];
  freshness: { generatedAt: string; isStale: boolean; validUntil?: string };
  policyState: PolicyState;
  policyDecision?: PolicyDecision;
  approvalMode: ApprovalMode;
  autonomyMode: AutonomyMode;
  urgency: Urgency;
  suggestedAction?: string;
  metadata: Record<string, unknown>;
}

const URGENCY_COLOR: Record<Urgency, string> = {
  routine: "#64748b",
  moderate: "#f59e0b",
  urgent: "#f97316",
  critical: "#ef4444",
};

const POLICY_COLOR: Record<PolicyState, string> = {
  unchecked: "#64748b",
  allowed: "#22c55e",
  requires_approval: "#f59e0b",
  blocked: "#ef4444",
};

const APPROVAL_COLOR: Record<ApprovalMode, string> = {
  none: "#64748b",
  pending: "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444",
  escalated: "#a855f7",
};

const AUTONOMY_DESCRIPTIONS: Record<AutonomyMode, string> = {
  observe: "Read-only — Alloy watches and logs only",
  recommend: "Alloy surfaces recommendations; humans decide",
  draft: "Alloy drafts content or plans for human review",
  "ask-to-act": "Alloy proposes actions and waits for explicit approval",
  "approved-act": "Alloy executes autonomously within approved bounds",
};

const DOMAIN_OPTIONS = ["aegis", "vessels", "terra", "prism", "pulse", "custom"];
const AUTONOMY_OPTIONS: AutonomyMode[] = ["observe", "recommend", "draft", "ask-to-act", "approved-act"];
const URGENCY_OPTIONS: Urgency[] = ["routine", "moderate", "urgent", "critical"];

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 85 ? "#22c55e" : pct >= 70 ? "#84cc16" : pct >= 50 ? "#f59e0b" : pct >= 30 ? "#f97316" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 40, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

function Chip({ label, color, small }: { label: string; color: string; small?: boolean }) {
  return (
    <span style={{
      fontSize: small ? 9 : 10,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: 4,
      padding: small ? "1px 5px" : "2px 8px",
    }}>
      {label}
    </span>
  );
}

function EvidenceCard({ ev, isSupporting, isContra }: { ev: Evidence; isSupporting: boolean; isContra: boolean }) {
  const borderColor = isContra ? "#ef444440" : isSupporting ? "#22c55e40" : "#334155";
  const accent = isContra ? "#ef4444" : isSupporting ? "#22c55e" : "#64748b";
  return (
    <div style={{
      background: "#0f172a",
      border: `1px solid ${borderColor}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 6,
      padding: "10px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{ev.label}</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Chip label={ev.kind} color="#8b7ac8" small />
          {isContra && <Chip label="contra" color="#ef4444" small />}
          {isSupporting && <Chip label="supporting" color="#22c55e" small />}
          {ev.freshness.isStale && <Chip label="stale" color="#f59e0b" small />}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8" }}>{ev.value}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#64748b" }}>Source: {ev.source}</span>
        <span style={{ fontSize: 10, color: "#64748b" }}>
          confidence {Math.round(ev.confidence * 100)}% · weight {ev.weight.toFixed(2)}
        </span>
      </div>
      <div style={{ fontSize: 10, color: "#475569" }}>
        captured {new Date(ev.freshness.capturedAt).toLocaleString()}
      </div>
    </div>
  );
}

function ProofEnvelope({ result }: { result: RecommendationResult }) {
  const breakdown = result.metadata?.confidenceBreakdown as string | undefined;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 10,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>{result.title}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              run/{result.runId.slice(0, 8)}… · trace/{result.traceId.slice(0, 8)}…
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Chip label={result.autonomyMode} color={ACCENT} />
            <Chip label={result.urgency} color={URGENCY_COLOR[result.urgency]} />
            <Chip label={result.policyState} color={POLICY_COLOR[result.policyState]} />
            <Chip label={`approval: ${result.approvalMode}`} color={APPROVAL_COLOR[result.approvalMode]} />
          </div>
        </div>

        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{result.summary}</div>

        <div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Confidence</div>
          <ConfidenceBar value={result.confidence} />
          {breakdown && (
            <div style={{ fontSize: 10, color: "#475569", marginTop: 4, fontFamily: "monospace" }}>{breakdown}</div>
          )}
        </div>

        {result.suggestedAction && (
          <div style={{ background: "#1e293b", borderRadius: 6, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 }}>Suggested Action</div>
            <div style={{ fontSize: 13, color: "#e2e8f0" }}>{result.suggestedAction}</div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Reasoning</div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{result.reasoning}</div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#475569" }}>
          <span>generated {new Date(result.freshness.generatedAt).toLocaleString()}</span>
          {result.freshness.validUntil && <span>valid until {new Date(result.freshness.validUntil).toLocaleString()}</span>}
          <span>domain: {result.domain}</span>
        </div>
      </div>

      {result.policyDecision && (
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>Policy Decision</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{result.policyDecision.reasoning}</div>
          {result.policyDecision.matchedPolicies.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {result.policyDecision.matchedPolicies.map((p, i) => (
                <div key={i} style={{ fontSize: 11, color: "#64748b" }}>
                  <span style={{ color: "#8b7ac8" }}>{p.policyId}</span> / {p.ruleName} → <span style={{ color: "#e2e8f0" }}>{p.effect}</span>
                </div>
              ))}
            </div>
          )}
          {result.policyDecision.violations.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
              {result.policyDecision.violations.map((v, i) => (
                <div key={i} style={{ fontSize: 11, color: "#ef4444" }}>⚠ {v.policyName}: {v.reason}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {result.evidence.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Evidence ({result.evidence.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.evidence.map(ev => (
              <EvidenceCard
                key={ev.id}
                ev={ev}
                isSupporting={result.supportingEvidenceIds.includes(ev.id)}
                isContra={result.contradictingEvidenceIds.includes(ev.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const DEMO_PARAMS = {
  title: "Increase fleet buffer inventory ahead of Q3 demand surge",
  summary: "Cross-domain signals indicate a 23% probability of supply chain stress in July. Pre-positioning 15% buffer inventory at key depots reduces expected stockout exposure by $4.2M.",
  reasoning: "Historical Q3 patterns (2021–2024), current supplier lead-time degradation (+18 days), and demand forecast confidence from the logistics model all converge on a shared risk window. Policy allows procurement at this scale without escalation.",
  domain: "vessels",
  urgency: "urgent" as Urgency,
  autonomyMode: "recommend" as AutonomyMode,
  baseConfidence: 0.78,
  suggestedAction: "Pre-approve $1.2M buffer PO for depot sites SIN-01, DXB-02, and HAM-03",
  validForMs: 48 * 60 * 60 * 1000,
  inlineEvidence: [
    { kind: "metric" as const, label: "Q3 Historical Stockout Rate", value: "14.2% average across 4 years", source: "vessels.analytics", confidence: 0.95 },
    { kind: "signal" as const, label: "Supplier Lead-Time Alert", value: "+18 days average vs. baseline (from 6 of 9 key suppliers)", source: "vessels.supplier-monitor", confidence: 0.88 },
    { kind: "observation" as const, label: "Demand Forecast Delta", value: "+23% above baseline for July–August period", source: "vessels.demand-model", confidence: 0.72 },
    { kind: "document" as const, label: "Q2 Board Directive", value: "Minimize stockout exposure to <5% for Tier-1 routes by end of year", source: "szl.governance", confidence: 1.0 },
  ],
};

export function AlloyProofPage() {
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState(DEMO_PARAMS);
  const [showRaw, setShowRaw] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/alloy/recommend"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      const body = await res.json();
      setResult(body.data ?? body);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [params]);

  return (
    <div style={{ minHeight: "100vh", background: "#020817", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#64748b", textTransform: "uppercase" }}>
              @szl/alloy · Proof Envelope
            </span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#f8fafc", letterSpacing: -0.5 }}>Alloy Recommendation Surface</div>
          <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            Every recommendation carries a full proof envelope — evidence, freshness, confidence, policy state, and autonomy mode.
          </div>
        </div>

        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>Parameters</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 10, color: "#64748b", display: "block", marginBottom: 4 }}>DOMAIN</label>
              <select
                value={params.domain}
                onChange={e => setParams(p => ({ ...p, domain: e.target.value }))}
                style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", color: "#e2e8f0", fontSize: 13 }}
              >
                {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#64748b", display: "block", marginBottom: 4 }}>AUTONOMY MODE</label>
              <select
                value={params.autonomyMode}
                onChange={e => setParams(p => ({ ...p, autonomyMode: e.target.value as AutonomyMode }))}
                style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", color: "#e2e8f0", fontSize: 13 }}
              >
                {AUTONOMY_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#64748b", display: "block", marginBottom: 4 }}>URGENCY</label>
              <select
                value={params.urgency}
                onChange={e => setParams(p => ({ ...p, urgency: e.target.value as Urgency }))}
                style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", color: "#e2e8f0", fontSize: 13 }}
              >
                {URGENCY_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#64748b", display: "block", marginBottom: 4 }}>
                BASE CONFIDENCE ({Math.round(params.baseConfidence * 100)}%)
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={params.baseConfidence}
                onChange={e => setParams(p => ({ ...p, baseConfidence: parseFloat(e.target.value) }))}
                style={{ width: "100%", accentColor: ACCENT }}
              />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#475569", background: "#1e293b", borderRadius: 6, padding: "8px 12px" }}>
            <span style={{ color: "#8b7ac8", fontWeight: 600 }}>{params.autonomyMode}</span> — {AUTONOMY_DESCRIPTIONS[params.autonomyMode]}
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            background: loading ? "#1e293b" : ACCENT,
            color: loading ? "#64748b" : "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 20,
            transition: "background 0.2s",
          }}
        >
          {loading ? "Running through Alloy…" : "Generate Recommendation via Alloy"}
        </button>

        {error && (
          <div style={{ background: "#1c0a0a", border: "1px solid #ef444440", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#ef4444", fontSize: 13 }}>
            {error}
          </div>
        )}

        {result && (
          <>
            <ProofEnvelope result={result} />
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setShowRaw(v => !v)}
                style={{ background: "transparent", border: "1px solid #1e293b", borderRadius: 6, color: "#64748b", fontSize: 11, padding: "4px 12px", cursor: "pointer" }}
              >
                {showRaw ? "Hide" : "Show"} raw JSON
              </button>
              {showRaw && (
                <pre style={{ marginTop: 8, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 16, fontSize: 10, color: "#94a3b8", overflow: "auto", maxHeight: 400 }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </>
        )}

        <div style={{ marginTop: 32, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Alloy Runtime — Five Autonomy Modes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(Object.entries(AUTONOMY_DESCRIPTIONS) as [AutonomyMode, string][]).map(([mode, desc]) => (
              <div key={mode} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Chip label={mode} color={ACCENT} />
                <span style={{ fontSize: 12, color: "#64748b" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlloyProofPage;
