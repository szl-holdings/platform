# A11oy retained dashboard evidence states — 2026-11-17

Workcell: `dashboard-evidence-states-20261116`

**MEASURED: local UI contract behavior only. Operational deployment remains BLOCKED.**

Base source: `e25a1a0181cd03da8ecb7d9177f2292ac4892a6f`

Final captured source: `a4cc449fb59cd2b829830b8444d1c0ed76ba2f86`

Environment: isolated Windows checkout, Node `v24.19.0`, pnpm `10.26.1`, Playwright `1.60.0`, Chromium Headless Shell `148.0.7778.96`.

## Finding and scope

The retained Now Board and Command Surface pages replaced empty or unavailable GraphQL results with seed rows. They also displayed fixed proof, trust, contract-health and execution-rate claims. Command Surface applied local React state changes while presenting them as approvals and claiming cryptographic logging.

This patch repairs those retained review modules. The [public candidate boundary](../artifacts/a11oy/README.md) still excludes them. The candidate entry and route allowlist, backend, provider configuration and the a11oy repository's platform gitlink are unchanged. The browser harness is restricted to loopback and does not add a public application route or a runtime backend API.

## Plan and implemented behavior

The scoped plan was recorded and approved in the work session before source edits. It covered the four query hooks, the two pages, a shared source-state classifier/control, focused tests and source-bound proof.

- Preserve raw query state before the hooks' legacy `null` / empty-list data defaults. Each query independently reports `API_DATA`, `EMPTY`, `LOADING`, `ERROR`, `STALE` or `UNAVAILABLE`.
- Distinguish no response, explicit null and an empty returned list. Keep real zero values, including zero duration, rather than substituting fixtures or another query's count.
- Withhold cached data when a query errors, refreshes or is marked stale. A successful signals response does not turn an unavailable dashboard, workflows or approvals query into a successful observation.
- Show fixtures only after the user explicitly selects DEMO. Returning to API mode clears fixture selection and local demo choices.
- Remove unsupported fixed proof/trust/health metrics and synthetic time-series charts. API_DATA denotes a received response, not operational health, independent verification or authority.
- Render returned approvals read-only. Demonstration choices are labeled local-only; they do not submit approval, execute work, sign anything or append a ledger entry.
- Override the inherited PageHeader governance label with “Review only” on these two pages, preserving the shared component's default for other callers.
- Preserve unknown severity in both the signal row and its selected detail. The unused API workflow priority normalization also remains unknown when absent.
- Bound mobile grid tracks and provide labeled local horizontal table scrolling. The capture rail resets scroll after interactions and checks descendant bounds as well as document width.

Primary implementation: [query classifier](../artifacts/a11oy/src/lib/query-evidence.ts), [query hooks](../artifacts/a11oy/src/graphql/hooks.ts), [Now Board](../artifacts/a11oy/src/pages/NowBoard.tsx), [Command Surface](../artifacts/a11oy/src/pages/CommandSurface.tsx).

## Validation

| Phase | Command / check | Observed result |
|---|---|---|
| Dependency setup | `pnpm install --frozen-lockfile --ignore-scripts` | Exit 0; lockfile unchanged |
| Before edits | `pnpm typecheck` | Exit 0; 232 / 232 tasks successful across 203 packages and prerequisites; 19m59.879s |
| Before edits | `pnpm --filter @workspace/a11oy typecheck` | Exit 0 |
| Main patch | `pnpm typecheck` | Exit 0; 232 / 232 tasks successful, 230 cache hits |
| Main patch | `pnpm --filter @workspace/a11oy test` | Exit 0; 51 Node contract tests + 37 Vitest tests |
| Main patch | `pnpm --filter @workspace/a11oy build` | Exit 0; public candidate bundle contract passed over 4 emitted files |
| Severity review correction | `pnpm --filter @workspace/a11oy test:dashboard-evidence` | Focused dashboard cases: 33; exit 0, including actual selected-signal missing-severity behavior |
| Final layout and capture | `pnpm --filter @workspace/a11oy test:dashboard-evidence:browser --capture` | Exit 0; all 4 scenarios passed at the exact final captured source |
| Final source hygiene | `git diff --check` | Exit 0 |

The full typecheck/package sweep preceded the narrow severity and layout follow-ups. Those follow-ups were checked with the focused rendered-page suite and the real-browser scenarios; the earlier full sweep is not represented as a new run at the final capture revision. Root review accepted this bounded validation sequence.

