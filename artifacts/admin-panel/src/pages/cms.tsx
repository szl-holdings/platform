import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@workspace/shared-ui";
import {
  Globe, FileText, Layout, Package, Wrench, Star, MessageSquare, HelpCircle, Megaphone,
  BookOpen, Briefcase, Navigation, Download, Plus, Pencil, Trash2, X, Check, ChevronRight,
  RefreshCw, AlertCircle, GitBranch, Newspaper, Settings, Search, Filter, Clock,
} from "lucide-react";

type TableKey =
  | "sites" | "pages" | "sections" | "ventures" | "services" | "features" | "use_cases"
  | "roadmap_items" | "updates" | "testimonials" | "faqs" | "ctas" | "articles"
  | "case_studies" | "downloads" | "navigation_items";

interface TableDef {
  key: TableKey;
  label: string;
  icon: React.ReactNode;
  endpoint: string;
  idField: string;
  labelField: string;
  sublabelField?: string;
  fields: { name: string; label: string; type: string; required?: boolean; options?: string[] }[];
}

const TABLES: TableDef[] = [
  {
    key: "sites", label: "Sites", icon: <Globe className="w-4 h-4" />, endpoint: "/cms/sites", idField: "id", labelField: "name", sublabelField: "slug",
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "brandLabel", label: "Brand Label", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "isActive", label: "Active", type: "boolean" },
    ],
  },
  {
    key: "ventures", label: "Ventures", icon: <Package className="w-4 h-4" />, endpoint: "/cms/ventures", idField: "id", labelField: "name", sublabelField: "slug",
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "shortDescription", label: "Short Description", type: "textarea" },
      { name: "longDescription", label: "Long Description", type: "textarea" },
      { name: "statusBadge", label: "Status Badge", type: "text" },
      { name: "stage", label: "Stage", type: "text" },
      { name: "category", label: "Category", type: "text" },
      { name: "primaryCtaLabel", label: "Primary CTA Label", type: "text" },
      { name: "primaryCtaUrl", label: "Primary CTA URL", type: "text" },
      { name: "accentToken", label: "Accent Color Token", type: "text" },
      { name: "isFeatured", label: "Featured", type: "boolean" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "articles", label: "Articles", icon: <BookOpen className="w-4 h-4" />, endpoint: "/cms/articles", idField: "id", labelField: "title", sublabelField: "slug",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      { name: "authorName", label: "Author", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["draft", "published"] },
      { name: "coverImageUrl", label: "Cover Image URL", type: "text" },
      { name: "metaTitle", label: "Meta Title", type: "text" },
      { name: "metaDescription", label: "Meta Description", type: "textarea" },
      { name: "bodyRichtextOrMdx", label: "Body Content", type: "textarea" },
    ],
  },
  {
    key: "case_studies", label: "Case Studies", icon: <Briefcase className="w-4 h-4" />, endpoint: "/cms/case-studies", idField: "id", labelField: "title", sublabelField: "slug",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "challenge", label: "Challenge", type: "textarea" },
      { name: "approach", label: "Approach", type: "textarea" },
      { name: "outcome", label: "Outcome", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ["draft", "published"] },
      { name: "coverImageUrl", label: "Cover Image URL", type: "text" },
    ],
  },
  {
    key: "testimonials", label: "Testimonials", icon: <MessageSquare className="w-4 h-4" />, endpoint: "/cms/testimonials", idField: "id", labelField: "attributionName", sublabelField: "attributionCompany",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "quote", label: "Quote", type: "textarea", required: true },
      { name: "attributionName", label: "Name", type: "text" },
      { name: "attributionTitle", label: "Title", type: "text" },
      { name: "attributionCompany", label: "Company", type: "text" },
      { name: "isPublic", label: "Public", type: "boolean" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "faqs", label: "FAQs", icon: <HelpCircle className="w-4 h-4" />, endpoint: "/cms/faqs", idField: "id", labelField: "question",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answerRichtext", label: "Answer", type: "textarea", required: true },
      { name: "category", label: "Category", type: "text" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "ctas", label: "CTAs", icon: <Megaphone className="w-4 h-4" />, endpoint: "/cms/ctas", idField: "id", labelField: "label",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "label", label: "Label", type: "text", required: true },
      { name: "url", label: "URL", type: "text", required: true },
      { name: "variant", label: "Variant", type: "text" },
      { name: "helperText", label: "Helper Text", type: "text" },
    ],
  },
  {
    key: "roadmap_items", label: "Roadmap", icon: <GitBranch className="w-4 h-4" />, endpoint: "/cms/roadmap-items", idField: "id", labelField: "title",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "phaseLabel", label: "Phase Label", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["planned", "in_progress", "completed", "delayed"] },
      { name: "targetQuarter", label: "Target Quarter", type: "text" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "updates", label: "Updates", icon: <Newspaper className="w-4 h-4" />, endpoint: "/cms/updates", idField: "id", labelField: "title", sublabelField: "slug",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ["draft", "published"] },
      { name: "bodyRichtext", label: "Body", type: "textarea" },
    ],
  },
  {
    key: "navigation_items", label: "Navigation", icon: <Navigation className="w-4 h-4" />, endpoint: "/cms/navigation-items", idField: "id", labelField: "label",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "navGroup", label: "Nav Group", type: "text", required: true },
      { name: "label", label: "Label", type: "text", required: true },
      { name: "url", label: "URL", type: "text", required: true },
      { name: "sortOrder", label: "Sort Order", type: "number" },
      { name: "isExternal", label: "External Link", type: "boolean" },
      { name: "isEnabled", label: "Enabled", type: "boolean" },
    ],
  },
  {
    key: "downloads", label: "Downloads", icon: <Download className="w-4 h-4" />, endpoint: "/cms/downloads", idField: "id", labelField: "title",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "fileUrl", label: "File URL", type: "text" },
      { name: "fileType", label: "File Type", type: "text" },
      { name: "requiresForm", label: "Requires Form", type: "boolean" },
      { name: "status", label: "Status", type: "select", options: ["draft", "published"] },
    ],
  },
  {
    key: "services", label: "Services", icon: <Wrench className="w-4 h-4" />, endpoint: "/cms/services-items", idField: "id", labelField: "title",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "shortDescription", label: "Short Description", type: "textarea" },
      { name: "category", label: "Category", type: "text" },
      { name: "isFeatured", label: "Featured", type: "boolean" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "features", label: "Features", icon: <Star className="w-4 h-4" />, endpoint: "/cms/features-items", idField: "id", labelField: "title",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "groupKey", label: "Group Key", type: "text" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "use_cases", label: "Use Cases", icon: <Layout className="w-4 h-4" />, endpoint: "/cms/use-cases", idField: "id", labelField: "title",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "audience", label: "Audience", type: "text" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "pages", label: "Pages", icon: <FileText className="w-4 h-4" />, endpoint: "/cms/pages", idField: "id", labelField: "title", sublabelField: "slug",
    fields: [
      { name: "siteId", label: "Site ID", type: "number", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "pageType", label: "Page Type", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["draft", "published"] },
      { name: "metaTitle", label: "Meta Title", type: "text" },
      { name: "metaDescription", label: "Meta Description", type: "textarea" },
    ],
  },
  {
    key: "sections", label: "Sections", icon: <Layout className="w-4 h-4" />, endpoint: "/cms/sections", idField: "id", labelField: "sectionKey",
    fields: [
      { name: "pageId", label: "Page ID", type: "number", required: true },
      { name: "sectionKey", label: "Section Key", type: "text", required: true },
      { name: "sectionType", label: "Section Type", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "subheading", label: "Subheading", type: "text" },
      { name: "bodyRichtext", label: "Body", type: "textarea" },
      { name: "isEnabled", label: "Enabled", type: "boolean" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
    ],
  },
];

