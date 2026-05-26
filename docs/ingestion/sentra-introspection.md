# Sentra Introspection — mitmproxy-style Agent Traffic Forensics

> Synthesis doc for task: *Ingest: mitmproxy-style introspection for Sentra*.
> Study only — no mitmproxy code was copied. Patterns re-derived in our own
> data shapes and TypeScript/Express stack.

## Source

- **Project**: [mitmproxy](https://github.com/mitmproxy/mitmproxy)
- **License**: MIT (study-only here; we do not vendor or fork code)
- **Docs surveyed**:
  - mitmproxy concepts → flows
    (`https://docs.mitmproxy.io/stable/concepts-flows/`)
  - addons + event hooks
    (`https://docs.mitmproxy.io/stable/addons-events/`)
  - scripting overview
    (`https://docs.mitmproxy.io/stable/addons-overview/`)
  - replay (client + server)
    (`https://docs.mitmproxy.io/stable/overview-features/#replay`)

## Patterns re-derived

| # | mitmproxy pattern | Citation | Re-derivation in Sentra |
|---|-------------------|----------|--------------------------|
| 1 | **Flow** as the atomic unit of capture — a request + matching response + metadata, addressable by id | `concepts-flows` | `AgentTrafficFlow` interface in `artifacts/api-server/src/routes/sentra-agent-traffic.ts` — `flowId`, `agent`, `tool`, `request`, `response`, `observedVsBaseline` |
| 2 | **Streaming event log** — clients tail an append-only feed of new flows rather than polling for diffs | `addons-events` (request/response hooks) | `GET /sentra/agent-traffic/flows` returns a windowed list ordered newest-first; the UI polls every 5s to approximate the stream. Cursor/SSE upgrade tracked as follow-up. |
| 3 | **Replay** — operator can re-issue a captured request to its original target (client-replay) or replay it as a fake server response | `overview-features#replay` | Not wired this task. UI exposes the raw request body so a future replay endpoint can be invoked from the same row. See follow-up §1. |
| 4 | **Scripting / addon hooks** — Python addons subscribe to lifecycle events (request, response, error) for inspection and rewriting | `addons-overview`, `addons-events` | Mapped to our existing `instrument()` + `setInvocationSink()` formula-registry pattern (see `artifacts/api-server/src/lib/sentra-formula-observations.ts`). The `observedVsBaseline` meta block is the analog of an addon's `response` hook output. |
| 5 | **Transparent capture** — proxy intercepts traffic without requiring callers to know about it; flows are auto-recorded | mitmproxy architecture overview | Today we mock the flow source. The intended live wiring binds the existing `sentra-sidecar` (`scripts/sentra-sidecar-dev.sh`) as the transparent capture surface for agent ↔ tool HTTP. See follow-up §2. |

## Placement decision

**Decision: ship a new Sentra page rather than a panel on an existing one.**

Considered placements:
- **Panel on `Forensics Timeline` (`/forensics`)** — wrong axis. That page is
  incident-centric (timeline of host events). Agent-traffic capture is a
  *process-level* feed, not an incident artifact.
- **Panel on `AgentOps Explorer` (`/agentops`)** — closer fit (also about
  agent traces) but that page is decision-fork oriented (judge scores,
  regression flags). Mixing a low-level request/response inspector into it
  would crowd two distinct mental models.
- **New page `Agent Traffic Forensics` (`/agent-traffic`)** — cleanest. It is
  the protocol-level peer to `AgentOps Explorer`'s decision-level view, and
  the SOC Operations sidebar group already holds the other forensics
  surfaces (Forensics Timeline, Evidence Ledger).

Wired into `artifacts/sentra/src/App.tsx` under the **SOC Operations**
group, next to *Forensics Timeline*.

## What ships in this task

- `GET /sentra/agent-traffic/flows` — mocked windowed flow list. Each flow
  carries an `observedVsBaseline` block produced by reusing
  `_testing.projectCandidateCap` + `RISK_CAP_DEFAULT` from
  `sentra-formula-observations.ts`, so the observed-vs-baseline math matches
  what the formula registry would project if the flows were live.
- `artifacts/sentra/src/pages/agent-traffic-forensics.tsx` — two-pane UI:
  streaming list on the left, click-to-inspect detail (request headers,
  request body, response headers, response body, observed-vs-baseline meta)
  on the right. Auto-refreshes every 5s.
- Route registered in `artifacts/sentra/src/App.tsx` at `/agent-traffic`
  under the *SOC Operations* sidebar group.

## Out of scope (explicit)

- No real proxy listener bound to a port.
- No mutation of A11oy / Conduit / ROSIE traffic surfaces.
- No verbatim mitmproxy code; patterns only.

## Named follow-ups

1. **Live capture wiring for `sentra-sidecar`** — extend
   `services/sentra-detector-sidecar` to emit captured agent ↔ tool HTTP
   pairs to a new endpoint (`POST /sentra/agent-traffic/ingest`) and replace
   the mocked `FLOW_TEMPLATES` source with an in-memory ring buffer fed by
   that ingest. Cap retention by count + age; gate behind the existing
   sidecar auth.
2. **Replay endpoint** — `POST /sentra/agent-traffic/flows/:flowId/replay`
   that re-issues the captured request to the original target (client
   replay) or returns the captured response as a stub (server replay).
   Surface a "Replay" button on the flow detail panel and feed each replay
   back through the same `observedVsBaseline` meta projection so drift on
   the replay can be compared to the original.
