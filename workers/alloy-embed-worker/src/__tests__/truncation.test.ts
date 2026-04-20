import { describe, it, expect } from "vitest";
import { applyTruncation, applyTruncationBatch } from "../truncation.js";

describe("applyTruncation", () => {
  it("returns text unchanged when below char limit", () => {
    const text = "hello world";
    const result = applyTruncation(text, 512, "truncate");
    expect(result.text).toBe(text);
    expect(result.wasTruncated).toBe(false);
  });

  it("truncates long text and sets wasTruncated = true", () => {
    const text = "a".repeat(10000);
    const result = applyTruncation(text, 10, "truncate");
    expect(result.wasTruncated).toBe(true);
    expect(result.text.length).toBeLessThan(text.length);
  });

  it("reject policy throws on overlong text", () => {
    expect(() => applyTruncation("a".repeat(1000), 10, "reject")).toThrow();
  });

  it("handles empty string", () => {
    const result = applyTruncation("", 512, "truncate");
    expect(result.text).toBe("");
    expect(result.wasTruncated).toBe(false);
  });
});

describe("applyTruncationBatch", () => {
  it("returns anyTruncated = false when all texts fit", () => {
    const { anyTruncated } = applyTruncationBatch(["hello", "world"], 512, "truncate");
    expect(anyTruncated).toBe(false);
  });

  it("returns anyTruncated = true when any text is truncated", () => {
    const { anyTruncated } = applyTruncationBatch(["short", "a".repeat(10000)], 10, "truncate");
    expect(anyTruncated).toBe(true);
  });
});
