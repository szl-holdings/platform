import { Shell } from "@/components/layout/shell";
import { useRisks, useUpdateRiskStatus } from "@/hooks/use-readiness";
import { Loader2, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@workspace/shared-ui/utils";
import { format } from "date-fns";
import { CommentThread, ActivityFeed } from "@workspace/shared-ui/collaboration";

const SeverityColors = {
  critical: "text-destructive bg-destructive/10 border-destructive/20",
  high: "text-warning bg-warning/10 border-warning/20",
  medium: "text-primary bg-primary/10 border-primary/20",
  low: "text-muted-foreground bg-white/5 border-white/10",
};

const SeverityIcon = {
  critical: ShieldAlert,
  high: AlertTriangle,
  medium: Info,
  low: Info,
};

export default function Risks() {
  const { data: risks, isLoading } = useRisks();
  const { mutate: updateStatus } = useUpdateRiskStatus();

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
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display font-bold text-white tracking-tight">Risk Register</h1>
            <p className="text-muted-foreground mt-2 text-lg">Active threats to organizational readiness with enterprise risk management mitigation strategies.</p>
          </div>
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-semibold transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Log Risk
          </button>
        </header>

        <div className="grid gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ActivityFeed entityType="risk" title="Risk Register Activity" limit={6} compact />
            <CommentThread entityType="risk" entityId="general" title="Risk Discussion" />
          </div>

          {risks?.map((risk, i) => {
            const Icon = SeverityIcon[risk.severity];
            const isResolved = risk.status === 'resolved' || risk.status === 'accepted';
            
            return (
              <motion.div 
                key={risk.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "glass-panel rounded-2xl p-6 transition-all border-l-4",
                  isResolved ? "opacity-60 border-l-success grayscale-[0.5]" : 
                  risk.severity === 'critical' ? "border-l-destructive shadow-destructive/5" :
                  risk.severity === 'high' ? "border-l-warning" : "border-l-primary"
                )}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border", SeverityColors[risk.severity])}>
                        <Icon className="w-3 h-3" /> {risk.severity}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-white/5 rounded-md border border-white/5 uppercase tracking-wider">
                        Likelihood: {risk.likelihood.replace('_', ' ')}
                      </span>
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider",
                        isResolved ? "text-success bg-success/10" : "text-white bg-white/10"
                      )}>
                        {risk.status}
                      </span>
                    </div>
                    
                    <h3 className={cn("text-xl font-bold font-display mb-2", isResolved ? "text-white/70 line-through decoration-white/30" : "text-white")}>
                      {risk.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed max-w-3xl">
                      {risk.description}
                    </p>
                    
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        Mitigation Strategy
                      </div>
                      <p className="text-sm text-white/90">{risk.mitigation}</p>
                    </div>
                  </div>
                  
                  <div className="w-full lg:w-48 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6">
                    <div className="space-y-3 mb-4 lg:mb-0">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Owner</div>
                        <div className="text-sm font-medium text-white">{risk.owner}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Logged</div>
                        <div className="text-sm font-medium text-white">{format(new Date(risk.createdAt), 'MMM d, yyyy')}</div>
                      </div>
                    </div>
                    
                    {!isResolved && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateStatus({ id: risk.id, status: 'resolved' })}
                          className="flex-1 bg-success/20 hover:bg-success/30 text-success py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 border-t border-white/5 pt-4">
                  <CommentThread entityType="risk" entityId={String(risk.id)} title="Discussion" defaultCollapsed={true} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
