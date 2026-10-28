# ─── Stage 1: dependency builder ────────────────────────────────────────────
FROM nvidia/cuda:13.4.2-cudnn-devel-ubuntu22.04@sha256:d9e285e3bb16630c577e71070ea73f7b37ea2a2928c64902e340507c640b9618 AS builder

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
RUN pip install -r requirements.txt

# GPU-specific deps — quote specifiers so >= is not treated as shell redirection
RUN pip install \
    "torch>=2.14.0" \
    "transformers>=5.17.0" \
    "accelerate>=1.2.0" \
    "safetensors>=0.5.0"

# FlashAttention-2 is optional because the engine can use PyTorch SDPA. Opting
# in is fail-closed: a requested but failed install fails the image build.
ARG SUBSTRATE_INSTALL_FLASH_ATTN=0
RUN case "$SUBSTRATE_INSTALL_FLASH_ATTN" in \
      0) ;; \
      1) pip install "flash-attn>=2.8.3.post1" --no-build-isolation ;; \
      *) echo "SUBSTRATE_INSTALL_FLASH_ATTN must be 0 or 1" >&2; exit 2 ;; \
    esac

# ─── Development-only CPU stub target ───────────────────────────────────────────
# This target intentionally omits torch/CUDA/oLLM. It is suitable for local
# contract development only: /healthz is live, while /ready remains 503 and no
# production inference or model mutation is admitted.
FROM python:3.14-slim@sha256:a2b82f3c48559aa0a8446d9af49826b6e2b2016f4cd2afabfe6013ec53729170 AS cpu-stub

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    SUBSTRATE_MODELS_DIR=/data/models \
    SUBSTRATE_CACHE_DIR=/data/cache \
    SUBSTRATE_BIND_HOST=0.0.0.0 \
    SUBSTRATE_INFERENCE_ENV=development \
    SUBSTRATE_INFERENCE_AUTH_BYPASS=true \
    SUBSTRATE_INFERENCE_PORT=8070 \
    PYTHONPATH=/app

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

RUN groupadd --gid 1001 substrate && \
    useradd --uid 1001 --gid substrate --no-create-home --shell /usr/sbin/nologin substrate

COPY src/ ./src/
COPY engine/ ./engine/
RUN mkdir -p /data/models /data/cache && \
    chown -R substrate:substrate /app /data

USER substrate
EXPOSE 8070

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${SUBSTRATE_INFERENCE_PORT:-8070}/ready')" || exit 1

LABEL org.opencontainers.image.title="substrate-inference-cpu-stub" \
      org.opencontainers.image.description="Development-only CPU contract surface; deliberately non-ready for inference." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary"

CMD ["python", "-m", "src.main"]

# ─── Stage 2: slim GPU runtime ────────────────────────────────────────────
FROM nvidia/cuda:13.4.2-cudnn-runtime-ubuntu22.04@sha256:d5982da4024f00929ce8297a901f2c962b9fb06e3b9df2fdca35ecbdcd6754ee AS runtime

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
    SUBSTRATE_INFERENCE_ENV=production \
    SUBSTRATE_INFERENCE_PORT=8070 \
    PYTHONPATH=/app

EXPOSE 8070

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python3.11 -c "import urllib.request; urllib.request.urlopen('http://localhost:${SUBSTRATE_INFERENCE_PORT:-8070}/ready')" || exit 1

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="substrate-inference" \
      org.opencontainers.image.description="Substrate Edge Inference — governed local GPU transformer service with an OpenAI-shaped API." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.1.0" \
      org.opencontainers.image.vendor="SZL Holdings"

CMD ["python3.11", "-m", "src.main"]
