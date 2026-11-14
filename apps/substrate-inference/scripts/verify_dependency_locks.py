#!/usr/bin/env python3
"""Fail closed when Substrate dependency declarations and hashed locks drift."""

from __future__ import annotations

import hashlib
import re
import tomllib
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HASH_RE = re.compile(r"--hash=sha256:([0-9a-f]{64})(?:\s*\\)?$")
LOCKED_RE = re.compile(
    r"^([A-Za-z0-9][A-Za-z0-9._-]*)==([^ ;\\]+)"
    r"(?:\s*;\s*[^\\]+)?\s*(?:\\)?$"
)
NAME_RE = re.compile(r"^([A-Za-z0-9][A-Za-z0-9._-]*)")
SPEC_RE = re.compile(r"(===|==|!=|~=|>=|<=|>|<)\s*([^,\s]+)")


@dataclass(frozen=True)
class LockedRequirement:
    name: str
    version: str
    hashes: tuple[str, ...]


def normalize_name(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def requirement_name(requirement: str) -> str:
    match = NAME_RE.match(requirement)
    if not match:
        raise AssertionError(f"cannot parse requirement name: {requirement!r}")
    return normalize_name(match.group(1))


def source_requirements(path: Path) -> list[str]:
    return [
        line.strip()
        for line in path.read_text().splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]


def parse_lock(path: Path) -> tuple[dict[str, LockedRequirement], tuple[str, ...]]:
    lines = path.read_text().splitlines()
    entries: dict[str, LockedRequirement] = {}
    indexes = tuple(line for line in lines if line.startswith("--") and "index-url" in line)

    index = 0
    while index < len(lines):
        line = lines[index]
        if not line or line.startswith("#") or line.startswith("--") or line[0].isspace():
            index += 1
            continue

        match = LOCKED_RE.fullmatch(line)
        if not match:
            raise AssertionError(f"{path.name}:{index + 1}: requirement is not exact: {line}")

        name = normalize_name(match.group(1))
        if name in entries:
            raise AssertionError(f"{path.name}: duplicate locked package {name}")

        hashes: list[str] = []
        cursor = index + 1
        while cursor < len(lines):
            continuation = lines[cursor]
            if continuation and not continuation[0].isspace() and not continuation.startswith("#"):
                break
            hash_match = HASH_RE.search(continuation.strip())
            if hash_match:
                hashes.append(hash_match.group(1))
            cursor += 1

        if not hashes:
            raise AssertionError(f"{path.name}: {name} has no sha256 artifact hash")
        entries[name] = LockedRequirement(
            name=name,
            version=match.group(2),
            hashes=tuple(sorted(set(hashes))),
        )
        index = cursor

    if not entries:
        raise AssertionError(f"{path.name}: no locked requirements found")
    return entries, indexes


def version_key(version: str) -> tuple[int, ...]:
    public = version.split("+", 1)[0]
    match = re.fullmatch(r"(\d+(?:\.\d+)*)(?:\.post(\d+))?", public)
    if not match:
        raise AssertionError(f"unsupported direct requirement version: {version}")
    release = tuple(int(part) for part in match.group(1).split("."))
    post = match.group(2)
    return release + ((1, int(post)) if post is not None else (0, 0))


def compare_versions(left: tuple[int, ...], right: tuple[int, ...]) -> int:
    width = max(len(left), len(right))
    padded_left = left + (0,) * (width - len(left))
    padded_right = right + (0,) * (width - len(right))
    return (padded_left > padded_right) - (padded_left < padded_right)


def assert_satisfies(requirement: str, locked: LockedRequirement) -> None:
    locked_key = version_key(locked.version)
    for operator, expected in SPEC_RE.findall(requirement):
        if operator in {"!=", "~=", "==="}:
            raise AssertionError(
                f"unsupported operator {operator} in direct requirement {requirement}"
            )
        result = compare_versions(locked_key, version_key(expected))
        allowed = {
            "==": result == 0,
            ">=": result >= 0,
            "<=": result <= 0,
            ">": result > 0,
            "<": result < 0,
        }[operator]
        if not allowed:
            raise AssertionError(
                f"{locked.name}=={locked.version} does not satisfy {requirement}"
            )


def assert_direct_requirements(
    declarations: list[str], lock: dict[str, LockedRequirement], lock_name: str
) -> None:
    for declaration in declarations:
        name = requirement_name(declaration)
        if name not in lock:
            raise AssertionError(f"{lock_name}: direct requirement {name} is missing")
        assert_satisfies(declaration, lock[name])


def assert_manifest() -> None:
    manifest = ROOT / "requirements-locks.sha256"
    seen: set[str] = set()
    for raw_line in manifest.read_text().splitlines():
        if not raw_line:
            continue
        expected, filename = raw_line.split("  ", 1)
        if not re.fullmatch(r"[0-9a-f]{64}", expected):
            raise AssertionError(f"invalid digest in {manifest.name}: {expected}")
        target = ROOT / filename
        actual = hashlib.sha256(target.read_bytes()).hexdigest()
        if actual != expected:
            raise AssertionError(
                f"{filename}: digest drift (manifest {expected}, actual {actual})"
            )
        seen.add(filename)
    expected_files = {
        "requirements-base.lock",
        "requirements-gpu.lock",
        "requirements-flash-attn.lock",
    }
    if seen != expected_files:
        raise AssertionError(f"{manifest.name}: expected {sorted(expected_files)}, got {sorted(seen)}")


def main() -> None:
    project = tomllib.loads((ROOT / "pyproject.toml").read_text())
    base_declarations = list(project["project"]["dependencies"])
    optional = project["project"]["optional-dependencies"]
    gpu_declarations = list(optional["gpu"])
    flash_declarations = list(optional["flash-attn"])

    base_input = source_requirements(ROOT / "requirements-base.in")
    gpu_input = source_requirements(ROOT / "requirements-gpu.in")
    flash_input = source_requirements(ROOT / "requirements-flash-attn.in")
    legacy_base_input = source_requirements(ROOT / "requirements.txt")

    if base_input != base_declarations or legacy_base_input != base_declarations:
        raise AssertionError("base .in/requirements.txt declarations drifted from pyproject.toml")
    if gpu_input != base_declarations + gpu_declarations:
        raise AssertionError("requirements-gpu.in drifted from pyproject.toml")
    if flash_input != flash_declarations:
        raise AssertionError(
            "requirements-flash-attn.in drifted from the FlashAttention optional extra"
        )

    base_lock, base_indexes = parse_lock(ROOT / "requirements-base.lock")
    gpu_lock, gpu_indexes = parse_lock(ROOT / "requirements-gpu.lock")
    flash_lock, flash_indexes = parse_lock(ROOT / "requirements-flash-attn.lock")

    assert_direct_requirements(base_declarations, base_lock, "requirements-base.lock")
    assert_direct_requirements(base_declarations + gpu_declarations, gpu_lock, "requirements-gpu.lock")
    assert_direct_requirements(flash_input, flash_lock, "requirements-flash-attn.lock")

    expected_pypi = ("--index-url https://pypi.org/simple",)
    if base_indexes != expected_pypi or flash_indexes != expected_pypi:
        raise AssertionError("base and FlashAttention locks must use only the canonical PyPI index")
    if gpu_indexes != expected_pypi + (
        "--extra-index-url https://download.pytorch.org/whl/cu130",
    ):
        raise AssertionError("GPU lock must declare PyPI and the CUDA 13.0 PyTorch wheel index")

    if "flash-attn" in gpu_lock:
        raise AssertionError("FlashAttention must stay out of the default GPU lock")
    if set(flash_lock) != {"einops", "flash-attn"}:
        raise AssertionError("FlashAttention delta contains an unexpected package")
    if gpu_lock["torch"].version != "2.14.1+cu130":
        raise AssertionError("GPU lock is not bound to the qualified CUDA 13.0 torch wheel")

    for name in map(requirement_name, base_declarations):
        if base_lock[name].version != gpu_lock[name].version:
            raise AssertionError(f"{name}: base and GPU direct versions differ")

    dockerfile = (ROOT / "Dockerfile").read_text()
    if dockerfile.count("--require-hashes") != 3:
        raise AssertionError("Dockerfile must enforce hashes for base, GPU, and FlashAttention installs")
    for filename in (
        "requirements-base.lock",
        "requirements-gpu.lock",
        "requirements-flash-attn.lock",
    ):
        if filename not in dockerfile:
            raise AssertionError(f"Dockerfile does not consume {filename}")
    if "pip install -r requirements.txt" in dockerfile:
        raise AssertionError("Dockerfile still installs the unresolved legacy requirements file")
    if "SUBSTRATE_INFERENCE_ENV=production" not in dockerfile:
        raise AssertionError("production runtime declaration is missing")

    assert_manifest()
    print(
        "dependency locks verified:",
        f"base={len(base_lock)}",
        f"gpu={len(gpu_lock)}",
        f"flash_delta={len(flash_lock)}",
    )


if __name__ == "__main__":
    main()
