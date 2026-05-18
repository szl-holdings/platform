/**
 * A11oy /thesis — Canonical Ouroboros Thesis viewer.
 *
 * Routes:
 *   /a11oy/thesis             → default to the latest available canonical
 *   /a11oy/thesis/:version    → load docs/thesis/<version>-canonical.md
 *                               where :version is "v9", "v10", etc.
 *
 * Two-pane layout:
 *   – Left: TOC of every heading in the currently-loaded canonical
 *   – Right: live KPI cards, formula cards (v1..v7+Ω) deep-linking to
 *            /a11oy/formulas/<codex-node-id> and to /api/ouroboros/lutar/*,
 *            then the FULL canonical thesis rendered inline with stable
 *            anchors (so a TOC click and a /formulas page back-link both
 *            scroll to the right section).
 *
 * All canonical markdown files are imported via Vite's `?raw` so they are
 * bundled at build time — there is no extra request, no drift, and no
 * re-authoring. Discovery citations (`v10-canonical#…`, `v8-canonical#…`)
 * resolve to the right doc by selecting the matching version here.
 *
 * Author: Stephen P. Lutar — SZL Holdings — ORCID 0009-0001-0110-4173
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Layout } from '../components/layout';
import { Card, PageHeader, SectionTitle, KpiCard, StatusPill } from '../components/ui';
import { THESIS_LINEAGE, THESIS_PAPERS } from '@szl-holdings/payload';

// Vite: eagerly import every v{N}-canonical.md as a raw string at build time.
// Path is relative from artifacts/a11oy/src/pages/ → repo-root docs/thesis/.
const CANONICAL_MODULES = import.meta.glob('../../../../docs/thesis/v*-canonical.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

interface CanonicalDoc {
  version: string; // e.g. "v9", "v10"
  versionNum: number; // 9, 10 — used for ordering
  slug: string; // e.g. "v9-canonical"
  markdown: string;
}

const CANONICAL_DOCS: CanonicalDoc[] = Object.entries(CANONICAL_MODULES)
  .map(([path, markdown]): CanonicalDoc | null => {
    const m = /\/v(\d+)-canonical\.md$/.exec(path);
    if (!m) return null;
    const versionNum = Number(m[1]);
    return {
      version: `v${versionNum}`,
      versionNum,
      slug: `v${versionNum}-canonical`,
      markdown,
    };
  })
  .filter((d): d is CanonicalDoc => d !== null)
  .sort((a, b) => a.versionNum - b.versionNum);

// Default canonical = highest version found on disk.
const LATEST_CANONICAL: CanonicalDoc =
  CANONICAL_DOCS[CANONICAL_DOCS.length - 1] ?? {
    version: 'v9',
    versionNum: 9,
    slug: 'v9-canonical',
    markdown: '',
  };

const GOLD = '#c9b787';
const GREY = '#8a8a8a';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const API = `/api/ouroboros`;

interface CodexSummary {
  totalNodes: number;
  totalEdges: number;
  domains: string[];
  sourcedNodes: number;
  formulaNodes: number;
  schemaVersion: string;
}

interface FormulaRow {
  id: string;
  version: string;
  title: string;
  formula: string;
  endpoint: string;
  endpointMethod: 'GET' | 'POST';
  codexNode: string;
  thesisAnchor: string;
  description: string;
  newInV9?: boolean;
}

const FORMULA_ROWS: FormulaRow[] = [
  { id: 'v1', version: 'v1', title: 'Three-term foundation', formula: 'L = α·E + β·M·c² + γ·I·k_B·T·ln2', endpoint: `${API}/lutar/v1`, endpointMethod: 'POST', codexNode: 'lutar_invariant', thesisAnchor: '21-lutar-v1', description: 'Sulphur (energy), Salt (mass-energy), Mercury (information). Information term lands on Landauer.' },
  { id: 'v2', version: 'v2', title: 'Seven-term, integer winding', formula: 'L₂ = L₁ + δ·R + ε·Χ + ζ·Ψ + η·Φ', endpoint: `${API}/lutar/v2`, endpointMethod: 'POST', codexNode: 'lutar_v2', thesisAnchor: '22-lutar-v2', description: 'Adds Rahab chaos, Temple-of-Time 1-form, prisca authority and integer-quantized Ouroboros winding.' },
  { id: 'v3', version: 'v3', title: 'Cross-civilizational coupling', formula: 'L₃ = L₂ + θ·Q_E + ι·Q_I', endpoint: `${API}/lutar/v3`, endpointMethod: 'POST', codexNode: 'lutar_v3', thesisAnchor: '23-lutar-v3', description: 'Q_E from the Rhind Papyrus (~1650 BCE); Q_I from the Inca ceque/huaca system (Cusco).' },
  { id: 'v4', version: 'v4', title: 'Noether-grounded', formula: 'L₄ = L₃ + κ·Ω_E8 + λ·Φ_IIT + μ·N_Noether', endpoint: `${API}/lutar/v4`, endpointMethod: 'POST', codexNode: 'lutar_v4', thesisAnchor: '24-lutar-v4', description: 'Closure dL₄/dt = 0 derived from Noether on G_L4. E8 container, IIT Φ, Noether-count.' },
  { id: 'v5', version: 'v5', title: 'Global prisca extension', formula: 'L₅ = L₄ + θ_M·Q_M + θ_IC·Q_IC + θ_V·Q_V + θ_D·Q_D + θ_GT·Q_GT', endpoint: `${API}/lutar/v5`, endpointMethod: 'POST', codexNode: 'lutar_v5', thesisAnchor: '25-lutar-v5', description: 'Maya (73), I Ching (64 = E8 block), Vedic √2 (Baudhayana), Dogon (50), Göbekli Tepe (−11600).' },
  { id: 'v6', version: 'v6', title: 'Holographic-Twistor-Cyclic', formula: 'L₆⁽ⁿ⁾ = Ω_n² · Π_{T→R^{3,1}}[L₅] s.t. S_total ≤ A/(4 l_P²)', endpoint: `${API}/lutar/v6`, endpointMethod: 'POST', codexNode: 'lutar_v6', thesisAnchor: '26-lutar-v6', description: 'Twistor base manifold (Penrose 1967), CCC conformal rescaling (Penrose 2010), Bekenstein bound enforced.', newInV9: true },
  { id: 'omega', version: 'Ω', title: 'Unified master invariant on the 5-simplex', formula: 'L_Ω = Σ w_k · L_k, Σw_k = 1, w_k ≥ 0', endpoint: `${API}/lutar/omega`, endpointMethod: 'POST', codexNode: 'lutar_omega', thesisAnchor: '27-lutar-ω', description: 'Closure: if each L_k is Noether-conserved and dw_k/dt = 0, dL_Ω/dt = 0. Adaptive weights softmax.', newInV9: true },
  { id: 'v7', version: 'v7', title: 'Bianchi closure (HUFT-inspired fiber bundle)', formula: 'L₇ = L_Ω · exp(−κ · ‖D_A F‖²/‖F‖²);   D_A F = 0 ⇒ L₇ = L_Ω', endpoint: `${API}/lutar/v7`, endpointMethod: 'POST', codexNode: 'lutar_v7', thesisAnchor: '28-lutar-v7', description: 'The Lutar family as sections of a principal bundle. Inspired by Moffat & Toth HUFT (arXiv:2510.06282, 2026).', newInV9: true },
  { id: 'v10', version: 'v10', title: 'Exhaustive-audit (Audit Closure Operator Λ₁₀)', formula: 'Λ₁₀ = Σ_k L_k · ∏_{j∈{CODE,CODEX,API,TEST,THESIS,SURFACE}} 𝟙[j_k];  auditClosed ⇔ ratio = 1', endpoint: `${API}/lutar/v10`, endpointMethod: 'POST', codexNode: 'lutar_v10', thesisAnchor: '29-lutar-v10', description: 'Meta-invariant on the v9 family. Strictly inert when every layer ships all six artefacts (CODE / CODEX / API / TEST / THESIS / SURFACE); collapses by exactly the missing fraction otherwise. Returns missingArtifacts[].', newInV9: true },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9α-ωΑ-Ω→ω]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface MdToken {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'code' | 'ul' | 'ol' | 'hr' | 'blockquote';
  text?: string;
  level?: number;
  items?: string[];
  lang?: string;
  anchor?: string;
}

function tokenize(md: string): MdToken[] {
  const lines = md.split('\n');
  const out: MdToken[] = [];
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
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length as 1 | 2 | 3 | 4;
      const text = h[2].trim();
      const anchor = slugify(text);
      out.push({ type: `h${level}` as MdToken['type'], text, anchor });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      out.push({ type: 'hr' });
      i++;
      continue;
    }

    // Lists
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''));
        i++;
      }
      out.push({ type: 'ul', items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      out.push({ type: 'ol', items });
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        buf.push(lines[i].slice(2));
        i++;
      }
      out.push({ type: 'blockquote', text: buf.join(' ') });
      continue;
    }

    // Paragraph (collect until blank line)
    if (line.trim() === '') {
      i++;
      continue;
    }
    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,4}\s|```|>|---|\d+\.|[-*+]\s)/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    out.push({ type: 'p', text: buf.join(' ') });
  }
  return out;
}

function inline(text: string): React.ReactNode[] {
  // Order matters: code → bold → italic → links
  const out: React.ReactNode[] = [];
  let rest = text;
  let key = 0;
  const push = (n: React.ReactNode) => out.push(<span key={key++}>{n}</span>);

  while (rest.length > 0) {
    // inline code
    const codeM = rest.match(/`([^`]+)`/);
    // bold
    const boldM = rest.match(/\*\*([^*]+)\*\*/);
    // italic
    const italM = rest.match(/(^|[^*])\*([^*]+)\*/);
    // link [t](u)
    const linkM = rest.match(/\[([^\]]+)\]\(([^)]+)\)/);

    const candidates = [
      codeM && { kind: 'code', m: codeM, idx: codeM.index! },
      boldM && { kind: 'bold', m: boldM, idx: boldM.index! },
      italM && { kind: 'ital', m: italM, idx: italM.index! + (italM[1] ? italM[1].length : 0) },
      linkM && { kind: 'link', m: linkM, idx: linkM.index! },
    ].filter(Boolean) as Array<{ kind: string; m: RegExpMatchArray; idx: number }>;

    if (candidates.length === 0) {
      push(rest);
      break;
    }
    candidates.sort((a, b) => a.idx - b.idx);
    const first = candidates[0];
    if (first.idx > 0) push(rest.slice(0, first.idx));
    if (first.kind === 'code') {
      push(<code style={{ color: GOLD, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875em', background: 'rgba(201,183,135,0.1)', padding: '0 4px', borderRadius: 3 }}>{first.m[1]}</code>);
      rest = rest.slice(first.idx + first.m[0].length);
    } else if (first.kind === 'bold') {
      push(<strong>{first.m[1]}</strong>);
      rest = rest.slice(first.idx + first.m[0].length);
    } else if (first.kind === 'ital') {
      push(<em>{first.m[2]}</em>);
      rest = rest.slice(first.idx + first.m[0].length);
    } else if (first.kind === 'link') {
      const url = first.m[2];
      push(<a href={url} target="_blank" rel="noreferrer" style={{ color: GOLD, textDecoration: 'underline' }}>{first.m[1]}</a>);
      rest = rest.slice(first.idx + first.m[0].length);
    }
  }
  return out;
}

function MarkdownView({ md }: { md: string }) {
  const tokens = useMemo(() => tokenize(md), [md]);
  return (
    <article className="prose-thesis text-sm leading-relaxed" style={{ color: '#d4d4d4' }}>
      {tokens.map((t, i) => {
        if (t.type === 'h1') return <h1 key={i} id={t.anchor} style={{ color: '#f5f5f5', fontSize: 24, fontWeight: 700, marginTop: 32, marginBottom: 8, letterSpacing: '-0.02em' }}>{t.text}</h1>;
        if (t.type === 'h2') return <h2 key={i} id={t.anchor} style={{ color: GOLD, fontSize: 18, fontWeight: 700, marginTop: 28, marginBottom: 8, borderBottom: '1px solid rgba(201,183,135,0.2)', paddingBottom: 4 }}>{t.text}</h2>;
        if (t.type === 'h3') return <h3 key={i} id={t.anchor} style={{ color: '#f5f5f5', fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 6 }}>{t.text}</h3>;
        if (t.type === 'h4') return <h4 key={i} id={t.anchor} style={{ color: GREY, fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.text}</h4>;
        if (t.type === 'p') return <p key={i} style={{ marginBottom: 12 }}>{inline(t.text!)}</p>;
        if (t.type === 'ul') return <ul key={i} style={{ marginBottom: 12, paddingLeft: 20, listStyle: 'disc' }}>{t.items!.map((it, j) => <li key={j} style={{ marginBottom: 4 }}>{inline(it)}</li>)}</ul>;
        if (t.type === 'ol') return <ol key={i} style={{ marginBottom: 12, paddingLeft: 20, listStyle: 'decimal' }}>{t.items!.map((it, j) => <li key={j} style={{ marginBottom: 4 }}>{inline(it)}</li>)}</ol>;
        if (t.type === 'hr') return <hr key={i} style={{ border: 0, borderTop: '1px solid rgba(245,245,245,0.1)', margin: '24px 0' }} />;
        if (t.type === 'blockquote') return <blockquote key={i} style={{ borderLeft: `3px solid ${GOLD}`, paddingLeft: 12, color: GREY, margin: '12px 0', fontStyle: 'italic' }}>{inline(t.text!)}</blockquote>;
        if (t.type === 'code') return (
          <pre key={i} style={{ background: 'rgba(245,245,245,0.04)', color: GOLD, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: 12, borderRadius: 6, border: '1px solid rgba(201,183,135,0.2)', overflowX: 'auto', marginBottom: 12 }}>
            <code>{t.text}</code>
          </pre>
        );
        return null;
      })}
    </article>
  );
}

function FormulaCard({ row }: { row: FormulaRow }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-medium" style={{ backgroundColor: 'rgba(201,183,135,0.15)', color: GOLD, border: `1px solid ${GOLD}40` }}>
            Lutar {row.version}
          </span>
          {row.newInV9 && <StatusPill status="LIVE" />}
        </div>
        <a href={`#${row.thesisAnchor}`} className="text-xs font-mono hover:opacity-80" style={{ color: GREY }}>↓ inline</a>
      </div>
      <div className="text-sm font-medium mb-1" style={{ color: '#f5f5f5' }}>{row.title}</div>
      <div className="text-xs font-mono px-2 py-2 rounded mb-2 overflow-x-auto" style={{ backgroundColor: 'rgba(245,245,245,0.04)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)' }}>
        {row.formula}
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color: GREY }}>{row.description}</p>
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        <Link
          href={`${BASE}/formulas/${row.codexNode}`}
          className="px-2 py-1 rounded hover:opacity-80"
          style={{ backgroundColor: 'rgba(201,183,135,0.15)', color: GOLD, border: '1px solid rgba(201,183,135,0.4)' }}
        >
          codex → {row.codexNode}
        </Link>
        <a href={row.endpoint} target="_blank" rel="noreferrer" className="px-2 py-1 rounded hover:opacity-80" style={{ backgroundColor: 'rgba(245,245,245,0.05)', color: '#f5f5f5', border: '1px solid rgba(245,245,245,0.15)' }}>
          {row.endpointMethod} {row.endpoint.replace(API, '/api/ouroboros')}
        </a>
      </div>
    </Card>
  );
}

