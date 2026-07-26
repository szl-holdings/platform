---
name: pluginmesh-orchestrator
description: Orchestrate plugin discovery, routing, and manifest generation using the PluginMesh broker. Use when selecting plugins for a workflow, generating .mcp.json or .app.json configs, or onboarding agents to the SZL Holdings ecosystem.
---

# PluginMesh Orchestrator Skill

## What This Skill Does

PluginMesh is a **safe plugin broker** for Codex. It:
1. Searches a catalog of 50+ plugins across 7 categories
2. Routes user goals to the best primary and supporting plugins
3. Generates `.app.json`, `.mcp.json`, and Replit payload templates
4. Never bypasses plugin installation, OAuth, API keys, or user consent

## Hard Constraints — Non-Negotiable

- **Never claim access to a third-party service until the user has installed and authenticated it.**
- PluginMesh generates *setup templates* — not live connections.
- When credentials are required, always tell the user which secrets to set in Replit Secrets before proceeding.
- Do not chain tool calls that assume authentication has succeeded before the user confirms it.

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `pluginmesh_search` | Search catalog by query, category, or tags |
| `pluginmesh_get` | Get full details for a specific plugin by slug |
| `pluginmesh_categories` | List all 7 categories with counts and examples |
| `pluginmesh_route` | Map a user goal to primary + supporting plugins |
| `pluginmesh_app_manifest_template` | Generate `.app.json` for a plugin |
| `pluginmesh_replit_payload` | Generate Replit `.mcp.json` entry + env vars |
| `pluginmesh_automation_catalog` | List scheduled-chat automation workflows |
| `pluginmesh_alloy_commands` | List Alloy CLI commands for the SZL ecosystem |
| `pluginmesh_replit_ecosystem_payload` | Full SZL Holdings ecosystem map |
| `pluginmesh_hf_model_router` | Route ML tasks to best HF trending model |
| `pluginmesh_alloy_meridian_blueprint` | Alloy Meridian architecture blueprint |
| `pluginmesh_replit_mcp_activation` | MCP server catalog + activation instructions |

## Typical Workflows

### Workflow A: Route a user goal to plugins

```
1. pluginmesh_route({ goal: "..." })
   → Returns: primary plugin, supporting plugins, credentials needed, next steps

2. pluginmesh_app_manifest_template({ pluginSlug: "<primary>" })
   → Returns: .app.json template ready to use

3. pluginmesh_replit_payload({ pluginSlug: "<primary>" })
   → Returns: .mcp.json entry + Replit Secrets to set
```

### Workflow B: Discover plugins by category

```
1. pluginmesh_categories()
   → Returns: all 7 categories with counts

2. pluginmesh_search({ category: "Engineering", limit: 5 })
   → Returns: top Engineering plugins

3. pluginmesh_get({ slug: "<chosen-slug>" })
   → Returns: full plugin details
```

### Workflow C: Onboard Codex to SZL Holdings

```
1. pluginmesh_replit_ecosystem_payload()
   → Returns: full ecosystem map (12 apps, audit scripts, GitHub Actions, Alloy commands)

2. pluginmesh_replit_mcp_activation()
   → Returns: .mcp.json template + activation steps

3. pluginmesh_alloy_meridian_blueprint({ section: "approvalClasses" })
   → Returns: governance rules for Alloy tool usage
```

### Workflow D: Route an ML task to the best model

```
1. pluginmesh_hf_model_router({ task: "text generation", preferOpen: true })
   → Returns: a ranked shortlist of HF models with model IDs, licenses, and download counts
```

## Data Sources

| File | Contents |
|------|---------|
| `data/plugins.json` | 50+ plugins across 7 categories |
| `data/automations.json` | 6 scheduled-chat automation workflows |
| `data/szl-ecosystem.json` | SZL app routes, audit scripts, GitHub Actions |
| `data/hf-trending-models-2026-04-25.json` | HF trending models snapshot |
| `data/alloy-cognitive-agentic-blueprint.json` | Alloy Meridian architecture |
| `data/replit-mcp-servers.json` | MCP server catalog |

## Validation

Run `node scripts/validate.mjs` to verify all data files before using them. Exits 0 on success, 1 on failure.

## Starting the MCP Server

```bash
node scripts/mcp-server.mjs
```

Or activate via `.mcp.json` — Codex will start it automatically.
