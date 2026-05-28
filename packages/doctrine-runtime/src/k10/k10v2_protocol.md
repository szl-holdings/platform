# K10_v2 Replay Protocol

## Abstract

K10_v2 is the second version of the SZL K10 event-sourcing replay protocol.
It extends K10_v1 with snapshot-accelerated replay, Lamport clock ordering,
and Doctrine v6 integration hooks for composition, gate-decision, SCITT, and
A15 persistent homology events.

---

## 1. Motivation

K10_v2 replaces K10_v1's stateful mutation model with **immutable event logs**
and deterministic replay.  The core insight (Helland 2015 [2]) is that any
system state can be reconstructed by replaying an ordered sequence of events
against an empty initial state.

This allows:
- **Auditability:** every policy change is a durable event with a digest.
- **Time-travel debugging:** replay to any prior `seqNo`.
- **Distributed consistency:** Lamport timestamps [1] provide a total order
  without clock synchronisation.

---

## 2. References

1. Lamport, L. (1978). Time, clocks, and the ordering of events in a
   distributed system. *CACM*, 21(7), 558–565.
   doi:[10.1145/359545.359563](https://doi.org/10.1145/359545.359563)

2. Helland, P. (2015). Immutability Changes Everything.
   *acmqueue*, 13(9).
   https://queue.acm.org/detail.cfm?id=2884038

3. Kreps, J., Narkhede, N., & Rao, J. (2011). Kafka: A distributed
   messaging system for log processing. *NetDB 2011*.
   https://www.microsoft.com/en-us/research/wp-content/uploads/2017/09/Kafka.pdf

4. Doctrine v6 §11 "K10_v2 Replay Protocol" (internal).

---

## 3. Event Structure

Each K10_v2 event is a JSON object with the following mandatory fields:

```jsonc
{
  "seqNo": "<bigint as string>",     // Lamport timestamp [1]
  "type": "<K10EventType>",          // see §4
  "nodeId": "<string>",              // originating node
  "wallClockMs": <number>,           // informational only (not used for ordering)
  "payload": { ... },                // type-specific payload
  "digest": "<sha256-hex>"           // SHA-256(seqNo:type:nodeId:JSON(payload))
}
```

### Digest Computation

```
digest = SHA-256( concat(seqNo, ":", type, ":", nodeId, ":", JSON.stringify(payload)) )
```

Digest computation is deterministic: `JSON.stringify` must be called without
replacer or space arguments.  The digest protects event integrity but does not
authenticate the sender — use SCITT envelopes for authenticated notarisation.

---

## 4. Event Types

| Type | Payload fields | Description |
|---|---|---|
| `policy_create` | `{ id, version, lambda, labels, digest }` | New Doctrine v6 policy |
| `policy_update` | same as create | Updated policy (same `id`) |
| `policy_delete` | `{ id }` | Remove policy from registry |
| `composition_run` | `{ outputId, mode, lambda, inputCount }` | DoctrineComposer.compose() result |
| `gate_decision` | `{ principal, resource, action, decision, latencyMicros }` | PolicyGate.evaluate() result |
| `scitt_notarised` | `{ statementHash, logId, logIndex, integratedTime }` | SCITT receipt from Rekor |
| `a15_check` | `{ betti0, satisfied, componentCount, threshold }` | PersistentHomologyChecker result |
| `snapshot` | `{ atSeqNo, stateDigest }` | Snapshot marker (no state mutation) |

---

## 5. Ordering

Events MUST be appended in strictly increasing `seqNo` order.  The `seqNo`
is a Lamport logical clock [1]:

```
seqNo_new = max(seqNo_local, seqNo_received) + 1
```

K10ReplayRoot enforces monotone ordering at `append()` time and throws
`RangeError` on out-of-order events.

---

## 6. Replay Algorithm

```
FUNCTION replay(targetSeqNo):
  1. Find best snapshot S with S.atSeqNo ≤ targetSeqNo  (or empty state)
  2. state = S.state (or emptyState())
  3. FOR each event E in log WHERE S.atSeqNo < E.seqNo ≤ targetSeqNo:
       state = applyEvent(state, E)
  4. RETURN state
```

Snapshot fast-forward reduces replay cost from O(N) to O(N - snapSeqNo)
where N is the total event count [3].

---

## 7. Snapshot Protocol

A snapshot captures the full `K10ReplayState` at a given `seqNo`.  Snapshots:

- MUST include `stateDigest = SHA-256(JSON.stringify(state))`.
- SHOULD be taken every 10,000 events or after significant state changes.
- Are verified at load time; corrupt snapshots are rejected.

---

## 8. State Schema (K10ReplayState)

```typescript
{
  policies: Record<string, unknown>;          // policyId → Doctrine v6 policy
  compositionLog: Array<{
    seqNo: string; outputId: string;
    mode: string; lambda: number;
  }>;
  gateDecisions: Array<{
    seqNo: string; principal: string;
    resource: string; decision: string;
  }>;
  scittReceipts: Array<{
    seqNo: string; statementHash: string; logIndex: number;
  }>;
  a15Checks: Array<{
    seqNo: string; betti0: number; satisfied: boolean;
  }>;
  lastSeqNo: string;
}
```

---

## 9. Doctrine v6 Integration

K10_v2 is the authoritative audit trail for all Doctrine v6 runtime operations:

- Every `DoctrineComposer.compose()` call emits a `composition_run` event.
- Every `PolicyGate.evaluate()` call emits a `gate_decision` event.
- Every `ScittAdapter.notarise()` call emits a `scitt_notarised` event.
- Every `PersistentHomologyChecker.check()` call emits an `a15_check` event.

This provides end-to-end auditability per Doctrine v6 §11 [4].

---

## 10. Security Considerations

- Event digests protect integrity but not authenticity.  For authenticated logs,
  wrap the K10 event stream in SCITT envelopes (see `scitt_adapter.ts`).
- Snapshot state is trusted after digest verification; do not load snapshots
  from untrusted sources.
- The `wallClockMs` field is informational only and MUST NOT be used for
  ordering decisions — only `seqNo` provides a total order [1].

---

## 11. Changelog

| Version | Change |
|---|---|
| v2.0 | Snapshot fast-forward, Lamport clock enforcement, Doctrine v6 event types |
| v1.x | Stateful mutation model (deprecated) |
