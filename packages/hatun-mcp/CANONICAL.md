# CANONICAL POINTER — hatun-mcp

> **Canonical MCP server: [`szl-holdings/hatun-mcp`](https://github.com/szl-holdings/hatun-mcp).**

`platform/packages/hatun-mcp/` is a **monorepo-embedded copy** of the doctrine-aware
Hatun-MCP server. The **live, canonical MCP server** — the fleet's only spec-compliant
Streamable HTTP MCP transport, with the full governed tool catalog (23 tools; this
embedded copy exposes 16) — is the standalone repository:

```
https://github.com/szl-holdings/hatun-mcp
```

## Why this copy is NOT canonical

- The standalone repo carries the **larger, current tool catalog** and the live
  `hf-deploy` workflow that ships the running server.
- This embedded copy exists so platform packages can import the governance/backends
  helpers locally; it must not diverge from the canonical server's contracts.

## Fold-in plan (later founder step — DO NOT execute now)

1. **Do not break the live MCP server.** The canonical `hatun-mcp` repo powers the
   running Streamable-HTTP endpoint; no change here may alter its served tool list,
   tool names, or transport.
2. Repoint platform imports of `packages/hatun-mcp/*` at the canonical package
   (published wheel or git submodule pinned to a `hatun-mcp` release tag).
3. Once nothing in platform imports this local copy, it may be reduced to a thin
   re-export shim or removed — **by a deliberate founder action only**. Per the
   CONSOLIDATION SAFETY RULE, this change adds a pointer only; **nothing is deleted
   and no code is changed**, keeping everything reversible.

---

Doctrine v11 LOCKED · 749/14/163 · kernel c7c0ba17 · Λ = Conjecture 1 (never a theorem) · SLSA L1 honest

Signed-off-by: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
