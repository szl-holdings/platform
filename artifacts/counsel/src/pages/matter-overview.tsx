import { matterTwins } from "../data/counsel-twin";
import { Briefcase, Scale, DollarSign, ShieldAlert, Clock } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

export default function MatterOverview() {
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-violet-100">Matter Overview</h1>
          <p className="text-violet-400/60 text-sm">Portfolio-wide legal matter tracking.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
          { label: "Total Matters", value: matterTwins.length, icon: Briefcase },
          { label: "In Litigation", value: matterTwins.filter(m => m.type.includes("Litigation")).length, icon: Scale },
          { label: "M&A Active", value: matterTwins.filter(m => m.type === "M&A").length, icon: DollarSign },
          { label: "Avg Exposure", value: `$${(matterTwins.reduce((acc, m) => acc + m.exposureUsd, 0) / matterTwins.length / 1000000).toFixed(1)}M`, icon: ShieldAlert },
        ].map((stat, i) => (
          <div key={i} className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="w-3.5 h-3.5 text-violet-400/60" />
              <span className="text-[10px] font-medium text-violet-300/50 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-violet-100">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-violet-500/10 bg-violet-500/5">
              <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider">Matter Name</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider">Deadline</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider">Lead Counsel</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider text-right">Exposure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-violet-500/5">
            {matterTwins.map(m => (
              <tr key={m.id} className="hover:bg-violet-500/5 transition-colors group">
                <td className="px-4 py-4">
                  <div className="text-xs font-medium text-violet-100">{m.name}</div>
                  <div className="text-[10px] text-violet-400/50 mt-0.5 truncate max-w-[200px]">{m.description}</div>
                </td>
                <td className="px-4 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                    m.status === "at_risk" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                    m.status === "active" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                  )}>
                    {m.status.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-violet-300/70">{m.type}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-violet-300/70">
                    <Clock className="w-3 h-3" />
                    {new Date(m.deadline).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-violet-300/70">{m.leadCounsel}</td>
                <td className="px-4 py-4 text-right text-xs font-bold text-violet-100">
                  ${(m.exposureUsd / 1000000).toFixed(1)}M
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
