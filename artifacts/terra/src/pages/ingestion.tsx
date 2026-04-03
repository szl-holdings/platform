import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle,
  FileText, Database, Play, ChevronDown, ChevronUp, Zap, BarChart3
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = "/api";

function fetchJson(path: string) {
  return fetch(`${API}${path}`).then(r => r.json()).then(d => d.data ?? d);
}

function useIngestionStats() {
  return useQuery({
    queryKey: ["terra-ingestion-stats"],
    queryFn: () => fetchJson("/terra/distress/ingestion/stats"),
    refetchInterval: 30000,
  });
}

interface IngestionRun {
  id: number;
  source: string;
  status: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: number;
  startedAt: string;
  completedAt?: string | null;
  durationMs?: number | null;
  errorMessages?: string[] | null;
}

interface IngestionResult {
  source?: string;
  recordsProcessed?: number;
  recordsInserted?: number;
  recordsUpdated?: number;
  recordsSkipped?: number;
  recordsFailed?: number;
  alertsGenerated?: number;
  errors?: number;
  error?: string;
  message?: string;
}

const SOURCE_LABELS: Record<string, { label: string; description: string; color: string }> = {
  nyc_open_data: { label: "NYC Open Data — Core", description: "ACRIS, foreclosure filings, DOF liens, HPD violations", color: "text-blue-400" },
  nyc_open_data_extended: { label: "NYC Open Data — Extended", description: "Rolling Sales, Tax Lien Sale List, HPD Complaints, DOB, 311, ACRIS Parties", color: "text-violet-400" },
  csv_upload: { label: "CSV Upload", description: "Manual CSV from county exports, broker sources, custom feeds", color: "text-emerald-400" },
  manual: { label: "Manual Entry", description: "Individually entered distress properties", color: "text-amber-400" },
  seed: { label: "Seed Data", description: "Initial dataset loaded at launch", color: "text-slate-400" },
};

function StatusBadge({ status }: { status: string }) {
  const config = {
    running: { color: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: RefreshCw, animate: true },
    completed: { color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", icon: CheckCircle, animate: false },
    failed: { color: "text-red-400 bg-red-400/10 border-red-400/30", icon: XCircle, animate: false },
    partial: { color: "text-amber-400 bg-amber-400/10 border-amber-400/30", icon: AlertTriangle, animate: false },
  }[status] ?? { color: "text-slate-400 bg-slate-400/10 border-slate-400/30", icon: Clock, animate: false };

  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border", config.color)}>
      <config.icon className={cn("w-3 h-3", config.animate && "animate-spin")} />
      {status}
    </span>
  );
}

