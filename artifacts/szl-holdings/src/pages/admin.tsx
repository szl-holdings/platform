import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { m, AnimatePresence } from "framer-motion";
import {
  Settings, Edit3, Shield, CheckCircle2, AlertCircle, Loader2, Save, Plus, Trash2,
  ChevronRight, Eye, EyeOff, Building2, BarChart3, Mail, FileText, Globe, Layers,
  Lock, ArrowLeft, RefreshCw, Users, Map, BookOpen, Star, MessageSquare,
  HelpCircle, MousePointer, Navigation, Image, Gauge, ClipboardList, X,
  TrendingUp, CheckSquare, Circle, Clock, ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

const DEFAULT_PIN = "szl2026";

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
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

// ─── PIN Gate ────────────────────────────────────────────────────────────────

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === DEFAULT_PIN) {
      onUnlock();
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 2000);
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
              <AlertCircle className="w-3.5 h-3.5" /> Incorrect PIN. Try again.
            </p>
          )}
          <button type="submit" disabled={!pin} className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Unlock Admin
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-6">Default PIN: szl2026</p>
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
  renderRow: (item: any) => React.ReactNode;
  emptyMessage?: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => apiFetch<any>(endpoint),
  });

  const rows: any[] = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: async (vals: Record<string, unknown>) => {
      if (isNew) {
        return apiFetch(endpoint, { method: "POST", body: JSON.stringify(vals) });
      } else {
        return apiFetch(`${endpoint}/${(editing as any).id}`, { method: "PATCH", body: JSON.stringify(vals) });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); setEditing(null); setIsNew(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiFetch(`${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const openEdit = (item: any) => {
    setIsNew(false);
    setEditing(item);
    const f: Record<string, string | boolean> = {};
    fields.forEach(fd => { f[fd.key] = (item as any)[fd.key] ?? ""; });
    setForm(f);
  };

  const openNew = () => {
    setIsNew(true);
    setEditing({} as any);
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
              <div className="flex-1 min-w-0 pr-4">{renderRow(item)}</div>
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

// ─── Site Sections ────────────────────────────────────────────────────────────

const ADMIN_SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
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
  { id: "analytics", label: "Analytics", icon: BarChart3 },
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
            <StatusBadge status={item.status} />
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
            <StatusBadge status={item.status} />
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
            <StatusBadge status={item.status} />
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
            <StatusBadge status={item.status} />
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
            <StatusBadge status={item.status} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "Draft"} · <span className="font-mono">{item.slug}</span>
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
            {activeSection === "analytics" && <AnalyticsPanel />}
          </m.div>
        </main>
      </div>
    </div>
  );
}
