---
name: Lean toolchain on Replit
description: Where elan installs and how to expose lake/lean to workflows; mathlib build cost reality.
---

`elan` installs the Lean toolchain under `~/.elan/bin/{lake,lean,elan}`. The workflow runner does **not** include `~/.elan/bin` (nor `~/.local/bin`) on its PATH — only nix store dirs plus `/home/runner/workspace/node_modules/.bin`, `/home/runner/workspace/.config/npm/node_global/bin`, and `/home/runner/workspace/.pythonlibs/bin`.

To make `lake build` resolvable from a workflow whose command literally says `lake build`:
```
ln -sf $HOME/.elan/bin/lake /home/runner/workspace/node_modules/.bin/lake
ln -sf $HOME/.elan/bin/lean /home/runner/workspace/node_modules/.bin/lean
```
Editing the workflow command itself via `configureWorkflow` is the cleaner path but can be blocked by the phantom-workflow-counter bug (see `artifact-toml-and-configure-workflow.md`).

**Mathlib build economics:** `lake exe cache get` for mathlib v4.12 pulls ~6 GB of `.olean` archives from an Azure blob and routinely stalls or partial-completes in this container. A partial fetch leaves `packages/lean-formulas/.lake/packages/mathlib` git-corrupt (`could not resolve 'HEAD'`); next `lake build` fails until the dir is `rm -rf`'d. Cold from-source mathlib build is 30–60 minutes.

**Why:** Any workflow that says `lake build` against a mathlib-dependent project will fail on this platform unless either (a) mathlib is pre-warmed, or (b) the default target is mathlib-free. Recommend splitting `lakefile.lean` into `Core` (mathlib-free, default) and `Full` (mathlib, opt-in) targets.

**How to apply:** First step for any Lean failure: check `which lake` from a workflow-equivalent PATH; if missing, drop the symlinks above. Second: if mathlib is involved, plan for a split-target lakefile, not a cache-get retry loop.
