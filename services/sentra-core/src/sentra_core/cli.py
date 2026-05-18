"""JSON-over-stdio CLI for sentra-core, used by the api-server subprocess bridge.

Protocol: one request per invocation. Read a JSON object from stdin, dispatch
to the named op, write a JSON response to stdout, exit 0. Errors are returned
as ``{"error": {"code": str, "message": str}}`` with exit code 1.

Ops:
    threat_model.build       { assets, sources, extra_techniques? }
    posture_drift.compute    { baseline, current }
    incident_response.run    { incident, runbook?, approvals?, runbook_name? }
    evidence_pack.build      { incident_id, items, signer_secret?, topic?, publish? }
    policy_gate.evaluate     { runtime_url, action, subject, fail_mode?, api_token? }
"""

from __future__ import annotations

import base64
import dataclasses
import json
import os
import sys
from typing import Any

from . import evidence_pack as ep
from . import incident_response as ir
from . import policy_gate as pg
from . import posture_drift as pd
from . import threat_model as tm


def _err(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def _op_threat_model(payload: dict) -> dict:
    assets = [tm.Asset(**a) for a in payload["assets"]]
    sources = [
        tm.ThreatSource(
            id=s["id"],
            name=s["name"],
            motivation=s.get("motivation", "unknown"),
            techniques=tuple(s.get("techniques", ())),
            targets=tuple(s.get("targets", ())),
        )
        for s in payload["sources"]
    ]
    g = tm.build_threat_graph(assets, sources, extra_techniques=payload.get("extra_techniques"))
    out = g.to_dict()
    # `findings` is a UI-friendly flattening of `edges`: one row per
    # (asset, source, technique) with a derived severity. We expose it from
    # the API contract so consumers don't have to re-derive it client-side.
    findings: list[dict] = []
    for e in out["edges"]:
        score = float(e.get("score", 0.0))
        if score >= 8.0:
            sev = "critical"
        elif score >= 6.0:
            sev = "high"
        elif score >= 3.0:
            sev = "medium"
        else:
            sev = "low"
        findings.append(
            {
                "technique": e["technique_id"],
                "asset": e["asset_id"],
                "source": e["source_id"],
                "severity": sev,
                "score": score,
            }
        )
    out["findings"] = findings
    return out


def _op_posture_drift(payload: dict) -> dict:
    def snap(d: dict) -> pd.PostureSnapshot:
        return pd.PostureSnapshot(
            snapshot_id=d["snapshot_id"],
            captured_at=d["captured_at"],
            controls=tuple(
                pd.Control(
                    id=c["id"],
                    name=c["name"],
                    severity=c.get("severity", "medium"),
                    state=c.get("state", "enabled"),
                    metadata=c.get("metadata", {}),
                )
                for c in d["controls"]
            ),
        )

    rep = pd.compute_drift(snap(payload["baseline"]), snap(payload["current"]))
    return rep.to_dict()


def _build_policy_gate(payload: dict) -> pg.PolicyGate | None:
    """Resolve a PolicyGate for a state-changing op. Fail-closed by default.

    Resolution order for the a11oy-runtime URL:
      1. payload["policy_runtime_url"]
      2. environment variable ``A11OY_RUNTIME_URL``

    If neither is set the caller MUST opt-out explicitly with
    ``payload["policy_allow_open"] = True`` (intended for internal callers and
    tests). Otherwise this raises :class:`PolicyDeniedError` so the op refuses
    to run — making the gate enforced by default rather than bypassable by
    omission.
    """

    runtime_url = payload.get("policy_runtime_url") or os.environ.get("A11OY_RUNTIME_URL")
    if not runtime_url:
        if payload.get("policy_allow_open") is True:
            return None
        raise pg.PolicyDeniedError(
            pg.PolicyDecision(
                allow=False,
                reason=(
                    "policy_gate not configured: set A11OY_RUNTIME_URL or pass "
                    "policy_runtime_url in the request body. To intentionally "
                    "skip enforcement, set policy_allow_open=true."
                ),
                policy_id="sentra.core.policy_gate.unconfigured",
                evaluated_at=None,
                raw={},
            )
        )
    return pg.PolicyGate(
        runtime_url=runtime_url,
        timeout_s=float(payload.get("policy_timeout_s", 3.0)),
        fail_mode=payload.get("policy_fail_mode", "closed"),
        api_token=payload.get("policy_api_token"),
    )


def _op_incident_response(payload: dict) -> dict:
    inc = ir.Incident(
        id=payload["incident"]["id"],
        title=payload["incident"]["title"],
        severity=payload["incident"]["severity"],
        mitre_techniques=tuple(payload["incident"].get("mitre_techniques", ())),
        affected_assets=tuple(payload["incident"].get("affected_assets", ())),
        metadata=payload["incident"].get("metadata", {}),
    )
    rb_name = payload.get("runbook_name") or payload.get("runbook")
    if not rb_name:
        raise ValueError("runbook_name is required")
    incident_class = rb_name
    runbook = ir.runbook_for(incident_class)
    ctx = ir.RunbookContext(inc, approvals=payload.get("approvals", {}))
    sink_url = payload.get("yawar_url")
    sink: ir.EventSink
    if sink_url:
        sink = ir.YawarHTTPEventSink(base_url=sink_url)
    else:
        sink = ir.InMemoryEventSink()
    gate = _build_policy_gate(payload)
    res = ir.execute(runbook, ctx, sink, policy_gate=gate)
    return res.to_dict()


def _op_evidence_pack(payload: dict) -> dict:
    items: list[ep.EvidenceItem] = []
    for it in payload["items"]:
        if "payload_b64" in it:
            data = base64.b64decode(it["payload_b64"])
        else:
            data = (it.get("payload") or "").encode()
        items.append(
            ep.EvidenceItem(
                id=it["id"],
                kind=it["kind"],
                description=it.get("description", ""),
                payload=data,
                collected_at=it.get("collected_at", 0.0),
                metadata=it.get("metadata", {}),
            )
        )

    if "signer_secret" in payload:
        signer = ep.HMACSigner(secret=payload["signer_secret"].encode())
    else:
        signer = ep.HMACSigner.from_env(
            allow_dev_default=bool(payload.get("allow_dev_signer", False)),
        )

    # Pack-hash publication to the yawar topic is the default behaviour per
    # the payload spec; only attempted when ``yawar_url`` is configured and
    # ``publish`` is not explicitly disabled. We report the actual outcome
    # back so the UI/operator can render a truthful "published" claim.
    publisher: ep.YawarHTTPPublisher | None = None
    publish = payload.get("publish", True)
    yawar_url = payload.get("yawar_url")
    if publish and yawar_url:
        publisher = ep.YawarHTTPPublisher(base_url=yawar_url)

    gate = _build_policy_gate(payload)
    pack = ep.build_pack(
        incident_id=payload["incident_id"],
        items=items,
        signer=signer,
        pack_id=payload.get("pack_id"),
        publisher=publisher,
        topic=payload.get("topic", "sentra.evidence"),
        policy_gate=gate,
    )
    out = pack.to_dict()
    if publisher is None:
        out["publication"] = {"attempted": False, "ok": False, "reason": "no_publisher_configured"}
    elif publisher.last_error:
        out["publication"] = {"attempted": True, "ok": False, "reason": publisher.last_error}
    else:
        out["publication"] = {"attempted": True, "ok": True, "topic": payload.get("topic", "sentra.evidence")}
    return out


def _op_policy_gate(payload: dict) -> dict:
    gate = pg.PolicyGate(
        runtime_url=payload["runtime_url"],
        timeout_s=float(payload.get("timeout_s", 3.0)),
        fail_mode=payload.get("fail_mode", "closed"),
        api_token=payload.get("api_token"),
    )
    decision = gate.evaluate(payload["action"], payload["subject"])
    return dataclasses.asdict(decision)


_OPS = {
    "threat_model.build": _op_threat_model,
    "posture_drift.compute": _op_posture_drift,
    "incident_response.run": _op_incident_response,
    "evidence_pack.build": _op_evidence_pack,
    "policy_gate.evaluate": _op_policy_gate,
}


def main(argv: list[str] | None = None) -> int:
    raw = sys.stdin.read()
    try:
        req = json.loads(raw)
    except json.JSONDecodeError as exc:
        sys.stdout.write(json.dumps(_err("invalid_json", str(exc))))
        return 1
    op = req.get("op")
    if op not in _OPS:
        sys.stdout.write(json.dumps(_err("unknown_op", f"op {op!r} not registered")))
        return 1
    try:
        result = _OPS[op](req.get("payload", {}))
    except Exception as exc:  # noqa: BLE001
        sys.stdout.write(json.dumps(_err(type(exc).__name__, str(exc))))
        return 1
    sys.stdout.write(json.dumps({"ok": True, "op": op, "result": result}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
