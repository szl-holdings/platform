import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { registry } from '@szl-holdings/brand-registry';
import { T, useAlloyTheme } from './alloy-theme';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (path: string) => `${BASE}${path}`;

const NAV_ITEMS = [
  { label: 'Models', href: b('/hub/foundry') },
  { label: 'Datasets', href: b('/hub/foundry') },
  { label: 'Spaces', href: b('/hub/foundry') },
  { label: 'Docs', href: b('/') },
  { label: 'Enterprise', href: b('/hub/pricing') },
  { label: 'Pricing', href: b('/hub/pricing') },
];

interface SearchResult {
  label: string;
  sublabel: string;
  href: string;
  category: 'fleet' | 'page' | 'section' | 'model' | 'dataset' | 'space' | 'governance';
}

function buildStaticIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  for (const p of registry.products) {
    results.push({
      label: p.name,
      sublabel: p.tagline,
      href: p.link ?? b('/hub/fleet'),
      category: 'fleet',
    });
  }

  results.push(
    { label: 'Fleet', sublabel: 'Browse all SZL ecosystem surfaces', href: b('/hub/fleet'), category: 'page' },
    { label: 'Foundry', sublabel: 'Models, datasets, spaces, inference', href: b('/hub/foundry'), category: 'page' },
    { label: 'Models', sublabel: 'Browse the governed model registry', href: b('/hub/foundry'), category: 'section' },
    { label: 'Datasets', sublabel: 'Browse governed datasets', href: b('/hub/foundry'), category: 'section' },
    { label: 'Spaces', sublabel: 'Browse deployed spaces', href: b('/hub/foundry'), category: 'section' },
    { label: 'Inference Playground', sublabel: 'Run governed inference', href: b('/hub/foundry'), category: 'section' },
    { label: 'Governance', sublabel: 'Evidence stream & audit log', href: b('/hub/governance'), category: 'page' },
    { label: 'Evidence Stream', sublabel: 'Proof Chain live events', href: b('/hub/governance'), category: 'section' },
    { label: 'Covenant Policies', sublabel: 'Policy Engine covenants & decisions', href: b('/hub/governance'), category: 'section' },
    { label: 'Audit Events', sublabel: 'Cross-domain audit trail', href: b('/hub/governance'), category: 'section' },
    { label: 'Pricing', sublabel: 'Operator, Team, Enterprise plans', href: b('/hub/pricing'), category: 'page' },
  );

  return results;
}

interface HFModelResult { id: string; modelId?: string; pipeline_tag?: string }
interface HFDatasetResult { id: string }
interface HFSpaceResult { id: string; sdk?: string }

async function searchLiveAssets(query: string, signal: AbortSignal): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const q = encodeURIComponent(query);

  const hfApi = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/a11oy\/$/, '/api/hf/hub');

  const [modelsRes, datasetsRes, spacesRes] = await Promise.allSettled([
    fetch(`${hfApi}/models?search=${q}&limit=5`, { signal })
      .then((r) => r.ok ? r.json() as Promise<{ models: HFModelResult[] }> : null),
    fetch(`${hfApi}/datasets?search=${q}&limit=5`, { signal })
      .then((r) => r.ok ? r.json() as Promise<{ datasets: HFDatasetResult[] }> : null),
    fetch(`${hfApi}/spaces?search=${q}&limit=3`, { signal })
      .then((r) => r.ok ? r.json() as Promise<{ spaces: HFSpaceResult[] }> : null),
  ]);

  if (modelsRes.status === 'fulfilled' && modelsRes.value?.models) {
    for (const m of modelsRes.value.models) {
      const hfId = m.modelId ?? m.id;
      results.push({
        label: hfId,
        sublabel: m.pipeline_tag ?? 'Model',
        href: b('/hub/foundry'),
        category: 'model',
      });
    }
  }

  if (datasetsRes.status === 'fulfilled' && datasetsRes.value?.datasets) {
    for (const d of datasetsRes.value.datasets) {
      results.push({
        label: d.id,
        sublabel: 'Dataset',
        href: b('/hub/foundry'),
        category: 'dataset',
      });
    }
  }

  if (spacesRes.status === 'fulfilled' && spacesRes.value?.spaces) {
    for (const s of spacesRes.value.spaces) {
      results.push({
        label: s.id,
        sublabel: s.sdk ?? 'Space',
        href: b('/hub/foundry'),
        category: 'space',
      });
    }
  }

  return results;
}

const CATEGORY_LABELS: Record<string, string> = {
  fleet: 'Fleet',
  page: 'Pages',
  section: 'Sections',
  model: 'Models',
  dataset: 'Datasets',
  space: 'Spaces',
  governance: 'Governance',
};

