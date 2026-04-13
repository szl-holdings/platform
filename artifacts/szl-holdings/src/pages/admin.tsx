import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { m, AnimatePresence } from "framer-motion";
import {
  Settings, Edit3, Shield, CheckCircle2, AlertCircle, Loader2, Save, Plus, Trash2,
  ChevronRight, Eye, EyeOff, Building2, BarChart3, Mail, FileText, Globe, Layers,
  Lock, ArrowLeft, RefreshCw, Users, Map, BookOpen, Star, MessageSquare,
  HelpCircle, MousePointer, Navigation, Image, Gauge, ClipboardList, X,
  TrendingUp, CheckSquare, Circle, Clock, ExternalLink, ChevronDown, ChevronUp,
  DollarSign, Cloud, Database, SmilePlus, UserCheck,
} from "lucide-react";
import { AzureTenantsPanel } from "./admin/AzureTenantsPanel";
import { RevenuePanel } from "./admin/RevenuePanel";
import { BackupPanel } from "./admin/BackupPanel";
import { CmsPostsPanel } from "./admin/CmsPostsPanel";
import { FeedbackPanel } from "./admin/FeedbackPanel";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { CapitalReadinessOS } from "@/components/CapitalReadinessOS";
import { CertificationReadinessOS } from "@/components/CertificationReadinessOS";
import { CAPITAL_DOCUMENTS, getDocumentsByChannel } from "@/data/capital-arsenal";

const API = "/api";

