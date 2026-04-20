import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";

// Vessel-class keys exposed by the live freight benchmark feed.
export type VesselClassKey =
  | "VLCC"
  | "Suezmax"
  | "Aframax"
  | "Capesize"
  | "Panamax"
  | "Supramax"
  | "Handysize"
  | "LNG Carrier";

export interface FreightBenchmark {
  key: string;
  label: string;
  dwt: string;
  color: string;
  tce: number;
  change: number;
  changePct: number;
  fleetAvg: number;
  topQuartile: number;
  bottomQuartile: number;
  routes: string[];
  forward: number[];
  pnlAlias: string[];
}

export interface FreightRouteRate {
  route: string;
  classKey: string;
  rate: number;
  change: number;
  unit: string;
}

export interface FreightHistoryPoint {
  date: string;
  index: number;
}

export interface FreightBenchmarkSnapshot {
  asOf: string;
  source: string;
  sourceUrl?: string;
  methodology: string;
  refreshIntervalSeconds: number;
  nextRefreshAt: string;
  upstreamStatus?: "live" | "stale" | "unavailable";
  upstreamLatestIndex?: number | null;
  upstreamPriorIndex?: number | null;
  upstreamYearAgoIndex?: number | null;
  upstreamObservationDate?: string | null;
  history?: FreightHistoryPoint[];
  benchmarks: FreightBenchmark[];
  benchmarksByLabel: Record<string, FreightBenchmark>;
  routes: FreightRouteRate[];
}

export function useFreightBenchmarks() {
  return useQuery<FreightBenchmarkSnapshot>({
    queryKey: ["vessels", "freight", "benchmarks"],
    queryFn: () => apiFetch<FreightBenchmarkSnapshot>("/vessels/freight/benchmarks"),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function formatAsOf(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

export interface BenchmarkComparison {
  classKey: VesselClassKey;
  benchmark: FreightBenchmark;
  voyageTce: number;
  delta: number;
  deltaPct: number;
  aboveMarket: boolean;
}

// Compare a voyage TCE against the live benchmark for the given class.
// Pass the snapshot from `useFreightBenchmarks()`.
export function compareVoyageToBenchmark(
  snapshot: FreightBenchmarkSnapshot | undefined,
  classKey: VesselClassKey | null,
  voyageTce: number,
): BenchmarkComparison | null {
  if (!snapshot || !classKey) return null;
  const benchmark = snapshot.benchmarksByLabel[classKey];
  if (!benchmark || benchmark.tce === 0) return null;
  const delta = voyageTce - benchmark.tce;
  const deltaPct = (delta / benchmark.tce) * 100;
  return {
    classKey,
    benchmark,
    voyageTce,
    delta,
    deltaPct,
    aboveMarket: delta >= 0,
  };
}

// Best-effort mapping from a free-text cargo description to the closest
// vessel class. Returns null when nothing reasonable matches. Preserved
// from the previous static benchmark module so callers that need to
// guess a class from a cargo string can still do so.
export function inferVesselClassFromCargo(cargoType: string | null | undefined): VesselClassKey | null {
  if (!cargoType) return null;
  const c = cargoType.toLowerCase();

  if (c.includes("lng") || c.includes("liquefied natural gas")) return "LNG Carrier";
  if (c.includes("crude")) return "VLCC";
  if (c.includes("fuel oil") || c.includes("refined") || c.includes("gasoline") || c.includes("diesel") || c.includes("naphtha") || c.includes("jet")) return "Aframax";
  if (c.includes("iron ore") || c.includes("coal")) return "Capesize";
  if (c.includes("grain") || c.includes("wheat") || c.includes("corn") || c.includes("soy") || c.includes("bauxite") || c.includes("cement")) return "Panamax";
  if (c.includes("steel") || c.includes("scrap") || c.includes("fertilizer") || c.includes("sugar")) return "Supramax";
  if (c.includes("bulk") || c.includes("aggregate") || c.includes("salt")) return "Handysize";

  return null;
}
