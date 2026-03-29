import { useRecommendations, useUpdateRecommendation } from "@/hooks/use-lyte";
import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Shield, Activity, DollarSign, Check, X, ArrowRight, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryIcons = {
  cost_optimization: DollarSign,
  risk_mitigation: Shield,
  operational: Activity,
  compliance: Check,
  growth: TrendingUp,
};

const categoryGradients: Record<string, string> = {
  cost_optimization: "from-emerald-500/10 to-transparent",
  risk_mitigation: "from-red-500/10 to-transparent",
  operational: "from-blue-500/10 to-transparent",
  compliance: "from-purple-500/10 to-transparent",
  growth: "from-amber-500/10 to-transparent",
};

const impactColors = {
  high: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  medium: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  low: "text-slate-400 bg-slate-800 border-slate-700",
};


const impactBarColors: Record<string, string> = {
  high: "bg-purple-500",
  medium: "bg-blue-500",
  low: "bg-slate-500",
};

export default function Recommendations() {
  const { data: recommendations, isLoading } = useRecommendations();
  const updateRec = useUpdateRecommendation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-sm text-slate-500 animate-pulse">Synthesizing recommendations...</span>
        </div>
      </div>
    );
  }

  const activeRecs = recommendations?.filter(r => r.status === "suggested" || r.status === "in_progress") || [];
  const highImpact = activeRecs.filter(r => r.impact === "high").length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 flex items-end justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-3xl font-display font-bold text-white mb-2">AI Engine Recommendations</h2>
          <p className="text-slate-400">Cost optimization, compliance, and reliability insights based on infrastructure telemetry analysis.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          {highImpact > 0 && (
            <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-400/10 px-3 py-1.5 rounded-full border border-purple-400/20">
              <Sparkles className="w-3 h-3" />
              {highImpact} high-impact
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full border border-cyan-400/20">
            <Zap className="w-3 h-3" />
            {activeRecs.length} active
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeRecs.map((rec, i) => {
          const Icon = categoryIcons[rec.category as keyof typeof categoryIcons] || Lightbulb;
          const gradient = categoryGradients[rec.category as keyof typeof categoryGradients] || "from-cyan-500/10 to-transparent";
          
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
              className="bg-glass rounded-2xl p-6 flex flex-col h-full border hover:border-cyan-500/30 transition-all group relative overflow-hidden"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-b pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity", gradient)} />
              <div className="absolute top-0 right-0 p-24 bg-cyan-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div className={cn("px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border", impactColors[rec.impact as keyof typeof impactColors])}>
                  {rec.impact}
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
                <h3 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-cyan-50 transition-colors">{rec.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{rec.description}</p>

                {(rec as any).savings && (
                  <div className="flex items-center gap-2 mb-3 text-xs text-emerald-400 bg-emerald-400/5 px-3 py-1.5 rounded-lg border border-emerald-400/10">
                    <DollarSign className="w-3 h-3" />
                    <span className="font-semibold">{(rec as any).savings}</span>
                    <span className="text-slate-500">estimated savings</span>
                  </div>
                )}
                {(rec as any).compliance && (
                  <div className="flex items-center gap-2 mb-3 text-xs text-violet-400 bg-violet-400/5 px-3 py-1.5 rounded-lg border border-violet-400/10">
                    <Shield className="w-3 h-3" />
                    <span className="font-medium">{(rec as any).compliance}</span>
                  </div>
                )}

                <div className="mb-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                    <span>Impact Level</span>
                    <span>{rec.impact}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: rec.impact === 'high' ? '100%' : rec.impact === 'medium' ? '66%' : '33%' }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                      className={cn("h-full rounded-full", impactBarColors[rec.impact as keyof typeof impactBarColors])}
                    />
                  </div>
                </div>
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