function FieldInput({
  field, value, onChange,
}: {
  field: TableDef["fields"][number];
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const cls = "w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary";
  if (field.type === "textarea") {
    return <textarea className={`${cls} min-h-[80px] resize-y`} value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} />;
  }
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-primary" />
        <span className="text-sm text-muted-foreground">{field.label}</span>
      </label>
    );
  }
  if (field.type === "select" && field.options) {
    return (
      <select className={cls} value={(value as string) ?? ""} onChange={e => onChange(e.target.value)}>
        <option value="">Select…</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (field.type === "number") {
    return <input type="number" className={cls} value={(value as number) ?? ""} onChange={e => onChange(e.target.valueAsNumber || 0)} />;
  }
  return <input type="text" className={cls} value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} />;
}

interface ItemFormProps {
  tableDef: TableDef;
  initialData?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ItemForm({ tableDef, initialData, onSave, onCancel, isLoading }: ItemFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    tableDef.fields.forEach(f => {
      initial[f.name] = initialData?.[f.name] ?? (f.type === "boolean" ? false : f.type === "number" ? 0 : "");
    });
    return initial;
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4">{initialData ? "Edit" : "Create"} {tableDef.label.slice(0, -1)}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tableDef.fields.map(f => (
          <div key={f.name} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            {f.type !== "boolean" && (
              <label className="text-xs text-muted-foreground mb-1 block">
                {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
            )}
            <FieldInput
              field={f}
              value={formData[f.name]}
              onChange={v => setFormData(prev => ({ ...prev, [f.name]: v }))}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onSave(formData)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {initialData ? "Save Changes" : "Create"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

function CMSTable({ tableDef }: { tableDef: TableDef }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["cms", tableDef.key],
    queryFn: () => apiFetch<{ data?: unknown[]; [k: string]: unknown }>(tableDef.endpoint),
  });

  const rows: Record<string, unknown>[] = Array.isArray(data) ? data : ((data?.data ?? []) as Record<string, unknown>[]);
  const filtered = rows.filter(r => {
    if (!search) return true;
    const label = String(r[tableDef.labelField] ?? "").toLowerCase();
    return label.includes(search.toLowerCase());
  });

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch(tableDef.endpoint, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms", tableDef.key] }); setCreating(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiFetch(`${tableDef.endpoint}/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms", tableDef.key] }); setEditingId(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`${tableDef.endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms", tableDef.key] }); setConfirmDelete(null); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={`Search ${tableDef.label.toLowerCase()}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} items</span>
        <button
          onClick={() => { setCreating(true); setEditingId(null); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors ml-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          New {tableDef.label.slice(0, -1)}
        </button>
      </div>

      {creating && (
        <ItemForm
          tableDef={tableDef}
          onSave={data => createMut.mutate(data)}
          onCancel={() => setCreating(false)}
          isLoading={createMut.isPending}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4" />
          Failed to load {tableDef.label.toLowerCase()}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl px-5 py-12 text-center text-muted-foreground text-sm">
          No {tableDef.label.toLowerCase()} found
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {filtered.map((row) => {
            const id = Number(row[tableDef.idField]);
            const label = String(row[tableDef.labelField] ?? `#${id}`);
            const sublabel = tableDef.sublabelField ? String(row[tableDef.sublabelField] ?? "") : undefined;

            if (editingId === id) {
              return (
                <div key={id} className="p-4">
                  <ItemForm
                    tableDef={tableDef}
                    initialData={row}
                    onSave={data => updateMut.mutate({ id, body: data })}
                    onCancel={() => setEditingId(null)}
                    isLoading={updateMut.isPending}
                  />
                </div>
              );
            }

            return (
              <div key={id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{label || "(untitled)"}</p>
                  {sublabel && <p className="text-xs text-muted-foreground font-mono">{sublabel}</p>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">#{id}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingId(id); setCreating(false); }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {confirmDelete === id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMut.mutate(id)}
                        disabled={deleteMut.isPending}
                        className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground hover:text-foreground transition-colors">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CMSPage() {
  const [activeTable, setActiveTable] = useState<TableKey>("ventures");
  const tableDef = TABLES.find(t => t.key === activeTable)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Content Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all CMS content across brands</p>
      </div>

      <div className="flex gap-4">
        <div className="w-48 shrink-0">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tables</p>
            </div>
            <nav className="p-1">
              {TABLES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTable(t.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors text-left ${
                    activeTable === t.key
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <CMSTable key={activeTable} tableDef={tableDef} />
        </div>
      </div>
    </div>
  );
}
