# SZL Holdings — Crossplane Resource Plane

**Plane:** 3 — Resource  
**Phase:** 5 (Resource & Delivery)  
**Owner:** platform-team  
**Status:** Manifests ready — live application pending human approval (Operability + Governance task)

---

## Purpose

This directory contains the Crossplane composite resource definitions (XRDs), compositions, provider configs, and composition functions that form the **Resource Plane** of the SZL Holdings platform. Developers declare what resources they need using the five composite APIs; Crossplane provisions the underlying Azure resources without exposing provider-level complexity.

No real Azure resources are provisioned by files in this directory alone. Provisioning requires:
1. A live Crossplane installation on a Kubernetes cluster (Phase 5 execution — human approval required)
2. Provider credentials configured (see `providers/azure.yaml`)
3. An Argo CD sync that applies the manifests (see `../gitops/`)

---

## Composite APIs

| Composite | Claim | Workload Archetype | Primary Azure Resources |
|-----------|-------|-------------------|------------------------|
| `XDomainService` | `DomainService` | REST API service | Container App, PostgreSQL (opt), Redis (opt), KV access |
| `XAgentWorker` | `AgentWorker` | Async AI worker | Container App Job, Service Bus Queue (opt), PostgreSQL (opt), KV access |
| `XInternalUI` | `InternalUI` | React SPA | Static Web App, Front Door route (opt) |
| `XEventPipeline` | `EventPipeline` | Event bus | Service Bus Topic + Subscriptions, Private Endpoint (opt) |
| `XDataConnector` | `DataConnector` | Data connector | Blob Container, APIM backend (opt), Document Intelligence (opt) |

---

## Governance Metadata (required on all composites)

Every composite requires this governance field set. OPA policies (Phase 4) enforce these fields at admission time:

| Field | Values | Purpose |
|-------|--------|---------|
| `environment` | `dev \| stage \| prod` | Environment isolation |
| `domain` | string | Business domain tagging |
| `criticality` | `critical \| high \| standard \| low` | SLA and alert routing |
| `costCenter` | string | Azure cost attribution tag |
| `owner` | string | Backstage group ID |
| `networkExposure` | `public \| internal \| private` | Network policy enforcement |
| `secretSourceMode` | `key-vault \| workload-identity \| replit-secrets` | Secret retrieval gate |
| `observabilityTier` | `full \| standard \| minimal` | OTel sampling rate |
| `backupProfile` | `daily-30d \| daily-7d \| none` | Backup policy |

---

## Directory Structure

```
platform/crossplane/
├── xrds/                     # CompositeResourceDefinition manifests (5 XRDs)
│   ├── xdomainservice.yaml
│   ├── xagentworker.yaml
│   ├── xinternalui.yaml
│   ├── xeventpipeline.yaml
│   └── xdataconnector.yaml
├── compositions/             # Composition (pipeline mode) manifests (5 compositions)
│   ├── xdomainservice-composition.yaml
│   ├── xagentworker-composition.yaml
│   ├── xinternalui-composition.yaml
│   ├── xeventpipeline-composition.yaml
│   └── xdataconnector-composition.yaml
├── providers/
│   └── azure.yaml            # Provider + ProviderConfig declarations
├── functions/
│   └── functions.yaml        # Composition function packages
├── examples/                 # Score → Composite resolution worked examples
│   ├── api-service-to-xdomainservice.yaml
│   ├── agent-worker-to-xagentworker.yaml
│   ├── internal-ui-to-xinternalui.yaml
│   └── event-consumer-to-xeventpipeline.yaml
└── README.md                 # This file
```

---

## Apply Order

When bootstrapping Crossplane for the first time, apply in this order:

```bash
# 1. Install Crossplane itself (via Argo CD — see ../gitops/bootstrap/)
# 2. Install composition functions
kubectl apply -f platform/crossplane/functions/functions.yaml
# 3. Install providers (wait for provider pods to be ready)
kubectl apply -f platform/crossplane/providers/azure.yaml
# 4. Configure provider credentials (via Argo CD secret management — no values here)
kubectl create secret generic azure-sp-credentials \
  --from-file=credentials=/path/to/azure-creds.json \
  -n crossplane-system  # credentials sourced from Key Vault, not this repo
# 5. Apply XRDs
kubectl apply -f platform/crossplane/xrds/
# 6. Apply Compositions
kubectl apply -f platform/crossplane/compositions/
```

---

## Validation Commands

```bash
# Validate XRD YAML structure (offline — no cluster required)
kubectl apply --dry-run=client -f platform/crossplane/xrds/xdomainservice.yaml
kubectl apply --dry-run=client -f platform/crossplane/xrds/xagentworker.yaml
kubectl apply --dry-run=client -f platform/crossplane/xrds/xinternalui.yaml
kubectl apply --dry-run=client -f platform/crossplane/xrds/xeventpipeline.yaml
kubectl apply --dry-run=client -f platform/crossplane/xrds/xdataconnector.yaml

# Validate Composition YAML structure (offline)
kubectl apply --dry-run=client -f platform/crossplane/compositions/

# Validate examples (offline)
kubectl apply --dry-run=client -f platform/crossplane/examples/
```

See `docs/migration-log.md` Phase 5+6+7 for recorded validation results.

---

## OPA Integration Hook (Phase 4)

The `policyLabels` field in every XRD is the integration surface for the OPA Gatekeeper admission controller. Phase 4 (Operability & Governance) will deploy a `ConstraintTemplate` that:
1. Intercepts all `szl.io/v1alpha1` resource creates/updates
2. Evaluates Rego policies in `/platform/policy/`
3. Populates `policyLabels` or denies admission if constraints are violated

Do not remove the `policyLabels` field from any XRD.

---

## Secret Source Modes

| Mode | Environment | How It Works |
|------|-------------|-------------|
| `key-vault` | prod, stage | Workload identity federates with Azure AD; app retrieves secrets from Key Vault using managed identity |
| `workload-identity` | prod, stage | Same as key-vault; emphasizes identity-first retrieval |
| `replit-secrets` | dev | Secrets injected as environment variables from Replit Secrets — never committed to repo |

**No secret values are written in any manifest in this directory.**
