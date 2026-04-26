import { color } from '@szl-holdings/design-system';
import {
  Activity,
  AlertTriangle,
  Building2,
  ChevronRight,
  Circle,
  Compass,
  Crosshair,
  Eye,
  EyeOff,
  Globe,
  RotateCcw,
  Scale,
  Shield,
  Ship,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';

const DS = {
  bg: '#070b12',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

const DOMAIN_COLORS = {
  vessels: '#38bdf8',
  terra: '#4ade80',
  aegis: '#ef4444',
  prism: '#d4a054',
  personnel: '#a78bfa',
};

type DomainKey = keyof typeof DOMAIN_COLORS;

interface GeoEntity {
  id: string;
  domain: DomainKey;
  label: string;
  sublabel?: string;
  lat: number;
  lng: number;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  speed?: number;
  heading?: number;
  moving?: boolean;
  value?: string;
}

interface GeofenceZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  active: boolean;
  alertOnEnter: boolean;
  alertOnExit: boolean;
  color: string;
  triggeredBy: string[];
}

const INITIAL_ENTITIES: GeoEntity[] = [
  {
    id: 'V001',
    domain: 'vessels',
    label: 'MV Pacific Horizon',
    sublabel: 'Oil Tanker · 847 DWT',
    lat: 22.3,
    lng: 114.2,
    speed: 12,
    heading: 285,
    moving: true,
    severity: 'high',
  },
  {
    id: 'V002',
    domain: 'vessels',
    label: 'MS Atlantic Spirit',
    sublabel: 'Container · Panama Flag',
    lat: 51.5,
    lng: -1.2,
    speed: 18,
    heading: 180,
    moving: true,
  },
  {
    id: 'V003',
    domain: 'vessels',
    label: 'MV Caspian Star',
    sublabel: 'LNG Carrier',
    lat: 28.5,
    lng: 49.8,
    speed: 9,
    heading: 320,
    moving: true,
    severity: 'medium',
  },
  {
    id: 'V004',
    domain: 'vessels',
    label: 'MV Stratos',
    sublabel: 'Bulk Carrier',
    lat: -6.2,
    lng: 39.3,
    speed: 14,
    heading: 210,
    moving: true,
  },
  {
    id: 'V005',
    domain: 'vessels',
    label: 'MT Poseidon',
    sublabel: 'VLCC · Liberia Flag',
    lat: 1.3,
    lng: 103.8,
    speed: 11,
    heading: 95,
    moving: true,
    severity: 'critical',
  },
  {
    id: 'V006',
    domain: 'vessels',
    label: 'MV Blue Condor',
    sublabel: 'RoRo · Netherlands',
    lat: 37.9,
    lng: 23.7,
    speed: 16,
    heading: 250,
    moving: true,
  },
  {
    id: 'T001',
    domain: 'terra',
    label: 'Henderson Plaza',
    sublabel: 'Commercial · $14.2M',
    lat: 40.7,
    lng: -74.0,
    value: '$14.2M',
  },
  {
    id: 'T002',
    domain: 'terra',
    label: 'Brooklyn Portfolio',
    sublabel: 'Mixed Use · $8.7M',
    lat: 40.65,
    lng: -73.94,
    severity: 'medium',
    value: '$8.7M',
  },
  {
    id: 'T003',
    domain: 'terra',
    label: 'Miami Beach Condo',
    sublabel: 'Residential · $3.1M',
    lat: 25.79,
    lng: -80.13,
    value: '$3.1M',
  },
  {
    id: 'T004',
    domain: 'terra',
    label: 'Austin Tech Hub',
    sublabel: 'Office · $22.4M',
    lat: 30.27,
    lng: -97.74,
    value: '$22.4M',
  },
  {
    id: 'T005',
    domain: 'terra',
    label: 'Phoenix Distress',
    sublabel: 'Multi-family · Foreclosure',
    lat: 33.45,
    lng: -112.07,
    severity: 'high',
    value: '$5.8M',
  },
  {
    id: 'A001',
    domain: 'aegis',
    label: 'APT29 Origin — RU',
    sublabel: 'Active Campaign · C2 Active',
    lat: 55.75,
    lng: 37.6,
    severity: 'critical',
  },
  {
    id: 'A002',
    domain: 'aegis',
    label: 'Lazarus Group — KP',
    sublabel: 'Threat Actor · Financial',
    lat: 39.0,
    lng: 125.75,
    severity: 'critical',
  },
  {
    id: 'A003',
    domain: 'aegis',
    label: 'Scattered Spider — UK',
    sublabel: 'Social Engineering',
    lat: 51.5,
    lng: -0.1,
    severity: 'high',
  },
  {
    id: 'A004',
    domain: 'aegis',
    label: 'VOLT TYPHOON — CN',
    sublabel: 'Infrastructure Threat',
    lat: 39.9,
    lng: 116.4,
    severity: 'critical',
  },
  {
    id: 'P001',
    domain: 'prism',
    label: 'Rodriguez v. National',
    sublabel: 'Litigation · SDNY',
    lat: 40.71,
    lng: -74.01,
  },
  {
    id: 'P002',
    domain: 'prism',
    label: 'SEC Investigation',
    sublabel: 'Regulatory · Financial',
    lat: 38.9,
    lng: -77.04,
    severity: 'high',
  },
  {
    id: 'P003',
    domain: 'prism',
    label: 'Apex Maritime Dispute',
    sublabel: 'Admiralty · UK Court',
    lat: 51.51,
    lng: -0.09,
  },
  {
    id: 'PR001',
    domain: 'personnel',
    label: 'HQ — New York',
    sublabel: '48 personnel on-site',
    lat: 40.75,
    lng: -73.99,
  },
  {
    id: 'PR002',
    domain: 'personnel',
    label: 'London Office',
    sublabel: '12 personnel',
    lat: 51.52,
    lng: -0.08,
  },
  {
    id: 'PR003',
    domain: 'personnel',
    label: 'Singapore Hub',
    sublabel: '8 personnel',
    lat: 1.28,
    lng: 103.85,
  },
];

const INITIAL_GEOFENCES: GeofenceZone[] = [
  {
    id: 'GF001',
    name: 'Strait of Hormuz Watch',
    lat: 26.5,
    lng: 56.5,
    radiusKm: 300,
    active: true,
    alertOnEnter: true,
    alertOnExit: false,
    color: '#f97316',
    triggeredBy: ['V003'],
  },
  {
    id: 'GF002',
    name: 'South China Sea AO',
    lat: 12.0,
    lng: 114.0,
    radiusKm: 600,
    active: true,
    alertOnEnter: true,
    alertOnExit: true,
    color: '#ef4444',
    triggeredBy: ['V001', 'V005'],
  },
  {
    id: 'GF003',
    name: 'NYC Metro Zone',
    lat: 40.7,
    lng: -73.97,
    radiusKm: 80,
    active: true,
    alertOnEnter: false,
    alertOnExit: false,
    color: '#4ade80',
    triggeredBy: [],
  },
];

const GEOFENCE_ALERTS = [
  {
    id: 'GA001',
    zoneId: 'GF002',
    entityId: 'V005',
    entity: 'MT Poseidon',
    zone: 'South China Sea AO',
    type: 'ENTER' as const,
    time: '3m ago',
    severity: 'critical' as const,
  },
  {
    id: 'GA002',
    zoneId: 'GF001',
    entityId: 'V003',
    entity: 'MV Caspian Star',
    zone: 'Strait of Hormuz Watch',
    type: 'ENTER' as const,
    time: '18m ago',
    severity: 'high' as const,
  },
];

function latLngToCanvas(
  lat: number,
  lng: number,
  rotation: number,
  canvas: { width: number; height: number },
  zoom: number,
) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const R = Math.min(canvas.width, canvas.height) * 0.4 * zoom;
  const latR = (lat * Math.PI) / 180;
  const lngR = ((lng + rotation) * Math.PI) / 180;
  const x3 = Math.cos(latR) * Math.sin(lngR);
  const y3 = -Math.sin(latR);
  const z3 = Math.cos(latR) * Math.cos(lngR);
  return { x: cx + R * x3, y: cy + R * y3, visible: z3 > 0, z: z3 };
}

