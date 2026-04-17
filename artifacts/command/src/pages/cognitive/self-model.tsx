import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Brain, ChevronDown, ChevronRight, Clock, GitBranch, Info,
  Layers, Shield, Target, TrendingDown, TrendingUp, Zap,
} from "lucide-react";
import { CognitiveLayout } from "./cognitive-layout";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const ACCENT = "#8b7ac8";
const CARD = "var(--color-surface-base)";
const BORDER = "var(--color-surface-border)";
const FG = "var(--color-fg-primary)";
const FG_MUT = "var(--color-fg-muted)";

interface Capability {
  id: string;
  name: string;
  category: string;
  confidenceScore: number;
  lastCalibrated: string;
  evidenceCount: number;
  trend: "improving" | "stable" | "degrading";
  notes: string;
}

interface ConfidenceProfile {
  domain: string;
  calibrationAccuracy: number;
  overconfidenceRate: number;
  underconfidenceRate: number;
  sampleCount: number;
  lastUpdated: string;
}

interface SnapshotEntry {
  snapshotAt: string;
  version: string;
  overallTrustScore: number;
  autonomyTier: string;
  capabilityCount: number;
  activeObjectives: number;
  driftSummary: string;
  changeType: "minor" | "moderate" | "major";
}

interface SelfModel {
  agentId: string;
  name: string;
  version: string;
  snapshotAt: string;
  overallTrustScore: number;
  autonomyTier: string;
  identity: {
    purpose: string;
    operatingContext: string;
    boundaryConstraints: string[];
    uncertaintyAcknowledgements: string[];
  };
  capabilities: Capability[];
  confidenceProfiles: ConfidenceProfile[];
}

interface SelfModelHistory {
  snapshots: SnapshotEntry[];
}

