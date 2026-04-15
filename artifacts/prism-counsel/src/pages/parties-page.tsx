import { Users, Wifi, WifiOff, Loader2 } from "lucide-react";
import { usePrismMatters } from "../hooks/use-prism-api";

export default function PartiesPage() {
  const mattersQ = usePrismMatters();
  const isLive = Array.isArray(mattersQ.data) && mattersQ.data.length > 0;
  const isLoading = mattersQ.isLoading;

  const allParties = isLive
    ? (mattersQ.data as Array<{ id: number; title: string; parties?: Array<{ name: string; role: string; organization?: string }> }>)
        .flatMap(m => (m.parties ?? []).map(p => ({ ...p, matterTitle: m.title, matterId: m.id })))
    : [];

  const byRole = allParties.reduce<Record<string, typeof allParties>>((acc, p) => {
    const key = p.role;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#d4a054]" />
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Parties Directory</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isLoading ? "Loading…" : isLive ? `${allParties.length} parties across all active matters` : "No matters loaded"}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
          isLive ? "bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20" : "bg-slate-500/10 text-slate-500 border border-white/[0.06]"
        }`}>
          {isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
          {isLoading ? "LOADING" : isLive ? "LIVE" : "NO DATA"}
        </span>
      </div>

      {!isLoading && !isLive && (
        <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No matters loaded</p>
          <p className="text-xs text-slate-600 mt-1">Add matters with party records to populate this directory.</p>
        </div>
      )}

      {isLive && allParties.length === 0 && (
        <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No party records found</p>
          <p className="text-xs text-slate-600 mt-1">Party information will appear here once added to matters.</p>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(byRole).map(([role, parties]) => (
          <div key={role} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{role.replace(/_/g, " ")}s ({parties.length})</h3>
            <div className="space-y-2">
              {parties.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-semibold text-slate-400">
                    {p.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-200">{p.name}</div>
                    {p.organization && <div className="text-[10px] text-slate-500">{p.organization}</div>}
                  </div>
                  <span className="text-[10px] text-slate-500">{p.matterTitle}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
