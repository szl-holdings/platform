/**
 * A11oy /dossier — In-app reader for the long-form SZL thesis and audit
 * corpus that previously lived only as repo-root markdown.
 *
 * Surfaces (tabs):
 *   - research-dossier   → RESEARCH_DOSSIER.md (Alloy Codex / prompt kernel)
 *   - source-of-truth    → SOURCE_OF_TRUTH.md (canonical metrics & endpoints)
 *   - operational-audit  → OPERATIONAL-AUDIT.md (pre-standby audit, 2026-04-23)
 *   - aegis-thesis       → content/launch-series/07-medium-aegis-thesis/medium.md
 *
 * All four docs are imported via Vite `?raw` so they're bundled at build
 * time — no extra request, no drift, no re-authoring. Same pattern as
 * the canonical Ouroboros /thesis page.
 *
 * Author: Stephen P. Lutar — SZL Holdings — ORCID 0009-0001-0110-4173
 */
import { useMemo, useState } from 'react';
import { Layout } from '../components/layout';
import { Card, PageHeader, SectionTitle } from '../components/ui';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — vite '?raw' import
import researchDossier from '../../../../RESEARCH_DOSSIER.md?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — vite '?raw' import
import sourceOfTruth from '../../../../SOURCE_OF_TRUTH.md?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — vite '?raw' import
import operationalAudit from '../../../../OPERATIONAL-AUDIT.md?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — vite '?raw' import
import aegisThesis from '../../../../content/launch-series/07-medium-aegis-thesis/medium.md?raw';

const GOLD = '#c9b787';
const BORDER = 'var(--color-a11oy-border)';
const TEXT = 'var(--color-a11oy-text)';
const SUB = 'var(--color-a11oy-text-sub)';
const GHOST = 'var(--color-a11oy-text-ghost)';
const MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';

interface DossierDoc {
  id: string;
  title: string;
  source: string;
  body: string;
  blurb: string;
}

const DOCS: DossierDoc[] = [
  {
    id: 'research-dossier',
    title: 'Research Dossier',
    source: 'RESEARCH_DOSSIER.md',
    body: researchDossier as string,
    blurb: 'Alloy Codex — prompt-kernel library distilled from 21 leading 2026 AI tools.',
  },
  {
    id: 'source-of-truth',
    title: 'Source of Truth',
    source: 'SOURCE_OF_TRUTH.md',
    body: sourceOfTruth as string,
    blurb: 'Canonical metrics, platform names, model profiles, endpoint references.',
  },
  {
    id: 'operational-audit',
    title: 'Operational Audit',
    source: 'OPERATIONAL-AUDIT.md',
    body: operationalAudit as string,
    blurb: 'Pre-standby audit (2026-04-23): healthy / attention-on-resume / blocking.',
  },
  {
    id: 'aegis-thesis',
    title: 'Aegis Defense Thesis',
    source: 'content/launch-series/07-medium-aegis-thesis/medium.md',
    body: aegisThesis as string,
    blurb: 'Why Governed AI is the next SOC architecture — Defense & Intelligence series.',
  },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface Heading {
  level: number;
  text: string;
  anchor: string;
}

function extractHeadings(md: string): Heading[] {
  const out: Heading[] = [];
  for (const line of md.split('\n')) {
    const m = /^(#{1,4})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    out.push({ level: m[1].length, text: m[2].replace(/[`*]/g, ''), anchor: slugify(m[2]) });
  }
  return out;
}

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'code' | 'ul' | 'ol' | 'hr' | 'blockquote' | 'table';
  text?: string;
  items?: string[];
  rows?: string[][];
  lang?: string;
  anchor?: string;
}

function tokenize(md: string): Block[] {
  const lines = md.split('\n');
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push({ type: 'code', text: buf.join('\n'), lang });
      continue;
    }

    // Headings
    const h = /^(#{1,4})\s+(.+?)\s*$/.exec(line);
    if (h) {
      const level = h[1].length as 1 | 2 | 3 | 4;
      const text = h[2];
      out.push({ type: `h${level}` as Block['type'], text, anchor: slugify(text) });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}\s*$/.test(line) || /^\*{3,}\s*$/.test(line)) {
      out.push({ type: 'hr' });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push({ type: 'blockquote', text: buf.join('\n') });
      continue;
    }

    // Table (pipe-delimited with separator row)
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[-:|\s]+\|[-:|\s]+/.test(lines[i + 1])) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        if (/^\s*\|?[-:|\s]+\|[-:|\s]+/.test(lines[i])) {
          i++;
          continue;
        }
        const cells = lines[i].split('|').map((c) => c.trim()).filter((_, idx, arr) => !(idx === 0 && arr[0] === '') && !(idx === arr.length - 1 && arr[arr.length - 1] === ''));
        rows.push(cells);
        i++;
      }
      out.push({ type: 'table', rows });
      continue;
    }

    // Lists
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      out.push({ type: 'ul', items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      out.push({ type: 'ol', items });
      continue;
    }

    // Paragraph (collect until blank line)
    if (line.trim() === '') {
      i++;
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('>') && !/^\s*[-*+]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    if (buf.length > 0) out.push({ type: 'p', text: buf.join(' ') });
  }
  return out;
}

