package szl.secrets_test

# OPA unit tests for szl.secrets
# Run: opa test platform/policy/ -v

import data.szl.secrets
import future.keywords.if
import future.keywords.in
import future.keywords.contains

# ──────────────────────────────────────────────────────────────────────────────
# Test: Kubernetes Secret with stringData is denied
# ──────────────────────────────────────────────────────────────────────────────
test_secret_with_stringdata_denied if {
    deny := secrets.deny with input as {
        "kind": "Secret",
        "type": "Opaque",
        "metadata": {"name": "my-secret"},
        "stringData": {"API_KEY": "some-value"},
        "data": {},
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "stringData")
}

test_secret_with_base64_data_allowed if {
    deny := secrets.deny with input as {
        "kind": "Secret",
        "type": "Opaque",
        "metadata": {"name": "my-secret"},
        "data": {"API_KEY": "c29tZS12YWx1ZQ=="},
    }
    not any_stringdata_deny(deny)
}

any_stringdata_deny(deny) if {
    some msg in deny
    contains(msg, "stringData")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: ConfigMap with credential key names is denied
# ──────────────────────────────────────────────────────────────────────────────
test_configmap_with_password_key_denied if {
    deny := secrets.deny with input as {
        "kind": "ConfigMap",
        "metadata": {"name": "app-config"},
        "data": {"database_password": "should-be-in-secret"},
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "looks like a credential")
}

test_configmap_with_non_credential_key_allowed if {
    deny := secrets.deny with input as {
        "kind": "ConfigMap",
        "metadata": {"name": "app-config"},
        "data": {"LOG_LEVEL": "info", "PORT": "8080"},
    }
    not any_credential_deny(deny)
}

any_credential_deny(deny) if {
    some msg in deny
    contains(msg, "looks like a credential")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Deployment with literal credential env var is denied
# ──────────────────────────────────────────────────────────────────────────────
test_deployment_literal_credential_env_denied if {
    deny := secrets.deny with input as {
        "kind": "Deployment",
        "metadata": {"name": "api-server"},
        "spec": {
            "template": {
                "spec": {
                    "containers": [{
                        "name": "api",
                        "env": [{"name": "DATABASE_PASSWORD", "value": "my-secret-password"}],
                    }],
                },
            },
        },
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "secretKeyRef")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: ExternalSecret with unapproved secret store is denied
# ──────────────────────────────────────────────────────────────────────────────
test_external_secret_unapproved_store_denied if {
    deny := secrets.deny with input as {
        "kind": "ExternalSecret",
        "metadata": {"name": "my-external-secret"},
        "spec": {
            "secretStoreRef": {"name": "unofficial-vault"},
        },
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "not on the approved list")
}

test_external_secret_approved_store_allowed if {
    deny := secrets.deny with input as {
        "kind": "ExternalSecret",
        "metadata": {"name": "my-external-secret"},
        "spec": {
            "secretStoreRef": {"name": "azure-keyvault-production"},
        },
    }
    not any_store_deny(deny)
}

any_store_deny(deny) if {
    some msg in deny
    contains(msg, "not on the approved list")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Placeholder value in staging env var is denied
# ──────────────────────────────────────────────────────────────────────────────
test_placeholder_in_staging_denied if {
    deny := secrets.deny with input as {
        "kind": "Deployment",
        "environment": "staging",
        "metadata": {"name": "api-server"},
        "env_vars": [{"name": "API_KEY", "value": "changeme"}],
        "spec": {"template": {"spec": {"containers": []}}},
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "placeholder")
}
