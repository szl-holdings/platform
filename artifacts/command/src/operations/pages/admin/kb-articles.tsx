import {
  AlertTriangle,
  Archive,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Plus,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface KbArticle {
  id: number;
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = {
  slug: '',
  title: '',
  category: '',
  summary: '',
  body: '',
  tags: [] as string[],
  isPublished: true,
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const r = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
  return json as T;
}

function Badge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        published
          ? 'bg-[#6b8f71]/10 text-[#6b8f71]'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {published ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
      {published ? 'Published' : 'Archived'}
    </span>
  );
}

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim().toLowerCase().replace(/\s+/g, '-');
    if (val && !tags.includes(val) && tags.length < 20) {
      onChange([...tags, val]);
      setInput('');
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary border border-primary/20"
          >
            <Tag className="w-2.5 h-2.5" />
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="hover:text-foreground"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add tag and press Enter"
          className="flex-1 px-2.5 py-1.5 text-xs bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/70 border border-border transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ArticleForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: typeof EMPTY_FORM;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof EMPTY_FORM, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-4"
    >
      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#c45a4a]/10 text-[#c45a4a] text-xs rounded-xl border border-[#c45a4a]/20">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Slug <span className="text-[#c45a4a]">*</span>
          </label>
          <input
            required
            value={form.slug}
            onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="how-to-reset-password"
            className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
          <p className="text-[10px] text-muted-foreground">Lowercase letters, numbers, hyphens only</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Category <span className="text-[#c45a4a]">*</span>
          </label>
          <input
            required
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="Account, Billing, Technical…"
            className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Title <span className="text-[#c45a4a]">*</span>
        </label>
        <input
          required
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Article title"
          className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Summary <span className="text-[#c45a4a]">*</span>
        </label>
        <textarea
          required
          value={form.summary}
          onChange={(e) => set('summary', e.target.value)}
          placeholder="One-sentence description shown in search results"
          rows={2}
          className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Body <span className="text-[#c45a4a]">*</span>
        </label>
        <textarea
          required
          value={form.body}
          onChange={(e) => set('body', e.target.value)}
          placeholder="Full article content (Markdown supported)"
          rows={12}
          className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-y"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Tags</label>
        <TagInput tags={form.tags} onChange={(t) => set('tags', t)} />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={form.isPublished}
          onClick={() => set('isPublished', !form.isPublished)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            form.isPublished ? 'bg-[#6b8f71]' : 'bg-muted'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${
              form.isPublished ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-xs font-medium">
          {form.isPublished ? 'Published — visible on support portal' : 'Unpublished — hidden from portal'}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted border border-border transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Article'}
        </button>
      </div>
    </form>
  );
}

function ArchiveDialog({
  article,
  onConfirm,
  onCancel,
  busy,
}: {
  article: KbArticle;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#c45a4a]/10">
            <Archive className="w-4 h-4 text-[#c45a4a]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Archive article?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">This will unpublish the article immediately.</p>
          </div>
        </div>
        <div className="p-3 bg-muted rounded-xl text-xs">
          <p className="font-medium">{article.title}</p>
          <p className="text-muted-foreground font-mono mt-0.5">{article.slug}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          The article will no longer appear on the support portal. You can re-publish it later by editing it.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted border border-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-[#c45a4a]/10 hover:bg-[#c45a4a]/20 text-[#c45a4a] border border-[#c45a4a]/20 disabled:opacity-50 transition-colors"
          >
            {busy ? 'Archiving…' : 'Archive Article'}
          </button>
        </div>
      </div>
    </div>
  );
}

type View = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; article: KbArticle };

export default function KbArticlesAdmin() {
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ mode: 'list' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<KbArticle | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'archived'>('all');

  const loadArticles = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await apiFetch<{ articles: KbArticle[]; total: number }>('/admin/kb-articles');
      setArticles(data.articles);
      setTotal(data.total);
    } catch (e) {
      setFetchError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const filtered = articles.filter((a) => {
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && a.isPublished) ||
      (filterStatus === 'archived' && !a.isPublished);
    return matchSearch && matchStatus;
  });

  const handleCreate = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch('/admin/kb-articles', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await loadArticles();
      setView({ mode: 'list' });
    } catch (e) {
      setSaveError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form: typeof EMPTY_FORM) => {
    if (view.mode !== 'edit') return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await apiFetch<{ article: KbArticle }>(`/admin/kb-articles/${view.article.id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setArticles((prev) => prev.map((a) => (a.id === updated.article.id ? updated.article : a)));
      setView({ mode: 'list' });
    } catch (e) {
      setSaveError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await apiFetch(`/admin/kb-articles/${archiveTarget.id}`, { method: 'DELETE', body: JSON.stringify({}) });
      setArticles((prev) =>
        prev.map((a) => (a.id === archiveTarget.id ? { ...a, isPublished: false } : a)),
      );
      setArchiveTarget(null);
    } catch (e) {
      setFetchError(String(e));
    } finally {
      setArchiving(false);
    }
  };

  if (view.mode === 'create') {
    return (
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView({ mode: 'list' }); setSaveError(null); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to articles
          </button>
        </div>
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            New Article
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Create a new knowledge base article</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <ArticleForm
            initial={EMPTY_FORM}
            onSave={handleCreate}
            onCancel={() => { setView({ mode: 'list' }); setSaveError(null); }}
            saving={saving}
            error={saveError}
          />
        </div>
      </div>
    );
  }

  if (view.mode === 'edit') {
    const a = view.article;
    const initial = {
      slug: a.slug,
      title: a.title,
      category: a.category,
      summary: a.summary,
      body: a.body,
      tags: a.tags ?? [],
      isPublished: a.isPublished,
    };
    return (
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView({ mode: 'list' }); setSaveError(null); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to articles
          </button>
        </div>
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Edit Article
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">{a.slug}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <ArticleForm
            initial={initial}
            onSave={handleEdit}
            onCancel={() => { setView({ mode: 'list' }); setSaveError(null); }}
            saving={saving}
            error={saveError}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {archiveTarget && (
        <ArchiveDialog
          article={archiveTarget}
          onConfirm={handleArchiveConfirm}
          onCancel={() => setArchiveTarget(null)}
          busy={archiving}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Knowledge Base
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage support articles — {total} total
          </p>
        </div>
        <button
          onClick={() => { setView({ mode: 'create' }); setSaveError(null); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Article
        </button>
      </div>

      {fetchError && (
        <div className="flex items-center gap-2 p-3 bg-[#c45a4a]/10 text-[#c45a4a] text-xs rounded-xl border border-[#c45a4a]/20">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {fetchError}
          <button onClick={loadArticles} className="ml-auto underline">
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'published', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filterStatus === s
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {search || filterStatus !== 'all' ? 'No articles match your filters' : 'No articles yet — create one to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((article) => (
              <div
                key={article.id}
                className="px-4 py-3 hover:bg-muted/30 transition-colors flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{article.title}</span>
                    <Badge published={article.isPublished} />
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase font-mono">
                      {article.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{article.summary}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground font-mono">{article.slug}</span>
                    {article.tags?.length > 0 && (
                      <div className="flex items-center gap-1">
                        {article.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10"
                          >
                            {t}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{article.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      Updated {new Date(article.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => { setSaveError(null); setView({ mode: 'edit', article }); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/70 border border-border transition-colors"
                  >
                    Edit
                  </button>
                  {article.isPublished && (
                    <button
                      onClick={() => setArchiveTarget(article)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#c45a4a] bg-[#c45a4a]/5 hover:bg-[#c45a4a]/10 border border-[#c45a4a]/20 transition-colors"
                    >
                      Archive
                    </button>
                  )}
                  {!article.isPublished && (
                    <span className="flex items-center gap-1 text-[10px] text-[#6b8f71]">
                      <CheckCircle2 className="w-3 h-3" /> Archived
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
