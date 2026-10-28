"""JavaScript semantics the TypeScript service relies on, reproduced for byte-level parity.

The original service runs on Node: strings are measured in UTF-16 code units, `String.trim`
and `\\s` use the ECMAScript whitespace set, `JSON.stringify` drops `undefined` members and
writes non-finite numbers as `null`. These helpers keep the Python port's observable output
(HTTP bodies, checkpoint files, log lines) identical to the original.
"""

from __future__ import annotations

import json
import math
import re
import secrets
import time
from datetime import datetime, timezone
from typing import Any

_JS_WHITESPACE = "\t\n\v\f\r    -     　﻿"
_WS = f"[{_JS_WHITESPACE}]"
JS_WS = _WS  # regex class equal to JavaScript's `\s`
JS_NON_WS = f"[^{_JS_WHITESPACE}]"  # regex class equal to JavaScript's `\S`
_WS_RUN = re.compile(_WS + "+")
_TRIM = re.compile(f"^{_WS}+|{_WS}+$")
_BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz"


class _Undefined:
    """JavaScript `undefined`: a member holding it is omitted when serialized."""

    _instance: "_Undefined | None" = None

    def __new__(cls) -> "_Undefined":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __bool__(self) -> bool:
        return False

    def __repr__(self) -> str:
        return "undefined"


UNDEFINED: Any = _Undefined()


def iso_now() -> str:
    """`new Date().toISOString()`: UTC, millisecond precision, `Z` suffix."""
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def now_ms() -> int:
    return int(time.time() * 1000)


def short_random() -> str:
    """Six base-36 characters, the shape of `Math.random().toString(36).slice(2, 8)`."""
    return "".join(secrets.choice(_BASE36) for _ in range(6))


def utf16_length(text: str) -> int:
    """`String.prototype.length`: counts UTF-16 code units, so astral characters count twice."""
    return len(text.encode("utf-16-le")) // 2


def js_trim(text: str) -> str:
    return _TRIM.sub("", text)


def js_split_whitespace(text: str) -> list[str]:
    """`text.split(/\\s+/).filter((w) => w.length > 0)`."""
    return [word for word in _WS_RUN.split(text) if word]


def js_truthy(value: Any) -> bool:
    if value is None or value is UNDEFINED or value is False:
        return False
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value != 0 and not (isinstance(value, float) and math.isnan(value))
    if isinstance(value, str):
        return value != ""
    return True  # objects and arrays, including empty ones, are truthy


def js_or_default(value: Any, default: Any) -> Any:
    """The `??` operator: only `null`/`undefined` fall through to the default."""
    return default if value is None or value is UNDEFINED else value


def _number_text(text: str) -> float:
    text = js_trim(text)
    if text == "":
        return 0
    if not text.isascii():  # Python's float() accepts non-ASCII digits; Number() does not
        return math.nan
    lowered = text.lower()
    try:
        if lowered.startswith(("0x", "0o", "0b")) and len(lowered) > 2:
            return int(lowered, 0)
        if lowered in ("infinity", "+infinity"):
            return math.inf if text in ("Infinity", "+Infinity") else math.nan
        if lowered == "-infinity":
            return -math.inf if text == "-Infinity" else math.nan
        if "inf" in lowered or "nan" in lowered or "_" in text:
            return math.nan
        return float(text)
    except ValueError:
        return math.nan


def js_number(value: Any) -> int | float:
    """`Number(value)` for the JSON-shaped values the service handles."""
    if value is UNDEFINED:
        result: int | float = math.nan
    elif value is None:
        result = 0
    elif isinstance(value, bool):
        result = int(value)
    elif isinstance(value, (int, float)):
        result = value
    elif isinstance(value, str):
        result = _number_text(value)
    elif isinstance(value, list):
        result = 0 if not value else (js_number(js_string(value[0])) if len(value) == 1 else math.nan)
    else:
        result = math.nan
    return normalize_number(result)


def normalize_number(value: int | float) -> int | float:
    """JavaScript has one number type; integral values serialize without a fraction."""
    if isinstance(value, float) and math.isfinite(value) and value.is_integer() and abs(value) < 2**63:
        return int(value)
    return value


def js_string(value: Any) -> str:
    """`String(value)` for JSON-shaped values."""
    if value is UNDEFINED:
        return "undefined"
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        value = normalize_number(value)
        if isinstance(value, float):
            if math.isnan(value):
                return "NaN"
            if math.isinf(value):
                return "Infinity" if value > 0 else "-Infinity"
        return repr(value) if isinstance(value, float) else str(value)
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return ",".join("" if item is None or item is UNDEFINED else js_string(item) for item in value)
    return "[object Object]"


def js_spread(value: Any) -> dict[str, Any]:
    """`{ ...value }`: own enumerable properties; strings spread into indexed characters."""
    if isinstance(value, dict):
        return dict(value)
    if isinstance(value, list):
        return {str(i): item for i, item in enumerate(value)}
    if isinstance(value, str):
        return {str(i): ch for i, ch in enumerate(value)}
    return {}


def to_json_value(value: Any) -> Any:
    """Apply `JSON.stringify` value rules: drop undefined members, non-finite numbers become null."""
    if isinstance(value, dict):
        return {str(k): to_json_value(v) for k, v in value.items() if v is not UNDEFINED}
    if isinstance(value, (list, tuple)):
        return [None if item is UNDEFINED else to_json_value(item) for item in value]
    if isinstance(value, float):
        if not math.isfinite(value):
            return None
        return normalize_number(value)
    return value


def stringify(value: Any, indent: int | None = None) -> str:
    """`JSON.stringify(value)` or `JSON.stringify(value, null, indent)`."""
    data = to_json_value(value)
    if indent is None:
        return json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    return json.dumps(data, ensure_ascii=False, indent=indent, allow_nan=False)


def _reject_constant(token: str) -> Any:
    raise ValueError(f"Unexpected token {token} in JSON")


def parse_json(text: str) -> Any:
    """`JSON.parse`: NaN/Infinity tokens are not JSON and are refused."""
    return json.loads(text, parse_constant=_reject_constant)
