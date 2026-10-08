"""
oLLM — Vendored Engine Interface for Substrate Inference.

This package provides the checked-in ``AutoInference`` compatibility adapter
around Hugging Face Transformers. It can select FlashAttention-2 when that
optional dependency is present.

SSD KV-cache offload and explicit CPU-layer offload are not implemented in this
source subset. Requests for either option fail closed.

Development installation::

    pip install -e engine/ollm

Requires:
    - a supported GPU backend
    - the dependency versions declared by this package
    - flash-attn (optional)
"""

from .auto_inference import AutoInference

__version__ = "0.4.2"
__all__ = ["AutoInference"]
