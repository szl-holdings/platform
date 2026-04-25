# API Server Changelog

## 2026-04-25 — Task #3453: Wider auth/tenant middleware path-scoping sweep

Defensively path-scoped the top-level `authMiddleware` / `tenantScope` guards
in the remaining 10 sub-router files that were mounted via
`router.use('/<prefix>', lazyMount(...))` (prefix-stripping):

- `innovation-engine.ts` — `INNOVATION_ENGINE_OWNED_PREFIXES`
- `knowledge-graph.ts` — `KNOWLEDGE_GRAPH_OWNED_PREFIXES`
- `prism-counsel-s31.ts` — `PRISM_COUNSEL_S31_OWNED_PREFIXES`
- `prism-counsel-review.ts` — `'/review-desk'`
- `prism-counsel-pilot.ts` — `PRISM_COUNSEL_PILOT_OWNED_PREFIXES`
- `prism-counsel-pilot-one.ts` — `PRISM_COUNSEL_PILOT_ONE_OWNED_PREFIXES`
- `nexus.ts` — `NEXUS_OWNED_PREFIXES`
- `provenance.ts` — `'/'`
- `signal-bus.ts` — `SIGNAL_BUS_OWNED_PREFIXES`
- `pulse.ts` — `PULSE_AUTHENTICATED_PREFIXES`

Extended the static regression test
(`sub-router-middleware-path-scope.test.ts`) with `mustContain` entries for all
10 files and updated the README rule documentation.
