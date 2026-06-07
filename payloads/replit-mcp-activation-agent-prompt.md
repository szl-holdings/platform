# Replit MCP Activation — Setup Agent Prompt

## Goal

Activate MCP tools in Codex for the SZL Holdings workspace. After following these steps, Codex will have access to PluginMesh, Alloy, and GitHub tools without any manual configuration.

## Prerequisites

Before activating MCP servers, ensure the user has:
1. A Replit account with Codex access
2. The SZL Holdings monorepo open in Replit
3. The following secrets set in Replit Secrets:
   - `ALLOY_INTERNAL_TOKEN` (required for Alloy MCP)
   - `GITHUB_PERSONAL_ACCESS_TOKEN` (required for GitHub MCP)

**Important:** Do not proceed if the user has not set these secrets. Guide them to Replit Secrets first.

## Activation Steps

### Step 1 — Verify .mcp.json exists
```bash
cat .mcp.json
```
The file should list `pluginmesh`, `alloy`, and `github` servers.

### Step 2 — Validate PluginMesh data integrity
```bash
node scripts/validate.mjs
```
All checks should pass. Fix any failures before proceeding.

### Step 3 — Test PluginMesh stdio server
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node scripts/mcp-server.mjs
```
Should return a JSON-RPC initialize result.

### Step 4 — Open Codex
In Replit, open the Codex panel. The MCP tools should appear automatically in the tool picker based on `.mcp.json`.

### Step 5 — Verify tools are available
Ask Codex: "What PluginMesh tools do you have access to?" It should list the 12 PluginMesh tools plus the Alloy and GitHub tools.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Command not found" for mcp-server.mjs | Node not in PATH | Ensure Node 18+ is installed |
| Alloy tools return 401 | Missing ALLOY_INTERNAL_TOKEN | Set in Replit Secrets |
| GitHub tools return 403 | Invalid GITHUB_PERSONAL_ACCESS_TOKEN | Regenerate token with `repo` scope |
| validate.mjs fails | Data file corruption or duplicate slug | Run `node scripts/validate.mjs` and fix reported errors |

## Security Reminders

- MCP servers run with your workspace permissions — only activate servers you trust
- The PluginMesh stdio server requires no credentials and is safe to activate immediately
- Never share your `ALLOY_INTERNAL_TOKEN` or `GITHUB_PERSONAL_ACCESS_TOKEN`
- All Alloy tool invocations are logged — this is by design for auditability
