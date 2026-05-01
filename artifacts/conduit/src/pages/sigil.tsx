import { useEffect, useState } from 'react';
import { Sigma } from 'lucide-react';

const API_BASE = '/api/sigil';

interface SigilReport {
        sigma: number;
        axes: { provenance: number; containment: number; coherence: number; convergence: number };
        weights: Record<string, { value: number; rendered: string }>;
        proof: { weightsExact: boolean; minAxis: number; maxAxis: number; formula: string; law: string };
}

const AXES = [
        { key: 'provenance', label: 'Provenance', sym: 'P', blurb: 'Pipeline lineage verified end-to-end · shift-add accumulator over leaf hashes' },
        { key: 'containment', label: 'Containment', sym: 'K', blurb: 'Sync-batch release rate inside boundary capacity · bounded saturation' },
        { key: 'coherence', label: 'Coherence', sym: 'Φ', blurb: 'Worker-fleet phase-lock across regions · order parameter r' },
        { key: 'convergence', label: 'Convergence', sym: 'C', blurb: 'Multi-witness reconciliation across mirrors · Jaccard intersection-over-union' },
] as const;

export default function ConduitSigil() {
        const [axes, setAxes] = useState({ provenance: 0.97, containment: 0.74, coherence: 0.89, convergence: 0.95 });
        const [report, setReport] = useState<SigilReport | null>(null);

        const compose = async (next: typeof axes) => {
                try {
                        const r = await fetch(`${API_BASE}/compose`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ axes: next }),
                        });
                        if (r.ok) setReport((await r.json()) as SigilReport);
                } catch {
                        /* ignore */
                }
        };

        useEffect(() => {
                void compose(axes);
                // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        const sigmaPct = report ? (report.sigma * 100).toFixed(1) : '—';

        return (
                <div className="p-8 space-y-8 max-w-5xl mx-auto">
                        <div>
                                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400 mb-2">
                                        SIGIL · SZL Integrated Governance &amp; Invariant Layer
                                </div>
                                <h1 className="text-4xl font-light tracking-tight text-slate-100">Σ — pipeline trust envelope.</h1>
                                <p className="mt-3 text-slate-400 max-w-2xl text-sm leading-relaxed">
                                        Amaru exposes runtime trust as four independent axes and a single composed scalar Σ. The composition is a
                                        weighted geometric mean over rational unit-fraction weights — bit-exact reproducible, monotone in every
                                        axis, and pinned to zero whenever any axis collapses.
                                </p>
                        </div>

                        <div className="rounded-lg border border-cyan-900/50 bg-slate-900/60 p-8 flex items-center gap-8 backdrop-blur">
                                <Sigma className="h-12 w-12 text-cyan-400" />
                                <div>
                                        <div className="text-7xl font-extralight tabular-nums text-slate-100">
                                                {sigmaPct}
                                                <span className="text-3xl text-slate-500">%</span>
                                        </div>
                                        <div className="text-xs font-mono uppercase tracking-widest text-cyan-500 mt-1">
                                                {report ? `min ≤ Σ ≤ max · floor ${(report.proof.minAxis * 100).toFixed(1)}% · ceil ${(report.proof.maxAxis * 100).toFixed(1)}%` : 'composing…'}
                                        </div>
                                </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                                {AXES.map(({ key, label, sym, blurb }) => {
                                        const v = axes[key];
                                        return (
                                                <div key={key} className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
                                                        <div className="flex items-center justify-between mb-2">
                                                                <span className="font-medium text-slate-100">
                                                                        {label} <span className="font-mono text-cyan-500/80">({sym})</span>
                                                                </span>
                                                                <span className="font-mono text-sm tabular-nums text-cyan-300">{(v * 100).toFixed(1)}%</span>
                                                        </div>
                                                        <input
                                                                type="range"
                                                                min={0}
                                                                max={1}
                                                                step={0.01}
                                                                value={v}
                                                                onChange={(e) => {
                                                                        const next = { ...axes, [key]: Number(e.target.value) };
                                                                        setAxes(next);
                                                                        void compose(next);
                                                                }}
                                                                className="w-full accent-cyan-400"
                                                        />
                                                        <div className="mt-2 text-xs text-slate-500">{blurb}</div>
                                                </div>
                                        );
                                })}
                        </div>

                        {report && (
                                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
                                        <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-500 mb-2">composition law</div>
                                        <div className="font-mono text-sm break-all text-slate-100">{report.proof.formula}</div>
                                        <div className="mt-2 text-xs text-slate-500">{report.proof.law}</div>
                                </div>
                        )}
                </div>
        );
}
