import { useState } from 'react';
import { Grid3X3 } from 'lucide-react';
import { Link } from 'wouter';
import { MATRIX_LICENSES, COMPATIBILITY, getCompatibilityBgClass, getCompatibilityColor, type CompatibilityStatus } from '@/data/compatibility';
import { getLicenseById } from '@/data/licenses';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/lexicon';

export default function MatrixPage() {
  const [hoveredCell, setHoveredCell] = useState<{ a: string; b: string } | null>(null);
  const [filter, setFilter] = useState<CompatibilityStatus | 'all'>('all');

  const displayLicenses = MATRIX_LICENSES;

  function getCell(a: string, b: string) {
    if (a === b) return { status: 'compatible' as CompatibilityStatus, note: 'Same license.' };
    const entry = COMPATIBILITY[a]?.[b] || COMPATIBILITY[b]?.[a];
    return entry || { status: 'unknown' as CompatibilityStatus, note: 'Not assessed.' };
  }

  const hoveredEntry = hoveredCell ? getCell(hoveredCell.a, hoveredCell.b) : null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 md:py-12 animate-fade-in">
      <div className="mb-10 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-lexicon-text mb-4 flex items-center gap-3">
          <div className="bg-lexicon-blue/10 p-2 rounded-lg border border-lexicon-blue/20">
            <Grid3X3 size={28} className="text-lexicon-blue" />
          </div>
          Compatibility Matrix
        </h1>
        <p className="text-lexicon-text-muted text-lg leading-relaxed">
          Can code or models from License A be combined into a project licensed under License B? 
          This matrix maps compatibility across {displayLicenses.length} key licenses.
          Hover any cell for a detailed explanation.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-6 bg-lexicon-surface-raised border border-lexicon-border p-4 rounded-xl shadow-sm relative z-20">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-lexicon-text-muted uppercase tracking-widest mr-2">Filter</span>
          {(['all', 'compatible', 'partial', 'incompatible', 'unknown'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all focus:outline-none focus:ring-2 focus:ring-lexicon-blue/50
                ${filter === s 
                  ? 'bg-lexicon-blue text-lexicon-surface shadow-md' 
                  : 'bg-lexicon-surface border border-lexicon-border text-lexicon-text hover:border-lexicon-text-muted'}`}
              data-testid={`filter-matrix-${s}`}
            >
              {s}
            </button>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 bg-lexicon-surface px-4 py-2 rounded-lg border border-lexicon-border">
          <LegendItem color="bg-lexicon-green" label="Compatible" />
          <LegendItem color="bg-lexicon-amber" label="Partial/Care needed" />
          <LegendItem color="bg-lexicon-red" label="Incompatible" />
          <LegendItem color="bg-slate-400" label="Unknown" />
        </div>
      </div>

      {/* Matrix Container */}
      <div className="bg-lexicon-surface-raised border border-lexicon-border rounded-xl shadow-sm overflow-hidden relative">
        
        {/* Fixed Tooltip Overlay */}
        <div className={`absolute top-0 right-0 m-4 p-4 max-w-sm rounded-xl shadow-2xl backdrop-blur-md border transition-all duration-200 z-30 pointer-events-none
          ${hoveredCell && hoveredEntry ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
          ${hoveredEntry?.status === 'compatible' ? 'bg-lexicon-green/10 border-lexicon-green/40' : 
            hoveredEntry?.status === 'incompatible' ? 'bg-lexicon-red/10 border-lexicon-red/40' : 
            hoveredEntry?.status === 'partial' ? 'bg-lexicon-amber/10 border-lexicon-amber/40' : 
            'bg-slate-400/10 border-slate-400/40'}`}
        >
          {hoveredCell && hoveredEntry && (
            <div>
              <div className="flex items-center gap-2 mb-2 font-mono text-sm">
                <span className="font-bold text-lexicon-text">{hoveredCell.a}</span>
                <span className="text-lexicon-text-muted">→</span>
                <span className="font-bold text-lexicon-text">{hoveredCell.b}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider mt-0.5
                  ${hoveredEntry.status === 'compatible' ? 'text-lexicon-green' : 
                    hoveredEntry.status === 'incompatible' ? 'text-lexicon-red' : 
                    hoveredEntry.status === 'partial' ? 'text-lexicon-amber' : 
                    'text-slate-400'}`}>
                  {hoveredEntry.status}
                </span>
                <span className="text-sm text-lexicon-text leading-snug">{hoveredEntry.note}</span>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar relative z-10">
          <table className="w-max border-collapse">
            <thead>
              <tr>
                {/* Top-Left Corner (Empty) */}
                <th className="w-32 min-w-[128px] h-[140px] sticky left-0 top-0 z-40 bg-lexicon-surface-raised border-r border-b border-lexicon-border shadow-[4px_4px_10px_rgba(0,0,0,0.1)]">
                   <div className="absolute bottom-2 right-2 text-[10px] font-bold text-lexicon-text-muted uppercase tracking-widest text-right">
                     Into Project →<br/>
                     <span className="text-lexicon-blue/70">From Component ↓</span>
                   </div>
                </th>
                
                {/* Column Headers */}
                {displayLicenses.map((id) => (
                  <th key={id} className="w-12 min-w-[48px] h-[140px] p-0 relative sticky top-0 z-20 bg-lexicon-surface-raised border-b border-lexicon-border hover:bg-lexicon-surface transition-colors">
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 origin-bottom-left -rotate-45 font-mono text-[11px] font-bold">
                      <Link href={`${BASE}/license/${id}`}>
                        <span className="text-lexicon-text hover:text-lexicon-blue transition-colors whitespace-nowrap cursor-pointer px-2 py-1 rounded hover:bg-lexicon-blue/10">
                          {id}
                        </span>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayLicenses.map((rowId) => (
                <tr key={rowId} className="group">
                  {/* Row Header */}
                  <th className="px-4 py-2 text-right sticky left-0 z-20 bg-lexicon-surface-raised group-hover:bg-lexicon-surface border-r border-b border-lexicon-border border-b-lexicon-border/50 shadow-[4px_0_10px_rgba(0,0,0,0.1)] transition-colors">
                    <Link href={`${BASE}/license/${rowId}`}>
                      <span className="font-mono text-[11px] font-bold text-lexicon-text group-hover:text-lexicon-blue transition-colors cursor-pointer">
                        {rowId}
                      </span>
                    </Link>
                  </th>
                  
                  {/* Cells */}
                  {displayLicenses.map((colId) => {
                    const cell = getCell(rowId, colId);
                    const isSelf = rowId === colId;
                    const isHighlighted = filter === 'all' || cell.status === filter;
                    
                    return (
                      <td
                        key={colId}
                        className={`w-12 h-10 min-w-[48px] text-center border-r border-b border-lexicon-border/30 cursor-crosshair transition-all duration-150
                          ${isSelf ? '' : getCompatibilityBgClass(cell.status)}
                          ${isSelf ? 'bg-lexicon-blue/10 border-lexicon-blue/20' : ''}`}
                        style={{
                          opacity: isHighlighted ? 1 : 0.15,
                        }}
                        onMouseEnter={() => setHoveredCell(!isSelf ? { a: rowId, b: colId } : null)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          {isSelf ? <span className="text-sm text-lexicon-blue opacity-80">◎</span> :
                            cell.status === 'compatible' ? <span className="text-sm font-bold text-lexicon-green opacity-90">✓</span> :
                            cell.status === 'incompatible' ? <span className="text-sm font-bold text-lexicon-red opacity-90">✗</span> :
                            cell.status === 'partial' ? <span className="text-sm font-bold text-lexicon-amber opacity-90">~</span> :
                            <span className="text-xs font-bold text-slate-400 opacity-70">?</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 p-4 bg-lexicon-amber/5 border border-lexicon-amber/20 rounded-xl text-center">
        <p className="text-xs font-medium text-lexicon-amber/90 tracking-wide uppercase">
          Disclaimer: This matrix is a simplified heuristic. Complex integrations require legal counsel.
        </p>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-lexicon-text-muted">
      <div className={`w-3 h-3 rounded-full ${color} shadow-sm`} />
      {label}
    </div>
  );
}
