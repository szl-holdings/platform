# SZL Holdings — Argo CD GitOps Delivery Plane

**Plane:** 3 — Resource (Delivery layer)  
**Phase:** 5 (Resource & Delivery)  
**Owner:** platform-team  
**Status:** Manifests ready — live application pending human approval (Operability + Governance task)

---

## Overview

This directory contains the complete Argo CD app-of-apps configuration for SZL Holdings. A single bootstrap Application manages all downstream Applications and AppProjects. No further hand-crafted Kubernetes applies are required after the initial bootstrap.

```
bootstrap/
├── app-of-apps.yaml       ← Root Application — apply once manually
└── appprojects.yaml       ← 8 AppProjects (7 domains + platform)

shared-services/
└── crossplane.yaml        ← Crossplane installation + SZL composites

apps/
├── dev/
│   ├── platform-substrate.yaml   ← api-server, alloy apps (dev)
│   └── domain-packs.yaml         ← vessels, terra, counsel, carlota, sentra, lyte (dev)
├── stage/
│   ├── platform-substrate.yaml   ← api-server, alloy apps (stage)
│   └── domain-packs.yaml         ← domain packs (stage)
└── prod/
    ├── platform-substrate.yaml   ← api-server, alloy apps (prod)
    └── domain-packs.yaml         ← domain packs (prod)
```

---

## Initial Bootstrap

```bash
# Prerequisites:
# 1. Argo CD installed on the target cluster (argocd namespace exists)
# 2. GitHub repository access configured in Argo CD
# 3. Cluster secret for the target cluster registered in Argo CD

# Step 1: Apply the root app-of-apps (once only — Argo CD self-manages from this point)
kubectl apply -n argocd -f platform/gitops/bootstrap/app-of-apps.yaml

# Step 2: Watch the bootstrap cascade
argocd app wait szl-bootstrap --health --sync --timeout 300

# Step 3: Verify all AppProjects are created
argocd proj list

# Step 4: Verify shared services sync
argocd app get crossplane-system
```

---

## Promotion Convention: Dev → Stage → Prod

### dev (continuous delivery)

Every commit that lands on `main` and passes CI (lint + typecheck + build + security scan) is automatically synced to `dev`. No manual action required.

**Required before a commit reaches dev:**
- All Turbo build tasks pass (CI)
- Biome lint passes
- Secret scan passes
- Brand string audit passes

**Dev namespace pattern:** `szl-{domain}-dev`

---

### stage (gated delivery)

Stage sync is triggered by the platform-team after confirming dev is healthy. Automated sync is enabled on stage Applications but with `prune: false` to prevent unintentional resource deletion.

**Required before syncing stage:**
1. All dev Applications show `Synced` + `Healthy` for ≥ 10 minutes
2. No `CRITICAL` or `HIGH` severity open issues in Lyte Command Center (dev dashboard)
3. Platform-team LGTM on the feature PR (or automated signal — Phase 4 Temporal workflow)

**Trigger stage sync (after gates pass):**
```bash
# Sync a specific domain to stage
argocd app sync vessels-stage

# Sync all stage apps for a domain family
argocd app sync -l szl.io/environment=stage,szl.io/domain=vessels

# Sync all stage apps (platform-team only)
argocd app sync -l szl.io/environment=stage
```

**Stage namespace pattern:** `szl-{domain}-stage`

---

### prod (manual approval)

Prod Applications have `automated: {}` (empty — no automated sync). A sync must be triggered explicitly by a platform-team lead after all gates pass.

**Required before syncing prod:**
1. Stage Applications show `Synced` + `Healthy` for ≥ 30 minutes
2. Zero error-rate anomaly on Lyte Command Center dashboard (stage view) for the preceding hour
3. No active incidents or open P1 issues in the platform
4. Platform-team lead has explicitly approved the promotion (manual or via Temporal approval workflow — Phase 4)
5. OPA promotion gate policy passes (Phase 4 — gate is declared; Rego policy comes in Phase 4)

**Trigger prod sync (after all gates pass):**
```bash
# Sync a single application to prod (preferred — one at a time)
argocd app sync api-server-prod

# Verify sync and health
argocd app wait api-server-prod --health --sync --timeout 600

# If a domain pack needs to follow (after api-server is healthy):
argocd app sync vessels-prod
argocd app wait vessels-prod --health --sync --timeout 300
```

