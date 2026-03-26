import { useSignals, useUpdateSignal } from "@/hooks/use-lyte";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Info, Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const severityColors = {
  critical: "text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
  high: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  info: "text-slate-300 bg-slate-800 border-slate-700",
};

const statusColors = {
  new: "text-cyan-400 bg-cyan-400/10",
  acknowledged: "text-blue-400 bg-blue-400/10",
  resolved: "text-emerald-400 bg-emerald-400/10",
  dismissed: "text-slate-400 bg-slate-800",
};

export default function Signals() {
  const { data: signals, isLoading } = useSignals();
  const updateSignal = useUpdateSignal();
  const [filter, setFilter] = useState("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filteredSignals = signals?.filter(s => filter === "all" || s.status === filter) || [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Signal Ingestion</h2>
          <p className="text-slate-400">Real-time normalized events across infrastructure.</p>
        </div>
        <div className="flex bg-card/60 backdrop-blur-md p-1 rounded-xl border border-white/5 shadow-xl">
          {["all", "new", "acknowledged", "resolved"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                filter === f ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredSignals.map((signal, i) => (
            <motion.div
              key={signal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="bg-glass rounded-xl p-5 group flex flex-col md:flex-row gap-4 md:items-center justify-between hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={cn("p-2.5 rounded-xl border shrink-0 mt-1", severityColors[signal.severity as keyof typeof severityColors])}>
                  {signal.severity === 'critical' ? <AlertCircle className="w-5 h-5" /> : 
                   signal.severity === 'info' ? <Info className="w-5 h-5" /> : 
                   <Activity className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md", statusColors[signal.status as keyof typeof statusColors])}>
                      {signal.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                      {signal.source}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(signal.receivedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">{signal.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                {signal.status === "new" && (
                  <button 
                    onClick={() => updateSignal.mutate({ id: signal.id, status: "acknowledged" })}
                    className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Ack
                  </button>
                )}
                {["new", "acknowledged"].includes(signal.status) && (
                  <button 
                    onClick={() => updateSignal.mutate({ id: signal.id, status: "resolved" })}
                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Resolve
                  </button>
                )}
                {signal.status !== "dismissed" && signal.status !== "resolved" && (
                  <button 
                    onClick={() => updateSignal.mutate({ id: signal.id, status: "dismissed" })}
                    className="p-1.5 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors"
                    title="Dismiss"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {filteredSignals.length === 0 && (
            <div className="text-center py-24 text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No signals found matching this criteria.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
