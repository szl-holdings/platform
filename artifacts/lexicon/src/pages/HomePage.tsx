import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Search, Copy, Check, Filter, X, ChevronRight, Scale, GitCompare, Grid3X3 } from 'lucide-react';
import {
  LICENSES,
  searchLicenses,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  TOTAL_LICENSES,
  HF_LICENSES,
  BEYOND_HF_LICENSES,
  type LicenseCategory,
} from '@/data/licenses';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/lexicon';

const ALL_CATEGORIES: LicenseCategory[] = [
  'permissive',
  'weak-copyleft',
  'strong-copyleft',
  'public-domain',
  'data',
  'creative',
  'responsible-ai',
  'model-specific',
  'source-available',
  'unknown',
  'catch-all',
];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<LicenseCategory | 'all'>('all');
  const [onlyHF, setOnlyHF] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let results = query ? searchLicenses(query) : LICENSES;
    if (activeCategory !== 'all') {
      results = results.filter((l) => l.category === activeCategory);
    }
    if (onlyHF) {
      results = results.filter((l) => l.onHuggingFace);
    }
    return results;
  }, [query, activeCategory, onlyHF]);

  function copyId(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const grouped = useMemo(() => {
    if (activeCategory !== 'all' || query) return null;
    const groups: Record<string, typeof filtered> = {};
    for (const cat of ALL_CATEGORIES) {
      const items = filtered.filter((l) => l.category === cat);
      if (items.length > 0) groups[cat] = items;
    }
    return groups;
  }, [filtered, activeCategory, query]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 md:py-12 animate-fade-in">
      {/* Hero */}
      <div className="mb-12 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-lexicon-blue/10 border border-lexicon-blue/20 text-lexicon-blue text-xs font-semibold uppercase tracking-wider mb-6">
          <Scale size={12} />
          <span>License Intelligence Catalog</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-lexicon-text mb-4 leading-tight tracking-tight">
          The definitive reference for
          <span className="block text-lexicon-blue">open-source licenses</span>
        </h1>
        <p className="text-lexicon-text-muted text-lg mb-8 leading-relaxed">
          {TOTAL_LICENSES} licenses cataloged — mirroring every Hugging Face license identifier plus {BEYOND_HF_LICENSES.length} beyond.
          Explore full texts, plain-English summaries, compatibility matrices, and detailed family trees.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href={`${BASE}/recommender`} data-testid="hero-recommender">
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-lexicon-blue hover:bg-lexicon-blue-dim text-lexicon-surface font-semibold rounded-lg shadow-[0_0_20px_rgba(79,142,247,0.3)] hover:shadow-[0_0_25px_rgba(79,142,247,0.5)] transition-all cursor-pointer">
              Find the Right License <ChevronRight size={18} />
            </span>
          </Link>
          <Link href={`${BASE}/matrix`} data-testid="hero-matrix">
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-lexicon-surface-raised hover:bg-lexicon-surface-raised-hover text-lexicon-text border border-lexicon-border hover:border-lexicon-blue/50 font-medium rounded-lg transition-all cursor-pointer">
              <Grid3X3 size={18} className="text-lexicon-blue" />
              Compatibility Matrix
            </span>
          </Link>
          <Link href={`${BASE}/compare`} data-testid="hero-compare">
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-lexicon-surface-raised hover:bg-lexicon-surface-raised-hover text-lexicon-text border border-lexicon-border hover:border-lexicon-blue/50 font-medium rounded-lg transition-all cursor-pointer">
              <GitCompare size={18} className="text-lexicon-blue" />
              Compare Licenses
            </span>
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-10 flex flex-col gap-5 sticky top-14 bg-lexicon-surface/95 backdrop-blur z-40 py-4 border-b border-lexicon-border/50">
        <div className="relative max-w-2xl">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lexicon-blue" />
          <input
            type="text"
            placeholder="Search by name, SPDX id, category, keyword…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-lexicon-surface-raised border border-lexicon-border hover:border-lexicon-border-hover focus:border-lexicon-blue rounded-xl text-lexicon-text text-sm transition-colors outline-none shadow-sm focus:shadow-[0_0_0_1px_rgba(79,142,247,0.5)]"
            data-testid="input-search"
          />
          {query && (
            <button 
              onClick={() => setQuery('')} 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lexicon-text-muted hover:text-lexicon-text transition-colors"
              aria-label="Clear search"
              data-testid="button-clear-search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeCategory === 'all' 
                ? 'bg-lexicon-blue/15 text-lexicon-blue border-lexicon-blue/30 shadow-[0_0_10px_rgba(79,142,247,0.1)]' 
                : 'bg-lexicon-surface-raised text-lexicon-text-muted border-lexicon-border hover:bg-lexicon-surface-raised-hover hover:text-lexicon-text'
            } border`}
            data-testid="filter-category-all"
          >
            All ({LICENSES.length})
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const count = LICENSES.filter((l) => l.category === cat).length;
            if (count === 0) return null;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(isActive ? 'all' : cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-lexicon-blue/15 text-lexicon-blue border-lexicon-blue/30 shadow-[0_0_10px_rgba(79,142,247,0.1)]' 
                    : 'bg-lexicon-surface-raised text-lexicon-text-muted border-lexicon-border hover:bg-lexicon-surface-raised-hover hover:text-lexicon-text'
                } border`}
                data-testid={`filter-category-${cat}`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
          <div className="w-px h-5 bg-lexicon-border mx-1"></div>
          <button
            onClick={() => setOnlyHF(!onlyHF)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              onlyHF 
                ? 'bg-lexicon-green/15 text-lexicon-green border-lexicon-green/30 shadow-[0_0_10px_rgba(52,211,153,0.1)]' 
                : 'bg-lexicon-surface-raised text-lexicon-text-muted border-lexicon-border hover:bg-lexicon-surface-raised-hover hover:text-lexicon-text'
            } border`}
            data-testid="filter-hf-only"
          >
            <Filter size={12} /> HF Only
          </button>
        </div>

        {(query || activeCategory !== 'all' || onlyHF) && (
          <p className="text-xs font-medium text-lexicon-text-muted flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-lexicon-blue animate-pulse"></span>
            Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* License Grid */}
      {grouped ? (
        Object.entries(grouped).map(([cat, items], idx) => (
          <div key={cat} className={`mb-10 animate-slide-in stagger-${(idx % 5) + 1}`}>
            <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-lexicon-text mb-4 pb-2 border-b border-lexicon-border flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat as LicenseCategory].split(' ')[0]}`}></span>
              {CATEGORY_LABELS[cat as LicenseCategory]} 
              <span className="text-lexicon-text-muted ml-1">({items.length})</span>
            </h2>
            <LicenseGrid items={items} copied={copied} onCopy={copyId} />
          </div>
        ))
      ) : (
        <div className="animate-slide-in">
          <LicenseGrid items={filtered} copied={copied} onCopy={copyId} />
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20 px-4 bg-lexicon-surface-raised border border-lexicon-border rounded-xl">
          <div className="bg-lexicon-surface w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-lexicon-border">
            <Search size={24} className="text-lexicon-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-lexicon-text mb-2">No licenses found</h3>
          <p className="text-lexicon-text-muted mb-6">No matches for "{query}" with the current filters.</p>
          <button 
            onClick={() => { setQuery(''); setActiveCategory('all'); setOnlyHF(false); }} 
            className="px-4 py-2 bg-lexicon-blue/10 hover:bg-lexicon-blue/20 text-lexicon-blue text-sm font-medium rounded-lg transition-colors border border-lexicon-blue/20"
            data-testid="button-reset-filters"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

function LicenseGrid({ items, copied, onCopy }: { items: typeof LICENSES; copied: string | null; onCopy: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((license) => (
        <LicenseCard key={license.id} license={license} copied={copied} onCopy={onCopy} />
      ))}
    </div>
  );
}

