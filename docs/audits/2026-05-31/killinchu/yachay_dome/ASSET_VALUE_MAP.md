# ASSET-VALUE MAP — Operator-Defined Defended Zones + ROE

> **Author:** Yachay · **Date:** 2026-06-01 · **Component of:** Yachay-Dome (`YACHAY_DOME_DOCTRINE.md` §2).
> **Function:** the operator pre-loads **asset polygons + value tier + per-zone ROE**. Escalation fires **only** when
> `predict-impact polygon ∩ asset polygon ≠ ∅` **and** `asset.value ≥ θ`. **Pure geometry. Defensible. No effector.**
> This is the mPrest "is the predicted impact in a *designated/defended* area?" decision (`IADS_DOCTRINE_STUDY.md` §1.3),
> made operator-authorable and Khipu-receipted.

---

## 0. Why this is the legal keystone

The single most defensible thing about Iron Dome's doctrine is that it **only acts when the impact threatens a defended area** — otherwise it lets the rocket fall on open ground ([Iron Dome — Wikipedia](https://en.wikipedia.org/wiki/Iron_Dome); [CSIS Iron Dome](https://missilethreat.csis.org/defsys/iron-dome/)). Yachay-Dome makes that decision a **pure set-intersection over operator-authored geometry**: a cue is *mathematically impossible* unless a predicted-impact polygon intersects a polygon the operator pre-declared as valued. There is no discretion to hide — the gate is geometry + a threshold, both recorded in the receipt.

---

## 1. Asset ingest — KML / GeoJSON

The operator pre-loads defended assets as standard geospatial files (the same formats the Cesium recipe ingests — `450_3D_LEADERS_ADOPTION.md` "standards-first ingest: accept KML/GeoJSON/CoT/STANAG"). Each feature carries Yachay-Dome properties:

```json
{
  "type": "FeatureCollection",
  "name": "defended-assets-site-alpha",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Polygon", "coordinates": [[[-74.012,40.706],[-74.000,40.706],[-74.000,40.716],[-74.012,40.716],[-74.012,40.706]]] },
      "properties": {
        "asset_id": "hq-building-1",
        "name": "SZL HQ",
        "value_tier": "V5",
        "value_threshold_theta": 0.20,
        "roe_zone": "warn_and_cue",
        "altitude_floor_m_agl": 0,
        "altitude_ceiling_m_agl": 400,
        "authority_regime": "DHS_6USC124n|FAA_49USC44810|DoD_T10|NRC|USCG|private",
        "buffer_m": 250,
        "active_hours_utc": "always|2026-06-16T14:00:00Z/2026-06-16T22:00:00Z",
        "khipu_zone_receipt_id": "khipu:sha256:..."
      }
    }
  ]
}
```

