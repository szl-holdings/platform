import { Shell } from "@/components/layout/shell";
import { useAlerts, useMarkAlertRead } from "@/hooks/use-readiness";
import { Loader2, BellRing, TrendingDown, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const TypeIcon = {
  score_drop: TrendingDown,
  milestone_overdue: Clock,
  risk_escalation: ShieldAlert,
  target_missed: ShieldAlert,
  improvement: CheckCircle2,
  general: BellRing
};

export default function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const { mutate: markRead } = useMarkAlertRead();

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
      <div className="p-8 pb-20 space-y-8 max-w-4xl mx-auto">
        <header className="flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-white tracking-tight">Compliance & Readiness Alerts</h1>
            <p className="text-muted-foreground mt-2">Framework compliance notifications, threshold breaches, and readiness degradation events.</p>
          </div>
          <div className="bg-card px-4 py-2 rounded-lg border border-white/5 text-sm font-medium">
            <span className="text-primary font-bold mr-2">{alerts?.filter(a => !a.isRead).length}</span> 
            Unread
          </div>
        </header>

        <div className="space-y-3">
          {alerts?.map((alert, i) => {
            const Icon = TypeIcon[alert.type] || BellRing;
            
            return (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "p-4 rounded-2xl flex gap-4 transition-all duration-300 relative overflow-hidden group",
                  !alert.isRead ? "bg-card border border-white/10 shadow-lg" : "bg-transparent border border-transparent hover:bg-white/5 opacity-70"
                )}
              >
                {!alert.isRead && (
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    alert.severity === 'critical' ? "bg-destructive" :
                    alert.severity === 'warning' ? "bg-warning" : "bg-primary"
                  )} />
                )}
                
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  !alert.isRead ? "bg-white/5" : "bg-transparent"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    alert.severity === 'critical' ? "text-destructive" :
                    alert.severity === 'warning' ? "text-warning" : "text-primary"
                  )} />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={cn("font-bold font-display", !alert.isRead ? "text-white" : "text-white/70")}>
                      {alert.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={cn("text-sm", !alert.isRead ? "text-muted-foreground" : "text-muted-foreground/60")}>
                    {alert.message}
                  </p>
                </div>
                
                {!alert.isRead && (
                  <button 
                    onClick={() => markRead(alert.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
