import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  FolderOpen, ArrowLeft, Lock, Eye, Download, Shield, FileText,
  Users, Clock, AlertTriangle, CheckCircle2, ChevronRight, Search,
  Plus, X, Filter, Activity, Folder, File, ImageIcon, BarChart3,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

type Permission = "gp_only" | "qualified_lp" | "all_lp" | "co_investor" | "public";
type DocStatus = "current" | "superseded" | "pending_review";

type DocItem = {
  id: string;
  name: string;
  type: "pdf" | "xlsx" | "pptx" | "img" | "doc";
  size: string;
  uploaded: string;
  uploadedBy: string;
  permission: Permission;
  status: DocStatus;
  views: number;
  downloads: number;
  watermarked: boolean;
};

type Folder = {
  id: string;
  name: string;
  permission: Permission;
  docCount: number;
  lastUpdated: string;
  description: string;
  color: string;
  docs: DocItem[];
};

const FOLDERS: Folder[] = [
  {
    id: "f1", name: "Fund Overview & Strategy", permission: "all_lp", docCount: 8,
    lastUpdated: "Apr 12, 2026", description: "Fund thesis, strategy, and team overview materials",
    color: "#d4a054",
    docs: [
      { id: "d1", name: "SZL Fund II — Investment Memorandum.pdf", type: "pdf", size: "4.2 MB", uploaded: "Apr 12, 2026", uploadedBy: "S. Lutar", permission: "all_lp", status: "current", views: 142, downloads: 38, watermarked: true },
      { id: "d2", name: "Fund II Pitch Deck — LP Edition.pptx", type: "pptx", size: "12.8 MB", uploaded: "Apr 10, 2026", uploadedBy: "S. Lutar", permission: "all_lp", status: "current", views: 98, downloads: 22, watermarked: true },
      { id: "d3", name: "Team Biographies & Track Record.pdf", type: "pdf", size: "2.1 MB", uploaded: "Mar 28, 2026", uploadedBy: "S. Lutar", permission: "all_lp", status: "current", views: 67, downloads: 15, watermarked: false },
      { id: "d4", name: "Investment Committee Charter.pdf", type: "pdf", size: "0.8 MB", uploaded: "Mar 1, 2026", uploadedBy: "Ops Team", permission: "qualified_lp", status: "current", views: 31, downloads: 8, watermarked: false },
    ],
  },
  {
    id: "f2", name: "Financial Statements & NAV", permission: "qualified_lp", docCount: 12,
    lastUpdated: "Apr 14, 2026", description: "Audited financials, NAV calculations, and capital account statements",
    color: "#4a90b8",
    docs: [
      { id: "d5", name: "Fund II — Q1 2026 Financial Statements.pdf", type: "pdf", size: "3.6 MB", uploaded: "Apr 14, 2026", uploadedBy: "CFO", permission: "qualified_lp", status: "current", views: 84, downloads: 29, watermarked: true },
      { id: "d6", name: "2025 Audited Financial Statements.pdf", type: "pdf", size: "5.1 MB", uploaded: "Mar 15, 2026", uploadedBy: "Deloitte", permission: "qualified_lp", status: "current", views: 112, downloads: 45, watermarked: true },
      { id: "d7", name: "LP Capital Account Statements — Q1 2026.xlsx", type: "xlsx", size: "1.8 MB", uploaded: "Apr 14, 2026", uploadedBy: "CFO", permission: "qualified_lp", status: "current", views: 63, downloads: 41, watermarked: true },
      { id: "d8", name: "NAV Methodology & Valuation Policy.pdf", type: "pdf", size: "1.2 MB", uploaded: "Jan 10, 2026", uploadedBy: "CFO", permission: "qualified_lp", status: "current", views: 28, downloads: 12, watermarked: false },
    ],
  },
  {
    id: "f3", name: "Portfolio Company Updates", permission: "all_lp", docCount: 24,
    lastUpdated: "Apr 13, 2026", description: "Quarterly updates, KPI reports, and board materials from portfolio companies",
    color: "#6aaa72",
    docs: [
      { id: "d9", name: "Vessels — Q1 2026 Board Update.pdf", type: "pdf", size: "2.8 MB", uploaded: "Apr 13, 2026", uploadedBy: "Vessels Team", permission: "all_lp", status: "current", views: 71, downloads: 18, watermarked: true },
      { id: "d10", name: "Aegis — Q1 2026 Operational Report.pdf", type: "pdf", size: "3.2 MB", uploaded: "Apr 11, 2026", uploadedBy: "Aegis Team", permission: "all_lp", status: "current", views: 88, downloads: 24, watermarked: true },
      { id: "d11", name: "Terra — Q1 2026 KPI Dashboard.xlsx", type: "xlsx", size: "1.4 MB", uploaded: "Apr 10, 2026", uploadedBy: "Terra Team", permission: "all_lp", status: "current", views: 54, downloads: 16, watermarked: true },
      { id: "d12", name: "Lyte — Q1 2026 Product Roadmap Update.pptx", type: "pptx", size: "6.4 MB", uploaded: "Apr 9, 2026", uploadedBy: "Lyte Team", permission: "all_lp", status: "current", views: 42, downloads: 11, watermarked: false },
    ],
  },
  {
    id: "f4", name: "Legal & Compliance", permission: "gp_only", docCount: 18,
    lastUpdated: "Apr 5, 2026", description: "Fund formation docs, LPA, side letters, regulatory filings",
    color: "#c45a4a",
    docs: [
      { id: "d13", name: "Limited Partnership Agreement — Fund II.pdf", type: "pdf", size: "8.2 MB", uploaded: "Jan 15, 2026", uploadedBy: "Counsel", permission: "gp_only", status: "current", views: 22, downloads: 9, watermarked: false },
      { id: "d14", name: "Form D Filing — Fund II.pdf", type: "pdf", size: "0.6 MB", uploaded: "Feb 1, 2026", uploadedBy: "Counsel", permission: "gp_only", status: "current", views: 14, downloads: 6, watermarked: false },
      { id: "d15", name: "Side Letter — Meridian Capital.pdf", type: "pdf", size: "1.1 MB", uploaded: "Jan 20, 2026", uploadedBy: "Counsel", permission: "gp_only", status: "current", views: 8, downloads: 3, watermarked: true },
      { id: "d16", name: "Management Company Agreement.pdf", type: "pdf", size: "2.4 MB", uploaded: "Jan 15, 2026", uploadedBy: "Counsel", permission: "gp_only", status: "current", views: 11, downloads: 4, watermarked: false },
    ],
  },
  {
    id: "f5", name: "Due Diligence — Active Deals", permission: "co_investor", docCount: 15,
    lastUpdated: "Apr 14, 2026", description: "Deal-specific diligence materials for co-investment opportunities",
    color: "#8b7ac8",
    docs: [
      { id: "d17", name: "NovaStar AI — Data Room Index.pdf", type: "pdf", size: "0.4 MB", uploaded: "Apr 14, 2026", uploadedBy: "S. Lutar", permission: "co_investor", status: "current", views: 34, downloads: 12, watermarked: true },
      { id: "d18", name: "NovaStar AI — Technical Architecture Review.pdf", type: "pdf", size: "3.8 MB", uploaded: "Apr 12, 2026", uploadedBy: "Tech Team", permission: "co_investor", status: "current", views: 28, downloads: 9, watermarked: true },
      { id: "d19", name: "NovaStar AI — Reference Check Summary.pdf", type: "pdf", size: "1.2 MB", uploaded: "Apr 10, 2026", uploadedBy: "S. Lutar", permission: "co_investor", status: "current", views: 19, downloads: 7, watermarked: true },
      { id: "d20", name: "NovaStar AI — Cap Table & 409A.xlsx", type: "xlsx", size: "0.9 MB", uploaded: "Apr 8, 2026", uploadedBy: "CFO", permission: "co_investor", status: "current", views: 15, downloads: 6, watermarked: true },
    ],
  },
  {
    id: "f6", name: "ESG & Impact Reports", permission: "all_lp", docCount: 6,
    lastUpdated: "Apr 1, 2026", description: "ESG scoring, DEI metrics, and impact measurement reports",
    color: "#6aaa72",
    docs: [
      { id: "d21", name: "SZL Fund II — 2025 ESG Annual Report.pdf", type: "pdf", size: "4.1 MB", uploaded: "Apr 1, 2026", uploadedBy: "ESG Team", permission: "all_lp", status: "current", views: 58, downloads: 21, watermarked: false },
      { id: "d22", name: "Portfolio DEI Metrics — 2025.xlsx", type: "xlsx", size: "1.6 MB", uploaded: "Mar 28, 2026", uploadedBy: "ESG Team", permission: "all_lp", status: "current", views: 44, downloads: 16, watermarked: false },
    ],
  },
];