function renderInline(text: string): React.ReactNode {
  // very small inline renderer: **bold**, *em*, `code`, [link](url)
  const parts: React.ReactNode[] = [];
  let rest = text;
  let key = 0;
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/;
  while (rest.length > 0) {
    const m = re.exec(rest);
    if (!m) {
      parts.push(rest);
      break;
    }
    if (m.index > 0) parts.push(rest.slice(0, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(<strong key={key++} style={{ color: TEXT }}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('*')) {
      parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith('`')) {
      parts.push(<code key={key++} style={{ fontFamily: MONO, fontSize: '0.85em', backgroundColor: 'rgba(245,245,245,0.06)', padding: '1px 4px', borderRadius: 3, color: GOLD }}>{tok.slice(1, -1)}</code>);
    } else {
      const lm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)!;
      parts.push(<a key={key++} href={lm[2]} target="_blank" rel="noreferrer" style={{ color: GOLD, textDecoration: 'underline' }}>{lm[1]}</a>);
    }
    rest = rest.slice(m.index + tok.length);
  }
  return parts;
}

function Doc({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h1':
            return <h1 key={i} id={b.anchor} style={{ fontFamily: MONO, color: GOLD, fontSize: 22, marginTop: 16, scrollMarginTop: 80 }}>{b.text}</h1>;
          case 'h2':
            return <h2 key={i} id={b.anchor} style={{ fontFamily: MONO, color: TEXT, fontSize: 18, marginTop: 20, borderTop: `1px solid ${BORDER}`, paddingTop: 12, scrollMarginTop: 80 }}>{b.text}</h2>;
          case 'h3':
            return <h3 key={i} id={b.anchor} style={{ fontFamily: MONO, color: TEXT, fontSize: 15, marginTop: 14, scrollMarginTop: 80 }}>{b.text}</h3>;
          case 'h4':
            return <h4 key={i} id={b.anchor} style={{ fontFamily: MONO, color: SUB as string, fontSize: 13, marginTop: 10, scrollMarginTop: 80 }}>{b.text}</h4>;
          case 'p':
            return <p key={i} style={{ color: TEXT, lineHeight: 1.65, fontSize: 14 }}>{renderInline(b.text ?? '')}</p>;
          case 'code':
            return (
              <pre key={i} style={{ fontFamily: MONO, fontSize: 12, backgroundColor: 'rgba(245,245,245,0.04)', border: `1px solid ${BORDER}`, padding: 12, borderRadius: 4, color: TEXT, overflowX: 'auto', whiteSpace: 'pre' }}>
                {b.text}
              </pre>
            );
          case 'ul':
            return (
              <ul key={i} style={{ color: TEXT, lineHeight: 1.65, fontSize: 14, paddingLeft: 20, listStyle: 'disc' }}>
                {(b.items ?? []).map((it, j) => <li key={j}>{renderInline(it)}</li>)}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} style={{ color: TEXT, lineHeight: 1.65, fontSize: 14, paddingLeft: 20, listStyle: 'decimal' }}>
                {(b.items ?? []).map((it, j) => <li key={j}>{renderInline(it)}</li>)}
              </ol>
            );
          case 'hr':
            return <hr key={i} style={{ borderColor: BORDER, margin: '12px 0' }} />;
          case 'blockquote':
            return (
              <blockquote key={i} style={{ borderLeft: `2px solid ${GOLD}`, paddingLeft: 12, color: SUB as string, fontStyle: 'italic', fontSize: 14, lineHeight: 1.65 }}>
                {renderInline(b.text ?? '')}
              </blockquote>
            );
          case 'table':
            return (
              <div key={i} style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: 4 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12, color: TEXT }}>
                  <thead>
                    <tr>
                      {(b.rows?.[0] ?? []).map((c, j) => (
                        <th key={j} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${BORDER}`, color: GOLD, background: 'rgba(201,183,135,0.05)' }}>{renderInline(c)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(b.rows ?? []).slice(1).map((row, r) => (
                      <tr key={r}>
                        {row.map((c, j) => (
                          <td key={j} style={{ padding: '6px 10px', borderTop: `1px solid ${BORDER}`, verticalAlign: 'top' }}>{renderInline(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export default function Dossier() {
  const [activeId, setActiveId] = useState<string>(DOCS[0].id);
  const active = useMemo(() => DOCS.find((d) => d.id === activeId) ?? DOCS[0], [activeId]);
  const blocks = useMemo(() => tokenize(active.body), [active]);
  const headings = useMemo(() => extractHeadings(active.body), [active]);
  const wordCount = useMemo(() => active.body.split(/\s+/).filter(Boolean).length, [active]);

  return (
    <Layout>
      <PageHeader
        eyebrow="A11OY · DOSSIER"
        title="Long-form thesis & audit corpus"
        subtitle="Investor-readable, in-app surface for the four documents that previously lived only as repo-root markdown."
      />

      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          {DOCS.map((d) => {
            const isActive = d.id === activeId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveId(d.id)}
                className="px-3 py-1.5 rounded text-xs transition-colors"
                style={{
                  fontFamily: MONO,
                  backgroundColor: isActive ? 'rgba(201,183,135,0.14)' : 'rgba(245,245,245,0.04)',
                  color: isActive ? GOLD : SUB as string,
                  border: `1px solid ${isActive ? 'rgba(201,183,135,0.34)' : BORDER}`,
                }}
                aria-pressed={isActive}
              >
                {d.title}
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginBottom: 12 }}>
          <div className="flex flex-wrap items-baseline gap-3">
            <span style={{ color: GOLD, fontFamily: MONO, fontSize: 13 }}>{active.title}</span>
            <span style={{ color: GHOST as string, fontFamily: MONO, fontSize: 11 }}>{active.source}</span>
            <span style={{ color: GHOST as string, fontFamily: MONO, fontSize: 11 }}>· {wordCount.toLocaleString()} words</span>
            <span style={{ color: GHOST as string, fontFamily: MONO, fontSize: 11 }}>· {headings.length} sections</span>
          </div>
          <div style={{ color: SUB as string, fontSize: 13, marginTop: 4 }}>{active.blurb}</div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 mt-4">
        {/* TOC */}
        <Card>
          <SectionTitle>Contents</SectionTitle>
          <nav className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto pr-1">
            {headings.length === 0 && (
              <div style={{ color: GHOST as string, fontSize: 12, fontFamily: MONO }}>No headings.</div>
            )}
            {headings.map((h, i) => (
              <a
                key={i}
                href={`#${h.anchor}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(h.anchor);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                style={{
                  paddingLeft: (h.level - 1) * 10,
                  color: h.level === 1 ? GOLD : h.level === 2 ? (TEXT as string) : (SUB as string),
                  fontFamily: MONO,
                  fontSize: h.level === 1 ? 12 : 11,
                  textDecoration: 'none',
                  lineHeight: 1.5,
                  padding: '2px 0',
                  borderLeft: h.level >= 3 ? `1px solid ${BORDER}` : 'none',
                }}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </Card>

        {/* Body */}
        <Card>
          <article style={{ maxWidth: 900 }}>
            <Doc blocks={blocks} />
          </article>
        </Card>
      </div>
    </Layout>
  );
}
