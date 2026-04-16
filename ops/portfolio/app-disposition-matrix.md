# App Disposition Matrix

Generated: 2026-04-15
Updated: 2026-04-16 (Phase 2-3 rationalization — corrected aegis/firestorm classification)

---

## Canonical — Production Now

These apps are canonical, actively deployed, and investor-ready.

| App | Type | Path | Purpose | Status |
|-----|------|------|---------|--------|
| szl-holdings | Web | `/` (root in production) | Public flagship — marketing, trust, docs, fund intel, investor relations | Active |
| api-server | API | `/api/` | Backend platform — REST + GraphQL + WebSocket | Active |
| aegis | Web | `/aegis/` | Defense & intelligence command center — full app (164 src files, 158 pages) | Active |
| terra | Web | `/terra/` | Real estate intelligence — distress pipeline, ownership graph, deal workflow | Active |
| vessels | Web | `/vessels/` | Maritime intelligence — fleet, cargo, compliance, voyage economics | Active |
| carlota-jo | Web | `/carlota-jo/` | Advisory consulting — client management, booking, document delivery | Active |
| command | Web | `/command/` | Unified ops command — strategy + operations + infrastructure | Active |
| cortex-mobile | Mobile | N/A | CORTEX — unified mobile command for all 8 domains | Active |

## Secondary — Production Later

| App | Type | Path | Purpose | Blocker |
|-----|------|------|---------|---------|
| szl-holdings-mobile | Mobile | N/A | Holdings companion app | Ship CORTEX first; replace Firebase placeholder credentials |

## Internal / Dev Only

| App | Type | Path | Purpose |
|-----|------|------|---------|
| mockup-sandbox | Web | `/__mockup` | UI prototyping and variant exploration — never list in public docs |

## Secondary — Redirect Wrappers (Deregister)

These artifacts have functionality fully covered by a canonical app. Add 301 redirects and deregister.

| App | Redirect Target | Action |
|-----|----------------|--------|
| firestorm | `/aegis/` | 301 redirect; deregister artifact; add DEPRECATED.md — thin 9-file wrapper |
| lyte-command-center | `/command/` | 301 redirect; deregister artifact; add DEPRECATED.md — merged into command |
| imperium | `/command/infrastructure` | 301 redirect; deregister artifact; add DEPRECATED.md — merged into command |

## Archive / Deprecate

| App | Reason | Action |
|-----|--------|--------|
| prism-counsel | Deprecated by task #579, re-registered in error; has DEPRECATED.md | Deregister artifact; delete prism-counsel-ci.yml CI workflow |
| stephen-site | Deprecated by task #579, replaced by /founder in szl-holdings; has DEPRECATED.md | Deregister artifact; add 301 redirect to /founder |

## Deleted (Phase 1 truth audit)

| Directory | Reason |
|-----------|--------|
| aegis-mobile | Empty stub, no package.json |
| alloy-mobile | Empty stub, no package.json |
| carlota-jo-mobile | Empty stub, no package.json |
| forge | Empty stub, no package.json |
| inca-lab | Empty stub, no package.json |
| lyte-mobile | Empty stub, no package.json |
| nexus | Empty stub, no package.json |
| partner-portal | Empty stub, no package.json |
| stephen-mobile | Empty stub, no package.json |
| terra-mobile | Empty stub, no package.json |
| vessels-mobile | Empty stub, no package.json |
| lib/integrations-anthropic-ai | Consolidated into ai-engine |
| lib/integrations-gemini-ai | Consolidated into ai-engine |
| lib/integrations-openai-ai-server | Consolidated into ai-engine |

---

## Correction Note (2026-04-16)

The original version of this file (2026-04-15) incorrectly listed `aegis` in the Archive/Deprecate section as "Duplicate of firestorm." This was inverted. The correct relationship:
- **`aegis`** is the CANONICAL app (164 source files, 158 pages, full defense UI)
- **`firestorm`** is the thin redirect wrapper (9 source files, 7 pages) that should redirect to `/aegis/`

See `ops/portfolio/portfolio-architecture.md` for full rationale.