function LicenseCard({ license, copied, onCopy }: { license: typeof LICENSES[0]; copied: string | null; onCopy: (id: string) => void }) {
  const isCopied = copied === license.id;
  return (
    <Link href={`${BASE}/license/${license.id}`} data-testid={`card-license-${license.id}`}>
      <div
        className="group relative h-full bg-lexicon-surface border border-lexicon-border hover:border-lexicon-blue/40 hover:shadow-[0_4px_20px_rgba(79,142,247,0.05)] rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 cursor-pointer overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-lexicon-blue transition-colors"></div>
        
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <code className="text-xs font-mono font-bold text-lexicon-blue bg-lexicon-blue/10 px-1.5 py-0.5 rounded">
                {license.id}
              </code>
              {!license.onHuggingFace && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-lexicon-purple/15 text-lexicon-purple border border-lexicon-purple/30 uppercase tracking-wider">
                  +Lexicon
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-lexicon-text truncate" title={license.name}>
              {license.shortName || license.name}
            </div>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(license.id); }}
            title="Copy identifier"
            aria-label={`Copy ${license.id}`}
            className={`p-1.5 rounded-md flex-shrink-0 transition-colors ${isCopied ? 'text-lexicon-green bg-lexicon-green/10' : 'text-lexicon-text-muted hover:text-lexicon-text hover:bg-lexicon-surface-raised'}`}
            data-testid={`button-copy-${license.id}`}
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        <p className="text-xs text-lexicon-text-muted leading-relaxed line-clamp-3 flex-1">
          {license.tldr}
        </p>

        <div className="flex justify-between items-center mt-2 pt-3 border-t border-lexicon-border/50">
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${CATEGORY_COLORS[license.category]}`}>
            {CATEGORY_LABELS[license.category]}
          </span>
          <span className="text-xs font-medium text-lexicon-blue opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            Details <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
