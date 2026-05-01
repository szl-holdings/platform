# SZL Holdings — Score Resolver Patterns

**Version:** 1.0  
**Owner:** Platform Engineering (group:platform-team)  
**Status:** Documented; execution is the Resource & Delivery task (Phase 5)

This document is the authoritative decision record for how Score inputs map to deployment targets, service exposure, backing resources, secret references, observability defaults, and policy labels.

---

## 1. Deployment Target Resolution

The deployment target is derived from two inputs: **lifecycle** and **workload type**.

| Lifecycle | Workload Type | Deployment Target | Notes |
|-----------|---------------|-------------------|-------|
| `production` | `api-service` | Azure Container Apps | Internal ingress + Front Door CDN |
| `production` | `website` / `spa` | Azure Static Web Apps | Front Door CDN |
| `production` | `worker` (queue) | Azure Container Apps Jobs | Scale-to-zero, queue-depth trigger |
| `production` | `worker` (cron) | Azure Container Apps Jobs | CRON trigger |
| `production` | `event-consumer` | Azure Container Apps | KEDA event trigger |
| `experimental` | any | Azure Container Apps (dev slot) | No external ingress; internal only |
| `development` | any | Docker Compose (local) | Via `humctl compose` |

**Rule:** Production workloads never share Container Apps environments with experimental workloads.

---

## 2. Service Exposure Patterns

| Workload Type | Exposure | Ingress Path |
|---------------|----------|--------------|
| `api-server` (central gateway) | Public + Internal | `/api/*` via Front Door |
| Domain API service | Internal only | VNet-internal, consumed by api-server |
| Website SPA | Public CDN | `/<domain>/` via Static Web Apps |
| Worker | None (queue-triggered) | No ingress |
| Event consumer | Internal health only | Internal health port |

**Security rule:** Domain API services are never directly exposed to the internet. All external traffic must enter via the central `api-server` (or Front Door → Static Web Apps for SPAs).

---

## 3. Resource Type → Azure Service Binding

| Score Resource Type | Azure Service (prod) | Local Dev Equivalent |
|---------------------|----------------------|----------------------|
| `postgres` / `database` | Azure Database for PostgreSQL Flexible Server | Replit PostgreSQL |
| `redis` / `cache` | Azure Cache for Redis | Docker redis:alpine |
| `queue` / `azure-service-bus` | Azure Service Bus (Standard tier) | Azure Service Bus Emulator |
| `topic-subscription` | Azure Service Bus Topic + Subscription | Azure Service Bus Emulator |
| `secret-store` / `azure-key-vault` | Azure Key Vault | Replit Secrets |
| `container-registry` | Azure Container Registry | Local Docker daemon |
| `external-api` / `openai` | OpenAI API (direct) | OpenAI API (same key) |
| `external-api` / `anthropic` | Anthropic API (direct) | Anthropic API (same key) |

---

## 4. Secret Reference Convention

All secrets are referenced by environment variable name in Score manifests. The resolver maps these to the correct secret store per environment:

| Environment | Secret Provider | Reference Format |
|-------------|-----------------|------------------|
| `development` | Replit Secrets | Direct env var injection |
| `staging` | Azure Key Vault (dev-kv) | Managed Identity → Key Vault ref |
| `production` | Azure Key Vault (prod-kv) | Managed Identity → Key Vault ref |

**Convention:** Secret names in Key Vault follow the pattern: `szl-{service}-{secret-name}`.  
Example: `DATABASE_URL` for `api-server` → Key Vault secret `szl-api-server-database-url`.

**Rule:** Secret values must never appear in Score manifests, catalog-info.yaml, or any version-controlled file. Only secret names (references) are allowed.

---

## 5. Observability Defaults

The platform resolver automatically injects the following observability configuration for all workloads:

| Tier | Applies To | What Gets Injected |
|------|-----------|-------------------|
| `full` | All `api-service`, `worker`, `event-consumer` | OTel collector sidecar, log forwarding to Azure Monitor, health endpoint scrape |
| `browser-otel` | All `website` SPAs | OTel SDK env vars for browser trace endpoint |
| `minimal` | Deprecated/experimental workloads | Structured log forwarding only |

**OTel collector endpoint injection (all non-SPA workloads):**
```yaml
OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector.szl-platform.svc:4318
OTEL_SERVICE_NAME: <workload-name>
OTEL_RESOURCE_ATTRIBUTES: "deployment.environment=${DEPLOYMENT_ENVIRONMENT},service.team=${OWNER_GROUP}"
```

---

## 6. Policy Label Matrix

Policy labels are injected by the resolver based on workload type. Developers may not remove labels; they may add domain-specific ones.

| Workload Type | Mandatory Labels |
|---------------|-----------------|
| `api-service` | `authenticated`, `policy-gated`, `audit-logged`, `rate-limited` |
| `website` | `authenticated`, `spa` |
| `worker` | `policy-gated`, `audit-logged` |
| `worker` with `emits-proof: true` | `policy-gated`, `proof-emitting`, `audit-logged` |
| `event-consumer` | `policy-gated`, `audit-logged` |

**Enforcement:** OPA/Gatekeeper will reject deployments missing mandatory labels (Phase 4 implementation).

---

## 7. Domain → Criticality Mapping

| Domain | Default Criticality | Rationale |
|--------|--------------------|-----------| 
| `platform` (api-server, auth) | `critical` | All traffic flows through; outage = full platform down |
| `alloy` | `high` | AI inference chain; degraded = AI features unavailable |
| `lyte` | `high` | Observability; degraded = blind operations |
| `aegis` | `high` | Governance; degraded = unaudited actions |
| `operations` domain packs | `standard` | Per-domain user impact only |
| `corporate` | `standard` | Marketing/investor-facing; tolerate brief outages |

---

## 8. Scale-to-Zero Rules

| Workload Type | Scale-to-Zero Allowed | Minimum Instances (prod) |
|---------------|----------------------|--------------------------|
| `api-server` | No | 2 |
| Domain API service | Yes (experimental) | 1 (production) |
| `worker` (queue) | Yes | 0 (scales from queue depth) |
| `worker` (cron) | Yes | 0 (scales on schedule) |
| `website` SPA | N/A — static | N/A |
| `event-consumer` | Yes | 0 (KEDA) |
