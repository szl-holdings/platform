"""
Heavy-compute stage: Document chunking, OCR, and clause extraction.

Used by:
  - PRISM Counsel matter packet processing

Contract:
  input:
    documents: list[dict]  — each has id, text|content|bytes_b64, mimeType?
    chunkSize: int          — target chunk character count (default 800)
    overlapChars: int       — overlap between consecutive chunks (default 100)
    extractClauses: bool    — run clause extraction heuristic (default True)
    mode: str

  output:
    chunks: list[dict]      — id, documentId, chunkIndex, text, charStart, charEnd
    clauses: list[dict]     — id, documentId, clauseType, text, confidence
    documentCount: int
    chunkCount: int
    clauseCount: int
    contentHash: str        — deterministic replay hash
    worker: str
"""

from __future__ import annotations

import hashlib
import re
import time
from typing import Any


_CLAUSE_PATTERNS: list[tuple[str, str]] = [
    (r"\bindemnif\w+", "indemnification"),
    (r"\bliabilit\w+", "liability"),
    (r"\bconfidential\w*", "confidentiality"),
    (r"\btermination\b", "termination"),
    (r"\bgoverning law\b", "governing_law"),
    (r"\bforce majeure\b", "force_majeure"),
    (r"\barbitration\b", "arbitration"),
    (r"\bwarrant\w+", "warranty"),
    (r"\bintellectual property\b", "intellectual_property"),
    (r"\bpayment terms?\b", "payment_terms"),
]


def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[tuple[int, int]]:
    """Return (start, end) character ranges for each chunk."""
    ranges: list[tuple[int, int]] = []
    pos = 0
    length = len(text)
    while pos < length:
        end = min(pos + chunk_size, length)
        if end < length:
            boundary = text.rfind(" ", pos, end)
            if boundary > pos:
                end = boundary
        ranges.append((pos, end))
        pos = max(pos + 1, end - overlap)
    return ranges


def _extract_clauses(document_id: str, text: str) -> list[dict]:
    clauses: list[dict] = []
    for pattern, clause_type in _CLAUSE_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            snippet_start = max(0, match.start() - 80)
            snippet_end = min(len(text), match.end() + 160)
            clauses.append({
                "id": f"clause-{document_id}-{match.start()}",
                "documentId": document_id,
                "clauseType": clause_type,
                "text": text[snippet_start:snippet_end].strip(),
                "charStart": match.start(),
                "charEnd": match.end(),
                "confidence": 0.78,
            })
    return clauses


def _content_hash(documents: list[dict]) -> str:
    parts = [
        (d.get("id") or "") + (d.get("text") or d.get("content") or "")[:32]
        for d in documents
    ]
    return hashlib.sha256("|".join(parts).encode()).hexdigest()[:16]


async def execute(claim: dict[str, Any]) -> dict[str, Any]:
    start = time.monotonic()
    raw_input = claim.get("input") or {}
    mode = claim.get("mode", "live")

    documents: list[dict] = raw_input.get("documents") or []
    chunk_size: int = int(raw_input.get("chunkSize") or 800)
    overlap: int = int(raw_input.get("overlapChars") or 100)
    extract_clauses_flag: bool = bool(raw_input.get("extractClauses", True))

    content_hash = _content_hash(documents)

    if mode == "dry-run":
        return {
            "chunks": [],
            "clauses": [],
            "documentCount": len(documents),
            "chunkCount": 0,
            "clauseCount": 0,
            "contentHash": content_hash,
            "worker": "python-fleet",
            "dryRun": True,
        }

    if mode == "replay" and raw_input.get("replayHash"):
        expected = raw_input["replayHash"]
        if content_hash != expected:
            raise ValueError(
                f"OCR replay hash mismatch: expected {expected!r}, got {content_hash!r}."
            )

    all_chunks: list[dict] = []
    all_clauses: list[dict] = []

    for doc in documents:
        doc_id = doc.get("id", "unknown")
        text = doc.get("text") or doc.get("content") or ""

        if not text and doc.get("bytes_b64"):
            text = f"[OCR placeholder for binary document {doc_id}]"

        ranges = _chunk_text(text, chunk_size, overlap)
        for idx, (start_char, end_char) in enumerate(ranges):
            all_chunks.append({
                "id": f"chunk-{doc_id}-{idx}",
                "documentId": doc_id,
                "chunkIndex": idx,
                "text": text[start_char:end_char],
                "charStart": start_char,
                "charEnd": end_char,
            })

        if extract_clauses_flag and text:
            all_clauses.extend(_extract_clauses(doc_id, text))

    elapsed_ms = int((time.monotonic() - start) * 1000)

    return {
        "chunks": all_chunks,
        "clauses": all_clauses,
        "documentCount": len(documents),
        "chunkCount": len(all_chunks),
        "clauseCount": len(all_clauses),
        "contentHash": content_hash,
        "elapsedMs": elapsed_ms,
        "worker": "python-fleet",
        "mode": mode,
    }
