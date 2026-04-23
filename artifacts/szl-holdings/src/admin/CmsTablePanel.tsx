import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronUp,
  Edit3,
  FileText,
  Globe,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { type Article, type ContactSubmission, type HoldingsInquiry, type Site, type Venture, apiFetch } from './api';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const cls =
    s === 'published' || s === 'active' || s === 'completed'
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      : s === 'draft' || s === 'in_progress'
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        : 'bg-muted text-muted-foreground border-border';
  return (
    <span
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider',
        cls,
      )}
    >
      {status}
    </span>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function DashboardPanel() {
  const { data: sites } = useStandardQuery({
    queryKey: ['cms-sites'],
    queryFn: () => apiFetch<Site[]>('/cms/sites'),
  });
  const { data: venturesData } = useStandardQuery({
    queryKey: ['cms-ventures'],
    queryFn: () => apiFetch<Venture[]>('/cms/ventures'),
  });
  const { data: articlesData } = useStandardQuery({
    queryKey: ['cms-articles'],
    queryFn: () => apiFetch<{ data: Article[] }>('/cms/articles'),
  });
  const { data: submissionsData } = useStandardQuery({
    queryKey: ['cms-submissions'],
    queryFn: () => apiFetch<{ data: ContactSubmission[] }>('/cms/contact-submissions'),
  });

  const ventures = Array.isArray(venturesData) ? venturesData : [];
  const articles = articlesData?.data ?? [];
  const submissions = submissionsData?.data ?? [];

  const stats = [
    { label: 'Sites', value: sites?.length ?? 0, icon: Globe, color: 'text-blue-500' },
    { label: 'Ventures', value: ventures.length, icon: Building2, color: 'text-violet-500' },
    { label: 'Articles', value: articles.length, icon: FileText, color: 'text-emerald-500' },
    { label: 'Submissions', value: submissions.length, icon: Mail, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Content Overview</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage all CMS content for the SZL ecosystem.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center mb-3',
                  `${s.color.replace('text-', 'bg-')}/10`,
                )}
              >
                <Icon className={cn('w-4 h-4', s.color)} />
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
          {(sites ?? []).map((site) => (
            <div
              key={site.id}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <div>
                <div className="text-sm font-medium text-foreground">{site.name}</div>
                <div className="text-xs text-muted-foreground">{site.slug}</div>
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                  site.isActive
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border-border',
                )}
              >
                {site.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" /> Recent Submissions
          {submissions.length > 0 && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {submissions.length}
            </span>
          )}
        </h3>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{s.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.email} · {s.formKey}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Generic CMS Table Panel ──────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'boolean' | 'number';
  options?: string[];
  required?: boolean;
  format?: 'slug' | 'url' | 'email';
  maxLength?: number;
}

const SLUG_RE = /^[a-z0-9-_]+$/;
const URL_RE = /^https?:\/\/.+/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function inferFormat(fd: FieldDef): FieldDef['format'] | undefined {
  if (fd.format) return fd.format;
  const k = fd.key.toLowerCase();
  if (k === 'slug') return 'slug';
  if (k === 'email') return 'email';
  if (k.endsWith('url')) return 'url';
  return undefined;
}

function validateField(fd: FieldDef, raw: unknown): string | undefined {
  const required = fd.required;
  const format = inferFormat(fd);
  if (fd.type === 'boolean') return undefined;
  const val =
    raw === undefined || raw === null
      ? ''
      : typeof raw === 'string'
        ? raw.trim()
        : String(raw).trim();
  if (!val) {
    if (required) return `${fd.label} is required`;
    return undefined;
  }
  if (fd.maxLength && val.length > fd.maxLength) {
    return `${fd.label} must be ${fd.maxLength} characters or fewer`;
  }
  if (fd.type === 'number' && !/^-?\d+(\.\d+)?$/.test(val)) {
    return `${fd.label} must be a number`;
  }
  if (format === 'slug' && !SLUG_RE.test(val)) {
    return 'Use lowercase letters, numbers, hyphens or underscores only';
  }
  if (format === 'url' && !URL_RE.test(val)) {
    return 'Must be a valid URL starting with http:// or https://';
  }
  if (format === 'email' && !EMAIL_RE.test(val)) {
    return 'Must be a valid email address';
  }
  return undefined;
}

function FieldError({ msg }: { msg?: string | undefined }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 mt-1 text-[11px] text-red-500">
      <AlertCircle className="w-3 h-3 shrink-0" /> {msg}
    </p>
  );
}

