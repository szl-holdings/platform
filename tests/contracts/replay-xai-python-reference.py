"""Replay JSON vectors against the pinned SZL function, without importing its router.

Usage: python tests/contracts/replay-xai-python-reference.py
The fixture is an exact source excerpt, not a whole-blob/source-publication proof.
No model/provider/credential-bearing modules or network run.
"""
import ast
import argparse
import hashlib
import json
from pathlib import Path
import re


class AtelierFailure(Exception):
    def __init__(self, code, status=503):
        self.code, self.status = code, status


def main():
    arguments = argparse.ArgumentParser()
    arguments.add_argument("--source", help="Optional exact full source readback; only AST-selected parser/constant run")
    options = arguments.parse_args()
    fixture_path = Path(__file__).parent / "fixtures/xai-final-output-vectors.json"
    fixture_bytes = fixture_path.read_bytes()
    fixtures = json.loads(fixture_bytes)
    reference = fixtures["reference"]
    if reference != {
        "repository": "szl-holdings/a11oy",
        "revision": "00f52f2e31c9aed93e83e3814410ec1dde08b03c",
        "path": "routers/atelier_grok.py",
        "function": "_final_output",
    }:
        raise AssertionError("reference is not the reviewed immutable source")
    resource = f"{reference['repository']}@{reference['revision']}:{reference['path']}"
    source_path = Path(options.source) if options.source else fixture_path.parent / "xai-final-output-reference.py"
    source_bytes = source_path.read_bytes()
    source_blob = hashlib.sha1(f"blob {len(source_bytes)}\0".encode() + source_bytes).hexdigest()
    binding = "UNKNOWN"
    if options.source:
        assert source_blob == "d272dda277fd5db89dbade47d635551c1354336e", "full source does not match immutable Git blob"
        binding = "MEASURED"
    module = ast.parse(source_bytes)
    function = next(node for node in module.body if isinstance(node, ast.FunctionDef) and node.name == "_final_output")
    identifier = next(node for node in module.body if isinstance(node, ast.Assign)
                      and any(isinstance(target, ast.Name) and target.id == "_SAFE_PROVIDER_ID" for target in node.targets))
    if options.source:
        excerpt = ast.parse((fixture_path.parent / "xai-final-output-reference.py").read_bytes())
        excerpt_function = next(node for node in excerpt.body if isinstance(node, ast.FunctionDef) and node.name == "_final_output")
        excerpt_identifier = next(node for node in excerpt.body if isinstance(node, ast.Assign)
                                  and any(isinstance(target, ast.Name) and target.id == "_SAFE_PROVIDER_ID" for target in node.targets))
        assert ast.dump(function) == ast.dump(excerpt_function), "parser excerpt differs from pinned full-source AST"
        assert ast.dump(identifier) == ast.dump(excerpt_identifier), "ID constant differs from pinned full-source AST"
    namespace = {"AtelierFailure": AtelierFailure, "re": re}
    # Execute only the exact reviewed parser and its constant, never router startup.
    parser_module = ast.Module(body=[identifier, function], type_ignores=[])
    exec(compile(parser_module, resource, "exec"), namespace)
    parser = namespace["_final_output"]
    passed = 0
    for vector in fixtures["vectors"]:
        try:
            text, _usage, identifier = parser(vector["document"], vector["model"])
        except AtelierFailure as error:
            assert error.code == "PROVIDER_INVALID_RESPONSE" and error.status == 502, vector["name"]
            assert vector["expected"]["accepted"] is False, vector["name"]
        else:
            expected = vector["expected"]
            assert expected["accepted"] is True, vector["name"]
            assert text == expected["text"] and identifier == expected["providerRequestId"], vector["name"]
        passed += 1
    for size in (32_768, 32_769):
        document = {"model": "grok-4.7", "status": "completed", "output": [{
            "type": "message", "role": "assistant", "status": "completed",
            "content": [{"type": "output_text", "text": "😀" * size}],
        }]}
        try:
            parser(document, "grok-4.7")
        except AtelierFailure:
            assert size == 32_769
        else:
            assert size == 32_768
        passed += 1
    print(json.dumps({"evidence_class": "MEASURED", "scope": "offline parser source replay",
                      "reference_revision": reference["revision"],
                      "replayed_source_sha256": hashlib.sha256(source_bytes).hexdigest(),
                      "whole_source_blob_binding": binding,
                      "source_git_blob": source_blob,
                      "vectors_sha256": hashlib.sha256(fixture_bytes).hexdigest(),
                      "passed": passed, "provider_calls": 0}, sort_keys=True))


if __name__ == "__main__":
    main()
