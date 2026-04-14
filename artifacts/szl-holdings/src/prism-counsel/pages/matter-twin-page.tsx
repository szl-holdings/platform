import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Scale, Brain, Clock, TrendingUp, MessageSquare, FileText, Shield, Gavel, Activity, BarChart3, Users, Layers, ChevronRight, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

interface MatterTwinData {
  title?: string; caseNumber?: string; matter?: unknown; subpages?: unknown;
  [key: string]: unknown;
}
interface TwinApiResponse { data?: MatterTwinData }

const SUBPAGES = [
  { id: "summary", label: "Summary", icon: Brain },
  { id: "twin", label: "Twin", icon: Layers },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "deadlines", label: "Deadlines", icon: Clock },
  { id: "forecast", label: "Forecast", icon: TrendingUp },
  { id: "pressure", label: "Pressure", icon: BarChart3 },
  { id: "medical", label: "Medical", icon: Activity },
  { id: "damages", label: "Damages", icon: Scale },
  { id: "communications", label: "Comms", icon: MessageSquare },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "demand", label: "Demand", icon: Shield },
  { id: "discovery", label: "Discovery", icon: FileText },
  { id: "depositions", label: "Depositions", icon: Users },
  { id: "mediation", label: "Mediation", icon: Gavel },
  { id: "approvals", label: "Approvals", icon: Gavel },
  { id: "audit", label: "Audit", icon: Shield },
  { id: "proof_chain", label: "Proof Chain", icon: Shield },
] as const;

type SubpageId = typeof SUBPAGES[number]["id"];