function CmsTablePanel({
  title,
  icon: Icon,
  queryKey,
  endpoint,
  fields,
  renderRow,
  emptyMessage,
}: {
  title: string;
  icon: React.ElementType;
  queryKey: string[];
  endpoint: string;
  fields: FieldDef[];
  renderRow: (
    item: Record<string, string | number | boolean | null | undefined>,
  ) => React.ReactNode;
  emptyMessage?: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const { data, isLoading } = useStandardQuery({
    queryKey,
    queryFn: () => apiFetch<unknown>(endpoint),
  });

  const rows: Record<string, unknown>[] = Array.isArray(data)
    ? (data as Record<string, unknown>[])
    : ((data as { data?: Record<string, unknown>[] } | undefined)?.data ?? []);

  const saveMutation = useStandardMutation({
    mutationFn: async (vals: Record<string, unknown>) => {
      if (isNew) {
        return apiFetch(endpoint, { method: 'POST', body: JSON.stringify(vals) });
      } else {
        return apiFetch(`${endpoint}/${editing?.id}`, {
          method: 'PATCH',
          body: JSON.stringify(vals),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setEditing(null);
      setIsNew(false);
    },
  });

  const deleteMutation = useStandardMutation({
    mutationFn: async (id: number) => apiFetch(`${endpoint}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const openEdit = (item: Record<string, unknown>) => {
    setIsNew(false);
    setEditing(item);
    const f: Record<string, string | number | boolean> = {};
    fields.forEach((fd) => {
      const v = item[fd.key];
      if (v === null || v === undefined) {
        f[fd.key] = fd.type === 'boolean' ? false : '';
      } else if (fd.type === 'boolean') {
        f[fd.key] = Boolean(v);
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        f[fd.key] = String(v);
      } else {
        f[fd.key] = v as string;
      }
    });
    setForm(f);
    setTouched({});
    setSubmitAttempted(false);
  };

  const openNew = () => {
    setIsNew(true);
    setEditing({});
    const f: Record<string, string | number | boolean> = {};
    fields.forEach((fd) => {
      f[fd.key] = fd.type === 'boolean' ? false : '';
    });
    setForm(f);
    setTouched({});
    setSubmitAttempted(false);
  };

  const closeModal = () => {
    setEditing(null);
    setIsNew(false);
    setTouched({});
    setSubmitAttempted(false);
  };

  const fieldErrors: Record<string, string> = {};
  fields.forEach((fd) => {
    const err = validateField(fd, form[fd.key]);
    if (err) fieldErrors[fd.key] = err;
  });
  const hasErrors = Object.keys(fieldErrors).length > 0;
  const showErr = (key: string) => (touched[key] || submitAttempted) && fieldErrors[key];

  const handleSave = () => {
    setSubmitAttempted(true);
    if (hasErrors) return;
    saveMutation.mutate(form as Record<string, unknown>);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" /> {title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rows.length} record{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage ?? 'No records yet.'}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {rows.map((item) => (
            <div
              key={(item as any).id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="flex-1 min-w-0 pr-4">
                {renderRow(item as Record<string, string | number | boolean | null | undefined>)}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(item)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this record?')) deleteMutation.mutate((item as any).id);
                  }}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
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
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <h3 className="text-sm font-semibold text-foreground">
                  {isNew ? `New ${title.replace(/s$/, '')}` : `Edit ${title.replace(/s$/, '')}`}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {submitAttempted && hasErrors && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Please fix the errors below
                    before saving.
                  </div>
                )}
                {fields.map((fd) => {
                  const errMsg = showErr(fd.key) ? fieldErrors[fd.key] : undefined;
                  const inputCls = cn(
                    'w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 transition-colors',
                    errMsg
                      ? 'border-red-500/60 focus:ring-red-500/30'
                      : 'border-border focus:ring-primary/50',
                  );
                  const onBlur = () => setTouched((t) => ({ ...t, [fd.key]: true }));
                  return (
                    <div key={fd.key}>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        {fd.label}
                        {fd.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      {fd.type === 'textarea' ? (
                        <textarea
                          value={(form[fd.key] as string) ?? ''}
                          onChange={(e) => setForm((p) => ({ ...p, [fd.key]: e.target.value }))}
                          onBlur={onBlur}
                          rows={4}
                          className={cn(inputCls, 'resize-none')}
                        />
                      ) : fd.type === 'select' ? (
                        <select
                          value={(form[fd.key] as string) ?? ''}
                          onChange={(e) => setForm((p) => ({ ...p, [fd.key]: e.target.value }))}
                          onBlur={onBlur}
                          className={inputCls}
                        >
                          {fd.options?.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : fd.type === 'boolean' ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!form[fd.key]}
                            onChange={(e) => setForm((p) => ({ ...p, [fd.key]: e.target.checked }))}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">Enabled</span>
                        </label>
                      ) : (
                        <input
                          type={fd.type === 'number' ? 'number' : 'text'}
                          value={
                            form[fd.key] === undefined || form[fd.key] === null
                              ? ''
                              : String(form[fd.key])
                          }
                          onChange={(e) => setForm((p) => ({ ...p, [fd.key]: e.target.value }))}
                          onBlur={onBlur}
                          className={inputCls}
                        />
                      )}
                      {errMsg && <FieldError msg={errMsg} />}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 p-5 border-t border-border/50">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50',
                    submitAttempted && hasErrors && !saveMutation.isPending
                      ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20'
                      : 'bg-primary text-white hover:bg-primary/90',
                  )}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {submitAttempted && hasErrors && !saveMutation.isPending
                    ? 'Fix errors above'
                    : 'Save'}
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
  const { data, isLoading, refetch } = useStandardQuery({
    queryKey: ['cms-submissions'],
    queryFn: () => apiFetch<{ data: ContactSubmission[] }>('/cms/contact-submissions'),
  });

  const submissions = data?.data ?? [];
  const [expanded, setExpanded] = useState<number | null>(null);

  const formKeyColors: Record<string, string> = {
    szl_contact: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    vessels_demo: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    inca_access: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    carlota_private_inquiry: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    stephen_contact: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Contact Submissions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No submissions yet. Forms will appear here when completed.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {submissions.map((s) => (
            <div key={s.id}>
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
                      formKeyColors[s.formKey] ?? 'bg-muted text-muted-foreground border-border',
                    )}
                  >
                    {s.formKey}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{s.fullName}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                  {expanded === s.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {expanded === s.id && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 bg-muted/20">
                      {s.company && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Company: </span>
                          <span className="text-foreground">{s.company}</span>
                        </div>
                      )}
                      {s.message && (
                        <div className="text-xs text-foreground bg-background border border-border rounded-lg p-3 leading-relaxed">
                          {s.message}
                        </div>
                      )}
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
    { event: 'page_view', count: 'Track on each route', description: 'Every page navigation' },
    {
      event: 'cta_click',
      count: 'CTA interactions',
      description: 'Button and link clicks with label',
    },
    { event: 'form_submit', count: 'Form completions', description: 'All form submissions' },
    { event: 'demo_request', count: 'Demo requests', description: 'SEXTANT demo form' },
    { event: 'access_request', count: 'Access requests', description: 'AI research access form' },
    {
      event: 'private_inquiry_submit',
      count: 'Private inquiries',
      description: 'Carlota Jo inquiry form',
    },
    { event: 'article_view', count: 'Article views', description: 'Article detail page loads' },
    { event: 'case_study_view', count: 'Case study views', description: 'Case study page loads' },
    { event: 'download_asset', count: 'Asset downloads', description: 'File and PDF downloads' },
    { event: 'sign_in', count: 'Sign in events', description: 'Authentication completions' },
    {
      event: 'dashboard_view',
      count: 'Dashboard loads',
      description: 'Authenticated dashboard views',
    },
    { event: 'alert_view', count: 'Alert views', description: 'Alert detail views' },
    { event: 'report_view', count: 'Report views', description: 'Report page views' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Analytics Event Taxonomy
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          All analytics events fire via window.gtag and the analytics utility.
        </p>
      </div>
      <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
        {eventSummary.map((e) => (
          <div key={e.event} className="px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <code className="text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 rounded">
                  {e.event}
                </code>
                <p className="text-xs text-muted-foreground mt-1">{e.description}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{e.count}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <p className="text-xs text-amber-600 font-medium">Event Properties</p>
        <p className="text-xs text-muted-foreground mt-1">
          All events include: <code className="font-mono">site</code>,{' '}
          <code className="font-mono">page</code>, <code className="font-mono">section</code>,{' '}
          <code className="font-mono">cta_label</code>, <code className="font-mono">form_key</code>,{' '}
          <code className="font-mono">content_slug</code>
        </p>
      </div>
    </div>
  );
}

// ─── Inquiries Panel ──────────────────────────────────────────────────────────

function InquiriesPanel() {
  const { data, isLoading, refetch } = useStandardQuery({
    queryKey: ['holdings-inquiries'],
    queryFn: () => apiFetch<HoldingsInquiry[]>('/holdings/inquiries'),
  });

  const inquiries = data ?? [];
  const [expanded, setExpanded] = useState<number | null>(null);

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    read: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    replied: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    closed: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Demo &amp; Lead Inquiries
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {inquiries.length} inquiry{inquiries.length !== 1 ? 'ies' : 'y'} — with UTM source
            attribution
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No inquiries yet. Demo and access request submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {inquiries.map((inq) => {
            const hasUtm = inq.utmSource || inq.utmMedium || inq.utmCampaign || inq.utmContent;
            return (
              <div key={inq.id}>
                <button
                  onClick={() => setExpanded(expanded === inq.id ? null : inq.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 uppercase tracking-wider',
                        statusColors[inq.status] ?? 'bg-muted text-muted-foreground border-border',
                      )}
                    >
                      {inq.status}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {inq.name}
                        {inq.company ? ` · ${inq.company}` : ''}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{inq.subject}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {hasUtm && (
                      <span className="flex items-center gap-1 text-[10px] text-cyan-600 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full font-semibold">
                        <Tag className="w-2.5 h-2.5" /> UTM
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </span>
                    {expanded === inq.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                <AnimatePresence>
                  {expanded === inq.id && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2 bg-muted/20">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Email: </span>
                          <span className="text-foreground">{inq.email}</span>
                        </div>
                        {inq.message && (
                          <div className="text-xs text-foreground bg-background border border-border rounded-lg p-3 leading-relaxed">
                            {inq.message}
                          </div>
                        )}
                        {hasUtm && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {inq.utmSource && (
                              <span className="text-[10px] font-mono bg-cyan-500/8 border border-cyan-500/20 text-cyan-700 px-2 py-1 rounded">
                                source: {inq.utmSource}
                              </span>
                            )}
                            {inq.utmMedium && (
                              <span className="text-[10px] font-mono bg-cyan-500/8 border border-cyan-500/20 text-cyan-700 px-2 py-1 rounded">
                                medium: {inq.utmMedium}
                              </span>
                            )}
                            {inq.utmCampaign && (
                              <span className="text-[10px] font-mono bg-cyan-500/8 border border-cyan-500/20 text-cyan-700 px-2 py-1 rounded">
                                campaign: {inq.utmCampaign}
                              </span>
                            )}
                            {inq.utmContent && (
                              <span className="text-[10px] font-mono bg-cyan-500/8 border border-cyan-500/20 text-cyan-700 px-2 py-1 rounded">
                                content: {inq.utmContent}
                              </span>
                            )}
                          </div>
                        )}
                        {!hasUtm && (
                          <p className="text-[11px] text-muted-foreground italic">
                            No UTM attribution — direct or organic traffic.
                          </p>
                        )}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export {
  AnalyticsPanel,
  CmsTablePanel,
  DashboardPanel,
  InquiriesPanel,
  StatusBadge,
  SubmissionsPanel,
};
