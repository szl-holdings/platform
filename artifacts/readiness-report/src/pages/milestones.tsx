import { Shell } from "@/components/layout/shell";
import { useMilestones, useUpdateMilestoneStatus } from "@/hooks/use-readiness";
import { Loader2, Calendar, User, Clock, CheckCircle2, AlertCircle, PlayCircle, XCircle } from "lucide-react";
import { format, isPast } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@workspace/shared-ui/utils";

const StatusIcon = {
  pending: Clock,
  in_progress: PlayCircle,
  completed: CheckCircle2,
  overdue: AlertCircle,
  canceled: XCircle,
};

const StatusColor = {
  pending: "text-muted-foreground",
  in_progress: "text-primary",
  completed: "text-success",
  overdue: "text-destructive",
  canceled: "text-muted-foreground opacity-50",
};

export default function Milestones() {
  const { data: milestones, isLoading } = useMilestones();
  const { mutate: updateStatus } = useUpdateMilestoneStatus();

  if (isLoading) {
    return (
      <Shell>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-8 pb-20 space-y-8">
        <header>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Program Milestones</h1>
          <p className="text-muted-foreground mt-2 text-lg">Transformation program delivery timeline aligned with NIST CSF implementation tiers.</p>
        </header>

        <div className="glass-panel rounded-3xl p-2 md:p-6 overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-[31px] md:left-[55px] w-[2px] bg-white/5 z-0" />
          
          <div className="space-y-6 relative z-10">
            {milestones?.map((milestone, i) => {
              const Icon = StatusIcon[milestone.status];
              const isLate = milestone.status !== 'completed' && isPast(new Date(milestone.dueDate));
              
              return (
                <motion.div 
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 md:gap-6 relative group"
                >
                  <div className="mt-1 flex-shrink-0 relative">
                    <div className="w-12 h-12 rounded-full bg-card border border-white/10 flex items-center justify-center shadow-lg group-hover:border-white/20 transition-colors">
                      <Icon className={cn("w-5 h-5", StatusColor[milestone.status])} />
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-card/40 hover:bg-card/80 border border-white/5 hover:border-white/10 p-5 rounded-2xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white font-display mb-1">{milestone.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{milestone.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border",
                          milestone.status === 'completed' ? "bg-success/10 text-success border-success/20" :
                          milestone.status === 'in_progress' ? "bg-primary/10 text-primary border-primary/20" :
                          milestone.status === 'overdue' ? "bg-destructive/10 text-destructive border-destructive/20" :
                          "bg-white/5 text-muted-foreground border-white/10"
                        )}>
                          {milestone.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4 text-white/40" />
                        <span className="font-medium text-white/80">{milestone.owner}</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 font-medium",
                        isLate ? "text-destructive" : "text-muted-foreground"
                      )}>
                        <Calendar className="w-4 h-4 opacity-50" />
                        {format(new Date(milestone.dueDate), 'MMMM d, yyyy')}
                        {isLate && <span className="text-xs bg-destructive/20 px-1.5 rounded text-destructive ml-1">LATE</span>}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {milestone.status !== 'completed' && (
                          <button 
                            onClick={() => updateStatus({ id: milestone.id, status: 'completed' })}
                            className="text-xs bg-success/20 hover:bg-success/30 text-success px-3 py-1.5 rounded-lg transition-colors font-semibold"
                          >
                            Mark Complete
                          </button>
                        )}
                        {milestone.status === 'pending' && (
                          <button 
                            onClick={() => updateStatus({ id: milestone.id, status: 'in_progress' })}
                            className="text-xs bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1.5 rounded-lg transition-colors font-semibold"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Shell>
  );
}
