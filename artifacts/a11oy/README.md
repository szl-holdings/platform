# A11oy — governed decision infrastructure prototype

A11oy is a source-backed React prototype for inspecting governed decision
flows. The default Series-A route separates deterministic demonstration
behavior from authenticated operational evidence and fails closed when a
required runtime source is absent.

## Current entry points

- `/a11oy/start` — the canonical investor and developer view.
- `/a11oy/investor-demo` — compatibility route for the same truth-qualified
  Series-A surface.

The Series-A journey is self-contained. It does not link to legacy seeded
surfaces as evidence of live operations.

## Evidence states

The UI uses one six-state operational vocabulary:

- `REAL` — authenticated or independently observed operational evidence with
  current provenance.
- `DEMO` — deterministic source-backed interface, fixture, or scenario.
- `UNAVAILABLE` — no qualifying authenticated source or runtime witness.
- `DEGRADED` — a qualifying source is present but observably impaired.
- `BLOCKED` — policy, authority, or safety prevents an external action.
- `ROADMAP` — planned capability without an implemented and observed source.

At this revision the Series-A interface and its scenarios are `DEMO`, external
mutation is `BLOCKED`, and authenticated Workcell, GraphQL, deployment, and
customer-runtime evidence is `UNAVAILABLE`. Source presence alone is not
`REAL` operational evidence.

## Run locally

From the monorepo root:

```bash
pnpm install --frozen-lockfile
pnpm --filter @workspace/a11oy dev
```

The local route is normally served beneath `/a11oy/`. No API server is required
to inspect the fail-closed Series-A surface. A successful local start or HTTP
response is not deployment evidence.

## Verify the source contract

```bash
pnpm --filter @workspace/a11oy test:series-a
pnpm --filter @workspace/a11oy typecheck
pnpm --filter @workspace/a11oy build
```

Record the actual command results before making a verification claim. Hosted
CI, protected-main merge, deployment, production health, and customer use are
separate evidence gates.

## Product boundary

The current source includes a six-buyer `Observe → Gate → Act → Prove` demo,
an inline developer path, a typed receipt shape, and fail-closed Omnia network
configuration. It does not claim:

- production deployment or external connector parity;
- customer use, revenue, retention, or independently observed outcomes;
- cryptographically verified production executions or deployed receipts;
- certification, audit opinion, legal conclusion, or regulatory status; or
- authority to transact, file, notify, or change a customer environment.

Architecture reference:
[`docs/architecture/architecture.md`](../../docs/architecture/architecture.md).
