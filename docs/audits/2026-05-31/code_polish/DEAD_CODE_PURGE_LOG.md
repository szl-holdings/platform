# Phase 5 — Dead Code Purge Log

**Author:** Yachay / Perplexity Computer Agent · 2026-06-01
**Scope:** a11oy, amaru, sentra, killinchu, rosie (org SZLHOLDINGS)
**Tool:** vulture (+ manual confirmation — every removal verified to have no live reference)

## Principle (NO BANDAID)
Vulture reports *candidates*; dead code is only removed after confirming there
is no dynamic/reflective use (getattr, registry, template). We did **not** add
`# noqa`/whitelist entries to hide findings — we either deleted the dead code or
explained why a flagged item is actually live.

## Removed (real dead code)
| Item | Location | Why dead |
|------|----------|----------|
| Unsatisfiable ternary `text.splitlines()[0] if False else ''` + unused `stream` var (**BUG-2**) | `szl_live_wires.py` (PDF builder) | `if False` branch is unreachable; `stream` is never read — the real content stream is `body_ops`. Removed both. ALL 5 flagships (byte-identical module). |
| Unused `prev = n.get("digest")` | `resilience/szl_exporter.py:52` | Assigned at end of loop body, never read on next iteration or after. Removed. a11oy/amaru/sentra/rosie. |
| Unused `body` from `await json_body(request)` | killinchu `killinchu_expansion.py:486` | Result never used; manifest is fleet-deterministic. Kept the `await` (must consume/validate the request body) but dropped the binding → `await json_body(request)`. killinchu only. |

## Confirmed-live (vulture false positives — NOT removed, with reason)
- `np` import in modules using numpy only inside guarded/optional branches —
  retained; removing breaks the optional vector path.
- FastAPI route handlers and `Depends(...)` callables flagged as "unused
  function/argument" — these are live via the framework's decorator/DI
  registry. Not dead.
- `__all__` entries (sentra forecasts) — referenced by re-export machinery.
- `MADHAVA_*` / Doctrine constant names — part of the LOCKED public surface;
  referenced across modules and by replay. **Never** removed.

## Notably excluded from analysis (not dead, but not source)
- `OUROBOROS_RUN_ALL.py` (~1.45 MB) in a11oy + rosie is a **generated data
  blob**, not hand code. Excluded from vulture/complexity to avoid noise; left
  untouched (additive rule).

## Evidence
- Raw vulture output: `raw_analysis/` (per-flagship `vulture_*.txt`).
- Edits staged in `edits_spec.json` (EXPORTER, LIVE_WIRES BUG-2, KILLINCHU_EXP).
- vulture docs: https://github.com/jendrikseipp/vulture

## Status
Removals staged in `edits_spec.json` + clean trees. Push pending
(`PUSH_BLOCKER_HANDOFF.md`).
