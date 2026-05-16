# @szl/substrate-mcp-gateway — Changelog

## Unreleased

### Fixed — MCP transport returns proper JSON envelopes (szl-holdings/platform#113)

The Streamable HTTP transport (`POST/GET/DELETE /mcp`) was returning HTML 404
and HTML 500 pages on most of the paths the e2e suite exercises, leaving 19 of
27 tests red. Root cause and fixes:

- **One-shot SDK `Server`**: the MCP SDK's `Server` instance carries an
  `initialized` flag and `Server.connect()` may only be invoked once per
  instance. The previous transport reused a singleton `PRAXISMcpServer`
  across every Streamable HTTP session, so the second `initialize` POST
  always failed with `Invalid Request: Server already initialized` and
  Express's default HTML 500 page leaked through.
  Fix: extract `createGatewayServer()` factory in `nexus-gateway-server.ts`
  and build a fresh `PRAXISMcpServer` + `StreamableHTTPServerTransport`
  pair per session inside `transport/http.ts`.

- **Terminated-session POSTs**: requests carrying an `Mcp-Session-Id` for a
  session that had been DELETEd fell through to the bootstrap path and
  produced a 400. The MCP spec requires 404. Fix: explicitly return a 404
  JSON envelope when an unknown `Mcp-Session-Id` is supplied.

- **Extension negotiation**: clients that send `params.extensions` on
  `initialize` expect the server to echo back the intersection with its
  own advertised extensions. The SDK does not implement extension
  negotiation, so the response was missing the `extensions` field. Fix:
  wrap `res.write` / `res.end` / `res.writeHead` / `res.setHeader` for the
  initialize response, parse the JSON-RPC body, inject the negotiated
  `extensions` object, and re-emit with a corrected `Content-Length`.

- **Accept header tolerance**: the SDK strictly requires
  `application/json, text/event-stream` on POST. Many real MCP clients
  send only one. Fix: normalize both `req.headers.accept` and
  `req.rawHeaders` so the SDK accepts either form (response stays JSON
  thanks to `enableJsonResponse: true`).

- **Notification fast-path**: JSON-RPC notifications (`notifications/*`,
  no `id`) are now answered with `202 Accepted` directly, bypassing the
  transport entirely.

- **`initialize` parameter defaulting**: callers that send `params: {}`
  now have safe defaults filled in for `protocolVersion`, `capabilities`,
  and `clientInfo` so they receive a session id instead of a 400.

- **PQC signer arg order**: `lib/pqc-identity/src/hybrid-signer.ts` was
  calling `@noble/post-quantum`'s `sign(secretKey, msg)` (v0.5 order); v0.6
  reversed the arguments to `sign(msg, secretKey)`.

- **SSE bridges**: `/mcp/sse` and the Streamable GET stream now share a
  `writeSseReadyAndBridge` helper that emits `$/ready` and bridges
  `runtimeEventBus` (`stage:start`, `stage:complete`, `run:complete`) and
  `runEventBus` lifecycle events as single-write SSE frames.

After these changes `pnpm --filter @szl/substrate-mcp-gateway test` is
**27/27 passing**.
