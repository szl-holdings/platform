<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 SZL Holdings. Licensed under the Apache License, Version 2.0. -->

# szl-graphql

Unified **Strawberry** GraphQL gateway over the five SZL flagships
(`a11oy`, `amaru`, `sentra`, `rosie`, `killinchu`). A single GraphQL surface
proxies to each flagship's REST endpoints and **signs a Khipu receipt on every
query and mutation** — the GraphQL layer is itself an audit-logged organ of the
mesh.

> Doctrine v11 — LOCKED, verbatim: **749 declarations / 14 unique axioms / 163 sorries**. `locked_at: c7c0ba17`

## Why GraphQL here

We adopted the best of the public art — Apollo Federation's subgraph
composition model and Strawberry's code-first schema — then **exceeded it via
the Khipu chain as the canonical audit log**. Every resolver call appends a
signed receipt, so the GraphQL gateway is not just a query router; it is a
tamper-evident ledger of every read and write that crosses the mesh boundary.

## Install

```bash
pip install szl-graphql            # schema only
pip install "szl-graphql[server]"  # + FastAPI/uvicorn to self-host
```

## Mount the schema

```python
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
from szl_graphql import schema

app = FastAPI()
app.include_router(GraphQLRouter(schema, graphql_ide=None), prefix="/graphql")
```

## Export the SDL (federation publish)

```python
from szl_graphql import schema
print(schema.as_str())   # Federation v2 SDL, ready for supergraph composition
```

## Live gateway

A reference deployment runs at **https://szlholdings-graphql-gateway.hf.space**:

| Path | Purpose |
| --- | --- |
| `/graphql` | GraphQL HTTP endpoint (POST) |
| `/graphiql` | Mobile-first GraphiQL explorer |
| `/graphql/sdl` | Federation v2 SDL for supergraph composition |
| `/healthz` | Liveness + Doctrine probe |

Source mirror: <https://github.com/szl-holdings/graphql-gateway>

## Schema shape

The gateway exposes a `flagships` query (mesh roster + live health), per-flagship
detail queries, and signed mutations. Each operation returns alongside a
`khipuReceipt` field carrying the signed hash that was appended to the chain,
and `chainIntegrity` reflecting verification of the running chain.

## References (adopted, then exceeded)

- [Apollo Federation](https://www.apollographql.com/docs/federation/) — subgraph composition model
- [Strawberry GraphQL](https://strawberry.rocks/) — code-first schema
- Cloudflare / Honeycomb / Datadog tracing — the receipt-per-operation idea, made canonical via Khipu

---

Signed: **Yachay** \<yachay@szlholdings.dev\>
Co-Authored-By: Perplexity Computer Agent
