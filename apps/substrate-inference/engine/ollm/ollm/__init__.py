"""
oLLM — Vendored Engine Interface for Substrate Inference.

This package provides the ``AutoInference`` class that wraps HuggingFace
transformer models with SSD-offloaded KV cache and FlashAttention-2 support
for running 80B+ parameter models on consumer GPUs (>= 8 GB VRAM).

Core capabilities:
  - SSD-offloaded KV cache for context windows exceeding available VRAM
  - CPU layer offloading for memory-constrained GPU environments
  - FlashAttention-2 integration for O(N) attention memory usage
  - Multimodal support via AutoProcessor (image + audio content blocks)

Install the full engine::

    pip install ollm            # PyPI release
    pip install -e engine/ollm  # from vendored source

Requires:
    - CUDA-capable GPU with >= 8 GB VRAM
    - torch >= 2.2 with CUDA support
    - flash-attn >= 2.5 (optional but recommended)
"""

from .auto_inference import AutoInference

__version__ = "0.4.2"
__all__ = ["AutoInference"]
