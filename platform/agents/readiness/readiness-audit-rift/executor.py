#!/usr/bin/env python3
"""
READINESS-AUDIT-RIFT executor — the verifier of verifiers.

Runs LAST, after the other 7 agents have posted their daily receipts to
SZLHOLDINGS/readiness-runs. It does NOT trust their verdicts; it independently
re-checks a sample of each agent's claims:

  - reliability: re-probe /healthz (up to 3 attempts) on one flagship whose
    receipt reports healthz success at or above its pass criterion.
  - security: re-list one repo's workflows (GREEN first, then AMBER, then any
    verdict) for a control it reported present and, when it cites a successful
    run, re-fetch that run and require success at the cited head.
  - observability: re-fetch /metrics and require a real sample line for one
    counter the agent reported present.
  - operability: re-count commits in the last 7 days for one flagship.
  - compliance: re-fetch one README and confirm the doctrine numbers claim.
  - docs: re-fetch one README the agent reported present.
  - dr: re-download one dump the agent reported uploaded and restored, and
    confirm it restores to the reported row count.

A sampled claim whose recheck contradicts it is flagged as OVER-CLAIMED
(FLAGGED). A recheck that cannot reach its source is RESAMPLE-ERROR, and a peer
with no positive claim to sample is UNVERIFIED.
Emits a meta-audit signed receipt. Honest: if a peer receipt is missing it is
flagged NO-RECEIPT (cannot audit), never silently passed.

Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import base64
import contextlib
import datetime as dt
import json
import os
import re
import sqlite3
import subprocess
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-audit-rift"
PEERS = ["readiness-reliability", "readiness-security", "readiness-observability",
         "readiness-operability", "readiness-compliance", "readiness-docs", "readiness-dr"]
WORKFLOW_MARKERS = {"sbom": ("sbom",), "trivy": ("trivy",),
                    "gitleaks": ("gitleaks", "secret")}
HTTP_ATTEMPTS = 3
DEFAULT_HEALTHZ_MIN = 0.995  # readiness-reliability pass criterion
_PROM_NAME = re.compile(r"[a-zA-Z_:][a-zA-Z0-9_:]*")
_SHA = re.compile(r"[0-9a-f]{40}")
_DR_DUMP_PATH = re.compile(
    r"dr-dumps/[A-Za-z0-9_.-]+/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}Z\.ndjson")


def gh(*args: str) -> tuple[int, str]:
    env = dict(os.environ, GH_HOST="github.com")
    p = subprocess.run(["gh", "api", *args], capture_output=True, text=True, env=env)
    return p.returncode, (p.stdout if p.returncode == 0 else p.stderr)


def http_get(url: str, timeout: float = 8.0) -> tuple[int | None, bytes]:
    """One GET. An HTTP error returns its status; a transport failure returns None."""
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return resp.status, resp.read(1 << 20)
    except urllib.error.HTTPError as exc:
        return exc.code, b""
    except Exception:
        return None, b""


def fetch_dataset_file(path: str) -> bytes:
    """Read one file a peer reported uploading to the runs dataset."""
    from huggingface_hub import hf_hub_download
    local = hf_hub_download(khipu.HF_DATASET, path, repo_type="dataset",
                            token=os.environ.get("HF_TOKEN"))
    with open(local, "rb") as stream:
        return stream.read()


def flagship_base(name: object) -> str | None:
    """The configured http(s) base URL for a named flagship, or None."""
    fl = next((f for f in khipu.FLAGSHIPS if f["name"] == name), None)
    base = khipu.flagship_url(fl) if fl else None
    if not isinstance(base, str) or not base.startswith(("https://", "http://")):
        return None
    return base.rstrip("/")


def first_success(url: str) -> tuple[list[int | None], bytes | None]:
    """Up to HTTP_ATTEMPTS GETs; every status seen and the first 2xx body."""
    statuses: list[int | None] = []
    for _ in range(HTTP_ATTEMPTS):
        status, body = http_get(url)
        statuses.append(status)
        if status is not None and 200 <= status < 300:
            return statuses, body
    return statuses, None


def live_over_claimed(statuses: list[int | None], body: bytes | None) -> bool:
    """False on a 2xx answer, True when the endpoint answered but never 2xx.

    No HTTP answer at all can neither reproduce nor refute the claim, so it
    raises and the finding becomes RESAMPLE-ERROR.
    """
    if body is not None:
        return False
    if any(status is not None for status in statuses):
        return True
    raise RuntimeError("live recheck could not reach the flagship")


def prometheus_sample_present(text: str, name: str) -> bool:
    """True only for a sample line of exactly this metric, not HELP/TYPE or a longer name."""
    pattern = re.compile(rf"^{re.escape(name)}(?:\{{[^}}\n]*\}})?[ \t]+\S", re.M)
    return pattern.search(text) is not None


def security_sample(repos: object):
    """First repo (GREEN, then AMBER, then any verdict) with a control reported present.

    Returns (repo, control, run). run is (run_id, head_sha) when the receipt cites
    a successful run for that control, None when it cites none, and False when it
    claims success with a missing or invalid run reference.
    """
    if not isinstance(repos, list):
        return None
    rank = {"GREEN": 0, "AMBER": 1}
    candidates = [r for r in repos if isinstance(r, dict) and isinstance(r.get("repo"), str)]
    candidates.sort(key=lambda r: rank.get(r["verdict"], 2) if isinstance(r.get("verdict"), str) else 2)
    for repo in candidates:
        workflows = repo.get("workflows")
        present = workflows.get("present") if isinstance(workflows, dict) else None
        if not isinstance(present, dict):
            continue
        control = next((c for c in WORKFLOW_MARKERS if present.get(c) is True), None)
        if control is None:
            continue
        controls = workflows.get("controls")
        detail = controls.get(control) if isinstance(controls, dict) else None
        run = None
        if isinstance(detail, dict) and detail.get("status") == "SUCCESS":
            run_id, head_sha = detail.get("run_id"), detail.get("run_head_sha")
            valid = (type(run_id) is int and run_id > 0 and isinstance(head_sha, str)
                     and _SHA.fullmatch(head_sha) is not None)
            run = (run_id, head_sha) if valid else False
        return repo, control, run
    return None


def restorable_rows(dump: bytes) -> int | None:
    """Rows restored from NDJSON key/value records, or None when the dump does not restore."""
    def unique(pairs):
        obj = {}
        for key, value in pairs:
            if key in obj:
                raise ValueError("duplicate JSON field")
            obj[key] = value
        return obj

    def reject(_value):
        raise ValueError("non-finite JSON number")

    try:
        text = dump.decode("utf-8")
    except UnicodeDecodeError:
        return None
    rows: dict[str, str] = {}
    for line in text.split("\n"):
        line = line.strip(" \t\r")
        if not line:
            continue
        try:
            obj = json.loads(line, object_pairs_hook=unique, parse_constant=reject)
            if (not isinstance(obj, dict) or not isinstance(obj.get("key"), str) or not obj["key"]
                    or "value" not in obj or obj["key"] in rows):
                return None
            rows[obj["key"]] = json.dumps(obj["value"], sort_keys=True, allow_nan=False)
        except (ValueError, RecursionError):
            return None
    if not rows:
        return None
    expected = sorted(rows.items())
    try:
        with contextlib.closing(sqlite3.connect(":memory:")) as con:
            con.execute("CREATE TABLE unay(k TEXT PRIMARY KEY, v TEXT NOT NULL)")
            con.executemany("INSERT INTO unay(k, v) VALUES(?, ?)", expected)
            restored = con.execute("SELECT k, v FROM unay ORDER BY k").fetchall()
    except (sqlite3.Error, UnicodeError):
        return None
    return len(restored) if restored == expected else None


def latest_peer_receipt(agent: str) -> dict | None:
    """Pull the most recent receipt for a peer from the HF dataset."""
    token = os.environ.get("HF_TOKEN")
    try:
        from huggingface_hub import HfApi, hf_hub_download
        api = HfApi(token=token)
        files = [f for f in api.list_repo_files(khipu.HF_DATASET, repo_type="dataset")
                 if f.startswith(f"receipts/{agent}/") and f.endswith(".json")]
        if not files:
            return None
        latest = sorted(files)[-1]
        local = hf_hub_download(khipu.HF_DATASET, latest, repo_type="dataset", token=token)
        with open(local, encoding="utf-8") as stream:
            env = json.load(stream)
        body = json.loads(base64.b64decode(env["payload"]).decode())
        return {"file": latest, "envelope": env, "body": body}
    except Exception as exc:
        return {"error": f"{type(exc).__name__}: {exc}"}


def reverify_signature(agent: str, env: dict) -> bool | None:
    """Authenticate a peer against the configured fleet key, not its own key claim."""
    if not isinstance(env, dict):
        return False
    if env.get("signed") is not True or not env.get("signatures"):
        return None
    if not os.environ.get("KHIPU_SIGNING_KEY_B64"):
        return None
    return khipu.receipt_signature_error(agent, env) is None


def audit_peer(agent: str) -> dict:
    rec = latest_peer_receipt(agent)
    if rec is None:
        return {"agent": agent, "status": "NO-RECEIPT"}
    if "error" in rec:
        return {"agent": agent, "status": "FETCH-ERROR", "detail": rec["error"]}
    sig_ok = reverify_signature(agent, rec["envelope"])
    finding = {"agent": agent, "receipt_file": rec["file"], "signature_reverified": sig_ok}
    if sig_ok is False:
        return {**finding, "status": "FLAGGED", "reason": "invalid receipt signature"}
    if sig_ok is not True:
        return {**finding, "status": "UNVERIFIED", "reason": "receipt signature not verified"}

    # claim-specific independent re-check (best-effort sampling)
    try:
        body = rec["body"]
        payload = body.get("payload", {})
        if agent == "readiness-security":
            repos = payload.get("repos", [])
            sample = security_sample(repos)
            if sample is None:
                if repos:
                    return {**finding, "status": "UNVERIFIED",
                            "reason": "no reported present workflow control to sample"}
            else:
                repo, control, run = sample
                if run is False:
                    return {**finding, "status": "UNVERIFIED",
                            "reason": "reported control run is missing or invalid"}
                rc, out = gh(f"repos/{repo['repo']}/contents/.github/workflows")
                if rc != 0:
                    raise RuntimeError(f"GitHub workflow recheck failed (exit {rc})")
                names = [f["name"].lower() for f in json.loads(out)
                         if f["type"] == "file" and f["name"].lower().endswith((".yml", ".yaml"))]
                finding["resampled_repo"] = repo["repo"]
                finding["sampled_control"] = control
                over = not any(marker in name for marker in WORKFLOW_MARKERS[control] for name in names)
                if not over and run is not None:
                    run_id, head_sha = run
                    rc, out = gh(f"repos/{repo['repo']}/actions/runs/{run_id}")
                    if rc != 0:
                        raise RuntimeError(f"GitHub run recheck failed (exit {rc})")
                    observed = json.loads(out)
                    if not isinstance(observed, dict) or observed.get("id") != run_id:
                        raise ValueError("GitHub run recheck returned a different run")
                    finding["resampled_run_id"] = run_id
                    over = observed.get("conclusion") != "success" or observed.get("head_sha") != head_sha
                finding["over_claimed"] = over
        elif agent == "readiness-operability":
            fls = payload.get("flagships", [])
            if fls:
                sample = fls[0]
                claimed = sample.get("commits_last_7d")
                revision = sample.get("revision")
                observed_at = sample.get("observed_at_utc")
                if type(claimed) is not int or claimed < 0:
                    return {**finding, "status": "UNVERIFIED",
                            "reason": "reported commit count is missing or invalid"}
                if (not isinstance(revision, str) or re.fullmatch(r"[0-9a-f]{40}", revision) is None
                        or not isinstance(observed_at, str)):
                    return {**finding, "status": "UNVERIFIED",
                            "reason": "reported commit revision or observation time is missing or invalid"}
                try:
                    observed = dt.datetime.fromisoformat(observed_at.replace("Z", "+00:00"))
                    if observed.utcoffset() != dt.timedelta(0):
                        raise ValueError("observation time must be UTC")
                    since = (observed - dt.timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
                    until = observed.strftime("%Y-%m-%dT%H:%M:%SZ")
                except (ValueError, OverflowError):
                    return {**finding, "status": "UNVERIFIED",
                            "reason": "reported observation time is missing or invalid"}
                seen = set()
                for page in range(1, 11):
                    rc, out = gh(f"repos/{sample['repo']}/commits?sha={revision}&since={since}&until={until}&per_page=100&page={page}")
                    if rc != 0:
                        raise RuntimeError(f"GitHub commit recheck failed (exit {rc})")
                    commits = json.loads(out)
                    if (not isinstance(commits, list) or len(commits) > 100
                            or any(not isinstance(item, dict) or not isinstance(item.get("sha"), str)
                                   or re.fullmatch(r"[0-9a-f]{40}", item["sha"]) is None for item in commits)):
                        raise ValueError("GitHub commit recheck returned malformed commits")
                    ids = [item["sha"] for item in commits]
                    if len(set(ids)) != len(ids) or seen.intersection(ids):
                        raise ValueError("GitHub commit recheck returned duplicate commits")
                    seen.update(ids)
                    if len(commits) < 100:
                        break
                else:
                    raise ValueError("GitHub commit recheck history is incomplete")
                finding["resampled_repo"] = sample["repo"]
                finding["resampled_revision"] = revision
                finding["resampled_observed_at_utc"] = observed_at
                finding["claimed_commits"] = claimed
                finding["independent_commits"] = len(seen)
                # Identical immutable revision and time bounds require exact agreement.
                finding["over_claimed"] = len(seen) != claimed
        elif agent == "readiness-docs":
            repos = payload.get("repos", [])
            target = next((r for r in repos if r.get("present", {}).get("README.md")), None)
            if target:
                rc, out = gh(f"repos/{target['repo']}/contents/README.md")
                if rc != 0:
                    raise RuntimeError(f"GitHub README recheck failed (exit {rc})")
                readme = json.loads(out)
                if (not isinstance(readme, dict) or readme.get("type") != "file"
                        or readme.get("name") != "README.md" or readme.get("encoding") != "base64"):
                    raise ValueError("GitHub README recheck did not return a readable file")
                base64.b64decode("".join(readme["content"].split()), validate=True)
                finding["resampled_repo"] = target["repo"]
                finding["over_claimed"] = False
        elif agent == "readiness-reliability":
            criteria = payload.get("pass_criteria")
            floor = criteria.get("success_min") if isinstance(criteria, dict) else None
            if type(floor) not in (int, float) or not 0 < floor <= 1:
                floor = DEFAULT_HEALTHZ_MIN
            flagships = payload.get("flagships", [])
            target = None
            for row in flagships if isinstance(flagships, list) else []:
                endpoints = row.get("endpoints") if isinstance(row, dict) else None
                healthz = endpoints.get("healthz") if isinstance(endpoints, dict) else None
                rate = healthz.get("success_rate") if isinstance(healthz, dict) else None
                if type(rate) in (int, float) and floor <= rate <= 1:
                    target = row
                    break
            if target is not None:
                base = flagship_base(target.get("flagship"))
                if base is None:
                    return {**finding, "status": "UNVERIFIED",
                            "reason": "flagship URL not configured for the live recheck"}
                statuses, body = first_success(f"{base}/healthz")
                finding["resampled_flagship"] = target["flagship"]
                finding["resampled_statuses"] = statuses
                finding["over_claimed"] = live_over_claimed(statuses, body)
        elif agent == "readiness-observability":
            matrix = payload.get("trace_continuity_matrix", [])
            target = None
            for row in matrix if isinstance(matrix, list) else []:
                if not isinstance(row, dict) or row.get("metrics_status") != 200:
                    continue
                counters = row.get("required_counters")
                if not isinstance(counters, dict):
                    continue
                counter = next((c for c in sorted(counters)
                                if counters[c] is True and _PROM_NAME.fullmatch(c)), None)
                if counter is not None:
                    target = (row.get("flagship"), counter)
                    break
            if target is not None:
                base = flagship_base(target[0])
                if base is None:
                    return {**finding, "status": "UNVERIFIED",
                            "reason": "flagship URL not configured for the live recheck"}
                statuses, body = first_success(f"{base}/metrics")
                finding["resampled_flagship"] = target[0]
                finding["sampled_counter"] = target[1]
                finding["resampled_statuses"] = statuses
                over = live_over_claimed(statuses, body)
                if not over:
                    over = not prometheus_sample_present(body.decode("utf-8", "replace"), target[1])
                finding["over_claimed"] = over
        elif agent == "readiness-compliance":
            rows = payload.get("doctrine_consistency", [])
            target = next((r for r in rows if isinstance(r, dict) and r.get("has_v11_numbers") is True
                           and isinstance(r.get("repo"), str)), None) if isinstance(rows, list) else None
            if target is not None:
                rc, out = gh(f"repos/{target['repo']}/contents/README.md")
                if rc != 0:
                    raise RuntimeError(f"GitHub README recheck failed (exit {rc})")
                readme = json.loads(out)
                if (not isinstance(readme, dict) or readme.get("type") != "file"
                        or readme.get("name") != "README.md" or readme.get("encoding") != "base64"):
                    raise ValueError("GitHub README recheck did not return a readable file")
                text = base64.b64decode("".join(readme["content"].split()),
                                        validate=True).decode("utf-8", "replace")
                finding["resampled_repo"] = target["repo"]
                finding["sampled_claim"] = "has_v11_numbers"
                finding["over_claimed"] = khipu.DOCTRINE_STRING not in text
        elif agent == "readiness-dr":
            rows = payload.get("flagships", [])
            target = None
            for row in rows if isinstance(rows, list) else []:
                upload = row.get("upload") if isinstance(row, dict) else None
                proof = row.get("restore_proof") if isinstance(row, dict) else None
                if (isinstance(upload, dict) and upload.get("uploaded") is True
                        and isinstance(proof, dict) and proof.get("restored") is True
                        and row.get("verdict") == "GREEN"):
                    target = row
                    break
            if target is not None:
                path = target["upload"].get("path")
                claimed = target["restore_proof"].get("rows")
                if (not isinstance(path, str) or _DR_DUMP_PATH.fullmatch(path) is None
                        or type(claimed) is not int or claimed <= 0):
                    return {**finding, "status": "UNVERIFIED",
                            "reason": "reported DR dump path or row count is missing or invalid"}
                observed = restorable_rows(fetch_dataset_file(path))
                finding["resampled_dump"] = path
                finding["claimed_rows"] = claimed
                finding["independent_rows"] = observed
                finding["over_claimed"] = observed != claimed
    except Exception as exc:
        finding["resample_error"] = f"{type(exc).__name__}: {exc}"
        finding["status"] = "RESAMPLE-ERROR"
        return finding

    if finding.get("over_claimed") is True:
        finding["status"] = "FLAGGED"
    elif finding.get("over_claimed") is False:
        finding["status"] = "VERIFIED"
    else:
        finding["status"] = "UNVERIFIED"
        finding["reason"] = "no independent claim recheck completed"
    return finding


def main() -> int:
    findings = [audit_peer(a) for a in PEERS]
    flagged = [f["agent"] for f in findings if f.get("status") != "VERIFIED"]
    payload = {"peers_audited": len(PEERS), "flagged_agents": flagged, "findings": findings,
               "meta_verdict": "GREEN" if not flagged else "AMBER"}
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
