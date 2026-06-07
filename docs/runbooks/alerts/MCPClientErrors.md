# Runbook — MCPClientErrors

**Severity:** `warning`  
**Alert expression:** `rate(szl_mcp_400_total[5m]) > 0.1`

## What does this alert mean?

Hatun-MCP is returning 4xx at >0.1/s — typically a transport handshake bug or bad client.

## What to check

- Inspect which MCP method/tool returns 400 (mcp-tool-usage dashboard).
- Verify the MCP transport handshake (initialize → tools/list) succeeds.
- Check client SDK version compatibility.

## How to recover

- Fix the handshake / negotiate the correct protocol version.
- If a single misbehaving client, rate-limit or block it.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
