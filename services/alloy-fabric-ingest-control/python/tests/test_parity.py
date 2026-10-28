"""Differential test: the original TypeScript service and this port answer the same requests alike.

Runs only when the original can be started:
  AEF_PARITY_NODE    path to a Node binary (the Dockerfile pins Node 26)
  AEF_PARITY_TS_DIR  directory holding a copy of ../src/server.ts plus node_modules with express,
                     zod, tsx and @workspace/aef-contracts + @workspace/aef-workflow-runtime

For every configuration both services start with the same environment and their own data
directory. Each scripted request goes to both. Status codes, JSON bodies, the Retry-After
header, checkpoint/approval files and per-step log lines must match after random identifiers
and timestamps are replaced by placeholders. HTML error pages are compared by status and
content type only, and validation `issues` arrays are not compared (Zod and pydantic word
them differently).
"""

from __future__ import annotations

import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

import httpx
import pytest

NODE = os.environ.get("AEF_PARITY_NODE")
TS_DIR = os.environ.get("AEF_PARITY_TS_DIR")
PY_SRC = Path(__file__).resolve().parents[1] / "src"
SECRET = "parity-secret"
AUTH = {"Authorization": f"Bearer {SECRET}"}

pytestmark = pytest.mark.skipif(not (NODE and TS_DIR), reason="original TypeScript service not available")

