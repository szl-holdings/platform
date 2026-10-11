# A11oy Atelier Proofweave

**Status:** `DEMO` / `COMPILED_NOT_EXECUTED` / `IN_PROCESS_NOT_STORED`

**Evidence class:** `SIMULATED`

**Owner:** SZL Holdings

**Schema:** `a11oy.atelier.proofweave.v1`

**Policy:** `a11oy.atelier.proofweave-policy.v1`

**Implementation:** `packages/a11oy-atelier/src/proofweave.ts`

**Canonical route:** `POST /api/a11oy/v1/atelier/proofweave/compile`

**Operator surface:** `/a11oy/atelier`

**CLI:** `a11oy-atelier weave`

> Pattern -> Cut -> Stitch -> Fitting -> Label.

## Release boundary

A11oy Atelier Proofweave is a deterministic, hash-addressed research-plan compiler. This release
validates an operator-declared objective, claims, source-material metadata, capability request,
output format, and budget, then emits a five-stage A11oy plan for inspection. It does not
run that plan. Stage descriptions assign responsibilities and carry budget declarations for a
possible future Workcell runtime; they do not create or execute Workcells today.

The compiler is a planning surface, not a research agent, model router, source retriever, workflow
runtime, approval service, or persistence layer. A successfully compiled plan establishes that the
input passed the local schema and planning policy. It does not establish that a claim is true, a
locator resolves, a source was fetched, a revision exists, a declared license is correct, a
provider was called, a review occurred, or a human approved anything.

The package compiler is exposed through the tenant-scoped runtime-API compile route, the Atelier
operator surface, and the existing Atelier CLI. The surrounding runtime API applies its configured
access policy; local development may run without a configured API key. The browser operator surface
submits only in local development. Production browser compilation is `BLOCKED` with runtime evidence
`UNKNOWN` until an authenticated server-side session/BFF exists; it never receives or sends the API
key. The server API and CLI remain separate transports. These transports do not turn compilation
into an execution runtime. The API transport also requires a separate audit-ledger append; that side
effect is not plan execution.

## Evidence and lifecycle contract

Every compiled plan carries one approved evidence class plus separate, typed lifecycle states:

| Field | Value | Meaning |
|---|---|---|
| `mode` | `RESEARCH_ONLY` | The plan is scoped as research planning. No research is performed. |
| `evidenceClass` | `SIMULATED` | The compile-only prototype result is not runtime, deployment, or external-source evidence. |
| `operationalState` | `DEMO` | This is an active-prototype capability. |
| `executionState` | `COMPILED_NOT_EXECUTED` | The plan compiled; none of its stages ran. |
| `persistenceState` | `IN_PROCESS_NOT_STORED` | The result is returned to the caller and is not durably stored. |
| stage `executionState` | `NOT_EXECUTED` | The named A11oy role is assigned in the plan only. |
| claim `evaluationState` | `NOT_EVALUATED` | The compiler made no truth judgment. |
| claim `evidenceState` | `UNAVAILABLE` | No claim evidence was gathered or verified. |
| `claimGraph.edges` | `[]` | No claim relationship was evaluated or asserted. |
| material `metadataEvidenceClass` | `UNKNOWN` | Material metadata is operator-declared and not independently verified. |
| material `locatorState` | `DECLARED_NOT_FETCHED` | The HTTPS locator was validated syntactically but not retrieved. |
| material declaration state | `DECLARED_NOT_VERIFIED` or `UNAVAILABLE` | Publisher, revision, and license fields are declared with evidence class `UNKNOWN`, or absent. |
| material `fetched` | `false` | Source content was not retrieved. |
| material `codeReuseState` | `NOT_INCORPORATED` | No third-party code entered the A11oy tree through this compiler. |
| review `reviewType` | `AUTOMATED_REVIEW` | The future fitting step is assigned to an automated evaluator. |
| review `reviewState` | `NOT_EXECUTED` | The automated evaluator did not run. |
| review `humanApprovalState` | `UNAVAILABLE` | No human approval was requested, observed, or inferred. |

`AUTOMATED_REVIEW` must never be represented as human review, independent approval, executive
approval, or board approval. A solo-builder proof rail may preserve exact-source tests and signed
receipts, but it must not manufacture a second approver.

