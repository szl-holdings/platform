import { useState } from "react";
import { Link } from "wouter";
import { CrdtEntityPanel } from "@szl-holdings/shared-ui";
import {
  ArrowLeft, Clock, DollarSign, FileText, Users, Activity,
  MessageSquare, ShieldCheck, TrendingUp, AlertTriangle, Stethoscope,
  Scale, ChevronRight, ExternalLink, Wifi, WifiOff, Loader2,
  ShieldAlert, Layers, XCircle, RefreshCw, CheckCircle
} from "lucide-react";
import { DEMO_MATTERS, PILLAR_LABELS, PILLAR_DESCRIPTIONS } from "../data/demo-matters";
import { usePrismMatterDetail, usePrismMatterDeadlines, usePrismMatterParties, usePrismMatterComms } from "../hooks/use-prism-api";

const TABS = [
  { key: "summary", label: "Summary", icon: FileText },
  { key: "timeline", label: "Chronology", icon: Activity },
  { key: "damages", label: "Damages", icon: DollarSign },
  { key: "medical", label: "Medical", icon: Stethoscope },
  { key: "forecast", label: "Forecast", icon: TrendingUp },
  { key: "communications", label: "Comms", icon: MessageSquare },
  { key: "approvals", label: "Approvals", icon: ShieldCheck },
  { key: "recovery", label: "Recovery & Liens", icon: ShieldAlert },
  { key: "blockers", label: "Settlement Blockers", icon: Layers },
];

