import { motion } from "framer-motion";
import { useState } from "react";
import { ClipboardList, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { transactions, type Transaction, type TransactionStep } from "@/data/brokerage";
import { formatCurrency, WorkflowTraceView, AuditPanel } from "@/components/brokerage-ui";
import { cn } from "@szl-holdings/shared-ui/utils";
import { EmptyState } from "@szl-holdings/shared-ui/EmptyState";

const stepStatusConfig = {
  complete: { color: "bg-emerald-500", ring: "border-emerald-500/30", label: "Complete", textColor: "text-emerald-400" },
  "in-progress": { color: "bg-blue-500", ring: "border-blue-500/30", label: "In Progress", textColor: "text-blue-400" },
  pending: { color: "bg-terra-text-muted", ring: "border-terra-border", label: "Pending", textColor: "text-terra-text-muted" },
  overdue: { color: "bg-rose-500", ring: "border-rose-500/30", label: "Overdue", textColor: "text-rose-400" },
  blocked: { color: "bg-amber-500", ring: "border-amber-500/30", label: "Blocked", textColor: "text-amber-400" },
};

function StepCard({ step, index }: { step: TransactionStep; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = stepStatusConfig[step.status];
  return (
    <div className={cn("rounded-xl border overflow-hidden transition-all", cfg.ring)}>
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-terra-surface-hover" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-terra-bg border border-terra-border flex items-center justify-center text-[10px] text-terra-text-muted font-bold">
            {index + 1}
          </div>
          <div className={cn("w-3 h-3 rounded-full flex-shrink-0", cfg.color)} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-terra-text">{step.label}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className={cn("text-[10px] font-semibold", cfg.textColor)}>{cfg.label}</span>
            {step.owner && <span className="text-[10px] text-terra-text-muted">{step.owner}</span>}
            {step.dueDate && <span className="text-[10px] text-terra-text-muted">Due {step.dueDate}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {step.blockers.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" />
              {step.blockers.length} blocker{step.blockers.length > 1 ? "s" : ""}
            </div>
          )}
          {step.linkedDocuments.length > 0 && (
            <span className="text-[10px] text-terra-text-muted">{step.linkedDocuments.length} doc{step.linkedDocuments.length > 1 ? "s" : ""}</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-terra-text-muted" /> : <ChevronDown className="w-4 h-4 text-terra-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-terra-border space-y-3">
          {step.notes && (
            <p className="text-xs text-terra-text-secondary mt-3 leading-relaxed">{step.notes}</p>
          )}
          {step.blockers.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-1.5">Blockers</p>
              {step.blockers.map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  {b}
                </div>
              ))}
            </div>
          )}
          {step.linkedDocuments.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-1.5">Linked Documents</p>
              <div className="flex flex-wrap gap-1.5">
                {step.linkedDocuments.map((d, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-terra-primary/10 text-terra-primary border border-terra-primary/20">{d}</span>
                ))}
              </div>
            </div>
          )}
          {step.auditHistory.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-1.5">Audit History</p>
              <AuditPanel entries={step.auditHistory} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TransactionView({ tx }: { tx: Transaction }) {
  const complete = tx.steps.filter(s => s.status === "complete").length;
  const total = tx.steps.length;
  const progress = Math.round((complete / total) * 100);
  const overdue = tx.steps.filter(s => s.status === "overdue").length;
  const blocked = tx.steps.filter(s => s.status === "blocked").length;

  const readinessConfig = {
    green: { label: "Compliant", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    yellow: { label: "Attention Required", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    red: { label: "Non-Compliant", cls: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  }[tx.complianceReadiness];

  return (
    <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
      {/* Transaction Header */}
      <div className="px-6 py-5 border-b border-terra-border">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-lg text-terra-text">{tx.listingAddress}</h3>
            <div className="flex items-center gap-3 text-xs text-terra-text-muted mt-1">
              <span>Buyers: {tx.buyers.join(", ")}</span>
              <span>·</span>
              <span>Agent: {tx.agentName}</span>
              {tx.coordinatorName && <><span>·</span><span>Coordinator: {tx.coordinatorName}</span></>}
            </div>
          </div>
          <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border", readinessConfig.cls)}>
            {readinessConfig.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Purchase Price", value: formatCurrency(tx.purchasePrice) },
            { label: "Accepted Date", value: tx.acceptedDate },
            { label: "Projected Close", value: tx.projectedCloseDate },
            { label: "Escrow #", value: tx.escrowNumber || "—" },
          ].map(m => (
            <div key={m.label}>
              <p className="text-[10px] text-terra-text-muted">{m.label}</p>
              <p className="text-sm font-semibold text-terra-text mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-2 bg-terra-border rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-terra-primary to-terra-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-semibold text-terra-primary flex-shrink-0">{complete}/{total} steps</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {overdue > 0 && <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">{overdue} overdue</span>}
          {blocked > 0 && <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{blocked} blocked</span>}
          {tx.lender && <span className="text-terra-text-muted">Lender: {tx.lender}</span>}
          {tx.titleCompany && <span className="text-terra-text-muted">Title: {tx.titleCompany}</span>}
        </div>

        {tx.riskFlags.length > 0 && (
          <div className="mt-3 space-y-1">
            {tx.riskFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded px-2 py-1.5">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                {flag}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="p-6">
        <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-4">Transaction Steps</p>
        <div className="space-y-3">
          {tx.steps.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-terra-text">Transaction Workflow</h1>
        <p className="text-sm text-terra-text-secondary mt-1">Transaction management — accepted offer to commission payout</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Transactions", value: transactions.filter(t => t.status === "active").length, alert: false },
          { label: "Steps Complete", value: transactions.reduce((s, t) => s + t.steps.filter(st => st.status === "complete").length, 0), alert: false },
          { label: "Overdue Steps", value: transactions.reduce((s, t) => s + t.steps.filter(st => st.status === "overdue").length, 0), alert: true },
          { label: "Risk Flags", value: transactions.reduce((s, t) => s + t.riskFlags.length, 0), alert: true },
        ].map(m => (
          <div key={m.label} className={cn("rounded-xl border p-4 bg-terra-surface/50", m.alert && m.value > 0 ? "border-rose-500/30" : "border-terra-border")}>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
            <p className={cn("text-2xl font-display font-bold mt-1", m.alert && m.value > 0 ? "text-rose-400" : "text-terra-text")}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {transactions.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            headline="No transactions in flight"
            description="Every accepted offer has closed — the workflow board is clear."
            accentColor="#10b981"
          />
        ) : transactions.map(tx => <TransactionView key={tx.id} tx={tx} />)}
      </div>
    </div>
  );
}
