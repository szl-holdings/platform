# syntax=docker/dockerfile:1
# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173 · Doctrine v9
#
# a11oy HF Docker Space — RESET build (Brand Orchestration Layer at /).
#
# RESET 2026-05-31 (Yachay CTO): a11oy is NOT a /console/ admin panel.
# Per Replit .replit-artifact/artifact.toml: BASE_PATH="/", serve="static" from dist/public,
# rewrite /* -> /index.html (SPA history fallback). The React SPA IS the Brand
# Orchestration Layer; its HomePage (Vessels-DNA / investor-facing landing) renders at /.
#
# Serves:
#   /            — SPA front door (Brand Orchestration Layer landing)
#   /assets/*    — SPA JS/CSS chunks (vite base="/")
#   /boardroom, /investor-demo, /sovereign, /fabric, /nexus, /command, ... — SPA routes (history fallback)
#   /api/a11oy/* — a11oy serve endpoints (health, gates, reason, policy/evaluate, proxy)
#
# HF Space requirement: listen on PORT 7860.

FROM python:3.12-slim

WORKDIR /app

# Install Node 22 (for a11oy serve TypeScript runner)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates gnupg git && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# ADDITIVE (Yachay): huggingface_hub + openai power the a11oy.code orchestrator's
# unified open-LLM router (HF Router inference). python-multipart is required by
# FastAPI UploadFile for the Whisper /voice/stt endpoint. None of these change the
# existing SPA / gates runtime; the orchestrator import is try/except-guarded in serve.py.
RUN pip install --no-cache-dir \
    "fastapi>=0.111.0,<1.0.0" \
    "uvicorn[standard]>=0.29.0,<1.0.0" \
    "httpx>=0.27.0,<1.0.0" \
    "starlette>=0.37.0" \
    "huggingface_hub>=0.25.0" \
    "openai>=1.40.0" \
    "python-multipart>=0.0.9"
# ADDITIVE (Yachay / Provenance Hardening): cryptography for DSSE+Cosign Khipu signing.
RUN pip install --no-cache-dir "cryptography>=42.0"

# Clone a11oy source for the serve runtime (receipt-substrate + policy gates only)
RUN git clone --depth=1 --filter=blob:none --sparse \
    https://github.com/szl-holdings/a11oy.git /app/a11oy-src && \
    cd /app/a11oy-src && \
    git sparse-checkout set \
        packages/receipt-substrate/src \
        packages/policy/src/gates

# Copy the pre-built SPA (Brand Orchestration Layer) to the static root.
# index.html + assets/* are served directly at / and /assets/*; unknown GET -> index.html.
COPY console/ ./static/

# Copy serve orchestrator and gates manifest
COPY serve.py ./serve.py
COPY gates_manifest.json ./gates_manifest.json
# ADDITIVE: a11oy.code conversational orchestrator module (imported by serve.py).
COPY a11oy_code_orchestrator.py ./a11oy_code_orchestrator.py
# ADDITIVE (Yachay organ): persistent CTO module + Khipu + system prompt
COPY szl_yachay_organ.py ./szl_yachay_organ.py
COPY szl_khipu.py ./szl_khipu.py
COPY szl_chaski.py ./szl_chaski.py
COPY szl_wallpa.py ./szl_wallpa.py
COPY szl_wasi_rikuq.py ./szl_wasi_rikuq.py
COPY YACHAY_SYSTEM_PROMPT.md ./YACHAY_SYSTEM_PROMPT.md
COPY szl_dsse.py ./szl_dsse.py
COPY szl_provenance.py ./szl_provenance.py

# ADDITIVE (Yachay / Doctrine v12 PURIQ): SZL orchestration-hub layer.
# szl_hub.py is imported by serve.py (try/except-guarded) and registers the 14
# new hub tabs + /api/a11oy/v1/hub/* JSON endpoints. pages/ holds the static HTML
# for each tab (served from /app/pages/*.html). Pure additive.
COPY szl_hub.py ./szl_hub.py
COPY pages/ ./pages/

ENV PORT=7860
EXPOSE 7860

CMD ["python", "serve.py"]
