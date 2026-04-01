# Product Matrix & Lane Ownership

## Active Platforms

| Platform | Artifact Directory | Internal Name | Route Prefix | Status |
|----------|-------------------|---------------|-------------|--------|
| Lyte | `artifacts/lyte-command-center` | lyte-command-center | `/lyte-command-center/` | Live |
| Aegis | `artifacts/firestorm` | firestorm | `/firestorm/` | Live |
| Terra | `artifacts/terra` | terra | `/terra/` | Live |
| Vessels | `artifacts/vessels` | vessels | `/vessels/` | Live |
| Carlota Jo (Web) | `artifacts/carlota-jo` | carlota-jo | `/carlota-jo/` | Live |
| Carlota Jo (Mobile) | `artifacts/carlota-jo-mobile` | carlota-jo-mobile | `/carlota-jo-mobile/` | Live |
| SZL Holdings | `artifacts/szl-holdings` | szl-holdings | `/` | Live |
| Stephen Lutar | `artifacts/stephen-site` | stephen-site | `/stephen/` | Live |
| API Server | `artifacts/api-server` | api-server | `/api/` | Live |

## Internal Systems (Not Standalone Platforms)

| System | Lives In | Purpose |
|--------|---------|---------|
| Alloy | `artifacts/szl-holdings` (`/alloy/*`) | Execution Fabric — workflow engine, agent coordination, audit trail |
| Aegis Intelligence | `artifacts/firestorm` (Aegis Labs module) | AI Research Command — model registry, experiments, research synthesis |
| Aegis Operations | `artifacts/firestorm` (Aegis Command module) | Managed Services Command — MSP operations, incident command, SLA management |
| Alloy Creative | `artifacts/api-server` (creative-workflows routes) | Creative media workflows — campaign management, content strategy |

## API Route Naming

| Module Name | Route File | Route Prefix | Notes |
|-------------|-----------|-------------|-------|
| Aegis Intelligence | `routes/inca.ts` | `/inca/` (also `/aegis/intel/`) | Legacy filename; aliased as `aegisIntelRouter` in index.ts |
| Aegis Operations | `routes/msp.ts` | `/msp/` (also `/aegis/ops/`) | Legacy filename; aliased as `aegisOpsRouter` in index.ts |
| Alloy Creative | `routes/dreamscape.ts` | `/dreamscape/` | Legacy filename; aliased as `creativeWorkflowsRouter` in index.ts |

## Naming History & Deprecations

| Current Name | Previous / Alternate Names | Notes |
|-------------|---------------------------|-------|
| Aegis | Firestorm (artifact dir name) | Directory kept as `firestorm` for stability |
| Lyte | Lyte Command Center (original) | Branding simplified to "Lyte" |
| Aegis Intelligence | INCA; standalone concept → Aegis module | Absorbed into Aegis Labs workspace; route file: inca.ts |
| Aegis Operations | Rosie; MSP; standalone concept → Aegis module | Absorbed into Aegis Command workspace; route file: msp.ts |
| Alloy Creative | Dreamscape; creative-workflows | Route file: dreamscape.ts |
| Nimbus | Early AI orchestration concept | Fully deprecated — capabilities absorbed into Alloy |
| Beacon | Early telemetry concept | Fully deprecated — replaced by Terra |
| AlloyScape | Early Alloy brand name | Fully deprecated — canonical name is "Alloy" |

## AI Provider Configuration

The platform uses the Replit AI proxy as its default provider. The `AIAdapter` in `lib/services/src/adapters/ai.ts` tries providers in this order:
1. **Replit proxy** (via `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`) — always available in Replit deployments
2. Direct OpenAI (`OPENAI_API_KEY`)
3. Direct Anthropic (`ANTHROPIC_API_KEY`)

Mock mode is opt-in only: set `AI_MOCK_MODE=true` for demo/test environments. Mock never activates by default when real providers are available.

## Branding Standards

### Lyte
- Full: **Lyte · Business Observability**
- Slogan: *"In the dark, let Lyte guide you."*
- Framework: PRISM (Pulse/Risk/Intelligence/Signals/Motion)
- Colors: Amber primary (#f59e0b), dark background

### Aegis
- Full: **Aegis — Unified Defense & Intelligence Command**
- Doctrine: OBSERVE · UNDERSTAND · DECIDE · EXECUTE
- Workspaces: Defense/SOC (red), Command/Ops (blue), Intelligence/Labs (violet)
- Modules: Aegis Operations (MSP/managed services), Aegis Intelligence (AI research)

### Terra
- Full: **Terra — Real Estate Intelligence**
- Focus: NYC distressed property market; business telemetry & KPI observability
- Colors: Green primary (#84cc16), earth tones

### Vessels
- Full: **Vessels — Maritime Intelligence**
- Slogan: *"Fleet operations. Decided faster."*
- Colors: Cyan primary (#06b6d4), navy background

### Carlota Jo
- Full: **Carlota Jo Consulting**
- Positioning: Luxury private advisory
- Colors: Gold/warm tones, editorial typography

### Alloy
- Full: **Alloy — Execution Fabric**
- Role: Platform engine powering Lyte, Vessels, and cross-domain workflows
- Sub-module: Alloy Creative (creative workflows, campaign management)

## Platform Count Rule

**Five platforms**: Lyte, Vessels, Aegis, Terra, Carlota Jo.

Alloy is SZL Holdings' internal Execution Fabric — not a standalone platform.
Aegis Intelligence and Aegis Operations are Aegis modules — not standalone platforms.
Alloy Creative is an Alloy sub-module — not a standalone platform.
