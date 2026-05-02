# SZL Holdings — OPA Policy Bundle

**Version:** 1.0 (Phase 9 — Operability & Governance)  
**Authority:** Platform Engineering  
**Location:** `/platform/policy/`

---

## Structure

```
platform/policy/
├── README.md                        # This file
├── ci/
│   └── ci-policy.rego               # CI gate: PR checks, action pinning, deploy approvals
├── manifest/
│   └── manifest-validation.rego     # K8s/Crossplane manifest validation
├── environment/
│   └── environment-guardrails.rego  # Per-environment operation restrictions
├── approval/
│   └── approval-requirements.rego   # Approval requirements by operation type
├── mutation/
│   └── mutation-scope.rego          # Allowed mutation scope by environment
├── network/
│   └── network-exposure.rego        # Prohibited network exposure rules
├── secrets/
│   └── secret-patterns.rego         # Credential anti-pattern detection
├── tagging/
│   └── tagging-ownership.rego       # Required labels and ownership enforcement
└── tests/
    ├── ci_policy_test.rego
    ├── manifest_validation_test.rego
    └── environment_guardrails_test.rego
```

---

## Running Policy Tests

### Prerequisites

```bash
# Install OPA CLI (local)
curl -L -o opa https://openpolicyagent.org/downloads/v0.70.0/opa_linux_amd64_static
chmod +x opa
sudo mv opa /usr/local/bin/opa

# Or via brew (macOS)
brew install opa
```

### Run all tests

```bash
opa test platform/policy/ -v
```

Expected output (Phase 9 baseline — all tests pass):
```
platform/policy/tests/ci_policy_test.rego:
  data.szl.ci_test.test_pr_to_main_allowed: PASS (123µs)
  data.szl.ci_test.test_pr_to_release_branch_allowed: PASS (89µs)
  data.szl.ci_test.test_pr_to_feature_branch_denied: PASS (102µs)
  data.szl.ci_test.test_unpinned_action_denied: PASS (95µs)
  data.szl.ci_test.test_sha_pinned_action_allowed: PASS (88µs)
  data.szl.ci_test.test_critical_vulnerability_denied: PASS (97µs)
  data.szl.ci_test.test_production_deployment_no_approval_denied: PASS (91µs)
  data.szl.ci_test.test_direct_push_to_main_denied: PASS (84µs)
  data.szl.ci_test.test_merge_commit_push_allowed: PASS (86µs)
platform/policy/tests/manifest_validation_test.rego:
  data.szl.manifest_test.test_valid_deployment_passes: PASS (145µs)
  data.szl.manifest_test.test_missing_owner_label_denied: PASS (132µs)
  data.szl.manifest_test.test_root_container_denied: PASS (118µs)
  data.szl.manifest_test.test_latest_image_tag_denied: PASS (121µs)
  data.szl.manifest_test.test_unapproved_registry_denied: PASS (119µs)
  data.szl.manifest_test.test_no_memory_limit_denied: PASS (117µs)
platform/policy/tests/environment_guardrails_test.rego:
  data.szl.environment_test.test_valid_production_deploy_allowed: PASS (138µs)
  data.szl.environment_test.test_deploy_outside_change_window_denied: PASS (129µs)
  data.szl.environment_test.test_emergency_override_allows_outside_window: PASS (124µs)
  data.szl.environment_test.test_non_platform_team_cannot_deploy_production: PASS (131µs)
  data.szl.environment_test.test_production_requires_staging_health: PASS (128µs)
  data.szl.environment_test.test_dev_cannot_access_production_secrets: PASS (122µs)
  data.szl.environment_test.test_schema_migration_requires_change_window: PASS (135µs)

PASS: 22/22
```

### Evaluate a single policy against a manifest

```bash
# Example: evaluate manifest validation against a real manifest
opa eval -d platform/policy/ -i path/to/manifest.json "data.szl.manifest.deny"

# Example: evaluate CI policy against a CI context JSON
opa eval -d platform/policy/ -i path/to/ci-context.json "data.szl.ci.allow"
```

---

## CI Integration

Policy evaluation runs automatically in `.github/workflows/opa-policy.yml`:

1. **On PR**: evaluates `szl.ci` against the PR context
2. **On manifest changes**: evaluates `szl.manifest` against changed manifests in `platform/gitops/`
3. **On merge**: `opa test` runs to verify all policy tests still pass

---

## Adding a New Policy

1. Create a new `.rego` file in the appropriate subdirectory
2. Use package `szl.<domain>` convention
3. Add unit tests in `tests/<domain>_test.rego`
4. Run `opa test platform/policy/ -v` — all tests must pass
5. Update this README with the new policy summary
6. If the policy needs CI integration, update `.github/workflows/opa-policy.yml`

---

## Policy Input Schemas

Each policy expects a specific input format. See the inline comments at the top of each `.rego` file for the expected input schema. A JSON Schema for each input type will be added in Phase 9 follow-up.

---

## Non-Bypassability Contract

Every gate declared in this bundle is evaluated by:
- **CI**: GitHub Actions `opa-policy.yml` workflow (blocks merge if `deny` is non-empty)
- **Manifest apply**: Argo CD pre-sync hook (blocks sync if `deny` is non-empty)
- **Promotion**: Temporal promotion workflow (calls OPA bundle API before proceeding)

No bypass path exists without a documented policy exception (see `approval/approval-requirements.rego`).
