/**
 * Primitive 78 — Rack-scale resiliency / fallback priority
 *
 * Inspired by Google Cloud GTC 2026: proactive fault detection scans,
 * configurable hardware resiliency, fallback priorities for rack-scale
 * NVL72 systems. The receipt: every job declares an ordered fallback
 * list, and on degradation the scheduler MUST pick the highest-
 * priority surviving target — never silently drop or stall.
 */

export interface ResiliencyTarget {
  id: string;
  priority: number; // lower number = higher priority
  healthy: boolean;
}

export interface ResiliencySelection {
  selectedId: string | null;
  fellBackFromIds: string[];
  reason: string;
}

export function selectFallback(targets: ResiliencyTarget[]): ResiliencySelection {
  const sorted = [...targets].sort((a, b) => a.priority - b.priority);
  const fellBack: string[] = [];
  for (const t of sorted) {
    if (t.healthy) {
      return {
        selectedId: t.id,
        fellBackFromIds: fellBack,
        reason: fellBack.length === 0 ? "primary healthy" : `fell back past ${fellBack.length} unhealthy`,
      };
    }
    fellBack.push(t.id);
  }
  return { selectedId: null, fellBackFromIds: fellBack, reason: "no healthy target" };
}

export interface FaultScan {
  deviceId: string;
  scannedAt: string;
  faults: string[];
}

export function shouldDrain(scan: FaultScan, criticalFaults: string[]): boolean {
  return scan.faults.some((f) => criticalFaults.includes(f));
}
