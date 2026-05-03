import { Bot, FileText, Lock, Terminal } from 'lucide-react';
import { useMeshState } from '@/lib/mesh-store';
import { GovernanceDock } from '../components/governance-dock';

export default function TrustProvenance() {
  const meshState = useMeshState();
  const entries = [...meshState.proofEntries].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-100">Trust & Provenance</h1>
        <p className="text-slate-400 mt-1">
          Evidence-backed decision audit trail and policy verification
        </p>
      </header>

      <div className="flex gap-3 text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#c9b787]" />
          VERIFIED
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#c9b787]" />
          PENDING
        </div>
        <div className="flex items-center gap-1.5">
          <Bot className="w-3 h-3 text-[#8a8a8a]" />
          AGENT MESH
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((item) => {
          const verified = item.status === 'VERIFIED';
          const highlight = !!item.highlight;
          return (
            <div
              key={item.id}
              className={`sentra-panel p-4 ${highlight ? 'border-sky-500/20' : ''}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center ${highlight ? 'bg-[#8a8a8a]/10' : 'bg-[#c9b787]/10'}`}
                  >
                    {highlight ? (
                      <Bot className="w-5 h-5 text-[#8a8a8a]" />
                    ) : (
                      <Lock className="w-5 h-5 text-[#c9b787]" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-200">{item.action}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      ACTOR: {item.actor} · {new Date(item.completedAt).toLocaleTimeString()}
                      {highlight && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-[#8a8a8a]/10 border border-sky-500/20 text-[#8a8a8a] text-[9px] uppercase">
                          {item.tag}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <FileText className="w-3 h-3" />
                    PROOF-HASH: {item.proofHash}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold ${verified ? 'bg-[#c9b787]/10 border-[#c9b787]/20 text-[#c9b787]' : 'bg-[#c9b787]/10 border-[#c9b787]/20 text-[#c9b787]'}`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
              {item.details && item.details.length > 0 && (
                <div className="mt-3 ml-14 rounded border border-[#c9b787]/10 bg-slate-900/40 p-3">
                  <div className="flex items-center gap-2 text-[10px] text-[#c9b787] font-mono uppercase mb-1.5">
                    <Terminal className="w-3 h-3" />
                    Executor Trace
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300/80 font-mono">
                    {item.details.map((line, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-[#c9b787]/60">›</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <GovernanceDock />
    </div>
  );
}
