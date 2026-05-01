# SZL Holdings — Azure Landing Zone Plan

**Version:** 1.0  
**Date:** 2026-05-01  
**Phase:** 5 — Resource & Delivery  
**Status:** Plan — No Azure resources provisioned. Live deployment requires human approval.  
**Owner:** platform-team  
**Related:** `docs/reference-architecture-szl.md` (Plane 3), `platform/crossplane/`, `platform/gitops/`

---

## 1. Purpose and Scope

This document maps the current SZL Holdings infrastructure state to the Azure Landing Zone (ALZ) reference architecture and proposes the concrete refactoring steps needed to reach the ALZ target. It is a bridge plan — not a big-bang rewrite. Every proposal is additive or adaptive; no existing Bicep module is deleted.

The ALZ framework organizes Azure resources into:
- **Platform Landing Zones** — shared services (connectivity, management, identity)
- **Application Landing Zones** — per-workload or per-domain environments
- **Management Group hierarchy** — policy and RBAC inheritance tree

**Out of scope:** Provisioning any real Azure resources. This plan is consumed by the human approval process that gates Phase 5 execution.

---

## 2. Current State Assessment

### 2.1 What Exists (Bicep modules in `infra/`)

| Module | Resource Type | Status |
|--------|--------------|--------|
| `infra/main.bicep` | Orchestrator — deploys all modules | Authored, not deployed |
| `infra/modules/postgres.bicep` | Azure Database for PostgreSQL Flexible Server | Authored |
| `infra/modules/redis.bicep` | Azure Cache for Redis | Authored |
| `infra/modules/keyvault.bicep` | Azure Key Vault | Authored |
| `infra/modules/containerapp.bicep` | Azure Container Apps Environment + App | Authored |
| `infra/modules/blobstorage.bicep` | Azure Blob Storage Account | Authored |
| `infra/modules/storage.bicep` | Azure Storage Account (general) | Authored |
| `infra/modules/servicebus.bicep` | Azure Service Bus Namespace + Queue | Authored |
| `infra/modules/frontdoor.bicep` | Azure Front Door + WAF Policy | Authored |
| `infra/modules/staticwebapp.bicep` | Azure Static Web Apps | Authored |
| `infra/modules/vnet.bicep` | Azure Virtual Network + Subnets | Authored |
| `infra/modules/docintell.bicep` | Azure Document Intelligence | Authored |
| `infra/modules/eval-runner.bicep` | Eval runner Container App | Authored |
| `infra/modules/alerting.bicep` | Azure Monitor Alerts + Action Groups | Authored |

### 2.2 What Is Missing (ALZ gaps)

| ALZ Component | Status | Gap |
|---------------|--------|-----|
| Management Group hierarchy | Not created | No MG tree; all resources would land in root subscription |
| Policy Assignments (Azure Policy) | Not authored | No built-in or custom policy assigned |
| Identity Landing Zone (Entra ID) | Not configured | No managed identities, no workload identity federation |
| Connectivity Landing Zone | Not configured | VNet exists in Bicep but not integrated with ALZ hub |
| Log Analytics Workspace | In `main.bicep` but standalone | Not connected to central management |
| Azure Monitor centralization | Partial (`alerting.bicep`) | Alerts scoped per-resource; no central workspace |
| Subscription vending | Not implemented | Manual subscription creation required |
| Azure Defender / Defender for Cloud | Not enabled | No security posture management |

---

## 3. Azure Landing Zone Target Architecture

### 3.1 Management Group Hierarchy

```
SZL Tenant Root (/)
├── SZL-Platform (MG)                        ← Platform Landing Zone
│   ├── Subscription: szl-connectivity        ← Hub VNet, ExpressRoute, DNS
│   ├── Subscription: szl-management          ← Log Analytics, Defender, Backup Vault
│   └── Subscription: szl-identity            ← Entra ID, Managed Identities
├── SZL-Applications (MG)                    ← Application Landing Zones
│   ├── SZL-NonProd (MG)
│   │   ├── Subscription: szl-dev             ← Dev workloads (all domains)
│   │   └── Subscription: szl-stage           ← Stage workloads (all domains)
│   └── SZL-Prod (MG)
│       └── Subscription: szl-prod            ← Production workloads
└── SZL-Sandbox (MG)                         ← Developer experiments (no prod data)
    └── Subscription: szl-sandbox
```

**Current state:** No management group hierarchy exists. All Bicep in `infra/main.bicep` targets a single resource group in a single subscription. The hierarchy above is the target.

