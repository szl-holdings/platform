# @workspace/constellation

Constellation is the **cross-domain ontology and operational graph** for the SZL Agentic Cognitive Operating Intelligence Platform.

## Contract

Constellation defines canonical node and edge schemas with full provenance, freshness, confidence, sensitivity, and business impact tracking. Domain data (Terra parcels, Vessels ships, PRISM matters, Aegis assets, etc.) is projected into the graph through typed adapter interfaces.

### Node Schema Fields

Every `ConstellationNode` carries:
- `id`, `type`, `label`, `domain`
- `provenance` (source, method, confidence, author)
- `freshness` (lastUpdatedAt, TTL, isStale)
- `confidence` (0–1)
- `owner`
- `sensitivityTier` (public → top-secret)
- `businessImpact` (score, estimatedValue, currency, description)
- `linkedTraces` (trace IDs from Trace Graph)
- `linkedActions`
- `tags`

### Adapter Interface

```typescript
import { DomainAdapter, adapterRegistry, projectDomain } from '@workspace/constellation/adapter';

const parcelAdapter: DomainAdapter<TerraParcel> = {
  domain: 'terra',
  sourceType: 'parcel',
  projectNode: (p) => ({ id: p.id, label: p.address, ... }),
};

adapterRegistry.register(parcelAdapter);
const { nodes, edges } = projectDomain(parcelAdapter, parcels);
```

### Query Helpers

```typescript
import { findNeighbors, findPath, subgraph, searchNodes } from '@workspace/constellation/query';

const { nodes, edges } = findNeighbors('node-id', 'outgoing');
const path = findPath('from-id', 'to-id', 5);
const tree = subgraph('root-id', 2);
const results = searchNodes('alpha', { domain: 'terra' });
```

## Non-goals

- Constellation does not store data in a persistent database (use `InMemoryGraphStore` as a reference; wire a database adapter per-app).
- Constellation does not project domain data automatically — apps register adapters in follow-up tasks.
- Constellation does not enforce access control — use Guardian for policy enforcement.

## Absorption

This package absorbs and re-exports `@szl-holdings/atlas-core` as a compatibility shim.
