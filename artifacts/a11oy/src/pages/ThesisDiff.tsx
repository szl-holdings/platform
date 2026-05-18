/**
 * A11oy /thesis/diff — Canonical thesis version diff.
 *
 * Routes:
 *   /a11oy/thesis/diff                  → defaults to previous-vs-latest
 *   /a11oy/thesis/diff/:from/:to        → e.g. /a11oy/thesis/diff/v9/v10
 *
 * Reviewers pick two canonical docs (e.g. v9 vs v10) and see which §-level
 * sections were added, removed, or changed, plus which paragraphs/list-items
 * changed inside each shared section. Every section heading deep-links back
 * into the standard /thesis/:version viewer at the correct anchor so a
 * reviewer can verify provenance in one click.
 *
 * Diff scope is intentionally narrow: we compare the bundled
 * `docs/thesis/v*-canonical.md` files. The data flow mirrors Thesis.tsx so
 * anchors generated here match anchors rendered there.
 *
 * Author: Stephen P. Lutar — SZL Holdings — ORCID 0009-0001-0110-4173
 */
import { useMemo } from 'react';
import { Link, useRoute } from 'wouter';
import { Layout } from '../components/layout';
import { Card, PageHeader, SectionTitle } from '../components/ui';

const CANONICAL_MODULES = import.meta.glob('../../../../docs/thesis/v*-canonical.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

interface CanonicalDoc {
  version: string;
  versionNum: number;
  slug: string;
  markdown: string;
}

const CANONICAL_DOCS: CanonicalDoc[] = Object.entries(CANONICAL_MODULES)
  .map(([path, markdown]): CanonicalDoc | null => {
    const m = /\/v(\d+)-canonical\.md$/.exec(path);
    if (!m) return null;
    const versionNum = Number(m[1]);
    return { version: `v${versionNum}`, versionNum, slug: `v${versionNum}-canonical`, markdown };
  })
  .filter((d): d is CanonicalDoc => d !== null)
  .sort((a, b) => a.versionNum - b.versionNum);

const GOLD = '#c9b787';
const GREY = '#8a8a8a';
const ADD = '#7fb77f';
const DEL = '#d97a7a';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9α-ωΑ-Ω→ω]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface MdLine {
  /** Stable hash-ish key used for set comparison. */
  key: string;
  /** Display text shown in the diff (may be multi-line for code blocks). */
  text: string;
  /** Token kind, mostly for icon/colour hints. */
  kind: 'p' | 'li' | 'code' | 'blockquote' | 'hr' | 'h3' | 'h4';
}

interface Section {
  /** h2 anchor, also the deep-link target inside Thesis.tsx. */
  anchor: string;
  /** h2 heading text as rendered. */
  heading: string;
  /** Ordered atomic lines under this h2 (until next h2). */
  lines: MdLine[];
  /** Lookup of line key → line, used for set-diff. */
  byKey: Map<string, MdLine>;
}

/**
 * Split a canonical doc into h2-keyed sections. Content before the first h2
 * (the title h1 + intro) is gathered under a synthetic `__preamble__` section
 * so it still participates in the diff.
 */
