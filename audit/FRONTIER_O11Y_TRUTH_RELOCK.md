# Frontier observability truth relock

**Observed:** 2026-07-28T04:14:07Z

**Evidence tier:** MEASURED availability snapshot

**Verdict:** The repository contains observability architecture, configuration,
runtime code, and dashboard assets. The two advertised reference services were
not live-verifiable at the observation time. This snapshot does not prove that
they never existed or that a private deployment is unavailable.

## HTTP probes

Unauthenticated `GET` requests returned HTTP 404 for:

- `https://szlholdings-otel-collector.hf.space/healthz`
- `https://szlholdings-otel-collector.hf.space/version`
- `https://szlholdings-otel-collector.hf.space/evidence`
- `https://szlholdings-otel-collector.hf.space/v1/traces`
- `https://szlholdings-graphql-gateway.hf.space/healthz`
- `https://szlholdings-graphql-gateway.hf.space/version`
- `https://szlholdings-graphql-gateway.hf.space/evidence`
- `https://szlholdings-graphql-gateway.hf.space/khipu/verify`

## GitHub probes

Authenticated GitHub REST lookups returned HTTP 404 for:

- `szl-holdings/otel-collector`
- `szl-holdings/graphql-gateway`

## Claim boundary

Until a deployment exposes a source-identified health response, accepts a real
OTLP span containing an SZL receipt reference, and shows that span in a named
third-party observability UI, the supported claims are:

- dashboard and collector configuration: **IMPLEMENTED**
- GraphQL package and service source: **IMPLEMENTED**
- public reference services: **NOT LIVE-VERIFIED**
- third-party receipt rendering: **NOT PROVED**
- production Khipu emission through these reference services: **NOT PROVED**

The relock changes documentation labels only. It does not disable code or infer
private deployment state.