function drawGlobe(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rotation: number,
  zoom: number,
) {
  const cx = width / 2;
  const cy = height / 2;
  const R = Math.min(width, height) * 0.4 * zoom;

  const gradient = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, R * 0.05, cx, cy, R);
  gradient.addColorStop(0, '#0d2847');
  gradient.addColorStop(0.5, '#071833');
  gradient.addColorStop(1, '#030d1c');
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = 'rgba(56,189,248,0.08)';
  ctx.lineWidth = 0.5;
  for (let lat = -80; lat <= 80; lat += 20) {
    ctx.beginPath();
    let first = true;
    for (let lng = -180; lng <= 180; lng += 3) {
      const pos = latLngToCanvas(lat, lng, rotation, { width, height }, zoom);
      if (!pos.visible) {
        first = true;
        continue;
      }
      if (first) {
        ctx.moveTo(pos.x, pos.y);
        first = false;
      } else ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 30) {
    ctx.beginPath();
    let first = true;
    for (let lat = -90; lat <= 90; lat += 3) {
      const pos = latLngToCanvas(lat, lng, rotation, { width, height }, zoom);
      if (!pos.visible) {
        first = true;
        continue;
      }
      if (first) {
        ctx.moveTo(pos.x, pos.y);
        first = false;
      } else ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();
  }

  // Equator
  ctx.strokeStyle = 'rgba(56,189,248,0.15)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  let firstEq = true;
  for (let lng = -180; lng <= 180; lng += 2) {
    const pos = latLngToCanvas(0, lng, rotation, { width, height }, zoom);
    if (!pos.visible) {
      firstEq = true;
      continue;
    }
    if (firstEq) {
      ctx.moveTo(pos.x, pos.y);
      firstEq = false;
    } else ctx.lineTo(pos.x, pos.y);
  }
  ctx.stroke();

  // Atmosphere glow
  const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.08);
  atmoGrad.addColorStop(0, 'rgba(56,189,248,0.07)');
  atmoGrad.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
  ctx.fillStyle = atmoGrad;
  ctx.fill();

  // Globe edge
  ctx.strokeStyle = 'rgba(56,189,248,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGeofences(
  ctx: CanvasRenderingContext2D,
  geofences: GeofenceZone[],
  _activeLayers: Set<DomainKey>,
  rotation: number,
  zoom: number,
  canvas: { width: number; height: number },
) {
  const R = Math.min(canvas.width, canvas.height) * 0.4 * zoom;
  for (const gf of geofences) {
    if (!gf.active) continue;
    const pos = latLngToCanvas(gf.lat, gf.lng, rotation, canvas, zoom);
    if (!pos.visible) continue;
    const radiusPx = (gf.radiusKm / 20000) * R * Math.PI * pos.z;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(4, radiusPx), 0, Math.PI * 2);
    ctx.strokeStyle = `${gf.color}60`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `${gf.color}10`;
    ctx.fill();
  }
}

