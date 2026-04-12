import { useState } from "react";
import {
  Shield, AlertTriangle, CheckCircle2, FileText, Route,
  Zap, ChevronRight, Download, Eye, X, RefreshCw, AlertCircle, Clock, Globe
} from "lucide-react";

const ACCENT = "hsl(205 70% 50%)";
const BG = { page: "#060e1a", surface: "#08121f", elevated: "#0c1628" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.05)", muted: "rgba(255,255,255,0.09)" } as const;
const TEXT = { primary: "rgba(255,255,255,0.90)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" } as const;

type ComplianceStatus = "clear" | "watch" | "flagged" | "breach";

interface SanctionAlert {
  id: string;
  vesselName: string;
  vesselImo: string;
  type: "port_call" | "owner_nexus" | "cargo" | "counterparty" | "route";
  severity: ComplianceStatus;
  headline: string;
  detail: string;
  authority: string;
  reference: string;
  detected: string;
  autoActions: { id: string; label: string; status: "done" | "pending" | "failed" }[];
  alternativeRoutes?: { label: string; riskLevel: ComplianceStatus; fuelDelta: number; timeDeltaH: number }[];
  docGenStatus: "generated" | "generating" | "pending";
}

const ALERTS: SanctionAlert[] = [
  {
    id: "ca-001", vesselName: "MV NOVA ATLAS", vesselImo: "9553842",
    type: "owner_nexus", severity: "breach",
    headline: "Beneficial owner match on OFAC SDN List — Meridian Asset Co",
    detail: "Meridian Asset Co (registered Marshall Islands) has been designated under OFAC SDN List, program: Iran Shipping. Vessel MV NOVA ATLAS is registered to this entity. All transactions with this vessel are prohibited under IEEPA.",
    authority: "OFAC (US Treasury)", reference: "SDN-IRAN-0293",
    detected: "2 hours ago",
    autoActions: [
      { id: "a1", label: "Flagged in compliance queue", status: "done" },
      { id: "a2", label: "Escalated to Compliance Officer", status: "done" },
      { id: "a3", label: "OFAC blocking notice generated", status: "done" },
      { id: "a4", label: "Legal hold applied to all cargo docs", status: "done" },
      { id: "a5", label: "SAR filing prepared for review", status: "pending" },
    ],
    docGenStatus: "generated",
  },
  {
    id: "ca-002", vesselName: "CV STELLARIS", vesselImo: "9812744",
    type: "port_call", severity: "flagged",
    headline: "Recent call at Bandar Abbas — reportable under CAATSA Section 231",
    detail: "CV STELLARIS made port call at Bandar Abbas, Iran, 18 days ago. Under CAATSA Section 231, calls at sanctioned Iranian ports within 90 days are reportable to OFAC. Automatic CAATSA compliance documentation has been generated.",
    authority: "OFAC / CAATSA", reference: "CAATSA-2024-PORT-0441",
    detected: "24 hours ago",
    autoActions: [
      { id: "b1", label: "CAATSA report auto-generated", status: "done" },
      { id: "b2", label: "Filing deadline tracked (72h)", status: "done" },
      { id: "b3", label: "Alternative port routing analyzed", status: "done" },
      { id: "b4", label: "P&I Club notified (Gard AS)", status: "pending" },
    ],
    alternativeRoutes: [
      { label: "Jebel Ali → Salalah transit", riskLevel: "clear", fuelDelta: 12, timeDeltaH: 8 },
      { label: "Colombo direct → Suez", riskLevel: "clear", fuelDelta: 8, timeDeltaH: 14 },
    ],
    docGenStatus: "generated",
  },
  {
    id: "ca-003", vesselName: "MT BOREAL SEA", vesselImo: "9642108",
    type: "route", severity: "watch",
    headline: "Planned route passes within 50nm of DPRK-designated waters",
    detail: "Current filed route for MT BOREAL SEA will bring vessel within 50nm of North Korea territorial waters at waypoint 4. While not a direct violation, this triggers enhanced monitoring under UNSCR 2375. Recommend route modification.",
    authority: "UN Security Council", reference: "UNSCR-2375",
    detected: "6 hours ago",
    autoActions: [
      { id: "c1", label: "Enhanced monitoring activated", status: "done" },
      { id: "c2", label: "Route deviation options generated", status: "done" },
      { id: "c3", label: "Flag state notification drafted", status: "pending" },
    ],
    alternativeRoutes: [
      { label: "Southern arc via Philippine Sea", riskLevel: "clear", fuelDelta: 6, timeDeltaH: 5 },
      { label: "Extended Korean Strait passage", riskLevel: "watch", fuelDelta: 2, timeDeltaH: 2 },
    ],
    docGenStatus: "generated",
  },
  {
    id: "ca-004", vesselName: "MV ATLANTIS COMMAND", vesselImo: "9734219",
    type: "cargo", severity: "watch",
    headline: "Cargo manifest includes dual-use electronics — export license verification pending",
    detail: "Cargo includes items classified under ECCN 5A002 (information security) and potentially ECCN 3A001 (electronic components). Export licenses from UK DIT must be verified before vessel departs next port. Automatic BIS/DIT check initiated.",
    authority: "UK DIT / US BIS", reference: "ECCN-5A002-2026-0198",
    detected: "18 hours ago",
    autoActions: [
      { id: "d1", label: "ECCN classification auto-screened", status: "done" },
      { id: "d2", label: "Export license verification request sent", status: "done" },
      { id: "d3", label: "End-user certificate check pending", status: "pending" },
      { id: "d4", label: "AES/UK export filing drafted", status: "pending" },
    ],
    docGenStatus: "generating",
  },
];

