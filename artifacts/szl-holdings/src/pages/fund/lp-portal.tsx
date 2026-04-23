import { useEffect, useMemo, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, ChevronRight, User, TrendingUp, Download,
  FileText, FolderOpen, Eye, Clock, Activity, Send, Lock, Shield,
  CheckCircle2, MessageSquare, Filter, BarChart3, ImageIcon, Loader2,
  Upload, X, FileUp, AlertTriangle, CheckCircle, Bell, BellOff,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiRequest } from "@/lib/api";

type Permission = "gp_only" | "qualified_lp" | "all_lp" | "co_investor" | "public";
type LpTier = "all_lp" | "qualified_lp";

type LpRow = {
  id: number;
  name: string;
  contact: string | null;
  tier: LpTier;
  joinDate: string | null;
  isDemo: boolean;
};

type CapitalAccount = {
  lpId: number;
  lpName: string;
  tier: LpTier;
  contact: string | null;
  joinDate: string | null;
  commitmentCents: number;
  calledCents: number;
  uncalledCents: number;
  distributionsCents: number;
  currentNavCents: number;
  ownershipPct: number | null;
  unitsHeld: number | null;
  vintage: string | null;
};

type NavPoint = {
  id: number;
  navDate: string;
  period: string;
  navPerUnit: number | null;
  totalNavCents: number;
  distributedCents: number;
};

type DocItem = {
  id: number;
  name: string;
  folder: string;
  type: "pdf" | "xlsx" | "pptx" | "docx" | "csv" | "other";
  size: string;
  uploaded: string;
  permission: Permission;
  watermarked: boolean;
};

type DocsResponse = { data: DocItem[]; meta?: { totalAvailable?: number; visibleTiers?: string[]; accessTier?: LpTier } };
type LpsResponse = { data: LpRow[]; meta?: unknown };

type ReportItem = {
  id: number;
  period: string;
  generated: string;
  navPerUnit: number | null;
  irr: number | null;
  tvpi: number | null;
  dpi: number | null;
  size: string;
};

type ActivityEntry = {
  id: number | string;
  action: "Viewed" | "Downloaded" | "Messaged GP";
  target: string;
  time: string;
};

type MessageRow = {
  id: number;
  from: "lp" | "gp";
  author: string;
  body: string;
  time: string;
  sentAt: string;
};

type UploadDocType = "signed_agreement" | "wire_confirmation" | "kyc_document" | "other";

