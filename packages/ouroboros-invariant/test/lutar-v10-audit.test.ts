import { describe, expect, it } from "vitest";
import {
  fullArtifactRow,
  lutarV10Audit,
  partialArtifactRow,
} from "../src/lutar-v10-audit.ts";

describe("Lutar v10 audit closure", () => {
  it("closes a complete positive matrix", () => {
    const report = lutarV10Audit([
      fullArtifactRow("v1", 0.5),
      fullArtifactRow("v2", 1),
    ]);

    expect(report.lambdaSum).toBe(1.5);
    expect(report.lambda10).toBe(1.5);
    expect(report.rho).toBeCloseTo(1, 12);
    expect(report.closureStatus).toBe("closed");
    expect(report.auditClosed).toBe(true);
    expect(report.missingArtifacts).toEqual([]);
  });

  it("stays open when an artifact cell is missing", () => {
    const report = lutarV10Audit([
      fullArtifactRow("v1", 1),
      partialArtifactRow("v2", { CODE: true }, 1),
    ]);

    expect(report.rho).toBeCloseTo(0.5, 12);
    expect(report.closureStatus).toBe("open");
    expect(report.auditClosed).toBe(false);
    expect(report.missingArtifacts).toHaveLength(5);
  });

  it("marks an all-zero matrix indeterminate because rho is undefined", () => {
    const report = lutarV10Audit([fullArtifactRow("v1", 0)]);

    expect(report.lambdaSum).toBe(0);
    expect(report.lambda10).toBe(0);
    expect(report.rho).toBeNull();
    expect(report.closureStatus).toBe("indeterminate");
    expect(report.auditClosed).toBe(false);
  });

  it("keeps a zero-valued incomplete row open when another layer is positive", () => {
    const report = lutarV10Audit([
      fullArtifactRow("v1", 1),
      partialArtifactRow("v0", { CODE: true }, 0),
    ]);

    expect(report.rho).toBeCloseTo(1, 12);
    expect(report.closureStatus).toBe("open");
    expect(report.auditClosed).toBe(false);
    expect(report.missingArtifacts).toHaveLength(5);
  });

  it("rejects an empty matrix", () => {
    expect(() => lutarV10Audit([])).toThrow(/at least one layer/);
  });
});
