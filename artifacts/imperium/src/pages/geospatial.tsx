import React, { useState } from "react";
import { Map, Layers, AlertTriangle, Activity, Target, Eye, EyeOff, Globe2, Shield, Wifi } from "lucide-react";
import { GEO_LAYERS, type GeoLayer, type GeoPin, type GeoLayerType } from "@/lib/strategic-data";
import { cn } from "@/lib/utils";

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444", HIGH: "#ef4444", MEDIUM: "#fb923c", LOW: "#facc15",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "#4ade80", MONITORING: "#facc15", ALERT: "#ef4444", OFFLINE: "#94a3b8",
};

const TYPE_ICONS: Record<GeoLayerType, React.ElementType> = {
  ASSETS: Globe2,
  THREATS: AlertTriangle,
  OPERATIONS: Activity,
  PARTNERS: Wifi,
  INFRASTRUCTURE: Shield,
};

function WorldMapSVG({ layers }: { layers: GeoLayer[] }) {
  const activePins = layers.filter((l) => l.enabled).flatMap((l) => l.pins);

  const latLngToSVG = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-white/10"
      style={{ background: "rgba(6,8,16,0.95)", paddingBottom: "50%" }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="globeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201,162,39,0.03)" />
            <stop offset="100%" stopColor="rgba(6,8,16,0)" />
          </radialGradient>
        </defs>

        <rect width="100" height="50" fill="url(#globeGrad)" />

        {/* Grid lines */}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const y = ((90 - lat) / 180) * 50;
          return <line key={lat} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />;
        })}
        {[-120, -60, 0, 60, 120].map((lng) => {
          const x = ((lng + 180) / 360) * 100;
          return <line key={lng} x1={x} y1="0" x2={x} y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />;
        })}

        {/* Simplified continental outlines */}
        <path d="M 18,10 L 22,8 L 28,9 L 32,12 L 30,18 L 28,22 L 24,24 L 20,22 L 18,18 L 18,10 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
        <path d="M 46,6 L 54,5 L 62,7 L 65,12 L 63,18 L 58,22 L 52,20 L 47,16 L 45,10 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
        <path d="M 68,8 L 78,6 L 88,9 L 92,15 L 90,24 L 82,28 L 74,26 L 68,20 L 66,14 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
        <path d="M 12,18 L 22,16 L 34,18 L 36,28 L 28,36 L 18,34 L 10,28 L 10,22 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
        <path d="M 20,28 L 28,26 L 32,32 L 30,42 L 24,44 L 20,40 L 18,34 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />

        {/* Pins */}
        {activePins.map((pin) => {
          const { x, y } = latLngToSVG(pin.lat, pin.lng);
          const color = pin.severity ? SEVERITY_COLOR[pin.severity] : STATUS_COLOR[pin.status];
          return (
            <g key={pin.id}>
              <circle cx={x} cy={y} r="1.5" fill={`${color}30`} stroke={color} strokeWidth="0.4">
                <animate attributeName="r" values="1.5;2.5;1.5" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx={x} cy={y} r="0.8" fill={color} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LayerToggle({ layer, onToggle }: { layer: GeoLayer; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left w-full",
        layer.enabled ? "border-white/15 bg-white/3" : "border-white/5 bg-transparent opacity-50")}
    >
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: layer.enabled ? layer.color : "rgba(255,255,255,0.15)" }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-300">{layer.name}</div>
        <div className="text-[10px] text-slate-500">{layer.pinCount} markers</div>
      </div>
      {layer.enabled ? (
        <Eye className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      ) : (
        <EyeOff className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
      )}
    </button>
  );
}

function PinCard({ pin }: { pin: GeoPin }) {
  const Icon = TYPE_ICONS[pin.type];
  const statusColor = STATUS_COLOR[pin.status];
  const severityColor = pin.severity ? SEVERITY_COLOR[pin.severity] : null;

  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-white/5 last:border-0">
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
        style={{ backgroundColor: severityColor || statusColor }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-200">{pin.label}</div>
        <div className="text-[10px] text-slate-500">{pin.sublabel}</div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {pin.severity && (
          <span className="px-1.5 py-0.5 rounded font-mono text-[8px] tracking-widest border"
            style={{ color: severityColor!, borderColor: `${severityColor}30`, background: `${severityColor}10` }}>
            {pin.severity}
          </span>
        )}
        <span className="px-1.5 py-0.5 rounded font-mono text-[8px] tracking-widest border"
          style={{ color: statusColor, borderColor: `${statusColor}30`, background: `${statusColor}10` }}>
          {pin.status}
        </span>
      </div>
    </div>
  );
}

export default function Geospatial() {
  const [layers, setLayers] = useState(GEO_LAYERS);
  const [activeType, setActiveType] = useState<GeoLayerType | null>(null);

  const toggleLayer = (id: string) => {
    setLayers((prev) => prev.map((l) => l.id === id ? { ...l, enabled: !l.enabled } : l));
  };

  const enabledLayers = layers.filter((l) => l.enabled);
  const activePins = enabledLayers.flatMap((l) => l.pins);
  const alertPins = activePins.filter((p) => p.status === "ALERT");
  const filteredPins = activeType ? activePins.filter((p) => p.type === activeType) : activePins;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Map className="w-5 h-5" style={{ color: "#c9a227" }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Geospatial Intelligence
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Multi-layer strategic map — assets · threats · operations · partners · infrastructure overlays
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Layers", value: enabledLayers.length, color: "#4ade80", icon: Layers },
          { label: "Total Markers", value: activePins.length, color: "#c9a227", icon: Target },
          { label: "Active Alerts", value: alertPins.length, color: alertPins.length > 0 ? "#ef4444" : "#4ade80", icon: AlertTriangle },
          { label: "Regions Covered", value: "6", color: "#60a5fa", icon: Globe2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="imperial-card rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="font-mono text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {alertPins.length > 0 && (
        <div className="rounded-lg p-3 border border-red-900/50 bg-red-950/20 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <span className="font-display text-xs tracking-[0.12em] text-red-400 uppercase font-bold">
              {alertPins.length} Active Geo-Alert{alertPins.length > 1 ? "s" : ""}
            </span>
            <div className="text-[10px] text-red-300 mt-0.5">
              {alertPins.map((p) => p.label).join(" · ")}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-3.5 h-3.5" style={{ color: "#c9a227" }} />
            <span className="font-display text-[10px] tracking-[0.12em] gold-text uppercase">Layer Control</span>
          </div>
          {layers.map((layer) => (
            <LayerToggle key={layer.id} layer={layer} onToggle={() => toggleLayer(layer.id)} />
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <WorldMapSVG layers={layers} />

          <div className="imperial-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: "#c9a227" }} />
                <span className="font-display text-xs tracking-[0.12em] gold-text uppercase">
                  Intelligence Markers ({filteredPins.length})
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <button onClick={() => setActiveType(null)}
                className={cn("px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border transition-all",
                  !activeType ? "border-gold/50 bg-gold/10 text-gold" : "border-white/10 text-slate-400")}>
                ALL
              </button>
              {(["ASSETS", "THREATS", "OPERATIONS", "PARTNERS", "INFRASTRUCTURE"] as GeoLayerType[]).map((type) => {
                const layer = layers.find((l) => l.type === type);
                if (!layer) return null;
                return (
                  <button key={type} onClick={() => setActiveType(activeType === type ? null : type)}
                    className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border transition-all"
                    style={{
                      color: layer.color,
                      borderColor: activeType === type ? layer.color : "rgba(255,255,255,0.1)",
                      background: activeType === type ? `${layer.color}15` : "transparent",
                    }}>
                    {type}
                  </button>
                );
              })}
            </div>

            <div className="max-h-48 overflow-y-auto scrollbar-imperial">
              {filteredPins.map((pin) => (
                <PinCard key={pin.id} pin={pin} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
