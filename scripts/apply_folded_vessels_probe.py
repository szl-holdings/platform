#!/usr/bin/env python3
"""Retarget the retired standalone Vessels probe to Killinchu's live alias."""
from pathlib import Path


def replace_exact(path: str, old: str, new: str, count: int) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    observed = text.count(old)
    if observed != count:
        raise SystemExit(
            f"{path}: expected {count} occurrence(s), found {observed}: {old!r}"
        )
    target.write_text(text.replace(old, new), encoding="utf-8")
    print(f"updated {path}: {count} replacement(s)")


def main() -> int:
    retired = "https://szlholdings-vessels.hf.space/healthz"
    folded = "https://szlholdings-killinchu.hf.space/api/vessels/healthz"

    replace_exact(
        ".github/scripts/warm_flagships.py",
        "# Canonical public fleet established by a11oy's authenticated 2026-09-02\n"
        "# consolidation: 57 total Spaces -> nine public RUNNING flagships -> 48 folded\n"
        "# private. Platform monitoring must follow this source-of-truth roster exactly.\n",
        "# Canonical monitored product and capability identities. Vessels is no longer a\n"
        "# standalone Space: its compatibility health contract is served by Killinchu.\n"
        "# The roster records product-plane health without recreating retired origins.\n",
        1,
    )
    replace_exact(
        ".github/scripts/warm_flagships.py",
        f'    "vessels": "{retired}",',
        f'    "vessels": "{folded}",',
        1,
    )

    replace_exact(
        ".github/workflows/warm-flagships.yml",
        f"            probe: {retired}",
        f"            probe: {folded}",
        2,
    )

    replace_exact(
        "packages/edge-organs/edge_organs/wasi_rikuq.py",
        '                  "https://szlholdings-vessels.hf.space/api/vessels/healthz"],',
        '                  "https://szlholdings-killinchu.hf.space/api/vessels/healthz"],',
        1,
    )

    test_path = Path(".github/scripts/test_warm_flagships.py")
    test_text = test_path.read_text(encoding="utf-8")
    old = '''        for organ, url in warm.ROSTER.items():
            self.assertEqual(url, f"https://szlholdings-{organ}.hf.space/healthz")
'''
    new = '''        for organ, url in warm.ROSTER.items():
            if organ == "vessels":
                self.assertEqual(
                    url,
                    "https://szlholdings-killinchu.hf.space/api/vessels/healthz",
                )
            else:
                self.assertEqual(url, f"https://szlholdings-{organ}.hf.space/healthz")
        self.assertNotIn("szlholdings-vessels.hf.space", "\\n".join(warm.ROSTER.values()))
'''
    if test_text.count(old) != 1:
        raise SystemExit("test roster assertion anchor did not match exactly")
    test_text = test_text.replace(old, new)

    old = '''        for organ in warm.ROSTER:
            self.assertIn(f"szlholdings-{organ}.hf.space/healthz", workflow)
'''
    new = '''        for organ in warm.ROSTER:
            expected = (
                "szlholdings-killinchu.hf.space/api/vessels/healthz"
                if organ == "vessels"
                else f"szlholdings-{organ}.hf.space/healthz"
            )
            self.assertIn(expected, workflow)
        self.assertNotIn("szlholdings-vessels.hf.space", workflow)
'''
    if test_text.count(old) != 1:
        raise SystemExit("test workflow assertion anchor did not match exactly")
    test_path.write_text(test_text.replace(old, new), encoding="utf-8")
    print("updated .github/scripts/test_warm_flagships.py")

    for path in (
        ".github/scripts/warm_flagships.py",
        ".github/workflows/warm-flagships.yml",
        "packages/edge-organs/edge_organs/wasi_rikuq.py",
    ):
        if "szlholdings-vessels.hf.space" in Path(path).read_text(encoding="utf-8"):
            raise SystemExit(f"retired standalone Vessels origin remains in {path}")

    print("folded Vessels probe topology: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
