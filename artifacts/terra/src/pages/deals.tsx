import { motion } from "framer-motion";
import { useState } from "react";
import { Activity, Filter, AlertTriangle, Clock } from "lucide-react";
import { brokerageDeals, type BrokerageDeal, type DealStage } from "@/data/brokerage";
import { RiskBadge, StageBadge, DealHealthCard, ProbabilityBar, formatCurrency, AgentAvatar } from "@/components/brokerage-ui";
import { cn } from "@workspace/shared-ui/utils";

const STAGES: DealStage[] = [
  "lead","qualified","showing","offer-drafted","offer-submitted","negotiation","accepted","attorney-review","inspection","financing","appraisal","under-contract","clear-to-close","closed","lost-stalled"
];

const STAGE_LABELS: Record<DealStage, string> = {
  "lead": "Lead",
  "qualified": "Qualified",
  "showing": "Showing",
  "offer-drafted": "Offer Drafted",
  "offer-submitted": "Offer Submitted",
  "negotiation": "Negotiation",
  "accepted": "Accepted",
  "attorney-review": "Attorney Review",
  "inspection": "Inspection",
  "financing": "Financing",
  "appraisal": "Appraisal",
  "under-contract": "Under Contract",
  "clear-to-close": "Clear to Close",
  "closed": "Closed",
  "lost-stalled": "Lost / Stalled",
};

function DealCard({ deal }: { deal: BrokerageDeal }) {
  return (
    <div className={cn(
      "rounded-xl border bg-terra-surface/80 p-4 hover:border-terra-border-hover hover:shadow-md transition-all",
      deal.riskLevel === "critical" ? "border-red-500/30" :
      deal.riskLevel === "high" ? "border-rose-500/30" :
      deal.bottleneckFlag ? "border-amber-500/30" : "border-terra-border"
    )}>
      <div className="flex items-start gap-2 mb-2">
        <DealHealthCard score={deal.dealHealthScore} className="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-terra-text truncate">{deal.address.split(",")[0]}</p>
          <p className="text-[10px] text-terra-text-muted">{deal.city}, {deal.state}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded uppercase",
          deal.type === "sell-side" ? "bg-terra-primary/10 text-terra-primary" :
          deal.type === "buy-side" ? "bg-violet-500/10 text-violet-400" : "bg-amber-500/10 text-amber-400"
        )}>{deal.type.replace("-", " ")}</span>
        <span className="text-[10px] text-terra-text-muted">{deal.daysInStage}d in stage</span>
      </div>

      <div className="mb-2">
        <p className="text-[10px] text-terra-text-muted">Value / Commission</p>
        <p className="text-sm font-bold text-terra-text">{formatCurrency(deal.price)} <span className="text-terra-primary font-normal text-xs">/ {formatCurrency(deal.commission)}</span></p>
      </div>

      <ProbabilityBar value={deal.probability / 100} className="mb-2" />

      {deal.bottleneckFlag && deal.bottleneckReason && (
        <div className="flex items-start gap-1.5 text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5 mb-2">
          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>{deal.bottleneckReason}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-terra-border">
        <div className="flex items-center gap-1.5">
          <AgentAvatar name={deal.agentName} avatar={deal.agentName.split(" ").map(n => n[0]).join("")} className="w-5 h-5 text-[8px]" />
          <span className="text-[10px] text-terra-text-muted">{deal.agentName.split(" ")[0]}</span>
        </div>
        <span className="text-[10px] text-terra-text-muted">{deal.clientName}</span>
      </div>

      {deal.nextAction && (
        <div className="mt-2 text-[10px] text-terra-text-muted truncate">
          <span className="text-terra-primary">→</span> {deal.nextAction}
        </div>
      )}
    </div>
  );
}

