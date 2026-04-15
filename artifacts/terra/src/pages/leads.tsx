import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Search, Phone, Mail, TrendingUp, CheckSquare, Plus, RefreshCw, X } from "lucide-react";
import { StageBadge, AgentAvatar, formatCurrency, ProbabilityBar } from "@/components/brokerage-ui";
import { cn } from "@szl-holdings/shared-ui/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = "/api";

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

export interface ApiLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  type: string;
  source: string;
  stage: string;
  score: number;
  conversionProbability: number;
  ownerName: string | null;
  lastContact: string | null;
  nextFollowUp: string | null;
  nextAction: string | null;
  distressPropertyId: string | null;
  linkedDealId: string | null;
  tags: string[];
  notes: string | null;
  createdAt: string;
}

const stageOrder = ["new", "engaged", "nurtured", "hot", "inactive", "converted"];

const sourceLabels: Record<string, string> = {
  referral: "Referral",
  website: "Website",
  zillow: "Zillow",
  realtor: "Realtor.com",
  "open-house": "Open House",
  social: "Social Media",
  "cold-call": "Cold Call",
  "past-client": "Past Client",
  "distress-engine": "Distress Engine",
  manual: "Manual",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-[#40856a]" : score >= 60 ? "bg-amber-500" : score >= 40 ? "bg-orange-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-terra-border rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-xs font-bold w-6 text-right", score >= 80 ? "text-[#40856a]" : score >= 60 ? "text-amber-400" : "text-rose-400")}>{score}</span>
    </div>
  );
}