function PillarCard({ pillar, score, description }: { pillar: string; score: number; description: string }) {
  const pct = score;
  const color = pct >= 75 ? "#4a90b8" : pct >= 50 ? "#d4a054" : "#c45a4a";
  return (
    <div className="rounded border border-white/[0.06] p-3" style={{ background: "#080c14" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-slate-300">{pillar}</span>
        <span className="text-sm font-mono font-semibold" style={{ color }}>{score}</span>
      </div>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-1.5">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[9px] text-slate-500 leading-tight">{description}</p>
    </div>
  );
}

export default function MatterDetailPage({ id }: { id: number }) {
  const [activeTab, setActiveTab] = useState("summary");
  const detailQ = usePrismMatterDetail(id);
  const partiesQ = usePrismMatterParties(id);
  const deadlinesQ = usePrismMatterDeadlines(id);
  const commsQ = usePrismMatterComms(id);

  const demoMatter = DEMO_MATTERS.find(m => m.id === id);
  const liveMatter = detailQ.data;
  const isLive = !!liveMatter && !detailQ.isError;

  const matter = isLive ? {
    id: liveMatter.id,
    title: liveMatter.title,
    caseNumber: liveMatter.caseNumber,
    matterType: liveMatter.matterType,
    status: liveMatter.status,
    stage: liveMatter.status,
    jurisdiction: liveMatter.jurisdiction ?? "",
    courtName: liveMatter.courtName ?? "",
    healthScore: liveMatter.healthScore ?? 0,
    settlementLow: Number(liveMatter.settlementLow ?? 0),
    settlementMid: Number(liveMatter.settlementMid ?? 0),
    settlementHigh: Number(liveMatter.settlementHigh ?? 0),
    totalDamages: 0,
    totalLiens: 0,
    assignedAttorney: liveMatter.assignedAttorney ?? "",
    assignedParalegal: liveMatter.assignedParalegal ?? "",
    filingDate: liveMatter.filingDate ?? "",
    statOfLimitations: "",
    parties: (partiesQ.data ?? []).map(p => ({ role: p.partyRole, name: p.name, organization: p.organization ?? undefined })),
    claims: [] as any[],
    offers: [] as any[],
    medicalTimeline: [] as any[],
    damages: [] as any[],
    liens: [] as any[],
    deadlines: (deadlinesQ.data ?? []).map(d => ({ title: d.title, type: d.deadlineType, date: d.dueDate, priority: d.priority, status: d.status })),
    readinessScores: {} as Record<string, number>,
    recommendations: [] as any[],
  } : demoMatter;

  if (!matter) {
    return (
      <div className="p-6 text-center">
        {detailQ.isLoading ? (
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading matter...</span>
          </div>
        ) : (
          <>
            <p className="text-slate-400">Matter not found</p>
            <Link href="/prism-counsel/matters"><span className="text-[#d4a054] text-sm cursor-pointer">Back to matters</span></Link>
          </>
        )}
      </div>
    );
  }

  const healthColor = matter.healthScore >= 70 ? "#4a90b8" : matter.healthScore >= 50 ? "#d4a054" : "#c45a4a";

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <Link href="/prism-counsel/matters"><span className="hover:text-slate-300 cursor-pointer flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Matters</span></Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-400">{matter.caseNumber}</span>
        <span className={`ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
          isLive ? "bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20" : "bg-slate-500/10 text-slate-500 border border-white/[0.06]"
        }`}>
          {isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
          {isLive ? "LIVE" : "DEMO"}
        </span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">{matter.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-500 font-mono">{matter.caseNumber}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">{matter.jurisdiction}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">{matter.stage}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center px-3 py-2 rounded-lg border border-white/[0.06]" style={{ background: "#0c1220" }}>
            <div className="text-2xl font-bold" style={{ color: healthColor }}>{matter.healthScore}</div>
            <div className="text-[9px] text-slate-500 uppercase">Health</div>
          </div>
        </div>
      </div>

      {Object.keys(matter.readinessScores).length > 0 && (
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(matter.readinessScores).map(([key, score]) => (
            <PillarCard key={key} pillar={PILLAR_LABELS[key] || key} score={score} description={PILLAR_DESCRIPTIONS[key] || ""} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#d4a054] text-slate-200"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          {activeTab === "summary" && <SummaryTab matter={matter} />}
          {activeTab === "timeline" && <TimelineTab matter={matter} />}
          {activeTab === "damages" && <DamagesTab matter={matter} />}
          {activeTab === "medical" && <MedicalTab matter={matter} />}
          {activeTab === "forecast" && <ForecastTab matter={matter} />}
          {activeTab === "communications" && <CommsTab matter={matter} comms={commsQ.data} isLive={!!commsQ.data?.length} />}
          {activeTab === "approvals" && <ApprovalsTab matter={matter} />}
          {activeTab === "recovery" && <RecoveryTab matter={matter} />}
          {activeTab === "blockers" && <SettlementBlockersTab matter={matter} />}
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-300 mb-2">Key Parties</h3>
            {(matter.parties || []).map((p, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.06] text-slate-400 uppercase w-16 text-center">{p.role.replace("_", " ").slice(0, 8)}</span>
                <div>
                  <div className="text-[11px] text-slate-200">{p.name}</div>
                  {p.organization && <div className="text-[9px] text-slate-500">{p.organization}</div>}
                </div>
              </div>
            ))}
            {(matter.parties || []).length === 0 && <p className="text-[10px] text-slate-500">No parties on record</p>}
          </div>

          <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-300 mb-2">Claims</h3>
            {(matter.claims || []).map((c, i) => (
              <div key={i} className="py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">{c.claimNumber}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    c.status === "open" ? "bg-[#4a90b8]/10 text-[#4a90b8]" :
                    c.status === "denied" ? "bg-[#c45a4a]/10 text-[#c45a4a]" :
                    "bg-slate-500/10 text-slate-400"
                  }`}>{c.status.toUpperCase()}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{c.coverageType.replace(/_/g, " ")} · ${(Number(c.policyLimit) / 1000).toFixed(0)}K limit</div>
              </div>
            ))}
            {(matter.claims || []).length === 0 && <p className="text-[10px] text-slate-500">No claims on record</p>}
          </div>

          <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-300 mb-2">AI Recommendations</h3>
            {(matter.recommendations || []).map((r, i) => (
              <div key={i} className="py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${r.priority === "critical" ? "bg-[#c45a4a]" : r.priority === "high" ? "bg-[#d4a054]" : "bg-[#4a90b8]"}`} />
                  <span className="text-[11px] text-slate-200">{r.title}</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5 ml-3">{r.description}</p>
              </div>
            ))}
            {(matter.recommendations || []).length === 0 && <p className="text-[10px] text-slate-500">No recommendations</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

type MatterLike = {
  settlementLow: number;
  settlementMid: number;
  settlementHigh: number;
  totalDamages: number;
  totalLiens: number;
  offers: { type: string; amount: number; source: string; date: string }[];
  deadlines: { title: string; type: string; date: string; priority: string; status: string }[];
  medicalTimeline: { date: string; provider: string; type: string; event: string; billed: number }[];
  damages: { category: string; description: string; amount: number; status: string }[];
  liens: { holder: string; type: string; asserted: number; status: string }[];
  parties: { role: string; name: string; organization?: string }[];
  assignedAttorney: string;
  assignedParalegal: string;
  recommendations: { type: string; title: string; description: string; priority: string }[];
};

function SummaryTab({ matter }: { matter: MatterLike }) {
  return (
    <div className="space-y-3">
      <CrdtEntityPanel
        entityType="matter"
        entityId={String(matter.id)}
        label="Team Collaboration"
        schema={{ entityType: "matter", fields: { status: { conflictReview: true }, notes: {} } }}
      />
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Settlement Forecast</h3>
        {matter.settlementHigh > 0 ? (
          <>
            <div className="flex items-center gap-4 mb-2">
              <div className="text-center">
                <div className="text-xs text-slate-500">Low</div>
                <div className="text-sm font-mono text-slate-300">${(matter.settlementLow / 1000).toFixed(0)}K</div>
              </div>
              <div className="flex-1 h-3 bg-white/[0.06] rounded-full relative">
                <div className="absolute h-full rounded-full" style={{ left: "15%", right: "10%", background: "linear-gradient(90deg, #d4a054, #4a90b8)", opacity: 0.4 }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#d4a054]" style={{ left: "50%" }} />
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">High</div>
                <div className="text-sm font-mono text-slate-300">${(matter.settlementHigh / 1000).toFixed(0)}K</div>
              </div>
            </div>
            <div className="text-center text-xs text-slate-400">
              Midpoint: <span className="text-[#d4a054] font-mono">${(matter.settlementMid / 1000).toFixed(0)}K</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500">No settlement forecast available</p>
        )}
      </div>

      {(matter.totalDamages > 0 || matter.totalLiens > 0) && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded border border-white/[0.06] p-3" style={{ background: "#080c14" }}>
            <div className="text-[10px] text-slate-500 uppercase mb-1">Total Damages</div>
            <div className="text-sm font-mono text-slate-200">${(matter.totalDamages / 1000).toFixed(0)}K</div>
          </div>
          <div className="rounded border border-white/[0.06] p-3" style={{ background: "#080c14" }}>
            <div className="text-[10px] text-slate-500 uppercase mb-1">Total Liens</div>
            <div className="text-sm font-mono text-slate-200">${(matter.totalLiens / 1000).toFixed(1)}K</div>
          </div>
          <div className="rounded border border-white/[0.06] p-3" style={{ background: "#080c14" }}>
            <div className="text-[10px] text-slate-500 uppercase mb-1">Net to Client</div>
            <div className="text-sm font-mono text-[#4a90b8]">${((matter.settlementMid - matter.totalLiens) / 1000).toFixed(0)}K</div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Offer / Reserve Trail</h3>
        {(matter.offers || []).length === 0 ? (
          <p className="text-xs text-slate-500">No offers on record</p>
        ) : (
          <div className="space-y-2">
            {(matter.offers || []).map((o, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <div className="text-[10px] text-slate-500 font-mono w-20">{new Date(o.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${
                  o.type === "demand" ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#4a90b8]/10 text-[#4a90b8]"
                }`}>{o.type.replace("_", " ").toUpperCase()}</span>
                <span className="text-xs font-mono text-slate-200">${(o.amount / 1000).toFixed(0)}K</span>
                <span className="text-[10px] text-slate-500">{o.source}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Upcoming Deadlines</h3>
        <div className="space-y-2">
          {(matter.deadlines || []).length === 0 ? (
            <p className="text-xs text-slate-500">No deadlines on record</p>
          ) : (
            (matter.deadlines || []).map((d, i) => {
              const daysLeft = Math.ceil((new Date(d.date).getTime() - Date.now()) / 86400000);
              return (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <Clock className={`w-3.5 h-3.5 ${daysLeft <= 14 ? "text-[#c45a4a]" : "text-slate-500"}`} />
                  <div className="flex-1">
                    <span className="text-xs text-slate-200">{d.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <span className={`text-[10px] font-mono ${daysLeft <= 14 ? "text-[#c45a4a]" : "text-slate-500"}`}>{daysLeft}d</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ matter }: { matter: MatterLike }) {
  const events = [
    ...(matter.medicalTimeline || []).map(e => ({ date: e.date, type: "medical" as const, label: e.event, sub: e.provider })),
    ...(matter.offers || []).map(o => ({ date: o.date, type: "offer" as const, label: `${o.type.replace("_", " ")} — $${(o.amount / 1000).toFixed(0)}K`, sub: o.source })),
    ...(matter.deadlines || []).map(d => ({ date: d.date, type: "deadline" as const, label: d.title, sub: d.type.replace("_", " ") })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <h3 className="text-sm font-semibold text-slate-200 mb-4">Full Chronology</h3>
      {events.length === 0 ? (
        <p className="text-xs text-slate-500">No timeline events</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-white/[0.06]" />
          {events.map((e, i) => (
            <div key={i} className="flex gap-3 mb-3 last:mb-0 relative">
              <div className={`w-2 h-2 rounded-full mt-1.5 z-10 flex-shrink-0 ml-3 ${
                e.type === "medical" ? "bg-[#4a90b8]" : e.type === "offer" ? "bg-[#d4a054]" : "bg-[#c45a4a]"
              }`} />
              <div className="flex-1 ml-2">
                <div className="text-[10px] text-slate-500 font-mono">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                <div className="text-xs text-slate-200 mt-0.5">{e.label}</div>
                <div className="text-[10px] text-slate-500">{e.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DamagesTab({ matter }: { matter: MatterLike }) {
  const total = (matter.damages || []).reduce((s, d) => s + d.amount, 0);
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Damages Breakdown</h3>
        <span className="text-sm font-mono text-[#d4a054]">${(total / 1000).toFixed(0)}K total</span>
      </div>
      {(matter.damages || []).length === 0 ? (
        <p className="text-xs text-slate-500">No damages data available</p>
      ) : (
        <div className="space-y-2">
          {(matter.damages || []).map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <div className="flex-1">
                <div className="text-xs text-slate-200">{d.description}</div>
                <div className="text-[10px] text-slate-500">{d.category.replace(/_/g, " ")}</div>
              </div>
              <span className="text-xs font-mono text-slate-300">${(d.amount / 1000).toFixed(0)}K</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                d.status === "verified" ? "bg-[#4a90b8]/10 text-[#4a90b8]" :
                d.status === "estimated" ? "bg-[#d4a054]/10 text-[#d4a054]" :
                "bg-slate-500/10 text-slate-400"
              }`}>{d.status}</span>
            </div>
          ))}
        </div>
      )}
      {(matter.liens || []).length > 0 && (
        <>
          <h4 className="text-xs font-semibold text-slate-300 mt-4 mb-2">Liens</h4>
          {(matter.liens || []).map((l, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <div className="flex-1">
                <div className="text-xs text-slate-200">{l.holder}</div>
                <div className="text-[10px] text-slate-500">{l.type.replace(/_/g, " ")}</div>
              </div>
              <span className="text-xs font-mono text-[#c45a4a]">${(l.asserted / 1000).toFixed(1)}K</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                l.status === "negotiating" ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-slate-500/10 text-slate-400"
              }`}>{l.status}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function MedicalTab({ matter }: { matter: MatterLike }) {
  if (!(matter.medicalTimeline || []).length) {
    return (
      <div className="rounded-lg border border-white/[0.06] p-6 text-center" style={{ background: "#0c1220" }}>
        <Stethoscope className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-500">No medical events for this matter type</p>
      </div>
    );
  }
  const totalBilled = (matter.medicalTimeline || []).reduce((s, e) => s + (e.billed || 0), 0);
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Medical Chronology</h3>
        <span className="text-xs font-mono text-slate-400">${(totalBilled / 1000).toFixed(1)}K billed</span>
      </div>
      <div className="space-y-2">
        {(matter.medicalTimeline || []).map((e, i) => (
          <div key={i} className="flex gap-3 py-2 border-b border-white/[0.04] last:border-0">
            <div className="text-[10px] text-slate-500 font-mono w-20 flex-shrink-0">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            <div className="flex-1">
              <div className="text-xs text-slate-200">{e.event}</div>
              <div className="text-[10px] text-slate-500">{e.provider} · {e.type.replace("_", " ")}</div>
            </div>
            {e.billed > 0 && <span className="text-[10px] font-mono text-slate-400">${(e.billed / 1000).toFixed(1)}K</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ForecastTab({ matter }: { matter: MatterLike }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Settlement Range Forecast</h3>
        {matter.settlementHigh > 0 ? (
          <div className="flex items-end gap-4 h-32">
            <div className="flex-1 flex flex-col items-center justify-end">
              <div className="w-full rounded-t" style={{ height: `${(matter.settlementLow / matter.settlementHigh) * 100}%`, background: "#d4a054", opacity: 0.3 }} />
              <span className="text-[10px] text-slate-500 mt-1">Low</span>
              <span className="text-xs font-mono text-slate-400">${(matter.settlementLow / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-end">
              <div className="w-full rounded-t" style={{ height: `${(matter.settlementMid / matter.settlementHigh) * 100}%`, background: "#d4a054", opacity: 0.6 }} />
              <span className="text-[10px] text-slate-500 mt-1">Mid</span>
              <span className="text-xs font-mono text-[#d4a054]">${(matter.settlementMid / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-end">
              <div className="w-full rounded-t" style={{ height: "100%", background: "#4a90b8", opacity: 0.4 }} />
              <span className="text-[10px] text-slate-500 mt-1">High</span>
              <span className="text-xs font-mono text-slate-400">${(matter.settlementHigh / 1000).toFixed(0)}K</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No forecast data available</p>
        )}
      </div>
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-300 mb-2">Forecast Signals</h3>
        <div className="space-y-1.5 text-[11px] text-slate-400">
          <div>Medical treatment ongoing — final MMI not reached</div>
          <div>Insurer offer trajectory: increasing (2 offers in 3 months)</div>
          <div>Comparative fault exposure: low (clear liability)</div>
          <div>Lien resolution: 1 of 3 liens under negotiation</div>
          <div>Discovery completion: 55% — key depositions pending</div>
        </div>
        <p className="text-[9px] text-slate-600 mt-3 italic">Forecasts are model-generated estimates based on available signals. They do not constitute legal advice and require attorney review.</p>
      </div>
    </div>
  );
}

function CommsTab({ matter, comms, isLive }: { matter: MatterLike; comms?: any[]; isLive: boolean }) {
  const displayComms = isLive && comms?.length
    ? comms.map(c => ({
        direction: c.direction,
        channel: c.channel,
        from: c.fromParty ?? "Unknown",
        subject: c.subject ?? "No subject",
        date: c.sentAt,
      }))
    : [
        { direction: "inbound", channel: "email", from: matter.parties?.[3]?.name || "Adjuster", subject: "Counter-offer and updated reserve position", date: "2026-01-15" },
        { direction: "outbound", channel: "email", from: matter.assignedAttorney, subject: "Demand package — medical specials and documentation", date: "2026-02-28" },
        { direction: "internal", channel: "teams", from: matter.assignedParalegal || "Paralegal", subject: "Medical records status update — missing imaging report", date: "2026-03-10" },
      ];

  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <h3 className="text-sm font-semibold text-slate-200 mb-3">Communications</h3>
      <div className="space-y-2">
        {displayComms.map((c, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
            <div className={`w-1.5 h-1.5 rounded-full ${c.direction === "inbound" ? "bg-[#4a90b8]" : c.direction === "outbound" ? "bg-[#d4a054]" : "bg-slate-500"}`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-200 truncate">{c.subject}</div>
              <div className="text-[10px] text-slate-500">{c.from} · {c.channel} · {c.direction}</div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovalsTab({ matter }: { matter: MatterLike }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <h3 className="text-sm font-semibold text-slate-200 mb-3">Approval Queue</h3>
      <div className="space-y-2">
        {[
          { type: "demand_send", title: "Send demand package to National General", status: "pending", requestedBy: matter.assignedAttorney },
          { type: "expert_engagement", title: "Retain life care plan expert", status: "pending", requestedBy: matter.assignedParalegal || "Paralegal" },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
            <ShieldCheck className="w-4 h-4 text-[#d4a054]" />
            <div className="flex-1">
              <div className="text-xs text-slate-200">{a.title}</div>
              <div className="text-[10px] text-slate-500">Requested by {a.requestedBy} · {a.type.replace(/_/g, " ")}</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#d4a054]/10 text-[#d4a054]">PENDING</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-slate-600 mt-3">All externally consequential actions require explicit attorney or partner approval before execution.</p>
    </div>
  );
}

const MATTER_RECOVERY_DEMO: Record<number, any[]> = {
  1: [
    {
      id: 1, lienHolder: "Florida Medicaid AHCA", category: "Medicaid",
      lifecycleState: "awaiting_response", assertedAmount: 22300, amountStatus: "pending",
      blocksSettlement: true, isStale: true, daysSinceActivity: 47, confidence: 0.82,
      notes: "Conditional payment letter received Jan 2026. No updated amount despite follow-up.",
    },
    {
      id: 2, lienHolder: "PhysioFirst PT", category: "Provider Lien",
      lifecycleState: "amount_known", assertedAmount: 14400, amountStatus: "confirmed",
      blocksSettlement: false, isStale: false, daysSinceActivity: 5, confidence: 0.95,
      notes: "Provider confirmed final amount. Negotiation in progress.",
    },
    {
      id: 3, lienHolder: "Jackson Memorial Hospital", category: "Hospital Lien",
      lifecycleState: "dispute_flagged", assertedAmount: 5600, amountStatus: "inferred",
      blocksSettlement: true, isStale: false, daysSinceActivity: 12, confidence: 0.65,
      notes: "Dispute letter sent. Hospital non-responsive. Export blocked.",
    },
  ],
  2: [
    {
      id: 4, lienHolder: "Blue Cross Blue Shield NJ", category: "Private Health / ERISA",
      lifecycleState: "documentation_requested", assertedAmount: 18900, amountStatus: "pending",
      blocksSettlement: true, isStale: false, daysSinceActivity: 8, confidence: 0.78,
      notes: "ERISA plan. Documentation requested March 2026.",
    },
  ],
  3: [],
};

const LIFECYCLE_COLORS_MATTER: Record<string, string> = {
  awaiting_response: "#d4a054",
  documentation_requested: "#c8953c",
  dispute_flagged: "#c45a4a",
  amount_pending: "#c8953c",
  amount_known: "#4a90b8",
  ready_for_settlement_handling: "#22c55e",
};

const LIFECYCLE_LABELS_MATTER: Record<string, string> = {
  not_identified: "Not Identified", suspected: "Suspected", identified: "Identified",
  documentation_requested: "Docs Requested", awaiting_response: "Awaiting Response",
  amount_pending: "Amount Pending", amount_known: "Amount Known", dispute_flagged: "Dispute Flagged",
  reviewed: "Reviewed", ready_for_settlement_handling: "Ready", resolved: "Resolved", archived: "Archived",
};

function RecoveryTab({ matter }: { matter: MatterLike & { id?: number } }) {
  const matterId = (matter as any).id ?? 1;
  const items = MATTER_RECOVERY_DEMO[matterId] ?? [];
  const blockingCount = items.filter((i: any) => i.blocksSettlement).length;
  const totalAsserted = items.reduce((s: number, i: any) => s + (i.assertedAmount ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded border border-white/[0.06] p-3" style={{ background: "#080c14" }}>
          <div className="text-[9px] text-slate-600 uppercase mb-1">Recovery Items</div>
          <div className="text-lg font-bold text-slate-200">{items.length}</div>
        </div>
        <div className="rounded border border-white/[0.06] p-3" style={{ background: "#080c14" }}>
          <div className="text-[9px] text-slate-600 uppercase mb-1">Blocking Settlement</div>
          <div className="text-lg font-bold text-[#c45a4a]">{blockingCount}</div>
        </div>
        <div className="rounded border border-white/[0.06] p-3" style={{ background: "#080c14" }}>
          <div className="text-[9px] text-slate-600 uppercase mb-1">Total Asserted</div>
          <div className="text-lg font-bold text-slate-200">${(totalAsserted / 1000).toFixed(1)}K</div>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#c45a4a]" />
            Recovery & Lien Panel
          </h3>
          <Link href="/prism-counsel/recovery-ops">
            <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">
              Firm view <ChevronRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">No recovery items for this matter</p>
        ) : (
          <div className="space-y-3">
            {items.map((item: any) => {
              const stateColor = LIFECYCLE_COLORS_MATTER[item.lifecycleState] ?? "#6b7280";
              return (
                <div key={item.id} className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium text-slate-100">{item.lienHolder}</span>
                        {item.blocksSettlement && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#c45a4a]/10 text-[#c45a4a]">BLOCKS</span>
                        )}
                        {item.isStale && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#c8953c]/10 text-[#c8953c]">STALE</span>
                        )}
                      </div>
                      <div className="text-[9px] text-[#4a90b8] mb-1">{item.category}</div>
                      <p className="text-[9px] text-slate-500 leading-relaxed">{item.notes}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-mono text-slate-200">${(item.assertedAmount / 1000).toFixed(1)}K</div>
                      <div className="text-[9px] mt-0.5" style={{ color: item.amountStatus === "confirmed" ? "#22c55e" : "#d4a054" }}>{item.amountStatus}</div>
                      <div className="mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: `${stateColor}18`, color: stateColor }}>
                          {LIFECYCLE_LABELS_MATTER[item.lifecycleState]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] text-slate-600">{item.daysSinceActivity}d since activity</span>
                    <span className="text-[9px] text-slate-600">conf: {Math.round(item.confidence * 100)}%</span>
                    <div className="flex-1" />
                    <button className="px-2 py-0.5 rounded text-[9px] text-slate-400 border border-white/[0.06] hover:border-white/[0.12] hover:text-slate-200 transition-colors">
                      Request Update
                    </button>
                    <button className="px-2 py-0.5 rounded text-[9px] text-slate-400 border border-white/[0.06] hover:border-white/[0.12] hover:text-slate-200 transition-colors">
                      Add Note
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-xs font-semibold text-slate-200 mb-2">Recovery Signals</h3>
          <div className="space-y-1.5">
            {items.filter((i: any) => i.blocksSettlement).map((item: any) => (
              <div key={item.id} className="flex items-start gap-1.5">
                <div className="w-1 h-1 rounded-full bg-[#c45a4a] mt-1.5 flex-shrink-0" />
                <span className="text-[9px] text-slate-500">{item.lienHolder}: blocks settlement distribution</span>
              </div>
            ))}
            {items.filter((i: any) => i.isStale).map((item: any) => (
              <div key={`stale-${item.id}`} className="flex items-start gap-1.5">
                <div className="w-1 h-1 rounded-full bg-[#c8953c] mt-1.5 flex-shrink-0" />
                <span className="text-[9px] text-slate-500">{item.lienHolder}: amount stale {item.daysSinceActivity}d, matter has advanced</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const MATTER_BLOCKERS_DEMO: Record<number, any[]> = {
  1: [
    {
      id: 1, blockerType: "recovery_lien", title: "Medicaid AHCA — amount not confirmed",
      severity: "critical", isExternal: true, daysOpen: 47,
      nextBestAction: "Send certified escalation letter to AHCA with settlement timeline",
      blocksWhat: "Settlement distribution, export",
      consequencesIfIgnored: "Cannot distribute funds. MSP compliance exposure.",
    },
    {
      id: 2, blockerType: "missing_evidence", title: "Wage verification outstanding",
      severity: "high", isExternal: false, daysOpen: 22,
      nextBestAction: "Final demand to employer with 10-day deadline",
      blocksWhat: "Demand packet send",
      consequencesIfIgnored: "Lost wages component weakened; demand incomplete.",
    },
    {
      id: 3, blockerType: "recovery_lien", title: "Jackson Memorial lien — dispute active",
      severity: "high", isExternal: true, daysOpen: 12,
      nextBestAction: "Follow up dispute letter; set 14-day response deadline",
      blocksWhat: "Export, settlement distribution",
      consequencesIfIgnored: "Export blocked. Settlement delay.",
    },
  ],
  2: [
    {
      id: 4, blockerType: "missing_evidence", title: "Surveillance footage not produced",
      severity: "critical", isExternal: true, daysOpen: 31,
      nextBestAction: "File motion for sanctions; depose facilities manager",
      blocksWhat: "Trial readiness, mediation",
      consequencesIfIgnored: "Liability contested without evidence. Weak mediation position.",
    },
  ],
  3: [
    {
      id: 5, blockerType: "insurer_silence", title: "Atlantic Casualty non-responsive 62 days",
      severity: "high", isExternal: true, daysOpen: 62,
      nextBestAction: "Formal demand citing silence as bad faith; 10-day ultimatum",
      blocksWhat: "Settlement negotiations",
      consequencesIfIgnored: "Momentum stalled. MSJ on bad faith may be needed.",
    },
  ],
};

const BLOCKER_COLORS: Record<string, string> = {
  recovery_lien: "#c45a4a", missing_evidence: "#c45a4a", insurer_silence: "#d4a054",
  insurer_hardening: "#c45a4a", contradiction: "#c45a4a", approval: "#8b7ac8",
  document_confidence: "#c8953c", export_safety: "#c45a4a", review_backlog: "#d4a054",
};
const BLOCKER_LABELS: Record<string, string> = {
  recovery_lien: "Recovery / Lien", missing_evidence: "Missing Evidence",
  insurer_silence: "Insurer Silence", insurer_hardening: "Insurer Hardening",
  missing_records: "Missing Records", contradiction: "Contradiction",
  approval: "Approval", document_confidence: "Doc Confidence",
  export_safety: "Export Safety", review_backlog: "Review Backlog",
};

function SettlementBlockersTab({ matter }: { matter: MatterLike & { id?: number } }) {
  const matterId = (matter as any).id ?? 1;
  const blockers = MATTER_BLOCKERS_DEMO[matterId] ?? [];

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#d4a054]" />
            Settlement Blockers
          </h3>
          <Link href="/prism-counsel/settlement-blockers">
            <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">
              All blockers <ChevronRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
        {blockers.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="w-6 h-6 text-[#22c55e] mx-auto mb-2" />
            <p className="text-xs text-slate-400">No active settlement blockers</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockers.map((blocker: any) => {
              const color = BLOCKER_COLORS[blocker.blockerType] ?? "#6b7280";
              const sevColor = blocker.severity === "critical" ? "#c45a4a" : blocker.severity === "high" ? "#d4a054" : "#c8953c";
              return (
                <div key={blocker.id} className="rounded border p-3 transition-colors" style={{ background: "#080c14", borderColor: blocker.severity === "critical" ? "#c45a4a25" : "rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-medium text-slate-100">{blocker.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: `${sevColor}18`, color: sevColor }}>
                      {blocker.severity.toUpperCase()}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${blocker.isExternal ? "bg-[#8b7ac8]/10 text-[#8b7ac8]" : "bg-white/[0.04] text-slate-500"}`}>
                      {blocker.isExternal ? "EXTERNAL" : "INTERNAL"}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#4a90b8] mb-2">{BLOCKER_LABELS[blocker.blockerType]}</div>
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div>
                      <div className="text-slate-600 uppercase mb-0.5">Next Action</div>
                      <p className="text-[#4a90b8] leading-relaxed">{blocker.nextBestAction}</p>
                    </div>
                    <div>
                      <div className="text-slate-600 uppercase mb-0.5">If Ignored</div>
                      <p className="text-[#c45a4a] leading-relaxed">{blocker.consequencesIfIgnored}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/[0.04]">
                    <span className="text-[9px] text-slate-600">{blocker.daysOpen}d open</span>
                    <span className="text-[9px] text-slate-600">Blocks: {blocker.blocksWhat}</span>
                    <div className="flex-1" />
                    <button className="px-2 py-0.5 rounded text-[9px] text-slate-400 border border-white/[0.06] hover:border-white/[0.12] hover:text-slate-200 transition-colors">
                      Take Action
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
