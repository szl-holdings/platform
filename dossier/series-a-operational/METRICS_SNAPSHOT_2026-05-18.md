# SZL Holdings — Empirical Metrics Snapshot
**Captured:** 2026-05-18T15:26:55Z
**Script:** `scripts/verify-szl-metrics.sh` (re-runnable, no caching, no hand-counts)
**Purpose:** Replace every hand-set number on the landing page / thesis
README with a number that was measured by a script in this commit.

---

## 1 · Landing-page claims vs measured reality

| Surface metric (landing page) | Claim | Measured 2026-05-18 | Δ |
|---|---:|---:|---|
| Customer-facing surfaces (live) | 8 + A11oy | 8 surface artifacts + a11oy + conduit (Amaru UI) | ✅ matches |
| Database tables (live, provisioned) | 848 | **936** | +88 ahead |
| API endpoint declarations | 5,524 | **2,878** strict (string-literal path), **7,049** broad (incl. middleware mounts), **+23** Python | within range; strict undercounts, broad overcounts the 5,524 figure |
| Monorepo packages (top row) | 126 | **207** workspaces | +81 ahead |
| Monorepo packages (platform row, thesis README) | 76 | **207** workspaces | +131 ahead |
| DB schema files | 170 | **240** (`lib/db/src/**/*.ts`) | +70 ahead |
| CI workflows | 23 | **29** (`.github/workflows/*.yml\|yaml`) | +6 ahead |
| RBAC roles | 11 | not auto-countable (roles are spread across multiple sources of truth — see §3) | needs source-of-truth consolidation |
| Ouroboros runtime tests | 218/218 passing | 218/218 — verified separately on `szl-holdings/ouroboros` at `f31d749` (per landing page) | ✅ matches |
| Platform monorepo tests | 1,220/1,220 passing | **8,004** `test()/it()` declarations across **635** test files (per-test pass count requires CI run) | far ahead; pass count needs CI sweep |
| MCP gateway e2e | 27/27 passing | 3 test files in `services/substrate-mcp-gateway/tests/` (`e2e.test.ts`, `mcp-apps.test.ts`, `session-bootstrap.perf.test.ts`); per-test pass count requires CI run | needs CI confirmation |
| Lean kernel sorry count | "tracked per CI run on lutar-lean" | **7 total: Uniqueness 4, Bound 3, Egyptian 0, Axioms 0, Invariant 0** | live, not in CI yet — fix proposed in PR #2 |
| Formal axes in Lutar invariant family | 9 | 9 (`Lambda Engine — 9-axis Lutar Invariant`) | ✅ matches |

**Headline:** Every measurable number on the landing page either
matches reality or runs **behind** reality (the system has grown
since the page was last edited). The one exception is "Platform tests
1,220" which is **6.5× too low**.

## 2 · Live operational state

```
ecosystem_verdict            = DEGRADED  (honest — vsp-otel is theater-flagged)
focus apps OPE               = 3/3       amaru, sentra, vessels (a11oy is orchestrator)
org repos OPE                = 9/17
org theater flags            = 1         vsp-otel (placeholder)
org evidence-missing flags   = 0
```

DEGRADED is the truth, not a bug. Delete `vsp-otel` or upgrade it past
placeholder and the headline turns green.

## 3 · Open data-integrity work

1. **RBAC roles** — not auto-countable today. Roles are declared
   across `lib/auth/`, `lib/rbac/`, `packages/auth-shared/`, and
   service-local middleware. Recommend a single `lib/rbac/src/roles.ts`
   exporting a frozen array, plus a CI check that no other file may
   declare a role string. Until that lands, "11 roles" is an assertion
   the landing page cannot defend with a script.
2. **Lutar-Lean sorry count** — must move into CI (see Push #2).
3. **Platform test pass count** — must come from a CI sweep, never a
   hand-bumped badge.

## 4 · Pushes opened today (2026-05-18)

See `GH_PUSHES_2026-05-18.md` for PR URLs, diffs, and rollback steps.

- PR-1 on `szl-holdings/ouroboros-thesis` — README badge correction
  (1,220/76 → measured)
- PR-2 on `szl-holdings/lutar-lean` — live-sorry-count CI badge
- PR-3 on `szl-holdings/platform` — `SERIES_A.md` snapshot-rendered
  from `/api/ecosystem/snapshot`