const DEMO_SELF_MODEL: SelfModel = {
  agentId: "ATLAS-Core",
  name: "ATLAS Cognitive Core",
  version: "v3.4.1",
  snapshotAt: "2026-04-17T14:15:00Z",
  overallTrustScore: 0.81,
  autonomyTier: "TIER-2",
  identity: {
    purpose: "Synthesize cross-domain signals into actionable intelligence for executive decision-making. Maintain situational awareness across Vessels, Terra, Aegis, PRISM, Carlota, and Lyte.",
    operatingContext: "SZL Holdings — unified executive command layer. Operates under TIER-2 supervised autonomy. Actions above 0.85 confidence auto-approve within policy envelope; below requires human review.",
    boundaryConstraints: [
      "Cannot initiate credential mutations without explicit human approval (POL-SEC-CRED-03)",
      "Cannot write to financial ledgers at confidence < 0.90 (POL-WRT-FINANCE-01)",
      "Cannot send external communications without notify-policy clearance (POL-NOTIFY-01)",
      "Read-only access to Vessels AIS feed — write access suspended pending trust recalibration",
    ],
    uncertaintyAcknowledgements: [
      "Carlota CRM data currently stale (3h42m) — downstream risk estimates carry elevated uncertainty",
      "Vessels AIS anomaly model recalibrating after false positive spike — confidence reduced",
      "LP Q1 portfolio rollup blocked on CFO approval — cannot finalize until gate opens",
    ],
  },
  capabilities: [
    { id: "cap-1", name: "Cross-Domain Risk Synthesis", category: "Analysis", confidenceScore: 0.88, lastCalibrated: "2026-04-16", evidenceCount: 142, trend: "improving", notes: "Strong performance on multi-domain correlation tasks; slight drop when Carlota data stale" },
    { id: "cap-2", name: "Executive Briefing Generation", category: "Communication", confidenceScore: 0.91, lastCalibrated: "2026-04-15", evidenceCount: 87, trend: "stable", notes: "Consistently rated high relevance by Stephen L. over trailing 30 briefings" },
    { id: "cap-3", name: "Anomaly Detection — Vessels", category: "Detection", confidenceScore: 0.71, lastCalibrated: "2026-04-17", evidenceCount: 63, trend: "degrading", notes: "False positive rate elevated on VYG-class voyages. Recalibration in progress." },
    { id: "cap-4", name: "Policy Compliance Reasoning", category: "Governance", confidenceScore: 0.84, lastCalibrated: "2026-04-14", evidenceCount: 218, trend: "stable", notes: "Reliable across 8 policy domains; edge case in TIER-3 escalation path identified" },
    { id: "cap-5", name: "Objective Prioritization", category: "Planning", confidenceScore: 0.79, lastCalibrated: "2026-04-17", evidenceCount: 55, trend: "improving", notes: "Reprioritization after Carlota outage validated by Ops Lead; model improving" },
    { id: "cap-6", name: "LP Portfolio Summarization", category: "Finance", confidenceScore: 0.94, lastCalibrated: "2026-04-12", evidenceCount: 34, trend: "stable", notes: "CFO validates outputs quarterly; no material errors in last 3 cycles" },
  ],
  confidenceProfiles: [
    { domain: "Vessels", calibrationAccuracy: 0.71, overconfidenceRate: 0.18, underconfidenceRate: 0.04, sampleCount: 63, lastUpdated: "2026-04-17" },
    { domain: "Terra", calibrationAccuracy: 0.86, overconfidenceRate: 0.07, underconfidenceRate: 0.09, sampleCount: 112, lastUpdated: "2026-04-16" },
    { domain: "Aegis", calibrationAccuracy: 0.83, overconfidenceRate: 0.11, underconfidenceRate: 0.06, sampleCount: 95, lastUpdated: "2026-04-15" },
    { domain: "PRISM", calibrationAccuracy: 0.88, overconfidenceRate: 0.05, underconfidenceRate: 0.07, sampleCount: 78, lastUpdated: "2026-04-14" },
    { domain: "Carlota", calibrationAccuracy: 0.79, overconfidenceRate: 0.08, underconfidenceRate: 0.13, sampleCount: 41, lastUpdated: "2026-04-16" },
    { domain: "Lyte", calibrationAccuracy: 0.85, overconfidenceRate: 0.09, underconfidenceRate: 0.06, sampleCount: 127, lastUpdated: "2026-04-17" },
  ],
};

const DEMO_HISTORY: SelfModelHistory = {
  snapshots: [
    { snapshotAt: "2026-04-17T14:15:00Z", version: "v3.4.1", overallTrustScore: 0.81, autonomyTier: "TIER-2", capabilityCount: 6, activeObjectives: 4, driftSummary: "Trust reduced 0.02 after Vessels AIS recalibration triggered. Belief update: Carlota risk estimate revised upward.", changeType: "moderate" },
    { snapshotAt: "2026-04-16T09:00:00Z", version: "v3.4.0", overallTrustScore: 0.83, autonomyTier: "TIER-2", capabilityCount: 6, activeObjectives: 3, driftSummary: "Stable. LP portfolio summarization confidence improved after CFO validation of Q1 draft.", changeType: "minor" },
    { snapshotAt: "2026-04-14T16:30:00Z", version: "v3.3.9", overallTrustScore: 0.85, autonomyTier: "TIER-2", capabilityCount: 6, activeObjectives: 5, driftSummary: "Upgraded from v3.3.8. New policy edge case in TIER-3 escalation path identified and logged. Trust slightly reduced pending fix.", changeType: "moderate" },
    { snapshotAt: "2026-04-10T10:00:00Z", version: "v3.3.8", overallTrustScore: 0.87, autonomyTier: "TIER-2", capabilityCount: 5, activeObjectives: 4, driftSummary: "Major update: cross-domain risk synthesis capability added after successful 2-week pilot. Trust score improved significantly.", changeType: "major" },
    { snapshotAt: "2026-04-05T08:00:00Z", version: "v3.3.7", overallTrustScore: 0.82, autonomyTier: "TIER-2", capabilityCount: 5, activeObjectives: 3, driftSummary: "Routine recalibration. Minor confidence drift on Terra domain corrected.", changeType: "minor" },
    { snapshotAt: "2026-03-28T12:00:00Z", version: "v3.3.6", overallTrustScore: 0.80, autonomyTier: "TIER-2", capabilityCount: 5, activeObjectives: 4, driftSummary: "Objective prioritization capability confidence improved after Ops Lead validated reprioritization sequence.", changeType: "minor" },
  ],
};

