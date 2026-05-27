# Sentra Detector Framework

> **Goal:** any engineer (human or agent) can land a new Sentra detector
> in **under one hour** by following this guide — in TypeScript or in
> Python — and have it flow straight into the existing alerts / queue /
> workcell surfaces with a chain receipt at every step.

## The one-contract picture

Every detector — regardless of host language — implements the same
canonical contract from `@szl-holdings/sentra-detector-sdk`:

```ts
interface Detector {
  manifest: DetectorManifest;        // id, kind, inputs, costClass, governanceClass
  evaluate(ctx: DetectorContext): Promise<Finding[]>;
}
```

Every `Finding` produced by a detector lands in `sentra_findings`,
keyed by `chain_receipt_id` (SHA-256 hash from
`@szl-holdings/szl-receipts`). The same shape feeds:

- `pages/alerts-page.tsx` and `pages/alerts.tsx`
- the workcell handoff in `pages/action-queue.tsx`
- the cross-product A11oy handoff (severity `high+`)

No UI change is required when a new detector ships — the canonical
`Finding` shape maps onto the existing surfaces 1:1.

## Persisted tables

| Table                  | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `sentra_detectors`     | One row per registered detector (manifest)  |
| `sentra_detector_runs` | One row per `run` — duration, status, trace |
| `sentra_findings`      | Every emitted finding, linked to a run      |

## API surface

| Method | Path                                       | Auth                          | Purpose                              |
| ------ | ------------------------------------------ | ----------------------------- | ------------------------------------ |
| GET    | `/api/sentra/detectors`                    | public                        | List registered detectors            |
| POST   | `/api/sentra/detectors/register`           | session (`authMiddleware`)    | Register a TS detector manifest      |
| POST   | `/api/sentra/detectors/sidecar-register`   | shared secret                 | Sidecar handshake (bulk register)    |
| POST   | `/api/sentra/detectors/:id/run`            | session (`authMiddleware`)    | Run a detector synchronously         |
| GET    | `/api/sentra/detector-runs`                | public                        | List recent runs (run-history view)  |
| GET    | `/api/sentra/findings`                     | public                        | Query findings (filters: status, …)  |
| POST   | `/api/sentra/findings/:id/resolve`         | session (`authMiddleware`)    | Resolve / suppress a finding         |
| GET    | `/api/sentra/agi/council/verdicts`         | public                        | Last N Detector Council verdicts     |
| POST   | `/api/sentra/agi/council/deliberate`       | public (validated body)       | MARBLE arbitration over candidates   |
| POST   | `/api/sentra/agi/time-r1/score`            | public (validated body)       | Time-R1 trajectory anomaly scoring   |
| GET    | `/api/sentra/agi/bus/snapshot`             | public                        | CTM broadcast bus window             |
| POST   | `/api/sentra/agi/edge-adversary-drill`     | public (validated body)       | End-to-end drill across all four     |

### AGI-stack primitives (#5503)

Four primitives, mounted on `/api/sentra/agi/*`, extend the detector
framework with a shared arbitration + broadcast plane:

| Primitive          | Inspiration                          | DetectorKind | Receipt class                 |
| ------------------ | ------------------------------------ | ------------ | ----------------------------- |
| Detector Council   | MARBLE multi-agent arbitration       | n/a (meta)   | `bench.marble.v1`             |
| Time-R1 scoring    | Time-R1 temporal anomaly model       | `temporal`   | `anomaly.time-r1.v1`          |
| Antivenom matcher  | Antivenom adversarial-input matching | `antivenom`  | `sentra.antivenom-match.v1`   |
| CTM broadcast bus  | Continuous Thought Machine           | n/a (bus)    | `consciousness.broadcast.v1`  |

Council arbitration is **kind-weighted with a diversity floor**: a swarm
from a single detector kind cannot reach `critical`, even at high
individual scores — at least two distinct kinds must co-fire. The
multi-kind bump only applies once the diversity floor is met. The
governance ceiling of the verdict is the strictest class across all
supporting findings (`advisory` < `mutating` < `destructive`), so a
single destructive-class finding forces operator/exec approval on the
whole bundle.

The CTM bus is **re-entrancy-guarded** — broadcasting from inside a
subscriber is a no-op, not a stack overflow. Subscribers see thoughts
in publish order but never their own.

Every mutating route appends to a per-detector `ReceiptChain` and stores
`selfHash` on the run / finding row.

### Security guardrails

- `sidecarBaseUrl` is **allowlisted to loopback by default**. Operators
  who deploy the sidecar off-host must add the target host to
  `SENTRA_SIDECAR_ALLOWED_HOSTS` (comma-separated `host` or
  `host:port`). The check is enforced both at registration and at
  call-time as defense-in-depth against historical rows whose host
  policy has tightened.
