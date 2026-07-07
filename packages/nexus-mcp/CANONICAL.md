# CANONICAL POINTER — MCP server

> **Canonical MCP server: [`szl-holdings/hatun-mcp`](https://github.com/szl-holdings/hatun-mcp).**

## Roles (honest distinction — these are NOT byte-duplicates)

| Package | Role | Canonical? |
|---------|------|-----------|
| [`szl-holdings/hatun-mcp`](https://github.com/szl-holdings/hatun-mcp) | The **live MCP server** — Streamable-HTTP transport + governed tool catalog | ✅ canonical server |
| `platform/packages/nexus-mcp` | TypeScript **SDK foundation** (governance wrapper over `@modelcontextprotocol/sdk`) used to *build* servers | library only |
| `platform/packages/hatun-mcp` | Monorepo-embedded Python copy of the Hatun server (subset tool catalog) | non-canonical copy → see its `CANONICAL.md` |

## Fold-in plan (later founder step — DO NOT execute now)

1. **Do not break the live MCP server.** No change here may alter the served tool
   list, tool names, or transport of the canonical `hatun-mcp` server.
2. If `nexus-mcp`'s governance-wrapper capabilities are to become the shared SDK
   base for the canonical server, that is a deliberate, tested migration into
   `szl-holdings/hatun-mcp` — tracked as a separate founder work unit, not this change.
3. Until then, `nexus-mcp` remains the SDK library and `hatun-mcp` remains the
   canonical server. Per the CONSOLIDATION SAFETY RULE this change **adds a pointer
   only**; nothing is deleted and no code is changed, keeping everything reversible.

---

Doctrine v11 LOCKED · 749/14/163 · kernel c7c0ba17 · Λ = Conjecture 1 (never a theorem)

Signed-off-by: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
