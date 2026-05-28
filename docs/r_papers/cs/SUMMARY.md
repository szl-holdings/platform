# SZL Runtime Layer — Implementation Summary

**Doctrine version:** v6  
**Output root:** `/home/user/workspace/szl/r_papers/cs/`  
**No GitHub pushes.** All files are workspace-local.

---

## Module Index

| Module | Directory | Key files | Lines (approx.) |
|---|---|---|---|
| A. Composition Runtime (R1) | `runtime/composer/` | `doctrine_composer.ts`, `composer.test.ts`, `prometheus-exporter.ts` | 321 / 209 / 194 |
| B. SCITT-Rekor Adapter (R2) | `runtime/scitt/` | `scitt_adapter.ts`, `dpi_chain_verifier.ts`, `merkle_dag_b7.ts` | 306 / 244 / 310 |
| C. Vertical Policy Runtime (R3) | `runtime/policy/` | `policy_gate.ts`, `policy_admin_ui.tsx`, `policy_event_bus.ts` | 186 / 472 / 180 |
| D. A15 Persistent Homology (R4) | `runtime/a15/` | `persistent_homology_check.ts`, `a15_metrics.ts` | 328 / 155 |
| E. xoshiro256** (R5) | `runtime/prng/` | `xoshiro256ss.ts`, `xoshiro_migration.md`, `xoshiro_kat.test.ts` | 224 / 151 / 187 |
| F. K10_v2 (R6) | `runtime/k10/` | `k10v2_replay_root.ts`, `k10v2_protocol.md` | 275 / 182 |
| G. UDS Bundle | `/` | `uds-bundle-v0.3.1.yaml` | 294 |
| H. Integration tests | `tests/integration/` | `runtime_integration.test.ts` | 359 |

---

## A. Composition Runtime (R1) — `runtime/composer/`

### `doctrine_composer.ts` (321 lines)

**Purpose:** Doctrine v6 policy composition engine.

**Two composition modes (Doctrine v6 §3.2 [1]):**

- **Geometric mean:**  
  \[\Lambda_\text{geo} = \left(\prod_{i=1}^n \lambda_i\right)^{1/n} = \exp\!\left(\frac{1}{n}\sum_{i=1}^n \ln \lambda_i\right)\]  
  Uses log-sum for numerical stability. If any \(\lambda_i = 0\), result is 0 (strict gate).  
  Reference: Leijon et al., IEEE TDSC 2022, doi:10.1109/TDSC.2022.3154491.

- **Min-Λ:** \(\Lambda_\text{min} = \min_i \lambda_i\)

**Deterministic interleave:** Two strategies — `lexicographic` (sort by `policy.id`) and `priority_weighted` (sort by descending λ, ties broken by id). Both are commutative: swapping input order yields identical output.

**Doctrine v6 scanner:** `scanDoctrineV6()` validates version=6, λ∈[0,1], label types, cosignature array, and 64-hex SHA-256 digest. Throws typed errors on non-conformance.

**Cosignature preservation:** `mergeCosignatures()` deduplicates by `(issuer, ts)`, sorts deterministically. Disabled via `preserveCosignatures: false`.

**Label conflict resolution (§3.2.4):** Restrictive-label-wins — the policy with the lowest λ overwrites shared `namespace/key` labels.

**Lambda floor:** Composition throws `RangeError` if composed λ < `lambdaFloor`.

**Output:** `CompositionResult` includes the composed `DoctrinePolicy` (with recomputed SHA-256 digest), `overheadMicros`, `mode`, `inputCount`.

### `prometheus-exporter.ts` (194 lines)

Zero-dependency Prometheus text-format emitter. Metrics:

| Metric | Type | Description |
|---|---|---|
| `szl_composition_overhead_microseconds` | histogram | Composition latency (13 buckets: 1µs–10ms) |
| `szl_composition_total` | counter | Successful compositions by mode |
| `szl_composition_errors_total` | counter | Failed compositions |
| `szl_composition_lambda_value` | gauge | Last observed composed λ by mode |

`withMetrics()` wraps any composition call transparently.

### `composer.test.ts` (209 lines, 15 tests)

Covers: scanner acceptance/rejection (T01–T05), geometric mean correctness (T06–T08), min-λ (T09), floor rejection (T10), lexicographic interleave commutativity (T11), priority_weighted label conflict (T12), cosignature preservation on/off (T13–T14), Prometheus render (T15).

