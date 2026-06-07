/**
 * Convergence Pulse — real-time trust heartbeat.
 *
 * A11oy broadcasts this. The Convergence Pulse computes a rolling
 * Lambda across a sliding window of guard decisions and surfaces:
 *   - Current trust level (the Lambda composite)
 *   - Trust trajectory (IMPROVING / DEGRADING / STABLE)
 *   - Rate of change (delta Lambda per unit time)
 *   - Per-axis trends (which axes are weakening)
 *   - Predicted time to threshold breach
 *
 * This is the first runtime trust metric that is both:
 *   1. Real-time (updates on every guard decision)
 *   2. Closed-form (no learned model, no drift)
 *   3. Predictive (extrapolates trajectory to threshold)
 *
 * The pulse is the operational surface for v5 (Stack of One):
 * every product in the SZL portfolio reads the same pulse,
 * same axes, same Lambda. One trust signal for the whole stack.
 */

export type TrustTrajectory = "IMPROVING" | "DEGRADING" | "STABLE";

export interface PulseSnapshot {
  lambda: number;
  axisValues: Record<string, number>;
  timestamp: number;
}

export interface PulseReading {
  currentLambda: number;
  trajectory: TrustTrajectory;
  deltaPerSecond: number;
  windowSize: number;
  windowDurationMs: number;
  perAxisTrend: Record<string, TrustTrajectory>;
  weakestAxis: string;
  weakestAxisValue: number;
  predictedBreachMs: number | null;
  alertLevel: "NOMINAL" | "WATCH" | "ALERT" | "CRITICAL";
}

export interface ConvergencePulseConfig {
  windowSize?: number;
  stabilityThreshold?: number;
  alertThreshold?: number;
  criticalThreshold?: number;
}

const DEFAULT_CONFIG: Required<ConvergencePulseConfig> = {
  windowSize: 50,
  stabilityThreshold: 0.001,
  alertThreshold: 0.70,
  criticalThreshold: 0.50,
};

export class ConvergencePulse {
  private snapshots: PulseSnapshot[] = [];
  private config: Required<ConvergencePulseConfig>;

  constructor(config?: ConvergencePulseConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  record(snapshot: PulseSnapshot): void {
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.config.windowSize * 2) {
      this.snapshots = this.snapshots.slice(-this.config.windowSize);
    }
  }

  read(): PulseReading {
    const window = this.snapshots.slice(-this.config.windowSize);

    if (window.length === 0) {
      return {
        currentLambda: 1,
        trajectory: "STABLE",
        deltaPerSecond: 0,
        windowSize: 0,
        windowDurationMs: 0,
        perAxisTrend: {},
        weakestAxis: "none",
        weakestAxisValue: 1,
        predictedBreachMs: null,
        alertLevel: "NOMINAL",
      };
    }

    const current = window[window.length - 1]!;
    const currentLambda = current.lambda;

    const first = window[0]!;
    const durationMs = Math.max(1, current.timestamp - first.timestamp);
    const durationSec = durationMs / 1000;
    const deltaTotal = currentLambda - first.lambda;
    const deltaPerSecond = window.length > 1 ? deltaTotal / durationSec : 0;

    const trajectory: TrustTrajectory =
      Math.abs(deltaPerSecond) < this.config.stabilityThreshold
        ? "STABLE"
        : deltaPerSecond > 0
          ? "IMPROVING"
          : "DEGRADING";

    const allAxisKeys = Object.keys(current.axisValues);
    const perAxisTrend: Record<string, TrustTrajectory> = {};
    let weakestAxis = "none";
    let weakestAxisValue = 1;

    for (const axis of allAxisKeys) {
      const firstVal = first.axisValues[axis] ?? 0;
      const currentVal = current.axisValues[axis] ?? 0;
      const axisDelta = (currentVal - firstVal) / durationSec;

      perAxisTrend[axis] =
        Math.abs(axisDelta) < this.config.stabilityThreshold
          ? "STABLE"
          : axisDelta > 0
            ? "IMPROVING"
            : "DEGRADING";

      if (currentVal < weakestAxisValue) {
        weakestAxisValue = currentVal;
        weakestAxis = axis;
      }
    }

    let predictedBreachMs: number | null = null;
    if (deltaPerSecond < -this.config.stabilityThreshold) {
      const distToAlert = currentLambda - this.config.alertThreshold;
      if (distToAlert > 0) {
        predictedBreachMs = Math.round((distToAlert / Math.abs(deltaPerSecond)) * 1000);
      }
    }

    const alertLevel =
      currentLambda < this.config.criticalThreshold
        ? "CRITICAL"
        : currentLambda < this.config.alertThreshold
          ? "ALERT"
          : trajectory === "DEGRADING"
            ? "WATCH"
            : "NOMINAL";

    return {
      currentLambda,
      trajectory,
      deltaPerSecond,
      windowSize: window.length,
      windowDurationMs: durationMs,
      perAxisTrend,
      weakestAxis,
      weakestAxisValue,
      predictedBreachMs,
      alertLevel,
    };
  }

  history(): readonly PulseSnapshot[] {
    return this.snapshots;
  }

  reset(): void {
    this.snapshots = [];
  }
}
