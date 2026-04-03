import { FileText, ArrowRight, ArrowLeft } from "lucide-react";

const DISCOVERY_ITEMS = [
  { matter: "Rodriguez v. National General", type: "Requests for Production", direction: "sent", status: "responded", dueDate: "2026-01-30", title: "RFP Set 1 — Medical Records, Billing, Imaging" },
  { matter: "Rodriguez v. National General", type: "Interrogatories", direction: "received", status: "pending_response", dueDate: "2026-04-20", title: "Defendant's Interrogatories — Set 2" },
  { matter: "Rodriguez v. National General", type: "IMT Request", direction: "received", status: "pending_response", dueDate: "2026-04-15", title: "Independent Medical Examination — Dr. Whitmore" },
  { matter: "Thompson v. Westfield", type: "Subpoena", direction: "sent", status: "overdue", dueDate: "2026-03-01", title: "Subpoena for Surveillance Footage — Mall Security" },
  { matter: "Thompson v. Westfield", type: "Requests for Admission", direction: "sent", status: "served", dueDate: "2026-04-10", title: "RFA Set 1 — Maintenance Records, Prior Incidents" },
  { matter: "Meridian v. Atlantic Casualty", type: "Requests for Production", direction: "sent", status: "served", dueDate: "2026-05-01", title: "RFP Set 1 — Underwriting File, Claims File, Reserves" },
];

const STATUS_COLORS: Record<string, string> = {
  responded: "bg-[#4a90b8]/10 text-[#4a90b8]",
  pending_response: "bg-[#d4a054]/10 text-[#d4a054]",
  overdue: "bg-[#c45a4a]/10 text-[#c45a4a]",
  served: "bg-slate-500/10 text-slate-400",
  completed: "bg-[#4a90b8]/10 text-[#4a90b8]",
};

export default function DiscoveryPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Discovery Tracker</h1>
        <p className="text-xs text-slate-500 mt-0.5">All discovery items across active matters</p>
      </div>

      <div className="space-y-2">
        {DISCOVERY_ITEMS.map((item, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-4 flex items-center gap-4" style={{ background: "#0c1220" }}>
            <div className="w-8 h-8 rounded flex items-center justify-center bg-white/[0.04]">
              {item.direction === "sent" ? <ArrowRight className="w-3.5 h-3.5 text-[#d4a054]" /> : <ArrowLeft className="w-3.5 h-3.5 text-[#4a90b8]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-200">{item.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-500">{item.matter}</span>
                <span className="text-[10px] text-slate-600">·</span>
                <span className="text-[10px] text-slate-500">{item.type}</span>
                <span className="text-[10px] text-slate-600">·</span>
                <span className="text-[10px] text-slate-400">{item.direction}</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Due {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${STATUS_COLORS[item.status] || "bg-slate-500/10 text-slate-400"}`}>
              {item.status.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
