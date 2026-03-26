import { useRecommendations, useUpdateRecommendation } from "@/hooks/use-lyte";
import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Shield, Activity, DollarSign, Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryIcons = {
  cost_optimization: DollarSign,
  risk_mitigation: Shield,
  operational: Activity,
  compliance: Check,
  growth: TrendingUp,
};

const impactColors = {
  high: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  medium: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  low: "text-slate-400 bg-slate-800 border-slate-700",
};

export default function Recommendations() {
  const { data: recommendations, isLoading } = useRecommendations();
  const updateRec = useUpdateRecommendation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeRecs = recommendations?.filter(r => r.status === "suggested" || r.status === "in_progress") || [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-display font-bold text-white mb-2">AI Engine Recommendations</h2>
        <p className="text-slate-400">Actionable insights synthesized from across the SZL workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeRecs.map((rec, i) => {
          const Icon = categoryIcons[rec.category as keyof typeof categoryIcons] || Lightbulb;
          
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-glass rounded-2xl p-6 flex flex-col h-full border hover:border-cyan-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-24 bg-cyan-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
                  <Icon className="w-6 h-6" />
                </div>
                <div className={cn("px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border", impactColors[rec.impact as keyof typeof impactColors])}>
                  Impact: {rec.impact}
                </div>
              </div>
              
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-white/10 bg-white/5 text-slate-300">
                    {rec.category.replace('_', ' ')}
                  </span>
                  {rec.status === "in_progress" && (
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 animate-pulse">
                      In Progress
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 leading-tight">{rec.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{rec.description}</p>
              </div>

              <div className="pt-4 border-t border-white/5 mt-auto flex gap-2 relative z-10">
                {rec.status === "suggested" ? (
                  <>
                    <button 
                      onClick={() => updateRec.mutate({ id: rec.id, status: "in_progress" })}
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Accept
                    </button>
                    <button 
                      onClick={() => updateRec.mutate({ id: rec.id, status: "dismissed" })}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => updateRec.mutate({ id: rec.id, status: "completed" })}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-medium py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Mark Completed <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
