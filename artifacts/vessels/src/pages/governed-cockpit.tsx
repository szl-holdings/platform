import React, { useState } from "react";
import { ProofEnvelope, AutonomyModeToggle, type AutonomyMode, type EvidenceSource, type PolicyState, productAccent } from "@szl-holdings/design-system";
import { RiskEvidenceList } from "@szl-holdings/shared-ui/risk-evidence";
import { Ship, AlertTriangle, Navigation, Anchor } from "lucide-react";

const ACCENT = productAccent.vessels;

const FRESH_3M = new Date(Date.now() - 3 * 60_000).toISOString();
const FRESH_10M = new Date(Date.now() - 10 * 60_000).toISOString();
const AGING_30M = new Date(Date.now() - 30 * 60_000).toISOString();

const ROUTING_EVIDENCE: EvidenceSource[] = [
  { id: "ev-v1", label: "NOAA Weather Routing Model — Leg 3", type: "api", timestamp: FRESH_3M, excerpt: "Cyclone Aiko (Cat 2) projected track updated 3m ago. 95% probability of interference with nominal route SIN→HAM on Day 4." },
  { id: "ev-v2", label: "Port State Control Risk Index — Hamburg", type: "document", timestamp: FRESH_10M, excerpt: "HAM PSC inspection rate elevated to 38% (vs 22% baseline). Flag state NIL deficiency record provides partial offset." },
  { id: "ev-v3", label: "Historical Voyage Archive — 18 mo", type: "model", timestamp: AGING_30M, excerpt: "Northern route via Rotterdam adds +1.3 days average but reduces weather-related delay probability by 67%." },
  { id: "ev-v4", label: "Charter Party Clause CP-14b", type: "document", timestamp: AGING_30M, excerpt: "Owner entitled to deviate up to 2 degrees lat/lon from agreed route to avoid peril. No charterer consent required." },
];

const SANCTIONS_EVIDENCE: EvidenceSource[] = [
  { id: "ev-s1", label: "OFAC SDN List — Automated Screening", type: "api", timestamp: FRESH_3M, excerpt: "Counterparty 'Starline Maritime SA' matches OFAC SDN entry with 94% name-match confidence. Registered Panama." },
  { id: "ev-s2", label: "Dow Jones Risk & Compliance DB", type: "document", timestamp: FRESH_10M, excerpt: "Parent entity 'Starline Group' subject to EU restrictive measures since March 2024. Ultimate beneficial owner identified." },
  { id: "ev-s3", label: "AIS Position History — 90 days", type: "signal", timestamp: AGING_30M, excerpt: "3 port calls to sanctioned jurisdiction (BND) in prior 90 days. AIS transmitter disabled for 14h during two transits." },
];

const MAINTENANCE_EVIDENCE: EvidenceSource[] = [
  { id: "ev-m1", label: "Main Engine Telemetry — MV Horizon Star", type: "signal", timestamp: FRESH_3M, excerpt: "Cylinder 4 exhaust temp deviation: +42°C above baseline for 6h. Vibration signature consistent with liner wear." },
  { id: "ev-m2", label: "Class Maintenance Record", type: "document", timestamp: AGING_30M, excerpt: "Last scheduled overhaul: 14 months ago. Class requires attention at 18 months or 8,000 running hours (current: 7,840h)." },
  { id: "ev-m3", label: "Predictive Maintenance Model v3.1", type: "model", timestamp: FRESH_10M, excerpt: "P(failure before next port call) = 0.31 based on telemetry trend. Proactive intervention reduces downtime cost by avg $340K." },
];

