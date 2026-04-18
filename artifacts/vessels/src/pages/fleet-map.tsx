import "mapbox-gl/dist/mapbox-gl.css";
import type * as mapboxgl from "mapbox-gl";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { type VesselProfile } from "@/data/types";
import { useVessels, useFleetExceptions } from "@/hooks/use-vessels-data";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { SectionErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";
import {
  X, Ship, MapPin, Radio, Navigation, Clock, Filter, ChevronRight,
  AlertTriangle, Anchor, Wrench, Activity, TrendingUp, TrendingDown, Layers, Play, Pause
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { useRealtimeChannel } from "@szl-holdings/shared-ui";
import { EmptyState } from "@szl-holdings/shared-ui/design-system";
import { useQueryClient } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  at_sea: "#22c55e",
  in_port: "#0ea5e9",
  anchored: "#f59e0b",
  maintenance: "#ef4444",
  delayed: "#f97316",
  loading: "#a78bfa",
  risk_watch: "#f59e0b",
  exception_active: "#ef4444",
};

const statusLabels: Record<string, string> = {
  at_sea: "At Sea",
  in_port: "In Port",
  anchored: "Anchored",
  maintenance: "Maintenance",
  delayed: "Delayed",
  loading: "Loading",
  risk_watch: "Risk Watch",
  exception_active: "Exception",
};

function VesselSidePanel({ vessel, onClose, exceptions }: { vessel: VesselProfile; onClose: () => void; exceptions: ReturnType<typeof useFleetExceptions>["fleetExceptions"] }) {
  const vesselExceptions = exceptions.filter(e => e.vesselId === vessel.id && e.status === "active");
  const sc = statusColors[vessel.status] || "#666";
  const scLabel = statusLabels[vessel.status] || vessel.status;

  return (
    <div className="w-[340px] h-full bg-[#060e1a]/98 backdrop-blur-xl border-l border-sky-500/10 flex flex-col overflow-hidden shrink-0 z-20">
      <div className="p-4 border-b border-sky-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center">
            <Ship className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-sky-50">{vessel.name}</h3>
            <p className="text-[10px] text-sky-400/50 font-mono">IMO {vessel.imo} · {vessel.flag}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-sky-500/10 text-sky-400/50 hover:text-sky-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium" style={{ color: sc, borderColor: `${sc}30`, backgroundColor: `${sc}10` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: sc }} />
            {scLabel}
          </span>
          <span className="text-[10px] text-sky-400/40 font-mono">{vessel.type}</span>
          {vesselExceptions.length > 0 && (
            <Badge variant="outline" className="text-[9px] text-red-400 border-red-500/20 bg-red-500/10">
              {vesselExceptions.length} exception{vesselExceptions.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Latitude", value: `${(vessel.lat ?? 0).toFixed(4)}°` },
            { label: "Longitude", value: `${(vessel.lon ?? 0).toFixed(4)}°` },
            { label: "Speed", value: `${vessel.currentSpeed} kn` },
            { label: "Heading", value: `${vessel.heading}°` },
          ].map(item => (
            <div key={item.label} className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{item.label}</p>
              <p className="text-xs font-mono text-sky-100 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {vessel.lat != null && vessel.lon != null && (
          <div className="rounded-lg overflow-hidden border border-sky-500/10 relative">
            <img
              src={`${import.meta.env.BASE_URL}api/maps/static?center=${vessel.lat},${vessel.lon}&zoom=7&size=400x160&maptype=satellite&markers=color:cyan|${vessel.lat},${vessel.lon}`}
              alt={`Satellite view of ${vessel.name} at ${vessel.lat.toFixed(2)}, ${vessel.lon.toFixed(2)}`}
              className="w-full h-32 object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md px-2 py-1 text-[10px]"
              style={{ background: "rgba(0,0,0,0.65)", color: "rgba(148,220,255,0.8)" }}>
              <MapPin className="w-2.5 h-2.5" />
              Satellite · Google Maps
            </div>
          </div>
        )}

        <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10 space-y-2">
          <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Route Progress</p>
          <div className="flex items-center gap-2 text-xs text-sky-400/60">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{vessel.lastPort}</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="truncate">{vessel.nextPort}</span>
          </div>
          <div className="relative h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-sky-400 rounded-full transition-all" style={{ width: `${vessel.routeProgress}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-sky-400/40">{vessel.routeProgress}% complete</span>
            <span className={cn("font-mono", (vessel.etaDelta ?? 0) < 0 ? "text-emerald-400" : (vessel.etaDelta ?? 0) > 0 ? "text-orange-400" : "text-sky-400/50")}>
              {(vessel.etaDelta ?? 0) < 0 ? `${Math.abs(vessel.etaDelta ?? 0)}h ahead` : (vessel.etaDelta ?? 0) > 0 ? `${vessel.etaDelta}h delayed` : "On schedule"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">TCE</p>
            <p className="text-xs font-mono text-sky-100 mt-0.5">{(vessel.tce ?? 0) > 0 ? `$${(vessel.tce ?? 0).toLocaleString()}/d` : "—"}</p>
          </div>
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Utilization</p>
            <p className="text-xs font-mono text-sky-100 mt-0.5">{(vessel.utilization ?? 0) > 0 ? `${vessel.utilization}%` : "Unavailable"}</p>
          </div>
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">CII Rating</p>
            <p className={cn("text-xs font-mono font-bold mt-0.5", vessel.ciiRating === "A" ? "text-emerald-400" : vessel.ciiRating === "B" ? "text-sky-400" : "text-amber-400")}>{vessel.ciiRating}</p>
          </div>
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Readiness</p>
            <p className={cn("text-xs font-mono font-bold mt-0.5", (vessel.readinessScore ?? 0) >= 80 ? "text-emerald-400" : (vessel.readinessScore ?? 0) >= 60 ? "text-amber-400" : "text-red-400")}>{vessel.readinessScore}/100</p>
          </div>
        </div>

        {vesselExceptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Active Exceptions</p>
            {vesselExceptions.map(exc => (
              <div key={exc.id} className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5">
                <p className="text-[10px] font-medium text-red-300">{exc.title}</p>
                <p className="text-[9px] text-sky-400/50 mt-0.5">{exc.description.slice(0, 80)}...</p>
              </div>
            ))}
          </div>
        )}

        <Link href={`/vessel/${vessel.id}`}>
          <button className="w-full text-xs text-sky-400 hover:text-sky-300 border border-sky-500/20 hover:border-sky-500/40 rounded-lg py-2 transition-all">
            View Full Detail <ChevronRight className="w-3 h-3 inline ml-1" />
          </button>
        </Link>
      </div>
    </div>
  );
}

type FilterState = {
  fleet: string;
  status: string;
  type: string;
};

interface VesselRoute {
  vesselId: number;
  waypoints: [number, number][];
}

const VESSEL_ROUTES: VesselRoute[] = [
  { vesselId: 1, waypoints: [[118.6, -20.3], [128.5, 15.2], [135.8, 30.1], [139.6, 35.4]] },
  { vesselId: 2, waypoints: [[-74.0, 40.7], [-40.5, 47.2], [-15.0, 50.8], [10.0, 53.5]] },
  { vesselId: 3, waypoints: [[50.2, 26.5], [52.5, 25.8], [55.1, 25.0], [56.3, 25.2]] },
  { vesselId: 4, waypoints: [[8.6, 53.5], [9.1, 57.2], [9.8, 59.0], [10.7, 59.9]] },
  { vesselId: 5, waypoints: [[151.7, -32.9], [152.0, -30.1], [152.5, -28.5], [153.0, -27.5]] },
  { vesselId: 7, waypoints: [[22.8, 35.9], [18.0, 38.5], [14.0, 40.8], [8.9, 44.4]] },
  { vesselId: 8, waypoints: [[17.4, 68.4], [22.0, 68.7], [28.5, 68.5], [33.1, 68.9]] },
  { vesselId: 9, waypoints: [[50.6, 26.2], [68.0, 22.0], [90.0, 18.5], [121.6, 29.9]] },
  { vesselId: 10, waypoints: [[12.2, -6.0], [11.5, -12.5], [12.0, -20.1], [18.4, -33.9]] },
];

interface AisApiResponse {
  vessels: AisVessel[];
  source: string;
  count: number;
}

interface AisVessel {
  mmsi: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  heading: number;
  destination: string;
  status: string;
  navStatus: number;
  flag: string;
}

function navStatusColor(navStatus: number): string {
  if (navStatus === 0) return "#22c55e";
  if (navStatus === 1) return "#f59e0b";
  if (navStatus === 5) return "#0ea5e9";
  return "#64748b";
}

interface TrackPoint { lat: number; lon: number; recordedAt: string; }
interface TrackHistoryResponse { data: { vesselId: number; track: TrackPoint[] } }

function MapboxFleetMap({
  filteredVessels,
  selectedVessel,
  onVesselSelect,
  token,
  aisVessels,
  showAis,
}: {
  filteredVessels: VesselProfile[];
  selectedVessel: VesselProfile | null;
  onVesselSelect: (v: VesselProfile | null) => void;
  token: string | null;
  aisVessels: AisVessel[];
  showAis: boolean;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const aisMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const { data: trackData } = useQuery<TrackHistoryResponse>({
    queryKey: ["vessel-track", selectedVessel?.id],
    queryFn: async (): Promise<TrackHistoryResponse> => {
      const res = await fetch(`/api/vessels/track/${selectedVessel!.id}`, { credentials: "include" });
      if (!res.ok) return { data: { vesselId: selectedVessel!.id, track: [] } };
      return res.json() as Promise<TrackHistoryResponse>;
    },
    enabled: !!selectedVessel,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let mbgl: any;
    let destroyed = false;

    import("mapbox-gl").then((module) => {
      if (destroyed) return;
      mbgl = module.default;

      if (token) {
        mbgl.accessToken = token;
      }

      const map = new mbgl.Map({
        container: mapContainerRef.current!,
        style: token
          ? "mapbox://styles/mapbox/dark-v11"
          : {
              version: 8,
              sources: {},
              layers: [
                {
                  id: "background",
                  type: "background",
                  paint: { "background-color": "#060e1a" },
                },
              ],
            },
        center: [20, 20],
        zoom: 1.8,
        projection: { name: "mercator" } as mapboxgl.ProjectionSpecification,
        antialias: true,
      });

      mapRef.current = map;

      map.on("load", () => {
        if (destroyed) return;
        if (!token) {
          map.addSource("ocean-tiles", {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          });
          map.addLayer({
            id: "ocean-layer",
            type: "raster",
            source: "ocean-tiles",
            paint: { "raster-opacity": 0.3, "raster-hue-rotate": 210, "raster-brightness-min": 0.05, "raster-saturation": -0.8 },
          });
        }

        map.addSource("routes", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: VESSEL_ROUTES.map((r) => ({
              type: "Feature",
              properties: { vesselId: r.vesselId },
              geometry: { type: "LineString", coordinates: r.waypoints },
            })),
          },
        });

        map.addSource("selected-route", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "route-lines",
          type: "line",
          source: "routes",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#38bdf8",
            "line-width": 1.0,
            "line-opacity": 0.18,
            "line-dasharray": [4, 4],
          },
        });

        map.addLayer({
          id: "route-selected-halo",
          type: "line",
          source: "selected-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#38bdf8", "line-width": 6, "line-opacity": 0.12 },
        });

        map.addLayer({
          id: "route-selected",
          type: "line",
          source: "selected-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#38bdf8", "line-width": 2.5, "line-opacity": 0.8 },
        });

        map.addLayer({
          id: "route-waypoints",
          type: "circle",
          source: "selected-route",
          paint: {
            "circle-color": "#38bdf8",
            "circle-radius": 3.5,
            "circle-opacity": 0.7,
            "circle-stroke-width": 1,
            "circle-stroke-color": "rgba(255,255,255,0.4)",
          },
        });

        if (!destroyed) setMapLoaded(true);
      });

      map.on("error", (e: { error?: { message?: string }; type: string }) => {
        if (e?.error?.message?.includes("access token")) {
          if (!destroyed) setMapError("no-token");
        }
      });
    }).catch((err: unknown) => {
      console.error("Map library failed to load:", err);
      if (!destroyed) {
        setMapError("load-failed");
        toast.error("Failed to load the map. Please refresh the page.");
      }
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [token]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    import("mapbox-gl").then((module) => {
      const mbgl = module.default;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }

      filteredVessels.forEach((vessel) => {
        const color = statusColors[vessel.status] || "#666";
        const isSelected = selectedVessel?.id === vessel.id;

        const el = document.createElement("div");
        el.className = "vessel-marker";
        el.style.cssText = `
          width: ${isSelected ? 18 : 12}px;
          height: ${isSelected ? 18 : 12}px;
          background-color: ${color};
          border-radius: 50%;
          border: 2px solid ${isSelected ? "#fff" : `${color}80`};
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 ${isSelected ? 12 : 6}px ${color}80;
          position: relative;
        `;

        if ((vessel.alertCount ?? 0) > 0 && !isSelected) {
          const badge = document.createElement("div");
          badge.style.cssText = `
            position: absolute;
            top: -4px;
            right: -4px;
            width: 8px;
            height: 8px;
            background: #ef4444;
            border-radius: 50%;
            border: 1px solid #060e1a;
          `;
          el.appendChild(badge);
        }

        if (vessel.status === "at_sea") {
          const pulse = document.createElement("div");
          pulse.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: ${color};
            opacity: 0.4;
            animation: vessel-pulse 2.4s ease-out infinite;
          `;
          el.style.position = "relative";
          el.appendChild(pulse);
        }

        const popup = new mbgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 15,
          className: "vessel-popup",
          maxWidth: "280px",
        }).setHTML(`
          <div style="background:#0a1628;border:1px solid rgba(56,189,248,0.2);border-radius:10px;padding:10px;font-family:monospace;min-width:200px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="color:#e0f2fe;font-size:11px;font-weight:700;">${vessel.name}</span>
              <span style="color:rgba(56,189,248,0.4);font-size:9px;">IMO ${vessel.imo}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;"></span>
              <span style="color:${color};font-size:10px;">${statusLabels[vessel.status] || vessel.status}</span>
              <span style="color:rgba(56,189,248,0.3);font-size:9px;margin-left:auto;">${vessel.type}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:9px;">
              <div style="color:rgba(56,189,248,0.4);">Speed</div><div style="color:#e0f2fe;">${vessel.currentSpeed} kn</div>
              <div style="color:rgba(56,189,248,0.4);">Heading</div><div style="color:#e0f2fe;">${vessel.heading}°</div>
              <div style="color:rgba(56,189,248,0.4);">Next port</div><div style="color:#e0f2fe;">${vessel.nextPort}</div>
              <div style="color:rgba(56,189,248,0.4);">Progress</div><div style="color:#e0f2fe;">${vessel.routeProgress}%</div>
            </div>
          </div>
        `);

        el.addEventListener("mouseenter", () => {
          if (!isSelected) {
            popup.setLngLat([vessel.lon ?? 0, vessel.lat ?? 0]).addTo(map);
          }
        });
        el.addEventListener("mouseleave", () => {
          popup.remove();
        });
        el.addEventListener("click", () => {
          popup.remove();
          onVesselSelect(selectedVessel?.id === vessel.id ? null : vessel);
        });

        const marker = new mbgl.Marker({ element: el })
          .setLngLat([vessel.lon ?? 0, vessel.lat ?? 0])
          .addTo(map);

        markersRef.current.set(vessel.id, marker);
      });

      if (selectedVessel) {
        const map2 = mapRef.current;
        if (map2) {
          map2.flyTo({
            center: [selectedVessel.lon ?? 0, selectedVessel.lat ?? 0],
            zoom: Math.max(map2.getZoom(), 4),
            duration: 800,
            essential: true,
          });
        }
      }
    });
  }, [mapLoaded, filteredVessels, selectedVessel, onVesselSelect]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    const routeFeatures = VESSEL_ROUTES
      .filter(r => filteredVessels.some(v => v.id === r.vesselId))
      .map(r => ({
        type: "Feature" as const,
        properties: { vesselId: r.vesselId },
        geometry: { type: "LineString" as const, coordinates: r.waypoints },
      }));

    try {
      (map.getSource("routes") as mapboxgl.GeoJSONSource | undefined)?.setData({
        type: "FeatureCollection",
        features: routeFeatures,
      });
    } catch {}
  }, [mapLoaded, filteredVessels]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    let waypoints: [number, number][] = [];
    if (selectedVessel) {
      const apiTrack = trackData?.data?.track ?? [];
      if (apiTrack.length >= 2) {
        waypoints = apiTrack.map(pt => [pt.lon, pt.lat]);
      } else {
        const fallback = VESSEL_ROUTES.find(r => r.vesselId === selectedVessel.id);
        waypoints = fallback?.waypoints ?? [];
      }
    }

    const lineFeature = waypoints.length >= 2
      ? [{ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: waypoints } }]
      : [];
    const waypointFeatures = waypoints.map(wp => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "Point" as const, coordinates: wp },
    }));

    try {
      (map.getSource("selected-route") as mapboxgl.GeoJSONSource | undefined)?.setData({
        type: "FeatureCollection",
        features: [...lineFeature, ...waypointFeatures],
      });
    } catch {}
  }, [mapLoaded, selectedVessel, trackData]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    import("mapbox-gl").then((module) => {
      const mbgl = module.default;
      const map = mapRef.current;
      if (!map) return;

      aisMarkersRef.current.forEach(m => m.remove());
      aisMarkersRef.current.clear();

      if (!showAis) return;

      aisVessels.forEach((v) => {
        if (!v.lat || !v.lon || isNaN(v.lat) || isNaN(v.lon)) return;

        const color = navStatusColor(v.navStatus);
        const el = document.createElement("div");
        el.style.cssText = `
          width: 7px;
          height: 7px;
          background-color: ${color};
          border-radius: 50%;
          border: 1px solid ${color}60;
          cursor: pointer;
          opacity: 0.7;
          box-shadow: 0 0 4px ${color}60;
        `;

        const popup = new mbgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
          className: "vessel-popup",
          maxWidth: "240px",
        }).setHTML(`
          <div style="background:#0a1628;border:1px solid rgba(56,189,248,0.15);border-radius:8px;padding:8px;font-family:monospace;">
            <div style="color:#e0f2fe;font-size:10px;font-weight:700;margin-bottom:4px;">${v.name}</div>
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
              <span style="width:5px;height:5px;border-radius:50%;background:${color};display:inline-block;"></span>
              <span style="color:${color};font-size:9px;">${v.status}</span>
              <span style="color:rgba(56,189,248,0.3);font-size:8px;margin-left:auto;">${v.type || "Unknown"}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;font-size:8px;">
              <div style="color:rgba(56,189,248,0.4);">Speed</div><div style="color:#e0f2fe;">${v.speed} kn</div>
              <div style="color:rgba(56,189,248,0.4);">Dest</div><div style="color:#e0f2fe;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.destination || "—"}</div>
              <div style="color:rgba(56,189,248,0.4);">MMSI</div><div style="color:#e0f2fe;">${v.mmsi}</div>
              <div style="color:rgba(56,189,248,0.4);">Flag</div><div style="color:#e0f2fe;">${v.flag || "—"}</div>
            </div>
            <div style="margin-top:4px;font-size:8px;color:rgba(56,189,248,0.25);">Live AIS · Digitraffic</div>
          </div>
        `);

        el.addEventListener("mouseenter", () => popup.setLngLat([v.lon, v.lat]).addTo(map));
        el.addEventListener("mouseleave", () => popup.remove());

        const marker = new mbgl.Marker({ element: el })
          .setLngLat([v.lon, v.lat])
          .addTo(map);

        aisMarkersRef.current.set(v.mmsi, marker);
      });
    });
  }, [mapLoaded, aisVessels, showAis]);

  if (mapError === "load-failed") {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#060e1a]">
        <div className="text-center space-y-2">
          <Ship className="w-8 h-8 text-sky-400/30 mx-auto" />
          <p className="text-sm text-sky-400/50">Map failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <style>{`
        @keyframes vessel-pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
        }
        .vessel-popup .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .vessel-popup .mapboxgl-popup-tip {
          border-top-color: rgba(56,189,248,0.2) !important;
        }
        .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right {
          display: none;
        }
        .mapboxgl-ctrl-top-right {
          top: 8px;
          right: 8px;
        }
        .mapboxgl-ctrl-zoom-in, .mapboxgl-ctrl-zoom-out {
          background-color: rgba(6,14,26,0.9) !important;
          border-color: rgba(56,189,248,0.2) !important;
          color: rgba(56,189,248,0.7) !important;
        }
      `}</style>
      <div ref={mapContainerRef} className="absolute inset-0" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#060e1a] z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
            <p className="text-xs text-sky-400/40">Loading fleet map…</p>
          </div>
        </div>
      )}
      {!token && mapLoaded && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 z-10">
          <p className="text-[10px] text-amber-400">Add MAPBOX_ACCESS_TOKEN to enable full map tiles</p>
        </div>
      )}
      <div className="absolute bottom-3 right-3 text-[10px] text-sky-400/40 font-mono bg-[#0a1628]/80 backdrop-blur rounded-lg px-3 py-2 border border-sky-500/10 z-10">
        <Radio className="w-3 h-3 inline mr-1 text-emerald-400 animate-pulse" />
        {filteredVessels.length} vessels · AIS live
        {showAis && aisVessels.length > 0 && ` · ${aisVessels.length} live AIS`}
      </div>
    </div>
  );
}

