# Counsel — Legal Matter Command

> Portfolio-wide legal matter tracking with obligation management, counterparty exposure mapping, and policy-gated human review — built for in-house counsel teams.

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Live Demo](https://szlholdings.com) · [Platform Demo Video](https://szlholdings.com/szl-demo-video/) · [Investor Dashboard](https://szlholdings.com/stephen/investor)

---

## What it does

Counsel is the legal matter intelligence surface for the SZL Holdings platform. It tracks obligations, deadlines, counterparty exposure, and compliance events across the full portfolio — with AI-assisted risk classification and policy-mandated human review gates enforced by the Alloy Fabric.

In-house counsel teams deal with volume: hundreds of active matters, thousands of deadlines, and exposure spread across dozens of counterparties. Counsel surfaces the right matter at the right moment, flags urgency before it becomes a miss, and ensures every consequential legal action has a human approval in the Proof Chain.

## Feature Highlights

- **Matter Dashboard** — Active legal matter tracking with urgency scoring and deadline proximity ranking
- **Obligation Timeline** — Deadline and obligation management: filing dates, renewal triggers, notice periods
- **Counterparty Map** — Legal exposure visualization by entity and counterparty relationship
- **Compliance Center** — Regulatory compliance status, control gap analysis, and audit readiness scoring
- **Human Lock** — Policy-mandated human review gates: consequential legal actions require explicit counsel approval before execution
- **Cross-Domain Signals** — Legal matter enrichment from Vessels (sanctions), Terra (ownership disputes), and Sentra (data breach exposure)

## Architecture

```
Portfolio Legal Data / Regulatory Feeds / Cross-Domain Signals
          |
    Signal Normalization (Alloy)
          |
    Counsel Domain Engine (urgency scoring, obligation resolution)
          |
    AI Risk Classification (Anthropic Claude)
          |
    Human Lock Gate (Covenant Policy — counsel approval required)
          |
    Proof Chain (immutable legal event log)
          |
    Counsel UI (React 19 + Vite 7)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Framer Motion |
| **Language** | TypeScript (strict mode, full stack) |
| **State** | TanStack Query v5, React Context |
| **Backend** | Express 5 via shared API server |
| **Database** | PostgreSQL 16 via Drizzle ORM |
| **AI** | Anthropic Claude via Alloy agent fabric (risk classification) |
| **Auth** | OIDC/PKCE, 11-role RBAC, org-scoped tenant isolation |
| **Audit** | Proof Chain — immutable, append-only event log |

## Quick Start

```bash
# From the monorepo root
pnpm install
pnpm --filter @szl-holdings/api-server dev   # Start the API server first
pnpm --filter @szl-holdings/counsel dev
```

## Key Modules

| Module | Route | Purpose |
|--------|-------|---------|
| Matter Dashboard | `/counsel/` | Active matter tracking with urgency scoring |
| Obligation Timeline | `/counsel/obligations` | Deadline and obligation management |
| Counterparty Map | `/counsel/counterparties` | Legal exposure by entity |
| Compliance Center | `/counsel/compliance` | Regulatory compliance status |
| Human Lock | `/counsel/approvals` | Policy-gated approval queue |
| Matter Knowledge | `/counsel/knowledge` | Graph + vector knowledge index over matter documents |

---

## Matter Knowledge Index

The Matter Knowledge page (`/counsel/knowledge`) adds a LightRAG-style knowledge index over matter documents. Users can upload documents, have them indexed, and ask natural-language questions that return cited answers spanning the full matter corpus.

### Upload & Index Flow

1. **Upload** — Drag-and-drop or browse to upload PDF, DOCX, or TXT files (up to 20 MB each).
2. **Text extraction** — TXT files are read directly; DOCX files are processed via `mammoth`; PDFs use BT/ET stream parsing with a printable-ASCII fallback.
3. **Chunking** — Documents are split into ~600-word overlapping chunks (50-word overlap) with section hints detected from heading-like lines.
4. **Keyword extraction** — Top-30 term-frequency keywords are stored per chunk for fast pre-filtering.
5. **Entity/relation extraction** — OpenAI processes the first 3 chunks of each document, extracting named entities (PARTY, PERSON, ORGANIZATION, DATE, OBLIGATION, CLAIM, JURISDICTION, AMOUNT, DOCUMENT, COURT, REGULATION) and entity–predicate–entity relations.
6. **Status tracking** — Documents transition through `pending → indexing → indexed` (or `error` on failure). The UI polls every 3 seconds while indexing is in progress.

### Query Flow

1. Client posts `{ question }` to `POST /api/counsel-knowledge/:matterId/query`.
2. All indexed chunks for the matter are fetched.
3. **Okapi BM25** (k1=1.5, b=0.75) ranks chunks against the query — the industry-standard sparse retrieval function used by Elasticsearch and Lucene.
4. Top 6 chunks and top 20 entities (by mention count) are sent as context to OpenAI (`gpt-5.1`).
5. OpenAI generates an answer with `[Source N]` citation markers.
6. The response includes the full answer text, a `citations` array, and a `queryId` for history persistence.

### Citation Format

```json
{
  "chunkId": 42,
  "documentId": 7,
  "fileName": "Merger_Agreement_v4.txt",
  "chunkIndex": 2,
  "sectionHint": "ARTICLE III: REGULATORY APPROVALS",
  "excerpt": "3.1 HSR Filing. Each party shall, as promptly as practicable…"
}
```

Each citation includes a `chunkId` that the frontend uses to fetch and display the full source passage in a modal via `GET /api/counsel-knowledge/:matterId/chunks/:chunkId`.

### Retrieval: BM25 vs Vector Embeddings

The system uses **Okapi BM25** for retrieval. The Replit AI Integrations proxy does not expose the OpenAI `POST /embeddings` endpoint (`INVALID_ENDPOINT` is returned). BM25 is a principled, query-length-normalised baseline — not a workaround.

**Upgrade path:** When a supported embeddings provider is available, the `rankChunksBM25()` function in `artifacts/api-server/src/routes/counsel-knowledge.ts` can be swapped for cosine similarity over pgvector embeddings. The rest of the pipeline (chunking, entity extraction, Q&A, citations) requires no changes.

### Index Isolation & Security

- Each index is scoped to `(matterId, orgId)`.
- `orgId` is always **server-derived** from the authenticated session (`req.user.orgId`), never from the client request body. This prevents cross-org data access.
- The `/api/counsel-knowledge/` prefix is on the global auth enforcer's public allowlist to support pre-auth demo flows.

### API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/counsel-knowledge/:matterId/documents` | List indexed documents |
| `GET` | `/api/counsel-knowledge/:matterId/status` | Index summary stats |
| `GET` | `/api/counsel-knowledge/:matterId/entities` | Top entities by mention count |
| `GET` | `/api/counsel-knowledge/:matterId/relations` | Entity relation triples |
| `GET` | `/api/counsel-knowledge/:matterId/queries` | Query history |
| `GET` | `/api/counsel-knowledge/:matterId/chunks/:chunkId` | Full chunk content for citation source viewing |
| `GET` | `/api/counsel-knowledge/:matterId/documents/:docId/chunks` | All chunks for a document |
| `POST` | `/api/counsel-knowledge/:matterId/upload` | Upload and index a document |
| `POST` | `/api/counsel-knowledge/:matterId/query` | Ask a natural-language question |
| `POST` | `/api/counsel-knowledge/:matterId/seed` | Load sample documents (demo) |
| `DELETE` | `/api/counsel-knowledge/:matterId/documents/:docId` | Remove a document and its index |

### Database Tables

| Table | Purpose |
|---|---|
| `counsel_knowledge_documents` | Document registry, extraction status, raw text |
| `counsel_knowledge_chunks` | Chunked passages with keywords and char offsets |
| `counsel_knowledge_entities` | Named entities with mention counts |
| `counsel_knowledge_relations` | Entity–predicate–entity triples |
| `counsel_knowledge_queries` | Query history with stored answers and citations |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API server base URL |
| `VITE_PLAUSIBLE_DOMAIN` | Plausible analytics domain |

See [`ops/infra/environment-matrix.md`](../../ops/infra/environment-matrix.md) for the full matrix.

## Visual Standards

See [`media/brand-kit/tokens.md`](../../media/brand-kit/tokens.md) for the visual brand standards that govern this surface.

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
