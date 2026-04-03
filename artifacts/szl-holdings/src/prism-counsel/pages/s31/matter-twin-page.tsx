import { useState } from "react";
import { Layers, AlertTriangle, CheckCircle, Clock, FileText, Users, MessageSquare, Activity, TrendingUp, Shield, Globe, Brain } from "lucide-react";
import { useMatterTwin, useMatterTwinHistory } from "../../hooks/use-prism-s31";

const DEMO_SNAPSHOT = {
  id: 1, matterId: 1, snapshotType: "on_change", healthScore: 72, createdAt: "2026-04-03T10:00:00Z",
  domains: {
    people: { parties: 6, roles: ["plaintiff", "defendant", "carrier", "attorney", "adjuster", "witness"] },
    claims: { total: 3, statuses: ["active", "active", "pending"] },
    deadlines: { total: 12, upcoming: 4 },
    documents: { proofChainEntries: 28, reviewPending: 3 },
    communications: { total: 47, recent: [{ type: "email", date: "2026-04-02" }, { type: "letter", date: "2026-03-28" }] },
    forecasts: { total: 8, types: ["settlement", "timeline", "outcome"] },
    worldline: { features: 14, sourceClasses: ["crash_incident", "regulatory_insurance", "weather_environmental", "court_venue"] },
    dataProducts: { insurer_pressure_index: { score: 0.49 }, venue_velocity_index: { score: 0.55 }, settlement_friction_map: { score: 0.53 } },
  },
  pressureScores: {
    deadline: { score: 0.65 }, insurer: { score: 0.58 }, settlement: { score: 0.62 },
    medical: { score: 0.55 }, evidence: { score: 0.52 }, governance: { score: 0.30 },
  },
  changesSincePrior: { isFirst: false, changes: ["insurer pressure increased by 6%", "evidence pressure decreased by 8%", "2 new documents processed"], totalChanges: 3 },
  missingArtifacts: ["Outstanding medical records from 2 providers", "Lost wage verification incomplete", "No mediation memo drafted", "No expert report filed"],
  riskFactors: [
    { level: "high", description: "Deadline pressure elevated at 65%", dimension: "deadline" },
    { level: "high", description: "Settlement pressure elevated at 62%", dimension: "settlement" },
    { level: "medium", description: "Insurer pressure moderate at 58%", dimension: "insurer" },
    { level: "medium", description: "Medical pressure moderate at 55%", dimension: "medical" },
  ],
  nextActions: ["Follow up on outstanding medical records (2 providers)", "Complete lost wage verification", "Draft mediation memo — mediation in 19 days", "Address deadline pressure: SOL approaching"],
};

export default function MatterTwinPage() {
  const [matterId] = useState<number>(1);
  const { data: twinData } = useMatterTwin(matterId);
  const { data: historyData } = useMatterTwinHistory(matterId);

  const snapshot = twinData?.snapshot ?? DEMO_SNAPSHOT;
  const isDemo = !twinData?.snapshot;
  const domains = snapshot.domains ?? {};
  const changes = snapshot.changesSincePrior ?? {};
  const missing = snapshot.missingArtifacts ?? [];
  const risks = snapshot.riskFactors ?? [];
  const actions = snapshot.nextActions ?? [];

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#4a90b8]" />
          <h1 className="text-lg font-semibold text-slate-100">Matter Twin</h1>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isDemo ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#4a90b8]/10 text-[#4a90b8]"}`}>{isDemo ? "DEMO" : "LIVE"}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">14-domain digital twin — real-time composite snapshot with change tracking</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Health Score", value: `${snapshot.healthScore ?? 72}%`, icon: Activity, color: "#4a90b8" },
          { label: "Risk Factors", value: String(risks.length), icon: AlertTriangle, color: risks.some((r: any) => r.level === "critical") ? "#c45a4a" : "#c8953c" },
          { label: "Missing Items", value: String(missing.length), icon: FileText, color: missing.length > 3 ? "#c45a4a" : "#d4a054" },
          { label: "Changes", value: String(changes.totalChanges ?? 0), icon: TrendingUp, color: "#8b7ac8" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-1"><Icon className="w-3.5 h-3.5" style={{ color: s.color }} /><span className="text-[10px] text-slate-500">{s.label}</span></div>
              <div className="text-xl font-bold text-slate-100">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-[#4a90b8]" />Domains</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Parties", value: domains.people?.parties ?? 0, icon: Users },
              { label: "Claims", value: domains.claims?.total ?? 0, icon: FileText },
              { label: "Deadlines", value: `${domains.deadlines?.upcoming ?? 0} upcoming`, icon: Clock },
              { label: "Documents", value: `${domains.documents?.proofChainEntries ?? 0} entries`, icon: FileText },
              { label: "Communications", value: domains.communications?.total ?? 0, icon: MessageSquare },
              { label: "Forecasts", value: domains.forecasts?.total ?? 0, icon: TrendingUp },
              { label: "Worldline Features", value: domains.worldline?.features ?? 0, icon: Globe },
              { label: "Proof Chain Pending", value: `${domains.documents?.reviewPending ?? 0} reviews`, icon: Shield },
            ].map((d, i) => {
              const Icon = d.icon;
              return (
                <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded bg-white/[0.02]">
                  <Icon className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] text-slate-400 flex-1">{d.label}</span>
                  <span className="text-[10px] text-slate-200 font-mono">{d.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#c45a4a]" />Risk Factors</h3>
            <div className="space-y-1.5">
              {risks.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${r.level === "critical" ? "bg-[#c45a4a]/15 text-[#c45a4a]" : r.level === "high" ? "bg-[#c8953c]/15 text-[#c8953c]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>{r.level}</span>
                  <span className="text-[10px] text-slate-400">{r.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#8b7ac8]" />Changes Since Prior</h3>
            <div className="space-y-1">
              {(changes.changes ?? []).map((c: string, i: number) => (
                <div key={i} className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8b7ac8]" />{c}
                </div>
              ))}
              {(changes.changes ?? []).length === 0 && <div className="text-[10px] text-slate-600">No changes detected</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-[#d4a054]" />Missing Artifacts</h3>
          <div className="space-y-1.5">
            {missing.map((m: string, i: number) => (
              <div key={i} className="flex items-center gap-2 py-1 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4a054]/60" />{m}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2"><Brain className="w-4 h-4 text-[#4a90b8]" />Recommended Actions</h3>
          <div className="space-y-1.5">
            {actions.map((a: string, i: number) => (
              <div key={i} className="flex items-start gap-2 py-1 text-[10px] text-slate-400">
                <CheckCircle className="w-3 h-3 text-[#4a90b8] shrink-0 mt-0.5" />{a}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
