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
# RUNTIME NOTE:
#   run.py launches uvicorn with the import target "src.main:app". The src/
#   package is now present (src/main.py exposes the FastAPI `app`, backed by
#   src/suites.py graders and src/lm_eval_bridge.py). The earlier caveat that
#   the container would fail at startup for lack of src/main:app no longer
#   applies: the image both builds and boots. The app serves /healthz plus a
#   real /eval endpoint that scores eval suites through their graders.
#   Offline by default (EVAL_OFFLINE_FALLBACK): the standard suite uses the
#   built-in offline baseline; the lm-eval online adapters require the GPU
#   extras documented in requirements.txt.
#   The OCI version label is set to the app version declared in src/main.py.

# ─── Stage 1: dependency builder ─────────────────────────────────────────────
FROM python:3.14-slim@sha256:cae66f2ef0ec51a9891263eeee7f987dacf0a9879e8aa9353d5606e0530619a5 AS builder

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
FROM python:3.14-slim@sha256:cae66f2ef0ec51a9891263eeee7f987dacf0a9879e8aa9353d5606e0530619a5 AS runtime

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

# /healthz is served by src/main.py; declare a container healthcheck against it.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','8001')+'/healthz').read()" || exit 1

# Documented entry (Procfile: `web: python run.py`).
CMD ["python", "run.py"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="eval-runner" \
      org.opencontainers.image.description="Eval Runner — FastAPI reproducibility harness that runs the guardrails test suite and emits deterministic CPS proof-chain artifacts." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.1.0" \
      org.opencontainers.image.vendor="SZL Holdings"
