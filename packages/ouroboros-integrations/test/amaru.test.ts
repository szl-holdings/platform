import { describe, it, expect } from "vitest";
import {
  AmaruFleetMonitor,
  auditThreshold,
  inspectableAlert,
} from "../src/amaru.ts";

describe("AmaruFleetMonitor", () => {
  it("recommends CONTINUE when seked is stable", () => {
    const m = new AmaruFleetMonitor();
    const s = m.observe({ metricId: "cpu", horizontal: 1, vertical: 1, timestamp: 1 });
    expect(s.recommendation).toBe("CONTINUE");
  });

  it("recommends THROTTLE when saturating", () => {
    const m = new AmaruFleetMonitor();
    const s = m.observe({ metricId: "errs", horizontal: 1, vertical: 4, timestamp: 1 });
    expect(s.recommendation).toBe("THROTTLE");
  });

  it("recommends HALT when vertical (dy=0)", () => {
    const m = new AmaruFleetMonitor();
    const s = m.observe({ metricId: "halt", horizontal: 5, vertical: 0, timestamp: 1 });
    expect(s.recommendation).toBe("HALT");
  });

  it("tracks per-metric independently", () => {
    const m = new AmaruFleetMonitor();
    m.observe({ metricId: "a", horizontal: 1, vertical: 1, timestamp: 1 });
    m.observe({ metricId: "b", horizontal: 5, vertical: 0, timestamp: 2 });
    expect(m.snapshot("a")?.verdict).toBe("STABLE");
    expect(m.snapshot("b")?.verdict).toBe("VERTICAL");
  });

  it("includes degrees in signal", () => {
    const m = new AmaruFleetMonitor();
    const s = m.observe({ metricId: "deg", horizontal: 1, vertical: 1, timestamp: 1 });
    expect(s.degrees).toBeCloseTo(45, 1);
  });
});

describe("auditThreshold", () => {
  it("decomposes 2/3 = 1/2 + 1/6 (Rhind canonical)", () => {
    const a = auditThreshold(2, 3);
    expect(a.decomposition.terms).toEqual([2, 6]);
    expect(a.inspectable).toBe(true);
    expect(a.explanation).toBe("2/3 = 1/2 + 1/6 (2 terms)");
  });

  it("flags non-inspectable when terms exceed maxTerms", () => {
    const a = auditThreshold(3, 7, 2);
    expect(a.inspectable).toBe(false);
  });
});

describe("inspectableAlert", () => {
  it("packages an alert with its decomposition", () => {
    const r = inspectableAlert("cpu_high", 2, 5);
    expect(r.alertId).toBe("cpu_high");
    expect(r.audit.decomposition.terms).toEqual([3, 15]);
  });
});