### Transport, tenant, and ledger behavior

The HTTP route validates the strict request, compiles synchronously, sets `Cache-Control: no-store`,
and then attempts a required EvidenceLedger append containing audit metadata with empty source and
tool-call lists. Compilation, validation or policy failure, and ledger-append failure are distinct:

- malformed input returns `400` with `ATELIER_VALIDATION`;
- a denied capability returns `403` with `ATELIER_PROOFWEAVE_POLICY_DENIED` and the policy version;
- a required ledger-append failure returns `503` with
  `ATELIER_PROOFWEAVE_LEDGER_APPEND_FAILED`; and
- only a successful compile plus accepted append returns the plan.

The returned ledger receipt labels the append `IN_PROCESS_APPEND_ACCEPTED`, the backend
`CONFIGURATION_DEPENDENT`, and durable-persistence evidence `UNKNOWN`. Tenant attribution has
evidence class `DECLARED`; the caller-supplied tenant value is not authenticated human identity.
The append records that the transport accepted compilation audit metadata. It is not a signed
source receipt, durable-plan storage, research evidence, execution witness, or proof that the
configured ledger backend survives restart.

The Atelier health response reports the compiler as `DETERMINISTIC_COMPILE_ONLY`, plan execution
as disabled, and the audit backend/durability/tenant attribution states independently. It does not
prove that a plan was executed, a model responded, a source was available, a ledger was durable,
or a deployment is healthy. The operator surface and `a11oy-atelier weave` display compile-only
lifecycle states and the `SIMULATED` evidence class; they do not invoke the Atelier inference route.

## Five-stage pattern

The compiler emits exactly five ordered stages. Each stage is a planned responsibility, not a
runtime event or an instantiated Workcell.

| Order | Stage | A11oy role | Planned responsibility | Current execution |
|---:|---|---|---|---|
| 1 | `PATTERN` | Pathfinder | Structure the objective, declared claims, admitted material metadata, and constraints. | `NOT_EXECUTED` |
| 2 | `CUT` | WorkGraphWeaver | Partition the pattern into future governed Workcell responsibilities within the declared budget. | `NOT_EXECUTED` |
| 3 | `STITCH` | ForgeMind | Assemble the planned claim-to-material reasoning graph. | `NOT_EXECUTED` |
| 4 | `FITTING` | MirrorEval | Assign automated coverage, handling, and policy review. | `NOT_EXECUTED` |
| 5 | `LABEL` | ProofSmith | Label evidence states, limitations, and the planned Proof Packet. | `NOT_EXECUTED` |

`DECLARED` by the implementer: the fashion vocabulary is an A11oy planning metaphor and does not
intentionally copy a vendor user interface, command language, prompt, product name, or trade dress.
This statement is not an independent provenance or legal conclusion.

### Claim-graph initialization

The plan exposes the normalized claim set in both `claims` and `claimGraph.nodes`. Every node starts
as `evaluationState: NOT_EVALUATED` and `evidenceState: UNAVAILABLE`. `claimGraph.edges` is an empty
array in this release. The compiler does not infer support, contradiction, dependency, causality,
agreement, or provenance relationships. Edges may be created only by a separately authorized
future evidence execution that evaluates and receipts those relationships.

## Input contract

The strict request schema accepts:

- one objective of 1 to 100,000 characters;
- 1 to 12 uniquely identified claims, each classified as `FACT`, `INFERENCE`, or
  `RECOMMENDATION`;
- 0 to 20 uniquely identified materials;
- one strict budget;
- one strict capability declaration; and
- an output format of `BRIEF`, `TECHNICAL_REPORT`, or `DECISION_MEMO`.

Claim and material identifiers must be unique ASCII-stable values that match
`[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`. Unknown fields, duplicate identifiers, non-ASCII or unstable
identifiers, invalid URLs, and out-of-range budgets fail validation. Validation is local and
deterministic; it does not resolve a URL or test whether a remote resource currently exists.

## Source-material admission

Proofweave separates admitting source metadata for planning from retrieving, validating, or
reusing source content.

