import * as React from "react";
import { Source, Layer } from "react-map-gl";
import type { LineLayer, FeatureCollection, LineString } from "geojson";

export interface RouteSegment {
  id: string;
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  color?: string;
  opacity?: number;
}

export interface MapboxRouteLayerProps {
  routes: RouteSegment[];
  accentColor?: string;
  layerId?: string;
  sourceId?: string;
  dashArray?: number[];
  lineWidth?: number;
}

export function MapboxRouteLayer({
  routes,
  accentColor = "#0ea5e9",
  layerId = "routes-layer",
  sourceId = "routes-source",
  dashArray = [3, 3],
  lineWidth = 1.5,
}: MapboxRouteLayerProps) {
  const geojson: FeatureCollection<LineString> = {
    type: "FeatureCollection",
    features: routes.map((r) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [r.fromLon, r.fromLat],
          [r.toLon, r.toLat],
        ],
      },
      properties: {
        id: r.id,
        color: r.color ?? accentColor,
        opacity: r.opacity ?? 0.5,
      },
    })),
  };

  const lineLayer: LineLayer = {
    id: layerId,
    type: "line",
    paint: {
      "line-color": ["get", "color"],
      "line-opacity": ["get", "opacity"],
      "line-width": lineWidth,
      "line-dasharray": dashArray,
    },
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
  };

  return (
    <Source id={sourceId} type="geojson" data={geojson}>
      <Layer {...lineLayer} />
    </Source>
  );
}
