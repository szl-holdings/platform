"""Bundled reference vertical packs.

The seven follow-up verticals (Pulse, Finance/Fincept, Lyte/KORA, Terra,
Vessels, PRISM Counsel, Marketing/Growth) plug in via the
``a11oy_fabric_py.packs`` entry-point group documented in the README.
"""

from __future__ import annotations

from .platform_agentops import platform_agentops_pack
from .cyber_resilience import cyber_resilience_pack

__all__ = ["platform_agentops_pack", "cyber_resilience_pack"]