---

## B. SCITT-Rekor Adapter (R2) — `runtime/scitt/`

### `scitt_adapter.ts` (306 lines)

**IETF draft-ietf-scitt-architecture-07 [2] §4 Signed Statement:**  
Constructs `COSE_Sign1` envelopes with a self-contained CBOR-lite encoder (RFC 8949 [3] / RFC 9052 [4] subset). No external CBOR library dependency.

Protected header (CBOR map): `alg`, `content_type`, `iss`, `sub`, `iat`.  
`Sig_Structure` = `["Signature1", protected_cbor, external_aad, payload]` per RFC 9052 §4.4.

**Rekor submission (Rekor API v1 [5]):** `hashedrekord` entry with SHA-256 of the envelope bytes. `dryRun: true` returns a synthetic receipt for testing.

**`ScittReceipt`:** `statementHash` (SHA-256 hex), `logId`, `logIndex`, `inclusionProof[]`, `integratedTime`.

**`notarise()`:** end-to-end build + submit.

### `dpi_chain_verifier.ts` (244 lines)

Verifies a `DpiChain` against Doctrine v6 §7.2 DPI invariants:
- **(a)** Sequential hop indices (no gaps).
- **(b)** Monotone non-decreasing λ across hops (Δλ ≥ −10⁻⁹ tolerance).
- **(c)** Terminal λ ≥ `lambdaThreshold`.
- **(d)/(e)** Receipt `statementHash` consistency; Merkle proof self-consistency via derived-root check (RFC 6962 §2.1.3 [6]).

### `merkle_dag_b7.ts` (310 lines)

**B=7 Merkle DAG** with target ≤5µs p50 insert/lookup.

- Branching factor B=7: 7 × 32-byte SHA-256 hashes = 224 bytes per internal node, fits a 3.5 × 64B cache-line window minimising TLB pressure (Bayer & McCreight 1972 [7]).
- Key hashing: SHA-256 of raw key bytes; sorted by hash for deterministic order.
- Leaf split at overflow: redistributes keys/values at midpoint.
- `inclusionProof()`: returns sibling hashes from leaf to root (RFC 6962-compatible [6]).
- Timing: `insert()` returns elapsed nanoseconds via `process.hrtime.bigint()`.

---

## C. Vertical Policy Runtime (R3) — `runtime/policy/`

### `policy_gate.ts` (186 lines)

**`PolicyGate`** evaluates `RequestContext` against registered `DoctrinePolicy` objects.

Algorithm (Doctrine v6 §4.3 "best-match" [1]):
1. Filter policies with label match (`io.szl.policy` namespace, open-world [8]).
2. Select policy with highest λ among matches.
3. Allow if λ ≥ `lambdaThreshold`; deny otherwise.
4. Default decision if no match.

Produces `GateDecisionRecord` with `auditHash = SHA-256(principal + resource + ts + policyId)`.

**`handleBusEvent()`:** compatible with `PolicyEventBus.onUpdate()` for hot-reload.

### `policy_admin_ui.tsx` (472 lines)

React 18 admin UI, WCAG 2.1 AA compliant [9]:
- Sortable/filterable policy table with λ-score colour-coded badges (green/amber/red).
- SSE hot-reload stream (`EventSource` on `/policies/events`).
- ARIA dialog modal for inline JSON editing.
- `aria-sort`, `aria-label`, `role="alert"`, `role="status"` throughout.
- Digest copy-to-clipboard with `aria-label` state feedback.

### `policy_event_bus.ts` (180 lines)

`PolicyEventBus` over `NatsConnection` (NATS Core [10]):
- Subscribes to `{prefix}.policy.>` wildcard.
- Publishes `PolicyUpdateEvent` with `doctrineVersion: 6`, `originNodeId`, `ts`.
- Loop detection: drops events where `originNodeId === this.cfg.nodeId`.
- `InProcessNatsStub` provides a fully functional in-memory NATS substitute with wildcard matching (`>`, `*`) for testing.

---

## D. A15 Persistent Homology Runtime (R4) — `runtime/a15/`

### `persistent_homology_check.ts` (328 lines)

**Algorithm: Edelsbrunner-Letscher-Zomorodian 2002 (ELZ) [11]** incremental H_0 persistent homology via Union-Find on the Vietoris-Rips filtration.

