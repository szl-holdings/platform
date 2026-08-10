# SZL customer-portal — FastAPI commercial surface.
# HF Space (sdk: docker). Sovereign: no external API keys required to boot.
# OIDC issuer + cosign keymint are optional env (see README). Author: Yachay.
# Doctrine v11 LOCKED 749/14/163 locked_at c7c0ba17.
FROM python:3.14-slim@sha256:a7fb1e634c4a578f9e0bd6327f11a3cde11b7a9395f48e24360c0988bcc5c2bc

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    SZL_PORTAL_DB=/data/portal.db

# per-file COPY (auditable build model, matches flagship convention)
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY app/app.py ./app/app.py
COPY app/quota.py ./app/quota.py
COPY app/verify_key.py ./app/verify_key.py
COPY app/schema.sql ./app/schema.sql

# initialise the SQLite store at build time into a writable volume path
RUN mkdir -p /data && python -c "import sqlite3,os; sqlite3.connect('/data/portal.db').executescript(open('app/schema.sql').read())"

EXPOSE 7860
# HF Spaces route to port 7860 by default.
CMD ["python", "-m", "uvicorn", "app.app:app", "--host", "0.0.0.0", "--port", "7860"]
