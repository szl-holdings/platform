# @szl/substrate-mcp-gateway — Changelog

## Unreleased

### Changed — One PRAXISMcpServer now serves every Streamable HTTP session (#5068)

Routing inside `MultiplexingTransport` prefers the AsyncLocalStorage-bound
session for outbound sends (responses, in-handler sampling, related
notifications). The inbound request-owner map is keyed by composite
`${sid}::${requestId}` because JSON-RPC ids are only required to be unique
*per connection* — two concurrent sessions can legally reuse the same id.
A new `tests/e2e.test.ts` case (`29. concurrent sessions with colliding
JSON-RPC ids…`) fires 10 parallel rounds across two sessions reusing
identical request ids to guard against cross-session response leakage.


The gateway previously built a fresh `PRAXISMcpServer` per Streamable HTTP
session — even after task #5059 cached the heavy *inputs*, every initialize
still re-registered ~26 tools, ~N resources, and ~N prompts on a brand-new
SDK `McpServer`. The blocker was the MCP SDK's `Server` class: it carries a
one-shot `initialized` flag and only allows `Server.connect()` once per
instance.

`PRAXISMcpServer` now exposes a `MultiplexingTransport` (in `packages/
nexus-mcp/src/multiplexing-transport.ts`). On first call to
`attachSession(sub)`, the SDK Server is connected to the multiplexer
exactly once; subsequent calls just register the per-session
`StreamableHTTPServerTransport` as a sub-transport. Inbound messages are
forwarded onto the shared Server with the originating session id exposed
both via `extra.sessionId` and via a dynamic `transport.sessionId` getter
backed by `AsyncLocalStorage` (the SDK reads `capturedTransport.sessionId`
synchronously inside `_onrequest`). Outbound sends route back to the
correct session via response-id lookup, `relatedRequestId`, the
ALS-active session, or — for un-targeted notifications — broadcast to
every live session.

Net effect: per-session cost is now just transport bookkeeping (one map
insertion + onmessage/onclose hookup). Tool, resource, and prompt
registration happen once at module load. The gateway server cache and
`disposeGatewayServer()` are gone; every consumer (HTTP, legacy SSE,
stdio) calls into the same singleton `getGatewayServer()`.

`requestSampling()` accepts an optional `sessionId` so the bridge can
target a specific client when more than one session is live; without it,
the first registered session is picked (matching the previous live-server
fan-out behaviour).

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

- **Extension negotiation** (spec-compliant location, task #5072):
  clients advertise extensions on `initialize` at
  `params.capabilities.extensions` — the location defined by the
  official MCP SDK schema. The server echoes back the intersection
  with its own advertised set at `result.extensions`. Negotiation now
  lives inside `PRAXISMcpServer`, which overrides the SDK's
  `initialize` handler and reads the parsed schema directly. The
  earlier response-rewriting hack (wrapping `res.write` / `res.end`
  and recomputing `Content-Length` to splice extensions into the
  serialized body, which had to inspect the raw request body for a
  top-level `params.extensions`) has been removed. Test 18 in the
  e2e suite is the canonical example of the spec-compliant shape;
  test 28 additionally pins HTTP framing.

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
