# syntax=docker/dockerfile:1

# The worker currently has no hashed dependency lock or release SBOM. This
# image makes the tracked service buildable and testable, but it is not itself
# a production-promotion receipt.

FROM python:3.14-slim@sha256:cad9a2c871761c413caa6fdd6441c783451e740a48aaeba60ae62a8b53525ef6 AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /build

COPY pyproject.toml ./
COPY src/ ./src/

# The optional proxy CA mount supports managed build environments without
# weakening TLS verification. Normal builds use the image's system trust.
RUN --mount=type=secret,id=proxy_ca,required=false \
    if [ -s /run/secrets/proxy_ca ]; then \
      PIP_CERT=/run/secrets/proxy_ca pip wheel --wheel-dir /wheels .; \
    else \
      pip wheel --wheel-dir /wheels .; \
    fi

FROM python:3.14-slim@sha256:cad9a2c871761c413caa6fdd6441c783451e740a48aaeba60ae62a8b53525ef6 AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    HOST=0.0.0.0 \
    PORT=8090

# OCR and PDF stages call these system binaries through pytesseract/pdf2image.
RUN apt-get update && apt-get install -y --no-install-recommends \
      poppler-utils \
      tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /wheels /wheels
RUN pip install --no-index --find-links=/wheels substrate-py-workers \
    && rm -rf /wheels

RUN groupadd --gid 1001 substrate \
    && useradd --uid 1001 --gid substrate --no-create-home --shell /usr/sbin/nologin substrate

WORKDIR /app
USER substrate

EXPOSE 8090

HEALTHCHECK --interval=20s --timeout=8s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8090}/ready')" || exit 1

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="substrate-py-workers" \
      org.opencontainers.image.description="Substrate Python stage worker evaluation image." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="SZL Holdings"

CMD ["python", "-m", "worker.main"]
