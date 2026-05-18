/**
 * Imperium Map — MapLibre geospatial surface for tenant infrastructure.
 *
 * Pins are loaded from /api/a11oy/stubs/infrastructure-map (tenant-scoped).
 * The basemap tile/style URL is read from VITE_MAPLIBRE_STYLE_URL — when
 * absent we render a branded empty state instead of a broken/blank map.
 */

import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataStateBadge } from '../../components/ui/DataStateBadge';
import { useApiData } from '../../hooks/useApiData';
import { Map as MapIcon, AlertTriangle } from 'lucide-react';

interface InfraPin {
  id: string;
  label: string;
  region: string;
  lat: number;
  lon: number;
  status: 'nominal' | 'degraded' | 'critical' | string;
  tier: string;
  capacity: number;
}

interface InfraEdge {
  from: string;
  to: string;
  kind?: string;
  health?: string;
}

interface InfraMapResponse {
  pins: InfraPin[];
  edges?: InfraEdge[];
  regions?: { id: string; label: string; pinCount: number }[];
}

const STATUS_COLOR: Record<string, string> = {
  nominal: '#22c55e',
  degraded: '#f59e0b',
  critical: '#ef4444',
};

const STYLE_URL = (import.meta.env.VITE_MAPLIBRE_STYLE_URL as string | undefined) ?? '';

export default function ImperiumMapPage() {
  const { data, loading, error, source } = useApiData<InfraMapResponse>('/stubs/infrastructure-map');
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const pins = data?.pins ?? [];
  const regions = data?.regions ?? [];

  const totals = useMemo(() => {
    const t = { nominal: 0, degraded: 0, critical: 0 };
    for (const p of pins) {
      if (p.status in t) (t as Record<string, number>)[p.status] += 1;
    }
    return t;
  }, [pins]);

  useEffect(() => {
    if (!STYLE_URL) return;
    if (!mapContainer.current) return;
    if (mapRef.current) return;
    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: STYLE_URL,
      center: [0, 20],
      zoom: 1.2,
      attributionControl: { compact: true },
    });
    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !STYLE_URL) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (pins.length === 0) return;

    const apply = () => {
      pins.forEach((p) => {
        const el = document.createElement('div');
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.borderRadius = '50%';
        el.style.background = STATUS_COLOR[p.status] ?? '#94a3b8';
        el.style.border = '2px solid rgba(255,255,255,0.85)';
        el.style.boxShadow = '0 0 0 2px rgba(15,23,42,0.6)';
        const popup = new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
          `<div style="font-family:ui-sans-serif,system-ui;font-size:12px;line-height:1.35">
             <div style="font-weight:600;color:#0f172a">${p.label}</div>
             <div style="color:#475569">${p.region} · ${p.tier}</div>
             <div style="color:#475569">Status: <span style="color:${STATUS_COLOR[p.status] ?? '#475569'};text-transform:uppercase">${p.status}</span></div>
             <div style="color:#475569">Capacity: ${Math.round((p.capacity ?? 0) * 100)}%</div>
           </div>`,
        );
        const m = new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).setPopup(popup).addTo(map);
        markersRef.current.push(m);
      });
      if (pins.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        pins.forEach((p) => bounds.extend([p.lon, p.lat]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 4, duration: 600 });
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [pins]);

  const badgeState = loading ? 'loading' : error ? 'error' : source === 'api' ? 'live' : 'demo';
  const badgeLabel = STYLE_URL ? undefined : 'NO BASEMAP TOKEN';

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Infrastructure' }, { label: 'Imperium Map' }]}
        title="Imperium Map"
        description="Tenant infrastructure topology on a live geospatial canvas."
      />
      <div className="flex items-center gap-3">
        <DataStateBadge state={badgeState} label={badgeLabel} />
        <span className="text-xs text-slate-400">
          {pins.length} pins · {regions.length} regions · {totals.critical} critical · {totals.degraded} degraded · {totals.nominal} nominal
        </span>
      </div>

      <Card padding="none" radius="lg" accent="cyan" style={{ overflow: 'hidden' }}>
        {STYLE_URL ? (
          <div ref={mapContainer} style={{ width: '100%', height: 560 }} />
        ) : (
          <div
            style={{
              height: 560,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: 32,
              background:
                'radial-gradient(circle at 30% 20%, rgba(34,211,238,0.10), transparent 60%), radial-gradient(circle at 70% 80%, rgba(168,85,247,0.10), transparent 55%), #0b1220',
              color: '#e2e8f0',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'rgba(34,211,238,0.12)',
                border: '1px solid rgba(34,211,238,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapIcon size={28} color="#22d3ee" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Basemap not configured</div>
            <div style={{ maxWidth: 460, fontSize: 13, color: '#94a3b8', lineHeight: 1.55 }}>
              Set <code style={{ color: '#22d3ee' }}>VITE_MAPLIBRE_STYLE_URL</code> to a MapLibre style URL
              (with any required token) to render the live Imperium Map. The pin data
              below is already streaming live from <code style={{ color: '#22d3ee' }}>/api/a11oy/stubs/infrastructure-map</code>.
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: 12,
                maxWidth: 700,
              }}
            >
              {pins.slice(0, 12).map((p) => (
                <span
                  key={p.id}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${STATUS_COLOR[p.status] ?? '#475569'}55`,
                    color: '#cbd5e1',
                    fontSize: 11,
                    fontFamily: 'ui-monospace,monospace',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: STATUS_COLOR[p.status] ?? '#94a3b8',
                      marginRight: 6,
                    }}
                  />
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {error && (
        <Card accent="amber" padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
            <AlertTriangle size={16} /> Failed to load infrastructure map: {error}
          </div>
        </Card>
      )}
    </div>
  );
}
