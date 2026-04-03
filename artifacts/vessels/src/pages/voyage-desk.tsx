import { useState } from "react";
import {
  Anchor, Navigation, AlertTriangle, CheckCircle, Clock,
  Shield, BarChart3, Plug, ArrowUpRight, RefreshCw,
  FileText, User, Activity, Wind
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { EmptyState } from "@szl-holdings/shared-ui";
import {
  vesselTwins, voyageTwins,
  type VesselTwin, type VoyageTwin
} from "@/data/fleet-twin";

const ACCENT = "hsl(205 70% 50%)";
const ACCENT_DIM = "hsl(205 70% 38%)";

function fmt(n: number) { return new Intl.NumberFormat("en-US").format(n); }
function fmtK(n: number) { return `$${(n / 1000).toFixed(0)}K`; }
function fmtM(n: number) { return `$${(n / 1_000_000).toFixed(1)}M`; }
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return `In ${Math.ceil(Math.abs(diff) / 86400000)}d`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_COLOR: Record<string, string> = {
  underway: "#40856a",
  in_port: "#4a7dc8",
  anchored: "#c08a2c",
  maintenance: "#c04a2a",
  laid_up: "rgba(255,255,255,0.25)",
  distress: "#9b1c1c",
};

const VOYAGE_STATUS_COLOR: Record<string, string> = {
  planned: "rgba(255,255,255,0.35)",
  active: "#40856a",
  deviating: "#c08a2c",
  completed: "rgba(255,255,255,0.25)",
  cancelled: "#c04a2a",
  exception: "#9b1c1c",
};

const RISK_COLOR: Record<string, string> = {
  low: "#40856a",
  moderate: "#c08a2c",
  elevated: "#c04a2a",
  critical: "#9b1c1c",
};

const COMPLIANCE_COLOR: Record<string, string> = {
  compliant: "#40856a",
  minor_deficiency: "#c08a2c",
  major_deficiency: "#c04a2a",
  non_compliant: "#9b1c1c",
};

function ConnectorPanel({ connectors }: { connectors: VesselTwin["externalDataConnectors"] }) {
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
        <Plug size={12} />
        <span>External Sources</span>
      </div>
      {connectors.map(c => (
        <div key={c.name} className="flex items-center justify-between text-sm">
          <span style={{ color: "rgba(255,255,255,0.55)" }}>{c.name}</span>
          {c.status === "not_connected" ? (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>
              Connect to enable
            </span>
          ) : c.status === "connected" ? (
            <span className="text-xs" style={{ color: ACCENT }}>Live</span>
          ) : (
            <span className="text-xs text-red-400">Error</span>
          )}
        </div>
      ))}
    </div>
  );
}

