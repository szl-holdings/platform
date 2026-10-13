from __future__ import annotations

import math
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from szl_vertical_runtime.canonical import (
    canonical_json,
    digest_file,
    digest_value,
    read_json,
    tree_digest,
)


class CanonicalTests(unittest.TestCase):
    def test_fixed_unicode_digest_vector(self) -> None:
        value = {"z": 1, "a": "α"}
        self.assertEqual(canonical_json(value), '{\n  "a": "α",\n  "z": 1\n}\n')
        self.assertEqual(
            digest_value(value),
            "63009f13c9bebbeac006b887a9a2cadba6cf24b3be6a993946688887c56b4c82",
        )

    def test_non_finite_number_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            canonical_json({"unsafe": math.nan})

    def test_duplicate_json_keys_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "duplicate.json"
            path.write_text('{"id":"first","id":"second"}', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "duplicate JSON object key"):
                read_json(path)

    def test_runtime_manifest_digest_equals_checked_in_compiler_bytes(self) -> None:
        manifest = (
            Path(__file__).resolve().parents[3]
            / "apps"
            / "vertical-cells"
            / "manifests"
            / "aegis-assurance.json"
        )
        self.assertEqual(digest_value(read_json(manifest)), digest_file(manifest))

    def test_tree_digest_is_order_independent_and_content_sensitive(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "z.txt").write_text("z", encoding="utf-8")
            (root / "a.txt").write_text("a", encoding="utf-8")
            first = tree_digest(root)
            self.assertEqual(first, tree_digest(root))
            (root / "a.txt").write_text("changed", encoding="utf-8")
            self.assertNotEqual(first, tree_digest(root))

    def test_tree_digest_rejects_a_reparse_root_before_resolution(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with patch(
                "szl_vertical_runtime.canonical._is_link_or_reparse_point",
                side_effect=lambda path: path == root,
            ):
                with self.assertRaisesRegex(ValueError, "reparse point"):
                    tree_digest(root)

    def test_tree_digest_rejects_missing_or_non_directory_root(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            missing = base / "missing"
            file_root = base / "file.txt"
            file_root.write_text("not a tree", encoding="utf-8")
            for root in (missing, file_root):
                with self.subTest(root=root):
                    with self.assertRaisesRegex(ValueError, "existing directory"):
                        tree_digest(root)


if __name__ == "__main__":
    unittest.main()
