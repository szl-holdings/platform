// Lean 4 syntactic check — the matharena Putnam-2025 dataset is proof-style,
// so we cannot machine-verify the FULL proof in Lean (PutnamBench has Lean
// stubs but not for the 2025 set yet). What we CAN do is have the candidate
// model emit a Lean 4 *theorem statement* for the problem and verify that it
// parses + elaborates against pure Lean 4 (no mathlib) — a "the candidate
// understood the problem well enough to encode its formal claim" gauge.
//
// For the small subset of Putnam problems that admit a closed-form numeric
// answer (e.g. "find the minimal k such that …"), `checkClosedFormStub`
// elaborates the candidate's stub *inside* the `packages/lean-formulas` Lake
// project via `lake env lean`, so the stub can `import
// LeanFormulas.Putnam.Closed` and wrap its answer as a typed
// `ClosedFormClaim`. A passing elaboration there is a genuine type-check
// against the schema, not just a parse.
//
// If `lake` / `lean` are not on PATH we honestly report `elaborated: false`
// with reason "toolchain-unavailable" rather than fabricating a pass — the
// honesty rule documented in `.agents/memory/putnam-harness-honesty.md`.

import { execFile } from "node:child_process";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const execFileAsync = promisify(execFile);

export interface LeanCheckResult {
  readonly stub: string;
  readonly elaborated: boolean;
  readonly proofProvided: boolean;
  readonly stderr: string;
  readonly toolchainAvailable: boolean;
  /** Which Lean entry point ran the check: `lean` for standalone stubs,
   * `lake` for stubs elaborated inside the `lean-formulas` package
   * (closed-form path). */
  readonly mode: "lean" | "lake";
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
      mode: "lean",
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
      mode: "lean",
    };
  } catch (err) {
    const e = err as { stderr?: string; message?: string };
    return {
      stub,
      elaborated: false,
      proofProvided: !/sorry/.test(stub),
      stderr: (e.stderr ?? e.message ?? "lean failed").slice(0, 2000),
      toolchainAvailable: true,
      mode: "lean",
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

// --------------------------------------------------------------------------
// Closed-form adapter
// --------------------------------------------------------------------------

/** Path to `packages/lean-formulas/`, resolved from this module's location
 * so tests/CLI callers don't need to pass it. */
function defaultLeanFormulasDir(): string {
  // src/lean-check.ts → packages/putnam-harness/src/ → ../../lean-formulas
  // dist/lean-check.js → packages/putnam-harness/dist/ → ../../lean-formulas
  const here = fileURLToPath(new URL(".", import.meta.url));
  return resolve(here, "..", "..", "lean-formulas");
}

export interface ClosedFormCheckOptions {
  /** Override `packages/lean-formulas/` location. Defaults to the sibling
   * package resolved from this module's path. */
  readonly leanFormulasDir?: string;
  /** Override the toolchain-probe + elaboration timeout (ms). */
  readonly timeoutMs?: number;
}

/** Same `LeanCheckResult` shape but for the closed-form path: the stub is
 * elaborated *inside* the `lean-formulas` Lake project so it can
 * `import LeanFormulas.Putnam.Closed` and wrap its answer as a
 * `ClosedFormClaim`.
 *
 * Honesty rules (mirror `.agents/memory/putnam-harness-honesty.md`):
 * - `lake` not on PATH ⇒ `toolchainAvailable: false, elaborated: false`.
 * - Elaboration succeeds ⇒ `elaborated: true`. This means the stub's
 *   answer term has the declared type. It does NOT mean the answer
 *   matches the official Putnam answer key — that's a separate equality
 *   theorem the candidate must include and `rfl`-prove against an
 *   official-answer constant.
 */
export async function checkClosedFormStub(
  stub: string,
  options: ClosedFormCheckOptions = {},
): Promise<LeanCheckResult> {
  const timeout = options.timeoutMs ?? 120_000;
  const leanFormulasDir = options.leanFormulasDir ?? defaultLeanFormulasDir();

  let toolchainAvailable = true;
  try {
    await execFileAsync("lake", ["--version"], {
      timeout: 5000,
      cwd: leanFormulasDir,
    });
  } catch {
    toolchainAvailable = false;
  }
  if (!toolchainAvailable) {
    return {
      stub,
      elaborated: false,
      proofProvided: /by\s+\w|:=\s*\w/.test(stub),
      stderr:
        "lake toolchain not on PATH (elan not initialised in this shell); " +
        "run scripts/check-lean-build.sh once to self-bootstrap elan",
      toolchainAvailable: false,
      mode: "lake",
    };
  }

  // Write the stub into a hash-named file inside the package so
  // `lake env lean` resolves `import LeanFormulas.Putnam.Closed` via the
  // package's own oleans. The directory is gitignored via .gitignore at
  // the package root (`.putnam-stubs/`).
  const hash = createHash("sha256").update(stub).digest("hex").slice(0, 12);
  const stubsDir = join(leanFormulasDir, ".putnam-stubs");
  const stubFile = join(stubsDir, `Stub_${hash}.lean`);
  await mkdir(stubsDir, { recursive: true });
  await writeFile(stubFile, stub + "\n", "utf8");
  try {
    const { stderr } = await execFileAsync(
      "lake",
      ["env", "lean", stubFile],
      { timeout, cwd: leanFormulasDir },
    );
    return {
      stub,
      elaborated: true,
      proofProvided: !/sorry/.test(stub),
      stderr: stderr.slice(0, 2000),
      toolchainAvailable: true,
      mode: "lake",
    };
  } catch (err) {
    const e = err as { stderr?: string; stdout?: string; message?: string };
    return {
      stub,
      elaborated: false,
      proofProvided: !/sorry/.test(stub),
      stderr: (e.stderr ?? e.stdout ?? e.message ?? "lake env lean failed")
        .slice(0, 2000),
      toolchainAvailable: true,
      mode: "lake",
    };
  } finally {
    await rm(stubFile, { force: true }).catch(() => undefined);
  }
}
