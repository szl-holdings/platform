import { motion } from "framer-motion";
import { useState } from "react";
import { FileText, AlertTriangle, CheckCircle, Clock, Upload, Search } from "lucide-react";
import { documents, type Document } from "@/data/brokerage";
import { cn } from "@workspace/shared-ui/utils";

const statusConfig: Record<Document["status"], { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  complete: { label: "Complete", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
  missing: { label: "Missing", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", icon: AlertTriangle },
  "pending-signature": { label: "Pending Signature", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Clock },
  "pending-review": { label: "Under Review", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Clock },
  expired: { label: "Expired", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", icon: AlertTriangle },
  rejected: { label: "Rejected", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", icon: AlertTriangle },
  pending: { label: "Pending", color: "text-terra-text-muted", bg: "bg-terra-surface border-terra-border", icon: Clock },
};

const typeLabels: Record<string, string> = {
  contract: "Contract",
  disclosure: "Disclosure",
  inspection: "Inspection",
  appraisal: "Appraisal",
  title: "Title",
  loan: "Loan",
  legal: "Legal",
  compliance: "Compliance",
  other: "Other",
};

function ReadinessBadge({ level }: { level: "green" | "yellow" | "red" }) {
  const cfg = {
    green: { label: "Compliant", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    yellow: { label: "Attention Needed", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    red: { label: "Non-Compliant", cls: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  }[level];
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide", cfg.cls)}><span className="w-1.5 h-1.5 rounded-full bg-current" />{cfg.label}</span>;
}

function DocumentRow({ doc }: { doc: Document }) {
  const cfg = statusConfig[doc.status];
  const Icon = cfg.icon;
  return (
    <tr className="border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-terra-text-muted flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-terra-text">{doc.name}</p>
            <p className="text-[10px] text-terra-text-muted capitalize">{typeLabels[doc.type]} · {doc.category}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold", cfg.bg, cfg.color)}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded",
          doc.required ? "bg-rose-500/10 text-rose-400" : "bg-terra-text-muted/10 text-terra-text-muted"
        )}>{doc.required ? "Required" : "Optional"}</span>
      </td>
      <td className="py-3 px-4 text-xs text-terra-text-muted">{doc.dueDate}</td>
      <td className="py-3 px-4">
        {doc.signers.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {doc.signers.map((s, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px]">
                {s.signed ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
                <span className="text-terra-text-secondary">{s.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-terra-text-muted">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-xs text-terra-text-secondary">{doc.uploadedBy || "—"}</td>
      <td className="py-3 px-4 text-xs text-terra-text-muted">{doc.reviewedBy || "—"}</td>
      <td className="py-3 px-4">
        {doc.notes && (
          <span className="text-[10px] text-amber-400 truncate max-w-[160px] block">{doc.notes}</span>
        )}
      </td>
    </tr>
  );
}

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = documents.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
    return true;
  });

  const missing = documents.filter(d => d.status === "missing" && d.required);
  const pendingSig = documents.filter(d => d.status === "pending-signature");
  const underReview = documents.filter(d => d.status === "pending-review");
  const complete = documents.filter(d => d.status === "complete");

  const readiness: "green" | "yellow" | "red" = missing.length > 0 ? "red" : pendingSig.length > 0 ? "yellow" : "green";

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-terra-text">Documents + Compliance</h1>
            <p className="text-sm text-terra-text-secondary mt-1">Document checklist, missing-document detection, signer status, and compliance readiness scoring</p>
          </div>
          <ReadinessBadge level={readiness} />
        </div>
      </motion.div>

      {/* Missing Document Alert */}
      {missing.length > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <p className="text-sm font-bold text-rose-400">{missing.length} Required Document{missing.length > 1 ? "s" : ""} Missing</p>
          </div>
          <div className="space-y-1">
            {missing.map(d => (
              <div key={d.id} className="text-xs text-rose-300 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-rose-400 flex-shrink-0" />
                {d.name} — Due {d.dueDate}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Documents", value: documents.length, ok: false, warn: false, alert: false },
          { label: "Complete", value: complete.length, ok: true, warn: false, alert: false },
          { label: "Missing (required)", value: missing.length, ok: false, warn: false, alert: true },
          { label: "Pending Signature", value: pendingSig.length, ok: false, warn: true, alert: false },
        ].map(m => (
          <div key={m.label} className={cn("rounded-xl border p-4 bg-terra-surface/50",
            m.alert && m.value > 0 ? "border-rose-500/30" :
            m.warn && m.value > 0 ? "border-amber-500/30" :
            m.ok ? "border-emerald-500/20" : "border-terra-border"
          )}>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
            <p className={cn("text-2xl font-display font-bold mt-1",
              m.alert && m.value > 0 ? "text-rose-400" :
              m.warn && m.value > 0 ? "text-amber-400" :
              m.ok ? "text-emerald-400" : "text-terra-text"
            )}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Readiness Scorecard by Category */}
      <div className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
        <h3 className="font-display font-bold text-terra-text mb-4">Compliance Readiness by Category</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(["buyer","seller","agent","lender","title","legal"] as const).map(cat => {
            const catDocs = documents.filter(d => d.category === cat);
            const catMissing = catDocs.filter(d => d.status === "missing" && d.required);
            const catComplete = catDocs.filter(d => d.status === "complete");
            const level: "green" | "yellow" | "red" = catMissing.length > 0 ? "red" : catDocs.some(d => d.status === "pending-signature") ? "yellow" : "green";
            return (
              <div key={cat} className={cn("rounded-lg border p-3 text-center",
                level === "red" ? "border-rose-500/30 bg-rose-500/5" :
                level === "yellow" ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/20 bg-emerald-500/5"
              )}>
                <p className="text-[10px] text-terra-text-muted capitalize mb-1">{cat}</p>
                <p className={cn("text-lg font-display font-bold", level === "red" ? "text-rose-400" : level === "yellow" ? "text-amber-400" : "text-emerald-400")}>
                  {catComplete.length}/{catDocs.length}
                </p>
                <ReadinessBadge level={level} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terra-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text placeholder:text-terra-text-muted focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="complete">Complete</option>
          <option value="missing">Missing</option>
          <option value="pending-signature">Pending Signature</option>
          <option value="pending-review">Under Review</option>
          <option value="pending">Pending</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
          <option value="all">All Categories</option>
          {["buyer","seller","agent","lender","title","legal"].map(c => (
            <option key={c} value={c} className="capitalize">{c}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-terra-text-muted">{filtered.length} documents</p>

      <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-terra-border">
                {["Document", "Status", "Required", "Due Date", "Signers", "Uploaded By", "Reviewed By", "Notes"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => <DocumentRow key={doc.id} doc={doc} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