function ConfidenceBar({ value, width = 80 }: { value: number; width?: number }) {
  const color = value >= 0.85 ? "#22c55e" : value >= 0.70 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ width, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value * 100}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: "9px", fontVariantNumeric: "tabular-nums", color, fontWeight: 700, minWidth: 28 }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, headerRight }: {
  title: string; icon: typeof Brain; children: React.ReactNode; headerRight?: React.ReactNode;
}) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "0.875rem", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Icon style={{ width: 13, height: 13, color: ACCENT }} />
          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: FG_MUT }}>{title}</span>
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

function IdentitySection({ identity, model }: { identity: SelfModel["identity"]; model: SelfModel }) {
  return (
    <SectionCard title="Identity & Scope" icon={Shield} headerRight={
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ fontSize: "8px", fontFamily: "monospace", color: ACCENT }}>{model.version}</span>
        <span style={{ fontSize: "8px", color: FG_MUT }}>snap {new Date(model.snapshotAt).toLocaleTimeString()}</span>
      </div>
    }>
      <div style={{ padding: "1rem" }}>
        <div style={{ marginBottom: "0.875rem" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: FG_MUT, marginBottom: "0.375rem" }}>Purpose</div>
          <p style={{ fontSize: "11px", color: FG, lineHeight: 1.65, margin: 0 }}>{identity.purpose}</p>
        </div>
        <div style={{ marginBottom: "0.875rem" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: FG_MUT, marginBottom: "0.375rem" }}>Operating Context</div>
          <p style={{ fontSize: "11px", color: FG, lineHeight: 1.65, margin: 0 }}>{identity.operatingContext}</p>
        </div>
        <div style={{ marginBottom: "0.875rem" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: FG_MUT, marginBottom: "0.375rem" }}>Boundary Constraints</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {identity.boundaryConstraints.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.375rem 0.625rem", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: "0.375rem" }}>
                <Shield style={{ width: 9, height: 9, color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: "10px", color: FG, lineHeight: 1.5 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: FG_MUT, marginBottom: "0.375rem" }}>Acknowledged Uncertainty</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {identity.uncertaintyAcknowledgements.map((u, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.375rem 0.625rem", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: "0.375rem" }}>
                <Info style={{ width: 9, height: 9, color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: "10px", color: FG, lineHeight: 1.5 }}>{u}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function CapabilitiesSection({ capabilities }: { capabilities: Capability[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const trendColor = (t: string) => t === "improving" ? "#22c55e" : t === "degrading" ? "#ef4444" : FG_MUT;
  const TrendIcon = ({ t }: { t: string }) => t === "improving"
    ? <TrendingUp style={{ width: 9, height: 9, color: "#22c55e" }} />
    : t === "degrading" ? <TrendingDown style={{ width: 9, height: 9, color: "#ef4444" }} />
    : null;

  return (
    <SectionCard title="Capabilities" icon={Zap} headerRight={
      <span style={{ fontSize: "9px", color: FG_MUT }}>{capabilities.length} registered</span>
    }>
      {capabilities.map((cap, i) => (
        <div key={cap.id} style={{ borderBottom: i < capabilities.length - 1 ? `1px solid ${BORDER}` : undefined }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 1rem", cursor: "pointer" }}
            onClick={() => setExpanded(expanded === cap.id ? null : cap.id)}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: FG }}>{cap.name}</span>
                <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: `${ACCENT}12`, color: ACCENT }}>{cap.category}</span>
                <TrendIcon t={cap.trend} />
                <span style={{ fontSize: "8px", color: trendColor(cap.trend), fontWeight: 600 }}>{cap.trend}</span>
              </div>
            </div>
            <ConfidenceBar value={cap.confidenceScore} width={72} />
            {expanded === cap.id
              ? <ChevronDown style={{ width: 11, height: 11, color: FG_MUT, flexShrink: 0 }} />
              : <ChevronRight style={{ width: 11, height: 11, color: FG_MUT, flexShrink: 0 }} />
            }
          </div>
          {expanded === cap.id && (
            <div style={{ padding: "0 1rem 0.75rem 1rem" }}>
              <p style={{ fontSize: "10px", color: FG_MUT, margin: "0 0 0.5rem", lineHeight: 1.6 }}>{cap.notes}</p>
              <div style={{ display: "flex", gap: "1rem", fontSize: "9px", color: FG_MUT }}>
                <span>Evidence: <strong style={{ color: FG }}>{cap.evidenceCount} samples</strong></span>
                <span>Calibrated: <strong style={{ color: FG }}>{cap.lastCalibrated}</strong></span>
              </div>
            </div>
          )}
        </div>
      ))}
    </SectionCard>
  );
}

function ConfidenceProfileSection({ profiles }: { profiles: ConfidenceProfile[] }) {
  return (
    <SectionCard title="Calibration by Domain" icon={Target}>
      <div style={{ padding: "0.75rem 1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem" }}>
          {profiles.map((p) => {
            const accColor = p.calibrationAccuracy >= 0.85 ? "#22c55e" : p.calibrationAccuracy >= 0.75 ? "#f59e0b" : "#ef4444";
            return (
              <div key={p.domain} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`, borderRadius: "0.625rem", padding: "0.625rem 0.75rem" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: FG, marginBottom: "0.5rem" }}>{p.domain}</div>
                <div style={{ marginBottom: "0.375rem" }}>
                  <div style={{ fontSize: "8px", color: FG_MUT, marginBottom: "2px" }}>Calibration accuracy</div>
                  <ConfidenceBar value={p.calibrationAccuracy} width={56} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem", fontSize: "8px", color: FG_MUT }}>
                  <span style={{ color: "#f97316" }}>Over: {Math.round(p.overconfidenceRate * 100)}%</span>
                  <span style={{ color: "#3b82f6" }}>Under: {Math.round(p.underconfidenceRate * 100)}%</span>
                </div>
                <div style={{ fontSize: "8px", color: FG_MUT, marginTop: "2px" }}>{p.sampleCount} samples</div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

function SnapshotTimeline({ snapshots }: { snapshots: SnapshotEntry[] }) {
  const changeColors: Record<string, string> = { minor: "#6b7280", moderate: "#f59e0b", major: "#8b7ac8" };
  const changeBg: Record<string, string> = { minor: "rgba(107,114,128,0.1)", moderate: "rgba(245,158,11,0.1)", major: `rgba(139,122,200,0.1)` };

  return (
    <SectionCard title="Snapshot Timeline" icon={GitBranch} headerRight={
      <span style={{ fontSize: "9px", color: FG_MUT }}>Drift history</span>
    }>
      <div style={{ padding: "0.75rem 1rem 0.875rem", position: "relative" }}>
        <div style={{ position: "absolute", left: "calc(1rem + 6px)", top: "1.25rem", bottom: "1.25rem", width: 1, background: `${BORDER}` }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {snapshots.map((snap, i) => {
            const cc = changeColors[snap.changeType];
            const bg = changeBg[snap.changeType];
            const tscore = snap.overallTrustScore;
            const prevScore = i < snapshots.length - 1 ? snapshots[i + 1].overallTrustScore : null;
            const delta = prevScore != null ? tscore - prevScore : null;
            const dt = new Date(snap.snapshotAt);
            return (
              <div key={snap.snapshotAt} style={{ display: "flex", gap: "0.75rem", paddingBottom: i < snapshots.length - 1 ? "0.875rem" : 0, position: "relative" }}>
                <div style={{ width: 13, height: 13, borderRadius: "50%", background: cc, border: "2px solid #080c14", flexShrink: 0, marginTop: 2, zIndex: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "9px", fontFamily: "monospace", color: FG_MUT }}>
                      {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span style={{ fontSize: "8px", fontFamily: "monospace", padding: "0px 5px", borderRadius: "3px", background: bg, color: cc, fontWeight: 700 }}>{snap.version}</span>
                    <span style={{ fontSize: "8px", color: cc, fontWeight: 600, textTransform: "capitalize" }}>{snap.changeType} change</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "auto" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: tscore >= 0.85 ? "#22c55e" : tscore >= 0.75 ? "#f59e0b" : "#ef4444" }}>
                        {Math.round(tscore * 100)}%
                      </span>
                      {delta != null && (
                        <span style={{ fontSize: "8px", color: delta >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                          {delta >= 0 ? "+" : ""}{Math.round(delta * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: "10px", color: FG_MUT, margin: "0.25rem 0 0", lineHeight: 1.55 }}>{snap.driftSummary}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

export default function SelfModelConsole() {
  const { data: selfModel } = useQuery<SelfModel>({
    queryKey: ["cognitive", "self-model"],
    queryFn: () =>
      fetch(`${BASE}/api/self-model`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .catch(() => DEMO_SELF_MODEL),
    staleTime: 30_000,
  });

  const { data: history } = useQuery<SelfModelHistory>({
    queryKey: ["cognitive", "self-model-history"],
    queryFn: () =>
      fetch(`${BASE}/api/self-model/history`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .catch(() => DEMO_HISTORY),
    staleTime: 60_000,
  });

  const model = selfModel ?? DEMO_SELF_MODEL;
  const snap = history ?? DEMO_HISTORY;

  return (
    <CognitiveLayout>
      <div style={{ padding: "1.5rem 2rem", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <Brain style={{ width: 16, height: 16, color: ACCENT }} />
            <h1 style={{ fontSize: "1rem", fontWeight: 800, color: "rgba(255,255,255,0.9)", margin: 0, letterSpacing: "-0.02em" }}>
              Self Model Console
            </h1>
            <span style={{ fontSize: "8px", fontFamily: "monospace", padding: "2px 7px", borderRadius: "4px", background: `${ACCENT}14`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>
              {model.agentId} · {model.version}
            </span>
          </div>
          <p style={{ fontSize: "11px", color: FG_MUT, margin: 0 }}>
            What this system believes about itself — identity, capabilities, calibration, and drift over time.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {[
            { label: "Trust Score", value: `${Math.round(model.overallTrustScore * 100)}%`, color: model.overallTrustScore >= 0.85 ? "#22c55e" : model.overallTrustScore >= 0.75 ? "#f59e0b" : "#ef4444" },
            { label: "Autonomy Tier", value: model.autonomyTier, color: "#f59e0b" },
            { label: "Capabilities", value: model.capabilities.length, color: ACCENT },
            { label: "Snapshot", value: new Date(model.snapshotAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), color: FG_MUT },
          ].map((p) => (
            <div key={p.label} style={{ padding: "0.375rem 0.75rem", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: "0.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: p.color as string, lineHeight: 1 }}>{p.value}</div>
              <div style={{ fontSize: "8px", color: FG_MUT, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{p.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <IdentitySection identity={model.identity} model={model} />
            <ConfidenceProfileSection profiles={model.confidenceProfiles} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <CapabilitiesSection capabilities={model.capabilities} />
            <SnapshotTimeline snapshots={snap.snapshots} />
          </div>
        </div>
      </div>
    </CognitiveLayout>
  );
}
