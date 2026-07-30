# Hosted Observability Proof Readback

## What is operational

`pnpm frontier:hosted-observability` performs read-only, bounded API retrieval
from Datadog, Langfuse, and Arize AX. It returns success only when every
provider returns one record that contains all three exact attributes:

| Attribute | Required value |
|---|---|
| `gen_ai.attestation.receipt.id` | The requested receipt ID |
| `vcs.ref.head.revision` | The requested full 40-character Git SHA |
| `deployment.environment.name` | `production` or `staging` |

The attributes must be co-located in one provider record. A receipt in one
record and a commit in another never passes. HTTP 200 alone, an empty result,
invalid JSON, an oversized response, a redirect, a timeout, or one provider
matching while another does not all remain `UNVERIFIED`.

The repository also exposes the manual
`HOSTED-OBSERVABILITY-PROOF` GitHub Actions workflow. It:

1. refuses to run from a workflow source other than the protected default
   branch;
2. queries all three providers without writing provider data;
3. uploads `hosted-observability-proof.json` for 30 days; and
4. fails unless the hosted-observability frontier is `OPERATIONAL`.

## Inputs

Shared proof identity:

| Variable | Purpose |
|---|---|
| `SZL_OBSERVABILITY_RECEIPT_ID` | Exact receipt ID; 1-200 safe identifier characters |
| `SZL_OBSERVABILITY_GIT_SHA` | Exact lowercase 40-character Git SHA |
| `SZL_OBSERVABILITY_ENVIRONMENT` | `production` by default; `staging` is also accepted |
| `SZL_OBSERVABILITY_LOOKBACK_HOURS` | Bounded query window, 1-168; defaults to 24 |

Provider configuration:

| Provider | Required secrets | Required routing input |
|---|---|---|
| Datadog | `DATADOG_API_KEY`, `DATADOG_APP_KEY` | `DATADOG_SITE`; defaults to `datadoghq.com` |
| Langfuse | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` | `LANGFUSE_TRACE_ID`; optional `LANGFUSE_BASE_URL` |
| Arize AX | `ARIZE_API_KEY` | `ARIZE_PROJECT_ID`; optional `ARIZE_BASE_URL` |

`DD_API_KEY`/`DD_APP_KEY` remain accepted aliases. Arize Phoenix is also
supported with
`PHOENIX_API_KEY`/`PHOENIX_PROJECT_ID`/`PHOENIX_BASE_URL` when Arize AX
configuration is absent.
Base URLs must be HTTPS, must not contain credentials, query strings, or
fragments, and must use the provider's allowlisted hosted domain. This prevents
the verifier from becoming a credential-forwarding or SSRF primitive.

Store API credentials as GitHub Actions secrets or in an approved local secret
store. Do not place them in source, workflow inputs, shell history, screenshots,
issues, PR text, or chat. The report contains credential-presence booleans and
response status metadata, never credential values or provider response bodies.

## Provider reads

- Datadog uses `POST /api/v2/spans/events/search` with exact attribute filters,
  a 25-record limit, and an explicit time window.
- Langfuse uses `GET /api/public/v2/observations` with the exact trace ID,
  selected metadata fields, a 100-record limit, and an explicit time window.
- Arize AX uses `POST /v2/spans` with a project ID, three exact attribute
  filters, a 100-record limit, and an explicit time window. The Phoenix
  compatibility path uses
  `GET /v1/projects/{project_identifier}/spans`.

The implementation follows the current official
[Datadog span-search API](https://docs.datadoghq.com/api/latest/spans/search-spans/),
[Langfuse Observations v2 API](https://langfuse.com/docs/api-and-data-platform/features/observations-api),
and
[Arize AX spans API](https://arize.com/docs/api-reference/spans/list-spans).

## Deployment and readback sequence

1. Configure the production exporter to preserve the three required
   attributes. The SZL GenAI telemetry contract already emits
   `gen_ai.attestation.receipt.id` for attested spans. Set
   `vcs.ref.head.revision` and `deployment.environment.name` as deploy-time
   OpenTelemetry resource attributes.
2. Emit one production span containing the receipt correlation.
3. Record the exact Langfuse trace ID and the Arize AX project identifier.
4. Configure the five provider API credentials as repository secrets.
5. Dispatch `HOSTED-OBSERVABILITY-PROOF` from the default branch with the exact
   receipt, Git SHA, trace ID, and project identifier.
6. Retain the successful run URL and downloaded JSON artifact with the release
   evidence packet.

Example deploy-time resource attributes:

```env
OTEL_RESOURCE_ATTRIBUTES=vcs.ref.head.revision=<40-char-sha>,deployment.environment.name=production
```

Example local verification after credentials are available through the process
environment:

```bash
pnpm frontier:hosted-observability
```

## Truth boundary

The verifier and workflow being merged means the readback path is executable;
it does not mean hosted production evidence already exists. Hosted proof stays
`UNAVAILABLE` when credentials are absent and `UNVERIFIED` when configuration,
retrieval, or exact matching fails. It becomes `VERIFIED` and `OPERATIONAL`
only after a live run observes the required record in all three providers.
