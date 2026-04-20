import { m } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  ExternalLink,
  Loader2,
  Mail,
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

interface Newsletter {
  id: number;
  issueNumber: number | null;
  title: string;
  slug: string;
  templateType: string;
  status: string;
  substackUrl: string | null;
  createdAt: string;
}

export default function NewslettersCmsPage() {
  const [location] = useLocation();
  const [items, setItems] = useState<Newsletter[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [publishing, setPublishing] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/api/distribution-os/newsletters`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  async function create() {
    if (!title) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const res = await fetch(`${API}/api/distribution-os/newsletters`, {
      method: 'POST',
      credentials: 'include',
      headers: writeHeaders(),
      body: JSON.stringify({ title, slug }),
    });
    const nl = await res.json();
    setItems((prev) => [nl, ...prev]);
    setShowNew(false);
    setTitle('');
  }

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`${API}/api/distribution-os/newsletters/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: writeHeaders(),
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setItems((prev) => prev.map((n) => (n.id === id ? updated : n)));
  }

  async function publishToSubstack(id: number) {
    setPublishing(id);
    try {
      const res = await fetch(`${API}/api/distribution-os/newsletters/${id}/publish-substack`, {
        method: 'POST',
        credentials: 'include',
        headers: writeHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.newsletter) {
        setItems((prev) => prev.map((n) => (n.id === id ? data.newsletter : n)));
      }
    } catch {}
    setPublishing(null);
  }

  async function remove(id: number) {
    await fetch(`${API}/api/distribution-os/newsletters/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'x-csrf-token': getCsrfToken() },
    });
    setItems((prev) => prev.filter((n) => n.id !== id));
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
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8e4de' }}>Newsletters</h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b6560', marginTop: '0.25rem' }}>
              {items.length} issues
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
            <Plus size={16} /> New Issue
          </button>
        </div>

        {showNew && (
          <div
            style={{
              padding: '1.25rem',
              background: 'hsla(0,0%,100%,0.03)',
              border: '1px solid hsla(0,0%,100%,0.08)',
              borderRadius: '10px',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    color: '#6b6560',
                    marginBottom: '0.375rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Issue title..."
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
              <button
                onClick={create}
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
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((nl) => {
            const isPublishing = publishing === nl.id;
            return (
              <div
                key={nl.id}
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
                <Mail size={18} style={{ color: '#d4a054', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#e8e4de' }}>
                    {nl.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.25rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
                      {nl.templateType} · {new Date(nl.createdAt).toLocaleDateString()}
                    </span>
                    {nl.substackUrl && (
                      <a
                        href={nl.substackUrl}
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
                        <ExternalLink size={10} /> Substack
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
                    background:
                      nl.status === 'published' ? 'hsla(210,50%,50%,0.12)' : 'hsla(0,0%,100%,0.06)',
                    color: nl.status === 'published' ? '#4a90b8' : '#8b8579',
                    textTransform: 'uppercase',
                  }}
                >
                  {nl.status}
                </span>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {nl.status === 'draft' && (
                    <button
                      onClick={() => updateStatus(nl.id, 'approved')}
                      style={{
                        padding: '0.375rem',
                        background: 'none',
                        border: '1px solid hsla(0,0%,100%,0.08)',
                        borderRadius: '4px',
                        color: '#5a9c5a',
                        cursor: 'pointer',
                      }}
                      title="Approve"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  {(nl.status === 'approved' || nl.status === 'draft') && (
                    <button
                      onClick={() => publishToSubstack(nl.id)}
                      disabled={isPublishing}
                      title="Publish to Substack"
                      style={{
                        padding: '0.375rem 0.625rem',
                        background: isPublishing ? 'hsla(0,0%,100%,0.04)' : 'hsla(25,60%,40%,0.12)',
                        border: '1px solid hsla(25,60%,40%,0.2)',
                        borderRadius: '4px',
                        color: '#c8953c',
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
                      Substack
                    </button>
                  )}
                  {nl.status === 'approved' && (
                    <button
                      onClick={() => updateStatus(nl.id, 'published')}
                      style={{
                        padding: '0.375rem',
                        background: 'none',
                        border: '1px solid hsla(0,0%,100%,0.08)',
                        borderRadius: '4px',
                        color: '#4a90b8',
                        cursor: 'pointer',
                      }}
                      title="Mark published"
                    >
                      <Send size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => remove(nl.id)}
                    style={{
                      padding: '0.375rem',
                      background: 'none',
                      border: '1px solid hsla(0,0%,100%,0.08)',
                      borderRadius: '4px',
                      color: '#c45a4a',
                      cursor: 'pointer',
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#4a4540' }}>
              <BookOpen size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No newsletters yet.</p>
            </div>
          )}
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
