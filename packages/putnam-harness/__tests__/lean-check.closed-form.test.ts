// End-to-end test for the closed-form Lean adapter.
//
// The honesty contract documented in `.agents/memory/putnam-harness-honesty.md`
// requires that `lake` not being on PATH yields a falsy receipt — never a
// fabricated green. The first test pins that. The remaining tests run
// against the real Lake project IFF a toolchain is available; otherwise
// they are skipped at runtime so the suite stays green on a vanilla
// checkout without forcing every test runner to bootstrap elan.

import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { checkClosedFormStub } from "../src/lean-check.js";

const execFileAsync = promisify(execFile);

async function lakeAvailable(): Promise<boolean> {
  try {
    await execFileAsync("lake", ["--version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

describe("checkClosedFormStub", () => {
  it("reports honestly when the working directory is bogus", async () => {
    // When lake is missing OR the cwd doesn't exist, the call must NOT
    // fabricate a green. Either toolchainAvailable is false (lake not on
    // PATH) or elaborated is false (lake ran but failed) — never both
    // true.
    const result = await checkClosedFormStub("def x : Nat := 0", {
      leanFormulasDir: "/nonexistent/lean-formulas",
      timeoutMs: 5000,
    });
    expect(result.mode).toBe("lake");
    if (result.toolchainAvailable) {
      expect(result.elaborated).toBe(false);
    } else {
      expect(result.elaborated).toBe(false);
      expect(result.stderr).toMatch(/lake/i);
    }
  });

  it("elaborates a valid ClosedFormClaim stub via lake env lean", async () => {
    if (!(await lakeAvailable())) {
      return; // skipped on runners without elan
    }
    const stub = `import LeanFormulas.Putnam.Closed
open LeanFormulas.Putnam.Closed

def myAnswer : ClosedFormClaim Nat :=
  { year := 2025, problemIdx := 4, answer := 7 }

theorem myAnswer_idx : myAnswer.problemIdx = 4 := rfl
`;
    const result = await checkClosedFormStub(stub, { timeoutMs: 60_000 });
    expect(result.toolchainAvailable).toBe(true);
    expect(result.mode).toBe("lake");
    expect(result.elaborated).toBe(true);
    expect(result.proofProvided).toBe(true);
  });

  it("fails honestly on a syntactically invalid stub", async () => {
    if (!(await lakeAvailable())) {
      return;
    }
    const stub = `import LeanFormulas.Putnam.Closed
def broken : Nat := "this is not a Nat"
`;
    const result = await checkClosedFormStub(stub, { timeoutMs: 60_000 });
    expect(result.toolchainAvailable).toBe(true);
    expect(result.elaborated).toBe(false);
  });
});