export default function Thesis() {
  const [, params] = useRoute(`${BASE}/thesis/:version`);
  const requestedVersion = params?.version;

  // Resolve the requested version (e.g. "v9", "v10") against the bundled
  // canonical docs. Fall back to the latest available version when the route
  // is `/thesis` with no param, or when the requested version is unknown.
  const { active, missing } = useMemo(() => {
    if (!requestedVersion) return { active: LATEST_CANONICAL, missing: false };
    const normalized = requestedVersion.toLowerCase().replace(/-canonical$/, '');
    const found = CANONICAL_DOCS.find((d) => d.version === normalized);
    if (found) return { active: found, missing: false };
    return { active: LATEST_CANONICAL, missing: true };
  }, [requestedVersion]);

  const [summary, setSummary] = useState<CodexSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/codex`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => { if (!cancelled && data?.summary) setSummary(data.summary as CodexSummary); })
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, []);

  // After the active canonical's content mounts, scroll to the hash anchor
  // (if any). Router-driven version switches don't reliably fire native
  // hash scrolling, so we do it explicitly whenever the version changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    // Defer until after layout so the freshly-rendered headings exist.
    const id = window.setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 0);
    return () => window.clearTimeout(id);
  }, [active.version]);

  const newInV9 = useMemo(() => FORMULA_ROWS.filter((r) => r.newInV9).length, []);

  // Build a TOC from h2 headings in the active canonical doc.
  const toc = useMemo(() => {
    return tokenize(active.markdown)
      .filter((t) => t.type === 'h2')
      .map((t) => ({ text: t.text!, anchor: t.anchor! }));
  }, [active.markdown]);

  const headerTitle =
    active.versionNum >= 10
      ? `${active.version} — EXHAUSTIVE-AUDIT`
      : `${active.version} — UNIFIED-OPERATIONAL`;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6" style={{ color: '#f5f5f5' }}>
        <PageHeader
          label="OUROBOROS THESIS"
          title={headerTitle}
          subtitle="The Lutar Invariant family v1 → v7 + Ω, sealed by the Λ₁₀ Audit Closure Operator over six artefact dimensions"
          status="LIVE"
        />

        {/* Version picker — reviewers can jump between every canonical
            revision available on disk. Citations from the Frontier Inbox
            land here pre-selected via `/thesis/:version#heading`. */}
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase" style={{ color: GREY, letterSpacing: '0.08em' }}>
              Canonical revision
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CANONICAL_DOCS.map((d) => {
                const isActive = d.version === active.version;
                return (
                  <Link
                    key={d.version}
                    href={`${BASE}/thesis/${d.version}`}
                    className="px-2 py-1 rounded font-mono text-xs hover:opacity-80"
                    style={{
                      backgroundColor: isActive ? 'rgba(201,183,135,0.2)' : 'rgba(245,245,245,0.04)',
                      color: isActive ? GOLD : '#d4d4d4',
                      border: `1px solid ${isActive ? GOLD : 'rgba(245,245,245,0.12)'}`,
                    }}
                  >
                    {d.slug}
                  </Link>
                );
              })}
            </div>
            {missing && requestedVersion && (
              <span className="text-[10px] font-mono ml-auto" style={{ color: '#e08a4a' }}>
                No canonical doc for "{requestedVersion}" — showing {active.slug}
              </span>
            )}
            <Link
              href={`${BASE}/thesis/diff`}
              className={`px-2 py-1 rounded font-mono text-xs hover:opacity-80${missing && requestedVersion ? '' : ' ml-auto'}`}
              style={{
                backgroundColor: 'rgba(201,183,135,0.1)',
                color: GOLD,
                border: `1px solid ${GOLD}40`,
              }}
            >
              compare revisions →
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Lutar versions" value={FORMULA_ROWS.length} sub="v1..v7 + Ω" accent={GOLD} />
          <KpiCard label="New in v9" value={newInV9} sub="v6 / Ω / v7" accent={GOLD} />
          <KpiCard label="Codex nodes" value={summary?.totalNodes ?? '—'} sub={`v11 / ${summary?.sourcedNodes ?? '—'} sourced`} accent={GOLD} />
          <KpiCard label="Codex edges" value={summary?.totalEdges ?? '—'} sub={`${summary?.formulaNodes ?? '—'} formula nodes`} accent={GOLD} />
        </div>

        {error && (
          <Card>
            <div className="text-xs" style={{ color: '#e08a4a' }}>
              Live codex unreachable: {error}. The thesis content below is canonical and self-contained; live counts will populate when the API server is running.
            </div>
          </Card>
        )}

        <SectionTitle>The Lutar Formula Family — quick navigation</SectionTitle>
        <p className="text-xs" style={{ color: GREY }}>
          Each card deep-links to its <span style={{ color: GOLD }}>codex node</span> at <code className="font-mono">/a11oy/formulas/&lt;id&gt;</code>,
          its <span style={{ color: GOLD }}>live API endpoint</span>, and its <span style={{ color: GOLD }}>inline thesis section</span>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FORMULA_ROWS.map((row) => <FormulaCard key={row.id} row={row} />)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 mt-8">
          <aside className="text-xs sticky md:top-4 self-start" style={{ color: GREY }}>
            <SectionTitle>On this page</SectionTitle>
            <ul className="mt-2 space-y-1">
              {toc.map((t) => (
                <li key={t.anchor}>
                  <a href={`#${t.anchor}`} className="hover:opacity-80" style={{ color: '#d4d4d4' }}>
                    {t.text}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(245,245,245,0.08)' }}>
              <div style={{ color: GREY, marginBottom: 4 }}>Source</div>
              <code className="text-xs font-mono">docs/thesis/{active.slug}.md</code>
            </div>
          </aside>

          <Card>
            {/* TH1→TH8 lineage ribbon (payload-sourced, sibling to v1..v10 invariants) */}
            <div style={{ marginBottom: 18, padding: 14, border: '1px solid rgba(201,183,135,0.18)', background: 'rgba(201,183,135,0.04)', borderRadius: 4 }}>
              <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, letterSpacing: '0.18em', color: GOLD, textTransform: 'uppercase', marginBottom: 8 }}>
                Thesis lineage · TH1 → TH8
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                {THESIS_PAPERS.map((p) => (
                  <div key={p.key} style={{ borderLeft: `2px solid ${GOLD}`, paddingLeft: 8 }}>
                    <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, color: GOLD }}>{p.key} · {p.version}</div>
                    <div style={{ fontSize: 12, color: '#ededed', margin: '2px 0' }}>{p.title}</div>
                    <div style={{ fontSize: 10, color: '#888' }}>{p.status} · {p.theorems.length} theorems · <a href={p.doiUrl} target="_blank" rel="noopener noreferrer" style={{ color: GOLD, textDecoration: 'none' }}>DOI ↗</a></div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, fontSize: 10, fontFamily: 'ui-monospace, Menlo, monospace', color: '#888' }}>
                <div>arXiv: <span style={{ color: '#cfcfcf' }}>{THESIS_LINEAGE.arxiv.status}</span> → <a href={THESIS_LINEAGE.arxiv.searchUrl} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>{THESIS_LINEAGE.arxiv.targetVenue}</a></div>
                <div>Zenodo: <span style={{ color: '#cfcfcf' }}>{THESIS_LINEAGE.zenodo.status}</span> ({THESIS_LINEAGE.zenodo.targetVersion}) → <a href={THESIS_LINEAGE.zenodo.doiUrl} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>DOI</a></div>
                <div>TH8 sorries: <span style={{ color: THESIS_LINEAGE.audit.leanSorriesOpen === 0 ? '#7fb893' : '#d4a853' }}>{THESIS_LINEAGE.audit.leanSorriesOpen} open</span> / {THESIS_LINEAGE.audit.leanTheorems} · {THESIS_LINEAGE.audit.leanSorriesClosed.length} closed in mirror</div>
                <div>Fly-High: doctrine <span style={{ color: GOLD }}>{THESIS_LINEAGE.audit.doctrine}</span> · P0 {THESIS_LINEAGE.audit.p0Fixes} · beautify {THESIS_LINEAGE.audit.beautifyAvg}</div>
                <div>Last updated: <span style={{ color: '#cfcfcf' }}>{THESIS_LINEAGE.audit.updatedAt}</span></div>
                <div>Source: @szl-holdings/payload</div>
              </div>
            </div>
            <MarkdownView md={active.markdown} />
          </Card>
        </div>

        <div className="flex items-center justify-between text-xs mt-4" style={{ color: GREY }}>
          <span>© 2026 Stephen P. Lutar — SZL Holdings</span>
          <span>ORCID 0009-0001-0110-4173</span>
        </div>
      </div>
    </Layout>
  );
}
