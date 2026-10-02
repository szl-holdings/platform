# SZL Evidence Steward

This package contains a bounded, source-only first agent for the OpenAI Agents SDK. It extends the existing SDK bridge and exposes exactly four read-only functions: `list_catalog`, `inspect_asset`, `assess_evidence_gaps`, and `propose_next_step`. The source adapter is exported as `@workspace/agents-sdk-bridge/evidence-steward`; its pure evidence engine is exported as `@workspace/agents-sdk-bridge/evidence-steward-core`.

The offline replay uses the platform's existing Hugging Face catalog loader and tracked snapshot. It reads two pinned public Forge source files copied into `fixtures/`, checks their Git blob identities, and makes no remote calls. The four curated Forge bindings cover only a subset of the Forge model-type repository roster and are not a current Hub census. The platform snapshot was observed on 2026-08-20 and is stale under this agent's 30-day rule at the fixed replay date.

## Replay

From the repository root:

```sh
node packages/agents-sdk-bridge/src/evidence-steward-demo.mjs
```

The command emits stable JSON for five representative assets, including a receipt draft model, Khipu research assets, a software kernel, and an unknown model-type repository. It rejects any command-line arguments. It imports neither `Runner` nor the bridge's tracing runner, uses no API key, and does not start a model call. See `fixtures/README.md` for exact source refs and blob IDs.

The checked-in [demo output](fixtures/demo-output.json) is the reproducible replay receipt. Its report digest is `sha256:22e14a4c9609a9815f824ab4363b570cd8489c1fc7010aafdb94c1acaf50ce42`; the UTF-8 file SHA-256 is `3fe66d861dd840317bcb3ce80bc3d38f613fb8ff02cfc2d653c2069134a50d98`. Two local replays produced identical files. The report covers the sorted IDs in the pinned catalog and five representative cases; it is not a live inventory refresh.

## Boundaries

The SDK factory constructs four strict Responses function schemas against locked `@openai/agents@0.0.15`. Every field is required, additional fields are rejected, and IDs and list limits use bounded enums. SDK 0.0.15 parses raw JSON Schema tool arguments without enforcing the schema locally, so each handler validates the arguments again and propagates errors. The generic bridge tool adapter is unchanged.

Catalog presence does not establish a trained model, qualified inference, independent receipt trust, or promotion. Software stays `SOFTWARE`; Khipu's research-only evidence stays `RESEARCH_ONLY`; bound but unpromoted assets stay `NOT_PROMOTED`; missing or conflicting evidence stays `UNKNOWN`. Owner-signed receipts carry only repository-declared key continuity. GGUF runtime outputs remain `UNSIGNED`, and [Lambda unconditional uniqueness](https://github.com/szl-holdings/platform/blob/f2f8df6f89056e9104587674ccec0855dd5b177a/replit-sync/conjecture/PROVEN_STATE_CANONICAL.md) remains Conjecture 1 `OPEN`.

Every proposal requires human review and reports execution as `NOT_CONFIGURED`. No runner, account credential, approval grant, deployment, Agent Builder publication, or paid model call is configured here. A later live integration would need separately verified account access, credits, model choice, current evidence, an approval controller, and explicit tracing settings.
