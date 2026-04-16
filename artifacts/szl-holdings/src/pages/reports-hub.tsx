import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const API = `${BASE}/api`;

type ReportStatus = "draft" | "review" | "approved" | "distributed" | "archived";

interface Report {
  reportId: string;
  title: string;
  domain: string;
  reportType: string;
  status: ReportStatus;
  brandTheme: string;
  pdfSizeBytes: number | null;
  generationDurationMs: number | null;
  versionNumber: number;
  generatedAt: string;
}

interface ReportStats {
  total: number;
  drafts: number;
  reviews: number;
  approved: number;
  distributed: number;
  archived: number;
  byDomain: Array<{ domain: string; count: number }>;
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  draft: "text-zinc-400 bg-zinc-800",
  review: "text-amber-400 bg-amber-950",
  approved: "text-emerald-400 bg-emerald-950",
  distributed: "text-blue-400 bg-blue-950",
  archived: "text-zinc-500 bg-zinc-900",
};

const DOMAIN_LABELS: Record<string, string> = {
  szl_holdings: "SZL Holdings",
  carlota_jo: "Carlota Jo",
  aegis: "Aegis",
  terra: "Terra",
  vessels: "Vessels",
  lyte: "Lyte",
  prism: "PRISM",
  general: "General",
};

const DOMAIN_COLORS: Record<string, string> = {
  szl_holdings: "#c2a55a",
  carlota_jo: "#a855f7",
  aegis: "#06b6d4",
  terra: "#22c55e",
  vessels: "#3b82f6",
  lyte: "#8b5cf6",
  prism: "#e879f9",
  general: "#94a3b8",
};

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function ReportRow({ report, onView, onDownload, onRequestApproval, onApprove, onDistribute }: {
  report: Report;
  onView: () => void;
  onDownload: () => void;
  onRequestApproval: () => void;
  onApprove: () => void;
  onDistribute: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const domainColor = DOMAIN_COLORS[report.domain] || "#94a3b8";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: domainColor, backgroundColor: `${domainColor}15` }}>
              {DOMAIN_LABELS[report.domain] || report.domain}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[report.status]}`}>
              {report.status}
            </span>
            {report.versionNumber > 1 && (
              <span className="text-xs text-zinc-600">v{report.versionNumber}</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-zinc-100 truncate">{report.title}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {report.reportType.replace(/_/g, " ")} ·{" "}
            {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {report.pdfSizeBytes && ` · ${(report.pdfSizeBytes / 1024).toFixed(0)} KB`}
            {report.generationDurationMs && ` · ${report.generationDurationMs}ms`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onView}
            className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
          >
            View
          </button>
          {report.pdfSizeBytes && (
            <button
              onClick={onDownload}
              className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              PDF
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              ···
            </button>
            {showActions && (
              <div className="absolute right-0 top-8 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 py-1 min-w-[160px]">
                {report.status === "draft" && (
                  <button
                    onClick={() => { onRequestApproval(); setShowActions(false); }}
                    className="w-full text-left text-xs px-3 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  >
                    Request Approval
                  </button>
                )}
                {report.status === "review" && (
                  <button
                    onClick={() => { onApprove(); setShowActions(false); }}
                    className="w-full text-left text-xs px-3 py-2 text-emerald-400 hover:bg-zinc-700"
                  >
                    Approve
                  </button>
                )}
                {report.status === "approved" && (
                  <button
                    onClick={() => { onDistribute(); setShowActions(false); }}
                    className="w-full text-left text-xs px-3 py-2 text-blue-400 hover:bg-zinc-700"
                  >
                    Distribute
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GenerateModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: (id: string) => void }) {
  const [form, setForm] = useState({
    templateKey: "szl_quarterly_investor",
    title: "",
    domain: "szl_holdings",
    reportType: "quarterly_investor_letter",
    brandTheme: "szl",
    generateNarrative: true,
    returnPdf: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TEMPLATES = [
    { key: "szl_quarterly_investor", label: "SZL Holdings — Quarterly Investor Letter", domain: "szl_holdings", reportType: "quarterly_investor_letter" },
    { key: "szl_portfolio", label: "SZL Holdings — Portfolio Overview", domain: "szl_holdings", reportType: "portfolio_overview" },
    { key: "carlota_engagement_summary", label: "Carlota Jo — Engagement Summary", domain: "carlota_jo", reportType: "engagement_summary" },
    { key: "aegis_security_assessment", label: "Aegis — Security Assessment Report", domain: "aegis", reportType: "security_assessment" },
    { key: "terra_property_analysis", label: "Terra — Property Analysis Report", domain: "terra", reportType: "property_analysis" },
    { key: "vessels_voyage", label: "Vessels — Voyage Report", domain: "vessels", reportType: "voyage_report" },
    { key: "lyte_weekly_briefing", label: "Lyte — Weekly Operations Briefing", domain: "lyte", reportType: "weekly_briefing" },
    { key: "prism_legal_memo", label: "PRISM — Legal Memo", domain: "prism", reportType: "legal_memo" },
  ];

  const handleTemplateChange = (key: string) => {
    const tpl = TEMPLATES.find(t => t.key === key);
    if (tpl) {
      setForm(f => ({
        ...f,
        templateKey: key,
        domain: tpl.domain,
        reportType: tpl.reportType,
        title: form.title || tpl.label,
      }));
    }
  };

  const handleGenerate = async () => {
    if (!form.title) { setError("Title is required"); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch("/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          templateKey: form.templateKey,
          title: form.title,
          domain: form.domain,
          reportType: form.reportType,
          brandTheme: form.brandTheme,
          generateNarrative: form.generateNarrative,
          data: { quarter: "Q1 2026", activePlatforms: "6", revenueTracks: "3", buildVelocity: "1,200+", codebaseAge: "2 Years" },
        }),
      });
      onGenerated(result.data.reportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-bold text-zinc-100 mb-4">Generate New Report</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Template</label>
            <select
              value={form.templateKey}
              onChange={e => handleTemplateChange(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
            >
              {TEMPLATES.map(t => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">Report Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Enter report title..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.generateNarrative}
                onChange={e => setForm(f => ({ ...f, generateNarrative: e.target.checked }))}
                className="rounded"
              />
              <span className="text-xs text-zinc-400">Generate AI narrative</span>
            </label>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-950 px-3 py-2 rounded">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg hover:border-zinc-600"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-zinc-900 bg-[#c2a55a] rounded-lg hover:bg-[#d4bc82] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DistributeModal({ reportId, onClose, onDone }: { reportId: string; onClose: () => void; onDone: () => void }) {
  const [emails, setEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDistribute = async () => {
    const emailList = emails.split(/[\n,]/).map(e => e.trim()).filter(Boolean);
    if (emailList.length === 0) { setError("At least one email is required"); return; }
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/reports/${reportId}/distribute`, {
        method: "POST",
        body: JSON.stringify({
          recipients: emailList.map(email => ({ email })),
          channel: "email",
        }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to distribute");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-zinc-100 mb-4">Distribute Report</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Recipient Emails (one per line or comma-separated)</label>
            <textarea
              value={emails}
              onChange={e => setEmails(e.target.value)}
              rows={4}
              placeholder="recipient@example.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
            />
          </div>
          {error && <p className="text-xs text-red-400 bg-red-950 px-3 py-2 rounded">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg">Cancel</button>
          <button
            onClick={handleDistribute}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-zinc-900 bg-blue-500 rounded-lg hover:bg-blue-400 disabled:opacity-50"
          >
            {loading ? "Distributing..." : "Distribute"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsHub() {
  const qc = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);
  const [distributeReportId, setDistributeReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState<{ domain?: string; status?: string; search?: string }>({});

  const { data: statsData } = useQuery({
    queryKey: ["report-stats"],
    queryFn: () => apiFetch("/reports/stats"),
    refetchInterval: 30_000,
  });

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["reports", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.domain) params.set("domain", filters.domain);
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      params.set("limit", "50");
      return apiFetch(`/reports?${params}`);
    },
    refetchInterval: 15_000,
  });

  const stats: ReportStats | null = statsData?.data ?? null;
  const reports: Report[] = reportsData?.data ?? [];

  const handleRequestApproval = async (reportId: string) => {
    try {
      await apiFetch(`/reports/${reportId}/request-approval`, { method: "POST", body: JSON.stringify({}) });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["report-stats"] });
    } catch (err) {
      console.error("Failed to request approval:", err);
    }
  };

  const handleApprove = async (reportId: string) => {
    try {
      await apiFetch(`/reports/${reportId}/review`, {
        method: "POST",
        body: JSON.stringify({ status: "approved", comment: "Approved via Reports Hub" }),
      });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["report-stats"] });
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  const handleDownload = (reportId: string, title: string) => {
    const a = document.createElement("a");
    a.href = `${API}/reports/${reportId}/pdf`;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-200">
      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onGenerated={(id) => {
            setShowGenerate(false);
            qc.invalidateQueries({ queryKey: ["reports"] });
            qc.invalidateQueries({ queryKey: ["report-stats"] });
          }}
        />
      )}

      {distributeReportId && (
        <DistributeModal
          reportId={distributeReportId}
          onClose={() => setDistributeReportId(null)}
          onDone={() => {
            setDistributeReportId(null);
            qc.invalidateQueries({ queryKey: ["reports"] });
            qc.invalidateQueries({ queryKey: ["report-stats"] });
          }}
        />
      )}

      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-[#c2a55a] tracking-widest mb-0.5">SZL HOLDINGS</p>
            <h1 className="text-xl font-bold text-zinc-100">Reports Hub</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Industrial report generation & document intelligence pipeline</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <a
              href={`${BASE}/investor-analytics`}
              className="px-3 py-1.5 text-xs border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              Investor Analytics
            </a>
            <a
              href={`${BASE}/reports/export-builder`}
              className="px-3 py-1.5 text-xs border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              Export Builder
            </a>
            <a
              href={`${BASE}/reports/scheduled`}
              className="px-3 py-1.5 text-xs border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              Scheduled Reports
            </a>
            <button
              onClick={() => window.location.href = `${BASE}/reports/builder`}
              className="px-3 py-1.5 text-xs border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              Report Builder
            </button>
            <button
              onClick={() => setShowGenerate(true)}
              className="px-4 py-1.5 text-xs font-medium text-zinc-900 bg-[#c2a55a] rounded-lg hover:bg-[#d4bc82] transition-colors"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total" value={stats.total} color="#c2a55a" />
            <StatCard label="Draft" value={stats.drafts} color="#94a3b8" />
            <StatCard label="In Review" value={stats.reviews} color="#f59e0b" />
            <StatCard label="Approved" value={stats.approved} color="#10b981" />
            <StatCard label="Distributed" value={stats.distributed} color="#3b82f6" />
            <StatCard label="Archived" value={stats.archived} color="#6b7280" />
          </div>
        )}

        {/* Domain Distribution */}
        {stats?.byDomain && stats.byDomain.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">By Domain</p>
            <div className="flex flex-wrap gap-3">
              {stats.byDomain.map(d => (
                <button
                  key={d.domain}
                  onClick={() => setFilters(f => ({ ...f, domain: f.domain === d.domain ? undefined : d.domain }))}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors"
                  style={{
                    borderColor: filters.domain === d.domain ? (DOMAIN_COLORS[d.domain] || "#94a3b8") : "#3f3f46",
                    backgroundColor: filters.domain === d.domain ? `${DOMAIN_COLORS[d.domain] || "#94a3b8"}15` : "transparent",
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: DOMAIN_COLORS[d.domain] || "#94a3b8" }}>
                    {DOMAIN_LABELS[d.domain] || d.domain}
                  </span>
                  <span className="text-xs text-zinc-500">{d.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input
            value={filters.search || ""}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined }))}
            placeholder="Search reports..."
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600 w-64"
          />
          <select
            value={filters.status || ""}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined }))}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
          >
            <option value="">All statuses</option>
            {(["draft", "review", "approved", "distributed", "archived"] as ReportStatus[]).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          {(filters.domain || filters.status || filters.search) && (
            <button
              onClick={() => setFilters({})}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 border border-zinc-800 rounded-lg"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-zinc-600">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500 mb-4">No reports found</p>
              <button
                onClick={() => setShowGenerate(true)}
                className="text-sm text-[#c2a55a] hover:text-[#d4bc82]"
              >
                Generate your first report →
              </button>
            </div>
          ) : (
            reports.map(report => (
              <ReportRow
                key={report.reportId}
                report={report}
                onView={() => setSelectedReport(report)}
                onDownload={() => handleDownload(report.reportId, report.title)}
                onRequestApproval={() => handleRequestApproval(report.reportId)}
                onApprove={() => handleApprove(report.reportId)}
                onDistribute={() => setDistributeReportId(report.reportId)}
              />
            ))
          )}
        </div>
      </div>

      {/* Report Detail Drawer */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 p-6 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-zinc-100">Report Details</h2>
              <button onClick={() => setSelectedReport(null)} className="text-zinc-500 hover:text-zinc-300">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Title</p>
                <p className="text-sm font-medium text-zinc-200">{selectedReport.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Domain</p>
                  <p className="text-sm text-zinc-300">{DOMAIN_LABELS[selectedReport.domain] || selectedReport.domain}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Type</p>
                  <p className="text-sm text-zinc-300">{selectedReport.reportType.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Status</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[selectedReport.status]}`}>
                    {selectedReport.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Version</p>
                  <p className="text-sm text-zinc-300">v{selectedReport.versionNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Generated</p>
                  <p className="text-sm text-zinc-300">{new Date(selectedReport.generatedAt).toLocaleString()}</p>
                </div>
                {selectedReport.pdfSizeBytes && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">PDF Size</p>
                    <p className="text-sm text-zinc-300">{(selectedReport.pdfSizeBytes / 1024).toFixed(0)} KB</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-2">
                {selectedReport.pdfSizeBytes && (
                  <button
                    onClick={() => handleDownload(selectedReport.reportId, selectedReport.title)}
                    className="w-full py-2 text-sm font-medium text-zinc-900 bg-[#c2a55a] rounded-lg hover:bg-[#d4bc82]"
                  >
                    Download PDF
                  </button>
                )}
                {selectedReport.status === "draft" && (
                  <button
                    onClick={() => { handleRequestApproval(selectedReport.reportId); setSelectedReport(null); }}
                    className="w-full py-2 text-sm border border-amber-700 text-amber-400 rounded-lg hover:bg-amber-950"
                  >
                    Request Approval
                  </button>
                )}
                {selectedReport.status === "review" && (
                  <button
                    onClick={() => { handleApprove(selectedReport.reportId); setSelectedReport(null); }}
                    className="w-full py-2 text-sm border border-emerald-700 text-emerald-400 rounded-lg hover:bg-emerald-950"
                  >
                    Approve Report
                  </button>
                )}
                {selectedReport.status === "approved" && (
                  <button
                    onClick={() => { setDistributeReportId(selectedReport.reportId); setSelectedReport(null); }}
                    className="w-full py-2 text-sm border border-blue-700 text-blue-400 rounded-lg hover:bg-blue-950"
                  >
                    Distribute
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
