package szl.secrets

# SZL Holdings — Prohibited Secret Patterns Policy
# Scans proposed config, manifests, and code changes for credential anti-patterns.
# Input: file contents or config values for scanning
#
# Works alongside gitleaks (CI). This policy focuses on structural anti-patterns
# in manifests and configs that gitleaks may not catch (e.g. base64-encoded values,
# env var injection patterns, hardcoded placeholder values that look like real secrets).

import future.keywords.in
import future.keywords.if
import future.keywords.contains

default allow := false

allow if {
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 1: Kubernetes Secrets must not use plaintext string values
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.kind == "Secret"
    input.type != "kubernetes.io/service-account-token"
    key := input.stringData[_]  # stringData = plaintext; data = base64
    msg := "Kubernetes Secret uses 'stringData' (plaintext). Store base64-encoded values in 'data' and prefer External Secrets Operator for production secrets."
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 2: ConfigMaps must not contain key names that suggest credentials
# ──────────────────────────────────────────────────────────────────────────────
credential_key_patterns := {
    "password", "passwd", "secret", "api_key", "apikey",
    "token", "private_key", "credential", "auth_token",
    "access_key", "connection_string",
}

deny contains msg if {
    input.kind == "ConfigMap"
    key := input.data[k]
    lower_key := lower(k)
    pattern := credential_key_patterns[_]
    contains(lower_key, pattern)
    msg := sprintf("ConfigMap '%v' has key '%v' which looks like a credential. Use a Secret instead of a ConfigMap for sensitive values.", [input.metadata.name, k])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 3: Environment variables in Deployments must not embed literal secrets
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.kind in {"Deployment", "StatefulSet", "Job", "CronJob"}
    container := input.spec.template.spec.containers[_]
    env_var := container.env[_]
    env_var.value  # has a direct value (not from secretKeyRef/configMapKeyRef)
    credential_env_name(env_var.name)
    msg := sprintf("Container '%v' has env var '%v' with a literal value. Use secretKeyRef to source from a Kubernetes Secret.", [container.name, env_var.name])
}

credential_env_name(name) if {
    pattern := credential_key_patterns[_]
    contains(lower(name), pattern)
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 4: Values that look like real secrets are blocked
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.kind in {"Deployment", "StatefulSet", "Job", "CronJob"}
    container := input.spec.template.spec.containers[_]
    env_var := container.env[_]
    value := env_var.value
    looks_like_secret(value)
    msg := sprintf("Env var '%v' in container '%v' has a value that looks like a real secret. Secrets must never be hardcoded in manifests.", [env_var.name, container.name])
}

# Heuristic: high-entropy strings of sufficient length, or known patterns
looks_like_secret(value) if {
    count(value) >= 32
    regex.match("^[A-Za-z0-9+/=_-]{32,}$", value)
}

looks_like_secret(value) if {
    regex.match("^sk-[A-Za-z0-9]{20,}$", value)  # OpenAI-style key
}

looks_like_secret(value) if {
    regex.match("^ghp_[A-Za-z0-9]{36}$", value)  # GitHub PAT
}

looks_like_secret(value) if {
    regex.match("^xoxb-[0-9]+-[A-Za-z0-9]+$", value)  # Slack bot token
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 5: External Secrets Operator references must point to approved vaults
# ──────────────────────────────────────────────────────────────────────────────
approved_secret_stores := {
    "azure-keyvault-production",
    "azure-keyvault-staging",
    "azure-keyvault-dev",
}

deny contains msg if {
    input.kind in {"ExternalSecret", "ClusterExternalSecret"}
    not input.spec.secretStoreRef.name in approved_secret_stores
    msg := sprintf("ExternalSecret '%v' references secret store '%v' which is not on the approved list: %v", [input.metadata.name, input.spec.secretStoreRef.name, approved_secret_stores])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 6: Placeholder secrets must not make it past dev
# ──────────────────────────────────────────────────────────────────────────────
placeholder_patterns := {"placeholder", "changeme", "todo", "fixme", "replace-me", "your-secret-here"}

deny contains msg if {
    input.environment in {"staging", "production"}
    env_var := input.env_vars[_]
    pattern := placeholder_patterns[_]
    contains(lower(env_var.value), pattern)
    msg := sprintf("Env var '%v' has a placeholder value '%v' which must not reach %v.", [env_var.name, env_var.value, input.environment])
}
