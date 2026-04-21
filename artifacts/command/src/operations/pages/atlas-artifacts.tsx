import { useCallback, useEffect, useState } from 'react';

const BG = { surface: '#0a0d14', card: '#0f131e' };
const BORDER = { muted: 'rgba(255,255,255,0.07)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
};
const ACCENT = {
  purple: '#9b7ad8',
  amber: '#c8953c',
  green: '#6b8f71',
  red: '#c45a4a',
  gold: '#b8975a',
};

const TEMPLATE_ICONS: Record<string, string> = {
  ops_runbook: '📘',
  incident_postmortem: '🔍',
  brief: '📋',
  report: '📈',
  executive_summary: '📄',
  approval_packet: '✅',
};

const TEMPLATE_LABELS: Record<string, string> = {
  ops_runbook: 'Ops Runbook',
  incident_postmortem: 'Incident Post-Mortem',
  brief: 'AIOps Brief',
  report: 'Ops Report',
  executive_summary: 'Executive Summary',
  approval_packet: 'Approval Packet',
};

interface ArtifactMeta {
  id: number;
  slug: string;
  title: string;
  templateType: string;
  domain: string;
  version: number;
  status: string;
  isLatest: boolean;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

interface ArtifactSection {
  id: string;
  title: string;
  content: string;
  type: string;
  order: number;
}
interface ArtifactFull extends ArtifactMeta {
  sections: ArtifactSection[];
  content: Record<string, unknown>;
}

const STATUS_COLORS: Record<string, string> = {
  ready: ACCENT.green,
  generating: ACCENT.amber,
  draft: TEXT.tertiary,
  failed: ACCENT.red,
  archived: TEXT.tertiary,
};

const BASE = '/api-server';
const OPS_TEMPLATES = [
  'ops_runbook',
  'incident_postmortem',
  'brief',
  'report',
  'executive_summary',
  'approval_packet',
] as const;

export default function CommandAtlasArtifactsPage() {
  const [artifacts, setArtifacts] = useState<ArtifactMeta[]>([]);
  const [selected, setSelected] = useState<ArtifactFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    templateType: 'ops_runbook',
    entityType: 'workflow',
    entityId: '',
  });

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE}/atlas/artifacts?domain=aiops&latestOnly=true&limit=30`)
      .then((r) => r.json())
      .then((d) => setArtifacts(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = useCallback(async (a: ArtifactMeta) => {
    const r = await fetch(`${BASE}/atlas/artifacts/${a.id}`);
    const d = await r.json();
    if (d.data) setSelected(d.data);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const sections = [
        { id: 'summary', title: 'Summary', content: '', type: 'text', order: 0 },
        { id: 'root_cause', title: 'Root Cause Analysis', content: '', type: 'text', order: 1 },
        { id: 'timeline', title: 'Timeline', content: '', type: 'text', order: 2 },
        { id: 'remediation', title: 'Remediation Steps', content: '', type: 'text', order: 3 },
        { id: 'lessons', title: 'Lessons Learned', content: '', type: 'text', order: 4 },
      ];
      const r = await fetch(`${BASE}/atlas/artifacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          templateType: form.templateType,
          domain: 'aiops',
          entityType: form.entityType || undefined,
          entityId: form.entityId || undefined,
          sections,
        }),
      });
      const d = await r.json();
      if (d.data) {
        setArtifacts((prev) => [d.data, ...prev]);
        setShowCreate(false);
        setForm({ title: '', templateType: 'ops_runbook', entityType: 'workflow', entityId: '' });
      }
    } catch {
    } finally {
      setCreating(false);
    }
  }, [form]);

  const handleExport = useCallback(async (artifactId: number, format: string) => {
    await fetch(`${BASE}/atlas/artifacts/${artifactId}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format }),
    });
  }, []);

  if (selected) {
    const sections = Array.isArray(selected.sections) ? selected.sections : [];
    return (
      <div style={{ minHeight: '100vh', background: BG.surface, color: TEXT.primary }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 24px',
            borderBottom: `1px solid ${BORDER.muted}`,
            background: BG.card,
          }}
        >
          <button
            onClick={() => setSelected(null)}
            style={{
              background: 'none',
              border: 'none',
              color: TEXT.secondary,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{selected.title}</div>
            <div style={{ fontSize: 11, color: TEXT.tertiary }}>
              {TEMPLATE_LABELS[selected.templateType] ?? selected.templateType} · v
              {selected.version}
            </div>
          </div>
          <button
            onClick={() => handleExport(selected.id, 'pdf')}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: `1px solid ${ACCENT.gold}40`,
              background: `${ACCENT.gold}10`,
              color: ACCENT.gold,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Export PDF
          </button>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.length === 0 ? (
            <div style={{ color: TEXT.tertiary, textAlign: 'center', padding: 60 }}>
              No sections in this artifact.
            </div>
          ) : (
            sections.map((s) => (
              <div
                key={s.id}
                style={{
                  background: BG.card,
                  border: `1px solid ${BORDER.muted}`,
                  borderRadius: 10,
                  padding: '16px 20px',
                }}
              >
                <h3
                  style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary, marginBottom: 10 }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: TEXT.secondary,
                    lineHeight: 1.7,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {s.content || (
                    <span style={{ color: TEXT.tertiary, fontStyle: 'italic' }}>Empty section</span>
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: '100vh', background: BG.surface, color: TEXT.primary, padding: '24px' }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 24 }}>📘</span>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Atlas Artifacts — AIOps</h1>
            <p style={{ fontSize: 12, color: TEXT.secondary, margin: 0 }}>
              Runbooks, post-mortems, and operational intelligence documents
            </p>
          </div>
          <button
            onClick={() => setShowCreate((v) => !v)}
            style={{
              marginLeft: 'auto',
              padding: '7px 16px',
              borderRadius: 7,
              border: `1px solid ${ACCENT.purple}40`,
              background: `${ACCENT.purple}10`,
              color: ACCENT.purple,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            + New Artifact
          </button>
        </div>

        {showCreate && (
          <div
            style={{
              background: BG.card,
              border: `1px solid ${BORDER.muted}`,
              borderRadius: 10,
              padding: '18px 20px',
              marginBottom: 20,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: TEXT.primary }}>
              Create AIOps Artifact
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  value={form.templateType}
                  onChange={(e) => setForm((f) => ({ ...f, templateType: e.target.value }))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${BORDER.muted}`,
                    background: BG.surface,
                    color: TEXT.primary,
                    fontSize: 12,
                    flex: 1,
                  }}
                >
                  {OPS_TEMPLATES.map((t) => (
                    <option key={t} value={t}>
                      {TEMPLATE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <input
                  value={form.entityId}
                  onChange={(e) => setForm((f) => ({ ...f, entityId: e.target.value }))}
                  placeholder="Run ID (optional)"
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${BORDER.muted}`,
                    background: BG.surface,
                    color: TEXT.primary,
                    fontSize: 12,
                    width: 160,
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Artifact title…"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${BORDER.muted}`,
                    background: BG.surface,
                    color: TEXT.primary,
                    fontSize: 12,
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                  }}
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !form.title.trim()}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: `1px solid ${ACCENT.purple}40`,
                    background: `${ACCENT.purple}10`,
                    color: ACCENT.purple,
                    fontSize: 12,
                    cursor: 'pointer',
                    opacity: creating ? 0.5 : 1,
                  }}
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ color: TEXT.secondary, textAlign: 'center', padding: 60 }}>Loading…</div>
        ) : artifacts.length === 0 ? (
          <div style={{ color: TEXT.tertiary, textAlign: 'center', padding: 60 }}>
            No AIOps artifacts yet. Create your first ops runbook or post-mortem.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {artifacts.map((a) => (
              <div
                key={a.id}
                onClick={() => handleOpen(a)}
                style={{
                  background: BG.card,
                  border: `1px solid ${BORDER.muted}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 22 }}>{TEMPLATE_ICONS[a.templateType] ?? '📄'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: TEXT.primary }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT.tertiary, marginTop: 2 }}>
                    {TEMPLATE_LABELS[a.templateType] ?? a.templateType} · v{a.version}
                    {a.entityId ? ` · ${a.entityId}` : ''}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: `${STATUS_COLORS[a.status] ?? TEXT.tertiary}15`,
                    color: STATUS_COLORS[a.status] ?? TEXT.tertiary,
                  }}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