function TableRow({ deal }: { deal: BrokerageDeal }) {
  return (
    <tr className={cn("border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors",
      deal.hasUrgentIssue && "bg-rose-500/3"
    )}>
      <td className="py-3 px-4">
        <div>
          <p className="text-xs font-semibold text-terra-text">{deal.address.split(",")[0]}</p>
          <p className="text-[10px] text-terra-text-muted">{deal.city}, {deal.state}</p>
        </div>
      </td>
      <td className="py-3 px-4"><StageBadge stage={deal.stage} /></td>
      <td className="py-3 px-4 text-xs text-terra-text">{formatCurrency(deal.price)}</td>
      <td className="py-3 px-4 text-xs font-semibold text-terra-primary">{formatCurrency(deal.commission)}</td>
      <td className="py-3 px-4">
        <span className={cn("text-xs font-bold",
          deal.probability >= 75 ? "text-emerald-400" :
          deal.probability >= 50 ? "text-amber-400" : "text-rose-400"
        )}>{deal.probability}%</span>
      </td>
      <td className="py-3 px-4 text-xs text-terra-text-muted">{deal.estimatedCloseDate || "—"}</td>
      <td className="py-3 px-4 text-xs text-terra-text-secondary">{deal.agentName.split(" ")[0]}</td>
      <td className="py-3 px-4">
        {deal.bottleneckFlag ? (
          <span className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Bottleneck</span>
        ) : (
          <span className="text-xs text-terra-text-muted">—</span>
        )}
      </td>
      <td className="py-3 px-4"><DealHealthCard score={deal.dealHealthScore} className="w-9 h-9" /></td>
      <td className="py-3 px-4"><RiskBadge level={deal.riskLevel} /></td>
    </tr>
  );
}

export default function DealsPage() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [stageFilter, setStageFilter] = useState<DealStage | "all">("all");
  const [teamFilter, setTeamFilter] = useState("all");

  const active = brokerageDeals.filter(d => !["closed","lost-stalled"].includes(d.stage));
  const filtered = brokerageDeals.filter(d => {
    if (stageFilter !== "all" && d.stage !== stageFilter) return false;
    if (teamFilter !== "all" && d.teamId !== teamFilter) return false;
    return true;
  });

  const pipelineValue = active.reduce((s, d) => s + d.price, 0);
  const commissionAtRisk = brokerageDeals.filter(d => ["high","critical"].includes(d.riskLevel) && !["closed","lost-stalled"].includes(d.stage)).reduce((s, d) => s + d.commission, 0);

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-terra-text">Deal Pipeline</h1>
            <p className="text-sm text-terra-text-secondary mt-1">15-stage brokerage pipeline — kanban, table, and agent views with close probability</p>
          </div>
          <div className="flex rounded-lg border border-terra-border overflow-hidden">
            <button onClick={() => setView("kanban")} className={cn("px-3 py-2 text-xs font-medium", view === "kanban" ? "bg-terra-primary text-white" : "bg-terra-surface text-terra-text-muted")}>Kanban</button>
            <button onClick={() => setView("table")} className={cn("px-3 py-2 text-xs font-medium", view === "table" ? "bg-terra-primary text-white" : "bg-terra-surface text-terra-text-muted")}>Table</button>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Deals", value: active.length },
          { label: "Pipeline Value", value: formatCurrency(pipelineValue) },
          { label: "Commission at Risk", value: formatCurrency(commissionAtRisk), alert: true },
          { label: "Stalled", value: brokerageDeals.filter(d => d.isStalled).length, alert: true },
        ].map(m => (
          <div key={m.label} className={cn("rounded-xl border p-4 bg-terra-surface/50", (m as any).alert ? "border-rose-500/30" : "border-terra-border")}>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
            <p className={cn("text-2xl font-display font-bold mt-1", (m as any).alert ? "text-rose-400" : "text-terra-text")}>{m.value}</p>
          </div>
        ))}
      </div>

      {view === "kanban" ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: `${STAGES.length * 220}px` }}>
            {STAGES.map(stage => {
              const stageDeals = brokerageDeals.filter(d => d.stage === stage);
              return (
                <div key={stage} className="w-52 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-terra-border">
                    <h3 className="text-xs font-display font-bold text-terra-text">{STAGE_LABELS[stage]}</h3>
                    <span className="text-[10px] text-terra-text-muted">({stageDeals.length})</span>
                  </div>
                  <div className="space-y-3">
                    {stageDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}
                    {stageDeals.length === 0 && (
                      <div className="rounded-xl border border-dashed border-terra-border p-4 text-center">
                        <p className="text-xs text-terra-text-muted">No deals</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-terra-border">
                  {["Property", "Stage", "Price", "Commission", "Close Prob.", "Est. Close", "Agent", "Bottleneck", "Health", "Risk"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brokerageDeals.map(deal => <TableRow key={deal.id} deal={deal} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
