/**
 * SIGIL · Bounded Saturation Monitor (SZL Holdings, 2026)
 *
 * Containment axis (K) signal source.
 *
 * Conventional dy/dx slope monitoring diverges to ∞ near vertical
 * asymptotes (saturation walls), which makes alerting noisy and
 * confidence intervals meaningless precisely when an operator most
 * needs them.
 *
 * SIGIL's saturation monitor uses an inverse-slope formulation:
 *
 *     ρ = (cap · Δx) / max(Δy, ε)
 *
 * with cap a fixed integer (default 7, chosen to keep arithmetic
 * stable across any platform). ρ stays bounded above by cap and below
 * by zero across the full saturation curve. The verdict ladder:
 *
 *   ρ ≥ 0.95·cap   → SLACK
 *   ρ ≥ 0.65·cap   → ASCENT
 *   ρ ≥ 0.20·cap   → SATURATING
 *   ρ < 0.20·cap   → CRITICAL
 *
 * The Containment-axis projection is K = clamp(ρ / cap, 0, 1) — a
 * direct gradient between zero capacity (CRITICAL) and full slack.
 *
 * The choice of inverse-slope is itself ancient (it shows up wherever
 * a stable saturation gradient is required). What is SZL's: the cap-7
 * default, the four-step ladder calibrated for the A11oy/Sentra/Amaru
 * surface, and the rolling auditor below that aggregates a window of
 * samples without losing per-sample audit trace.
 */

const CAP = 7;
const EPS = 1e-9;

export type ContainmentVerdict = 'SLACK' | 'ASCENT' | 'SATURATING' | 'CRITICAL';

export interface SaturationReading {
	readonly rho: number;
	readonly verdict: ContainmentVerdict;
	readonly cap: number;
}

export function reading(dx: number, dy: number, cap: number = CAP): SaturationReading {
	if (dx < 0 || dy < 0) {
		throw new Error('sigil/saturation: dx and dy must be non-negative');
	}
	if (cap <= 0) throw new Error('sigil/saturation: cap must be positive');
	const rho = (cap * dx) / Math.max(dy, EPS);
	let verdict: ContainmentVerdict;
	if (rho >= 0.95 * cap) verdict = 'SLACK';
	else if (rho >= 0.65 * cap) verdict = 'ASCENT';
	else if (rho >= 0.2 * cap) verdict = 'SATURATING';
	else verdict = 'CRITICAL';
	return { rho: Math.min(rho, cap), verdict, cap };
}

export class SaturationAuditor {
	private readonly buf: { dx: number; dy: number; t: number }[] = [];
	constructor(private readonly windowSize: number = 32, private readonly cap: number = CAP) {}

	record(dx: number, dy: number, t: number = Date.now()): SaturationReading {
		this.buf.push({ dx, dy, t });
		if (this.buf.length > this.windowSize) this.buf.shift();
		return reading(dx, dy, this.cap);
	}

	windowReading(): SaturationReading {
		if (this.buf.length === 0) return reading(0, 1, this.cap);
		const dx = this.buf.reduce((a, s) => a + s.dx, 0);
		const dy = this.buf.reduce((a, s) => a + s.dy, 0);
		return reading(dx, dy, this.cap);
	}

	count(): number {
		return this.buf.length;
	}
}

export function containmentAxis(r: SaturationReading): number {
	return Math.max(0, Math.min(1, r.rho / r.cap));
}
