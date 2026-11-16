import { describe, expect, it } from "vitest";
import {
  ARTIFACT_DIMENSIONS,
  fullArtifactRow,
  lutarV10Audit,
  partialArtifactRow,
} from "../src/lutar-v10-audit.ts";

describe("Lutar v10 audit closure", () => {
  it("closes a complete positive matrix", () => {
    const report = lutarV10Audit([fullArtifactRow("v1", 0.5), fullArtifactRow("v2", 1)]);
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

  it("marks a complete all-zero matrix indeterminate because rho is undefined", () => {
    const report = lutarV10Audit([fullArtifactRow("v1", 0)]);
    expect(report.lambdaSum).toBe(0);
    expect(report.lambda10).toBe(0);
    expect(report.rho).toBeNull();
    expect(report.closureStatus).toBe("indeterminate");
    expect(report.auditClosed).toBe(false);
  });

  it("gives missing evidence precedence over a zero denominator", () => {
    const report = lutarV10Audit([partialArtifactRow("v0", { CODE: true }, 0)]);
    expect(report.rho).toBeNull();
    expect(report.closureStatus).toBe("open");
    expect(report.auditClosed).toBe(false);
    expect(report.missingArtifacts).toHaveLength(5);
  });

  it.each([0, Number.MIN_VALUE, 1e-15])(
    "keeps incomplete layers open even when their weight %s is invisible to rho",
    (weight) => {
      const report = lutarV10Audit([
        fullArtifactRow("v1", 1),
        partialArtifactRow("v0", { CODE: true }, weight),
      ]);
      expect(report.rho).toBeCloseTo(1, 12);
      expect(report.closureStatus).toBe("open");
      expect(report.auditClosed).toBe(false);
      expect(report.missingArtifacts).toHaveLength(5);
    }
  );

  it("requires each of the six dimensions at zero and positive weight", () => {
    for (const dimension of ARTIFACT_DIMENSIONS) {
      for (const weight of [0, 1]) {
        const artifacts = { ...fullArtifactRow("candidate").artifacts, [dimension]: false };
        const report = lutarV10Audit([
          fullArtifactRow("complete"),
          { layer: "candidate", lambdaValue: weight, artifacts },
        ]);
        expect(report.auditClosed).toBe(false);
        expect(report.closureStatus).toBe("open");
        expect(report.missingArtifacts).toEqual([{ layer: "candidate", dimension }]);
      }
    }
  });

  it("preserves closure under row permutation", () => {
    const matrix = [
      fullArtifactRow("v1", 0.5),
      partialArtifactRow("v2", { CODE: true }, 0),
      fullArtifactRow("v3", 1),
    ];
    const forward = lutarV10Audit(matrix);
    const reverse = lutarV10Audit([...matrix].reverse());
    expect(reverse.rho).toBe(forward.rho);
    expect(reverse.closureStatus).toBe(forward.closureStatus);
    expect(reverse.missingArtifacts).toEqual(forward.missingArtifacts);
  });

  it("rejects an overflowing sum before returning NaN or Infinity in JSON", () => {
    expect(() =>
      lutarV10Audit([
        fullArtifactRow("v1", Number.MAX_VALUE),
        fullArtifactRow("v2", Number.MAX_VALUE),
      ])
    ).toThrow(/sum of layer values must remain finite/);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])("rejects invalid layer value %s", (value) => {
    expect(() => lutarV10Audit([fullArtifactRow("invalid", value)])).toThrow(/must be finite/);
  });


  it("classifies all two-row artifact masks independently of their weights", () => {
    const row = (layer: string, mask: number, lambdaValue: number) => ({
      ...fullArtifactRow(layer, lambdaValue),
      artifacts: Object.fromEntries(ARTIFACT_DIMENSIONS.map((dim, index) => [
        dim, Boolean(mask & (1 << index)),
      ])) as Record<(typeof ARTIFACT_DIMENSIONS)[number], boolean>,
    });
    for (let a = 0; a < 64; a++) {
      for (let b = 0; b < 64; b++) {
        for (const wa of [0, 1, 2]) {
          for (const wb of [0, 1, 2]) {
            const report = lutarV10Audit([row("a", a, wa), row("b", b, wb)]);
            const complete = a === 63 && b === 63;
            const status = !complete ? "open" : wa + wb === 0 ? "indeterminate" : "closed";
            expect(report.closureStatus).toBe(status);
            expect(report.auditClosed).toBe(complete && wa + wb > 0);
          }
        }
      }
    }
  });

  it("rejects an empty matrix", () => {
    expect(() => lutarV10Audit([])).toThrow(/at least one layer/);
  });
});