function parseSections(md: string): Section[] {
  const lines = md.split('\n');
  const sections: Section[] = [];
  let current: Section = {
    anchor: '__preamble__',
    heading: 'Preamble (before first ##)',
    lines: [],
    byKey: new Map(),
  };
  sections.push(current);

  const pushLine = (l: MdLine) => {
    current.lines.push(l);
    // Last-wins is fine; duplicate paragraphs in canonicals are vanishingly rare.
    current.byKey.set(l.key, l);
  };

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
      const text = buf.join('\n');
      pushLine({ kind: 'code', text, key: `code:${lang}:${text}` });
      continue;
    }

    // Headings
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      const anchor = slugify(text);
      if (level === 1) {
        // Title — keep visible in preamble, do not open a new section.
        pushLine({ kind: 'p', text: `# ${text}`, key: `h1:${anchor}` });
      } else if (level === 2) {
        current = { anchor, heading: text, lines: [], byKey: new Map() };
        sections.push(current);
      } else if (level === 3) {
        pushLine({ kind: 'h3', text: `### ${text}`, key: `h3:${anchor}` });
      } else {
        pushLine({ kind: 'h4', text: `#### ${text}`, key: `h4:${anchor}` });
      }
      i++;
      continue;
    }

    // Horizontal rule — skip as noise
    if (/^---+\s*$/.test(line)) {
      i++;
      continue;
    }

    // Lists (bullet)
    if (/^[-*+]\s+/.test(line)) {
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        const text = lines[i].replace(/^[-*+]\s+/, '').trim();
        pushLine({ kind: 'li', text, key: `li:${text}` });
        i++;
      }
      continue;
    }
    // Lists (numbered)
    if (/^\d+\.\s+/.test(line)) {
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s+/, '').trim();
        pushLine({ kind: 'li', text, key: `li:${text}` });
        i++;
      }
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        buf.push(lines[i].slice(2));
        i++;
      }
      const text = buf.join(' ').trim();
      pushLine({ kind: 'blockquote', text, key: `bq:${text}` });
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph (collect until blank line / structural marker)
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,4}\s|```|>|---|\d+\.|[-*+]\s)/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    const text = buf.join(' ').trim();
    pushLine({ kind: 'p', text, key: `p:${text}` });
  }

  return sections;
}

type SectionStatus = 'added' | 'removed' | 'changed' | 'unchanged';

interface SectionDiff {
  anchor: string;
  heading: string;
  status: SectionStatus;
  added: MdLine[];
  removed: MdLine[];
}

function diffSections(from: CanonicalDoc, to: CanonicalDoc): SectionDiff[] {
  const fromSecs = parseSections(from.markdown);
  const toSecs = parseSections(to.markdown);

  const fromByAnchor = new Map(fromSecs.map((s) => [s.anchor, s]));
  const toByAnchor = new Map(toSecs.map((s) => [s.anchor, s]));

  const orderedAnchors: string[] = [];
  const seen = new Set<string>();
  // Preserve `to`'s order first (latest reading order), then surface anchors
  // that only exist in `from` so removals stay visible.
  for (const s of toSecs) {
    if (!seen.has(s.anchor)) { seen.add(s.anchor); orderedAnchors.push(s.anchor); }
  }
  for (const s of fromSecs) {
    if (!seen.has(s.anchor)) { seen.add(s.anchor); orderedAnchors.push(s.anchor); }
  }

  const diffs: SectionDiff[] = [];
  for (const anchor of orderedAnchors) {
    const f = fromByAnchor.get(anchor);
    const t = toByAnchor.get(anchor);

    if (f && !t) {
      diffs.push({
        anchor,
        heading: f.heading,
        status: 'removed',
        added: [],
        removed: f.lines,
      });
      continue;
    }
    if (!f && t) {
      diffs.push({
        anchor,
        heading: t.heading,
        status: 'added',
        added: t.lines,
        removed: [],
      });
      continue;
    }
    if (f && t) {
      const added = t.lines.filter((l) => !f.byKey.has(l.key));
      const removed = f.lines.filter((l) => !t.byKey.has(l.key));
      diffs.push({
        anchor,
        heading: t.heading,
        status: added.length === 0 && removed.length === 0 ? 'unchanged' : 'changed',
        added,
        removed,
      });
    }
  }

  return diffs;
}

function LineRow({ line, sign }: { line: MdLine; sign: '+' | '-' }) {
  const color = sign === '+' ? ADD : DEL;
  const bg = sign === '+' ? 'rgba(127,183,127,0.06)' : 'rgba(217,122,122,0.06)';
  const prefix =
    line.kind === 'li' ? '• ' :
    line.kind === 'blockquote' ? '› ' :
    line.kind === 'code' ? '⌨ ' :
    '';
  const isBlock = line.kind === 'code';
  return (
    <div
      className="flex gap-2 px-2 py-1 text-xs"
      style={{ backgroundColor: bg, borderLeft: `2px solid ${color}`, marginBottom: 2 }}
    >
      <span className="font-mono select-none" style={{ color, width: 12 }}>{sign}</span>
      <div style={{ color: '#d4d4d4', whiteSpace: isBlock ? 'pre-wrap' : 'normal', wordBreak: 'break-word', flex: 1 }}>
        {prefix}{line.text}
      </div>
    </div>
  );
}

function statusPill(status: SectionStatus) {
  if (status === 'added') return <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'rgba(127,183,127,0.15)', color: ADD, border: `1px solid ${ADD}40` }}>ADDED</span>;
  if (status === 'removed') return <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'rgba(217,122,122,0.15)', color: DEL, border: `1px solid ${DEL}40` }}>REMOVED</span>;
  if (status === 'changed') return <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.15)', color: GOLD, border: `1px solid ${GOLD}40` }}>CHANGED</span>;
  return <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'rgba(245,245,245,0.04)', color: GREY, border: '1px solid rgba(245,245,245,0.1)' }}>UNCHANGED</span>;
}

export default function ThesisDiff() {
  const [, params] = useRoute(`${BASE}/thesis/diff/:from/:to`);

  const latest = CANONICAL_DOCS[CANONICAL_DOCS.length - 1];
  const previous = CANONICAL_DOCS[CANONICAL_DOCS.length - 2] ?? latest;

  const resolve = (v: string | undefined, fallback: CanonicalDoc): CanonicalDoc => {
    if (!v) return fallback;
    const norm = v.toLowerCase().replace(/-canonical$/, '');
    return CANONICAL_DOCS.find((d) => d.version === norm) ?? fallback;
  };

  const from = resolve(params?.from, previous);
  const to = resolve(params?.to, latest);

  const diffs = useMemo(() => diffSections(from, to), [from, to]);

  const counts = useMemo(() => {
    let added = 0, removed = 0, changed = 0, unchanged = 0;
    for (const d of diffs) {
      if (d.status === 'added') added++;
      else if (d.status === 'removed') removed++;
      else if (d.status === 'changed') changed++;
      else unchanged++;
    }
    return { added, removed, changed, unchanged };
  }, [diffs]);

  const hrefFor = (v: string) => `${BASE}/thesis/diff/${v}/${to.version}`;
  const hrefForTo = (v: string) => `${BASE}/thesis/diff/${from.version}/${v}`;

  // Wouter <Link> only re-renders when the path actually changes; since this
  // component reads :from / :to straight from the route, navigating between
  // diff URLs is the cleanest way to swap versions without local state drift.
  const visibleDiffs = diffs.filter((d) => d.status !== 'unchanged');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6" style={{ color: '#f5f5f5' }}>
        <PageHeader
          label="OUROBOROS THESIS · DIFF"
          title={`${from.slug} → ${to.slug}`}
          subtitle="Section-level diff between two canonical revisions. Every heading deep-links into the matching /thesis viewer."
          status="LIVE"
        />

        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-mono uppercase" style={{ color: GREY, letterSpacing: '0.08em' }}>From</span>
            <div className="flex flex-wrap gap-1.5">
              {CANONICAL_DOCS.map((d) => {
                const isActive = d.version === from.version;
                return (
                  <Link
                    key={`from-${d.version}`}
                    href={hrefFor(d.version)}
                    className="px-2 py-1 rounded font-mono text-xs hover:opacity-80"
                    style={{
                      backgroundColor: isActive ? 'rgba(217,122,122,0.18)' : 'rgba(245,245,245,0.04)',
                      color: isActive ? DEL : '#d4d4d4',
                      border: `1px solid ${isActive ? DEL : 'rgba(245,245,245,0.12)'}`,
                    }}
                  >
                    {d.slug}
                  </Link>
                );
              })}
            </div>
            <span className="text-[10px] font-mono uppercase ml-3" style={{ color: GREY, letterSpacing: '0.08em' }}>To</span>
            <div className="flex flex-wrap gap-1.5">
              {CANONICAL_DOCS.map((d) => {
                const isActive = d.version === to.version;
                return (
                  <Link
                    key={`to-${d.version}`}
                    href={hrefForTo(d.version)}
                    className="px-2 py-1 rounded font-mono text-xs hover:opacity-80"
                    style={{
                      backgroundColor: isActive ? 'rgba(127,183,127,0.18)' : 'rgba(245,245,245,0.04)',
                      color: isActive ? ADD : '#d4d4d4',
                      border: `1px solid ${isActive ? ADD : 'rgba(245,245,245,0.12)'}`,
                    }}
                  >
                    {d.slug}
                  </Link>
                );
              })}
            </div>
            <div className="ml-auto flex gap-3 text-xs font-mono" style={{ color: GREY }}>
              <Link href={`${BASE}/thesis/${from.version}`} className="hover:opacity-80" style={{ color: DEL }}>
                ← open {from.slug}
              </Link>
              <Link href={`${BASE}/thesis/${to.version}`} className="hover:opacity-80" style={{ color: ADD }}>
                open {to.slug} →
              </Link>
            </div>
          </div>
        </Card>

        {from.version === to.version && (
          <Card>
            <div className="text-xs" style={{ color: GOLD }}>
              From and to are the same revision ({from.slug}). Pick two different versions above to see a diff.
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <div className="text-[10px] font-mono uppercase" style={{ color: GREY, letterSpacing: '0.08em' }}>Added sections</div>
            <div className="text-2xl font-bold mt-1" style={{ color: ADD }}>{counts.added}</div>
          </Card>
          <Card>
            <div className="text-[10px] font-mono uppercase" style={{ color: GREY, letterSpacing: '0.08em' }}>Removed sections</div>
            <div className="text-2xl font-bold mt-1" style={{ color: DEL }}>{counts.removed}</div>
          </Card>
          <Card>
            <div className="text-[10px] font-mono uppercase" style={{ color: GREY, letterSpacing: '0.08em' }}>Changed sections</div>
            <div className="text-2xl font-bold mt-1" style={{ color: GOLD }}>{counts.changed}</div>
          </Card>
          <Card>
            <div className="text-[10px] font-mono uppercase" style={{ color: GREY, letterSpacing: '0.08em' }}>Unchanged</div>
            <div className="text-2xl font-bold mt-1" style={{ color: '#d4d4d4' }}>{counts.unchanged}</div>
          </Card>
        </div>

        <SectionTitle>Section diff</SectionTitle>
        <p className="text-xs" style={{ color: GREY }}>
          Sections are matched by their stable anchor (h2 slug). Each heading is a deep-link into the
          standard <code className="font-mono">/thesis/:version</code> viewer at the correct anchor.
        </p>

        {visibleDiffs.length === 0 && (
          <Card>
            <div className="text-xs" style={{ color: GREY }}>
              No section-level differences detected between {from.slug} and {to.slug}.
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {visibleDiffs.map((d) => (
            <Card key={`${d.status}-${d.anchor}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {statusPill(d.status)}
                  <h3 className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>{d.heading}</h3>
                </div>
                <div className="flex gap-2 text-[11px] font-mono shrink-0">
                  {d.anchor !== '__preamble__' && d.status !== 'added' && (
                    <Link
                      href={`${BASE}/thesis/${from.version}#${d.anchor}`}
                      className="px-2 py-0.5 rounded hover:opacity-80"
                      style={{ color: DEL, border: `1px solid ${DEL}40`, backgroundColor: 'rgba(217,122,122,0.08)' }}
                    >
                      {from.version} ↗
                    </Link>
                  )}
                  {d.anchor !== '__preamble__' && d.status !== 'removed' && (
                    <Link
                      href={`${BASE}/thesis/${to.version}#${d.anchor}`}
                      className="px-2 py-0.5 rounded hover:opacity-80"
                      style={{ color: ADD, border: `1px solid ${ADD}40`, backgroundColor: 'rgba(127,183,127,0.08)' }}
                    >
                      {to.version} ↗
                    </Link>
                  )}
                  {d.anchor === '__preamble__' && (
                    <span style={{ color: GREY }}>title / intro (no anchor)</span>
                  )}
                </div>
              </div>
              <div className="text-[10px] font-mono mb-2" style={{ color: GREY }}>
                anchor: <span style={{ color: '#d4d4d4' }}>#{d.anchor}</span>
                {' · '}+{d.added.length} / −{d.removed.length}
              </div>
              <div>
                {d.removed.map((l, i) => <LineRow key={`r-${i}`} line={l} sign="-" />)}
                {d.added.map((l, i) => <LineRow key={`a-${i}`} line={l} sign="+" />)}
              </div>
            </Card>
          ))}
        </div>

        <div className="text-[10px] font-mono mt-4" style={{ color: GREY }}>
          Source: <code>docs/thesis/{from.slug}.md</code> → <code>docs/thesis/{to.slug}.md</code>
        </div>
      </div>
    </Layout>
  );
}
