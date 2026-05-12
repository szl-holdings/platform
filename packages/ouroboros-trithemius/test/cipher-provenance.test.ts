import { describe, it, expect } from "vitest";
import { bindCipher, verifyCipher } from "../src/cipher-provenance.js";

const prov = {
  author: "Trithemius",
  work: "Polygraphiae",
  edition: "1518",
  page: "fol.12r",
};

describe("Primitive 54 — Cipher-table provenance", () => {
  it("binds and verifies", () => {
    const ct = bindCipher({ A: "1", B: "2" }, prov);
    expect(verifyCipher(ct)).toBe(true);
  });

  it("digest changes if table changes", () => {
    const a = bindCipher({ A: "1" }, prov);
    const b = bindCipher({ A: "2" }, prov);
    expect(a.digest).not.toBe(b.digest);
  });

  it("digest changes if provenance changes", () => {
    const a = bindCipher({ A: "1" }, prov);
    const b = bindCipher({ A: "1" }, { ...prov, edition: "1606" });
    expect(a.digest).not.toBe(b.digest);
  });

  it("verifyCipher fails on tampered table", () => {
    const ct = bindCipher({ A: "1" }, prov);
    const tampered = { ...ct, table: { A: "9" } };
    expect(verifyCipher(tampered)).toBe(false);
  });

  it("digest is deterministic across key order", () => {
    const a = bindCipher({ A: "1", B: "2" }, prov);
    const b = bindCipher({ B: "2", A: "1" }, prov);
    expect(a.digest).toBe(b.digest);
  });

  it("digest is 64 hex chars", () => {
    const ct = bindCipher({ A: "1" }, prov);
    expect(ct.digest).toMatch(/^[0-9a-f]{64}$/);
  });
});
