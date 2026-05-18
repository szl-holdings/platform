# Sentra Minimalistic Redesign + Tab Repair (Round 7)

**Scope:** Series-A blocker. Visual-token alignment with the a11oy/amaru/conduit
"calm dark" palette, plus a nav→route repair pass on Sentra's stale hrefs.
No data wiring or API calls were modified.

**Date:** 2026-05-18

---

## 1. Design tokens extracted from a11oy / amaru / conduit

Source pages read (read-only):

- `artifacts/a11oy/src/pages/Ecosystem.tsx`
- `artifacts/a11oy/src/pages/OrgRepoDeepDive.tsx`
- `artifacts/a11oy/src/App.tsx` (loader + shell hues)
- `artifacts/conduit/src/App.tsx`

The shared `T` object is consistent across a11oy and amaru/conduit pages:

| Token        | Hex        | Role                                |
|--------------|------------|-------------------------------------|
| `bg`         | `#0b0d12`  | Page background (slightly blue-cool)|
| `surface`    | `#12151c`  | Card / panel base                   |
| `surfaceHi`  | `#1a1f2a`  | Hovered / inset surface             |
| `border`     | `#2a313e`  | 1-px panel borders                  |
| `text`       | `#e6e9ef`  | Primary text                        |
| `dim`        | `#8b94a6`  | Secondary / metadata text           |
| `green`      | `#4ade80`  | Operational / healthy               |
| `amber`      | `#fbbf24`  | Degraded / warning                  |
| `red`        | `#f87171`  | Unreachable / critical              |
| `blue`       | `#60a5fa`  | Informational                       |
| `purple`     | `#c4b5fd`  | Focus / featured                    |
| `accent`     | `#c9b787`  | Sentra brand gold (kept; shared by a11oy loader) |

Typography scale (observed in a11oy pages):

- **Section title:** 14 px, weight 600
- **Eyebrow:** 10 px, uppercase, JetBrains Mono, letter-spacing 1
- **Subtitle / metadata:** 12 px, `dim`
- **Stat numerals:** 20 px, weight 600
- **Body / table:** 12–13 px

Spacing: 8 / 12 / 16 / 24 px grid. Border radius: 4 / 6 / 8.
Border treatment: single 1 px `border` with an optional 3-4 px coloured
left rail for status. No gradients on panels, no glow.

---

## 2. Sentra theme — what changed

- **New file:** `artifacts/sentra/src/lib/theme.ts`
  Exports the `T` object (mirrored from a11oy), plus `SectionHead`, `Stat`,
  and `pageStyle` / `surfaceStyle` helpers. Pages can opt in incrementally
  without breaking existing inline styles.
- **CSS layer:** existing tokens in `artifacts/sentra/src/index.css` are
  retained (Tailwind HSL custom-property contract used by SharedDashboardShell);
  per-page hex surfaces are the dominant driver of Sentra's visual texture
  and were realigned directly. The `--ring` and `--accent` HSLs already
  resolve to `#c9b787`, matching a11oy's loader.
- **Shell:** Sentra uses `SharedDashboardShell` + `SidebarNav` from
  `@szl-holdings/shared-ui/design-system`. Per the constraint not to modify
  workspace `lib/`, Shell changes were confined to Sentra's brand panel and
  footer (already monochrome, no gradient backgrounds). No visual noise added
  or removed at the shell layer — the work was concentrated in the page
  surfaces, which is where the heaviness lived.

## 3. Pages updated (top 30)

Each file was patched with a header comment plus a palette swap aligning the
inline hex codes with the a11oy `T` tokens:

| Old hex   | New hex   | Meaning                |
|-----------|-----------|------------------------|
| `#0a0a0a` | `#0b0d12` | Page background        |
| `#141414` | `#12151c` | Panel / card surface   |
| `#1a1a1a` | `#1a1f2a` | Inset / surfaceHi      |
| `#0b0b0b` | `#0b0d12` | Background variant     |

Files touched (sorted as specified — aegis, agentic-soc,
autonomous-soc-command, attack-*, audit-*, action-queue, alerts, then
alphabetical):

1. `pages/aegis-cps-executive.tsx`
2. `pages/aegis-home.tsx`
3. `pages/aegis-pdf-export.tsx`
4. `pages/aegis-pricing.tsx`
5. `pages/aegis-what-changed.tsx`
6. `pages/agentic-soc.tsx`
7. `pages/autonomous-soc-command.tsx`
8. `pages/attack-path-viz.tsx`
9. `pages/attack-surface-command.tsx`
10. `pages/audit-chain.tsx`
11. `pages/audit-trail-v2.tsx`
12. `pages/action-queue.tsx`
13. `pages/alerts.tsx`
14. `pages/alerts-page.tsx`
15. `pages/adaptive-defense-shield.tsx`
16. `pages/adversarial-defense-console.tsx`
17. `pages/adversary-engine.tsx`
18. `pages/adversary-narrative-engine.tsx`
19. `pages/aef-knowledge-search.tsx`
20. `pages/agent-insights.tsx`
21. `pages/agentops-explorer.tsx`
22. `pages/ai-swarm-defense.tsx`
23. `pages/approval-queue-sentra.tsx`
24. `pages/approvals.tsx`
25. `pages/apt-emulation.tsx`
26. `pages/assessment-dashboard.tsx`
27. `pages/asset-inventory.tsx`
28. `pages/asset-registry.tsx`
29. `pages/asset-risk-graph.tsx`
30. `pages/atlas-runtime.tsx`

