# A11oy — governed decision infrastructure prototype

A11oy is a source-backed React prototype for inspecting governed decision
flows. The default Series-A route separates deterministic demonstration
behavior from authenticated operational evidence and fails closed when a
required runtime source is absent.

## Current entry points

- `/a11oy/start` — the canonical investor and developer view.
- `/a11oy/investor-demo` — compatibility route for the same truth-qualified
  Series-A surface.
- `/a11oy/series-a` — an additional alias for that unchanged Series-A surface.
- `/a11oy/product-journey` — investor and developer navigation through the
  explicitly qualified demo, Workcells, architecture, governance, and proof views.
- `/a11oy/atelier` — the separate Atelier workbench for configured inference,
  Turn Capsule continuity, and compile-only Proofweave plans.

The Series-A journey is self-contained. It does not link to legacy seeded
surfaces as evidence of live operations.

## Atelier and Proofweave

The Atelier workbench uses two runtime API surfaces with different evidence
boundaries:

- `POST /api/a11oy/v1/atelier/ask` requests an answer only through a configured,
  allowlisted provider adapter and fails closed when no adapter is available.
  It uses tenant/session-scoped idempotency and commits a bounded Turn Capsule;
  the default store remains process-local, while the optional encrypted adapter
  is limited to restart continuity on one host and one runtime process.
- `POST /api/a11oy/v1/atelier/proofweave/compile` validates and returns a
  deterministic, hash-addressed research plan. It does not fetch sources, call
  a model, run tools or Workcells, approve claims, or store the plan durably.

The companion CLI exposes `a11oy-atelier ask` and `a11oy-atelier weave`; a weave
request requires at least one explicit typed `--claim KIND:statement`. A
successful compile carries evidence class `SIMULATED` plus the separate
lifecycle states `DEMO / COMPILED_NOT_EXECUTED / IN_PROCESS_NOT_STORED`. Its
audit-metadata append is configuration-dependent, and durable-persistence
evidence remains `UNKNOWN`.

The browser surface is intentionally local-development only. An authenticated
local flow uses the explicit loopback shared-proxy bridge, which keeps the API
key server-side and attaches it only to Atelier requests. A production browser
build does not call Atelier health, inference, or Proofweave compile routes
until A11oy has an authenticated server-side session or backend-for-frontend
(BFF); it fails closed as `BLOCKED` with runtime evidence `UNKNOWN`. No
`VITE_*` provider-key path is supported.

See [A11oy Atelier](../../docs/A11OY_ATELIER.md),
[Proofweave](../../docs/A11OY_ATELIER_PROOFWEAVE.md), and the
[dated public-source and license boundary](../../docs/A11OY_ATELIER_LICENSE_BOUNDARY.md),
which is an implementer record with evidence class `DECLARED`.

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

The Workcell registry separates workflow progress from operational availability.
Its 20 records remain deterministic `DEMO` fixtures. Replay controls operate only
the local walkthrough, with pause/resume, reset, and time-scaled playback; they
do not authorize or execute Workcells.

## Verify the source contract

```bash
pnpm --filter @workspace/a11oy test:series-a
pnpm --filter @workspace/a11oy typecheck
pnpm --filter @workspace/a11oy build
pnpm --filter @workspace/a11oy test:product-layout
```

Browser regressions require the repository Playwright Chromium installation.
`test:product-interactions` accepts a loopback-only `A11OY_URL`. For source-bound
evidence, use `pnpm screenshots:a11oy:product-proof` with the required exact source,
tree, ref, repository, contributor, command, and capture-environment variables.
That wrapper owns a fresh production build and local server, verifies interactive
states at five widths, and captures the 15-route, 75-view matrix. Its metadata
binds the interaction receipt, verifier inputs, images, and served-asset digests.
Local evidence remains non-authoritative for hosted promotion or deployment.

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