**Refactor proposal:** Create the MG hierarchy as a one-time platform-team operation. Policy assignments inherit from parent MGs — this is the mechanism that ensures all `szl-applications` subscriptions get the same security baseline.

---

### 3.2 Platform Landing Zone — Connectivity

| Resource | Target | Bicep Module |
|----------|--------|-------------|
| Hub Virtual Network | `szl-connectivity` subscription | `infra/modules/vnet.bicep` (adapt to hub/spoke) |
| Private DNS Zones | Hub VNet | New module needed: `infra/modules/privatedns.bicep` |
| Azure Bastion (optional) | Hub VNet | Not authored |
| Azure Firewall (optional) | Hub VNet | Not authored |
| VNet Peering (hub → spokes) | Each application subscription | New module needed |

**Refactor proposal:** The existing `infra/modules/vnet.bicep` creates a standalone VNet. It should be refactored to:
1. Be deployed once as the hub in `szl-connectivity`
2. Accept spoke VNet resource IDs to create peering connections
3. Deploy private DNS zones for PostgreSQL, Key Vault, Service Bus, Redis, Storage

**Bridge (no-deletion):** The existing `vnet.bicep` module is not deleted. A new `vnet-hub.bicep` extends it with peering and DNS zone support.

---

### 3.3 Platform Landing Zone — Management

| Resource | Target | Current State |
|----------|--------|--------------|
| Log Analytics Workspace | `szl-management` subscription | In `main.bicep` — standalone |
| Application Insights | `szl-management` subscription | In `main.bicep` — standalone |
| Azure Monitor Alerts | `szl-management` subscription | In `alerting.bicep` — per-resource |
| Azure Backup Vault | `szl-management` subscription | Not authored |
| Microsoft Defender for Cloud | `szl-management` subscription | Not enabled |

**Refactor proposal:**
- Move Log Analytics Workspace and Application Insights to the `szl-management` subscription so all application subscriptions send logs to a single workspace
- Centralize `alerting.bicep` to target the management workspace rather than per-resource
- Add `infra/modules/backup.bicep` for database backup policies
- Enable Defender for Cloud at the MG level (built-in policy — no custom Bicep required)

---

### 3.4 Application Landing Zone — Dev / Stage / Prod Subscriptions

Each application subscription follows the same resource group pattern:

```
szl-{env}-rg-shared          ← Shared services: Key Vault, Service Bus, Storage, ACR
szl-{env}-rg-compute         ← Container Apps Environment, Container App Jobs
szl-{env}-rg-data            ← PostgreSQL, Redis, Document Intelligence
szl-{env}-rg-network         ← VNet (spoke), Private Endpoints, DNS resolvers
szl-{env}-rg-observe         ← Application Insights (linked to mgmt workspace)
```

**Crossplane integration:** Each resource group maps to one or more Crossplane composite claims. Crossplane provisions into the correct resource group based on the `environment` field in the composite spec. The Crossplane Azure ProviderConfig targets the appropriate subscription per environment.

---

## 4. Identity and Access — Managed Identity Refactor Plan

### 4.1 Current State

All Azure resources use either:
- **Static credentials** (connection strings, API keys) injected as environment variables via Replit Secrets (dev) or planned Key Vault references (prod)
- **No identity** — workloads have no Azure AD identity; they authenticate with connection strings

### 4.2 Target State

| Workload | Target Identity | Auth Method |
|----------|----------------|------------|
| Container Apps (api-server, alloy-*) | System-assigned Managed Identity | Key Vault secret retrieval via RBAC |
| Container App Jobs (workers) | System-assigned Managed Identity | Key Vault secret retrieval via RBAC |
| GitHub Actions CI | Federated Workload Identity | OIDC token exchange — no service principal password |
| Crossplane provider (stage/prod) | Federated Workload Identity | OIDC token exchange from cluster service account |
| Crossplane provider (dev) | Service Principal (blocker — see §6) | Azure SDK credential chain |

### 4.3 Managed Identity Refactor Steps

1. **Enable system-assigned managed identity on all Container Apps** — already declared in Crossplane compositions (`identity: [{type: SystemAssigned}]`)
2. **Create Key Vault access policies for each managed identity** — already declared in compositions (Step 5 of each composition)
3. **Replace static connection strings with Key Vault references** — requires updating `infra/modules/containerapp.bicep` to use `secretsKeyVaultRef` instead of plain secret values
4. **Replace GitHub Actions service principal with OIDC federation** — requires creating a federated credential in Entra ID (new `infra/modules/github-oidc.bicep`)
5. **Enable Azure RBAC for Key Vault** — replace legacy access policies with RBAC role assignments

