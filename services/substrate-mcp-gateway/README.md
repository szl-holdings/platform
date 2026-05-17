# @szl/substrate-mcp-gateway

MCP (Model Context Protocol) gateway for the Substrate runtime. Exposes
substrate workflow tooling, resources, and prompts over both the legacy
SSE transport (MCP 2024-11-05) and the Streamable HTTP transport
(MCP 2025-11-25), plus an OAuth 2.1 + PKCE surface and PRAXIS / PQC
identity envelopes on every tool response.

## Tests

```sh
pnpm --filter @szl/substrate-mcp-gateway test
```

The end-to-end suite in `tests/e2e.test.ts` exercises 27 MCP-spec
scenarios (initialize, tools, resources, prompts, SSE lifecycle, session
termination, OAuth round-trip, security headers, etc.).

## Extension negotiation

Per the official MCP SDK schema, clients advertise extensions on
`initialize` at `params.capabilities.extensions`, and the server echoes
back the intersection with its own advertised set at
`result.extensions`. The gateway now relies on the SDK's parsed schema
for this — there is no raw-body inspection or response rewriting on the
hot path.

Example client request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "extensions": {
        "szl/governed-autonomy": { "version": "1.0" }
      }
    },
    "clientInfo": { "name": "my-client", "version": "1.0.0" }
  }
}
```

The discovery manifest at `GET /.well-known/mcp` advertises
server-supported extensions inside `capabilities.extensions` (the
spec-compliant location). Test 18 in `tests/e2e.test.ts` is the
canonical example of the negotiation round-trip.

## Recent fixes

See `CHANGELOG.md` for the full list. The most recent transport hardening
(JSON envelopes on every error path, per-session SDK `Server` instances,
extension negotiation, terminated-session 404, PQC arg-order fix) is
tracked in **szl-holdings/platform#113** and brings the suite to 27/27.