_TS_PATTERN = re.compile(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z")
_ID_PATTERNS = [
    ("wf", re.compile(r"\b(?:ingest|rebuild|verify|eval|rotate)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b")),
    ("apr", re.compile(r"\bapr-\d+-[0-9a-z]{1,6}\b")),
    ("uuid", re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b")),
]


class Normalizer:
    """Replaces generated identifiers by their order of first appearance, per service run."""

    def __init__(self) -> None:
        self.seen: dict[str, str] = {}

    def text(self, value: str) -> str:
        value = _TS_PATTERN.sub("<ts>", value)
        for label, pattern in _ID_PATTERNS:
            def swap(match: re.Match[str], label: str = label) -> str:
                token = match.group(0)
                if token not in self.seen:
                    self.seen[token] = f"<{label}#{sum(1 for v in self.seen.values() if v.startswith('<' + label))+1}>"
                return self.seen[token]
            value = pattern.sub(swap, value)
        return value

    def value(self, data: Any) -> Any:
        if isinstance(data, dict):
            out = {}
            for key, item in data.items():
                if key == "uptimeSeconds":
                    out[key] = "<n>"
                elif key == "issues" and data.get("error") == "validation_error":
                    out[key] = "<issues>"
                else:
                    out[key] = self.value(item)
            return out
        if isinstance(data, list):
            return [self.value(item) for item in data]
        if isinstance(data, str):
            return self.text(data)
        return data


def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class Server:
    def __init__(self, kind: str, env: dict[str, str]) -> None:
        self.kind = kind
        self.port = _free_port()
        self.data_dir = tempfile.mkdtemp(prefix=f"aef-parity-{kind}-")
        base = {"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "HOME": os.environ.get("HOME", "/tmp"),
                "LANG": "C.UTF-8"}
        full_env = {**base, **env, "PORT": str(self.port), "AEF_DATA_DIR": self.data_dir}
        if kind == "ts":
            cmd, cwd = [NODE, "--conditions=development", "--import", "tsx", "server.ts"], TS_DIR
        else:
            cmd, cwd = [sys.executable, "-m", "aef_ingest_control"], str(PY_SRC)
            full_env["PYTHONPATH"] = str(PY_SRC)
        self.proc = subprocess.Popen(cmd, cwd=cwd, env=full_env, stdout=subprocess.PIPE,
                                     stderr=subprocess.DEVNULL, text=True)
        self.base = f"http://127.0.0.1:{self.port}"

    def wait_ready(self, timeout: float = 30.0) -> bool:
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if self.proc.poll() is not None:
                return False
            try:
                httpx.get(self.base + "/healthz", timeout=1.0)
                return True
            except httpx.HTTPError:
                time.sleep(0.2)
        return False

    def stop(self) -> list[str]:
        if self.proc.poll() is None:
            self.proc.terminate()
        try:
            out, _ = self.proc.communicate(timeout=10)
        except subprocess.TimeoutExpired:
            self.proc.kill()
            out, _ = self.proc.communicate()
        shutil.rmtree(self.data_dir, ignore_errors=True)
        return out.splitlines()

    def files(self) -> dict[str, str | None]:
        result = {}
        for name in ("checkpoints.json", "approvals.json"):
            path = Path(self.data_dir, name)
            result[name] = path.read_text(encoding="utf-8") if path.exists() else None
        return result


def _send(client: httpx.Client, step: dict[str, Any], captured: dict[str, str]) -> httpx.Response:
    path = step["path"].format(**captured)
    headers = dict(step.get("headers", AUTH if step.get("auth", True) else {}))
    content = None
    if "json" in step:
        content = json.dumps(step["json"]).encode()
        headers.setdefault("Content-Type", "application/json")
    elif "raw" in step:
        content = step["raw"].encode() if isinstance(step["raw"], str) else step["raw"]
    return client.request(step.get("method", "POST"), path, content=content, headers=headers)


def _observe(response: httpx.Response, norm: Normalizer) -> dict[str, Any]:
    media = response.headers.get("content-type", "").split(";")[0].strip()
    seen: dict[str, Any] = {"status": response.status_code, "type": media,
                            "retry_after": response.headers.get("retry-after"),
                            "allow": response.headers.get("allow")}
    if media == "application/json":
        seen["body"] = norm.value(response.json())
    return seen


def _capture(response: httpx.Response, step: dict[str, Any], captured: dict[str, str]) -> None:
    for name, key in step.get("capture", {}).items():
        captured[name] = response.json()[key]


def _files(raw: dict[str, str | None], norm: Normalizer) -> dict[str, Any]:
    return {name: (None if text is None else norm.value(json.loads(text))) for name, text in raw.items()}


def _logs(lines: list[str], norm: Normalizer) -> list[Any]:
    events = []
    for line in lines:
        try:
            event = json.loads(line)
        except ValueError:
            continue
        if isinstance(event, dict) and event.get("msg") == "workflow_step":
            events.append(norm.value(event))
    return events


def _run_both(env: dict[str, str], steps: list[dict[str, Any]]) -> None:
    servers = {kind: Server(kind, env) for kind in ("ts", "py")}
    try:
        for kind, server in servers.items():
            assert server.wait_ready(), f"{kind} server did not start"
        observed: dict[str, list[Any]] = {}
        file_states: dict[str, list[Any]] = {}
        norms = {kind: Normalizer() for kind in servers}
        for kind, server in servers.items():
            captured: dict[str, str] = {}
            observed[kind], file_states[kind] = [], []
            with httpx.Client(base_url=server.base, timeout=10.0) as client:
                for step in steps:
                    response = _send(client, step, captured)
                    observed[kind].append((step["name"], _observe(response, norms[kind])))
                    if response.status_code < 300:
                        _capture(response, step, captured)
                    file_states[kind].append((step["name"], _files(server.files(), norms[kind])))
        differences = []
        for (name, ts_seen), (_, py_seen) in zip(observed["ts"], observed["py"]):
            if py_seen != ts_seen:
                differences.append(f"response at {name!r}:\n  ts={ts_seen}\n  py={py_seen}")
        for (name, ts_files), (_, py_files) in zip(file_states["ts"], file_states["py"]):
            if py_files != ts_files:
                differences.append(f"state files after {name!r}:\n  ts={ts_files}\n  py={py_files}")
                break  # later file states inherit the first divergence
    finally:
        logs = {kind: server.stop() for kind, server in servers.items()}
    if _logs(logs["py"], norms["py"]) != _logs(logs["ts"], norms["ts"]):
        differences.append("workflow step logs differ")
    assert not differences, f"{len(differences)} difference(s):\n" + "\n".join(differences)


def _doc(source: str, content: str, **extra: Any) -> dict[str, Any]:
    return {"sourceId": source, "content": content, **extra}


MESSY = "  Line one\r\nline\ttwo   with  spaces \u00a0nbsp\u2003em \U0001F600 emoji\n\n end \ufeff"
LONG = " ".join(f"w{i}" for i in range(1100))

DEV_STEPS: list[dict[str, Any]] = [
    {"name": "health", "method": "GET", "path": "/health", "auth": False},
    {"name": "healthz", "method": "GET", "path": "/healthz", "auth": False},
    {"name": "readyz", "method": "GET", "path": "/readyz", "auth": False},
    {"name": "case-insensitive path", "method": "GET", "path": "/HEALTHZ", "auth": False},
    {"name": "trailing slash", "method": "GET", "path": "/healthz/", "auth": False},
    {"name": "options", "method": "OPTIONS", "path": "/healthz", "auth": False},
    {"name": "unknown route", "method": "GET", "path": "/nope", "auth": False},
    {"name": "wrong method", "method": "DELETE", "path": "/healthz", "auth": False},
    {"name": "get on post route", "method": "GET", "path": "/control/ingest"},
    {"name": "no auth", "path": "/control/verify", "auth": False, "json": {"requestId": "r", "tenantId": "t"}},
    {"name": "wrong token", "path": "/control/verify", "headers": {"Authorization": "Bearer nope"},
     "json": {"requestId": "r", "tenantId": "t"}},
    {"name": "lowercase scheme", "path": "/control/verify", "headers": {"Authorization": f"bearer {SECRET}"},
     "json": {"requestId": "r", "tenantId": "t"}},
    {"name": "double space", "path": "/control/verify", "headers": {"Authorization": f"Bearer  {SECRET}"},
     "json": {"requestId": "r", "tenantId": "t"}},
    {"name": "token with suffix", "path": "/control/verify", "headers": {"Authorization": f"Bearer {SECRET} x"},
     "json": {"requestId": "r", "tenantId": "t"}},
    {"name": "blank tenant", "path": "/control/verify", "json": {"requestId": "r", "tenantId": "   "}},
    {"name": "padded tenant", "path": "/control/verify", "json": {"requestId": "r", "tenantId": "  t1 "}},
    {"name": "verify with sources", "path": "/control/verify",
     "json": {"requestId": "r", "tenantId": "t1", "sourceIds": ["a", "b"]}},
    {"name": "verify null sources", "path": "/control/verify",
     "json": {"requestId": "r", "tenantId": "t1", "sourceIds": None}},
    {"name": "ingest empty object", "path": "/control/ingest", "json": {}},
    {"name": "ingest no documents", "path": "/control/ingest", "json": {"requestId": "r", "tenantId": "t", "documents": []}},
    *[{"name": f"ingest chunkSize {value!r}", "path": "/control/ingest",
       "json": {"requestId": "r", "tenantId": "t", "documents": [_doc("s", "x")], "chunkSize": value}}
      for value in (0, 1.5, "5", True, 2**53)],
    {"name": "ingest negative overlap", "path": "/control/ingest",
     "json": {"requestId": "r", "tenantId": "t", "documents": [_doc("s", "x")], "chunkOverlap": -1}},
    {"name": "ingest empty content", "path": "/control/ingest",
     "json": {"requestId": "r", "tenantId": "t", "documents": [_doc("s", "")]}},
    {"name": "ingest bad content type", "path": "/control/ingest",
     "json": {"requestId": "r", "tenantId": "t", "documents": [_doc("s", "x", contentType="text/csv")]}},
    {"name": "ingest numeric tenant", "path": "/control/ingest",
     "json": {"requestId": "r", "tenantId": 5, "documents": [_doc("s", "x")]}},
    {"name": "ingest null profile", "path": "/control/ingest",
     "json": {"requestId": "r", "tenantId": "t", "documents": [_doc("s", "x", profileId=None)]}},
    {"name": "ingest 257 documents", "path": "/control/ingest",
     "json": {"requestId": "r", "tenantId": "t", "documents": [_doc(f"s{i}", "x") for i in range(257)]}},
    {"name": "ingest two documents", "path": "/control/ingest",
     "json": {"requestId": "r1", "tenantId": "t1", "chunkSize": 3, "chunkOverlap": 1, "unknownField": 1,
              "documents": [_doc("messy", MESSY, metadata={"k": "v"}), _doc("md", "# Title\n\nbody", contentType="text/markdown")]}},
    {"name": "ingest long document", "path": "/control/ingest",
     "json": {"requestId": "r2", "tenantId": "t1", "chunkSize": 5, "chunkOverlap": 2, "documents": [_doc("long", LONG)]}},
    {"name": "ingest overlap above size", "path": "/control/ingest",
     "json": {"requestId": "r3", "tenantId": "t1", "chunkSize": 2, "chunkOverlap": 5, "documents": [_doc("o", "a b c d e")]}},
    {"name": "eval", "path": "/control/eval",
     "json": {"requestId": "r", "tenantId": "t1", "profileId": "p", "datasetId": "d",
              "queries": [{"queryId": "q", "query": "x", "relevantChunkIds": ["c"]}]}},
    {"name": "eval without queries", "path": "/control/eval",
     "json": {"requestId": "r", "tenantId": "t1", "profileId": "p", "datasetId": "d"}},
    {"name": "rebuild string flag", "path": "/control/rebuild",
     "json": {"requestId": "r", "tenantId": "t1", "fullRebuild": "true"}},
    {"name": "rebuild partial", "path": "/control/rebuild",
     "json": {"requestId": "r", "tenantId": "t1", "sourceIds": ["s1", "s2"]}},
    {"name": "rebuild empty sources", "path": "/control/rebuild",
     "json": {"requestId": "r", "tenantId": "t1", "sourceIds": []}},
    {"name": "rebuild full", "path": "/control/rebuild", "json": {"requestId": "r", "tenantId": "t1", "fullRebuild": True},
     "capture": {"wf1": "workflowId", "apr1": "approvalRequestId"}},
    {"name": "list approvals", "method": "GET", "path": "/control/approvals/{wf1}"},
    {"name": "resume while pending", "path": "/control/workflows/{wf1}/resume", "json": {"tenantId": "t1"}},
    {"name": "approve", "path": "/control/approvals/{apr1}/resolve",
     "json": {"decision": "approved", "resolvedBy": "op", "comment": "ok"}},
    {"name": "approve again", "path": "/control/approvals/{apr1}/resolve", "json": {"decision": "approved"}},
    {"name": "resume approved", "path": "/control/workflows/{wf1}/resume", "json": {"tenantId": "t1", "requestId": "rr"}},
    {"name": "resume finished", "path": "/control/workflows/{wf1}/resume", "json": {"tenantId": "t1"}},
    {"name": "rebuild full 2", "path": "/control/rebuild", "json": {"requestId": "r", "tenantId": "t1", "fullRebuild": True},
     "capture": {"wf2": "workflowId", "apr2": "approvalRequestId"}},
    {"name": "reject", "path": "/control/approvals/{apr2}/resolve", "json": {"decision": "rejected", "resolvedBy": "op"}},
    {"name": "resume rejected", "path": "/control/workflows/{wf2}/resume", "json": {"tenantId": "t1", "requestId": "rr"}},
    {"name": "resume rejected again", "path": "/control/workflows/{wf2}/resume", "json": {"tenantId": "t1"}},
    {"name": "rotate missing profile", "path": "/control/rotate-profile", "json": {"tenantId": "t1"}},
    {"name": "rotate", "path": "/control/rotate-profile",
     "json": {"requestId": "r", "tenantId": "t1", "profileId": "p1", "targetVersion": "2.0.0"},
     "capture": {"wf3": "workflowId", "apr3": "approvalRequestId"}},
    {"name": "rotate approve", "path": "/control/approvals/{apr3}/resolve",
     "json": {"decision": "approved", "resolvedBy": "op", "comment": None}},
    {"name": "rotate resume", "path": "/control/workflows/{wf3}/resume",
     "json": {"tenantId": "t1", "requestId": "rr", "input": {"newVersion": "2.0.0", "tenantIds": ["t1"]}}},
    {"name": "rotate without request id", "path": "/control/rotate-profile", "json": {"tenantId": "t1", "profileId": "p2"}},
    {"name": "resume without tenant", "path": "/control/workflows/whatever/resume", "json": {}},
    {"name": "resume unknown", "path": "/control/workflows/rebuild-none/resume", "json": {"tenantId": "t1"}},
    {"name": "approvals for unknown", "method": "GET", "path": "/control/approvals/none"},
    {"name": "encoded param", "method": "GET", "path": "/control/approvals/abc%2Fdef"},
    {"name": "text body ingest", "path": "/control/ingest", "raw": "hello", "headers": {**AUTH, "Content-Type": "text/plain"}},
    {"name": "text body rotate", "path": "/control/rotate-profile", "raw": "hello", "headers": {**AUTH, "Content-Type": "text/plain"}},
    {"name": "no body resolve", "path": "/control/approvals/x/resolve"},
    {"name": "malformed json", "path": "/control/verify", "raw": "{bad", "headers": {**AUTH, "Content-Type": "application/json"}},
    {"name": "scalar json", "path": "/control/verify", "raw": "5", "headers": {**AUTH, "Content-Type": "application/json"}},
    {"name": "null json", "path": "/control/verify", "raw": "null", "headers": {**AUTH, "Content-Type": "application/json"}},
    {"name": "blank json", "path": "/control/verify", "raw": "   ", "headers": {**AUTH, "Content-Type": "application/json"}},
    {"name": "empty json", "path": "/control/verify", "raw": "", "headers": {**AUTH, "Content-Type": "application/json"}},
    {"name": "nan token", "path": "/control/verify", "raw": '{"requestId": NaN}',
     "headers": {**AUTH, "Content-Type": "application/json"}},
    {"name": "array json", "path": "/control/verify", "raw": "[1]", "headers": {**AUTH, "Content-Type": "application/json"}},
    {"name": "latin1 charset", "path": "/control/verify", "raw": "{}",
     "headers": {**AUTH, "Content-Type": "application/json; charset=latin1"}},
    {"name": "malformed json on unknown route", "method": "POST", "path": "/nope", "raw": "{bad",
     "headers": {"Content-Type": "application/json"}},
]

TENANT_STEPS: list[dict[str, Any]] = [
    {"name": "other tenant", "path": "/control/verify", "json": {"requestId": "r", "tenantId": "tenant-b"}},
    {"name": "own tenant", "path": "/control/verify", "json": {"requestId": "r", "tenantId": " tenant-a "}},
    {"name": "no tenant", "path": "/control/verify", "json": {"requestId": "r"}},
    {"name": "full rebuild", "path": "/control/rebuild", "json": {"requestId": "r", "tenantId": "tenant-a", "fullRebuild": True},
     "capture": {"wf": "workflowId", "apr": "approvalRequestId"}},
    {"name": "list own", "method": "GET", "path": "/control/approvals/{wf}"},
    {"name": "list unknown", "method": "GET", "path": "/control/approvals/rebuild-x"},
    {"name": "resolve unknown", "path": "/control/approvals/apr-1-x/resolve", "json": {"decision": "approved"}},
    {"name": "resume other tenant", "path": "/control/workflows/{wf}/resume", "json": {"tenantId": "tenant-b"}},
    {"name": "resolve own", "path": "/control/approvals/{apr}/resolve", "json": {"decision": "approved", "resolvedBy": "op"}},
    {"name": "resume own", "path": "/control/workflows/{wf}/resume", "json": {"tenantId": "tenant-a"}},
]

PROD_STEPS: list[dict[str, Any]] = [
    {"name": "health", "method": "GET", "path": "/health", "auth": False},
    {"name": "readyz", "method": "GET", "path": "/readyz", "auth": False},
    {"name": "verify no auth", "path": "/control/verify", "auth": False, "json": {"requestId": "r", "tenantId": "tenant-a"}},
    {"name": "verify held", "path": "/control/verify", "json": {"requestId": "r", "tenantId": "tenant-a"}},
    {"name": "tenant mismatch first", "path": "/control/rebuild", "json": {"requestId": "r", "tenantId": "tenant-b"}},
    {"name": "approvals held", "method": "GET", "path": "/control/approvals/x"},
]

CONFIGS = {
    "dev": ({"AEF_S2S_SECRET": SECRET}, DEV_STEPS),
    "tenant": ({"AEF_S2S_SECRET": SECRET, "AEF_S2S_TENANT_ID": "tenant-a"}, TENANT_STEPS),
    "prod": ({"AEF_S2S_SECRET": SECRET, "AEF_S2S_TENANT_ID": "tenant-a", "AEF_ENV": "production"}, PROD_STEPS),
}


@pytest.mark.parametrize("config", sorted(CONFIGS))
def test_same_answers(config: str) -> None:
    env, steps = CONFIGS[config]
    _run_both(env, steps)


@pytest.mark.parametrize("env", [
    {"AEF_S2S_SECRET": "   "},
    {"AEF_S2S_SECRET": SECRET, "NODE_ENV": "production"},
    {"AEF_S2S_SECRET": SECRET, "RUNTIME_MODE": "staging"},
], ids=["blank secret", "production without tenant", "invalid runtime mode"])
def test_both_refuse_to_start(env: dict[str, str]) -> None:
    for kind in ("ts", "py"):
        server = Server(kind, env)
        try:
            assert not server.wait_ready(timeout=20), f"{kind} started but should refuse"
            assert server.proc.returncode not in (None, 0)
        finally:
            server.stop()