- The sidecar handshake is authenticated with a shared secret read
  from `SENTRA_SIDECAR_SHARED_SECRET` (default
  `sentra-sidecar-loopback-dev`). The sidecar sends it as
  `X-Sentra-Sidecar-Secret`.
- Run / resolve routes require a user session (`authMiddleware`),
  matching every other mutating Sentra route.

---

## Land a detector in TypeScript (≤ 30 min)

1. Create `artifacts/api-server/src/lib/sentra-detectors/<your-detector>.ts`:

   ```ts
   import type { Detector, Finding } from '@szl-holdings/sentra-detector-sdk';

   export const yourDetector: Detector = {
     manifest: {
       id: 'ts-yourpod/your-detector',
       label: 'Your Detector',
       description: 'One paragraph an investor would read.',
       kind: 'heuristic',                  // signature | statistical | ml | correlation
       runtime: 'ts',
       inputs: ['your.telemetry.stream'],
       costClass: 'cheap',                 // free | cheap | moderate | expensive
       governanceClass: 'advisory',        // read-only | advisory | mutating | auto-remediable
       attackTechniques: ['T1059'],
       version: '1.0.0',
     },
     async evaluate(ctx) {
       const rows = await ctx.read('your.telemetry.stream');
       ctx.trace('input.loaded', { rows: rows.length });
       // …return Finding[]
       return [];
     },
   };
   ```

2. Register at boot in `artifacts/api-server/src/app.ts` next to
   `heuristicPortScanDetector`:

   ```ts
   sentraDetectorRegistry.register(yourDetector);
   ```

3. Restart the api-server. Trigger:

   ```bash
   curl -X POST http://localhost:5000/api/sentra/detectors/ts-yourpod/your-detector/run \
     -H 'content-type: application/json' \
     -d '{"triggeredBy":"me"}'
   ```

   The run row, findings, and chain receipt are persisted in the same
   request.

---

## Land a detector in Python (≤ 45 min)

1. Stand up the sidecar locally:

   ```bash
   pnpm sentra:sidecar:dev
   ```

   On first run the script bootstraps `services/sentra-detector-sidecar/.venv`
   and starts `uvicorn` on port `8765`. On startup the sidecar registers
   all hosted detectors with the api-server at
   `$SENTRA_API_SERVER_URL` (default `http://127.0.0.1:5000`).

2. Add a detector under
   `services/sentra-detector-sidecar/src/sidecar/detectors/your_detector.py`:

   ```python
   from ..contracts import DetectorContext, DetectorManifest, Finding
   from datetime import datetime, timezone

   class YourDetector:
       manifest = DetectorManifest(
           id="py-yourpod/your-detector",
           label="Your Detector",
           description="One paragraph an investor would read.",
           kind="ml",
           runtime="python",
           inputs=["your.feature.window"],
           costClass="moderate",
           governanceClass="advisory",
           attackTechniques=["T1078"],
           version="1.0.0",
       )

       async def evaluate(self, ctx: DetectorContext) -> list[Finding]:
           rows = ctx.read("your.feature.window")
           ctx.trace("input.loaded", {"rows": len(rows)})
           # ...return list[Finding]
           return []
   ```

3. Register it in
   `services/sentra-detector-sidecar/src/sidecar/main.py`:

   ```python
   from .detectors.your_detector import YourDetector
   registry.register(YourDetector())
   ```

4. Restart the sidecar (`pnpm sentra:sidecar:dev`). The api-server will
   now route `POST /api/sentra/detectors/py-yourpod/your-detector/run`
   over HTTP to the sidecar.

---

## Where to verify your detector landed

- **alerts page** (`/sentra/alerts`) — open findings render in severity
  order.
- **run history** — `GET /api/sentra/detector-runs?detectorId=<id>`.
- **chain receipt** — every run row stores `chainReceiptId` (SHA-256).
- **A11oy handoff** — findings at severity `high` or `critical`
  automatically fire `crossProductHandoff` into the A11oy approval
  queue.

## Canonical examples shipped with the framework

| Id                                            | Runtime | Why it exists                                     |
| --------------------------------------------- | ------- | ------------------------------------------------- |
| `ts-example/heuristic-port-scan`              | ts      | Simplest possible TS detector — proves the loop   |
| `py-example/embedding-drift`                  | python  | Uses canonical `driftScore` from formulas        |
| `py-example/log-anomaly-isolationforest`      | python  | `sklearn.IsolationForest` over a windowed stream |

## Out of scope (deferred)

- **Production deployment of the sidecar.** Local-runnable only.
- **Amaru brain enrichment** — call sites marked `// AMARU_HOOK:`.
- **New threat-source coverage** beyond the three canonical examples.
