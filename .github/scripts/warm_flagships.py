#!/usr/bin/env python3
"""Probe one canonical Hugging Face flagship and maintain its incident lifecycle.

HEALTHY requires repeated HTTP 200 evidence and a final 200. UNHEALTHY requires
repeated real non-200 HTTP responses with no 200. DNS/TLS/timeout/connection
failures remain UNKNOWN. Pull-request runs are read-only; protected runs may
reconcile only the matching GitHub availability incident.
"""
from __future__ import annotations

import argparse
import json
import os
import socket
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping, Sequence

REPORT_SCHEMA = "szl.flagship-health/v3"
USER_AGENT = "szl-flagship-health/3"
ISSUE_MARKER_PREFIX = "szl-flagship-health"
HEALTHY = "HEALTHY"
UNHEALTHY = "UNHEALTHY"
UNKNOWN = "UNKNOWN"

# Canonical public fleet established by a11oy's authenticated 2026-09-02
# consolidation: 57 total Spaces -> nine public RUNNING flagships -> 48 folded
# private. Platform monitoring must follow this source-of-truth roster exactly.
ROSTER: dict[str, str] = {
    "a11oy": "https://szlholdings-a11oy.hf.space/healthz",
    "killinchu": "https://szlholdings-killinchu.hf.space/healthz",
    "terra": "https://szlholdings-terra.hf.space/healthz",
    "sentra": "https://szlholdings-sentra.hf.space/healthz",
    "counsel": "https://szlholdings-counsel.hf.space/healthz",
    "finance": "https://szlholdings-finance.hf.space/healthz",
    "vessels": "https://szlholdings-vessels.hf.space/healthz",
    "lyte": "https://szlholdings-lyte.hf.space/healthz",
    "david-leads": "https://szlholdings-david-leads.hf.space/healthz",
}


@dataclass(frozen=True)
class Attempt:
    number: int
    observed_at: str
    http_status: int | None
    final_url: str | None
    elapsed_ms: int
    body_preview: str
    error_class: str | None
    error_detail: str | None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def issue_title(organ: str) -> str:
    return f"flagship {organ} unhealthy (warm-flagships)"


def issue_marker(organ: str) -> str:
    return f"<!-- {ISSUE_MARKER_PREFIX}:{organ} -->"


def _safe_text(value: object, *, limit: int = 400) -> str:
    return str(value or "").replace("\x00", "").strip()[:limit]


