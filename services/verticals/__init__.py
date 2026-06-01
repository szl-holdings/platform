"""Alloy Meridian vertical packs.

Each subpackage under ``services/verticals/<vertical_id>/`` is an independent
"vertical pack" implementing the substrate contract defined in
``services.verticals.contracts``. Packs are intentionally lightweight stubs in
this pass — they emit one deterministic sample recommendation and have one
unittest. Real signal ingestion, forecasting, and live LLM calls live behind
feature flags and arrive in follow-up tasks.

Substrate spec: see ``docs/`` and the payload referenced in this scaffold's
commit message.
"""
