# SPDX-License-Identifier: Apache-2.0
# Rosie Operator Console — Docker runtime (mirrors a11oy winning pattern).
# HF Spaces sdk: docker runs this CMD, which executes our uvicorn __main__ block,
# serving BOTH the 11-tab Gradio UI (root) AND the mirrored /v1/* FastAPI contract
# (root + /api/rosie + /api/a11oy) on a single port. Under sdk: gradio, HF would
# auto-launch only `demo` and drop the FastAPI POST/DELETE routes — root cause of
# the 405s. Docker hands control to app.py so the full hybrid app is served.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860 \
    HOME=/home/user \
    GRADIO_SERVER_NAME=0.0.0.0 \
    GRADIO_SERVER_PORT=7860

# HF Spaces best-practice: run as a non-root user (uid 1000).
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

COPY --chown=user requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY --chown=user app.py rosie_v2_additions.py ./
# ADDITIVE (Doctrine v10/v11): shared agentic-RAG service (organ=all; rosie inherits everything).
COPY --chown=user szl_rag.py ./
# H-backplane (ADDITIVE, Doctrine v10/v11): lean-kernel proxy + /lean page.
COPY --chown=user lean_wire.py ./
# Anatomy substrate (ADDITIVE): portable formulas+composer + Gradio tabs module.
COPY --chown=user szl_formulas.py rosie_anatomy_tabs.py ./

USER user
EXPOSE 7860

# Executes the uvicorn __main__ block in app.py -> serves Gradio UI + FastAPI /v1/*.
COPY --chown=user szl_brain.py szl_wire.py szl_jack.py szl_formulas.py ./
COPY --chown=user rosie_brain_tab.py rosie_dinn_tab.py rosie_moat_tabs.py rosie_upgrades_tab.py ./
COPY --chown=user thesis_corpus_171.csv ./
COPY --chown=user OUROBOROS_RUN_ALL.py run_all_json.py cursor_reinstill.json lean_wire.py ./
CMD ["python", "app.py"]
