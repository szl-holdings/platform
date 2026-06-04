"""Unit tests for the MCP registry validator."""

from __future__ import annotations

import copy
import unittest

from ops.mcp.validate_mcp_registry import validate_registry

VALID_REGISTRY = {
    "governance_policy": {
        "read_first_enforced": True,
        "write_requires_approval": True,
        "unknown_server_denied": True,
    },
    "servers": [
        {
            "id": "github",
            "display_name": "GitHub",
            "signed": True,
            "activation_order": 1,
            "capabilities": [
                {"id": "github.list_prs", "kind": "read", "description": "List PRs"},
                {"id": "github.create_issue", "kind": "write", "requires_approval": True},
            ],
        },
        {
            "id": "slack",
            "display_name": "Slack",
            "signed": True,
            "activation_order": 2,
            "capabilities": [
                {"id": "slack.post_message", "kind": "write", "requires_approval": True},
            ],
        },
    ],
}


class TestMcpRegistryValidator(unittest.TestCase):
    def test_valid_registry_passes(self) -> None:
        errors = validate_registry(copy.deepcopy(VALID_REGISTRY))
        self.assertEqual(errors, [])

    def test_missing_servers_key_fails(self) -> None:
        bad = {"governance_policy": {"read_first_enforced": True}}
        errors = validate_registry(bad)
        self.assertTrue(any("servers" in e for e in errors))

    def test_empty_servers_fails(self) -> None:
        bad = {**copy.deepcopy(VALID_REGISTRY), "servers": []}
        errors = validate_registry(bad)
        self.assertTrue(any("no servers" in e for e in errors))

    def test_unsigned_server_fails(self) -> None:
        bad = copy.deepcopy(VALID_REGISTRY)
        bad["servers"][0]["signed"] = False
        errors = validate_registry(bad)
        self.assertTrue(any("not signed" in e for e in errors))

    def test_duplicate_server_id_fails(self) -> None:
        bad = copy.deepcopy(VALID_REGISTRY)
        bad["servers"].append({**bad["servers"][0], "activation_order": 3})
        errors = validate_registry(bad)
        self.assertTrue(any("duplicate server id" in e for e in errors))

    def test_duplicate_capability_id_fails(self) -> None:
        bad = copy.deepcopy(VALID_REGISTRY)
        bad["servers"][1]["capabilities"].append({"id": "github.list_prs", "kind": "read"})
        errors = validate_registry(bad)
        self.assertTrue(any("duplicate capability id" in e for e in errors))

    def test_write_without_requires_approval_fails(self) -> None:
        bad = copy.deepcopy(VALID_REGISTRY)
        bad["servers"][0]["capabilities"].append({
            "id": "github.new_write_cap",
            "kind": "write",
        })
        errors = validate_registry(bad)
        self.assertTrue(any("requires_approval" in e for e in errors))

    def test_non_contiguous_activation_order_fails(self) -> None:
        bad = copy.deepcopy(VALID_REGISTRY)
        bad["servers"][1]["activation_order"] = 99
        errors = validate_registry(bad)
        self.assertTrue(any("contiguous" in e for e in errors))

    def test_read_first_not_enforced_fails(self) -> None:
        bad = copy.deepcopy(VALID_REGISTRY)
        bad["governance_policy"]["read_first_enforced"] = False
        errors = validate_registry(bad)
        self.assertTrue(any("read_first_enforced" in e for e in errors))

    def test_orphan_capability_detected(self) -> None:
        from ops.mcp.validate_mcp_registry import check_orphan_capabilities
        registry = copy.deepcopy(VALID_REGISTRY)
        declared = ["github.list_prs", "posthog.query_events"]
        errors = check_orphan_capabilities(registry, declared)
        self.assertTrue(
            any("posthog.query_events" in e for e in errors),
            f"Expected orphan error for posthog.query_events, got: {errors}",
        )
        self.assertFalse(
            any("github.list_prs" in e for e in errors),
            "github.list_prs is known and should not be flagged as orphan",
        )

    def test_no_orphan_for_known_capabilities(self) -> None:
        from ops.mcp.validate_mcp_registry import check_orphan_capabilities
        registry = copy.deepcopy(VALID_REGISTRY)
        declared = ["github.list_prs", "slack.post_message"]
        errors = check_orphan_capabilities(registry, declared)
        self.assertEqual(errors, [])

    def test_real_registry_file_is_valid(self) -> None:
        from ops.mcp.validate_mcp_registry import load_registry, REGISTRY_PATH
        if REGISTRY_PATH.exists():
            registry = load_registry(REGISTRY_PATH)
            errors = validate_registry(registry)
            self.assertEqual(errors, [], f"Real registry errors: {errors}")


if __name__ == "__main__":
    unittest.main()
