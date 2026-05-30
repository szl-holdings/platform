# syntax=docker/dockerfile:1
#
# apps/eval-runner — Eval Runner (FastAPI reproducibility harness).
#
# BUILD FROM THE MONOREPO ROOT (per the shared-context convention for this
# repo's Dockerfiles):
#   docker build -f apps/eval-runner/Dockerfile -t eval-runner .
#
# Unlike the other eight servers, eval-runner is a Python FastAPI service (not
# a pnpm workspace package): it has no package.json, no workspace:* deps, and
# is driven by requirements.txt + run.py (Procfile: `web: python run.py`).
#
# HONEST RUNTIME CAVEAT (verify before deploy):
#   run.py launches uvicorn with the import target "src.main:app", but the
#   apps/eval-runner/ directory in this repo contains only run.py, conftest.py,
#   test_suite_reproducibility.py, requirements.txt, Procfile, and README.md —
#   there is NO src/ package and therefore NO src/main:app to import. This
#   image builds, but the container will fail at startup until the FastAPI
#   application module (src/main.py exposing `app`) is added. No stub app was
#   fabricated here; the missing module is reported rather than papered over.
#   The OCI version label is set to 0.0.0 because eval-runner declares no
#   version field anywhere (no package.json / pyproject version for this app).

# ─── Stage 1: dependency builder ─────────────────────────────────────────────
FROM python:3.11-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /build
# Only the runtime deps are installed here; the optional GPU extras documented
# in requirements.txt comments are intentionally left for a GPU host.
COPY apps/eval-runner/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# ─── Stage 2: minimal runtime ────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

# Pre-built virtualenv with production deps only.
COPY --from=builder /opt/venv /opt/venv

# uid/gid 1000 non-root user
RUN groupadd --gid 1000 app && \
    useradd --uid 1000 --gid app --no-create-home --shell /sbin/nologin app

WORKDIR /app
# Copy only the eval-runner application files (root context, scoped path).
COPY --chown=app:app apps/eval-runner/ ./

USER app

ENV NODE_ENV=production \
    PORT=8001 \
    PYTHONPATH=/app
# run.py reads process env PORT, defaulting to 8001, and binds 0.0.0.0.
EXPOSE 8001

# No HTTP health endpoint is defined for this service (no /healthz, and the
# FastAPI app module is absent), so no HEALTHCHECK is declared.

# Documented entry (Procfile: `web: python run.py`).
CMD ["python", "run.py"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="eval-runner" \
      org.opencontainers.image.description="Eval Runner — FastAPI reproducibility harness that runs the guardrails test suite and emits deterministic CPS proof-chain artifacts." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.0.0" \
      org.opencontainers.image.vendor="SZL Holdings"
