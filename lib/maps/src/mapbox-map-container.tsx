import * as React from "react";
import Map, { MapRef, NavigationControl, FullscreenControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_STYLE_DARK, DEFAULT_MAPBOX_CONFIG } from "./mapbox-config";

export interface MapboxMapContainerProps {
  accessToken: string;
  mapStyle?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
  children?: React.ReactNode;
  showControls?: boolean;
  onMapLoad?: (map: MapRef) => void;
  onMapClick?: (event: { lngLat: { lng: number; lat: number } }) => void;
  onMapMoveEnd?: (event: { viewState: { longitude: number; latitude: number; zoom: number } }) => void;
}

export function MapboxMapContainer({
  accessToken,
  mapStyle = MAPBOX_STYLE_DARK,
  initialCenter = DEFAULT_MAPBOX_CONFIG.center!,
  initialZoom = DEFAULT_MAPBOX_CONFIG.zoom!,
  className,
  children,
  showControls = true,
  onMapLoad,
  onMapClick,
  onMapMoveEnd,
}: MapboxMapContainerProps) {
  const mapRef = React.useRef<MapRef>(null);

  const handleLoad = React.useCallback(() => {
    if (mapRef.current && onMapLoad) {
      onMapLoad(mapRef.current);
    }
  }, [onMapLoad]);

  return (
    <div className={className ?? "w-full h-full"}>
      <Map
        ref={mapRef}
        mapboxAccessToken={accessToken}
        mapStyle={mapStyle}
        initialViewState={{
          longitude: initialCenter[0],
          latitude: initialCenter[1],
          zoom: initialZoom,
        }}
        style={{ width: "100%", height: "100%" }}
        onLoad={handleLoad}
        onClick={onMapClick}
        onMoveEnd={onMapMoveEnd}
        antialias={DEFAULT_MAPBOX_CONFIG.antialias}
      >
        {showControls && (
          <>
            <NavigationControl position="top-right" />
            <FullscreenControl position="top-right" />
          </>
        )}
        {children}
      </Map>
    </div>
  );
}
