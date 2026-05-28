/**
 * a15_metrics.ts — Prometheus exporters for A15 Persistent Homology Runtime
 *
 * References
 * ----------
 * [1] Prometheus data model: https://prometheus.io/docs/concepts/data_model/
 * [2] Edelsbrunner et al. 2002 (see persistent_homology_check.ts for full cite)
 */

import type { H0CheckResult } from "./persistent_homology_check.js";

// ─────────────────────────────────────────────────────────────────────────────
// Label helpers (re-uses the same pattern as prometheus-exporter.ts)
// ─────────────────────────────────────────────────────────────────────────────

function renderLabels(labels: Record<string, string>): string {
  const parts = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return parts.length > 0 ? `{${parts.join(",")}}` : "";
}

// ─────────────────────────────────────────────────────────────────────────────
// A15 Metrics Registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prometheus metric names (all prefixed szl_a15_*):
 *
 * szl_a15_component_count         gauge   β_0 at last check per epsilon label
 * szl_a15_betti0                  gauge   same as component_count (alias, explicit)
 * szl_a15_invariant_satisfied     gauge   1 if A15 ok, 0 if violated
 * szl_a15_persistence_max         gauge   max finite persistence observed
 * szl_a15_check_total             counter number of checks run
 * szl_a15_violation_total         counter cumulative A15 violations
 * szl_a15_diagram_intervals       gauge   number of H_0 intervals in last diagram
 */

interface GaugeEntry { value: number; labels: Record<string, string> }
interface CounterEntry { value: number; labels: Record<string, string> }

class A15MetricsRegistry {
  private componentCount = new Map<string, GaugeEntry>();
  private betti0 = new Map<string, GaugeEntry>();
  private invariantSatisfied = new Map<string, GaugeEntry>();
  private persistenceMax = new Map<string, GaugeEntry>();
  private checkTotal = new Map<string, CounterEntry>();
  private violationTotal = new Map<string, CounterEntry>();
  private diagramIntervals = new Map<string, GaugeEntry>();

  private key(labels: Record<string, string>): string {
    return Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}="${v}"`).join(",");
  }

  private setGauge(map: Map<string, GaugeEntry>, labels: Record<string, string>, value: number): void {
    map.set(this.key(labels), { value, labels });
  }

  private incCounter(map: Map<string, CounterEntry>, labels: Record<string, string>, delta = 1): void {
    const k = this.key(labels);
    const existing = map.get(k);
    if (existing) existing.value += delta;
    else map.set(k, { value: delta, labels });
  }

  /**
   * Record an H_0 check result.
   * @param result The result from PersistentHomologyChecker.check()
   * @param epsilonLabel Human-readable label for the epsilon used
   * @param checkName Optional name for multi-site instrumentation
   */
  record(result: H0CheckResult, epsilonLabel: string, checkName = "default"): void {
    const labels: Record<string, string> = { epsilon: epsilonLabel, check: checkName };

    this.setGauge(this.componentCount, labels, result.componentCount);
    this.setGauge(this.betti0, labels, result.betti0);
    this.setGauge(this.invariantSatisfied, labels, result.a15Satisfied ? 1 : 0);

    // Max finite persistence
    const finitePeristences = result.diagram
      .map((iv) => iv.persistence)
      .filter((p) => isFinite(p));
    const maxPersistence = finitePeristences.length > 0 ? Math.max(...finitePeristences) : 0;
    this.setGauge(this.persistenceMax, labels, maxPersistence);

    this.setGauge(this.diagramIntervals, labels, result.diagram.length);

    this.incCounter(this.checkTotal, labels);
    if (!result.a15Satisfied) {
      this.incCounter(this.violationTotal, labels);
    }
  }

  renderText(): string {
    const lines: string[] = [];

    const gauge = (name: string, help: string, map: Map<string, GaugeEntry>) => {
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} gauge`);
      for (const e of map.values()) {
        lines.push(`${name}${renderLabels(e.labels)} ${e.value}`);
      }
    };

    const counter = (name: string, help: string, map: Map<string, CounterEntry>) => {
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} counter`);
      for (const e of map.values()) {
        lines.push(`${name}${renderLabels(e.labels)} ${e.value}`);
      }
    };

    gauge(
      "szl_a15_component_count",
      "H_0 connected component count (beta_0) at last check [Edelsbrunner et al. 2002]",
      this.componentCount
    );
    gauge(
      "szl_a15_betti0",
      "Betti number beta_0 at last check",
      this.betti0
    );
    gauge(
      "szl_a15_invariant_satisfied",
      "1 if A15 connectivity invariant satisfied, 0 if violated (Doctrine v6 §9.1)",
      this.invariantSatisfied
    );
    gauge(
      "szl_a15_persistence_max",
      "Maximum finite H_0 persistence observed in last diagram",
      this.persistenceMax
    );
    gauge(
      "szl_a15_diagram_intervals",
      "Number of H_0 persistence intervals in last diagram",
      this.diagramIntervals
    );
    counter(
      "szl_a15_check_total",
      "Total A15 persistent homology checks run",
      this.checkTotal
    );
    counter(
      "szl_a15_violation_total",
      "Total A15 connectivity invariant violations",
      this.violationTotal
    );

    lines.push("# EOF");
    return lines.join("\n") + "\n";
  }
}

export const a15Metrics = new A15MetricsRegistry();
