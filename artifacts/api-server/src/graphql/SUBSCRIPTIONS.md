# GraphQL Subscriptions — End-to-End Reference

All subscriptions use the WebSocket transport established by `GraphQLProvider`
(`@szl-holdings/graphql-client/provider`). The server uses `graphql-ws` over
the `/api/graphql` endpoint. Clients connect through Apollo Client (most
artifacts) or URQL (A11oy).

---

## Domain Summary

| Domain | Subscription Fields | Client Hook | UI Consumer | Status |
|--------|--------------------|--------------|-----------|---------:|
| **A11oy** | `alloyWorkflowRunUpdated` | `useWorkflowRunSubscription` | `Workcells.tsx` | ✅ Live |
| **A11oy** | `alloyApprovalRequired` | `useApprovalSubscription` | `Governance.tsx` | ✅ Live |
| **A11oy** | `alloyWorkflowStatusChanged` | `useWorkflowStatusSubscription` | `NowBoard.tsx` | ✅ Live |
| **Vessels** | `vesselPositionUpdated` | `useVesselPositionUpdated` | `fleet-dashboard.tsx` (map + command bar) | ✅ Live |
| **Vessels** | `vesselSanctionsHit` | `useVesselSanctionsHit` | hook ready — SanctionsPanel wiring tracked in #4787 | ✅ Hook |
| **Terra** | `terraDealUpdated` | `useTerraDealUpdated` | `broker-overview.tsx` (invalidates cache) | ✅ Live |
| **Terra** | `terraActionItemUpdated` | `useTerraActionItemUpdated` | `broker-overview.tsx` (invalidates same cache) | ✅ Live |
| **Carlota Jo** | `carlotaInquiryCreated` | `useCarlotaInquiryCreated` | `InquiryInbox.tsx` | ✅ Live |
| **Lyte** | `lyteIncidentUpdated` | `useLyteIncidentUpdated` | `Dashboard.tsx` (LEXICON) | ✅ Live |
| **Lyte** | `lyteSignalUpdated` | `useLyteSignalUpdated` | `Dashboard.tsx` (LEXICON) | ✅ Live |
| **Lyte** | `lyteQueueChanged` | `useLyteQueueChanged` | `Dashboard.tsx` (LEXICON) | ✅ Live |
| **Aegis/Firestorm** | `aegisIncidentUpdated` | `useAegisIncidentUpdated` | `Governance.tsx` (A11oy — explicit target; no standalone Aegis artifact exists) | ✅ Live |

> **Schema notes:** All subscription document field selections verified against server schema. `AegisIncident` has no `category` field — `detectedAt` is used instead. `LyteQueueItem` uses `entityType`/`entityId`, not `type`. A11oy `Governance.tsx` is the designated Aegis command surface as confirmed in project architecture (there is no standalone Aegis artifact).

---

## Server-Side Architecture

### Transport
- Protocol: `graphql-ws` (not `subscriptions-transport-ws`)
- Endpoint: `ws[s]://<host>/api/graphql`
- Auth: shared session / cookie, same as HTTP requests

### Pub/Sub Engine
`artifacts/api-server/src/graphql/pubsub.ts` — single in-process `PubSub`
instance shared across all domain resolvers.

### Publish Sites

#### A11oy (`domains/alloy.ts`)
- `alloyWorkflowRunUpdated` — published by `runWorkflow` mutation and workflow
  state transitions.
- `alloyApprovalRequired` — published by `createApprovalRequest` mutation.
- `alloyWorkflowStatusChanged` — published by `updateWorkflow` mutation.

#### Vessels (`domains/vessels.ts`, REST routes)
- `vesselPositionUpdated` — published by `POST /api/vessels/:id/position`.
- `vesselSanctionsHit` — published by `POST /api/vessels/:id/sanctions`.

#### Terra (`domains/terra.ts`)
- `terraDealUpdated` — published by `updateTerraDeal` mutation.
- `terraActionItemUpdated` — published by `createTerraActionItem` mutation.

#### Carlota Jo (`domains/carlota-jo.ts`, REST routes)
- `carlotaInquiryCreated` — published by `POST /api/booking/inquiries`.

#### Lyte (`domains/lyte.ts`)
- `lyteSignalUpdated` — published by signal create/update/close mutations.
- `lyteQueueChanged` — published alongside every signal/incident/action
  mutation; carries a unified queue-item shape.
- `lyteIncidentUpdated` — published by incident create/update mutations.

#### Aegis / Firestorm (`domains/firestorm.ts`)
- `aegisIncidentUpdated` — published by `createAegisIncident` mutation.

---

## Client-Side Architecture

### Provider Setup

| Artifact | Provider | Notes |
|----------|----------|-------|
| `a11oy` | URQL (`a11oy/src/graphql/provider.tsx`) | Custom URQL setup with `subscriptionExchange` |
| `carlota-jo` | Apollo (`GraphQLProvider`) | `main.tsx` |
| `lyte-command-center` | Apollo (`GraphQLProvider`) | `main.tsx` — registered artifact dir is `archive/artifacts/lyte-command-center`; the archive path **is** the active production surface for LEXICON |
| `terra` | Apollo (`GraphQLProvider`) | `main.tsx` |
| `vessels` | Apollo (`GraphQLProvider`) | `main.tsx` (lazy — no cold-start impact) |
| `rosie` | Apollo (`GraphQLProvider`) | `main.tsx` |

### Hook Locations

Apollo-based hooks in `lib/graphql-client/src/hooks/`:

