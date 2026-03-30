import { motion } from "framer-motion";
import { useState } from "react";
import { Users, Search, Phone, Mail, TrendingUp, Clock, Star, MessageSquare, CheckSquare } from "lucide-react";
import { leads, type Lead } from "@/data/brokerage";
import { StageBadge, AgentAvatar, formatCurrency, ProbabilityBar } from "@/components/brokerage-ui";
import { cn } from "@workspace/shared-ui/utils";

const stageOrder: Lead["stage"][] = ["new", "engaged", "nurtured", "hot", "inactive", "converted"];

const sourceLabels: Record<string, string> = {
  referral: "Referral",
  website: "Website",
  zillow: "Zillow",
  "realtor": "Realtor.com",
  "open-house": "Open House",
  social: "Social Media",
  "cold-call": "Cold Call",
  "past-client": "Past Client",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : score >= 40 ? "bg-orange-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-terra-border rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-xs font-bold w-6 text-right", score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-rose-400")}>{score}</span>
    </div>
  );
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-terra-bg-secondary border-l border-terra-border shadow-2xl z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl text-terra-text">{lead.firstName} {lead.lastName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StageBadge stage={lead.stage} />
              <span className="text-xs text-terra-text-muted capitalize">{lead.type} · {sourceLabels[lead.source]}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-terra-text-muted hover:text-terra-text text-xl">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "Lead Score", value: lead.score, sub: "/100" },
            { label: "Conversion Prob.", value: `${Math.round(lead.conversionProbability * 100)}%` },
            { label: "Engagements", value: lead.engagementCount },
            { label: "Messages", value: lead.messagesCount },
          ].map(m => (
            <div key={m.label} className="rounded-lg border border-terra-border bg-terra-surface p-3">
              <p className="text-[10px] text-terra-text-muted">{m.label}</p>
              <p className="text-lg font-display font-bold text-terra-text">{m.value}<span className="text-xs text-terra-text-muted">{m.sub}</span></p>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-terra-text-secondary">
            <Mail className="w-4 h-4 text-terra-text-muted" />
            {lead.email}
          </div>
          <div className="flex items-center gap-2 text-xs text-terra-text-secondary">
            <Phone className="w-4 h-4 text-terra-text-muted" />
            {lead.phone}
          </div>
          {lead.budget && (
            <div className="flex items-center gap-2 text-xs text-terra-text-secondary">
              <TrendingUp className="w-4 h-4 text-terra-text-muted" />
              Budget: {formatCurrency(lead.budget.min)} – {formatCurrency(lead.budget.max)}
            </div>
          )}
          {lead.preApproved && lead.preApprovalAmount && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckSquare className="w-4 h-4" />
              Pre-approved: {formatCurrency(lead.preApprovalAmount)}
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-2">Conversion Score</p>
          <ScoreBar score={lead.score} />
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-3">Engagement Timeline</p>
          <div className="space-y-3">
            {lead.timeline.map((event, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-0.5",
                    event.type === "offer" ? "bg-emerald-400" :
                    event.type === "showing" ? "bg-blue-400" :
                    event.type === "task" ? "bg-amber-400" : "bg-terra-primary"
                  )} />
                  {i < lead.timeline.length - 1 && <div className="w-px flex-1 bg-terra-border mt-1" />}
                </div>
                <div className="pb-2">
                  <p className="text-terra-text">{event.event}</p>
                  <p className="text-[10px] text-terra-text-muted mt-0.5">{event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-2">Notes</p>
          <p className="text-xs text-terra-text-secondary leading-relaxed bg-terra-surface rounded-lg p-3 border border-terra-border">{lead.notes}</p>
        </div>

        <div className="flex gap-2">
          <div className="flex flex-wrap gap-1">
            {lead.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-terra-primary/10 text-terra-primary border border-terra-primary/20">#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filtered = leads.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      if (!`${l.firstName} ${l.lastName}`.toLowerCase().includes(q) && !l.email.toLowerCase().includes(q)) return false;
    }
    if (stageFilter !== "all" && l.stage !== stageFilter) return false;
    if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
    return true;
  });

  const stageCounts = stageOrder.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.stage === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-terra-text">Leads + Contacts</h1>
        <p className="text-sm text-terra-text-secondary mt-1">Lead management with scoring, engagement tracking, and conversion paths</p>
      </motion.div>

      {/* Pipeline Overview */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {stageOrder.map((stage, i) => (
          <div key={stage} className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setStageFilter(stage === stageFilter ? "all" : stage)}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                stageFilter === stage ? "bg-terra-primary border-terra-primary text-white" : "bg-terra-surface border-terra-border text-terra-text-secondary hover:text-terra-text"
              )}
            >
              <StageBadge stage={stage} />
              <span className="text-terra-text-muted">({stageCounts[stage]})</span>
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

      <p className="text-xs text-terra-text-muted">{filtered.length} leads</p>

      {/* Lead Table */}
      <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-terra-border">
                {["Contact", "Stage", "Type", "Source", "Score", "Conversion Prob.", "Agent", "Last Contact", "Next Follow-Up"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} onClick={() => setSelectedLead(lead)}
                  className="border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <AgentAvatar name={`${lead.firstName} ${lead.lastName}`} avatar={`${lead.firstName[0]}${lead.lastName[0]}`} className="w-7 h-7 text-[10px]" />
                      <div>
                        <p className="text-xs font-semibold text-terra-text">{lead.firstName} {lead.lastName}</p>
                        <p className="text-[10px] text-terra-text-muted">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4"><StageBadge stage={lead.stage} /></td>
                  <td className="py-3 px-4 text-xs text-terra-text-secondary capitalize">{lead.type}</td>
                  <td className="py-3 px-4 text-xs text-terra-text-secondary">{sourceLabels[lead.source]}</td>
                  <td className="py-3 px-4 w-32"><ScoreBar score={lead.score} /></td>
                  <td className="py-3 px-4">
                    <span className={cn("text-xs font-semibold",
                      lead.conversionProbability >= 0.7 ? "text-emerald-400" :
                      lead.conversionProbability >= 0.4 ? "text-amber-400" : "text-rose-400"
                    )}>{Math.round(lead.conversionProbability * 100)}%</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-terra-text-secondary">{lead.agentName.split(" ")[0]}</td>
                  <td className="py-3 px-4 text-xs text-terra-text-muted">{lead.lastContact}</td>
                  <td className="py-3 px-4">
                    <span className={cn("text-xs font-medium",
                      new Date(lead.nextFollowUp) <= new Date() ? "text-rose-400" : "text-terra-text"
                    )}>{lead.nextFollowUp}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}
