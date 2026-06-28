# PluginMesh MCP Server (Developer)

Local stdio MCP server: `scripts/mcp-server.mjs`
Registered in `.mcp.json` as `"pluginmesh"`.

## 12 Tools

| Tool | Purpose |
|---|---|
| `pluginmesh_search` | Search the SZL plugin/automation catalog |
| `pluginmesh_get` | Retrieve a specific plugin entry |
| `pluginmesh_categories` | List plugin categories |
| `pluginmesh_route` | Route a request to a matching plugin |
| `pluginmesh_app_manifest_template` | Generate a Replit App manifest template |
| `pluginmesh_replit_payload` | Build a Replit deployment payload |
| `pluginmesh_automation_catalog` | Browse automation workflows |
| `pluginmesh_alloy_commands` | List a11oy governance commands |
| `pluginmesh_replit_ecosystem_payload` | Full Replit ecosystem integration payload |
| `pluginmesh_hf_model_router` | Route to a Hugging Face model |
| `pluginmesh_alloy_meridian_blueprint` | Return the a11oy × Meridian blueprint |
| `pluginmesh_replit_mcp_activation` | Activate Replit MCP integration |

## Local install

Add to your `claude_desktop_config.json` under `mcpServers`:

```json
{
  "pluginmesh": {
    "command": "node",
    "args": ["scripts/mcp-server.mjs"]
  }
}
```

No network calls required. Server reads `data/` JSON files locally.
Requires Node.js ≥ 18.

## Transport

stdio (MCP 2025-11-25 protocol). Not a public HTTP endpoint.
