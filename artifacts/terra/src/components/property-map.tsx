// @ts-nocheck
import 'mapbox-gl/dist/mapbox-gl.css';
import { color } from '@szl-holdings/design-system';
import { cn } from '@szl-holdings/shared-ui/utils';
import { Building2, ChevronRight, DollarSign, MapPin, TrendingUp, Users, X } from 'lucide-react';
import type MapboxGL from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import type { Property } from '@/data/portfolio';

const STATUS_COLORS: Record<string, string> = {
  performing: color.accent.green,
  watch: color.accent.amber,
  critical: color.accent.red,
};

const STATUS_LABELS: Record<string, string> = {
  performing: 'Performing',
  watch: 'Watch',
  critical: 'Critical',
};

const TYPE_ICONS: Record<string, string> = {
  multifamily: '🏢',
  office: '🏗️',
  retail: '🏪',
  industrial: '🏭',
  'mixed-use': '🏙️',
};

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function PropertyPanel({ property, onClose }: { property: Property; onClose: () => void }) {
  const color = STATUS_COLORS[property.status] || '#666';
  return (
    <div
      className="absolute right-3 top-3 bottom-3 w-[300px] z-20 rounded-xl overflow-hidden flex flex-col"
      style={{
        background: 'rgba(8,16,28,0.97)',
        border: '1px solid rgba(200,160,96,0.15)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="p-4 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(200,160,96,0.1)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,160,96,0.1)', border: '1px solid rgba(200,160,96,0.2)' }}
          >
            {TYPE_ICONS[property.type] || '🏢'}
          </div>
          <div>
            <p className="text-[11px] font-bold text-white/90 leading-tight">{property.name}</p>
            <p className="text-[9px] mt-0.5" style={{ color: 'rgba(200,160,96,0.5)' }}>
              {property.type.replace('-', ' ').toUpperCase()}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <span
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ color, border: `1px solid ${color}30`, background: `${color}10` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {STATUS_LABELS[property.status]}
          </span>
        </div>
        <div
          className="flex items-center gap-1 text-[10px]"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {property.address}, {property.city}, {property.state}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Value', value: formatCurrency(property.value), icon: DollarSign },
            {
              label: 'Monthly Rev.',
              value: formatCurrency(property.monthlyRevenue),
              icon: TrendingUp,
            },
            { label: 'Cap Rate', value: `${property.capRate}%`, icon: TrendingUp },
            { label: 'Occupancy', value: `${property.occupancy}%`, icon: Users },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg p-2.5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p
                className="text-[9px] uppercase tracking-wider mb-0.5"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {m.label}
              </p>
              <p className="text-[11px] font-mono font-bold text-white/80">{m.value}</p>
            </div>
          ))}
        </div>
        <div
          className="rounded-lg p-2.5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p
            className="text-[9px] uppercase tracking-wider mb-1"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Annual NOI
          </p>
          <p className="text-[13px] font-mono font-bold" style={{ color: '#c8a060' }}>
            {formatCurrency(property.annualNOI)}
          </p>
        </div>
        <div
          className="rounded-lg p-2.5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <p
              className="text-[9px] uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Occupancy
            </p>
            <span
              className="text-[9px] font-mono"
              style={{
                color:
                  property.occupancy >= 90
                    ? '#10b981'
                    : property.occupancy >= 75
                      ? '#f59e0b'
                      : '#ef4444',
              }}
            >
              {property.occupancy}%
            </span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${property.occupancy}%`,
                background:
                  property.occupancy >= 90
                    ? '#10b981'
                    : property.occupancy >= 75
                      ? '#f59e0b'
                      : '#ef4444',
              }}
            />
          </div>
        </div>
        <Link href={`/property/${property.id}`}>
          <button
            className="w-full text-[10px] py-2 rounded-lg border transition-all hover:bg-white/5"
            style={{ color: '#c8a060', borderColor: 'rgba(200,160,96,0.2)' }}
          >
            Full Detail <ChevronRight className="w-3 h-3 inline ml-1" />
          </button>
        </Link>
      </div>
    </div>
  );
}

const FILTER_OPTIONS = ['all', 'performing', 'watch', 'critical'] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

interface PropertyMapProps {
  properties: Property[];
  token: string;
  height?: string;
  showPanel?: boolean;
}

export default function PropertyMap({
  properties,
  token,
  height = '100%',
  showPanel = true,
}: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxGL.Map | null>(null);
  const popupRef = useRef<MapboxGL.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filter, setFilter] = useState<FilterOption>('all');

  const filteredProperties =
    filter === 'all' ? properties : properties.filter((p) => p.status === filter);

  const buildGeoJSON = useCallback(
    (
      props: Property[],
    ): GeoJSON.FeatureCollection<GeoJSON.Point, Property & { statusColor: string }> => ({
      type: 'FeatureCollection',
      features: props.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
        properties: { ...p, statusColor: STATUS_COLORS[p.status] ?? '#666' },
      })),
    }),
    [],
  );

  useEffect(() => {
    if (!mapContainerRef.current || !token) return;
    let destroyed = false;

    import('mapbox-gl')
      .then((mod) => {
        if (destroyed || !mapContainerRef.current) return;
        const mgl = mod.default;
        mgl.accessToken = token;

        const map = new mgl.Map({
          container: mapContainerRef.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-95, 38],
          zoom: 3.5,
          antialias: true,
        });

        mapRef.current = map;

        map.on('load', () => {
          if (destroyed) return;

          map.addSource('properties', {
            type: 'geojson',
            data: buildGeoJSON(properties),
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'properties',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#c8a060',
                3,
                '#f59e0b',
                6,
                '#ef4444',
              ],
              'circle-radius': ['step', ['get', 'point_count'], 16, 3, 20, 6, 26],
              'circle-opacity': 0.85,
              'circle-stroke-width': 2,
              'circle-stroke-color': 'rgba(8,16,28,0.8)',
            },
          });

          map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'properties',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
            paint: { 'text-color': '#08101c' },
          });

          map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'properties',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': ['get', 'statusColor'],
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': 'rgba(255,255,255,0.3)',
              'circle-opacity': 0.95,
            },
          });

          map.addLayer({
            id: 'unclustered-selected',
            type: 'circle',
            source: 'properties',
            filter: ['==', ['get', 'id'], ''],
            paint: {
              'circle-color': ['get', 'statusColor'],
              'circle-radius': 13,
              'circle-stroke-width': 3,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 1,
            },
          });

          map.on('click', 'clusters', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            const feature = features[0];
            if (!feature) return;
            const src = map.getSource('properties') as MapboxGL.GeoJSONSource;
            src.getClusterExpansionZoom(feature.properties?.cluster_id as number, (err, zoom) => {
              if (err) return;
              const geom = feature.geometry as GeoJSON.Point;
              map.easeTo({ center: geom.coordinates as [number, number], zoom: zoom ?? 10 });
            });
          });

          map.on('click', 'unclustered-point', (e) => {
            const feature = e.features?.[0];
            if (!feature) return;
            const props = feature.properties as Property;
            const found = properties.find((p) => p.id === props.id) ?? null;
            setSelectedProperty((prev) => (prev?.id === props.id ? null : found));
          });

          map.on('mouseenter', 'clusters', () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'clusters', () => {
            map.getCanvas().style.cursor = '';
          });
          map.on('mouseenter', 'unclustered-point', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            const feature = e.features?.[0];
            if (!feature || !mgl) return;
            const props = feature.properties as Property & { statusColor: string };
            const color = props.statusColor;
            if (popupRef.current) popupRef.current.remove();
            popupRef.current = new mgl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: 12,
              className: 'property-popup',
              maxWidth: '260px',
            })
              .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
              .setHTML(`
              <div style="background:#08101c;border:1px solid rgba(200,160,96,0.2);border-radius:10px;padding:10px;font-family:system-ui;min-width:200px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                  <span style="font-size:14px;">${TYPE_ICONS[props.type] || '🏢'}</span>
                  <span style="color:#e0d6c8;font-size:11px;font-weight:700;">${props.name}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;">
                  <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;"></span>
                  <span style="color:${color};font-size:10px;">${STATUS_LABELS[props.status] ?? props.status}</span>
                  <span style="color:rgba(200,160,96,0.4);font-size:9px;margin-left:auto;">${props.type}</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;font-size:9px;margin-top:6px;">
                  <div style="color:rgba(255,255,255,0.35);">Value</div><div style="color:#c8a060;font-weight:600;">${formatCurrency(props.value)}</div>
                  <div style="color:rgba(255,255,255,0.35);">Cap Rate</div><div style="color:#e0d6c8;">${props.capRate}%</div>
                  <div style="color:rgba(255,255,255,0.35);">Occupancy</div><div style="color:${color};">${props.occupancy}%</div>
                  <div style="color:rgba(255,255,255,0.35);">City</div><div style="color:#e0d6c8;">${props.city}</div>
                </div>
              </div>
            `)
              .addTo(map);
          });

          map.on('mouseleave', 'unclustered-point', () => {
            map.getCanvas().style.cursor = '';
            if (popupRef.current) {
              popupRef.current.remove();
              popupRef.current = null;
            }
          });

          if (!destroyed) setMapLoaded(true);
        });

        map.on('error', () => {
          if (!destroyed) setMapError(true);
        });
      })
      .catch(() => setMapError(true));

    return () => {
      destroyed = true;
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [token, properties, buildGeoJSON]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const src = mapRef.current.getSource('properties') as MapboxGL.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(buildGeoJSON(filteredProperties));
  }, [mapLoaded, filteredProperties, buildGeoJSON]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    try {
      mapRef.current.setFilter('unclustered-selected', [
        '==',
        ['get', 'id'],
        selectedProperty?.id ?? '',
      ]);
    } catch {}
    if (selectedProperty && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedProperty.longitude, selectedProperty.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 10),
        duration: 800,
        essential: true,
      });
    }
  }, [mapLoaded, selectedProperty]);

  if (!token || mapError) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          height,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="text-center space-y-2 px-6">
          <Building2 className="w-8 h-8 mx-auto" style={{ color: 'rgba(200,160,96,0.3)' }} />
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Map unavailable
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {!token ? 'MAPBOX_ACCESS_TOKEN is not configured' : 'Mapbox failed to load'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ height, border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <style>{`
        @keyframes property-pulse {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%,-50%) scale(3.5); opacity: 0; }
        }
        .property-popup .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .property-popup .mapboxgl-popup-tip { display: none; }
        .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right { display: none; }
        .mapboxgl-ctrl-top-right { top: 8px; right: 8px; }
        .mapboxgl-ctrl-zoom-in, .mapboxgl-ctrl-zoom-out {
          background-color: rgba(8,16,28,0.9) !important;
          border-color: rgba(200,160,96,0.2) !important;
          color: rgba(200,160,96,0.7) !important;
        }
      `}</style>

      <div ref={mapContainerRef} className="absolute inset-0" />

      {!mapLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: '#08101c' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-7 h-7 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(200,160,96,0.2)', borderTopColor: '#c8a060' }}
            />
            <p className="text-[10px]" style={{ color: 'rgba(200,160,96,0.5)' }}>
              Loading property map…
            </p>
          </div>
        </div>
      )}

      {mapLoaded && (
        <>
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'text-[9px] px-2 py-1 rounded-lg border capitalize font-medium transition-all',
                )}
                style={{
                  color:
                    filter === f
                      ? f === 'all'
                        ? '#c8a060'
                        : (STATUS_COLORS[f] ?? '#c8a060')
                      : 'rgba(255,255,255,0.35)',
                  borderColor:
                    filter === f
                      ? f === 'all'
                        ? 'rgba(200,160,96,0.3)'
                        : `${STATUS_COLORS[f] ?? '#c8a060'}30`
                      : 'rgba(255,255,255,0.08)',
                  background:
                    filter === f
                      ? f === 'all'
                        ? 'rgba(200,160,96,0.08)'
                        : `${STATUS_COLORS[f] ?? '#c8a060'}10`
                      : 'rgba(8,16,28,0.8)',
                }}
              >
                {f === 'all' ? 'All' : STATUS_LABELS[f]}
              </button>
            ))}
          </div>

          <div
            className="absolute bottom-3 left-3 z-10 text-[9px] font-mono rounded-lg px-2.5 py-1.5"
            style={{
              color: 'rgba(200,160,96,0.5)',
              background: 'rgba(8,16,28,0.8)',
              border: '1px solid rgba(200,160,96,0.1)',
            }}
          >
            <Building2 className="w-3 h-3 inline mr-1 opacity-60" />
            {filteredProperties.length} propert{filteredProperties.length === 1 ? 'y' : 'ies'} ·
            Mapbox GL
          </div>

          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <span
                key={status}
                className="flex items-center gap-1 text-[9px]"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {STATUS_LABELS[status]}
              </span>
            ))}
          </div>
        </>
      )}

      {showPanel && selectedProperty && (
        <PropertyPanel property={selectedProperty} onClose={() => setSelectedProperty(null)} />
      )}
    </div>
  );
}
