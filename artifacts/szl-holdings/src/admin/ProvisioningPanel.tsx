import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Settings, CheckCircle2, AlertCircle, Loader2, RefreshCw, Database,
  ExternalLink, ChevronDown, ChevronUp, ChevronRight, Key, Cloud, Shield, Globe,
  Activity, Server, HelpCircle, BookOpen, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetchAdmin } from "./api";

// ─── Service Provisioning Panel ───────────────────────────────────────────────

interface ProvisioningAdapter {
  name: string;
  description: string | null;
  category: string;
  status: string;
  isLive: boolean;
  requiredEnvVars: string[];
  missingEnvVars: string[];
  signup: string | null;
  docsUrl: string | null;
  notes: string | null;
}

interface ProvisioningData {
  total: number;
  configured: number;
  unconfigured: number;
  noKeyRequired: number;
  adapters: ProvisioningAdapter[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Maritime: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Real Estate": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Legal: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Threat Intel": "bg-red-500/10 text-red-400 border-red-500/20",
  Finance: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Business Intel": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "AI & ML": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Payments: "bg-green-500/10 text-green-400 border-green-500/20",
  Communication: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Storage: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Other: "bg-muted/30 text-muted-foreground border-border",
};

function ProvisioningPanel() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedAdapter, setExpandedAdapter] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useStandardQuery<ProvisioningData>({
    queryKey: ["admin-provisioning"],
    queryFn: () => apiFetchAdmin<ProvisioningData>("/admin/provisioning"),
    staleTime: 30_000,
  });

  const categories = data ? ["all", ...Array.from(new Set(data.adapters.map((a) => a.category))).sort()] : ["all"];

  const filtered = (data?.adapters ?? []).filter((a) => {
    if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
    if (statusFilter === "live" && !a.isLive) return false;
    if (statusFilter === "missing" && (a.isLive || a.requiredEnvVars.length === 0)) return false;
    if (statusFilter === "nokey" && a.requiredEnvVars.length > 0) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Service Provisioning</h2>
          <p className="text-sm text-muted-foreground mt-0.5">All registered service adapters — configure credentials to activate live data feeds.</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 text-sm text-muted-foreground transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-12 justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading provisioning status…
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 py-8 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> Failed to load provisioning data.
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Adapters", value: data.total, color: "text-foreground" },
              { label: "Configured (Live)", value: data.configured, color: "text-emerald-400" },
              { label: "Missing Credentials", value: data.unconfigured, color: "text-amber-400" },
              { label: "No Key Required", value: data.noKeyRequired, color: "text-muted-foreground" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card px-4 py-3">
                <div className={cn("text-2xl font-bold tabular-nums", stat.color)}>{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search adapters…"
              className="flex-1 min-w-40 px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none">
              {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none">
              <option value="all">All Statuses</option>
              <option value="live">Live / Configured</option>
              <option value="missing">Missing Credentials</option>
              <option value="nokey">No Key Required</option>
            </select>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No adapters match your filters.</div>
            ) : filtered.map((adapter) => {
              const isExpanded = expandedAdapter === adapter.name;
              const catColor = CATEGORY_COLORS[adapter.category] ?? CATEGORY_COLORS["Other"];
              return (
                <div key={adapter.name} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedAdapter(isExpanded ? null : adapter.name)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/20 transition-colors"
                  >
                    <span className={cn("shrink-0 w-2 h-2 rounded-full", adapter.isLive ? "bg-emerald-400" : adapter.requiredEnvVars.length === 0 ? "bg-sky-400" : "bg-amber-400")} />
                    <span className="flex-1 min-w-0">
                      <span className="font-medium text-foreground text-sm">{adapter.name}</span>
                      {adapter.description && <span className="ml-2 text-xs text-muted-foreground truncate hidden sm:inline">{adapter.description}</span>}
                    </span>
                    <span className={cn("shrink-0 px-2 py-0.5 rounded-full text-xs border font-medium", catColor)}>{adapter.category}</span>
                    <span className={cn("shrink-0 text-xs px-2 py-0.5 rounded-full font-mono", adapter.isLive ? "bg-emerald-500/10 text-emerald-400" : adapter.requiredEnvVars.length === 0 ? "bg-sky-500/10 text-sky-400" : "bg-amber-500/10 text-amber-400")}>
                      {adapter.isLive ? "LIVE" : adapter.requiredEnvVars.length === 0 ? "NO KEY" : "UNCONFIGURED"}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 border-t border-border space-y-4">
                          {adapter.requiredEnvVars.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5" /> Required Environment Variables
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {adapter.requiredEnvVars.map((v) => {
                                  const missing = adapter.missingEnvVars.includes(v);
                                  return (
                                    <span key={v} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs border", missing ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300")}>
                                      {missing ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                      {v}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {adapter.notes && (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                              <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {adapter.notes}
                            </div>
                          )}

                          {(adapter.signup || adapter.docsUrl) && (
                            <div className="flex flex-wrap gap-2">
                              {adapter.signup && (
                                <a href={adapter.signup} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                                  <ExternalLink className="w-3 h-3" /> Get API Access
                                </a>
                              )}
                              {adapter.docsUrl && (
                                <a href={adapter.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border text-muted-foreground text-xs hover:bg-muted/60 transition-colors">
                                  <BookOpen className="w-3 h-3" /> API Docs
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}


export { ProvisioningPanel };
