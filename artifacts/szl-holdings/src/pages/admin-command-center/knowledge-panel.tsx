import { useQueryClient } from '@tanstack/react-query';
import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Archive, BookOpen, Edit2, Loader2, Plus, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { adminFetch, Badge, EmptyState, SearchInput, SectionHeader } from './shared';
import type { KbArticle } from './types';

const EMPTY_KB_FORM = { slug: '', title: '', category: '', summary: '', body: '', tags: '', isPublished: true };

export function KnowledgePanel() {
  const qc = useQueryClient();
  const [editingArticle, setEditingArticle] = useState<KbArticle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_KB_FORM);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState<number | null>(null);

  const { data, isLoading, refetch } = useStandardQuery<{ articles: KbArticle[]; total: number }>({
    queryKey: ['admin-kb-articles'],
    queryFn: () => adminFetch('/admin/kb-articles'),
  });

  const articles = (data?.articles ?? []).filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q);
  });

  const openCreate = () => { setEditingArticle(null); setForm(EMPTY_KB_FORM); setShowForm(true); };
  const openEdit = (a: KbArticle) => {
    setEditingArticle(a);
    setForm({ slug: a.slug, title: a.title, category: a.category, summary: a.summary, body: a.body, tags: a.tags.join(', '), isPublished: a.isPublished });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { slug: form.slug, title: form.title, category: form.category, summary: form.summary, body: form.body, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean), isPublished: form.isPublished };
      const url = editingArticle ? `/admin/kb-articles/${editingArticle.id}` : '/admin/kb-articles';
      await adminFetch(url, { method: editingArticle ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      await qc.invalidateQueries({ queryKey: ['admin-kb-articles'] });
      setShowForm(false);
      setEditingArticle(null);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Archive this article? It will be unpublished and hidden from the public KB.')) return;
    setArchiving(id);
    try {
      await adminFetch(`/admin/kb-articles/${id}`, { method: 'DELETE' });
      await qc.invalidateQueries({ queryKey: ['admin-kb-articles'] });
    } finally {
      setArchiving(null);
    }
  };

  return (
    <div className="space-y-4">
      {showForm ? (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{editingArticle ? 'Edit Article' : 'New KB Article'}</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Title *', field: 'title', placeholder: 'How to reset your password' },
              { label: 'Slug *', field: 'slug', placeholder: 'how-to-reset-password', mono: true },
              { label: 'Category *', field: 'category', placeholder: 'Account & Billing' },
              { label: 'Tags (comma-separated)', field: 'tags', placeholder: 'billing, account, password' },
            ].map(({ label, field, placeholder, mono }) => (
              <div key={field}>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
                <input
                  type="text"
                  value={form[field as keyof typeof form] as string}
                  onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                  placeholder={placeholder}
                  className={`w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40${mono ? ' font-mono' : ''}`}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Summary *</label>
            <textarea rows={2} value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} placeholder="A brief description shown in search results…" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Body (Markdown) *</label>
            <textarea rows={10} value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} placeholder="## Introduction&#10;&#10;Write your article content here in Markdown…" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-y" />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} className="w-3.5 h-3.5 rounded" />
              <span className="text-xs text-muted-foreground">Published (visible in public KB)</span>
            </label>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.slug || !form.title || !form.category || !form.summary || !form.body} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : editingArticle ? 'Update Article' : 'Create Article'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <SectionHeader title="Knowledge Base" subtitle={`${data?.total ?? 0} articles`} onRefresh={() => refetch()} loading={isLoading} />
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Search articles by title, category, or slug…" />
            </div>
            <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Article
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : articles.length === 0 ? (
            <EmptyState message={search ? 'No articles match your search.' : 'No KB articles yet. Create your first article.'} />
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
              {articles.map((a) => (
                <div key={a.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">{a.title}</span>
                      {!a.isPublished && <Badge label="Draft" variant="amber" />}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-muted-foreground">{a.slug}</span>
                      <span className="text-muted-foreground/40 text-[10px]">·</span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><BookOpen className="w-3 h-3" /> {a.category}</span>
                      {a.tags.length > 0 && (
                        <>
                          <span className="text-muted-foreground/40 text-[10px]">·</span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Tag className="w-2.5 h-2.5" />{a.tags.slice(0, 3).join(', ')}{a.tags.length > 3 && ` +${a.tags.length - 3}`}</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-1">{a.summary}</p>
                    <p className="text-[9px] text-muted-foreground/40 mt-0.5">Updated {new Date(a.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => openEdit(a)} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleArchive(a.id)} disabled={archiving === a.id} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-md border border-red-500/20 text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-40">
                      <Archive className="w-3 h-3" />{archiving === a.id ? 'Archiving…' : 'Archive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