function VesselCard({ vessel, selected, onSelect }: { vessel: VesselTwin; selected: boolean; onSelect: () => void }) {
  const statusColor = STATUS_COLOR[vessel.currentStatus];
  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl border p-4 transition-all hover:bg-white/3"
      style={{
        background: selected ? "hsl(205 70% 38% / 0.1)" : "rgba(255,255,255,0.02)",
        borderColor: selected ? "hsl(205 70% 38% / 0.4)" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{vessel.name}</div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {vessel.flag} · {vessel.vesselType} · {vessel.imo}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
          <span className="text-xs capitalize" style={{ color: statusColor }}>{vessel.currentStatus.replace("_", " ")}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        <span>Readiness: <strong style={{ color: vessel.readinessScore >= 80 ? "#40856a" : vessel.readinessScore >= 60 ? "#c08a2c" : "#c04a2a" }}>{vessel.readinessScore}</strong></span>
        <span>·</span>
        <span style={{ color: COMPLIANCE_COLOR[vessel.complianceStatus] || "rgba(255,255,255,0.4)" }}>
          {vessel.complianceStatus.replace("_", " ")}
        </span>
      </div>
      {vessel.anomalyFlags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {vessel.anomalyFlags.map(f => (
            <span key={f} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#c04a2a15", color: "#c04a2a" }}>
              {f.replace("_", " ")}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export default function VoyageDesk() {
  const [selectedVesselId, setSelectedVesselId] = useState(vesselTwins[0]?.id ?? null);
  const vessel = vesselTwins.find(v => v.id === selectedVesselId) ?? vesselTwins[0];
  const voyages = voyageTwins.filter(v => v.vesselId === vessel?.id);
  const activeVoyage = voyages.find(v => v.status === "active" || v.status === "exception" || v.status === "deviating");

  return (
    <div className="flex h-full" style={{ background: "hsl(210 15% 7%)" }}>
      <aside className="w-72 flex-shrink-0 border-r overflow-y-auto p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
            Fleet Twins
          </h2>
        </div>
        {vesselTwins.map(v => (
          <VesselCard key={v.id} vessel={v} selected={v.id === selectedVesselId} onSelect={() => setSelectedVesselId(v.id)} />
        ))}
      </aside>

      {vessel ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Anchor size={20} style={{ color: ACCENT }} />
                <h1 className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>{vessel.name}</h1>
                <span className="flex items-center gap-1 text-xs capitalize" style={{ color: STATUS_COLOR[vessel.currentStatus] }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[vessel.currentStatus] }} />
                  {vessel.currentStatus.replace("_", " ")}
                </span>
              </div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                {vessel.flag} · {vessel.vesselType} · {vessel.imo} · {vessel.grossTonnage.toLocaleString()} GT · Built {vessel.yearBuilt}
              </div>
            </div>
            {vessel.maintenanceDue && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: "#c04a2a20", color: "#c04a2a", border: "1px solid #c04a2a30" }}>
                <AlertTriangle size={12} />
                Maintenance Due
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Readiness", value: `${vessel.readinessScore}`, color: vessel.readinessScore >= 80 ? "#40856a" : vessel.readinessScore >= 60 ? "#c08a2c" : "#c04a2a" },
              { label: "Crew", value: `${vessel.crewCount}`, color: "rgba(255,255,255,0.8)" },
              { label: "PSC Deficiencies", value: `${vessel.pscDeficiencies}`, color: vessel.pscDeficiencies > 0 ? "#c08a2c" : "#40856a" },
              { label: "Compliance", value: vessel.complianceStatus.replace("_", " "), color: COMPLIANCE_COLOR[vessel.complianceStatus] },
            ].map(m => (
              <div key={m.label} className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</div>
                <div className="text-lg font-bold capitalize" style={{ color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {activeVoyage && (
            <div className="rounded-xl border p-5" style={{
              background: activeVoyage.status === "exception" ? "#9b1c1c08" : "rgba(255,255,255,0.02)",
              borderColor: activeVoyage.status === "exception" ? "#9b1c1c30" : "rgba(255,255,255,0.06)",
            }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Navigation size={16} style={{ color: ACCENT }} />
                    <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                      Active Voyage — {activeVoyage.voyageNumber}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{
                      background: `${VOYAGE_STATUS_COLOR[activeVoyage.status]}20`,
                      color: VOYAGE_STATUS_COLOR[activeVoyage.status],
                    }}>
                      {activeVoyage.status}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {activeVoyage.originPort} → {activeVoyage.destinationPort} · {activeVoyage.cargo}
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: `${RISK_COLOR[activeVoyage.routeRisk]}20`,
                  color: RISK_COLOR[activeVoyage.routeRisk],
                }}>
                  Route: {activeVoyage.routeRisk} risk
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Revenue", value: fmtM(activeVoyage.economics.voyageRevenue) },
                  { label: "Costs", value: fmtM(activeVoyage.economics.voyageCosts) },
                  { label: "TC Equiv", value: `$${activeVoyage.economics.tcEquivalent.toLocaleString()}/d` },
                  { label: "Margin", value: `${activeVoyage.economics.profitMarginPct.toFixed(1)}%`, color: activeVoyage.economics.profitMarginPct > 20 ? "#40856a" : "#c08a2c" },
                ].map(m => (
                  <div key={m.label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
                    <div className="text-sm font-semibold" style={{ color: m.color ?? "rgba(255,255,255,0.8)" }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {activeVoyage.routeRiskFactors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {activeVoyage.routeRiskFactors.map(f => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#c08a2c15", color: "#c08a2c", border: "1px solid #c08a2c25" }}>
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {activeVoyage.deviations.length > 0 && (
                <div className="space-y-2">
                  {activeVoyage.deviations.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: d.resolved ? "#40856a10" : "#c04a2a10", border: `1px solid ${d.resolved ? "#40856a25" : "#c04a2a25"}` }}>
                      <AlertTriangle size={14} style={{ color: d.resolved ? "#40856a" : "#c04a2a", flexShrink: 0, marginTop: 1 }} />
                      <div className="flex-1 text-xs">
                        <span className="font-medium capitalize" style={{ color: d.resolved ? "#40856a" : "#c04a2a" }}>{d.type.replace("_", " ")}:</span>
                        <span className="ml-1" style={{ color: "rgba(255,255,255,0.55)" }}>{d.description}</span>
                        <div className="mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{relTime(d.detectedAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeVoyage.approvals.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Pending Approvals</div>
                  {activeVoyage.approvals.filter(a => a.status === "pending").map(a => (
                    <div key={a.id} className="rounded-lg border p-3" style={{ background: "#c08a2c08", borderColor: "#c08a2c25" }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{a.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{a.description}</div>
                        </div>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                          background: a.priority === "critical" ? "#c04a2a20" : "#c08a2c20",
                          color: a.priority === "critical" ? "#c04a2a" : "#c08a2c",
                        }}>
                          {a.priority}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-xs px-3 py-1 rounded-md font-medium" style={{ background: ACCENT_DIM, color: "white" }}>Approve</button>
                        <button className="text-xs px-3 py-1 rounded-md hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Review</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>Certificates</h3>
              <div className="space-y-2">
                {vessel.certExpiries.map(c => (
                  <div key={c.cert} className="flex items-center justify-between text-sm py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <span style={{ color: "rgba(255,255,255,0.65)" }}>{c.cert}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{c.expiresAt.slice(0, 10)}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{
                        background: c.status === "valid" ? "#40856a20" : c.status === "expiring_soon" ? "#c08a2c20" : "#c04a2a20",
                        color: c.status === "valid" ? "#40856a" : c.status === "expiring_soon" ? "#c08a2c" : "#c04a2a",
                      }}>
                        {c.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ConnectorPanel connectors={vessel.externalDataConnectors} />
          </div>

          {activeVoyage && (
            <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>Audit Trail</h3>
              <div className="space-y-2">
                {activeVoyage.auditTrail.slice().reverse().map(e => (
                  <div key={e.id} className="flex gap-3 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: ACCENT_DIM }} />
                    <div>
                      <span className="font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                        {e.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.3)" }}> · {e.actor} · {relTime(e.at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={Anchor} headline="Select a vessel" description="Choose a vessel from the fleet to view its twin." accentColor={ACCENT} />
        </div>
      )}
    </div>
  );
}