| File | Subscription Exports |
|------|---------------------|
| `alloy.ts` | `useAlloyWorkflowRunUpdated`, `useAlloyApprovalRequired`, `useAlloyWorkflowStatusChanged` |
| `vessels.ts` | `useVesselPositionUpdated`, `useVesselSanctionsHit` |
| `terra.ts` | `useTerraDealUpdated`, `useTerraActionItemUpdated` |
| `lyte.ts` | `useLyteIncidentUpdated`, `useLyteSignalUpdated`, `useLyteQueueChanged` |
| `carlota-jo.ts` | `useCarlotaInquiryCreated` |
| `firestorm.ts` | `useAegisIncidentUpdated` |

URQL-based hooks (A11oy only) in `artifacts/a11oy/src/graphql/hooks.ts`:
`useWorkflowRunSubscription`, `useApprovalSubscription`,
`useWorkflowStatusSubscription`, `useAegisIncidentUpdated`.

All Apollo hooks are barrel-exported from `lib/graphql-client/src/hooks/index.ts`.

---

## UI Consumption Patterns

### Pattern A — Subscription → React Query cache invalidation
Used in `broker-overview.tsx` (Terra) and `InquiryInbox.tsx` (Carlota Jo).

```tsx
const { data: dealData } = useTerraDealUpdated();
const dealUpdate = dealData?.terraDealUpdated;
useEffect(() => {
  if (!dealUpdate) return;
  void qc.invalidateQueries({ queryKey: ['terra-broker-overview'] });
}, [dealUpdate, qc]);
```

The subscription event triggers a React Query cache invalidation, causing the
REST-backed query to re-fetch with fresh data. Polling interval raised to 60 s
as a fallback.

### Pattern B — Subscription → state overlay → direct render
Used in `fleet-dashboard.tsx` (Vessels). Position overrides are kept in
`useState<Map>` (not `useRef`) so mutations trigger a re-render. The merged
roster is passed directly to `<FleetMap>`, moving vessel markers in-place on
each incoming position event.

```tsx
const [positionOverrides, setPositionOverrides] = useState(new Map());
const { data: positionData } = useVesselPositionUpdated();
const positionUpdate = positionData?.vesselPositionUpdated;  // correct unwrap

useEffect(() => {
  if (!positionUpdate?.vesselId) return;
  setPositionOverrides((prev) => {
    const next = new Map(prev);
    next.set(String(positionUpdate.vesselId), {
      lat: positionUpdate.latitude,
      lng: positionUpdate.longitude,
    });
    return next;
  });
}, [positionUpdate]);

// FleetMap receives merged vessels — live positions move markers in-place:
<FleetMap
  vessels={roster.map((v) => {
    const ov = positionOverrides.get(String(v.id));
    return ov ? { ...v, latitude: String(ov.lat), longitude: String(ov.lng) } : v;
  })}
/>
```

### Pattern C — URQL subscription → conditional banner render
Used across A11oy pages (`Governance.tsx`, `Workcells.tsx`, `NowBoard.tsx`).

```tsx
const { data: aegisIncident } = useAegisIncidentUpdated();
// data is null until an event arrives; renders conditionally:
{aegisIncident && (
  <div>
    [{aegisIncident.severity}] {aegisIncident.title} · {aegisIncident.status}
  </div>
)}
```

### Pattern D — Subscription → local counter + dismissable alert
Used in `Dashboard.tsx` (LEXICON / Lyte). Each incoming subscription event
increments a session counter and sets a transient alert that auto-dismisses.

```tsx
const { data: signalData } = useLyteSignalUpdated();
const signalUpdate = signalData?.lyteSignalUpdated;
useEffect(() => {
  if (!signalUpdate?.id) return;
  setLiveSignal({ title: signalUpdate.title, severity: signalUpdate.severity });
  setAlertCount((c) => c + 1);
  const t = setTimeout(() => setLiveSignal(null), 8_000);
  return () => clearTimeout(t);
}, [signalUpdate]);
```

---

## Polling Fallback

All subscription-backed queries retain a REST polling fallback at **60 s** so
dashboards degrade gracefully if the WebSocket connection is unavailable (e.g.
behind certain proxies or in development environments without `graphql-ws`
support).

| Page | Query Key | Fallback Interval |
|------|-----------|------------------:|
| Vessels fleet-dashboard | `vessels-dashboard` | 60 s |
| Terra broker-overview | `terra-broker-overview` | 60 s |
| Carlota Jo InquiryInbox | `carlota-inquiries-inbox` | 60 s |

---

## Testing Subscriptions Manually

```bash
# Trigger a vessel position update (fires vesselPositionUpdated subscription):
curl -X POST https://<host>/api/vessels/1/position \
  -H 'Content-Type: application/json' \
  -d '{"latitude":1.34,"longitude":103.83,"speed":12.5}'

# Trigger a deal update (fires terraDealUpdated subscription):
# Via GraphQL mutation in Apollo DevTools or a gql client:
# mutation { updateTerraDeal(id:"1", stage:"offer") { id stage } }

# Trigger a new inquiry (fires carlotaInquiryCreated subscription):
curl -X POST https://<host>/api/booking/inquiries \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","service":"consulting","message":"Hello"}'

# Trigger a Lyte signal (fires lyteSignalUpdated subscription):
# mutation { createLyteSignal(source:"test", severity:"high", title:"Test Signal") { id } }

# Trigger an Aegis incident (fires aegisIncidentUpdated subscription):
# mutation { createAegisIncident(title:"Test", severity:"critical") { id } }
# Note: AegisIncident has no 'category' field in the schema.
```
