import { useState } from "react";

import { TrendingUp, DollarSign, AlertTriangle, Building2, RefreshCw, Activity, FileText, ChevronDown, ChevronRight, BarChart3, Shield } from "lucide-react";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { cn } from "@szl-holdings/shared-ui/utils";
import { useStandardQuery } from "@szl-holdings/api-client-react";

const API = import.meta.env.VITE_API_URL ?? "/api";

const DS = {
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  text: { primary: "rgba(255,255,255,0.9)", secondary: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.28)" },
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  revenue: "#10b981",
  operations: "#3b82f6",
  data: "#8b5cf6",
  "supply-chain": "#f97316",
  compliance: "#eab308",
  brand: "#ec4899",
};

const ENTITY_ICONS: Record<string, typeof Building2> = {
  revenue: DollarSign,
  operations: Activity,
  data: Shield,
  "supply-chain": BarChart3,
  compliance: FileText,
  brand: TrendingUp,
};

const SEV_CONFIG: Record<string, { color: string; bg: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.08)" },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.08)" },
  low: { color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
};

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function BusinessImpactMap() {
  const [expandedIncident, setExpandedIncident] = useState<number | null>(null);

  // Live backend route — /firestorm/* path is an active api-server endpoint.
  // Follow-up task #1715 will rename it to /aegis/* once the server migration lands.
  const { data, isLoading, refetch, dataUpdatedAt } = useStandardQuery({
    queryKey: ["business-impact-map"],
    queryFn: async () => {
      const r = await fetch(`${API}/firestorm/cognitive/business-impact-map`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load business impact map");
      return r.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  const result = data?.data ?? {};
  const execNarrative = result.execNarrative ?? {};
  const businessEntities: Array<{ id: string; name: string; type: string; owner: string; annualRevenue: number | null; atRisk: number | null }> = result.businessEntities ?? [];
  const incidentImpacts: Array<{
    incidentId: number; title: string; severity: string; status: string;
    estimatedFinancialImpact: number; estimatedDowntimeHours: number;
    affectedEntities: Array<{ entityId: string; entityName: string; entityType: string; impactType: string; businessRiskScore: number }>;
    citations: Array<{ source: string; ref: string; confidence: number }>;
    provenance: { source: string; traceRef: string };
  }> = result.incidentImpacts ?? [];
  const findingImpacts: Array<{
    findingId: number; title: string; severity: string;
    businessEntity: { id: string; name: string; type: string };
    complianceExposure: string; estimatedFineExposure: number;
    citations: Array<{ source: string; ref: string; confidence: number }>;
  }> = result.findingImpacts ?? [];
  const provenance = result.provenance ?? {};

  const riskTrendColor = execNarrative.riskTrend === "increasing" ? "text-red-400" : execNarrative.riskTrend === "decreasing" ? "text-emerald-400" : "text-yellow-400";

  return (
    <div className="p-6 space-y-6" style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: DS.text.primary }}>
            <TrendingUp className="w-5 h-5 text-emerald-400"/>
            Business Impact Map
          </h1>
          <p className="text-sm mt-1" style={{ color: DS.text.secondary }}>
            Incidents and risks tied to revenue and operations entities — executive-ready narrative with evidence provenance.
          </p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
          <RefreshCw className="w-3 h-3"/>
          Refresh
        </button>
      </div>

      {!isLoading && execNarrative.executiveSummary && (
        <div className="rounded-xl p-5 space-y-4" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400"/>
            <h2 className="text-sm font-semibold" style={{ color: DS.text.primary }}>Executive Narrative</h2>
            <Badge className="ml-auto text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Verified</Badge>
          </div>
          <p className="text-sm" style={{ color: DS.text.secondary }}>{execNarrative.executiveSummary}</p>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Risk Score", value: execNarrative.riskScore, color: "text-red-400" },
              { label: "Risk Trend", value: execNarrative.riskTrend, color: riskTrendColor },
              { label: "Total Exposure", value: fmt(execNarrative.totalEstimatedExposure), color: "text-orange-400" },
              { label: "Active Incidents", value: execNarrative.activeIncidentCount, color: "text-blue-400" },
              { label: "Critical Findings", value: execNarrative.criticalFindings, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 rounded-lg" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
                <p className={cn("text-lg font-bold", color)}>{value ?? "—"}</p>
                <p className="text-[10px] mt-0.5" style={{ color: DS.text.muted }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-emerald-500/40 border-t-emerald-400 rounded-full animate-spin"/>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="rounded-xl p-4 space-y-3" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: DS.text.muted }}>Business Entities at Risk</h3>
            <div className="grid grid-cols-3 gap-3">
              {businessEntities.map(entity => {
                const color = ENTITY_TYPE_COLORS[entity.type] ?? "#94a3b8";
                const Icon = ENTITY_ICONS[entity.type] ?? Building2;
                return (
                  <div key={entity.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                      <Icon className="w-4 h-4" style={{ color }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate" style={{ color: DS.text.primary }}>{entity.name}</p>
                      <p className="text-[10px]" style={{ color: DS.text.muted }}>{entity.owner}</p>
                    </div>
                    {entity.atRisk != null && (
                      <div className="text-right shrink-0">
                        <p className="text-[11px] font-bold" style={{ color }}>{fmt(entity.atRisk)}</p>
                        <p className="text-[9px]" style={{ color: DS.text.muted }}>at risk</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: DS.text.muted }}>Incident → Business Entity Mapping</h3>
            {incidentImpacts.map(impact => {
              const sevConf = SEV_CONFIG[(impact.severity as string)] ?? SEV_CONFIG.medium;
              const isExpanded = expandedIncident === impact.incidentId;
              return (
                <div key={impact.incidentId} className="rounded-xl overflow-hidden" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
                  <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors" onClick={() => setExpandedIncident(isExpanded ? null : impact.incidentId)}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: sevConf.bg, border: `1px solid ${sevConf.color}30` }}>
                      <AlertTriangle className="w-4 h-4" style={{ color: sevConf.color }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium truncate" style={{ color: DS.text.primary }}>{impact.title}</p>
                        <Badge className="text-[9px] shrink-0" style={{ background: sevConf.bg, color: sevConf.color, borderColor: `${sevConf.color}30` }}>{impact.severity}</Badge>
                        <Badge className={cn("text-[9px] shrink-0", impact.status === "closed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20")}>{impact.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-[10px]" style={{ color: DS.text.muted }}>
                        <span>{impact.affectedEntities.length} entities affected</span>
                        <span>{impact.estimatedDowntimeHours}h est. downtime</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-orange-400">{fmt(impact.estimatedFinancialImpact)}</p>
                      <p className="text-[10px]" style={{ color: DS.text.muted }}>est. impact</p>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: DS.text.muted }}/> : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: DS.text.muted }}/>}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: DS.text.muted }}>Affected Business Entities</p>
                          {impact.affectedEntities.map(ent => {
                            const color = ENTITY_TYPE_COLORS[ent.entityType] ?? "#94a3b8";
                            return (
                              <div key={ent.entityId} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }}/>
                                <span className="text-[11px] flex-1" style={{ color: DS.text.secondary }}>{ent.entityName}</span>
                                <span className="text-[10px]" style={{ color: DS.text.muted }}>{ent.impactType.replace(/-/g, " ")}</span>
                                <span className="text-[11px] font-bold" style={{ color }}>{ent.businessRiskScore}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: DS.text.muted }}>Evidence Citations</p>
                          {impact.citations.map((cit, i) => (
                            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg text-[10px]" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}>
                              <FileText className="w-3 h-3 text-blue-400 shrink-0"/>
                              <div className="flex-1 min-w-0">
                                <p style={{ color: DS.text.primary }}>{cit.source}</p>
                                <p className="font-mono truncate" style={{ color: DS.text.muted }}>{cit.ref}</p>
                              </div>
                              <span className="font-bold shrink-0" style={{ color: cit.confidence > 90 ? "#10b981" : "#f59e0b" }}>{cit.confidence}%</span>
                            </div>
                          ))}
                          <div className="text-[9px] pt-1 font-mono" style={{ color: DS.text.muted }}>
                            {impact.provenance.traceRef}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {findingImpacts.length > 0 && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: DS.text.muted }}>Finding → Compliance Exposure</h3>
              <div className="space-y-2">
                {findingImpacts.map(f => {
                  const sevConf = SEV_CONFIG[(f.severity as string)] ?? SEV_CONFIG.medium;
                  const entityColor = ENTITY_TYPE_COLORS[f.businessEntity.type] ?? "#94a3b8";
                  return (
                    <div key={f.findingId} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${DS.border}` }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: sevConf.bg }}>
                        <Shield className="w-3.5 h-3.5" style={{ color: sevConf.color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate" style={{ color: DS.text.primary }}>{f.title}</p>
                        <div className="flex items-center gap-3 text-[10px]" style={{ color: DS.text.muted }}>
                          <span style={{ color: entityColor }}>{f.businessEntity.name}</span>
                          <span>{f.complianceExposure}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-red-400">{fmt(f.estimatedFineExposure)}</p>
                        <p className="text-[9px]" style={{ color: DS.text.muted }}>fine exposure</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-6 text-[10px] pt-2" style={{ color: DS.text.muted }}>
        <Activity className="w-3 h-3"/>
        <span>Verified by: {provenance.verifiedBy ?? "CONSTELLATION Business Impact Engine"}</span>
        <span>Runtime: {provenance.cognitiveRuntime ?? "v2.1.0"}</span>
        {dataUpdatedAt > 0 && <span>Updated: {new Date(dataUpdatedAt).toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}