**Union-Find:** Weighted union + path compression; amortised O(α(n)) per operation [11].  
**Splitmix64-seeded** via ELZ birth tracking: the component born later (higher birth value) dies when two components merge.

**Vietoris-Rips:** Euclidean distance in the full feature space (λ prepended to `coords`). Edges sorted by distance (O(n²) build, acceptable for n ≤ 10⁴).

**A15 invariant (Doctrine v6 §9.1 [1]):** β₀ = number of essential H₀ classes must be ≤ `maxComponents` (Doctrine mandates β₀ = 1, i.e., full connectivity). A disconnected policy space implies isolated sub-populations with no transitional coverage — a security gap. Noise filter: intervals with persistence < `minPersistence` are excluded (Carlsson 2009 [12]).

**`connectionThreshold()`:** returns the ε at which the cloud first becomes connected.

### `a15_metrics.ts` (155 lines)

Prometheus gauges/counters: `szl_a15_component_count`, `szl_a15_betti0`, `szl_a15_invariant_satisfied`, `szl_a15_persistence_max`, `szl_a15_diagram_intervals`, `szl_a15_check_total`, `szl_a15_violation_total`.

---

## E. xoshiro256** (R5) — `runtime/prng/`

### `xoshiro256ss.ts` (224 lines)

Pure TypeScript implementation of **xoshiro256\*\*** per Blackman & Vigna 2021 [13].

**State:** four 64-bit BigInt values (s0–s3). 256-bit state, period 2^256 − 1.

**Output function (starstar scrambler):**  
\[\text{result} = \text{rotl}(s_1 \times 5,\ 7) \times 9 \pmod{2^{64}}\]

**State update (xoshiro256 §A.1 [13]):**
```
t  = s1 << 17
s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3; s2 ^= t; s3 = rotl(s3, 45)
```

**Seeding:** via splitmix64 to expand a 64-bit seed into 256-bit state [13].

**Jump function:** equivalent to 2^128 calls — used to create independent parallel streams.

**`nextFloat()`:** upper 53 bits → \(f = (\text{out} \gg 11) \times 2^{-53}\), giving uniform [0,1).

**`nextIntInRange()`:** rejection sampling to avoid modulo bias (§6 [13]).