const SEVERITY_CONFIG: Record<ComplianceStatus, { color: string; bg: string; border: string; label: string; icon: React.ElementType }> = {
  clear: { color: "#22c55e", bg: "#22c55e12", border: "#22c55e28", label: "Clear", icon: CheckCircle2 },
  watch: { color: "#f59e0b", bg: "#f59e0b12", border: "#f59e0b28", label: "Watch", icon: AlertCircle },
  flagged: { color: "#f97316", bg: "#f9731612", border: "#f9731628", label: "Flagged", icon: AlertTriangle },
  breach: { color: "#ef4444", bg: "#ef444412", border: "#ef444428", label: "Breach", icon: X },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  port_call: { label: "Port Call", color: "#a78bfa" },
  owner_nexus: { label: "Owner Nexus", color: "#ef4444" },
  cargo: { label: "Cargo", color: "#f59e0b" },
  counterparty: { label: "Counterparty", color: "#f97316" },
  route: { label: "Route Risk", color: "#3b82f6" },
};

function DocBadge({ status }: { status: SanctionAlert["docGenStatus"] }) {
  if (status === "generated") return (
    <div className="flex items-center gap-1" style={{ fontSize: 10, color: "#22c55e", background: "#22c55e12", padding: "2px 7px", borderRadius: 4, border: "1px solid #22c55e28" }}>
      <CheckCircle2 style={{ width: 10, height: 10 }} />
      Docs ready
    </div>
  );
  if (status === "generating") return (
    <div className="flex items-center gap-1" style={{ fontSize: 10, color: ACCENT, background: `${ACCENT}12`, padding: "2px 7px", borderRadius: 4, border: `1px solid ${ACCENT}28` }}>
      <RefreshCw style={{ width: 10, height: 10, animation: "spin 1s linear infinite" }} />
      Generating…
    </div>
  );
  return (
    <div className="flex items-center gap-1" style={{ fontSize: 10, color: TEXT.tertiary, background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 4, border: `1px solid ${BORDER.muted}` }}>
      <Clock style={{ width: 10, height: 10 }} />
      Pending
    </div>
  );
}

