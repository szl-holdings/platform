# Substrate MCP Gateway — Public Endpoint Reference

**File:** `services/substrate-mcp-gateway/`
**Status:** BUILT. Port 3700 (HTTP+SSE). Port bind in Dockerfile.
**Wire path:** Expose via reverse-proxy at `https://api.a11oy.ai/mcp` — see §3 Wiring-1 in `team/deepwire/DEVP.md`.

---

## Connection

```json
{
  "mcpServers": {
    "szl-substrate": {
      "url": "https://api.a11oy.ai/mcp",
      "transport": "streamable-http",
      "headers": { "Authorization": "Bearer <SUBSTRATE_GATEWAY_API_KEY>" }
    }
  }
}
```

Discovery: `GET https://api.a11oy.ai/.well-known/mcp`
OAuth metadata: `GET https://api.a11oy.ai/.well-known/oauth-authorization-server`

---

## 11 Governed Tools

| Tool | Description |
|------|-------------|
| `substrate_submit_run` | Submit a governed workflow — policy-compiled, approval-gated, DSSE-signed |
| `substrate_get_run` | Poll run state, stage results, evidence bundle |
| `substrate_replay` | Deterministic replay for governance audit |
| `substrate_counterfactual` | Model/policy substitution diff — auditor counterfactual |
| `substrate_list_approvals` | Pending human-approval gates |
| `substrate_approve` | Approve a gate (actor + note recorded in proof entry) |
| `substrate_reject` | Reject a gate (reason written to evidence chain) |
| `substrate_list_workflows` | Enumerate registered workflows |
| `search_available_servers` | Discover NuroMesh MCP servers by query |
| `enable_server` | On-demand connect to a NuroMesh domain server |
| `disable_server` | Disconnect a server, free context allocation |
| `agent_delegate` | Delegate task to NuroMesh domain agent (policy-gated) |

---

## PRAXIS Intelligence Fabric Resources (MCP Resources)

| URI | Description |
|-----|-------------|
| `nexus://convergence/active` | Live cross-domain intelligence correlations |
| `nexus://convergence/history` | Recent convergence events with resolution status |
| `nexus://signals/maritime` | Real-time maritime domain signal stream |
| `nexus://signals/security` | Real-time cybersecurity signal stream |
| `nexus://signals/all` | Aggregate signal stream across all SZL domains |
| `nexus://agents/registry` | Discoverable NuroMesh domain agent registry |
| `nexus://evidence/graph` | Evidence items with provenance chains |
| `nexus://evidence/trace/{id}` | Full provenance trace for any AI decision |

---

## Interactive MCP Apps (ui:// resources)

Tools with `_meta.ui` render interactive HTML micro-dashboards inline in Claude Desktop:

| Resource | Renders |
|----------|---------|
| `ui://szl/data-table` | Sortable/filterable table with CSV export |
| `ui://szl/chart` | Line, bar, pie, area, scatter, donut charts |
| `ui://szl/approval-form` | Governed approval/rejection form |
| `ui://szl/metrics` | KPI card grid with trend indicators |
| `ui://szl/timeline` | Chronological audit trail with severity badges |

---

## Honest Labels

- Every run: DSSE-signed receipt (`SUBSTRATE_SIGNING_KEY` HMAC).
- Λ = **Conjecture 1 — advisory gate, NOT a theorem.**
- SLSA L1 (honest). L2 build-attested on container image.
- Extensions: `szl/governed-autonomy`, `szl/counterfactual-replay`, `szl/praxis-consciousness`, `szl/praxis-convergence`, `szl/praxis-federation`.

---

## Environment

| Variable | Description |
|----------|-------------|
| `SUBSTRATE_GATEWAY_PORT` | HTTP port (default: 3700) |
| `SUBSTRATE_GATEWAY_API_KEY` | Bearer token for write operations |
| `SUBSTRATE_SIGNING_KEY` | 32-byte hex HMAC key for evidence bundles |
| `NODE_ENV` | `production` enforces API key requirement |
