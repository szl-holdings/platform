"""``python -m a11oy_fabric_py`` entry point.

Commands:
  list-packs  — List all registered vertical packs
  run         — Run a pack and emit JSON artifact + PCPR proof
  verify      — Verify PCPR proof chain in a directory
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from pydantic import ValidationError

from . import __version__
from .pack import get_registry
from .engine import run_pack, emit_schemas
from .pcpr import verify_directory

EXIT_OK = 0
EXIT_SCHEMA_FAIL = 1
EXIT_PROOF_DRIFT = 2
EXIT_UNKNOWN_PACK = 3


def cmd_list_packs(_args: argparse.Namespace) -> int:
    reg = get_registry()
    packs = reg.list_all()
    payload = {
        "packs": [
            {"slug": p.slug, "vertical": p.vertical, "version": p.version}
            for p in packs
        ]
    }
    print(json.dumps(payload, indent=2))
    return EXIT_OK


def cmd_run(args: argparse.Namespace) -> int:
    try:
        report, report_path, proof_path = run_pack(args.pack, args.mode, args.out)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return EXIT_UNKNOWN_PACK
    except ValidationError as e:
        print(f"Schema validation error: {e}", file=sys.stderr)
        return EXIT_SCHEMA_FAIL

    if args.out:
        emit_schemas(args.out)

    print(f"Pack: {report.packSlug}")
    print(f"Vertical: {report.vertical}")
    print(f"Mode: {report.mode}")
    print(f"Run ID: {report.runId}")
    print(f"Signals: {len(report.signals)}")
    print(f"Actions: {len(report.actions)}")
    print(f"Outcomes: {len(report.outcomes)}")

    if report_path and proof_path:
        print(f"\nArtifacts written:")
        print(f"  Report: {report_path}")
        print(f"  Proof:  {proof_path}")

    return EXIT_OK


def cmd_verify(args: argparse.Namespace) -> int:
    dir_path = Path(args.dir)
    if not dir_path.exists():
        print(f"Error: Directory '{dir_path}' does not exist.", file=sys.stderr)
        return EXIT_SCHEMA_FAIL

    try:
        results = verify_directory(dir_path)
    except ValidationError as e:
        print(f"Schema validation error: {e}", file=sys.stderr)
        return EXIT_SCHEMA_FAIL

    if not results:
        print("No report files found to verify.")
        return EXIT_OK

    all_ok = True
    for path, ok, msg in results:
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {path}: {msg}")
        if not ok:
            all_ok = False

    if all_ok:
        print(f"\nAll {len(results)} report(s) verified successfully.")
        return EXIT_OK
    else:
        failed = sum(1 for _, ok, _ in results if not ok)
        print(f"\n{failed} of {len(results)} report(s) failed verification.")
        return EXIT_PROOF_DRIFT


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="a11oy_fabric_py",
        description="A11oy Fabric — Python substrate engine for vertical intelligence packs",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    subparsers = parser.add_subparsers(dest="cmd")

    subparsers.add_parser("list-packs", help="List all registered vertical packs")

    run_parser = subparsers.add_parser("run", help="Run a vertical pack")
    run_parser.add_argument("--pack", required=True, help="Pack slug (e.g. platform-agentops)")
    run_parser.add_argument(
        "--mode",
        choices=["discovery", "governed", "demo", "autonomous", "supervised"],
        default="discovery",
        help="Execution mode (default: discovery)",
    )
    run_parser.add_argument("--out", default=None, help="Output directory for JSON artifacts")

    verify_parser = subparsers.add_parser("verify", help="Verify PCPR proof chain")
    verify_parser.add_argument("dir", help="Directory containing report + proof files")

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.cmd is None:
        parser.print_help()
        return EXIT_OK

    if args.cmd == "list-packs":
        return cmd_list_packs(args)
    elif args.cmd == "run":
        return cmd_run(args)
    elif args.cmd == "verify":
        return cmd_verify(args)

    return EXIT_OK


if __name__ == "__main__":
    raise SystemExit(main())