function SummarySubpage({ twinData }: { twinData: any }) {
  const matter = twinData?.matter;
  const recs = twinData?.subpages?.recommendations?.items ?? [];
  const approvals = twinData?.subpages?.approvals?.pending ?? [];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Health Score", value: matter?.healthScore ?? "—", color: "#4a90b8" },
          { label: "Status", value: matter?.status?.replace("_", " ").toUpperCase() ?? "—", color: "#d4a054" },
          { label: "Jurisdiction", value: matter?.jurisdiction ?? "—", color: "#8a7a6a" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{kpi.label}</div>
            <div className="text-xl font-semibold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">AI Recommendations</h3>
        {recs.length === 0 && <div className="text-xs text-slate-500">No pending recommendations</div>}
        <div className="space-y-2">
          {recs.slice(0, 5).map((r: any, i: number) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.priority === "critical" ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
              <div>
                <div className="text-xs text-slate-200">{r.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{r.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {approvals.length > 0 && (
        <div className="rounded-lg border border-[#d4a054]/20 p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-[#d4a054] mb-3">Pending Approvals</h3>
          <div className="space-y-2">
            {approvals.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div>
                  <div className="text-xs text-slate-200">{a.title}</div>
                  <div className="text-[10px] text-slate-500">{a.requestType?.replace("_", " ")}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] bg-[#d4a054]/10 text-[#d4a054]">PENDING</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TwinSubpage({ twinData }: { twinData: any }) {
  const matter = twinData?.matter;
  const EIGHT_QUESTIONS = [
    { q: "What's happening?", a: matter ? `${matter.matterType?.replace("_", " ")} case in ${matter.status} stage` : "Loading..." },
    { q: "What changed?", a: "Last updated: " + (matter?.updatedAt ? new Date(matter.updatedAt).toLocaleDateString() : "—") },
    { q: "What's missing?", a: "Review AI recommendations for missing evidence gaps" },
    { q: "What's risky?", a: matter?.healthScore < 50 ? "Matter health below threshold — review deadlines and coverage" : "No critical risks detected" },
    { q: "What outside context matters?", a: "Worldline signals: venue velocity, insurer pressure, weather events" },
    { q: "What should happen next?", a: "See AI recommendations above for next best actions" },
    { q: "Who must approve?", a: twinData?.subpages?.approvals?.pending?.length > 0 ? `${twinData.subpages.approvals.pending.length} approval(s) pending` : "No pending approvals" },
    { q: "What sources support that answer?", a: "See Proof Chain for full source lineage and confidence scores" },
  ];

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500 mb-4">The Matter Twin answers 8 core operational questions about this matter in real time.</div>
      {EIGHT_QUESTIONS.map((item, i) => (
        <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="text-[10px] font-medium text-[#d4a054] uppercase tracking-wider mb-1">Q{i + 1}</div>
          <div className="text-sm text-slate-200 mb-2">{item.q}</div>
          <div className="text-xs text-slate-400">{item.a}</div>
        </div>
      ))}
    </div>
  );
}

function DeadlinesSubpage({ twinData }: { twinData: any }) {
  const items = twinData?.subpages?.deadlines?.items ?? [];
  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-xs text-slate-500">No deadlines found</div>}
      {items.map((d: any, i: number) => {
        const days = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000);
        const color = days <= 7 ? "#c45a4a" : days <= 30 ? "#d4a054" : "#4a90b8";
        return (
          <div key={i} className="rounded-lg border border-white/[0.06] p-3 flex items-center justify-between" style={{ background: "#0c1220" }}>
            <div>
              <div className="text-xs text-slate-200">{d.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{d.deadlineType?.replace("_", " ")} · {d.priority}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-semibold" style={{ color }}>{days > 0 ? `${days}d` : "OVERDUE"}</div>
              <div className="text-[10px] text-slate-500">{new Date(d.dueDate).toLocaleDateString()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ForecastSubpage({ twinData }: { twinData: any }) {
  const items = twinData?.subpages?.forecast?.items ?? [];
  return (
    <div className="space-y-3">
      {items.length === 0 && <div className="text-xs text-slate-500">No forecasts available</div>}
      {items.map((f: any, i: number) => (
        <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-slate-200">{f.forecastType?.replace("_", " ")}</div>
            <div className="text-xs font-mono text-[#4a90b8]">{f.confidence ? `${(Number(f.confidence) * 100).toFixed(0)}% conf` : "—"}</div>
          </div>
          {f.explanation && <div className="text-[11px] text-slate-400 mt-1">{f.explanation}</div>}
          {(f.valueLow || f.valueHigh) && (
            <div className="text-[10px] text-slate-500 mt-2 font-mono">
              Range: ${Number(f.valueLow ?? 0).toLocaleString()} – ${Number(f.valueHigh ?? 0).toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CommsSubpage({ twinData }: { twinData: any }) {
  const items = twinData?.subpages?.communications?.items ?? [];
  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-xs text-slate-500">No communications logged</div>}
      {items.map((c: any, i: number) => (
        <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${c.direction === "inbound" ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
              {c.direction?.toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-500">{c.channel}</span>
            {c.isPrivileged && <span className="px-1 py-0.5 rounded text-[9px] bg-[#c45a4a]/10 text-[#c45a4a]">PRIV</span>}
          </div>
          <div className="text-xs text-slate-200">{c.subject ?? c.summary ?? "No subject"}</div>
          <div className="text-[10px] text-slate-500 mt-1">{c.fromParty} → {c.toParty}</div>
        </div>
      ))}
    </div>
  );
}

function ApprovalsSubpage({ twinData }: { twinData: any }) {
  const items = twinData?.subpages?.approvals?.pending ?? [];
  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="w-4 h-4 text-green-500" /> No pending approvals
        </div>
      )}
      {items.map((a: any, i: number) => (
        <div key={i} className="rounded-lg border border-[#d4a054]/20 p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-slate-200">{a.title}</div>
            <span className="px-2 py-0.5 rounded text-[9px] bg-[#d4a054]/10 text-[#d4a054]">AWAITING APPROVAL</span>
          </div>
          <div className="text-[10px] text-slate-500">{a.requestType?.replace("_", " ")} · Requested {new Date(a.requestedAt).toLocaleDateString()}</div>
          {a.description && <div className="text-[11px] text-slate-400 mt-2">{a.description}</div>}
        </div>
      ))}
    </div>
  );
}

function PlaceholderSubpage({ subpageId }: { subpageId: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
      <div className="text-xs text-slate-500 mb-2">{subpageId.replace("_", " ")} view</div>
      <div className="text-[10px] text-slate-600">Data will appear here as matter records are populated</div>
    </div>
  );
}

export default function MatterTwinPage() {
  const [, params] = useRoute("/prism-counsel/matters/:id/twin/:subpage?");
  const [activeSubpage, setActiveSubpage] = useState<SubpageId>("summary");
  const matterId = parseInt(params?.id ?? "0");

  const { data: twinData, isLoading } = useQuery({
    queryKey: ["matter-twin", matterId],
    queryFn: () => apiRequest<TwinApiResponse>("GET", `/api/prism-counsel/matters/${matterId}/twin`),
    enabled: matterId > 0,
  });

  const twin = twinData?.data;

  function renderSubpage() {
    if (!twin && !isLoading) return <div className="text-xs text-slate-500">Matter not found</div>;
    if (isLoading) return <div className="text-xs text-slate-500">Loading matter twin…</div>;

    switch (activeSubpage) {
      case "summary": return <SummarySubpage twinData={twin} />;
      case "twin": return <TwinSubpage twinData={twin} />;
      case "deadlines": return <DeadlinesSubpage twinData={twin} />;
      case "forecast": return <ForecastSubpage twinData={twin} />;
      case "communications": return <CommsSubpage twinData={twin} />;
      case "approvals": return <ApprovalsSubpage twinData={twin} />;
      default: return <PlaceholderSubpage subpageId={activeSubpage} />;
    }
  }

  const matter = twin?.matter;

  return (
    <div className="flex h-full" style={{ background: "#080c14" }}>
      <aside className="w-[160px] flex-shrink-0 border-r border-white/[0.06] overflow-y-auto" style={{ background: "#0a0f18" }}>
        <div className="p-3 border-b border-white/[0.06]">
          <Link href={`/prism-counsel/matters/${matterId}`}>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer">
              <ArrowLeft className="w-3 h-3" /> Matter
            </div>
          </Link>
          <div className="text-[10px] text-[#d4a054] mt-1 font-medium">MATTER TWIN</div>
        </div>
        <nav className="py-2">
          {SUBPAGES.map(sp => {
            const Icon = sp.icon;
            return (
              <button
                key={sp.id}
                onClick={() => setActiveSubpage(sp.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors",
                  activeSubpage === sp.id
                    ? "bg-white/[0.08] text-slate-100"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                )}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span>{sp.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-5">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <Brain className="w-4 h-4 text-[#d4a054]" />
            <div>
              <h1 className="text-sm font-semibold text-slate-100">
                {twin?.title ?? `Matter #${matterId}`}
              </h1>
              <div className="text-[10px] text-slate-500">{twin?.caseNumber} · Matter Twin · {SUBPAGES.find(s => s.id === activeSubpage)?.label}</div>
            </div>
          </div>
          {renderSubpage()}
        </div>
      </main>
    </div>
  );
}
