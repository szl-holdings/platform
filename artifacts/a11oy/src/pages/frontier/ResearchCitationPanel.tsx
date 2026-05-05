import { useState } from 'react';

const GOLD = '#c9b787';
const BORDER = 'rgba(255,255,255,0.08)';
const SURFACE = 'rgba(255,255,255,0.025)';
const DIM = '#8a8a8a';
const MUTED = '#5e5e5e';

export interface Citation {
  id: string;
  lab: string;
  kind: 'lab' | 'company' | 'academic' | 'standard';
  title: string;
  sourceUrl: string;
  sourceName: string;
  excerpt: string;
  date?: string;
}

interface ResearchCitationPanelProps {
  citations: Citation[];
  title?: string;
  collapsed?: boolean;
}

const KIND_LABELS: Record<Citation['kind'], string> = {
  lab: 'Research Lab',
  company: 'Applied AI Co',
  academic: 'Academic Voice',
  standard: 'Standard / Reg',
};

const KIND_COLORS: Record<Citation['kind'], string> = {
  lab: '#6b8de3',
  company: '#e3a66b',
  academic: '#8de3b5',
  standard: '#e3d36b',
};

export function ResearchCitationPanel({
  citations,
  title = 'Research Citations',
  collapsed: initCollapsed = true,
}: ResearchCitationPanelProps) {
  const [open, setOpen] = useState(!initCollapsed);

  if (citations.length === 0) return null;

  return (
    <div style={{
      border: `1px solid ${BORDER}`,
      borderRadius: 8,
      background: SURFACE,
      marginTop: 16,
      overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: DIM,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: MUTED,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${BORDER}`,
            padding: '2px 6px',
            borderRadius: 3,
          }}>
            Research citation
          </span>
          <span style={{ fontSize: 12, color: DIM }}>{title}</span>
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono, monospace)',
            color: MUTED,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: '1px 7px',
          }}>
            {citations.length}
          </span>
        </div>
        <span style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-mono, monospace)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-mono, monospace)', marginBottom: 12, lineHeight: 1.5 }}>
            Lab and company names below are for internal research context only.
            They do not appear in external product copy. See RESEARCH_MYTHOS doctrine.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {citations.map(c => (
              <div key={c.id} style={{
                border: `1px solid ${BORDER}`,
                borderRadius: 6,
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 9,
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: KIND_COLORS[c.kind],
                    background: `${KIND_COLORS[c.kind]}18`,
                    border: `1px solid ${KIND_COLORS[c.kind]}40`,
                    padding: '2px 6px',
                    borderRadius: 3,
                  }}>
                    {KIND_LABELS[c.kind]}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e5e5e5' }}>{c.lab}</span>
                  {c.date && (
                    <span style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-mono, monospace)', marginLeft: 'auto' }}>
                      Accessed: {c.date}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#d5d5d5', marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: DIM, lineHeight: 1.5, marginBottom: 8 }}>{c.excerpt}</div>
                <a
                  href={c.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: GOLD, textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {c.sourceName} →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