**Bridge plan:** Static credentials continue to work during the migration. The Crossplane `secretSourceMode` field controls which retrieval path is active per environment. No workload is broken during the transition.

---

## 5. Networking — Private Endpoint Refactor Plan

### 5.1 Current State

`infra/modules/vnet.bicep` creates a VNet with subnets but no private endpoints are wired to Azure PaaS services. All Azure PaaS services (PostgreSQL, Redis, Key Vault, Service Bus, Storage) would be exposed on their public endpoints.

### 5.2 Target State

All PaaS services in stage and prod use **private endpoints** — no public internet access:

| Service | Private Endpoint Subresource | DNS Zone |
|---------|----------------------------|---------|
| Azure Database for PostgreSQL | `postgresqlServer` | `privatelink.postgres.database.azure.com` |
| Azure Cache for Redis | `redisCache` | `privatelink.redis.cache.windows.net` |
| Azure Key Vault | `vault` | `privatelink.vaultcore.azure.net` |
| Azure Service Bus | `namespace` | `privatelink.servicebus.windows.net` |
| Azure Blob Storage | `blob` | `privatelink.blob.core.windows.net` |

### 5.3 Refactor Steps

1. Add `infra/modules/privatedns.bicep` — creates the five private DNS zones linked to the hub VNet
2. Extend `infra/modules/postgres.bicep`, `redis.bicep`, `keyvault.bicep`, `servicebus.bicep`, `blobstorage.bicep` to accept a `privateEndpointSubnetId` parameter; when provided, create the private endpoint and DNS record
3. Crossplane `XDomainService` with `networkExposure: private` triggers the private endpoint step (Step 6 in compositions — already declared)
4. OPA policy (Phase 4) will enforce `networkExposure: private` for `criticality: critical` workloads in prod

**Bridge plan:** Private endpoint is optional (enabled per composite via `networkExposure`). Dev workloads can continue to use public endpoints without blocking platform progress.

---

## 6. Identity Blockers — Where Managed Identity Cannot Yet Replace Static Credentials

| Blocker | Environment | Reason | Remediation | Owner |
|---------|-------------|--------|-------------|-------|
| Dev workloads (Replit) | dev | Replit containers run outside Azure; managed identity requires Azure AD token endpoint reachable from within Azure | Continue with Replit Secrets for dev; consider Azure Arc or VPN tunnel as long-term fix | platform-team |
| Crossplane Azure provider (dev) | dev | Crossplane runs on a Kubernetes cluster; dev cluster is on Replit infrastructure outside Azure | Use Service Principal with RBAC-minimal permissions; rotate via CI secret | platform-team |
| External AI API keys (OpenAI, Anthropic) | all | OpenAI and Anthropic do not support Azure managed identity; API keys are required | Store in Key Vault; retrieve via managed identity at runtime; never embed in manifests | platform-team |
| Stripe webhook secret | all | Stripe does not support Azure managed identity | Store in Key Vault; retrieve via managed identity | platform-team |
| GitHub Actions (current) | CI | Current workflows use a service principal (if any); federated identity not yet configured | Create `infra/modules/github-oidc.bicep`; configure OIDC in GitHub settings | platform-team |

**Constraint:** No blocker blocks the manifest authoring or dry-run validation work. All blockers are relevant only to live deployment (Phase 5 execution — post human approval).

---

## 7. Subscription and Resource Group Naming Convention

All resources follow the pattern:

```
{service-prefix}-{component}-{environment}-{region-short}-{unique-suffix}
```

Examples:
- `szl-pg-prod-weu-abc123` — PostgreSQL, prod, West Europe
- `szl-kv-shared-prod-weu-abc123` — Key Vault, shared, prod
- `szlholdigsacr` — ACR (no hyphens — storage naming constraint)

The `uniqueSuffix` is derived from `uniqueString(resourceGroup().id, baseName)` in `main.bicep` — deterministic per resource group, collision-resistant.

---

## 8. Policy — Azure Policy Assignments

The following Azure Policy assignments are recommended at the Management Group level:

