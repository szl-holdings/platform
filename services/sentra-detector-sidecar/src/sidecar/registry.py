"""In-process registry of Python detectors hosted by the sidecar."""

from __future__ import annotations

from .contracts import Detector


class DetectorRegistry:
    def __init__(self) -> None:
        self._detectors: dict[str, Detector] = {}

    def register(self, detector: Detector) -> None:
        self._detectors[detector.manifest.id] = detector

    def get(self, detector_id: str) -> Detector | None:
        return self._detectors.get(detector_id)

    def list(self) -> list[Detector]:
        return list(self._detectors.values())


registry = DetectorRegistry()
