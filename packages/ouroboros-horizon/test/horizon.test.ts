import { describe, expect, it } from "vitest";
import {
  computeCapacityHorizon,
  horizonMargin,
  isAboveHorizon,
  recommendFromHorizon,
} from "../src/horizon.js";
import { asLoopId } from "../src/types.js";

describe("computeCapacityHorizon", () => {
  it("scales linearly with boundary cardinality", () => {
    const r1 = computeCapacityHorizon(asLoopId("ℓ"), {
      boundaryCardinality: 4,
      throughputPerSec: 100,
      minThroughputPerSec: 1,
    });
    const r2 = computeCapacityHorizon(asLoopId("ℓ"), {
      boundaryCardinality: 8,
      throughputPerSec: 100,
      minThroughputPerSec: 1,
    });
    expect(r2.capacityBits).toBeCloseTo(2 * r1.capacityBits, 10);
  });

  it("scales logarithmically with throughput ratio", () => {
    const r1 = computeCapacityHorizon(asLoopId("ℓ"), {
      boundaryCardinality: 4,
      throughputPerSec: 1,
      minThroughputPerSec: 1,
    });
    const r2 = computeCapacityHorizon(asLoopId("ℓ"), {
      boundaryCardinality: 4,
      throughputPerSec: 3,
      minThroughputPerSec: 1,
    });
    // log2(2) = 1, log2(4) = 2 → r2 should be 2x r1.
    expect(r2.capacityBits).toBeCloseTo(2 * r1.capacityBits, 10);
  });

  it("returns 0 when boundary is 0", () => {
    const r = computeCapacityHorizon(asLoopId("ℓ"), {
      boundaryCardinality: 0,
      throughputPerSec: 100,
    });
    expect(r.capacityBits).toBe(0);
  });

  it("respects α calibration constant", () => {
    const baseline = computeCapacityHorizon(asLoopId("ℓ"), {
      boundaryCardinality: 4,
      throughputPerSec: 100,
      alpha: 1.0,
    });
    const doubled = computeCapacityHorizon(asLoopId("ℓ"), {
      boundaryCardinality: 4,
      throughputPerSec: 100,
      alpha: 2.0,
    });
    expect(doubled.capacityBits).toBeCloseTo(2 * baseline.capacityBits, 10);
  });
});

describe("isAboveHorizon / horizonMargin", () => {
  it("isAboveHorizon true iff observed > capacity", () => {
    const r = computeCapacityHorizon(asLoopId("ℓ"), {
      boundaryCardinality: 4,
      throughputPerSec: 100,
      minThroughputPerSec: 1,
    });
    expect(isAboveHorizon(r, r.capacityBits + 0.01)).toBe(true);
    expect(isAboveHorizon(r, r.capacityBits)).toBe(false);
    expect(isAboveHorizon(r, r.capacityBits - 0.01)).toBe(false);
  });

  it("horizonMargin is observed - capacity", () => {
    const r = computeCapacityHorizon(asLoopId("ℓ"), {
      boundaryCardinality: 4,
      throughputPerSec: 100,
      minThroughputPerSec: 1,
    });
    expect(horizonMargin(r, r.capacityBits + 1.5)).toBeCloseTo(1.5, 10);
    expect(horizonMargin(r, r.capacityBits - 2)).toBeCloseTo(-2, 10);
  });
});

describe("recommendFromHorizon", () => {
  const r = computeCapacityHorizon(asLoopId("ℓ"), {
    boundaryCardinality: 4,
    throughputPerSec: 100,
    minThroughputPerSec: 1,
  });

  it("recommends SPLIT when far above capacity", () => {
    expect(recommendFromHorizon(r, r.capacityBits + 5)).toBe("SPLIT");
  });

  it("recommends MERGE when far below capacity", () => {
    expect(recommendFromHorizon(r, Math.max(0, r.capacityBits - 5))).toBe(
      "MERGE",
    );
  });

  it("recommends STEADY when within band", () => {
    expect(recommendFromHorizon(r, r.capacityBits + 0.1)).toBe("STEADY");
    expect(recommendFromHorizon(r, r.capacityBits - 0.1)).toBe("STEADY");
  });
});
