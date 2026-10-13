from __future__ import annotations

import json
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from szl_factory import compile_profile


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
RUNTIME_ROOT = REPOSITORY_ROOT / "packages" / "vertical-runtime"
sys.path.insert(0, str(RUNTIME_ROOT))

from szl_vertical_runtime.canonical import digest_value, tree_digest  # noqa: E402
from szl_vertical_runtime.receipts import validate_receipt  # noqa: E402
from szl_vertical_runtime.release import (  # noqa: E402
    build_source_only_release,
    validate_compiled_release_plan,
    validate_release,
)
from szl_vertical_runtime.service import build_server  # noqa: E402

APP_ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = REPOSITORY_ROOT / "apps" / "vertical-cells" / "manifests"


def checked_in_profile() -> dict[str, object]:
    registry = json.loads(
        (APP_ROOT / "registries" / "formula_bindings.json").read_text(encoding="utf-8")
    )
    cells = [
        json.loads(path.read_text(encoding="utf-8"))
        for path in sorted(MANIFESTS.glob("*.json"))
    ]
    return {
        "captured_at": registry["captured_at"],
        "counts": {"vertical_cells": len(cells)},
        "formula_bindings": registry["formulas"],
        "schema": "szl.estate-vertical-factory-profile/v6",
        "vertical_cells": cells,
    }


class RuntimeContractIntegrationTests(unittest.TestCase):
    def _call(
        self,
        base_url: str,
        token: str,
        path: str,
        *,
        method: str = "GET",
        payload: dict[str, object] | None = None,
    ) -> tuple[int, dict[str, object]]:
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        headers = {"Authorization": f"Bearer {token}"}
        if data is not None:
            headers["Content-Type"] = "application/json"
        request = Request(
            base_url + path,
            data=data,
            headers=headers,
            method=method,
        )
        try:
            response = urlopen(request, timeout=5)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def test_compile_serve_receipt_restart_and_source_release(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile_value = checked_in_profile()
            profile = root / "profile.json"
            profile.write_text(json.dumps(profile_value), encoding="utf-8")
            source = root / "source"
            compiled = root / "compiled"
            first = compile_profile(profile, source, compiled)
            second = compile_profile(
                profile, root / "source-second", root / "compiled-second"
            )
            self.assertEqual(first, second)
            self.assertEqual(first["source_tree_sha256"], tree_digest(source))
            self.assertEqual(first["tree_sha256"], tree_digest(compiled))

            vertical_id = "lyte-services"
            source_cell = json.loads(
                (source / f"{vertical_id}.json").read_text(encoding="utf-8")
            )
            source_digest = digest_value(source_cell)
            self.assertEqual(
                source_digest,
                json.loads(
                    (compiled / vertical_id / "vertical_manifest.json").read_text(
                        encoding="utf-8"
                    )
                )["source_manifest_sha256"],
            )

            release_plan = json.loads(
                (compiled / vertical_id / "space_release_plan.json").read_text(
                    encoding="utf-8"
                )
            )
            plan_report = validate_compiled_release_plan(
                release_plan,
                cell=source_cell,
                source_manifest_sha256=source_digest,
                captured_at=profile_value["captured_at"],
            )
            self.assertEqual(plan_report["status"], "PASS")
            self.assertFalse(plan_report["operational_claim_verified"])

            receipt_schema = json.loads(
                (compiled / vertical_id / "receipt.schema.json").read_text(
                    encoding="utf-8"
                )
            )
            route_contract = json.loads(
                (compiled / vertical_id / "route_contract.json").read_text(
                    encoding="utf-8"
                )
            )
            evaluate_path = route_contract["routes"][1]["path"]
            token = "packet6-integration-token-" + "a" * 48
            ledger = root / "ledger.sqlite3"
            server = build_server(
                host="127.0.0.1",
                port=0,
                manifest_dir=MANIFESTS,
                ledger_path=ledger,
                authorization_token=token,
                source_revision="a" * 40,
            )
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base_url = f"http://127.0.0.1:{server.server_port}"
            try:
                evaluation = {
                    "request": {
                        "action": source_cell["allowed_actions"][0],
                        "evidence": [
                            {
                                "digest": "sha256:" + "b" * 64,
                                "evidence_class": "MODELED",
                                "freshness": "CURRENT",
                                "id": "synthetic-evidence-1",
                                "limitations": ["SYNTHETIC_FIXTURE"],
                            }
                        ],
                        "principal": {
                            "authority_claims": [],
                            "id": "operator-1",
                        },
                        "request_id": "packet6-integration-1",
                        "workflow": source_cell["core_workflows"][0],
                    },
                    "vertical_id": vertical_id,
                }
                status, receipt = self._call(
                    base_url,
                    token,
                    evaluate_path,
                    method="POST",
                    payload=evaluation,
                )
                self.assertEqual(status, 200)
                self.assertEqual(set(receipt), set(receipt_schema["required"]))
                validate_receipt(receipt, source_manifest_sha256=source_digest)
                self.assertFalse(receipt["execution_permitted"])

                receipt_path = route_contract["routes"][3]["path"].replace(
                    "{receipt_id}", str(receipt["receipt_id"])
                )
                stored_status, stored = self._call(base_url, token, receipt_path)
                self.assertEqual(stored_status, 200)
                self.assertEqual(stored, receipt)
                production_status, production = self._call(
                    base_url, token, "/production-readyz"
                )
                self.assertEqual(production_status, 503)
                self.assertFalse(production["production_ready"])
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)

            restarted = build_server(
                host="127.0.0.1",
                port=0,
                manifest_dir=MANIFESTS,
                ledger_path=ledger,
                authorization_token=token,
                source_revision="a" * 40,
            )
            restarted_thread = threading.Thread(
                target=restarted.serve_forever, daemon=True
            )
            restarted_thread.start()
            try:
                restart_url = f"http://127.0.0.1:{restarted.server_port}"
                restart_status, restart_receipt = self._call(
                    restart_url, token, receipt_path
                )
                self.assertEqual(restart_status, 200)
                self.assertEqual(restart_receipt, receipt)
            finally:
                restarted.shutdown()
                restarted.server_close()
                restarted_thread.join(timeout=5)

            source_release = build_source_only_release(
                release_plan,
                cell=source_cell,
                source_manifest_sha256=source_digest,
                source_repository="https://github.com/szl-holdings/platform",
                source_revision="a" * 40,
                image_digest="sha256:" + "c" * 64,
                policy_revision="d" * 64,
                evaluation_revision="e" * 64,
                data_revisions=[
                    {
                        "digest": "sha256:" + "f" * 64,
                        "id": "synthetic-dataset",
                        "revision": "1" * 40,
                        "rights_status": "APPROVED",
                    }
                ],
                model_revisions=[],
                observed_at="2026-08-30T12:00:00Z",
                captured_at=profile_value["captured_at"],
            )
            release_report = validate_release(source_release, cell=source_cell)
            self.assertEqual(release_report["status"], "PASS")
            self.assertEqual(release_report["claimed_status"], "SOURCE_ONLY")
            self.assertFalse(release_report["operational_claim_verified"])


if __name__ == "__main__":
    unittest.main()