The Vitest runs emitted a Vite shutdown timeout warning after successful test completion and returned exit 0. This warning is retained as a test-runner cleanup limitation; it is not concealed as a failed assertion.

The [33 focused tests](../artifacts/a11oy/src/pages/dashboard-evidence.test.tsx) cover raw hook response metadata, undefined/null/empty distinctions, zero values, independent mixed query states, cached-data error/refetch/stale handling, explicit DEMO entry/exit, read-only API approval boundaries and selected-signal unknown severity.

The [browser harness](../artifacts/a11oy/test/capture-dashboard-evidence.mjs) imports the actual provider, hooks and pages. Playwright supplies controlled responses for only the four read queries and blocks non-loopback requests. The installed URQL client used HTTP GET for these reads; the harness accepts GET or POST read-query transport. These observations do not prove a deployed GraphQL backend.

No public route was added or changed, so `pnpm qa:routes` was not an applicable gate.

## Source-bound screenshots

All screenshots were captured from the running retained pages at `a4cc449fb59cd2b829830b8444d1c0ed76ba2f86`, after the source was committed and its relevant paths were clean. Each image has a same-basename JSON sidecar. The [capture manifest](dashboard-evidence-capture-20261116.json) records exact route, viewport, timestamp, source revision, command and SHA-256.

| Surface / scenario | Viewport | Image | SHA-256 |
|---|---|---|---|
| Now Board / empty | 1440 × 1000 | [a11oy-now-evidence-empty-2026-11-17.png](../docs/assets/screenshots/current/a11oy-now-evidence-empty-2026-11-17.png) | `cec0a4988dc6c26ac880a978983b95cfb8a3db5d3a1ee46883963cce2b20a6ce` |
| Now Board / mixed | 390 × 844 | [a11oy-now-evidence-mixed-2026-11-17.png](../docs/assets/screenshots/current/a11oy-now-evidence-mixed-2026-11-17.png) | `2fc563a9addd595aa93348f609218e57cfae3257fd91cd0d3ad34f89c1d0e9d9` |
| Command Surface / mixed | 1440 × 1000 | [a11oy-command-evidence-mixed-2026-11-17.png](../docs/assets/screenshots/current/a11oy-command-evidence-mixed-2026-11-17.png) | `bf948f5fbb1e3870c2ffcf2da0c8fcf9a688265c6cd0021e59930d4e937aab6a` |
| Command Surface / demo | 390 × 844 | [a11oy-command-evidence-demo-2026-11-17.png](../docs/assets/screenshots/current/a11oy-command-evidence-demo-2026-11-17.png) | `1bedcc40e783946e365b37281a5363f428eafb072b38cc36b4169a7f06611aab` |

The visible harness banner identifies controlled query fixtures and deployment BLOCKED. The four scenarios are empty/zero data on desktop, independently mixed query results on mobile, independently mixed query results on desktop, and explicit DEMO with a local choice on mobile. Captures contain no page errors. Content fits the viewport outside explicitly labeled table scroll regions.

Visual inspection identified internally clipped mobile cards and a squeezed table in the initial local capture, despite a passing document-width check. The final source corrects those layouts and the capture rail checks internal bounds. The final images were visually reviewed again: mobile cards wrap legibly, the table retains readable cells within its own scroll region, and the app frame is captured at scroll origin.

## Evidence succession and limits

The source history remains intact:

1. `c5a4db23d808e21a20b997dc35dea1fd027ce5ce` — query-state and DEMO boundaries.
2. `a73ba0a0804d85468aa579ae129a45451e2af135` — root-review correction for missing severity/priority.
3. `a4cc449fb59cd2b829830b8444d1c0ed76ba2f86` — mobile clipping and capture-origin correction.

A separate read-only code review by the audit_finish agent at the final captured source found no additional material false-data or approval-authority blocker in the classifier, hooks, controls, pages and rendered-page tests. Root review and this second review are code review evidence; neither is a runtime approval grant.

This proof is the corrected successor for the retained dashboards. Existing historical screenshots and catalog entries are retained; they do not establish current live data or authority for these pages. Existing public-candidate proof keeps its separate scope.

The evidence establishes local UI behavior with controlled query responses. It does **not** establish live backend integration, tenant/session authority, durable persistence, independent approval custody, signed runtime receipts, live subscriptions, deployment, provider execution or operational readiness. Those integration and admission gaps remain open. No credentials, execution identity variables, signing keys, provider settings or production state were changed by this patch.
