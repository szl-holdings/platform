# A11oy leader pattern study — 2026-10-02

**Status:** Source-backed design research. This document records public behavior and architecture patterns; it does not assert feature parity, adoption, or production readiness.

## Method and independent-implementation boundary

The study used shallow clones of official public GitHub repositories at the exact revisions below. Findings were derived from source and documentation, then compared with the A11oy repository. No vendor code, product copy, layout, icons, diagrams, screenshots, or assets were imported. The resulting Workcell Proof Coverage Inspector is a source-informed, original implementation over A11oy's own fixtures and vocabulary. This was not a formally separated clean-room process.

License names below describe the inspected snapshots. They are not a conclusion that every file in a repository has the same terms. Restricted or source-available projects were used only for behavioral research.

## Source snapshots

### Agent orchestration

| Project | Revision | License boundary | Evidence reviewed |
|---|---|---|---|
| [LangGraph](https://github.com/langchain-ai/langgraph/tree/7dc9195e4141c8fbd8118581b3dd61d158628aa8) | `7dc9195e4141c8fbd8118581b3dd61d158628aa8` | MIT code | [checkpoints](https://github.com/langchain-ai/langgraph/blob/7dc9195e4141c8fbd8118581b3dd61d158628aa8/libs/checkpoint/README.md#L19-L59), [interrupt and resume](https://github.com/langchain-ai/langgraph/blob/7dc9195e4141c8fbd8118581b3dd61d158628aa8/libs/langgraph/langgraph/types.py#L893-L915), [graph validation](https://github.com/langchain-ai/langgraph/blob/7dc9195e4141c8fbd8118581b3dd61d158628aa8/libs/langgraph/langgraph/graph/state.py#L1230-L1267) |
| [Microsoft AutoGen](https://github.com/microsoft/autogen/tree/027ecf0a379bcc1d09956d46d12d44a3ad9cee14) | `027ecf0a379bcc1d09956d46d12d44a3ad9cee14` | MIT code; CC BY 4.0 documentation | [application contracts](https://github.com/microsoft/autogen/blob/027ecf0a379bcc1d09956d46d12d44a3ad9cee14/python/docs/src/user-guide/core-user-guide/core-concepts/application-stack.md#L11-L23), [runtime separation](https://github.com/microsoft/autogen/blob/027ecf0a379bcc1d09956d46d12d44a3ad9cee14/python/docs/src/user-guide/core-user-guide/core-concepts/architecture.md#L3-L46) |
| [CrewAI](https://github.com/crewAIInc/crewAI/tree/8078f9130c35a47be95d4a55bf1d73b3fd44fc88) | `8078f9130c35a47be95d4a55bf1d73b3fd44fc88` | MIT code | [flows](https://github.com/crewAIInc/crewAI/blob/8078f9130c35a47be95d4a55bf1d73b3fd44fc88/docs/edge/en/concepts/flows.mdx#L8-L20), [checkpoint lineage](https://github.com/crewAIInc/crewAI/blob/8078f9130c35a47be95d4a55bf1d73b3fd44fc88/docs/edge/en/concepts/checkpointing.mdx#L27-L52), [human feedback routing](https://github.com/crewAIInc/crewAI/blob/8078f9130c35a47be95d4a55bf1d73b3fd44fc88/docs/edge/en/learn/human-feedback-in-flows.mdx#L14-L32) |
| [OpenAI Agents SDK](https://github.com/openai/openai-agents-python/tree/81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3) | `81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3` | MIT | [durable approvals](https://github.com/openai/openai-agents-python/blob/81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3/docs/human_in_the_loop.md#L47-L59), [server-owned approval state](https://github.com/openai/openai-agents-python/blob/81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3/docs/human_in_the_loop.md#L189-L208), [versioned run state](https://github.com/openai/openai-agents-python/blob/81f0ccf20c6e24063b9da36fa37f2bdb6a43d8d3/src/agents/run_state.py#L205-L230) |

### Observability and evaluation

| Project | Revision | License boundary | Evidence reviewed |
|---|---|---|---|
| [OpenTelemetry GenAI semantic conventions](https://github.com/open-telemetry/semantic-conventions-genai/tree/e07f4ebacb08f56db8c4c882d117720333fbca04) | `e07f4ebacb08f56db8c4c882d117720333fbca04` | Apache-2.0; conventions marked Development | [span model](https://github.com/open-telemetry/semantic-conventions-genai/blob/e07f4ebacb08f56db8c4c882d117720333fbca04/docs/gen-ai/gen-ai-spans.md#L28-L110), [content privacy](https://github.com/open-telemetry/semantic-conventions-genai/blob/e07f4ebacb08f56db8c4c882d117720333fbca04/docs/gen-ai/gen-ai-spans.md#L1284-L1383), [evaluation events](https://github.com/open-telemetry/semantic-conventions-genai/blob/e07f4ebacb08f56db8c4c882d117720333fbca04/model/gen-ai/events.yaml#L14-L39) |
| [Langfuse](https://github.com/langfuse/langfuse/tree/f75c661dbe8c6b85523c81486b39e8403ac2c141) | `f75c661dbe8c6b85523c81486b39e8403ac2c141` | MIT core; enterprise directories use a restricted license | [trace fields](https://github.com/langfuse/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/fern/apis/server/definition/trace.yml#L111-L149), [score provenance](https://github.com/langfuse/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/fern/apis/server/definition/scores-v3.yml#L138-L187), [experiment lineage](https://github.com/langfuse/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/fern/apis/server/definition/experiments.yml#L127-L201) |
| [Arize Phoenix](https://github.com/Arize-ai/phoenix/tree/83c8271403d34607a144dbd5e5703437564f7129) | `83c8271403d34607a144dbd5e5703437564f7129` | Elastic License 2.0 | [trace model](https://github.com/Arize-ai/phoenix/blob/83c8271403d34607a144dbd5e5703437564f7129/src/phoenix/db/models.py#L808-L900), [annotation provenance](https://github.com/Arize-ai/phoenix/blob/83c8271403d34607a144dbd5e5703437564f7129/src/phoenix/db/models.py#L1274-L1352), [dataset revisions](https://github.com/Arize-ai/phoenix/blob/83c8271403d34607a144dbd5e5703437564f7129/src/phoenix/db/models.py#L1549-L1628) |
| [OpenLIT](https://github.com/openlit/openlit/tree/897838a26e447f7f82dccfb59f7cbe0bfba3b694) | `897838a26e447f7f82dccfb59f7cbe0bfba3b694` | Apache-2.0 | [trace analysis](https://github.com/openlit/openlit/blob/897838a26e447f7f82dccfb59f7cbe0bfba3b694/docs/latest/openlit/observability/telemetry/traces.mdx#L6-L115), [evaluation model](https://github.com/openlit/openlit/blob/897838a26e447f7f82dccfb59f7cbe0bfba3b694/docs/latest/openlit/evaluations/overview.mdx#L7-L48), [deterministic sampling](https://github.com/openlit/openlit/blob/897838a26e447f7f82dccfb59f7cbe0bfba3b694/src/client/src/lib/platform/evaluation/sampling.ts#L37-L50) |

### Policy and governance

| Project | Revision | License boundary | Evidence reviewed |
|---|---|---|---|
| [Open Policy Agent](https://github.com/open-policy-agent/opa/tree/3f2d1bd96090b9ecf29c29fabe1eaf38883ea140) | `3f2d1bd96090b9ecf29c29fabe1eaf38883ea140` | Apache-2.0 | [default-deny semantics](https://github.com/open-policy-agent/opa/blob/3f2d1bd96090b9ecf29c29fabe1eaf38883ea140/docs/docs/security.md#L145-L170), [undefined Data API result](https://github.com/open-policy-agent/opa/blob/3f2d1bd96090b9ecf29c29fabe1eaf38883ea140/docs/docs/rest-api.md#L795-L815), [decision records](https://github.com/open-policy-agent/opa/blob/3f2d1bd96090b9ecf29c29fabe1eaf38883ea140/docs/docs/management-decision-logs.md#L5-L84) |
| [Guardrails AI](https://github.com/guardrails-ai/guardrails/tree/06d0ff2c5f9bcb493d976b76f885e37e41ce845d) | `06d0ff2c5f9bcb493d976b76f885e37e41ce845d` | Apache-2.0 | [failure actions](https://github.com/guardrails-ai/guardrails/blob/06d0ff2c5f9bcb493d976b76f885e37e41ce845d/docs/api_reference/types.md#L3-L24), [iteration history](https://github.com/guardrails-ai/guardrails/blob/06d0ff2c5f9bcb493d976b76f885e37e41ce845d/docs/api_reference/history_and_logs.md#L103-L205), [status-gating caveat](https://github.com/guardrails-ai/guardrails/blob/06d0ff2c5f9bcb493d976b76f885e37e41ce845d/docs/api_reference/guards.md#L471-L490) |
| [NeMo Guardrails](https://github.com/NVIDIA/NeMo-Guardrails/tree/fd5de2d7682c8a0aaae81df2b760bab657d79aa8) | `fd5de2d7682c8a0aaae81df2b760bab657d79aa8` | Apache-2.0 | [stage-specific gates](https://github.com/NVIDIA/NeMo-Guardrails/blob/fd5de2d7682c8a0aaae81df2b760bab657d79aa8/docs/about/rail-types.mdx#L19-L45), [typed outcomes](https://github.com/NVIDIA/NeMo-Guardrails/blob/fd5de2d7682c8a0aaae81df2b760bab657d79aa8/docs/configure-rails/actions/rail-outcomes.mdx#L10-L119), [content capture default](https://github.com/NVIDIA/NeMo-Guardrails/blob/fd5de2d7682c8a0aaae81df2b760bab657d79aa8/docs/observability/tracing/content-capture.mdx#L228-L232) |
| [TensorFlow Model Card Toolkit](https://github.com/tensorflow/model-card-toolkit/tree/74d7e6d8d3163b830711b226491ccd976a2d7018) | `74d7e6d8d3163b830711b226491ccd976a2d7018` | Apache-2.0; snapshot is dated | [structured record](https://github.com/tensorflow/model-card-toolkit/blob/74d7e6d8d3163b830711b226491ccd976a2d7018/model_card_toolkit/documentation/guide/concepts.md#L1-L24), [risk and limitation fields](https://github.com/tensorflow/model-card-toolkit/blob/74d7e6d8d3163b830711b226491ccd976a2d7018/model_card_toolkit/proto/model_card.proto#L208-L275) |

### Durable execution and attestations

| Project | Revision | License boundary | Evidence reviewed |
|---|---|---|---|
| [Temporal documentation](https://github.com/temporalio/documentation/tree/7607b71603fd086d70e6e9888bad8f4a92dfb0e8) | `7607b71603fd086d70e6e9888bad8f4a92dfb0e8` | MIT | [deterministic replay](https://github.com/temporalio/documentation/blob/7607b71603fd086d70e6e9888bad8f4a92dfb0e8/docs/encyclopedia/workflow/workflow-definition.mdx#L184-L229), [event history](https://github.com/temporalio/documentation/blob/7607b71603fd086d70e6e9888bad8f4a92dfb0e8/docs/encyclopedia/workflow/workflow-execution/event.mdx#L25-L64), [idempotent activities](https://github.com/temporalio/documentation/blob/7607b71603fd086d70e6e9888bad8f4a92dfb0e8/docs/encyclopedia/activities/activity-definition.mdx#L176-L232) |
| [Restate documentation](https://github.com/restatedev/docs-restate/tree/9263c74f228ba2cd6478c405ceede29a4a04f14d) | `9263c74f228ba2cd6478c405ceede29a4a04f14d` | ISC metadata in `package.json`; no root license file in snapshot | [journal and replay](https://github.com/restatedev/docs-restate/blob/9263c74f228ba2cd6478c405ceede29a4a04f14d/docs/foundations/key-concepts.mdx#L40-L75), [durable signals](https://github.com/restatedev/docs-restate/blob/9263c74f228ba2cd6478c405ceede29a4a04f14d/docs/develop/ts/external-events.mdx#L12-L71), [compensations](https://github.com/restatedev/docs-restate/blob/9263c74f228ba2cd6478c405ceede29a4a04f14d/docs/guides/sagas.mdx#L7-L28) |
| [Dapr documentation](https://github.com/dapr/docs/tree/4eb8bf1fcb4c6625107fc2a3f047d946d5a39e98) | `4eb8bf1fcb4c6625107fc2a3f047d946d5a39e98` | Apache-2.0 | [workflow history](https://github.com/dapr/docs/blob/4eb8bf1fcb4c6625107fc2a3f047d946d5a39e98/daprdocs/content/en/developing-applications/building-blocks/workflow/workflow-features-concepts.md#L117-L175), [history propagation](https://github.com/dapr/docs/blob/4eb8bf1fcb4c6625107fc2a3f047d946d5a39e98/daprdocs/content/en/developing-applications/building-blocks/workflow/workflow-history-propagation.md#L235-L266), [history signing](https://github.com/dapr/docs/blob/4eb8bf1fcb4c6625107fc2a3f047d946d5a39e98/daprdocs/content/en/developing-applications/building-blocks/workflow/workflow-history-signing.md#L144-L205) |
| [Sigstore Cosign](https://github.com/sigstore/cosign/tree/6a83f9a2083343b89afc7431c2dda45fb5bf14e8) | `6a83f9a2083343b89afc7431c2dda45fb5bf14e8` | Apache-2.0 | [identity and digest verification](https://github.com/sigstore/cosign/blob/6a83f9a2083343b89afc7431c2dda45fb5bf14e8/README.md#L84-L133), [portable bundles](https://github.com/sigstore/cosign/blob/6a83f9a2083343b89afc7431c2dda45fb5bf14e8/README.md#L143-L178), [subject binding](https://github.com/sigstore/cosign/blob/6a83f9a2083343b89afc7431c2dda45fb5bf14e8/doc/cosign_verify-blob-attestation.md#L45-L69) |
| [in-toto](https://github.com/in-toto/in-toto/tree/e352b43ad7cb8915d84c36d791aa61346152a0a3) | `e352b43ad7cb8915d84c36d791aa61346152a0a3` | Apache-2.0 | [layouts and authorized steps](https://github.com/in-toto/in-toto/blob/e352b43ad7cb8915d84c36d791aa61346152a0a3/README.md#L28-L61), [material and product receipts](https://github.com/in-toto/in-toto/blob/e352b43ad7cb8915d84c36d791aa61346152a0a3/README.md#L63-L82), [verification](https://github.com/in-toto/in-toto/blob/e352b43ad7cb8915d84c36d791aa61346152a0a3/README.md#L102-L119) |
| [SLSA](https://github.com/slsa-framework/slsa/tree/82b296d49e4c8301e7db565f23620ffe89092a0c) | `82b296d49e4c8301e7db565f23620ffe89092a0c` | Community Specification License 1.0 | [attestation model](https://github.com/slsa-framework/slsa/blob/82b296d49e4c8301e7db565f23620ffe89092a0c/spec/attestation-model.md#L101-L145), [provenance fields](https://github.com/slsa-framework/slsa/blob/82b296d49e4c8301e7db565f23620ffe89092a0c/spec/build-provenance.md#L31-L97), [verification policy](https://github.com/slsa-framework/slsa/blob/82b296d49e4c8301e7db565f23620ffe89092a0c/spec/verifying-artifacts.md#L94-L173) |

## A11oy design conclusions from the comparison

The following recommendations are original synthesis from the cited behavior and architecture patterns. They do not imply that any one reviewed project implements every listed detail.

1. A run needs one versioned execution contract. Typed inputs, outputs, permitted tools, transitions, retry rules, termination rules, and approval policy should be compiled and checked before execution.
2. Durable workflows recover from an append-only event history. A checkpoint alone does not establish that every side effect, retry, compensation, and result was recorded.
3. Approval is a scoped capability. It should bind the operator, exact action and argument digest, target, policy revision, run, expiry, and use count. A changed action requires a new decision.
4. Policy engines decide and executors enforce. Missing, undefined, timed-out, or unparsable decisions should stop execution.
5. Trace content needs an explicit privacy boundary. Metadata can remain in the trace while sensitive content moves to access-controlled evidence storage referenced by digest and identifier.
6. Evaluation results need lineage to the target span, evaluator and version, rubric, dataset revision, input snapshot, and any human reviewer.
7. Durability, coverage, authenticity, and policy compliance are separate properties. A signature can cover an incomplete claim; a complete journal can still be self-asserted.
8. A proof view should expose missing records and mismatches instead of converting references or hash-shaped strings into verified execution claims.

## A11oy application

The first implementation is the Workcell Proof Coverage Inspector on `/a11oy/workcells/:id/replay`. It joins the Workcell fixture to its signal records, PCE contract, and Proof Packet; compares the declared action and trace identifiers; and checks policy and approval references for resolution. No policy or approval registry is supplied by the current route. Every obligation reports `SATISFIED`, `MISMATCH`, or `UNAVAILABLE`; the aggregate is complete only when all obligations are satisfied.

The current `wc-001` fixture deliberately remains incomplete:

- `pe-001` is referenced but no policy-evaluation registry resolves it.
- `ar-001` is referenced but no approval registry resolves it.
- `proof-001` resolves, but it is signal-ingestion evidence for a signal rather than action-execution evidence for the Workcell or its action.
- `proof-001` does not carry the contract's policy-evaluation or approval-record references.
- A packet hash string is displayed as fixture data and is not described as a verified signature.

Three local challenges remove the packet reference, substitute the action identifier, or omit the approval reference. They change only the evaluator input and demonstrate conservative, incomplete-by-default coverage classification. They do not mutate repository fixtures, authorize execution, call a connector, or claim cryptographic verification.

## Next implementation sequence

1. Define a canonical execution envelope with W3C trace/span identity, tenant/run/thread scope, workflow-definition digest, action digest, policy revision, approval binding, event sequence, and evidence references.
2. Use one append-only run journal for workflow, tool, approval, evaluation, retry, compensation, and outcome events. Persist intent before external side effects and completion afterward.
3. Add stable idempotency keys for every logical side effect and label connectors whose destination cannot deduplicate as at-least-once.
4. Add authenticated approval records and policy-evaluation registries, then make the inspector resolve those records rather than accept free-form IDs.
5. Add signature and trust-policy verification as a separate inspector dimension, with explicit signer, issuer, subject digest, predicate type, and trust-root results.
6. Replace custom telemetry IDs with propagated W3C IDs and pin the OpenTelemetry GenAI adapter to a reviewed development-version schema.
