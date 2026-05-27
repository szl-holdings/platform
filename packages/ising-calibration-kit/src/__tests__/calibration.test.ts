import { describe, expect, it } from "vitest";
import { composeCalibrationChain } from "../calibration.js";

const experiment = {
  id: "t1-measurement",
  label: "T1 relaxation measurement",
  paramSchema: { qubit: "string" },
};

const policy = {
  driftFloor: 0.01,
  correctionThreshold: 0.05,
  rollbackThreshold: 0.5,
};

const declared = { weights: { p_x: 0.001, p_z: 0.002 }, version: "v1" };
const lastKnownGood = { weights: { p_x: 0.001, p_z: 0.002 }, version: "v0" };

describe("composeCalibrationChain", () => {
  it("returns noop chain when fitted weights match declared", () => {
    const chain = composeCalibrationChain({
      experiment,
      measurement: {
        experimentId: "t1-measurement",
        values: { mean: 0.001 },
        timestampMs: 1,
      },
      declared,
      fitted: { p_x: 0.001, p_z: 0.002 },
      lastKnownGood,
      policy,
    });
    expect(chain.action).toBe("noop");
    expect(chain.driftRef).toBeNull();
    expect(chain.correctionRef).toBeNull();
    expect(chain.rollbackRef).toBeNull();
  });

  it("emits drift receipt but no action when above floor below correction", () => {
    const chain = composeCalibrationChain({
      experiment,
      measurement: {
        experimentId: "t1-measurement",
        values: { mean: 0.001 },
        timestampMs: 1,
      },
      declared,
      fitted: { p_x: 0.020, p_z: 0.002 },
      lastKnownGood,
      policy,
    });
    expect(chain.action).toBe("noop");
    expect(chain.driftRef).not.toBeNull();
    expect(chain.correctionRef).toBeNull();
  });

  it("emits correction when drift crosses correctionThreshold", () => {
    const chain = composeCalibrationChain({
      experiment,
      measurement: {
        experimentId: "t1-measurement",
        values: { mean: 0.1 },
        timestampMs: 1,
      },
      declared,
      fitted: { p_x: 0.1, p_z: 0.002 },
      lastKnownGood,
      policy,
    });
    expect(chain.action).toBe("corrected");
    expect(chain.correctionRef).not.toBeNull();
    expect(chain.rollbackRef).toBeNull();
  });

  it("rolls back when drift crosses rollbackThreshold", () => {
    const chain = composeCalibrationChain({
      experiment,
      measurement: {
        experimentId: "t1-measurement",
        values: { mean: 0.9 },
        timestampMs: 1,
      },
      declared,
      fitted: { p_x: 0.9, p_z: 0.002 },
      lastKnownGood,
      policy,
    });
    expect(chain.action).toBe("rolled-back");
    expect(chain.rollbackRef).not.toBeNull();
    expect(chain.correctionRef).toBeNull();
  });

  it("rejects inconsistent policy thresholds", () => {
    expect(() =>
      composeCalibrationChain({
        experiment,
        measurement: {
          experimentId: "t1-measurement",
          values: {},
          timestampMs: 1,
        },
        declared,
        fitted: declared.weights,
        lastKnownGood,
        policy: {
          driftFloor: 0.5,
          correctionThreshold: 0.05,
          rollbackThreshold: 0.5,
        },
      }),
    ).toThrow(/driftFloor.*correctionThreshold.*rollbackThreshold/);
  });

  it("rejects measurement bound to wrong experiment", () => {
    expect(() =>
      composeCalibrationChain({
        experiment,
        measurement: {
          experimentId: "other",
          values: {},
          timestampMs: 1,
        },
        declared,
        fitted: declared.weights,
        lastKnownGood,
        policy,
      }),
    ).toThrow(/measurement\.experimentId.*experiment\.id/);
  });
});
