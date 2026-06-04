/**
 * Amaru integration — fleet coordination via seked slope monitoring +
 * unit-fraction threshold inspection.
 *
 * Amaru's core problem: detect when a fleet is approaching saturation
 * (compute, cost, error rate) without false alarms. Conventional dy/dx
 * blows up near vertical asymptotes; the Egyptian seked is bounded.
 *
 * Plus: every fleet-wide threshold (alert, kill-switch, budget cap) is
 * decomposed into a sum of distinct unit fractions so the threshold is
 * inspectable by a human auditor with no floating-point drift between
 * runtime languages.
 */

import {
  computeSeked,
  SekedAuditor,
  sekedToDegrees,
  decomposeUnitFraction,
  thresholdInspectable,
  type SekedReading,
  type UnitFractionDecomposition,
} from "@workspace/reconciliation";

export interface AmaruMetricSample {
  readonly metricId: string;
  readonly horizontal: number; // dx — cost, requests, time
  readonly vertical: number; // dy — value produced, work completed
  readonly timestamp: number;
}

export interface AmaruFleetSignal {
  readonly metricId: string;
  readonly reading: SekedReading;
  readonly degrees: number;
  readonly recommendation: "CONTINUE" | "WATCH" | "THROTTLE" | "HALT";
  readonly timestamp: number;
}

export class AmaruFleetMonitor {
  private readonly auditors = new Map<string, SekedAuditor>();
  constructor(private readonly windowSize: number = 32) {}

  observe(sample: AmaruMetricSample): AmaruFleetSignal {
    let auditor = this.auditors.get(sample.metricId);
    if (!auditor) {
      auditor = new SekedAuditor(this.windowSize);
      this.auditors.set(sample.metricId, auditor);
    }
    auditor.record(sample.horizontal, sample.vertical);
    const reading = auditor.windowSeked();
    const recommendation = this.classify(reading);
    return {
      metricId: sample.metricId,
      reading,
      degrees: sekedToDegrees(reading.seked),
      recommendation,
      timestamp: sample.timestamp,
    };
  }

  snapshot(metricId: string): SekedReading | undefined {
    const a = this.auditors.get(metricId);
    return a?.windowSeked();
  }

  private classify(r: SekedReading): AmaruFleetSignal["recommendation"] {
    switch (r.verdict) {
      case "STABLE":
        return "CONTINUE";
      case "RISING":
        return "WATCH";
      case "SATURATING":
        return "THROTTLE";
      case "VERTICAL":
        return "HALT";
      default:
        return "WATCH";
    }
  }
}

export interface AmaruThresholdAudit {
  readonly raw: { p: number; q: number };
  readonly decomposition: UnitFractionDecomposition;
  readonly inspectable: boolean;
  readonly explanation: string;
}

/**
 * Make a fleet threshold inspectable by decomposing it into unit fractions.
 * Returns the decomposition plus a human-readable explanation suitable
 * for a runbook or audit report.
 */
export function auditThreshold(p: number, q: number, maxTerms = 4): AmaruThresholdAudit {
  const result = thresholdInspectable(p, q, maxTerms);
  const sum = result.decomposition.terms.map((a: number) => `1/${a}`).join(" + ");
  const explanation =
    result.decomposition.terms.length === 0
      ? `${p}/${q} is degenerate`
      : `${p}/${q} = ${sum} (${result.decomposition.terms.length} term${
          result.decomposition.terms.length === 1 ? "" : "s"
        })`;
  return {
    raw: { p, q },
    decomposition: result.decomposition,
    inspectable: result.inspectable,
    explanation,
  };
}

/**
 * Decompose any positive rational threshold (e.g., a 3/7 alert) into a
 * sum of distinct unit fractions for use across heterogeneous runtimes.
 */
export function inspectableAlert(
  alertId: string,
  p: number,
  q: number
): { alertId: string; audit: AmaruThresholdAudit } {
  return { alertId, audit: auditThreshold(p, q) };
}

// Re-export for convenience.
export { computeSeked, decomposeUnitFraction };
