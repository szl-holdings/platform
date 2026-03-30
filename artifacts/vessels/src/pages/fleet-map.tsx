import "mapbox-gl/dist/mapbox-gl.css";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { type VesselProfile } from "@/data/mock-data";
import { useVessels, useFleetExceptions } from "@/hooks/use-vessels-data";
import { Badge } from "@workspace/shared-ui/ui/badge";
import {
  X, Ship, MapPin, Radio, Navigation, Clock, Filter, ChevronRight,
  AlertTriangle, Anchor, Wrench, Activity, TrendingUp, TrendingDown, Layers, Play, Pause
} from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

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
            { label: "Latitude", value: `${vessel.lat.toFixed(4)}°` },
            { label: "Longitude", value: `${vessel.lon.toFixed(4)}°` },
            { label: "Speed", value: `${vessel.currentSpeed} kn` },
            { label: "Heading", value: `${vessel.heading}°` },
          ].map(item => (
            <div key={item.label} className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{item.label}</p>
              <p className="text-xs font-mono text-sky-100 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

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
            <span className={cn("font-mono", vessel.etaDelta < 0 ? "text-emerald-400" : vessel.etaDelta > 0 ? "text-orange-400" : "text-sky-400/50")}>
              {vessel.etaDelta < 0 ? `${Math.abs(vessel.etaDelta)}h ahead` : vessel.etaDelta > 0 ? `${vessel.etaDelta}h delayed` : "On schedule"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">TCE</p>
            <p className="text-xs font-mono text-sky-100 mt-0.5">{vessel.tce > 0 ? `$${vessel.tce.toLocaleString()}/d` : "—"}</p>
          </div>
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Utilization</p>
            <p className="text-xs font-mono text-sky-100 mt-0.5">{vessel.utilization > 0 ? `${vessel.utilization}%` : "Unavailable"}</p>
          </div>
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">CII Rating</p>
            <p className={cn("text-xs font-mono font-bold mt-0.5", vessel.ciiRating === "A" ? "text-emerald-400" : vessel.ciiRating === "B" ? "text-sky-400" : "text-amber-400")}>{vessel.ciiRating}</p>
          </div>
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Readiness</p>
            <p className={cn("text-xs font-mono font-bold mt-0.5", vessel.readinessScore >= 80 ? "text-emerald-400" : vessel.readinessScore >= 60 ? "text-amber-400" : "text-red-400")}>{vessel.readinessScore}/100</p>
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

const ROUTE_LINES = [
  { fromLat: -20.3, fromLon: 118.6, toLat: 35.4, toLon: 139.6, vesselId: 1 },
  { fromLat: 40.7, fromLon: -74.0, toLat: 53.5, toLon: 10.0, vesselId: 2 },
  { fromLat: 26.5, fromLon: 50.2, toLat: 25.2, toLon: 56.3, vesselId: 3 },
  { fromLat: 53.5, fromLon: 8.6, toLat: 59.9, toLon: 10.7, vesselId: 4 },
  { fromLat: -32.9, fromLon: 151.7, toLat: -27.5, toLon: 153.0, vesselId: 5 },
  { fromLat: 44.4, fromLon: 22.8, toLat: 44.4, toLon: 8.9, vesselId: 7 },
  { fromLat: 68.4, fromLon: 17.4, toLat: 68.9, toLon: 33.1, vesselId: 8 },
  { fromLat: 26.5, fromLon: 50.2, toLat: 29.9, toLon: 121.6, vesselId: 9 },
  { fromLat: -4.8, fromLon: 11.9, toLat: -33.9, toLon: 18.4, vesselId: 10 },
];

function MapboxFleetMap({
  filteredVessels,
  selectedVessel,
  onVesselSelect,
}: {
  filteredVessels: VesselProfile[];
  selectedVessel: VesselProfile | null;
  onVesselSelect: (v: VesselProfile | null) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const popupRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || (typeof window !== "undefined" ? (window as any).__MAPBOX_TOKEN__ : null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let mapboxgl: any;

    import("mapbox-gl").then((module) => {
      mapboxgl = module.default;

      if (MAPBOX_TOKEN) {
        mapboxgl.accessToken = MAPBOX_TOKEN;
      }

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: MAPBOX_TOKEN
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
        projection: "mercator" as any,
        antialias: true,
      });

      mapRef.current = map;

      map.on("load", () => {
        if (!MAPBOX_TOKEN) {
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
            features: ROUTE_LINES.map((r) => ({
              type: "Feature",
              properties: { vesselId: r.vesselId },
              geometry: {
                type: "LineString",
                coordinates: [
                  [r.fromLon, r.fromLat],
                  [r.toLon, r.toLat],
                ],
              },
            })),
          },
        });

        map.addLayer({
          id: "route-lines",
          type: "line",
          source: "routes",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#38bdf8",
            "line-width": 1.2,
            "line-opacity": 0.25,
            "line-dasharray": [4, 4],
          },
        });

        setMapLoaded(true);
      });

      map.on("error", (e: any) => {
        if (e?.error?.message?.includes("access token")) {
          setMapError("no-token");
        }
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    }).catch(() => {
      setMapError("load-failed");
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    import("mapbox-gl").then((module) => {
      const mapboxgl = module.default;

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

        if (vessel.alertCount > 0 && !isSelected) {
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

        const popup = new mapboxgl.Popup({
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
            popup.setLngLat([vessel.lon, vessel.lat]).addTo(map);
          }
        });
        el.addEventListener("mouseleave", () => {
          popup.remove();
        });
        el.addEventListener("click", () => {
          popup.remove();
          onVesselSelect(selectedVessel?.id === vessel.id ? null : vessel);
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([vessel.lon, vessel.lat])
          .addTo(map);

        markersRef.current.set(vessel.id, marker);
      });

      if (selectedVessel) {
        const map2 = mapRef.current;
        if (map2) {
          map2.flyTo({
            center: [selectedVessel.lon, selectedVessel.lat],
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

    const visibleVesselIds = new Set(filteredVessels.map(v => v.vesselId || v.id));
    const routeFeatures = ROUTE_LINES
      .filter(r => filteredVessels.some(v => v.id === r.vesselId))
      .map(r => ({
        type: "Feature" as const,
        properties: { vesselId: r.vesselId },
        geometry: {
          type: "LineString" as const,
          coordinates: [[r.fromLon, r.fromLat], [r.toLon, r.toLat]],
        },
      }));

    try {
      const source = map.getSource("routes") as any;
      if (source) {
        source.setData({ type: "FeatureCollection", features: routeFeatures });
      }
    } catch {}
  }, [mapLoaded, filteredVessels]);

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
      {!MAPBOX_TOKEN && mapLoaded && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 z-10">
          <p className="text-[10px] text-amber-400">Add MAPBOX_ACCESS_TOKEN to enable full map tiles</p>
        </div>
      )}
      <div className="absolute bottom-3 right-3 text-[10px] text-sky-400/40 font-mono bg-[#0a1628]/80 backdrop-blur rounded-lg px-3 py-2 border border-sky-500/10 z-10">
        <Radio className="w-3 h-3 inline mr-1 text-emerald-400 animate-pulse" />
        {filteredVessels.length} vessels · AIS live
      </div>
    </div>
  );
}

export default function FleetMapPage() {
  const { vessels, isLive } = useVessels();
  const { fleetExceptions } = useFleetExceptions();
  const [selectedVessel, setSelectedVessel] = useState<VesselProfile | null>(null);
  const [filters, setFilters] = useState<FilterState>({ fleet: "all", status: "all", type: "all" });
  const [showFilters, setShowFilters] = useState(false);
  const [playbackActive, setPlaybackActive] = useState(false);

  const filteredVessels = useMemo(() => {
    return vessels.filter(v => {
      if (filters.status !== "all" && v.status !== filters.status) return false;
      if (filters.type !== "all" && v.type !== filters.type) return false;
      return true;
    });
  }, [filters, vessels]);

  const statuses = ["all", ...Array.from(new Set(vessels.map(v => v.status)))];
  const types = ["all", ...Array.from(new Set(vessels.map(v => v.type)))];

  const handleVesselSelect = useCallback((v: VesselProfile | null) => {
    setSelectedVessel(v);
  }, []);

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

      <div className="flex flex-1 overflow-hidden">
        <MapboxFleetMap
          filteredVessels={filteredVessels}
          selectedVessel={selectedVessel}
          onVesselSelect={handleVesselSelect}
        />

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
