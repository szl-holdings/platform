import { useIncidents, useCreateIncident, useUpdateIncident } from "@/hooks/use-lyte";
import { formatDistanceToNow } from "date-fns";
import { Plus, Search, AlertTriangle, ShieldCheck, ChevronRight, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const severityColors = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const severityGlows = {
  critical: "shadow-[0_0_20px_rgba(239,68,68,0.1)]",
  high: "shadow-[0_0_15px_rgba(249,115,22,0.08)]",
  medium: "",
  low: "",
};

const statusOrder = ["open", "investigating", "mitigating", "resolved", "closed"];

const statusStepColors: Record<string, string> = {
  open: "bg-red-500",
  investigating: "bg-orange-500",
  mitigating: "bg-yellow-500",
  resolved: "bg-emerald-500",
  closed: "bg-slate-500",
};

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = statusOrder.indexOf(currentStatus);
  return (
    <div className="flex items-center gap-0.5">
      {statusOrder.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className={cn(
            "w-2 h-2 rounded-full transition-all",
            i <= currentIdx ? statusStepColors[step] : "bg-slate-700",
            i === currentIdx && "ring-2 ring-offset-1 ring-offset-transparent w-2.5 h-2.5",
            i === currentIdx && step === 'open' && "ring-red-500/50",
            i === currentIdx && step === 'investigating' && "ring-orange-500/50",
            i === currentIdx && step === 'mitigating' && "ring-yellow-500/50",
            i === currentIdx && step === 'resolved' && "ring-emerald-500/50",
            i === currentIdx && step === 'closed' && "ring-slate-500/50",
          )} />
          {i < statusOrder.length - 1 && (
            <div className={cn(
              "w-3 h-[2px] mx-0.5",
              i < currentIdx ? "bg-white/20" : "bg-slate-800"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Incidents() {
  const { data: incidents, isLoading } = useIncidents();
  const createMutation = useCreateIncident();
  const updateMutation = useUpdateIncident();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-sm text-slate-500 animate-pulse">Loading incident data...</span>
        </div>
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

  const openCount = filtered?.filter(i => !['resolved', 'closed'].includes(i.status)).length || 0;
  const criticalCount = filtered?.filter(i => i.severity === 'critical' && !['resolved', 'closed'].includes(i.status)).length || 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Incident Tracker</h2>
          <p className="text-slate-400">Track and manage operational issues to resolution.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 w-full md:w-auto items-center">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">{openCount} open</span>
            {criticalCount > 0 && (
              <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20 font-medium">
                {criticalCount} critical
              </span>
            )}
          </div>
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
        </motion.div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filtered?.map((inc, i) => {
            const isActive = !['resolved', 'closed'].includes(inc.status);
            return (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "bg-glass rounded-xl p-5 transition-all cursor-pointer hover:border-white/10 relative overflow-hidden group",
                  isActive && severityGlows[inc.severity as keyof typeof severityGlows]
                )}
                onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)}
              >
                {inc.severity === 'critical' && isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                )}
                {inc.severity === 'high' && isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
                )}

                <div className="flex items-center gap-6 relative z-10">
                  <span className="text-slate-600 font-mono text-sm w-12">#{inc.id}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border", severityColors[inc.severity as keyof typeof severityColors])}>
                        {inc.severity}
                      </span>
                      <h3 className="font-semibold text-white truncate">{inc.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-lg">{inc.description}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <StatusTimeline currentStatus={inc.status} />

                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-white/10">
                        {inc.assignee?.[0] || "?"}
                      </div>
                      <span className="text-xs hidden lg:block">{inc.assignee}</span>
                    </div>

                    <span className="text-xs text-slate-500 hidden lg:block">
                      {formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}
                    </span>

                    {inc.status !== 'closed' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); advanceStatus(inc.id, inc.status); }}
                        className="text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 px-3 py-1.5 rounded-lg transition-colors border border-cyan-400/20 flex items-center gap-1"
                      >
                        Advance <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === inc.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Status</span>
                          <div className="text-white capitalize mt-1 flex items-center gap-2">
                            {isActive ? (
                              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                            ) : (
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            )}
                            {inc.status}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Assignee</span>
                          <div className="text-white mt-1 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {inc.assignee}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Created</span>
                          <div className="text-white mt-1 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Severity</span>
                          <div className="mt-1">
                            <span className={cn("px-2 py-0.5 rounded-md text-xs font-bold uppercase border", severityColors[inc.severity as keyof typeof severityColors])}>
                              {inc.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-slate-500"
          >
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No incidents found.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
