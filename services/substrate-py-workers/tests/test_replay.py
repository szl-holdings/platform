"""
Deterministic replay and counterfactual tests for all four Python stages.

Each test verifies:
1. The stage produces a deterministic hash over its inputs.
2. Replaying with the same inputs and the captured hash succeeds.
3. Replaying with a *different* hash raises an error (drift detection).
4. Dry-run mode skips computation and returns an empty-output envelope.
5. Counterfactual mode runs like live mode (same deterministic path).

These tests run in-process against the stage execute() functions directly
(no HTTP overhead) so they run in milliseconds and can be part of CI.
"""

from __future__ import annotations

import asyncio
import hashlib
import json

import pytest

from worker.stages.retrieval import execute as retrieval_execute, _deterministic_hash as retrieval_hash
from worker.stages.ocr import execute as ocr_execute, _content_hash as ocr_hash
from worker.stages.geospatial import execute as geo_execute, _spatial_hash as geo_hash
from worker.stages.eval_grading import execute as eval_execute, _grading_hash as grading_hash


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _claim(stage_type: str, input_data: dict, mode: str = "live", replay_hash: str | None = None) -> dict:
    inp = dict(input_data)
    if replay_hash:
        inp["replayHash"] = replay_hash
    return {
        "stageType": stage_type,
        "stageConfig": {"stageKind": stage_type},
        "input": inp,
        "mode": mode,
        "runId": "run-replay-test",
        "stageId": f"stage-{stage_type}-test",
    }


# ─── Retrieval ────────────────────────────────────────────────────────────────

class TestRetrievalReplay:
    QUERY = "opportunity audit risk score"
    TOP_K = 5
    MIN_SCORE = 0.4

    def _hash(self) -> str:
        return retrieval_hash(self.QUERY, self.TOP_K, self.MIN_SCORE)

    @pytest.mark.asyncio
    async def test_deterministic_hash_stable(self):
        h1 = retrieval_hash(self.QUERY, self.TOP_K, self.MIN_SCORE)
        h2 = retrieval_hash(self.QUERY, self.TOP_K, self.MIN_SCORE)
        assert h1 == h2, "Hash must be deterministic for identical inputs"

    @pytest.mark.asyncio
    async def test_hash_changes_with_different_input(self):
        h1 = retrieval_hash(self.QUERY, self.TOP_K, self.MIN_SCORE)
        h2 = retrieval_hash("different query", self.TOP_K, self.MIN_SCORE)
        assert h1 != h2, "Hash must differ when query changes"

    @pytest.mark.asyncio
    async def test_replay_succeeds_with_correct_hash(self):
        h = self._hash()
        claim = _claim(
            "retrieval",
            {"query": self.QUERY, "topK": self.TOP_K, "minScore": self.MIN_SCORE},
            mode="replay",
            replay_hash=h,
        )
        result = await retrieval_execute(claim)
        assert result["queryHash"] == h
        assert result["mode"] == "replay"

    @pytest.mark.asyncio
    async def test_replay_fails_with_wrong_hash(self):
        claim = _claim(
            "retrieval",
            {"query": self.QUERY, "topK": self.TOP_K, "minScore": self.MIN_SCORE},
            mode="replay",
            replay_hash="deadbeef00000000",
        )
        with pytest.raises(ValueError, match="Replay hash mismatch"):
            await retrieval_execute(claim)

    @pytest.mark.asyncio
    async def test_dry_run_returns_empty_output(self):
        claim = _claim("retrieval", {"query": self.QUERY}, mode="dry-run")
        result = await retrieval_execute(claim)
        assert result["dryRun"] is True
        assert result["documents"] == []

    @pytest.mark.asyncio
    async def test_counterfactual_runs_like_live(self, monkeypatch):
        # Live mode requires either a configured retrieverAdapterId or the
        # explicit dev opt-in; this test exercises the synthetic determinism
        # path so we enable the opt-in for the duration of the test.
        monkeypatch.setenv("SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC", "1")
        live_claim = _claim("retrieval", {"query": self.QUERY, "topK": 3}, mode="live")
        cf_claim = _claim("retrieval", {"query": self.QUERY, "topK": 3}, mode="counterfactual")
        live_res = await retrieval_execute(live_claim)
        cf_res = await retrieval_execute(cf_claim)
        assert live_res["queryHash"] == cf_res["queryHash"]
        assert len(live_res["documents"]) == len(cf_res["documents"])


# ─── OCR ──────────────────────────────────────────────────────────────────────

