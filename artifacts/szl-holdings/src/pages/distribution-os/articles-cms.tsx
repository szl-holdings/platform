import { m } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Plus,
  Send,
  Trash2,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { DistributionOsLayout } from './admin-dashboard';

const API = import.meta.env.VITE_API_URL || '';

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function writeHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() };
}

interface Article {
  id: number;
  title: string;
  slug: string;
  status: string;
  siteStatus: string;
  articleType: string;
  excerpt: string | null;
  readTimeMinutes: number | null;
  externalUrlMedium: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'hsla(0,0%,100%,0.06)', text: '#8b8579' },
  'in-review': { bg: 'hsla(40,60%,50%,0.12)', text: '#d4a054' },
  approved: { bg: 'hsla(120,30%,40%,0.12)', text: '#5a9c5a' },
  published: { bg: 'hsla(210,50%,50%,0.12)', text: '#4a90b8' },
  archived: { bg: 'hsla(0,0%,100%,0.04)', text: '#4a4540' },
};

export default function ArticlesCmsPage() {
  const [location] = useLocation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState('flagship-essay');
  const [publishing, setPublishing] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/api/distribution-os/articles`)
      .then((r) => r.json())
      .then(setArticles)
      .catch(() => {});
  }, []);

  async function createArticle() {
    if (!newTitle) return;
    const slug =
      newSlug ||
      newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const res = await fetch(`${API}/api/distribution-os/articles`, {
      method: 'POST',
      credentials: 'include',
      headers: writeHeaders(),
      body: JSON.stringify({ title: newTitle, slug, articleType: newType }),
    });
    const article = await res.json();
    setArticles((prev) => [article, ...prev]);
    setShowNew(false);
    setNewTitle('');
    setNewSlug('');
  }

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`${API}/api/distribution-os/articles/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: writeHeaders(),
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setArticles((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }

  async function publishToMedium(id: number) {
    setPublishing(id);
    try {
      const res = await fetch(`${API}/api/distribution-os/articles/${id}/publish-medium`, {
        method: 'POST',
        credentials: 'include',
        headers: writeHeaders(),
        body: JSON.stringify({ publishStatus: 'draft' }),
      });
      const data = await res.json();
      if (data.article) {
        setArticles((prev) => prev.map((a) => (a.id === id ? data.article : a)));
      }
    } catch {}
    setPublishing(null);
  }

  async function deleteArticle(id: number) {
    await fetch(`${API}/api/distribution-os/articles/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'x-csrf-token': getCsrfToken() },
    });
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8e4de' }}>Articles</h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b6560', marginTop: '0.25rem' }}>
              {articles.length} articles
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              background: 'linear-gradient(135deg, #d4a054, #c8953c)',
              color: '#070a10',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> New Article
          </button>
        </div>

        {showNew && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              padding: '1.25rem',
              background: 'hsla(0,0%,100%,0.03)',
              border: '1px solid hsla(0,0%,100%,0.08)',
              borderRadius: '10px',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: '0.75rem',
                alignItems: 'end',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    color: '#6b6560',
                    marginBottom: '0.375rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Title
                </label>
                <input
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  placeholder="Article title..."
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    background: 'hsla(0,0%,100%,0.04)',
                    border: '1px solid hsla(0,0%,100%,0.1)',
                    borderRadius: '6px',
                    color: '#e8e4de',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    color: '#6b6560',
                    marginBottom: '0.375rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    background: 'hsla(0,0%,100%,0.04)',
                    border: '1px solid hsla(0,0%,100%,0.1)',
                    borderRadius: '6px',
                    color: '#e8e4de',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="flagship-essay">Flagship Essay</option>
                  <option value="industry-brief">Industry Brief</option>
                  <option value="playbook">Playbook</option>
                  <option value="founder-note">Founder Note</option>
                  <option value="case-study">Case Study</option>
                  <option value="framework">Framework</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={createArticle}
                  style={{
                    padding: '0.625rem 1rem',
                    background: '#d4a054',
                    color: '#070a10',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNew(false)}
                  style={{
                    padding: '0.625rem 1rem',
                    background: 'hsla(0,0%,100%,0.06)',
                    color: '#8b8579',
                    border: '1px solid hsla(0,0%,100%,0.08)',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </m.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {articles.map((article) => {
            const sc = STATUS_COLORS[article.status] || STATUS_COLORS.draft;
            const isPublishing = publishing === article.id;
            return (
              <div
                key={article.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.05)',
                  borderRadius: '8px',
                }}
              >
                <FileText size={18} style={{ color: '#d4a054', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: '#e8e4de',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {article.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      marginTop: '0.25rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
                      {article.articleType}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                    {article.externalUrlMedium && (
                      <a
                        href={article.externalUrlMedium}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.6875rem',
                          color: '#4a90b8',
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={10} /> Medium
                      </a>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.625rem',
                    borderRadius: '4px',
                    background: sc.bg,
                    color: sc.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {article.status}
                </span>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {article.status === 'draft' && (
                    <button
                      onClick={() => updateStatus(article.id, 'in-review')}
                      title="Submit for review"
                      style={{
                        padding: '0.375rem',
                        background: 'none',
                        border: '1px solid hsla(0,0%,100%,0.08)',
                        borderRadius: '4px',
                        color: '#d4a054',
                        cursor: 'pointer',
                      }}
                    >
                      <Send size={14} />
                    </button>
                  )}
                  {article.status === 'in-review' && (
                    <button
                      onClick={() => updateStatus(article.id, 'approved')}
                      title="Approve"
                      style={{
                        padding: '0.375rem',
                        background: 'none',
                        border: '1px solid hsla(0,0%,100%,0.08)',
                        borderRadius: '4px',
                        color: '#5a9c5a',
                        cursor: 'pointer',
                      }}
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  {(article.status === 'approved' ||
                    article.status === 'draft' ||
                    article.status === 'in-review') && (
                    <button
                      onClick={() => publishToMedium(article.id)}
                      disabled={isPublishing}
                      title="Publish to Medium"
                      style={{
                        padding: '0.375rem 0.625rem',
                        background: isPublishing ? 'hsla(0,0%,100%,0.04)' : 'hsla(0,0%,100%,0.08)',
                        border: '1px solid hsla(0,0%,100%,0.12)',
                        borderRadius: '4px',
                        color: '#e8e4de',
                        cursor: isPublishing ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                      }}
                    >
                      {isPublishing ? (
                        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Zap size={12} />
                      )}
                      Medium
                    </button>
                  )}
                  {article.status === 'approved' && (
                    <button
                      onClick={() => updateStatus(article.id, 'published')}
                      title="Publish"
                      style={{
                        padding: '0.375rem',
                        background: 'none',
                        border: '1px solid hsla(0,0%,100%,0.08)',
                        borderRadius: '4px',
                        color: '#4a90b8',
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteArticle(article.id)}
                    title="Delete"
                    style={{
                      padding: '0.375rem',
                      background: 'none',
                      border: '1px solid hsla(0,0%,100%,0.08)',
                      borderRadius: '4px',
                      color: '#c45a4a',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          {articles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#4a4540' }}>
              <FileText size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No articles yet. Create your first article to get started.</p>
            </div>
          )}
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
