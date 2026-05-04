# ─── Stage 1: dependency builder ────────────────────────────────────────────
FROM python:3.11-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    libgdal-dev \
    gdal-bin \
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    libpoppler-cpp-dev \
    poppler-utils \
    libffi-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /build
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Optional GPU/ML deps — quote all specifiers so >= is NOT treated as shell redirect
RUN pip install "torch>=2.5.0" "transformers>=4.47.0" "sentence-transformers>=3.0.0" \
    || echo "torch/transformers optional GPU deps unavailable; stub mode will be used"

# GDAL Python binding — version must match the system library exactly
RUN GDAL_VER=$(gdal-config --version 2>/dev/null || echo "") && \
    if [ -n "$GDAL_VER" ]; then \
        pip install "GDAL==${GDAL_VER}" || pip install GDAL --no-build-isolation; \
    else \
        echo "gdal-config not found; GDAL binding skipped"; \
    fi

# ─── Stage 2: slim runtime ───────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libgdal30 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv

RUN groupadd --gid 1001 worker && \
    useradd --uid 1001 --gid worker --no-create-home --shell /sbin/nologin worker

WORKDIR /app
# Copy src/ so the module is at /app/src/worker/
COPY src/ ./src/

RUN chown -R worker:worker /app

USER worker

# PYTHONPATH must include /app/src so `python -m worker.main` resolves the module
ENV PORT=8090 \
    WORKER_MAX_CONCURRENCY=4 \
    WORKER_DRAIN_TIMEOUT_S=60 \
    PYTHONPATH=/app/src

EXPOSE 8090

HEALTHCHECK --interval=20s --timeout=8s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8090}/health')" || exit 1

CMD ["python", "-m", "worker.main"]
