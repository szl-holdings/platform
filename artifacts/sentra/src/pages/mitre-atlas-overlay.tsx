import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Bot,
  Layers,
  Loader2,
  Shield,
  Target,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  type MitreAtlasResponse,
  getMitreAtlasPage,
} from '../lib/sentra-api';

const STATUS_STYLE: Record<string, string> = {
  covered: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  partial: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  gap: 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10',
};

export default function MitreAtlasOverlay() {
  const [data, setData] = useState<MitreAtlasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'matrix' | 'vectors' | 'studies'>('matrix');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getMitreAtlasPage()
      .then((res) => {
        if (!active) return;
        if (!res) {
          setError('Unable to load MITRE ATLAS data.');
        } else {
          setData(res);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-xs text-zinc-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading MITRE ATLAS data…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[#f5f5f5]/30 bg-[#f5f5f5]/5 p-4 text-xs text-[#f5f5f5]">
          {error ?? 'MITRE ATLAS data unavailable.'}
        </div>
      </div>
    );
  }

  const { atlasTactics, agenticVectors, caseStudies } = data;
  const totalTechniques = atlasTactics.reduce((s, t) => s + t.techniques, 0);
  const totalSub = atlasTactics.reduce((s, t) => s + t.subTechniques, 0);
  const totalCovered = atlasTactics.reduce((s, t) => s + t.covered, 0);
  const coverageRate = totalTechniques > 0 ? Math.round((totalCovered / totalTechniques) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-[#8a8a8a]" />
            <h1 className="text-lg font-semibold text-white">MITRE ATLAS Overlay</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#8a8a8a]/30 bg-[#8a8a8a]/10 text-[#8a8a8a] font-mono uppercase">
              ATT&CK + ATLAS v5.1
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            AI-specific attack technique tracking — {totalTechniques} techniques, {totalSub} sub-techniques across agentic attack vectors
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'ATLAS Techniques', value: totalTechniques.toString(), sub: `${totalSub} sub-techniques`, color: '#8a8a8a', icon: Target },
          { label: 'Coverage Rate', value: `${coverageRate}%`, sub: `${totalCovered}/${totalTechniques} covered`, color: '#c9b787', icon: Shield },
          { label: 'Active Detections', value: atlasTactics.reduce((s, t) => s + t.detections, 0).toString(), sub: 'across all tactics', color: '#f5f5f5', icon: Activity },
          { label: 'Coverage Gaps', value: agenticVectors.filter(v => v.status === 'gap').length.toString(), sub: 'agentic vectors uncovered', color: '#f5f5f5', icon: AlertTriangle },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-xl font-bold text-white font-mono">{m.value}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 mb-2">
        {(['matrix', 'vectors', 'studies'] as const).map((v) => (
          <button key={v} onClick={() => setActiveView(v)} className={cn(
            'text-[10px] px-3 py-1.5 rounded-lg border transition-colors capitalize',
            activeView === v ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-zinc-500 hover:text-zinc-300',
          )}>
            {v === 'matrix' ? 'ATLAS Matrix' : v === 'vectors' ? 'Agentic Vectors' : 'Case Studies'}
          </button>
        ))}
      </div>

      {activeView === 'matrix' && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#8a8a8a]" />
            ATLAS Tactic Coverage Heatmap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {atlasTactics.map((tactic) => {
              const coverage = tactic.techniques > 0 ? (tactic.covered / tactic.techniques) * 100 : 0;
              const intensity = coverage / 100;
              return (
                <div key={tactic.id} className={cn(
                  'rounded-xl border p-4 transition-all hover:border-white/20',
                  coverage === 100 ? 'border-[#c9b787]/30 bg-[#c9b787]/5' :
                  coverage >= 70 ? 'border-[#c9b787]/20 bg-white/3' :
                  'border-[#f5f5f5]/15 bg-white/3',
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono block">{tactic.id}</span>
                      <span className="text-[11px] font-medium text-white">{tactic.name}</span>
                    </div>
                    <span className={cn(
                      'text-sm font-bold font-mono',
                      coverage >= 60 ? 'text-[#c9b787]' : 'text-[#f5f5f5]',
                    )}>
                      {Math.round(coverage)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 mb-2">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${coverage}%`,
                      background: coverage >= 60 ? '#c9b787' : '#f5f5f5',
                      opacity: 0.6 + intensity * 0.4,
                    }} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span>{tactic.covered}/{tactic.techniques} techniques</span>
                    <span>{tactic.subTechniques} sub-techniques</span>
                    <span className="text-[#c9b787]">{tactic.detections} detections</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeView === 'vectors' && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-[#f5f5f5]" />
            Agentic Attack Vector Tracking
          </h2>
          <div className="space-y-2">
            {agenticVectors.map((vector) => (
              <div key={vector.id} className={cn(
                'rounded-xl border p-4',
                vector.status === 'gap' ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/3' :
                vector.status === 'partial' ? 'border-[#c9b787]/20 bg-white/3' :
                'border-white/8 bg-white/3',
              )}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-medium text-white">{vector.technique}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8a8a8a]/10 text-[#8a8a8a] border border-[#8a8a8a]/20 font-mono">{vector.atlasId}</span>
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded border', STATUS_STYLE[vector.status])}>
                        {vector.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">{vector.description}</p>
                  </div>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded border shrink-0',
                    vector.severity === 'critical' ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10' : 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
                  )}>
                    {vector.severity}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span>{vector.detections} active detections</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'studies' && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#c9b787]" />
            Case Study Reference Panel
          </h2>
          <div className="space-y-2">
            {caseStudies.map((cs) => (
              <div key={cs.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[11px] font-medium text-white block mb-1">{cs.title}</span>
                    <span className="text-[9px] text-[#8a8a8a] font-mono">{cs.source} · {cs.date}</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 mb-2">{cs.impact}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {cs.techniques.map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[#8a8a8a]/10 text-[#8a8a8a] border border-[#8a8a8a]/20 font-mono">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
