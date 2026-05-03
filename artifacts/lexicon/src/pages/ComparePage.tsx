import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useSearch } from 'wouter';
import { X, Plus, GitCompare, Copy, Check, Search } from 'lucide-react';
import { LICENSES, getLicenseById, CATEGORY_LABELS, CATEGORY_COLORS, PERMISSIONS, CONDITIONS, LIMITATIONS } from '@/data/licenses';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/lexicon';

const ALL_PERMS = Object.keys(PERMISSIONS);
const ALL_CONDS = Object.keys(CONDITIONS);
const ALL_LIMS = Object.keys(LIMITATIONS);

export default function ComparePage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [selected, setSelected] = useState<string[]>(() => {
    const ids = params.get('ids')?.split(',').filter(Boolean) || [];
    return ids.slice(0, 4);
  });
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const licenses = selected.map((id) => getLicenseById(id)).filter(Boolean);
  const suggestions = LICENSES.filter((l) => !selected.includes(l.id) && (l.id.includes(query.toLowerCase()) || l.name.toLowerCase().includes(query.toLowerCase()))).slice(0, 6);

  function addLicense(id: string) {
    if (selected.length < 4 && !selected.includes(id)) {
      setSelected([...selected, id]);
      setQuery('');
    }
  }

  function removeLicense(id: string) {
    setSelected(selected.filter((s) => s !== id));
  }

  function copyShareUrl() {
    const url = `${window.location.origin}${BASE}/compare?ids=${selected.join(',')}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 md:py-12 animate-fade-in">
      <div className="mb-10 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-lexicon-text mb-4 flex items-center gap-3">
          <div className="bg-lexicon-blue/10 p-2 rounded-lg border border-lexicon-blue/20">
            <GitCompare size={28} className="text-lexicon-blue" />
          </div>
          Compare Licenses
        </h1>
        <p className="text-lexicon-text-muted text-lg">
          Select up to 4 licenses to view a detailed side-by-side comparison of their permissions, conditions, and limitations.
        </p>
      </div>

      {/* License selector */}
      <div className="mb-8 bg-lexicon-surface-raised border border-lexicon-border p-4 rounded-xl flex flex-wrap gap-3 items-center shadow-sm relative z-20">
        {selected.map((id) => {
          const lic = getLicenseById(id);
          return (
            <div key={id} className="flex items-center gap-2 px-3 py-2 bg-lexicon-blue/10 border border-lexicon-blue/30 rounded-lg animate-fade-in shadow-sm">
              <code className="font-mono text-sm font-bold text-lexicon-blue">{id}</code>
              <button 
                onClick={() => removeLicense(id)} 
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-lexicon-blue/20 text-lexicon-blue transition-colors focus:outline-none"
                aria-label={`Remove ${id}`}
                data-testid={`button-remove-${id}`}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
        
        {selected.length < 4 && (
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={16} className="text-lexicon-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search to add license..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-lexicon-surface border border-lexicon-border hover:border-lexicon-border-hover focus:border-lexicon-blue rounded-lg text-sm text-lexicon-text outline-none transition-colors shadow-sm focus:shadow-[0_0_0_1px_rgba(79,142,247,0.5)]"
              data-testid="input-compare-search"
            />
            {query && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-lexicon-surface-raised border border-lexicon-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in divide-y divide-lexicon-border">
                {suggestions.map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => addLicense(s.id)} 
                    className="w-full text-left px-4 py-3 hover:bg-lexicon-blue/10 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 transition-colors focus:bg-lexicon-blue/10 outline-none"
                    data-testid={`button-add-${s.id}`}
                  >
                    <code className="font-mono text-sm font-bold text-lexicon-blue shrink-0">{s.id}</code>
                    <span className="text-xs text-lexicon-text-muted truncate">{s.shortName || s.name}</span>
                  </button>
                ))}
              </div>
            )}
            {query && suggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-lexicon-surface-raised border border-lexicon-border rounded-xl shadow-xl p-4 text-center text-sm text-lexicon-text-muted z-50">
                No licenses found
              </div>
            )}
          </div>
        )}
        
        <div className="ml-auto flex items-center">
          {selected.length >= 2 && (
            <button 
              onClick={copyShareUrl} 
              className="flex items-center gap-2 px-4 py-2 bg-lexicon-surface border border-lexicon-border hover:border-lexicon-text-muted hover:text-lexicon-text text-lexicon-text-muted rounded-lg text-sm font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-lexicon-blue/50"
              data-testid="button-share-url"
            >
              {copied ? <Check size={16} className="text-lexicon-green" /> : <Copy size={16} />}
              {copied ? 'URL Copied!' : 'Share Comparison'}
            </button>
          )}
        </div>
      </div>

      {/* Comparison table */}
      {licenses.length >= 2 ? (
        <div className="bg-lexicon-surface-raised border border-lexicon-border rounded-xl shadow-sm overflow-x-auto relative z-10 animate-slide-in">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-4 text-left font-bold text-xs uppercase tracking-widest text-lexicon-text-muted bg-lexicon-surface sticky left-0 z-20 border-b border-r border-lexicon-border min-w-[200px] shadow-[4px_0_12px_rgba(0,0,0,0.2)]">
                  Property
                </th>
                {licenses.map((l) => l && (
                  <th key={l.id} className="p-5 text-center min-w-[220px] bg-lexicon-surface border-b border-lexicon-border relative">
                    <Link href={`${BASE}/license/${l.id}`}>
                      <div className="group cursor-pointer inline-block">
                        <code className="block font-mono text-lg font-bold text-lexicon-blue mb-1 group-hover:underline">{l.id}</code>
                        <div className="text-xs font-medium text-lexicon-text-muted">{l.shortName || l.name}</div>
                      </div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-lexicon-border">
              {/* Meta */}
              <CompareRow label="Category" licenses={licenses} render={(l) => (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${CATEGORY_COLORS[l.category]}`}>
                  {CATEGORY_LABELS[l.category]}
                </span>
              )} />
              <CompareRow label="Family" licenses={licenses} render={(l) => <span className="font-medium text-lexicon-text">{l.family}</span>} />
              <CompareRow label="Introduced" licenses={licenses} render={(l) => <span className="font-medium text-lexicon-text-muted">{l.yearIntroduced || '—'}</span>} />
              <CompareRow label="Ecosystem" licenses={licenses} render={(l) => (
                <span className={`text-xs font-bold ${l.onHuggingFace ? 'text-lexicon-green' : 'text-lexicon-purple'}`}>
                  {l.onHuggingFace ? 'HF Native' : '+Lexicon'}
                </span>
              )} />

              {/* Permissions */}
              <tr className="bg-lexicon-green/5 border-t-2 border-lexicon-green/20">
                <td colSpan={licenses.length + 1} className="p-3 text-xs font-bold text-lexicon-green uppercase tracking-widest pl-4">
                  <div className="flex items-center gap-2"><Check size={14} /> Permissions</div>
                </td>
              </tr>
              {ALL_PERMS.map((p) => {
                if (!licenses.some((l) => l?.permissions.includes(p) || l?.permissions.length === 0)) return null;
                return (
                  <CompareRow key={p} label={PERMISSIONS[p]?.label || p} licenses={licenses} isPositive={true} render={(l) => (
                    <div className="flex justify-center">
                      {l.permissions.includes(p) 
                        ? <div className="w-6 h-6 rounded-full bg-lexicon-green/20 text-lexicon-green flex items-center justify-center"><Check size={14} strokeWidth={3} /></div>
                        : <span className="text-lexicon-text-muted/30 font-bold">—</span>}
                    </div>
                  )} />
                );
              })}

              {/* Conditions */}
              <tr className="bg-lexicon-amber/5 border-t-2 border-lexicon-amber/20">
                <td colSpan={licenses.length + 1} className="p-3 text-xs font-bold text-lexicon-amber uppercase tracking-widest pl-4">
                  <div className="flex items-center gap-2"><span className="text-[10px]">◉</span> Conditions</div>
                </td>
              </tr>
              {ALL_CONDS.map((c) => {
                if (!licenses.some((l) => l?.conditions.includes(c))) return null;
                return (
                  <CompareRow key={c} label={CONDITIONS[c]?.label || c} licenses={licenses} isCondition={true} render={(l) => (
                    <div className="flex justify-center">
                      {l.conditions.includes(c) 
                        ? <div className="w-6 h-6 rounded-full bg-lexicon-amber/20 text-lexicon-amber flex items-center justify-center"><span className="text-[10px] font-bold">◉</span></div>
                        : <span className="text-lexicon-text-muted/30 font-bold">—</span>}
                    </div>
                  )} />
                );
              })}

              {/* Limitations */}
              <tr className="bg-lexicon-red/5 border-t-2 border-lexicon-red/20">
                <td colSpan={licenses.length + 1} className="p-3 text-xs font-bold text-lexicon-red uppercase tracking-widest pl-4">
                  <div className="flex items-center gap-2"><X size={14} /> Limitations</div>
                </td>
              </tr>
              {ALL_LIMS.map((l) => {
                if (!licenses.some((lic) => lic?.limitations.includes(l))) return null;
                return (
                  <CompareRow key={l} label={LIMITATIONS[l]?.label || l} licenses={licenses} isNegative={true} render={(lic) => (
                    <div className="flex justify-center">
                      {lic.limitations.includes(l) 
                        ? <div className="w-6 h-6 rounded-full bg-lexicon-red/20 text-lexicon-red flex items-center justify-center"><X size={14} strokeWidth={3} /></div>
                        : <span className="text-lexicon-text-muted/30 font-bold">—</span>}
                    </div>
                  )} />
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-24 px-6 bg-lexicon-surface-raised border border-lexicon-border border-dashed rounded-2xl animate-fade-in">
          <div className="w-20 h-20 bg-lexicon-surface border border-lexicon-border rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <GitCompare size={32} className="text-lexicon-blue/50" />
          </div>
          <h2 className="text-2xl font-bold text-lexicon-text mb-3">Select licenses to compare</h2>
          <p className="text-lexicon-text-muted text-lg max-w-md mx-auto mb-8">
            Use the search box above or browse the catalog and click "Compare" to view side-by-side details.
          </p>
          <Link href={`${BASE}/`}>
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-lexicon-surface hover:bg-lexicon-surface-raised-hover text-lexicon-text border border-lexicon-border font-medium rounded-lg transition-colors cursor-pointer shadow-sm">
              Browse Catalog
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

function CompareRow({ 
  label, 
  licenses, 
  render,
  isPositive,
  isNegative,
  isCondition
}: { 
  label: string; 
  licenses: (ReturnType<typeof getLicenseById>)[]; 
  render: (l: NonNullable<ReturnType<typeof getLicenseById>>) => ReactNode;
  isPositive?: boolean;
  isNegative?: boolean;
  isCondition?: boolean;
}) {
  let bgClass = "hover:bg-white/[0.02]";
  if (isPositive) bgClass = "hover:bg-lexicon-green/[0.03]";
  if (isNegative) bgClass = "hover:bg-lexicon-red/[0.03]";
  if (isCondition) bgClass = "hover:bg-lexicon-amber/[0.03]";

  return (
    <tr className={`transition-colors ${bgClass}`}>
      <td className="p-4 text-sm font-semibold text-lexicon-text-muted sticky left-0 z-10 bg-lexicon-surface-raised border-r border-lexicon-border shadow-[4px_0_12px_rgba(0,0,0,0.1)]">
        {label}
      </td>
      {licenses.map((l, i) => l && (
        <td key={l.id} className={`p-4 text-center ${i % 2 === 1 ? 'bg-black/10' : ''}`}>
          {render(l)}
        </td>
      ))}
    </tr>
  );
}
