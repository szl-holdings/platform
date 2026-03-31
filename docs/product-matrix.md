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
| Alloy | `artifacts/szl-holdings` (`/alloy/*`) | Execution Fabric — workflow engine, audit trail |
| INCA | `artifacts/firestorm` (Aegis Labs module) | AI Research — model registry, experiments |
| Rosie | `artifacts/firestorm` (Aegis Command module) | Managed Security Operations |
| Dreamscape | `artifacts/api-server` (scoring engine) | Predictive intelligence, entity scoring |

## Naming History & Deprecations

| Current Name | Previous / Alternate Names | Notes |
|-------------|---------------------------|-------|
| Aegis | Firestorm (artifact dir name) | Directory kept as `firestorm` for stability |
| Lyte | Lyte Command Center (original) | Branding simplified to "Lyte" |
| INCA | Standalone concept → Aegis module | Absorbed into Aegis Labs workspace |
| Rosie | Standalone MSP concept → Aegis module | Absorbed into Aegis Command workspace |
| Dreamscape | Standalone AI concept → API scoring engine | Scoring endpoints remain at `/api/dreamscape/` |
| Nimbus | Early AI concept | Fully deprecated — absorbed into Dreamscape scoring |
| Beacon | Early telemetry concept | Fully deprecated — replaced by Lyte |

## Branding Standards

### Lyte
- Full: **Lyte · Business Observability**
- Slogan: *"In the dark, let Lyte guide you."*
- Framework: PRISM (Pulse/Risk/Intelligence/Signals/Motion)
- Colors: Amber primary (#f59e0b), dark background

### Aegis
- Full: **Aegis — Unified Defense & Intelligence**
- Doctrine: OBSERVE · UNDERSTAND · DECIDE · EXECUTE
- Workspaces: Defense (red), Command (blue), Labs (violet)

### Terra
- Full: **Terra — Real Estate Intelligence**
- Focus: NYC distressed property market
- Colors: Green primary (#84cc16), earth tones

### Vessels
- Full: **Vessels — Maritime Intelligence**
- Slogan: *"Fleet operations. Decided faster."*
- Colors: Cyan primary (#06b6d4), navy background

### Carlota Jo
- Full: **Carlota Jo Consulting**
- Positioning: Luxury private advisory
- Colors: Gold/warm tones, editorial typography

## Platform Count Rule

**Five platforms**: Lyte, Vessels, Aegis, Terra, Carlota Jo.

Alloy is SZL Holdings' internal Execution Fabric — not a standalone platform.
INCA and Rosie are Aegis modules — not standalone platforms.
