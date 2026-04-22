import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Edit3,
  Image,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { apiFetchAdmin } from './api';
import { StatusBadge } from './CmsTablePanel';

const API = '/api';
function _getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
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

const CONTENT_TYPE_OPTIONS = ['blog', 'case-study', 'investor-letter', 'update'];
const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog: 'Blog Post',
  'case-study': 'Case Study',
  'investor-letter': 'Investor Letter',
  update: 'Platform Update',
};

function FeaturedImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API}/cms/posts/upload-image`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      onChange(json.data?.url ?? json.url ?? '');
    } catch {
      alert('Image upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div
          className="relative rounded-md overflow-hidden bg-muted/20 border border-border"
          style={{ height: '80px' }}
        >
          <img src={value} alt="Featured" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
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
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Image className="w-3.5 h-3.5" />
        )}
        {value ? 'Replace image' : 'Upload image'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function renderMarkdownPreview(content: string): React.ReactNode[] {
  const blocks = content.split(/\n{2,}/).filter((b) => b.trim());
  return blocks.map((block, i) => {
    const t = block.trim();
    if (t.startsWith('## '))
      return (
        <h2 key={i} className="text-base font-bold text-foreground mt-4 mb-1">
          {t.slice(3)}
        </h2>
      );
    if (t.startsWith('### '))
      return (
        <h3 key={i} className="text-sm font-semibold text-foreground mt-3 mb-0.5">
          {t.slice(4)}
        </h3>
      );
    const escaped = escapeHtml(t);
    const inline = escaped
      .replace(/\*\*(.+?)\*\*/g, (_m, w: string) => `<strong>${w}</strong>`)
      .replace(/\*(.+?)\*/g, (_m, w: string) => `<em>${w}</em>`);
    return (
      <p
        key={i}
        className="text-[13px] text-muted-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: inline }}
      />
    );
  });
}

function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const TOOLBAR = [
    { label: 'B', title: 'Bold', wrap: ['**', '**'] as [string, string] },
    { label: 'I', title: 'Italic', wrap: ['*', '*'] as [string, string] },
    { label: 'H2', title: 'Heading 2', prefix: '## ' },
    { label: 'H3', title: 'Heading 3', prefix: '### ' },
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
      formData.append('image', file);
      const res = await fetch(`${API}/cms/posts/upload-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      const url: string = json.data?.url ?? json.url;
      const ta = textareaRef.current;
      const pos = ta ? ta.selectionStart : value.length;
      const markdown = `\n![${file.name}](${url})\n`;
      onChange(value.slice(0, pos) + markdown + value.slice(pos));
    } catch {
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-muted/30 border-b border-border px-2 py-1.5 gap-2">
        <div className="flex items-center gap-1">
          {TOOLBAR.map((t) => (
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
            {uploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Image className="w-3 h-3" />
            )}
            <span>Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageUpload(f);
            }}
          />
          <span className="text-[10px] text-muted-foreground/40 ml-1">Markdown</span>
        </div>
        <div className="flex rounded-md overflow-hidden border border-border text-[10px] font-medium">
          {(['write', 'preview'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'px-2.5 py-1 capitalize transition-colors',
                tab === t
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          placeholder="Write your content here. Use ## for headings, **bold**, *italic*, and blank lines to separate paragraphs…"
          className="w-full bg-background px-3 py-2.5 text-sm text-foreground font-mono leading-relaxed focus:outline-none resize-y"
          style={{ minHeight: '280px' }}
        />
      ) : (
        <div
          className="bg-background px-4 py-3 space-y-2 overflow-auto"
          style={{ minHeight: '280px' }}
        >
          {value.trim() ? (
            renderMarkdownPreview(value)
          ) : (
            <p className="text-xs text-muted-foreground/40 italic">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CmsPostsPanel() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<CmsPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [form, setForm] = useState<Partial<CmsPost>>({});
  const [saveError, setSaveError] = useState('');

  const { data: draftsResult, isLoading } = useStandardQuery({
    queryKey: ['cms-posts', filterType],
    queryFn: () =>
      apiFetchAdmin<CmsPost[]>(
        filterType
          ? `/cms/posts?content_type=${filterType}&status=draft`
          : '/cms/posts?status=draft',
      ),
  });

  const { data: publishedResult } = useStandardQuery({
    queryKey: ['cms-posts-published', filterType],
    queryFn: () =>
      apiFetchAdmin<CmsPost[]>(filterType ? `/cms/posts?content_type=${filterType}` : '/cms/posts'),
  });

  const allPosts: CmsPost[] = (() => {
    const published: CmsPost[] = Array.isArray(publishedResult) ? publishedResult : [];
    const drafts: CmsPost[] = Array.isArray(draftsResult) ? draftsResult : [];
    const seen = new Set<number>();
    const combined: CmsPost[] = [];
    for (const p of [...published, ...drafts]) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        combined.push(p);
      }
    }
    return combined.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  })();

  const saveMutation = useStandardMutation({
    mutationFn: async (vals: Partial<CmsPost>) => {
      if (isNew) {
        return apiFetchAdmin('/cms/posts', { method: 'POST', body: JSON.stringify(vals) });
      } else {
        return apiFetchAdmin(`/cms/posts/${editing?.id}`, {
          method: 'PUT',
          body: JSON.stringify(vals),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-posts'] });
      qc.invalidateQueries({ queryKey: ['cms-posts-published'] });
      setEditing(null);
      setIsNew(false);
      setSaveError('');
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Save failed. Check required fields.');
    },
  });

  const deleteMutation = useStandardMutation({
    mutationFn: async (id: number) => apiFetchAdmin(`/cms/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-posts'] });
      qc.invalidateQueries({ queryKey: ['cms-posts-published'] });
    },
  });

  const openNew = () => {
    setIsNew(true);
    setEditing({} as CmsPost);
    setForm({
      contentType: 'blog',
      status: 'draft',
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      metaDescription: '',
    });
    setSaveError('');
  };

  const openEdit = (post: CmsPost) => {
    setIsNew(false);
    setEditing(post);
    setForm({ ...post });
    setSaveError('');
  };

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      ...(isNew && !f.slug ? { slug: generateSlug(title) } : {}),
    }));
  };

  const handlePublish = () => {
    saveMutation.mutate({
      ...form,
      status: 'published',
      publishedAt: form.publishedAt || new Date().toISOString(),
    });
  };

  const handleSaveDraft = () => {
    saveMutation.mutate({ ...form, status: 'draft' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> CMS Posts
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Blog posts, case studies, investor letters, and platform updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">All types</option>
            {CONTENT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {CONTENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
          >
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
          {allPosts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{post.title}</span>
                  <StatusBadge status={post.status} />
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                    {CONTENT_TYPE_LABELS[post.contentType] ?? post.contentType}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="font-mono">{post.slug}</span>
                  <span>·</span>
                  <span>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(post)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this post?')) deleteMutation.mutate(post.id);
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

      <AnimatePresence>
        {editing !== null && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          >
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-3xl my-4 shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {isNew ? 'New Post' : 'Edit Post'}
                  </h3>
                  {!isNew && <StatusBadge status={form.status ?? 'draft'} />}
                </div>
                <button
                  onClick={() => {
                    setEditing(null);
                    setIsNew(false);
                  }}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
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
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Title *
                    </label>
                    <input
                      value={form.title ?? ''}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter post title…"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Slug *
                    </label>
                    <input
                      value={form.slug ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      placeholder="url-friendly-slug"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Content Type *
                    </label>
                    <select
                      value={form.contentType ?? 'blog'}
                      onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      {CONTENT_TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {CONTENT_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Excerpt
                  </label>
                  <textarea
                    value={form.excerpt ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                    rows={2}
                    placeholder="Brief summary shown in listing views…"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  />
                </div>

                <MarkdownEditor
                  value={form.content ?? ''}
                  onChange={(val) => setForm((f) => ({ ...f, content: val }))}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Featured Image
                    </label>
                    <FeaturedImageUpload
                      value={form.featuredImage ?? ''}
                      onChange={(url) => setForm((f) => ({ ...f, featuredImage: url }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Publish Date
                    </label>
                    <input
                      type="date"
                      value={form.publishedAt ? form.publishedAt.split('T')[0] : ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          publishedAt: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined,
                        }))
                      }
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Meta Description (SEO)
                  </label>
                  <textarea
                    value={form.metaDescription ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                    rows={2}
                    placeholder="SEO meta description for this post…"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-5 border-t border-border/50">
                <button
                  onClick={() => {
                    setEditing(null);
                    setIsNew(false);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDraft}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Save Draft
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {form.status === 'published' ? 'Update Published' : 'Publish'}
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

export { CmsPostsPanel };
