# Runtime Audit Summary

**Run:** `2026-05-18_11-50-15`  
**Generated:** 2026-05-18T11:51:17.636Z  
**Total duration:** 61.6s  
**Overall:** ❌ FAIL (P0 blocking)

---

## Product Status

_Route counts not available (qa:site step did not run or produced no parseable output)._

---

## Step Results

| Priority | Step | Status | Duration | Evidence |
|----------|------|--------|----------|----------|
| P0 | Install dependencies | ⏭ skipped | — | — |
| P0 | Typecheck | ❌ fail | 61.6s | [`typecheck/`](../evidence/2026-05-18_11-50-15/typecheck/) |

---

## P0 Failures (merge-blocking)

### ❌ Typecheck
```
 ERROR  @szl/a11oy-runtime#typecheck: command (/home/runner/workspace/packages/a11oy-runtime) /nix/store/61lr9izijvg30pcribjdxgjxvh3bysp4-pnpm-10.26.1/bin/pnpm run typecheck exited (2)
 ERROR  run failed: command  exited (2)

```

## P1 Failures (advisory — do not block merge)

_None — all P1 checks passed._

---

## Evidence

All step output is captured under `artifacts/audit/evidence/2026-05-18_11-50-15/`.  
Each step directory contains `stdout.txt`, `stderr.txt`, `result.json`,  
and an `artifacts/` subdirectory for any files the step produces  
(Playwright reports, Lighthouse JSON, HAR bundles, screenshots).

Run locally:
```bash
pnpm audit:full
# skip slow steps for local iteration:
pnpm audit:full:fast
```