class TestOCRReplay:
    DOCS = [
        {"id": "doc-1", "text": "This agreement shall be terminated upon 30 days notice. Indemnification applies."},
        {"id": "doc-2", "text": "Confidentiality and intellectual property provisions govern this contract."},
    ]

    def _hash(self) -> str:
        return ocr_hash(self.DOCS)

    @pytest.mark.asyncio
    async def test_deterministic_hash_stable(self):
        assert ocr_hash(self.DOCS) == ocr_hash(self.DOCS)

    @pytest.mark.asyncio
    async def test_hash_changes_with_different_docs(self):
        other = [{"id": "doc-X", "text": "Different content"}]
        assert ocr_hash(self.DOCS) != ocr_hash(other)

    @pytest.mark.asyncio
    async def test_replay_succeeds_with_correct_hash(self):
        h = self._hash()
        claim = _claim("ocr", {"documents": self.DOCS}, mode="replay", replay_hash=h)
        result = await ocr_execute(claim)
        assert result["contentHash"] == h
        assert result["documentCount"] == 2

    @pytest.mark.asyncio
    async def test_replay_fails_with_wrong_hash(self):
        claim = _claim("ocr", {"documents": self.DOCS}, mode="replay", replay_hash="badhash12345678")
        with pytest.raises(ValueError, match="replay hash mismatch"):
            await ocr_execute(claim)

    @pytest.mark.asyncio
    async def test_clause_extraction_deterministic(self):
        claim_a = _claim("ocr", {"documents": self.DOCS, "extractClauses": True}, mode="live")
        claim_b = _claim("ocr", {"documents": self.DOCS, "extractClauses": True}, mode="live")
        res_a = await ocr_execute(claim_a)
        res_b = await ocr_execute(claim_b)
        assert res_a["clauseCount"] == res_b["clauseCount"]
        clause_ids_a = sorted(c["id"] for c in res_a["clauses"])
        clause_ids_b = sorted(c["id"] for c in res_b["clauses"])
        assert clause_ids_a == clause_ids_b

    @pytest.mark.asyncio
    async def test_dry_run_skips_chunking(self):
        claim = _claim("ocr", {"documents": self.DOCS}, mode="dry-run")
        result = await ocr_execute(claim)
        assert result["dryRun"] is True
        assert result["chunks"] == []

    # --- Real OCR engine tests (scanned / binary PDF support) ---

    # Minimal one-page PDF with a text layer (Tj operator) that says
    # "Confidential indemnification clause." Used to verify the pdfminer
    # extraction path for image-based / binary PDF inputs.
    MINIMAL_PDF_BYTES = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]"
        b"/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>endobj\n"
        b"4 0 obj<</Length 74>>stream\n"
        b"BT /F1 12 Tf 72 720 Td "
        b"(Confidential indemnification clause.) Tj ET\n"
        b"endstream endobj\n"
        b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
        b"xref\n0 6\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000052 00000 n \n"
        b"0000000095 00000 n \n"
        b"0000000186 00000 n \n"
        b"0000000299 00000 n \n"
        b"trailer<</Size 6/Root 1 0 R>>\n"
        b"startxref\n356\n%%EOF\n"
    )

    @pytest.mark.asyncio
    async def test_pdf_bytes_extraction_via_pdfminer(self):
        import base64
        pdf_b64 = base64.b64encode(self.MINIMAL_PDF_BYTES).decode("ascii")
        docs = [{
            "id": "scan-1",
            "bytes_b64": pdf_b64,
            "mimeType": "application/pdf",
        }]
        claim = _claim("ocr", {"documents": docs, "extractClauses": True}, mode="live")
        result = await ocr_execute(claim)

        assert result["documentCount"] == 1
        # pdfminer should recover machine-readable text from the embedded layer
        assert result["chunkCount"] >= 1
        joined = " ".join(c["text"] for c in result["chunks"]).lower()
        assert "confidential" in joined or "indemnification" in joined
        assert result["ocrEngines"].get("pdfminer", 0) == 1
        # Clause heuristic should latch onto the recovered text
        assert any(
            cl["clauseType"] in ("confidentiality", "indemnification")
            for cl in result["clauses"]
        )

    @pytest.mark.asyncio
    async def test_image_only_pdf_extraction_via_tesseract(self):
        """Scanned PDF (no embedded text layer) → pdf2image + tesseract."""
        import base64
        import io
        import shutil

        if shutil.which("tesseract") is None or shutil.which("pdftoppm") is None:
            pytest.skip("tesseract / poppler not installed in this environment")

        try:
            from PIL import Image, ImageDraw, ImageFont
            from pdf2image import convert_from_bytes  # noqa: F401  - presence check
        except Exception:
            pytest.skip("Pillow / pdf2image not installed")

        # Render the phrase as an image and save it as an image-only PDF — no
        # text-layer is embedded, so pdfminer will recover nothing and the
        # tesseract fallback path must run.
        img = Image.new("RGB", (900, 220), "white")
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype(
                "/nix/store/qy6ag48i2g8h89wvqv470y26hh61v508-replit-runtime-path/share/fonts/truetype/DejaVuSans-Bold.ttf",
                40,
            )
        except Exception:
            font = ImageFont.load_default()
        draw.text((20, 80), "CONFIDENTIAL INDEMNIFICATION CLAUSE", fill="black", font=font)
        buf = io.BytesIO()
        img.save(buf, "PDF", resolution=200)
        pdf_b64 = base64.b64encode(buf.getvalue()).decode("ascii")

        docs = [{
            "id": "scan-img-1",
            "bytes_b64": pdf_b64,
            "mimeType": "application/pdf",
        }]
        claim = _claim("ocr", {"documents": docs, "extractClauses": True}, mode="live")
        result = await ocr_execute(claim)

        assert result["documentCount"] == 1
        assert result["chunkCount"] >= 1
        joined = " ".join(c["text"] for c in result["chunks"]).upper()
        # Tolerate minor OCR noise — assert at least one of the key tokens recovered
        assert "CONFIDENTIAL" in joined or "INDEMNIFICATION" in joined or "CLAUSE" in joined
        # The tesseract fallback must have been the engine that handled this doc
        assert result["ocrEngines"].get("tesseract", 0) == 1
        assert result["ocrEngines"].get("none", 0) == 0
        # Clause heuristic should fire on the OCR'd text
        assert any(
            cl["clauseType"] in ("confidentiality", "indemnification")
            for cl in result["clauses"]
        )
        # No placeholder text should appear in any chunk
        assert all("[OCR unavailable" not in c["text"] for c in result["chunks"])

    @pytest.mark.asyncio
    async def test_binary_doc_replay_hash_includes_bytes(self):
        import base64
        pdf_b64 = base64.b64encode(self.MINIMAL_PDF_BYTES).decode("ascii")
        docs_a = [{"id": "scan-1", "bytes_b64": pdf_b64, "mimeType": "application/pdf"}]
        docs_b = [{"id": "scan-1", "bytes_b64": pdf_b64[:-4] + "AAAA", "mimeType": "application/pdf"}]
        # Different bytes for the same id must produce different hashes
        assert ocr_hash(docs_a) != ocr_hash(docs_b)

        # Replay with the captured hash must succeed deterministically
        h = ocr_hash(docs_a)
        claim = _claim("ocr", {"documents": docs_a}, mode="replay", replay_hash=h)
        result = await ocr_execute(claim)
        assert result["contentHash"] == h
        assert result["mode"] == "replay"


