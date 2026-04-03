import { motion } from "framer-motion";
import { AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { AlertFeed } from "@/components/alert-feed";
import { alerts } from "@/data/portfolio";

export default function AlertsPage() {
  const highCount = alerts.filter(a => a.severity === "high").length;
  const mediumCount = alerts.filter(a => a.severity === "medium").length;
  const lowCount = alerts.filter(a => a.severity === "low").length;
  const unackCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-terra-text">Risk & Alert Center</h1>
        <p className="text-sm text-terra-text-secondary mt-1">Properties requiring attention — vacancies, lease expirations, maintenance, and payment issues</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-terra-border bg-terra-surface/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-terra-rose/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-terra-rose" />
          </div>
          <div>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">High Severity</p>
            <p className="text-2xl font-display font-bold text-terra-rose">{highCount}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-xl border border-terra-border bg-terra-surface/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-terra-amber/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-terra-amber" />
          </div>
          <div>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">Medium</p>
            <p className="text-2xl font-display font-bold text-terra-amber">{mediumCount}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-xl border border-terra-border bg-terra-surface/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-terra-text-muted/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-terra-text-muted" />
          </div>
          <div>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">Low</p>
            <p className="text-2xl font-display font-bold text-terra-text-muted">{lowCount}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 rounded-xl border border-terra-border bg-terra-surface/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-terra-primary/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-terra-primary" />
          </div>
          <div>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">Unacknowledged</p>
            <p className="text-2xl font-display font-bold text-terra-primary">{unackCount}</p>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
        <AlertFeed />
      </motion.div>
    </div>
  );
}