const AUDIT_LOG = [
  { id: "a1", user: "Meridian Capital (LP)", action: "Downloaded", doc: "Fund II — Q1 2026 Financial Statements.pdf", time: "2 hours ago", ip: "142.250.x.x" },
  { id: "a2", user: "Astor Family Office (LP)", action: "Viewed", doc: "SZL Fund II — Investment Memorandum.pdf", time: "4 hours ago", ip: "104.18.x.x" },
  { id: "a3", user: "Blackrock Endowment (LP)", action: "Downloaded", doc: "2025 Audited Financial Statements.pdf", time: "6 hours ago", ip: "8.8.x.x" },
  { id: "a4", user: "NovaStar Co-Investor (CI)", action: "Viewed", doc: "NovaStar AI — Technical Architecture Review.pdf", time: "8 hours ago", ip: "172.16.x.x" },
  { id: "a5", user: "Internal — S. Lutar", action: "Uploaded", doc: "Vessels — Q1 2026 Board Update.pdf", time: "Yesterday 3:42 PM", ip: "10.0.x.x" },
  { id: "a6", user: "Greenway Ventures (CI)", action: "Downloaded", doc: "NovaStar AI — Cap Table & 409A.xlsx", time: "Yesterday 11:22 AM", ip: "34.120.x.x" },
];