- **KML** is accepted and converted to GeoJSON on ingest (`fastkml`/`togeojson`); altitude bands map to the polygon's `altitude_floor/ceiling`.
- `buffer_m` lets the operator declare a standoff ring (the JCO "maximize operational standoff" principle — [AUSA](https://www.ausa.org/articles/countering-small-drones-office-works-toward-joint-solutions-growing-threat)). Implemented as a geometric buffer of the polygon.
- `authority_regime` tags **which customer-lane authority** governs this zone (the venue-specific mapping in `DOMESTIC_ADJACENCY.md`) — so the cue routes to the right authorized actor.
- Each zone-load emits a **Khipu receipt** (`khipu_zone_receipt_id`): the ROE itself is part of the auditable chain, so a court sees the rules were set *before* the event, not after.

---

## 2. The intersection gate (the math)

For each track's impact prediction (`PREDICT_IMPACT_ENGINE.md`) at each horizon, against each active asset zone:

```python
def necessity_gate(impact_pred, asset_zones, now_utc):
    fires = False
    hits = []
    for z in asset_zones:
        if not zone_active(z, now_utc):           # active_hours window
            continue
        zone_poly = buffer(z.polygon, z.buffer_m)  # standoff ring
        for h in impact_pred.horizons:
            if altitude_band_overlap(h, z) and intersects(h.polygon_geojson, zone_poly):
                p = monte_carlo_intersection_fraction(impact_pred, zone_poly, h)
                theta = z.value_threshold_theta     # monotone-decreasing in value tier
                if p >= theta:
                    fires = True
                    hits.append({"asset_id": z.asset_id, "value_tier": z.value_tier,
                                 "horizon_s": h.t_plus_s, "p_impact": p,
                                 "authority_regime": z.authority_regime})
    return {"gate_fires": fires, "hits": hits}
```

**Properties:**
- `gate_fires == False` for any track over **V0 / empty space** (no zone, or `θ` unreachable) — *cannot* cue. Matches `YACHAY_DOME_DOCTRINE.md` §2.
- `θ` is **monotone-decreasing in value tier** (V5 lowest θ, fires most readily; V0 unbounded, never fires).
- The output `hits[]` flows into the FSM transition `CUE_CANDIDATE` and into the `/v1/cue` package's `asset_intersections`.
- **Spoof-hardening:** `intersects()` operates on the *fused-track-derived* polygon, never on an unauthenticated RID-claimed position alone (`DETECTION_LAYERS.md` §6) — a spoofed "I'm benign over here" cannot move a real track out of a zone.

---

## 3. CesiumJS overlay layer (recipe #11 adoption)

Adopts recipe **#11** (`450_3D_LEADERS_ADOPTION.md`, P0 for killinchu) — CesiumJS time-dynamic globe + Deck.gl overlay + Lattice single-operational-picture IA ([Cesium — Visualizing Time-Dynamic Data](https://cesium.com/learn/ion/stories-time-dynamic/); [CesiumJS VelocityOrientationProperty](https://cesium.com/learn/cesiumjs/ref-doc/VelocityOrientationProperty.html)). The asset-value map is a **new overlay layer** on the existing Killinchu drone scene:

```js
// killinchu/src/cesium/AssetValueLayer.js
import * as Cesium from 'cesium';

const VALUE_COLOR = {
  V0: Cesium.Color.GRAY.withAlpha(0.05),    // empty space — barely visible
  V1: Cesium.Color.CYAN.withAlpha(0.20),    // our drone
  V2: Cesium.Color.GREEN.withAlpha(0.20),   // ally
  V3: Cesium.Color.YELLOW.withAlpha(0.20),  // civilian
  V4: Cesium.Color.ORANGE.withAlpha(0.25),  // critical infra
  V5: Cesium.Color.RED.withAlpha(0.30),     // high-value target
};

export function addAssetZones(viewer, geojsonUrl) {
  return Cesium.GeoJsonDataSource.load(geojsonUrl, { clampToGround: false }).then(ds => {
    ds.entities.values.forEach(e => {
      const v = e.properties.value_tier?.getValue() ?? 'V0';
      e.polygon.material = VALUE_COLOR[v];
      e.polygon.extrudedHeight = e.properties.altitude_ceiling_m_agl?.getValue() ?? 0; // 3D volume, not flat
      e.polygon.outline = true;
      e.polygon.outlineColor = VALUE_COLOR[v].withAlpha(0.8);
    });
    viewer.dataSources.add(ds);
    return ds;
  });
}

// Predicted-impact polygon rendered on top, recolored if it intersects a valued zone
export function addImpactPolygon(viewer, impactPred, gateResult) {
  impactPred.horizons.forEach(h => {
    const hit = gateResult.gate_fires;
    viewer.entities.add({
      name: `impact +${h.t_plus_s}s p=${h.confidence}`,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(flatten(h.polygon_geojson)),
        material: (hit ? Cesium.Color.RED : Cesium.Color.WHITE).withAlpha(0.15 + 0.25*(1-h.t_plus_s/300)),
        outline: true,
      },
    });
  });
}
```

- The operator **sees the gate**: a predicted-impact polygon turns **red the instant it intersects a valued zone**, mirroring the Lattice "single operational picture" UX (`450_3D_LEADERS_ADOPTION.md` §#11). The math and the visual are the same truth.
- Zones extrude to their altitude ceiling → a **3D defended volume**, not a flat footprint (a drone at 350 m over a V4 with ceiling 400 m is *inside*; at 500 m it is *above and outside*).
- Reuses the existing `DroneScene.js` (recipe #11) so this is one added `viewer.dataSources` + one entity collection — no new engine.

---

## 4. Editing flow (operator authoring)

1. Operator draws/imports zones (KML from a survey, GeoJSON from GIS, or draws in the Cesium UI).
2. Assigns `value_tier` + `θ` + `roe_zone` + `authority_regime` per zone.
3. a11oy.code can do this conversationally: *"mark the substation as critical infrastructure, protect it aggressively"* → a11oy.code proposes `value_tier=V4, θ=0.25, roe_zone=warn_and_cue` → **2-person Yuyay gate** to commit (ROE is a state-change) → Khipu zone receipt (`A11OY_BRAIN_INTEGRATION.md`).
4. Zones are **versioned in the Khipu DAG**; changing a zone's value mid-mission is itself a receipted, gated action (no silent re-scoping).

---

## 5. Honesty / boundary

- This layer makes **no decision to act** — it computes a boolean (`gate_fires`) and a value tier. The *action* is always the customer's.
- The geometry is **defensible in court**: ROE set before the event (timestamped Khipu zone receipt), intersection computed from a fused track with stated uncertainty, value threshold visible. Nothing hidden.
- V0/empty-space can **never** produce a cue — enforced by the unbounded θ, identical to mPrest letting rounds fall on open ground.

---

*Signed: **Yachay**, 2026-06-01. Pure geometry + operator-authored ROE, Khipu-receipted. CesiumJS recipe #11 adopted. We sense, we evidence, the customer acts.*
