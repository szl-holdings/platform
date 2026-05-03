"""``python -m a11oy_fabric_py`` — list-packs / run / verify.

Exit codes:
  0 — ok
  1 — schema validation failed
  2 — proof drift / chain mismatch
  3 — missing or unknown pack
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Any

import structlog
from pydantic import ValidationError

from .layers import default_layer_bundle
from .models import PackRunReport
from .pack import PackContext, get_registry, run_pack
from .proof import ProofChain, build_proof_chain, verify_proof_chain
from .schema_export import write_all_schemas
from .types import ENGINE_VERSION, SUBSTRATE_REPORTS_ROOT, ExecutionMode

_log = structlog.get_logger(__name__)


EXIT_OK = 0
EXIT_SCHEMA_FAIL = 1
EXIT_PROOF_DRIFT = 2
EXIT_MISSING_PACK = 3


def _utc_slug() -> str:
    # ISO-8601 UTC suitable for use as a filename.
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _new_run_id(pack_slug: str) -> str:
    return f"{pack_slug}-{_utc_slug()}-{uuid.uuid4().hex[:8]}"


def _cmd_list_packs(_args: argparse.Namespace) -> int:
    reg = get_registry()
    print(json.dumps(
        {
            "engineVersion": ENGINE_VERSION,
            "packs": [
                {"slug": p.slug, "vertical": p.vertical, "version": p.version}
                for p in reg.list()
            ],
        },
        indent=2,
    ))
    return EXIT_OK


def _cmd_run(args: argparse.Namespace) -> int:
    reg = get_registry()
    if not reg.has(args.pack):
        print(f"unknown pack: {args.pack!r}", file=sys.stderr)
        return EXIT_MISSING_PACK

    mode: ExecutionMode = args.mode  # type: ignore[assignment]
    pack = reg.get(args.pack)
    out_root = args.out

    # 1. Always re-write the JSON Schema directory so consumers stay in sync.
    write_all_schemas(out_root)

    # 2. Execute the pack.
    ctx = PackContext(
        run_id=_new_run_id(pack.slug),
        mode=mode,
        layers=default_layer_bundle(),
    )

    try:
        report, _discovery = run_pack(pack, ctx)
    except ValidationError as exc:
        print(f"schema validation failed during run: {exc}", file=sys.stderr)
        return EXIT_SCHEMA_FAIL

    # 3. Validate the report serialises back through the schema.
    try:
        PackRunReport.model_validate(json.loads(report.model_dump_json()))
    except ValidationError as exc:
        print(f"emitted report failed schema round-trip: {exc}", file=sys.stderr)
        return EXIT_SCHEMA_FAIL

    # 4. Build the PCPR companion.
    entity_ids: list[tuple[str, str]] = []
    for s in report.signals:
        entity_ids.append(("signal", s.id))
    for o in report.outcomes:
        entity_ids.append(("outcome", o.id))
    for a in report.actions:
        entity_ids.append(("action", a.id))
    for p in report.policies:
        entity_ids.append(("policy", p.id))
    for t in report.twins:
        entity_ids.append(("twin", t.id))
    for pp in report.proofPackets:
        entity_ids.append(("proofPacket", pp.id))

    chain = build_proof_chain(
        pack_slug=pack.slug,
        pack_version=pack.version,
        run_id=ctx.run_id,
        input_fingerprint=report.inputFingerprint,
        entity_ids=entity_ids,
        extra={
            "signalCount": len(report.signals),
            "actionCount": len(report.actions),
            "policyCount": len(report.policies),
        },
    )

    # 5. Persist both files.
    pack_dir = os.path.join(out_root, pack.slug)
    os.makedirs(pack_dir, exist_ok=True)
    file_slug = f"{ctx.run_id}"
    json_path = os.path.join(pack_dir, f"{file_slug}.json")
    proof_path = os.path.join(pack_dir, f"{file_slug}.proof.json")

    with open(json_path, "w", encoding="utf-8") as f:
        f.write(report.model_dump_json(indent=2))
        f.write("\n")
    with open(proof_path, "w", encoding="utf-8") as f:
        f.write(chain.model_dump_json(indent=2))
        f.write("\n")

    print(json.dumps({
        "ok": True,
        "pack": pack.slug,
        "vertical": pack.vertical,
        "mode": mode,
        "runId": ctx.run_id,
        "report": json_path,
        "proof": proof_path,
        "headHash": chain.headHash,
        "counts": {
            "signals": len(report.signals),
            "outcomes": len(report.outcomes),
            "actions": len(report.actions),
            "policies": len(report.policies),
            "twins": len(report.twins),
            "proofPackets": len(report.proofPackets),
        },
    }, indent=2))
    return EXIT_OK


def _verify_one_pair(json_path: str, proof_path: str) -> tuple[bool, dict[str, Any]]:
    info: dict[str, Any] = {"report": json_path, "proof": proof_path}
    if not os.path.exists(proof_path):
        info["ok"] = False
        info["reason"] = "missing .proof.json companion"
        return False, info

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            report = PackRunReport.model_validate_json(f.read())
    except (ValidationError, json.JSONDecodeError) as exc:
        info["ok"] = False
        info["reason"] = f"report schema invalid: {exc}"
        info["category"] = "schema"
        return False, info

    try:
        with open(proof_path, "r", encoding="utf-8") as f:
            chain = ProofChain.model_validate_json(f.read())
    except (ValidationError, json.JSONDecodeError) as exc:
        info["ok"] = False
        info["reason"] = f"proof schema invalid: {exc}"
        info["category"] = "schema"
        return False, info

    res = verify_proof_chain(chain)
    if not res.ok:
        info["ok"] = False
        info["reason"] = res.reason
        info["category"] = "proof"
        return False, info

    if chain.runId != report.runId:
        info["ok"] = False
        info["reason"] = "runId mismatch between report and proof"
        info["category"] = "proof"
        return False, info
    if chain.inputFingerprint != report.inputFingerprint:
        info["ok"] = False
        info["reason"] = "inputFingerprint mismatch between report and proof"
        info["category"] = "proof"
        return False, info

    info["ok"] = True
    info["headHash"] = chain.headHash
    info["runId"] = chain.runId
    return True, info


def _cmd_verify(args: argparse.Namespace) -> int:
    target = args.path
    pairs: list[tuple[str, str]] = []

    if os.path.isfile(target):
        if not target.endswith(".json") or target.endswith(".proof.json"):
            print("verify <path>: pass a report .json or a directory", file=sys.stderr)
            return EXIT_SCHEMA_FAIL
        proof = target.removesuffix(".json") + ".proof.json"
        pairs.append((target, proof))
    elif os.path.isdir(target):
        for root, _dirs, files in os.walk(target):
            if "_schema" in root.split(os.sep):
                continue
            for fn in files:
                if fn.endswith(".json") and not fn.endswith(".proof.json"):
                    json_path = os.path.join(root, fn)
                    proof_path = json_path.removesuffix(".json") + ".proof.json"
                    pairs.append((json_path, proof_path))
    else:
        print(f"path not found: {target}", file=sys.stderr)
        return EXIT_SCHEMA_FAIL

    results: list[dict[str, Any]] = []
    schema_failures = 0
    proof_failures = 0
    for j, p in pairs:
        ok, info = _verify_one_pair(j, p)
        results.append(info)
        if not ok:
            if info.get("category") == "schema":
                schema_failures += 1
            else:
                proof_failures += 1

    summary = {
        "checked": len(results),
        "passed": sum(1 for r in results if r.get("ok")),
        "schemaFailures": schema_failures,
        "proofFailures": proof_failures,
        "results": results,
    }
    print(json.dumps(summary, indent=2))

    if schema_failures:
        return EXIT_SCHEMA_FAIL
    if proof_failures:
        return EXIT_PROOF_DRIFT
    return EXIT_OK


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="a11oy_fabric_py",
        description="A11oy Python Substrate Engine — discovery / governed pack runs with PCPR proofs.",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    sp_list = sub.add_parser("list-packs", help="List every registered vertical pack.")
    sp_list.set_defaults(func=_cmd_list_packs)

    sp_run = sub.add_parser("run", help="Run a single vertical pack.")
    sp_run.add_argument("--pack", required=True, help="Pack slug, e.g. platform-agentops")
    sp_run.add_argument(
        "--mode",
        choices=["discovery", "governed"],
        default="discovery",
        help="Two-plane execution model: discovery is read-only, governed runs the covenant gate.",
    )
    sp_run.add_argument(
        "--out",
        default=SUBSTRATE_REPORTS_ROOT,
        help="Output root directory (default: reports/a11oy-substrate).",
    )
    sp_run.set_defaults(func=_cmd_run)

    sp_verify = sub.add_parser(
        "verify",
        help="Re-hash every PCPR proof under <path> and report drift.",
    )
    sp_verify.add_argument("path", help="A directory of pack runs or a single .json report.")
    sp_verify.set_defaults(func=_cmd_verify)

    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)
