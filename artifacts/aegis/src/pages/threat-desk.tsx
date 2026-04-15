import { useState } from "react";
import {
  Shield, AlertTriangle, CheckCircle, Clock, User, Target,
  Plug, ArrowUpRight, RefreshCw, FileText, BarChart3, Eye
} from "lucide-react";
import { EmptyState } from "@szl-holdings/shared-ui";
import {
  threatTwins, assetTwins, exposureTwins,
  type ThreatTwin, type AssetTwin
} from "@/data/threat-twin";

const ACCENT = "hsl(220 72% 56%)";
const ACCENT_DIM = "hsl(220 72% 40%)";

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEVERITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#f87171", bg: "#9b1c1c10", border: "#9b1c1c40" },
  high: { color: "#c04a2a", bg: "#c04a2a08", border: "#c04a2a25" },
  medium: { color: "#c08a2c", bg: "#c08a2c08", border: "#c08a2c20" },
  low: { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.06)" },
  info: { color: ACCENT, bg: "hsl(220 72% 56% / 0.08)", border: "hsl(220 72% 56% / 0.2)" },
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open: { color: "#c04a2a", bg: "#c04a2a20" },
  investigating: { color: "#c08a2c", bg: "#c08a2c20" },
  contained: { color: "#4a7dc8", bg: "#4a7dc820" },
  remediated: { color: "#40856a", bg: "#40856a20" },
  closed: { color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)" },
  false_positive: { color: "rgba(255,255,255,0.2)", bg: "rgba(255,255,255,0.03)" },
};

const RESPONSE_LABELS: Record<string, string> = {
  no_action: "No Action",
  triage: "Triage",
  containment: "Containment",
  eradication: "Eradication",
  recovery: "Recovery",
};

function ConnectorPanel({ connectors }: { connectors: ThreatTwin["externalDataConnectors"] }) {
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
        <Plug size={12} />
        <span>Threat Intel Sources</span>
      </div>
      {connectors.map(c => (
        <div key={c.name} className="flex items-center justify-between text-sm">
          <span style={{ color: "rgba(255,255,255,0.55)" }}>{c.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>
            {c.status === "not_connected" ? "Connect to enable" : c.status === "connected" ? "Live" : "Error"}
          </span>
        </div>
      ))}
    </div>
  );
}

function ThreatCard({ threat, selected, onSelect }: { threat: ThreatTwin; selected: boolean; onSelect: () => void }) {
  const ss = SEVERITY_STYLE[threat.severity];
  const ts = STATUS_STYLE[threat.status];
  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl border p-4 transition-all hover:bg-white/3"
      style={{
        background: selected ? "hsl(220 72% 56% / 0.08)" : ss.bg,
        borderColor: selected ? "hsl(220 72% 56% / 0.3)" : ss.border,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ss.color }} />
            <span className="text-xs font-medium px-1.5 py-0.5 rounded capitalize" style={{ background: ss.bg, color: ss.color }}>
              {threat.severity}
            </span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>· {threat.type.replace(/_/g, " ")}</span>
          </div>
          <div className="text-sm font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{threat.title}</div>
        </div>
        <span className="text-xs px-1.5 py-0.5 rounded-full capitalize ml-2" style={{ background: ts.bg, color: ts.color }}>
          {threat.status.replace("_", " ")}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
        <span>{threat.affectedAssetCount} asset{threat.affectedAssetCount !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span>{threat.confidence}% confidence</span>
        <span>·</span>
        <span>{relTime(threat.detectedAt)}</span>
      </div>
    </button>
  );
}

