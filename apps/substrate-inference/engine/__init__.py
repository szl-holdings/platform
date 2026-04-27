"""
oLLM Engine Wrapper — bridges the Substrate Inference service to the upstream oLLM library.

This module attempts to import and use the real oLLM inference engine. If the engine
is not installed (e.g., CPU-only development environment), it falls back to a stub
that returns clearly-marked placeholder responses.

Production deployment:
  pip install ollm          # or: pip install -e engine/
  # Requires CUDA-capable GPU with >= 8 GB VRAM
"""
from .runtime import SubstrateRuntime, EngineMode

__all__ = ["SubstrateRuntime", "EngineMode"]
