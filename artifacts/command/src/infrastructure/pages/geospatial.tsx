import L from 'leaflet';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  type Classification,
  GEO_PINS,
  type GeoLayer,
  type GeoPin,
  type GeoThreat,
  getClassificationColor,
} from '@imp/lib/imperium-data';
import { cn } from '@imp/lib/utils';
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Clock,
  CloudRain,
  Eye,
  Filter,
  Globe2,
  Navigation,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Signal,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

const ALL_THREATS: GeoThreat[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NOMINAL'];
const ALL_CLASSIFICATIONS: Classification[] = ['OPEN', 'RESTRICTED', 'CONFIDENTIAL', 'SOVEREIGN'];

const LAYER_CONFIG: Record<GeoLayer, { label: string; icon: React.ElementType; color: string }> = {
  SIGINT: { label: 'SIGINT', icon: Signal, color: '#ef4444' },
  INFRASTRUCTURE: { label: 'INFRASTRUCTURE', icon: Building2, color: '#c9a227' },
  PERSONNEL: { label: 'PERSONNEL', icon: Users, color: '#60a5fa' },
  WEATHER: { label: 'WEATHER', icon: CloudRain, color: '#a78bfa' },
};

const THREAT_CONFIG: Record<GeoThreat, { color: string; icon: React.ElementType }> = {
  CRITICAL: { color: '#ef4444', icon: ShieldAlert },
  HIGH: { color: '#f97316', icon: ShieldAlert },
  MEDIUM: { color: '#facc15', icon: AlertTriangle },
  LOW: { color: '#60a5fa', icon: Shield },
  NOMINAL: { color: '#4ade80', icon: CheckCircle },
};

const POLL_INTERVAL_MS = 30_000;
const GEO_INTEL_URL = '/api/geo-intel/pins';

type LivePin = GeoPin & { stale?: boolean; updatedAt?: string };

interface FeedState {
  pins: GeoPin[];
  status: 'loading' | 'live' | 'error' | 'stale';
  lastUpdated: Date | null;
  generation: number;
  error: string | null;
}

interface GeoIntelResponse {
  pins: LivePin[];
  generation: number;
  generatedAt: string;
  nextPollMs: number;
}

function isValidGeoIntelResponse(data: unknown): data is GeoIntelResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d['pins'])) return false;
  if (typeof d['generation'] !== 'number') return false;
  if (typeof d['generatedAt'] !== 'string') return false;
  for (const pin of d['pins'] as unknown[]) {
    if (!pin || typeof pin !== 'object') return false;
    const p = pin as Record<string, unknown>;
    if (typeof p['id'] !== 'string') return false;
    if (typeof p['lat'] !== 'number' || typeof p['lng'] !== 'number') return false;
    if (!['SIGINT', 'INFRASTRUCTURE', 'PERSONNEL', 'WEATHER'].includes(p['layer'] as string)) return false;
    if (!['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NOMINAL'].includes(p['threat'] as string)) return false;
  }
  return true;
}

