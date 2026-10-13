"""Command-line entry point for the Packet 6 compiler.

Both the package subcommands and the captured Packet 6 flag interface are
supported. The two forms intentionally execute the same implementation.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Sequence

from .compiler import canonical_json_bytes, compile_profile
from .validation import ValidationError, load_profile, validate_profile


def _subcommand_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="szl-vertical-cell-compiler-v6")
    commands = parser.add_subparsers(dest="command", required=True)
    validate = commands.add_parser("validate", help="validate a Packet 6 profile")
    validate.add_argument("profile", type=Path)
    compile_command = commands.add_parser("compile", help="compile all seven cells")
    compile_command.add_argument("profile", type=Path)
    compile_command.add_argument("vertical_dir", type=Path)
    compile_command.add_argument("out_dir", type=Path)
    compile_command.add_argument("--clean", action="store_true")
    return parser


def _captured_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="szl-vertical-cell-compiler-v6",
        description="Validate or compile a Packet 6 profile using captured flags.",
    )
    parser.add_argument("--profile", required=True, type=Path)
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--vertical-dir", type=Path)
    parser.add_argument("--out", dest="out_dir", type=Path)
    parser.add_argument("--clean", action="store_true")
    return parser


def _validation_report(profile_path: Path) -> tuple[dict[str, object], int]:
    issues = validate_profile(load_profile(profile_path))
    report: dict[str, object] = {
        "issues": issues,
        "schema": "szl.vertical-profile-validation/v1",
        "status": "PASS" if not issues else "BLOCKED",
    }
    return report, 0 if not issues else 1


def _run_captured(args: argparse.Namespace, parser: argparse.ArgumentParser) -> int:
    if args.validate_only:
        if args.vertical_dir is not None or args.out_dir is not None or args.clean:
            parser.error(
                "--validate-only cannot be combined with --vertical-dir, --out, or --clean"
            )
        report, exit_code = _validation_report(args.profile)
        sys.stdout.buffer.write(canonical_json_bytes(report))
        return exit_code
    if args.vertical_dir is None or args.out_dir is None:
        parser.error("compilation requires both --vertical-dir and --out")
    result = compile_profile(
        args.profile,
        args.vertical_dir,
        args.out_dir,
        clean=args.clean,
    )
    sys.stdout.buffer.write(canonical_json_bytes(result))
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    arguments = list(sys.argv[1:] if argv is None else argv)
    try:
        if arguments and arguments[0] in {"validate", "compile"}:
            parser = _subcommand_parser()
            args = parser.parse_args(arguments)
            if args.command == "validate":
                report, exit_code = _validation_report(args.profile)
                sys.stdout.buffer.write(canonical_json_bytes(report))
                return exit_code
            result = compile_profile(
                args.profile,
                args.vertical_dir,
                args.out_dir,
                clean=args.clean,
            )
            sys.stdout.buffer.write(canonical_json_bytes(result))
            return 0

        parser = _captured_parser()
        return _run_captured(parser.parse_args(arguments), parser)
    except (OSError, ValidationError, ValueError, json.JSONDecodeError) as error:
        sys.stderr.buffer.write(
            canonical_json_bytes(
                {
                    "error": str(error),
                    "schema": "szl.vertical-compiler-error/v1",
                    "status": "BLOCKED",
                }
            )
        )
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
