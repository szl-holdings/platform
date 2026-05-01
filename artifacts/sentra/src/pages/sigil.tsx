import { useEffect, useState } from 'react';
import { Sigma, Shield, Sparkles, Zap, GitBranch } from 'lucide-react';

const API_BASE = '/api/sigil';

interface SigilReport {
        sigma: number;
        axes: { provenance: number; containment: number; coherence: number; convergence: number };
        weights: Record<string, { value: number; rendered: string }>;
        proof: { weightsExact: boolean; minAxis: number; maxAxis: number; formula: string; law: string };
}

const AXES = [
        { key: 'provenance', label: 'Provenance', sym: 'P', icon: Shield, blurb: 'Verified-lineage fraction · shift-add HSM accumulator' },
        { key: 'containment', label: 'Containment', sym: 'K', icon: Zap, blurb: 'Boundary-rate slack · bounded saturation monitor' },
        { key: 'coherence', label: 'Coherence', sym: 'Φ', icon: Sparkles, blurb: 'Fleet phase-lock · order parameter r' },
        { key: 'convergence', label: 'Convergence', sym: 'C', icon: GitBranch, blurb: 'N-witness reconciliation · Jaccard index' },
] as const;

export default function SentraSigil() {
        const [axes, setAxes] = useState({ provenance: 0.93, containment: 0.78, coherence: 0.86, convergence: 0.92 });
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
                <div className="min-h-screen bg-black text-zinc-100 p-8">
                        <div className="max-w-5xl mx-auto space-y-8">
                                <div>
                                        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-2">
                                                SIGIL · SZL Integrated Governance &amp; Invariant Layer
                                        </div>
                                        <h1 className="text-4xl font-light tracking-tight">Σ — runtime trust envelope.</h1>
                                        <p className="mt-3 text-zinc-400 max-w-2xl text-sm leading-relaxed">
                                                Sentra reports cyber posture as four independent axes — Provenance, Containment, Coherence, Convergence —
                                                and a single closed-form scalar Σ. Pin any axis to zero and Σ pins to zero. No silent fallbacks. No
                                                averaging away weakness.
                                        </p>
                                </div>

                                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 flex items-center gap-8">
                                        <Sigma className="h-12 w-12 text-zinc-300" />
                                        <div>
                                                <div className="text-7xl font-extralight tabular-nums">{sigmaPct}<span className="text-3xl text-zinc-500">%</span></div>
                                                <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mt-1">
                                                        {report ? `min ≤ Σ ≤ max · floor ${(report.proof.minAxis * 100).toFixed(1)}% · ceil ${(report.proof.maxAxis * 100).toFixed(1)}%` : 'composing…'}
                                                </div>
                                        </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                        {AXES.map(({ key, label, sym, icon: Icon, blurb }) => {
                                                const v = axes[key];
                                                return (
                                                        <div key={key} className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
                                                                <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                                <Icon className="h-4 w-4 text-zinc-400" />
                                                                                <span className="font-medium">
                                                                                        {label} <span className="font-mono text-zinc-600">({sym})</span>
                                                                                </span>
                                                                        </div>
                                                                        <span className="font-mono text-sm tabular-nums text-zinc-300">{(v * 100).toFixed(1)}%</span>
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
                                                                        className="w-full accent-zinc-400"
                                                                />
                                                                <div className="mt-2 text-xs text-zinc-500">{blurb}</div>
                                                        </div>
                                                );
                                        })}
                                </div>

                                {report && (
                                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
                                                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">composition law</div>
                                                <div className="font-mono text-sm break-all">{report.proof.formula}</div>
                                                <div className="mt-2 text-xs text-zinc-500">{report.proof.law}</div>
                                        </div>
                                )}
                        </div>
                </div>
        );
}
