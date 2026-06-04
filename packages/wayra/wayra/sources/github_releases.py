# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v13 — WAYRA organ. GitHub Releases watcher source adapter.
"""
github_releases.py — WAYRA's GitHub leader-repo release watcher.

LEGAL: polls the PUBLIC per-repo Atom feed `https://github.com/{owner}/{repo}/releases.atom`.
This is GitHub's official, robots-friendly release feed — no auth, no scraping, no API
token burn. Read-only. (Doctrine WAYRA §Sources → GitHub Releases.)

Watches the leader repos that anchor SZL's supply-chain / drone-autonomy / proof stack:
UDS, Zarf, Pepr, ArduPilot, PX4, Sigstore, in-toto, SLSA, cookbooks, etc. A new release
on any of them is a signal that an upstream WAYRA must "take and make our own" (the
founder directive) — routed to a11oy (code), sentra (supply-chain/security), and
killinchu (drone autonomy) as appropriate.

Accepts an injected `fetch_fn` so tests run against canned .atom payloads with no network.
"""
from __future__ import annotations

from typing import Any, Callable, Iterator

from ..core.normalize import IngestEvent, make_event
from .base import Source, http_get
from .feedparse import parse_feed

# Top leader repos (owner/repo). NVIDIA/NIM is private — we track the public NIM docs
# mirror via build.nvidia.com release notes, not the private repo (LEGAL boundary).
LEADER_REPOS = [
    ("defenseunicorns", "uds-core"),
    ("zarf-dev", "zarf"),
    ("defenseunicorns", "pepr"),
    ("ArduPilot", "ardupilot"),
    ("PX4", "PX4-Autopilot"),
    ("sigstore", "cosign"),
    ("sigstore", "sigstore"),
    ("in-toto", "in-toto"),
    ("slsa-framework", "slsa"),
    ("slsa-framework", "slsa-github-generator"),
    ("anthropics", "anthropic-cookbook"),
    ("openai", "openai-cookbook"),
    ("kubernetes", "kubernetes"),
    ("kubernetes-sigs", "kustomize"),
    ("helm", "helm"),
    ("open-telemetry", "opentelemetry-collector"),
    ("cilium", "cilium"),
    ("istio", "istio"),
    ("argoproj", "argo-cd"),
    ("fluxcd", "flux2"),
    ("opencontainers", "runc"),
    ("containerd", "containerd"),
    ("spiffe", "spire"),
    ("openpolicyagent", "opa"),
    ("kyverno", "kyverno"),
    ("aquasecurity", "trivy"),
    ("anchore", "syft"),
    ("anchore", "grype"),
    ("ggml-org", "llama.cpp"),
    ("vllm-project", "vllm"),
]

# Per-repo routing hint (which organ consumes this leader's releases).
_ROUTING = {
    "ardupilot": ["killinchu", "a11oy"], "PX4-Autopilot": ["killinchu", "a11oy"],
    "cosign": ["sentra"], "sigstore": ["sentra"], "in-toto": ["sentra", "amaru"],
    "slsa": ["sentra", "amaru"], "slsa-github-generator": ["sentra"],
    "uds-core": ["sentra", "a11oy"], "zarf": ["sentra", "a11oy"], "pepr": ["sentra"],
}


class GitHubReleases(Source):
    source_id = "github_releases"
    route_to = ["a11oy"]
    rate_limit_s = 1.5
    cadence = "hourly"

    def __init__(self, log=None, repos: list[tuple[str, str]] | None = None,
                 fetch_fn: Callable[[str], bytes] | None = None,
                 per_repo_limit: int = 3) -> None:
        super().__init__(log)
        self.repos = repos or LEADER_REPOS
        self._fetch_fn = fetch_fn or (lambda url: http_get(url, timeout=30))
        self.per_repo_limit = per_repo_limit

    def stream(self) -> Iterator[dict[str, Any]]:
        for owner, repo in self.repos:
            self._throttle()
            url = f"https://github.com/{owner}/{repo}/releases.atom"
            try:
                xml = self._fetch_fn(url)
                entries = parse_feed(xml)
            except Exception:
                continue
            for e in entries[: self.per_repo_limit]:
                e["_owner"] = owner
                e["_repo"] = repo
                yield e

    def parse(self, e: dict[str, Any]) -> dict[str, Any]:
        return {
            "owner": e.get("_owner", ""),
            "repo": e.get("_repo", ""),
            "title": e.get("title", ""),
            "link": e.get("link", ""),
            "summary": e.get("summary", "")[:1500],
            "published": e.get("published", ""),
            "id": e.get("id", ""),
        }

    def normalize(self, p: dict[str, Any]) -> IngestEvent:
        slug = f"{p['owner']}/{p['repo']}"
        route = _ROUTING.get(p["repo"], self.route_to)
        # GitHub release notes for OSS repos are under each repo's OSS license; we
        # only ingest the public release metadata (title + notes), not the code.
        ev = make_event(
            source=self.source_id,
            source_detail=slug,
            timestamp=p["published"],
            title=f"{slug} release {p['title']}",
            url=p["link"] or f"https://github.com/{slug}/releases",
            raw=p,
            parsed_summary=f"New release of {slug}: {p['title']}. {p['summary']}",
            license="oss-release-notes",
            identity_parts=[self.source_id, p["id"] or p["link"]],
        )
        ev.organ_routing = route  # routing hint; final routing set after gate
        self.route_to = route
        return ev
