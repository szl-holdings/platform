# Runtime Audit Summary

**Run:** `2026-05-18_12-05-34`  
**Generated:** 2026-05-18T12:06:22.480Z  
**Total duration:** 47.7s  
**Overall:** ❌ FAIL (P0 blocking)

---

## Product Status

_Route counts not available (qa:site step did not run or produced no parseable output)._

---

## Step Results

| Priority | Step | Status | Duration | Evidence |
|----------|------|--------|----------|----------|
| P0 | Install dependencies | ⏭ skipped | — | — |
| P0 | Typecheck | ❌ fail | 47.7s | [`typecheck/`](../evidence/2026-05-18_12-05-34/typecheck/) |

---

## P0 Failures (merge-blocking)

### ❌ Typecheck
```
 ERROR  @szl-holdings/payload#typecheck: command (/home/runner/workspace/packages/payload) /nix/store/61lr9izijvg30pcribjdxgjxvh3bysp4-pnpm-10.26.1/bin/pnpm run typecheck exited (2)
 ERROR  run failed: command  exited (2)

```

## P1 Failures (advisory — do not block merge)

_None — all P1 checks passed._

---

## Evidence

All step output is captured under `artifacts/audit/evidence/2026-05-18_12-05-34/`.  
Each step directory contains `stdout.txt`, `stderr.txt`, `result.json`,  
and an `artifacts/` subdirectory for any files the step produces  
(Playwright reports, Lighthouse JSON, HAR bundles, screenshots).

Run locally:
```bash
pnpm audit:full
# skip slow steps for local iteration:
pnpm audit:full:fast
```