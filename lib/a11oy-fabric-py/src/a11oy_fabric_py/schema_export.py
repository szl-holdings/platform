"""Export the JSON Schemas for every primitive into
``reports/a11oy-substrate/_schema/``.

Downstream consumers (the TypeScript fabric, the future a11oy UI task,
external tooling) typecheck against these schemas.
"""

from __future__ import annotations

import json
import os

from .models import SCHEMA_EXPORTS
from .types import SUBSTRATE_REPORTS_ROOT


def write_all_schemas(root_dir: str | None = None) -> list[str]:
    target = os.path.join(root_dir or SUBSTRATE_REPORTS_ROOT, "_schema")
    os.makedirs(target, exist_ok=True)
    written: list[str] = []
    for model in SCHEMA_EXPORTS:
        schema = model.model_json_schema()
        # Stable schema $id so external consumers can pin against it.
        schema["$id"] = f"https://a11oy.dev/substrate/schema/{model.__name__}.schema.json"
        # Pydantic emits draft 2020-12 by default — make it explicit.
        schema.setdefault("$schema", "https://json-schema.org/draft/2020-12/schema")
        path = os.path.join(target, f"{model.__name__}.schema.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=2, sort_keys=True)
            f.write("\n")
        written.append(path)
    return written