export default function ComplianceAutopilot() {
  const [selected, setSelected] = useState<SanctionAlert | null>(ALERTS[0]);
  const [filterSeverity, setFilterSeverity] = useState<ComplianceStatus | "all">("all");

  const filtered = ALERTS.filter(a => filterSeverity === "all" || a.severity === filterSeverity);

  return (
    <div style={{ background: BG.page, minHeight: "100vh", color: TEXT.primary, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "20px 28px 14px", borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${ACCENT}18`, border: `1px solid ${ACCENT}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield style={{ color: ACCENT, width: 18, height: 18 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>Autonomous Compliance Autopilot</h1>
            <p style={{ fontSize: 12, color: TEXT.tertiary, marginTop: 1 }}>Real-time sanctions screening · Auto-documentation · Alternative route generation · Audit-ready reports</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <div style={{ fontSize: 11, color: "#22c55e", background: "#22c55e10", border: "1px solid #22c55e25", borderRadius: 6, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <Zap style={{ width: 11, height: 11 }} />
              Autopilot Active
            </div>
          </div>
        </div>

        {/* Summary bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Breach", count: ALERTS.filter(a => a.severity === "breach").length, color: "#ef4444" },
            { label: "Flagged", count: ALERTS.filter(a => a.severity === "flagged").length, color: "#f97316" },
            { label: "Watch", count: ALERTS.filter(a => a.severity === "watch").length, color: "#f59e0b" },
            { label: "Docs Generated", count: ALERTS.filter(a => a.docGenStatus === "generated").length, color: "#22c55e" },
          ].map(s => (
            <button
              key={s.label}
              onClick={() => setFilterSeverity(s.label.toLowerCase() as ComplianceStatus | "all")}
              style={{ background: BG.surface, borderRadius: 8, border: `1px solid ${BORDER.subtle}`, padding: "10px 14px", textAlign: "left", cursor: "pointer" }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.count}</div>
              <div style={{ fontSize: 10, color: TEXT.tertiary, marginTop: 2 }}>{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 420px", overflow: "hidden" }}>
        {/* Alert list */}
        <div style={{ overflowY: "auto", padding: "16px 24px", borderRight: `1px solid ${BORDER.subtle}` }}>
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {(["all", "breach", "flagged", "watch", "clear"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterSeverity(f)}
                style={{
                  padding: "4px 10px", borderRadius: 6, border: `1px solid ${filterSeverity === f ? ACCENT + "40" : BORDER.muted}`,
                  background: filterSeverity === f ? `${ACCENT}12` : "transparent", fontSize: 11, cursor: "pointer",
                  color: filterSeverity === f ? ACCENT : TEXT.secondary, fontWeight: filterSeverity === f ? 600 : 400,
                  textTransform: "capitalize",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(alert => {
              const cfg = SEVERITY_CONFIG[alert.severity];
              const typeCfg = TYPE_CONFIG[alert.type];
              const isSelected = selected?.id === alert.id;
              const doneActions = alert.autoActions.filter(a => a.status === "done").length;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelected(isSelected ? null : alert)}
                  style={{
                    background: isSelected ? `${cfg.color}08` : BG.surface,
                    border: `1px solid ${isSelected ? cfg.color + "30" : BORDER.subtle}`,
                    borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div className="flex items-start gap-10 mb-2">
                    <cfg.icon style={{ width: 16, height: 16, color: cfg.color, flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 12, fontWeight: 700, color: TEXT.primary }}>{alert.vesselName}</span>
                        <span style={{ fontSize: 10, color: TEXT.tertiary }}>IMO {alert.vesselImo}</span>
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${typeCfg.color}15`, color: typeCfg.color, fontWeight: 600 }}>{typeCfg.label}</span>
                      </div>
                      <p style={{ fontSize: 12, color: TEXT.primary, lineHeight: 1.45, marginBottom: 8 }}>{alert.headline}</p>
                      <div className="flex items-center gap-8">
                        <div style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: cfg.bg, color: cfg.color, fontWeight: 700, border: `1px solid ${cfg.border}` }}>{cfg.label.toUpperCase()}</div>
                        <div style={{ fontSize: 10, color: TEXT.tertiary }}>{alert.authority}</div>
                        <div style={{ fontSize: 10, color: TEXT.tertiary }}>{alert.detected}</div>
                        <DocBadge status={alert.docGenStatus} />
                        <div style={{ marginLeft: "auto", fontSize: 10, color: "#22c55e" }}>{doneActions}/{alert.autoActions.length} auto-actions complete</div>
                      </div>
                    </div>
                  </div>

                  {/* Auto-action progress */}
                  <div style={{ marginTop: 8, paddingLeft: 26 }}>
                    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ width: `${(doneActions / alert.autoActions.length) * 100}%`, height: "100%", background: "#22c55e", borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ overflowY: "auto", padding: "20px 22px", background: BG.surface }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT.primary, marginBottom: 2 }}>{selected.vesselName}</div>
                <div style={{ fontSize: 11, color: TEXT.tertiary }}>IMO {selected.vesselImo} · {selected.authority} · {selected.reference}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: TEXT.tertiary, cursor: "pointer", background: "none", border: "none", padding: 2 }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div style={{ background: `${SEVERITY_CONFIG[selected.severity].color}10`, border: `1px solid ${SEVERITY_CONFIG[selected.severity].color}28`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: SEVERITY_CONFIG[selected.severity].color, marginBottom: 6 }}>{SEVERITY_CONFIG[selected.severity].label.toUpperCase()} — {selected.headline}</div>
              <p style={{ fontSize: 12, color: TEXT.secondary, lineHeight: 1.6 }}>{selected.detail}</p>
            </div>

            {/* Auto-actions */}
            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Automated Actions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {selected.autoActions.map(action => (
                <div key={action.id} className="flex items-center gap-3" style={{ padding: "8px 10px", borderRadius: 7, background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                  {action.status === "done" ? <CheckCircle2 style={{ width: 13, height: 13, color: "#22c55e", flexShrink: 0 }} /> : action.status === "pending" ? <Clock style={{ width: 13, height: 13, color: "#f59e0b", flexShrink: 0 }} /> : <X style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0 }} />}
                  <span style={{ fontSize: 12, color: action.status === "done" ? TEXT.primary : TEXT.secondary, flex: 1 }}>{action.label}</span>
                  <span style={{ fontSize: 10, color: action.status === "done" ? "#22c55e" : action.status === "pending" ? "#f59e0b" : "#ef4444", textTransform: "capitalize" }}>{action.status}</span>
                </div>
              ))}
            </div>

            {/* Alternative routes */}
            {selected.alternativeRoutes && selected.alternativeRoutes.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                  <Route style={{ width: 12, height: 12, display: "inline", marginRight: 6 }} />
                  Alternative Routes (Sanctions-Clear)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {selected.alternativeRoutes.map((r, i) => {
                    const cfg = SEVERITY_CONFIG[r.riskLevel];
                    return (
                      <div key={i} style={{ background: BG.elevated, border: `1px solid ${cfg.color}25`, borderRadius: 8, padding: "10px 12px" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: 12, fontWeight: 600, color: TEXT.primary }}>{r.label}</span>
                          <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                        </div>
                        <div className="flex gap-12">
                          <div>
                            <div style={{ fontSize: 9, color: TEXT.tertiary }}>Fuel Δ</div>
                            <div style={{ fontSize: 11, color: r.fuelDelta > 0 ? "#f97316" : "#22c55e" }}>{r.fuelDelta > 0 ? "+" : ""}{r.fuelDelta}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: TEXT.tertiary }}>Time Δ</div>
                            <div style={{ fontSize: 11, color: r.timeDeltaH > 0 ? "#f59e0b" : "#22c55e" }}>{r.timeDeltaH > 0 ? "+" : ""}{r.timeDeltaH}h</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Document generation */}
            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              <FileText style={{ width: 12, height: 12, display: "inline", marginRight: 6 }} />
              Compliance Documentation
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "Sanctions Screening Report",
                "OFAC Compliance Certificate",
                "Audit Trail — All Actions",
                "Board-Level Risk Summary",
                selected.alternativeRoutes ? "Alternative Route Analysis" : null,
              ].filter(Boolean).map(doc => (
                <div key={doc!} className="flex items-center gap-8" style={{ padding: "9px 12px", background: BG.elevated, borderRadius: 7, border: `1px solid ${BORDER.subtle}` }}>
                  <FileText style={{ width: 13, height: 13, color: ACCENT, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: TEXT.primary }}>{doc}</span>
                  <button style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`, borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}>
                    <Download style={{ width: 10, height: 10 }} />
                    Export
                  </button>
                </div>
              ))}
            </div>

            <button style={{
              marginTop: 16, width: "100%", padding: "12px", borderRadius: 9, border: `1px solid ${ACCENT}35`,
              background: `${ACCENT}12`, color: ACCENT, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}>
              <Download style={{ width: 14, height: 14 }} />
              Export Full Audit Package
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
