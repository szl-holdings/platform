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

## Recent fixes

See `CHANGELOG.md` for the full list. The most recent transport hardening
(JSON envelopes on every error path, per-session SDK `Server` instances,
extension negotiation, terminated-session 404, PQC arg-order fix) is
tracked in **szl-holdings/platform#113** and brings the suite to 27/27.
