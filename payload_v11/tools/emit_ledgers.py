#!/usr/bin/env python3
"""emit_ledgers.py — write CLAIMS_LEDGER.yaml + COMMERCIAL_LEDGER.yaml.

Uses the hand-rolled emitter (lib/szl_yaml.py). No PyYAML. Every None
renders as the literal string UNKNOWN. Run from the payload_v11 dir:

    python3 tools/emit_ledgers.py            # writes ledgers/ next to tools/
    python3 tools/emit_ledgers.py --out DIR  # writes to DIR
"""

from __future__ import annotations

import argparse
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "lib"))

import szl_yaml  # noqa: E402
from ledgers import CLAIMS, commercial_ledger_rows  # noqa: E402

AUDIT_DATE = "2026-08-30"


def claims_document() -> dict:
    return {
        "ledger": "CLAIMS_LEDGER",
        "version": 11,
        "generated_by": "payload_v11/tools/emit_ledgers.py",
        "audit_date": AUDIT_DATE,
        "truth_states": {
            "VERIFIED": "independently checked against a live endpoint, API, or primary document; evidence_uri attached",
            "MEASURED": "observed by our own instruments on the stated date; evidence attached; degrades toward UNKNOWN as it stales",
            "UNKNOWN": "the only honest default; a public claim without evidence auto-demotes here",
        },
        "auto_demotion_rule": "public_allowed=true without evidence_uri forces state UNKNOWN at construction time",
        "claims": [c.as_dict() for c in CLAIMS],
    }


def commercial_document() -> dict:
    return {
        "ledger": "COMMERCIAL_LEDGER",
        "version": 11,
        "generated_by": "payload_v11/tools/emit_ledgers.py",
        "audit_date": AUDIT_DATE,
        "rule": ("every row is UNKNOWN and every row sets blocks_raise=true; "
                 "no model, agent, or payload may invent these values; "
                 "release_gate.py exits non-zero until a human supplies them with evidence"),
        "rows": commercial_ledger_rows(),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    default_out = pathlib.Path(__file__).resolve().parent.parent / "ledgers"
    ap.add_argument("--out", default=str(default_out))
    args = ap.parse_args()
    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    claims_path = out / "CLAIMS_LEDGER.yaml"
    commercial_path = out / "COMMERCIAL_LEDGER.yaml"
    claims_path.write_text(szl_yaml.dump_document(claims_document()))
    commercial_path.write_text(szl_yaml.dump_document(commercial_document()))

    demoted = [c.id for c in CLAIMS if any("auto-demoted" in n for n in c.notes)]
    print(f"wrote {claims_path} ({len(CLAIMS)} claims; auto-demoted: {demoted or 'none'})")
    print(f"wrote {commercial_path} ({len(commercial_ledger_rows())} rows; all UNKNOWN; all blocks_raise=true)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