// ─── CSRF ─────────────────────────────────────────────────────────────────────

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Site { id: number; slug: string; name: string; brandLabel?: string; description?: string; isActive: boolean; }
interface Venture { id: number; slug: string; name: string; shortDescription?: string; statusBadge?: string; stage?: string; isFeatured: boolean; sortOrder: number; primaryCtaLabel?: string; primaryCtaUrl?: string; }
interface CmsPage { id: number; siteId: number; title: string; slug: string; status: string; metaTitle?: string; metaDescription?: string; publishedAt?: string; updatedAt: string; }
interface Article { id: number; siteId: number; slug: string; title: string; excerpt?: string; authorName?: string; status: string; publishedAt?: string; updatedAt: string; }
interface CaseStudy { id: number; siteId: number; slug: string; title: string; summary?: string; status: string; updatedAt: string; }
interface RoadmapItem { id: number; siteId: number; title: string; description?: string; phaseLabel?: string; status: string; targetQuarter?: string; sortOrder: number; }
interface Update { id: number; siteId: number; slug: string; title: string; summary?: string; status: string; publishedAt?: string; updatedAt: string; }
interface Testimonial { id: number; siteId: number; quote: string; attributionName?: string; attributionTitle?: string; isPublic: boolean; sortOrder: number; }
interface Faq { id: number; siteId: number; question: string; answerRichtext?: string; category?: string; sortOrder: number; }
interface Cta { id: number; siteId: number; label: string; url: string; variant?: string; helperText?: string; }
interface NavigationItem { id: number; siteId: number; navGroup: string; label: string; url: string; sortOrder: number; isEnabled: boolean; }
interface ContactSubmission { id: number; formKey: string; fullName: string; email: string; company?: string; message?: string; createdAt: string; }
interface Service { id: number; siteId: number; slug: string; title: string; shortDescription?: string; category?: string; isFeatured: boolean; sortOrder: number; }

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = (opts?.method ?? "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(needsCsrf ? { "x-csrf-token": getCsrfToken() } : {}),
      ...(opts?.headers || {}),
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

async function apiFetchAdmin<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = (opts?.method ?? "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(needsCsrf ? { "x-csrf-token": getCsrfToken() } : {}),
      ...((opts?.headers as Record<string, string>) || {}),
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

// ─── PIN Gate ────────────────────────────────────────────────────────────────

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`${API}/config/verify-admin-pin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        onUnlock();
      } else {
        const body = await res.json().catch(() => ({}));
        if (body?.error === "admin_pin_not_configured") {
          setError("Admin PIN is not configured on this server.");
        } else {
          setError("Incorrect PIN. Try again.");
        }
        setPin("");
      }
    } catch {
      setError("Unable to verify PIN. Check your connection.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1">SZL Holdings Content Management</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter access PIN"
              className={cn(
                "w-full bg-card border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all",
                error ? "border-red-500/60 ring-2 ring-red-500/20" : "border-border"
              )}
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          <button type="submit" disabled={!pin || verifying} className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
            Unlock Admin
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-6">Contact the site administrator for access.</p>
      </m.div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const cls = s === "published" || s === "active" || s === "completed"
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    : s === "draft" || s === "in_progress"
    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
    : "bg-muted text-muted-foreground border-border";
  return <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider", cls)}>{status}</span>;
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function DashboardPanel() {
  const { data: sites } = useQuery({ queryKey: ["cms-sites"], queryFn: () => apiFetch<Site[]>("/cms/sites") });
  const { data: venturesData } = useQuery({ queryKey: ["cms-ventures"], queryFn: () => apiFetch<Venture[]>("/cms/ventures") });
  const { data: articlesData } = useQuery({ queryKey: ["cms-articles"], queryFn: () => apiFetch<{ data: Article[] }>("/cms/articles") });
  const { data: submissionsData } = useQuery({ queryKey: ["cms-submissions"], queryFn: () => apiFetch<{ data: ContactSubmission[] }>("/cms/contact-submissions") });

  const ventures = Array.isArray(venturesData) ? venturesData : [];
  const articles = articlesData?.data ?? [];
  const submissions = submissionsData?.data ?? [];

  const stats = [
    { label: "Sites", value: sites?.length ?? 0, icon: Globe, color: "text-blue-500" },
    { label: "Ventures", value: ventures.length, icon: Building2, color: "text-violet-500" },
    { label: "Articles", value: articles.length, icon: FileText, color: "text-emerald-500" },
    { label: "Submissions", value: submissions.length, icon: Mail, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Content Overview</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage all CMS content for the SZL ecosystem.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", s.color.replace("text-", "bg-") + "/10")}>
                <Icon className={cn("w-4 h-4", s.color)} />
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Active Sites
        </h3>
        <div className="space-y-2">
          {(sites ?? []).map(site => (
            <div key={site.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <div className="text-sm font-medium text-foreground">{site.name}</div>
                <div className="text-xs text-muted-foreground">{site.slug}</div>
              </div>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", site.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border")}>
                {site.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" /> Recent Submissions
          {submissions.length > 0 && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{submissions.length}</span>}
        </h3>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-foreground">{s.fullName}</div>
                  <div className="text-xs text-muted-foreground">{s.email} · {s.formKey}</div>
                </div>
                <div className="text-[10px] text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Generic CMS Table Panel ──────────────────────────────────────────────────

interface FieldDef { key: string; label: string; type?: "text" | "textarea" | "select" | "boolean"; options?: string[]; }

function CmsTablePanel({
  title, icon: Icon, queryKey, endpoint, fields, renderRow, emptyMessage,
}: {
  title: string;
  icon: React.ElementType;
  queryKey: string[];
  endpoint: string;
  fields: FieldDef[];
  renderRow: (item: Record<string, string | number | boolean | null | undefined>) => React.ReactNode;
  emptyMessage?: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => apiFetch<unknown>(endpoint),
  });

  const rows: Record<string, unknown>[] = Array.isArray(data) ? (data as Record<string, unknown>[]) : ((data as { data?: Record<string, unknown>[] } | undefined)?.data ?? []);

  const saveMutation = useMutation({
    mutationFn: async (vals: Record<string, unknown>) => {
      if (isNew) {
        return apiFetch(endpoint, { method: "POST", body: JSON.stringify(vals) });
      } else {
        return apiFetch(`${endpoint}/${editing?.id}`, { method: "PATCH", body: JSON.stringify(vals) });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); setEditing(null); setIsNew(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiFetch(`${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const openEdit = (item: Record<string, unknown>) => {
    setIsNew(false);
    setEditing(item);
    const f: Record<string, string | boolean> = {};
    fields.forEach(fd => { f[fd.key] = (item[fd.key] as string | boolean) ?? ""; });
    setForm(f);
  };

  const openNew = () => {
    setIsNew(true);
    setEditing({});
    const f: Record<string, string | boolean> = {};
    fields.forEach(fd => { f[fd.key] = fd.type === "boolean" ? false : ""; });
    setForm(f);
  };

  const handleSave = () => {
    saveMutation.mutate(form as Record<string, unknown>);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" /> {title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{rows.length} record{rows.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage ?? "No records yet."}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {rows.map(item => (
            <div key={(item as any).id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0 pr-4">{renderRow(item as Record<string, string | number | boolean | null | undefined>)}</div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { if (confirm("Delete this record?")) deleteMutation.mutate((item as any).id); }} className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editing !== null && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <m.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <h3 className="text-sm font-semibold text-foreground">{isNew ? `New ${title.replace(/s$/, "")}` : `Edit ${title.replace(/s$/, "")}`}</h3>
                <button onClick={() => { setEditing(null); setIsNew(false); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {fields.map(fd => (
                  <div key={fd.key}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{fd.label}</label>
                    {fd.type === "textarea" ? (
                      <textarea value={form[fd.key] as string ?? ""} onChange={e => setForm(p => ({ ...p, [fd.key]: e.target.value }))} rows={4} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
                    ) : fd.type === "select" ? (
                      <select value={form[fd.key] as string ?? ""} onChange={e => setForm(p => ({ ...p, [fd.key]: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                        {fd.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : fd.type === "boolean" ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!form[fd.key]} onChange={e => setForm(p => ({ ...p, [fd.key]: e.target.checked }))} className="rounded border-border" />
                        <span className="text-sm text-foreground">Enabled</span>
                      </label>
                    ) : (
                      <input value={form[fd.key] as string ?? ""} onChange={e => setForm(p => ({ ...p, [fd.key]: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 p-5 border-t border-border/50">
                <button onClick={() => { setEditing(null); setIsNew(false); }} className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saveMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Submissions Panel ────────────────────────────────────────────────────────

function SubmissionsPanel() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cms-submissions"],
    queryFn: () => apiFetch<{ data: ContactSubmission[] }>("/cms/contact-submissions"),
  });

  const submissions = data?.data ?? [];
  const [expanded, setExpanded] = useState<number | null>(null);

  const formKeyColors: Record<string, string> = {
    szl_contact: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    vessels_demo: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    inca_access: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    carlota_private_inquiry: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    stephen_contact: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Contact Submissions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => refetch()} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /></div>
      ) : submissions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">No submissions yet. Forms will appear here when completed.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {submissions.map(s => (
            <div key={s.id}>
              <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0", formKeyColors[s.formKey] ?? "bg-muted text-muted-foreground border-border")}>
                    {s.formKey}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{s.fullName}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-[10px] text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</span>
                  {expanded === s.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              <AnimatePresence>
                {expanded === s.id && (
                  <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-2 bg-muted/20">
                      {s.company && <div className="text-xs"><span className="text-muted-foreground">Company: </span><span className="text-foreground">{s.company}</span></div>}
                      {s.message && <div className="text-xs text-foreground bg-background border border-border rounded-lg p-3 leading-relaxed">{s.message}</div>}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────

interface AnalyticsSummary {
  timestamp: string;
  businessEvents: Record<string, number>;
  requestCount: number;
  errorRate: number;
  workflowCompletions: number;
  jobFailures: number;
  pageViews: number;
  topPages: Array<{ path: string; views: number }>;
  topSites: Array<{ site: string; views: number }>;
  funnelBreakdown: Array<{ stage: string; count: number }>;
}

function AnalyticsPanel() {
  const [tab, setTab] = useState<"metrics" | "taxonomy" | "funnel">("metrics");
  const queryClient = useQueryClient();

  const { data: summary, isLoading, error, dataUpdatedAt } = useQuery<AnalyticsSummary>({
    queryKey: ["analytics-summary"],
    queryFn: () => apiFetch<AnalyticsSummary>("/analytics/summary"),
    refetchInterval: 30_000,
    retry: 1,
  });

  const fmt = (n: number | undefined) => (n ?? 0).toLocaleString();
  const pct = (n: number | undefined) => `${((n ?? 0) * 100).toFixed(1)}%`;

  const topEvents = summary?.businessEvents
    ? Object.entries(summary.businessEvents)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
    : [];

  const FUNNEL_STAGES = [
    { key: "page_view", label: "Page Views", icon: Eye, color: "hsl(192,72%,48%)" },
    { key: "cta_click", label: "CTA Interactions", icon: Globe, color: "hsl(214,60%,60%)" },
    { key: "email_capture", label: "Email Captures", icon: Mail, color: "hsl(38,72%,58%)" },
    { key: "contact_form_submit", label: "Contact Form Submissions", icon: CheckCircle2, color: "hsl(258,55%,68%)" },
    { key: "demo_request", label: "Demo Requests", icon: CheckCircle2, color: "hsl(145,60%,46%)" },
  ];

  const eventSummary = [
    { event: "page_view", description: "Every page navigation, fired on each route change" },
    { event: "cta_click", description: "Button and link clicks, labelled by CTA text" },
    { event: "form_submit", description: "All form submissions with form_key property" },
    { event: "demo_request", description: "Demo form submitted (Vessels demo)" },
    { event: "access_request", description: "INCA Lab access request form" },
    { event: "private_inquiry_submit", description: "Carlota Jo private inquiry form" },
    { event: "article_view", description: "Article detail page load with slug" },
    { event: "case_study_view", description: "Case study page load with slug" },
    { event: "download_asset", description: "File/PDF downloads" },
    { event: "sign_in", description: "Authentication completions" },
    { event: "dashboard_view", description: "Authenticated dashboard page load" },
    { event: "email_capture", description: "Newsletter/email sign-up with source field" },
    { event: "exit_intent_shown", description: "Exit-intent popup displayed" },
    { event: "chat_opened", description: "AI chat widget opened" },
    { event: "chat_message_sent", description: "Message sent in AI chat widget" },
    { event: "pricing_tier_view", description: "Pricing tier card viewed, plan_key property" },
    { event: "funnel_stage", description: "Conversion funnel stage milestone" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Analytics Dashboard
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live metrics from the server telemetry snapshot
            {dataUpdatedAt ? ` · Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}` : ""}
          </p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["analytics-summary"] })}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border/50">
        {([["metrics", "Live Metrics"], ["funnel", "Conversion Funnel"], ["taxonomy", "Event Taxonomy"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "metrics" && (
        <>
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-4">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading metrics…
            </div>
          )}
          {error && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs text-red-500">Could not load analytics — API may be offline.</p>
            </div>
          )}
          {summary && (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Page View Events", value: fmt(summary.pageViews ?? summary.businessEvents?.["page_view"] ?? 0), sub: "event hits since restart", color: "hsl(192,72%,48%)" },
                  { label: "Email Captures", value: fmt(summary.businessEvents?.["email_capture"] ?? 0), sub: "newsletter sign-ups", color: "hsl(38,72%,58%)" },
                  { label: "CTA Clicks", value: fmt(summary.businessEvents?.["cta_click"] ?? 0), sub: "across all pages", color: "hsl(214,60%,60%)" },
                  { label: "Contact Submits", value: fmt(summary.businessEvents?.["contact_form_submit"] ?? 0), sub: "inquiry completions", color: "hsl(145,60%,46%)" },
                ].map(card => (
                  <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                    <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Top pages */}
              {(summary.topPages ?? []).length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <p className="text-xs font-semibold text-foreground">Top Pages</p>
                  </div>
                  <div className="divide-y divide-border/40">
                    {(summary.topPages ?? []).map(({ path, views }) => {
                      const maxViews = summary.topPages[0]?.views ?? 1;
                      return (
                        <div key={path} className="px-4 py-2.5">
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <code className="text-xs font-mono text-foreground truncate max-w-[220px]">{path}</code>
                            <span className="text-xs font-semibold text-primary shrink-0">{fmt(views)} views</span>
                          </div>
                          <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/50 rounded-full transition-all" style={{ width: `${Math.round((views / maxViews) * 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Page loads by app/site */}
              {(summary.topSites ?? []).length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <p className="text-xs font-semibold text-foreground">Page Loads by App</p>
                    <span className="text-[10px] text-muted-foreground ml-auto">session-level count</span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {(summary.topSites ?? []).map(({ site, views }) => {
                      const maxViews = summary.topSites[0]?.views ?? 1;
                      return (
                        <div key={site} className="px-4 py-2.5">
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <code className="text-xs font-mono text-foreground">{site}</code>
                            <span className="text-xs font-semibold text-primary">{fmt(views)}</span>
                          </div>
                          <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/40 rounded-full" style={{ width: `${Math.round((views / maxViews) * 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top business events */}
              {topEvents.length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-primary" />
                    <p className="text-xs font-semibold text-foreground">All Events</p>
                  </div>
                  <div className="divide-y divide-border/40">
                    {topEvents.map(([event, count]) => {
                      const maxCount = topEvents[0]?.[1] ?? 1;
                      return (
                        <div key={event} className="px-4 py-2.5">
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <code className="text-xs font-mono text-primary">{event}</code>
                            <span className="text-xs font-semibold text-foreground">{fmt(count)}</span>
                          </div>
                          <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/40 rounded-full" style={{ width: `${Math.round((count / maxCount) * 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {topEvents.length === 0 && !isLoading && (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No business events recorded yet. Events will appear here as users interact with the platform.
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "funnel" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Conversion funnel from landing to trial — based on server-side event telemetry.</p>

          {/* Primary funnel stages */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs font-semibold text-foreground">Funnel Stages</p>
            </div>
            {FUNNEL_STAGES.map((stage, i) => {
              const count = summary?.businessEvents?.[stage.key] ?? 0;
              const topCount = summary?.businessEvents?.[FUNNEL_STAGES[0].key] ?? 1;
              const prevCount = i === 0 ? null : (summary?.businessEvents?.[FUNNEL_STAGES[i - 1].key] ?? 1);
              const convRate = prevCount && prevCount > 0 ? ((count / prevCount) * 100).toFixed(1) : null;
              const dropOff = prevCount && prevCount > 0 ? (100 - (count / prevCount) * 100).toFixed(1) : null;
              const barWidth = topCount > 0 ? Math.round((count / topCount) * 100) : 0;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="px-4 py-3 border-b border-border/40 last:border-b-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: `${stage.color}18`, color: stage.color }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{stage.label}</p>
                      <code className="text-[10px] text-muted-foreground font-mono">{stage.key}</code>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: stage.color }}>{fmt(count)}</p>
                      {convRate !== null && (
                        <p className="text-[10px] text-muted-foreground">
                          {convRate}% conv · <span className="text-red-400">{dropOff}% drop</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, background: stage.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stage-level breakdown from funnel_stage events */}
          {(summary?.funnelBreakdown ?? []).length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
                <Map className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-semibold text-foreground">Stage Milestones</p>
                <span className="text-[10px] text-muted-foreground ml-auto">from funnel_stage events</span>
              </div>
              <div className="divide-y divide-border/40">
                {(summary?.funnelBreakdown ?? []).map(({ stage, count }) => {
                  const maxCount = summary!.funnelBreakdown[0]?.count ?? 1;
                  return (
                    <div key={stage} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <code className="text-xs font-mono text-foreground">{stage}</code>
                        <span className="text-xs font-semibold text-primary">{fmt(count)}</span>
                      </div>
                      <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/50 rounded-full" style={{ width: `${Math.round((count / maxCount) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-amber-600 font-medium">Note on funnel accuracy</p>
            <p className="text-xs text-muted-foreground mt-1">Server telemetry accumulates event counts across process restarts. For full session-level funnel analysis, cross-reference with the Submissions panel and any CRM data.</p>
          </div>
        </div>
      )}

      {tab === "taxonomy" && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
            {eventSummary.map(e => (
              <div key={e.event} className="px-4 py-3">
                <code className="text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 rounded">{e.event}</code>
                <p className="text-xs text-muted-foreground mt-1">{e.description}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-amber-600 font-medium">Event Properties</p>
            <p className="text-xs text-muted-foreground mt-1">All events include: <code className="font-mono">site</code>, <code className="font-mono">page</code>, <code className="font-mono">section</code>, <code className="font-mono">cta_label</code>, <code className="font-mono">form_key</code>, <code className="font-mono">content_slug</code></p>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Site Sections ────────────────────────────────────────────────────────────

const ADMIN_SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "capital-readiness", label: "Capital Readiness", icon: DollarSign },
  { id: "capital-arsenal", label: "Capital Arsenal", icon: BookOpen },
  { id: "certification-readiness", label: "Cert Readiness", icon: Shield },
  { id: "azure-tenants", label: "Azure Tenants", icon: Cloud },
  { id: "scim-provisioning", label: "SCIM Provisioning", icon: Shield },
  { id: "powerbi", label: "Power BI", icon: BarChart3 },
  { id: "cms-posts", label: "CMS Posts", icon: BookOpen },
  { id: "pages", label: "Pages", icon: FileText },
  { id: "ventures", label: "Ventures", icon: Building2 },
  { id: "services", label: "Services", icon: Star },
  { id: "articles", label: "Articles", icon: BookOpen },
  { id: "case-studies", label: "Case Studies", icon: ClipboardList },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "updates", label: "Updates", icon: TrendingUp },
  { id: "ctas", label: "CTAs", icon: MousePointer },
  { id: "navigation", label: "Navigation", icon: Navigation },
  { id: "testimonials", label: "Testimonials", icon: MessageSquare },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "submissions", label: "Submissions", icon: Mail },
  { id: "feedback", label: "Feedback & NPS", icon: SmilePlus },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "backup", label: "Backup & Recovery", icon: Database },
];


// ─── Ventures Panel ───────────────────────────────────────────────────────────

function VenturesPanel() {
  return (
    <CmsTablePanel
      title="Ventures"
      icon={Building2}
      queryKey={["cms-ventures"]}
      endpoint="/cms/ventures"
      fields={[
        { key: "slug", label: "Slug" },
        { key: "name", label: "Name" },
        { key: "shortDescription", label: "Short Description", type: "textarea" },
        { key: "longDescription", label: "Long Description", type: "textarea" },
        { key: "statusBadge", label: "Status Badge" },
        { key: "stage", label: "Stage" },
        { key: "category", label: "Category" },
        { key: "primaryCtaLabel", label: "Primary CTA Label" },
        { key: "primaryCtaUrl", label: "Primary CTA URL" },
        { key: "accentToken", label: "Accent Color" },
        { key: "isFeatured", label: "Featured", type: "boolean" },
        { key: "sortOrder", label: "Sort Order" },
      ]}
      renderRow={item => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.name}</span>
            {item.isFeatured && <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">Featured</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span className="font-mono">{item.slug}</span>
            {item.statusBadge && <span>· {item.statusBadge}</span>}
          </div>
        </div>
      )}
    />
  );
}

// ─── Pages Panel ─────────────────────────────────────────────────────────────

function PagesPanel() {
  return (
    <CmsTablePanel
      title="Pages"
      icon={FileText}
      queryKey={["cms-pages"]}
      endpoint="/cms/pages"
      fields={[
        { key: "siteId", label: "Site ID" },
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug" },
        { key: "pageType", label: "Page Type" },
        { key: "status", label: "Status", type: "select", options: ["draft", "published"] },
        { key: "templateKey", label: "Template Key" },
        { key: "metaTitle", label: "Meta Title" },
        { key: "metaDescription", label: "Meta Description", type: "textarea" },
        { key: "ogTitle", label: "OG Title" },
        { key: "ogDescription", label: "OG Description", type: "textarea" },
        { key: "canonicalUrl", label: "Canonical URL" },
        { key: "noindex", label: "No-index", type: "boolean" },
      ]}
      renderRow={item => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <StatusBadge status={String(item.status ?? "")} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span className="font-mono">{item.slug}</span>
            <span>· Site {item.siteId}</span>
          </div>
        </div>
      )}
    />
  );
}

// ─── Articles Panel ───────────────────────────────────────────────────────────

function ArticlesPanel() {
  return (
    <CmsTablePanel
      title="Articles"
      icon={BookOpen}
      queryKey={["cms-articles"]}
      endpoint="/cms/articles"
      fields={[
        { key: "siteId", label: "Site ID" },
        { key: "slug", label: "Slug" },
        { key: "title", label: "Title" },
        { key: "excerpt", label: "Excerpt", type: "textarea" },
        { key: "bodyRichtextOrMdx", label: "Body", type: "textarea" },
        { key: "authorName", label: "Author Name" },
        { key: "status", label: "Status", type: "select", options: ["draft", "published"] },
        { key: "metaTitle", label: "Meta Title" },
        { key: "metaDescription", label: "Meta Description", type: "textarea" },
      ]}
      renderRow={item => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <StatusBadge status={String(item.status ?? "")} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.authorName} · <span className="font-mono">{item.slug}</span>
          </div>
        </div>
      )}
    />
  );
}

// ─── Case Studies Panel ───────────────────────────────────────────────────────

function CaseStudiesPanel() {
  return (
    <CmsTablePanel
      title="Case Studies"
      icon={ClipboardList}
      queryKey={["cms-case-studies"]}
      endpoint="/cms/case-studies"
      fields={[
        { key: "siteId", label: "Site ID" },
        { key: "slug", label: "Slug" },
        { key: "title", label: "Title" },
        { key: "summary", label: "Summary", type: "textarea" },
        { key: "challenge", label: "Challenge", type: "textarea" },
        { key: "approach", label: "Approach", type: "textarea" },
        { key: "outcome", label: "Outcome", type: "textarea" },
        { key: "takeaway", label: "Takeaway", type: "textarea" },
        { key: "status", label: "Status", type: "select", options: ["draft", "published"] },
      ]}
      renderRow={item => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <StatusBadge status={String(item.status ?? "")} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 font-mono">{item.slug}</div>
        </div>
      )}
    />
  );
}

// ─── Roadmap Panel ────────────────────────────────────────────────────────────

function RoadmapPanel() {
  return (
    <CmsTablePanel
      title="Roadmap Items"
      icon={Map}
      queryKey={["cms-roadmap"]}
      endpoint="/cms/roadmap-items"
      fields={[
        { key: "siteId", label: "Site ID" },
        { key: "title", label: "Title" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "phaseLabel", label: "Phase Label" },
        { key: "status", label: "Status", type: "select", options: ["planned", "in_progress", "completed", "cancelled"] },
        { key: "targetQuarter", label: "Target Quarter" },
        { key: "sortOrder", label: "Sort Order" },
      ]}
      renderRow={item => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <StatusBadge status={String(item.status ?? "")} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.phaseLabel} · {item.targetQuarter}
          </div>
        </div>
      )}
    />
  );
}

// ─── Updates Panel ────────────────────────────────────────────────────────────

function UpdatesPanel() {
  return (
    <CmsTablePanel
      title="Updates"
      icon={TrendingUp}
      queryKey={["cms-updates"]}
      endpoint="/cms/updates"
      fields={[
        { key: "siteId", label: "Site ID" },
        { key: "slug", label: "Slug" },
        { key: "title", label: "Title" },
        { key: "summary", label: "Summary", type: "textarea" },
        { key: "bodyRichtext", label: "Body", type: "textarea" },
        { key: "status", label: "Status", type: "select", options: ["draft", "published"] },
      ]}
      renderRow={item => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <StatusBadge status={String(item.status ?? "")} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.publishedAt ? new Date(String(item.publishedAt)).toLocaleDateString() : "Draft"} · <span className="font-mono">{item.slug}</span>
          </div>
        </div>
      )}
    />
  );
}

// ─── CTAs Panel ───────────────────────────────────────────────────────────────

function CtasPanel() {
  return (
    <CmsTablePanel
      title="CTAs"
      icon={MousePointer}
      queryKey={["cms-ctas"]}
      endpoint="/cms/ctas"
      fields={[
        { key: "siteId", label: "Site ID" },
        { key: "label", label: "Label" },
        { key: "url", label: "URL" },
        { key: "variant", label: "Variant", type: "select", options: ["primary", "secondary", "ghost"] },
        { key: "helperText", label: "Helper Text", type: "textarea" },
      ]}
      renderRow={item => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            {item.variant && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{item.variant}</span>}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">{item.url}</div>
        </div>
      )}
    />
  );
}

// ─── Navigation Panel ─────────────────────────────────────────────────────────

function NavigationPanel() {
  return (
    <CmsTablePanel
      title="Navigation Items"
      icon={Navigation}
      queryKey={["cms-navigation"]}
      endpoint="/cms/navigation-items"
      fields={[
        { key: "siteId", label: "Site ID" },
        { key: "navGroup", label: "Nav Group", type: "select", options: ["primary", "footer", "utility", "dashboard"] },
        { key: "label", label: "Label" },
        { key: "url", label: "URL" },
        { key: "sortOrder", label: "Sort Order" },
        { key: "isEnabled", label: "Enabled", type: "boolean" },
        { key: "isExternal", label: "External Link", type: "boolean" },
        { key: "requiresAuth", label: "Requires Auth", type: "boolean" },
      ]}
      renderRow={item => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            {!item.isEnabled && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">disabled</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{item.navGroup}</span>
            <span className="font-mono">{item.url}</span>
          </div>
        </div>
      )}
    />
  );
}

// ─── Testimonials Panel ───────────────────────────────────────────────────────

function TestimonialsPanel() {
  return (
    <CmsTablePanel
      title="Testimonials"
      icon={MessageSquare}
      queryKey={["cms-testimonials"]}
      endpoint="/cms/testimonials"
      fields={[
        { key: "siteId", label: "Site ID" },
        { key: "quote", label: "Quote", type: "textarea" },
        { key: "attributionName", label: "Name" },
        { key: "attributionTitle", label: "Title" },
        { key: "attributionCompany", label: "Company" },
        { key: "isPublic", label: "Public", type: "boolean" },
        { key: "sortOrder", label: "Sort Order" },
      ]}
      renderRow={item => (
        <div>
          <p className="text-sm text-foreground line-clamp-1 italic">"{item.quote}"</p>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.attributionName}{item.attributionTitle ? ` · ${item.attributionTitle}` : ""}
          </div>
        </div>
      )}
    />
  );
}

// ─── FAQs Panel ───────────────────────────────────────────────────────────────

function FaqsPanel() {
  return (
    <CmsTablePanel
      title="FAQs"
      icon={HelpCircle}
      queryKey={["cms-faqs"]}
      endpoint="/cms/faqs"
      fields={[
        { key: "siteId", label: "Site ID" },
        { key: "question", label: "Question" },
        { key: "answerRichtext", label: "Answer", type: "textarea" },
        { key: "category", label: "Category" },
        { key: "sortOrder", label: "Sort Order" },
      ]}
      renderRow={item => (
        <div>
          <p className="text-sm font-medium text-foreground line-clamp-1">{item.question}</p>
          {item.category && <div className="text-xs text-muted-foreground mt-0.5">{item.category}</div>}
        </div>
      )}
    />
  );
}

// ─── Services Panel ───────────────────────────────────────────────────────────

function ServicesPanel() {
  return (
    <CmsTablePanel
      title="Services"
      icon={Star}
      queryKey={["cms-services"]}
      endpoint="/cms/services-items"
      fields={[
        { key: "siteId", label: "Site ID" },
        { key: "slug", label: "Slug" },
        { key: "title", label: "Title" },
        { key: "shortDescription", label: "Short Description", type: "textarea" },
        { key: "fullDescription", label: "Full Description", type: "textarea" },
        { key: "category", label: "Category" },
        { key: "iconKey", label: "Icon Key" },
        { key: "isFeatured", label: "Featured", type: "boolean" },
        { key: "sortOrder", label: "Sort Order" },
      ]}
      renderRow={item => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            {item.isFeatured && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Featured</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span className="font-mono">{item.slug}</span>
            {item.category && <span>· {item.category}</span>}
          </div>
        </div>
      )}
    />
  );
}


// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(() => {
    try { return localStorage.getItem("szl_admin_unlocked") === "true"; } catch { return false; }
  });
  const [activeSection, setActiveSection] = useState("dashboard");

  const handleUnlock = () => {
    setUnlocked(true);
    try { localStorage.setItem("szl_admin_unlocked", "true"); } catch {}
  };

  useEffect(() => {
    document.title = "Admin — SZL Holdings";
  }, []);

  if (!unlocked) {
    return <PinGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs">
              <ArrowLeft className="w-4 h-4" /> Back to site
            </Link>
            <span className="text-border/60">/</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                <Settings className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Content Management</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-emerald-500 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Shield className="w-3 h-3" /> Admin Access
            </span>
            <button
              onClick={() => { setUnlocked(false); try { localStorage.removeItem("szl_admin_unlocked"); } catch {} }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
        <aside className="w-48 shrink-0">
          <nav className="space-y-0.5 sticky top-20">
            {ADMIN_SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left",
                    activeSection === s.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <m.div
            key={activeSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeSection === "dashboard" && <DashboardPanel />}
            {activeSection === "revenue" && <RevenuePanel />}
            {activeSection === "capital-readiness" && <CapitalReadinessOS />}
            {activeSection === "capital-arsenal" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" /> Capital Arsenal
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Complete document library: investor materials, bank/SBA package, NY state programs, and federal programs.</p>
                  </div>
                  <Link href="/admin/capital-arsenal">
                    <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Full Arsenal View
                    </a>
                  </Link>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-600">Internal Use Only</p>
                      <p className="text-xs text-muted-foreground mt-0.5">All documents contain projections and assumptions. Not financial, legal, or investment advice. Review with qualified counsel before external distribution.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { channel: "investor" as const, label: "Investor Materials", color: "#3b82f6", desc: "One-pager, memo, deck, cap table" },
                    { channel: "bank" as const, label: "Bank / SBA Package", color: "#10b981", desc: "Business plan, use-of-funds, model, checklist" },
                    { channel: "angel" as const, label: "Angel / Equity Package", color: "#f59e0b", desc: "Narrative memo, traction, raise plan" },
                    { channel: "ny_state" as const, label: "NY State Programs", color: "#6366f1", desc: "MWBE, Excelsior, NYSTAR, SBS, ESD" },
                    { channel: "federal" as const, label: "Federal Programs", color: "#ef4444", desc: "SBA 8(a), SBIR/STTR, SAM.gov, FedRAMP" },
                  ].map(card => {
                    const count = getDocumentsByChannel(card.channel).length;
                    return (
                      <div key={card.channel} className="p-4 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: card.color }} />
                          <p className="text-sm font-semibold text-foreground">{card.label}</p>
                          <span className="ml-auto text-lg font-bold" style={{ color: card.color }}>{count}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{card.desc}</p>
                      </div>
                    );
                  })}
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#8b5cf6" }} />
                      <p className="text-sm font-semibold text-foreground">Total Documents</p>
                      <span className="ml-auto text-lg font-bold" style={{ color: "#8b5cf6" }}>{CAPITAL_DOCUMENTS.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{CAPITAL_DOCUMENTS.filter(d => d.status === "ready" || d.status === "final").length} ready, {CAPITAL_DOCUMENTS.filter(d => d.printable).length} printable</p>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <Link href="/admin/capital-arsenal">
                    <a className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                      <BookOpen className="w-4 h-4" /> Open Full Capital Arsenal
                    </a>
                  </Link>
                </div>
              </div>
            )}
            {activeSection === "certification-readiness" && <CertificationReadinessOS />}
            {activeSection === "azure-tenants" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-primary" /> Azure AD Tenant Management
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage enterprise Azure AD tenants and SSO provisioning.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/admin/azure-onboarding">
                      <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/30 transition-colors">
                        <UserCheck className="w-3.5 h-3.5" /> Onboard Wizard
                      </a>
                    </Link>
                    <Link href="/admin/azure-tenants">
                      <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" /> Full Dashboard
                      </a>
                    </Link>
                  </div>
                </div>
                <AzureTenantsPanel />
              </div>
            )}
            {activeSection === "scim-provisioning" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" /> SCIM 2.0 Provisioning
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Enterprise IdP user auto-sync — manage tokens, provisioned users, and sync status per tenant.</p>
                  </div>
                  <Link href="/admin/scim">
                    <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Open Dashboard
                    </a>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: "🔐", label: "Bearer Token Auth", desc: "Per-tenant SCIM tokens generated and stored securely. Revoke anytime." },
                    { icon: "👥", label: "User Provisioning", desc: "Users created, updated, and deactivated via RFC 7644 PATCH/PUT/DELETE." },
                    { icon: "🏷️", label: "Group → Role Mapping", desc: "IdP groups map to platform roles automatically on sync." },
                  ].map(r => (
                    <div key={r.label} className="bg-card border border-border rounded-xl p-4">
                      <div className="text-2xl mb-2">{r.icon}</div>
                      <div className="text-sm font-semibold text-foreground mb-1">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSection === "cms-posts" && <CmsPostsPanel />}
            {activeSection === "powerbi" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" /> Power BI Embedded
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Configure Power BI workspace credentials to embed live analytics reports.</p>
                  </div>
                  <Link href="/admin/powerbi">
                    <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Configure
                    </a>
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: "🛡️", label: "Security Posture Report", app: "Aegis", path: "/firestorm/powerbi", color: "#3b82f6", desc: "Real-time security posture metrics, incident trends, and compliance scores." },
                    { icon: "🏢", label: "Portfolio Analytics Report", app: "Terra", path: "/terra/powerbi", color: "#10b981", desc: "Property-level analytics including NOI, occupancy, IRR, and distress signals." },
                    { icon: "⚡", label: "Operational KPIs Report", app: "Lyte", path: "/lyte-command-center/powerbi", color: "#f59e0b", desc: "Business observability KPIs including SLA performance and PRISM health scores." },
                  ].map(r => (
                    <div key={r.label} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: r.color + "22" }}>
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="text-sm font-semibold text-foreground">{r.label}</div>
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{r.app}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{r.desc}</div>
                      </div>
                      <Link href={r.path}>
                        <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/30 transition-colors flex-shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </a>
                      </Link>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border bg-muted/10 p-5 text-center">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <div className="text-sm font-medium text-foreground mb-1">Configure Power BI credentials to activate embedded reports</div>
                  <p className="text-xs text-muted-foreground mb-4">Requires a Power BI Pro or Premium license and an Azure App Registration.</p>
                  <Link href="/admin/powerbi">
                    <a className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Open Configuration Page
                    </a>
                  </Link>
                </div>
              </div>
            )}
            {activeSection === "pages" && <PagesPanel />}
            {activeSection === "ventures" && <VenturesPanel />}
            {activeSection === "services" && <ServicesPanel />}
            {activeSection === "articles" && <ArticlesPanel />}
            {activeSection === "case-studies" && <CaseStudiesPanel />}
            {activeSection === "roadmap" && <RoadmapPanel />}
            {activeSection === "updates" && <UpdatesPanel />}
            {activeSection === "ctas" && <CtasPanel />}
            {activeSection === "navigation" && <NavigationPanel />}
            {activeSection === "testimonials" && <TestimonialsPanel />}
            {activeSection === "faqs" && <FaqsPanel />}
            {activeSection === "submissions" && <SubmissionsPanel />}
            {activeSection === "feedback" && <FeedbackPanel />}
            {activeSection === "analytics" && <AnalyticsPanel />}
            {activeSection === "backup" && <BackupPanel />}
          </m.div>
        </main>
      </div>
    </div>
  );
}
