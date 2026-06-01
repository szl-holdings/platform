# @szl/substrate-client — Changelog

All notable changes to this package are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org).

---

## [1.0.0] — 2026-04-20

### Added

- **`SubstrateClient`** — typed HTTP client for the Substrate MCP Gateway
  - `submitRun` — submit a workflow run (live or dry-run)
  - `getRun` — poll run state by ID
  - `replay` — replay a completed run from the evidence journal
  - `counterfactual` — replay with model/policy substitution; returns a `CounterfactualDiff`
  - `listApprovals` — list entries in the approvals inbox (optionally filtered by verdict/domain)
  - `approve` — approve a pending `ApprovalGate` with actor, note, and proof provenance
  - `reject` — reject a pending `ApprovalGate` (note required)
  - `listWorkflows` — enumerate registered workflows by ID/name
  - `initialize` — negotiate MCP protocol version and get server capabilities
  - `listTools` — retrieve full tool inventory with JSON Schema definitions
  - `health` — gateway health check (unauthenticated)
  - `sseUrl` — returns the SSE endpoint URL for streaming
- **`SubstrateStreaming`** — SSE streaming helper with auto-reconnect
  - `connect` / `disconnect`
  - Configurable `reconnectDelayMs` and `maxReconnectAttempts`
- **`connectRunEvents`** — convenience function returning a `disconnect` callback
- **`SubstrateClientError`** — structured error class with `code` and `data`
- Full TypeScript types for all API objects (`PipelineRunSummary`, `CounterfactualDiff`, `ApprovalEntry`, etc.)
- Python quickstart example in README
