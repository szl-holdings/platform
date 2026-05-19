# Sovereign Substrate — Proof Layer on HuggingFace Buckets

Every fine-tuned model, training dataset, eval snapshot, and agent skill the
FORGE pipeline produces is stored on **HuggingFace** under the
`betterwithage` org and sealed in a cryptographic **Proof Packet** that anyone
can verify offline.

The goal: make our AI artifacts independently auditable. The platform can be
offline, the network can be partitioned, and the packets are still verifiable
with a public Ed25519 key and the `hf-sovereign` CLI.

## Buckets

| Bucket          | HF repo                          | Purpose                                |
| --------------- | -------------------------------- | -------------------------------------- |
| `forge-models`  | `betterwithage/forge-models`     | Fine-tuned models, LoRA adapters       |
| `forge-datasets`| `betterwithage/forge-datasets`   | Training / eval datasets               |
| `forge-public`  | `betterwithage/forge-public`     | Public-tier artifacts (high gates)     |

## Proof Packet shape

```json
{
  "version": "1.0.0",
  "artifact": {
    "id": "forge/ner-distill-2026-05",
    "kind": "model",
    "name": "ner-distill-2026-05",
    "task": "ner",
    "bucket": "forge-models",
    "bucketUri": "hf://betterwithage/forge-models/ner-distill-2026-05",
    "contentHash": "sha256:…",
    "sizeBytes": 1234567,
    "license": "apache-2.0"
  },
  "provenance": {
    "pipelineId": "forge.fine-tune",
    "pipelineRunId": "run_…",
    "sourceArtifactIds": ["forge/ner-base@1"],
    "createdAt": "2026-05-18T…Z",
    "operator": "forge-bot"
  },
  "evaluation": {
    "mirrorEvalScore": 0.83,
    "biasScore": 0.92,
    "summary": { "ner.f1": 0.911 },
    "snapshotUri": "hf://betterwithage/forge-datasets/eval-2026-05"
  },
  "policy": {
    "covenantProfile": "forge-public",
    "trustTier": "verified",
    "approvedBy": ["covenant-policy@1.4.0"],
    "revocationUrl": "https://a11oy.example/sovereign/revocations/…"
  },
  "signature": {
    "algorithm": "ed25519",
    "publicKeyId": "forge-2026",
    "publicKeyHex": "…",
    "signedAt": "2026-05-18T…Z",
    "signature": "…"
  }
}
```

The signature covers the canonicalized JSON of every field **except**
`signature.signature` itself.

## Verifying — trust model

Verification is always done against a **pinned trusted key**. The key embedded
in the packet is *never* the root of trust on its own — otherwise an attacker
could self-sign a forged packet and pass verification. The trusted key set is
resolved in this order:

1. Explicit `--trusted-key <id>:<hex>` flags
2. `--public-key-url <url>` (default:
   `https://a11oy.szlholdings.com/api/sovereign/public-key`)
3. The CLI's bundled known-good key set, published in release notes

If the trust set is empty, verification fails closed.

```bash
pnpm --filter @workspace/sovereign-verify build
npx hf-sovereign verify hf-bucket://betterwithage/forge-models/ner-distill-2026-05 \
  --public-key-url https://a11oy.szlholdings.com/api/sovereign/public-key
```

Exit code is `0` on match, non-zero on mismatch, untrusted signer, or
revocation.

## Verifying in the browser

The `/sovereign` catalog page in A11oy pulls the platform public key once,
streams artifact bytes from `GET /api/sovereign/artifacts/:id/bytes`, and
runs the exact same `verifyPacket` code path used by the CLI. The user
re-checks the signature locally — the server never tells the browser whether
the packet is valid; the browser computes it.

## Trust tiers

| Tier            | Gate                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------ |
| `experimental`  | Default — any signed packet                                                                |
| `community`     | MirrorEval ≥ 0.5, bias ≥ 0.7, signed by `forge-*` key                                       |
| `verified`      | MirrorEval ≥ 0.7, bias ≥ 0.8, covenant profile = `forge-public`, signed by an approved key |

Publishing to the `forge-public` bucket requires `verified` tier — enforced
server-side by `POST /api/sovereign/publish` and the FORGE covenant gate.

## Endpoints

| Method | Path                                       | Description                          |
| ------ | ------------------------------------------ | ------------------------------------ |
| GET    | `/api/sovereign/public-key`                | Active Ed25519 public key            |
| GET    | `/api/sovereign/artifacts`                 | List published artifacts (filters)   |
| GET    | `/api/sovereign/artifacts/:id`             | Detail + packet body                 |
| POST   | `/api/sovereign/artifacts/:id/verify`      | Re-verify packet against HF bytes    |
| POST   | `/api/sovereign/publish`                   | Internal: register artifact + packet |

## MCP tool

The Substrate MCP gateway exposes `sovereign_search_artifacts` so any agent
connected to the gateway can discover artifacts by `kind`, `task`, `trustTier`,
and minimum eval/bias floors.

## Environment

| Var                              | Purpose                                          |
| -------------------------------- | ------------------------------------------------ |
| `HF_TOKEN`                       | HuggingFace upload/download token                |
| `HF_BUCKET_MODELS`               | Override default models bucket name              |
| `HF_BUCKET_DATASETS`             | Override default datasets bucket name            |
| `HF_BUCKET_PUBLIC`               | Override default public bucket name              |
| `SOVEREIGN_HF_ORG`               | HF org (default `betterwithage`)                 |
| `SOVEREIGN_SIGNING_KEY_ID`       | Key ID embedded in every signed packet           |
| `SOVEREIGN_SIGNING_KEY_HEX`      | Ed25519 secret key (32-byte hex)                 |

If `SOVEREIGN_SIGNING_KEY_HEX` is unset, the API returns `503` on `/publish`
and `/public-key` — there is no silent fallback.

## A11oy catalog page

`/sovereign` in the A11oy SPA renders the public catalog with one-click
in-browser verification using `verifyPacket` from
`@workspace/sovereign-substrate`.

## Detached signatures

Every published packet writes two artifacts to the bucket:

1. `<path>.proof.json` — the full signed envelope (JSON; signature embedded).
2. `<path>.proof.sig` — the raw Ed25519 signature (hex) as a detached file.

External verifiers may fetch either. The detached `.proof.sig` lets non-JSON
consumers (e.g. `cosign`-style tools, shell pipelines) verify without
deserializing the envelope.

## CDN pre-warming

Public-bucket artifacts are served via the HuggingFace CDN. To minimize
cold-start latency for the two primary regions (GCP US East, AWS US East),
the publisher issues a HEAD request to each region's edge after every
successful upload:

```
SOVEREIGN_CDN_PREWARM_REGIONS=gcp-us-east,aws-us-east
```

Leave unset to disable. Operators may extend the list to add additional
edges. Pre-warm failures are non-fatal and logged via `recordProof`.

## Bucket linkage in the FORGE registry

`hf_model_registry` carries four sovereign columns
(`sovereign_artifact_id`, `sovereign_bucket_uri`, `sovereign_packet_hash`,
`sovereign_verification_state`, `sovereign_last_verified_at`).
On publish, the API updates the matching `hf_model_registry` row by
`model_id`. The Sovereign catalog detail page surfaces the same fields
(bucket URI, packet hash, signer, verification state) so the registry
and catalog stay in sync.
