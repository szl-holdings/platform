# Warhacker 2026 — one-pager

**Author:** SZL Holdings · **Hub:** [`/rosie/warhacker`](https://example.invalid/rosie/warhacker) · **Status:** 5 / 5 lanes operational against the live backend.

Every lane below is wired to a live POST endpoint on the platform API
server that emits a **hash-chained Doctrine V6 receipt chain**. Click
*Run This Demo* on the hub to mint a fresh chain in front of the
operator — no slideware, no canned screenshots.

---

## Lane → Artifacts → UDS bundles → Receipt kinds

| # | Lane | Owning artifact(s) | UDS bundles | Receipt classes |
|---|---|---|---|---|
| 1 | Fragmented Satellite Ground Software | ROSIE (hub) | `rosie-uds` + `sentra-uds` + `amaru-uds` + `a11oy-uds` | `bundle.composition.v1`, `attestation.chain.v1`, `observability.plane.v1` |
| 2 | Military Deployment Health Screening | Amaru / Conduit | `amaru-uds` | `extraction.schema-grounded.v1`, `memory.recall.v1`, `unit.readiness.v1` |
| 3 | AI Oversight for Autonomous Drones | ROSIE | `rosie-uds` | `graph.plan.v1`, `ctm.tick.v1`, `time-r1.window.v1`, `lambda.invariant.v1` |
| 4 | Trajectory Data Visualization | Vessels + ROSIE | `rosie-uds` | `pipeline.stage.v1` ×2, `time-r1.window.v1`, `context.card.v1` |
| 5 | AI at the Tactical Edge | Sentra + ROSIE | `rosie-uds` + `sentra-uds` | `edge.drill.v1`, `peak.detection.v1`, `antivenom.catch.v1` |

---

## Three-command deploy (Lane 1)

```
uds-cli bundle create . -f uds-bundle.local.yaml --confirm
uds-cli bundle deploy ./uds-bundle-warhacker-amd64-1.0.0-alpha.tar.zst --confirm
uds-cli bundle inspect ./uds-bundle-warhacker-amd64-1.0.0-alpha.tar.zst --attest
```

One bundle, one attestation chain, one tenant gateway, one Loki +
Prometheus plane.

## Funnels in from

- A11oy home — Warhacker tile → deep-links into **Lane 1**.
- Sentra landing — Warhacker tile → deep-links into **Lane 5**.
- Conduit landing — Warhacker tile → deep-links into **Lane 2**.

All three tiles ship in `main` and render above the fold on the
artifact landing pages.

## Engineering posture

- **No DoD telemetry.** Each lane runs on a synthetic stimulus shaped
  to the real receipt schemas, so the chain is reproducible offline.
- **No new auth surface.** Lane endpoints are mounted under the
  existing `/api` router behind the same middleware stack as
  `electrodynamics` and `perception-bio`.
- **No new packages added** — receipt emission is deliberately local to
  the `warhacker.ts` route so the demo is portable.

## Companion readiness checklist

See [`warhacker-2026-readiness.md`](./warhacker-2026-readiness.md) for
the per-lane route, backend dependency, and a captured receipt sample.