const PERM_LABELS: Record<Permission, { label: string; color: string }> = {
  gp_only: { label: "GP Only", color: "#c45a4a" },
  qualified_lp: { label: "Qualified LP", color: "#d4a054" },
  all_lp: { label: "All LPs", color: "#6aaa72" },
  co_investor: { label: "Co-Investor", color: "#8b7ac8" },
  public: { label: "Public", color: "#4a90b8" },
};

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  xlsx: BarChart3,
  pptx: ImageIcon,
  img: ImageIcon,
  doc: FileText,
};

function PermBadge({ permission }: { permission: Permission }) {
  const { label, color } = PERM_LABELS[permission];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
      style={{ color, borderColor: `${color}30`, background: `${color}12` }}>
      <Lock className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function FileTypeIcon({ type }: { type: string }) {
  const Icon = FILE_ICONS[type] ?? FileText;
  const colors: Record<string, string> = { pdf: "#c45a4a", xlsx: "#6aaa72", pptx: "#d4a054", img: "#4a90b8", doc: "#8b7ac8" };
  return <Icon className="h-4 w-4 flex-shrink-0" style={{ color: colors[type] ?? "#ffffff60" }} />;
}

export default function DataRoomPage() {
  const __pageMeta = usePageMeta({
    title: "Virtual Data Room — SZL Holdings Fund",
    description: "Secure, permission-controlled document repository for fund due diligence, LP reporting, and co-investment materials.",
    canonical: "https://szlholdings.com/fund/data-room",
  });

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [activeTab, setActiveTab] = useState<"folders" | "audit">("folders");
  const [search, setSearch] = useState("");
  const [permFilter, setPermFilter] = useState<Permission | "all">("all");

  const filteredFolders = FOLDERS.filter(f => {
    if (permFilter !== "all" && f.permission !== permFilter) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalDocs = FOLDERS.reduce((s, f) => s + f.docCount, 0);
  const totalViews = FOLDERS.flatMap(f => f.docs).reduce((s, d) => s + d.views, 0);
  const totalDownloads = FOLDERS.flatMap(f => f.docs).reduce((s, d) => s + d.downloads, 0);

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#080b10] text-white">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
  
            <div className="flex items-center gap-3 mb-6">
              <Link href="/fund">
                <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence
                </button>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-white/20" />
              <span className="text-xs text-white/60">Virtual Data Room</span>
            </div>
  
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4a054]/15">
                    <FolderOpen className="h-3.5 w-3.5 text-[#d4a054]" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4a054]">Secure Repository</span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Virtual Data Room</h1>
                <p className="text-white/50 text-sm max-w-xl">
                  Permission-controlled document repository with watermarked viewing, download tracking, and full activity audit logs.
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-xl bg-[#d4a054] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#d4a054]/90 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Upload Document
              </button>
            </div>
  
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Documents", value: String(totalDocs), icon: FileText, color: "#d4a054" },
                { label: "Total Folders", value: String(FOLDERS.length), icon: Folder, color: "#4a90b8" },
                { label: "Views (30d)", value: String(totalViews), icon: Eye, color: "#6aaa72" },
                { label: "Downloads (30d)", value: String(totalDownloads), icon: Download, color: "#8b7ac8" },
              ].map(m => (
                <div key={m.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20" style={{ color: m.color }}>
                      <m.icon className="h-4 w-4" />
                    </div>
                    <Shield className="h-3.5 w-3.5 text-white/20" />
                  </div>
                  <div className="text-2xl font-semibold text-white">{m.value}</div>
                  <div className="text-xs text-white/40 mt-1">{m.label}</div>
                </div>
              ))}
            </div>
  
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search folders..."
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#d4a054]/40"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-white/40" />
                {(["all", "gp_only", "qualified_lp", "all_lp", "co_investor"] as const).map(p => (
                  <button key={p} onClick={() => setPermFilter(p)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${permFilter === p ? "bg-[#d4a054] text-black" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>
                    {p === "all" ? "All" : PERM_LABELS[p].label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 ml-auto">
                {(["folders", "audit"] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${activeTab === t ? "bg-white/[0.08] text-white" : "text-white/35 hover:text-white/60"}`}>
                    {t === "folders" ? "Folders" : "Audit Log"}
                  </button>
                ))}
              </div>
            </div>
  
            <AnimatePresence mode="wait">
              {activeTab === "folders" ? (
                <m.div key="folders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {selectedFolder ? (
                    <div>
                      <button onClick={() => setSelectedFolder(null)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-5 transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to Folders
                      </button>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20" style={{ color: selectedFolder.color }}>
                          <FolderOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-white">{selectedFolder.name}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <PermBadge permission={selectedFolder.permission} />
                            <span className="text-[10px] text-white/35">{selectedFolder.docs.length} documents</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {selectedFolder.docs.map((doc, i) => (
                          <m.div key={doc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors">
                            <FileTypeIcon type={doc.type} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{doc.name}</div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] text-white/35">{doc.size}</span>
                                <span className="text-[10px] text-white/35">{doc.uploaded}</span>
                                <span className="text-[10px] text-white/35">by {doc.uploadedBy}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {doc.watermarked && (
                                <span className="text-[9px] text-[#d4a054] border border-[#d4a054]/30 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider">Watermarked</span>
                              )}
                              <PermBadge permission={doc.permission} />
                              <div className="flex items-center gap-3 text-[11px] text-white/40">
                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{doc.views}</span>
                                <span className="flex items-center gap-1"><Download className="h-3 w-3" />{doc.downloads}</span>
                              </div>
                              <button className="rounded-lg px-3 py-1.5 bg-white/[0.04] text-xs text-white/60 hover:bg-white/[0.08] hover:text-white transition-colors">
                                View
                              </button>
                            </div>
                          </m.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredFolders.map((folder, i) => (
                        <m.div key={folder.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <button onClick={() => setSelectedFolder(folder)} className="w-full text-left">
                            <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20" style={{ color: folder.color }}>
                                  <FolderOpen className="h-5 w-5" />
                                </div>
                                <PermBadge permission={folder.permission} />
                              </div>
                              <h3 className="text-sm font-semibold text-white mb-1">{folder.name}</h3>
                              <p className="text-xs text-white/40 mb-4 leading-relaxed">{folder.description}</p>
                              <div className="flex items-center justify-between text-[11px] text-white/35">
                                <span>{folder.docCount} documents</span>
                                <span>Updated {folder.lastUpdated}</span>
                              </div>
                              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-white/40 group-hover:text-white/70 transition-colors">
                                Open Folder <ChevronRight className="h-3 w-3" />
                              </div>
                            </div>
                          </button>
                        </m.div>
                      ))}
                    </div>
                  )}
                </m.div>
              ) : (
                <m.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[#4a90b8]" />
                      <span className="text-sm font-semibold text-white">Activity Audit Log</span>
                      <span className="ml-auto text-[10px] text-white/30">{AUDIT_LOG.length} recent events</span>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {AUDIT_LOG.map((entry) => (
                        <div key={entry.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                          <div className="flex-shrink-0">
                            {entry.action === "Downloaded" ? (
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c45a4a]/10">
                                <Download className="h-3.5 w-3.5 text-[#c45a4a]" />
                              </div>
                            ) : entry.action === "Viewed" ? (
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a90b8]/10">
                                <Eye className="h-3.5 w-3.5 text-[#4a90b8]" />
                              </div>
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6aaa72]/10">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#6aaa72]" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium">{entry.user}</div>
                            <div className="text-xs text-white/40 truncate">{entry.action}: {entry.doc}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-white/50">{entry.time}</div>
                            <div className="text-[10px] text-white/25">{entry.ip}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-[#d4a054]/20 bg-[#d4a054]/[0.04] p-4 flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-[#d4a054] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">Audit Log Retention</div>
                      <div className="text-xs text-white/50">All access events are immutably logged for 7 years. Includes IP address, timestamp, and document fingerprint for each view and download event.</div>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
  
          </m.div>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