type UploadItem = {
  id: number;
  lpId: number;
  originalName: string;
  mimeType: string;
  size: number;
  docType: UploadDocType;
  status: "received" | "reviewed" | "accepted" | "rejected";
  notes: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const DOC_TYPE_LABELS: Record<UploadDocType, string> = {
  signed_agreement: "Signed Agreement",
  wire_confirmation: "Wire Confirmation",
  kyc_document: "KYC / AML Document",
  other: "Other Document",
};

const DOC_TYPE_COLORS: Record<UploadDocType, string> = {
  signed_agreement: "#6aaa72",
  wire_confirmation: "#4a90b8",
  kyc_document: "#d4a054",
  other: "#8b7ac8",
};

const STATUS_COLORS: Record<string, string> = {
  received: "#d4a054",
  reviewed: "#4a90b8",
  accepted: "#6aaa72",
  rejected: "#c45a4a",
};

const FILE_ICONS: Record<string, React.ElementType> = { pdf: FileText, xlsx: BarChart3, pptx: ImageIcon };
const FILE_COLORS: Record<string, string> = { pdf: "#c45a4a", xlsx: "#6aaa72", pptx: "#d4a054" };

function fmtMoneyCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const n = cents / 100;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtFileSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function KpiTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</span>
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      </div>
      <div className="text-2xl font-semibold text-white" style={{ fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{value}</div>
      {sub && <div className="text-[11px] text-white/40 mt-1">{sub}</div>}
    </div>
  );
}

type Tab = "overview" | "documents" | "reports" | "activity" | "messages" | "uploads" | "notifications";

type NotificationPrefs = {
  reports: boolean;
  documents: boolean;
  messages: boolean;
};

function unwrap<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export default function FundLpPortalPage() {
  const __pageMeta = usePageMeta({
    title: "LP Portal — SZL Holdings Fund",
    description: "Self-service LP portal: capital account, permissioned data room access, quarterly reports, activity log, GP messaging, and document uploads.",
    canonical: "https://szlholdings.com/fund/lp-portal",
  });

  const [lps, setLps] = useState<LpRow[]>([]);
  const [lpId, setLpId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    const validTabs: Tab[] = ["overview", "documents", "reports", "activity", "messages", "uploads", "notifications"];
    return (t && validTabs.includes(t as Tab) ? t : "overview") as Tab;
  });
  const [folderFilter, setFolderFilter] = useState<string>("All");

  const [account, setAccount] = useState<CapitalAccount | null>(null);
  const [navHistory, setNavHistory] = useState<NavPoint[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docsMeta, setDocsMeta] = useState<DocsResponse["meta"] | undefined>(undefined);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [messageDraft, setMessageDraft] = useState<string>("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({ reports: true, documents: true, messages: true });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  const [loading, setLoading] = useState(true);
  const [lpLoading, setLpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload form state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState<UploadDocType>("signed_agreement");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [lpsResp, navResp] = await Promise.all([
          apiRequest<LpsResponse>("GET", "/api/lp-portal/lps"),
          apiRequest<NavPoint[] | { data: NavPoint[] }>("GET", "/api/lp-portal/nav-history"),
        ]);
        if (cancelled) return;
        const roster = lpsResp.data ?? [];
        setLps(roster);
        setNavHistory(unwrap(navResp));
        if (roster.length > 0) setLpId(roster[0].id);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load LP portal");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (lpId == null) return;
    let cancelled = false;
    (async () => {
      try {
        setLpLoading(true);
        const [acctResp, docsResp, reportsResp, actResp, msgResp, uploadsResp, prefsResp] = await Promise.all([
          apiRequest<CapitalAccount | { data: CapitalAccount }>("GET", `/api/lp-portal/lps/${lpId}/capital-account`),
          apiRequest<DocsResponse>("GET", `/api/lp-portal/lps/${lpId}/documents`),
          apiRequest<ReportItem[] | { data: ReportItem[] }>("GET", `/api/lp-portal/lps/${lpId}/reports`),
          apiRequest<ActivityEntry[] | { data: ActivityEntry[] }>("GET", `/api/lp-portal/lps/${lpId}/activity`),
          apiRequest<MessageRow[] | { data: MessageRow[] }>("GET", `/api/lp-portal/lps/${lpId}/messages`),
          apiRequest<UploadItem[] | { data: UploadItem[] }>("GET", `/api/lp-portal/lps/${lpId}/uploads`).catch(() => ({ data: [] as UploadItem[] })),
          apiRequest<NotificationPrefs | { data: NotificationPrefs }>("GET", `/api/lp-portal/lps/${lpId}/notification-preferences`).catch(() => ({ data: { reports: true, documents: true, messages: true } as NotificationPrefs })),
        ]);
        if (cancelled) return;
        setAccount(unwrap(acctResp));
        setDocs(docsResp.data ?? []);
        setDocsMeta(docsResp.meta);
        setReports(unwrap(reportsResp));
        setActivity(unwrap(actResp));
        setMessages(unwrap(msgResp));
        setUploads(unwrap(uploadsResp as UploadItem[] | { data: UploadItem[] }));
        setNotifPrefs(unwrap(prefsResp as NotificationPrefs | { data: NotificationPrefs }));
        setFolderFilter("All");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load LP data");
      } finally {
        if (!cancelled) setLpLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lpId]);

  const folders = useMemo(() => {
    const set = new Set(docs.map(d => d.folder));
    return ["All", ...Array.from(set)];
  }, [docs]);
  const filteredDocs = folderFilter === "All" ? docs : docs.filter(d => d.folder === folderFilter);

  const lpName = account?.lpName ?? lps.find(l => l.id === lpId)?.name ?? "LP";
  const tier: LpTier = account?.tier ?? lps.find(l => l.id === lpId)?.tier ?? "all_lp";
  const contact = account?.contact ?? lps.find(l => l.id === lpId)?.contact ?? "";
  const joinDate = account?.joinDate ?? lps.find(l => l.id === lpId)?.joinDate ?? "—";

  const commitment = account?.commitmentCents ?? 0;
  const called = account?.calledCents ?? 0;
  const distributions = account?.distributionsCents ?? 0;
  const navShare = account?.currentNavCents ?? 0;
  const unitsHeld = account?.unitsHeld ?? 0;
  const calledPct = commitment > 0 ? (called / commitment) * 100 : 0;
  const moic = called > 0 ? (navShare + distributions) / called : 0;
  const dpi = called > 0 ? distributions / called : 0;
  const tvpi = moic;
  const totalValue = navShare + distributions;
  const latestNavPerUnit = navHistory.length > 0 ? (navHistory[navHistory.length - 1].navPerUnit ?? 0) : 0;

  const navChartData = navHistory.map((n, i) => {
    const cumDist = navHistory.slice(0, i + 1).reduce((s, x) => s + (x.distributedCents / 100), 0);
    const pct = (account?.ownershipPct ?? 0) / 100;
    return {
      period: n.period,
      "Position Value": Math.round(unitsHeld * (n.navPerUnit ?? 0)),
      "Cumulative Distributions": Math.round(pct * cumDist),
    };
  });

  async function logActivity(action: "viewed" | "downloaded" | "messaged_gp", target: string, extra?: { documentId?: number; reportId?: number }) {
    if (lpId == null) return;
    try {
      const resp = await apiRequest<{ data: ActivityEntry } | ActivityEntry>("POST", `/api/lp-portal/lps/${lpId}/activity`, { action, target, ...extra });
      const entry = unwrap(resp);
      setActivity(prev => [entry, ...prev]);
    } catch {
      // non-fatal
    }
  }

  const handleDownloadDoc = (doc: DocItem) => logActivity("downloaded", doc.name, { documentId: doc.id });
  const handleViewDoc = (doc: DocItem) => logActivity("viewed", doc.name, { documentId: doc.id });
  const handleDownloadReport = (r: ReportItem) => logActivity("downloaded", `${r.period} LP Report.pdf`, { reportId: r.id });

  async function handleSaveNotifPrefs(prefs: NotificationPrefs) {
    if (lpId == null) return;
    setNotifSaving(true);
    setNotifSaved(false);
    try {
      const resp = await apiRequest<NotificationPrefs | { data: NotificationPrefs }>(
        "PATCH",
        `/api/lp-portal/lps/${lpId}/notification-preferences`,
        prefs,
      );
      setNotifPrefs(unwrap(resp as NotificationPrefs | { data: NotificationPrefs }));
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    } catch {
      // non-fatal — prefs revert on next load
    } finally {
      setNotifSaving(false);
    }
  }

  async function handleSendMessage() {
    const body = messageDraft.trim();
    if (!body || lpId == null) return;
    try {
      const resp = await apiRequest<{ data: MessageRow } | MessageRow>("POST", `/api/lp-portal/lps/${lpId}/messages`, { body });
      const msg = unwrap(resp);
      setMessages(prev => [...prev, msg]);
      setActivity(prev => [{
        id: `live-${Date.now()}`,
        action: "Messaged GP",
        target: body.length > 60 ? `${body.slice(0, 57)}...` : body,
        time: "Just now",
      }, ...prev]);
      setMessageDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    }
  }

  async function handleSubmitUpload() {
    if (!uploadFile || lpId == null) return;
    setUploadProgress("uploading");
    setUploadError(null);
    try {
      const mimeType = uploadFile.type || "application/octet-stream";

      // Step 1: Request a presigned GCS upload URL (requires auth; silently falls back to
      // metadata-only demo mode if the user is not authenticated).
      let objectPath: string | undefined;
      try {
        const presignResp = await fetch("/api/storage/uploads/request-url", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: uploadFile.name,
            size: uploadFile.size,
            contentType: mimeType,
            domain: "lp_uploads",
          }),
        });
        if (presignResp.ok) {
          const presignData = await presignResp.json() as { uploadURL: string; objectPath: string };
          // Step 2: PUT the actual file bytes to GCS via the presigned URL.
          const putResp = await fetch(presignData.uploadURL, {
            method: "PUT",
            headers: { "Content-Type": mimeType },
            body: uploadFile,
          });
          if (!putResp.ok) throw new Error(`Storage upload failed: ${putResp.status}`);
          objectPath = presignData.objectPath;
        }
        // If 401/403 (demo / unauthenticated), fall through with no objectPath — backend will generate a placeholder.
      } catch (presignErr) {
        // Network error or GCS unavailable — proceed with metadata-only demo record.
        console.warn("Presigned upload unavailable, falling back to demo mode:", presignErr);
      }

      // Step 3: Register the upload record in the backend.
      const resp = await apiRequest<{ data: UploadItem } | UploadItem>("POST", `/api/lp-portal/lps/${lpId}/uploads`, {
        ...(objectPath ? { objectPath } : {}),
        originalName: uploadFile.name,
        docType: uploadDocType,
        notes: uploadNotes.trim() || undefined,
        mimeType,
        size: uploadFile.size,
      });
      const created = unwrap(resp);
      setUploads(prev => [created as UploadItem, ...prev]);
      setUploadProgress("success");
      setUploadFile(null);
      setUploadNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setUploadProgress("idle"), 3500);
    } catch (e) {
      setUploadProgress("error");
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  if (loading) {
    return (
    <>
      {__pageMeta}
        <div className="min-h-screen bg-[#080b10] text-white">
          <SiteNav />
          <main className="mx-auto max-w-7xl px-6 pt-28 pb-24 flex items-center justify-center">
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading LP portal…
            </div>
          </main>
          <SiteFooter />
        </div>
          </>
  );
  }

  if (error && lps.length === 0) {
    return (
      <div className="min-h-screen bg-[#080b10] text-white">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
          <div className="rounded-2xl border border-[#c45a4a]/30 bg-[#c45a4a]/[0.06] p-6 text-sm text-white/80">
            <div className="font-semibold text-white mb-1">Couldn't load LP portal</div>
            <div className="text-white/60">{error}</div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b10] text-white">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

          <div className="flex items-center gap-3 mb-6">
            <Link href="/fund">
              <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence
              </button>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-white/20" />
            <span className="text-xs text-white/60">LP Portal</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a90b8]/15">
                  <User className="h-3.5 w-3.5 text-[#4a90b8]" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4a90b8]">Limited Partner Portal</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Welcome back, {lpName}</h1>
              <p className="text-white/50 text-sm max-w-2xl">
                Self-service access to your capital account, permissioned data room documents, quarterly reports, activity history, direct messaging with the GP team, and document uploads.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 min-w-[260px]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-1.5">Signed in as</div>
              <select
                value={lpId ?? ""}
                onChange={e => { setLpId(Number(e.target.value)); setFolderFilter("All"); }}
                className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4a90b8]/50"
                data-testid="select-lp"
              >
                {lps.map(l => (
                  <option key={l.id} value={l.id} style={{ background: "#0d1117" }}>
                    {l.name} — {l.tier === "qualified_lp" ? "Qualified LP" : "All-LP tier"}
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-white/35 mt-1.5">{contact} · LP since {joinDate ?? "—"}</div>
            </div>
          </div>

          {lpLoading && (
            <div className="flex items-center gap-2 text-[10px] text-white/40 mb-4">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading capital account…
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <KpiTile label="Commitment" value={fmtMoneyCents(commitment)} sub={`${calledPct.toFixed(0)}% called`} color="#4a90b8" />
            <KpiTile label="Called Capital" value={fmtMoneyCents(called)} sub={`${fmtMoneyCents(commitment - called)} uncalled`} color="#d4a054" />
            <KpiTile label="Current NAV" value={fmtMoneyCents(navShare)} sub={`${unitsHeld.toLocaleString()} units · NAV/unit $${latestNavPerUnit.toFixed(3)}`} color="#6aaa72" />
            <KpiTile label="Distributions" value={fmtMoneyCents(distributions)} sub={`DPI ${dpi.toFixed(2)}×`} color="#8b7ac8" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <KpiTile label="Total Value" value={fmtMoneyCents(totalValue)} sub="NAV + cumulative distributions" color="#6aaa72" />
            <KpiTile label="MOIC" value={`${moic.toFixed(2)}×`} sub="Multiple on invested capital" color="#d4a054" />
            <KpiTile label="TVPI" value={`${tvpi.toFixed(2)}×`} sub="Total value to paid-in" color="#4a90b8" />
            <KpiTile label="Docs / Uploads" value={`${docs.length} / ${uploads.length}`} sub={`${reports.length} quarterly reports`} color="#8b7ac8" />
          </div>

          <div className="flex flex-wrap gap-1 mb-6 border-b border-white/[0.06]">
            {([
              { key: "overview", label: "Overview" },
              { key: "documents", label: "Data Room" },
              { key: "reports", label: "Quarterly Reports" },
              { key: "activity", label: "Activity Log" },
              { key: "messages", label: "Messages" },
              { key: "uploads", label: "My Uploads" },
              { key: "notifications", label: "Notifications" },
            ] as Array<{ key: Tab; label: string }>).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                data-testid={`tab-${t.key}`}
                className={`px-4 py-2.5 text-xs font-semibold transition border-b-2 ${tab === t.key ? "text-white border-[#4a90b8]" : "text-white/40 border-transparent hover:text-white/70"}`}
              >
                {t.label}
                {t.key === "uploads" && uploads.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-[#4a90b8]/20 px-1.5 py-0.5 text-[9px] text-[#4a90b8]">
                    {uploads.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "overview" && (
              <m.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-[#6aaa72]" />
                    <span className="text-sm font-semibold text-white">Your Position Value Over Time</span>
                    <span className="ml-auto text-[10px] text-white/35">USD, by quarter</span>
                  </div>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={navChartData} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                        <defs>
                          <linearGradient id="lpNavGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#4a90b8" stopOpacity={0.55} />
                            <stop offset="100%" stopColor="#4a90b8" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="lpDistGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#6aaa72" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#6aaa72" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="hsla(0,0%,100%,0.05)" />
                        <XAxis dataKey="period" tick={{ fontSize: 10, fill: "hsl(210,5%,48%)" }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 9, fill: "hsl(210,5%,38%)" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#0d1117", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: 6, fontSize: 11 }}
                          formatter={(v: number) => `$${v.toLocaleString()}`}
                        />
                        <Area type="monotone" dataKey="Position Value" stroke="#4a90b8" strokeWidth={2} fill="url(#lpNavGrad)" />
                        <Area type="monotone" dataKey="Cumulative Distributions" stroke="#6aaa72" strokeWidth={2} fill="url(#lpDistGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FolderOpen className="h-4 w-4 text-[#d4a054]" />
                      <span className="text-sm font-semibold text-white">Latest Documents</span>
                    </div>
                    <div className="space-y-2">
                      {docs.slice(0, 4).map(d => {
                        const Icon = FILE_ICONS[d.type] ?? FileText;
                        return (
                          <button
                            key={d.id}
                            onClick={() => { setTab("documents"); handleViewDoc(d); }}
                            className="w-full flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2 hover:bg-white/[0.04] transition-colors text-left"
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" style={{ color: FILE_COLORS[d.type] }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-white truncate">{d.name}</div>
                              <div className="text-[10px] text-white/40">{d.uploaded}</div>
                            </div>
                          </button>
                        );
                      })}
                      {docs.length === 0 && (
                        <div className="text-[11px] text-white/35">No documents available.</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-[#4a90b8]" />
                      <span className="text-sm font-semibold text-white">Most Recent Report</span>
                    </div>
                    {reports.length > 0 ? (
                      <>
                        <div className="text-xs text-white/40 mb-1">{reports[0].period} · Generated {reports[0].generated}</div>
                        <div className="grid grid-cols-2 gap-2 mt-3 mb-4">
                          <div className="rounded-lg bg-white/[0.03] p-2">
                            <div className="text-[10px] uppercase tracking-wider text-white/40">Net IRR</div>
                            <div className="text-base font-semibold text-white">{reports[0].irr ?? "—"}%</div>
                          </div>
                          <div className="rounded-lg bg-white/[0.03] p-2">
                            <div className="text-[10px] uppercase tracking-wider text-white/40">TVPI</div>
                            <div className="text-base font-semibold text-white">{reports[0].tvpi ?? "—"}×</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadReport(reports[0])}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#4a90b8] px-3 py-2 text-xs font-semibold text-black hover:bg-[#4a90b8]/90 transition-colors"
                          data-testid="button-download-latest-report"
                        >
                          <Download className="h-3.5 w-3.5" /> Download {reports[0].period} Report
                        </button>
                      </>
                    ) : (
                      <div className="text-[11px] text-white/35">No quarterly reports yet.</div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-4 w-4 text-[#8b7ac8]" />
                      <span className="text-sm font-semibold text-white">Recent Activity</span>
                    </div>
                    <div className="space-y-2.5">
                      {activity.slice(0, 5).map(e => (
                        <div key={e.id} className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: e.action === "Downloaded" ? "#c45a4a" : e.action === "Viewed" ? "#4a90b8" : "#6aaa72" }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-white">{e.action}: <span className="text-white/60">{e.target}</span></div>
                            <div className="text-[10px] text-white/35">{e.time}</div>
                          </div>
                        </div>
                      ))}
                      {activity.length === 0 && (
                        <div className="text-[11px] text-white/35">No activity yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </m.div>
            )}

            {tab === "documents" && (
              <m.div key="documents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <Filter className="h-3.5 w-3.5 text-white/40" />
                  {folders.map(f => (
                    <button
                      key={f}
                      onClick={() => setFolderFilter(f)}
                      data-testid={`filter-folder-${f}`}
                      className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${folderFilter === f ? "bg-[#4a90b8] text-black" : "bg-white/[0.04] text-white/45 hover:bg-white/[0.07]"}`}
                    >
                      {f}
                    </button>
                  ))}
                  <span className="ml-auto text-[10px] text-white/35">
                    Showing {filteredDocs.length} of {docs.length} permissioned
                    {docsMeta?.totalAvailable != null ? ` · ${Math.max(0, docsMeta.totalAvailable - docs.length)} restricted` : ""}
                  </span>
                </div>

                <div className="rounded-2xl border border-[#4a90b8]/20 bg-[#4a90b8]/[0.04] p-4 mb-5 flex items-start gap-3">
                  <Shield className="h-4 w-4 text-[#4a90b8] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-white/65">
                    Your access tier is <strong className="text-white">{tier === "qualified_lp" ? "Qualified LP" : "All-LP"}</strong>. You can see all documents tagged <em>All LPs</em>{tier === "qualified_lp" ? " and Qualified LP" : ""}. GP-only and co-investor materials are filtered out by the server.
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredDocs.map((doc, i) => {
                    const Icon = FILE_ICONS[doc.type] ?? FileText;
                    return (
                      <m.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025 }}
                        className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: FILE_COLORS[doc.type] }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{doc.name}</div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-white/35">{doc.folder}</span>
                            <span className="text-[10px] text-white/35">{doc.size}</span>
                            <span className="text-[10px] text-white/35">{doc.uploaded}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {doc.watermarked && (
                            <span className="text-[9px] text-[#d4a054] border border-[#d4a054]/30 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider">Watermarked</span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                            style={{ color: doc.permission === "qualified_lp" ? "#d4a054" : "#6aaa72", borderColor: `${doc.permission === "qualified_lp" ? "#d4a054" : "#6aaa72"}30`, background: `${doc.permission === "qualified_lp" ? "#d4a054" : "#6aaa72"}12` }}>
                            <Lock className="h-2.5 w-2.5" />
                            {doc.permission === "qualified_lp" ? "Qualified LP" : "All LPs"}
                          </span>
                          <button
                            onClick={() => handleViewDoc(doc)}
                            data-testid={`button-view-${doc.id}`}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 bg-white/[0.04] text-xs text-white/60 hover:bg-white/[0.08] hover:text-white transition-colors"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            onClick={() => handleDownloadDoc(doc)}
                            data-testid={`button-download-${doc.id}`}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 bg-[#4a90b8]/15 text-xs text-[#4a90b8] hover:bg-[#4a90b8]/25 transition-colors"
                          >
                            <Download className="h-3 w-3" /> Download
                          </button>
                        </div>
                      </m.div>
                    );
                  })}
                  {filteredDocs.length === 0 && (
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-white/40">
                      No documents in this folder for your access tier.
                    </div>
                  )}
                </div>
              </m.div>
            )}

            {tab === "reports" && (
              <m.div key="reports" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_1fr_0.8fr] gap-3 px-5 py-3 border-b border-white/[0.06] bg-black/20 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">
                    <div>Period</div>
                    <div>Generated</div>
                    <div>Net IRR</div>
                    <div>TVPI</div>
                    <div>DPI</div>
                    <div>NAV / Unit</div>
                    <div className="text-right">Action</div>
                  </div>
                  {reports.map((r, i) => (
                    <m.div
                      key={r.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_1fr_0.8fr] gap-3 px-5 py-3.5 border-b border-white/[0.04] items-center hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a90b8]/15">
                          <FileText className="h-3.5 w-3.5 text-[#4a90b8]" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{r.period}</div>
                          <div className="text-[10px] text-white/35">{r.size}</div>
                        </div>
                      </div>
                      <div className="text-xs text-white/55">{r.generated}</div>
                      <div className="text-sm text-white font-semibold">{r.irr ?? "—"}%</div>
                      <div className="text-sm text-white font-semibold">{r.tvpi ?? "—"}×</div>
                      <div className="text-sm text-white font-semibold">{r.dpi ?? "—"}×</div>
                      <div className="text-sm text-white">${(r.navPerUnit ?? 0).toFixed(3)}</div>
                      <div className="text-right">
                        <button
                          onClick={() => handleDownloadReport(r)}
                          data-testid={`button-download-report-${r.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#4a90b8]/15 px-3 py-1.5 text-xs text-[#4a90b8] hover:bg-[#4a90b8]/25 transition-colors"
                        >
                          <Download className="h-3 w-3" /> PDF
                        </button>
                      </div>
                    </m.div>
                  ))}
                  {reports.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-white/40">No quarterly reports available yet.</div>
                  )}
                </div>
              </m.div>
            )}

            {tab === "activity" && (
              <m.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#8b7ac8]" />
                    <span className="text-sm font-semibold text-white">Your Activity</span>
                    <span className="ml-auto text-[10px] text-white/35">{activity.length} events</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {activity.map(e => (
                      <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex-shrink-0">
                          {e.action === "Downloaded" ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c45a4a]/10">
                              <Download className="h-3.5 w-3.5 text-[#c45a4a]" />
                            </div>
                          ) : e.action === "Viewed" ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a90b8]/10">
                              <Eye className="h-3.5 w-3.5 text-[#4a90b8]" />
                            </div>
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6aaa72]/10">
                              <MessageSquare className="h-3.5 w-3.5 text-[#6aaa72]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white"><span className="font-medium">{e.action}</span>: <span className="text-white/60">{e.target}</span></div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="h-3 w-3 text-white/30" />
                            <span className="text-[10px] text-white/40">{e.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {activity.length === 0 && (
                      <div className="px-5 py-8 text-center text-sm text-white/40">No activity recorded yet.</div>
                    )}
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-[#6aaa72]/20 bg-[#6aaa72]/[0.04] p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#6aaa72] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-white/65">
                    Your activity log is private to you and the GP team. Events are immutably recorded server-side for 7 years to satisfy ILPA reporting and audit requirements.
                  </div>
                </div>
              </m.div>
            )}

            {tab === "messages" && (
              <m.div key="messages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#6aaa72]" />
                    <span className="text-sm font-semibold text-white">Direct Line to GP Team</span>
                    <span className="ml-auto text-[10px] text-white/35">Typical reply within 1 business day</span>
                  </div>
                  <div className="px-5 py-5 space-y-3 max-h-[420px] overflow-y-auto">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.from === "lp" ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-[75%] rounded-2xl px-4 py-2.5"
                          style={{
                            background: msg.from === "lp" ? "#4a90b8" : "rgba(255,255,255,0.04)",
                            color: msg.from === "lp" ? "#000" : "rgba(255,255,255,0.85)",
                            border: msg.from === "lp" ? "none" : "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 opacity-70">
                            {msg.author}
                          </div>
                          <div className="text-sm leading-relaxed">{msg.body}</div>
                          <div className="text-[10px] mt-1.5 opacity-60">{msg.time}</div>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-center text-sm text-white/40 py-6">No messages yet. Start the conversation below.</div>
                    )}
                  </div>
                  <div className="border-t border-white/[0.06] p-4 flex gap-2">
                    <input
                      value={messageDraft}
                      onChange={e => setMessageDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSendMessage(); }}
                      placeholder="Send a message to the GP team..."
                      data-testid="input-message"
                      className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6aaa72]/50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageDraft.trim()}
                      data-testid="button-send-message"
                      className="flex items-center gap-2 rounded-xl bg-[#6aaa72] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#6aaa72]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="h-3.5 w-3.5" /> Send
                    </button>
                  </div>
                </div>
              </m.div>
            )}

            {tab === "uploads" && (
              <m.div key="uploads" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

                {/* Upload form */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 mb-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FileUp className="h-4 w-4 text-[#4a90b8]" />
                    <span className="text-sm font-semibold text-white">Upload Document to GP</span>
                    <span className="ml-auto text-[10px] text-white/35">Signed agreements, wire confirmations, KYC files</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 mb-1.5">
                        Document Type
                      </label>
                      <select
                        value={uploadDocType}
                        onChange={e => setUploadDocType(e.target.value as UploadDocType)}
                        className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4a90b8]/50"
                        data-testid="select-upload-doc-type"
                      >
                        <option value="signed_agreement" style={{ background: "#0d1117" }}>Signed Agreement</option>
                        <option value="wire_confirmation" style={{ background: "#0d1117" }}>Wire Confirmation</option>
                        <option value="kyc_document" style={{ background: "#0d1117" }}>KYC / AML Document</option>
                        <option value="other" style={{ background: "#0d1117" }}>Other Document</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 mb-1.5">
                        File
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.csv"
                          onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                          className="hidden"
                          data-testid="input-upload-file"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.07] transition-colors"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {uploadFile ? "Change file" : "Choose file"}
                        </button>
                        {uploadFile && (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <FileText className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />
                            <span className="text-xs text-white/70 truncate">{uploadFile.name}</span>
                            <span className="text-[10px] text-white/35 flex-shrink-0">({fmtFileSize(uploadFile.size)})</span>
                            <button
                              onClick={() => { setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                              className="ml-auto text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 mb-1.5">
                      Notes to GP (optional)
                    </label>
                    <textarea
                      value={uploadNotes}
                      onChange={e => setUploadNotes(e.target.value)}
                      placeholder="e.g., Signed subscription agreement for Fund II, wire sent on Apr 23 for $500K capital call..."
                      rows={2}
                      className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#4a90b8]/50 resize-none"
                      data-testid="input-upload-notes"
                    />
                  </div>

                  {uploadProgress === "error" && uploadError && (
                    <div className="mb-4 rounded-xl border border-[#c45a4a]/30 bg-[#c45a4a]/[0.07] p-3 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#c45a4a] flex-shrink-0" />
                      <span className="text-xs text-[#c45a4a]">{uploadError}</span>
                    </div>
                  )}

                  {uploadProgress === "success" && (
                    <div className="mb-4 rounded-xl border border-[#6aaa72]/30 bg-[#6aaa72]/[0.07] p-3 flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-[#6aaa72] flex-shrink-0" />
                      <span className="text-xs text-[#6aaa72]">Document submitted — the GP team will review it shortly.</span>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitUpload}
                    disabled={!uploadFile || uploadProgress === "uploading"}
                    data-testid="button-submit-upload"
                    className="flex items-center gap-2 rounded-xl bg-[#4a90b8] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#4a90b8]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploadProgress === "uploading" ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…</>
                    ) : (
                      <><FileUp className="h-3.5 w-3.5" /> Submit to GP</>
                    )}
                  </button>
                </div>

                {/* Upload history */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                    <Upload className="h-4 w-4 text-[#4a90b8]" />
                    <span className="text-sm font-semibold text-white">Submitted Documents</span>
                    <span className="ml-auto text-[10px] text-white/35">{uploads.length} total</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {uploads.map((u, i) => (
                      <m.div
                        key={u.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                          style={{ background: `${DOC_TYPE_COLORS[u.docType as UploadDocType] ?? "#8b7ac8"}18` }}>
                          <FileText className="h-4 w-4" style={{ color: DOC_TYPE_COLORS[u.docType as UploadDocType] ?? "#8b7ac8" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{u.originalName}</div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-white/40">{DOC_TYPE_LABELS[u.docType as UploadDocType] ?? u.docType}</span>
                            <span className="text-[10px] text-white/30">{fmtFileSize(u.size)}</span>
                            <span className="text-[10px] text-white/30">
                              {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {u.notes && (
                              <span className="text-[10px] text-white/40 italic truncate max-w-[200px]" title={u.notes}>
                                {u.notes}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] flex-shrink-0"
                          style={{
                            color: STATUS_COLORS[u.status] ?? "#8b7ac8",
                            borderColor: `${STATUS_COLORS[u.status] ?? "#8b7ac8"}30`,
                            background: `${STATUS_COLORS[u.status] ?? "#8b7ac8"}12`,
                          }}
                        >
                          {u.status}
                        </span>
                      </m.div>
                    ))}
                    {uploads.length === 0 && (
                      <div className="px-5 py-8 text-center text-sm text-white/40">
                        No documents submitted yet. Use the form above to send signed agreements or other documents to the GP.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[#4a90b8]/20 bg-[#4a90b8]/[0.04] p-4 flex items-start gap-3">
                  <Shield className="h-4 w-4 text-[#4a90b8] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-white/65">
                    All uploaded documents are transmitted securely over TLS, virus-scanned on receipt, and stored in our encrypted document vault. Access is limited to you and the GP team. Documents are retained per your LPA data retention terms.
                  </div>
                </div>
              </m.div>
            )}
            {tab === "notifications" && (
              <m.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-4 w-4 text-[#d4a054]" />
                    <span className="text-sm font-semibold text-white">Email Notification Preferences</span>
                  </div>
                  <p className="text-xs text-white/45 mb-6">
                    Control which email notifications you receive from the GP. Changes take effect immediately. You can re-enable at any time.
                  </p>

                  <div className="space-y-4">
                    {(
                      [
                        {
                          key: "reports" as keyof NotificationPrefs,
                          label: "Quarterly Reports & Fund Updates",
                          description: "Receive an email when the GP publishes a new quarterly report, annual report, or capital call notice.",
                          color: "#4a90b8",
                        },
                        {
                          key: "documents" as keyof NotificationPrefs,
                          label: "New Data Room Documents",
                          description: "Receive an email when a new document is added to your permissioned data room.",
                          color: "#6aaa72",
                        },
                        {
                          key: "messages" as keyof NotificationPrefs,
                          label: "Messages from the GP Team",
                          description: "Receive an email summary with a deep link when the GP sends you a new secure message.",
                          color: "#8b7ac8",
                        },
                      ] as Array<{ key: keyof NotificationPrefs; label: string; description: string; color: string }>
                    ).map(({ key, label, description, color }) => {
                      const enabled = notifPrefs[key];
                      return (
                        <div
                          key={key}
                          className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.015] px-5 py-4"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg"
                              style={{ background: `${color}18` }}
                            >
                              {enabled
                                ? <Bell className="h-4 w-4" style={{ color }} />
                                : <BellOff className="h-4 w-4 text-white/30" />
                              }
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white mb-0.5">{label}</div>
                            <div className="text-xs text-white/45">{description}</div>
                          </div>
                          <button
                            data-testid={`toggle-notif-${key}`}
                            onClick={() => handleSaveNotifPrefs({ ...notifPrefs, [key]: !enabled })}
                            disabled={notifSaving}
                            className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${enabled ? "bg-[#4a90b8]" : "bg-white/[0.12]"}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {notifSaved && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#6aaa72]/30 bg-[#6aaa72]/[0.07] px-4 py-3">
                      <CheckCircle className="h-3.5 w-3.5 text-[#6aaa72] flex-shrink-0" />
                      <span className="text-xs text-[#6aaa72]">Preferences saved.</span>
                    </div>
                  )}

                  {notifSaving && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#d4a054]/20 bg-[#d4a054]/[0.04] p-4 flex items-start gap-3">
                  <Shield className="h-4 w-4 text-[#d4a054] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-white/65">
                    All emails are sent from <strong>investor-relations@szlholdings.com</strong>. You can unsubscribe from individual channels above or contact your GP to be fully removed from all communications.
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>

        </m.div>
      </main>
      <SiteFooter />
    </div>
  );
}