# ─── Geospatial ───────────────────────────────────────────────────────────────

class TestGeospatialReplay:
    FEATURES = [
        {"id": "vessel-1", "properties": {"lat": 51.5, "lon": -0.1}},
        {"id": "vessel-2", "properties": {"lat": 40.7, "lon": -74.0}},
    ]
    ZONES = [
        {"id": "zone-uk", "bbox": [-2.0, 50.0, 2.0, 53.0]},
        {"id": "zone-us-east", "bbox": [-76.0, 39.0, -72.0, 42.0]},
    ]

    def _hash(self) -> str:
        return geo_hash(self.FEATURES, self.ZONES)

    @pytest.mark.asyncio
    async def test_deterministic_hash_stable(self):
        assert geo_hash(self.FEATURES, self.ZONES) == geo_hash(self.FEATURES, self.ZONES)

    @pytest.mark.asyncio
    async def test_hash_changes_with_different_features(self):
        other_features = [{"id": "vessel-99", "properties": {"lat": 0.0, "lon": 0.0}}]
        assert geo_hash(self.FEATURES, self.ZONES) != geo_hash(other_features, self.ZONES)

    @pytest.mark.asyncio
    async def test_replay_succeeds_with_correct_hash(self):
        h = self._hash()
        claim = _claim(
            "geospatial",
            {"features": self.FEATURES, "zones": self.ZONES, "domain": "vessels"},
            mode="replay",
            replay_hash=h,
        )
        result = await geo_execute(claim)
        assert result["spatialHash"] == h

    @pytest.mark.asyncio
    async def test_replay_fails_with_wrong_hash(self):
        claim = _claim(
            "geospatial",
            {"features": self.FEATURES, "zones": self.ZONES},
            mode="replay",
            replay_hash="wronghash0000000",
        )
        with pytest.raises(ValueError, match="replay hash mismatch"):
            await geo_execute(claim)

    @pytest.mark.asyncio
    async def test_dry_run_returns_empty_intersections(self):
        claim = _claim("geospatial", {"features": self.FEATURES, "zones": self.ZONES}, mode="dry-run")
        result = await geo_execute(claim)
        assert result["dryRun"] is True
        assert result["intersections"] == []

    @pytest.mark.asyncio
    async def test_intersection_deterministic(self):
        claim_a = _claim("geospatial", {"features": self.FEATURES, "zones": self.ZONES}, mode="live")
        claim_b = _claim("geospatial", {"features": self.FEATURES, "zones": self.ZONES}, mode="live")
        res_a = await geo_execute(claim_a)
        res_b = await geo_execute(claim_b)
        assert res_a["intersectionCount"] == res_b["intersectionCount"]
        ids_a = sorted(f"{i['featureId']}:{i['zoneId']}" for i in res_a["intersections"])
        ids_b = sorted(f"{i['featureId']}:{i['zoneId']}" for i in res_b["intersections"])
        assert ids_a == ids_b


