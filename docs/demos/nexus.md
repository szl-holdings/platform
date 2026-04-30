> **Source of truth for what NEXUS is and isn't:** [docs/demos/nexus-scope.md](./nexus-scope.md). Enforced by `pnpm check:nexus-scope`.

# NEXUS — Unified Agentic AI Layer (Mockup Sandbox): Scope Document

**Status:** Internal engineering tool — NOT a customer-facing product  
**URL:** `/nexus/`  
**Audience:** Internal engineering, design system contributors

---

## Scope

NEXUS (`artifacts/mockup-sandbox`) is the design system component preview server. It is used by the engineering and design team to:

- Preview shared UI components in isolation
- Develop and test new design system primitives before integrating them into production artifacts
- Document the pattern atlas for the platform's component library

## Production Routing

NEXUS is registered in the artifact manifest with preview path `/nexus/`. It is:
- Not linked from any customer-facing navigation
- Not accessible from the public landing page
- Not shown in investor demos
- Confirmed dev-only

## What Is NOT a Demo

NEXUS pages (Bridge, Ingest, Memory, Orchestrator, PatternAtlas, PromptRegistry, Research, Skills) are placeholder labels for design system categories — they are not production features with these names.

## For Demo Purposes

If asked about the "NEXUS" brand or AI layer capability, refer to:
- **Alloy** — the execution fabric (`/alloy`)
- **Forge** — the agent registry (`/forge`)
- **Command** — the unified operating layer (`/command`)

NEXUS as a brand does not surface in investor or customer materials.
