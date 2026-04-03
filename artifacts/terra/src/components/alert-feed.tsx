import { cn } from "@szl-holdings/shared-ui/utils";
import { motion } from "framer-motion";
import { AlertTriangle, Home, Calendar, Wrench, CreditCard, TrendingDown, Check } from "lucide-react";
import { alerts } from "@/data/portfolio";
import { useState } from "react";

const typeConfig: Record<string, { icon: typeof AlertTriangle; label: string; color: string }> = {
  vacancy: { icon: Home, label: "Vacancy", color: "text-terra-rose" },
  "lease-expiry": { icon: Calendar, label: "Lease Expiry", color: "text-terra-amber" },
  maintenance: { icon: Wrench, label: "Maintenance", color: "text-terra-accent" },
  payment: { icon: CreditCard, label: "Payment", color: "text-terra-rose" },
  market: { icon: TrendingDown, label: "Market", color: "text-terra-violet" },
};

const severityColors: Record<string, string> = {
  high: "border-l-terra-rose",
  medium: "border-l-terra-amber",
  low: "border-l-terra-text-muted",
};

function formatTimeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AlertFeed({ limit }: { limit?: number }) {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(
    new Set(alerts.filter(a => a.acknowledged).map(a => a.id))
  );

  const sortedAlerts = [...alerts].sort((a, b) => {
    const aAck = acknowledged.has(a.id);
    const bAck = acknowledged.has(b.id);
    if (aAck !== bAck) return aAck ? 1 : -1;
    const sevOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3);
  });

  const displayAlerts = limit ? sortedAlerts.slice(0, limit) : sortedAlerts;
  const unacknowledgedCount = sortedAlerts.filter(a => !acknowledged.has(a.id)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-terra-amber" />
          <h3 className="font-display font-bold text-terra-text">Risk & Alert Feed</h3>
          {unacknowledgedCount > 0 && (
            <span className="bg-terra-rose/10 text-terra-rose text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unacknowledgedCount} new
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {displayAlerts.map((alert, i) => {
          const config = typeConfig[alert.type];
          const Icon = config.icon;
          const isAck = acknowledged.has(alert.id);

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "p-3 rounded-lg border border-terra-border bg-terra-surface/50 border-l-2 transition-all duration-200",
                severityColors[alert.severity],
                isAck && "opacity-50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 flex-shrink-0", config.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-terra-text">{alert.propertyName}</span>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                      alert.severity === "high" && "bg-terra-rose/10 text-terra-rose",
                      alert.severity === "medium" && "bg-terra-amber/10 text-terra-amber",
                      alert.severity === "low" && "bg-terra-text-muted/10 text-terra-text-muted",
                    )}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-terra-text-secondary leading-relaxed">{alert.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-terra-text-muted">{formatTimeAgo(alert.timestamp)}</span>
                    {!isAck && (
                      <button
                        onClick={() => setAcknowledged(prev => new Set([...prev, alert.id]))}
                        className="flex items-center gap-1 text-[10px] text-terra-text-muted hover:text-terra-primary transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Acknowledge
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
  );
}
