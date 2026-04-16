import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const API = `${BASE}/api`;

type DataDomain =
  | "audit_events"
  | "aegis_incidents"
  | "vessels"
  | "terra_deals"
  | "lyte_signals"
  | "msp_tickets"
  | "usage_metering"
  | "revenue_events";

interface ColumnDef {
  key: string;
  label: string;
  default?: boolean;
}

const DOMAIN_CONFIGS: Record<DataDomain, { label: string; endpoint: string; color: string; columns: ColumnDef[] }> = {
  audit_events: {
    label: "Audit Logs",
    endpoint: "/exports/audit-log",
    color: "#c2a55a",
    columns: [
      { key: "id", label: "ID", default: true },
      { key: "createdAt", label: "Timestamp", default: true },
      { key: "action", label: "Action", default: true },
      { key: "entityType", label: "Entity Type", default: true },
      { key: "entityId", label: "Entity ID", default: true },
      { key: "userEmail", label: "Actor Email", default: true },
      { key: "userName", label: "Actor Name" },
      { key: "ipAddress", label: "IP Address" },
      { key: "userAgent", label: "User Agent" },
    ],
  },
  aegis_incidents: {
    label: "Aegis Incidents",
    endpoint: "/exports/aegis-incidents",
    color: "#06b6d4",
    columns: [
      { key: "id", label: "ID", default: true },
      { key: "createdAt", label: "Created At", default: true },
      { key: "title", label: "Title", default: true },
      { key: "severity", label: "Severity", default: true },
      { key: "status", label: "Status", default: true },
      { key: "category", label: "Category" },
      { key: "description", label: "Description" },
      { key: "recommendation", label: "Recommendation" },
    ],
  },
  vessels: {
    label: "Vessels Fleet",
    endpoint: "/exports/vessels",
    color: "#3b82f6",
    columns: [
      { key: "id", label: "ID", default: true },
      { key: "name", label: "Vessel Name", default: true },
      { key: "mmsi", label: "MMSI", default: true },
      { key: "imo", label: "IMO" },
      { key: "type", label: "Type", default: true },
      { key: "flag", label: "Flag" },
      { key: "status", label: "Status", default: true },
      { key: "currentPort", label: "Current Port" },
      { key: "nextPort", label: "Next Port" },
      { key: "grossTonnage", label: "Gross Tonnage" },
      { key: "createdAt", label: "Created At" },
    ],
  },
  terra_deals: {
    label: "Terra Deals",
    endpoint: "/exports/terra-deals",
    color: "#22c55e",
    columns: [
      { key: "id", label: "ID", default: true },
      { key: "address", label: "Address", default: true },
      { key: "borough", label: "Borough", default: true },
      { key: "stage", label: "Stage", default: true },
      { key: "type", label: "Deal Type", default: true },
      { key: "price", label: "Price", default: true },
      { key: "askingPrice", label: "Asking Price" },
      { key: "riskLevel", label: "Risk Level" },
      { key: "ownerName", label: "Owner" },
      { key: "clientName", label: "Client" },
      { key: "estimatedCloseDate", label: "Est. Close Date" },
      { key: "createdAt", label: "Created At" },
    ],
  },
  lyte_signals: {
    label: "Lyte Signals",
    endpoint: "/exports/lyte-signals",
    color: "#8b5cf6",
    columns: [
      { key: "id", label: "ID", default: true },
      { key: "title", label: "Signal Title", default: true },
      { key: "severity", label: "Severity", default: true },
      { key: "status", label: "Status", default: true },
      { key: "source", label: "Source", default: true },
      { key: "sourceType", label: "Source Type" },
      { key: "description", label: "Description" },
      { key: "createdAt", label: "Created At" },
    ],
  },
  msp_tickets: {
    label: "MSP Tickets",
    endpoint: "/exports/msp-tickets",
    color: "#f59e0b",
    columns: [
      { key: "id", label: "ID", default: true },
      { key: "ticketNumber", label: "Ticket #", default: true },
      { key: "subject", label: "Subject", default: true },
      { key: "status", label: "Status", default: true },
      { key: "priority", label: "Priority", default: true },
      { key: "category", label: "Category" },
      { key: "clientName", label: "Client" },
      { key: "assigneeName", label: "Assignee" },
      { key: "slaStatus", label: "SLA Status" },
      { key: "resolvedAt", label: "Resolved At" },
      { key: "createdAt", label: "Created At" },
    ],
  },
  usage_metering: {
    label: "Usage Metering",
    endpoint: "/exports/usage-metering",
    color: "#e879f9",
    columns: [
      { key: "id", label: "ID", default: true },
      { key: "orgId", label: "Org ID", default: true },
      { key: "featureKey", label: "Feature", default: true },
      { key: "product", label: "Product", default: true },
      { key: "quantity", label: "Quantity", default: true },
      { key: "unitLabel", label: "Unit" },
      { key: "occurredAt", label: "Occurred At", default: true },
    ],
  },
  revenue_events: {
    label: "Revenue Events",
    endpoint: "/exports/revenue-events",
    color: "#10b981",
    columns: [
      { key: "id", label: "ID", default: true },
      { key: "orgId", label: "Org ID", default: true },
      { key: "stripeInvoiceId", label: "Stripe Invoice", default: true },
      { key: "amount", label: "Amount", default: true },
      { key: "currency", label: "Currency", default: true },
      { key: "status", label: "Status", default: true },
      { key: "paidAt", label: "Paid At" },
      { key: "createdAt", label: "Created At" },
    ],
  },
};

