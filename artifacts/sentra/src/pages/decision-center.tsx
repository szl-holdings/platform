import { Zap } from "lucide-react";

export default function DecisionCenter() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-100">Decision Center</h1>
        <p className="text-slate-400 mt-1">Unified AI decision support for cyber resilience</p>
      </header>

      <div className="sentra-panel p-12 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <Zap className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-200">OS-Level Decision Matrix</h2>
          <p className="text-slate-500 mt-2 max-w-lg">
            This module integrates cross-domain signals from Sentra (Cyber) and Counsel (Legal) to provide unified executive recommendations.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl pt-8">
          <div className="p-4 rounded bg-slate-800/50 border border-slate-700">
            <div className="text-xs font-bold text-slate-400 mb-1 uppercase">Pending Decisions</div>
            <div className="text-2xl font-bold">4</div>
          </div>
          <div className="p-4 rounded bg-slate-800/50 border border-slate-700">
            <div className="text-xs font-bold text-slate-400 mb-1 uppercase">AI Confidence</div>
            <div className="text-2xl font-bold">92%</div>
          </div>
          <div className="p-4 rounded bg-slate-800/50 border border-slate-700">
            <div className="text-xs font-bold text-slate-400 mb-1 uppercase">SLA Breach Risk</div>
            <div className="text-2xl font-bold text-red-400">HIGH</div>
          </div>
        </div>
      </div>
    </div>
  );
}