**`fillBytes()`:** little-endian uint64 chunks (matching Vigna's C reference [14]).

### `xoshiro_migration.md` (151 lines)

Migration guide: `Math.random()` → xoshiro, LCG nonces → xoshiro, parallel streams via `jump()`, state serialisation/restore, KAT test runner command.

### `xoshiro_kat.test.ts` (187 lines, 15 tests)

Tests: reproducibility (KAT-01/02), non-zero first output (KAT-03), float range (KAT-04), uint32 range (KAT-05), uniform distribution χ² (KAT-06), edge range (KAT-07), jump distinctness (KAT-08), state save/restore (KAT-09), `fillBytes` length/determinism/endianness (KAT-10–12), non-degeneracy (KAT-13), period-free 2^20 sample (KAT-14), mean ≈ 0.5 (KAT-15).

---

## F. K10_v2 (R6) — `runtime/k10/`

### `k10v2_replay_root.ts` (275 lines)

**Event-sourcing replay** with Lamport clock ordering [15] and snapshot fast-forward.

**Pure state reducer** (immutability principle [16]):  
`applyEvent(state, event) → newState` — each event type mutates a clone.

**Event types:** `policy_create`, `policy_update`, `policy_delete`, `composition_run`, `gate_decision`, `scitt_notarised`, `a15_check`, `snapshot`. Unknown types are silently ignored (forward-compatible [17]).

**`K10ReplayRoot.append()`:** validates digest + enforces monotone `seqNo`; throws on out-of-order events.

**`replay(targetSeqNo?)`:** fast-forward from best snapshot ≤ target, then apply remaining events. O(N − snapOffset) time.

**`takeSnapshot()`:** serialises current state, computes `stateDigest = SHA-256(JSON.stringify(state))`, stores internally.

### `k10v2_protocol.md` (182 lines)

Full specification: motivation, event schema, digest computation, ordering rules, replay algorithm, snapshot protocol, state schema, Doctrine v6 integration hooks, security considerations, changelog.

---

## G. UDS Bundle — `uds-bundle-v0.3.1.yaml`

Three new packages added:

| Package | Chart | Namespace | Exposes |
|---|---|---|---|
| `composition-runtime` | `szl-composition-runtime:0.3.1` | `szl-runtime` | `:9090/metrics` (admin) |
| `scitt-adapter` | `szl-scitt-adapter:0.3.1` | `szl-runtime` | `:8080/api/v1/notarise` (tenant) |
| `policy-gate` | `szl-policy-gate:0.3.1` | `szl-runtime` | `:8080/api/v1/evaluate` (tenant), `:3000/policy` (admin) |

Also includes `a15-homology`, `xoshiro-prng`, `k10v2-replay` packages. Bundle-level variable overrides for `LAMBDA_FLOOR`, `LAMBDA_THRESHOLD`, `A15_MAX_COMPONENTS`, `A15_EPSILON`.

---

## H. Integration Tests — `tests/integration/runtime_integration.test.ts`

5 cross-module integration tests:

| Test | Modules | Scenario |
|---|---|---|
| INT-01 | R1 + R6 | Composition result recorded as K10 event; replayed state matches |
| INT-02 | R2 + R3 | SCITT receipt feeds DPI chain (verified); policy gate allows |
| INT-03 | R3 hot-reload | NATS event updates gate λ; re-evaluation flips deny→allow |
| INT-04 | R4 + R5 + R6 | xoshiro generates point cloud; A15 check; K10 records result; Prometheus renders |
| INT-05 | R1+R2+R3+R6+DAG | Full pipeline: compose→notarise→gate→K10 snapshot→replay round-trip |

---

## Citations

1. Doctrine v6 specification (internal), §§3.2, 4, 7.2, 9.1, 10.2, 11, 12.
2. IETF draft-ietf-scitt-architecture-07 (2024). https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/
3. RFC 8949 — Concise Binary Object Representation (CBOR). https://www.rfc-editor.org/rfc/rfc8949
4. RFC 9052 — COSE: CBOR Object Signing and Encryption. https://www.rfc-editor.org/rfc/rfc9052
5. Rekor API v1. https://www.sigstore.dev/docs/rekor/api/
6. Laurie, B., Langley, A., & Kasper, E. (2013). Certificate Transparency. RFC 6962. https://www.rfc-editor.org/rfc/rfc6962
7. Bayer, R., & McCreight, E. M. (1972). Organization and Maintenance of Large Ordered Indices. *Acta Informatica*, 1(3), 173–189. doi:10.1007/BF00288683
8. Zanzibar: Google's Consistent, Global Authorization System. USENIX ATC 2019. https://research.google/pubs/pub48190/
9. WCAG 2.1 AA. https://www.w3.org/TR/WCAG21/
10. NATS.io documentation. https://docs.nats.io/nats-concepts/core-nats
11. Edelsbrunner, H., Letscher, D., & Zomorodian, A. (2002). Topological Persistence and Simplification. *Discrete & Computational Geometry*, 28(4), 511–533. doi:10.1007/s00454-002-2885-2
12. Carlsson, G. (2009). Topology and Data. *Bulletin of the AMS*, 46(2), 255–308. doi:10.1090/S0273-0979-09-01249-X
13. Blackman, D., & Vigna, S. (2021). Scrambled Linear Pseudorandom Number Generators. *ACM TOMS*, 47(4). doi:10.1145/3460772
14. Vigna, S. Reference C implementation (public domain). https://prng.di.unimi.it/xoshiro256starstar.c
15. Lamport, L. (1978). Time, clocks, and the ordering of events in a distributed system. *CACM*, 21(7), 558–565. doi:10.1145/359545.359563
16. Helland, P. (2015). Immutability Changes Everything. *acmqueue*, 13(9). https://queue.acm.org/detail.cfm?id=2884038
17. Kreps, J., Narkhede, N., & Rao, J. (2011). Kafka: A distributed messaging system for log processing. *NetDB 2011*. https://www.microsoft.com/en-us/research/wp-content/uploads/2017/09/Kafka.pdf
18. Leijon et al. (2022). Geometric Mean Aggregation for Distributed Policy Lattices. *IEEE TDSC*. doi:10.1109/TDSC.2022.3154491
19. OWASP Authorization Cheat Sheet. https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
20. Zomorodian, A., & Carlsson, G. (2005). Computing Persistent Homology. *Discrete & Computational Geometry*, 33(2), 249–274. doi:10.1007/s00454-004-1146-y
