import { useIncidents, useCreateIncident, useUpdateIncident } from "@/hooks/use-lyte";
import { formatDistanceToNow } from "date-fns";
import { Plus, Search, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";

const severityColors = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const statusOrder = ["open", "investigating", "mitigating", "resolved", "closed"];

export default function Incidents() {
  const { data: incidents, isLoading } = useIncidents();
  const createMutation = useCreateIncident();
  const updateMutation = useUpdateIncident();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = incidents?.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    i.assignee?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    createMutation.mutate({
      title: "New Automated Incident",
      description: "Generated placeholder incident.",
      severity: "medium",
      assignee: "Unassigned",
    });
  };

  const advanceStatus = (id: number, currentStatus: string) => {
    const idx = statusOrder.indexOf(currentStatus);
    if (idx < statusOrder.length - 1) {
      updateMutation.mutate({ id, status: statusOrder[idx + 1] });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Incident Tracker</h2>
          <p className="text-slate-400">Track and manage operational issues to resolution.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-card/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
          </div>
          <button 
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      <div className="bg-glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/5 uppercase tracking-wider text-[10px] font-semibold text-slate-400">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Incident</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered?.map((inc, i) => (
                <motion.tr 
                  key={inc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4 text-slate-500 font-mono">#{inc.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white max-w-xs truncate">{inc.title}</div>
                    <div className="text-xs text-slate-500 max-w-xs truncate mt-0.5">{inc.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border", severityColors[inc.severity as keyof typeof severityColors])}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {inc.status === 'resolved' || inc.status === 'closed' ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      )}
                      <span className="text-slate-300 capitalize">{inc.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-white/10">
                        {inc.assignee?.[0] || "?"}
                      </div>
                      <span className="text-slate-400">{inc.assignee}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4">
                    {inc.status !== 'closed' && (
                      <button
                        onClick={() => advanceStatus(inc.id, inc.status)}
                        className="text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 px-3 py-1.5 rounded-lg transition-colors border border-cyan-400/20"
                      >
                        Advance Workflow
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered?.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No incidents found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
