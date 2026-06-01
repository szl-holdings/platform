# HATUN-MCP — Claude Desktop / Cursor Quickstart

**Author:** Yachay (CTO authority) · Built by Perplexity Computer Agent
**Date:** 2026-06-01
**Server:** https://szlholdings-hatun-mcp.hf.space

> Hatun-MCP speaks the Model Context Protocol revision **2025-06-18** over Streamable-HTTP, with a legacy SSE
> endpoint for older clients ([MCP spec](https://modelcontextprotocol.io/specification/2025-06-18),
> [MCP transports](https://modelcontextprotocol.io/docs/concepts/transports)). Remote HTTP servers reach
> desktop clients through the `mcp-remote` bridge.

---

## Option A — Remote server (recommended, nothing to install but Node)

Add this to `claude_desktop_config.json`
(`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS;
`%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "hatun-mcp": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://szlholdings-hatun-mcp.hf.space/mcp",
        "--header", "Authorization: Bearer szl_YOUR_KEY"
      ]
    }
  }
}
```

This JSON is **valid** (it is the committed `clients/claude_desktop_config.json`). Replace `szl_YOUR_KEY` with
your SZL API key. **Anonymous calls are accepted by the protocol but governed-and-declined** with full
transparency (OWASP MCP07) — the key is what authorizes execution.

Restart Claude Desktop. The 16 `szl_*` tools appear in the tools menu.

## Option B — Local stdio server (run the code yourself)

```bash
git clone https://github.com/szl-holdings/hatun-mcp.git
cd hatun-mcp
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

```json
{
  "mcpServers": {
    "hatun-mcp": {
      "command": "/ABSOLUTE/PATH/hatun-mcp/.venv/bin/python",
      "args": ["-m", "hatun_mcp.server"],
      "env": { "SZL_API_KEY": "szl_YOUR_KEY" }
    }
  }
}
```

## Cursor

Use `clients/cursor_mcp.json` (same shape as Option A) and `clients/.cursorrules` for governance hints.

---

## Smoke test before wiring a client

```bash
# 1) Server up?
curl https://szlholdings-hatun-mcp.hf.space/healthz
# → {"status":"ok","chain_verified":true,"signer_mode":"ECDSA-P256","protocol_revision":"2025-06-18"}

# 2) What tools exist? (16, with the locked doctrine numbers)
curl https://szlholdings-hatun-mcp.hf.space/.well-known/mcp/server-card.json

# 3) Verify the signing key
curl https://szlholdings-hatun-mcp.hf.space/pubkey
```

A raw JSON-RPC `initialize` against `/mcp` returns `protocolVersion: 2025-06-18` and
`serverInfo.name: hatun-mcp` — see VERIFY_REPORT.md for the full request/response transcript.

---

## What the tools do (quick map)

`szl_a11oy_code_chat`, `szl_killinchu_detect`, `szl_killinchu_cue` (2-person gate), `szl_sentra_scan`,
`szl_rosie_reason`, `szl_khipu_verify`, `szl_lean_verify`, `szl_puriq_evaluate`, `szl_yachay_dome_predict`,
`szl_wayra_recent`, `szl_anatomy_3d_render`, `szl_doctrine_lookup`, `szl_yuyay_score`, `szl_thesis_query`,
`szl_drone_lookup`, `szl_formula_evaluate`.

Example tool call (`szl_formula_evaluate`):
```json
{"name": "szl_formula_evaluate",
 "arguments": {"name": "puriq", "args": {"yuyay": 0.9, "utility": 0.8, "latency_ms": 100}}}
```
The argument key is `name` (the formula name) plus an `args` object. Known formulas: `puriq`, `kl_divergence`,
`sigmoid`, `liu_hui_pi`.

---

## Status tab

A live status / tool-list / invocations view ships inside a11oy at
https://szlholdings-a11oy.hf.space/hatun-mcp.
