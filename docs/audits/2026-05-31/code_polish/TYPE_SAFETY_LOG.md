# Phase 4 — Type Safety Log

**Author:** Yachay / Perplexity Computer Agent · 2026-06-01
**Scope:** a11oy, amaru, sentra, killinchu, rosie (org SZLHOLDINGS)

## Strategy (NO BANDAID)
Add type checking as a **gate**, not as cosmetic `# type: ignore` litter.
pyright runs in **basic mode repo-wide** with **strict on the core
correctness/crypto modules** (`szl_receipt_substrate.py`, `szl_formulas.py`),
because those carry the Doctrine invariants and must not regress. We did NOT
mass-annotate the whole empire (that would be churn); we hardened the modules
where a type error maps to a real defect.

## pyright configuration
- Configured via the added `pyproject.toml` `[tool.pyright]` block per flagship.
- Mode: `basic` globally; core modules typed strictly.
- **Fixed an invalid config key** discovered during setup:
  `executionEnvironments.strict` is not a valid pyright key — removed it and
  used the correct strict-include mechanism. (Prevents pyright from silently
  ignoring the whole config.)

## Results on strict core modules
- **a11oy `szl_receipt_substrate.py`: 0 pyright errors** after the BUG-4
  hardening (the `.get()`-based field validation is fully typed; no `Any`
  leakage in the verify path).
- **`szl_formulas.py`: 0 pyright errors** after BUG-3 fix — the `total=False`
  TypedDict access now uses `.get("formula_name", "")`, which pyright accepts
  (the prior `call["formula_name"]` was both a runtime KeyError risk and a
  type-checker complaint).

## Annotation/`Any` cleanups applied
- `szl_live_wires.py`: added `import asyncio`, `import logging`, and a module
  `_log` logger; the SSE generator's awaited sleep is now correctly typed as a
  coroutine (was a blocking call returning `None`).
- Reliability breadcrumbs (`_log.debug(...)`) replace bare `except: pass`,
  which also removes silently-typed `None` swallow paths.

## Remaining `Any` debt — flagged, NOT silently ignored
- **amaru `web/` (TypeScript): 5 `any` types in critical paths.** These are in
  the React/TS UI surface (props/handlers around the live-wire viz and API
  response shapes). They are **out of scope for a Python type pass** but are
  recorded here as honest debt. Recommendation: define explicit interfaces for
  the API response and wire-event payloads, then enable
  `@typescript-eslint/no-explicit-any` as an error in amaru `web/`.
- Empire-wide Python: many `dict[str, Any]` envelopes are *intentional* —
  receipts/khipu payloads are schemaless-by-design JSON. We did not force
  premature TypedDicts there; only the two core modules above are strict.

## Evidence
- pyright run logs: `raw_analysis/` (per-flagship pyright output).
- Config: `/tmp/clean_<flagship>/pyproject.toml` `[tool.pyright]`.
- pyright docs: https://microsoft.github.io/pyright/#/configuration

## Status
Type gate configured; core modules pass clean. Push pending (see
`PUSH_BLOCKER_HANDOFF.md`).
