/**
 * Tests for scripts/check-placeholder-empty-states.js
 *
 * Two layers of coverage:
 *   1. Unit tests around the regex matcher and allow-list logic
 *      (fast, deterministic, no file I/O).
 *   2. A repo-wide guard that runs the actual scan against the
 *      committed source tree — the build fails if any operator
 *      page reintroduces a generic placeholder string.
 */

import { describe, it, expect } from "vitest";
import {
  findPlaceholderPhrase,
  scanSource,
  runScan,
} from "./check-placeholder-empty-states.js";

describe("findPlaceholderPhrase", () => {
  it("flags JSX text node 'No data'", () => {
    expect(findPlaceholderPhrase('  <p className="x">No data</p>')).toBe(
      "No data",
    );
  });

  it("flags JSX text node 'No results found' with trailing copy", () => {
    expect(
      findPlaceholderPhrase("  <span>No results found — try again.</span>"),
    ).toBe("No results");
  });

  it("flags JSX text node 'No items found'", () => {
    expect(findPlaceholderPhrase("<div>No items found</div>")).toBe(
      "No items found",
    );
  });

  it("flags standalone string literal \"No data\"", () => {
    expect(findPlaceholderPhrase('const msg = "No data";')).toBe("No data");
  });

  it("flags standalone string literal 'No data yet.'", () => {
    expect(findPlaceholderPhrase("setMsg('No data yet.');")).toBe("No data");
  });

  it("flags template literal `No results`", () => {
    expect(findPlaceholderPhrase("setMsg(`No results`);")).toBe("No results");
  });

  it("does NOT flag long-form prose containing the phrase", () => {
    const prose =
      '"On January 15 at 14:22 UTC, Aegis SIEM detected lateral movement. No data exfiltration was confirmed. Full remediation completed."';
    expect(findPlaceholderPhrase(prose)).toBeNull();
  });

  it("does NOT flag the phrase when it appears mid-sentence", () => {
    const line =
      "summary: \"Bot Manager 1.1 applied rate-limit. No data exfiltration risk.\",";
    expect(findPlaceholderPhrase(line)).toBeNull();
  });

  it("does NOT flag unrelated text", () => {
    expect(findPlaceholderPhrase("const rows = [];")).toBeNull();
    expect(findPlaceholderPhrase("<p>Showing 12 results</p>")).toBeNull();
  });

  it("matches case-insensitively", () => {
    expect(findPlaceholderPhrase("<p>NO DATA</p>")).toBe("No data");
  });
});

describe("scanSource", () => {
  it("reports one violation per offending line, with the matched phrase", () => {
    const src = [
      "import React from 'react';",
      "export function Page() {",
      "  return <div>No data</div>;",
      "}",
    ].join("\n");
    const v = scanSource("artifacts/aegis/src/pages/fake.tsx", src);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      file: "artifacts/aegis/src/pages/fake.tsx",
      line: 3,
      match: "No data",
    });
  });

  it("respects the inline `// empty-state-lint-allow:` marker", () => {
    const src = [
      "export function Page() {",
      "  return <div>No data</div>; // empty-state-lint-allow: legacy demo screen",
      "}",
    ].join("\n");
    expect(scanSource("artifacts/vessels/src/pages/fake.tsx", src)).toHaveLength(
      0,
    );
  });

  it("flags multiple distinct violations", () => {
    const src = [
      "<p>No data</p>",
      "<span>No results found</span>",
      "<em>No items found</em>",
    ].join("\n");
    const v = scanSource("artifacts/terra/src/pages/fake.tsx", src);
    expect(v.map((x) => x.match)).toEqual([
      "No data",
      "No results",
      "No items found",
    ]);
  });
});

describe("runScan against the committed repository", () => {
  it("finds no placeholder empty-states in operator pages", () => {
    const { violations, unusedAllowlist } = runScan();
    if (violations.length > 0) {
      const detail = violations
        .map((v) => `  ${v.file}:${v.line} → "${v.match}"\n    ${v.snippet}`)
        .join("\n");
      throw new Error(
        `Placeholder empty-state strings detected. Replace with the shared ` +
          `<EmptyState /> component from @workspace/shared-ui, or add an entry ` +
          `to scripts/check-placeholder-empty-states.allowlist.json with a ` +
          `documented reason.\n\n${detail}`,
      );
    }
    if (unusedAllowlist.length > 0) {
      const detail = unusedAllowlist
        .map((a) => `  ${a.file}:${a.line} match="${a.match}" (${a.reason})`)
        .join("\n");
      throw new Error(
        `Stale allow-list entries — remove them from ` +
          `scripts/check-placeholder-empty-states.allowlist.json:\n${detail}`,
      );
    }
    expect(violations).toEqual([]);
    expect(unusedAllowlist).toEqual([]);
  });
});