const STATUSES = ["all", "active", "completed", "pending", "draft", "open", "closed", "canceled"];

function ColumnToggle({ col, enabled, onToggle }: { col: ColumnDef; enabled: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-1 group">
      <div
        className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
          enabled ? "bg-[#c2a55a] border-[#c2a55a]" : "border-zinc-600 bg-transparent hover:border-zinc-400"
        }`}
        onClick={onToggle}
      >
        {enabled && <span className="text-zinc-900 text-[10px] font-bold">✓</span>}
      </div>
      <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{col.label}</span>
    </label>
  );
}

async function fetchPreviewData(domain: DataDomain, filters: Record<string, string>) {
  const params = new URLSearchParams({ domain, limit: "20" });
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.orgId) params.set("orgId", filters.orgId);
  const res = await fetch(`${API}/exports/preview?${params}`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

export default function ExportBuilder() {
  const [domain, setDomain] = useState<DataDomain>("audit_events");
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [filters, setFilters] = useState<{
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    status?: string;
    orgId?: string;
    schedule?: "once" | "daily" | "weekly" | "monthly";
  }>({ schedule: "once" });

  const config = DOMAIN_CONFIGS[domain];
  const [enabledColumns, setEnabledColumns] = useState<Set<string>>(
    new Set(config.columns.filter(c => c.default).map(c => c.key))
  );

  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ["export-preview", domain, filters],
    queryFn: () => fetchPreviewData(domain, {
      dateFrom: filters.dateFrom || "",
      dateTo: filters.dateTo || "",
    }),
    enabled: previewMode,
  });

  const handleDomainChange = (d: DataDomain) => {
    setDomain(d);
    const newConfig = DOMAIN_CONFIGS[d];
    setEnabledColumns(new Set(newConfig.columns.filter(c => c.default).map(c => c.key)));
    setPreviewMode(false);
    setExportMsg(null);
  };

  const toggleColumn = (key: string) => {
    setEnabledColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev; // keep at least 1
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleExport = async () => {
    setExporting(true);
    setExportMsg(null);
    try {
      const body: Record<string, unknown> = {
        format,
        schedule: filters.schedule || "once",
        columns: activeColumns.map(c => c.key),
      };
      if (filters.dateFrom) body["dateFrom"] = filters.dateFrom;
      if (filters.dateTo) body["dateTo"] = filters.dateTo;
      if (filters.search) body["search"] = filters.search;
      if (filters.status && filters.status !== "all") body["status"] = filters.status;
      if (filters.orgId && !isNaN(parseInt(filters.orgId))) body["orgId"] = parseInt(filters.orgId);
      if (filters.schedule === "monthly") body["schedule"] = "monthly";

      const res = await fetch(`${API}${config.endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${domain}-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg({ type: "success", text: `${format.toUpperCase()} export downloaded successfully` });
    } catch (err) {
      setExportMsg({ type: "error", text: err instanceof Error ? err.message : "Export failed" });
    } finally {
      setExporting(false);
    }
  };

  const columns = config.columns;
  const activeColumns = columns.filter(c => enabledColumns.has(c.key));

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-200 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <a href={`${BASE}/reports`} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← Reports Hub
        </a>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-zinc-100">Data Export Builder</h1>
          <p className="text-xs text-zinc-500">Select data source, apply filters, pick columns, and export</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`${BASE}/reports/scheduled`}
            className="px-3 py-1.5 text-xs border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
          >
            Scheduled Reports
          </a>
          <a
            href={`${BASE}/investor-analytics`}
            className="px-3 py-1.5 text-xs border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
          >
            Investor Analytics
          </a>
        </div>
      </div>

      {exportMsg && (
        <div className={`px-6 py-2 text-xs ${exportMsg.type === "success" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>
          {exportMsg.text}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: configuration */}
        <div className="w-72 border-r border-zinc-800 bg-zinc-950 overflow-y-auto shrink-0 p-4 space-y-5">

          {/* Data Domain */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Data Source</p>
            <div className="space-y-1">
              {(Object.entries(DOMAIN_CONFIGS) as [DataDomain, typeof DOMAIN_CONFIGS[DataDomain]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleDomainChange(key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                    domain === key
                      ? "text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  }`}
                  style={domain === key ? { backgroundColor: `${cfg.color}18`, borderLeft: `2px solid ${cfg.color}`, paddingLeft: 10 } : {}}
                >
                  <span style={domain === key ? { color: cfg.color } : {}}>{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Filters</p>
            <div className="space-y-2.5">
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value || undefined }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value || undefined }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search || ""}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined }))}
                  placeholder="Search keywords..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Status</label>
                <select
                  value={filters.status || "all"}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              {(domain === "usage_metering" || domain === "revenue_events") && (
                <div>
                  <label className="text-xs text-zinc-600 block mb-1">Organization ID <span className="text-zinc-700">(tenant filter)</span></label>
                  <input
                    type="number"
                    value={filters.orgId || ""}
                    onChange={e => setFilters(f => ({ ...f, orgId: e.target.value || undefined }))}
                    placeholder="e.g. 42 (leave blank for all)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Schedule</label>
                <select
                  value={filters.schedule || "once"}
                  onChange={e => setFilters(f => ({ ...f, schedule: e.target.value as "once" | "daily" | "weekly" | "monthly" }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                >
                  <option value="once">Export Once</option>
                  <option value="daily">Daily Delivery</option>
                  <option value="weekly">Weekly Delivery</option>
                  <option value="monthly">Monthly Delivery</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Columns</p>
              <span className="text-xs text-zinc-600">{enabledColumns.size} / {columns.length}</span>
            </div>
            <div className="space-y-0.5">
              {columns.map(col => (
                <ColumnToggle
                  key={col.key}
                  col={col}
                  enabled={enabledColumns.has(col.key)}
                  onToggle={() => toggleColumn(col.key)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Format + actions bar */}
          <div className="border-b border-zinc-800 px-6 py-3 flex items-center gap-4 bg-zinc-950 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Format:</span>
              <div className="flex rounded-lg overflow-hidden border border-zinc-800">
                {(["csv", "pdf"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      format === f
                        ? "bg-[#c2a55a] text-zinc-900 font-medium"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-3 py-1.5 text-xs border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                {previewMode ? "Hide Preview" : "Preview Data"}
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-1.5 text-xs font-medium text-zinc-900 rounded-lg disabled:opacity-50 transition-colors"
                style={{ backgroundColor: config.color }}
              >
                {exporting ? "Generating..." : `Export ${format.toUpperCase()}`}
              </button>
            </div>
          </div>

          {/* Summary card */}
          <div className="p-6 space-y-4 flex-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${config.color}18` }}
                >
                  <span className="text-lg" style={{ color: config.color }}>⊞</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-zinc-100 mb-0.5">{config.label}</h2>
                  <p className="text-xs text-zinc-500">
                    {activeColumns.length} columns selected
                    {filters.dateFrom && ` · From ${filters.dateFrom}`}
                    {filters.dateTo && ` · To ${filters.dateTo}`}
                    {filters.search && ` · Search: "${filters.search}"`}
                    {filters.status && filters.status !== "all" && ` · Status: ${filters.status}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${config.color}18`, color: config.color }}>
                    {filters.schedule === "once" ? "One-time export" : `${filters.schedule} delivery`}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected columns preview */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Column Preview</p>
                <span className="text-xs text-zinc-600">{activeColumns.length} columns</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {activeColumns.map(col => (
                        <th key={col.key} className="text-left px-4 py-2.5 text-zinc-500 font-medium whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map(row => (
                      <tr key={row} className="border-b border-zinc-800/50">
                        {activeColumns.map(col => (
                          <td key={col.key} className="px-4 py-2 text-zinc-600 whitespace-nowrap">
                            <span className="inline-block w-16 h-2 bg-zinc-800 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-zinc-600 px-4 py-2 bg-zinc-900/50">
                Preview shows column structure. Click &quot;Export&quot; to generate the actual data.
              </p>
            </div>

            {/* Live preview for supported domains */}
            <AnimatePresence>
              {previewMode && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Live Data Preview (first 20 records)</p>
                  </div>
                  {previewLoading ? (
                    <div className="px-4 py-8 text-center text-xs text-zinc-600">Loading preview...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            {activeColumns.map(col => (
                              <th key={col.key} className="text-left px-3 py-2 text-zinc-500 font-medium whitespace-nowrap">
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(previewData ?? []).slice(0, 20).map((row: Record<string, unknown>, i: number) => (
                            <tr key={i} className="border-b border-zinc-800/40 hover:bg-zinc-800/30">
                              {activeColumns.map(col => (
                                <td key={col.key} className="px-3 py-2 text-zinc-400 whitespace-nowrap max-w-[200px] truncate">
                                  {String(row[col.key] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(previewData ?? []).length === 0 && (
                        <p className="text-xs text-zinc-600 px-4 py-4 text-center">No data found with current filters</p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info box */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-lg px-4 py-3">
              <p className="text-xs text-zinc-500 font-medium mb-1">Export Info</p>
              <ul className="space-y-1 text-xs text-zinc-600">
                <li>• CSV exports up to 10,000 rows with all selected columns</li>
                <li>• PDF exports include branded header and pagination (up to 5,000 rows)</li>
                <li>• Daily/weekly schedules generate a download link delivered to your configured email</li>
                <li>• Download links expire after 24 hours for security</li>
                <li>• All exports are logged in the audit trail</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
