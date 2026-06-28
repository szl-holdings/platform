# Substrate MCP Gateway — Public Endpoint

URL: https://api.a11oy.ai/mcp
Transport: Streamable HTTP (MCP 2025-11-25)
Auth: Bearer token (SUBSTRATE_GATEWAY_API_KEY)
Discovery: https://api.a11oy.ai/.well-known/mcp

## 11 Governed Tools

- `substrate_submit_run` — submit a governed workflow run
- `substrate_get_run` — poll run state + evidence bundle
- `substrate_replay` — deterministic replay audit
- `substrate_counterfactual` — model/policy substitution diff
- `substrate_list_approvals` — pending human-approval gates
- `substrate_approve` / `substrate_reject` — resolve approval gates
- `substrate_list_workflows` — enumerate registered workflows
- `search_available_servers` / `enable_server` / `disable_server` — NuroMesh fabric
- `agent_delegate` — delegate to NuroMesh domain agent (policy-gated)

## PRAXIS Resources (MCP Resources)

```
nexus://convergence/active
nexus://signals/{domain}
nexus://agents/registry
nexus://evidence/graph
nexus://evidence/trace/{id}
```

## Internal architecture

Service: `services/substrate-mcp-gateway/`
Internal port: 3700 (see `Dockerfile`)
MCP config: `.mcp.json` → `${REPLIT_DEV_DOMAIN}/api/mcp` (dev/internal)
Local stdio config: `services/substrate-mcp-gateway/claude_desktop_config.json`

To expose publicly, reverse-proxy `/mcp/*` → `substrate-mcp-gateway:3700/mcp/*`
and set `SUBSTRATE_GATEWAY_API_KEY` + `SUBSTRATE_SIGNING_KEY`.

## Labels

Every run produces a DSSE-signed receipt.
Λ = Conjecture 1 (advisory gate, NOT a theorem).
SLSA L1 (honest).
