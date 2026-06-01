# LAKE_BUILD_LOG.md — Honest record of the Lean build attempt

**Signed: Yachay. Co-authored-by: Perplexity Computer Agent.**

## Summary (honest)

A full `lake build` of `PuriqFormulaLean.lean` **could not be completed in this sandbox**.
The reason is **NOT** a code error in the appended `§AD2` theorems — it is an
**environment limit**: the sandbox disk is full, so the Mathlib dependency cannot be
fetched, and no Mathlib build cache is present. Per the hard rule ("if it fails for a
non-auth reason, document honestly and stop for that target"), this is documented and not
faked.

## Environment facts

- **Toolchain (correct):** `Lean (version 4.13.0, x86_64-unknown-linux-gnu, commit
  6d22e0e5cc5a, Release)`; `Lake version 5.0.0-6d22e0e`. Matches
  `lutar-lean/lean-toolchain` = `leanprover/lean4:v4.13.0`.
- **Project:** `/home/user/workspace/szl/lutar-lean/` — `lakefile.lean` requires
  `mathlib from git @ "v4.13.0"`. `lake-manifest.json` is present (batteries, Qq, aesop,
  mathlib, …) but `.lake/packages/` is **empty** (deps never fetched; no Mathlib cache).
- **Disk:** `/dev/root 22G, 21G used, ~433M available, 98% full`.
- The Lean file's imports require the full Mathlib (`Mathlib.Data.Real.Basic`,
  `Mathlib.Analysis.SpecialFunctions.*`, `Mathlib.Tactic`, …) — multi-GB to fetch/build.

## The actual command + output (verbatim)

```
$ cd /home/user/workspace/szl/lutar-lean && lake build
info: mathlib: cloning https://github.com/leanprover-community/mathlib4.git to '././.lake/packages/mathlib'
trace: .> git clone https://github.com/leanprover-community/mathlib4.git ././.lake/packages/mathlib
trace: stderr:
Cloning into '././.lake/packages/mathlib'...
fatal: write error: No space left on device
fatal: fetch-pack: invalid index-pack output
error: external command 'git' exited with code 128
```

Lake fails at the very first step — cloning Mathlib — with `git` exit code 128 due to
`No space left on device`. The partial clone was removed afterward to recover space; the
disk remained ~98% full (the base image itself is large). A `lake exe cache get` (the
normal way to avoid building Mathlib from scratch) also requires fetching the cache
tarballs, which needs the same unavailable disk.

## What WAS verified about the Lean patch without a full build

- **Syntactic structure** of `§AD2` reviewed line-by-line (see `LEAN_PATCHES.md`); it uses
  only standard Lean 4 / Mathlib constructs (`structure`, `def`, `theorem`, `Finset.card`,
  `omega`, re-exports).
- **All referenced symbols exist earlier in the same file** (`khipu_append_only`,
  `insertMany`, `khipu_insertMany_length`, `verifyInclusion_sound`,
  `khipu_inclusion_proof_correct`, `CanonicalHash`, `MerkleProof`, `KhipuDAG`) — confirmed
  by grep (each appears as a definition plus uses), so the re-exports are not dangling.
- A standalone parse of just `§AD2` is not meaningful in isolation because the section
  depends on Mathlib + the earlier Khipu definitions in the same compilation unit.

## Recommendation to the founder

Run `lake exe cache get && lake build` on a host with adequate disk (Mathlib v4.13.0 build
or cache needs several GB free) to obtain the green check for the two new
`SORRY_PURIQ_OPEN[AD2-RS]` / `[25]` obligations' surrounding code. The math content of the
remaining sorries is independently exercised by the passing Python R-S round-trip tests
([Reed & Solomon 1960](https://doi.org/10.1137/0108018)).
