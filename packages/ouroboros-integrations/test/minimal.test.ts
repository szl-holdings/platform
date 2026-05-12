import { describe, it, expect } from "vitest";
import { lutarOmega } from "../src/lutar-formulas.ts";

describe("minimal", () => {
  it("loads lutar-formulas", () => {
    const r = lutarOmega({ L_values: [1,2,3,4,5,6] });
    expect(r.value).toBeCloseTo(3.5, 10);
  });
});
