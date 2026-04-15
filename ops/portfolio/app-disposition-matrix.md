# App Disposition Matrix

Generated: 2026-04-15

## Production Now

These apps are canonical, actively deployed, and investor-ready.

| App | Type | Path | Purpose | Status |
|-----|------|------|---------|--------|
| szl-holdings | Web | `/szl-holdings/` | Public flagship — marketing, trust, docs, fund intel, demos | Active |
| api-server | API | `:8080/api/` | Backend platform — REST + GraphQL + WebSocket | Active |
| firestorm (Aegis) | Web | `/firestorm/` | Defense & intelligence command center | Active |
| terra | Web | `/terra/` | Real estate intelligence — lease, pro forma, tax, 1031 | Active |
| vessels | Web | `/vessels/` | Maritime intelligence — fleet, cargo, compliance | Active |
| carlota-jo | Web | `/carlota-jo/` | Advisory consulting — client management | Active |
| command | Web | `/command/` | Unified ops — strategy + operations + infrastructure | Active |
| cortex-mobile | Mobile | N/A | CORTEX — unified mobile command for all 8 domains | Active |

## Production Later

| App | Type | Path | Purpose | Blocker |
|-----|------|------|---------|---------|
| szl-holdings-mobile | Mobile | N/A | Holdings companion app | Ship CORTEX first |

## Internal / Dev Only

| App | Type | Path | Purpose |
|-----|------|------|---------|
| mockup-sandbox | Web | `/mockup-sandbox/` | UI prototyping and variant exploration |

## Archive / Deprecate

| App | Reason | Action |
|-----|--------|--------|
| aegis | Duplicate of firestorm (same code, different path) | Deregister artifact, keep code |
| imperium | Merged into command (infrastructure mode) | Deregister artifact |
| lyte-command-center | Merged into command (operations mode) | Deregister artifact |
| prism-counsel | Deprecated by task #579, re-registered in error | Deregister artifact |
| stephen-site | Deprecated by task #579, replaced by /founder in szl-holdings | Deregister artifact |

## Deleted (this session)

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
