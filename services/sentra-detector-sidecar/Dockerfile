FROM python:3.11-slim AS base
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY requirements.txt ./
RUN pip install --upgrade pip wheel \
    && pip install -r requirements.txt

FROM base AS runner
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin
COPY src ./src

RUN groupadd --system --gid 1001 sidecar \
    && useradd  --system --uid 1001 --gid sidecar sidecar
USER sidecar

ENV PYTHONPATH=/app/src \
    PORT=8765 \
    SENTRA_SIDECAR_HOST=0.0.0.0

EXPOSE 8765

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/szl-holdings-platform"
LABEL org.opencontainers.image.description="Sentra Detector Sidecar — FastAPI host for Python anomaly detectors"
LABEL org.opencontainers.image.licenses="UNLICENSED"

CMD ["python", "-m", "sidecar.main"]
