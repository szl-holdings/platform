#!/usr/bin/env python3
"""szl_yaml.py — zero-dependency YAML emitter for the SZL master payload.

Zero-Bandaid rules enforced here, at the type level:
  * scalar(None) renders the literal string UNKNOWN. A null is never blank:
    an empty field reads as an oversight; UNKNOWN reads as an audited state.
  * Strings that YAML would misread (booleans, nulls, numbers, the word
    UNKNOWN itself is fine) are quoted so round-trips are safe.
  * Emits a restricted, human-readable subset: block mappings, block
    sequences, and scalars only. No anchors, no tags, no flow style.

Stdlib only. No `import yaml` anywhere in this payload.
"""

from __future__ import annotations

UNKNOWN_LITERAL = "UNKNOWN"

_PLAIN_SAFE_EXTRA = set("_-+./@:()[]#")


def scalar(value) -> str:
    """Render one scalar. None -> the literal string UNKNOWN (never blank)."""
    if value is None:
        return UNKNOWN_LITERAL
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, (int, float)):
        return repr(value)
    text = str(value)
    if text == "":
        return '""'
    lowered = text.lower()
    needs_quotes = (
        lowered in {"true", "false", "yes", "no", "on", "off", "null", "~"}
        or text[0] in " \t-?:,[]{}&*!|>'\"%@`"
        or text[-1] in " \t:"
        or ": " in text
        or " #" in text
        or "\n" in text
        or any(ord(c) < 0x20 for c in text)
        or _looks_numeric(text)
    )
    if not needs_quotes:
        return text
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


def _looks_numeric(text: str) -> bool:
    try:
        float(text.replace("_", ""))
        return True
    except ValueError:
        return False


def dump(node, indent: int = 0) -> str:
    """Serialize a dict/list/scalar tree to the restricted YAML subset."""
    lines: list[str] = []
    _emit(node, indent, lines)
    return "\n".join(lines) + "\n"


def _emit(node, indent: int, lines: list[str]) -> None:
    pad = " " * indent
    if isinstance(node, dict):
        if not node:
            lines.append(pad + "{}")
            return
        for key, value in node.items():
            k = scalar(str(key))
            if isinstance(value, (dict, list)) and value:
                lines.append(f"{pad}{k}:")
                _emit(value, indent + 2, lines)
            elif isinstance(value, (dict, list)):
                lines.append(f"{pad}{k}: " + ("{}" if isinstance(value, dict) else "[]"))
            else:
                lines.append(f"{pad}{k}: {scalar(value)}")
    elif isinstance(node, list):
        if not node:
            lines.append(pad + "[]")
            return
        for item in node:
            if isinstance(item, dict) and item:
                first = True
                for key, value in item.items():
                    k = scalar(str(key))
                    prefix = pad + "- " if first else pad + "  "
                    if isinstance(value, (dict, list)) and value:
                        lines.append(f"{prefix}{k}:")
                        _emit(value, indent + 4, lines)
                    elif isinstance(value, (dict, list)):
                        lines.append(f"{prefix}{k}: " + ("{}" if isinstance(value, dict) else "[]"))
                    else:
                        lines.append(f"{prefix}{k}: {scalar(value)}")
                    first = False
            elif isinstance(item, (dict, list)):
                lines.append(pad + "-")
                _emit(item, indent + 2, lines)
            else:
                lines.append(f"{pad}- {scalar(item)}")
    else:
        lines.append(pad + scalar(node))


def dump_document(node, doc_marker: bool = True) -> str:
    body = dump(node)
    return ("---\n" + body) if doc_marker else body
