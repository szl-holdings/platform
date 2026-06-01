import * as React from 'react';
import { useCallback, useState } from 'react';

const BG = { surface: '#0c1018', elevated: '#10141e', card: '#111620' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.07)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
};
const ACCENT = {
  green: '#6b8f71',
  amber: '#c8953c',
  red: '#c45a4a',
  blue: '#4a90b8',
  purple: '#8b7ac8',
  gold: '#b8975a',
};

export type AtlasTemplateType =
  | 'deck'
  | 'brief'
  | 'memo'
  | 'executive_summary'
  | 'report'
  | 'approval_packet'
  | 'incident_packet'
  | 'readiness_report'
  | 'proposal'
  | 'voyage_report'
  | 'property_brief'
  | 'threat_assessment';

export type AtlasExportFormat = 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'web';

export interface AtlasArtifactMeta {
  id: number;
  slug: string;
  title: string;
  templateType: AtlasTemplateType;
  domain: string;
  version: number;
  status: string;
  isLatest: boolean;
  createdAt: string;
  shareToken?: string;
}

export interface AtlasArtifactSection {
  id: string;
  title: string;
  content: string;
  type: string;
  order: number;
}

export interface AtlasArtifactFull extends AtlasArtifactMeta {
  sections: AtlasArtifactSection[];
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

const TEMPLATE_LABELS: Record<string, string> = {
  deck: 'Deck',
  brief: 'Brief',
  memo: 'Memo',
  executive_summary: 'Executive Summary',
  report: 'Report',
  approval_packet: 'Approval Packet',
  incident_packet: 'Incident Packet',
  readiness_report: 'Readiness Report',
  proposal: 'Proposal',
  voyage_report: 'Voyage Report',
  property_brief: 'Property Brief',
  threat_assessment: 'Threat Assessment',
};

const TEMPLATE_ICONS: Record<string, string> = {
  deck: '📊',
  brief: '📋',
  memo: '📝',
  executive_summary: '📄',
  report: '📈',
  approval_packet: '✅',
  incident_packet: '🚨',
  readiness_report: '🎯',
  proposal: '💡',
  voyage_report: '🚢',
  property_brief: '🏢',
  threat_assessment: '⚠️',
};

const STATUS_COLORS: Record<string, string> = {
  draft: TEXT.tertiary,
  generating: ACCENT.amber,
  ready: ACCENT.green,
  exporting: ACCENT.blue,
  exported: ACCENT.blue,
  failed: ACCENT.red,
  archived: TEXT.tertiary,
};

const EXPORT_FORMAT_LABELS: Record<AtlasExportFormat, string> = {
  pdf: 'PDF',
  docx: 'Word',
  pptx: 'PowerPoint',
  xlsx: 'Excel',
  web: 'Web Link',
};

export interface AtlasArtifactCardProps {
  artifact: AtlasArtifactMeta;
  onOpen?: (artifact: AtlasArtifactMeta) => void;
  onExport?: (artifactId: number, format: AtlasExportFormat) => void;
  onRegenerate?: (artifactId: number) => void;
  onShare?: (artifactId: number) => void;
  className?: string;
}

export function AtlasArtifactCard({
  artifact,
  onOpen,
  onExport,
  onRegenerate,
  onShare,
  className,
}: AtlasArtifactCardProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div
      className={className}
      style={{
        background: BG.card,
        border: `1px solid ${BORDER.muted}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
      }}
      onClick={() => onOpen?.(artifact)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 22 }}>{TEMPLATE_ICONS[artifact.templateType] ?? '📄'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: TEXT.primary,
              marginBottom: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {artifact.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: TEXT.tertiary }}>
              {TEMPLATE_LABELS[artifact.templateType]}
            </span>
            <span style={{ fontSize: 10, color: TEXT.tertiary }}>v{artifact.version}</span>
            <span style={{ fontSize: 10, color: TEXT.tertiary, textTransform: 'capitalize' }}>
              {artifact.domain}
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            padding: '2px 7px',
            borderRadius: 4,
            flexShrink: 0,
            background: `${STATUS_COLORS[artifact.status] ?? TEXT.tertiary}15`,
            color: STATUS_COLORS[artifact.status] ?? TEXT.tertiary,
          }}
        >
          {artifact.status}
        </span>
      </div>

      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={(e) => e.stopPropagation()}
      >
        {onExport && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              style={{
                padding: '3px 9px',
                borderRadius: 5,
                border: `1px solid ${BORDER.muted}`,
                background: BG.elevated,
                color: TEXT.secondary,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Export ▾
            </button>
            {showExportMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  zIndex: 10,
                  background: BG.elevated,
                  border: `1px solid ${BORDER.muted}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                  minWidth: 120,
                }}
              >
                {(['pdf', 'docx', 'pptx', 'xlsx', 'web'] as AtlasExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      onExport(artifact.id, fmt);
                      setShowExportMenu(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 12px',
                      background: 'none',
                      border: 'none',
                      color: TEXT.secondary,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = BG.card)}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    {EXPORT_FORMAT_LABELS[fmt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {onRegenerate && (
          <button
            onClick={() => onRegenerate(artifact.id)}
            style={{
              padding: '3px 9px',
              borderRadius: 5,
              border: `1px solid ${ACCENT.blue}40`,
              background: `${ACCENT.blue}10`,
              color: ACCENT.blue,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Regenerate
          </button>
        )}
        {onShare && (
          <button
            onClick={() => onShare(artifact.id)}
            style={{
              padding: '3px 9px',
              borderRadius: 5,
              border: `1px solid ${BORDER.muted}`,
              background: BG.elevated,
              color: TEXT.secondary,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
}

export interface AtlasArtifactViewerProps {
  artifact: AtlasArtifactFull;
  onExport?: (format: AtlasExportFormat) => void;
  onRegenerate?: () => void;
  onShare?: () => void;
  onBack?: () => void;
  className?: string;
}

export function AtlasArtifactViewer({
  artifact,
  onExport,
  onRegenerate,
  onShare,
  onBack,
  className,
}: AtlasArtifactViewerProps) {
  const [activeSection, setActiveSection] = useState<string | null>(
    Array.isArray(artifact.sections) && artifact.sections.length > 0
      ? (artifact.sections[0]?.id ?? null)
      : null,
  );

  const sections = Array.isArray(artifact.sections)
    ? (artifact.sections as AtlasArtifactSection[])
    : [];
  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          borderBottom: `1px solid ${BORDER.muted}`,
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: TEXT.secondary,
              cursor: 'pointer',
              fontSize: 13,
              padding: 0,
            }}
          >
            ← Back
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: TEXT.primary }}>{artifact.title}</div>
          <div style={{ fontSize: 11, color: TEXT.tertiary }}>
            {TEMPLATE_LABELS[artifact.templateType]} · v{artifact.version} · {artifact.domain}
            {!artifact.isLatest && (
              <span style={{ color: ACCENT.amber, marginLeft: 8 }}>Not latest version</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: `1px solid ${ACCENT.blue}40`,
                background: `${ACCENT.blue}10`,
                color: ACCENT.blue,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Regenerate
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: `1px solid ${BORDER.muted}`,
                background: BG.elevated,
                color: TEXT.secondary,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Share
            </button>
          )}
          {onExport && (
            <button
              onClick={() => onExport('pdf')}
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
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {sections.length > 0 && (
          <div
            style={{
              width: 200,
              borderRight: `1px solid ${BORDER.muted}`,
              padding: '12px 0',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 16px',
                  background: activeSection === s.id ? `${ACCENT.blue}15` : 'none',
                  border: 'none',
                  borderLeft:
                    activeSection === s.id ? `2px solid ${ACCENT.blue}` : '2px solid transparent',
                  color: activeSection === s.id ? TEXT.primary : TEXT.secondary,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
          {currentSection ? (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: TEXT.primary, marginBottom: 12 }}>
                {currentSection.title}
              </h2>
              <div
                style={{
                  fontSize: 13,
                  color: TEXT.secondary,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {currentSection.content || (
                  <span style={{ color: TEXT.tertiary, fontStyle: 'italic' }}>
                    No content in this section.
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: TEXT.tertiary, textAlign: 'center', paddingTop: 60 }}>
              {sections.length === 0
                ? 'This artifact has no sections yet.'
                : 'Select a section to view.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface AtlasArtifactPanelProps {
  apiBaseUrl?: string;
  domain?: string;
  entityType?: string;
  entityId?: string;
  onArtifactCreated?: (artifact: AtlasArtifactMeta) => void;
  className?: string;
}

export function AtlasArtifactPanel({
  apiBaseUrl = '/api-server',
  domain,
  entityType,
  entityId,
  onArtifactCreated,
  className,
}: AtlasArtifactPanelProps) {
  const [artifacts, setArtifacts] = React.useState<AtlasArtifactMeta[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedArtifact, setSelectedArtifact] = React.useState<AtlasArtifactFull | null>(null);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({ latestOnly: 'true', limit: '20' });
    if (domain) params.set('domain', domain);
    if (entityType) params.set('entityType', entityType);
    if (entityId) params.set('entityId', entityId);
    return params.toString();
  }, [domain, entityType, entityId]);

  React.useEffect(() => {
    setLoading(true);
    fetch(`${apiBaseUrl}/atlas/artifacts?${buildQuery()}`)
      .then((r) => r.json())
      .then((d) => setArtifacts(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiBaseUrl, buildQuery]);

  const handleOpen = useCallback(
    async (artifact: AtlasArtifactMeta) => {
      const res = await fetch(`${apiBaseUrl}/atlas/artifacts/${artifact.id}`);
      const d = await res.json();
      if (d.data) setSelectedArtifact(d.data);
    },
    [apiBaseUrl],
  );

  const handleExport = useCallback(
    async (artifactId: number, format: AtlasExportFormat) => {
      await fetch(`${apiBaseUrl}/atlas/artifacts/${artifactId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
    },
    [apiBaseUrl],
  );

  const handleShare = useCallback(
    async (artifactId: number) => {
      const res = await fetch(`${apiBaseUrl}/atlas/artifacts/${artifactId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInHours: 72 }),
      });
      const d = await res.json();
      if (d.token) {
        const base = window.location.origin;
        navigator.clipboard.writeText(`${base}/atlas/shared/${d.token}`).catch(() => {});
      }
    },
    [apiBaseUrl],
  );

  const handleRegenerate = useCallback(
    async (artifactId: number) => {
      const res = await fetch(`${apiBaseUrl}/atlas/artifacts/${artifactId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const d = await res.json();
      if (d.data) {
        setArtifacts((prev) => [d.data, ...prev.filter((a) => a.slug !== d.data.slug)]);
      }
    },
    [apiBaseUrl],
  );

  if (selectedArtifact) {
    return (
      <AtlasArtifactViewer
        artifact={selectedArtifact}
        onBack={() => setSelectedArtifact(null)}
        onExport={(fmt) => handleExport(selectedArtifact.id, fmt)}
        onShare={() => handleShare(selectedArtifact.id)}
        onRegenerate={() => handleRegenerate(selectedArtifact.id)}
        {...(className !== undefined ? { className } : {})}
      />
    );
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary }}>Atlas Artifacts</span>
        <span style={{ fontSize: 11, color: TEXT.tertiary }}>
          {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''}
        </span>
      </div>
      {loading ? (
        <div style={{ color: TEXT.secondary, fontSize: 12, padding: 20, textAlign: 'center' }}>
          Loading…
        </div>
      ) : artifacts.length === 0 ? (
        <div
          style={{
            color: TEXT.tertiary,
            fontSize: 12,
            padding: 30,
            textAlign: 'center',
            background: BG.card,
            border: `1px solid ${BORDER.subtle}`,
            borderRadius: 10,
          }}
        >
          No artifacts yet. Generate the first artifact for this entity from the action menu.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {artifacts.map((a) => (
            <AtlasArtifactCard
              key={a.id}
              artifact={a}
              onOpen={handleOpen}
              onExport={handleExport}
              onRegenerate={handleRegenerate}
              onShare={handleShare}
            />
          ))}
        </div>
      )}
    </div>
  );
}
