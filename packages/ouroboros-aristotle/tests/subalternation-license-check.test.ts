import { describe, it, expect } from "vitest";
import { subalternationLicenseCheck } from "../src/subalternation-license-check.js";

const lattice = {
  arithmetic: { id: "arithmetic" },
  geometry: { id: "geometry" },
  optics: { id: "optics", parent: "geometry" },
  harmonics: { id: "harmonics", parent: "arithmetic" },
  ethics: { id: "ethics" },
};

describe("subalternation-license-check (88)", () => {
  it("optics borrows from geometry — licensed", () => {
    const r = subalternationLicenseCheck({
      sourceScience: "geometry",
      targetScience: "optics",
      theoremId: "T",
      lattice,
      instantiationVerified: true,
    });
    expect(r.ok).toBe(true);
    expect(r.status).toBe("licensed");
  });

  it("harmonics borrows from arithmetic — licensed", () => {
    const r = subalternationLicenseCheck({
      sourceScience: "arithmetic",
      targetScience: "harmonics",
      theoremId: "T",
      lattice,
      instantiationVerified: true,
    });
    expect(r.ok).toBe(true);
  });

  it("optics cannot borrow from arithmetic — unlicensed", () => {
    const r = subalternationLicenseCheck({
      sourceScience: "arithmetic",
      targetScience: "optics",
      theoremId: "T",
      lattice,
      instantiationVerified: true,
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe("unlicensed");
  });

  it("ethics cannot borrow from geometry — unlicensed", () => {
    const r = subalternationLicenseCheck({
      sourceScience: "geometry",
      targetScience: "ethics",
      theoremId: "T",
      lattice,
      instantiationVerified: true,
    });
    expect(r.ok).toBe(false);
  });

  it("path exists but instantiation unverified — partial", () => {
    const r = subalternationLicenseCheck({
      sourceScience: "geometry",
      targetScience: "optics",
      theoremId: "T",
      lattice,
      instantiationVerified: false,
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe("partial");
  });

  it("path length reported", () => {
    const r = subalternationLicenseCheck({
      sourceScience: "geometry",
      targetScience: "optics",
      theoremId: "T",
      lattice,
      instantiationVerified: true,
    });
    expect(r.pathLength).toBe(1);
  });

  it("self-borrow trivially licensed", () => {
    const r = subalternationLicenseCheck({
      sourceScience: "geometry",
      targetScience: "geometry",
      theoremId: "T",
      lattice,
      instantiationVerified: true,
    });
    expect(r.ok).toBe(true);
    expect(r.pathLength).toBe(0);
  });

  it("missing target node — unlicensed", () => {
    const r = subalternationLicenseCheck({
      sourceScience: "geometry",
      targetScience: "missing-science",
      theoremId: "T",
      lattice,
      instantiationVerified: true,
    });
    expect(r.ok).toBe(false);
  });
});