export default function IngestionPage() {
  const { data: stats, isLoading, refetch } = useIngestionStats();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<IngestionResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [triggeringNyc, setTriggeringNyc] = useState(false);
  const [nycResult, setNycResult] = useState<IngestionResult | null>(null);
  const [triggeringExtended, setTriggeringExtended] = useState(false);
  const [extendedResult, setExtendedResult] = useState<IngestionResult | null>(null);
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const recentRuns: IngestionRun[] = stats?.recentRuns ?? [];
  const summary = stats?.summary ?? {};

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", file.name);

      const res = await fetch(`${API}/terra/distress/ingest/csv`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        setUploadError(json.error ?? "Upload failed");
      } else {
        setUploadResult(json);
        refetch();
      }
    } catch (err) {
      setUploadError(String(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function triggerNycIngestion() {
    setTriggeringNyc(true);
    setNycResult(null);
    try {
      const res = await fetch(`${API}/terra/distress/ingest/nyc-open-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: ["acris", "foreclosure_filings", "dof_liens"] }),
      });
      const json = await res.json();
      setNycResult(json.data ?? json);
      refetch();
    } catch (err) {
      setNycResult({ error: String(err) });
    } finally {
      setTriggeringNyc(false);
    }
  }

  async function triggerExtendedIngestion() {
    setTriggeringExtended(true);
    setExtendedResult(null);
    try {
      const res = await fetch(`${API}/terra/distress/ingest/nyc-extended`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: ["rolling_sales", "tax_lien_sale_list", "hpd_complaints", "dob_violations", "nyc_311", "acris_parties", "map_pluto"] }),
      });
      const json = await res.json();
      setExtendedResult(json.data ?? json);
      refetch();
    } catch (err) {
      setExtendedResult({ error: String(err) });
    } finally {
      setTriggeringExtended(false);
    }
  }

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-terra-text">Ingestion Framework</h1>
        <p className="text-sm text-terra-text-secondary mt-1">
          CSV upload, NYC Open Data adapters, and scheduled ingestion job management
        </p>
      </motion.div>

      {/* Summary Stats */}
      {summary.totalProperties !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Total Properties", value: summary.totalProperties ?? 0, icon: Database, color: "text-terra-primary" },
            { label: "Total Runs", value: summary.totalRuns ?? 0, icon: RefreshCw, color: "text-blue-400" },
            { label: "Records Inserted", value: summary.totalRecordsInserted ?? 0, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Alerts Generated", value: summary.totalAlertsGenerated ?? 0, icon: Zap, color: "text-amber-400" },
          ].map(m => (
            <div key={m.label} className="rounded-xl border border-terra-border bg-terra-surface/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <m.icon className={cn("w-4 h-4", m.color)} />
                <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
              </div>
              <p className="text-2xl font-display font-bold text-terra-text">{m.value.toLocaleString()}</p>
            </div>
          ))}
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* CSV Upload */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-terra-border bg-terra-surface/50 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Upload className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-terra-text">CSV Upload</h2>
              <p className="text-[10px] text-terra-text-muted">County exports, broker lists, manual imports</p>
            </div>
          </div>

          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
              uploading ? "border-terra-primary/50 bg-terra-primary/5" : "border-terra-border hover:border-terra-primary/40 hover:bg-terra-primary/3"
            )}
            onClick={() => !uploading && fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-terra-primary animate-spin" />
                <p className="text-sm text-terra-primary">Processing CSV...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-6 h-6 text-terra-text-muted" />
                <p className="text-sm text-terra-text">Drop CSV file or click to browse</p>
                <p className="text-[10px] text-terra-text-muted">Supports address, borough/county, distress type, value, debt, filing date</p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {uploadResult && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
              >
                <p className="text-xs font-semibold text-emerald-400 mb-1">Upload complete</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-terra-text-secondary">
                  <span>Inserted: <span className="font-bold text-emerald-400">{uploadResult.recordsInserted}</span></span>
                  <span>Skipped: <span className="font-bold text-amber-400">{uploadResult.recordsSkipped}</span></span>
                  <span>Failed: <span className="font-bold text-red-400">{uploadResult.recordsFailed}</span></span>
                  <span>Alerts: <span className="font-bold text-blue-400">{uploadResult.alertsGenerated}</span></span>
                </div>
              </motion.div>
            )}
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3"
              >
                <p className="text-xs text-red-400">{uploadError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 p-3 bg-terra-surface rounded-lg border border-terra-border">
            <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-2">Expected CSV Columns</p>
            <div className="flex flex-wrap gap-1">
              {["address", "borough", "distress_type", "estimated_value", "debt_amount", "filing_date", "owner_name"].map(c => (
                <span key={c} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-terra-border text-terra-text-secondary">{c}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* NYC Open Data Trigger */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-terra-border bg-terra-surface/50 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-terra-text">NYC Open Data</h2>
              <p className="text-[10px] text-terra-text-muted">ACRIS, foreclosures, DOF liens, HPD violations</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {[
              { key: "acris", label: "ACRIS Document Records", status: "active" },
              { key: "foreclosure_filings", label: "Foreclosure Filings", status: "active" },
              { key: "dof_liens", label: "DOF Tax Liens", status: "active" },
              { key: "hpd_violations", label: "HPD Building Violations", status: "active" },
            ].map(src => (
              <div key={src.key} className="flex items-center justify-between p-2.5 rounded-lg border border-terra-border bg-terra-surface/50">
                <div>
                  <p className="text-xs font-semibold text-terra-text">{src.label}</p>
                  <p className="text-[9px] text-terra-text-muted font-mono">{src.key}</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded border text-emerald-400 bg-emerald-400/10 border-emerald-400/30">
                  {src.status}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={triggerNycIngestion}
            disabled={triggeringNyc}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors",
              triggeringNyc
                ? "bg-blue-500/20 text-blue-400 cursor-not-allowed"
                : "bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
            )}
          >
            {triggeringNyc ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Enqueueing job...</>
            ) : (
              <><Play className="w-4 h-4" /> Trigger NYC Data Pull</>
            )}
          </button>

          {nycResult && (
            <div className={cn("mt-3 rounded-lg border p-3 text-xs", nycResult.error ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-blue-500/20 bg-blue-500/5 text-blue-300")}>
              {nycResult.error ? nycResult.error : nycResult.message ?? "Job enqueued"}
            </div>
          )}
        </motion.div>

        {/* NYC Extended Sources */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-terra-border bg-terra-surface/50 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Database className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-terra-text">NYC Open Data — Extended</h2>
              <p className="text-[10px] text-terra-text-muted">Rolling sales, tax lien sales, HPD complaints, DOB, 311, ACRIS parties</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {[
              { key: "usep-8jbt", label: "NYC Rolling Property Sales", desc: "All borough sales transactions" },
              { key: "9rz4-mjek", label: "Tax Lien Sale List", desc: "Delinquent properties facing sale" },
              { key: "uwyv-629c", label: "HPD Complaints", desc: "Tenant complaints by building" },
              { key: "3h2n-5cm9", label: "DOB Violations", desc: "Dept of Buildings stop-work & violations" },
              { key: "erm2-nwe9", label: "NYC 311 Property", desc: "Building/property service complaints" },
              { key: "636b-3b5g", label: "ACRIS Parties / LLC Trace", desc: "Grantor/grantee entity ownership" },
              { key: "64uk-42ks", label: "MapPLUTO Land Use & Zoning", desc: "Parcel data, assessed values, building class, zoning" },
            ].map(src => (
              <div key={src.key} className="flex items-center justify-between p-2.5 rounded-lg border border-terra-border bg-terra-surface/50">
                <div>
                  <p className="text-xs font-semibold text-terra-text">{src.label}</p>
                  <p className="text-[9px] text-terra-text-muted font-mono">{src.key} — {src.desc}</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded border text-violet-400 bg-violet-400/10 border-violet-400/30">
                  scheduled
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={triggerExtendedIngestion}
            disabled={triggeringExtended}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors",
              triggeringExtended
                ? "bg-violet-500/20 text-violet-400 cursor-not-allowed"
                : "bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20"
            )}
          >
            {triggeringExtended ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Enqueueing extended job...</>
            ) : (
              <><Play className="w-4 h-4" /> Trigger Extended Data Pull</>
            )}
          </button>

          {extendedResult && (
            <div className={cn("mt-3 rounded-lg border p-3 text-xs", extendedResult.error ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-violet-500/20 bg-violet-500/5 text-violet-300")}>
              {extendedResult.error ? extendedResult.error : extendedResult.message ?? "Extended job enqueued"}
            </div>
          )}
        </motion.div>
      </div>

      {/* Ingestion Run History */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden"
      >
        <div className="p-4 border-b border-terra-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-terra-text-muted" />
            <h2 className="text-sm font-display font-bold text-terra-text">Ingestion Run History</h2>
          </div>
          <button
            onClick={() => refetch()}
            className="text-[10px] text-terra-text-muted hover:text-terra-text flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 border-2 border-terra-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentRuns.length === 0 ? (
          <div className="p-8 text-center">
            <Database className="w-8 h-8 text-terra-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm text-terra-text-muted">No ingestion runs yet</p>
            <p className="text-xs text-terra-text-muted mt-1">Upload a CSV or trigger an NYC data pull to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-terra-border">
            {recentRuns.map((run: any, i: number) => {
              const isExpanded = expandedRun === i;
              const srcCfg = SOURCE_LABELS[run.source] ?? { label: run.source, description: "", color: "text-terra-text-muted" };
              return (
                <div key={run.id ?? i}>
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-terra-surface-hover transition-colors text-left"
                    onClick={() => setExpandedRun(isExpanded ? null : i)}
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={run.status} />
                      <div>
                        <p className={cn("text-xs font-semibold", srcCfg.color)}>{srcCfg.label}</p>
                        <p className="text-[10px] text-terra-text-muted">{new Date(run.startedAt ?? run.started_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mr-2">
                      <div className="text-right">
                        <p className="text-xs text-emerald-400 font-mono">+{run.recordsInserted ?? run.records_inserted ?? 0}</p>
                        <p className="text-[10px] text-terra-text-muted">inserted</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-terra-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-terra-text-muted" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 bg-terra-surface/30">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {[
                          { label: "Fetched", value: run.recordsFetched ?? run.records_fetched ?? 0, color: "text-terra-text" },
                          { label: "Inserted", value: run.recordsInserted ?? run.records_inserted ?? 0, color: "text-emerald-400" },
                          { label: "Skipped", value: run.recordsSkipped ?? run.records_skipped ?? 0, color: "text-amber-400" },
                          { label: "Failed", value: run.recordsFailed ?? run.records_failed ?? 0, color: "text-red-400" },
                        ].map(m => (
                          <div key={m.label} className="text-center p-2 rounded bg-terra-surface border border-terra-border">
                            <p className={cn("text-sm font-bold font-mono", m.color)}>{m.value}</p>
                            <p className="text-[9px] text-terra-text-muted">{m.label}</p>
                          </div>
                        ))}
                      </div>
                      {(run.errorMessage ?? run.error_message) && (
                        <div className="mt-3 p-2 rounded bg-red-500/5 border border-red-500/20 text-xs text-red-400">
                          {run.errorMessage ?? run.error_message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
