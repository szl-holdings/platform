# NEXUS — Route Mapping

NEXUS pages were consolidated from `artifacts/mockup-sandbox` (Praxis) into A11oy (`artifacts/a11oy`) as the unified surface. All `/nexus/*` traffic is now proxied to A11oy (port 4110) via the shared proxy.

**Canonical path:** `/nexus/*` served by A11oy (previewPath="/"). The `/nexus/*` routes are primary. Legacy `/a11oy/*` paths redirect to root via `LegacyA11oyRedirect` in App.tsx. Legacy `/praxis` redirects to `/nexus`.

## Old → New Route Map

| Old URL (mockup-sandbox at /nexus/) | New URL (A11oy shell at /nexus/) | Component | API State |
|--------------------------------------|----------------------------------|-----------|-----------|
| `/nexus/` | `/nexus/` | `NexusHome.tsx` | Live — `praxisApi` |
| `/nexus/research` | `/nexus/research` | `NexusResearch.tsx` | Live — `praxisApi` |
| `/nexus/memory` | `/nexus/memory` | `NexusMemory.tsx` | Live — `praxisApi` |
| `/nexus/skills` | `/nexus/skills` | `NexusSkills.tsx` | Live — `praxisApi` |
| `/nexus/orchestrator` | `/nexus/orchestrator` | `NexusOrchestrator.tsx` | Live — `praxisApi` |
| `/nexus/tokens-governance` | `/nexus/tokens-governance` | `NexusTokensGovernance.tsx` | Live — generated JSON (`./data/design-tokens-drift*.generated.json`) |
| `/nexus/pattern-atlas` | `/nexus/pattern-atlas` | `NexusPatternAtlas.tsx` | Live — `patternAtlasMetadata.generated.ts` |
| `/nexus/bridge` | `/nexus/bridge` | `NexusBridge.tsx` | Pending — `GET /api/nexus/bridge/tools` |
| `/nexus/marketplace` | `/nexus/marketplace` | `NexusMarketplace.tsx` | Pending — `GET /api/nexus/marketplace/servers` |
| `/nexus/ingest` | `/nexus/ingest` | `NexusIngest.tsx` | Pending — `GET /api/nexus/ingest/repos` |
| `/nexus/design-system` | `/nexus/design-system` | `NexusDesignSystem.tsx` | Pending — `GET /api/nexus/design-system/evidence` |
| `/nexus/ai-quality` | `/nexus/ai-quality` | `NexusAIQuality.tsx` | Pending — `GET /api/nexus/ai-quality` |
| `/nexus/prompt-registry` | `/nexus/prompt-registry` | `NexusPromptRegistry.tsx` | Pending — `GET /api/nexus/prompts` |
| `/nexus/eval-console` | `/nexus/eval-console` | `NexusEvalConsole.tsx` | Pending — `GET /api/nexus/eval/suites` |
| `/nexus/audit-trail` | `/nexus/audit-trail` | `NexusAuditTrail.tsx` | Pending — `GET /api/nexus/audit` |
| `/nexus/eval-layer` | `/nexus/eval-layer` | `NexusEvalLayer.tsx` | Pending — `GET /api/nexus/eval-layer/nodes` |
| `/nexus/passport-registry` | `/nexus/passport-registry` | `NexusPassportRegistry.tsx` | Pending — `GET /api/nexus/passports` |
| `/nexus/kernel-dashboard` | `/nexus/kernel-dashboard` | `NexusKernelDashboard.tsx` | Pending — `GET /api/nexus/kernels` |

Legacy redirects:
- `/praxis` → `/nexus` (App.tsx route)
- `/a11oy/*` → `/` (LegacyA11oyRedirect in App.tsx)

## Auth

All NEXUS pages are guarded by `NexusAuthGate` (`NexusAuthGate.tsx`), which calls `GET /api/nexus/status`:
- HTTP 200 or 404 → authenticated (access granted)
- HTTP 401 / 403 / 5xx → unauthenticated (access denied, sign-in wall shown)
- Network error (api-server down) → unauthenticated (fail closed)

## Generated Asset Refresh

Two Nexus surfaces rely on checked-in generated files:

| Surface | Generated File | How to regenerate |
|---------|---------------|-------------------|
| TokensGovernance | `src/pages/nexus/data/design-tokens-drift.generated.json` | `pnpm --filter @workspace/tokens run generate` (or equivalent token drift script) |
| TokensGovernance | `src/pages/nexus/data/design-tokens-drift-history.generated.json` | Same as above |
| PatternAtlas | `src/pages/nexus/patternAtlasMetadata.generated.ts` | `pnpm --filter @workspace/shared-ui run build-metadata` (or equivalent) |

**Known gap:** Regeneration of `patternAtlasMetadata.generated.ts` is not yet hooked into A11oy's dev/build pipeline. Until a script hook is added, regeneration must be run manually when `shared-ui` component definitions change. Tracked as follow-up to Task #4310.

## Proxy Configuration

`packages/shared-proxy/src/index.ts`:
```
{ prefix: '/nexus/', port: A11OY_PORT }  // routes /nexus/* to A11oy (port 4110)
```

The retired `artifacts/mockup-sandbox` artifact no longer claims the `/nexus/` path.
