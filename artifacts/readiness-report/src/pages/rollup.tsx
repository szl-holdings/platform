import { Shell } from "@/components/layout/shell";
import { usePrograms, useRisks, useMilestones, useDimensions } from "@/hooks/use-readiness";
import { Loader2, Briefcase, ShieldAlert, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

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
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  const criticalCount = risks?.filter(r => r.severity === 'critical' && r.status !== 'resolved').length || 0;
  const overdueCount = milestones?.filter(m => m.status === 'overdue').length || 0;
  const avgScore = dimensions ? dimensions.reduce((acc, d) => acc + d.currentScore, 0) / dimensions.length : 0;

  return (
    <Shell>
      <div className="p-8 pb-20 space-y-8">
        <header className="border-b border-white/10 pb-6">
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Executive Rollup</h1>
          <p className="text-muted-foreground mt-2 text-lg">High-level summary for leadership review.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Active Programs" value={programs?.length || 0} icon={Briefcase} delay={0.1} />
          <StatCard title="Avg Dimension Score" value={avgScore.toFixed(1)} icon={TrendingUp} delay={0.2} color="text-primary" />
          <StatCard title="Critical Risks" value={criticalCount} icon={ShieldAlert} delay={0.3} color="text-destructive" />
          <StatCard title="Overdue Milestones" value={overdueCount} icon={Clock} delay={0.4} color="text-warning" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-8 rounded-3xl">
            <h3 className="text-2xl font-display font-bold text-white mb-4">Strategic Assessment</h3>
            <div className="prose prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed">
              <p>The overall portfolio is currently tracking at an acceptable readiness level, though significant variance exists between dimensions. Security and Compliance remain strong pillars with scores above 90.</p>
              <p>However, <strong>Team Competency</strong> and <strong>Operational Readiness</strong> require immediate leadership attention. Key staff attrition has introduced a critical risk that endangers upcoming Phase 2 milestones if not mitigated swiftly.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-panel p-8 rounded-3xl bg-primary/5 border-primary/20">
            <h3 className="text-2xl font-display font-bold text-white mb-4 text-primary">Required Actions</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">1</div>
                <p className="text-white/80 text-sm leading-relaxed">Approve emergency budget for external contractors to backfill departing cloud architects (Risk: R_1).</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">2</div>
                <p className="text-white/80 text-sm leading-relaxed">Escalate vendor SLA dispute regarding the monitoring tool deployment delay to VP level.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">3</div>
                <p className="text-white/80 text-sm leading-relaxed">Reschedule overdue User Training Seminars to unblock final system handover.</p>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}

function StatCard({ title, value, icon: Icon, delay, color = "text-white" }: { title: string, value: string | number, icon: any, delay: number, color?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-panel rounded-2xl p-6 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
        <Icon className={`w-5 h-5 opacity-50 ${color}`} />
      </div>
      <div className={`text-4xl font-display font-bold ${color}`}>{value}</div>
    </motion.div>
  );
}
