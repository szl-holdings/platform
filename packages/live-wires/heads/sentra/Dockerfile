# syntax=docker/dockerfile:1
# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173 · Doctrine v10
#
# sentra HF Docker Space — FULL OPERATIONAL (round2 delivery)
#
# Routes:
#   /                          — VERBATIM Replit React SPA (Vite base="/", a11oy pattern) — REPLACES old landing per founder
#   /console/                  — Replit SPA console (verbatim, standalone)
#   /api/sentra/healthz        — liveness probe
#   /api/sentra/v1/verdict     — POST: Wire B full immune verdict
#   /api/sentra/v1/inspect     — POST: Wire B full-signal inspect
#   /api/sentra/v1/gates       — GET: list all 8 immune gates
#   /api/sentra/v1/gates/{id}  — GET: per-gate detail
#   /api/sentra/v1/gates/{id}/test  — POST: per-gate test
#   /api/sentra/v1/audit-log   — GET: recent verdict history
#   /api/sentra/v1/threats     — GET: threat-signature STIX corpus
#   /api/sentra/v1/forecast    — GET/POST: witnessed forecasting (Mādhava envelope, Cursor #65)
#
# Canonical (Doctrine v10): 749 decl / 14 unique axioms (15 raw, 1 dup) / 163 tracked sorries / 12 MCP tools / 46 policy gates
#   /brain                     — immune brain page (theorems + 8 gates + 5 LLM tiers + screening)
#   /api/sentra/v1/brain*      — brain JSON + screen; /llm/route + /llm/tiers; /mesh/state; /brainz
#
# HF Space requirement: listen on PORT 7860.

FROM python:3.12-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    "fastapi>=0.111.0,<1.0.0" \
    "uvicorn[standard]>=0.29.0,<1.0.0" \
    "pydantic>=2.7.0,<3.0.0"
# ADDITIVE (Yachay / Provenance Hardening): cryptography for DSSE+Cosign Khipu signing.
RUN pip install --no-cache-dir "cryptography>=42.0"

# ADDITIVE (Doctrine v10/v11): agentic-RAG deps. CPU-only torch (no CUDA).
# Powers /api/sentra/v1/rag + /rag over SZLHOLDINGS/rag-corpus-v1 (BGE-base + FAISS).
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu \
    "faiss-cpu>=1.8.0" \
    "sentence-transformers>=3.0.0" \
    "torch>=2.2.0" \
    "huggingface_hub>=0.23.0"

# Verbatim Replit React SPA at root (Vite base="/"): index.html + assets in landing/.
# Old Vessels-DNA landing replaced per founder directive; /api/sentra/* contract preserved.
COPY landing/ ./landing/

# Copy console SPA (Replit verbatim, standalone)
COPY console/ ./console/

# Copy serve orchestrator
COPY serve.py ./serve.py
# Sentra <-> Killinchu cyber bridge (ADDITIVE): /drone-cyber tab + endpoints.
COPY sentra_drone_cyber.py ./sentra_drone_cyber.py
# a11oy.code (ADDITIVE, Doctrine v11 §14): math-corpus + code-proxy for sentra.
COPY szl_math_corpus.py ./szl_math_corpus.py
COPY szl_code_proxy.py ./szl_code_proxy.py

# Anatomy substrate (ADDITIVE): canonical formulas + composer routes.
COPY szl_formulas.py ./szl_formulas.py
COPY szl_anatomy_routes.py ./szl_anatomy_routes.py

# ADDITIVE (Doctrine v10): shared per-app BRAIN + unified LLM router + mesh wires.
COPY szl_brain.py ./szl_brain.py
# ADDITIVE (Doctrine v10/v11): shared agentic-RAG service (organ=immune).
COPY szl_rag.py ./szl_rag.py
COPY szl_wire.py ./szl_wire.py
COPY szl_dsse.py ./szl_dsse.py
COPY szl_provenance.py ./szl_provenance.py
COPY szl_jack.py ./szl_jack.py

ENV PORT=7860
EXPOSE 7860

CMD ["python", "serve.py"]
