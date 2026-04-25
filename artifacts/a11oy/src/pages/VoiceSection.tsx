import { useState } from 'react';
import { motion } from 'framer-motion';
import { toneMatrix, bannedTerms, preferredTerms, scriptedRewrites } from '../data/voice';
import { DemoBadge } from '../components/ui/DemoBadge';
import { Badge } from '../components/ui/Badge';
import { MessageSquareOff, MessageSquarePlus, ArrowRight } from 'lucide-react';

export function VoiceSection() {
  const [termTab, setTermTab] = useState<'banned' | 'preferred'>('banned');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 h-full flex flex-col overflow-y-auto"
    >
      <div className="mb-8 shrink-0">
        <h1 className="text-2xl font-display font-medium text-[var(--color-a11oy-text)]">Voice & Tone</h1>
        <p className="text-[var(--color-a11oy-text-sub)] mt-1">Brand terminology, tone mapping, and automated copy rewriting guidelines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        
        {/* Tone Matrix */}
        <div className="lg:col-span-1 flex flex-col">
          <h2 className="text-sm font-medium text-[var(--color-a11oy-text)] mb-4 uppercase tracking-wider">Tone Matrix</h2>
          <div className="bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded-lg p-6 relative flex-1 min-h-[300px]">
            {/* Axis Lines */}
            <div className="absolute inset-y-6 left-1/2 w-px bg-[var(--color-a11oy-border)]" />
            <div className="absolute inset-x-6 top-1/2 h-px bg-[var(--color-a11oy-border)]" />
            
            {/* Labels */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-[var(--color-a11oy-text-ghost)] uppercase tracking-widest bg-[var(--color-a11oy-card)] px-2 z-10">Technical</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-[var(--color-a11oy-text-ghost)] uppercase tracking-widest bg-[var(--color-a11oy-card)] px-2 z-10">Plain</div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-a11oy-text-ghost)] uppercase tracking-widest bg-[var(--color-a11oy-card)] py-2 z-10 -rotate-90 origin-center">Warm</div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-a11oy-text-ghost)] uppercase tracking-widest bg-[var(--color-a11oy-card)] py-2 z-10 rotate-90 origin-center">Formal</div>

            {/* Plots */}
            <div className="absolute inset-6">
              {toneMatrix.map(brand => {
                // Map -1 to 1 into 0% to 100%
                const left = `${((brand.x + 1) / 2) * 100}%`;
                const top = `${((1 - brand.y) / 2) * 100}%`; // Invert Y so 1 is top
                return (
                  <div 
                    key={brand.id}
                    className="absolute w-2 h-2 rounded-full bg-[var(--color-a11oy-blue)] shadow-[0_0_0_4px_var(--color-a11oy-navy)] -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer"
                    style={{ left, top }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--color-a11oy-surface)] border border-[var(--color-a11oy-border)] rounded text-[10px] font-medium text-[var(--color-a11oy-text)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {brand.id}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Terminology */}
        <div className="lg:col-span-1 flex flex-col">
          <h2 className="text-sm font-medium text-[var(--color-a11oy-text)] mb-4 uppercase tracking-wider">Terminology</h2>
          <div className="bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded-lg flex flex-col flex-1 h-[300px]">
            <div className="flex border-b border-[var(--color-a11oy-border)] p-2 gap-2 shrink-0">
              <button 
                onClick={() => setTermTab('banned')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm rounded transition-colors ${termTab === 'banned' ? 'bg-[var(--color-a11oy-surface)] text-[var(--color-a11oy-critical)] font-medium' : 'text-[var(--color-a11oy-text-sub)] hover:bg-[var(--color-a11oy-surface)]/50'}`}
              >
                <MessageSquareOff className="w-4 h-4" /> Banned
              </button>
              <button 
                onClick={() => setTermTab('preferred')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm rounded transition-colors ${termTab === 'preferred' ? 'bg-[var(--color-a11oy-surface)] text-[var(--color-a11oy-ok)] font-medium' : 'text-[var(--color-a11oy-text-sub)] hover:bg-[var(--color-a11oy-surface)]/50'}`}
              >
                <MessageSquarePlus className="w-4 h-4" /> Preferred
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              {termTab === 'banned' && (
                <div className="flex flex-wrap gap-2">
                  {bannedTerms.map((term, i) => (
                    <Badge key={i} variant="critical" className="bg-transparent border border-[var(--color-a11oy-critical)]/30 font-mono font-normal">"{term}"</Badge>
                  ))}
                </div>
              )}
              {termTab === 'preferred' && (
                <div className="space-y-3">
                  {preferredTerms.map((pair, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-[var(--color-a11oy-text-ghost)] line-through decoration-[var(--color-a11oy-critical)] w-[40%] text-right truncate">
                        {pair.avoid}
                      </span>
                      <ArrowRight className="w-3 h-3 text-[var(--color-a11oy-text-sub)] shrink-0" />
                      <span className="text-[var(--color-a11oy-ok)] font-medium w-[50%] truncate">
                        {pair.prefer}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rewrite Preview */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-sm font-medium text-[var(--color-a11oy-text)] uppercase tracking-wider">Rewrite Engine Preview</h2>
             <DemoBadge />
          </div>
          <div className="bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded-lg flex flex-col flex-1 h-[300px] overflow-y-auto p-4 space-y-4">
            {scriptedRewrites.map((rewrite, i) => (
              <div key={i} className="bg-[var(--color-a11oy-surface)] border border-[var(--color-a11oy-border)] rounded-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" size="sm">{rewrite.brand}</Badge>
                  <span className="text-xs text-[var(--color-a11oy-text-ghost)]">{rewrite.context}</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="relative pl-3 border-l-2 border-[var(--color-a11oy-critical)]/50 text-[var(--color-a11oy-text-sub)] italic">
                    "{rewrite.original}"
                  </div>
                  <div className="relative pl-3 border-l-2 border-[var(--color-a11oy-blue)] text-[var(--color-a11oy-text)] font-medium">
                    "{rewrite.rewritten}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
