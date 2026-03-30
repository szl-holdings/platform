import mapboxgl from "mapbox-gl";

export interface MapboxConfig {
  accessToken: string;
  style?: string;
  center?: [number, number];
  zoom?: number;
  antialias?: boolean;
}

export const MAPBOX_STYLE_DARK = "mapbox://styles/mapbox/dark-v11";
export const MAPBOX_STYLE_SATELLITE = "mapbox://styles/mapbox/satellite-streets-v12";
export const MAPBOX_STYLE_LIGHT = "mapbox://styles/mapbox/light-v11";
export const MAPBOX_STYLE_OCEAN = "mapbox://styles/mapbox/navigation-night-v1";

export function configureMapbox(accessToken: string): void {
  mapboxgl.accessToken = accessToken;
}

export function isMapboxConfigured(): boolean {
  return Boolean(mapboxgl.accessToken);
}

export const DEFAULT_MAPBOX_CONFIG: Omit<MapboxConfig, "accessToken"> = {
  style: MAPBOX_STYLE_DARK,
  center: [0, 20],
  zoom: 2,
  antialias: true,
};

export type { Map as MapboxMap } from "mapbox-gl";
