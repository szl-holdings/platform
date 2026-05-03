"""VerticalPack protocol + registry.

The two-plane execution model from the Codex Execution Plan is first-class:

* ``discover()`` is **always** side-effect-free and runs in any mode.
* ``recommend()`` produces ActionBriefs whose ``requiresApproval`` defaults
  derive from registered CovenantPolicies. In ``discovery`` mode the
  emitted actions are forced to ``status="recommended"`` and never executed.
* ``evaluate()`` runs the covenant gate against each action.
* ``emit()`` returns the populated PackRunReport. Persistence + PCPR are
  handled by the engine, not the pack.

Packs may be registered programmatically or discovered via the
``a11oy_fabric_py.packs`` Python entry-point group so future verticals plug
in without engine changes.
"""

from __future__ import annotations

import importlib
import importlib.metadata as importlib_metadata
from datetime import datetime, timezone
from typing import Any, Protocol, runtime_checkable

import structlog

from .layers import LayerBundle, default_layer_bundle
from .models import (
    ActionBrief,
    BusinessSignal,
    BusinessTwin,
    CovenantPolicy,
    Outcome,
    PackRunReport,
)
from .proof import fingerprint_inputs
from .types import ENGINE_VERSION, ExecutionMode, Vertical

_log = structlog.get_logger(__name__)


class PackContext:
    """Shared state passed to every pack call."""

    def __init__(
        self,
        *,
        run_id: str,
        mode: ExecutionMode,
        layers: LayerBundle | None = None,
    ) -> None:
        self.run_id = run_id
        self.mode = mode
        self.layers = layers or default_layer_bundle()
        self.started_at = datetime.now(timezone.utc).isoformat()


@runtime_checkable
class VerticalPack(Protocol):
    """Contract every vertical pack implements."""

    slug: str
    vertical: Vertical
    version: str

    def discover(self, ctx: PackContext) -> dict[str, Any]:
        """Side-effect-free discovery. Returns the input dict that gets
        fingerprinted into the PCPR. Must not mutate external state."""

    def recommend(
        self, ctx: PackContext, discovery: dict[str, Any]
    ) -> tuple[list[BusinessSignal], list[Outcome], list[ActionBrief], list[CovenantPolicy]]:
        """Produce signals, outcomes, recommended actions, and the covenant
        policies relevant to this pack."""

    def evaluate(
        self,
        ctx: PackContext,
        actions: list[ActionBrief],
        policies: list[CovenantPolicy],
    ) -> list[ActionBrief]:
        """Run the covenant gate. Mutates each action's requiresApproval /
        approvalTier fields to match policy verdicts."""

    def emit(
        self,
        ctx: PackContext,
        *,
        signals: list[BusinessSignal],
        outcomes: list[Outcome],
        actions: list[ActionBrief],
        policies: list[CovenantPolicy],
        twins: list[BusinessTwin],
        discovery: dict[str, Any],
    ) -> PackRunReport:
        """Assemble the final PackRunReport. Must be deterministic given the
        same inputs (modulo the injected ``runId`` + timestamps)."""


class PackRegistry:
    """In-memory registry of vertical packs.

    Packs may be added via ``register()`` (programmatic) or discovered via
    the ``a11oy_fabric_py.packs`` Python entry-point group at startup. The
    registry is the only thing the CLI needs to enumerate runnable packs.
    """

    ENTRY_POINT_GROUP = "a11oy_fabric_py.packs"

    def __init__(self) -> None:
        self._packs: dict[str, VerticalPack] = {}

    def register(self, pack: VerticalPack) -> None:
        if pack.slug in self._packs:
            raise ValueError(f"pack already registered: {pack.slug!r}")
        if not isinstance(pack, VerticalPack):
            raise TypeError(f"{pack!r} does not satisfy the VerticalPack protocol")
        self._packs[pack.slug] = pack

    def get(self, slug: str) -> VerticalPack:
        if slug not in self._packs:
            raise KeyError(slug)
        return self._packs[slug]

    def has(self, slug: str) -> bool:
        return slug in self._packs

    def list(self) -> list[VerticalPack]:
        return [self._packs[s] for s in sorted(self._packs)]

    def load_entry_points(self) -> None:
        try:
            eps = importlib_metadata.entry_points(group=self.ENTRY_POINT_GROUP)
        except TypeError:
            # Python <3.10 compatibility shim, not strictly needed at 3.11+.
            eps = importlib_metadata.entry_points().get(self.ENTRY_POINT_GROUP, [])  # type: ignore[attr-defined]
        for ep in eps:
            try:
                factory = ep.load()
                pack = factory() if callable(factory) else factory
                if not self.has(pack.slug):
                    self.register(pack)
            except Exception as exc:  # pragma: no cover — defensive
                _log.warning("pack-entry-point-failed", entry=str(ep), error=str(exc))


_REGISTRY: PackRegistry | None = None


def get_registry() -> PackRegistry:
    """Return the process-wide registry, lazily importing the bundled packs.

    The bundled reference packs (platform-agentops, cyber-resilience) are
    always registered. External packs published via the
    ``a11oy_fabric_py.packs`` entry-point group are loaded on top.
    """

    global _REGISTRY
    if _REGISTRY is not None:
        return _REGISTRY

    reg = PackRegistry()
    # Bundled reference packs.
    pkg = importlib.import_module("a11oy_fabric_py.packs")
    for factory_name in ("platform_agentops_pack", "cyber_resilience_pack"):
        factory = getattr(pkg, factory_name)
        reg.register(factory())
    reg.load_entry_points()
    _REGISTRY = reg
    return reg


# ── Engine helpers ──────────────────────────────────────────────────────────


def run_pack(pack: VerticalPack, ctx: PackContext) -> tuple[PackRunReport, dict[str, Any]]:
    """Execute a single pack end-to-end. Returns (report, discovery_input).

    The discovery_input is the dict fingerprinted into the PCPR so the engine
    can reconstruct the exact inputs that produced the report.
    """

    discovery = pack.discover(ctx)

    signals, outcomes, actions, policies = pack.recommend(ctx, discovery)
    for s in signals:
        ctx.layers.signal_mesh.ingest(s)
    for p in policies:
        ctx.layers.covenant_layer.register(p)
    for o in outcomes:
        ctx.layers.causal_core.link(
            o, [s for s in signals if s.id in set(o.linkedSignalIds)]
        )

    twins = ctx.layers.state_engine.project(signals)

    # In discovery mode, force every action back to "recommended" and never
    # mark them executable. This is the hard read-only / gated-mutation gate.
    if ctx.mode == "discovery":
        for a in actions:
            a.status = "recommended"
            a.requiresApproval = True

    actions = pack.evaluate(ctx, actions, policies)
    for a in actions:
        ctx.layers.action_rail.recommend(a)

    report = pack.emit(
        ctx,
        signals=signals,
        outcomes=outcomes,
        actions=actions,
        policies=policies,
        twins=twins,
        discovery=discovery,
    )
    report.engineVersion = ENGINE_VERSION
    report.fabricStatus = ctx.layers.status()
    report.runId = ctx.run_id
    report.mode = ctx.mode
    report.startedAt = ctx.started_at
    report.completedAt = datetime.now(timezone.utc).isoformat()
    report.inputFingerprint = fingerprint_inputs(discovery)

    return report, discovery
