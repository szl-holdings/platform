#!/usr/bin/env python3
"""Regression guard for the legacy required-context compatibility workflow.

The solo-builder repository no longer enforces contributor DCO trailers. Classic
branch protection still expects the historical job display name, so the
compatibility workflow must satisfy that one status with a read-only,
no-checkout validation of immutable GitHub event identity for pull requests and
merge-queue commits.
"""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github" / "workflows" / "dco.yml"


def require(fragment: str, source: str, description: str) -> None:
    if fragment not in source:
        raise SystemExit(
            f"legacy-context workflow regression: missing {description}: {fragment!r}"
        )


def forbid(fragment: str, source: str, description: str) -> None:
    if fragment in source:
        raise SystemExit(
            f"legacy-context workflow regression: forbidden {description}: {fragment!r}"
        )


def main() -> int:
    source = WORKFLOW.read_text(encoding="utf-8")

    require("name: Legacy required-context compatibility", source, "workflow identity")
    require("pull_request:", source, "pull-request event")
    require("merge_group:", source, "merge-queue event")
    require("contents: read", source, "read-only contents permission")
    require("name: DCO sign-off check", source, "exact legacy required context")
    require("timeout-minutes: 2", source, "bounded runtime")
    require("EVENT_NAME: ${{ github.event_name }}", source, "event identity binding")
    require("PR_BASE_SHA: ${{ github.event.pull_request.base.sha }}", source, "PR base binding")
    require("PR_HEAD_SHA: ${{ github.event.pull_request.head.sha }}", source, "PR head binding")
    require("MG_BASE_SHA: ${{ github.event.merge_group.base_sha }}", source, "merge base binding")
    require("MG_HEAD_SHA: ${{ github.event.merge_group.head_sha }}", source, "merge head binding")
    require('[[ "$1" =~ ^[0-9a-f]{40}$ ]]', source, "full-SHA validation")
    require("Unsupported event", source, "fail-closed event handling")

    for fragment, description in (
        ("actions/checkout", "candidate checkout"),
        ("gh api", "GitHub API mutation or commit enumeration"),
        ("Signed-off-by:", "contributor trailer enforcement"),
        ("secrets.", "secret access"),
        ("pull_request_target", "privileged pull-request execution"),
        ("contents: write", "write permission"),
    ):
        forbid(fragment, source, description)

    print("legacy required-context read-only event-identity contract: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
