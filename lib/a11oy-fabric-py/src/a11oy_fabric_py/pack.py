"""VerticalPack protocol + registry.

Packs may be registered programmatically or discovered via the
``a11oy_fabric_py.packs`` Python entry-point group so future verticals plug
in without engine changes.
"""

from __future__ import annotations

import importlib.metadata as _importlib_meta
from typing import Protocol, runtime_checkable

from .models import (
    BusinessSignal, Outcome, ActionBrief, PackRunReport,
    ExecutionMode,
)


@runtime_checkable
class VerticalPack(Protocol):
    @property
    def slug(self) -> str: ...

    @property
    def vertical(self) -> str: ...

    @property
    def version(self) -> str: ...

    def discover(self) -> list[BusinessSignal]:
        """Read-only discovery plane — always side-effect-free."""
        ...

    def recommend(self, signals: list[BusinessSignal], mode: ExecutionMode) -> list[ActionBrief]:
        """Gated mutation plane — produces ActionBriefs with approval defaults."""
        ...

    def evaluate(self, signals: list[BusinessSignal], actions: list[ActionBrief]) -> list[Outcome]:
        """Evaluate outcomes from discovered signals and recommended actions."""
        ...

    def emit(self, signals: list[BusinessSignal], actions: list[ActionBrief], outcomes: list[Outcome], mode: ExecutionMode) -> PackRunReport:
        """Assemble the final pack run report."""
        ...


class PackRegistry:
    """In-memory registry of vertical packs.

    Packs may be added via ``register()`` (programmatic) or discovered via
    the ``a11oy_fabric_py.packs`` Python entry-point group at startup.
    """

    ENTRY_POINT_GROUP = "a11oy_fabric_py.packs"

    def __init__(self) -> None:
        self._packs: dict[str, VerticalPack] = {}

    def register(self, pack: VerticalPack) -> None:
        self._packs[pack.slug] = pack

    def get(self, slug: str) -> VerticalPack | None:
        return self._packs.get(slug)

    def has(self, slug: str) -> bool:
        return slug in self._packs

    def list_slugs(self) -> list[str]:
        return sorted(self._packs)

    def list_all(self) -> list[VerticalPack]:
        return [self._packs[s] for s in sorted(self._packs)]

    def load_entry_points(self) -> None:
        try:
            eps = _importlib_meta.entry_points(group=self.ENTRY_POINT_GROUP)
        except TypeError:
            eps = _importlib_meta.entry_points().get(self.ENTRY_POINT_GROUP, [])
        for ep in eps:
            try:
                factory = ep.load()
                pack = factory() if callable(factory) else factory
                if not self.has(pack.slug):
                    self.register(pack)
            except Exception:
                pass


_REGISTRY: PackRegistry | None = None


def get_registry() -> PackRegistry:
    """Return the process-wide registry, lazily importing the bundled packs."""
    global _REGISTRY
    if _REGISTRY is not None:
        return _REGISTRY
    reg = PackRegistry()
    _REGISTRY = reg
    from .packs.platform_agentops.pack import PlatformAgentOpsPack
    from .packs.cyber_resilience.pack import CyberResiliencePack
    reg.register(PlatformAgentOpsPack())
    reg.register(CyberResiliencePack())
    reg.load_entry_points()
    return reg


def register_pack(pack: VerticalPack) -> None:
    get_registry().register(pack)


def get_pack(slug: str) -> VerticalPack | None:
    return get_registry().get(slug)


def list_packs() -> list[str]:
    return get_registry().list_slugs()


def get_all_packs() -> dict[str, VerticalPack]:
    reg = get_registry()
    return {s: reg.get(s) for s in reg.list_slugs()}