function drawEntities(
  ctx: CanvasRenderingContext2D,
  entities: GeoEntity[],
  activeLayers: Set<DomainKey>,
  rotation: number,
  zoom: number,
  canvas: { width: number; height: number },
  selected: string | null,
  tick: number,
) {
  const sorted = [...entities].sort((a, b) => {
    const pa = latLngToCanvas(a.lat, a.lng, rotation, canvas, zoom);
    const pb = latLngToCanvas(b.lat, b.lng, rotation, canvas, zoom);
    return pa.z - pb.z;
  });

  for (const entity of sorted) {
    if (!activeLayers.has(entity.domain)) continue;
    const pos = latLngToCanvas(entity.lat, entity.lng, rotation, canvas, zoom);
    if (!pos.visible) continue;

    const color = DOMAIN_COLORS[entity.domain];
    const isSelected = selected === entity.id;
    const isCritical = entity.severity === 'critical';
    const size = isSelected ? 6 : 4;

    if (isCritical || isSelected) {
      const pulse = (Math.sin(tick * 0.05) + 1) / 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size + 8 + pulse * 4, 0, Math.PI * 2);
      ctx.fillStyle = `${color}18`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size + 4 + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = `${color}25`;
      ctx.fill();
    }

    ctx.beginPath();
    if (entity.domain === 'vessels') {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((((entity.heading ?? 0) - 90) * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.5);
      ctx.lineTo(size * 0.6, size);
      ctx.lineTo(-size * 0.6, size);
      ctx.closePath();
      ctx.restore();
    } else {
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    }
    ctx.fillStyle = color;
    ctx.fill();
    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (entity.moving && entity.domain === 'vessels') {
      ctx.beginPath();
      const trailLen = 20;
      const headingRad = (((entity.heading ?? 0) - 90) * Math.PI) / 180;
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x - Math.cos(headingRad) * trailLen, pos.y - Math.sin(headingRad) * trailLen);
      const trail = ctx.createLinearGradient(
        pos.x,
        pos.y,
        pos.x - Math.cos(headingRad) * trailLen,
        pos.y - Math.sin(headingRad) * trailLen,
      );
      trail.addColorStop(0, `${color}50`);
      trail.addColorStop(1, 'transparent');
      ctx.strokeStyle = trail;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function drawProximityCircle(
  ctx: CanvasRenderingContext2D,
  center: { lat: number; lng: number } | null,
  radiusKm: number,
  rotation: number,
  zoom: number,
  canvas: { width: number; height: number },
  tick: number,
) {
  if (!center) return;
  const pos = latLngToCanvas(center.lat, center.lng, rotation, canvas, zoom);
  if (!pos.visible) return;
  const R = Math.min(canvas.width, canvas.height) * 0.4 * zoom;
  const radiusPx = (radiusKm / 20000) * R * Math.PI * pos.z;
  const pulse = (Math.sin(tick * 0.04) + 1) / 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, Math.max(8, radiusPx), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(251,191,36,${0.6 + pulse * 0.3})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(251,191,36,0.05)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
}

function canvasToLatLng(
  cx: number,
  cy: number,
  canvasX: number,
  canvasY: number,
  R: number,
  rotation: number,
) {
  const dx = (canvasX - cx) / R;
  const dy = (canvasY - cy) / R;
  const distFromCenter = Math.sqrt(dx * dx + dy * dy);
  if (distFromCenter > 1) return null;
  const z = Math.sqrt(1 - distFromCenter * distFromCenter);
  const lat = (Math.asin(-dy) * 180) / Math.PI;
  const lng = (Math.atan2(dx, z) * 180) / Math.PI - rotation;
  return { lat, lng: ((lng + 540) % 360) - 180 };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SEV_COLORS: Record<string, string> = {
  critical: color.accent.red,
  high: color.accent.amber,
  medium: color.accent.amber,
  low: color.accent.blue,
};
const DOMAIN_ICONS: Record<DomainKey, typeof Ship> = {
  vessels: Ship,
  terra: Building2,
  aegis: Shield,
  prism: Scale,
  personnel: Compass,
};
const DOMAIN_LABELS: Record<DomainKey, string> = {
  vessels: 'Vessels',
  terra: 'Terra Properties',
  aegis: 'Aegis Threats',
  prism: 'PRAXIS Legal',
  personnel: 'Personnel',
};

export default function MeridianPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(-40);
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, rotation: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeLayers, setActiveLayers] = useState<Set<DomainKey>>(
    new Set(['vessels', 'terra', 'aegis', 'prism', 'personnel']),
  );
  const [selectedEntity, setSelectedEntity] = useState<GeoEntity | null>(null);
  const [entities, setEntities] = useState(INITIAL_ENTITIES);
  const [geofences] = useState(INITIAL_GEOFENCES);
  const [tick, setTick] = useState(0);
  const [proximityMode, setProximityMode] = useState(false);
  const [proximityCenter, setProximityCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [proximityRadiusKm, setProximityRadiusKm] = useState(500);
  const [proximityResults, setProximityResults] = useState<GeoEntity[]>([]);
  const [alerts] = useState(GEOFENCE_ALERTS);
  const [_showAlerts, _setShowAlerts] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [activePanel, setActivePanel] = useState<'layers' | 'geofence' | 'alerts' | 'proximity'>(
    'layers',
  );

  const rotationRef = useRef(rotation);
  rotationRef.current = rotation;
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  useEffect(() => {
    let animId: number;
    let t = 0;
    function loop() {
      t++;
      setTick(t);
      if (autoRotateRef.current) {
        setRotation((r) => r - 0.08);
      }
      setEntities((prev) =>
        prev.map((e) => {
          if (!e.moving) return e;
          const headingRad = ((e.heading ?? 0) * Math.PI) / 180;
          const speed = (e.speed ?? 10) * 0.000005;
          return {
            ...e,
            lat: e.lat + Math.cos(headingRad) * speed,
            lng: e.lng + Math.sin(headingRad) * speed,
          };
        }),
      );
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    drawGlobe(ctx, width, height, rotation, zoom);
    if (showGeofences)
      drawGeofences(ctx, geofences, activeLayers, rotation, zoom, { width, height });
    drawEntities(
      ctx,
      entities,
      activeLayers,
      rotation,
      zoom,
      { width, height },
      selectedEntity?.id ?? null,
      tick,
    );
    drawProximityCircle(
      ctx,
      proximityCenter,
      proximityRadiusKm,
      rotation,
      zoom,
      { width, height },
      tick,
    );
  }, [
    tick,
    rotation,
    zoom,
    activeLayers,
    selectedEntity,
    entities,
    geofences,
    showGeofences,
    proximityCenter,
    proximityRadiusKm,
  ]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const R = Math.min(canvas.width, canvas.height) * 0.4 * zoom;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      if (proximityMode) {
        const latlng = canvasToLatLng(cx, cy, canvasX, canvasY, R, rotation);
        if (latlng) {
          setProximityCenter(latlng);
          const results = entities.filter((ent) => {
            if (!activeLayers.has(ent.domain)) return false;
            return haversineKm(latlng.lat, latlng.lng, ent.lat, ent.lng) <= proximityRadiusKm;
          });
          setProximityResults(results);
        }
        return;
      }

      let closest: GeoEntity | null = null;
      let minDist = Infinity;
      for (const entity of entities) {
        if (!activeLayers.has(entity.domain)) continue;
        const pos = latLngToCanvas(
          entity.lat,
          entity.lng,
          rotation,
          { width: canvas.width, height: canvas.height },
          zoom,
        );
        if (!pos.visible) continue;
        const dist = Math.sqrt((pos.x - canvasX) ** 2 + (pos.y - canvasY) ** 2);
        if (dist < minDist && dist < 20) {
          minDist = dist;
          closest = entity;
        }
      }
      setSelectedEntity(closest);
    },
    [entities, activeLayers, rotation, zoom, proximityMode, proximityRadiusKm],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setAutoRotate(false);
    setDragStart({ x: e.clientX, rotation: rotationRef.current });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging) return;
      const delta = e.clientX - dragStart.x;
      setRotation(dragStart.rotation + delta * 0.3);
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const toggleLayer = (layer: DomainKey) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  const runProximityQuery = () => {
    if (!proximityCenter) return;
    const results = entities.filter((ent) => {
      if (!activeLayers.has(ent.domain)) return false;
      return (
        haversineKm(proximityCenter.lat, proximityCenter.lng, ent.lat, ent.lng) <= proximityRadiusKm
      );
    });
    setProximityResults(results);
  };

  const entityCounts = Object.fromEntries(
    (Object.keys(DOMAIN_COLORS) as DomainKey[]).map((d) => [
      d,
      entities.filter((e) => e.domain === d).length,
    ]),
  ) as Record<DomainKey, number>;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: DS.bg, color: DS.text.primary }}
    >
      <div
        className="w-72 shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: DS.border, background: 'rgba(5,10,20,0.95)' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: DS.border }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: DS.text.muted,
              textDecoration: 'none',
              marginBottom: '10px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = DS.text.secondary)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = DS.text.muted)}
          >
            <ChevronRight className="w-3 h-3" style={{ transform: 'rotate(180deg)' }} />
            SZL Holdings
          </Link>
          <a
            href="/pluginmesh/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: DS.text.muted,
              textDecoration: 'none',
              marginBottom: '10px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = DS.text.secondary)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = DS.text.muted)}
          >
            <ChevronRight className="w-3 h-3" />
            PluginMesh
          </a>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{
                background: 'rgba(56,189,248,0.15)',
                border: '1px solid rgba(56,189,248,0.25)',
              }}
            >
              <Globe className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight" style={{ color: DS.text.primary }}>
                MERIDIAN
              </h1>
              <p
                className="text-[9px] font-mono uppercase tracking-wider"
                style={{ color: 'rgba(56,189,248,0.5)' }}
              >
                Geospatial Intelligence
              </p>
            </div>
          </div>
          <Link
            href="/meridian/mcp-activation"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'rgba(56,189,248,0.6)',
              textDecoration: 'none',
              marginTop: '6px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(56,189,248,0.9)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(56,189,248,0.6)')}
          >
            <Shield className="w-3 h-3" />
            MCP Activation
          </Link>
          <div className="flex gap-1 mt-2">
            {(['layers', 'proximity', 'geofence', 'alerts'] as const).map((panel) => (
              <button
                key={panel}
                onClick={() => setActivePanel(panel)}
                className="flex-1 py-1 rounded text-[9px] font-semibold uppercase tracking-wider transition-all"
                style={{
                  background:
                    activePanel === panel ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
                  color: activePanel === panel ? '#38bdf8' : DS.text.muted,
                  border: `1px solid ${activePanel === panel ? 'rgba(56,189,248,0.25)' : 'transparent'}`,
                }}
              >
                {panel === 'layers'
                  ? 'Layers'
                  : panel === 'proximity'
                    ? 'Query'
                    : panel === 'geofence'
                      ? 'Zones'
                      : 'Alerts'}
              </button>
            ))}
          </div>
        </div>

        {activePanel === 'layers' && (
          <div className="p-3 space-y-1.5">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: DS.text.muted }}
            >
              Domain Layers
            </p>
            {(Object.keys(DOMAIN_COLORS) as DomainKey[]).map((domain) => {
              const Icon = DOMAIN_ICONS[domain];
              const active = activeLayers.has(domain);
              const color = DOMAIN_COLORS[domain];
              return (
                <button
                  key={domain}
                  onClick={() => toggleLayer(domain)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left"
                  style={{
                    background: active ? `${color}12` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? `${color}25` : 'rgba(255,255,255,0.04)'}`,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                    style={{ background: `${color}20` }}
                  >
                    <Icon className="w-3 h-3" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-medium"
                      style={{ color: active ? DS.text.primary : DS.text.muted }}
                    >
                      {DOMAIN_LABELS[domain]}
                    </p>
                    <p className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                      {entityCounts[domain]} entities
                    </p>
                  </div>
                  {active ? (
                    <Eye className="w-3 h-3" style={{ color }} />
                  ) : (
                    <EyeOff className="w-3 h-3" style={{ color: DS.text.muted }} />
                  )}
                </button>
              );
            })}
            <div className="mt-3 pt-3 space-y-1" style={{ borderTop: `1px solid ${DS.border}` }}>
              <button
                onClick={() => setShowGeofences((v) => !v)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all"
                style={{
                  background: showGeofences ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${showGeofences ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.04)'}`,
                }}
              >
                <Circle
                  className="w-3 h-3"
                  style={{ color: showGeofences ? '#f97316' : DS.text.muted }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: showGeofences ? DS.text.primary : DS.text.muted }}
                >
                  Geofence Zones
                </span>
                <span className="ml-auto text-[9px] font-mono" style={{ color: '#f97316' }}>
                  {geofences.filter((g) => g.active).length} active
                </span>
              </button>
            </div>
          </div>
        )}

        {activePanel === 'proximity' && (
          <div className="p-3 space-y-3">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: DS.text.muted }}
              >
                Proximity Intelligence
              </p>
              <p className="text-[10px] leading-relaxed" style={{ color: DS.text.muted }}>
                Click the globe to set center point, then query all entities within radius across
                all active domains.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProximityMode(!proximityMode)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  background: proximityMode ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
                  color: proximityMode ? '#fbbf24' : DS.text.secondary,
                  border: `1px solid ${proximityMode ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <Crosshair className="w-3 h-3" />
                {proximityMode ? 'Click Globe to Set Point' : 'Enable Query Mode'}
              </button>
            </div>
            <div>
              <label
                className="text-[10px] font-medium block mb-1.5"
                style={{ color: DS.text.secondary }}
              >
                Radius: {proximityRadiusKm.toLocaleString()} km
              </label>
              <input
                type="range"
                min={50}
                max={5000}
                step={50}
                value={proximityRadiusKm}
                onChange={(e) => setProximityRadiusKm(Number(e.target.value))}
                className="w-full h-1 appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, #fbbf24 ${((proximityRadiusKm - 50) / 4950) * 100}%, rgba(255,255,255,0.1) 0%)`,
                }}
              />
            </div>
            {proximityCenter && (
              <div
                className="rounded-lg p-2 space-y-1"
                style={{
                  background: 'rgba(251,191,36,0.06)',
                  border: '1px solid rgba(251,191,36,0.15)',
                }}
              >
                <p className="text-[9px] font-mono" style={{ color: '#fbbf24' }}>
                  Center: {proximityCenter.lat.toFixed(2)}°, {proximityCenter.lng.toFixed(2)}°
                </p>
                <button
                  onClick={runProximityQuery}
                  className="text-[10px] font-semibold underline"
                  style={{ color: '#fbbf24' }}
                >
                  Re-run query
                </button>
              </div>
            )}
            {proximityResults.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold" style={{ color: DS.text.secondary }}>
                  {proximityResults.length} entities within {proximityRadiusKm.toLocaleString()} km
                </p>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {proximityResults.map((e) => {
                    const color = DOMAIN_COLORS[e.domain];
                    return (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEntity(e)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-white/5 transition-colors"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: color }}
                        />
                        <span
                          className="text-[10px] font-medium truncate"
                          style={{ color: DS.text.primary }}
                        >
                          {e.label}
                        </span>
                        <span
                          className="text-[9px] ml-auto shrink-0"
                          style={{ color: DS.text.muted }}
                        >
                          {haversineKm(
                            proximityCenter?.lat ?? 0,
                            proximityCenter?.lng ?? 0,
                            e.lat,
                            e.lng,
                          ).toFixed(0)}
                          km
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activePanel === 'geofence' && (
          <div className="p-3 space-y-2">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: DS.text.muted }}
            >
              Geofence Zones
            </p>
            {geofences.map((gf) => (
              <div
                key={gf.id}
                className="rounded-lg p-2.5"
                style={{ background: `${gf.color}08`, border: `1px solid ${gf.color}20` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: gf.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: DS.text.primary }}>
                    {gf.name}
                  </span>
                  {gf.active && (
                    <span
                      className="ml-auto text-[8px] px-1.5 py-0.5 rounded uppercase font-bold"
                      style={{ background: `${gf.color}20`, color: gf.color }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                  {gf.lat.toFixed(1)}°, {gf.lng.toFixed(1)}° · r={gf.radiusKm.toLocaleString()}km
                </p>
                <div className="flex gap-2 mt-1.5">
                  {gf.alertOnEnter && (
                    <span
                      className="text-[8px] px-1 py-0.5 rounded"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                    >
                      ENTER alert
                    </span>
                  )}
                  {gf.alertOnExit && (
                    <span
                      className="text-[8px] px-1 py-0.5 rounded"
                      style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}
                    >
                      EXIT alert
                    </span>
                  )}
                </div>
                {gf.triggeredBy.length > 0 && (
                  <p className="text-[9px] mt-1" style={{ color: '#f97316' }}>
                    {gf.triggeredBy.length} vessel{gf.triggeredBy.length > 1 ? 's' : ''} inside zone
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {activePanel === 'alerts' && (
          <div className="p-3 space-y-2">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: DS.text.muted }}
            >
              Geofence Alerts
            </p>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg p-2.5"
                style={{
                  background: `${SEV_COLORS[alert.severity]}08`,
                  border: `1px solid ${SEV_COLORS[alert.severity]}20`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold"
                    style={{
                      background: `${SEV_COLORS[alert.severity]}20`,
                      color: SEV_COLORS[alert.severity],
                    }}
                  >
                    {alert.severity}
                  </span>
                  <span
                    className="text-[8px] px-1 py-0.5 rounded uppercase font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: DS.text.muted }}
                  >
                    {alert.type}
                  </span>
                  <span className="ml-auto text-[9px] font-mono" style={{ color: DS.text.muted }}>
                    {alert.time}
                  </span>
                </div>
                <p className="text-[10px] font-semibold" style={{ color: DS.text.primary }}>
                  {alert.entity}
                </p>
                <p className="text-[9px]" style={{ color: DS.text.muted }}>
                  → {alert.zone}
                </p>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-[10px]" style={{ color: DS.text.muted }}>
                No active alerts
              </p>
            )}
          </div>
        )}

        {selectedEntity && (
          <div className="mt-auto p-3 border-t" style={{ borderColor: DS.border }}>
            <div
              className="rounded-lg p-2.5"
              style={{
                background: `${DOMAIN_COLORS[selectedEntity.domain]}08`,
                border: `1px solid ${DOMAIN_COLORS[selectedEntity.domain]}25`,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ background: `${DOMAIN_COLORS[selectedEntity.domain]}20` }}
                >
                  {(() => {
                    const Icon = DOMAIN_ICONS[selectedEntity.domain];
                    return (
                      <Icon
                        className="w-3 h-3"
                        style={{ color: DOMAIN_COLORS[selectedEntity.domain] }}
                      />
                    );
                  })()}
                </div>
                <span
                  className="text-[10px] font-semibold truncate flex-1"
                  style={{ color: DS.text.primary }}
                >
                  {selectedEntity.label}
                </span>
                <button onClick={() => setSelectedEntity(null)}>
                  <X className="w-3 h-3" style={{ color: DS.text.muted }} />
                </button>
              </div>
              {selectedEntity.sublabel && (
                <p className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                  {selectedEntity.sublabel}
                </p>
              )}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: DS.text.muted }}>
                    Position
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: DS.text.secondary }}>
                    {selectedEntity.lat.toFixed(2)}°, {selectedEntity.lng.toFixed(2)}°
                  </span>
                </div>
                {selectedEntity.speed && (
                  <div className="flex items-center justify-between">
                    <span className="text-[9px]" style={{ color: DS.text.muted }}>
                      Speed
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: DS.text.secondary }}>
                      {selectedEntity.speed} kts · {selectedEntity.heading}°
                    </span>
                  </div>
                )}
                {selectedEntity.value && (
                  <div className="flex items-center justify-between">
                    <span className="text-[9px]" style={{ color: DS.text.muted }}>
                      Value
                    </span>
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: DOMAIN_COLORS[selectedEntity.domain] }}
                    >
                      {selectedEntity.value}
                    </span>
                  </div>
                )}
                {selectedEntity.severity && (
                  <div className="flex items-center justify-between">
                    <span className="text-[9px]" style={{ color: DS.text.muted }}>
                      Risk
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold"
                      style={{
                        background: `${SEV_COLORS[selectedEntity.severity]}20`,
                        color: SEV_COLORS[selectedEntity.severity],
                      }}
                    >
                      {selectedEntity.severity}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono"
              style={{
                background: 'rgba(5,10,20,0.9)',
                border: '1px solid rgba(56,189,248,0.15)',
                color: '#38bdf8',
              }}
            >
              <Activity className="w-3 h-3 animate-pulse" />
              LIVE · {entities.filter((e) => e.moving).length} vessels tracking
            </div>
            {alerts.length > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#ef4444',
                }}
              >
                <AlertTriangle className="w-3 h-3" />
                {alerts.length} geofence alert{alerts.length > 1 ? 's' : ''}
              </div>
            )}
            {proximityMode && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold"
                style={{
                  background: 'rgba(251,191,36,0.12)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  color: '#fbbf24',
                }}
              >
                <Crosshair className="w-3 h-3" />
                Query Mode · click to set center
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="w-7 h-7 flex items-center justify-center rounded"
              style={{
                background: 'rgba(5,10,20,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: DS.text.secondary,
              }}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="w-7 h-7 flex items-center justify-center rounded"
              style={{
                background: 'rgba(5,10,20,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: DS.text.secondary,
              }}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setAutoRotate(!autoRotate);
              }}
              className="w-7 h-7 flex items-center justify-center rounded transition-all"
              style={{
                background: autoRotate ? 'rgba(56,189,248,0.15)' : 'rgba(5,10,20,0.9)',
                border: `1px solid ${autoRotate ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: autoRotate ? '#38bdf8' : DS.text.secondary,
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={1200}
          height={900}
          className="flex-1 w-full h-full"
          style={{
            cursor: proximityMode ? 'crosshair' : isDragging ? 'grabbing' : 'grab',
            imageRendering: 'auto',
          }}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
          {(Object.entries(DOMAIN_COLORS) as [DomainKey, string][]).map(
            ([domain, color]) =>
              activeLayers.has(domain) && (
                <div
                  key={domain}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                  style={{
                    background: 'rgba(5,10,20,0.88)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                    {DOMAIN_LABELS[domain]}
                  </span>
                </div>
              ),
          )}
        </div>

        <div
          className="absolute bottom-3 right-3 text-[9px] font-mono"
          style={{ color: DS.text.muted }}
        >
          MERIDIAN GEOINT · {entities.filter((e) => activeLayers.has(e.domain)).length} entities
          active
        </div>
      </div>
    </div>
  );
}
