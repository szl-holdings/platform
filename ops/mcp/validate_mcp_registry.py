"""MCP registry validator for Alloy Meridian.

Validates ``ops/mcp/mcp_registry.json`` against the substrate rules:
  - Every server entry has required fields (id, display_name, signed, capabilities)
  - Every server is signed (``signed == true``)
  - Every capability ID is globally unique (no duplicates across servers)
  - No orphan capabilities referenced in vertical pack modules that are absent
    from the registry (checked via the vertical registry)
  - Governance policy has ``read_first_enforced`` set

Usage (via pnpm):
    pnpm run mcp:validate

Exits 0 on success, non-zero on any failure.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Iterable

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = REPO_ROOT / "ops" / "mcp" / "mcp_registry.json"

SERVER_REQUIRED_FIELDS = ("id", "display_name", "signed", "activation_order", "capabilities")
CAPABILITY_REQUIRED_FIELDS = ("id", "kind")
VALID_KINDS = {"read", "write", "admin"}


def load_registry(path: Path = REGISTRY_PATH) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"MCP registry not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def validate_registry(registry: dict) -> list[str]:
    """Return a list of error strings. Empty list = valid."""
    errors: list[str] = []

    if "servers" not in registry or not isinstance(registry["servers"], list):
        errors.append("registry missing 'servers' list")
        return errors

    if not registry["servers"]:
        errors.append("registry has no servers")

    governance = registry.get("governance_policy", {})
    if not governance.get("read_first_enforced"):
        errors.append("governance_policy.read_first_enforced must be true")

    seen_server_ids: set[str] = set()
    seen_capability_ids: set[str] = set()
    activation_orders: list[int] = []

    for server in registry["servers"]:
        for field in SERVER_REQUIRED_FIELDS:
            if field not in server:
                errors.append(f"server missing required field '{field}': {server.get('id', '?')}")

        server_id = server.get("id", "?")

        if server_id in seen_server_ids:
            errors.append(f"duplicate server id: {server_id}")
        seen_server_ids.add(server_id)

        if not server.get("signed"):
            errors.append(f"server '{server_id}' is not signed (signed must be true)")

        activation = server.get("activation_order")
        if not isinstance(activation, int) or activation < 1:
            errors.append(f"server '{server_id}' has invalid activation_order: {activation!r}")
        else:
            activation_orders.append(activation)

        capabilities = server.get("capabilities", [])
        if not isinstance(capabilities, list) or not capabilities:
            errors.append(f"server '{server_id}' has no capabilities")
            continue

        for cap in capabilities:
            for cf in CAPABILITY_REQUIRED_FIELDS:
                if cf not in cap:
                    errors.append(f"capability in '{server_id}' missing field '{cf}': {cap}")

            cap_id = cap.get("id", "?")
            if cap_id in seen_capability_ids:
                errors.append(f"duplicate capability id: {cap_id}")
            seen_capability_ids.add(cap_id)

            kind = cap.get("kind")
            if kind not in VALID_KINDS:
                errors.append(f"capability '{cap_id}' has invalid kind '{kind}' (must be one of {VALID_KINDS})")

            if kind == "write" and not cap.get("requires_approval"):
                errors.append(
                    f"write capability '{cap_id}' must have requires_approval=true "
                    "(governance policy: write_requires_approval)"
                )

    if activation_orders:
        activation_orders.sort()
        expected = list(range(1, len(activation_orders) + 1))
        if activation_orders != expected:
            errors.append(
                f"activation_order values must be contiguous from 1 to N; "
                f"got {activation_orders}, expected {expected}"
            )

    return errors


def check_orphan_capabilities(
    registry: dict,
    declared_cap_ids: Iterable[str],
) -> list[str]:
    """Return errors for any declared capability IDs absent from *registry*.

    Parameters
    ----------
    registry:
        Parsed MCP registry dict (as returned by :func:`load_registry`).
    declared_cap_ids:
        All capability IDs declared by vertical packs (from VerticalSpec.mcp_capabilities).
    """
    known: set[str] = {
        cap.get("id", "")
        for server in registry.get("servers", [])
        for cap in server.get("capabilities", [])
    }
    errors: list[str] = []
    for cap_id in declared_cap_ids:
        if cap_id not in known:
            errors.append(
                f"orphan capability '{cap_id}' referenced by a vertical pack "
                "but not present in the MCP registry"
            )
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--registry",
        default=str(REGISTRY_PATH),
        help="Path to the MCP registry JSON file",
    )
    args = parser.parse_args(argv)

    registry_path = Path(args.registry)

    try:
        registry = load_registry(registry_path)
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        print(f"[mcp:validate] FAIL: {exc}")
        return 1

    errors = validate_registry(registry)

    try:
        from services.verticals import registry as vert_registry  # type: ignore[import]
        declared_caps: list[str] = [
            cap_id
            for spec in vert_registry.REGISTRY
            for cap_id in spec.mcp_capabilities
        ]
        orphan_errors = check_orphan_capabilities(registry, declared_caps)
        errors.extend(orphan_errors)
    except ImportError:
        pass

    server_count = len(registry.get("servers", []))
    cap_count = sum(len(s.get("capabilities", [])) for s in registry.get("servers", []))

    if errors:
        print(f"[mcp:validate] FAIL — {len(errors)} error(s) in MCP registry:")
        for err in errors:
            print(f"  - {err}")
        return 1

    print(f"[mcp:validate] OK — {server_count} servers, {cap_count} capabilities, all valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