export default function FleetMapPage() {
  const { vessels, isLive } = useVessels();
  const { fleetExceptions } = useFleetExceptions();
  const { token, isLoading: tokenLoading } = useMapboxToken();
  const [selectedVessel, setSelectedVessel] = useState<VesselProfile | null>(null);
  const [filters, setFilters] = useState<FilterState>({ fleet: "all", status: "all", type: "all" });
  const [showFilters, setShowFilters] = useState(false);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [showAis, setShowAis] = useState(true);

  const { data: aisData } = useQuery<AisApiResponse>({
    queryKey: ["vessels-live-ais"],
    queryFn: async (): Promise<AisApiResponse> => {
      const res = await fetch("/api/vessels/live/ais", { credentials: "include" });
      if (!res.ok) return { vessels: [], source: "unavailable", count: 0 };
      const json = await res.json() as { data?: Partial<AisApiResponse> };
      const d = json.data ?? {};
      return { vessels: d.vessels ?? [], source: d.source ?? "unknown", count: d.count ?? 0 };
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
    retry: 1,
  });

  const aisVessels: AisVessel[] = aisData?.vessels ?? [];

  const qcFleet = useQueryClient();
  const { lastMessage: wsPositionMsg } = useRealtimeChannel("vessel-positions");
  useEffect(() => {
    if (!wsPositionMsg) return;
    qcFleet.invalidateQueries({ queryKey: ["vessels"] });
    qcFleet.invalidateQueries({ queryKey: ["vessels-dashboard"] });
    qcFleet.invalidateQueries({ queryKey: ["fleet-exceptions"] });
  }, [wsPositionMsg, qcFleet]);

  const filteredVessels = useMemo(() => {
    return vessels.filter(v => {
      if (filters.status !== "all" && v.status !== filters.status) return false;
      if (filters.type !== "all" && v.type !== filters.type) return false;
      return true;
    });
  }, [filters, vessels]);

  const statuses = ["all", ...Array.from(new Set(vessels.map(v => v.status)))];
  const types: string[] = ["all", ...Array.from(new Set(vessels.map(v => v.type).filter((t): t is string => t != null)))];

  const handleVesselSelect = useCallback((v: VesselProfile | null) => {
    setSelectedVessel(v);
  }, []);

  if (tokenLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#060e1a]">
        <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#060e1a]">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-3 shrink-0">
        <div>
          <h1 className="font-display text-sm font-bold text-sky-50">Fleet Map</h1>
          <p className="text-[10px] text-sky-400/40">Live vessel positions · AIS-based tracking · Mapbox GL</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-3">
            {Object.entries({ at_sea: "#22c55e", in_port: "#0ea5e9", delayed: "#f97316", maintenance: "#ef4444" }).map(([key, color]) => (
              <span key={key} className="flex items-center gap-1 text-[10px] text-sky-400/50">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {statusLabels[key]}
              </span>
            ))}
          </div>

          <button
            onClick={() => setShowAis(s => !s)}
            title="Toggle live AIS overlay"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] transition-all",
              showAis ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300"
            )}
          >
            <Radio className="w-3 h-3" />
            Live AIS
            {showAis && aisVessels.length > 0 && <span className="ml-1 text-[9px] font-mono">{aisVessels.length}</span>}
          </button>

          <button
            onClick={() => setPlaybackActive(p => !p)}
            title="AIS Playback (future feature)"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] transition-all",
              playbackActive ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300"
            )}
          >
            {playbackActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            Playback
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] transition-all", showFilters ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/50 hover:text-sky-300")}
          >
            <Filter className="w-3 h-3" />
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="px-4 py-2 border-b border-sky-500/10 flex items-start gap-4 shrink-0 flex-wrap">
          {[
            { label: "Status", key: "status" as const, opts: statuses },
            { label: "Type", key: "type" as const, opts: types },
          ].map(({ label, key, opts }) => (
            <div key={key} className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-sky-400/40 shrink-0">{label}:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {opts.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setFilters(f => ({ ...f, [key]: opt }))}
                    className={cn("text-[10px] px-2 py-1 rounded border transition-all capitalize", filters[key] === opt ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}
                  >
                    {opt === "all" ? "All" : statusLabels[opt] || opt.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <span className="ml-auto text-[10px] text-sky-400/40 self-center">{filteredVessels.length} of {vessels.length} shown</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <SectionErrorBoundary sectionName="Fleet Map">
          <MapboxFleetMap
            filteredVessels={filteredVessels}
            selectedVessel={selectedVessel}
            onVesselSelect={handleVesselSelect}
            token={token}
            aisVessels={aisVessels}
            showAis={showAis}
          />
        </SectionErrorBoundary>

        {!tokenLoading && filteredVessels.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="pointer-events-auto rounded-2xl bg-[#060e1a]/85 backdrop-blur-md border border-sky-500/20 px-6 py-2 max-w-md shadow-2xl">
              <EmptyState
                icon={Ship}
                headline={vessels.length === 0 ? "No vessels in fleet" : "No vessels matching filters"}
                description={
                  vessels.length === 0
                    ? "No vessels have been onboarded yet. Once vessels are added to the fleet they will plot here in real time via AIS."
                    : "Adjust status or vessel-type filters to expand results. Currently 0 of " + vessels.length + " vessels match the active filter set."
                }
                action={
                  vessels.length > 0
                    ? {
                        label: "Reset filters",
                        onClick: () => setFilters({ fleet: "all", status: "all", type: "all" }),
                      }
                    : undefined
                }
                accentColor="#38bdf8"
                compact
              />
            </div>
          </div>
        )}

        {selectedVessel && (
          <VesselSidePanel vessel={selectedVessel} onClose={() => setSelectedVessel(null)} exceptions={fleetExceptions} />
        )}
      </div>

      {!selectedVessel && (
        <div className="px-4 py-2 border-t border-sky-500/10 flex items-center gap-4 shrink-0 overflow-x-auto">
          {vessels.map(v => {
            const color = statusColors[v.status] || "#666";
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVessel(v)}
                className="flex items-center gap-1.5 text-[10px] text-sky-400/50 hover:text-sky-200 transition-colors whitespace-nowrap"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                {v.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
