# @szl/substrate-mcp-gateway — Changelog

## Unreleased

### Changed — Per-session gateway construction is now cheap

The Streamable HTTP transport still builds a fresh `PRAXISMcpServer` per
session (the MCP SDK's `Server` class carries a one-shot `initialized` flag,
so a single instance still cannot host more than one session), but the
expensive inputs that go *into* each server are now computed once and reused:

- **PQC identity** (`initGatewayIdentity()` — agent identity issuance and a
  DB-backed CA bootstrap) is cached at module load.
- **Domain roots** (`listRoots('substrate-gateway')`) are cached at module
  load.
- **Domain Apps** (`createDomainApps()`) are cached at module load.

Under load, per-session cost is now dominated by SDK tool/resource/prompt
registration on the new `McpServer`, rather than by repeated cert issuance
and registry rebuilds.

In addition, the per-process bridges that wire `requestSampling` into
`governed-sampling` and `notifyResourceUpdated` into `nexus-fabric` are now
installed exactly **once** and fan out to a live-server registry. Previously
each new session silently overwrote earlier sessions' callbacks, so resource
notifications and sampling requests only reached the most recently created
session. `notifyToolListChanged()` likewise fans out to every live server.

Session lifecycle is unchanged from the caller's perspective: both the
Streamable HTTP and legacy SSE transports now deregister their per-session
server from the live-server set on transport `onclose`, so the set does not
leak across the gateway's lifetime.

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
