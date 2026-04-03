# PRISM Counsel — Blocker Manifest

## Status: April 2026

The following items require external setup, tenant consent, or paid credentials
before their associated functionality can activate in production.

---

## BLOCKER-01: Microsoft 365 Tenant Consent
**Affects**: Outlook ingestion, Teams alerting, SharePoint binder sync, Calendar prep windows, M365 delta cursors

**Required environment variables**:
- `M365_TENANT_ID` — Azure Active Directory tenant ID
- `M365_CLIENT_ID` — App registration client ID
- `M365_CLIENT_SECRET` — App secret (or certificate)

**Required Azure permissions (delegated or application)**:
- `Mail.Read`, `Mail.ReadWrite`
- `Files.ReadWrite.All` (SharePoint)
- `ChannelMessage.Send` (Teams)
- `Calendars.ReadWrite`
- `User.Read.All`

**Action required**: IT/Azure AD admin must grant tenant-wide consent at
`https://login.microsoftonline.com/{tenant}/adminconsent`

---

## BLOCKER-02: Azure AI Services (optional acceleration path)
**Affects**: Document Intelligence OCR, Azure OpenAI (if routing to Azure endpoints),
Azure Cognitive Search (if opted in over HuggingFace)

**Required environment variables** (if Azure AI path used):
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_KEY`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
- `AZURE_DOCUMENT_INTELLIGENCE_KEY`

**Note**: HuggingFace Inference Endpoints are the default AI path and do not require Azure.
Azure AI is an acceleration alternative, not a hard requirement.

---

## BLOCKER-03: HuggingFace Inference Endpoint Credentials
**Affects**: `prism-hf-gateway` service, multi-model routing (prism_extract, prism_classify, prism_reason lanes)

**Required environment variables**:
- `HF_API_TOKEN` — HuggingFace API token with Inference API access
- `HF_ENDPOINT_PRISM_EXTRACT` — Custom inference endpoint URL (legal NER/extract)
- `HF_ENDPOINT_PRISM_CLASSIFY` — Custom inference endpoint URL (classification)
- `HF_ENDPOINT_PRISM_REASON` — Custom inference endpoint URL (reasoning)

**Note**: Standard HuggingFace Inference API is available as fallback for
non-production workloads with `HF_API_TOKEN` only.

---

## BLOCKER-04: Practice Management System (PMS) Integration
**Affects**: Matter data sync, billing sync, fee tracking

**Options**:
- Clio: Requires `CLIO_CLIENT_ID`, `CLIO_CLIENT_SECRET`, OAuth2 flow
- Filevine: Requires `FILEVINE_API_KEY`, `FILEVINE_ORG_ID`
- Litify (Salesforce): Requires Salesforce Connected App credentials

**Action required**: Firm configures connector via `/prism-counsel/connectors` UI
after providing credentials.

---

## BLOCKER-05: External Signal Feed APIs (Worldline)
**Affects**: Weather/environmental signals, crash data feeds, court data APIs

**Optional paid feeds**:
- ISO ClaimSearch: `ISO_CLAIMSEARCH_KEY`
- Verisk/AIR: `VERISK_API_KEY`
- Weather.gov (free, no key) — already integrated
- Commercial court records APIs: per-vendor keys

**Note**: Worldline sources with `fetch_method: rss_feed` or `rest_api` work
without API keys for public data. Paid feeds require vendor credentials.

---

## Non-Blockers (Already Available)

The following work WITHOUT additional credentials:
- All REST API endpoints (`/api/prism-counsel/*`)
- GraphQL queries and mutations
- Matter Twin (all 17 subpages)
- Pressure Graph (12 dimensions — computed from db signals)
- Proof Chain (entries, contradictions, audit packets)
- Approval workflow (request/approve/reject)
- AI routing via platform model lanes
- PostgreSQL schema (all tables created via Drizzle migrations)
- File upload connector (direct upload path)
- Dashboard/observability views
