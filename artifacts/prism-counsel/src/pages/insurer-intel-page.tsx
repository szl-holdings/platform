import { Building2, User, Clock, TrendingDown, AlertTriangle, MessageSquare, BarChart3 } from "lucide-react";
import { useState } from "react";
import { INSURER_PROFILES, ADJUSTER_PROFILES, COMMUNICATION_WINDOWS } from "../data/demo-ny";

type Tab = "carriers" | "adjusters" | "communications";

export default function InsurerIntelPage() {
  const [tab, setTab] = useState<Tab>("carriers");

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Insurer Intelligence</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
            INTERNAL OPS INTEL
          </span>
        </div>
        <p className="text-xs text-slate-500">Carrier response patterns, adjuster behavior profiles, and communication tracking — internal operational intelligence only</p>
      </div>

      <div className="flex gap-1 border-b border-white/[0.06] pb-px">
        {([
          { key: "carriers" as Tab, label: "Carrier Profiles", icon: Building2 },
          { key: "adjusters" as Tab, label: "Adjuster Profiles", icon: User },
          { key: "communications" as Tab, label: "Communication Tracking", icon: MessageSquare },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t transition-colors ${
              tab === t.key ? "bg-white/[0.06] text-slate-100 border-b-2 border-[#d4a054]" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "carriers" && (
        <div className="space-y-4">
          {INSURER_PROFILES.map((carrier) => (
            <div key={carrier.id} className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{carrier.carrierName}</h3>
                  <div className="text-[10px] text-slate-500 mt-0.5">{carrier.region} · {carrier.mattersHandled} matters observed</div>
                </div>
                <div className="flex gap-1.5">
                  {carrier.tags.map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                      {tag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3 mb-3">
                <div className="rounded border border-white/[0.04] p-2" style={{ background: "#080c14" }}>
                  <div className="text-[9px] text-slate-500">Avg Response</div>
                  <div className="text-sm font-mono font-semibold text-slate-200">{carrier.avgResponseDays}d</div>
                </div>
                <div className="rounded border border-white/[0.04] p-2" style={{ background: "#080c14" }}>
                  <div className="text-[9px] text-slate-500">Offer/Settlement</div>
                  <div className="text-sm font-mono font-semibold text-slate-200">{(carrier.avgOfferToSettlementRatio * 100).toFixed(0)}%</div>
                </div>
                <div className="rounded border border-white/[0.04] p-2" style={{ background: "#080c14" }}>
                  <div className="text-[9px] text-slate-500">Denial Rate</div>
                  <div className="text-sm font-mono font-semibold" style={{ color: carrier.denialRate > 0.2 ? "#c45a4a" : "#d4a054" }}>
                    {(carrier.denialRate * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="rounded border border-white/[0.04] p-2" style={{ background: "#080c14" }}>
                  <div className="text-[9px] text-slate-500">Mediation</div>
                  <div className="text-sm font-mono font-semibold text-slate-200 capitalize">{carrier.mediationWillingness}</div>
                </div>
                <div className="rounded border border-white/[0.04] p-2" style={{ background: "#080c14" }}>
                  <div className="text-[9px] text-slate-500">Silence Window</div>
                  <div className="text-sm font-mono font-semibold text-slate-200">{carrier.silenceWindowDays}d</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-500">
                  <span className="text-slate-400 font-medium">Negotiation posture: </span>{carrier.negotiationPosture}
                </div>
                <div className="text-[10px] text-slate-500">
                  <span className="text-slate-400 font-medium">Verification behavior: </span>{carrier.verificationBehavior}
                </div>
                <div className="text-[10px] text-slate-500 mt-2 italic">{carrier.notes}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "adjusters" && (
        <div className="space-y-3">
          {ADJUSTER_PROFILES.map((adj) => (
            <div key={adj.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{adj.name}</h3>
                  <div className="text-[10px] text-slate-500">{adj.carrier} · {adj.region} · {adj.mattersHandled} matters</div>
                </div>
                <div className="flex gap-1">
                  {adj.tags.map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                      {tag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div>
                  <div className="text-[9px] text-slate-500">Avg Response</div>
                  <div className="text-xs font-mono text-slate-300">{adj.avgResponseDays}d</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">Communication Style</div>
                  <div className="text-xs text-slate-300">{adj.communicationStyle}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">Offer Pattern</div>
                  <div className="text-xs text-slate-300">{adj.offerPattern}</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 italic">{adj.notes}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "communications" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400 mb-2">Active communication windows across all matters — monitoring response patterns and silence risk</div>
          {COMMUNICATION_WINDOWS.map((cw, i) => {
            const riskColor = cw.silenceRisk === "high" ? "#c45a4a" : cw.silenceRisk === "medium" ? "#c8953c" : "#4a90b8";
            return (
              <div key={i} className="rounded-lg border border-white/[0.06] p-4 flex items-start gap-4" style={{ background: "#0c1220" }}>
                <div className="mt-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: riskColor }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-200 mb-0.5">{cw.party}</div>
                  <div className="text-[10px] text-slate-500">{cw.matterTitle}</div>
                  <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-500">
                    <span>Last contact: <span className="text-slate-400">{cw.lastContact}</span></span>
                    <span className="font-mono" style={{ color: riskColor }}>{cw.daysSilent}d silent</span>
                    <span>Expected: {cw.expectedResponse}</span>
                  </div>
                  <div className="mt-1.5 text-[10px] text-[#d4a054]">→ {cw.recommendedAction}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
