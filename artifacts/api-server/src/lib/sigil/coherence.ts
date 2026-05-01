/**
 * SIGIL · Phase Coherence (SZL Holdings, 2026)
 *
 * Coherence axis (Φ) for multi-agent fleets.
 *
 * Each agent in a fleet publishes a phase angle θᵢ ∈ [0, 2π) representing
 * its current cycle position (heartbeat, batch boundary, sync round).
 * The fleet-wide coherence is the magnitude r ∈ [0,1] of:
 *
 *     r · e^(iψ) = (1/N) · Σⱼ e^(iθⱼ)
 *
 * r = 0 → fully desynchronised; r = 1 → perfect phase-lock.
 *
 * The order-parameter form is standard textbook material (Kuramoto,
 * 1975, public domain). What is SZL's: the calibrated thresholds for
 * fleet routing decisions —
 *
 *   r ≥ 0.85  → ROUTE (open work-handoffs across the fleet)
 *   0.85 > r ≥ 0.60 → DRIFTING (work-routing degraded; alert)
 *   r < 0.60  → DESYNC (close fleet to new handoffs until re-tuned)
 *
 * — and the cycle-time tolerance gate that paired-fleet handoffs must
 * pass before any work crosses a fleet boundary.
 */

export interface PhaseSample {
	readonly agentId: string;
	readonly thetaRadians: number;
}

export type CoherenceVerdict = 'ROUTE' | 'DRIFTING' | 'DESYNC';

export interface CoherenceReport {
	readonly r: number;
	readonly psi: number;
	readonly agentCount: number;
	readonly verdict: CoherenceVerdict;
	readonly thresholds: { route: number; drifting: number };
}

const TWO_PI = 2 * Math.PI;

function wrap(theta: number): number {
	const t = theta % TWO_PI;
	return t < 0 ? t + TWO_PI : t;
}

export function coherence(samples: readonly PhaseSample[]): CoherenceReport {
	if (samples.length === 0) {
		return {
			r: 0,
			psi: 0,
			agentCount: 0,
			verdict: 'DESYNC',
			thresholds: { route: 0.85, drifting: 0.6 },
		};
	}
	let sx = 0;
	let sy = 0;
	for (const s of samples) {
		const t = wrap(s.thetaRadians);
		sx += Math.cos(t);
		sy += Math.sin(t);
	}
	sx /= samples.length;
	sy /= samples.length;
	const r = Math.sqrt(sx * sx + sy * sy);
	const psi = Math.atan2(sy, sx);
	let verdict: CoherenceVerdict;
	if (r >= 0.85) verdict = 'ROUTE';
	else if (r >= 0.6) verdict = 'DRIFTING';
	else verdict = 'DESYNC';
	return {
		r: Math.min(1, r),
		psi,
		agentCount: samples.length,
		verdict,
		thresholds: { route: 0.85, drifting: 0.6 },
	};
}

/**
 * Project the coherence report onto the [0,1] axis value used by Σ.
 */
export function coherenceAxis(r: CoherenceReport): number {
	return Math.max(0, Math.min(1, r.r));
}
