package szl.approval

# Agent Gateway decision contract.
#
# The gateway queries /v1/data/szl/approval/decision and requires exactly:
#   allowed             boolean
#   required_approvals  integer
#   required_groups     unique non-empty string array
#   deny                unique non-empty string array
#
# Human approval requirements are returned separately from `allowed`.
# `allowed=false` means the policy input itself is invalid or outside this
# bundle's closed operation/environment contract; the gateway must fail closed.

valid_operation_types := {
  "agent_inspect_code",
  "agent_inspect_manifests",
  "agent_analyze_telemetry",
  "agent_summarize_incidents",
  "agent_draft_runbooks",
  "agent_draft_prs",
  "agent_propose_policy_fixes",
  "agent_generate_documentation",
  "agent_generate_test_plans",
  "agent_propose_architecture_diffs",
}

mutating_operation_types := {
  "agent_draft_prs",
  "agent_propose_policy_fixes",
  "agent_propose_architecture_diffs",
}

valid_environments := {"development", "staging", "production"}
trusted_actor_roles := {"platform-engineer", "operator"}
valid_actor_roles := {"platform-engineer", "operator", "agent-service", "ai-model"}

valid_operation {
  is_string(input.operation_type)
  valid_operation_types[input.operation_type]
}

valid_environment {
  is_string(input.environment)
  valid_environments[input.environment]
}

operation_matches_capability {
  is_string(input.capability)
  input.operation_type == sprintf("agent_%s", [input.capability])
}

valid_tier {
  input.tier == "tier-1"
}

valid_actor_role {
  is_string(input.actor_role)
  valid_actor_roles[input.actor_role]
}

trusted_actor {
  trusted_actor_roles[input.actor_role]
}

nonempty_string(value) {
  is_string(value)
  value != ""
}

invalid_reasons[reason] {
  not is_object(input)
  reason := "OPA input must be an object."
}

invalid_reasons[reason] {
  not valid_operation
  reason := "operation_type is missing or not in the closed agent operation allow-list."
}

invalid_reasons[reason] {
  not valid_environment
  reason := "environment must be development, staging, or production."
}

invalid_reasons[reason] {
  not operation_matches_capability
  reason := "operation_type must match the supplied agent capability."
}

invalid_reasons[reason] {
  not valid_actor_role
  reason := "actor_role is missing or not recognized."
}

invalid_reasons[reason] {
  not nonempty_string(input.org_id)
  reason := "org_id must be a non-empty tenant binding."
}

invalid_reasons[reason] {
  not is_array(input.actor_groups)
  reason := "actor_groups must be an array."
}

invalid_reasons[reason] {
  not nonempty_string(input.capability)
  reason := "capability must be a non-empty string."
}

invalid_reasons[reason] {
  not nonempty_string(input.domain)
  reason := "domain must be a non-empty string."
}

invalid_reasons[reason] {
  not valid_tier
  reason := "tier must be tier-1."
}

invalid_reasons[reason] {
  not is_array(input.approvals)
  reason := "approvals must be an array."
}

invalid_reasons[reason] {
  not is_number(input.pending_minutes)
  reason := "pending_minutes must be numeric."
}

invalid_reasons[reason] {
  is_number(input.pending_minutes)
  input.pending_minutes < 0
  reason := "pending_minutes must not be negative."
}

allowed := count(invalid_reasons) == 0

required_groups = ["platform-team", "release-managers"] {
  allowed
  input.environment == "production"
} else = ["platform-team"] {
  allowed
  not trusted_actor
} else = ["platform-team"] {
  allowed
  input.environment == "staging"
  mutating_operation_types[input.operation_type]
} else = []

required_approvals = 1 {
  count(required_groups) > 0
}

required_approvals = 0 {
  count(required_groups) == 0
}

deny := [reason | invalid_reasons[reason]]

decision := {
  "allowed": allowed,
  "required_approvals": required_approvals,
  "required_groups": required_groups,
  "deny": deny,
}
