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
    ocrEngines: dict        — { "pdfminer"|"tesseract"|"text"|"none": count }
    worker: str

OCR engine selection (CPU-only, Phase 1):
  - text/content fields → used directly (no OCR needed)
  - mimeType startswith "application/pdf" or sniffed PDF magic bytes
      → pdfminer.six high_level.extract_text (text layer)
      → if no text recovered, fall back to pdf2image (poppler/pdftoppm) +
        pytesseract per page for scanned / image-only PDFs
  - mimeType startswith "image/" or sniffed PNG/JPEG magic bytes
      → pytesseract.image_to_string on a PIL.Image
  - Anything else with bytes_b64 falls back to a clearly-marked placeholder.
"""

from __future__ import annotations

import base64
import binascii
import hashlib
import io
import logging
import re
import shutil
import time
from typing import Any

logger = logging.getLogger(__name__)

try:  # pragma: no cover - import guarded for environments without OCR deps
    from pdfminer.high_level import extract_text as _pdf_extract_text
    _PDFMINER_AVAILABLE = True
except Exception:  # pragma: no cover
    _pdf_extract_text = None  # type: ignore[assignment]
    _PDFMINER_AVAILABLE = False

try:  # pragma: no cover - import guarded
    import pytesseract
    from PIL import Image
    _PYTESSERACT_AVAILABLE = True
except Exception:  # pragma: no cover
    pytesseract = None  # type: ignore[assignment]
    Image = None  # type: ignore[assignment]
    _PYTESSERACT_AVAILABLE = False

try:  # pragma: no cover - import guarded
    from pdf2image import convert_from_bytes as _pdf_to_images
    _PDF2IMAGE_AVAILABLE = True
except Exception:  # pragma: no cover
    _pdf_to_images = None  # type: ignore[assignment]
    _PDF2IMAGE_AVAILABLE = False


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
    """Deterministic hash over each document's id and a sample of its payload.

    For OCR-bound documents the bytes_b64 payload (or its first 64 chars) is
    included so the replay hash differs between distinct binary inputs even
    when no machine-readable text is present.
    """
    h = hashlib.sha256()
    for d in documents:
        doc_id = d.get("id") or ""
        text_sample = (d.get("text") or d.get("content") or "")[:32]
        b64 = d.get("bytes_b64") or ""
        h.update(doc_id.encode())
        h.update(b"|")
        h.update(text_sample.encode())
        h.update(b"|")
        # Hash the full bytes payload so distinct binary inputs produce
        # distinct content hashes (required for deterministic replay).
        if b64:
            h.update(hashlib.sha256(b64.encode()).digest())
        h.update(b"||")
    return h.hexdigest()[:16]


def _sniff_kind(raw: bytes, mime: str | None) -> str:
    """Return 'pdf', 'image', or 'unknown' based on MIME hint and magic bytes."""
    mime = (mime or "").lower()
    if mime.startswith("application/pdf"):
        return "pdf"
    if mime.startswith("image/"):
        return "image"
    if raw[:5] == b"%PDF-":
        return "pdf"
    if raw[:8] == b"\x89PNG\r\n\x1a\n" or raw[:3] == b"\xff\xd8\xff" or raw[:6] in (b"GIF87a", b"GIF89a"):
        return "image"
    if raw[:2] in (b"II", b"MM"):  # TIFF
        return "image"
    return "unknown"


def _ocr_pdf_bytes(raw: bytes) -> tuple[str, str]:
    """Extract text from PDF bytes. Returns (text, engine_used).

    Order of attempts:
      1. pdfminer.six text-layer extraction (fast, pure Python).
      2. pdf2image rasterization + pytesseract per page (scanned / image-only PDFs).
    """
    if _PDFMINER_AVAILABLE and _pdf_extract_text is not None:
        try:
            text = _pdf_extract_text(io.BytesIO(raw)) or ""
            text = text.strip()
            if text:
                return text, "pdfminer"
        except Exception as exc:  # pragma: no cover - pdfminer is robust
            logger.warning("pdfminer extraction failed: %s", exc)

    # Image-only / scanned PDF fallback: rasterize each page and OCR it.
    if (
        _PDF2IMAGE_AVAILABLE
        and _pdf_to_images is not None
        and _PYTESSERACT_AVAILABLE
        and pytesseract is not None
        and shutil.which("tesseract") is not None
        and shutil.which("pdftoppm") is not None
    ):
        try:
            pages = _pdf_to_images(raw, dpi=200)
            page_texts: list[str] = []
            for page in pages:
                try:
                    page_texts.append((pytesseract.image_to_string(page) or "").strip())
                finally:
                    try:
                        page.close()
                    except Exception:
                        pass
            joined = "\n\n".join(t for t in page_texts if t).strip()
            if joined:
                return joined, "tesseract"
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("pdf2image+tesseract OCR failed: %s", exc)

    return "", "none"


def _ocr_image_bytes(raw: bytes) -> tuple[str, str]:
    """Run tesseract on image bytes. Returns (text, engine_used)."""
    if not _PYTESSERACT_AVAILABLE or Image is None or pytesseract is None:
        return "", "none"
    if shutil.which("tesseract") is None:
        return "", "none"
    try:
        with Image.open(io.BytesIO(raw)) as img:
            text = pytesseract.image_to_string(img) or ""
        return text.strip(), "tesseract"
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("tesseract OCR failed: %s", exc)
        return "", "none"


def _decode_bytes(b64: str) -> bytes:
    try:
        return base64.b64decode(b64, validate=False)
    except (binascii.Error, ValueError):
        return b""


def _ocr_document(doc: dict) -> tuple[str, str]:
    """Resolve a document to (text, engine_used).

    Prefers explicit text/content fields, then falls back to OCR engines
    selected from MIME type and magic-byte sniffing.
    """
    explicit = doc.get("text") or doc.get("content") or ""
    if explicit:
        return explicit, "text"

    b64 = doc.get("bytes_b64")
    if not b64:
        return "", "none"

    raw = _decode_bytes(b64)
    if not raw:
        return "", "none"

    kind = _sniff_kind(raw, doc.get("mimeType"))
    if kind == "pdf":
        return _ocr_pdf_bytes(raw)
    if kind == "image":
        return _ocr_image_bytes(raw)
    return "", "none"


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
    engine_counts: dict[str, int] = {}

    for doc in documents:
        doc_id = doc.get("id", "unknown")
        text, engine = _ocr_document(doc)
        engine_counts[engine] = engine_counts.get(engine, 0) + 1

        if not text and doc.get("bytes_b64"):
            text = f"[OCR unavailable for binary document {doc_id}]"

        ranges = _chunk_text(text, chunk_size, overlap)
        for idx, (start_char, end_char) in enumerate(ranges):
            all_chunks.append({
                "id": f"chunk-{doc_id}-{idx}",
                "documentId": doc_id,
                "chunkIndex": idx,
                "text": text[start_char:end_char],
                "charStart": start_char,
                "charEnd": end_char,
                "ocrEngine": engine,
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
        "ocrEngines": engine_counts,
        "elapsedMs": elapsed_ms,
        "worker": "python-fleet",
        "mode": mode,
    }