export default function ThreatDesk() {
  const [selectedId, setSelectedId] = useState(threatTwins[0]?.id ?? null);
  const threat = threatTwins.find(t => t.id === selectedId) ?? threatTwins[0];
  const affectedAssets = threat ? assetTwins.filter(a => threat.affectedAssets.includes(a.id)) : [];
  const pendingApprovals = threat?.approvals.filter(a => a.status === "pending") ?? [];

  return (
    <div className="flex h-full" style={{ background: "hsl(220 10% 7%)" }}>
      <aside className="w-72 flex-shrink-0 border-r overflow-y-auto p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
            Threat Twins
          </h2>
          <button className="p-1 rounded hover:bg-white/5">
            <RefreshCw size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
        </div>
        {threatTwins.map(t => (
          <ThreatCard key={t.id} threat={t} selected={t.id === selectedId} onSelect={() => setSelectedId(t.id)} />
        ))}
      </aside>

      {threat ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Shield size={20} style={{ color: SEVERITY_STYLE[threat.severity].color }} />
                <h1 className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>{threat.title}</h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{
                  background: SEVERITY_STYLE[threat.severity].bg,
                  color: SEVERITY_STYLE[threat.severity].color,
                  border: `1px solid ${SEVERITY_STYLE[threat.severity].border}`,
                }}>
                  {threat.severity}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{
                  background: STATUS_STYLE[threat.status].bg,
                  color: STATUS_STYLE[threat.status].color,
                }}>
                  {threat.status.replace("_", " ")}
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Detected {relTime(threat.detectedAt)} · Last activity {relTime(threat.lastActivityAt)}
                </span>
              </div>
            </div>
            {pendingApprovals.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#c08a2c20", color: "#c08a2c" }}>
                {pendingApprovals.length} pending authorization
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Confidence", value: `${threat.confidence}%`, color: threat.confidence >= 80 ? "#c04a2a" : "#c08a2c" },
              { label: "Affected Assets", value: `${threat.affectedAssetCount}` },
              { label: "Kill Chain", value: threat.killChainStage.replace("_", " "), color: "#c04a2a" },
              { label: "Response", value: RESPONSE_LABELS[threat.responseState] },
            ].map(m => (
              <div key={m.label} className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</div>
                <div className="text-lg font-bold capitalize" style={{ color: m.color ?? "rgba(255,255,255,0.85)" }}>{m.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-5">
              {threat.mitreTactics.length > 0 && (
                <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.75)" }}>MITRE ATT&CK Mapping</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Tactics</div>
                      <div className="flex flex-wrap gap-1.5">
                        {threat.mitreTactics.map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#c04a2a15", color: "#c04a2a", border: "1px solid #c04a2a25" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Techniques</div>
                      <div className="flex flex-wrap gap-1.5">
                        {threat.mitreTechniques.map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(220 72% 56% / 0.08)", color: ACCENT, border: "hsl(220 72% 56% / 0.2) 1px solid" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.75)" }}>Source Indicators</h3>
                <div className="space-y-1.5">
                  {threat.sourceIndicators.map((si, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#c04a2a" }} />
                      <span style={{ color: "rgba(255,255,255,0.65)" }}>{si}</span>
                    </div>
                  ))}
                </div>
              </div>

              {pendingApprovals.length > 0 && (
                <div className="rounded-xl border p-5" style={{ background: "#c08a2c05", borderColor: "#c08a2c20" }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.75)" }}>Pending Authorizations</h3>
                  {pendingApprovals.map(a => (
                    <div key={a.id} className="rounded-lg border p-3 space-y-2" style={{ borderColor: "#c08a2c20" }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{a.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{a.description}</div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#c04a2a20", color: "#c04a2a" }}>{a.priority}</span>
                      </div>
                      {a.comments.length > 0 && (
                        <div className="pl-3 border-l" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                          {a.comments.map((c, i) => (
                            <div key={i} className="text-xs py-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                              <span className="font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{c.author}:</span> {c.body}
                              {c.internal && <span className="ml-1 text-purple-400">(internal)</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: ACCENT_DIM, color: "white" }}>
                          <CheckCircle size={12} /> Authorize
                        </button>
                        <button className="text-xs px-3 py-1.5 rounded-lg hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                          Escalate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.75)" }}>Audit Trail</h3>
                <div className="space-y-2">
                  {threat.auditTrail.slice().reverse().map(e => (
                    <div key={e.id} className="flex gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: ACCENT_DIM }} />
                      <div>
                        <span className="font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                          {e.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.3)" }}> · {e.actor} ({e.actorRole}) · {relTime(e.at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Affected Assets</div>
                {affectedAssets.map(a => (
                  <div key={a.id} className="py-2 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{a.name}</div>
                    <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      <span className="capitalize">{a.criticality}</span>
                      <span>·</span>
                      <span>{a.type.replace("_", " ")}</span>
                      <span>·</span>
                      <span>{a.environment}</span>
                    </div>
                  </div>
                ))}
                {affectedAssets.length === 0 && (
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>No mapped assets</div>
                )}
              </div>

              <ConnectorPanel connectors={threat.externalDataConnectors} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={Shield} headline="Select a threat" description="Choose a threat to view its twin." accentColor={ACCENT} />
        </div>
      )}
    </div>
  );
}
