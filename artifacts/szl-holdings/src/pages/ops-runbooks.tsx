import { BookOpen, Check, ChevronRight, Edit3, Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const BASE = '/api';

interface Runbook {
  id: number;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  tags: string[];
  alert_rule_ids: number[];
  incident_categories: string[];
  affected_services: string[];
  author: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  content?: string;
}

const CATEGORIES = [
  'general',
  'api',
  'database',
  'ai',
  'deployment',
  'infrastructure',
  'security',
  'networking',
];
const SEVERITIES = ['any', 'info', 'warning', 'major', 'critical'];

const categoryColor = (c: string) =>
  ({
    api: '#3b82f6',
    database: '#8b5cf6',
    ai: '#ec4899',
    deployment: '#10b981',
    infrastructure: '#f59e0b',
    security: '#ef4444',
    networking: '#06b6d4',
  })[c] ?? '#6b7280';

function RunbookViewer({ id, onClose }: { id: number; onClose: () => void }) {
  const [runbook, setRunbook] = useState<Runbook | null>(null);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/ops/runbooks/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { runbook: Runbook }) => {
        setRunbook(d.runbook);
        setContent(d.runbook.content ?? '');
      });
  }, [id]);

  const save = async () => {
    setSaving(true);
    await fetch(`${BASE}/ops/runbooks/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    setEditing(false);
    if (runbook) setRunbook({ ...runbook, content });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'hsla(0,0%,0%,0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 820,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'hsl(210,12%,7%)',
          borderRadius: 14,
          border: '1px solid hsla(0,0%,100%,0.08)',
          padding: '2rem',
        }}
      >
        {!runbook ? (
          <div style={{ color: 'hsl(210,5%,48%)', textAlign: 'center', padding: '2rem 0' }}>
            Loading...
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${categoryColor(runbook.category)}15`,
                      color: categoryColor(runbook.category),
                      border: `1px solid ${categoryColor(runbook.category)}28`,
                      textTransform: 'uppercase',
                    }}
                  >
                    {runbook.category}
                  </span>
                  {runbook.severity !== 'any' && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'hsla(0,0%,100%,0.05)',
                        color: 'hsl(38,12%,70%)',
                        border: '1px solid hsla(0,0%,100%,0.08)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {runbook.severity}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: 'hsl(210,5%,44%)' }}>v{runbook.version}</span>
                </div>
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'hsl(38,12%,94%)',
                    marginBottom: 4,
                  }}
                >
                  {runbook.title}
                </h2>
                {runbook.description && (
                  <p style={{ fontSize: 13, color: 'hsl(210,5%,52%)', margin: 0 }}>
                    {runbook.description}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setEditing(!editing)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '0.375rem 0.75rem',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'pointer',
                    background: editing ? 'hsla(210,55%,52%,0.12)' : 'transparent',
                    border: '1px solid',
                    borderColor: editing ? 'hsla(210,55%,52%,0.3)' : 'hsla(0,0%,100%,0.08)',
                    color: editing ? 'hsl(210,55%,70%)' : 'hsl(210,5%,50%)',
                  }}
                >
                  <Edit3 size={12} />
                  {editing ? 'Editing' : 'Edit'}
                </button>
                <button
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'hsl(210,5%,50%)',
                    padding: 4,
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {runbook.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {runbook.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'hsla(0,0%,100%,0.05)',
                      border: '1px solid hsla(0,0%,100%,0.08)',
                      color: 'hsl(38,12%,66%)',
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {editing ? (
              <>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={22}
                  style={{
                    width: '100%',
                    background: 'hsl(210,12%,9%)',
                    border: '1px solid hsla(0,0%,100%,0.08)',
                    borderRadius: 8,
                    padding: '1rem',
                    color: 'hsl(38,12%,86%)',
                    fontSize: '0.875rem',
                    lineHeight: 1.7,
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'flex-end',
                    marginTop: '0.75rem',
                  }}
                >
                  <button
                    onClick={() => setEditing(false)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 6,
                      fontSize: 13,
                      background: 'transparent',
                      border: '1px solid hsla(0,0%,100%,0.1)',
                      color: 'hsl(210,5%,52%)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '0.5rem 1.25rem',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'hsla(152,50%,42%,0.12)',
                      border: '1px solid hsla(152,50%,42%,0.28)',
                      color: '#34d399',
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={13} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.06)',
                  borderRadius: 10,
                  padding: '1.5rem',
                }}
              >
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'hsl(38,12%,82%)',
                    fontSize: '0.875rem',
                    lineHeight: 1.75,
                    margin: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  {content}
                </pre>
              </div>
            )}

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {runbook.incident_categories.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: 'hsl(210,5%,44%)', marginBottom: 4 }}>
                    Incident Categories
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {runbook.incident_categories.map((c) => (
                      <span
                        key={c}
                        style={{
                          fontSize: 11,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: 'hsla(0,0%,100%,0.05)',
                          border: '1px solid hsla(0,0%,100%,0.08)',
                          color: 'hsl(38,12%,68%)',
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {runbook.author && (
                <div>
                  <div style={{ fontSize: 11, color: 'hsl(210,5%,44%)', marginBottom: 4 }}>
                    Author
                  </div>
                  <div style={{ fontSize: 13, color: 'hsl(38,12%,72%)' }}>{runbook.author}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, color: 'hsl(210,5%,44%)', marginBottom: 4 }}>
                  Last Updated
                </div>
                <div style={{ fontSize: 13, color: 'hsl(38,12%,72%)' }}>
                  {new Date(runbook.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CreateRunbookModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    severity: 'any',
    tags: '',
    incidentCategories: '',
    affectedServices: '',
    content: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const inputSt: React.CSSProperties = {
    width: '100%',
    background: 'hsl(210,12%,10%)',
    border: '1px solid hsla(0,0%,100%,0.1)',
    borderRadius: 6,
    padding: '0.5rem 0.75rem',
    color: 'hsl(38,12%,86%)',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const save = async () => {
    if (!form.title || !form.content) {
      setError('Title and content are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/ops/runbooks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          incidentCategories: form.incidentCategories
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          affectedServices: form.affectedServices
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          alertRuleIds: [],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onCreated();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'hsla(0,0%,0%,0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'hsl(210,12%,7%)',
          borderRadius: 14,
          border: '1px solid hsla(0,0%,100%,0.08)',
          padding: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'hsl(38,12%,94%)' }}>
            Create Runbook
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(210,5%,50%)',
            }}
          >
            <X size={18} />
          </button>
        </div>
        {error && (
          <div
            style={{
              padding: '0.625rem',
              borderRadius: 6,
              background: 'hsla(0,72%,51%,0.1)',
              border: '1px solid hsla(0,72%,51%,0.25)',
              color: '#ef4444',
              fontSize: 13,
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label
              style={{ fontSize: 11, color: 'hsl(210,5%,46%)', display: 'block', marginBottom: 4 }}
            >
              Title *
            </label>
            <input
              style={inputSt}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. High API Latency Response"
            />
          </div>
          <div>
            <label
              style={{ fontSize: 11, color: 'hsl(210,5%,46%)', display: 'block', marginBottom: 4 }}
            >
              Description
            </label>
            <input
              style={inputSt}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Brief summary of when to use this runbook"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'hsl(210,5%,46%)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Category
              </label>
              <select
                style={inputSt}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'hsl(210,5%,46%)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Severity
              </label>
              <select
                style={inputSt}
                value={form.severity}
                onChange={(e) => set('severity', e.target.value)}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label
              style={{ fontSize: 11, color: 'hsl(210,5%,46%)', display: 'block', marginBottom: 4 }}
            >
              Tags (comma-separated)
            </label>
            <input
              style={inputSt}
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="api, latency, performance"
            />
          </div>
          <div>
            <label
              style={{ fontSize: 11, color: 'hsl(210,5%,46%)', display: 'block', marginBottom: 4 }}
            >
              Incident Categories (comma-separated)
            </label>
            <input
              style={inputSt}
              value={form.incidentCategories}
              onChange={(e) => set('incidentCategories', e.target.value)}
              placeholder="api_degradation, service_disruption"
            />
          </div>
          <div>
            <label
              style={{ fontSize: 11, color: 'hsl(210,5%,46%)', display: 'block', marginBottom: 4 }}
            >
              Affected Services (comma-separated service IDs)
            </label>
            <input
              style={inputSt}
              value={form.affectedServices}
              onChange={(e) => set('affectedServices', e.target.value)}
              placeholder="api, database, auth"
            />
          </div>
          <div>
            <label
              style={{ fontSize: 11, color: 'hsl(210,5%,46%)', display: 'block', marginBottom: 4 }}
            >
              Content (Markdown) *
            </label>
            <textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              placeholder="# Runbook Title&#10;&#10;## Steps&#10;1. Check logs..."
              rows={12}
              style={{
                ...inputSt,
                resize: 'vertical',
                lineHeight: 1.6,
                fontFamily: 'ui-monospace, monospace',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 6,
                fontSize: 13,
                background: 'transparent',
                border: '1px solid hsla(0,0%,100%,0.1)',
                color: 'hsl(210,5%,52%)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                background: 'hsla(210,55%,52%,0.15)',
                border: '1px solid hsla(210,55%,52%,0.35)',
                color: 'hsl(210,55%,72%)',
                cursor: 'pointer',
              }}
            >
              {saving ? 'Creating...' : 'Create Runbook'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpsRunbooksPage() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [viewing, setViewing] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`${BASE}/ops/runbooks`, { credentials: 'include' });
    setRunbooks(((await res.json()) as { runbooks: Runbook[] }).runbooks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = runbooks.filter((r) => {
    const matchCat = catFilter === 'all' || r.category === catFilter;
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const categories = ['all', ...Array.from(new Set(runbooks.map((r) => r.category)))];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'hsl(210,12%,5%)',
        color: 'hsl(38,12%,90%)',
        padding: '2rem clamp(1rem,5vw,2.5rem)',
      }}
    >
      {viewing !== null && <RunbookViewer id={viewing} onClose={() => setViewing(null)} />}
      {showCreate && <CreateRunbookModal onClose={() => setShowCreate(false)} onCreated={load} />}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <BookOpen size={18} style={{ color: '#3b82f6' }} />
              <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(38,12%,94%)' }}>
                Runbook Library
              </h1>
              <span style={{ fontSize: 11, color: 'hsl(210,5%,48%)' }}>
                {runbooks.length} runbooks
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'hsl(210,5%,50%)' }}>
              Step-by-step remediation guides attached to alert types and incident categories.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0.5rem 1rem',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              background: 'hsla(210,55%,52%,0.12)',
              border: '1px solid hsla(210,55%,52%,0.3)',
              color: 'hsl(210,55%,70%)',
              cursor: 'pointer',
            }}
          >
            <Plus size={13} />
            New Runbook
          </button>
        </div>

        {/* Search + Filter */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(210,5%,42%)',
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search runbooks..."
              style={{
                width: '100%',
                paddingLeft: 30,
                background: 'hsl(210,12%,9%)',
                border: '1px solid hsla(0,0%,100%,0.08)',
                borderRadius: 7,
                padding: '0.5rem 0.75rem 0.5rem 30px',
                color: 'hsl(38,12%,82%)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: '1px solid',
                  background: catFilter === c ? `${categoryColor(c)}15` : 'transparent',
                  borderColor: catFilter === c ? `${categoryColor(c)}35` : 'hsla(0,0%,100%,0.08)',
                  color: catFilter === c ? categoryColor(c) : 'hsl(210,5%,48%)',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'hsl(210,5%,48%)', padding: '3rem 0' }}>
            Loading runbooks...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'hsl(210,5%,48%)' }}>
            <BookOpen size={28} style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.3 }} />
            No runbooks found.{' '}
            {search || catFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Create your first runbook.'}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {filtered.map((rb) => {
              const cc = categoryColor(rb.category);
              return (
                <div
                  key={rb.id}
                  onClick={() => setViewing(rb.id)}
                  style={{
                    background: 'hsla(0,0%,100%,0.025)',
                    border: '1px solid hsla(0,0%,100%,0.07)',
                    borderRadius: 10,
                    padding: '1.125rem',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'hsla(0,0%,100%,0.04)';
                    e.currentTarget.style.borderColor = 'hsla(0,0%,100%,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'hsla(0,0%,100%,0.025)';
                    e.currentTarget.style.borderColor = 'hsla(0,0%,100%,0.07)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: `${cc}15`,
                          color: cc,
                          border: `1px solid ${cc}28`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {rb.category}
                      </span>
                      {rb.severity !== 'any' && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: 'hsla(0,0%,100%,0.05)',
                            color: 'hsl(38,12%,62%)',
                            border: '1px solid hsla(0,0%,100%,0.08)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {rb.severity}
                        </span>
                      )}
                    </div>
                    <ChevronRight size={14} style={{ color: 'hsl(210,5%,40%)', flexShrink: 0 }} />
                  </div>
                  <div
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: 'hsl(38,12%,92%)',
                      marginBottom: 4,
                      lineHeight: 1.35,
                    }}
                  >
                    {rb.title}
                  </div>
                  {rb.description && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'hsl(210,5%,50%)',
                        margin: '0 0 10px',
                        lineHeight: 1.5,
                      }}
                    >
                      {rb.description}
                    </p>
                  )}
                  {rb.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {rb.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 3,
                            background: 'hsla(0,0%,100%,0.04)',
                            border: '1px solid hsla(0,0%,100%,0.07)',
                            color: 'hsl(38,12%,60%)',
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 10, color: 'hsl(210,5%,38%)' }}>
                      {rb.author ?? 'Platform Engineering'} · v{rb.version}
                    </span>
                    <span style={{ fontSize: 10, color: 'hsl(210,5%,38%)' }}>
                      {new Date(rb.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