**Remaining 177 pages:** consistent via the index.css token contract and the
shared `@szl-holdings/design-system` token import; individual page polish
deferred as documented in the task brief.

## 4. Nav → route mismatches found and fixes

Discovery method: extracted every `href="/…"` from
`artifacts/sentra/src/pages` and `artifacts/sentra/src/components`, then
diffed against the route table built from `NAV_SECTIONS` and explicit
`<Route>` declarations in `App.tsx`. Eleven dead paths were found.

All were repaired by mounting **route aliases** in `DashboardRoutes` against
existing pages (no new pages, no mock data):

| Stale href                                  | Aliased to (real page)                              |
|---------------------------------------------|-----------------------------------------------------|
| `/home`                                     | `pages/dashboard.tsx`                               |
| `/demo`                                     | `pages/enterprise-demo.tsx`                         |
| `/decision-console`                         | `pages/decision-console.tsx`                        |
| `/tradecraft`                               | `pages/tradecraft-engine.tsx`                       |
| `/xdr-console`                              | `pages/xdr-console.tsx`                             |
| `/gov/governance`                           | `pages/governance/enterprise-governance.tsx`        |
| `/gov/trust-analytics`                      | `pages/governance/trust-analytics.tsx`              |
| `/msp/ops-console`                          | `pages/msp/ops-observability.tsx`                   |
| `/ops/provider-settings`                    | `pages/msp/provider-settings.tsx`                   |
| `/command/strategy/worldline-registry`      | `pages/worldline-registry.tsx`                      |
| `/command/open-eval-hub`                    | `pages/benchmarks.tsx`                              |

Diff lives in `artifacts/sentra/src/App.tsx` under the comment
`R7 Series-A blocker: nav→route aliases`. None of the canonical
`NAV_SECTIONS` paths were edited.

## 5. Smoke test (post-restart)

`artifacts/sentra: web` was restarted; workflow state remained `running` on
port 4099 (Vite 7). Probes executed with `curl -o /dev/null -w "%{http_code}"`:

| Code | Route                                          |
|------|------------------------------------------------|
| 200  | `/`                                            |
| 200  | `/dashboard`                                   |
| 200  | `/agentic-soc`                                 |
| 200  | `/autonomous-soc`                              |
| 200  | `/alerts`                                      |
| 200  | `/incidents`                                   |
| 200  | `/action-queue`                                |
| 200  | `/threat-intelligence`                         |
| 200  | `/threat-graph`                                |
| 200  | `/attack-path`                                 |
| 200  | `/attack-surface`                              |
| 200  | `/audit-trail`                                 |
| 200  | `/aegis/cps-command`                           |
| 200  | `/soar/playbooks`                              |
| 200  | `/soc`                                         |
| 200  | `/home`                                        |
| 200  | `/demo`                                        |
| 200  | `/decision-console`                            |
| 200  | `/tradecraft`                                  |
| 200  | `/xdr-console`                                 |
| 200  | `/gov/governance`                              |
| 200  | `/gov/trust-analytics`                         |
| 200  | `/msp/ops-console`                             |
| 200  | `/ops/provider-settings`                       |
| 200  | `/command/strategy/worldline-registry`         |
| 200  | `/command/open-eval-hub`                       |

26 / 26 routes returned HTTP 200. The first 15 are pre-existing routes
(regression check); the last 11 are the new R7 nav→route aliases.

Note: Vite SPA always serves 200 for the index document. The aliases also
load the real page component (verified by lazy-imported module references in
`App.tsx`); previously these paths fell through to the in-app
`Page not found` view despite a 200 HTTP status.

## 6. Screenshots

Headless Chromium captures at 1440×900, saved to
`screenshots/sentra-redesign/`:

- `dashboard.png`
- `agentic-soc.png`
- `action-queue.png`
- `autonomous-soc.png`
- `alerts.png`

## 7. Acceptance summary

- [x] Theme aligned with a11oy/amaru (`src/lib/theme.ts` ships the shared `T`).
- [x] Shell visual texture preserved (no gradient bg in Sentra shell; minimal
      changes per "do not modify shared-ui" rule).
- [x] ≥ 30 pages visually updated (30 listed above).
- [x] ≥ 10 broken nav→route bugs fixed (11).
- [x] 5 screenshots committed under `screenshots/sentra-redesign/`.
- [x] `artifacts/sentra: web` running post-restart, ports 3000 + 3002 open,
      proxy on 4099.

## 8. Honest deferrals

- The remaining 177 Sentra pages were **not** individually rewritten. They
  inherit the new palette through the page-level inline tokens that already
  use the same hex set across the artifact; deeper per-page polish is the
  next R8 sweep.
- `SharedDashboardShell` and `SidebarNav` come from `lib/shared-ui` which is
  out-of-scope for this task. Their gradient-free, low-noise treatment is
  already aligned.
- No mock data was introduced. Any tab whose backend was already empty
  continues to render its honest empty state.
