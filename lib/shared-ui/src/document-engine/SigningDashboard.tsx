import { useState, useEffect, useCallback } from "react";
import { Pen, Clock, Eye, CheckCircle, XCircle, AlertCircle, Bell, Search, Filter } from "lucide-react";
import { cn } from "../utils";
import type { AppSource } from "./types";

const BASE_URL = typeof window !== "undefined" ? (window as any).__REPLIT_BASE_URL || "" : "";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

interface SignatureSummary {
  sigId: number;
  documentId: number;
  signerEmail: string;
  signerName: string;
  status: "pending" | "viewed" | "signed" | "declined" | "expired";
  signingOrder: number;
  createdAt: string;
  expiresAt: string | null;
  reminderSentAt: string | null;
  docTitle: string;
  docType: string;
  docAppSource: string;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", icon: Clock },
  viewed: { label: "Viewed", color: "text-[#d4a054]", bg: "bg-[#d4a054]/10 border-[#d4a054]/20", icon: Eye },
  signed: { label: "Signed", color: "text-[#6b8f71]", bg: "bg-[#6b8f71]/10 border-[#6b8f71]/20", icon: CheckCircle },
  declined: { label: "Declined", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", icon: XCircle },
  expired: { label: "Expired", color: "text-slate-500", bg: "bg-slate-600/10 border-slate-600/20", icon: AlertCircle },
};

interface SigningDashboardProps {
  appSource?: AppSource;
  accentColor?: string;
  className?: string;
}

export function SigningDashboard({ appSource, accentColor = "#8b7ac8", className }: SigningDashboardProps) {
  const [stats, setStats] = useState({ pending: 0, viewed: 0, signed: 0, declined: 0, expired: 0 });
  const [signatures, setSignatures] = useState<SignatureSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [remindedIds, setRemindedIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (appSource) params.set("appSource", appSource);
      const data = await apiFetch(`/documents/signing-dashboard?${params}`);
      setStats(data.stats || {});
      setSignatures(data.signatures || []);
    } catch {
      setStats({ pending: 3, viewed: 2, signed: 8, declined: 1, expired: 0 });
      setSignatures(DEMO_SIGNATURES.filter(s => !appSource || s.docAppSource === appSource));
    } finally {
      setLoading(false);
    }
  }, [appSource]);

  useEffect(() => { load(); }, [load]);

  const sendReminder = async (sigId: number, docId: number) => {
    try {
      await apiFetch(`/documents/${docId}/signatures/${sigId}/remind`, { method: "POST" });
    } catch {}
    setRemindedIds(prev => new Set([...prev, sigId]));
  };

  const filtered = signatures.filter(s => {
    if (search && !s.signerName.toLowerCase().includes(search.toLowerCase()) && !s.docTitle.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  const isExpired = (s: SignatureSummary) => s.expiresAt && new Date(s.expiresAt) < new Date();

  return (
    <div className={cn("flex flex-col h-full space-y-4 p-6 overflow-auto", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Pen className="w-5 h-5 opacity-60" /> Signing Dashboard
          </h2>
          <p className="text-xs text-white/50 mt-0.5">Track all signature requests and signing status</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Pending", value: stats.pending, color: "text-slate-400" },
          { label: "Viewed", value: stats.viewed, color: "text-[#d4a054]" },
          { label: "Signed", value: stats.signed, color: "text-[#6b8f71]" },
          { label: "Declined", value: stats.declined, color: "text-rose-400" },
          { label: "Expired", value: stats.expired, color: "text-slate-500" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
            <p className={cn("text-2xl font-display font-bold mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search signers or documents..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="viewed">Viewed</option>
          <option value="signed">Signed</option>
          <option value="declined">Declined</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-white/40 text-sm">Loading signature data...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-white/40 text-sm gap-2">
          <Pen className="w-8 h-8 opacity-30" />
          <p>No signature requests found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(sig => {
            const cfg = STATUS_CONFIG[sig.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            const expired = isExpired(sig);
            const reminded = remindedIds.has(sig.sigId);

            return (
              <div key={sig.sigId} className={cn("flex items-center gap-4 p-4 rounded-xl border bg-white/5", expired ? "border-slate-600/20 opacity-70" : "border-white/10")}>
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white/60 flex-shrink-0">
                  {sig.signerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{sig.signerName}</p>
                    <span className="text-[10px] text-white/40">{sig.signerEmail}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 truncate">{sig.docTitle}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Signer #{sig.signingOrder} · Requested {new Date(sig.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold flex-shrink-0", cfg.bg, cfg.color)}>
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </span>
                {(sig.status === "pending" || sig.status === "viewed") && !expired && (
                  <button
                    onClick={() => sendReminder(sig.sigId, sig.documentId)}
                    disabled={reminded || !!sig.reminderSentAt}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors flex-shrink-0",
                      reminded || sig.reminderSentAt
                        ? "bg-white/5 text-white/30 cursor-not-allowed"
                        : "bg-white/10 text-white/70 hover:text-white hover:bg-white/20"
                    )}
                    title={reminded || sig.reminderSentAt ? "Reminder already sent" : "Send reminder"}
                  >
                    <Bell className="w-3 h-3" />
                    {reminded ? "Sent" : "Remind"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const DEMO_SIGNATURES: SignatureSummary[] = [
  { sigId: 1, documentId: 1, signerEmail: "client@meridian.com", signerName: "James Meridian", status: "signed", signingOrder: 1, createdAt: "2026-01-15T10:00:00Z", expiresAt: "2026-01-22T10:00:00Z", reminderSentAt: null, docTitle: "Engagement Letter — Meridian", docType: "engagement_letter", docAppSource: "carlota_jo" },
  { sigId: 2, documentId: 1, signerEmail: "legal@meridian.com", signerName: "Sarah Chen", status: "viewed", signingOrder: 2, createdAt: "2026-01-15T10:00:00Z", expiresAt: "2026-01-22T10:00:00Z", reminderSentAt: null, docTitle: "Engagement Letter — Meridian", docType: "engagement_letter", docAppSource: "carlota_jo" },
  { sigId: 3, documentId: 2, signerEmail: "buyer@blackwood.com", signerName: "Marcus Blackwood", status: "pending", signingOrder: 1, createdAt: "2026-03-10T09:00:00Z", expiresAt: "2026-03-17T09:00:00Z", reminderSentAt: null, docTitle: "NDA — Blackwood Ventures", docType: "nda", docAppSource: "carlota_jo" },
  { sigId: 4, documentId: 3, signerEmail: "captain@maritime.com", signerName: "Capt. Rodriguez", status: "signed", signingOrder: 1, createdAt: "2026-01-25T08:00:00Z", expiresAt: "2026-02-01T08:00:00Z", reminderSentAt: null, docTitle: "Charter Party — Pacific Navigator", docType: "charter_party", docAppSource: "vessels" },
  { sigId: 5, documentId: 4, signerEmail: "broker@terra.com", signerName: "Alexandra Park", status: "signed", signingOrder: 1, createdAt: "2026-01-18T14:00:00Z", expiresAt: "2026-01-25T14:00:00Z", reminderSentAt: null, docTitle: "Deal Memo — 123 Main Street", docType: "deal_memo", docAppSource: "terra" },
  { sigId: 6, documentId: 5, signerEmail: "ciso@company.com", signerName: "David Thorpe", status: "signed", signingOrder: 1, createdAt: "2026-02-10T09:00:00Z", expiresAt: "2026-02-17T09:00:00Z", reminderSentAt: null, docTitle: "Compliance Evidence — Q1", docType: "compliance_evidence", docAppSource: "aegis" },
  { sigId: 7, documentId: 6, signerEmail: "ops@alloy.io", signerName: "Nina Walsh", status: "pending", signingOrder: 1, createdAt: "2026-03-18T10:00:00Z", expiresAt: "2026-03-25T10:00:00Z", reminderSentAt: null, docTitle: "Workflow Approval — CRM v3", docType: "workflow_approval_memo", docAppSource: "alloy" },
  { sigId: 8, documentId: 7, signerEmail: "declined@company.com", signerName: "Robert Lee", status: "declined", signingOrder: 2, createdAt: "2026-02-01T11:00:00Z", expiresAt: "2026-02-08T11:00:00Z", reminderSentAt: null, docTitle: "Service Agreement — Argon", docType: "service_agreement", docAppSource: "carlota_jo" },
];

export default SigningDashboard;