Supported material kinds are `CODE`, `PUBLICATION`, `MODEL_CARD`, `DATASET`, and
`RUNTIME_RECEIPT`. Every locator must be a syntactically valid HTTPS URL.

| Reuse intent | Planning handling | Additional compiler rule | What the current release does |
|---|---|---|---|
| `REFERENCE_ONLY` | `HTTPS_REFERENCE_ONLY` | HTTPS locator required. | Records metadata with evidence class `UNKNOWN`; fetches nothing. |
| `ADAPT_PATTERN` | `INDEPENDENT_PATTERN_ADAPTATION` | A code material requires an operator-declared, syntactically valid 40-hex Git revision and an allowlisted permissive license. | Records independent pattern-adaptation intent; copies nothing. |
| `INCORPORATE_CODE` | `PERMISSIVE_CODE_REVIEW` | Material must be code, declare an operator-supplied 40-hex Git revision, and declare `Apache-2.0`, `MIT`, `BSD-2-Clause`, `BSD-3-Clause`, or `ISC`. | Admits the declaration for planning; incorporates nothing. |

The compiler validates only the revision's 40-hex syntax. It does not resolve the revision, verify
that it exists or is reachable at the declared locator, determine that it identifies a complete
commit, or bind it to fetched bytes. Those checks require a separately authorized acquisition and
provenance rail.

`ADMITTED_FOR_PLANNING` is not a legal clearance, dependency approval, download receipt, source
integrity proof, or statement that license obligations have been satisfied. Even an
`INCORPORATE_CODE` declaration returns `codeReuseState: NOT_INCORPORATED`. A later, separately
authorized implementation would still require human license review, exact-byte provenance,
notices, compatibility review, tests, and a new Proof Packet.

## Budget contract

The budget is validated at compile time:

| Budget field | Allowed range | Default |
|---|---:|---:|
| `maxWorkcells` | 5 to 8 | 5 |
| `maxProviderCalls` | 0 to 12 | 0 |
| `maxSourceFetches` | 0 to 40 | 0 |
| `maxTotalTokens` | 1,024 to 200,000 | 4,096 |
| `maxEstimatedCostUsd` | 0 to 100 | 0 |
| `maxWallTimeMs` | 1,000 to 900,000 | 60,000 |

These values are declarations for a possible future runner. Nonzero provider-call, source-fetch,
token, cost, wall-time, or Workcell values do not activate a runner and do not establish usage.
This release performs zero provider calls, zero source fetches, and zero runtime Workcells.

## Capability policy

The request declares five capabilities:

| Capability | Compiler behavior |
|---|---|
| `readWeb` | May be declared for a future plan, but the compiler performs no web access. |
| `readGitHub` | May be declared for a future plan, but the compiler performs no GitHub access. |
| `externalWrites` | If requested, compilation fails with `ATELIER_PROOFWEAVE_POLICY_DENIED`. |
| `providerNativeSubagents` | If requested, compilation fails with `ATELIER_PROOFWEAVE_POLICY_DENIED`. |
| `providerDurableStorage` | If requested, compilation fails with `ATELIER_PROOFWEAVE_POLICY_DENIED`. |

Model calls and runtime execution are not exposed capabilities in this release. Source fetching is
also absent even when a read capability or nonzero source-fetch budget appears in a valid plan.

The compiled plan includes policy version `a11oy.atelier.proofweave-policy.v1`, stable rule IDs,
the SHA-256 digest of the canonical version/rule set, and the `ALLOW` decision. The policy digest
and rule set are part of deterministic plan identity.

## Deterministic plan identity and immutability

The compiler builds a canonical payload and computes its SHA-256 digest:

1. Object keys are sorted recursively.
2. Claims and materials are sorted by their semantic identifiers with a locale-independent
   code-unit comparator.
3. The claim graph is initialized from the normalized claims with an empty edge set.
4. Stages are sorted by order.
5. Git revisions are normalized to lowercase.
6. The schema, policy version, stable rule IDs, policy digest, policy result, declarations, stages,
   claims, materials, limitations, and budgets are serialized canonically and hashed with SHA-256.
7. `weaveId` and its compatibility alias `planId` are both `proofweave_` followed by the full
   `planSha256`.

