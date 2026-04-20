import type { PlatformFacts, StructuralFacts } from "./schema.js";
import { PLATFORM_FACTS } from "./registry.js";

export interface DriftReport {
  passed: boolean;
  driftItems: DriftItem[];
  summary: string;
}

export interface DriftItem {
  fact: string;
  registryValue: number | string;
  observedValue: number | string;
  delta: number | string;
  severity: "error" | "warning" | "info";
}

/**
 * Validate the registry against provided ground-truth counts.
 * Used by scripts/validate-platform-facts.ts to catch drift.
 */
export function validateFacts(
  observed: Partial<StructuralFacts>,
  registry: PlatformFacts = PLATFORM_FACTS,
): DriftReport {
  const items: DriftItem[] = [];

  const checks: Array<{
    fact: keyof StructuralFacts;
    tolerance?: number;
    severity?: DriftItem["severity"];
  }> = [
    { fact: "packageCount", tolerance: 2 },
    { fact: "libCount", tolerance: 1 },
    { fact: "workerCount", tolerance: 0 },
    { fact: "serviceCount", tolerance: 0 },
    { fact: "appCount", tolerance: 0 },
    { fact: "artifactCount", tolerance: 2 },
    { fact: "activeArtifactCount", tolerance: 1 },
  ];

  for (const check of checks) {
    const registryVal = registry.structural[check.fact];
    const observedVal = observed[check.fact];

    if (observedVal === undefined) continue;

    const delta = Math.abs((observedVal as number) - (registryVal as number));
    const tolerance = check.tolerance ?? 0;

    if (delta > tolerance) {
      items.push({
        fact: `structural.${check.fact}`,
        registryValue: registryVal,
        observedValue: observedVal,
        delta,
        severity: delta > tolerance * 3 ? "error" : "warning",
      });
    }
  }

  const errorCount = items.filter((i) => i.severity === "error").length;
  const warnCount = items.filter((i) => i.severity === "warning").length;

  return {
    passed: errorCount === 0,
    driftItems: items,
    summary:
      items.length === 0
        ? "No drift detected — registry matches observed filesystem state."
        : `Drift detected: ${errorCount} error(s), ${warnCount} warning(s). Run \`pnpm run generate-platform-metrics\` to regenerate.`,
  };
}