function useGeoIntelFeed(): FeedState {
  const [state, setState] = useState<FeedState>({
    pins: GEO_PINS,
    status: 'loading',
    lastUpdated: null,
    generation: 0,
    error: null,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetchPins = useCallback(async () => {
    try {
      const res = await fetch(GEO_INTEL_URL, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw: unknown = await res.json();
      if (!isValidGeoIntelResponse(raw)) {
        throw new Error('geo-intel feed returned unexpected shape');
      }
      const data = raw;
      if (!mountedRef.current) return;
      const activePins: GeoPin[] = data.pins
        .filter((p) => !p.stale)
        .map(({ stale: _s, updatedAt: _u, ...pin }) => pin as GeoPin);
      setState({
        pins: activePins,
        status: 'live',
        lastUpdated: new Date(),
        generation: data.generation,
        error: null,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      setState((prev) => ({
        ...prev,
        status: prev.lastUpdated ? 'stale' : 'error',
        error: err instanceof Error ? err.message : 'fetch failed',
      }));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    fetchPins();

    const schedule = () => {
      timerRef.current = setTimeout(() => {
        fetchPins().then(() => {
          if (mountedRef.current) schedule();
        });
      }, POLL_INTERVAL_MS);
    };
    schedule();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchPins]);

  return state;
}

function useRelativeTime(date: Date | null): string {
  const [label, setLabel] = useState('—');
  useEffect(() => {
    if (!date) return;
    const update = () => {
      const sec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (sec < 5) setLabel('just now');
      else if (sec < 60) setLabel(`${sec}s ago`);
      else setLabel(`${Math.floor(sec / 60)}m ago`);
    };
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, [date]);
  return label;
}

function makePinIcon(layer: GeoLayer, threat: GeoThreat, selected: boolean): L.DivIcon {
  const layerColor = LAYER_CONFIG[layer].color;
  const threatColor = THREAT_CONFIG[threat].color;
  const size = selected ? 20 : 14;
  const ring = selected
    ? `box-shadow:0 0 0 3px ${layerColor}60,0 0 14px ${layerColor}60;`
    : `box-shadow:0 0 6px ${layerColor}80;`;
  const pulse =
    threat === 'CRITICAL' || threat === 'HIGH'
      ? `<span style="position:absolute;inset:-4px;border-radius:50%;background:${threatColor}20;animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;"></span>`
      : '';
  return L.divIcon({
    className: '',
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${layerColor};border:2px solid ${threatColor};${ring}">
        ${pulse}
      </div>
    `,
    iconSize: [size, size],
  });
}

function MapDarkStyle() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    container.style.background = '#060810';
    map.invalidateSize();
  }, [map]);
  return null;
}

function FitBounds({ pins }: { pins: GeoPin[] }) {
  const map = useMap();
  const pinKey = pins.map((p) => p.id).join(',');
  const latLngs: [number, number][] = pins.map((p) => [p.lat, p.lng]);
  useEffect(() => {
    if (latLngs.length === 0) return;
    map.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60], maxZoom: 5 });
  }, [pinKey, map]);
  return null;
}

function FlyToController({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  const prevTarget = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!target) return;
    if (prevTarget.current?.lat === target.lat && prevTarget.current?.lng === target.lng) return;
    prevTarget.current = target;
    map.flyTo([target.lat, target.lng], 6, { duration: 1.4, easeLinearity: 0.25 });
  }, [target, map]);
  return null;
}

function PinMarkers({
  pins,
  selected,
  onSelect,
}: {
  pins: GeoPin[];
  selected: GeoPin | null;
  onSelect: (pin: GeoPin) => void;
}) {
  return (
    <>
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={makePinIcon(pin.layer, pin.threat, selected?.id === pin.id)}
          eventHandlers={{ click: () => onSelect(pin) }}
          zIndexOffset={selected?.id === pin.id ? 1000 : 0}
        />
      ))}
    </>
  );
}

function ClassificationBadge({ cls }: { cls: Classification }) {
  const color = getClassificationColor(cls);
  return (
    <span
      className="font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded border"
      style={{ color, borderColor: `${color}40`, background: `${color}12` }}
    >
      {cls}
    </span>
  );
}

function DetailPanel({
  pin,
  onClose,
  onZoomTo,
}: {
  pin: GeoPin;
  onClose: () => void;
  onZoomTo: () => void;
}) {
  const layer = LAYER_CONFIG[pin.layer];
  const threat = THREAT_CONFIG[pin.threat];
  const ThreatIcon = threat.icon;
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(t);
      if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
    };
  }, []);

  function handleClose() {
    setVisible(false);
    if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(onClose, 220);
  }

  return (
    <div
      className="absolute top-4 right-4 z-[1000] w-80 rounded-lg border overflow-hidden"
      style={{
        background: 'rgba(6,8,16,0.96)',
        borderColor: 'rgba(201,162,39,0.25)',
        backdropFilter: 'blur(12px)',
        transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 1rem))',
        opacity: visible ? 1 : 0,
        transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1), opacity 180ms ease',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(201,162,39,0.15)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: layer.color, boxShadow: `0 0 6px ${layer.color}` }}
          />
          <span
            className="font-display text-[10px] tracking-[0.15em] font-semibold uppercase"
            style={{ color: layer.color }}
          >
            {pin.layer}
          </span>
        </div>
        <button onClick={handleClose} className="p-1 rounded hover:bg-white/10 transition-colors">
          <X className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display text-sm font-bold gold-text leading-tight">{pin.label}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{pin.sublabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded border"
            style={{
              color: threat.color,
              borderColor: `${threat.color}40`,
              background: `${threat.color}10`,
            }}
          >
            <ThreatIcon className="w-3 h-3" />
            <span className="font-mono text-[9px] tracking-widest">{pin.threat}</span>
          </div>
          <ClassificationBadge cls={pin.classification} />
        </div>

        <div
          className="rounded p-3 border text-xs text-slate-400 leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          {pin.detail.summary}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Eye className="w-3 h-3 text-slate-500" />
              <span
                className="font-mono text-xs font-bold"
                style={{ color: pin.detail.confidence >= 90 ? '#4ade80' : '#facc15' }}
              >
                {pin.detail.confidence}%
              </span>
            </div>
            <div className="text-[9px] text-slate-600 tracking-wider">CONFIDENCE</div>
          </div>
          <div className="rounded p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="font-mono text-xs font-bold text-slate-300">
                {pin.detail.timestamp}
              </span>
            </div>
            <div className="text-[9px] text-slate-600 tracking-wider">LAST SEEN</div>
          </div>
        </div>

        <div>
          <div className="text-[9px] font-mono text-slate-600 tracking-widest uppercase mb-1.5">
            Source
          </div>
          <p className="text-[10px] text-slate-500 font-mono">{pin.detail.source}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {pin.detail.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(201,162,39,0.08)',
                color: 'rgba(201,162,39,0.6)',
                border: '1px solid rgba(201,162,39,0.15)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={onZoomTo}
          className="w-full flex items-center justify-center gap-2 py-2 rounded border text-[10px] font-display tracking-[0.12em] font-semibold uppercase transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
          style={{
            color: layer.color,
            borderColor: `${layer.color}40`,
            background: `${layer.color}12`,
          }}
        >
          <Navigation className="w-3 h-3" />
          Zoom to Location
        </button>
      </div>
    </div>
  );
}

function LiveFeedBadge({
  status,
  lastUpdated,
  generation,
}: {
  status: FeedState['status'];
  lastUpdated: Date | null;
  generation: number;
}) {
  const relTime = useRelativeTime(lastUpdated);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
        <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
        <span>CONNECTING…</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-500">
        <WifiOff className="w-3 h-3" />
        <span>FEED OFFLINE</span>
      </div>
    );
  }

  if (status === 'stale') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-500">
        <WifiOff className="w-3 h-3" />
        <span>STALE · {relTime}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-green-400">
      <span
        className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"
        style={{ boxShadow: '0 0 6px #4ade80', animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }}
      />
      <span>LIVE · GEN {generation} · {relTime}</span>
    </div>
  );
}

export default function GeospatialIntelligence() {
  const feed = useGeoIntelFeed();

  const [activeLayers, setActiveLayers] = useState<Set<GeoLayer>>(
    new Set(['SIGINT', 'INFRASTRUCTURE', 'PERSONNEL', 'WEATHER']),
  );
  const [selected, setSelected] = useState<GeoPin | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThreats, setActiveThreats] = useState<Set<GeoThreat>>(new Set(ALL_THREATS));
  const [activeClassifications, setActiveClassifications] = useState<Set<Classification>>(
    new Set(ALL_CLASSIFICATIONS),
  );

  useEffect(() => {
    if (!selected) return;
    const stillExists = feed.pins.find((p) => p.id === selected.id);
    if (stillExists) {
      setSelected(stillExists);
    } else {
      setSelected(null);
    }
  }, [feed.pins, selected]);

  const visiblePins = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return feed.pins.filter((p) => {
      if (!activeLayers.has(p.layer)) return false;
      if (!activeThreats.has(p.threat)) return false;
      if (!activeClassifications.has(p.classification)) return false;
      if (q) {
        const matchesLabel = p.label.toLowerCase().includes(q) || p.sublabel.toLowerCase().includes(q);
        const matchesTag = p.detail.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesLabel && !matchesTag) return false;
      }
      return true;
    });
  }, [feed.pins, activeLayers, activeThreats, activeClassifications, searchQuery]);

  useEffect(() => {
    if (selected && !visiblePins.some((p) => p.id === selected.id)) {
      setSelected(null);
    }
  }, [visiblePins, selected]);

  function toggleLayer(layer: GeoLayer) {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        if (next.size === 1) return prev;
        next.delete(layer);
        if (selected?.layer === layer) setSelected(null);
      } else {
        next.add(layer);
      }
      return next;
    });
  }

  function toggleThreat(threat: GeoThreat) {
    setActiveThreats((prev) => {
      const next = new Set(prev);
      if (next.has(threat)) {
        if (next.size === 1) return prev;
        next.delete(threat);
        if (selected?.threat === threat) setSelected(null);
      } else {
        next.add(threat);
      }
      return next;
    });
  }

  function toggleClassification(cls: Classification) {
    setActiveClassifications((prev) => {
      const next = new Set(prev);
      if (next.has(cls)) {
        if (next.size === 1) return prev;
        next.delete(cls);
        if (selected?.classification === cls) setSelected(null);
      } else {
        next.add(cls);
      }
      return next;
    });
  }

  function clearAllFilters() {
    setSearchQuery('');
    setActiveThreats(new Set(ALL_THREATS));
    setActiveClassifications(new Set(ALL_CLASSIFICATIONS));
  }

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    activeThreats.size < ALL_THREATS.length ||
    activeClassifications.size < ALL_CLASSIFICATIONS.length;

  const counts = (Object.keys(LAYER_CONFIG) as GeoLayer[]).reduce<Record<GeoLayer, number>>(
    (acc, l) => {
      acc[l] = feed.pins.filter((p) => p.layer === l).length;
      return acc;
    },
    {} as Record<GeoLayer, number>,
  );

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Globe2 className="w-5 h-5" style={{ color: '#c9a227' }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Geospatial Intelligence
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Live intelligence layer overlays — infrastructure, signals, personnel and environmental
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.entries(LAYER_CONFIG) as [GeoLayer, (typeof LAYER_CONFIG)[GeoLayer]][]).map(
          ([layer, cfg]) => {
            const Icon = cfg.icon;
            const active = activeLayers.has(layer);
            return (
              <button
                key={layer}
                onClick={() => toggleLayer(layer)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-display tracking-[0.12em] font-semibold uppercase transition-all duration-200',
                  active ? 'opacity-100' : 'opacity-40',
                )}
                style={{
                  color: active ? cfg.color : 'rgba(148,163,184,0.6)',
                  borderColor: active ? `${cfg.color}50` : 'rgba(255,255,255,0.08)',
                  background: active ? `${cfg.color}12` : 'transparent',
                }}
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
                <span
                  className="ml-1 font-mono text-[9px] px-1 rounded"
                  style={{ background: active ? `${cfg.color}20` : 'rgba(255,255,255,0.05)' }}
                >
                  {counts[layer]}
                </span>
              </button>
            );
          },
        )}
        <div className="ml-auto flex items-center gap-3">
          <LiveFeedBadge
            status={feed.status}
            lastUpdated={feed.lastUpdated}
            generation={feed.generation}
          />
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <Wifi className="w-3 h-3 text-green-400" />
            <span>{visiblePins.length} ACTIVE SIGNALS</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="rounded-lg border p-3 space-y-3"
        style={{
          background: 'rgba(6,8,16,0.8)',
          borderColor: 'rgba(201,162,39,0.15)',
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(201,162,39,0.6)' }} />
          <div
            className="flex-1 flex items-center gap-2 rounded border px-2.5 py-1.5"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
          >
            <Search className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by label or tag…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[11px] text-slate-300 placeholder:text-slate-600 outline-none font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-2 py-1.5 rounded border text-[9px] font-mono tracking-wider transition-colors hover:bg-white/5"
              style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.7)' }}
            >
              <X className="w-2.5 h-2.5" />
              RESET
            </button>
          )}
        </div>

        {/* Threat level chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] tracking-widest text-slate-600 uppercase w-16 flex-shrink-0">
            Threat
          </span>
          {ALL_THREATS.map((threat) => {
            const cfg = THREAT_CONFIG[threat];
            const active = activeThreats.has(threat);
            return (
              <button
                key={threat}
                onClick={() => toggleThreat(threat)}
                className="flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-mono tracking-wider transition-all duration-150"
                style={{
                  color: active ? cfg.color : 'rgba(100,116,139,0.5)',
                  borderColor: active ? `${cfg.color}40` : 'rgba(255,255,255,0.06)',
                  background: active ? `${cfg.color}10` : 'transparent',
                  opacity: active ? 1 : 0.45,
                }}
              >
                {threat}
              </button>
            );
          })}
        </div>

        {/* Classification chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] tracking-widest text-slate-600 uppercase w-16 flex-shrink-0">
            Class.
          </span>
          {ALL_CLASSIFICATIONS.map((cls) => {
            const color = getClassificationColor(cls);
            const active = activeClassifications.has(cls);
            return (
              <button
                key={cls}
                onClick={() => toggleClassification(cls)}
                className="px-2 py-0.5 rounded border text-[9px] font-mono tracking-wider transition-all duration-150"
                style={{
                  color: active ? color : 'rgba(100,116,139,0.5)',
                  borderColor: active ? `${color}40` : 'rgba(255,255,255,0.06)',
                  background: active ? `${color}10` : 'transparent',
                  opacity: active ? 1 : 0.45,
                }}
              >
                {cls}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="flex-1 relative rounded-lg overflow-hidden border min-h-[480px]"
        style={{ borderColor: 'rgba(201,162,39,0.2)' }}
      >
        <style>{`
          .leaflet-container { background: #060810 !important; }
          .leaflet-tile { filter: brightness(0.7) saturate(0.4) hue-rotate(200deg); }
          .leaflet-control-zoom a { background: rgba(10,13,26,0.95) !important; color: #c9a227 !important; border-color: rgba(201,162,39,0.3) !important; }
          .leaflet-control-zoom a:hover { background: rgba(201,162,39,0.15) !important; }
          .leaflet-control-attribution { background: rgba(6,8,16,0.8) !important; color: rgba(100,116,139,0.5) !important; font-size: 8px !important; }
          .leaflet-control-attribution a { color: rgba(100,116,139,0.5) !important; }
          @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
        `}</style>

        <MapContainer
          center={[30, 10]}
          zoom={2}
          style={{ height: '100%', width: '100%', background: '#060810' }}
          zoomControl
          attributionControl
          whenReady={() => setMapReady(true)}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />
          <MapDarkStyle />
          <FitBounds pins={visiblePins} />
          <FlyToController target={flyTarget} />
          <PinMarkers pins={visiblePins} selected={selected} onSelect={setSelected} />
        </MapContainer>

        {selected && (
          <DetailPanel
            key={selected.id}
            pin={selected}
            onClose={() => setSelected(null)}
            onZoomTo={() => setFlyTarget({ lat: selected.lat, lng: selected.lng })}
          />
        )}

        <div
          className="absolute bottom-4 left-4 z-[1000] rounded border p-3 space-y-1.5"
          style={{
            background: 'rgba(6,8,16,0.92)',
            borderColor: 'rgba(201,162,39,0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="font-display text-[9px] tracking-widest text-slate-500 uppercase mb-2">
            Threat Legend
          </div>
          {(Object.entries(THREAT_CONFIG) as [GeoThreat, (typeof THREAT_CONFIG)[GeoThreat]][]).map(
            ([threat, cfg]) => {
              return (
                <div key={threat} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0"
                    style={{ backgroundColor: cfg.color, borderColor: cfg.color }}
                  />
                  <span
                    className="font-mono text-[9px] tracking-wider"
                    style={{ color: cfg.color }}
                  >
                    {threat}
                  </span>
                </div>
              );
            },
          )}
        </div>

        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#060810] z-[2000]">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(201,162,39,0.2)', borderTopColor: '#c9a227' }}
              />
              <span className="font-display text-xs tracking-widest text-gold-dim uppercase">
                Acquiring satellite lock…
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(LAYER_CONFIG) as [GeoLayer, (typeof LAYER_CONFIG)[GeoLayer]][]).map(
          ([layer, cfg]) => {
            const pinsByLayer = feed.pins.filter((p) => p.layer === layer);
            const highThreat = pinsByLayer.filter(
              (p) => p.threat === 'HIGH' || p.threat === 'CRITICAL',
            ).length;
            const Icon = cfg.icon;
            return (
              <div
                key={layer}
                className="rounded-lg border p-3 cursor-pointer transition-all duration-200"
                style={{
                  background: activeLayers.has(layer) ? `${cfg.color}08` : 'rgba(255,255,255,0.02)',
                  borderColor: activeLayers.has(layer)
                    ? `${cfg.color}30`
                    : 'rgba(255,255,255,0.06)',
                }}
                onClick={() => toggleLayer(layer)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                  <span
                    className="font-display text-[9px] tracking-[0.12em] font-semibold uppercase"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <div className="font-mono text-xl font-bold" style={{ color: cfg.color }}>
                  {pinsByLayer.length}
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  {highThreat > 0 ? (
                    <span style={{ color: '#f97316' }}>{highThreat} elevated</span>
                  ) : (
                    <span className="text-green-500">all nominal</span>
                  )}
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
