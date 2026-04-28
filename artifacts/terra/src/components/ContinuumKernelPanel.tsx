import { getKernel } from '@szl/alloy/prompts';
import { BookOpen, Brain, Sparkles, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

export function AlloyKernelPanel() {
  const kernel = useMemo(() => getKernel('contact-enrichment'), []);
  const [showExample, setShowExample] = useState(false);
  const example = kernel.codex.examples[0];

  return (
    <div className="rounded-xl border border-amber-500/15 bg-background p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-bold">Prospect Enrichment</div>
            <div className="text-[10px] text-muted-foreground font-mono">
              Continuum Codex · {kernel.name} · v{kernel.version}
            </div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 font-mono uppercase tracking-wider">
          {kernel.pattern}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="rounded-lg bg-muted/30 border border-border p-3">
          <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Users className="w-3 h-3" /> Role
          </div>
          <p className="text-xs text-foreground leading-relaxed">{kernel.codex.role}</p>
        </div>

        <div className="rounded-lg bg-muted/30 border border-border p-3">
          <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Contract
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{kernel.codex.contract}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {kernel.inspirations.map((i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] text-muted-foreground font-mono"
            >
              {i}
            </span>
          ))}
        </div>
        {example && (
          <button
            onClick={() => setShowExample((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-400 transition-colors font-mono"
          >
            <BookOpen className="w-3 h-3" />
            {showExample ? 'Hide' : 'View'} example
          </button>
        )}
      </div>

      {showExample && example && (
        <div className="mt-3 rounded-lg bg-muted/50 border border-border p-3">
          <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">
            Example: {example.description}
          </div>
          <pre className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono overflow-hidden max-h-48 overflow-y-auto">
            {example.output}
          </pre>
        </div>
      )}
    </div>
  );
}