**Prod namespace pattern:** `szl-{domain}-prod`

**Evidence required:** Before the prod sync command is run, the engineer must record in the Temporal workflow (Phase 4) or in a PR comment:
- Which Applications are being promoted
- Current image digest(s) being deployed
- Lyte dashboard screenshot showing zero anomalies
- Gate check completion time

---

## Rollback Notes

### Dev rollback

Dev auto-syncs on every main commit. Rollback means reverting the Git commit.

```bash
# Revert the bad commit in Git (creates a new revert commit)
git revert <commit-sha>
git push origin main
# Argo CD will auto-sync the revert within ~3 minutes

# Expected outcome: dev Applications return to Synced+Healthy within 5 minutes of the revert merging
```

### Stage rollback

Stage Applications can be rolled back to any previously synced revision.

```bash
# Find the previous revision history
argocd app history vessels-stage

# Roll back to a specific revision
argocd app rollback vessels-stage <revision-id>

# Verify health after rollback
argocd app wait vessels-stage --health --timeout 300

# Expected outcome: Application returns to the previous Synced+Healthy state within 5 minutes
```

### Prod rollback

Prod rollback is the same mechanism as stage but requires the same approval gate as a forward deployment.

```bash
# Find the previous healthy revision
argocd app history api-server-prod

# Roll back (manual — do NOT use automated sync for rollback in prod)
argocd app rollback api-server-prod <revision-id>

# Verify health
argocd app wait api-server-prod --health --timeout 600

# Expected outcome: Application returns to the previous prod state within 10 minutes
# Post-rollback: create an incident report in the proof chain (lib/proof-chain) — mandatory
```

### Prod emergency rollback (complete domain)

If a domain pack causes a cascading failure:

```bash
# Suspend automated sync while you investigate (precaution)
argocd app set vessels-prod --sync-policy none

# Roll back all prod apps for the domain
argocd app rollback vessels-prod <revision-id>
argocd app rollback api-server-prod <revision-id>   # only if api-server was involved

# Verify the namespace is clean
kubectl get all -n szl-vessels-prod

# Once confirmed healthy, re-enable sync policy (manual, not automated)
# Do NOT re-enable automated sync in prod
argocd app set vessels-prod --sync-policy manual

# Expected outcome: Service restored within 15 minutes of rollback command
# Mandatory post-action: Platform incident report + proof-chain emit
```

---

## Source Separation Note

All Applications in this tree use a single source (`repoURL: https://github.com/szl-holdings/monorepo`). Per-domain environment-specific config (e.g., replica counts, resource limits, feature flags) lives under `platform/gitops/apps/{env}/manifests/{domain}/`. This keeps product source code separate from environment configuration, enabling environment promotion without re-building the image.

Multiple sources are used only in `shared-services/crossplane.yaml` (Helm chart from upstream + SZL config from monorepo). No other Application uses multiple sources — this would complicate diff/rollback reasoning.

---

## RBAC Summary

| Role | Scope | Who |
|------|-------|-----|
| `platform-admin` | `szl-platform` project — all ops | `platform-team` |
| `platform-readonly` | All projects — get only | `szl-engineers` |
| `{domain}-admin` | `szl-{domain}` project — sync + get | `domain-{name}` team |
| `{domain}-readonly` | `szl-{domain}` project — get only | `szl-engineers` |

No team may sync prod Applications except `platform-team` (enforced by AppProject RBAC and manual-approval gate).

---

## OPA + Temporal Integration Hooks (Phase 4)

The following integration points are declared now; Rego policies and Temporal workflows come in the Operability + Governance task:

| Hook | Location | Current State | Phase 4 Action |
|------|----------|--------------|---------------|
| Prod promotion gate | `szl.io/opa-gate: pending-phase-4` annotation | Declared | Deploy `ConstraintTemplate` in `/platform/policy/` |
| Approval workflow | `szl.io/temporal-hook: pending-phase-4` annotation | Declared | Wire Temporal workflow that updates Argo CD sync window |
| Observability gate | Lyte dashboard manual check | Manual | Automate via Lyte metrics API alert webhook |
