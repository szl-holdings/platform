"""Differential test of the workflow runtime itself: every step output, not just HTTP responses.

Completed workflows delete their checkpoints, so chunk plans and actor outputs never reach the
HTTP surface. This test runs `createWorkflowMachine(kind).run(ctx)` from the original
`@workspace/aef-workflow-runtime` and the Python port on the same contexts and compares the
status, every completed step and the final output. Same environment variables as test_parity.py.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

import pytest

from aef_ingest_control.jscompat import stringify
from aef_ingest_control.workflow_runtime import FileApprovalStore, FileCheckpointStore, create_workflow_machine

from test_parity import NODE, TS_DIR, Normalizer

pytestmark = pytest.mark.skipif(not (NODE and TS_DIR), reason="original TypeScript service not available")

_TS_RUNNER = """
import { createWorkflowMachine, InMemoryApprovalStore, InMemoryCheckpointStore } from '@workspace/aef-workflow-runtime';
let raw = '';
for await (const chunk of process.stdin) raw += chunk;
const results = [];
for (const c of JSON.parse(raw)) {
  try {
    const r = await createWorkflowMachine(c.kind).run(c.ctx, {
      checkpointStore: new InMemoryCheckpointStore(), approvalStore: new InMemoryApprovalStore() });
    results.push({ status: r.status, completedSteps: r.completedSteps, finalOutput: r.finalOutput,
                   approval: r.approvalRequestId ?? null });
  } catch (err) {
    results.push({ thrown: err instanceof Error ? err.message : String(err) });
  }
}
process.stdout.write(JSON.stringify(results));
"""

_MESSY = "  a\r\nb\tc   d  e f \U0001F600 g\n\n h ﻿"


def _ctx(workflow_id: str, inp: dict[str, Any], approval: bool = False, tenant: Any = "t1") -> dict[str, Any]:
    return {"workflowId": workflow_id, "tenantId": tenant, "requestedBy": "r", "input": inp,
            "approvalRequired": approval}


def _ingest(n: int, content: str, size: int, overlap: int, **extra: Any) -> dict[str, Any]:
    return {"kind": "ingest_document", "ctx": _ctx(f"ingest-{n}", {
        "sourceId": f"s{n}", "content": content, "contentType": "text/plain",
        "chunkSize": size, "chunkOverlap": overlap, "metadata": {}, **extra})}


CASES: list[dict[str, Any]] = [
    _ingest(1, _MESSY, 3, 1),
    _ingest(2, " ".join(f"w{i}" for i in range(50)), 5, 2),
    _ingest(3, " ".join(f"w{i}" for i in range(50)), 7, 0),
    _ingest(4, "a b c d e f g", 2, 5),
    _ingest(5, "a b c d e f g", 1, 0),
    _ingest(6, "one", 512, 64),
    _ingest(7, "x " * 2000, 600, 10, truncationPolicy={"strategy": "reject", "maxTokens": 512}),
    _ingest(8, "x " * 700, 600, 10, truncationPolicy={"strategy": "truncate", "maxTokens": 512}),
    _ingest(9, "中文 text" * 300, 512, 64),
    {"kind": "rebuild_index", "ctx": _ctx("rebuild-1", {"fullRebuild": False, "sourceIds": ["a", "b", "c"]})},
    {"kind": "rebuild_index", "ctx": _ctx("rebuild-2", {"fullRebuild": False, "sourceIds": []})},
    {"kind": "rebuild_index", "ctx": _ctx("rebuild-3", {"fullRebuild": False})},
    {"kind": "rebuild_index", "ctx": _ctx("rebuild-4", {"fullRebuild": True}, approval=True)},
    {"kind": "rebuild_index", "ctx": _ctx("rebuild-5", {"fullRebuild": True}, approval=False)},
    {"kind": "rebuild_index", "ctx": _ctx("rebuild-6", {"sourceIds": "abc"})},
    {"kind": "rebuild_index", "ctx": _ctx("rebuild-7", {"sourceIds": 5})},
    {"kind": "verify_index_health", "ctx": _ctx("verify-1", {})},
    {"kind": "verify_index_health", "ctx": _ctx("verify-2", {"expectedChunks": "12"})},
    {"kind": "verify_index_health", "ctx": _ctx("verify-3", {"expectedChunks": "abc"})},
    {"kind": "run_retrieval_eval", "ctx": _ctx("eval-1", {"profileId": "p", "datasetId": "d"})},
    {"kind": "run_retrieval_eval", "ctx": _ctx("eval-2", {"queries": [1, 2, 3]})},
    {"kind": "run_retrieval_eval", "ctx": _ctx("eval-3", {"queryCount": "4"})},
    {"kind": "rotate_profile_version", "ctx": _ctx("rotate-1", {"profileId": "p", "newVersion": "2.0.0"}, approval=True)},
    {"kind": "rotate_profile_version", "ctx": _ctx("rotate-2", {"profileId": "p", "previousVersion": "1.0.0",
                                                               "newVersion": "2.0.0", "tenantIds": ["t1"]})},
    {"kind": "verify_index_health", "ctx": _ctx("verify-4", {}, tenant=7)},
]


def _python_results(tmp_path: Path) -> list[Any]:
    results = []
    for index, case in enumerate(CASES):
        try:
            run = create_workflow_machine(case["kind"]).run(
                json.loads(json.dumps(case["ctx"])),
                FileCheckpointStore(str(tmp_path / f"c{index}.json")),
                FileApprovalStore(str(tmp_path / f"a{index}.json")))
            results.append({"status": run.status, "completedSteps": run.completed_steps,
                            "finalOutput": run.final_output, "approval": run.approval_request_id})
        except Exception as error:  # noqa: BLE001 - mirrors the runner's catch
            results.append({"thrown": str(error.args[0]) if error.args else str(error)})
    return json.loads(stringify(results))


def _typescript_results(tmp_path: Path) -> list[Any]:
    script = Path(TS_DIR, f"runtime-parity-{tmp_path.name}.ts")
    script.write_text(_TS_RUNNER, encoding="utf-8")
    try:
        done = subprocess.run([NODE, "--conditions=development", "--import", "tsx", script.name], cwd=TS_DIR,
                              input=json.dumps(CASES), capture_output=True, text=True, timeout=120, check=True)
    finally:
        script.unlink()
    return json.loads(done.stdout)


def test_every_step_output_matches(tmp_path: Path) -> None:
    ts_results = Normalizer().value(_typescript_results(tmp_path))
    py_results = Normalizer().value(_python_results(tmp_path))
    differences = [
        f"case {CASES[i]['ctx']['workflowId']}:\n  ts={ts}\n  py={py}"
        for i, (ts, py) in enumerate(zip(ts_results, py_results)) if ts != py
    ]
    assert len(ts_results) == len(py_results) == len(CASES)
    assert not differences, f"{len(differences)} difference(s):\n" + "\n".join(differences)
