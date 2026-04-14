import { describe, it, expect } from "vitest";
import { cn, formatDate, formatCurrency, formatNumber } from "../../lib/shared-ui/src/utils";

describe("cn (class merge utility)", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("removes falsy values", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  it("handles conditional class names", () => {
    const active = true;
    const disabled = false;
    expect(cn("base", active && "active", disabled && "disabled")).toBe("base active");
  });

  it("merges tailwind classes with proper deduplication", () => {
    const result = cn("p-2 p-4");
    expect(result).toBe("p-4");
  });

  it("returns empty string with no args", () => {
    expect(cn()).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a date string to readable format", () => {
    const result = formatDate("2024-01-15");
    expect(result).toMatch(/Jan/i);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it("accepts a Date object", () => {
    const date = new Date("2024-06-01");
    const result = formatDate(date);
    expect(result).toMatch(/Jun/i);
    expect(result).toMatch(/2024/);
  });
});

describe("formatCurrency", () => {
  it("formats a number as USD by default", () => {
    const result = formatCurrency(1000000);
    expect(result).toMatch(/\$1,000,000/);
  });

  it("accepts a custom currency", () => {
    const result = formatCurrency(500, "EUR");
    expect(result).toContain("500");
  });

  it("rounds to zero decimal places", () => {
    const result = formatCurrency(1234.56);
    expect(result).not.toContain(".");
  });
});

describe("formatNumber", () => {
  it("formats a number with commas", () => {
    expect(formatNumber(1000000)).toBe("1,000,000");
  });

  it("formats small numbers without commas", () => {
    expect(formatNumber(42)).toBe("42");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});