# ─── Eval Grading ─────────────────────────────────────────────────────────────

class TestEvalGradingReplay:
    CASES = [
        {"id": "case-1", "output": "The revenue grew by 12%", "groundTruth": "Revenue grew by 12% year over year"},
        {"id": "case-2", "output": "No significant risks identified", "groundTruth": "No significant risks identified"},
        {"id": "case-3", "output": "Q4 performance was below expectations", "groundTruth": "Q4 missed guidance"},
    ]
    SCORING_FN = "f1"
    PASS_MARK = 0.6

    def _hash(self) -> str:
        return grading_hash(self.CASES, self.SCORING_FN, self.PASS_MARK)

    @pytest.mark.asyncio
    async def test_deterministic_hash_stable(self):
        assert grading_hash(self.CASES, self.SCORING_FN, self.PASS_MARK) == \
               grading_hash(self.CASES, self.SCORING_FN, self.PASS_MARK)

    @pytest.mark.asyncio
    async def test_hash_changes_with_different_cases(self):
        other = [{"id": "case-X", "output": "X", "groundTruth": "Y"}]
        assert grading_hash(self.CASES, self.SCORING_FN, self.PASS_MARK) != \
               grading_hash(other, self.SCORING_FN, self.PASS_MARK)

    @pytest.mark.asyncio
    async def test_replay_succeeds_with_correct_hash(self):
        h = self._hash()
        claim = _claim(
            "eval_grading",
            {"cases": self.CASES, "scoringFn": self.SCORING_FN, "passMark": self.PASS_MARK},
            mode="replay",
            replay_hash=h,
        )
        result = await eval_execute(claim)
        assert result["gradingHash"] == h
        assert result["summary"]["totalCases"] == 3

    @pytest.mark.asyncio
    async def test_replay_fails_with_wrong_hash(self):
        claim = _claim(
            "eval_grading",
            {"cases": self.CASES, "scoringFn": self.SCORING_FN, "passMark": self.PASS_MARK},
            mode="replay",
            replay_hash="wronggradehash00",
        )
        with pytest.raises(ValueError, match="replay hash mismatch"):
            await eval_execute(claim)

    @pytest.mark.asyncio
    async def test_grading_scores_deterministic(self):
        inp = {"cases": self.CASES, "scoringFn": self.SCORING_FN, "passMark": self.PASS_MARK}
        claim_a = _claim("eval_grading", inp, mode="live")
        claim_b = _claim("eval_grading", inp, mode="live")
        res_a = await eval_execute(claim_a)
        res_b = await eval_execute(claim_b)
        scores_a = [r["score"] for r in res_a["results"]]
        scores_b = [r["score"] for r in res_b["results"]]
        assert scores_a == scores_b

    @pytest.mark.asyncio
    async def test_exact_match_scoring(self):
        cases = [
            {"id": "em-1", "output": "hello world", "groundTruth": "hello world"},
            {"id": "em-2", "output": "hello world", "groundTruth": "different text"},
        ]
        claim = _claim("eval_grading", {"cases": cases, "scoringFn": "exact", "passMark": 0.9}, mode="live")
        result = await eval_execute(claim)
        scores = {r["caseId"]: r["score"] for r in result["results"]}
        assert scores["em-1"] == 1.0
        assert scores["em-2"] == 0.0

    @pytest.mark.asyncio
    async def test_dry_run_returns_empty_results(self):
        claim = _claim("eval_grading", {"cases": self.CASES}, mode="dry-run")
        result = await eval_execute(claim)
        assert result["dryRun"] is True
        assert result["results"] == []
