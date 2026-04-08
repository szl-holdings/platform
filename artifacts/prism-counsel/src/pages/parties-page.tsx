import { Users } from "lucide-react";
import { DEMO_MATTERS } from "../data/demo-matters";

export default function PartiesPage() {
  const allParties = DEMO_MATTERS.flatMap(m =>
    (m.parties || []).map(p => ({ ...p, matterTitle: m.title, matterId: m.id }))
  );

  const byRole = allParties.reduce<Record<string, typeof allParties>>((acc, p) => {
    const key = p.role;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Parties Directory</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{allParties.length} parties across all active matters</p>
      </div>

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
