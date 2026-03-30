import * as React from "react";
import { Source, Layer, Popup, useMap } from "react-map-gl";
import type { MapLayerMouseEvent } from "mapbox-gl";
import type { CircleLayer, FeatureCollection, Point } from "geojson";

export interface VesselFeatureProperties {
  id: string;
  name: string;
  type: string;
  status: "underway" | "anchored" | "moored" | "alert" | "unknown";
  currentSpeed?: number;
  heading?: number;
  destination?: string;
  color: string;
  isSelected: boolean;
}

export interface MapboxVesselLayerProps {
  vessels: Array<{
    id: string;
    lat: number;
    lon: number;
    name: string;
    type: string;
    status: VesselFeatureProperties["status"];
    currentSpeed?: number;
    heading?: number;
    destination?: string;
  }>;
  selectedVesselId?: string;
  accentColor?: string;
  layerId?: string;
  sourceId?: string;
  onVesselClick?: (vesselId: string) => void;
}

const STATUS_COLORS: Record<VesselFeatureProperties["status"], string> = {
  underway: "#22c55e",
  anchored: "#f59e0b",
  moored: "#3b82f6",
  alert: "#ef4444",
  unknown: "#6b7280",
};

export function MapboxVesselLayer({
  vessels,
  selectedVesselId,
  accentColor = "#22c55e",
  layerId = "vessels-layer",
  sourceId = "vessels-source",
  onVesselClick,
}: MapboxVesselLayerProps) {
  const { current: map } = useMap();

  const [popupInfo, setPopupInfo] = React.useState<{
    lat: number;
    lon: number;
    vessel: MapboxVesselLayerProps["vessels"][number];
  } | null>(null);

  const vesselById = React.useMemo(() => {
    const m = new Map<string, MapboxVesselLayerProps["vessels"][number]>();
    for (const v of vessels) m.set(v.id, v);
    return m;
  }, [vessels]);

  React.useEffect(() => {
    if (!map) return;

    const handleClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const props = feature.properties as VesselFeatureProperties;
      const vesselId = props.id;
      if (!vesselId) return;

      const vessel = vesselById.get(vesselId);
      if (!vessel) return;

      const coords = (feature.geometry as Point).coordinates;
      setPopupInfo({ lon: coords[0], lat: coords[1], vessel });
      onVesselClick?.(vesselId);
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", layerId, handleClick);
    map.on("mouseenter", layerId, handleMouseEnter);
    map.on("mouseleave", layerId, handleMouseLeave);

    return () => {
      map.off("click", layerId, handleClick);
      map.off("mouseenter", layerId, handleMouseEnter);
      map.off("mouseleave", layerId, handleMouseLeave);
    };
  }, [map, layerId, vesselById, onVesselClick]);

  const geojson: FeatureCollection<Point, VesselFeatureProperties> = {
    type: "FeatureCollection",
    features: vessels.map((v) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [v.lon, v.lat] },
      properties: {
        id: v.id,
        name: v.name,
        type: v.type,
        status: v.status,
        currentSpeed: v.currentSpeed,
        heading: v.heading,
        destination: v.destination,
        color: STATUS_COLORS[v.status],
        isSelected: v.id === selectedVesselId,
      },
    })),
  };

  const circleLayer: CircleLayer = {
    id: layerId,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-radius": [
        "case",
        ["==", ["get", "isSelected"], true], 10,
        6,
      ],
      "circle-color": ["get", "color"],
      "circle-stroke-width": [
        "case",
        ["==", ["get", "isSelected"], true], 2.5,
        1,
      ],
      "circle-stroke-color": [
        "case",
        ["==", ["get", "isSelected"], true], "#ffffff",
        "rgba(255,255,255,0.4)",
      ],
      "circle-opacity": 0.9,
    },
  };

  const haloLayer: CircleLayer = {
    id: `${layerId}-halo`,
    type: "circle",
    source: sourceId,
    filter: ["==", ["get", "isSelected"], true],
    paint: {
      "circle-radius": 18,
      "circle-color": accentColor,
      "circle-opacity": 0.15,
    },
  };

  return (
    <Source id={sourceId} type="geojson" data={geojson}>
      <Layer {...haloLayer} />
      <Layer {...circleLayer} />
      {popupInfo && (
        <Popup
          longitude={popupInfo.lon}
          latitude={popupInfo.lat}
          closeButton
          onClose={() => setPopupInfo(null)}
          anchor="bottom"
        >
          <div style={{ padding: "6px 8px", minWidth: 140 }}>
            <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 2px" }}>
              {popupInfo.vessel.name}
            </p>
            <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 2px" }}>
              {popupInfo.vessel.type}
            </p>
            {popupInfo.vessel.currentSpeed !== undefined && (
              <p style={{ fontSize: 11, margin: 0 }}>
                {popupInfo.vessel.currentSpeed} kn
              </p>
            )}
            {popupInfo.vessel.destination && (
              <p style={{ fontSize: 11, margin: "2px 0 0", color: "#6b7280" }}>
                → {popupInfo.vessel.destination}
              </p>
            )}
          </div>
        </Popup>
      )}
    </Source>
  );
}
