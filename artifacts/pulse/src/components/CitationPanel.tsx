import {
  AlertCircle,
  Brain,
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/pulse';

export interface Citation {
  id: string;
  sourceType: 'entity' | 'memory' | 'reflection' | 'signal' | 'trace';
  sourceId: string;
  domain?: string;
  quote?: string;
  freshness?: string;
  confidence?: number;
  verified?: boolean;
}

const SOURCE_TYPE_ICONS: Record<Citation['sourceType'], React.ReactNode> = {
  entity: <Database size={11} />,
  memory: <Brain size={11} />,
  reflection: <Lightbulb size={11} />,
  signal: <AlertCircle size={11} />,
  trace: <ExternalLink size={11} />,
};

const SOURCE_TYPE_COLORS: Record<Citation['sourceType'], string> = {
  entity: '#4eca8b',
  memory: '#7eb8f7',
  reflection: '#c8a84b',
  signal: '#e8855b',
  trace: '#a78bfa',
};

const SOURCE_TYPE_LABELS: Record<Citation['sourceType'], string> = {
  entity: 'Entity',
  memory: 'Memory',
  reflection: 'Reflection',
  signal: 'Signal',
  trace: 'Trace',
};

function formatFreshness(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const diffMs = Date.now() - t;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return new Date(t).toLocaleDateString();
}

function CitationBadge(props: Citation) {
  const { id, sourceType, sourceId, domain, confidence, freshness, verified, quote } = props;
  const [expanded, setExpanded] = useState(false);
  const color = SOURCE_TYPE_COLORS[sourceType] ?? '#888';
  const isEntity = sourceType === 'entity';
  const isExpandable = !isEntity && Boolean(quote);

  const headerContent = (
    <>
      {SOURCE_TYPE_ICONS[sourceType]}
      <span style={{ fontWeight: 600 }}>{SOURCE_TYPE_LABELS[sourceType]}</span>
      {domain && <span style={{ opacity: 0.7 }}>· {domain}</span>}
      {confidence !== undefined && (
        <span style={{ opacity: 0.7 }}>· {(confidence * 100).toFixed(0)}%</span>
      )}
      {freshness && (
        <span style={{ opacity: 0.6 }} title={new Date(freshness).toLocaleString()}>
          · {formatFreshness(freshness)}
        </span>
      )}
      {verified && <span style={{ color: '#4eca8b', fontWeight: 700 }}>✓</span>}
      {isEntity && <ExternalLink size={9} style={{ opacity: 0.5, marginLeft: 2 }} />}
      {isExpandable &&
        (expanded ? (
          <ChevronUp size={10} style={{ opacity: 0.6, marginLeft: 2 }} />
        ) : (
          <ChevronDown size={10} style={{ opacity: 0.6, marginLeft: 2 }} />
        ))}
    </>
  );

  const headerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 7px',
    borderRadius: 4,
    background: `${color}12`,
    border: `1px solid ${color}30`,
    fontSize: '0.63rem',
    color,
    fontFamily: 'monospace',
    verticalAlign: 'middle',
    textDecoration: 'none',
    cursor: isEntity || isExpandable ? 'pointer' : 'default',
  };

  const quotePreview = quote && (
    <div
      style={{
        marginTop: 4,
        padding: '5px 8px',
        borderLeft: `2px solid ${color}55`,
        background: `${color}08`,
        borderRadius: '0 4px 4px 0',
        fontSize: '0.7rem',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 1.45,
        fontStyle: 'italic',
        maxWidth: 460,
      }}
    >
      "{quote}"
    </div>
  );

  const wrapper: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: 0,
    maxWidth: '100%',
  };

  if (isEntity) {
    const search = new URLSearchParams({ origin: sourceId });
    if (domain) search.set('domain', domain);
    const href = `${BASE}/constellation/entities/${sourceId}?${search.toString()}`;
    return (
      <div style={wrapper} data-citation-id={id}>
        <Link href={href} style={headerStyle} title="Open in Constellation">
          {headerContent}
        </Link>
        {quotePreview}
      </div>
    );
  }

  if (isExpandable) {
    return (
      <div style={wrapper} data-citation-id={id}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{ ...headerStyle, font: 'inherit', fontSize: '0.63rem', fontFamily: 'monospace' }}
          aria-expanded={expanded}
        >
          {headerContent}
        </button>
        {expanded && quotePreview}
      </div>
    );
  }

  return (
    <div style={wrapper} data-citation-id={id}>
      <span style={headerStyle}>{headerContent}</span>
      {quotePreview}
    </div>
  );
}

interface CitationPanelProps {
  citations: Citation[];
  highlighted?: string[];
}

export function CitationPanel({ citations, highlighted = [] }: CitationPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (citations.length === 0) return null;

  const highlightedCitations =
    highlighted.length > 0 ? citations.filter((c) => highlighted.includes(c.id)) : citations;

  const shown = expanded ? citations : highlightedCitations.slice(0, 4);
  const hasMore = citations.length > shown.length;

  return (
    <div
      style={{
        marginTop: 10,
        padding: '10px 12px',
        borderRadius: 7,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 7,
        }}
      >
        <div
          style={{
            fontSize: '0.63rem',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          Evidence Provenance · {citations.length} sources
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.63rem',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            {expanded ? (
              <>
                <ChevronUp size={10} /> Collapse
              </>
            ) : (
              <>
                <ChevronDown size={10} /> Show all {citations.length}
              </>
            )}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
        {shown.map((c) => (
          <CitationBadge key={c.id} {...c} />
        ))}
      </div>
    </div>
  );
}
