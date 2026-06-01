# Phase 3 — Style Enforcement Log

**Author:** Yachay / Perplexity Computer Agent · 2026-06-01
**Scope:** 5 HF Spaces flagships — a11oy, amaru, sentra, killinchu, rosie (org SZLHOLDINGS)

## Approach (NO BANDAID)
Style is enforced via **configuration + targeted auto-fix of safe rules**, not
by blanket reformatting. An earlier aggressive `ruff format .` was deliberately
**reverted** because a whole-file reformat produces a massive, review-hostile
diff and risks perturbing GREEN routes. All changes here are ADDITIVE: we add
config files and apply only the auto-fixes that ruff classifies as safe.

## Tooling configured (added to every flagship as `pyproject.toml`)
- **ruff** lint: selected rule families `E, F, I, B, UP, C4`
  - ignores tuned for this codebase: `E402` (intentional late imports for
    optional deps), `E501` (long lines in generated/data-ish modules),
    `E701/E702` (compact guard clauses), `B008` (FastAPI `Depends()` default-arg
    pattern is correct usage, not a bug).
- **ruff format** (black-compatible) — config present but applied surgically
  only, not repo-wide.
- **isort** behavior provided by ruff's `I` rules (import ordering / grouping).
- **pyright** basic mode (see `TYPE_SAFETY_LOG.md`); strict on core modules.
- **pytest** config block (testpaths, quiet).
- amaru's pre-existing `sidecar/pyproject.toml` is **preserved untouched**.

A `.pre-commit-config.yaml` is added to every flagship wiring ruff +
ruff-format + a local pyright-core hook + pytest, so style is enforced going
forward rather than as a one-time cleanup.

## ESLint / Prettier (Node/TS surfaces)
Per the Phase-1 rationalization (`PYTHON_NODE_RATIONALIZATION.md`), the only
substantial TS/React surface is **amaru `web/`**. ESLint+Prettier config belongs
there and in amaru's existing toolchain; no JS is doing crypto/tokenization, so
no language conversion is implied. Recommendation recorded; the 5 `any` types in
amaru web critical paths are tracked in `TYPE_SAFETY_LOG.md`.

## Auto-fix counts (safe ruff fixes applied during the polish pass)
These are the counts observed when running ruff `--fix` (safe rules only) over
each flagship's Python sources during the initial audit pass:

| Flagship  | Safe auto-fixes applied |
|-----------|-------------------------|
| a11oy     | 12                      |
| amaru     | 9                       |
| sentra    | 11                      |
| killinchu | 3                       |
| rosie     | 19                      |

Dominant fix categories: import sorting/grouping (`I`), unused-import removal
(`F401`), f-string/`C4` comprehension modernization (`UP`, `C4`), and
redundant-`else`/whitespace normalization.

## Style fixes hand-applied (beyond auto-fix, in `edits_spec.json`)
- `szl_rag.py`: ambiguous one-letter names `D, I` → `sims, nbr_idx` (E741-class
  readability; also avoids shadowing/`I`-ambiguity).
- killinchu `killinchu_expansion.py`: `seed = lambda f: ...` → `def seed(f):`
  (E731 — assign-lambda is a real anti-pattern, replaced with a def).
- ambiguous loop var `l` → `line` in `szl_live_wires.py` (E741).
- sentra `src/forecasts/__init__.py`: added explicit `__all__` (public-API
  hygiene; silences implicit-reexport ambiguity).

## Evidence
- Raw ruff outputs: `raw_analysis/` (per-flagship ruff logs).
- Config artifacts: `/tmp/clean_<flagship>/pyproject.toml`,
  `/tmp/clean_<flagship>/.pre-commit-config.yaml`.
- ruff documentation: https://docs.astral.sh/ruff/
- pre-commit: https://pre-commit.com/

## Status
Configs + hand-applied style edits staged in `edits_spec.json` and clean trees.
Push to HF pending (see `PUSH_BLOCKER_HANDOFF.md` — sandbox OOM blocker).
