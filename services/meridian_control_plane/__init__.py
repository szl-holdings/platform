"""Alloy Meridian control plane — model policy loader, flight recorder, orchestrator.

The control plane is the shared substrate that every vertical pack routes through.
It enforces the model policy (routing, approval gates) and writes every consequential
decision event to the Business Flight Recorder.

Key modules:
- model_policy   : load + validate ops/a11oy/model-policy.json
- flight_recorder: append-only JSONL decision ledger
- meridian_control_plane: orchestrator that walks the vertical registry

Research seams (not hard deps, referenced in comments only):
- Langfuse / Arize Phoenix / OpenLIT for observability
- PydanticAI / LangGraph for agent orchestration
"""
