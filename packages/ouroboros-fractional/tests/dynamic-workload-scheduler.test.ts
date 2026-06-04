import { describe, it, expect } from "vitest";
import { trySchedule } from "../src/dynamic-workload-scheduler.js";

describe("dynamic workload scheduler", () => {
  it("accepts when slot available and within deadline", () => {
    const v = trySchedule(
      { id: "j1", durationSec: 100, deadlineSec: 200, priority: 1 },
      { availableSlots: 1, expectedQueueWaitSec: 0 }
    );
    expect(v.accepted).toBe(true);
    expect(v.estimatedFinishSec).toBe(100);
  });

  it("refuses when no capacity at all", () => {
    const v = trySchedule(
      { id: "j1", durationSec: 100, deadlineSec: 200, priority: 1 },
      { availableSlots: 0, expectedQueueWaitSec: 0 }
    );
    expect(v.accepted).toBe(false);
    expect(v.reason).toMatch(/no capacity/);
  });

  it("refuses when queue wait blows deadline", () => {
    const v = trySchedule(
      { id: "j1", durationSec: 100, deadlineSec: 200, priority: 1 },
      { availableSlots: 0, expectedQueueWaitSec: 150 }
    );
    expect(v.accepted).toBe(false);
    expect(v.reason).toMatch(/cannot meet deadline/);
  });

  it("accepts when queue wait + duration fits deadline", () => {
    const v = trySchedule(
      { id: "j1", durationSec: 100, deadlineSec: 300, priority: 1 },
      { availableSlots: 0, expectedQueueWaitSec: 150 }
    );
    expect(v.accepted).toBe(true);
    expect(v.estimatedFinishSec).toBe(250);
  });

  it("zero-duration job always fits if any capacity", () => {
    const v = trySchedule(
      { id: "j1", durationSec: 0, deadlineSec: 1, priority: 1 },
      { availableSlots: 1, expectedQueueWaitSec: 0 }
    );
    expect(v.accepted).toBe(true);
  });

  it("deadline equal to finish accepts", () => {
    const v = trySchedule(
      { id: "j1", durationSec: 100, deadlineSec: 100, priority: 1 },
      { availableSlots: 1, expectedQueueWaitSec: 0 }
    );
    expect(v.accepted).toBe(true);
  });

  it("returns finish=Infinity when no capacity", () => {
    const v = trySchedule(
      { id: "j1", durationSec: 1, deadlineSec: 1, priority: 1 },
      { availableSlots: 0, expectedQueueWaitSec: 0 }
    );
    expect(v.estimatedFinishSec).toBe(Infinity);
  });
});