export default function GovernedCockpit() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>("ask-to-act");

  return (
    <div className="min-h-screen" style={{ background: "#060b12", color: "#c8d8e8", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="border-b" style={{ borderColor: "#1a2535", background: "#0d1520" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}40` }}>
              <Ship className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "#c8d8e8" }}>Vessels — Governed Maritime Intelligence</div>
              <div className="text-xs" style={{ color: "#4a6070" }}>Every routing decision, risk flag, and alert carries a full proof chain</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest" style={{ color: "#4a6070" }}>Autonomy Mode</span>
            <AutonomyModeToggle value={autonomyMode} onChange={setAutonomyMode} variant="compact" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
          <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#4a6070" }}>
            Fleet Intelligence · Deterministic Fallback (Alloy integration active)
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Vessels at Sea", value: "47", icon: Ship, color: ACCENT },
            { label: "Alerts Active", value: "6", icon: AlertTriangle, color: "#ff4455" },
            { label: "Routes Optimised", value: "12", icon: Navigation, color: "#00e878" },
            { label: "In Port", value: "8", icon: Anchor, color: "#ffb700" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: "#0d1520", border: "1px solid #1a2535" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs uppercase tracking-wide" style={{ color: "#4a6070" }}>{label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        <ProofEnvelope
          title="Route Advisory: Deviate MV Horizon Breeze SIN→HAM — Cyclone Aiko"
          accentColor={ACCENT}
          evidence={ROUTING_EVIDENCE}
          timestamp={FRESH_3M}
          confidence={87}
          policyState={"allowed" as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
          domain="vessels.routing"
          actionLabel="Issue charter-party deviation order (Cyclone Aiko)"
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: "#c8d8e8" }}>
              Cyclone Aiko (Cat 2) updated track intersects nominal Singapore–Hamburg route on Day 4. Northern deviation via Rotterdam adds 1.3 days but reduces weather-related delay probability by 67%. Charter Party CP-14b authorises deviation without charterer consent.
            </p>
            <div className="mt-3 rounded-lg p-3" style={{ background: "#060b12", border: "1px solid #243040" }}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Delay (Nominal Route)", value: "+3.2d", color: "#ff4455" },
                  { label: "Delay (Deviation)", value: "+1.3d", color: "#ffb700" },
                  { label: "Fuel Delta", value: "+$42K", color: "#7a99b8" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-xs" style={{ color: "#4a6070" }}>{label}</div>
                    <div className="text-base font-bold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ProofEnvelope>

        <ProofEnvelope
          title="Sanctions Alert: Counterparty 'Starline Maritime SA' — OFAC Match (94%)"
          accentColor="#ff4455"
          evidence={SANCTIONS_EVIDENCE}
          timestamp={FRESH_3M}
          confidence={94}
          policyState={"blocked" as PolicyState}
          policyReason="OFAC SDN match above 85% threshold — transaction blocked pending compliance review"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
          domain="vessels.counterparty-approvals"
          actionLabel="Onboard counterparty Starline Maritime SA"
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: "#c8d8e8" }}>
              Automated sanctions screening identified a 94% name-match against the OFAC SDN list for counterparty 'Starline Maritime SA'. Parent entity subject to EU restrictive measures. AIS transmitter disabled during two transits through sanctioned jurisdiction.
            </p>
            <div className="mt-3 rounded-lg p-3 text-xs" style={{ background: "#060b12", border: "1px solid #ff445530" }}>
              <span className="font-semibold" style={{ color: "#ff4455" }}>Transaction blocked:</span>
              <span style={{ color: "#7a99b8" }}> Compliance officer review required before any engagement. Counterparty added to watchlist. Legal hold applied to all related documents.</span>
            </div>
          </div>
        </ProofEnvelope>

        <ProofEnvelope
          title="Predictive Maintenance: MV Horizon Star — Main Engine Cylinder 4 Anomaly"
          accentColor="#ffb700"
          evidence={MAINTENANCE_EVIDENCE}
          timestamp={FRESH_3M}
          confidence={79}
          policyState={"requires-approval" as PolicyState}
          policyReason="Unscheduled port call requires commercial ops approval — charterer notification required"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
          domain="vessels.charter-actions"
          actionLabel="Schedule unplanned maintenance port call (MV Horizon Star)"
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: "#c8d8e8" }}>
              Cylinder 4 exhaust temperature deviation (+42°C above baseline for 6 hours) indicates probable liner wear. The vessel is approaching class maintenance interval (7,840 of 8,000 running hours). Probability of failure before next port call is 31%. Proactive intervention reduces expected downtime cost by ~$340K.
            </p>
            <div className="mt-3 rounded-lg p-3" style={{ background: "#060b12", border: "1px solid #243040" }}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Failure Probability", value: "31%", color: "#ffb700" },
                  { label: "Running Hours", value: "7,840", color: "#7a99b8" },
                  { label: "Downtime Saving", value: "$340K", color: "#00e878" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-xs" style={{ color: "#4a6070" }}>{label}</div>
                    <div className="text-base font-bold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ProofEnvelope>

        <RiskEvidenceList
          domain="vessels"
          domainLabel="Voyage & Charter Risk"
          accentColor={ACCENT}
          emptyHint="No risk-simulation runs have been cited yet. Open Risk Simulation and use Save run as evidence to attach voyage cost percentiles to a routing or counterparty decision."
        />
      </div>
    </div>
  );
}
