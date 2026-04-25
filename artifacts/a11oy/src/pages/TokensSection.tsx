import { useState } from 'react';
import { tokens } from '../data/tokens';
import type { Token } from '../data/tokens';
import { Badge } from '../components/ui/Badge';
import { DrawerPanel } from '../components/ui/DrawerPanel';
import { Palette, Type, SquareDashedBottom, Grid3X3, Layers, Move } from 'lucide-react';
import { motion } from 'framer-motion';

const categories = [
  { id: 'color', name: 'Color', icon: Palette },
  { id: 'typography', name: 'Typography', icon: Type },
  { id: 'spacing', name: 'Spacing', icon: SquareDashedBottom },
  { id: 'radius', name: 'Radius', icon: Grid3X3 },
  { id: 'elevation', name: 'Elevation', icon: Layers },
  { id: 'motion', name: 'Motion', icon: Move },
] as const;

export function TokensSection() {
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]['id']>('color');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const filteredTokens = tokens.filter(t => t.category === activeCategory);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 h-full flex flex-col"
    >
      <div className="mb-8 shrink-0">
        <h1 className="text-2xl font-display font-medium text-[var(--color-a11oy-text)]">Tokens</h1>
        <p className="text-[var(--color-a11oy-text-sub)] mt-1">Design token registry and drift monitoring across surfaces.</p>
      </div>

      <div className="flex gap-2 border-b border-[var(--color-a11oy-border)] mb-6 shrink-0 overflow-x-auto pb-px">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'border-[var(--color-a11oy-blue)] text-[var(--color-a11oy-blue)]' : 'border-transparent text-[var(--color-a11oy-text-sub)] hover:text-[var(--color-a11oy-text)] hover:border-[var(--color-a11oy-muted)]'}`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded-lg">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--color-a11oy-surface)] text-[var(--color-a11oy-text-ghost)] uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-sm shadow-[var(--color-a11oy-navy)]">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Preview</th>
              <th className="px-6 py-3 font-medium">Value</th>
              <th className="px-6 py-3 font-medium">Version</th>
              <th className="px-6 py-3 font-medium">Drift</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-a11oy-border)]">
            {filteredTokens.map(token => (
              <tr 
                key={token.id} 
                onClick={() => setSelectedToken(token)}
                className="hover:bg-[var(--color-a11oy-surface)]/50 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="font-mono text-[var(--color-a11oy-text)] group-hover:text-[var(--color-a11oy-blue)] transition-colors">{token.name}</div>
                  <div className="text-[10px] text-[var(--color-a11oy-text-ghost)] mt-1 max-w-[200px] truncate">{token.description}</div>
                </td>
                <td className="px-6 py-4">
                  {token.category === 'color' && (
                    <div className="w-6 h-6 rounded border border-[var(--color-a11oy-border)]" style={{ backgroundColor: token.value }} />
                  )}
                  {token.category === 'typography' && (
                    <div className="text-lg" style={{ fontFamily: token.value }}>Aa</div>
                  )}
                  {token.category === 'spacing' && (
                    <div className="bg-[var(--color-a11oy-blue)]/20 border border-[var(--color-a11oy-blue)]/50 rounded-sm" style={{ width: token.value, height: '1rem' }} />
                  )}
                  {token.category === 'radius' && (
                    <div className="w-6 h-6 bg-[var(--color-a11oy-border)] border border-[var(--color-a11oy-text-ghost)]" style={{ borderRadius: token.value }} />
                  )}
                  {token.category === 'elevation' && (
                    <div className="w-6 h-6 bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded-sm" style={{ boxShadow: token.value }} />
                  )}
                  {token.category === 'motion' && (
                    <div className="w-6 h-1 bg-[var(--color-a11oy-blue)] rounded-full animate-pulse" style={{ animationDuration: token.category === 'motion' && token.value.includes('ms') ? token.value : '2s' }} />
                  )}
                </td>
                <td className="px-6 py-4 font-mono text-[var(--color-a11oy-text-sub)]">
                  {token.value}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{token.version}</Badge>
                  </div>
                  <div className="text-[10px] text-[var(--color-a11oy-text-ghost)] mt-1">
                    {token.lastChanged} by {token.changedBy}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {token.driftSurfaces.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {token.driftSurfaces.map(s => <Badge key={s} variant="warn" size="sm">{s}</Badge>)}
                    </div>
                  ) : (
                    <span className="text-[var(--color-a11oy-text-ghost)] text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredTokens.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-a11oy-text-ghost)]">
                  No tokens found in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DrawerPanel
        isOpen={!!selectedToken}
        onClose={() => setSelectedToken(null)}
        title={selectedToken?.name || ''}
        subtitle={selectedToken?.description}
        width="w-[600px]"
      >
        {selectedToken && (
          <div className="space-y-8">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-3">Current Definition</h4>
              <div className="bg-[var(--color-a11oy-surface)] border border-[var(--color-a11oy-border)] rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-mono text-[var(--color-a11oy-blue)]">{selectedToken.value}</div>
                  <Badge variant="outline">{selectedToken.version}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--color-a11oy-text-sub)]">
                  <div>Last modified: <span className="text-[var(--color-a11oy-text)]">{selectedToken.lastChanged}</span></div>
                  <div>Author: <span className="text-[var(--color-a11oy-text)]">{selectedToken.changedBy}</span></div>
                </div>
              </div>
            </div>

            {selectedToken.driftSurfaces.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-widest text-[var(--color-a11oy-warn)] mb-3 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Drift Analysis
                </h4>
                <div className="border border-[var(--color-a11oy-border)] rounded-md overflow-hidden text-sm">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--color-a11oy-surface)] border-b border-[var(--color-a11oy-border)]">
                      <tr>
                        <th className="px-4 py-2 font-medium text-[var(--color-a11oy-text-ghost)]">Surface</th>
                        <th className="px-4 py-2 font-medium text-[var(--color-a11oy-text-ghost)]">Canonical</th>
                        <th className="px-4 py-2 font-medium text-[var(--color-a11oy-text-ghost)]">Observed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-a11oy-border)]">
                      {selectedToken.driftSurfaces.map((surface) => (
                        <tr key={surface} className="bg-[var(--color-a11oy-warn)]/5">
                          <td className="px-4 py-3 text-[var(--color-a11oy-text)]">{surface}</td>
                          <td className="px-4 py-3 font-mono text-[var(--color-a11oy-text-sub)]">{selectedToken.value}</td>
                          <td className="px-4 py-3 font-mono text-[var(--color-a11oy-warn)] font-medium">
                            {selectedToken.category === 'color' ? '#2563eb (hardcoded)' : '14px (hardcoded)'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-3">Version History</h4>
              <div className="space-y-4">
                {selectedToken.history.map((hist, i) => (
                  <div key={hist.version} className="relative pl-6">
                    {i !== selectedToken.history.length - 1 && (
                      <div className="absolute top-6 bottom-[-20px] left-[11px] w-px bg-[var(--color-a11oy-border)]" />
                    )}
                    <div className={`absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-[var(--color-a11oy-blue)] ring-4 ring-[var(--color-a11oy-blue)]/20' : 'bg-[var(--color-a11oy-border)]'}`} />
                    
                    <div className="bg-[var(--color-a11oy-surface)] border border-[var(--color-a11oy-border)] rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" size="sm">{hist.version}</Badge>
                          <span className="text-xs text-[var(--color-a11oy-text-ghost)]">{hist.date}</span>
                        </div>
                        <span className="text-xs text-[var(--color-a11oy-text-sub)]">{hist.author}</span>
                      </div>
                      <div className="font-mono text-sm text-[var(--color-a11oy-text)]">{hist.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DrawerPanel>
    </motion.div>
  );
}
