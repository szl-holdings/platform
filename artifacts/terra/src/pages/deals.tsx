import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, RefreshCw, Plus, X } from "lucide-react";
import { RiskBadge, StageBadge, DealHealthCard, ProbabilityBar, formatCurrency, AgentAvatar } from "@/components/brokerage-ui";
import { cn } from "@workspace/shared-ui/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = BASE.replace(/\/[^/]+$/, "/api");

function fetchJson(path: string) {
  return fetch(`${API}${path}`).then(r => r.json()).then(d => d.data ?? d);
}

async function postJson(path: string, body: unknown) {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

export interface ApiDeal {
  id: string;
  address: string;
  borough: string | null;
  county: string | null;
  zipCode: string | null;
  stage: string;
  type: string;
  price: number | null;
  askingPrice: number | null;
  arv: number | null;
  probability: number;
  riskLevel: string;
  ownerName: string | null;
  clientName: string | null;
  distressPropertyId: string | null;
  leadId: string | null;
  estimatedCloseDate: string | null;
  nextAction: string | null;
  stageEnteredAt: string;
  daysInStage: number;
  createdAt: string;
}

const STAGES = [
  "lead","qualified","showing","offer-drafted","offer-submitted","negotiation",
  "accepted","attorney-review","inspection","financing","appraisal",
  "under-contract","clear-to-close","closed","lost-stalled"
] as const;

const STAGE_LABELS: Record<string, string> = {
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

function DealCard({ deal }: { deal: ApiDeal }) {
  const bottleneck = deal.daysInStage > 21 && !["closed", "lost-stalled"].includes(deal.stage);
  const score = deal.probability;

  return (
    <div className={cn(
      "rounded-xl border bg-terra-surface/80 p-4 hover:border-terra-border-hover hover:shadow-md transition-all",
      deal.riskLevel === "critical" ? "border-red-500/30" :
      deal.riskLevel === "high" ? "border-rose-500/30" :
      bottleneck ? "border-amber-500/30" : "border-terra-border"
    )}>
      <div className="flex items-start gap-2 mb-2">
        <DealHealthCard score={score} className="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-terra-text truncate">{deal.address.split(",")[0]}</p>
          <p className="text-[10px] text-terra-text-muted">{deal.borough ?? deal.county ?? "NYC"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded uppercase",
          deal.type === "sell-side" ? "bg-terra-primary/10 text-terra-primary" :
          deal.type === "buy-side" ? "bg-violet-500/10 text-violet-400" : "bg-amber-500/10 text-amber-400"
        )}>{deal.type.replace(/-/g, " ")}</span>
        <span className="text-[10px] text-terra-text-muted">{deal.daysInStage}d in stage</span>
      </div>

      {deal.price && (
        <div className="mb-2">
          <p className="text-[10px] text-terra-text-muted">Deal Value</p>
          <p className="text-sm font-bold text-terra-text">{formatCurrency(deal.price)}</p>
        </div>
      )}

      <ProbabilityBar value={deal.probability / 100} className="mb-2" />

      {bottleneck && (
        <div className="flex items-start gap-1.5 text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5 mb-2">
          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>Stalled — {deal.daysInStage}d in {STAGE_LABELS[deal.stage] ?? deal.stage}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-terra-border">
        <div className="flex items-center gap-1.5">
          {deal.ownerName && (
            <>
              <AgentAvatar name={deal.ownerName} avatar={deal.ownerName.split(" ").map((n: string) => n[0]).join("")} className="w-5 h-5 text-[8px]" />
              <span className="text-[10px] text-terra-text-muted">{deal.ownerName.split(" ")[0]}</span>
            </>
          )}
        </div>
        <span className="text-[10px] text-terra-text-muted">{deal.clientName ?? "—"}</span>
      </div>

      {deal.nextAction && (
        <div className="mt-2 text-[10px] text-terra-text-muted truncate">
          <span className="text-terra-primary">→</span> {deal.nextAction}
        </div>
      )}
    </div>
  );
}

function TableRow({ deal }: { deal: ApiDeal }) {
  const bottleneck = deal.daysInStage > 21 && !["closed", "lost-stalled"].includes(deal.stage);
  return (
    <tr className={cn("border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors",
      deal.riskLevel === "critical" || deal.riskLevel === "high" ? "bg-rose-500/3" : ""
    )}>
      <td className="py-3 px-4">
        <div>
          <p className="text-xs font-semibold text-terra-text">{deal.address.split(",")[0]}</p>
          <p className="text-[10px] text-terra-text-muted">{deal.borough ?? deal.county ?? "NYC"}</p>
        </div>
      </td>
      <td className="py-3 px-4"><StageBadge stage={deal.stage as any} /></td>
      <td className="py-3 px-4 text-xs text-terra-text">{deal.price ? formatCurrency(deal.price) : "—"}</td>
      <td className="py-3 px-4">
        <span className={cn("text-xs font-bold",
          deal.probability >= 75 ? "text-emerald-400" :
          deal.probability >= 50 ? "text-amber-400" : "text-rose-400"
        )}>{deal.probability}%</span>
      </td>
      <td className="py-3 px-4 text-xs text-terra-text-muted">{deal.estimatedCloseDate || "—"}</td>
      <td className="py-3 px-4 text-xs text-terra-text-secondary">{deal.ownerName ?? "—"}</td>
      <td className="py-3 px-4">
        {bottleneck ? (
          <span className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Bottleneck</span>
        ) : (
          <span className="text-xs text-terra-text-muted">—</span>
        )}
      </td>
      <td className="py-3 px-4"><DealHealthCard score={deal.probability} className="w-9 h-9" /></td>
      <td className="py-3 px-4"><RiskBadge level={deal.riskLevel as any} /></td>
    </tr>
  );
}

function AddDealModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ address: "", borough: "", stage: "lead", type: "acquisition", price: "", clientName: "", ownerName: "", estimatedCloseDate: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.address.trim()) { setError("Address is required"); return; }
    setLoading(true);
    setError(null);
    try {
      const body = { ...form, price: form.price ? Number(form.price) : undefined };
      const res = await postJson("/terra/pipeline/deals", body);
      if (res.error) { setError(res.error); } else { onCreated(); onClose(); }
    } catch { setError("Failed to create deal"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-terra-bg-secondary rounded-2xl border border-terra-border shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-terra-text">Add Deal</h2>
          <button onClick={onClose} className="text-terra-text-muted hover:text-terra-text"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Property Address *</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="123 Main St, Brooklyn, NY 11201"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none focus:border-terra-primary" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Borough</label>
              <select value={form.borough} onChange={e => setForm(f => ({ ...f, borough: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
                <option value="">Select borough</option>
                <option value="Manhattan">Manhattan</option>
                <option value="Brooklyn">Brooklyn</option>
                <option value="Queens">Queens</option>
                <option value="Bronx">Bronx</option>
                <option value="Staten Island">Staten Island</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Deal Stage</label>
              <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
                {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
                <option value="acquisition">Acquisition</option>
                <option value="sell-side">Sell Side</option>
                <option value="buy-side">Buy Side</option>
                <option value="dual-agency">Dual Agency</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Price ($)</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="1200000"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none focus:border-terra-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Client Name</label>
              <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none focus:border-terra-primary" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Assigned Agent</label>
              <input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none focus:border-terra-primary" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Est. Close Date</label>
            <input type="date" value={form.estimatedCloseDate} onChange={e => setForm(f => ({ ...f, estimatedCloseDate: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none focus:border-terra-primary" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none focus:border-terra-primary resize-none" />
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-terra-border text-sm text-terra-text-secondary hover:bg-terra-surface transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-terra-primary text-white text-sm font-semibold hover:bg-terra-primary/90 transition-colors disabled:opacity-50">
              {loading ? "Adding..." : "Add Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DealsPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["terra-deals"],
    queryFn: () => fetchJson("/terra/pipeline/deals?limit=200"),
    staleTime: 30000,
  });

  const deals: ApiDeal[] = data?.deals ?? [];

  const active = deals.filter(d => !["closed", "lost-stalled"].includes(d.stage));
  const pipelineValue = active.reduce((s, d) => s + (d.price ?? 0), 0);
  const stalled = deals.filter(d => d.daysInStage > 21 && !["closed", "lost-stalled"].includes(d.stage));
  const atRisk = deals.filter(d => ["high", "critical"].includes(d.riskLevel) && !["closed", "lost-stalled"].includes(d.stage));

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-terra-text">Deal Pipeline</h1>
            <p className="text-sm text-terra-text-secondary mt-1">15-stage brokerage pipeline — kanban and table views with close probability and agent views</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-terra-border overflow-hidden">
              <button onClick={() => setView("kanban")} className={cn("px-3 py-2 text-xs font-medium", view === "kanban" ? "bg-terra-primary text-white" : "bg-terra-surface text-terra-text-muted")}>Kanban</button>
              <button onClick={() => setView("table")} className={cn("px-3 py-2 text-xs font-medium", view === "table" ? "bg-terra-primary text-white" : "bg-terra-surface text-terra-text-muted")}>Table</button>
            </div>
            <button onClick={() => refetch()} className="p-2 rounded-lg border border-terra-border bg-terra-surface text-terra-text-muted hover:text-terra-text transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-terra-primary text-white text-sm font-semibold hover:bg-terra-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Deal
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Deals", value: active.length },
          { label: "Pipeline Value", value: pipelineValue ? formatCurrency(pipelineValue) : "—" },
          { label: "At Risk", value: atRisk.length, alert: true },
          { label: "Stalled", value: stalled.length, alert: true },
        ].map(m => (
          <div key={m.label} className={cn("rounded-xl border p-4 bg-terra-surface/50", m.alert ? "border-rose-500/30" : "border-terra-border")}>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
            <p className={cn("text-2xl font-display font-bold mt-1", m.alert ? "text-rose-400" : "text-terra-text")}>{m.value}</p>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-32 text-terra-text-muted text-sm">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading deals...
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-center">
          <p className="text-sm text-rose-400">Failed to load deals.</p>
          <button onClick={() => refetch()} className="mt-3 px-4 py-2 rounded-lg border border-rose-500/30 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors">Retry</button>
        </div>
      )}

      {!isLoading && !isError && deals.length === 0 && (
        <div className="rounded-xl border border-dashed border-terra-border bg-terra-surface/30 p-12 text-center">
          <Activity className="w-10 h-10 text-terra-text-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-terra-text mb-1">No deals in pipeline</p>
          <p className="text-xs text-terra-text-muted mb-4">Add your first deal manually, or convert a lead from the Leads + Contacts page.</p>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-terra-primary text-white text-sm font-semibold hover:bg-terra-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add First Deal
          </button>
        </div>
      )}

      {!isLoading && !isError && deals.length > 0 && view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: `${STAGES.length * 220}px` }}>
            {STAGES.map(stage => {
              const stageDeals = deals.filter(d => d.stage === stage);
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
      )}

      {!isLoading && !isError && deals.length > 0 && view === "table" && (
        <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-terra-border">
                  {["Property", "Stage", "Price", "Close Prob.", "Est. Close", "Agent", "Bottleneck", "Health", "Risk"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deals.map(deal => <TableRow key={deal.id} deal={deal} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddDealModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ["terra-deals"] }); }}
        />
      )}
    </div>
  );
}
