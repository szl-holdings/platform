"""Substrate inference runtime around the checked-in Transformers adapter.

When its GPU/dependency boundary is unavailable, the runtime uses a clearly
labelled development STUB. Production startup rejects that STUB.
"""
from .runtime import SubstrateRuntime, EngineMode

__all__ = ["SubstrateRuntime", "EngineMode"]