def probe_once(url: str, *, number: int, timeout: float) -> Attempt:
    started = time.monotonic()
    request = urllib.request.Request(
        url,
        method="GET",
        headers={"Accept": "application/json,text/plain,*/*", "User-Agent": USER_AGENT},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read(2048)
            return Attempt(number, utc_now(), int(response.status), response.geturl(),
                           int((time.monotonic() - started) * 1000),
                           _safe_text(raw.decode("utf-8", errors="replace")), None, None)
    except urllib.error.HTTPError as exc:
        try:
            raw = exc.read(2048)
        except Exception:  # noqa: BLE001 - best-effort diagnostic only
            raw = b""
        return Attempt(number, utc_now(), int(exc.code), exc.geturl(),
                       int((time.monotonic() - started) * 1000),
                       _safe_text(raw.decode("utf-8", errors="replace")), None, None)
    except (urllib.error.URLError, TimeoutError, socket.timeout, OSError) as exc:
        return Attempt(number, utc_now(), None, None,
                       int((time.monotonic() - started) * 1000), "",
                       type(exc).__name__, _safe_text(exc, limit=300))


def classify_attempts(attempts: Sequence[Attempt], *, confirmations: int = 2) -> str:
    if confirmations < 1:
        raise ValueError("confirmations must be positive")
    if not attempts:
        return UNKNOWN
    statuses = [attempt.http_status for attempt in attempts]
    successes = sum(status == 200 for status in statuses)
    real_failures = sum(status is not None and status != 200 for status in statuses)
    if successes >= confirmations and statuses[-1] == 200:
        return HEALTHY
    if successes == 0 and real_failures >= confirmations:
        return UNHEALTHY
    return UNKNOWN


def planned_issue_action(*, state: str, open_issue_number: int | None) -> str:
    if state == UNHEALTHY and open_issue_number is None:
        return "CREATE"
    if state == HEALTHY and open_issue_number is not None:
        return "CLOSE"
    return "NONE"


def _github_request(method: str, path: str, *, token: str,
                    payload: Mapping[str, Any] | None = None) -> Any:
    if not token:
        raise RuntimeError("GitHub issue mutation requested without a token")
    data = json.dumps(payload, sort_keys=True).encode() if payload is not None else None
    request = urllib.request.Request(
        f"https://api.github.com{path}", method=method, data=data,
        headers={"Accept": "application/vnd.github+json", "Authorization": f"Bearer {token}",
                 "Content-Type": "application/json", "User-Agent": USER_AGENT,
                 "X-GitHub-Api-Version": "2022-11-28"},
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1000]
        raise RuntimeError(f"GitHub API {method} {path} failed with HTTP {exc.code}: {detail}") from exc
    return json.loads(raw.decode()) if raw else None


def find_open_issue(repository: str, *, organ: str, token: str) -> dict[str, Any] | None:
    owner, name = repository.split("/", 1)
    issues = _github_request("GET", f"/repos/{owner}/{name}/issues?state=open&labels=flagship,availability&per_page=100", token=token)
    title = issue_title(organ)
    for item in issues if isinstance(issues, list) else []:
        if isinstance(item, dict) and item.get("title") == title and "pull_request" not in item:
            return item
    return None


def issue_body(report: Mapping[str, Any]) -> str:
    organ = str(report["organ"])
    statuses = [str(a.get("http_status")) if a.get("http_status") is not None else "NO_HTTP_RESPONSE"
                for a in report.get("attempts", []) if isinstance(a, dict)]
    return "\n".join([
        issue_marker(organ), f"# Flagship health incident: {organ}", "",
        f"- State: **{report['state']}**", f"- Probe: `{report['probe_url']}`",
        f"- Observed: `{report['generated_at']}`", f"- HTTP sequence: `{', '.join(statuses)}`",
        f"- Source generation: `{report.get('generation')}`", f"- Run: {report.get('run_url') or 'not available'}", "",
        "The incident is created only after repeated real HTTP non-200 responses and no HTTP 200. DNS, TLS, timeout, and connection failures remain UNKNOWN and do not create an outage claim.", "",
        "```json", json.dumps(report, indent=2, sort_keys=True), "```", "",
    ])


def recovery_comment(report: Mapping[str, Any]) -> str:
    statuses = [a.get("http_status") for a in report.get("attempts", []) if isinstance(a, dict)]
    return "\n".join(["## Recovery verified", "",
        f"Repeated HTTP 200 evidence closed this incident at `{report['generated_at']}`.",
        f"- Probe: `{report['probe_url']}`", f"- HTTP sequence: `{statuses}`",
        f"- Source generation: `{report.get('generation')}`", f"- Run: {report.get('run_url') or 'not available'}", "",
        "Network-only failures are not used as recovery evidence. No Hugging Face asset was mutated by this probe."])


def apply_issue_action(report: Mapping[str, Any], *, repository: str, token: str) -> dict[str, Any]:
    owner, name = repository.split("/", 1)
    organ = str(report["organ"])
    open_issue = find_open_issue(repository, organ=organ, token=token)
    issue_number = int(open_issue["number"]) if open_issue else None
    action = planned_issue_action(state=str(report["state"]), open_issue_number=issue_number)
    if action == "CREATE":
        created = _github_request("POST", f"/repos/{owner}/{name}/issues", token=token,
                                  payload={"title": issue_title(organ), "body": issue_body(report),
                                           "labels": ["flagship", "availability"]})
        return {"action": action, "issue_number": created.get("number") if isinstance(created, dict) else None}
    if action == "CLOSE" and issue_number is not None:
        _github_request("POST", f"/repos/{owner}/{name}/issues/{issue_number}/comments", token=token,
                        payload={"body": recovery_comment(report)})
        _github_request("PATCH", f"/repos/{owner}/{name}/issues/{issue_number}", token=token,
                        payload={"state": "closed", "state_reason": "completed"})
        return {"action": action, "issue_number": issue_number}
    return {"action": "NONE", "issue_number": issue_number}


def run_probe(organ: str, *, url: str, attempts_count: int, confirmations: int,
              timeout: float, interval: float) -> dict[str, Any]:
    attempts: list[Attempt] = []
    for number in range(1, attempts_count + 1):
        result = probe_once(url, number=number, timeout=timeout)
        attempts.append(result)
        print(f"{organ} attempt={number} http={result.http_status} elapsed_ms={result.elapsed_ms} error={result.error_class or 'none'}")
        if number < attempts_count and interval > 0:
            time.sleep(interval)
    run_url = None
    if all(os.environ.get(k) for k in ("GITHUB_SERVER_URL", "GITHUB_REPOSITORY", "GITHUB_RUN_ID")):
        run_url = f"{os.environ['GITHUB_SERVER_URL']}/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{os.environ['GITHUB_RUN_ID']}"
    return {
        "schema": REPORT_SCHEMA, "generated_at": utc_now(), "generation": os.environ.get("GITHUB_SHA"),
        "repository": os.environ.get("GITHUB_REPOSITORY"), "run_url": run_url, "organ": organ,
        "probe_url": url, "state": classify_attempts(attempts, confirmations=confirmations),
        "policy": {"attempts": attempts_count, "confirmations": confirmations,
                   "healthy_requires_final_200": True, "unhealthy_requires_no_200": True,
                   "network_failure_state": UNKNOWN},
        "attempts": [asdict(a) for a in attempts],
        "boundaries": ["This controller performs GET probes and optional GitHub issue lifecycle updates only.",
                       "It does not mutate a Hugging Face Space, repository, visibility, hardware, secret, or runtime.",
                       "No credential value is written to the report or logs."],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--organ", required=True, choices=sorted(ROSTER))
    parser.add_argument("--probe-url")
    parser.add_argument("--attempts", type=int, default=3)
    parser.add_argument("--confirmations", type=int, default=2)
    parser.add_argument("--timeout", type=float, default=25.0)
    parser.add_argument("--interval", type=float, default=2.0)
    parser.add_argument("--report", required=True)
    parser.add_argument("--mutate-issues", action="store_true")
    args = parser.parse_args()
    if args.attempts < 1:
        parser.error("--attempts must be positive")
    if args.confirmations < 1 or args.confirmations > args.attempts:
        parser.error("--confirmations must be between 1 and --attempts")
    report = run_probe(args.organ, url=args.probe_url or ROSTER[args.organ], attempts_count=args.attempts,
                       confirmations=args.confirmations, timeout=args.timeout, interval=args.interval)
    mutation: dict[str, Any] = {"requested": args.mutate_issues, "action": "NONE"}
    if args.mutate_issues:
        repository = os.environ.get("GITHUB_REPOSITORY") or ""
        token = os.environ.get("GITHUB_TOKEN") or ""
        if not repository or "/" not in repository:
            raise RuntimeError("GITHUB_REPOSITORY is required for issue mutation")
        mutation.update(apply_issue_action(report, repository=repository, token=token))
    report["issue_lifecycle"] = mutation
    output = Path(args.report)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"organ": args.organ, "state": report["state"], **mutation}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