function LeadDetail({ lead, onClose, onConvertToDeal }: { lead: ApiLead; onClose: () => void; onConvertToDeal: (leadId: string) => void }) {
  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-terra-bg-secondary border-l border-terra-border shadow-2xl z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl text-terra-text">{lead.firstName} {lead.lastName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StageBadge stage={lead.stage as any} />
              <span className="text-xs text-terra-text-muted capitalize">{lead.type} · {sourceLabels[lead.source] ?? lead.source}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-terra-text-muted hover:text-terra-text text-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "Lead Score", value: lead.score, sub: "/100" },
            { label: "Conversion Prob.", value: `${Math.round(lead.conversionProbability * 100)}%` },
          ].map(m => (
            <div key={m.label} className="rounded-lg border border-terra-border bg-terra-surface p-3">
              <p className="text-[10px] text-terra-text-muted">{m.label}</p>
              <p className="text-lg font-display font-bold text-terra-text">{m.value}<span className="text-xs text-terra-text-muted">{m.sub}</span></p>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-6">
          {lead.email && (
            <div className="flex items-center gap-2 text-xs text-terra-text-secondary">
              <Mail className="w-4 h-4 text-terra-text-muted" />
              {lead.email}
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-xs text-terra-text-secondary">
              <Phone className="w-4 h-4 text-terra-text-muted" />
              {lead.phone}
            </div>
          )}
          {lead.distressPropertyId && (
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <TrendingUp className="w-4 h-4" />
              Linked to distress property #{lead.distressPropertyId}
            </div>
          )}
          {lead.linkedDealId && (
            <div className="flex items-center gap-2 text-xs text-[#40856a]">
              <CheckSquare className="w-4 h-4" />
              Converted · Deal #{lead.linkedDealId}
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-2">Lead Score</p>
          <ScoreBar score={lead.score} />
        </div>

        {lead.notes && (
          <div className="mb-6">
            <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-2">Notes</p>
            <p className="text-xs text-terra-text-secondary leading-relaxed bg-terra-surface rounded-lg p-3 border border-terra-border">{lead.notes}</p>
          </div>
        )}

        {lead.nextAction && (
          <div className="mb-6">
            <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-1">Next Action</p>
            <p className="text-xs text-terra-primary">{lead.nextAction}</p>
          </div>
        )}

        {lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-6">
            {lead.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-terra-primary/10 text-terra-primary border border-terra-primary/20">#{tag}</span>
            ))}
          </div>
        )}

        {lead.stage !== "converted" && (
          <button
            onClick={() => { onConvertToDeal(lead.id); onClose(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-terra-primary text-white text-sm font-semibold hover:bg-terra-primary/90 transition-colors"
          >
            Convert to Deal
          </button>
        )}
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", type: "buyer", source: "manual", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) { setError("First and last name are required"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await postJson("/terra/crm/leads", form);
      if (res.error) { setError(res.error); } else { onCreated(); onClose(); }
    } catch { setError("Failed to create lead"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-terra-bg-secondary rounded-2xl border border-terra-border shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-terra-text">Add Lead</h2>
          <button onClick={onClose} className="text-terra-text-muted hover:text-terra-text"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">First Name *</label>
              <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none focus:border-terra-primary" required />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Last Name *</label>
              <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none focus:border-terra-primary" required />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none focus:border-terra-primary" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none focus:border-terra-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="investor">Investor</option>
                <option value="renter">Renter</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Source</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
                {Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
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
              {loading ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<ApiLead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["terra-leads", stageFilter, sourceFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (stageFilter !== "all") params.set("stage", stageFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (search) params.set("q", search);
      params.set("limit", "200");
      return fetchJson(`/terra/crm/leads?${params}`);
    },
    staleTime: 30000,
  });

  const convertToDeal = useMutation({
    mutationFn: (leadId: string) => postJson("/terra/convert/lead-to-deal", { leadId }),
    onMutate: async (leadId) => {
      await qc.cancelQueries({ queryKey: ["terra-leads"] });
      const prev = qc.getQueryData(["terra-leads"]);
      qc.setQueryData(["terra-leads"], (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const asObj = old as { leads?: Record<string, unknown>[] };
        if (!Array.isArray(asObj.leads)) return old;
        return { ...asObj, leads: asObj.leads.map((l) => l.id === leadId ? { ...l, stage: "converting" } : l) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["terra-leads"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["terra-leads"] }),
  });

  const leads: ApiLead[] = data?.leads ?? [];

  const stageCounts = stageOrder.reduce((acc, s) => {
    acc[s] = leads.filter((l: ApiLead) => l.stage === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-terra-text">Leads + Contacts</h1>
            <p className="text-sm text-terra-text-secondary mt-1">CRM-quality lead management with scoring, engagement tracking, and conversion paths</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="p-2 rounded-lg border border-terra-border bg-terra-surface text-terra-text-muted hover:text-terra-text transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-terra-primary text-white text-sm font-semibold hover:bg-terra-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          </div>
        </div>
      </motion.div>

      {/* Pipeline funnel */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {stageOrder.map((stage, i) => (
          <div key={stage} className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setStageFilter(stage === stageFilter ? "all" : stage)}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                stageFilter === stage ? "bg-terra-primary border-terra-primary text-white" : "bg-terra-surface border-terra-border text-terra-text-secondary hover:text-terra-text"
              )}
            >
              <StageBadge stage={stage as any} />
              <span className="text-terra-text-muted">({stageCounts[stage] ?? 0})</span>
            </button>
            {i < stageOrder.length - 1 && <span className="text-terra-text-muted text-xs flex-shrink-0">→</span>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terra-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text placeholder:text-terra-text-muted focus:outline-none focus:border-terra-primary" />
        </div>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
          <option value="all">All Sources</option>
          {Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-terra-border bg-terra-surface/40 p-4 flex items-center gap-4 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-terra-border shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-terra-border rounded w-1/3" />
                <div className="h-2.5 bg-terra-border/60 rounded w-1/2" />
              </div>
              <div className="h-5 w-16 bg-terra-border rounded-full" />
              <div className="h-5 w-12 bg-terra-border/60 rounded" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-center">
          <p className="text-sm text-rose-400">Failed to load leads. Please check your connection.</p>
          <button onClick={() => refetch()} className="mt-3 px-4 py-2 rounded-lg border border-rose-500/30 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors">Retry</button>
        </div>
      )}

      {!isLoading && !isError && leads.length === 0 && (
        <div className="rounded-xl border border-dashed border-terra-border bg-terra-surface/30 p-12 text-center">
          <Users className="w-10 h-10 text-terra-text-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-terra-text mb-1">No leads yet</p>
          <p className="text-xs text-terra-text-muted mb-4">Add your first lead manually, or convert a distress property from the Distress Engine.</p>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-terra-primary text-white text-sm font-semibold hover:bg-terra-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add First Lead
          </button>
        </div>
      )}

      {!isLoading && !isError && leads.length > 0 && (
        <>
          <p className="text-xs text-terra-text-muted">{leads.length} lead{leads.length !== 1 ? "s" : ""}</p>
          <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-terra-border">
                    {["Contact", "Stage", "Type", "Source", "Score", "Conversion Prob.", "Owner", "Last Contact", "Next Follow-Up"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead: ApiLead) => (
                    <tr key={lead.id} onClick={() => setSelectedLead(lead)}
                      className="border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors cursor-pointer">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <AgentAvatar name={`${lead.firstName} ${lead.lastName}`} avatar={`${lead.firstName[0]}${lead.lastName[0]}`} className="w-7 h-7 text-[10px]" />
                          <div>
                            <p className="text-xs font-semibold text-terra-text">{lead.firstName} {lead.lastName}</p>
                            <p className="text-[10px] text-terra-text-muted">{lead.email ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><StageBadge stage={lead.stage as any} /></td>
                      <td className="py-3 px-4 text-xs text-terra-text-secondary capitalize">{lead.type}</td>
                      <td className="py-3 px-4 text-xs text-terra-text-secondary">{sourceLabels[lead.source] ?? lead.source}</td>
                      <td className="py-3 px-4 w-32"><ScoreBar score={lead.score} /></td>
                      <td className="py-3 px-4">
                        <span className={cn("text-xs font-semibold",
                          lead.conversionProbability >= 0.7 ? "text-[#40856a]" :
                          lead.conversionProbability >= 0.4 ? "text-amber-400" : "text-rose-400"
                        )}>{Math.round(lead.conversionProbability * 100)}%</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-terra-text-secondary">{lead.ownerName ?? "—"}</td>
                      <td className="py-3 px-4 text-xs text-terra-text-muted">{lead.lastContact ?? "—"}</td>
                      <td className="py-3 px-4">
                        <span className={cn("text-xs font-medium",
                          lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date() ? "text-rose-400" : "text-terra-text"
                        )}>{lead.nextFollowUp ?? "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onConvertToDeal={(id) => convertToDeal.mutate(id)}
        />
      )}

      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ["terra-leads"] }); }}
        />
      )}
    </div>
  );
}
