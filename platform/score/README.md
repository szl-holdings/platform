# SZL Holdings — Score Workload Abstraction

## What Is Score?

Score is a workload-specification format that lets developers declare **what** their service needs without specifying **how** it will be deployed. Platform engineering translates Score specs into deployment targets (Azure Container Apps, Docker Compose, Kubernetes) via resolver patterns.

## Developer Boundary vs. Platform Boundary

| Responsibility | Developer | Platform Team |
|---------------|-----------|---------------|
| `score.yaml` | ✅ Authors and maintains | ❌ Do not modify |
| Resource type declarations | ✅ Declares intent (`type: postgres`) | ❌ Do not pick specific instances |
| Secret references | ✅ Names the secret ref (`${MY_SECRET}`) | ❌ Does not know secret values |
| Workload sizing (requests/limits) | ✅ Suggests defaults | ✅ May override per environment |
| Resolver patterns | ❌ Do not edit `/platform/score/patterns/` | ✅ Owns all resolver patterns |
| Deployment targets | ❌ Do not specify ACR tags, AKS namespaces | ✅ Resolves target from domain + lifecycle |
| Observability defaults | ❌ Inherits from platform defaults | ✅ Injects OTel collector, log forwarding |
| Policy labels | ❌ Must not remove labels | ✅ May add additional labels |

## Usage

1. Copy the appropriate example from `examples/` into your service directory as `score.yaml`.
2. Customize the container variables and resource declarations.
3. Do not modify the `# Platform annotations` block — the platform team resolver writes these.
4. CI will validate `score.yaml` structure on every PR.

## Validation Command

```bash
# Dry-run validation (does not deploy)
pnpm score:validate
# Or directly with humctl (if installed):
humctl score validate score.yaml
```

## Directory Structure

```
platform/score/
├── README.md               ← this file
├── examples/
│   ├── api-service.yaml    ← REST API service workload
│   ├── agent-worker.yaml   ← Async AI agent worker
│   ├── event-consumer.yaml ← Event-driven consumer
│   └── internal-ui.yaml    ← Internal SPA/website
└── patterns/
    ├── resolver-patterns.md           ← Decision record: input → deployment target mapping
    ├── deployment-targets.yaml        ← Mapping of lifecycle × domain → Azure target
    ├── resource-bindings.yaml         ← Resource type → Azure service binding
    ├── observability-defaults.yaml    ← OTel collector injection rules
    └── policy-labels.yaml             ← Mandatory policy label matrix
```
