// Baltic Exchange-style TCE benchmarks per vessel class (USD/day).
// Single source of truth used by Voyage P&L, Voyage Economics, and any
// other commercial view that needs a "vs market" signal. Update values
// here so every page stays in sync.

export type VesselClassKey =
  | "VLCC"
  | "Suezmax"
  | "Aframax"
  | "Capesize"
  | "Panamax"
  | "Supramax"
  | "Handysize"
  | "LNG Carrier";

export interface ClassBenchmark {
  tce: number;
  changePct: number;
  fleetAvg: number;
  topQuartile: number;
  bottomQuartile: number;
}

export const CLASS_BENCHMARKS: Record<VesselClassKey, ClassBenchmark> = {
  VLCC:           { tce: 58200, changePct: +3.21, fleetAvg: 55400, topQuartile: 64800, bottomQuartile: 49100 },
  Suezmax:        { tce: 41600, changePct: +1.48, fleetAvg: 39800, topQuartile: 46200, bottomQuartile: 35100 },
  Aframax:        { tce: 32400, changePct: -0.92, fleetAvg: 31200, topQuartile: 36800, bottomQuartile: 27600 },
  Capesize:       { tce: 28450, changePct: +6.84, fleetAvg: 27100, topQuartile: 32500, bottomQuartile: 23400 },
  Panamax:        { tce: 16280, changePct: -2.05, fleetAvg: 16100, topQuartile: 18900, bottomQuartile: 14200 },
  Supramax:       { tce: 13840, changePct: +1.61, fleetAvg: 13500, topQuartile: 15800, bottomQuartile: 11600 },
  Handysize:      { tce: 12150, changePct: +4.11, fleetAvg: 11900, topQuartile: 13700, bottomQuartile: 10400 },
  "LNG Carrier":  { tce: 78500, changePct: +5.42, fleetAvg: 74200, topQuartile: 86400, bottomQuartile: 64800 },
};

// Best-effort mapping from a free-text cargo description to the closest
// Baltic vessel class. Returns null when nothing reasonable matches.
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

export interface BenchmarkComparison {
  classKey: VesselClassKey;
  benchmark: ClassBenchmark;
  voyageTce: number;
  delta: number;
  deltaPct: number;
  aboveMarket: boolean;
}

// Computes the "vs Baltic" comparison for a voyage given its TCE and class.
export function compareVoyageToBenchmark(
  classKey: VesselClassKey | null,
  voyageTce: number,
): BenchmarkComparison | null {
  if (!classKey) return null;
  const benchmark = CLASS_BENCHMARKS[classKey];
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
