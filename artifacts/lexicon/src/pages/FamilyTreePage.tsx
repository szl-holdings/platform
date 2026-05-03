import { useState } from 'react';
import { Link } from 'wouter';
import { GitBranch, ChevronRight, ChevronDown } from 'lucide-react';
import { FAMILY_TREES, type FamilyNode, flattenTree } from '@/data/families';
import { getLicenseById } from '@/data/licenses';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/lexicon';

export default function FamilyTreePage() {
  const [activeFamily, setActiveFamily] = useState<string>(FAMILY_TREES[0].id);
  const family = FAMILY_TREES.find((f) => f.id === activeFamily)!;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12 animate-fade-in">
      <div className="mb-10 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-lexicon-text mb-4 flex items-center gap-3">
          <div className="bg-lexicon-blue/10 p-2 rounded-lg border border-lexicon-blue/20">
            <GitBranch size={28} className="text-lexicon-blue" />
          </div>
          License Families
        </h1>
        <p className="text-lexicon-text-muted text-lg leading-relaxed">
          Open-source licenses evolve. Explore the lineage, forks, and derivations of major license families.
        </p>
      </div>

      {/* Family selector */}
      <div className="flex flex-wrap gap-3 mb-8 bg-lexicon-surface-raised border border-lexicon-border p-2 rounded-xl">
        {FAMILY_TREES.map((ft) => {
          const isActive = activeFamily === ft.id;
          return (
            <button
              key={ft.id}
              onClick={() => setActiveFamily(ft.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex-1 sm:flex-none whitespace-nowrap outline-none
                ${isActive 
                  ? 'shadow-md scale-100' 
                  : 'bg-transparent text-lexicon-text-muted hover:text-lexicon-text hover:bg-lexicon-surface scale-95'}`}
              style={isActive ? {
                backgroundColor: `${ft.color}15`,
                color: ft.color,
                border: `1px solid ${ft.color}40`,
              } : { border: '1px solid transparent' }}
              data-testid={`tab-family-${ft.id}`}
            >
              {ft.name}
            </button>
          );
        })}
      </div>

      {/* Active family content */}
      <div className="animate-fade-in">
        <div 
          className="mb-8 p-6 rounded-xl border relative overflow-hidden"
          style={{ backgroundColor: `${family.color}08`, borderColor: `${family.color}20` }}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: family.color }}></div>
          <h2 className="text-lg font-bold mb-2" style={{ color: family.color }}>{family.name}</h2>
          <p className="text-lexicon-text-muted leading-relaxed text-sm max-w-4xl">
            {family.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
          {/* Tree View */}
          <div className="bg-lexicon-surface-raised border border-lexicon-border rounded-xl p-6 md:p-8 shadow-sm overflow-x-auto min-h-[500px]">
            <TreeNode node={family.root} color={family.color} depth={0} />
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6 sticky top-20">
            <div className="bg-lexicon-surface-raised border border-lexicon-border rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-lexicon-text-muted mb-4 pb-3 border-b border-lexicon-border">
                Cataloged Variants
              </h3>
              <div className="flex flex-wrap gap-2">
                {flattenTree(family.root)
                  .filter((n) => getLicenseById(n.id))
                  .map((n) => (
                    <Link key={n.id} href={`${BASE}/license/${n.id}`}>
                      <span 
                        className="inline-block px-3 py-1.5 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer border hover:shadow-sm"
                        style={{
                          backgroundColor: `${family.color}10`,
                          color: family.color,
                          borderColor: `${family.color}30`
                        }}
                      >
                        {n.id}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
            
            <div className="p-4 bg-lexicon-blue/5 border border-lexicon-blue/20 rounded-xl text-center">
              <p className="text-xs text-lexicon-blue/80 font-medium">
                Click any node in the tree to navigate to its detailed catalog entry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeNode({ node, color, depth }: { node: FamilyNode; color: string; depth: number }) {
  const [expanded, setExpanded] = useState(true);
  const license = getLicenseById(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`relative ${depth > 0 ? 'ml-8' : ''}`}>
      {/* Branch line from parent */}
      {depth > 0 && (
        <div 
          className="absolute left-[-2rem] top-[1.25rem] w-[1.5rem] h-px"
          style={{ backgroundColor: `${color}40` }} 
        />
      )}

      {/* Node Content */}
      <div className="flex items-start gap-3 mb-3 relative group">
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 flex items-center justify-center rounded bg-lexicon-surface border border-lexicon-border hover:border-lexicon-text-muted mt-1.5 shrink-0 z-10 transition-colors focus:outline-none"
            style={{ color: `${color}90` }}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-6 h-6 mt-1.5 shrink-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${color}40` }} />
          </div>
        )}

        <div className={`flex-1 max-w-[420px] rounded-lg p-4 transition-all duration-200 border
          ${license 
            ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer' 
            : 'opacity-80'}`}
          style={{
            backgroundColor: license ? `${color}0c` : 'rgba(255,255,255,0.02)',
            borderColor: license ? `${color}30` : 'var(--lexicon-border)',
          }}
        >
          {license ? (
            <Link href={`${BASE}/license/${node.id}`}>
              <div className="block outline-none" data-testid={`tree-node-${node.id}`}>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono font-extrabold text-sm" style={{ color }}>{node.label}</span>
                  {node.year && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-lexicon-surface/60 text-lexicon-text-muted border border-lexicon-border/50">
                      {node.year}
                    </span>
                  )}
                </div>
                {node.description && (
                  <div className="text-xs text-lexicon-text-muted leading-relaxed">
                    {node.description}
                  </div>
                )}
              </div>
            </Link>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono font-bold text-sm text-lexicon-text-muted">{node.label}</span>
                {node.year && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-lexicon-surface/60 text-lexicon-text-muted border border-lexicon-border/50">
                    {node.year}
                  </span>
                )}
              </div>
              {node.description && (
                <div className="text-xs text-lexicon-text-muted/60 leading-relaxed">
                  {node.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Children Container */}
      {hasChildren && expanded && (
        <div className="relative pt-1 pb-2">
          {/* Vertical line connecting children */}
          <div 
            className="absolute left-[11px] top-[-10px] bottom-[20px] w-px"
            style={{ backgroundColor: `${color}20` }}
          />
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} color={color} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
