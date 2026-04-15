import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { m, AnimatePresence } from "framer-motion";
import {
  Settings, Edit3, Shield, CheckCircle2, AlertCircle, Loader2, Save, Plus, Trash2,
  ChevronRight, Eye, EyeOff, Building2, BarChart3, Mail, FileText, Globe, Layers,
  Lock, ArrowLeft, RefreshCw, Users, Map, BookOpen, Star, MessageSquare,
  HelpCircle, MousePointer, Navigation, Image, Gauge, ClipboardList, X,
  TrendingUp, CheckSquare, Circle, Clock, ExternalLink, ChevronDown, ChevronUp,
  DollarSign, Cloud, Key, UserCheck, LinkIcon, Database, Download, HardDrive, Activity,
  SmilePlus, ThumbsUp, ThumbsDown,
} from "lucide-react";
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

function AnalyticsPanel() {
  const eventSummary = [
    { event: "page_view", count: "Track on each route", description: "Every page navigation" },
    { event: "cta_click", count: "CTA interactions", description: "Button and link clicks with label" },
    { event: "form_submit", count: "Form completions", description: "All form submissions" },
    { event: "demo_request", count: "Demo requests", description: "Vessels demo form" },
    { event: "access_request", count: "Access requests", description: "INCA access form" },
    { event: "private_inquiry_submit", count: "Private inquiries", description: "Carlota Jo inquiry form" },
    { event: "article_view", count: "Article views", description: "Article detail page loads" },
    { event: "case_study_view", count: "Case study views", description: "Case study page loads" },
    { event: "download_asset", count: "Asset downloads", description: "File and PDF downloads" },
    { event: "sign_in", count: "Sign in events", description: "Authentication completions" },
    { event: "dashboard_view", count: "Dashboard loads", description: "Authenticated dashboard views" },
    { event: "alert_view", count: "Alert views", description: "Alert detail views" },
    { event: "report_view", count: "Report views", description: "Report page views" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Analytics Event Taxonomy
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">All analytics events fire via window.gtag and the analytics utility.</p>
      </div>
      <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
        {eventSummary.map(e => (
          <div key={e.event} className="px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <code className="text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 rounded">{e.event}</code>
                <p className="text-xs text-muted-foreground mt-1">{e.description}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{e.count}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <p className="text-xs text-amber-600 font-medium">Event Properties</p>
        <p className="text-xs text-muted-foreground mt-1">All events include: <code className="font-mono">site</code>, <code className="font-mono">page</code>, <code className="font-mono">section</code>, <code className="font-mono">cta_label</code>, <code className="font-mono">form_key</code>, <code className="font-mono">content_slug</code></p>
      </div>
    </div>
  );
}

// ─── Azure Tenant Management Panel ───────────────────────────────────────────

interface AzureTenant {
  id: number;
  azureTenantId: string;
  displayName: string;
  domain: string;
  status: string;
  adminConsentGranted: string;
  organizationId: number | null;
  provisionedAt: string;
  updatedAt: string;
}

function AzureTenantsPanel() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ azureTenantId: "", displayName: "", domain: "", status: "active" });
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [consentCopied, setConsentCopied] = useState<number | null>(null);
  const [expandedTenant, setExpandedTenant] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["azure-tenants"],
    queryFn: () => apiFetch<{ count: number; tenants: AzureTenant[] }>("/admin/tenants"),
  });

  const tenants: AzureTenant[] = data?.tenants ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.azureTenantId.trim() || !form.displayName.trim() || !form.domain.trim()) {
      setFormError("All fields are required");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/admin/tenants", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ azureTenantId: "", displayName: "", domain: "", status: "active" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["azure-tenants"] });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to provision tenant");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: number, status: string) {
    setActionError("");
    try {
      await apiFetch(`/admin/tenants/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      qc.invalidateQueries({ queryKey: ["azure-tenants"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update tenant status");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deprovision and delete this tenant? This cannot be undone.")) return;
    setActionError("");
    try {
      await apiFetch(`/admin/tenants/${id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["azure-tenants"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete tenant");
    }
  }

  async function copyConsentUrl(id: number) {
    setActionError("");
    try {
      const result = await apiFetch<{ adminConsentUrl: string }>(`/admin/tenants/${id}/admin-consent-url`);
      await navigator.clipboard.writeText(result.adminConsentUrl);
      setConsentCopied(id);
      setTimeout(() => setConsentCopied(null), 2500);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to copy consent URL");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Cloud className="w-4 h-4 text-primary" /> Azure AD Tenant Provisioning
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage enterprise customer tenants provisioned for multi-tenant Azure AD SSO and Dynamics 365 access.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Provision Tenant
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <m.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleCreate}
            className="bg-card border border-border rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">New Azure AD Tenant</span>
            </div>
            {formError && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Azure Tenant ID (GUID)</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={form.azureTenantId}
                  onChange={e => setForm(f => ({ ...f, azureTenantId: e.target.value.trim() }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Display Name</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Contoso Corporation"
                  value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Primary Domain</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="contoso.onmicrosoft.com"
                  value={form.domain}
                  onChange={e => setForm(f => ({ ...f, domain: e.target.value.trim() }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Initial Status</label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Provisioning…" : "Provision Tenant"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </m.form>
        )}
      </AnimatePresence>

      {actionError && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading tenants…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" /> Failed to load tenants. Ensure you have admin access.
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Cloud className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground">No tenants provisioned</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Provision Tenant" to register your first Azure AD customer tenant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tenants.map(tenant => (
            <div key={tenant.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedTenant(expandedTenant === tenant.id ? null : tenant.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Cloud className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{tenant.displayName}</span>
                      <StatusBadge status={tenant.status} />
                      {tenant.adminConsentGranted === "granted" && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <UserCheck className="w-2.5 h-2.5" /> Consent
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{tenant.domain} · {tenant.azureTenantId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {expandedTenant === tenant.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedTenant === tenant.id && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/50 px-4 py-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="text-muted-foreground">Admin Consent</div>
                          <div className="font-medium text-foreground capitalize mt-0.5">{tenant.adminConsentGranted?.replace("_", " ") ?? "not_requested"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Org ID</div>
                          <div className="font-medium text-foreground mt-0.5">{tenant.organizationId ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Provisioned</div>
                          <div className="font-medium text-foreground mt-0.5">{tenant.provisionedAt ? new Date(tenant.provisionedAt).toLocaleDateString() : "—"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Updated</div>
                          <div className="font-medium text-foreground mt-0.5">{tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleDateString() : "—"}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => copyConsentUrl(tenant.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-600 border border-violet-500/20 text-xs font-medium hover:bg-violet-500/20 transition-colors"
                        >
                          {consentCopied === tenant.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                          {consentCopied === tenant.id ? "Copied!" : "Copy Admin Consent URL"}
                        </button>
                        {tenant.status === "active" ? (
                          <button
                            onClick={() => handleStatusChange(tenant.id, "suspended")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5" /> Suspend
                          </button>
                        ) : tenant.status === "suspended" ? (
                          <button
                            onClick={() => handleStatusChange(tenant.id, "active")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reactivate
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDelete(tenant.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-medium hover:bg-red-500/20 transition-colors ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Deprovision
                        </button>
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border/50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
          <Key className="w-3.5 h-3.5 text-primary" /> Setup Guide
        </h3>
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
          <li>Register an Azure AD multi-tenant application in your Microsoft Entra portal.</li>
          <li>Add the tenant GUID, display name, and domain here to provision access.</li>
          <li>Copy the Admin Consent URL and share it with the customer's Azure AD Global Administrator.</li>
          <li>Once consent is granted, the tenant can sign in via the Azure AD SSO endpoint.</li>
          <li>Configure a Dataverse connection for the tenant through the API to enable CRM sync.</li>
        </ol>
      </div>
    </div>
  );
}

// ─── Revenue Analytics Panel ──────────────────────────────────────────────────

interface RevenueAnalytics {
  source: "stripe" | "database";
  stripeMode: "live" | "test" | "mock";
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  pastDueSubscriptions: number;
  canceledSubscriptions: number;
  canceledThisMonth: number;
  newSubscriptionsThisMonth: number;
  churnRate: number;
  totalLifetimeRevenue: number;
  recentInvoices: Array<{
    id: string;
    customerId: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    status: string;
    paidAt?: number;
    created: number;
    hostedInvoiceUrl?: string;
  }>;
}

function RevenuePanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchAdmin<RevenueAnalytics>("/billing/revenue-analytics");
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load revenue analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const handleSyncPlans = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await apiFetchAdmin<{ synced: number; plans: Array<{ slug: string; action: string }> }>("/billing/sync-plans", {
        method: "POST",
      });
      setSyncResult(`Synced ${res.synced} plan(s) from Stripe`);
    } catch (err) {
      setSyncResult(`Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSyncing(false);
    }
  };

  const formatCents = (cents: number, currency = "usd") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500/60 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Failed to load revenue data</p>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const d = data!;
  const modeColor = d.stripeMode === "live" ? "emerald" : d.stripeMode === "test" ? "amber" : "zinc";
  const modeLabel = d.stripeMode === "live" ? "Live" : d.stripeMode === "test" ? "Test" : "Demo / No Stripe Key";

  const kpis = [
    { label: "MRR", value: formatCents(d.mrr), sub: `${formatCents(d.arr)} ARR`, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Active Subscriptions", value: d.activeSubscriptions, sub: d.trialingSubscriptions > 0 ? `+${d.trialingSubscriptions} trialing` : "No trials", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Churn Rate (30d)", value: `${d.churnRate}%`, sub: `${d.canceledThisMonth} canceled`, color: d.churnRate > 5 ? "text-red-400" : "text-emerald-400", bg: d.churnRate > 5 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20" },
    { label: "New This Month", value: d.newSubscriptionsThisMonth, sub: d.pastDueSubscriptions > 0 ? `${d.pastDueSubscriptions} past due` : "No past due", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Revenue Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time subscription and payment data {d.source === "stripe" ? "from Stripe" : "from local database"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-medium px-2.5 py-1 rounded-full border",
            modeColor === "emerald" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" :
            modeColor === "amber" ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
            "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"
          )}>
            {modeLabel}
          </span>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={handleSyncPlans}
            disabled={syncing || d.stripeMode === "mock"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
            Sync Plans
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={cn(
          "rounded-lg border px-4 py-3 text-xs",
          syncResult.includes("failed") ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
        )}>
          {syncResult}
        </div>
      )}

      {d.stripeMode === "mock" && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs font-medium text-amber-500 mb-1">Stripe not connected</p>
          <p className="text-xs text-muted-foreground">
            Set the <code className="font-mono text-amber-400/80">STRIPE_SECRET_KEY</code> secret to see live revenue data from Stripe. Showing local database figures.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label} className={cn("rounded-xl border p-4", kpi.bg)}>
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className={cn("text-2xl font-bold tracking-tight", kpi.color)}>{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Lifetime Revenue", value: formatCents(d.totalLifetimeRevenue) },
          { label: "Trialing", value: d.trialingSubscriptions },
          { label: "Past Due", value: d.pastDueSubscriptions, highlight: d.pastDueSubscriptions > 0 },
        ].map(item => (
          <div key={item.label} className={cn(
            "rounded-xl border bg-card p-4",
            item.highlight ? "border-red-500/30" : "border-border"
          )}>
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={cn("text-lg font-semibold", item.highlight ? "text-red-400" : "text-foreground")}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {d.recentInvoices.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Recent Paid Invoices</h3>
          <div className="bg-card border border-border rounded-xl divide-y divide-border/50 overflow-hidden">
            {d.recentInvoices.slice(0, 10).map(inv => (
              <div key={inv.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <code className="text-[10px] font-mono text-muted-foreground">{inv.id}</code>
                  <p className="text-xs text-foreground font-medium mt-0.5">
                    {formatCents(inv.amount, inv.currency)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{inv.paidAt ? formatDate(inv.paidAt) : formatDate(inv.created)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {inv.status}
                  </span>
                  {inv.hostedInvoiceUrl && (
                    <a
                      href={inv.hostedInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.recentInvoices.length === 0 && (
        <div className="rounded-xl border border-border bg-muted/10 p-6 text-center">
          <FileText className="w-7 h-7 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No recent invoices</p>
          <p className="text-xs text-muted-foreground">
            {d.stripeMode === "mock"
              ? "Connect Stripe to see real invoice history."
              : "Paid invoices will appear here once subscriptions are active."}
          </p>
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
  { id: "provisioning", label: "Service Provisioning", icon: Layers },
];

// ─── Backup & Recovery Panel ─────────────────────────────────────────────────

interface BackupFile {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  label: "daily" | "weekly";
}

interface BackupStatus {
  health: {
    status: "ok" | "warning" | "error";
    lastBackupAt: string | null;
    lastBackupSizeBytes: number;
    ageHours: number | null;
    warning: boolean;
    totalBackups: number;
    details: string;
  };
  backups: BackupFile[];
  totalCount: number;
  dailyCount: number;
  weeklyCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function BackupPanel() {
  const queryClient = useQueryClient();
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<BackupStatus>({
    queryKey: ["backup-status"],
    queryFn: () => apiFetchAdmin<BackupStatus>("/admin/backup/status"),
    refetchInterval: 30000,
  });

  const runBackupMutation = useMutation({
    mutationFn: () => apiFetchAdmin("/admin/backup/run", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backup-status"] }),
  });

  const handleExport = async () => {
    setExportLoading(true);
    setExportError(null);
    try {
      const res = await fetch(`${API}/admin/backup/export-tenant`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: undefined }),
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tenant-export-${new Date().toISOString().split("T")[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const health = data?.health;
  const statusColor = health?.status === "ok"
    ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
    : health?.status === "warning"
    ? "text-amber-600 bg-amber-500/10 border-amber-500/20"
    : "text-red-600 bg-red-500/10 border-red-500/20";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> Backup & Disaster Recovery
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage automated database backups, data exports, and recovery status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
          >
            {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export All Data
          </button>
          <button
            onClick={() => runBackupMutation.mutate()}
            disabled={runBackupMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {runBackupMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
            Run Backup Now
          </button>
        </div>
      </div>

      {runBackupMutation.isSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Backup completed successfully.
        </div>
      )}
      {runBackupMutation.isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Backup failed. Check server logs for details.
        </div>
      )}
      {exportError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {exportError}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Unable to load backup status from API.</p>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 col-span-1 md:col-span-2">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Backup Health</span>
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider", statusColor)}>
                  {health?.status ?? "unknown"}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Last Backup</span>
                  <span className="text-xs font-medium text-foreground">
                    {health?.lastBackupAt
                      ? new Date(health.lastBackupAt).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Backup Age</span>
                  <span className="text-xs font-medium text-foreground">
                    {health?.ageHours != null ? `${health.ageHours}h ago` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Last Backup Size</span>
                  <span className="text-xs font-medium text-foreground">
                    {formatBytes(health?.lastBackupSizeBytes ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-muted-foreground">Details</span>
                  <span className="text-xs text-muted-foreground max-w-[60%] text-right">{health?.details ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Storage</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-foreground">{data.totalCount}</div>
                  <div className="text-xs text-muted-foreground">Total backups on disk</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/30 rounded-lg p-2 text-center">
                    <div className="text-base font-bold text-foreground">{data.dailyCount}</div>
                    <div className="text-[10px] text-muted-foreground">Daily</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2 text-center">
                    <div className="text-base font-bold text-foreground">{data.weeklyCount}</div>
                    <div className="text-[10px] text-muted-foreground">Weekly</div>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  Policy: 7 daily + 4 weekly backups retained automatically.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-primary" /> Backup Files
              </span>
              <span className="text-xs text-muted-foreground">{data.backups.length} files</span>
            </div>
            {data.backups.length === 0 ? (
              <div className="py-12 text-center">
                <HardDrive className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No backup files found.</p>
                <p className="text-xs text-muted-foreground mt-1">Run a backup to create the first file.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.backups.slice(0, 15).map(backup => (
                  <div key={backup.filename} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0",
                        backup.label === "weekly"
                          ? "text-violet-600 bg-violet-500/10 border-violet-500/20"
                          : "text-blue-600 bg-blue-500/10 border-blue-500/20"
                      )}>
                        {backup.label}
                      </div>
                      <span className="text-xs font-mono text-foreground truncate">{backup.filename}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground">{formatBytes(backup.sizeBytes)}</span>
                      <span className="text-xs text-muted-foreground">{new Date(backup.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-primary" /> Data Export (GDPR)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Export all tenant data as a ZIP archive containing JSON files for each
                database table. Use for GDPR data portability requests or offline analysis.
              </p>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download Full Export
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary" /> Recovery Documentation
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Full disaster recovery playbook including point-in-time restore,
                migration rollbacks, and data retention policy.
              </p>
              <div className="space-y-1">
                {[
                  "docs/disaster-recovery.md",
                  "scripts/rollback/README.md",
                  "scripts/backup-db.sh",
                ].map(doc => (
                  <div key={doc} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3 text-primary/60 shrink-0" />
                    <span className="font-mono">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── CMS Posts Panel ──────────────────────────────────────────────────────────

interface CmsPost {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  contentType: string;
  status: string;
  featuredImage?: string;
  metaDescription?: string;
  publishedAt?: string;
  updatedAt: string;
}

const CONTENT_TYPE_OPTIONS = ["blog", "case-study", "investor-letter", "update"];
const CONTENT_TYPE_LABELS: Record<string, string> = {
  "blog": "Blog Post",
  "case-study": "Case Study",
  "investor-letter": "Investor Letter",
  "update": "Platform Update",
};

function FeaturedImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API}/cms/posts/upload-image`, { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      onChange(json.data?.url ?? json.url ?? "");
    } catch {
      alert("Image upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative rounded-md overflow-hidden bg-muted/20 border border-border" style={{ height: "80px" }}>
          <img src={value} alt="Featured" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 w-full px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
        {value ? "Replace image" : "Upload image"}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function renderMarkdownPreview(content: string): React.ReactNode[] {
  const blocks = content.split(/\n{2,}/).filter(b => b.trim());
  return blocks.map((block, i) => {
    const t = block.trim();
    if (t.startsWith("## ")) return <h2 key={i} className="text-base font-bold text-foreground mt-4 mb-1">{t.slice(3)}</h2>;
    if (t.startsWith("### ")) return <h3 key={i} className="text-sm font-semibold text-foreground mt-3 mb-0.5">{t.slice(4)}</h3>;
    const escaped = escapeHtml(t);
    const inline = escaped.replace(/\*\*(.+?)\*\*/g, (_m, w: string) => `<strong>${w}</strong>`).replace(/\*(.+?)\*/g, (_m, w: string) => `<em>${w}</em>`);
    return <p key={i} className="text-[13px] text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: inline }} />;
  });
}

function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const TOOLBAR = [
    { label: "B", title: "Bold", wrap: ["**", "**"] as [string, string] },
    { label: "I", title: "Italic", wrap: ["*", "*"] as [string, string] },
    { label: "H2", title: "Heading 2", prefix: "## " },
    { label: "H3", title: "Heading 3", prefix: "### " },
  ];

  const insertMarkdown = (wrap?: [string, string], prefix?: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    let replacement: string;
    let newCursorStart: number;
    let newCursorEnd: number;
    if (prefix) {
      replacement = prefix + selected;
      newCursorStart = start + prefix.length;
      newCursorEnd = newCursorStart + selected.length;
    } else if (wrap) {
      replacement = wrap[0] + selected + wrap[1];
      newCursorStart = start + wrap[0].length;
      newCursorEnd = newCursorStart + selected.length;
    } else {
      return;
    }
    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newCursorStart, newCursorEnd);
    });
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API}/cms/posts/upload-image`, { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      const url: string = json.data?.url ?? json.url;
      const ta = textareaRef.current;
      const pos = ta ? ta.selectionStart : value.length;
      const markdown = `\n![${file.name}](${url})\n`;
      onChange(value.slice(0, pos) + markdown + value.slice(pos));
    } catch {
      alert("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-muted/30 border-b border-border px-2 py-1.5 gap-2">
        <div className="flex items-center gap-1">
          {TOOLBAR.map(t => (
            <button
              key={t.label}
              type="button"
              title={t.title}
              onClick={() => insertMarkdown(t.wrap, t.prefix)}
              className="px-2 py-0.5 rounded text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {t.label}
            </button>
          ))}
          <span className="w-px h-3 bg-border mx-1 inline-block" />
          <button
            type="button"
            title="Upload image"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Image className="w-3 h-3" />}
            <span>Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
          />
          <span className="text-[10px] text-muted-foreground/40 ml-1">Markdown</span>
        </div>
        <div className="flex rounded-md overflow-hidden border border-border text-[10px] font-medium">
          {(["write", "preview"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn("px-2.5 py-1 capitalize transition-colors", tab === t ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={16}
          placeholder="Write your content here. Use ## for headings, **bold**, *italic*, and blank lines to separate paragraphs…"
          className="w-full bg-background px-3 py-2.5 text-sm text-foreground font-mono leading-relaxed focus:outline-none resize-y"
          style={{ minHeight: "280px" }}
        />
      ) : (
        <div className="bg-background px-4 py-3 space-y-2 overflow-auto" style={{ minHeight: "280px" }}>
          {value.trim() ? renderMarkdownPreview(value) : <p className="text-xs text-muted-foreground/40 italic">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}

function CmsPostsPanel() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<CmsPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterType, setFilterType] = useState<string>("");
  const [form, setForm] = useState<Partial<CmsPost>>({});
  const [saveError, setSaveError] = useState("");

  const { data: draftsResult, isLoading } = useQuery({
    queryKey: ["cms-posts", filterType],
    queryFn: () => apiFetchAdmin<CmsPost[]>(filterType ? `/cms/posts?content_type=${filterType}&status=draft` : "/cms/posts?status=draft"),
  });

  const { data: publishedResult } = useQuery({
    queryKey: ["cms-posts-published", filterType],
    queryFn: () => apiFetchAdmin<CmsPost[]>(filterType ? `/cms/posts?content_type=${filterType}` : "/cms/posts"),
  });

  const allPosts: CmsPost[] = (() => {
    const published: CmsPost[] = Array.isArray(publishedResult) ? publishedResult : [];
    const drafts: CmsPost[] = Array.isArray(draftsResult) ? draftsResult : [];
    const seen = new Set<number>();
    const combined: CmsPost[] = [];
    for (const p of [...published, ...drafts]) {
      if (!seen.has(p.id)) { seen.add(p.id); combined.push(p); }
    }
    return combined.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  })();

  const saveMutation = useMutation({
    mutationFn: async (vals: Partial<CmsPost>) => {
      if (isNew) {
        return apiFetchAdmin("/cms/posts", { method: "POST", body: JSON.stringify(vals) });
      } else {
        return apiFetchAdmin(`/cms/posts/${editing!.id}`, { method: "PUT", body: JSON.stringify(vals) });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-posts"] });
      qc.invalidateQueries({ queryKey: ["cms-posts-published"] });
      setEditing(null);
      setIsNew(false);
      setSaveError("");
    },
    onError: (err: Error) => {
      setSaveError(err.message || "Save failed. Check required fields.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiFetchAdmin(`/cms/posts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-posts"] });
      qc.invalidateQueries({ queryKey: ["cms-posts-published"] });
    },
  });

  const openNew = () => {
    setIsNew(true);
    setEditing({} as CmsPost);
    setForm({ contentType: "blog", status: "draft", title: "", slug: "", content: "", excerpt: "", metaDescription: "" });
    setSaveError("");
  };

  const openEdit = (post: CmsPost) => {
    setIsNew(false);
    setEditing(post);
    setForm({ ...post });
    setSaveError("");
  };

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const handleTitleChange = (title: string) => {
    setForm(f => ({
      ...f,
      title,
      ...(isNew && !f.slug ? { slug: generateSlug(title) } : {}),
    }));
  };

  const handlePublish = () => {
    saveMutation.mutate({ ...form, status: "published", publishedAt: form.publishedAt || new Date().toISOString() });
  };

  const handleSaveDraft = () => {
    saveMutation.mutate({ ...form, status: "draft" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> CMS Posts
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Blog posts, case studies, investor letters, and platform updates</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">All types</option>
            {CONTENT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>)}
          </select>
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Post
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : allPosts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-sm text-muted-foreground">No posts yet. Create your first post.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {allPosts.map(post => (
            <div key={post.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{post.title}</span>
                  <StatusBadge status={post.status} />
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{CONTENT_TYPE_LABELS[post.contentType] ?? post.contentType}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="font-mono">{post.slug}</span>
                  <span>·</span>
                  <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Draft"}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => openEdit(post)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { if (confirm("Delete this post?")) deleteMutation.mutate(post.id); }} className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing !== null && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <m.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl w-full max-w-3xl my-4 shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">{isNew ? "New Post" : "Edit Post"}</h3>
                  {!isNew && <StatusBadge status={form.status ?? "draft"} />}
                </div>
                <button onClick={() => { setEditing(null); setIsNew(false); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {saveError && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {saveError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Title *</label>
                    <input
                      value={form.title ?? ""}
                      onChange={e => handleTitleChange(e.target.value)}
                      placeholder="Enter post title…"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Slug *</label>
                    <input
                      value={form.slug ?? ""}
                      onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                      placeholder="url-friendly-slug"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Content Type *</label>
                    <select
                      value={form.contentType ?? "blog"}
                      onChange={e => setForm(f => ({ ...f, contentType: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      {CONTENT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Excerpt</label>
                  <textarea
                    value={form.excerpt ?? ""}
                    onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                    rows={2}
                    placeholder="Brief summary shown in listing views…"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  />
                </div>

                <MarkdownEditor
                  value={form.content ?? ""}
                  onChange={val => setForm(f => ({ ...f, content: val }))}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Featured Image</label>
                    <FeaturedImageUpload
                      value={form.featuredImage ?? ""}
                      onChange={url => setForm(f => ({ ...f, featuredImage: url }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Publish Date</label>
                    <input
                      type="date"
                      value={form.publishedAt ? form.publishedAt.split("T")[0] : ""}
                      onChange={e => setForm(f => ({ ...f, publishedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Meta Description (SEO)</label>
                  <textarea
                    value={form.metaDescription ?? ""}
                    onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                    rows={2}
                    placeholder="SEO meta description for this post…"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-5 border-t border-border/50">
                <button onClick={() => { setEditing(null); setIsNew(false); }} className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDraft}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Draft
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {form.status === "published" ? "Update Published" : "Publish"}
                  </button>
                </div>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

// ─── Feedback & NPS Panel ────────────────────────────────────────────────────

interface FeedbackAnalytics {
  nps: {
    score: number | null;
    avgScore: number | null;
    total: number;
    promoters: number;
    passives: number;
    detractors: number;
    promoterPct: number;
    passivePct: number;
    detractorPct: number;
  };
  npsOverTime: { week: string; avgScore: number; count: number }[];
  perAppNps: { appName: string | null; avgScore: number; count: number; promoters: number; detractors: number }[];
  contextual: { total: number; positive: number; negative: number; neutral: number };
  sentimentBreakdown: { sentiment: string | null; count: number }[];
  recentComments: {
    id: number;
    type: string;
    score: number | null;
    sentiment: string | null;
    comment: string | null;
    appName: string | null;
    pageUrl: string | null;
    userRole: string | null;
    createdAt: string;
  }[];
}

function NpsScoreGauge({ score }: { score: number | null }) {
  if (score === null) return (
    <div className="text-center py-4">
      <div className="text-4xl font-black text-muted-foreground">—</div>
      <div className="text-xs text-muted-foreground mt-1">No data yet</div>
    </div>
  );
  const color = score >= 50 ? "text-emerald-500" : score >= 0 ? "text-amber-500" : "text-red-500";
  const label = score >= 50 ? "Excellent" : score >= 20 ? "Good" : score >= 0 ? "Needs work" : "Critical";
  return (
    <div className="text-center py-2">
      <div className={cn("text-5xl font-black tabular-nums", color)}>{score > 0 ? "+" : ""}{score}</div>
      <div className={cn("text-xs font-semibold mt-1", color)}>{label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">NPS Score</div>
    </div>
  );
}

function FeedbackPanel() {
  const [typeFilter, setTypeFilter] = useState<"all" | "nps" | "contextual">("all");
  const [page, setPage] = useState(1);

  const { data: analytics, isLoading: analyticsLoading } = useQuery<FeedbackAnalytics>({
    queryKey: ["feedback-analytics"],
    queryFn: () => apiFetchAdmin<FeedbackAnalytics>("/admin/feedback/analytics"),
    refetchInterval: 60000,
  });

  const { data: listData, isLoading: listLoading } = useQuery<{
    data: FeedbackAnalytics["recentComments"];
    pagination: { total: number; page: number; limit: number; pages: number };
  }>({
    queryKey: ["feedback-list", typeFilter, page],
    queryFn: () => apiFetchAdmin(`/admin/feedback/list?type=${typeFilter === "all" ? "" : typeFilter}&page=${page}&limit=10`),
    refetchInterval: 60000,
  });

  const nps = analytics?.nps;
  const contextual = analytics?.contextual;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <SmilePlus className="w-4 h-4 text-primary" /> Feedback & NPS Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">User sentiment, NPS scores, and contextual feedback across all apps.</p>
      </div>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <>
          {/* ─── NPS Overview ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center">
              <NpsScoreGauge score={nps?.score ?? null} />
              <div className="w-full mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-medium">Promoters (9-10)</span>
                  <span className="text-foreground font-bold">{nps?.promoters ?? 0} <span className="text-muted-foreground font-normal">({nps?.promoterPct ?? 0}%)</span></span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${nps?.promoterPct ?? 0}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-600 font-medium">Passives (7-8)</span>
                  <span className="text-foreground font-bold">{nps?.passives ?? 0} <span className="text-muted-foreground font-normal">({nps?.passivePct ?? 0}%)</span></span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${nps?.passivePct ?? 0}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600 font-medium">Detractors (0-6)</span>
                  <span className="text-foreground font-bold">{nps?.detractors ?? 0} <span className="text-muted-foreground font-normal">({nps?.detractorPct ?? 0}%)</span></span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${nps?.detractorPct ?? 0}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-primary" /> Contextual Feedback
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Positive", value: contextual?.positive ?? 0, total: contextual?.total ?? 0, color: "bg-emerald-500", textColor: "text-emerald-600", icon: ThumbsUp },
                  { label: "Negative", value: contextual?.negative ?? 0, total: contextual?.total ?? 0, color: "bg-red-500", textColor: "text-red-600", icon: ThumbsDown },
                  { label: "Neutral", value: contextual?.neutral ?? 0, total: contextual?.total ?? 0, color: "bg-muted-foreground", textColor: "text-muted-foreground", icon: MessageSquare },
                ].map(s => {
                  const pct = s.total > 0 ? Math.round((s.value / s.total) * 100) : 0;
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn("flex items-center gap-1 font-medium", s.textColor)}>
                          <Icon className="w-3 h-3" /> {s.label}
                        </span>
                        <span className="text-foreground font-bold">{s.value} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", s.color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-1 border-t border-border/50">
                <div className="text-xs text-muted-foreground">{contextual?.total ?? 0} total responses</div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" /> NPS by App
              </h3>
              {!analytics?.perAppNps?.length ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No per-app data yet.</p>
              ) : (
                <div className="space-y-2">
                  {(analytics.perAppNps ?? []).slice(0, 6).map(app => {
                    const appNps = app.count > 0
                      ? Math.round(((app.promoters - app.detractors) / app.count) * 100)
                      : null;
                    const npsColor = appNps === null ? "text-muted-foreground" : appNps >= 50 ? "text-emerald-500" : appNps >= 0 ? "text-amber-500" : "text-red-500";
                    return (
                      <div key={app.appName ?? "unknown"} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                        <div>
                          <div className="text-xs font-medium text-foreground">{app.appName ?? "Unknown"}</div>
                          <div className="text-[10px] text-muted-foreground">{app.count} responses · avg {app.avgScore}</div>
                        </div>
                        <div className={cn("text-sm font-black tabular-nums", npsColor)}>
                          {appNps !== null ? (appNps > 0 ? `+${appNps}` : String(appNps)) : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ─── Recent Comments ─── */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" /> Recent Comments
              </h3>
            </div>
            {!analytics?.recentComments?.length ? (
              <p className="text-xs text-muted-foreground text-center py-4">No comments submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {(analytics.recentComments ?? []).slice(0, 8).map(c => {
                  const sentimentColor = c.sentiment === "positive" ? "text-emerald-600 bg-emerald-500/8 border-emerald-500/20" : c.sentiment === "negative" ? "text-red-600 bg-red-500/8 border-red-500/20" : "text-muted-foreground bg-muted/40 border-border";
                  const scoreColor = c.score !== null ? (c.score >= 9 ? "bg-emerald-500 text-white" : c.score >= 7 ? "bg-amber-500 text-white" : "bg-red-500 text-white") : "bg-muted text-muted-foreground";
                  return (
                    <div key={c.id} className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {c.type === "nps" ? (
                          <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black", scoreColor)}>{c.score}</span>
                        ) : (
                          <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center border text-[10px] font-semibold", sentimentColor)}>
                            {c.sentiment === "positive" ? "👍" : c.sentiment === "negative" ? "👎" : "💬"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-relaxed">{c.comment}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {c.appName && <span className="text-[10px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded">{c.appName}</span>}
                          {c.userRole && <span className="text-[10px] text-muted-foreground">{c.userRole}</span>}
                          <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── All Feedback Table ─── */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
              <h3 className="text-xs font-semibold text-foreground">All Feedback</h3>
              <div className="flex items-center gap-1.5">
                {(["all", "nps", "contextual"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTypeFilter(t); setPage(1); }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors capitalize",
                      typeFilter === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {listLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              </div>
            ) : !listData?.data?.length ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No feedback entries found.</div>
            ) : (
              <>
                <div className="divide-y divide-border/40">
                  {listData.data.map(entry => {
                    const scoreColor = entry.score !== null ? (entry.score >= 9 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : entry.score >= 7 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-red-500/10 text-red-600 border-red-500/20") : null;
                    const sentimentIcon = entry.sentiment === "positive" ? "👍" : entry.sentiment === "negative" ? "👎" : "💬";
                    return (
                      <div key={entry.id} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                        <div className="flex-shrink-0 mt-0.5">
                          {entry.type === "nps" && entry.score !== null ? (
                            <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded border", scoreColor)}>{entry.score}</span>
                          ) : (
                            <span className="text-sm">{sentimentIcon}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded", entry.type === "nps" ? "bg-blue-500/10 text-blue-600" : "bg-violet-500/10 text-violet-600")}>{entry.type}</span>
                            {entry.appName && <span className="text-[10px] text-muted-foreground">{entry.appName}</span>}
                            {entry.userRole && <span className="text-[10px] text-muted-foreground">· {entry.userRole}</span>}
                            <span className="text-[10px] text-muted-foreground ml-auto">{new Date(entry.createdAt).toLocaleDateString()}</span>
                          </div>
                          {entry.comment && <p className="text-xs text-foreground mt-1 leading-relaxed">{entry.comment}</p>}
                          {!entry.comment && <p className="text-xs text-muted-foreground mt-0.5 italic">No comment</p>}
                          {entry.pageUrl && <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">{entry.pageUrl}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {listData.pagination && listData.pagination.pages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground">
                      {listData.pagination.total} total · page {listData.pagination.page} of {listData.pagination.pages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors">← Prev</button>
                      <button onClick={() => setPage(p => Math.min(listData.pagination.pages, p + 1))} disabled={page === listData.pagination.pages} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors">Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

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

  const { data, isLoading, isError, refetch } = useQuery<ProvisioningData>({
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
            {activeSection === "provisioning" && <ProvisioningPanel />}
          </m.div>
        </main>
      </div>
    </div>
  );
}
