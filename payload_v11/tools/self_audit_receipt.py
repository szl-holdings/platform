#!/usr/bin/env python3
"""self_audit_receipt.py — emit this payload run's GovernedAction/v1 receipt.

Hashes the real thread file and the four real specialist reports from the
workspace, records the real gate exit codes by RUNNING the gates, then emits
a receipt envelope labeled UNSIGNED until key management lands.

If a11oy's own synthesis run cannot carry a receipt with honest status,
the whole claim is theater. This tool is the dogfood.

Usage: python3 tools/self_audit_receipt.py [--out PATH]
Exit: 0 always (emission is not a gate); receipt status is inside the JSON.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "lib"))

from receipt import emit_self_audit_receipt, envelope_content_digest  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent          # payload_v11/
WORKSPACE = ROOT.parent                                        # workspace/
THREAD_FILE = (WORKSPACE / "branched_contexts"
               / "c35bf36e-d104-4f09-9f53-8ae1854ded70" / "conversation.jsonl")
REPORTS = ["fe1_surfaces_design.md", "fe2_demo_experience.md",
           "be1_platform.md", "be2_models_kernels.md"]
GATES = ["lexicon_gate.py", "release_gate.py", "spaces_gate.py"]


def sha256_file(path: pathlib.Path) -> str | None:
    if not path.is_file():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run_gate(name: str) -> int:
    proc = subprocess.run(
        [sys.executable, str(ROOT / "tools" / name)],
        capture_output=True, text=True,
    )
    return proc.returncode


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(ROOT / "ledgers" / "SELF_AUDIT_RECEIPT.json"))
    args = ap.parse_args()

    thread_digest = sha256_file(THREAD_FILE)
    report_digests = {}
    for name in REPORTS:
        d = sha256_file(WORKSPACE / "agent_reports" / name)
        report_digests[f"agent_reports/{name}"] = d if d else "UNAVAILABLE"

    gate_codes = {name.removesuffix(".py"): run_gate(name) for name in GATES}

    receipt = emit_self_audit_receipt(
        thread_digest=thread_digest or "UNAVAILABLE",
        report_digests=report_digests,
        gate_exit_codes=gate_codes,
        tool_versions={"szl_yaml": "1.0", "receipt": "1.0", "ledgers": "1.0"},
    )
    receipt["content_digest_sha256"] = envelope_content_digest(receipt["envelope"])

    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(receipt, indent=2) + "\n")

    pred = json.loads(
        __import__("base64").b64decode(receipt["envelope"]["payload"])
    )["predicate"]
    print(f"receipt: {out}")
    print(f"status: {receipt['status']}")
    print(f"thread_digest_sha256: {thread_digest or 'UNAVAILABLE'}")
    print(f"reports hashed: {len(report_digests)}")
    print(f"gate_exit_codes: {gate_codes}")
    print(f"evidence.completeness: {pred['evidence']['completeness']}")
    print(f"human_principal.id: {pred['human_principal']['id']}")
    print(f"anchoring.rekor_v2_entry: {pred['anchoring']['rekor_v2_entry']}")
    print(f"anchoring.rfc3161_token: {pred['anchoring']['rfc3161_token']}")
    print(f"content_digest_sha256: {receipt['content_digest_sha256']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
