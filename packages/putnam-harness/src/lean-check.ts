// Lean 4 syntactic check — the matharena Putnam-2025 dataset is proof-style,
// so we cannot machine-verify the FULL proof in Lean (PutnamBench has Lean
// stubs but not for the 2025 set yet). What we CAN do is have the candidate
// model emit a Lean 4 *theorem statement* for the problem and verify that it
// parses + elaborates against pure Lean 4 (no mathlib) — a "the candidate
// understood the problem well enough to encode its formal claim" gauge.
//
// If `lake` / `lean` are not on PATH we honestly report `elaborated: false`
// with reason "toolchain-unavailable" rather than fabricating a pass.

import { execFile } from "node:child_process";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const execFileAsync = promisify(execFile);

export interface LeanCheckResult {
  readonly stub: string;
  readonly elaborated: boolean;
  readonly proofProvided: boolean;
  readonly stderr: string;
  readonly toolchainAvailable: boolean;
}

export async function checkLeanStub(stub: string): Promise<LeanCheckResult> {
  let toolchainAvailable = true;
  try {
    await execFileAsync("lean", ["--version"], { timeout: 5000 });
  } catch {
    toolchainAvailable = false;
  }
  if (!toolchainAvailable) {
    return {
      stub,
      elaborated: false,
      proofProvided: /by\s+\w|:=\s*\w/.test(stub),
      stderr: "lean toolchain not on PATH (elan not initialised in this shell)",
      toolchainAvailable: false,
    };
  }
  const hash = createHash("sha256").update(stub).digest("hex").slice(0, 12);
  const dir = join(tmpdir(), `putnam-lean-${hash}`);
  await mkdir(dir, { recursive: true });
  const file = join(dir, "Putnam.lean");
  // Wrap the stub so a bare `theorem foo : P := sorry` parses without an
  // import; the candidate may include its own imports above the stub.
  await writeFile(file, stub + "\n", "utf8");
  try {
    const { stderr } = await execFileAsync("lean", [file], { timeout: 60000 });
    return {
      stub,
      elaborated: true,
      proofProvided: !/sorry/.test(stub),
      stderr: stderr.slice(0, 2000),
      toolchainAvailable: true,
    };
  } catch (err) {
    const e = err as { stderr?: string; message?: string };
    return {
      stub,
      elaborated: false,
      proofProvided: !/sorry/.test(stub),
      stderr: (e.stderr ?? e.message ?? "lean failed").slice(0, 2000),
      toolchainAvailable: true,
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
