import { matterTwins, obligationTwins } from "../data/counsel-twin";
import { Briefcase, Clock, ShieldAlert, Scale } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

export default function Dashboard() {
  const activeMatters = matterTwins.filter(m => m.status !== "completed").length;
  const atRiskMatters = matterTwins.filter(m => m.status === "at_risk").length;
  const totalExposure = matterTwins.reduce((acc, m) => acc + m.exposureUsd, 0);
  const overdueObligations = obligationTwins.filter(o => o.status === "overdue").length;

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-violet-100">Legal Matter Command</h1>
        <p className="text-violet-400/60 text-sm">Real-time legal obligation and risk monitoring.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-medium text-violet-300/70 uppercase">Active Matters</span>
          </div>
          <div className="text-3xl font-bold text-violet-50">{activeMatters}</div>
          <div className="text-[10px] text-violet-400/50 mt-1">{atRiskMatters} currently at risk</div>
        </div>

        <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-medium text-violet-300/70 uppercase">Overdue Obligations</span>
          </div>
          <div className="text-3xl font-bold text-violet-50">{overdueObligations}</div>
          <div className="text-[10px] text-violet-400/50 mt-1">Requiring immediate escalation</div>
        </div>

        <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-medium text-violet-300/70 uppercase">Total Exposure</span>
          </div>
          <div className="text-3xl font-bold text-violet-50">${(totalExposure / 1000000).toFixed(1)}M</div>
          <div className="text-[10px] text-violet-400/50 mt-1">Across all active matters</div>
        </div>

        <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-medium text-violet-300/70 uppercase">Lead Counsel</span>
          </div>
          <div className="text-3xl font-bold text-violet-50">3</div>
          <div className="text-[10px] text-violet-400/50 mt-1">External firms engaged</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-violet-100 mb-4">Urgent Matters</h3>
          <div className="space-y-3">
            {matterTwins.filter(m => m.status === "at_risk").map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <div>
                  <div className="text-xs font-medium text-violet-200">{m.name}</div>
                  <div className="text-[10px] text-violet-400/60 mt-0.5">Deadline: {new Date(m.deadline).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-red-400">${(m.exposureUsd / 1000000).toFixed(1)}M Exposure</div>
                  <div className="text-[10px] text-violet-400/50">{m.leadCounsel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-violet-100 mb-4">Critical Dependencies</h3>
          <div className="space-y-3">
             {obligationTwins.filter(o => o.status === "overdue" || o.status === "blocked").map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <div>
                  <div className="text-xs font-medium text-violet-200">{o.title}</div>
                  <div className="text-[10px] text-violet-400/60 mt-0.5">{o.status.toUpperCase()} — {o.assignedTo}</div>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                  o.status === "overdue" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                )}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