`compiledAt` is added after hashing. Therefore, equivalent validated inputs produce the same plan
identity even when compiled at different times, while the timestamp remains an observation about
the individual compilation. The returned plan and nested arrays/objects are readonly in the
TypeScript contract and recursively frozen at runtime, preventing post-compilation mutation from
changing the in-process object while retaining the old digest.

The digest binds the compiled planning payload. It is not a signature, transparency-log inclusion
proof, runtime receipt, source-content digest, or evidence that any declaration is true.

## Explicit non-capabilities

This bounded release does not:

- fetch web pages, GitHub repositories, publications, model cards, datasets, or receipts;
- call Grok, xAI, another model provider, a local model, or the existing Atelier inference route;
- launch local, provider-native, or remote subagents;
- execute tools, shell commands, Workcells, code, or a workflow DAG;
- write through a plan to GitHub, a provider, a database, a queue, a filesystem target, or another
  external system;
- save checkpoints or resume a run;
- create provider-side or A11oy durable storage;
- evaluate claims or promote evidence beyond `UNAVAILABLE`;
- conduct an automated fitting, despite assigning `AUTOMATED_REVIEW` in the plan;
- request or record human approval; or
- establish deployment, production readiness, customer use, or independent witness.

The compiled plan itself performs no external write. The runtime-API transport's required audit
dispatch is a separate, labeled side effect whose backend and durability states are reported
independently. It must not be described as source acquisition, plan execution, or durable plan
persistence.

## Bounded example

```ts
const plan = compileAtelierProofweave({
  objective: 'Compare public orchestration patterns and propose an original A11oy design.',
  claims: [
    {
      claimId: 'claim-architecture',
      statement: 'The proposed design preserves A11oy policy and proof boundaries.',
      kind: 'RECOMMENDATION',
    },
  ],
  materials: [
    {
      materialId: 'source-workflows',
      kind: 'PUBLICATION',
      locator: 'https://x.ai/news/workflows',
      publisher: 'xAI',
      reuseIntent: 'REFERENCE_ONLY',
    },
  ],
  budget: {},
  requestedCapabilities: {},
  outputFormat: 'TECHNICAL_REPORT',
});
```

The resulting plan is still `COMPILED_NOT_EXECUTED`. The publication is
`ADMITTED_FOR_PLANNING`, `metadataEvidenceClass: UNKNOWN`,
`locatorState: DECLARED_NOT_FETCHED`, `fetched: false`, and
`codeReuseState: NOT_INCORPORATED`; the claim is `NOT_EVALUATED` with `UNAVAILABLE` evidence.

## Recommended runtime sequence — not built

Future work should advance only through separately reviewed, evidence-bound releases:

1. **Signed compilation receipt:** bind the plan digest, exact source revision, authenticated
   actor, schema, and policy decision to an A11oy Proof Packet.
2. **Read-only acquisition rail:** fetch allowlisted HTTPS materials with size, redirect, content
   type, malware, hash, license, and revision-reachability checks; preserve fetched-byte receipts.
3. **Provider-neutral Workcell runner:** execute bounded stages behind Covenant Policy with
   per-Workcell token, cost, time, and concurrency enforcement; keep external writes disabled.
4. **Independent claim fitting:** require source-linked claimant and verifier outputs, contradiction
   handling, and explicit evidence-state transitions; never turn automated review into human
   approval.
5. **Operator approval gate:** request a real human decision only for actions that require it, bind
   the named actor and exact plan/result digests, and retain denial as a first-class outcome.
6. **Durable Proof Ledger:** persist signed receipts only after tenant identity, retention,
   encryption, replay resistance, deletion policy, and production deployment are witnessed.

Until those capabilities exist and are witnessed, the canonical status remains
`DEMO / COMPILED_NOT_EXECUTED / IN_PROCESS_NOT_STORED`.

## Verification boundary

Unit tests may establish deterministic serialization, stable hashing, deep immutability, schema
rejection, declaration-level license admission, capability denial, API error mapping, and fixed
lifecycle/evidence-class output. They cannot establish remote-source availability, metadata truth, legal approval,
model quality, runtime execution, ledger durability, deployment, or production operation. Local
tests, hosted exact-head CI, protected merge, deployment, and witnessed runtime are separate
evidence states and must be reported separately.
