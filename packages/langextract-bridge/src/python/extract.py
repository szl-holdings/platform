#!/usr/bin/env python3
"""langextract-bridge sidecar.

Reads a single ExtractionRequest JSON object on stdin, invokes
google/langextract (Apache-2.0) against the configured model, and writes a
JSON object {"hits": [...]} on stdout. Errors go to stderr with a non-zero
exit code so the TypeScript caller can fail loudly.

Doctrine notes:
- The TypeScript caller is responsible for caching and replay determinism.
  This script is only invoked on a cache miss when the caller explicitly
  passes mode='live'.
- LANGEXTRACT_API_KEY (or GOOGLE_API_KEY for Gemini models) must be set
  in the environment. We never read or print the key.
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any


def _fail(msg: str, code: int = 1) -> None:
    sys.stderr.write(f"langextract-bridge sidecar: {msg}\n")
    sys.exit(code)


def main() -> None:
    try:
        request: dict[str, Any] = json.loads(sys.stdin.read())
    except json.JSONDecodeError as e:
        _fail(f"invalid JSON on stdin: {e}")

    try:
        import langextract as lx  # type: ignore[import-not-found]
    except ImportError:
        _fail(
            "the `langextract` python package is not installed. "
            "install with: pip install langextract"
        )

    model = request.get("model")
    prompt = request.get("promptDescription")
    examples_raw = request.get("examples") or []
    source = request.get("sourceText")

    if not (isinstance(model, str) and isinstance(prompt, str) and isinstance(source, str)):
        _fail("request must include string fields model, promptDescription, sourceText")

    if not os.environ.get("LANGEXTRACT_API_KEY") and not os.environ.get("GOOGLE_API_KEY"):
        _fail("neither LANGEXTRACT_API_KEY nor GOOGLE_API_KEY is set; cannot make live call")

    examples = [
        lx.data.ExampleData(
            text=ex["text"],
            extractions=[
                lx.data.Extraction(
                    extraction_class=h["class"],
                    extraction_text=h["text"],
                    attributes=h.get("attributes") or {},
                )
                for h in ex.get("extractions", [])
            ],
        )
        for ex in examples_raw
    ]

    result = lx.extract(
        text_or_documents=source,
        prompt_description=prompt,
        examples=examples,
        model_id=model,
    )

    hits = []
    for ext in getattr(result, "extractions", []):
        interval = getattr(ext, "char_interval", None)
        start = getattr(interval, "start_pos", -1) if interval else -1
        end = getattr(interval, "end_pos", -1) if interval else -1
        hits.append(
            {
                "class": ext.extraction_class,
                "text": ext.extraction_text,
                "startChar": int(start),
                "endChar": int(end),
                "attributes": dict(ext.attributes or {}),
            }
        )

    sys.stdout.write(json.dumps({"hits": hits}))


if __name__ == "__main__":
    main()
