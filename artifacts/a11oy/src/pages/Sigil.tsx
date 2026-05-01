import { useEffect, useMemo, useState } from 'react';
import { Sigma, Shield, Sparkles, Zap, GitBranch, Loader2 } from 'lucide-react';

const API_BASE = '/api/sigil';

interface SigilReport {
        sigma: number;
        axes: { provenance: number; containment: number; coherence: number; convergence: number };
        weights: Record<string, { value: number; rendered: string }>;
        proof: { weightsExact: boolean; minAxis: number; maxAxis: number; formula: string; law: string };
}

const AXIS_META = [
        { key: 'provenance', label: 'Provenance', symbol: 'P', icon: Shield, blurb: 'verifiable-lineage fraction · shift-add accumulator' },
        { key: 'containment', label: 'Containment', symbol: 'K', icon: Zap, blurb: 'release-rate inside boundary capacity · bounded saturation' },
        { key: 'coherence', label: 'Coherence', symbol: 'Φ', icon: Sparkles, blurb: 'multi-agent phase order parameter · Kuramoto r' },
        { key: 'convergence', label: 'Convergence', symbol: 'C', icon: GitBranch, blurb: 'N-witness reconciliation · Jaccard intersection-over-union' },
] as const;

export function Sigil() {
        const [axes, setAxes] = useState({ provenance: 0.95, containment: 0.82, coherence: 0.91, convergence: 0.88 });
        const [report, setReport] = useState<SigilReport | null>(null);
        const [busy, setBusy] = useState(false);
        const [err, setErr] = useState<string | null>(null);

        const compose = useMemo(
                () => async (next: typeof axes) => {
                        setBusy(true);
                        setErr(null);
                        try {
                                const r = await fetch(`${API_BASE}/compose`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ axes: next }),
                                });
                                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                                setReport((await r.json()) as SigilReport);
                        } catch (e) {
                                setErr((e as Error).message);
                        } finally {
                                setBusy(false);
                        }
                },
                [],
        );

        useEffect(() => {
                void compose(axes);
                // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        const onSlide = (key: keyof typeof axes, v: number) => {
                const next = { ...axes, [key]: v };
                setAxes(next);
                void compose(next);
        };

        const sigmaPct = report ? (report.sigma * 100).toFixed(2) : '—';
        const ringPct = report ? Math.max(0, Math.min(100, report.sigma * 100)) : 0;
        const ringDash = `${(ringPct * 339.292) / 100} 339.292`;

        return (
                <div className="p-8 max-w-6xl mx-auto space-y-8">
                        <div>
                                <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-1">
                                        SIGIL · SZL Integrated Governance &amp; Invariant Layer
                                </div>
                                <h1 className="font-serif text-4xl text-[var(--color-a11oy-text-primary)] leading-tight">
                                        Σ — the four-axis trust envelope.
                                </h1>
                                <p className="mt-3 text-[var(--color-a11oy-text-secondary)] max-w-2xl">
                                        One closed-form scalar. Provenance, Containment, Coherence, Convergence — composed by a weighted geometric
                                        mean over rational unit-fraction weights. Pin any axis to zero and Σ pins to zero; raise any axis and Σ rises
                                        monotonically. Audit-grade by construction.
                                </p>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1 rounded-xl border border-[var(--color-a11oy-border-subtle)] bg-[var(--color-a11oy-surface-elevated)] p-6 flex flex-col items-center justify-center">
                                        <div className="relative">
                                                <svg width="180" height="180" viewBox="0 0 120 120" className="-rotate-90">
                                                        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-a11oy-border-subtle)" strokeWidth="8" />
                                                        <circle
                                                                cx="60"
                                                                cy="60"
                                                                r="54"
                                                                fill="none"
                                                                stroke="var(--color-a11oy-accent-gold, #c9a961)"
                                                                strokeWidth="8"
                                                                strokeDasharray={ringDash}
                                                                strokeLinecap="round"
                                                                className="transition-all duration-500"
                                                        />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <Sigma className="h-6 w-6 text-[var(--color-a11oy-accent-gold,#c9a961)]" />
                                                        <div className="font-serif text-3xl text-[var(--color-a11oy-text-primary)] mt-1">{sigmaPct}</div>
                                                        <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)]">Σ · 0–100</div>
                                                </div>
                                        </div>
                                        <div className="mt-4 text-center text-xs text-[var(--color-a11oy-text-secondary)]">
                                                {busy ? (
                                                        <span className="inline-flex items-center gap-1.5">
                                                                <Loader2 className="h-3 w-3 animate-spin" /> composing…
                                                        </span>
                                                ) : err ? (
                                                        <span className="text-red-400">{err}</span>
                                                ) : report ? (
                                                        <span className="font-mono">
                                                                min ≤ Σ ≤ max · floor {(report.proof.minAxis * 100).toFixed(1)}% · ceil {(report.proof.maxAxis * 100).toFixed(1)}% · weights exact
                                                        </span>
                                                ) : (
                                                        <span>—</span>
                                                )}
                                        </div>
                                </div>

                                <div className="lg:col-span-2 rounded-xl border border-[var(--color-a11oy-border-subtle)] bg-[var(--color-a11oy-surface-elevated)] p-6">
                                        <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-4">
                                                Live composition · drag any axis
                                        </div>
                                        <div className="space-y-5">
                                                {AXIS_META.map(({ key, label, symbol, icon: Icon, blurb }) => {
                                                        const v = axes[key];
                                                        const pct = (v * 100).toFixed(1);
                                                        return (
                                                                <div key={key}>
                                                                        <div className="flex items-center justify-between mb-1.5">
                                                                                <div className="flex items-center gap-2">
                                                                                        <Icon className="h-4 w-4 text-[var(--color-a11oy-accent-gold,#c9a961)]" />
                                                                                        <span className="font-medium text-[var(--color-a11oy-text-primary)]">
                                                                                                {label}{' '}
                                                                                                <span className="font-mono text-[var(--color-a11oy-text-ghost)]">({symbol})</span>
                                                                                        </span>
                                                                                </div>
                                                                                <span className="font-mono text-sm tabular-nums text-[var(--color-a11oy-text-secondary)]">
                                                                                        {pct}%
                                                                                </span>
                                                                        </div>
                                                                        <input
                                                                                type="range"
                                                                                min={0}
                                                                                max={1}
                                                                                step={0.01}
                                                                                value={v}
                                                                                onChange={(e) => onSlide(key, Number(e.target.value))}
                                                                                className="w-full accent-[var(--color-a11oy-accent-gold,#c9a961)]"
                                                                        />
                                                                        <div className="mt-1 text-xs text-[var(--color-a11oy-text-ghost)]">{blurb}</div>
                                                                </div>
                                                        );
                                                })}
                                        </div>
                                </div>
                        </div>

                        {report && (
                                <div className="rounded-xl border border-[var(--color-a11oy-border-subtle)] bg-[var(--color-a11oy-surface-elevated)] p-6">
                                        <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-3">
                                                The composition law
                                        </div>
                                        <div className="font-mono text-sm text-[var(--color-a11oy-text-primary)] break-all">
                                                {report.proof.formula}
                                        </div>
                                        <div className="mt-4 grid sm:grid-cols-4 gap-3">
                                                {Object.entries(report.weights).map(([k, w]) => (
                                                        <div
                                                                key={k}
                                                                className="rounded-lg border border-[var(--color-a11oy-border-subtle)] p-3"
                                                        >
                                                                <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)]">
                                                                        weight · {k}
                                                                </div>
                                                                <div className="font-mono text-base text-[var(--color-a11oy-text-primary)] mt-1">{w.rendered}</div>
                                                                <div className="font-mono text-xs text-[var(--color-a11oy-text-secondary)] mt-0.5">
                                                                        = {w.value}
                                                                </div>
                                                        </div>
                                                ))}
                                        </div>
                                        <div className="mt-4 text-xs text-[var(--color-a11oy-text-ghost)]">
                                                {report.proof.law}. Weights are exact rationals expressed as distinct unit fractions; the framework verifies
                                                that Σ wᵢ = 1 over rational arithmetic before any composition runs.
                                        </div>
                                </div>
                        )}

                        <div className="grid sm:grid-cols-3 gap-4 text-sm">
                                {[
                                        { k: 'Zero-pinning', v: 'If any axis = 0, Σ ≡ 0. No silent fallbacks.' },
                                        { k: 'Monotonicity', v: '∂Σ/∂axisᵢ ≥ 0. Improvement on any axis lifts Σ.' },
                                        { k: 'Bounded', v: '0 ≤ min(axis) ≤ Σ ≤ max(axis) ≤ 1. The weighted-geometric envelope keeps Σ inside the band of its inputs and pulls toward the weakest dimension as its weight rises.' },
                                ].map((x) => (
                                        <div
                                                key={x.k}
                                                className="rounded-lg border border-[var(--color-a11oy-border-subtle)] bg-[var(--color-a11oy-surface-elevated)] p-4"
                                        >
                                                <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-accent-gold,#c9a961)] mb-1">
                                                        theorem
                                                </div>
                                                <div className="font-medium text-[var(--color-a11oy-text-primary)]">{x.k}</div>
                                                <div className="text-[var(--color-a11oy-text-secondary)] mt-1 text-xs">{x.v}</div>
                                        </div>
                                ))}
                        </div>
                </div>
        );
}
