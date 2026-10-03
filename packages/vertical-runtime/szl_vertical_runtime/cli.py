"""Dependency-free command line interface for the vertical runtime."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Sequence

from .canonical import canonical_json, read_json, write_json
from .ledger import OutcomeLedger
from .policy import DecisionEngine, scenario_forge
from .release import validate_release
from .service import load_cells, serve


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MANIFESTS = REPOSITORY_ROOT / "apps" / "vertical-cells" / "manifests"
DEFAULT_LEDGER = (
    Path(__file__).resolve().parents[1] / "var" / "vertical-runtime.sqlite3"
)


def _json_object(path: str | Path) -> dict[str, Any]:
    value = read_json(path)
    if not isinstance(value, dict):
        raise ValueError(f"expected a JSON object: {path}")
    return value


def _emit(value: Any) -> None:
    sys.stdout.write(canonical_json(value))


def _auth_token(path: Path | None) -> str | None:
    if path is None:
        return None
    if path.is_symlink() or not path.is_file():
        raise ValueError("authorization token path must be a regular file")
    token = path.read_text(encoding="utf-8")
    if token.endswith("\r\n"):
        token = token[:-2]
    elif token.endswith("\n"):
        token = token[:-1]
    return token


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="szl-vertical-runtime",
        description="Fail-closed Packet 6 recommendation and evidence runtime.",
    )
    subcommands = parser.add_subparsers(dest="command", required=True)

    serve_parser = subcommands.add_parser("serve", help="serve the loopback HTTP API")
    serve_parser.add_argument("--host", default="127.0.0.1")
    serve_parser.add_argument("--port", type=int, default=8766)
    serve_parser.add_argument("--manifests", type=Path, default=DEFAULT_MANIFESTS)
    serve_parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER)
    serve_parser.add_argument(
        "--auth-token-file",
        type=Path,
        help="regular file containing the local bearer token; POST is disabled when omitted",
    )
    serve_parser.add_argument("--source-revision")

    evaluate = subcommands.add_parser("evaluate", help="evaluate and record a request")
    evaluate.add_argument("vertical_id")
    evaluate.add_argument("request", type=Path)
    evaluate.add_argument("--manifests", type=Path, default=DEFAULT_MANIFESTS)
    evaluate.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER)
    evaluate.add_argument("--log-only", action="store_true")

    outcome = subcommands.add_parser(
        "record-outcome", help="record an observed outcome"
    )
    outcome.add_argument("vertical_id")
    outcome.add_argument("decision_id")
    outcome.add_argument("outcome", type=Path)
    outcome.add_argument("--manifests", type=Path, default=DEFAULT_MANIFESTS)
    outcome.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER)

    verify = subcommands.add_parser(
        "verify-ledger", help="verify the complete ledger chain"
    )
    verify.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER)

    backup = subcommands.add_parser(
        "backup-ledger", help="create and verify a SQLite backup"
    )
    backup.add_argument("destination", type=Path)
    backup.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER)

    release = subcommands.add_parser(
        "validate-release",
        help="validate local source structure; never admit deployment readiness",
    )
    release.add_argument("release", type=Path)
    release.add_argument("--cell", type=Path)

    forge = subcommands.add_parser(
        "forge-scenarios", help="emit deterministic synthetic scenarios"
    )
    forge.add_argument("cell", type=Path)
    forge.add_argument("--output", type=Path)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        if args.command == "serve":
            serve(
                host=args.host,
                port=args.port,
                manifest_dir=args.manifests,
                ledger_path=args.ledger,
                authorization_token=_auth_token(args.auth_token_file),
                source_revision=args.source_revision,
            )
            return 0
        if args.command in {"evaluate", "record-outcome"}:
            cells = load_cells(args.manifests)
            ledger = OutcomeLedger(args.ledger)
            engine = DecisionEngine(cells, ledger=ledger)
            if args.command == "evaluate":
                result = engine.evaluate(
                    args.vertical_id,
                    _json_object(args.request),
                    mode="LOG_ONLY" if args.log_only else "ENFORCE",
                )
            else:
                result = engine.record_outcome(
                    vertical_id=args.vertical_id,
                    decision_id=args.decision_id,
                    outcome=_json_object(args.outcome),
                )
            _emit(result)
            return 0
        if args.command == "verify-ledger":
            result = OutcomeLedger(args.ledger).verify()
            _emit(result)
            return 0 if result["status"] in {"EMPTY", "VERIFIED"} else 1
        if args.command == "backup-ledger":
            _emit(OutcomeLedger(args.ledger).backup(args.destination))
            return 0
        if args.command == "validate-release":
            release = _json_object(args.release)
            cell = _json_object(args.cell) if args.cell else None
            result = validate_release(release, cell=cell)
            _emit(result)
            return 0 if result["status"] == "PASS" else 1
        if args.command == "forge-scenarios":
            scenarios = scenario_forge(_json_object(args.cell))
            payload = {
                "scenarios": scenarios,
                "schema": "szl.vertical-scenario-forge/v1",
                "synthetic_only": True,
            }
            if args.output:
                write_json(args.output, payload)
            _emit(payload)
            return 0
        raise AssertionError("unhandled command")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        sys.stderr.write(
            canonical_json(
                {
                    "error": {"code": "COMMAND_FAILED", "message": str(error)},
                    "schema": "szl.vertical-runtime-cli-error/v1",
                }
            )
        )
        return 2
