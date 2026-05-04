"""Bundled reference vertical packs."""

from .platform_agentops.pack import PlatformAgentOpsPack
from .cyber_resilience.pack import CyberResiliencePack


def register_all() -> None:
    """Ensure bundled packs are registered. Idempotent."""
    from ..pack import get_registry
    get_registry()