| Policy | Scope | Effect | Phase |
|--------|-------|--------|-------|
| Require tags: `szl-environment`, `szl-domain`, `szl-cost-center`, `szl-owner` | `SZL-Applications` MG | Deny (no tag = no resource) | Phase 5 |
| Allowed resource types (allowlist) | `SZL-Applications` MG | Deny | Phase 5 |
| Require private endpoints for PaaS (prod) | `SZL-Prod` MG | Deny | Phase 5 |
| Deny public access to Key Vault (prod) | `SZL-Prod` MG | Deny | Phase 5 |
| Require managed identity on Container Apps (prod) | `SZL-Prod` MG | Deny | Phase 5 |
| Enable Defender for Containers | `SZL-Applications` MG | DeployIfNotExists | Phase 5 |
| Enable Defender for Key Vault | `SZL-Applications` MG | DeployIfNotExists | Phase 5 |

These Azure Policy assignments complement the OPA Rego policies in `/platform/policy/` (Phase 4). Azure Policy governs the Azure control plane; OPA governs the Kubernetes/Crossplane control plane.

---

## 9. Logging and Security Centralization

### Target Logging Architecture

```
All Container Apps → OTLP (packages/otel) → OTel Collector (/observability/collector/)
                                          → Azure Monitor / Log Analytics (szl-management)
                                          → Grafana (optional — Phase 4)

All Azure Resources → Azure Diagnostic Settings → Log Analytics Workspace (szl-management)
Azure AD → Audit Logs → Log Analytics Workspace (szl-management)
```

### Security Centralization

- **Microsoft Defender for Cloud:** Enabled at `SZL-Applications` MG level — covers all subscriptions
- **Key Vault audit logs:** All Key Vault access events forwarded to Log Analytics
- **Entra ID sign-in logs:** Forwarded to Log Analytics for SIEM correlation
- **GitHub Advanced Security:** Code scanning, secret scanning, dependency review — already active (`.github/workflows/`)

---

## 10. Refactor Proposals Summary

| Proposal | Priority | Effort | Blocks |
|----------|----------|--------|--------|
| P1: Enable Managed Identity on all Container Apps | High | Low (already in Crossplane compositions) | Secret distribution elimination |
| P2: Configure OIDC federation for GitHub Actions CI | High | Medium | Service principal rotation debt |
| P3: Create private DNS zones module | High | Medium | Private endpoint enablement |
| P4: Extend PaaS modules with private endpoint param | High | Medium | Network isolation |
| P5: Create Management Group hierarchy | Medium | Low (Azure Portal — one-time) | Policy inheritance |
| P6: Centralize Log Analytics to szl-management | Medium | Low (Bicep param change) | Unified observability |
| P7: Move to Key Vault RBAC (replace access policies) | Medium | Medium | Managed identity migration |
| P8: Create VNet hub/spoke peering module | Medium | Medium | Private connectivity |
| P9: Enable Defender for Cloud at MG level | Low | Low (Azure Policy — one-time) | Security posture |
| P10: Subscription vending automation | Low | High | Self-service environment creation |

---

## 11. Relation to Crossplane Composites

Each Crossplane composite claim in `/platform/crossplane/xrds/` maps to resources in this plan:

| Composite | Primary ALZ Resources | RG Pattern |
|-----------|----------------------|-----------|
| `XDomainService` | Container App (compute RG), PostgreSQL (data RG), Redis (data RG), KV access (shared RG) | `szl-{env}-rg-compute`, `szl-{env}-rg-data` |
| `XAgentWorker` | Container App Job (compute RG), Service Bus Queue (shared RG), PostgreSQL (data RG) | `szl-{env}-rg-compute`, `szl-{env}-rg-data` |
| `XInternalUI` | Static Web App (compute RG), Front Door route (shared RG) | `szl-{env}-rg-compute` |
| `XEventPipeline` | Service Bus Topic + Subscriptions (shared RG) | `szl-{env}-rg-shared` |
| `XDataConnector` | Blob Container (shared RG), APIM backend (shared RG), Document Intelligence (data RG) | `szl-{env}-rg-shared`, `szl-{env}-rg-data` |

---

## 12. Next Steps (Human-Gated)

The following steps require explicit platform-team approval and are NOT executed by this task:

1. **Create Azure subscriptions** for the management group hierarchy
2. **Deploy `infra/main.bicep`** to the `szl-dev` subscription (first environment)
3. **Bootstrap Crossplane** on the Kubernetes cluster (`platform/crossplane/README.md` apply order)
4. **Bootstrap Argo CD** and apply the root app-of-apps (`platform/gitops/bootstrap/app-of-apps.yaml`)
5. **Configure OIDC federation** for GitHub Actions
6. **Configure private DNS zones** for private endpoint resolution

See `docs/migration-log.md` Phase 5+6+7 entry for the next command and dependency chain.
