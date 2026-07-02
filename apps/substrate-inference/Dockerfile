# ─── Stage 1: dependency builder ────────────────────────────────────────────
FROM nvidia/cuda:13.3.0-cudnn-devel-ubuntu22.04@sha256:dca0b10c69a02b28c021aa18c88657a3b2ed9a5c21753ee9750b841fac565250 AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-dev \
    python3.11-venv \
    python3-pip \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN python3.11 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /build

# Base runtime deps first (cached layer)
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# GPU-specific deps — quote specifiers so >= is not treated as shell redirection
RUN pip install \
    "torch>=2.5.0" \
    "transformers>=4.47.0" \
    "accelerate>=1.2.0" \
    "safetensors>=0.5.0"

# FlashAttention-2 requires CUDA headers; skip gracefully on CPU-only build hosts
RUN pip install "flash-attn>=2.7.0" --no-build-isolation || \
    echo "FlashAttention-2 build skipped (no CUDA headers); will be installed on GPU host"

# ─── Stage 2: slim runtime ───────────────────────────────────────────────────
FROM nvidia/cuda:13.3.0-cudnn-runtime-ubuntu22.04@sha256:75b084070cca3705cf5f64f4339692eebaa24b528eee518844fe8debc370c66c AS runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv

RUN groupadd --gid 1001 substrate && \
    useradd --uid 1001 --gid substrate --no-create-home --shell /sbin/nologin substrate

WORKDIR /app
COPY src/ ./src/
COPY engine/ ./engine/

RUN chown -R substrate:substrate /app
RUN mkdir -p /data/models /data/cache && chown -R substrate:substrate /data

USER substrate

ENV SUBSTRATE_MODELS_DIR=/data/models \
    SUBSTRATE_CACHE_DIR=/data/cache \
    SUBSTRATE_BIND_HOST=0.0.0.0 \
    SUBSTRATE_INFERENCE_PORT=8070 \
    PYTHONPATH=/app

EXPOSE 8070

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python3.11 -c "import urllib.request; urllib.request.urlopen('http://localhost:${SUBSTRATE_INFERENCE_PORT:-8070}/healthz')" || exit 1

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="substrate-inference" \
      org.opencontainers.image.description="Substrate Edge Inference — oLLM-powered local GPU inference service with an OpenAI-compatible API." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.1.0" \
      org.opencontainers.image.vendor="SZL Holdings"

CMD ["python3.11", "-m", "src.main"]
