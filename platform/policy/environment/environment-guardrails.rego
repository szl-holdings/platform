package szl.environment

# SZL Holdings — Environment Guardrails Policy
# Controls which operations are permitted in which environments.
# Input: operation context (service, environment, operation type, requestor)

import future.keywords.in
import future.keywords.if
import future.keywords.contains

default allow := false

allow if {
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 1: Schema migrations require change window approval in staging/production
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.operation_type == "database-schema-migration"
    input.environment in {"staging", "production"}
    not input.change_window_approved
    msg := sprintf("Database schema migration in %v requires an approved change window. Request a change window via the approval workflow.", [input.environment])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 2: Production environment restricts who can deploy
# ──────────────────────────────────────────────────────────────────────────────
production_deployers := {"platform-team", "release-managers", "policy-approvers"}

deny contains msg if {
    input.environment == "production"
    input.operation_type in {"deploy", "rollback"}
    not any_group_allowed(input.requestor_groups, production_deployers)
    msg := sprintf("Production deployments require membership in: %v. Requestor groups: %v", [production_deployers, input.requestor_groups])
}

any_group_allowed(requestor_groups, allowed_groups) if {
    g := requestor_groups[_]
    g in allowed_groups
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 3: No service can be deployed to production without first passing staging
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.environment == "production"
    input.operation_type == "deploy"
    not input.staging_health_verified
    msg := "Production deployment requires staging health verification. Staging must have been healthy for at least 10 minutes after the same version was deployed."
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 4: Enforce change windows for production changes
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.environment == "production"
    input.operation_type in {"deploy", "rollback", "database-schema-migration", "config-change"}
    not input.in_change_window
    not input.emergency_override_approved
    msg := "Production changes must occur within an approved change window. Outside change window hours, use the emergency override approval workflow."
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 5: Development environment cannot access production secrets
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.environment == "development"
    input.secret_scope == "production"
    msg := "Development environment cannot access production-scoped secrets. Use development-scoped secrets from the dev Key Vault."
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 6: No manual database writes in production without break-glass approval
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.environment == "production"
    input.operation_type == "database-write"
    not input.break_glass_approved
    msg := "Direct database writes in production require break-glass approval. Use the break-glass workflow to obtain temporary elevated access."
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 7: Container images must be from the production ACR in production
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.environment == "production"
    input.operation_type == "deploy"
    not startswith(input.image_registry, "szlholdingsacr.azurecr.io")
    msg := sprintf("Production deployments must use images from szlholdingsacr.azurecr.io. Got: %v", [input.image_registry])
}
