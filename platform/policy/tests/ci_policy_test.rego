package szl.ci_test

# OPA unit tests for szl.ci
# Run: opa test platform/policy/ -v

import data.szl.ci
import future.keywords.if
import future.keywords.in
import future.keywords.contains

# ──────────────────────────────────────────────────────────────────────────────
# Test: PRs to valid branches are allowed (other checks satisfied)
# ──────────────────────────────────────────────────────────────────────────────
test_pr_to_main_allowed if {
    ci.allow with input as {
        "event_type": "pull_request",
        "target_branch": "main",
        "workflow_actions": [],
        "completed_checks": {"lint", "typecheck", "build", "secret-scan"},
        "audit_results": {"critical_count": 0, "high_count": 0, "moderate_count": 0},
        "approvals": [],
        "changed_files": [],
        "is_merge_commit": false,
    }
}

test_pr_to_release_branch_allowed if {
    ci.allow with input as {
        "event_type": "pull_request",
        "target_branch": "release/v2.0",
        "workflow_actions": [],
        "completed_checks": {"lint", "typecheck", "build", "secret-scan"},
        "audit_results": {"critical_count": 0, "high_count": 0, "moderate_count": 0},
        "approvals": [],
        "changed_files": [],
        "is_merge_commit": false,
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: PRs to feature branches are denied
# ──────────────────────────────────────────────────────────────────────────────
test_pr_to_feature_branch_denied if {
    deny := ci.deny with input as {
        "event_type": "pull_request",
        "target_branch": "feature/my-feature",
        "workflow_actions": [],
        "completed_checks": {"lint", "typecheck", "build", "secret-scan"},
        "audit_results": {"critical_count": 0, "high_count": 0, "moderate_count": 0},
        "approvals": [],
        "changed_files": [],
        "is_merge_commit": false,
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "feature/my-feature")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Unpinned actions are denied
# ──────────────────────────────────────────────────────────────────────────────
test_unpinned_action_denied if {
    deny := ci.deny with input as {
        "event_type": "pull_request",
        "target_branch": "main",
        "workflow_actions": [
            {"name": "actions/checkout@v4", "ref": "actions/checkout@v4"},
        ],
        "completed_checks": {"lint", "typecheck", "build", "secret-scan"},
        "audit_results": {"critical_count": 0, "high_count": 0, "moderate_count": 0},
        "approvals": [],
        "changed_files": [],
        "is_merge_commit": false,
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "not pinned to a full commit SHA")
}

test_sha_pinned_action_allowed if {
    deny := ci.deny with input as {
        "event_type": "pull_request",
        "target_branch": "main",
        "workflow_actions": [
            {"name": "actions/checkout", "ref": "actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683"},
        ],
        "completed_checks": {"lint", "typecheck", "build", "secret-scan"},
        "audit_results": {"critical_count": 0, "high_count": 0, "moderate_count": 0},
        "approvals": [],
        "changed_files": [],
        "is_merge_commit": false,
    }
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Critical vulnerabilities block merge
# ──────────────────────────────────────────────────────────────────────────────
test_critical_vulnerability_denied if {
    deny := ci.deny with input as {
        "event_type": "pull_request",
        "target_branch": "main",
        "workflow_actions": [],
        "completed_checks": {"lint", "typecheck", "build", "secret-scan"},
        "audit_results": {"critical_count": 2, "high_count": 0, "moderate_count": 0},
        "approvals": [],
        "changed_files": [],
        "is_merge_commit": false,
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "critical vulnerabilities")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Production deployment without approval is denied
# ──────────────────────────────────────────────────────────────────────────────
test_production_deployment_no_approval_denied if {
    deny := ci.deny with input as {
        "event_type": "deployment",
        "environment": "production",
        "approvals": [],
        "workflow_actions": [],
        "audit_results": {"critical_count": 0, "high_count": 0, "moderate_count": 0},
        "completed_checks": {"lint", "typecheck", "build", "secret-scan"},
        "target_branch": "main",
        "changed_files": [],
        "is_merge_commit": false,
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "Production deployments require")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Direct push to main is denied
# ──────────────────────────────────────────────────────────────────────────────
test_direct_push_to_main_denied if {
    deny := ci.deny with input as {
        "event_type": "push",
        "ref": "refs/heads/main",
        "is_merge_commit": false,
        "workflow_actions": [],
        "audit_results": {"critical_count": 0, "high_count": 0, "moderate_count": 0},
        "completed_checks": {"lint", "typecheck", "build", "secret-scan"},
        "target_branch": "main",
        "approvals": [],
        "changed_files": [],
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "Direct pushes to main/master")
}

test_merge_commit_push_allowed if {
    deny := ci.deny with input as {
        "event_type": "push",
        "ref": "refs/heads/main",
        "is_merge_commit": true,
        "workflow_actions": [],
        "audit_results": {"critical_count": 0, "high_count": 0, "moderate_count": 0},
        "completed_checks": {"lint", "typecheck", "build", "secret-scan"},
        "target_branch": "main",
        "approvals": [],
        "changed_files": [],
    }
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Missing required checks produce WARN not deny (Rule 4)
# Enforcement of required checks is delegated to GitHub branch protection.
# OPA warns only — it cannot reliably collect live check completion status.
# ──────────────────────────────────────────────────────────────────────────────
test_missing_required_checks_warns_not_denies if {
    deny := ci.deny with input as {
        "event_type": "pull_request",
        "target_branch": "main",
        "workflow_actions": [],
        "completed_checks": [],
        "audit_results": {"critical_count": 0, "high_count": 0, "moderate_count": 0},
        "approvals": [],
        "changed_files": [],
        "is_merge_commit": false,
    }
    # Missing checks do NOT produce deny messages (only warnings)
    not any_check_deny(deny)
}

any_check_deny(deny) if {
    some msg in deny
    contains(msg, "Required CI check")
}