export function AlloyTopBar({ backLabel, backHref }: { backLabel?: string; backHref?: string } = {}) {
  const { mode, toggle } = useAlloyTheme();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [liveResults, setLiveResults] = useState<SearchResult[]>([]);
  const [liveSearching, setLiveSearching] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const liveControllerRef = useRef<AbortController | null>(null);

  const staticIndex = useMemo(buildStaticIndex, []);

  const staticResults = useMemo(() => {
    if (!searchVal.trim()) return [];
    const q = searchVal.toLowerCase();
    return staticIndex
      .filter((r) => r.label.toLowerCase().includes(q) || r.sublabel.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchVal, staticIndex]);

  const allResults = useMemo(() => {
    const seenLabels = new Set(staticResults.map((r) => r.label));
    const uniqueLive = liveResults.filter((r) => !seenLabels.has(r.label));
    return [...staticResults, ...uniqueLive].slice(0, 15);
  }, [staticResults, liveResults]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of allResults) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [allResults]);

  const searchLive = useCallback((query: string) => {
    if (liveControllerRef.current) liveControllerRef.current.abort();
    if (!query.trim() || query.length < 2) { setLiveResults([]); return; }
    const controller = new AbortController();
    liveControllerRef.current = controller;
    setLiveSearching(true);
    searchLiveAssets(query, controller.signal)
      .then(setLiveResults)
      .catch(() => {})
      .finally(() => setLiveSearching(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchLive(searchVal), 350);
    return () => clearTimeout(timer);
  }, [searchVal, searchLive]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchVal('');
        setLiveResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  const selectResult = (r: SearchResult) => {
    setSearchOpen(false);
    setSearchVal('');
    setLiveResults([]);
    navigate(r.href);
  };

  const headerBgScrolled = mode === 'dark' ? 'rgba(7,8,10,0.92)' : 'rgba(248,247,243,0.92)';

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        padding: '0 clamp(1rem, 3vw, 2.5rem)',
        height: 56,
        background: scrolled ? headerBgScrolled : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${T.border}` : '1px solid transparent',
        transition: 'background 0.3s, border-color 0.3s',
        gap: '1.5rem',
      }}
    >
      {backLabel ? (
        <Link
          href={backHref ?? b('/hub')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            textDecoration: 'none', flexShrink: 0,
            fontSize: '0.8125rem', color: T.textDim,
          }}
        >
          ← {backLabel}
        </Link>
      ) : (
        <Link
          href={b('/hub')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            textDecoration: 'none', flexShrink: 0,
          }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, border: `1px solid ${T.accent}`,
            borderRadius: 5, fontSize: 10, fontFamily: T.mono,
            color: T.accent, fontWeight: 700,
          }}>a</span>
          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
            Alloy
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.125rem 0.4rem',
            background: T.accentDim, border: `1px solid ${T.accent}40`,
            borderRadius: 4, fontSize: '0.5rem', fontFamily: T.mono,
            fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: T.accent,
          }}>Enterprise</span>
        </Link>
      )}

      <nav
        style={{
          display: 'flex', alignItems: 'center',
          gap: '0.125rem', flex: 1,
        }}
      >
        {NAV_ITEMS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            style={{
              padding: '0.375rem 0.625rem',
              fontSize: '0.8125rem',
              color: T.textDim,
              textDecoration: 'none',
              borderRadius: 5,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = T.text;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = T.textDim;
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, position: 'relative' }}>
        {searchOpen ? (
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              autoFocus
              type="search"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setSearchOpen(false); setSearchVal(''); setLiveResults([]); }
                if (e.key === 'Enter' && allResults.length > 0) selectResult(allResults[0]);
              }}
              placeholder="Search fleet, models, datasets, pages…"
              style={{
                width: 320, padding: '0.375rem 0.75rem',
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 6, color: T.text, fontSize: '0.8125rem',
                fontFamily: T.sans, outline: 'none',
              }}
            />
            {searchVal.trim() && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  marginTop: 4,
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 8, overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  maxHeight: 420, overflowY: 'auto',
                  zIndex: 200,
                }}
              >
                {allResults.length === 0 && !liveSearching ? (
                  <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: T.textMuted }}>
                    No results for "{searchVal}"
                  </div>
                ) : (
                  <>
                    {Array.from(grouped.entries()).map(([category, items]) => (
                      <div key={category}>
                        <div style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
                          color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase',
                          background: 'rgba(255,255,255,0.02)',
                        }}>
                          {CATEGORY_LABELS[category] ?? category}
                        </div>
                        {items.map((r) => (
                          <button
                            key={`${r.category}-${r.label}`}
                            type="button"
                            onClick={() => selectResult(r)}
                            style={{
                              display: 'block', width: '100%', textAlign: 'left',
                              padding: '0.5rem 0.75rem',
                              background: 'transparent', border: 'none',
                              cursor: 'pointer', color: T.text,
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                          >
                            <div style={{ fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                            <div style={{ fontSize: '0.6875rem', color: T.textMuted, marginTop: '0.125rem' }}>{r.sublabel}</div>
                          </button>
                        ))}
                      </div>
                    ))}
                    {liveSearching && (
                      <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.6875rem', color: T.textMuted, fontFamily: T.mono }}>
                        Searching HF Hub…
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            aria-label="Open search"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.375rem 0.625rem',
              background: 'transparent', border: `1px solid ${T.border}`,
              borderRadius: 6, cursor: 'pointer',
              fontSize: '0.75rem', color: T.textDim,
              fontFamily: T.sans,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7.9 7.9L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Search
            <kbd style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 16, height: 16, borderRadius: 3,
              background: T.surface, border: `1px solid ${T.border}`,
              fontSize: '0.5625rem', color: T.textMuted, fontFamily: T.mono,
            }}>K</kbd>
          </button>
        )}

        <button
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            width: 32, height: 32, borderRadius: 7,
            background: T.surface, border: `1px solid ${T.border}`,
            cursor: 'pointer', color: T.textDim,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}
        >
          {mode === 'dark' ? '☀' : '🌙'}
        </button>

        <Link
          href={b('/investor-demo')}
          style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.375rem 0.875rem',
            background: T.text, color: T.bg,
            borderRadius: 6, fontSize: '0.8125rem', fontWeight: 600,
            textDecoration: 'none', letterSpacing: '-0.01em',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
