import { Shell } from "@/components/layout/shell";
import { usePrograms, useRisks, useMilestones, useDimensions } from "@/hooks/use-readiness";
import { Loader2, Briefcase, ShieldAlert, Clock, TrendingUp, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef, type ComponentType } from "react";

function useAnimatedCounter(target: number, duration = 1200, decimals = 0) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = eased * target;
      setCount(decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.round(value));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration, decimals]);

  return count;
}

export default function Rollup() {
  const { data: programs, isLoading: pLoading } = usePrograms();
  const { data: risks, isLoading: rLoading } = useRisks();
  const { data: milestones, isLoading: mLoading } = useMilestones();
  const { data: dimensions, isLoading: dLoading } = useDimensions();

  const isLoading = pLoading || rLoading || mLoading || dLoading;

  if (isLoading) {
    return (
      <Shell>
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground animate-pulse">Preparing executive summary...</span>
          </div>
        </div>
      </Shell>
    );
  }

  const criticalCount = risks?.filter(r => r.severity === 'critical' && r.status !== 'resolved').length || 0;
  const overdueCount = milestones?.filter(m => m.status === 'overdue').length || 0;
  const completedCount = milestones?.filter(m => m.status === 'completed').length || 0;
  const totalMilestones = milestones?.length ?? 0;
  const avgScore = dimensions ? dimensions.reduce((acc, d) => acc + d.currentScore, 0) / dimensions.length : 0;

  return (
    <Shell>
      <div className="p-8 pb-20 space-y-8">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/10 pb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-primary rounded-full" />
            <h1 className="text-4xl font-display font-bold text-white tracking-tight">Executive Rollup</h1>
          </div>
          <p className="text-muted-foreground mt-2 text-lg ml-4">High-level summary for leadership review.</p>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <RollupStatCard title="Active Programs" value={programs?.length || 0} icon={Briefcase} delay={0.1} />
          <RollupStatCard title="Avg Dimension Score" value={parseFloat(avgScore.toFixed(1))} icon={TrendingUp} delay={0.2} color="text-primary" decimals={1} />
          <RollupStatCard title="Critical Risks" value={criticalCount} icon={ShieldAlert} delay={0.3} color="text-destructive" />
          <RollupStatCard title="Overdue Milestones" value={overdueCount} icon={Clock} delay={0.4} color="text-warning" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-panel rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Milestone Completion</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalMilestones > 0 ? (completedCount / totalMilestones) * 100 : 0}%` }}
                  transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                  className="h-full bg-success rounded-full"
                />
                {overdueCount > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalMilestones > 0 ? (overdueCount / totalMilestones) * 100 : 0}%` }}
                    transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-destructive rounded-full ml-0.5"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium shrink-0">
              <span className="flex items-center gap-1.5 text-success"><CheckCircle2 className="w-3.5 h-3.5" />{completedCount} done</span>
              {overdueCount > 0 && <span className="flex items-center gap-1.5 text-destructive"><AlertTriangle className="w-3.5 h-3.5" />{overdueCount} overdue</span>}
              <span className="text-muted-foreground">{totalMilestones} total</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-panel p-8 rounded-3xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
            <h3 className="text-2xl font-display font-bold text-white mb-6">Strategic Assessment</h3>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">The overall portfolio is currently tracking at an acceptable readiness level, though significant variance exists between dimensions. Security and Compliance remain strong pillars with scores above 90.</p>
              <p className="text-muted-foreground leading-relaxed">However, <strong className="text-white">Team Competency</strong> and <strong className="text-white">Operational Readiness</strong> require immediate leadership attention. Key staff attrition has introduced a critical risk that endangers upcoming Phase 2 milestones if not mitigated swiftly.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-panel p-8 rounded-3xl bg-primary/5 border-primary/20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
            <h3 className="text-2xl font-display font-bold text-primary mb-6 flex items-center gap-2">
              <ArrowUpRight className="w-6 h-6" />
              Required Actions
            </h3>
            <ul className="space-y-5">
              {[
                "Approve emergency budget for external contractors to backfill departing cloud architects (Risk: R_1).",
                "Escalate vendor SLA dispute regarding the monitoring tool deployment delay to VP level.",
                "Reschedule overdue User Training Seminars to unblock final system handover.",
              ].map((text, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-white/80 text-sm leading-relaxed">{text}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}

function RollupStatCard({ title, value, icon: Icon, delay, color = "text-white", decimals = 0 }: { title: string; value: number; icon: ComponentType<{ className?: string }>; delay: number; color?: string; decimals?: number }) {
  const animatedValue = useAnimatedCounter(value, 1200, decimals);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all"
    >
      <div className="flex justify-between items-start mb-6">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
        <Icon className={`w-5 h-5 opacity-50 ${color}`} />
      </div>
      <div className={`text-4xl font-display font-bold ${color}`}>{decimals > 0 ? animatedValue.toFixed(decimals) : animatedValue}</div>
    </motion.div>
  );
}
