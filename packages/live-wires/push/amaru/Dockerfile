# SPDX-License-Identifier: LicenseRef-SZL-Proprietary
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173 · Doctrine v10
# amaru HF Docker Space — serves the amaru memory-cortex operator surface + the
# real 7-chakra runtime API at /api/amaru/* + the verbatim Replit reverse-ETL
# React SPA at /conduit/ (BASE_PATH=/conduit/, title "Amaru — The Andean Ouroboros").
#
# The root front-end is now the verbatim Replit React SPA (base=/). The /conduit/ surface is the pre-built React SPA (vite, base
# /conduit/) copied verbatim from the Replit artifact and served statically.
# ADDITIVE ONLY: no existing route, console, reasoner, or Rosie widget is touched.
# No Node build step is required at image build time — the SPA is shipped pre-built.
FROM python:3.12-slim AS backend

WORKDIR /app
COPY sidecar/ ./sidecar/
RUN pip install --no-cache-dir ./sidecar
# ADDITIVE (Yachay / Provenance Hardening): cryptography for DSSE+Cosign Khipu signing.
RUN pip install --no-cache-dir "cryptography>=42.0"

FROM python:3.12-slim

WORKDIR /app

COPY --from=backend /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY sidecar/src/amaru /app/amaru

# ADDITIVE (Doctrine v10/v11): agentic-RAG deps. CPU-only torch (no CUDA).
# Powers /api/amaru/v1/rag + /rag over SZLHOLDINGS/rag-corpus-v1 (BGE-base + FAISS).
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu \
    "faiss-cpu>=1.8.0" \
    "sentence-transformers>=3.0.0" \
    "torch>=2.2.0" \
    "huggingface_hub>=0.23.0"

# Root front-end: the VERBATIM Replit reverse-ETL React SPA (Vite base="/"),
# served at root / per founder directive + a11oy winning pattern. The full
# /api/amaru/* runtime, Wires, brain-jack, /upgrades, /rag are PRESERVED below.
RUN mkdir -p /app/static/assets
COPY static/index.html /app/static/index.html
COPY static/assets/ /app/static/assets/

# PRESERVED: legacy memory-cortex single page kept at /legacy for reference.
COPY web/index.html /app/static/legacy.html
COPY web/assets/ /app/static/web-assets/

# PRESERVED: the prior /conduit/ React SPA (base=/conduit/) left intact.
COPY conduit/ /app/static/conduit/

COPY serve.py /app/serve.py
# Anatomy substrate (ADDITIVE): canonical formulas + composer routes.
COPY szl_formulas.py /app/szl_formulas.py
COPY szl_anatomy_routes.py /app/szl_anatomy_routes.py

# ADDITIVE (Doctrine v10): shared per-app BRAIN + unified LLM router + mesh wires.
COPY szl_brain.py /app/szl_brain.py
# FIX (ADDITIVE): Wire-G module imported by serve.py but COPY was omitted -> ModuleNotFoundError at startup.
COPY szl_jack.py /app/szl_jack.py
# ADDITIVE (Doctrine v10/v11): shared agentic-RAG service (organ=cortex).
COPY szl_rag.py /app/szl_rag.py
COPY szl_wire.py /app/szl_wire.py
COPY szl_dsse.py /app/szl_dsse.py
COPY szl_provenance.py /app/szl_provenance.py

ENV PORT=7860
EXPOSE 7860

# a11oy.code (ADDITIVE, Doctrine v11 §14): math-corpus + code-proxy for amaru.
COPY szl_math_corpus.py ./szl_math_corpus.py
COPY szl_code_proxy.py ./szl_code_proxy.py

CMD ["python", "serve.py"]
