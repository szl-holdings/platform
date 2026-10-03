"""Canonical serialization and digest helpers for the vertical runtime."""

from __future__ import annotations

import hashlib
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


CANONICAL_JSON_ALGORITHM = "szl.canonical-json.sorted-keys-indent-2-lf/v1"
TREE_DIGEST_ID = "szl.tree-digest.sha256-file-map/v1"
TREE_DIGEST_DOMAIN = b"szl-tree-sha256-v1\n"
TREE_DIGEST_ALGORITHM = (
    "sha256(b'szl-tree-sha256-v1\\n' + sorted(relative_posix_utf8 + "
    "NUL + lowercase_file_sha256_ascii + LF)); all regular files included; "
    "symlinks, junctions, and reparse points rejected"
)


def canonical_json(value: Any) -> str:
    """Return the compiler's canonical sorted, indented JSON plus one LF."""

    return (
        json.dumps(
            value,
            sort_keys=True,
            ensure_ascii=False,
            allow_nan=False,
            indent=2,
        )
        + "\n"
    )


def canonical_bytes(value: Any) -> bytes:
    return canonical_json(value).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def digest_value(value: Any) -> str:
    return sha256_bytes(canonical_bytes(value))


def digest_file(path: str | Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON object key: {key}")
        result[key] = value
    return result


def _reject_nonfinite(value: str) -> None:
    raise ValueError(f"non-finite JSON number is not admitted: {value}")


def loads_json(value: str | bytes | bytearray) -> Any:
    """Parse strict JSON, rejecting duplicate keys and non-finite numbers."""

    return json.loads(
        value,
        object_pairs_hook=_reject_duplicate_keys,
        parse_constant=_reject_nonfinite,
    )


def read_json(path: str | Path) -> Any:
    with Path(path).open("r", encoding="utf-8") as handle:
        return loads_json(handle.read())


def write_json(path: str | Path, value: Any) -> None:
    atomic_write(path, canonical_bytes(value))


def atomic_write(path: str | Path, content: bytes) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(
        prefix=f".{target.name}.", suffix=".tmp", dir=target.parent
    )
    try:
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, target)
    except BaseException:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def utc_now() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="microseconds")
        .replace("+00:00", "Z")
    )


def tree_entries(
    root: str | Path, *, exclude_names: Iterable[str] = ()
) -> list[tuple[str, bytes]]:
    """Return sorted regular-file entries and reject symlinks.

    The relative path uses forward slashes. Callers can reproduce the digest by
    sorting paths bytewise and applying :func:`tree_digest`'s documented
    file-hash map framing.
    """

    unresolved = Path(root)
    if _is_link_or_reparse_point(unresolved):
        raise ValueError(
            f"symlink, junction, or reparse point is not digestable: {unresolved}"
        )
    if not unresolved.exists() or not unresolved.is_dir():
        raise ValueError(f"tree root must be an existing directory: {unresolved}")
    base = unresolved.resolve()
    excluded = set(exclude_names)
    entries: list[tuple[str, bytes]] = []
    for path in base.rglob("*"):
        if _is_link_or_reparse_point(path):
            raise ValueError(
                f"symlink, junction, or reparse point is not digestable: {path}"
            )
        if not path.is_file() or path.name in excluded:
            continue
        relative = path.relative_to(base).as_posix()
        entries.append((relative, path.read_bytes()))
    entries.sort(key=lambda item: item[0].encode("utf-8"))
    return entries


def tree_digest(root: str | Path, *, exclude_names: Iterable[str] = ()) -> str:
    digest = hashlib.sha256()
    digest.update(TREE_DIGEST_DOMAIN)
    for relative, content in tree_entries(root, exclude_names=exclude_names):
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(sha256_bytes(content).encode("ascii"))
        digest.update(b"\n")
    return digest.hexdigest()


def _is_link_or_reparse_point(path: Path) -> bool:
    if path.is_symlink():
        return True
    is_junction = getattr(path, "is_junction", None)
    if callable(is_junction) and is_junction():
        return True
    try:
        attributes = getattr(path.lstat(), "st_file_attributes", 0)
    except FileNotFoundError:
        return False
    return bool(attributes & 0x400)
