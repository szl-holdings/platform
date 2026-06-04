"""
Heavy-compute stage: Geospatial intersection and anomaly detection.

Used by:
  - Vessels — voyage event anomaly detection (AIS track deviation, dwell analysis)
  - Terra   — property boundary intersection and spatial risk scoring

Contract:
  input:
    domain: str                  — "vessels" | "terra"
    features: list[dict]         — GeoJSON-like feature objects with geometry
    zones: list[dict]            — reference zones / boundaries to intersect against
    anomalyWindowHours: float    — time window for anomaly detection (default 24)
    zScoreThreshold: float       — z-score threshold for anomaly flag (default 2.5)
    mode: str

  output:
    intersections: list[dict]    — featureId, zoneId, overlapScore, properties
    anomalies: list[dict]        — featureId, anomalyType, score, details
    intersectionCount: int
    anomalyCount: int
    spatialHash: str             — deterministic replay hash
    worker: str
"""

from __future__ import annotations

import hashlib
import json
import math
import time
from typing import Any


def _bbox_overlap(bbox_a: list[float], bbox_b: list[float]) -> float:
    """
    Compute intersection-over-union (IoU) for two axis-aligned bounding boxes.
    Each bbox is [minX, minY, maxX, maxY].  Returns score in [0, 1].
    """
    ax1, ay1, ax2, ay2 = bbox_a
    bx1, by1, bx2, by2 = bbox_b

    ix1 = max(ax1, bx1)
    iy1 = max(ay1, by1)
    ix2 = min(ax2, bx2)
    iy2 = min(ay2, by2)

    if ix2 <= ix1 or iy2 <= iy1:
        return 0.0

    i_area = (ix2 - ix1) * (iy2 - iy1)
    a_area = (ax2 - ax1) * (ay2 - ay1)
    b_area = (bx2 - bx1) * (by2 - by1)
    union = a_area + b_area - i_area
    return i_area / union if union > 0 else 0.0


def _feature_bbox(feature: dict) -> list[float] | None:
    geom = feature.get("geometry") or {}
    coords = geom.get("coordinates")
    if not coords:
        bbox = feature.get("bbox")
        if bbox and len(bbox) >= 4:
            return list(bbox[:4])
        props = feature.get("properties") or {}
        lat = props.get("lat") or props.get("latitude")
        lon = props.get("lon") or props.get("longitude")
        if lat is not None and lon is not None:
            d = 0.01
            return [lon - d, lat - d, lon + d, lat + d]
        return None

    flat_coords = _flatten_coords(coords)
    if not flat_coords:
        return None
    xs = [c[0] for c in flat_coords]
    ys = [c[1] for c in flat_coords]
    return [min(xs), min(ys), max(xs), max(ys)]


def _flatten_coords(coords: Any) -> list[list[float]]:
    if not coords:
        return []
    if isinstance(coords[0], (int, float)):
        return [coords]
    result: list[list[float]] = []
    for c in coords:
        result.extend(_flatten_coords(c))
    return result


def _z_score_anomaly(values: list[float], threshold: float) -> list[int]:
    if not values or len(values) < 2:
        return []
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    std = math.sqrt(variance) or 1e-9
    return [i for i, v in enumerate(values) if abs((v - mean) / std) > threshold]


def _spatial_hash(features: list[dict], zones: list[dict]) -> str:
    payload = json.dumps(
        {
            "feature_ids": sorted(f.get("id", "") for f in features),
            "zone_ids": sorted(z.get("id", "") for z in zones),
        },
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


async def execute(claim: dict[str, Any]) -> dict[str, Any]:
    start = time.monotonic()
    raw_input = claim.get("input") or {}
    mode = claim.get("mode", "live")

    domain: str = raw_input.get("domain", "vessels")
    features: list[dict] = raw_input.get("features") or []
    zones: list[dict] = raw_input.get("zones") or []
    z_threshold: float = float(raw_input.get("zScoreThreshold") or 2.5)

    spatial_hash = _spatial_hash(features, zones)

    if mode == "dry-run":
        return {
            "intersections": [],
            "anomalies": [],
            "intersectionCount": 0,
            "anomalyCount": 0,
            "spatialHash": spatial_hash,
            "worker": "python-fleet",
            "dryRun": True,
        }

    if mode == "replay" and raw_input.get("replayHash"):
        expected = raw_input["replayHash"]
        if spatial_hash != expected:
            raise ValueError(
                f"Geospatial replay hash mismatch: expected {expected!r}, got {spatial_hash!r}."
            )

    intersections: list[dict] = []
    for feat in features:
        feat_id = feat.get("id", "f?")
        feat_bbox = _feature_bbox(feat)
        if feat_bbox is None:
            continue
        for zone in zones:
            zone_id = zone.get("id", "z?")
            zone_bbox = _feature_bbox(zone)
            if zone_bbox is None:
                continue
            overlap = _bbox_overlap(feat_bbox, zone_bbox)
            if overlap > 0:
                intersections.append({
                    "featureId": feat_id,
                    "zoneId": zone_id,
                    "overlapScore": round(overlap, 4),
                    "domain": domain,
                    "properties": {
                        "featBbox": feat_bbox,
                        "zoneBbox": zone_bbox,
                    },
                })

    overlap_scores = [x["overlapScore"] for x in intersections]
    anomaly_indices = _z_score_anomaly(overlap_scores, z_threshold)

    anomalies: list[dict] = []
    for idx in anomaly_indices:
        inter = intersections[idx]
        anomalies.append({
            "featureId": inter["featureId"],
            "zoneId": inter["zoneId"],
            "anomalyType": "spatial_overlap_outlier",
            "score": inter["overlapScore"],
            "zScoreThreshold": z_threshold,
            "details": f"Overlap score {inter['overlapScore']} is a statistical outlier",
        })

    elapsed_ms = int((time.monotonic() - start) * 1000)

    return {
        "intersections": intersections,
        "anomalies": anomalies,
        "intersectionCount": len(intersections),
        "anomalyCount": len(anomalies),
        "spatialHash": spatial_hash,
        "domain": domain,
        "elapsedMs": elapsed_ms,
        "worker": "python-fleet",
        "mode": mode,
    }
